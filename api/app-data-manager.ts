import logger from '@/utils/logger';
import { databaseManager } from './database-manager';
import { 
  markSegmentComplete as markSegmentCompleteDB,
  getSegmentCompletionStatus,
  startPlan as startPlanDB,
  startChallenge as startChallengeDB,
  getActivePlan,
  getActiveChallenges,
  resetPlanProgress,
  resetChallengeProgress
} from './sqlite';

// ============================================================================
// APP DATA MANAGER - SQLite-only data persistence layer
// ============================================================================

export interface PlanProgress {
  planId: string;
  completedSegments: string[];
  dateStarted: string;
  lastRead: string;
  isCompleted: boolean;
  isPaused: boolean;
  progressPercentage: number;
}

export interface ChallengeProgress {
  challengeId: string;
  completedSegments: string[];
  dateStarted: string;
  lastRead: string;
  isCompleted: boolean;
  isPaused: boolean;
  progressPercentage: number;
}

export interface CompletionData {
  isCompleted: boolean;
  color: string | null;
  context?: 'main' | 'plan' | 'challenge' | 'today';
  planId?: string;
  challengeId?: string;
}

export interface AppState {
  currentSegmentId: string;
  selectedReadingPlan: string;
  selectedReaderColor: string | null;
  lastReadSegment: string | null;
  emojiActions: number;
  language: string;
  version: string;
}

// ============================================================================
// APP STATE MANAGEMENT
// ============================================================================

/**
 * Get current app state from SQLite
 */
export async function getAppState(): Promise<AppState> {
  try {
    const db = databaseManager.getDatabase();
    
    // Create app_state table if it doesn't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_state (
        id INTEGER PRIMARY KEY NOT NULL,
        currentSegmentId TEXT NOT NULL DEFAULT 'S001',
        selectedReadingPlan TEXT NOT NULL DEFAULT '',
        selectedReaderColor TEXT,
        lastReadSegment TEXT,
        emojiActions INTEGER NOT NULL DEFAULT 0,
        language TEXT NOT NULL DEFAULT 'en',
        version TEXT NOT NULL DEFAULT 'NLT',
        lastUpdated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get current state or create default
    let state = await db.getFirstAsync<AppState>(
      'SELECT * FROM app_state WHERE id = 1'
    );

    if (!state) {
      // Create default state
      await db.runAsync(`
        INSERT INTO app_state (
          id, currentSegmentId, selectedReadingPlan, selectedReaderColor,
          lastReadSegment, emojiActions, language, version
        ) VALUES (1, 'S001', '', NULL, NULL, 0, 'en', 'NLT')
      `);
      
      state = {
        currentSegmentId: 'S001',
        selectedReadingPlan: '',
        selectedReaderColor: null,
        lastReadSegment: null,
        emojiActions: 0,
        language: 'en',
        version: 'NLT'
      };
    }

    return state;
  } catch (error) {
    logger.error('Error getting app state:', error);
    // Return safe defaults
    return {
      currentSegmentId: 'S001',
      selectedReadingPlan: '',
      selectedReaderColor: null,
      lastReadSegment: null,
      emojiActions: 0,
      language: 'en',
      version: 'NLT'
    };
  }
}

/**
 * Update app state in SQLite
 */
export async function updateAppState(updates: Partial<AppState>): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await db.runAsync(`
      UPDATE app_state 
      SET ${setClause}, lastUpdated = datetime('now')
      WHERE id = 1
    `, ...values);
  } catch (error) {
    logger.error('Error updating app state:', error);
    throw error;
  }
}

// ============================================================================
// COMPLETION TRACKING
// ============================================================================

/**
 * Mark segment as complete in SQLite
 */
export async function markSegmentComplete(
  segmentId: string,
  isComplete: boolean,
  color?: string | null,
  context: 'main' | 'plan' | 'challenge' | 'today' = 'main',
  planId?: string,
  challengeId?: string
): Promise<void> {
  try {
    if (isComplete) {
      await markSegmentCompleteDB(segmentId, context, planId, challengeId);
    } else {
      // Reset completion status
      const db = databaseManager.getDatabase();
      if (context === 'main') {
        await db.runAsync(
          'UPDATE completedSegments SET isCompleted = 0 WHERE segmentID = ?',
          [segmentId]
        );
      } else if (context === 'plan' && planId) {
        await db.runAsync(
          'UPDATE reading_plan_progress SET isCompleted = 0 WHERE planID = ? AND segmentID = ?',
          [planId, segmentId]
        );
      } else if (context === 'challenge' && challengeId) {
        await db.runAsync(
          'UPDATE reading_challenge_progress SET isCompleted = 0 WHERE challengeID = ? AND segmentID = ?',
          [challengeId, segmentId]
        );
      }
    }
  } catch (error) {
    logger.error('Error marking segment complete:', error);
    throw error;
  }
}

/**
 * Get completion status for a segment
 */
export async function getCompletionStatus(
  segmentId: string,
  context: 'main' | 'plan' | 'challenge' | 'today' = 'main',
  planId?: string,
  challengeId?: string
): Promise<CompletionData> {
  try {
    const result = await getSegmentCompletionStatus(segmentId, context, planId, challengeId);
    return {
      isCompleted: result.isCompleted,
      color: result.color,
      context,
      planId,
      challengeId
    };
  } catch (error) {
    logger.error('Error getting completion status:', error);
    return { isCompleted: false, color: null };
  }
}

/**
 * Get all completed segments for main context
 */
export async function getCompletedSegments(): Promise<Record<string, CompletionData>> {
  try {
    const db = databaseManager.getDatabase();
    const results = await db.getAllAsync<{ segmentID: string }>(
      'SELECT segmentID FROM completedSegments WHERE isCompleted = 1'
    );
    
    const completedSegments: Record<string, CompletionData> = {};
    for (const result of results) {
      completedSegments[result.segmentID] = {
        isCompleted: true,
        color: null,
        context: 'main'
      };
    }
    
    return completedSegments;
  } catch (error) {
    logger.error('Error getting completed segments:', error);
    return {};
  }
}

// ============================================================================
// PLAN MANAGEMENT
// ============================================================================

/**
 * Start a reading plan
 */
export async function startPlan(planId: string): Promise<PlanProgress> {
  try {
    await startPlanDB(planId);
    
    const planProgress: PlanProgress = {
      planId,
      completedSegments: [],
      dateStarted: new Date().toISOString(),
      lastRead: new Date().toISOString(),
      isCompleted: false,
      isPaused: false,
      progressPercentage: 0
    };
    
    return planProgress;
  } catch (error) {
    logger.error('Error starting plan:', error);
    throw error;
  }
}

/**
 * Get active plan from SQLite
 */
export async function getActivePlanData(): Promise<PlanProgress | null> {
  try {
    const activePlan = await getActivePlan();
    if (!activePlan) return null;
    
    return {
      planId: activePlan.itemID,
      completedSegments: [], // This would need to be fetched separately
      dateStarted: activePlan.startDate || new Date().toISOString(),
      lastRead: activePlan.lastUpdated || new Date().toISOString(),
      isCompleted: activePlan.isCompleted === 1,
      isPaused: activePlan.isPaused === 1,
      progressPercentage: activePlan.progressPercentage || 0
    };
  } catch (error) {
    logger.error('Error getting active plan:', error);
    return null;
  }
}

/**
 * Update plan status
 */
export async function updatePlanStatus(planId: string, updates: Partial<PlanProgress>): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    if (updates.isPaused !== undefined) {
      updateFields.push('isPaused = ?');
      updateValues.push(updates.isPaused ? 1 : 0);
    }
    
    if (updates.isCompleted !== undefined) {
      updateFields.push('isCompleted = ?');
      updateValues.push(updates.isCompleted ? 1 : 0);
    }
    
    if (updates.progressPercentage !== undefined) {
      updateFields.push('progressPercentage = ?');
      updateValues.push(updates.progressPercentage);
    }
    
    if (updateFields.length > 0) {
      updateFields.push('lastUpdated = datetime("now")');
      updateValues.push(planId);
      
      await db.runAsync(`
        UPDATE plan_challenge_status 
        SET ${updateFields.join(', ')} 
        WHERE itemID = ? AND itemType = 'plan'
      `, ...updateValues);
    }
  } catch (error) {
    logger.error('Error updating plan status:', error);
    throw error;
  }
}

// ============================================================================
// CHALLENGE MANAGEMENT
// ============================================================================

/**
 * Start a reading challenge
 */
export async function startChallenge(challengeId: string): Promise<ChallengeProgress> {
  try {
    await startChallengeDB(challengeId);
    
    const challengeProgress: ChallengeProgress = {
      challengeId,
      completedSegments: [],
      dateStarted: new Date().toISOString(),
      lastRead: new Date().toISOString(),
      isCompleted: false,
      isPaused: false,
      progressPercentage: 0
    };
    
    return challengeProgress;
  } catch (error) {
    logger.error('Error starting challenge:', error);
    throw error;
  }
}

/**
 * Get active challenges from SQLite
 */
export async function getActiveChallengesData(): Promise<Record<string, ChallengeProgress>> {
  try {
    const activeChallenges = await getActiveChallenges();
    const challengesData: Record<string, ChallengeProgress> = {};
    
    for (const challenge of activeChallenges) {
      challengesData[challenge.itemID] = {
        challengeId: challenge.itemID,
        completedSegments: [], // This would need to be fetched separately
        dateStarted: challenge.startDate || new Date().toISOString(),
        lastRead: challenge.lastUpdated || new Date().toISOString(),
        isCompleted: challenge.isCompleted === 1,
        isPaused: challenge.isPaused === 1,
        progressPercentage: challenge.progressPercentage || 0
      };
    }
    
    return challengesData;
  } catch (error) {
    logger.error('Error getting active challenges:', error);
    return {};
  }
}

/**
 * Update challenge status
 */
export async function updateChallengeStatus(challengeId: string, updates: Partial<ChallengeProgress>): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    if (updates.isPaused !== undefined) {
      updateFields.push('isPaused = ?');
      updateValues.push(updates.isPaused ? 1 : 0);
    }
    
    if (updates.isCompleted !== undefined) {
      updateFields.push('isCompleted = ?');
      updateValues.push(updates.isCompleted ? 1 : 0);
    }
    
    if (updates.progressPercentage !== undefined) {
      updateFields.push('progressPercentage = ?');
      updateValues.push(updates.progressPercentage);
    }
    
    if (updateFields.length > 0) {
      updateFields.push('lastUpdated = datetime("now")');
      updateValues.push(challengeId);
      
      await db.runAsync(`
        UPDATE plan_challenge_status 
        SET ${updateFields.join(', ')} 
        WHERE itemID = ? AND itemType = 'challenge'
      `, ...updateValues);
    }
  } catch (error) {
    logger.error('Error updating challenge status:', error);
    throw error;
  }
}

// ============================================================================
// READ SEGMENTS TRACKING
// ============================================================================

/**
 * Mark segment as read (not necessarily completed)
 */
export async function markSegmentAsRead(segmentId: string, isRead: boolean): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    
    if (isRead) {
      // Add to read count
      const currentDate = new Date().toISOString();
      await db.runAsync(`
        INSERT OR REPLACE INTO segment_read_count (
          segmentID, totalReads, lastReadDate
        ) VALUES (
          ?, 
          COALESCE((SELECT totalReads FROM segment_read_count WHERE segmentID = ?), 0) + 1,
          ?
        )
      `, segmentId, segmentId, currentDate);
    } else {
      // Optionally decrease read count or remove entry
      await db.runAsync(`
        UPDATE segment_read_count 
        SET totalReads = CASE 
          WHEN totalReads > 1 THEN totalReads - 1 
          ELSE 0 
        END
        WHERE segmentID = ?
      `, segmentId);
    }
  } catch (error) {
    logger.error('Error marking segment as read:', error);
    throw error;
  }
}

/**
 * Get read segments list
 */
export async function getReadSegments(): Promise<string[]> {
  try {
    const db = databaseManager.getDatabase();
    const results = await db.getAllAsync<{ segmentID: string }>(
      'SELECT segmentID FROM segment_read_count WHERE totalReads > 0'
    );
    
    return results.map(result => result.segmentID);
  } catch (error) {
    logger.error('Error getting read segments:', error);
    return [];
  }
}
