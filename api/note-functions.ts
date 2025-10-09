import logger from '@/utils/logger';
import { databaseManager } from './database-manager';
import { BibleBlock } from '@/types';

// ============================================================================
// NOTE CRUD FUNCTIONS
// ============================================================================

/**
 * Save or update a reaction (emoji and/or note)
 * @param segmentID - The segment ID
 * @param blockID - The block ID
 * @param blockData - The Bible block data
 * @param emoji - Optional emoji (null for note-only reactions)
 * @param note - The note text
 */
export async function saveReaction(
  segmentID: string,
  blockID: string,
  blockData: BibleBlock,
  emoji: string | null,
  note: string
): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    await db.runAsync(`
      INSERT OR REPLACE INTO emojis (
        segmentID,
        blockID,
        blockData,
        emoji,
        note
      ) VALUES (?, ?, ?, ?, ?)
    `, segmentID, blockID, JSON.stringify(blockData), emoji, note);
    
    logger.info('📝 [NoteFunc] Saved reaction:', { segmentID, blockID, hasEmoji: !!emoji, hasNote: note.length > 0 });
  } catch (error) {
    logger.error('📝 [NoteFunc] Error saving reaction:', error);
    throw error;
  }
}

/**
 * Get note for a specific block
 * @param segmentID - The segment ID
 * @param blockID - The block ID
 * @returns The note text or null if not found
 */
export async function getNote(
  segmentID: string,
  blockID: string
): Promise<string | null> {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.getFirstAsync<{ note: string | null }>(
      `SELECT note FROM emojis WHERE segmentID = ? AND blockID = ?`,
      segmentID,
      blockID
    );
    return result?.note || null;
  } catch (error) {
    logger.error('📝 [NoteFunc] Error getting note:', error);
    return null;
  }
}

/**
 * Get full reaction data (emoji and note) for a block
 * @param segmentID - The segment ID
 * @param blockID - The block ID
 * @returns Object with emoji and note, or null if not found
 */
export async function getReaction(
  segmentID: string,
  blockID: string
): Promise<{ emoji: string | null; note: string | null; blockData: string } | null> {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.getFirstAsync<{ emoji: string | null; note: string | null; blockData: string }>(
      `SELECT emoji, note, blockData FROM emojis WHERE segmentID = ? AND blockID = ?`,
      segmentID,
      blockID
    );
    return result || null;
  } catch (error) {
    logger.error('📝 [NoteFunc] Error getting reaction:', error);
    return null;
  }
}

/**
 * Update only the note text (keep emoji unchanged)
 * @param segmentID - The segment ID
 * @param blockID - The block ID
 * @param newNoteText - The new note text
 */
export async function updateNoteText(
  segmentID: string,
  blockID: string,
  newNoteText: string
): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    await db.runAsync(`
      UPDATE emojis 
      SET note = ?
      WHERE segmentID = ? AND blockID = ?
    `, newNoteText, segmentID, blockID);
    
    logger.info('📝 [NoteFunc] Updated note text:', { segmentID, blockID, noteLength: newNoteText.length });
  } catch (error) {
    logger.error('📝 [NoteFunc] Error updating note text:', error);
    throw error;
  }
}

/**
 * Delete only the note (keep emoji if it exists)
 * @param segmentID - The segment ID
 * @param blockID - The block ID
 */
export async function deleteNote(
  segmentID: string,
  blockID: string
): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    
    // Check if there's an emoji
    const result = await db.getFirstAsync<{ emoji: string | null }>(
      `SELECT emoji FROM emojis WHERE segmentID = ? AND blockID = ?`,
      segmentID,
      blockID
    );
    
    if (result?.emoji) {
      // If emoji exists, just clear the note
      await db.runAsync(`
        UPDATE emojis 
        SET note = ''
        WHERE segmentID = ? AND blockID = ?
      `, segmentID, blockID);
      logger.info('📝 [NoteFunc] Cleared note (kept emoji):', { segmentID, blockID });
    } else {
      // If no emoji, delete the entire row
      await db.runAsync(`
        DELETE FROM emojis 
        WHERE segmentID = ? AND blockID = ?
      `, segmentID, blockID);
      logger.info('📝 [NoteFunc] Deleted note-only reaction:', { segmentID, blockID });
    }
  } catch (error) {
    logger.error('📝 [NoteFunc] Error deleting note:', error);
    throw error;
  }
}

/**
 * Delete entire reaction (both emoji and note)
 * @param segmentID - The segment ID
 * @param blockID - The block ID
 */
export async function deleteReaction(
  segmentID: string,
  blockID: string
): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    await db.runAsync(`
      DELETE FROM emojis 
      WHERE segmentID = ? AND blockID = ?
    `, segmentID, blockID);
    
    logger.info('📝 [NoteFunc] Deleted entire reaction:', { segmentID, blockID });
  } catch (error) {
    logger.error('📝 [NoteFunc] Error deleting reaction:', error);
    throw error;
  }
}

/**
 * Get all reactions with notes
 * @returns Array of reactions that have notes
 */
export async function getAllNotedReactions(): Promise<Array<{
  id: number;
  segmentID: string;
  blockID: string;
  blockData: string;
  emoji: string | null;
  note: string;
}>> {
  try {
    const db = databaseManager.getDatabase();
    const results = await db.getAllAsync<{
      id: number;
      segmentID: string;
      blockID: string;
      blockData: string;
      emoji: string | null;
      note: string;
    }>(`
      SELECT id, segmentID, blockID, blockData, emoji, note 
      FROM emojis 
      WHERE note IS NOT NULL AND note != ''
      ORDER BY id DESC
    `);
    return results || [];
  } catch (error) {
    logger.error('📝 [NoteFunc] Error getting noted reactions:', error);
    return [];
  }
}

/**
 * Count reactions with notes
 * @returns Number of reactions that have notes
 */
export async function countNotedReactions(): Promise<number> {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM emojis WHERE note IS NOT NULL AND note != ''`
    );
    return result?.count || 0;
  } catch (error) {
    logger.error('📝 [NoteFunc] Error counting noted reactions:', error);
    return 0;
  }
}

/**
 * Check if a block has a note
 * @param segmentID - The segment ID
 * @param blockID - The block ID
 * @returns true if note exists and is not empty
 */
export async function hasNote(
  segmentID: string,
  blockID: string
): Promise<boolean> {
  try {
    const note = await getNote(segmentID, blockID);
    return note !== null && note.trim().length > 0;
  } catch (error) {
    logger.error('📝 [NoteFunc] Error checking if note exists:', error);
    return false;
  }
}

export default {
  saveReaction,
  getNote,
  getReaction,
  updateNoteText,
  deleteNote,
  deleteReaction,
  getAllNotedReactions,
  countNotedReactions,
  hasNote,
};

