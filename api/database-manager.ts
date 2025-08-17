import { SQLiteDatabase } from "expo-sqlite";
import * as SQLite from "expo-sqlite";
// Removed unused import

interface CompletionData {
  isCompleted: boolean;
  color: string | null;
}

interface PlanProgress {
  totalSegments: number;
  completedSegments: number;
  progressPercentage: number;
  isCompleted: boolean;
  completedSegmentIds: string[];
}

interface ChallengeProgress {
  totalSegments: number;
  completedSegments: number;
  progressPercentage: number;
  isCompleted: boolean;
  completedSegmentIds: string[];
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: SQLiteDatabase | null = null;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync("sourceview");
      
      await this.db.execAsync(`
        PRAGMA journal_mode = 'wal';
        
        -- Core segments table
        CREATE TABLE IF NOT EXISTS segments (
          segmentID TEXT PRIMARY KEY NOT NULL,
          bookId TEXT NOT NULL,
          title TEXT NOT NULL,
          reference TEXT,
          planID TEXT,
          challengeID TEXT
        );
        
        -- Emojis table (preserved)
        CREATE TABLE IF NOT EXISTS emojis (
          id INTEGER PRIMARY KEY NOT NULL,
          segmentID TEXT NOT NULL,
          blockID TEXT NOT NULL,
          blockData TEXT NOT NULL,
          emoji TEXT NOT NULL,
          note TEXT NOT NULL,
          UNIQUE(segmentID, blockID)
        );

        -- Legacy segment completion table (for general/main context and read count tracking)
        CREATE TABLE IF NOT EXISTS segment_completion (
          id INTEGER PRIMARY KEY NOT NULL,
          segmentID TEXT NOT NULL,
          completionType TEXT NOT NULL,
          planID TEXT,
          challengeID TEXT,
          completionDate TEXT NOT NULL,
          readerColor TEXT,
          isCurrentlyCompleted BOOLEAN DEFAULT 1
        );

        -- Reading plan specific progress tracking
        CREATE TABLE IF NOT EXISTS reading_plan_progress (
          id INTEGER PRIMARY KEY NOT NULL,
          planID TEXT NOT NULL,
          segmentID TEXT NOT NULL,
          completionDate TEXT,
          isCompleted BOOLEAN DEFAULT 0,
          readCount INTEGER DEFAULT 0,
          lastReadDate TEXT,
          UNIQUE(planID, segmentID)
        );

        -- Reading challenge specific progress tracking
        CREATE TABLE IF NOT EXISTS reading_challenge_progress (
          id INTEGER PRIMARY KEY NOT NULL,
          challengeID TEXT NOT NULL,
          segmentID TEXT NOT NULL,
          completionDate TEXT,
          isCompleted BOOLEAN DEFAULT 0,
          readCount INTEGER DEFAULT 0,
          lastReadDate TEXT,
          UNIQUE(challengeID, segmentID)
        );

        -- Overall plan/challenge status tracking
        CREATE TABLE IF NOT EXISTS plan_challenge_status (
          id INTEGER PRIMARY KEY NOT NULL,
          itemID TEXT NOT NULL,
          itemType TEXT NOT NULL, -- 'plan' or 'challenge'
          isActive BOOLEAN DEFAULT 1,
          isPaused BOOLEAN DEFAULT 0,
          isCompleted BOOLEAN DEFAULT 0,
          startDate TEXT,
          completionDate TEXT,
          totalSegments INTEGER,
          completedSegments INTEGER DEFAULT 0,
          progressPercentage REAL DEFAULT 0,
          lastUpdated TEXT,
          UNIQUE(itemID, itemType)
        );

        -- Total read counts per segment (cross-context)
        CREATE TABLE IF NOT EXISTS segment_read_count (
          segmentID TEXT PRIMARY KEY NOT NULL,
          totalReads INTEGER NOT NULL DEFAULT 0,
          lastReadDate TEXT NOT NULL
        );

        -- Achievements table (preserved)
        CREATE TABLE IF NOT EXISTS achievements (
          id INTEGER PRIMARY KEY NOT NULL,
          achievementID TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          unlockDate TEXT NOT NULL,
          progress INTEGER,
          maxProgress INTEGER,
          isCompleted BOOLEAN,
          achievementDate TEXT
        );

        -- Daily activity table (preserved)
        CREATE TABLE IF NOT EXISTS daily_activity (
          id INTEGER PRIMARY KEY NOT NULL,
          date TEXT NOT NULL,
          segmentCount INTEGER NOT NULL,
          lastUpdated TEXT NOT NULL
        );

        -- Streak data table (preserved)
        CREATE TABLE IF NOT EXISTS streak_data (
          id INTEGER PRIMARY KEY NOT NULL,
          currentStreak INTEGER NOT NULL,
          longestStreak INTEGER NOT NULL,
          lastReadDate TEXT NOT NULL,
          lastUpdated TEXT NOT NULL
        );

        -- Completed segments table (for main context backward compatibility)
        CREATE TABLE IF NOT EXISTS completedSegments (
          id INTEGER PRIMARY KEY NOT NULL,
          segmentID TEXT NOT NULL,
          isCompleted BOOLEAN NOT NULL DEFAULT 0,
          completionDate TEXT,
          UNIQUE(segmentID)
        );

        -- Source readings table (preserved)
        CREATE TABLE IF NOT EXISTS sourceReadings (
          id INTEGER PRIMARY KEY NOT NULL,
          segmentID TEXT NOT NULL,
          blockID TEXT NOT NULL,
          color TEXT NOT NULL,
          readDate TEXT NOT NULL,
          UNIQUE(segmentID, blockID, color)
        );

        -- Reading sessions table (preserved)
        CREATE TABLE IF NOT EXISTS reading_sessions (
          id INTEGER PRIMARY KEY NOT NULL,
          startTime TEXT NOT NULL,
          endTime TEXT NOT NULL,
          segmentCount INTEGER NOT NULL,
          sessionDate TEXT NOT NULL
        );

        -- Book completion tracking (preserved)
        CREATE TABLE IF NOT EXISTS book_completion (
          id INTEGER PRIMARY KEY NOT NULL,
          bookId TEXT NOT NULL,
          isCompleted BOOLEAN NOT NULL DEFAULT 0,
          completionDate TEXT,
          UNIQUE(bookId)
        );

        -- App state table for global application state
        CREATE TABLE IF NOT EXISTS app_state (
          id INTEGER PRIMARY KEY NOT NULL,
          key TEXT NOT NULL UNIQUE,
          value TEXT,
          lastUpdated TEXT NOT NULL
        );

        -- Group completion tracking (new)
        CREATE TABLE IF NOT EXISTS group_segment_completion (
          id INTEGER PRIMARY KEY NOT NULL,
          segmentID TEXT NOT NULL,
          sessionId TEXT,
          storyId TEXT,
          userRole TEXT,
          isHost BOOLEAN DEFAULT 0,
          completedAt TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_group_completion_segment ON group_segment_completion(segmentID);

        -- Group reading sessions table (new)
        CREATE TABLE IF NOT EXISTS group_reading_sessions (
          id INTEGER PRIMARY KEY NOT NULL,
          sessionId TEXT NOT NULL UNIQUE,
          storyId TEXT NOT NULL,
          storyTitle TEXT NOT NULL,
          scriptureReference TEXT NOT NULL,
          hostDeviceId TEXT NOT NULL,
          hostUserName TEXT NOT NULL,
          hostRole TEXT NOT NULL,
          status TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          expiresAt TEXT NOT NULL,
          planId TEXT,
          challengeId TEXT,
          sessionData TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_group_sessions_id ON group_reading_sessions(sessionId);
        CREATE INDEX IF NOT EXISTS idx_group_sessions_expires ON group_reading_sessions(expiresAt);
      `);
      
      // Populate the segments table with data from SegmentTitles.json
      await this.populateSegmentsTable();

      // Initialize streak_data if empty
      const streakData = await this.db.getFirstAsync(
        'SELECT * FROM streak_data LIMIT 1'
      );
      
      if (!streakData) {
        await this.db.runAsync(`
          INSERT INTO streak_data (currentStreak, longestStreak, lastReadDate, lastUpdated)
          VALUES (0, 0, date('now', 'localtime'), datetime('now', 'localtime'))
        `);
      }

      // Initialize app_state with default values if empty
      const appStateCount = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM app_state'
      ) as { count: number };
      
      if (appStateCount.count === 0) {
        const currentDate = new Date().toISOString();
        await this.db.runAsync(`
          INSERT INTO app_state (key, value, lastUpdated) VALUES
          ('segmentId', 'S001', ?),
          ('readingPlan', 'chronological', ?),
          ('lastReadSegment', null, ?),
          ('language', 'en', ?),
          ('version', 'nlt', ?)
        `, currentDate, currentDate, currentDate, currentDate, currentDate);
      }

      // Add missing columns to existing tables if they don't exist
      await this.migrateDatabase();

      this.isInitialized = true;
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }

  private async migrateDatabase(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      // Check if planID column exists in segments table
      const segmentsColumns = await this.db.getAllAsync(`
        PRAGMA table_info(segments)
      `);
      
      const hasPlanID = segmentsColumns.some((col: any) => col.name === 'planID');
      const hasChallengeID = segmentsColumns.some((col: any) => col.name === 'challengeID');
      
      if (!hasPlanID) {
        await this.db.runAsync(`
          ALTER TABLE segments ADD COLUMN planID TEXT
        `);
      }
      
      if (!hasChallengeID) {
        await this.db.runAsync(`
          ALTER TABLE segments ADD COLUMN challengeID TEXT
        `);
      }

      // Check if lastUpdated column exists in plan_challenge_status table
      const statusColumns = await this.db.getAllAsync(`
        PRAGMA table_info(plan_challenge_status)
      `);
      
      const hasLastUpdated = statusColumns.some((col: any) => col.name === 'lastUpdated');
      
      if (!hasLastUpdated) {
        await this.db.runAsync(`
          ALTER TABLE plan_challenge_status ADD COLUMN lastUpdated TEXT
        `);
      }
    } catch (error) {
      console.error("Error during database migration:", error);
      // Don't throw error for migration issues, as they might be expected
    }
  }

  private async populateSegmentsTable(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      // Check if table is already populated
      const count = await this.db.getFirstAsync<{count: number}>(`
        SELECT COUNT(*) as count FROM segments
      `);
      
      if (count?.count === 0) {
        // Import segment data
        const segmentTitles = require('../assets/data/SegmentTitles.json');
        
        // Begin transaction for faster inserts
        await this.db.execAsync('BEGIN TRANSACTION');
        
        for (const [segmentId, data] of Object.entries(segmentTitles)) {
          const segment = data as any;
          await this.db.runAsync(`
            INSERT INTO segments (segmentID, bookId, title, reference)
            VALUES (?, ?, ?, ?)
          `, segmentId, segment.book[0], segment.title, segment.ref || null);
        }
        
        await this.db.execAsync('COMMIT');
      }
    } catch (error) {
      console.error("Error populating segments table:", error);
      if (this.db) {
        await this.db.execAsync('ROLLBACK');
      }
      throw error;
    }
  }

  getDatabase(): SQLiteDatabase {
    if (!this.db || !this.isInitialized) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.db;
  }

  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  async close(): Promise<void> {
    if (this.db) {
      // SQLite databases are automatically closed when the app terminates
      // This is mainly for cleanup purposes
      this.db = null;
      this.isInitialized = false;
      this.initializationPromise = null;
    }
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance(); 