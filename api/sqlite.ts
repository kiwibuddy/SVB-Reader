import { SQLiteDatabase } from "expo-sqlite";
import * as SQLite from "expo-sqlite";

let db: SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

async function initializeDatabase(): Promise<void> {
  if (db) return; // Already initialized
  
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
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

async function ensureDbInitialized(): Promise<SQLiteDatabase> {
  if (!initPromise) {
    initPromise = initializeDatabase();
  }
  await initPromise;
  
  if (!db) {
    throw new Error("Database failed to initialize");
  }
  
  return db;
}

// New function to insert an emoji
export async function addEmoji(
  ID: string,
  blockData: string,
  emoji: string,
  note: string
) {
  const database = await ensureDbInitialized();
  const idSplit = ID.split("-");
  const segmentID = idSplit[0];
  const blockID = idSplit[1];
  try {
    await database.runAsync(
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
    throw error;
  }
}

// New function to delete an emoji by segmentID and blockID
export async function deleteEmoji(segmentID: string, blockID: string) {
  const database = await ensureDbInitialized();
  try {
    await database.runAsync(
      `
      DELETE FROM emojis WHERE segmentID = ? AND blockID = ?
    `,
      segmentID,
      blockID
    );
  } catch (error) {
    console.error("Error deleting emoji:", error);
    throw error;
  }
}

// New function to get the emoji for a given segmentID and blockID
export async function getEmoji(segmentID: string, blockID: string): Promise<string | null> {
  const database = await ensureDbInitialized();
  try {
    const result = await database.getFirstAsync<{ emoji: string }>(
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
  const database = await ensureDbInitialized();
  try {
    const result = await database.getAllAsync<{
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

