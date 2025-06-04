import { SQLiteDatabase } from "expo-sqlite";
import * as SQLite from "expo-sqlite";
import { BibleBlock } from "@/types";
interface CompletionData {
  isCompleted: boolean;
  color: string | null;
}

let db: SQLiteDatabase;

async function initializeDatabase() {
  try {
    db = await SQLite.openDatabaseAsync("sourceview");
    
    // First, ensure we have the current schema
    await migrateDatabase();
    
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      
      -- Add the segments table
      CREATE TABLE IF NOT EXISTS segments (
        segmentID TEXT PRIMARY KEY NOT NULL,
        bookId TEXT NOT NULL,
        title TEXT NOT NULL,
        reference TEXT
      );
      
      CREATE TABLE IF NOT EXISTS emojis (
        id INTEGER PRIMARY KEY NOT NULL,
        segmentID TEXT NOT NULL,
        blockID TEXT NOT NULL,
        blockData TEXT NOT NULL,
        emoji TEXT NOT NULL,
        note TEXT NOT NULL,
        UNIQUE(segmentID, blockID)
      );

      -- Enhanced segment completion table with read counts
      CREATE TABLE IF NOT EXISTS segment_completion (
        id INTEGER PRIMARY KEY NOT NULL,
        segmentID TEXT NOT NULL,
        completionType TEXT NOT NULL,
        planID TEXT,
        challengeID TEXT,
        completionDate TEXT NOT NULL,
        readerColor TEXT
      );

      -- New table to track individual segment reads (allows multiple reads)
      CREATE TABLE IF NOT EXISTS segment_reads (
        id INTEGER PRIMARY KEY NOT NULL,
        segmentID TEXT NOT NULL,
        readDate TEXT NOT NULL,
        readDuration INTEGER, -- in seconds
        context TEXT NOT NULL DEFAULT 'free', -- 'free', 'plan', 'challenge'
        planID TEXT,
        challengeID TEXT,
        isCompleted BOOLEAN NOT NULL DEFAULT 1
      );

      -- Enhanced table for reading plan progress tracking
      CREATE TABLE IF NOT EXISTS reading_plan_progress (
        id INTEGER PRIMARY KEY NOT NULL,
        planID TEXT NOT NULL,
        segmentID TEXT NOT NULL,
        completionDate TEXT,
        isCompleted BOOLEAN NOT NULL DEFAULT 0,
        readCount INTEGER NOT NULL DEFAULT 0,
        lastReadDate TEXT,
        UNIQUE(planID, segmentID)
      );

      -- Enhanced table for reading challenge progress tracking  
      CREATE TABLE IF NOT EXISTS reading_challenge_progress (
        id INTEGER PRIMARY KEY NOT NULL,
        challengeID TEXT NOT NULL,
        segmentID TEXT NOT NULL,
        completionDate TEXT,
        isCompleted BOOLEAN NOT NULL DEFAULT 0,
        readCount INTEGER NOT NULL DEFAULT 0,
        lastReadDate TEXT,
        UNIQUE(challengeID, segmentID)
      );

      -- Table to track overall plan/challenge status
      CREATE TABLE IF NOT EXISTS plan_challenge_status (
        id INTEGER PRIMARY KEY NOT NULL,
        itemID TEXT NOT NULL, -- planID or challengeID
        itemType TEXT NOT NULL, -- 'plan' or 'challenge'
        isActive BOOLEAN NOT NULL DEFAULT 1,
        isPaused BOOLEAN NOT NULL DEFAULT 0,
        isCompleted BOOLEAN NOT NULL DEFAULT 0,
        startDate TEXT,
        completionDate TEXT,
        totalSegments INTEGER,
        completedSegments INTEGER NOT NULL DEFAULT 0,
        progressPercentage REAL NOT NULL DEFAULT 0,
        UNIQUE(itemID, itemType)
      );

      -- New achievements table
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

      -- New daily_activity table to track reading streaks
      CREATE TABLE IF NOT EXISTS daily_activity (
        id INTEGER PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        segmentCount INTEGER NOT NULL,
        lastUpdated TEXT NOT NULL
      );

      -- New table to track current streak
      CREATE TABLE IF NOT EXISTS streak_data (
        id INTEGER PRIMARY KEY NOT NULL,
        currentStreak INTEGER NOT NULL,
        longestStreak INTEGER NOT NULL,
        lastReadDate TEXT NOT NULL,
        lastUpdated TEXT NOT NULL
      );

      -- New completedSegments table
      CREATE TABLE IF NOT EXISTS completedSegments (
        id INTEGER PRIMARY KEY NOT NULL,
        segmentID TEXT NOT NULL,
        isCompleted BOOLEAN NOT NULL DEFAULT 0,
        completionDate TEXT,
        UNIQUE(segmentID)
      );

      -- New sourceReadings table
      CREATE TABLE IF NOT EXISTS sourceReadings (
        id INTEGER PRIMARY KEY NOT NULL,
        segmentID TEXT NOT NULL,
        blockID TEXT NOT NULL,
        color TEXT NOT NULL,
        readDate TEXT NOT NULL,
        UNIQUE(segmentID, blockID, color)
      );

      -- New table to track reading sessions
      CREATE TABLE IF NOT EXISTS reading_sessions (
        id INTEGER PRIMARY KEY NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        segmentCount INTEGER NOT NULL,
        sessionDate TEXT NOT NULL
      );

      -- New table for book completion tracking
      CREATE TABLE IF NOT EXISTS book_completion (
        id INTEGER PRIMARY KEY NOT NULL,
        bookId TEXT NOT NULL,
        isCompleted BOOLEAN NOT NULL DEFAULT 0,
        completionDate TEXT,
        UNIQUE(bookId)
      );
    `);
    
    // Populate the segments table with data from SegmentTitles.json
    await populateSegmentsTable();

    // Initialize streak_data if empty
    const streakData = await db.getFirstAsync(
      'SELECT * FROM streak_data LIMIT 1'
    );
    
    if (!streakData) {
      await db.runAsync(`
        INSERT INTO streak_data (currentStreak, longestStreak, lastReadDate, lastUpdated)
        VALUES (0, 0, date('now', 'localtime'), datetime('now', 'localtime'))
      `);
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

// Function to handle database migrations
async function migrateDatabase() {
  try {
    console.log('Starting database migration...');
    
    // Check if segment_completion table has readerColor column
    const tableInfo = await db.getAllAsync(`PRAGMA table_info(segment_completion)`);
    const hasReaderColor = tableInfo.some((col: any) => col.name === 'readerColor');
    
    console.log('segment_completion table columns:', tableInfo.map((col: any) => col.name));
    console.log('Has readerColor column:', hasReaderColor);
    
    if (!hasReaderColor) {
      console.log('Adding readerColor column to segment_completion...');
      try {
        await db.execAsync(`
          ALTER TABLE segment_completion ADD COLUMN readerColor TEXT;
        `);
        console.log('Successfully added readerColor column');
      } catch (e) {
        console.log('Error adding readerColor column:', e);
        // If we can't add the column, recreate the table
        console.log('Recreating segment_completion table...');
        await db.execAsync(`
          DROP TABLE IF EXISTS segment_completion_old;
          ALTER TABLE segment_completion RENAME TO segment_completion_old;
          
          CREATE TABLE segment_completion (
            id INTEGER PRIMARY KEY NOT NULL,
            segmentID TEXT NOT NULL,
            completionType TEXT NOT NULL,
            planID TEXT,
            challengeID TEXT,
            completionDate TEXT NOT NULL,
            readerColor TEXT
          );
          
          INSERT INTO segment_completion (segmentID, completionType, planID, challengeID, completionDate)
          SELECT segmentID, completionType, planID, challengeID, completionDate 
          FROM segment_completion_old;
          
          DROP TABLE segment_completion_old;
        `);
        console.log('Successfully recreated segment_completion table');
      }
    }
    
    // Add any missing columns to existing tables
    
    // Check if reading_plan_progress exists and has the required columns
    try {
      await db.execAsync(`
        ALTER TABLE reading_plan_progress ADD COLUMN readCount INTEGER NOT NULL DEFAULT 0;
      `);
      console.log('Added readCount to reading_plan_progress');
    } catch (e) {
      // Column already exists, ignore
    }
    
    try {
      await db.execAsync(`
        ALTER TABLE reading_plan_progress ADD COLUMN lastReadDate TEXT;
      `);
      console.log('Added lastReadDate to reading_plan_progress');
    } catch (e) {
      // Column already exists, ignore
    }
    
    // Check if reading_challenge_progress exists and has the required columns
    try {
      await db.execAsync(`
        ALTER TABLE reading_challenge_progress ADD COLUMN readCount INTEGER NOT NULL DEFAULT 0;
      `);
      console.log('Added readCount to reading_challenge_progress');
    } catch (e) {
      // Column already exists, ignore
    }
    
    try {
      await db.execAsync(`
        ALTER TABLE reading_challenge_progress ADD COLUMN lastReadDate TEXT;
      `);
      console.log('Added lastReadDate to reading_challenge_progress');
    } catch (e) {
      // Column already exists, ignore
    }
    
    console.log('Database migration completed');
    
  } catch (error) {
    console.error("Error migrating database:", error);
    // Don't throw here, let initialization continue
  }
}

// Add this function to populate the segments table
async function populateSegmentsTable() {
  try {
    // Check if table is already populated
    const count = await db.getFirstAsync<{count: number}>(`
      SELECT COUNT(*) as count FROM segments
    `);
    
    if (count?.count === 0) {
      // Import segment data
      const segmentTitles = require('../assets/data/SegmentTitles.json');
      
      // Begin transaction for faster inserts
      await db.execAsync('BEGIN TRANSACTION');
      
      for (const [segmentId, data] of Object.entries(segmentTitles)) {
        const segment = data as any;
        await db.runAsync(`
          INSERT INTO segments (segmentID, bookId, title, reference)
          VALUES (?, ?, ?, ?)
        `, segmentId, segment.book[0], segment.title, segment.ref || null);
      }
      
      await db.execAsync('COMMIT');
    }
  } catch (error) {
    console.error("Error populating segments table:", error);
    await db.execAsync('ROLLBACK');
  }
}

initializeDatabase();

// Enhanced tracking functions
export async function recordSegmentRead(
  segmentID: string,
  context: 'free' | 'plan' | 'challenge' = 'free',
  planID?: string,
  challengeID?: string,
  readDuration?: number
): Promise<void> {
  try {
    // Record the individual read
    await db.runAsync(`
      INSERT INTO segment_reads (
        segmentID, readDate, readDuration, context, planID, challengeID, isCompleted
      ) VALUES (?, datetime('now', 'localtime'), ?, ?, ?, ?, 1)
    `, segmentID, readDuration || 0, context, planID || null, challengeID || null);

    // Update specific tracking based on context
    if (context === 'plan' && planID) {
      await updateReadingPlanProgress(planID, segmentID);
    } else if (context === 'challenge' && challengeID) {
      await updateReadingChallengeProgress(challengeID, segmentID);
    }

    // Update daily activity and streak
    await updateDailyActivity(segmentID);
    
  } catch (error) {
    console.error("Error recording segment read:", error);
    throw error;
  }
}

export async function updateReadingPlanProgress(
  planID: string,
  segmentID: string
): Promise<void> {
  try {
    // Insert or update the plan progress
    await db.runAsync(`
      INSERT INTO reading_plan_progress (planID, segmentID, readCount, lastReadDate, isCompleted, completionDate)
      VALUES (?, ?, 1, datetime('now', 'localtime'), 1, datetime('now', 'localtime'))
      ON CONFLICT(planID, segmentID) DO UPDATE SET
        readCount = readCount + 1,
        lastReadDate = datetime('now', 'localtime'),
        isCompleted = 1,
        completionDate = CASE 
          WHEN isCompleted = 0 THEN datetime('now', 'localtime')
          ELSE completionDate
        END
    `, planID, segmentID);

    // Update overall plan status
    await updatePlanChallengeStatus(planID, 'plan');
    
  } catch (error) {
    console.error("Error updating reading plan progress:", error);
    throw error;
  }
}

export async function updateReadingChallengeProgress(
  challengeID: string,
  segmentID: string
): Promise<void> {
  try {
    // Insert or update the challenge progress
    await db.runAsync(`
      INSERT INTO reading_challenge_progress (challengeID, segmentID, readCount, lastReadDate, isCompleted, completionDate)
      VALUES (?, ?, 1, datetime('now', 'localtime'), 1, datetime('now', 'localtime'))
      ON CONFLICT(challengeID, segmentID) DO UPDATE SET
        readCount = readCount + 1,
        lastReadDate = datetime('now', 'localtime'),
        isCompleted = 1,
        completionDate = CASE 
          WHEN isCompleted = 0 THEN datetime('now', 'localtime')
          ELSE completionDate
        END
    `, challengeID, segmentID);

    // Update overall challenge status
    await updatePlanChallengeStatus(challengeID, 'challenge');
    
  } catch (error) {
    console.error("Error updating reading challenge progress:", error);
    throw error;
  }
}

async function updatePlanChallengeStatus(
  itemID: string,
  itemType: 'plan' | 'challenge'
): Promise<void> {
  try {
    const progressTable = itemType === 'plan' ? 'reading_plan_progress' : 'reading_challenge_progress';
    const idColumn = itemType === 'plan' ? 'planID' : 'challengeID';
    
    // Get completion counts
    const result = await db.getFirstAsync<{total: number, completed: number}>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN isCompleted = 1 THEN 1 ELSE 0 END) as completed
      FROM ${progressTable}
      WHERE ${idColumn} = ?
    `, itemID);

    const total = result?.total || 0;
    const completed = result?.completed || 0;
    const progressPercentage = total > 0 ? (completed / total) * 100 : 0;
    const isCompleted = progressPercentage >= 100;

    // Update or insert status
    await db.runAsync(`
      INSERT INTO plan_challenge_status (
        itemID, itemType, completedSegments, totalSegments, progressPercentage, isCompleted,
        startDate
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
      ON CONFLICT(itemID, itemType) DO UPDATE SET
        completedSegments = ?,
        totalSegments = ?,
        progressPercentage = ?,
        isCompleted = ?,
        completionDate = CASE 
          WHEN ? = 1 AND isCompleted = 0 THEN datetime('now', 'localtime')
          ELSE completionDate
        END
    `, itemID, itemType, completed, total, progressPercentage, isCompleted ? 1 : 0,
       completed, total, progressPercentage, isCompleted ? 1 : 0, isCompleted ? 1 : 0);
    
  } catch (error) {
    console.error(`Error updating ${itemType} status:`, error);
    throw error;
  }
}

export async function getSegmentReadCount(segmentID: string): Promise<number> {
  try {
    const result = await db.getFirstAsync<{count: number}>(`
      SELECT COUNT(*) as count FROM segment_reads WHERE segmentID = ?
    `, segmentID);
    
    return result?.count || 0;
  } catch (error) {
    console.error("Error getting segment read count:", error);
    return 0;
  }
}

export async function getPlanProgress(planID: string): Promise<{
  totalSegments: number;
  completedSegments: number;
  progressPercentage: number;
  isCompleted: boolean;
  completedSegmentIds: string[];
}> {
  try {
    // Get overall status
    const status = await db.getFirstAsync<{
      totalSegments: number;
      completedSegments: number;
      progressPercentage: number;
      isCompleted: boolean;
    }>(`
      SELECT totalSegments, completedSegments, progressPercentage, isCompleted
      FROM plan_challenge_status
      WHERE itemID = ? AND itemType = 'plan'
    `, planID);

    // Get completed segment IDs
    const completedRows = await db.getAllAsync<{segmentID: string}>(`
      SELECT segmentID FROM reading_plan_progress
      WHERE planID = ? AND isCompleted = 1
    `, planID);

    const completedSegmentIds = completedRows.map(row => row.segmentID);

    return {
      totalSegments: status?.totalSegments || 0,
      completedSegments: status?.completedSegments || 0,
      progressPercentage: status?.progressPercentage || 0,
      isCompleted: status?.isCompleted || false,
      completedSegmentIds
    };
  } catch (error) {
    console.error("Error getting plan progress:", error);
    return {
      totalSegments: 0,
      completedSegments: 0,
      progressPercentage: 0,
      isCompleted: false,
      completedSegmentIds: []
    };
  }
}

export async function getChallengeProgress(challengeID: string): Promise<{
  totalSegments: number;
  completedSegments: number;
  progressPercentage: number;
  isCompleted: boolean;
  completedSegmentIds: string[];
}> {
  try {
    // Get overall status
    const status = await db.getFirstAsync<{
      totalSegments: number;
      completedSegments: number;
      progressPercentage: number;
      isCompleted: boolean;
    }>(`
      SELECT totalSegments, completedSegments, progressPercentage, isCompleted
      FROM plan_challenge_status
      WHERE itemID = ? AND itemType = 'challenge'
    `, challengeID);

    // Get completed segment IDs
    const completedRows = await db.getAllAsync<{segmentID: string}>(`
      SELECT segmentID FROM reading_challenge_progress
      WHERE challengeID = ? AND isCompleted = 1
    `, challengeID);

    const completedSegmentIds = completedRows.map(row => row.segmentID);

    return {
      totalSegments: status?.totalSegments || 0,
      completedSegments: status?.completedSegments || 0,
      progressPercentage: status?.progressPercentage || 0,
      isCompleted: status?.isCompleted || false,
      completedSegmentIds
    };
  } catch (error) {
    console.error("Error getting challenge progress:", error);
    return {
      totalSegments: 0,
      completedSegments: 0,
      progressPercentage: 0,
      isCompleted: false,
      completedSegmentIds: []
    };
  }
}

export async function initializePlanProgress(planID: string, segmentIDs: string[]): Promise<void> {
  try {
    await db.execAsync('BEGIN TRANSACTION');
    
    // Initialize plan status
    await db.runAsync(`
      INSERT OR REPLACE INTO plan_challenge_status (
        itemID, itemType, totalSegments, completedSegments, progressPercentage, 
        isActive, startDate
      ) VALUES (?, 'plan', ?, 0, 0, 1, datetime('now', 'localtime'))
    `, planID, segmentIDs.length);

    // Initialize segment progress
    for (const segmentID of segmentIDs) {
      await db.runAsync(`
        INSERT OR IGNORE INTO reading_plan_progress (planID, segmentID, readCount, isCompleted)
        VALUES (?, ?, 0, 0)
      `, planID, segmentID);
    }
    
    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    console.error("Error initializing plan progress:", error);
    throw error;
  }
}

export async function initializeChallengeProgress(challengeID: string, segmentIDs: string[]): Promise<void> {
  try {
    await db.execAsync('BEGIN TRANSACTION');
    
    // Initialize challenge status
    await db.runAsync(`
      INSERT OR REPLACE INTO plan_challenge_status (
        itemID, itemType, totalSegments, completedSegments, progressPercentage, 
        isActive, startDate
      ) VALUES (?, 'challenge', ?, 0, 0, 1, datetime('now', 'localtime'))
    `, challengeID, segmentIDs.length);

    // Initialize segment progress
    for (const segmentID of segmentIDs) {
      await db.runAsync(`
        INSERT OR IGNORE INTO reading_challenge_progress (challengeID, segmentID, readCount, isCompleted)
        VALUES (?, ?, 0, 0)
      `, challengeID, segmentID);
    }
    
    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    console.error("Error initializing challenge progress:", error);
    throw error;
  }
}

// Segment completion functions
export async function markSegmentComplete(
  segmentID: string,
  context: 'main' | 'plan' | 'challenge' = 'main',
  planID?: string | null,
  challengeID?: string | null
): Promise<void> {
  try {
    // Map legacy context to new context
    const newContext = context === 'main' ? 'free' : context;
    
    // Use the new comprehensive tracking system
    await recordSegmentRead(
      segmentID, 
      newContext as 'free' | 'plan' | 'challenge',
      planID || undefined,
      challengeID || undefined
    );
    
    // Keep legacy segment_completion for backward compatibility
    await db.runAsync(`
      INSERT OR REPLACE INTO segment_completion (
        segmentID, 
        completionType,
        planID,
        challengeID,
        completionDate
      ) VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
    `, segmentID, context, planID || null, challengeID || null);
    
    // Extract book ID and check book completion
    const segmentTitles = require('../assets/data/SegmentTitles.json');
    const segment = segmentTitles[segmentID];
    
    if (segment && segment.book && segment.book.length > 0) {
      const bookId = segment.book[0];
      await checkBookCompletion(bookId);
    }
    
  } catch (error) {
    console.error("Error marking segment complete:", error);
    throw error;
  }
}

export const getSegmentCompletionStatus = async (
  segmentId: string,
  context: string = 'main',
  planId?: string,
  challengeId?: string
): Promise<CompletionData> => {
  try {
    // Add defensive checks
    if (!segmentId) {
      console.warn('No segmentId provided to getSegmentCompletionStatus');
      return { isCompleted: false, color: null };
    }

    // Context-aware completion checking
    if (context === 'plan' && planId) {
      // Check if segment is completed in the specific plan (no readerColor in this table)
      const result = await db.getFirstAsync<{ segmentID: string }>(
        `SELECT segmentID FROM reading_plan_progress 
         WHERE planID = ? AND segmentID = ? AND isCompleted = 1`,
        [planId, segmentId]
      );
      return {
        isCompleted: !!result,
        color: null // Plan progress doesn't track colors
      };
    } else if (context === 'challenge' && challengeId) {
      // Check if segment is completed in the specific challenge (no readerColor in this table)
      const result = await db.getFirstAsync<{ segmentID: string }>(
        `SELECT segmentID FROM reading_challenge_progress 
         WHERE challengeID = ? AND segmentID = ? AND isCompleted = 1`,
        [challengeId, segmentId]
      );
      return {
        isCompleted: !!result,
        color: null // Challenge progress doesn't track colors
      };
    } else {
      // Default: check general completion (free reading) - this table does have readerColor
      const result = await db.getFirstAsync<{ readerColor: string | null }>(
        `SELECT readerColor FROM segment_completion WHERE segmentID = ?`,
        [segmentId]
      );
      
      return {
        isCompleted: !!result,
        color: result?.readerColor || null
      };
    }
  } catch (error) {
    console.error('Error getting segment completion status:', error);
    return { isCompleted: false, color: null };
  }
};

// Achievement functions
export async function unlockAchievement(
  achievementID: string,
  title: string,
  description: string,
  progress?: number,
  maxProgress?: number
) {
  try {
    await db.runAsync(
      `INSERT INTO achievements 
       (achievementID, title, description, unlockDate, progress, maxProgress, isCompleted)
       VALUES (?, ?, ?, datetime('now'), ?, ?, ?)`,
      achievementID,
      title,
      description,
      progress || 0,
      maxProgress || 0,
      progress === maxProgress
    );
  } catch (error) {
    console.error("Error unlocking achievement:", error);
  }
}

export async function updateAchievementProgress(
  achievementID: string,
  progress: number
) {
  try {
    await db.runAsync(
      `UPDATE achievements 
       SET progress = ?, 
           isCompleted = (progress >= maxProgress)
       WHERE achievementID = ?`,
      progress,
      achievementID
    );
  } catch (error) {
    console.error("Error updating achievement progress:", error);
  }
}

export async function getAchievements() {
  try {
    return await db.getAllAsync(
      `SELECT * FROM achievements ORDER BY unlockDate DESC`
    );
  } catch (error) {
    console.error("Error getting achievements:", error);
    return [];
  }
}

// New function to insert an emoji
export async function addEmoji(
  segmentID: string,
  blockID: string,
  blockData: BibleBlock,
  emoji: string
) {
  try {
    // First delete any existing emoji
    await deleteEmoji(segmentID, blockID);
    
    // Then insert the new emoji
    await db.runAsync(
      `INSERT INTO emojis (segmentID, blockID, blockData, emoji, note)
       VALUES (?, ?, ?, ?, ?)`,
      [
        segmentID,
        blockID,
        JSON.stringify(blockData),
        emoji,
        '' // Empty note for now
      ]
    );
  } catch (error) {
    console.error("Error adding emoji:", error);
    throw error;
  }
}

// New function to delete an emoji by segmentID and blockID
export async function deleteEmoji(segmentID: string, blockID: string) {
  try {
    await db.runAsync(
      `DELETE FROM emojis 
       WHERE segmentID = ? AND blockID = ?`,
      [segmentID, blockID]
    );
  } catch (error) {
    console.error("Error deleting emoji:", error);
    throw error;
  }
}

// New function to get the emoji for a given segmentID and blockID
export async function getEmoji(segmentID: string, blockID: string): Promise<string | null> {
  try {
    const result = await db.getFirstAsync<{ emoji: string }>(
      `SELECT emoji FROM emojis 
       WHERE segmentID = ? AND blockID = ?`,
      [segmentID, blockID]
    );
    return result?.emoji || null;
  } catch (error) {
    console.error("Error getting emoji:", error);
    return null;
  }
}

// Add this function to get all emoji reactions
export async function getEmojis() {
  try {
    const result = await db.getAllAsync<{
      id: number;
      segmentID: string;
      blockID: string;
      blockData: string;
      emoji: string;
      note: string;
    }>(
      `SELECT * FROM emojis ORDER BY id DESC`
    );
    
    // Parse blockData back into BibleBlock objects
    return result.map(row => ({
      ...row,
      blockData: JSON.parse(row.blockData) as BibleBlock
    }));
  } catch (error) {
    console.error("Error getting emojis:", error);
    return [];
  }
}

// Add new functions to handle streak tracking
export async function updateDailyActivity(segmentId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Record daily activity
    await db.runAsync(`
      INSERT OR REPLACE INTO daily_activity (date, segmentCount, lastUpdated)
      VALUES (
        ?,
        COALESCE((
          SELECT segmentCount + 1
          FROM daily_activity
          WHERE date = ?
        ), 1),
        datetime('now', 'localtime')
      )
    `, today, today);

    // Update streak
    await updateStreak();
  } catch (error) {
    console.error("Error updating daily activity:", error);
  }
}

async function updateStreak() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const streakData = await db.getFirstAsync<{
      currentStreak: number;
      longestStreak: number;
      lastReadDate: string;
    }>('SELECT * FROM streak_data ORDER BY id DESC LIMIT 1');

    if (!streakData) return;

    const lastReadDate = new Date(streakData.lastReadDate);
    const currentDate = new Date(today);
    const diffDays = Math.floor((currentDate.getTime() - lastReadDate.getTime()) / (1000 * 60 * 60 * 24));

    let newStreak = streakData.currentStreak;
    
    if (diffDays === 0) {
      // Already counted for today
      return;
    } else if (diffDays === 1) {
      // Consecutive day
      newStreak += 1;
    } else {
      // Streak broken
      newStreak = 1;
    }

    const newLongestStreak = Math.max(newStreak, streakData.longestStreak);

    await db.runAsync(`
      UPDATE streak_data
      SET currentStreak = ?,
          longestStreak = ?,
          lastReadDate = ?,
          lastUpdated = datetime('now', 'localtime')
      WHERE id = (SELECT id FROM streak_data ORDER BY id DESC LIMIT 1)
    `, newStreak, newLongestStreak, today);

  } catch (error) {
    console.error("Error updating streak:", error);
  }
}

export async function getCurrentStreak(): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ currentStreak: number }>(
      'SELECT currentStreak FROM streak_data ORDER BY id DESC LIMIT 1'
    );
    return result?.currentStreak || 0;
  } catch (error) {
    console.error("Error getting current streak:", error);
    return 0;
  }
}

// Update the existing functions to use the CountResult type
interface CountResult {
  count: number;
  currentStreak?: number;
  longestStreak?: number;
}

// Keep only one version of each function
export const getCompletedSegmentsCount = async () => {
  try {
    // The segment_completion table doesn't have an isCompleted column
    // It records completions, so each row represents a completed segment
    const result = await db.getFirstAsync<CountResult>(
      `SELECT COUNT(*) as count FROM segment_completion`
    );
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting completed segments count:', error);
    return 0;
  }
};

export const getTotalSegmentsCount = async () => {
  try {
    // For total segments, we need a reference count
    // This is a placeholder - you might need to adjust based on your data
    return 365; // Total number of segments in your Bible data
  } catch (error) {
    console.error('Error getting total segments count:', error);
    return 0;
  }
};

export const getReadingStreak = async () => {
  const result = await db.getFirstAsync<{currentStreak: number, longestStreak: number}>(
    `SELECT currentStreak, longestStreak FROM streak_data LIMIT 1`
  );
  return {
    currentStreak: result?.currentStreak || 0,
    longestStreak: result?.longestStreak || 0
  };
};

// Get emoji usage statistics
export async function getEmojiStats(): Promise<{
  total: number;
  heart: number;
  prayer: number;
  question: number;
  thumbsUp: number;
}> {
  try {
    const totalResult = await db.getFirstAsync<{count: number}>(`
      SELECT COUNT(*) as count FROM emojis
    `);
    
    const heartResult = await db.getFirstAsync<{count: number}>(`
      SELECT COUNT(*) as count FROM emojis WHERE emoji = '❤️'
    `);
    
    const prayerResult = await db.getFirstAsync<{count: number}>(`
      SELECT COUNT(*) as count FROM emojis WHERE emoji = '🙏'
    `);
    
    const questionResult = await db.getFirstAsync<{count: number}>(`
      SELECT COUNT(*) as count FROM emojis WHERE emoji = '🤔'
    `);
    
    const thumbsUpResult = await db.getFirstAsync<{count: number}>(`
      SELECT COUNT(*) as count FROM emojis WHERE emoji = '👍'
    `);
    
    return {
      total: totalResult?.count || 0,
      heart: heartResult?.count || 0,
      prayer: prayerResult?.count || 0,
      question: questionResult?.count || 0,
      thumbsUp: thumbsUpResult?.count || 0
    };
  } catch (error) {
    console.error("Error getting emoji stats:", error);
    return {
      total: 0,
      heart: 0,
      prayer: 0,
      question: 0,
      thumbsUp: 0
    };
  }
}

// Get source reading statistics
export const getSourceStats = async () => {
  const redResult = await db.getFirstAsync<CountResult>(
    `SELECT COUNT(*) as count FROM sourceReadings WHERE color = 'red'`
  );
  
  const greenResult = await db.getFirstAsync<CountResult>(
    `SELECT COUNT(*) as count FROM sourceReadings WHERE color = 'green'`
  );
  
  const blueResult = await db.getFirstAsync<CountResult>(
    `SELECT COUNT(*) as count FROM sourceReadings WHERE color = 'blue'`
  );
  
  const blackResult = await db.getFirstAsync<CountResult>(
    `SELECT COUNT(*) as count FROM sourceReadings WHERE color = 'black'`
  );
  
  return {
    red: redResult?.count || 0,
    green: greenResult?.count || 0,
    blue: blueResult?.count || 0,
    black: blackResult?.count || 0
  };
};

export async function getBestStreak(): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ longestStreak: number }>(
      'SELECT longestStreak FROM streak_data ORDER BY id DESC LIMIT 1'
    );
    return result?.longestStreak || 0;
  } catch (error) {
    console.error("Error getting best streak:", error);
    return 0;
  }
}

// New function to start a reading session
export async function startReadingSession() {
  try {
    await db.runAsync(`
      INSERT INTO reading_sessions (startTime, endTime, segmentCount, sessionDate)
      VALUES (datetime('now', 'localtime'), datetime('now', 'localtime'), 0, date('now', 'localtime'))
    `);
    
    // Return the newly created session ID
    const result = await db.getFirstAsync<{id: number}>(`
      SELECT last_insert_rowid() as id
    `);
    return result?.id;
  } catch (error) {
    console.error("Error starting reading session:", error);
    return null;
  }
}

// Function to update an ongoing reading session
export async function updateReadingSession(sessionId: number, segmentCount: number) {
  try {
    await db.runAsync(`
      UPDATE reading_sessions
      SET endTime = datetime('now', 'localtime'),
          segmentCount = ?
      WHERE id = ?
    `, segmentCount, sessionId);
  } catch (error) {
    console.error("Error updating reading session:", error);
  }
}

// Get the longest reading session
export async function getLongestSession(): Promise<number> {
  try {
    const result = await db.getFirstAsync<{maxSegments: number}>(`
      SELECT MAX(segmentCount) as maxSegments FROM reading_sessions
    `);
    return result?.maxSegments || 0;
  } catch (error) {
    console.error("Error getting longest session:", error);
    return 0;
  }
}

// Update the checkBookCompletion function
export async function checkBookCompletion(bookId: string): Promise<boolean> {
  try {
    // Get all segments for the book, excluding introductions
    const result = await db.getFirstAsync<{count: number}>(`
      SELECT COUNT(*) as count 
      FROM segment_completion 
      WHERE segmentID IN (
        SELECT segmentID 
        FROM segments 
        WHERE bookId = ? 
        AND segmentID NOT LIKE '%intro%'
      )
    `, bookId);

    // Get total number of segments for the book (excluding introductions)
    const totalResult = await db.getFirstAsync<{count: number}>(`
      SELECT COUNT(*) as count 
      FROM segments 
      WHERE bookId = ? 
      AND segmentID NOT LIKE '%intro%'
    `, bookId);

    const isCompleted = (result?.count ?? 0) === (totalResult?.count ?? 0) && (totalResult?.count ?? 0) > 0;
    
    // If completed, update the book_completion table
    if (isCompleted) {
      await db.runAsync(`
        INSERT OR REPLACE INTO book_completion (bookId, isCompleted, completionDate)
        VALUES (?, 1, datetime('now', 'localtime'))
      `, bookId);
    }
    
    return isCompleted;
  } catch (error) {
    console.error("Error checking book completion:", error);
    return false;
  }
}

// Add a function to get completion status for a specific book
export async function getBookCompletionStatus(bookId: string): Promise<boolean> {
  try {
    const result = await db.getFirstAsync<{isCompleted: number}>(`
      SELECT isCompleted FROM book_completion WHERE bookId = ?
    `, bookId);
    return result?.isCompleted === 1;
  } catch (error) {
    console.error("Error getting book completion status:", error);
    return false;
  }
}

// Get all completed books
export async function getCompletedBooks(): Promise<string[]> {
  try {
    const results = await db.getAllAsync<{bookId: string}>(`
      SELECT bookId FROM book_completion WHERE isCompleted = 1
    `);
    
    return results.map(row => row.bookId);
  } catch (error) {
    console.error("Error getting completed books:", error);
    return [];
  }
}

// Check if all emoji types have been used
export async function checkEmojiCollection(): Promise<{complete: boolean, used: string[]}> {
  try {
    const emojiTypes = ['❤️', '👍', '🤔', '🙏']; // List all expected emoji types
    
    const results = await db.getAllAsync<{emoji: string}>(`
      SELECT DISTINCT emoji FROM emojis
    `);
    
    const usedEmojis = results.map(row => row.emoji);
    const isComplete = emojiTypes.every(emoji => usedEmojis.includes(emoji));
    
    return {
      complete: isComplete,
      used: usedEmojis
    };
  } catch (error) {
    console.error("Error checking emoji collection:", error);
    return {
      complete: false,
      used: []
    };
  }
}

// Get completed segments count for Old Testament
export async function getOldTestamentProgress(): Promise<{completed: number; total: number}> {
  try {
    // Get completed segments for Old Testament (segments 1-219)
    const result = await db.getFirstAsync<{count: number}>(`
      SELECT COUNT(*) as count
      FROM segment_completion
      WHERE CAST(substr(segmentID, 2) AS INTEGER) <= 219
    `);
    
    return {
      completed: result?.count || 0,
      total: 219
    };
  } catch (error) {
    console.error("Error getting Old Testament progress:", error);
    return { completed: 0, total: 219 };
  }
}

// Get completed segments count for New Testament
export async function getNewTestamentProgress(): Promise<{completed: number; total: number}> {
  try {
    // Get completed segments for New Testament (segments 220-365)
    const result = await db.getFirstAsync<{count: number}>(`
      SELECT COUNT(*) as count
      FROM segment_completion
      WHERE CAST(substr(segmentID, 2) AS INTEGER) > 219
    `);
    
    return {
      completed: result?.count || 0,
      total: 146
    };
  } catch (error) {
    console.error("Error getting New Testament progress:", error);
    return { completed: 0, total: 146 };
  }
}

// Update the function that marks achievements as completed
export async function markAchievementComplete(achievementId: string) {
  try {
    await db.runAsync(`
      UPDATE achievements 
      SET isCompleted = 1, 
          achievementDate = datetime('now', 'localtime')
      WHERE achievementId = ?
    `, achievementId);
  } catch (error) {
    console.error("Error marking achievement complete:", error);
  }
}

// Function to get achievement dates
export async function getAchievementDates(): Promise<{[key: string]: string}> {
  try {
    const results = await db.getAllAsync<{achievementId: string, achievementDate: string}>(`
      SELECT achievementId, achievementDate 
      FROM achievements 
      WHERE isCompleted = 1 
      AND achievementDate IS NOT NULL
    `);
    
    return results.reduce((acc, curr) => {
      acc[curr.achievementId] = curr.achievementDate;
      return acc;
    }, {} as {[key: string]: string});
  } catch (error) {
    console.error("Error getting achievement dates:", error);
    return {};
  }
}

// Plan and Challenge Management Functions
export async function activateReadingPlan(planID: string, segmentIDs: string[]): Promise<void> {
  try {
    // Initialize plan progress if not exists
    await initializePlanProgress(planID, segmentIDs);
    
    // Activate the plan
    await db.runAsync(`
      UPDATE plan_challenge_status 
      SET isActive = 1, isPaused = 0, startDate = datetime('now', 'localtime')
      WHERE itemID = ? AND itemType = 'plan'
    `, planID);
    
  } catch (error) {
    console.error("Error activating reading plan:", error);
    throw error;
  }
}

export async function activateReadingChallenge(challengeID: string, segmentIDs: string[]): Promise<void> {
  try {
    // Initialize challenge progress if not exists
    await initializeChallengeProgress(challengeID, segmentIDs);
    
    // Activate the challenge
    await db.runAsync(`
      UPDATE plan_challenge_status 
      SET isActive = 1, isPaused = 0, startDate = datetime('now', 'localtime')
      WHERE itemID = ? AND itemType = 'challenge'
    `, challengeID);
    
  } catch (error) {
    console.error("Error activating reading challenge:", error);
    throw error;
  }
}

export async function pausePlanOrChallenge(itemID: string, itemType: 'plan' | 'challenge'): Promise<void> {
  try {
    await db.runAsync(`
      UPDATE plan_challenge_status 
      SET isPaused = 1 
      WHERE itemID = ? AND itemType = ?
    `, itemID, itemType);
  } catch (error) {
    console.error(`Error pausing ${itemType}:`, error);
    throw error;
  }
}

export async function resumePlanOrChallenge(itemID: string, itemType: 'plan' | 'challenge'): Promise<void> {
  try {
    await db.runAsync(`
      UPDATE plan_challenge_status 
      SET isPaused = 0 
      WHERE itemID = ? AND itemType = ?
    `, itemID, itemType);
  } catch (error) {
    console.error(`Error resuming ${itemType}:`, error);
    throw error;
  }
}

export async function getActivePlansAndChallenges(): Promise<{
  activePlans: any[];
  activeChallenges: any[];
}> {
  try {
    const activePlans = await db.getAllAsync(`
      SELECT * FROM plan_challenge_status 
      WHERE itemType = 'plan' AND isActive = 1 AND isPaused = 0 AND isCompleted = 0
    `);
    
    const activeChallenges = await db.getAllAsync(`
      SELECT * FROM plan_challenge_status 
      WHERE itemType = 'challenge' AND isActive = 1 AND isPaused = 0 AND isCompleted = 0
    `);
    
    return {
      activePlans,
      activeChallenges
    };
  } catch (error) {
    console.error("Error getting active plans and challenges:", error);
    return {
      activePlans: [],
      activeChallenges: []
    };
  }
}

export async function isSegmentCompletedInPlan(planID: string, segmentID: string): Promise<boolean> {
  try {
    const result = await db.getFirstAsync<{isCompleted: number}>(`
      SELECT isCompleted FROM reading_plan_progress
      WHERE planID = ? AND segmentID = ?
    `, planID, segmentID);
    
    return result?.isCompleted === 1;
  } catch (error) {
    console.error("Error checking plan segment completion:", error);
    return false;
  }
}

export async function isSegmentCompletedInChallenge(challengeID: string, segmentID: string): Promise<boolean> {
  try {
    const result = await db.getFirstAsync<{isCompleted: number}>(`
      SELECT isCompleted FROM reading_challenge_progress
      WHERE challengeID = ? AND segmentID = ?
    `, challengeID, segmentID);
    
    return result?.isCompleted === 1;
  } catch (error) {
    console.error("Error checking challenge segment completion:", error);
    return false;
  }
}
