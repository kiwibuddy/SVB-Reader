import logger from '@/utils/logger';
import { SQLiteDatabase } from "expo-sqlite";
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
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

  /**
   * Get platform-specific database configuration
   * iOS: High-performance WAL mode (current configuration)
   * Android: Compatible DELETE mode (fixes database locked errors)
   */
  private getDatabaseConfig() {
    if (Platform.OS === 'ios') {
      // iOS: Keep current high-performance configuration
      return {
        journalMode: 'wal',        // Write-Ahead Logging for better performance
        synchronous: 'normal',     // Balanced performance and safety
        cacheSize: 1000,          // Larger cache for better performance
        tempStore: 'memory',      // Use memory for temporary storage
        mmapSize: 268435456,      // 256MB memory mapping
      };
    } else {
      // Android: Use compatible configuration to prevent database locked errors
      return {
        journalMode: 'delete',     // DELETE mode is more compatible on Android
        synchronous: 'full',       // Full synchronization for data safety
        cacheSize: 500,            // Conservative cache size for Android
        tempStore: 'file',         // Use file for temporary storage (more compatible)
        mmapSize: 134217728,      // 128MB memory mapping (conservative)
      };
    }
  }

  /**
   * Force reset database for Android when locked errors persist
   * This is a last resort to fix corrupted database files
   */
  private async forceDatabaseReset(): Promise<void> {
    if (Platform.OS !== 'android') {
      return; // Only reset on Android
    }

    try {
      logger.info('🔄 Force resetting Android database due to persistent locked errors...');
      
      // Close existing database connection
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (error) {
          logger.warn('Warning: Could not close database:', error);
        }
        this.db = null;
      }

      // Wait a bit before trying to delete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Delete the database file completely
      try {
        await SQLite.deleteDatabaseAsync("sourceview");
        logger.info('✅ Android database file deleted successfully');
      } catch (error) {
        logger.warn('Warning: Could not delete database file:', error);
        // If we can't delete, just continue - the database will be recreated
      }

      // Reset initialization state
      this.isInitialized = false;
      this.initializationPromise = null;
      
      logger.info('🔄 Android database reset complete, will reinitialize...');
    } catch (error) {
      logger.error('❌ Error during database reset:', error);
      // Don't throw here, just reset the state
      this.isInitialized = false;
      this.db = null;
      this.initializationPromise = null;
    }
  }

  /**
   * Public method to manually reset database (useful for debugging)
   * This will completely reset the database and reinitialize it
   */
  async resetDatabase(): Promise<void> {
    if (Platform.OS === 'ios') {
      logger.info('ℹ️ Database reset not needed on iOS - database is working correctly');
      return;
    }

    logger.info('🔄 Manual database reset requested for Android...');
    await this.forceDatabaseReset();
    
    // Reinitialize after reset
    this.isInitialized = false;
    this.initializationPromise = null;
    await this.initialize();
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
      
      // Apply platform-specific database configuration
      const config = this.getDatabaseConfig();
      
      logger.info(`🔧 Database configuration for ${Platform.OS}:`, {
        journalMode: config.journalMode,
        synchronous: config.synchronous,
        cacheSize: config.cacheSize,
        tempStore: config.tempStore,
        mmapSize: config.mmapSize
      });
      
      // Add retry logic for Android database initialization
      const maxRetries = Platform.OS === 'ios' ? 1 : 3; // More retries on Android
      let attempt = 0;
      let lastError: Error | null = null;
      
      while (attempt < maxRetries) {
        try {
          attempt++;
          
          await this.db.execAsync(`
            PRAGMA journal_mode = '${config.journalMode}';
            PRAGMA synchronous = '${config.synchronous}';
            PRAGMA cache_size = ${config.cacheSize};
            PRAGMA temp_store = '${config.tempStore}';
            PRAGMA mmap_size = ${config.mmapSize};
          `);
          
          // If we get here, the PRAGMA commands succeeded
          break;
          
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          logger.warn(`Attempt ${attempt}/${maxRetries} failed with error:`, error);
          
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000;
            logger.info(`Retrying in ${delay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // If all retries failed, throw error
      if (attempt > maxRetries) {
        throw new Error(`Failed to configure database after ${maxRetries} attempts. Last error: ${lastError}`);
      }

      // Continue with table creation
      await this.createTables();
      await this.migrateDatabase();
      await this.populateSegmentsTable();
      
      this.isInitialized = true;
      logger.info('✅ Database initialized successfully');
      
    } catch (error) {
      logger.error("Error initializing database:", error);
      
      // On Android, if all retries failed, try force reset once
      if (Platform.OS === 'android' && this.initializationPromise) {
        logger.info('🔄 All retry attempts failed on Android, attempting database reset...');
        try {
          await this.forceDatabaseReset();
          
          // Try initialization again after reset, but only once to prevent infinite loops
          logger.info('🔄 Retrying initialization after database reset...');
          this.initializationPromise = this.performInitialization();
          return this.initializationPromise;
        } catch (resetError) {
          logger.error('❌ Database reset also failed:', resetError);
          // Don't try to reset again - this prevents infinite loops
          this.isInitialized = false;
          this.db = null;
          this.initializationPromise = null;
          throw new Error(`Database initialization failed permanently. Original error: ${error}. Reset error: ${resetError}`);
        }
      }
      
      // Reset state and throw error
      this.isInitialized = false;
      this.db = null;
      this.initializationPromise = null;
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      await this.db.execAsync(`
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
          emoji TEXT,
          note TEXT DEFAULT '',
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

        -- Questions table for study questions
        CREATE TABLE IF NOT EXISTS questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          segmentID TEXT NOT NULL,
          audienceType TEXT NOT NULL,
          questionSet INTEGER NOT NULL DEFAULT 1,
          Q1 TEXT,
          Q2 TEXT,
          Q3 TEXT,
          Q4 TEXT,
          UNIQUE(segmentID, audienceType, questionSet)
        );
        CREATE INDEX IF NOT EXISTS idx_questions_lookup ON questions(segmentID, audienceType, questionSet);
      `);

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

    } catch (error) {
      logger.error("Error creating tables:", error);
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
      logger.error("Error during database migration:", error);
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
      logger.error("Error populating segments table:", error);
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
    
    // Check if database is still valid
    try {
      // Test the database connection with a simple query
      this.db.execAsync('SELECT 1').catch(() => {
        // If this fails, the database connection is invalid
        logger.warn('Database connection appears to be invalid, reinitializing...');
        this.isInitialized = false;
        this.db = null;
        this.initializationPromise = null;
      });
    } catch (error) {
      logger.warn('Database connection test failed:', error);
      this.isInitialized = false;
      this.db = null;
      this.initializationPromise = null;
    }
    
    if (!this.db) {
      throw new Error("Database connection lost. Please reinitialize.");
    }
    
    return this.db;
  }

  /**
   * Safely get database with automatic initialization
   * This is the preferred method for most operations
   */
  async getSafeDatabase(): Promise<SQLiteDatabase | null> {
    try {
      if (!this.isInitialized || !this.db) {
        logger.info('Database not ready, attempting initialization...');
        await this.initialize();
      }
      
      if (!this.db) {
        logger.error('Database initialization failed');
        return null;
      }
      
      // Test database health
      await this.db.execAsync('SELECT 1');
      return this.db;
    } catch (error) {
      logger.error('Failed to get safe database connection:', error);
      
      // Reset state and try once more
      this.isInitialized = false;
      this.db = null;
      this.initializationPromise = null;
      
      try {
        await this.initialize();
        return this.db;
      } catch (retryError) {
        logger.error('Database retry failed:', retryError);
        return null;
      }
    }
  }

  // Add a method to check database health
  async checkDatabaseHealth(): Promise<boolean> {
    if (!this.db || !this.isInitialized) {
      return false;
    }
    
    try {
      await this.db.execAsync('SELECT 1');
      return true;
    } catch (error) {
      logger.warn('Database health check failed:', error);
      return false;
    }
  }

  // Add a method to reinitialize if needed
  async ensureDatabase(): Promise<SQLiteDatabase> {
    if (!this.isInitialized || !this.db || !(await this.checkDatabaseHealth())) {
      logger.info('Database needs reinitialization, reinitializing...');
      await this.initialize();
    }
    return this.getDatabase();
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