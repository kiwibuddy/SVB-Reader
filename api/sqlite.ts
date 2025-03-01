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

      -- New segment completion table
      CREATE TABLE IF NOT EXISTS segment_completion (
        id INTEGER PRIMARY KEY NOT NULL,
        segmentID TEXT NOT NULL,
        completionType TEXT NOT NULL,
        planID TEXT,
        challengeID TEXT,
        completionDate TEXT NOT NULL,
        readerColor TEXT
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

// Segment completion functions
export async function markSegmentComplete(
  segmentID: string,
  context: 'main' | 'plan' | 'challenge' = 'main',
  planID?: string | null
): Promise<void> {
  try {
    // Insert completion record without checking book
    await db.runAsync(`
      INSERT OR REPLACE INTO segment_completion (
        segmentID, 
        completionType,
        planID,
        completionDate
      ) VALUES (?, ?, ?, datetime('now', 'localtime'))
    `, segmentID, context, planID || null);
    
    // Extract book ID from segment ID using the pattern
    // Most segment IDs follow a pattern where the book can be determined
    // For example, if we have segment data in memory:
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

    // Your existing query logic here
    const result = await db.getFirstAsync<{ readerColor: string | null }>(
      `SELECT readerColor FROM segment_completion WHERE segmentID = ?`,
      [segmentId]
    );
    
    return {
      isCompleted: !!result,
      color: result?.readerColor || null
    };
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

export async function getSegmentReadCount(segmentID: string): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM segment_completion 
       WHERE segmentID = ?`,
      segmentID
    );
    return result?.count || 0;
  } catch (error) {
    console.error("Error getting segment read count:", error);
    return 0;
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
