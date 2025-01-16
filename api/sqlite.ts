import { SQLiteDatabase } from "expo-sqlite";
import * as SQLite from "expo-sqlite";

let db: SQLiteDatabase;

async function initializeDatabase() {
  try {
    db = await SQLite.openDatabaseAsync("databaseName");
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE IF NOT EXISTS emojis (
        id INTEGER PRIMARY KEY NOT NULL,
        segmentID TEXT NOT NULL,
        blockID TEXT NOT NULL,
        blockData TEXT NOT NULL,
        emoji TEXT NOT NULL,
        note TEXT NOT NULL
      );
    `);
    await createProgressTable();
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

initializeDatabase();

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
    await db.runAsync(
      `
      INSERT INTO emojis (segmentID, blockID, blockData, emoji, note) VALUES (?, ?, ?, ?, ?)
    `,
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

export async function createProgressTable() {
  await db.runAsync(
      `CREATE TABLE IF NOT EXISTS Progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        segmentId TEXT NOT NULL,
        isCompleted BOOLEAN NOT NULL,
        color TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        plan_or_challenge_id TEXT
      );`
  );
}

// Function to insert or update progress
export async function markSegmentProgress(
  planId: string,
  segmentId: string,
  isCompleted: boolean,
  color: string | null
) {
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO Progress (plan_id, segmentId, isCompleted, color) VALUES (?, ?, ?, ?)`,
      [planId, segmentId, isCompleted, color]
    );
  } catch (error) {
    console.error("Error marking segment progress:", error);
  }
}

// New function to get progress by segmentId and planId
export async function getSegmentProgress(segmentId: string, planId: string) {
  try {
    const result = await db.getFirstAsync<{
      id: number;
      segmentId: string;
      isCompleted: boolean;
      color: string | null;
    }>(
      `SELECT * FROM Progress WHERE segmentId = ? AND plan_id = ?`,
      segmentId,
      planId
    );

    return result || null; // Returns the progress object or null if not found
  } catch (error) {
    console.error("Error retrieving segment progress:", error);
    return null;
  }
}