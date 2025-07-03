import { SQLiteDatabase } from "expo-sqlite";
import * as SQLite from "expo-sqlite";
import { BibleBlock } from "@/types";

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

let db: SQLiteDatabase;

async function initializeDatabase() {
  try {
    db = await SQLite.openDatabaseAsync("sourceview");
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      
      -- Core segments table
      CREATE TABLE IF NOT EXISTS segments (
        segmentID TEXT PRIMARY KEY NOT NULL,
        bookId TEXT NOT NULL,
        title TEXT NOT NULL,
        reference TEXT
      );
      
      -- Emojis table (preserved)
      CREATE TABLE IF NOT EXISTS emojis (
        id INTEGER PRIMARY KEY NOT NULL,
        segmentID TEXT NOT NULL,
        blockID TEXT NOT NULL,
        blockData TEXT NOT NULL,
        emoji TEXT NOT NULL,
        note TEXT NOT NULL,
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

// **MAIN COMPLETION TRACKING FUNCTION**
export async function markSegmentComplete(
  segmentID: string,
  context: 'main' | 'plan' | 'challenge' = 'main',
  planID?: string | null,
  challengeID?: string | null
): Promise<void> {
  try {
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

    // Update total read count
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
      // Update main context completion
      await db.runAsync(`
        INSERT OR REPLACE INTO completedSegments (
          segmentID,
          isCompleted,
          completionDate
        ) VALUES (?, 1, ?)
      `, segmentID, currentDate);
      
    } else if (context === 'plan' && planID) {
      // Update plan-specific progress
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
      // Update challenge-specific progress
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
    }

    // Update daily activity and streak
    await updateDailyActivity(segmentID);

    // Check book completion
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

// **CONTEXT-SPECIFIC COMPLETION STATUS RETRIEVAL**
export const getSegmentCompletionStatus = async (
  segmentId: string,
  context: 'main' | 'plan' | 'challenge' = 'main',
  planId?: string,
  challengeId?: string
): Promise<CompletionData> => {
  try {
    if (!segmentId) {
      console.warn('No segmentId provided to getSegmentCompletionStatus');
      return { isCompleted: false, color: null };
    }

    let result: { isCompleted: number } | null = null;

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
    }
    
    return {
      isCompleted: !!result?.isCompleted,
      color: null // We'll handle color separately if needed
    };
  } catch (error) {
    console.error('Error getting segment completion status:', error);
    return { isCompleted: false, color: null };
  }
};

// **PLAN PROGRESS FUNCTIONS**
export async function getPlanProgress(planID: string): Promise<PlanProgress> {
  try {
    // Get plan data to determine total segments
    const readingPlansData = require('../assets/data/ReadingPlansChallenges.json');
    const plan = readingPlansData.plans.find((p: any) => p.id === planID);
    
    if (!plan) {
      return { totalSegments: 0, completedSegments: 0, progressPercentage: 0, isCompleted: false, completedSegmentIds: [] };
    }

    // Calculate total segments in plan
    const totalSegments = Object.values(plan.segments).reduce((total: number, book: any) => {
      return total + (book?.segments?.length || 0);
    }, 0);

    // Get completed segments for this plan
    const completedResult = await db.getAllAsync<{ segmentID: string }>(
      'SELECT segmentID FROM reading_plan_progress WHERE planID = ? AND isCompleted = 1',
      [planID]
    );

    const completedSegments = completedResult.length;
    const progressPercentage = totalSegments > 0 ? (completedSegments / totalSegments) * 100 : 0;
    const isCompleted = completedSegments >= totalSegments && totalSegments > 0;
    const completedSegmentIds = completedResult.map(row => row.segmentID);

    return {
      totalSegments,
      completedSegments,
      progressPercentage,
      isCompleted,
      completedSegmentIds
    };
  } catch (error) {
    console.error('Error getting plan progress:', error);
    return { totalSegments: 0, completedSegments: 0, progressPercentage: 0, isCompleted: false, completedSegmentIds: [] };
  }
}

export async function getChallengeProgress(challengeID: string): Promise<ChallengeProgress> {
  try {
    // Get challenge data to determine total segments
    const readingPlansData = require('../assets/data/ReadingPlansChallenges.json');
    const challenge = readingPlansData.challenges.find((c: any) => c.id === challengeID);
    
    if (!challenge) {
      return { totalSegments: 0, completedSegments: 0, progressPercentage: 0, isCompleted: false, completedSegmentIds: [] };
    }

    // Calculate total segments in challenge
    const totalSegments = Object.values(challenge.segments).reduce((total: number, book: any) => {
      return total + (book?.segments?.length || 0);
    }, 0);

    // Get completed segments for this challenge
    const completedResult = await db.getAllAsync<{ segmentID: string }>(
      'SELECT segmentID FROM reading_challenge_progress WHERE challengeID = ? AND isCompleted = 1',
      [challengeID]
    );

    const completedSegments = completedResult.length;
    const progressPercentage = totalSegments > 0 ? (completedSegments / totalSegments) * 100 : 0;
    const isCompleted = completedSegments >= totalSegments && totalSegments > 0;
    const completedSegmentIds = completedResult.map(row => row.segmentID);

    return {
      totalSegments,
      completedSegments,
      progressPercentage,
      isCompleted,
      completedSegmentIds
    };
  } catch (error) {
    console.error('Error getting challenge progress:', error);
    return { totalSegments: 0, completedSegments: 0, progressPercentage: 0, isCompleted: false, completedSegmentIds: [] };
  }
}

// **PLAN/CHALLENGE STATUS UPDATE FUNCTIONS**
async function updatePlanStatus(planID: string): Promise<void> {
  try {
    const progress = await getPlanProgress(planID);
    
    await db.runAsync(`
      INSERT OR REPLACE INTO plan_challenge_status (
        itemID,
        itemType,
        totalSegments,
        completedSegments,
        progressPercentage,
        isCompleted
      ) VALUES (?, 'plan', ?, ?, ?, ?)
    `, planID, progress.totalSegments, progress.completedSegments, progress.progressPercentage, progress.isCompleted ? 1 : 0);
  } catch (error) {
    console.error('Error updating plan status:', error);
  }
}

async function updateChallengeStatus(challengeID: string): Promise<void> {
  try {
    const progress = await getChallengeProgress(challengeID);
    
    await db.runAsync(`
      INSERT OR REPLACE INTO plan_challenge_status (
        itemID,
        itemType,
        totalSegments,
        completedSegments,
        progressPercentage,
        isCompleted
      ) VALUES (?, 'challenge', ?, ?, ?, ?)
    `, challengeID, progress.totalSegments, progress.completedSegments, progress.progressPercentage, progress.isCompleted ? 1 : 0);
  } catch (error) {
    console.error('Error updating challenge status:', error);
  }
}

// **RESET COMPLETION FUNCTIONS**
export async function resetSegmentCompletion(
  segmentID: string,
  context: 'main' | 'plan' | 'challenge' = 'main',
  planID?: string | null,
  challengeID?: string | null
): Promise<void> {
  try {
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
    console.error("Error resetting segment completion:", error);
    throw error;
  }
}

// **PLAN/CHALLENGE MANAGEMENT FUNCTIONS**
export async function startPlan(planID: string): Promise<void> {
  try {
    await db.runAsync(`
      INSERT OR REPLACE INTO plan_challenge_status (
        itemID,
        itemType,
        isActive,
        isPaused,
        isCompleted,
        startDate,
        totalSegments,
        completedSegments,
        progressPercentage
      ) VALUES (?, 'plan', 1, 0, 0, ?, 0, 0, 0)
    `, planID, new Date().toISOString());
    
    // Update with actual progress
    await updatePlanStatus(planID);
  } catch (error) {
    console.error('Error starting plan:', error);
    throw error;
  }
}

export async function startChallenge(challengeID: string): Promise<void> {
  try {
    await db.runAsync(`
      INSERT OR REPLACE INTO plan_challenge_status (
        itemID,
        itemType,
        isActive,
        isPaused,
        isCompleted,
        startDate,
        totalSegments,
        completedSegments,
        progressPercentage
      ) VALUES (?, 'challenge', 1, 0, 0, ?, 0, 0, 0)
    `, challengeID, new Date().toISOString());
    
    // Update with actual progress
    await updateChallengeStatus(challengeID);
  } catch (error) {
    console.error('Error starting challenge:', error);
    throw error;
  }
}

export async function pausePlan(planID: string): Promise<void> {
  try {
    await db.runAsync(`
      UPDATE plan_challenge_status SET isPaused = 1 WHERE itemID = ? AND itemType = 'plan'
    `, [planID]);
  } catch (error) {
    console.error('Error pausing plan:', error);
    throw error;
  }
}

export async function pauseChallenge(challengeID: string): Promise<void> {
  try {
    await db.runAsync(`
      UPDATE plan_challenge_status SET isPaused = 1 WHERE itemID = ? AND itemType = 'challenge'
    `, [challengeID]);
  } catch (error) {
    console.error('Error pausing challenge:', error);
    throw error;
  }
}

export async function resumePlan(planID: string): Promise<void> {
  try {
    await db.runAsync(`
      UPDATE plan_challenge_status SET isPaused = 0 WHERE itemID = ? AND itemType = 'plan'
    `, [planID]);
  } catch (error) {
    console.error('Error resuming plan:', error);
    throw error;
  }
}

export async function resumeChallenge(challengeID: string): Promise<void> {
  try {
    await db.runAsync(`
      UPDATE plan_challenge_status SET isPaused = 0 WHERE itemID = ? AND itemType = 'challenge'
    `, [challengeID]);
  } catch (error) {
    console.error('Error resuming challenge:', error);
    throw error;
  }
}

export async function getActivePlan(): Promise<any | null> {
  try {
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM plan_challenge_status WHERE itemType = "plan" AND isActive = 1 LIMIT 1'
    );
    return result;
  } catch (error) {
    console.error('Error getting active plan:', error);
    return null;
  }
}

export async function getActiveChallenges(): Promise<any[]> {
  try {
    const results = await db.getAllAsync<any>(
      'SELECT * FROM plan_challenge_status WHERE itemType = "challenge" AND isActive = 1'
    );
    return results;
  } catch (error) {
    console.error('Error getting active challenges:', error);
    return [];
  }
}

// Achievement functions (preserved from original)
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
    const results = await db.getAllAsync(`
      SELECT * FROM achievements ORDER BY unlockDate DESC
    `);
    return results;
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return [];
  }
}

// Emoji functions (preserved from original)
export async function addEmoji(
  segmentID: string,
  blockID: string,
  blockData: BibleBlock,
  emoji: string
) {
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO emojis (segmentID, blockID, blockData, emoji, note) 
       VALUES (?, ?, ?, ?, ?)`,
      segmentID,
        blockID,
        JSON.stringify(blockData),
        emoji,
      ""
    );
  } catch (error) {
    console.error("Error adding emoji:", error);
  }
}

export async function deleteEmoji(segmentID: string, blockID: string) {
  try {
    await db.runAsync(
      `DELETE FROM emojis WHERE segmentID = ? AND blockID = ?`,
      segmentID,
      blockID
    );
  } catch (error) {
    console.error("Error deleting emoji:", error);
  }
}

export async function getEmoji(segmentID: string, blockID: string): Promise<string | null> {
  try {
    const result = await db.getFirstAsync<{ emoji: string }>(
      `SELECT emoji FROM emojis WHERE segmentID = ? AND blockID = ?`,
      segmentID,
      blockID
    );
    return result?.emoji || null;
  } catch (error) {
    console.error("Error fetching emoji:", error);
    return null;
  }
}

export async function getEmojis() {
  try {
    const results = await db.getAllAsync(`
      SELECT id, segmentID, blockID, blockData, emoji, note FROM emojis
    `);
    
    return results.map((row: any) => ({
      id: row.id,
      segmentID: row.segmentID,
      blockID: row.blockID,
      blockData: JSON.parse(row.blockData),
      emoji: row.emoji,
      note: row.note || ''
    }));
  } catch (error) {
    console.error("Error fetching emojis:", error);
    return [];
  }
}

// Read count and activity functions (preserved from original)
export async function getSegmentReadCount(segmentID: string): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ totalReads: number }>(
      'SELECT totalReads FROM segment_read_count WHERE segmentID = ?',
      [segmentID]
    );
    return result?.totalReads || 0;
  } catch (error) {
    console.error('Error getting segment read count:', error);
    return 0;
  }
}

export async function updateDailyActivity(segmentId: string) {
  try {
  const today = new Date().toISOString().split('T')[0];
  
    await db.runAsync(`
      INSERT OR REPLACE INTO daily_activity (date, segmentCount, lastUpdated)
      VALUES (
        ?,
        COALESCE((SELECT segmentCount FROM daily_activity WHERE date = ?), 0) + 1,
        datetime('now', 'localtime')
      )
    `, today, today);

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
    }>('SELECT * FROM streak_data LIMIT 1');

    if (!streakData) return;

    const lastReadDate = streakData.lastReadDate.split('T')[0];
    const todayDate = new Date(today);
    const lastDate = new Date(lastReadDate);
    const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    let newCurrentStreak = streakData.currentStreak;
    let newLongestStreak = streakData.longestStreak;
    
    if (daysDiff === 0) {
      return;
    } else if (daysDiff === 1) {
      newCurrentStreak = streakData.currentStreak + 1;
    } else {
      newCurrentStreak = 1;
    }

    if (newCurrentStreak > newLongestStreak) {
      newLongestStreak = newCurrentStreak;
    }

    await db.runAsync(`
      UPDATE streak_data
      SET currentStreak = ?, longestStreak = ?, lastReadDate = ?, lastUpdated = datetime('now', 'localtime')
      WHERE id = (SELECT id FROM streak_data LIMIT 1)
    `, newCurrentStreak, newLongestStreak, today);

  } catch (error) {
    console.error("Error updating streak:", error);
  }
}

export async function getCurrentStreak(): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ currentStreak: number }>(
      'SELECT currentStreak FROM streak_data LIMIT 1'
    );
    return result?.currentStreak || 0;
  } catch (error) {
    console.error("Error getting current streak:", error);
    return 0;
  }
}

// Statistics functions (preserved from original)
interface CountResult {
  count: number;
  currentStreak?: number;
  longestStreak?: number;
}

export const getCompletedSegmentsCount = async () => {
  try {
    const result = await db.getFirstAsync<CountResult>(`
      SELECT COUNT(*) as count FROM completedSegments WHERE isCompleted = 1
    `);
    return result?.count || 0;
  } catch (error) {
    console.error("Error getting completed segments count:", error);
    return 0;
  }
};

export const getTotalSegmentsCount = async () => {
  try {
    const result = await db.getFirstAsync<CountResult>(`
      SELECT COUNT(*) as count FROM segments
    `);
    return result?.count || 0;
  } catch (error) {
    console.error("Error getting total segments count:", error);
    return 0;
  }
};

export const getReadingStreak = async () => {
  try {
    const result = await db.getFirstAsync<CountResult>(`
      SELECT currentStreak, longestStreak FROM streak_data LIMIT 1
    `);
  return {
      current: result?.currentStreak || 0,
      longest: result?.longestStreak || 0
  };
  } catch (error) {
    console.error("Error getting reading streak:", error);
    return { current: 0, longest: 0 };
  }
};

export async function getEmojiStats(): Promise<{
  total: number;
  heart: number;
  prayer: number;
  question: number;
  thumbsUp: number;
}> {
  try {
    const results = await db.getAllAsync<{ emoji: string }>(
      'SELECT emoji FROM emojis'
    );
    
    const stats = {
      total: results.length,
      heart: 0,
      prayer: 0,
      question: 0,
      thumbsUp: 0
    };
    
    results.forEach(row => {
      switch (row.emoji) {
        case '❤️':
          stats.heart++;
          break;
        case '🙏':
          stats.prayer++;
          break;
        case '🤔':
          stats.question++;
          break;
        case '👍':
          stats.thumbsUp++;
          break;
      }
    });
    
    return stats;
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

export const getSourceStats = async () => {
  try {
    const results = await db.getAllAsync<{ color: string }>(`
      SELECT color FROM sourceReadings
    `);
  
    const stats = {
      total: results.length,
      narrator: 0,
      god: 0,
      mainCharacter: 0,
      otherVoices: 0
    };
    
    results.forEach(row => {
      switch (row.color) {
        case 'black':
          stats.narrator++;
          break;
        case 'red':
          stats.god++;
          break;
        case 'green':
          stats.mainCharacter++;
          break;
        case 'blue':
          stats.otherVoices++;
          break;
      }
    });
    
    return stats;
  } catch (error) {
    console.error("Error getting source stats:", error);
  return {
      total: 0,
      narrator: 0,
      god: 0,
      mainCharacter: 0,
      otherVoices: 0
  };
  }
};

export async function getBestStreak(): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ longestStreak: number }>(
      'SELECT longestStreak FROM streak_data LIMIT 1'
    );
    return result?.longestStreak || 0;
  } catch (error) {
    console.error("Error getting best streak:", error);
    return 0;
  }
}

// Reading session functions (preserved from original)
export async function startReadingSession() {
  try {
    const result = await db.runAsync(`
      INSERT INTO reading_sessions (startTime, endTime, segmentCount, sessionDate)
      VALUES (datetime('now'), datetime('now'), 0, date('now'))
    `);
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error starting reading session:", error);
    return null;
  }
}

export async function updateReadingSession(sessionId: number, segmentCount: number) {
  try {
    await db.runAsync(`
      UPDATE reading_sessions
      SET endTime = datetime('now'), segmentCount = ?
      WHERE id = ?
    `, segmentCount, sessionId);
  } catch (error) {
    console.error("Error updating reading session:", error);
  }
}

export async function getLongestSession(): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ maxSegments: number }>(
      'SELECT MAX(segmentCount) as maxSegments FROM reading_sessions'
    );
    return result?.maxSegments || 0;
  } catch (error) {
    console.error("Error getting longest session:", error);
    return 0;
  }
}

// Book completion functions (preserved from original)
export async function checkBookCompletion(bookId: string): Promise<boolean> {
  try {
    const segmentTitles = require('../assets/data/SegmentTitles.json');
    
    const bookSegments = Object.keys(segmentTitles).filter(segmentId => {
      const segment = segmentTitles[segmentId];
      return segment.book && segment.book.includes(bookId);
    });
    
    if (bookSegments.length === 0) return false;
    
    const completedCount = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM completedSegments 
      WHERE segmentID IN (${bookSegments.map(() => '?').join(',')}) AND isCompleted = 1
    `, bookSegments);

    const isCompleted = (completedCount?.count || 0) >= bookSegments.length;
    
      await db.runAsync(`
        INSERT OR REPLACE INTO book_completion (bookId, isCompleted, completionDate)
      VALUES (?, ?, ?)
    `, bookId, isCompleted ? 1 : 0, isCompleted ? new Date().toISOString() : null);
    
    return isCompleted;
  } catch (error) {
    console.error('Error checking book completion:', error);
    return false;
  }
}

export async function getBookCompletionStatus(bookId: string): Promise<boolean> {
  try {
    const result = await db.getFirstAsync<{ isCompleted: number }>(
      'SELECT isCompleted FROM book_completion WHERE bookId = ?',
      [bookId]
    );
    return !!result?.isCompleted;
  } catch (error) {
    console.error('Error getting book completion status:', error);
    return false;
  }
}

export async function getCompletedBooks(): Promise<string[]> {
  try {
    const results = await db.getAllAsync<{ bookId: string }>(
      'SELECT bookId FROM book_completion WHERE isCompleted = 1'
    );
    return results.map(row => row.bookId);
  } catch (error) {
    console.error('Error getting completed books:', error);
    return [];
  }
}

export async function getBookProgress(bookId: string): Promise<{completed: number; total: number; percentage: number}> {
  try {
    const segmentTitles = require('../assets/data/SegmentTitles.json');
    
    // Get all segments for this book (excluding intro segments for progress calculation)
    const bookSegments = Object.keys(segmentTitles).filter(segmentId => {
      const segment = segmentTitles[segmentId];
      return segment.book && segment.book.includes(bookId) && !segmentId.startsWith('I');
    });
    
    if (bookSegments.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    
    // Count completed segments for this book
    const completedCount = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM completedSegments 
      WHERE segmentID IN (${bookSegments.map(() => '?').join(',')}) AND isCompleted = 1
    `, bookSegments);

    const completed = completedCount?.count || 0;
    const total = bookSegments.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  } catch (error) {
    console.error(`Error getting book progress for ${bookId}:`, error);
    return { completed: 0, total: 0, percentage: 0 };
  }
}

export async function checkEmojiCollection(): Promise<{complete: boolean, used: string[]}> {
  try {
    const emojis = ['❤️', '👍', '🤔', '🙏'];
    const results = await db.getAllAsync<{ emoji: string }>(
      'SELECT DISTINCT emoji FROM emojis WHERE emoji IN (?, ?, ?, ?)',
      emojis
    );
    
    const usedEmojis = results.map(row => row.emoji);
    return {
      complete: usedEmojis.length === emojis.length,
      used: usedEmojis
    };
  } catch (error) {
    console.error('Error checking emoji collection:', error);
    return { complete: false, used: [] };
  }
}

export async function getOldTestamentProgress(): Promise<{completed: number; total: number}> {
  try {
    const otBooks = ['Gen', 'Exo', 'Lev', 'Num', 'Deu', 'Jos', 'Jdg', 'Rut', '1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch', 'Ezr', 'Neh', 'Est', 'Job', 'Psa', 'Pro', 'Ecc', 'SoS', 'Isa', 'Jer', 'Lam', 'Eze', 'Dan', 'Hos', 'Joe', 'Amo', 'Oba', 'Jon', 'Mic', 'Nah', 'Hab', 'Zep', 'Hag', 'Zec', 'Mal'];
    
    const completed = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM book_completion 
      WHERE bookId IN (${otBooks.map(() => '?').join(',')}) AND isCompleted = 1
    `, otBooks);
    
    return {
      completed: completed?.count || 0,
      total: otBooks.length
    };
  } catch (error) {
    console.error('Error getting OT progress:', error);
    return { completed: 0, total: 39 };
  }
}

export async function getNewTestamentProgress(): Promise<{completed: number; total: number}> {
  try {
    const ntBooks = ['Mat', 'Mar', 'Luk', 'Joh', 'Act', 'Rom', '1Co', '2Co', 'Gal', 'Eph', 'Php', 'Col', '1Th', '2Th', '1Ti', '2Ti', 'Tit', 'Phm', 'Heb', 'Jam', '1Pe', '2Pe', '1Jn', '2Jn', '3Jn', 'Jud', 'Rev'];
    
    const completed = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM book_completion 
      WHERE bookId IN (${ntBooks.map(() => '?').join(',')}) AND isCompleted = 1
    `, ntBooks);
    
    return {
      completed: completed?.count || 0,
      total: ntBooks.length
    };
  } catch (error) {
    console.error('Error getting NT progress:', error);
    return { completed: 0, total: 27 };
  }
}

export async function markAchievementComplete(achievementId: string) {
  try {
    await db.runAsync(`
      UPDATE achievements 
      SET isCompleted = 1, achievementDate = datetime('now', 'localtime')
      WHERE achievementID = ?
    `, achievementId);
  } catch (error) {
    console.error("Error marking achievement complete:", error);
  }
}

export async function getAchievementDates(): Promise<{[key: string]: string}> {
  try {
    const results = await db.getAllAsync<{achievementID: string; achievementDate: string}>(`
      SELECT achievementID, achievementDate FROM achievements WHERE isCompleted = 1
    `);
    
    const dates: {[key: string]: string} = {};
    results.forEach(row => {
      if (row.achievementDate) {
        dates[row.achievementID] = row.achievementDate;
      }
    });
    
    return dates;
  } catch (error) {
    console.error("Error getting achievement dates:", error);
    return {};
  }
}
