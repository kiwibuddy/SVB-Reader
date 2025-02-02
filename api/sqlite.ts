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
        note TEXT NOT NULL
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
    `);
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

initializeDatabase();

// Segment completion functions
export async function markSegmentCompleteInDB(
  segmentID: string,
  completionType: 'main' | 'challenge' | 'plan',
  planID: string | null = null,
  challengeID: string | null = null,
  readerColor: string | null = null
) {
  try {
    await db.runAsync(
      `INSERT INTO segment_completion 
       (segmentID, completionType, planID, challengeID, completionDate, readerColor)
       VALUES (?, ?, ?, ?, datetime('now'), ?)`,
      segmentID,
      completionType,
      planID,
      challengeID,
      readerColor
    );

    if (completionType !== 'main') {
      await db.runAsync(
        `INSERT INTO segment_completion 
         (segmentID, completionType, completionDate, readerColor)
         VALUES (?, 'main', datetime('now'), ?)`,
        segmentID,
        readerColor
      );
    }
  } catch (error) {
    console.error("Error marking segment complete:", error);
  }
}

export async function getSegmentCompletionStatus(
  segmentID: string,
  completionType: 'main' | 'challenge' | 'plan',
  planID: string | null = null,
  challengeID: string | null = null
) {
  try {
    const result = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM segment_completion 
       WHERE segmentID = ? 
       AND completionType = ?
       AND (planID = ? OR planID IS NULL)
       AND (challengeID = ? OR challengeID IS NULL)`,
      segmentID,
      completionType,
      planID,
      challengeID
    );
    return !!result;
  } catch (error) {
    console.error("Error getting segment completion status:", error);
    return false;
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
export async function addEmoji(
  ID: string,
  blockData: string,
  emoji: string,
  note: string
) {
  const idSplit = ID.split("-");
  const segmentID = idSplit[0];
  const blockID = idSplit[1];
  try {
    // First delete any existing emoji for this block
    await db.runAsync(
      `DELETE FROM emojis WHERE segmentID = ? AND blockID = ?`,
      segmentID,
      blockID
    );
    
    // Then insert the new emoji
    await db.runAsync(
      `INSERT INTO emojis (segmentID, blockID, blockData, emoji, note) 
       VALUES (?, ?, ?, ?, ?)`,
      segmentID,
      blockID,
      blockData,
      emoji,
      note
    );
  } catch (error) {
    console.error("Error adding emoji:", error);
  }
}

// New function to delete an emoji by segmentID and blockID
export async function deleteEmoji(segmentID: string, blockID: string) {
  try {
    await db.runAsync(
      `
      DELETE FROM emojis WHERE segmentID = ? AND blockID = ?
    `,
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
      `
      SELECT emoji FROM emojis WHERE segmentID = ? AND blockID = ?
    `,
      segmentID,
      blockID
    );

    return result ? result.emoji : null; // Returns the emoji string or null if not found
  } catch (error) {
    console.error("Error retrieving emoji:", error);
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
      `SELECT * FROM emojis`
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
