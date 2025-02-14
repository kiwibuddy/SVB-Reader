import { SQLiteDatabase } from "expo-sqlite";
import * as SQLite from "expo-sqlite";

let db: SQLiteDatabase;

async function initializeDatabase() {
  try {
    db = await SQLite.openDatabaseAsync("sourceview");
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      
      -- Existing emojis table
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
        isCompleted BOOLEAN
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
    `);

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
    console.error("Database initialization error:", error);
  }
}

initializeDatabase();

// Segment completion functions
export async function markSegmentCompleteInDB(
  segmentID: string,
  context: 'main' | 'plan' | 'challenge',
  planID?: string | null,
  challengeID?: string | null,
  readerColor?: string | null
) {
  try {
    await db.runAsync(`
      INSERT INTO segment_completion (
        segmentID, completionType, planID, challengeID, completionDate, readerColor
      )
      VALUES (?, ?, ?, ?, datetime('now', 'localtime'), ?)
    `, segmentID, context, planID || null, challengeID || null, readerColor || null);
  } catch (error) {
    console.error("Error marking segment complete:", error);
  }
}

export async function getSegmentCompletionStatus(
  segmentID: string,
  context: 'main' | 'plan' | 'challenge' = 'main',
  planID?: string,
  challengeID?: string
): Promise<{ isCompleted: boolean; color: string | null }> {
  try {
    const result = await db.getFirstAsync<{ readerColor: string | null }>(
      `SELECT readerColor 
       FROM segment_completion 
       WHERE segmentID = ? 
       AND completionType = ?
       AND (
         (? IS NULL AND planID IS NULL) OR planID = ?
       )
       AND (
         (? IS NULL AND challengeID IS NULL) OR challengeID = ?
       )
       ORDER BY completionDate DESC 
       LIMIT 1`,
      segmentID,
      context,
      planID || null,
      planID || null,
      challengeID || null,
      challengeID || null
    );
    
    return {
      isCompleted: !!result,
      color: result?.readerColor || null
    };
  } catch (error) {
    console.error("Error getting segment completion status:", error);
    return { isCompleted: false, color: null };
  }
}

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
export async function addEmoji(segmentID: string, blockID: string, blockData: any, emoji: string) {
  try {
    await deleteEmoji(segmentID, blockID);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const blockDataString = typeof blockData === 'string' 
      ? blockData 
      : JSON.stringify(blockData);
    
    await db.runAsync(
      `INSERT INTO emojis (segmentID, blockID, blockData, emoji, note)
       VALUES (?, ?, ?, ?, ?)`,
      segmentID,
      blockID,
      blockDataString,
      emoji,
      ''
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
      segmentID,
      blockID
    );
  } catch (error) {
    console.error("Error deleting emoji:", error);
  }
}

// New function to get the emoji for a given segmentID and blockID
export async function getEmoji(segmentID: string, blockID: string): Promise<string | null> {
  try {
    const result = await db.getFirstAsync<{ emoji: string }>(
      `SELECT emoji FROM emojis 
       WHERE segmentID = ? AND blockID = ?`,
      segmentID,
      blockID
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
      `SELECT * FROM emojis 
       ORDER BY id DESC`
    );
    return result;
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
