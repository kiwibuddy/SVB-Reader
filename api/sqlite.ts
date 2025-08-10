import { databaseManager } from './database-manager';
import logger from '@/utils/logger';import { BibleBlock } from "@/types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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

interface CountResult {
  count: number;
  currentStreak?: number;
  longestStreak?: number;
}

interface EmojiStats {
  total: number;
  heart: number;
  prayer: number;
  question: number;
  thumbsUp: number;
}

interface BookProgress {
  completed: number;
  total: number;
  percentage: number;
}

interface TestamentProgress {
  completed: number;
  total: number;
}

interface EmojiCollection {
  complete: boolean;
  used: string[];
}

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

// Initialize database when this module is imported
databaseManager.initialize().catch(error => {
  logger.error("Failed to initialize database:", error);
});

// ============================================================================
// MAIN COMPLETION TRACKING FUNCTIONS
// ============================================================================

export async function markSegmentComplete(
  segmentID: string,
  context: 'main' | 'plan' | 'challenge' | 'today' = 'main',
  planID?: string | null,
  challengeID?: string | null
): Promise<void> {
  // Introduction segments should never be marked as complete
  if (segmentID.startsWith('I')) {
    return;
  }
  try {
    const db = databaseManager.getDatabase();
    const currentDate = new Date().toISOString();

    // Always record in legacy completion table for history
    await db.runAsync(`
      INSERT INTO segment_completion (
        segmentID, 
        completionType,
        planID,
        challengeID,
        completionDate
      ) VALUES (?, ?, ?, ?, ?)
    `, segmentID, context, planID || null, challengeID || null, currentDate);

    // Global read count is incremented on EVERY completion regardless of context
    // This gives users accurate total read counts across all reading modes
    logger.info(`📊 [ReadCount] Incrementing global count for segment ${segmentID} (${context} completion)`);
    await db.runAsync(`
      INSERT OR REPLACE INTO segment_read_count (
        segmentID,
        totalReads,
        lastReadDate
      ) VALUES (
        ?,
        COALESCE((SELECT totalReads FROM segment_read_count WHERE segmentID = ?), 0) + 1,
        ?
      )
    `, segmentID, segmentID, currentDate);

    // Handle context-specific completion
    if (context === 'main') {
      // Update main context completion (can be repeated)
      await db.runAsync(`
        INSERT OR REPLACE INTO completedSegments (
          segmentID,
          isCompleted,
          completionDate
        ) VALUES (?, 1, ?)
      `, segmentID, currentDate);
      
    } else if (context === 'plan' && planID) {
      // Update plan-specific progress (track plan-specific completion count)
      await db.runAsync(`
        INSERT OR REPLACE INTO reading_plan_progress (
        planID,
          segmentID,
          completionDate,
        isCompleted,
          readCount,
          lastReadDate
        ) VALUES (
          ?, ?, ?, 1,
          COALESCE((SELECT readCount FROM reading_plan_progress WHERE planID = ? AND segmentID = ?), 0) + 1,
          ?
        )
      `, planID, segmentID, currentDate, planID, segmentID, currentDate);
      
      // Update overall plan status
      await updatePlanStatus(planID);
      
    } else if (context === 'challenge' && challengeID) {
      // Update challenge-specific progress (track challenge-specific completion count)
      await db.runAsync(`
        INSERT OR REPLACE INTO reading_challenge_progress (
        challengeID,
          segmentID,
          completionDate,
        isCompleted,
          readCount,
          lastReadDate
        ) VALUES (
          ?, ?, ?, 1,
          COALESCE((SELECT readCount FROM reading_challenge_progress WHERE challengeID = ? AND segmentID = ?), 0) + 1,
          ?
        )
      `, challengeID, segmentID, currentDate, challengeID, segmentID, currentDate);
      
      // Update overall challenge status
      await updateChallengeStatus(challengeID);
    } else if (context === 'today') {
      // For today's reading, mark as complete in main context (today's reading is tracked by date)
      await db.runAsync(`
        INSERT OR REPLACE INTO completedSegments (
          segmentID,
          isCompleted,
          completionDate
        ) VALUES (?, 1, ?)
      `, segmentID, currentDate);
    }

    // Update daily activity and streak
    await updateDailyActivity(segmentID);
    await updateStreak();

  } catch (error) {
    logger.error("Error marking segment complete:", error);
    throw error;
  }
}

// Record a group-mode completion for analytics/achievements
export async function recordGroupCompletion(
  segmentID: string,
  sessionId: string,
  storyId: string,
  userRole: string,
  isHost: boolean
): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    const currentDate = new Date().toISOString();
    
    // Record group participation
    await db.runAsync(
      `INSERT INTO group_segment_completion (segmentID, sessionId, storyId, userRole, isHost, completedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      segmentID, sessionId, storyId, userRole, isHost ? 1 : 0, currentDate
    );
    
    // Also increment global read count for group completions
    logger.info(`📊 [ReadCount] Incrementing global count for segment ${segmentID} (group completion)`);
    await db.runAsync(`
      INSERT OR REPLACE INTO segment_read_count (
        segmentID,
        totalReads,
        lastReadDate
      ) VALUES (
        ?,
        COALESCE((SELECT totalReads FROM segment_read_count WHERE segmentID = ?), 0) + 1,
        ?
      )
    `, segmentID, segmentID, currentDate);
    
  } catch (error) {
    logger.error('Error recording group completion:', error);
  }
}

// Count how many joiners (non-host) have recorded a completion for a given session/story
export async function getGroupJoinerCompletionCount(
  sessionId: string,
  storyId: string
): Promise<number> {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM group_segment_completion WHERE sessionId = ? AND storyId = ? AND isHost = 0`,
      sessionId,
      storyId
    );
    return result?.count || 0;
  } catch (error) {
    logger.error('Error counting group joiner completions:', error);
    return 0;
  }
}

export const getSegmentCompletionStatus = async (
  segmentId: string,
  context: 'main' | 'plan' | 'challenge' | 'today' = 'main',
  planId?: string,
  challengeId?: string
): Promise<CompletionData> => {
  // Introduction segments should never be tracked for completion
  if (segmentId.startsWith('I')) {
    return {
      isCompleted: false,
      color: null
    };
  }
  try {
    const db = databaseManager.getDatabase();
    let result: any;

    if (context === 'main') {
      result = await db.getFirstAsync<{ isCompleted: number }>(
        'SELECT isCompleted FROM completedSegments WHERE segmentID = ?',
        [segmentId]
      );
    } else if (context === 'plan' && planId) {
      result = await db.getFirstAsync<{ isCompleted: number }>(
        'SELECT isCompleted FROM reading_plan_progress WHERE planID = ? AND segmentID = ?',
        [planId, segmentId]
      );
    } else if (context === 'challenge' && challengeId) {
      result = await db.getFirstAsync<{ isCompleted: number }>(
        'SELECT isCompleted FROM reading_challenge_progress WHERE challengeID = ? AND segmentID = ?',
        [challengeId, segmentId]
      );
    } else if (context === 'today') {
      // For today's reading, check if it was completed today
      const today = new Date().toISOString().split('T')[0];
                  result = await db.getFirstAsync<{ isCurrentlyCompleted: number }>(
              'SELECT isCurrentlyCompleted FROM segment_completion WHERE segmentID = ? AND completionDate LIKE ? AND completionType = "main"',
              [segmentId, `${today}%`]
            );
    }

    // Handle different result types based on context
    if (context === 'today') {
      return {
        isCompleted: result?.isCurrentlyCompleted === 1,
        color: null
      };
    } else {
      return {
        isCompleted: result?.isCompleted === 1,
        color: null
      };
    }
  } catch (error) {
    logger.error("Error getting segment completion status:", error);
    return { isCompleted: false, color: null };
  }
};

// ============================================================================
// PROGRESS FUNCTIONS
// ============================================================================

export async function getPlanProgress(planID: string): Promise<PlanProgress> {
  try {
    const db = databaseManager.getDatabase();
    
    // Get plan data from JSON to determine total segments
    const readingPlansData = require('../assets/data/ReadingPlansChallenges.json');
    const plan = readingPlansData.plans.find((p: any) => p.id === planID);
    
    if (!plan) {
      return {
        totalSegments: 0,
        completedSegments: 0,
        progressPercentage: 0,
        isCompleted: false,
        completedSegmentIds: []
      };
    }

    // Calculate total segments in plan from the JSON structure
    const totalSegments = Object.values(plan.segments).reduce((total: number, book: any) => {
      return total + (book?.segments?.length || 0);
    }, 0);
    
    // Get completed segments for this plan (excluding introduction segments)
    const completedResult = await db.getAllAsync<{ segmentID: string }>(
      'SELECT segmentID FROM reading_plan_progress WHERE planID = ? AND isCompleted = 1 AND segmentID NOT LIKE "I%"',
      [planID]
    );
    
    const completedSegments = completedResult?.length || 0;
    const progressPercentage = totalSegments > 0 ? (completedSegments / totalSegments) * 100 : 0;
    const isCompleted = completedSegments >= totalSegments && totalSegments > 0;
    
    return {
      totalSegments,
      completedSegments,
      progressPercentage,
      isCompleted,
      completedSegmentIds: completedResult?.map(r => r.segmentID) || []
    };
  } catch (error) {
    logger.error("Error getting plan progress:", error);
    return {
      totalSegments: 0,
      completedSegments: 0,
      progressPercentage: 0,
      isCompleted: false,
      completedSegmentIds: []
    };
  }
}

export async function getChallengeProgress(challengeID: string): Promise<ChallengeProgress> {
  try {
    const db = databaseManager.getDatabase();
    
    // Get challenge data from JSON to determine total segments
    const readingPlansData = require('../assets/data/ReadingPlansChallenges.json');
    const challenge = readingPlansData.challenges.find((c: any) => c.id === challengeID);
    
    if (!challenge) {
      return {
        totalSegments: 0,
        completedSegments: 0,
        progressPercentage: 0,
        isCompleted: false,
        completedSegmentIds: []
      };
    }

    // Calculate total segments in challenge from the JSON structure
    const totalSegments = Object.values(challenge.segments).reduce((total: number, book: any) => {
      return total + (book?.segments?.length || 0);
    }, 0);
    
    // Get completed segments for this challenge (excluding introduction segments)
    const completedResult = await db.getAllAsync<{ segmentID: string }>(
      'SELECT segmentID FROM reading_challenge_progress WHERE challengeID = ? AND isCompleted = 1 AND segmentID NOT LIKE "I%"',
      [challengeID]
    );
    
    const completedSegments = completedResult?.length || 0;
    const progressPercentage = totalSegments > 0 ? (completedSegments / totalSegments) * 100 : 0;
    const isCompleted = completedSegments >= totalSegments && totalSegments > 0;
    
    return {
      totalSegments,
      completedSegments,
      progressPercentage,
      isCompleted,
      completedSegmentIds: completedResult?.map(r => r.segmentID) || []
    };
  } catch (error) {
    logger.error("Error getting challenge progress:", error);
    return {
      totalSegments: 0,
      completedSegments: 0,
      progressPercentage: 0,
      isCompleted: false,
      completedSegmentIds: []
    };
  }
}

// ============================================================================
// ESSENTIAL FUNCTIONS
// ============================================================================

export async function getBestStreak(): Promise<number> {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.getFirstAsync<{ longestStreak: number }>(
      'SELECT longestStreak FROM streak_data LIMIT 1'
    );
    return result?.longestStreak || 0;
  } catch (error) {
    logger.error("Error getting best streak:", error);
    return 0;
  }
}

export async function getCurrentStreak(): Promise<number> {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.getFirstAsync<{ currentStreak: number }>(
      'SELECT currentStreak FROM streak_data LIMIT 1'
    );
    return result?.currentStreak || 0;
  } catch (error) {
    logger.error("Error getting current streak:", error);
    return 0;
  }
}

export const getCompletedSegmentsCount = async () => {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.getFirstAsync<CountResult>(`
      SELECT COUNT(*) as count FROM completedSegments WHERE isCompleted = 1
    `);
    return result?.count || 0;
  } catch (error) {
    logger.error("Error getting completed segments count:", error);
    return 0;
  }
};

export const getTotalSegmentsCount = async () => {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.getFirstAsync<CountResult>(`
      SELECT COUNT(*) as count FROM segments
    `);
    return result?.count || 0;
  } catch (error) {
    logger.error("Error getting total segments count:", error);
    return 0;
  }
};

export const getReadingStreak = async () => {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.getFirstAsync<CountResult>(`
      SELECT currentStreak, longestStreak FROM streak_data LIMIT 1
    `);
    return {
      currentStreak: result?.currentStreak || 0,
      longestStreak: result?.longestStreak || 0
    };
  } catch (error) {
    logger.error("Error getting reading streak:", error);
    return { currentStreak: 0, longestStreak: 0 };
  }
};

export async function getEmojiStats(): Promise<EmojiStats> {
  try {
    const db = databaseManager.getDatabase();
    const results = await db.getAllAsync<{ emoji: string }>(
      'SELECT emoji FROM emojis'
    );
    
    const total = results?.length || 0;
    const heart = results?.filter(r => r.emoji === '❤️').length || 0;
    const prayer = results?.filter(r => r.emoji === '🙏').length || 0;
    const question = results?.filter(r => r.emoji === '🤔').length || 0;
    const thumbsUp = results?.filter(r => r.emoji === '👍').length || 0;
    
    return { total, heart, prayer, question, thumbsUp };
  } catch (error) {
    logger.error("Error getting emoji stats:", error);
    return { total: 0, heart: 0, prayer: 0, question: 0, thumbsUp: 0 };
  }
}

export const getSourceStats = async () => {
  try {
    const db = databaseManager.getDatabase();
    const results = await db.getAllAsync<{ color: string }>(`
      SELECT color FROM sourceReadings
    `);
    
    const total = results?.length || 0;
    const black = results?.filter(r => r.color === 'black').length || 0;
    const red = results?.filter(r => r.color === 'red').length || 0;
    const green = results?.filter(r => r.color === 'green').length || 0;
    const blue = results?.filter(r => r.color === 'blue').length || 0;
    
    return { total, black, red, green, blue };
  } catch (error) {
    logger.error("Error getting source stats:", error);
    return { total: 0, black: 0, red: 0, green: 0, blue: 0 };
  }
};

// ============================================================================
// EMOJI FUNCTIONS
// ============================================================================

export async function addEmoji(
  segmentID: string,
  blockID: string,
  blockData: BibleBlock,
  emoji: string
) {
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
    `, segmentID, blockID, JSON.stringify(blockData), emoji, '');
  } catch (error) {
    logger.error("Error adding emoji:", error);
  }
}

export async function deleteEmoji(segmentID: string, blockID: string) {
  try {
    const db = databaseManager.getDatabase();
    await db.runAsync(
      'DELETE FROM emojis WHERE segmentID = ? AND blockID = ?',
      segmentID,
      blockID
    );
  } catch (error) {
    logger.error("Error deleting emoji:", error);
  }
}

export async function getEmoji(segmentID: string, blockID: string): Promise<string | null> {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.getFirstAsync<{ emoji: string }>(
      `SELECT emoji FROM emojis WHERE segmentID = ? AND blockID = ?`,
      segmentID,
      blockID
    );
    return result?.emoji || null;
  } catch (error) {
    logger.error("Error getting emoji:", error);
    return null;
  }
}

export async function getEmojis() {
  try {
    const db = databaseManager.getDatabase();
    const results = await db.getAllAsync(`
      SELECT id, segmentID, blockID, blockData, emoji, note FROM emojis
    `);
    return results || [];
  } catch (error) {
    logger.error("Error getting emojis:", error);
    return [];
  }
}

// ============================================================================
// ACHIEVEMENT FUNCTIONS
// ============================================================================

export async function unlockAchievement(
  achievementID: string,
  title: string,
  description: string,
  progress?: number,
  maxProgress?: number
) {
  try {
    const db = databaseManager.getDatabase();
    await db.runAsync(`
      INSERT OR REPLACE INTO achievements (
        achievementID,
        title,
        description,
        isCompleted,
        progress,
        maxProgress,
        unlockDate
      ) VALUES (?, ?, ?, 1, ?, ?, datetime('now'))
    `, achievementID, title, description, progress || 1, maxProgress || 1);
  } catch (error) {
    logger.error("Error unlocking achievement:", error);
  }
}

export async function getAchievements() {
  try {
    const db = databaseManager.getDatabase();
    const results = await db.getAllAsync(`
      SELECT * FROM achievements ORDER BY unlockDate DESC
    `);
    return results || [];
  } catch (error) {
    logger.error("Error getting achievements:", error);
    return [];
  }
}

// ============================================================================
// PLAN AND CHALLENGE MANAGEMENT
// ============================================================================

export async function resetSegmentCompletion(
  segmentID: string,
  context: 'main' | 'plan' | 'challenge' | 'today' = 'main',
  planID?: string | null,
  challengeID?: string | null
): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    
    if (context === 'main') {
      await db.runAsync(`
        UPDATE completedSegments SET isCompleted = 0 WHERE segmentID = ?
      `, [segmentID]);
    } else if (context === 'plan' && planID) {
      await db.runAsync(`
        UPDATE reading_plan_progress SET isCompleted = 0 WHERE planID = ? AND segmentID = ?
      `, [planID, segmentID]);
    } else if (context === 'challenge' && challengeID) {
      await db.runAsync(`
        UPDATE reading_challenge_progress SET isCompleted = 0 WHERE challengeID = ? AND segmentID = ?
      `, [challengeID, segmentID]);
    }
  } catch (error) {
    logger.error("Error resetting segment completion:", error);
  }
}

export async function startPlan(planID: string): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    await db.runAsync(`
      INSERT OR REPLACE INTO plan_challenge_status (
        itemID,
        itemType,
        isActive,
        isCompleted,
        progressPercentage,
        startDate,
        lastUpdated
      ) VALUES (?, 'plan', 1, 0, 0, datetime('now'), datetime('now'))
    `, planID);
  } catch (error) {
    logger.error("Error starting plan:", error);
  }
}

export async function pausePlan(planID: string): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    await db.runAsync(`
      UPDATE plan_challenge_status 
      SET isActive = 0, lastUpdated = datetime('now')
      WHERE itemID = ? AND itemType = 'plan'
    `, planID);
  } catch (error) {
    logger.error("Error pausing plan:", error);
  }
}

export async function resumePlan(planID: string): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    await db.runAsync(`
      UPDATE plan_challenge_status 
      SET isActive = 1, lastUpdated = datetime('now')
      WHERE itemID = ? AND itemType = 'plan'
    `, planID);
  } catch (error) {
    logger.error("Error resuming plan:", error);
  }
}

export async function endPlan(planID: string): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    // Mark plan as completed and inactive
    await db.runAsync(`
      UPDATE plan_challenge_status 
      SET isActive = 0, isCompleted = 1, lastUpdated = datetime('now')
      WHERE itemID = ? AND itemType = 'plan'
    `, planID);
    
    // Reset all plan-specific segment completions
    await db.runAsync(`
      DELETE FROM segment_completion 
      WHERE planID = ? AND completionType = 'plan'
    `, planID);
  } catch (error) {
    logger.error("Error ending plan:", error);
  }
}

export async function startChallenge(challengeID: string): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    await db.runAsync(`
      INSERT OR REPLACE INTO plan_challenge_status (
        itemID,
        itemType,
        isActive,
        isCompleted,
        progressPercentage,
        startDate,
        lastUpdated
      ) VALUES (?, 'challenge', 1, 0, 0, datetime('now'), datetime('now'))
    `, challengeID);
  } catch (error) {
    logger.error("Error starting challenge:", error);
  }
}

export async function pauseChallenge(challengeID: string): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    await db.runAsync(`
      UPDATE plan_challenge_status 
      SET isActive = 0, lastUpdated = datetime('now')
      WHERE itemID = ? AND itemType = 'challenge'
    `, challengeID);
  } catch (error) {
    logger.error("Error pausing challenge:", error);
  }
}

export async function resumeChallenge(challengeID: string): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    await db.runAsync(`
      UPDATE plan_challenge_status 
      SET isActive = 1, lastUpdated = datetime('now')
      WHERE itemID = ? AND itemType = 'challenge'
    `, challengeID);
  } catch (error) {
    logger.error("Error resuming challenge:", error);
  }
}

export async function endChallenge(challengeID: string): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    // Mark challenge as completed and inactive
    await db.runAsync(`
      UPDATE plan_challenge_status 
      SET isActive = 0, isCompleted = 1, lastUpdated = datetime('now')
      WHERE itemID = ? AND itemType = 'challenge'
    `, challengeID);
    
    // Reset all challenge-specific segment completions
    await db.runAsync(`
      DELETE FROM segment_completion 
      WHERE challengeID = ? AND completionType = 'challenge'
    `, challengeID);
  } catch (error) {
    logger.error("Error ending challenge:", error);
  }
}

export async function getActivePlan(): Promise<any | null> {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM plan_challenge_status WHERE itemType = "plan" AND isActive = 1 LIMIT 1'
    );
    return result || null;
  } catch (error) {
    logger.error("Error getting active plan:", error);
    return null;
  }
}

export async function getActiveChallenges(): Promise<any[]> {
  try {
    const db = databaseManager.getDatabase();
    const results = await db.getAllAsync<any>(
      'SELECT * FROM plan_challenge_status WHERE itemType = "challenge" AND isActive = 1'
    );
    return results || [];
  } catch (error) {
    logger.error("Error getting active challenges:", error);
    return [];
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function updatePlanStatus(planID: string): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    const progress = await getPlanProgress(planID);
    
    await db.runAsync(`
      INSERT OR REPLACE INTO plan_challenge_status (
        itemID,
        itemType,
        isActive,
        isCompleted,
        progressPercentage,
        lastUpdated
      ) VALUES (?, 'plan', 1, ?, ?, datetime('now'))
    `, planID, progress.isCompleted ? 1 : 0, progress.progressPercentage);
  } catch (error) {
    logger.error("Error updating plan status:", error);
  }
}

async function updateChallengeStatus(challengeID: string): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    const progress = await getChallengeProgress(challengeID);
    
    await db.runAsync(`
      INSERT OR REPLACE INTO plan_challenge_status (
        itemID,
        itemType,
        isActive,
        isCompleted,
        progressPercentage,
        lastUpdated
      ) VALUES (?, 'challenge', 1, ?, ?, datetime('now'))
    `, challengeID, progress.isCompleted ? 1 : 0, progress.progressPercentage);
  } catch (error) {
    logger.error("Error updating challenge status:", error);
  }
}

export async function updateDailyActivity(segmentId: string) {
  try {
    const db = databaseManager.getDatabase();
    const today = new Date().toISOString().split('T')[0];
    
    await db.runAsync(`
      INSERT OR REPLACE INTO daily_activity (date, segmentCount, lastUpdated)
      VALUES (?, 
        COALESCE((SELECT segmentCount FROM daily_activity WHERE date = ?), 0) + 1,
        datetime('now')
      )
    `, today, today);
  } catch (error) {
    logger.error("Error updating daily activity:", error);
  }
}

export async function getSegmentReadCount(segmentID: string): Promise<number> {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.getFirstAsync<{ totalReads: number }>(
      'SELECT totalReads FROM segment_read_count WHERE segmentID = ?',
      [segmentID]
    );
    return result?.totalReads || 0;
  } catch (error) {
    logger.error("Error getting segment read count:", error);
    return 0;
  }
}

async function updateStreak() {
  try {
    const db = databaseManager.getDatabase();
    const today = new Date().toISOString().split('T')[0];
    
    const streakData = await db.getFirstAsync<{
      currentStreak: number;
      longestStreak: number;
      lastReadDate: string;
    }>(`
      SELECT currentStreak, longestStreak, lastReadDate FROM streak_data LIMIT 1
    `);

    let currentStreak = streakData?.currentStreak || 0;
    let longestStreak = streakData?.longestStreak || 0;
    const lastReadDate = streakData?.lastReadDate;

    if (lastReadDate === today) {
      // Already read today, no change to streak
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastReadDate === yesterdayStr) {
      // Consecutive day, increment streak
      currentStreak++;
    } else if (lastReadDate !== today) {
      // Break in streak, reset to 1
      currentStreak = 1;
    }

    // Update longest streak if current is longer
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    await db.runAsync(`
      UPDATE streak_data
      SET currentStreak = ?,
          longestStreak = ?,
          lastReadDate = ?
      WHERE id = 1
    `, currentStreak, longestStreak, today);
  } catch (error) {
    logger.error("Error updating streak:", error);
  }
}

// ============================================================================
// MISSING FUNCTIONS FOR ACHIEVEMENTS PAGE
// ============================================================================

export async function getLongestSession(): Promise<number> {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.getFirstAsync<{ maxSegments: number }>(
      'SELECT MAX(segmentCount) as maxSegments FROM reading_sessions'
    );
    return result?.maxSegments || 0;
  } catch (error) {
    logger.error("Error getting longest session:", error);
    return 0;
  }
}

export async function getCompletedBooks(): Promise<string[]> {
  try {
    const db = databaseManager.getDatabase();
    const results = await db.getAllAsync<{ bookId: string }>(
      'SELECT bookId FROM book_completion WHERE isCompleted = 1'
    );
    return results?.map(r => r.bookId) || [];
  } catch (error) {
    logger.error("Error getting completed books:", error);
    return [];
  }
}

export async function getBookProgress(bookId: string): Promise<BookProgress> {
  try {
    const db = databaseManager.getDatabase();
    
    // Get total segments for this book
    const totalResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM segments WHERE bookID = ?',
      [bookId]
    );
    
    // Count completed segments for this book
    const completedCount = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM completedSegments 
      WHERE segmentID IN (
        SELECT segmentID FROM segments WHERE bookID = ?
      ) AND isCompleted = 1
    `, bookId);
    
    const total = totalResult?.count || 0;
    const completed = completedCount?.count || 0;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return { completed, total, percentage };
  } catch (error) {
    logger.error("Error getting book progress:", error);
    return { completed: 0, total: 0, percentage: 0 };
  }
}

export async function checkEmojiCollection(): Promise<EmojiCollection> {
  try {
    const db = databaseManager.getDatabase();
    const emojis = ['❤️', '👍', '🤔', '🙏'];
    const results = await db.getAllAsync<{ emoji: string }>(
      'SELECT DISTINCT emoji FROM emojis WHERE emoji IN (?, ?, ?, ?)',
      emojis
    );
    
    const used = results?.map(r => r.emoji) || [];
    const complete = used.length === emojis.length;
    
    return { complete, used };
  } catch (error) {
    logger.error("Error checking emoji collection:", error);
    return { complete: false, used: [] };
  }
}

export async function getOldTestamentProgress(): Promise<TestamentProgress> {
  try {
    const db = databaseManager.getDatabase();
    const otBooks = ['Gen', 'Exo', 'Lev', 'Num', 'Deu', 'Jos', 'Jdg', 'Rut', '1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch', 'Ezr', 'Neh', 'Est', 'Job', 'Psa', 'Pro', 'Ecc', 'SoS', 'Isa', 'Jer', 'Lam', 'Eze', 'Dan', 'Hos', 'Joe', 'Amo', 'Oba', 'Jon', 'Mic', 'Nah', 'Hab', 'Zep', 'Hag', 'Zec', 'Mal'];
    
    const completed = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM book_completion 
      WHERE bookId IN (${otBooks.map(() => '?').join(',')}) AND isCompleted = 1
    `, ...otBooks);
    
    return { completed: completed?.count || 0, total: otBooks.length };
  } catch (error) {
    logger.error("Error getting Old Testament progress:", error);
    return { completed: 0, total: 39 };
  }
}

export async function getNewTestamentProgress(): Promise<TestamentProgress> {
  try {
    const db = databaseManager.getDatabase();
    const ntBooks = ['Mat', 'Mar', 'Luk', 'Joh', 'Act', 'Rom', '1Co', '2Co', 'Gal', 'Eph', 'Php', 'Col', '1Th', '2Th', '1Ti', '2Ti', 'Tit', 'Phm', 'Heb', 'Jam', '1Pe', '2Pe', '1Jn', '2Jn', '3Jn', 'Jud', 'Rev'];
    
    const completed = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM book_completion 
      WHERE bookId IN (${ntBooks.map(() => '?').join(',')}) AND isCompleted = 1
    `, ...ntBooks);
    
    return { completed: completed?.count || 0, total: ntBooks.length };
  } catch (error) {
    logger.error("Error getting New Testament progress:", error);
    return { completed: 0, total: 27 };
  }
}

// ============================================================================
// READING SESSION FUNCTIONS
// ============================================================================

export async function startReadingSession() {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.runAsync(`
      INSERT INTO reading_sessions (startTime, endTime, segmentCount, sessionDate)
      VALUES (datetime('now'), datetime('now'), 0, date('now'))
    `);
    return result.lastInsertRowId;
  } catch (error) {
    logger.error("Error starting reading session:", error);
    return null;
  }
}

export async function updateReadingSession(sessionId: number, segmentCount: number) {
  try {
    const db = databaseManager.getDatabase();
    await db.runAsync(`
      UPDATE reading_sessions
      SET endTime = datetime('now'), segmentCount = ?
      WHERE id = ?
    `, segmentCount, sessionId);
  } catch (error) {
    logger.error("Error updating reading session:", error);
  }
}

// ============================================================================
// BOOK COMPLETION FUNCTIONS
// ============================================================================

export async function checkBookCompletion(bookId: string): Promise<boolean> {
  try {
    const db = databaseManager.getDatabase();
    
    // Get all segments for this book
    const bookSegments = await db.getAllAsync<{ segmentID: string }>(
      'SELECT segmentID FROM segments WHERE bookID = ?',
      [bookId]
    );
    
    if (bookSegments.length === 0) return false;
    
    const completedCount = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM completedSegments 
      WHERE segmentID IN (${bookSegments.map(() => '?').join(',')}) AND isCompleted = 1
    `, ...bookSegments.map(s => s.segmentID));
    
    const isCompleted = (completedCount?.count || 0) >= bookSegments.length;
    
    if (isCompleted) {
      await db.runAsync(`
        INSERT OR REPLACE INTO book_completion (bookId, isCompleted, completionDate)
        VALUES (?, ?, datetime('now'))
      `, bookId, 1);
    }
    
    return isCompleted;
  } catch (error) {
    logger.error("Error checking book completion:", error);
    return false;
  }
}

export async function getBookCompletionStatus(bookId: string): Promise<boolean> {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.getFirstAsync<{ isCompleted: number }>(
      'SELECT isCompleted FROM book_completion WHERE bookId = ?',
      [bookId]
    );
    return result?.isCompleted === 1;
  } catch (error) {
    logger.error("Error getting book completion status:", error);
    return false;
  }
}

// ============================================================================
// PLAN AND CHALLENGE RESET FUNCTIONS
// ============================================================================

export async function resetPlanProgress(planID: string): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    
    // Reset plan status
    await db.runAsync(`
      UPDATE plan_challenge_status 
      SET isActive = 0, isCompleted = 0, progressPercentage = 0, lastUpdated = datetime('now')
      WHERE itemID = ? AND itemType = 'plan'
    `, planID);
    
    // Reset all plan-specific segment completions
    await db.runAsync(`
      DELETE FROM segment_completion 
      WHERE planID = ? AND completionType = 'plan'
    `, planID);
    
  } catch (error) {
    logger.error("Error resetting plan progress:", error);
  }
}

export async function resetChallengeProgress(challengeID: string): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    
    // Reset challenge status
    await db.runAsync(`
      UPDATE plan_challenge_status 
      SET isActive = 0, isCompleted = 0, progressPercentage = 0, lastUpdated = datetime('now')
      WHERE itemID = ? AND itemType = 'challenge'
    `, challengeID);
    
    // Reset all challenge-specific segment completions
    await db.runAsync(`
      DELETE FROM segment_completion 
      WHERE challengeID = ? AND completionType = 'challenge'
    `, challengeID);
    
  } catch (error) {
    logger.error("Error resetting challenge progress:", error);
  }
}

// ============================================================================
// APP STATE MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get a value from app_state table
 */
export async function getAppState(key: string): Promise<string | null> {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_state WHERE key = ?',
      [key]
    );
    return result?.value || null;
  } catch (error) {
    logger.error(`Error getting app state for key ${key}:`, error);
    return null;
  }
}

/**
 * Set a value in app_state table
 */
export async function setAppState(key: string, value: string | null): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    const currentDate = new Date().toISOString();
    await db.runAsync(`
      INSERT OR REPLACE INTO app_state (key, value, lastUpdated)
      VALUES (?, ?, ?)
    `, key, value, currentDate);
  } catch (error) {
    logger.error(`Error setting app state for key ${key}:`, error);
    throw error;
  }
}

/**
 * Get current segment ID
 */
export async function getCurrentSegmentId(): Promise<string> {
  const segmentId = await getAppState('segmentId');
  return segmentId || 'S001';
}

/**
 * Set current segment ID
 */
export async function setCurrentSegmentId(segmentId: string): Promise<void> {
  await setAppState('segmentId', segmentId);
}

/**
 * Get current reading plan
 */
export async function getCurrentReadingPlan(): Promise<string> {
  const readingPlan = await getAppState('readingPlan');
  return readingPlan || 'chronological';
}

/**
 * Set current reading plan
 */
export async function setCurrentReadingPlan(readingPlan: string): Promise<void> {
  await setAppState('readingPlan', readingPlan);
}

/**
 * Get last read segment
 */
export async function getLastReadSegment(): Promise<string | null> {
  return await getAppState('lastReadSegment');
}

/**
 * Set last read segment
 */
export async function setLastReadSegment(segmentId: string): Promise<void> {
  await setAppState('lastReadSegment', segmentId);
}

/**
 * Get app language
 */
export async function getAppLanguage(): Promise<string> {
  const language = await getAppState('language');
  return language || 'en';
}

/**
 * Set app language
 */
export async function setAppLanguage(language: string): Promise<void> {
  await setAppState('language', language);
}

/**
 * Get app version
 */
export async function getAppVersion(): Promise<string> {
  const version = await getAppState('version');
  return version || 'nlt';
}

/**
 * Set app version
 */
export async function setAppVersion(version: string): Promise<void> {
  await setAppState('version', version);
}

/**
 * Get read segments list (migrated from AsyncStorage)
 */
export async function getReadSegments(): Promise<string[]> {
  try {
    const db = databaseManager.getDatabase();
    const results = await db.getAllAsync<{ segmentID: string }>(
      'SELECT segmentID FROM segment_read_count WHERE totalReads > 0'
    );
    return results.map(r => r.segmentID);
  } catch (error) {
    logger.error('Error getting read segments:', error);
    return [];
  }
}

/**
 * Mark segment as read (replaces AsyncStorage readSegments)
 */
export async function markSegmentAsRead(segmentId: string): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    const currentDate = new Date().toISOString();
    await db.runAsync(`
      INSERT OR REPLACE INTO segment_read_count (segmentID, totalReads, lastReadDate)
      VALUES (?, COALESCE((SELECT totalReads FROM segment_read_count WHERE segmentID = ?), 0) + 1, ?)
    `, segmentId, segmentId, currentDate);
  } catch (error) {
    logger.error('Error marking segment as read:', error);
    throw error;
  }
}

/**
 * Get active plan from SQLite (replaces AsyncStorage activePlan)
 */
export async function getActivePlanFromDB(): Promise<any | null> {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.getFirstAsync<{
      itemID: string;
      isActive: number;
      isPaused: number;
      isCompleted: number;
      startDate: string;
      completionDate: string | null;
      progressPercentage: number;
    }>(
      'SELECT * FROM plan_challenge_status WHERE itemType = "plan" AND isActive = 1 LIMIT 1'
    );
    
    if (!result) return null;
    
    return {
      planId: result.itemID,
      dateStarted: result.startDate,
      isCompleted: result.isCompleted === 1,
      isPaused: result.isPaused === 1,
      progressPercentage: result.progressPercentage || 0,
      completedSegments: [], // Will be populated by other functions
      lastRead: result.completionDate || result.startDate
    };
  } catch (error) {
    logger.error('Error getting active plan:', error);
    return null;
  }
}

/**
 * Get active challenges from SQLite (replaces AsyncStorage activeChallenges)
 */
export async function getActiveChallengesFromDB(): Promise<Record<string, any>> {
  try {
    const db = databaseManager.getDatabase();
    const results = await db.getAllAsync<{
      itemID: string;
      isActive: number;
      isPaused: number;
      isCompleted: number;
      startDate: string;
      completionDate: string | null;
      progressPercentage: number;
    }>(
      'SELECT * FROM plan_challenge_status WHERE itemType = "challenge" AND isActive = 1'
    );
    
    const challenges: Record<string, any> = {};
    
    for (const result of results) {
      challenges[result.itemID] = {
        challengeId: result.itemID,
        dateStarted: result.startDate,
        isCompleted: result.isCompleted === 1,
        isPaused: result.isPaused === 1,
        progressPercentage: result.progressPercentage || 0,
        completedSegments: [], // Will be populated by other functions
        lastRead: result.completionDate || result.startDate
      };
    }
    
    return challenges;
  } catch (error) {
    logger.error('Error getting active challenges:', error);
    return {};
  }
}
