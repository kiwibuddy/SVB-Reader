import { databaseManager } from './database-manager';
import logger from '@/utils/logger';
// ============================================================================
// ENHANCED INSIGHT QUERIES
// ============================================================================

export interface BookInsights {
  totalReads: number;
  storiesRead: number;
  totalStories: number;
  lastReadDate: string | null;
  favoriteStory: string | null;
  groupReads: number;
  individualReads: number;
  completionPercentage: number;
}

export interface StoryInsights {
  totalReads: number;
  lastReadDate: string | null;
  groupReads: number;
  individualReads: number;
  firstReadDate: string | null;
  readInPlans: number;
  readInChallenges: number;
}

export interface LastReactionData {
  emoji: string;
  segmentId: string;
  storyTitle: string;
  blockData: any;
  date: string;
}

export interface UserActivityInsights {
  favoriteTimeOfDay: 'morning' | 'afternoon' | 'evening' | null;
  preferredReadingMode: 'group' | 'individual' | 'mixed' | null;
  averageSessionLength: number;
  longestSession: number;
  mostActiveDay: string | null;
  streakRecords: {
    current: number;
    longest: number;
  };
  readingPattern: 'single' | 'multiple' | 'mixed' | null;
  totalDaysActive: number;
}

// ============================================================================
// BOOK-SPECIFIC INSIGHTS
// ============================================================================

export async function getBookInsights(bookCode: string): Promise<BookInsights> {
  try {
    const db = databaseManager.getDatabase();
    
    // Get all segments for this book
    const bookSegments = await db.getAllAsync<{ segmentId: string }>(
      `SELECT segmentID as segmentId FROM segments WHERE bookId = ?`,
      [bookCode]
    );
    
    if (bookSegments.length === 0) {
      return {
        totalReads: 0,
        storiesRead: 0,
        totalStories: 0,
        lastReadDate: null,
        favoriteStory: null,
        groupReads: 0,
        individualReads: 0,
        completionPercentage: 0,
      };
    }
    
    const segmentIds = bookSegments.map(s => s.segmentId);
    const placeholders = segmentIds.map(() => '?').join(',');
    
    // Get total reads across all stories in this book
    const totalAllReads = await db.getFirstAsync<{ total: number }>(`
      SELECT COALESCE(SUM(totalReads), 0) as total
      FROM segment_read_count 
      WHERE segmentID IN (${placeholders})
    `, segmentIds);
    
    // Get stories that have been read at least once
    const readStoriesCount = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count
      FROM segment_read_count 
      WHERE segmentID IN (${placeholders}) AND totalReads > 0
    `, segmentIds);
    
    // Get last read date for any story in this book
    const lastReadDate = await db.getFirstAsync<{ lastReadDate: string }>(`
      SELECT MAX(lastReadDate) as lastReadDate
      FROM segment_read_count 
      WHERE segmentID IN (${placeholders}) AND totalReads > 0
    `, segmentIds);
    
    // Get most read story in this book
    const favoriteStory = await db.getFirstAsync<{ segmentId: string; reads: number }>(`
      SELECT segmentID as segmentId, totalReads as reads
      FROM segment_read_count 
      WHERE segmentID IN (${placeholders})
      ORDER BY totalReads DESC, lastReadDate DESC
      LIMIT 1
    `, segmentIds);
    
    // Get group vs individual reads for the entire book
    const groupReads = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count 
      FROM group_segment_completion 
      WHERE segmentID IN (${placeholders})
    `, segmentIds);
    
    // Calculate minimum read count (for books where all stories have been read multiple times)
    const minReadCount = await db.getFirstAsync<{ minReads: number }>(`
      SELECT MIN(COALESCE(totalReads, 0)) as minReads
      FROM segment_read_count 
      WHERE segmentID IN (${placeholders}) AND totalReads > 0
    `, segmentIds);
    
    const totalReads = totalAllReads?.total || 0;
    const storiesRead = readStoriesCount?.count || 0;
    const groupReadCount = groupReads?.count || 0;
    // For "total reads" show the minimum read count only if ALL stories have been read
    const bookCompletionCount = (storiesRead === segmentIds.length) ? (minReadCount?.minReads || 0) : 0;
    
    return {
      totalReads: bookCompletionCount, // This is now the number of times the entire book was read
      storiesRead,
      totalStories: segmentIds.length,
      lastReadDate: lastReadDate?.lastReadDate || null,
      favoriteStory: favoriteStory?.segmentId || null,
      groupReads: groupReadCount,
      individualReads: Math.max(0, totalReads - groupReadCount),
      completionPercentage: segmentIds.length > 0 ? Math.round((storiesRead / segmentIds.length) * 100) : 0,
    };
  } catch (error) {
    logger.error('Error getting book insights:', error);
    return {
      totalReads: 0,
      storiesRead: 0,
      totalStories: 0,
      lastReadDate: null,
      favoriteStory: null,
      groupReads: 0,
      individualReads: 0,
      completionPercentage: 0,
    };
  }
}

// ============================================================================
// STORY-SPECIFIC INSIGHTS  
// ============================================================================

export async function getStoryInsights(segmentId: string): Promise<StoryInsights> {
  try {
    const db = databaseManager.getDatabase();
    
    // Get basic read count and dates
    const readStats = await db.getFirstAsync<{ 
      totalReads: number; 
      lastReadDate: string;
    }>(`
      SELECT totalReads, lastReadDate
      FROM segment_read_count 
      WHERE segmentID = ?
    `, [segmentId]);
    
    // Get first read date
    const firstRead = await db.getFirstAsync<{ firstReadDate: string }>(`
      SELECT MIN(completionDate) as firstReadDate
      FROM segment_completion
      WHERE segmentID = ?
    `, [segmentId]);
    
    // Get group vs individual reads
    const groupReads = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count 
      FROM group_segment_completion 
      WHERE segmentID = ?
    `, [segmentId]);
    
    // Get plan/challenge reads
    const planReads = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count 
      FROM reading_plan_progress 
      WHERE segmentID = ? AND isCompleted = 1
    `, [segmentId]);
    
    const challengeReads = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count 
      FROM reading_challenge_progress 
      WHERE segmentID = ? AND isCompleted = 1
    `, [segmentId]);
    
    const totalReads = readStats?.totalReads || 0;
    const groupReadCount = groupReads?.count || 0;
    
    return {
      totalReads,
      lastReadDate: readStats?.lastReadDate || null,
      groupReads: groupReadCount,
      individualReads: Math.max(0, totalReads - groupReadCount),
      firstReadDate: firstRead?.firstReadDate || null,
      readInPlans: planReads?.count || 0,
      readInChallenges: challengeReads?.count || 0,
    };
  } catch (error) {
    logger.error('Error getting story insights:', error);
    return {
      totalReads: 0,
      lastReadDate: null,
      groupReads: 0,
      individualReads: 0,
      firstReadDate: null,
      readInPlans: 0,
      readInChallenges: 0,
    };
  }
}

// ============================================================================
// LAST REACTION DATA
// ============================================================================

export async function getLastReactionData(): Promise<LastReactionData | null> {
  try {
    const db = databaseManager.getDatabase();
    
    // Get the most recent emoji
    const lastEmoji = await db.getFirstAsync<{
      emoji: string;
      segmentID: string;
      blockData: string;
      id: number;
    }>(`
      SELECT emoji, segmentID, blockData, id
      FROM emojis 
      ORDER BY id DESC 
      LIMIT 1
    `);
    
    if (!lastEmoji) return null;
    
    // Get story title from segments table or SegmentTitles
    const storyTitle = await db.getFirstAsync<{ title: string }>(`
      SELECT title FROM segments WHERE segmentID = ?
    `, [lastEmoji.segmentID]);
    
    return {
      emoji: lastEmoji.emoji,
      segmentId: lastEmoji.segmentID,
      storyTitle: storyTitle?.title || 'Unknown Story',
      blockData: JSON.parse(lastEmoji.blockData || '{}'),
      date: new Date().toISOString(), // Since we don't have creation date, use current
    };
  } catch (error) {
    logger.error('Error getting last reaction:', error);
    return null;
  }
}

// Helper function to get segment reference (book chapter:verse)
export function getSegmentReference(segmentID: string): string {
  // This would need to import SegmentTitles, but for now we'll implement a basic version
  // The calling code should handle this with access to SegmentTitles
  return segmentID; // Placeholder - will be replaced in the component
}

// ============================================================================
// USER ACTIVITY INSIGHTS
// ============================================================================

export async function getUserActivityInsights(): Promise<UserActivityInsights> {
  try {
    const db = databaseManager.getDatabase();
    
    // Get reading time preferences (analyze completion times)
    const timeAnalysis = await db.getAllAsync<{ hour: number; count: number }>(`
      SELECT 
        CAST(strftime('%H', completionDate) AS INTEGER) as hour,
        COUNT(*) as count
      FROM segment_completion 
      WHERE completionDate IS NOT NULL
      GROUP BY hour
      ORDER BY count DESC
      LIMIT 1
    `);
    
    let favoriteTimeOfDay: 'morning' | 'afternoon' | 'evening' | null = null;
    if (timeAnalysis.length > 0) {
      const hour = timeAnalysis[0].hour;
      if (hour >= 5 && hour < 12) favoriteTimeOfDay = 'morning';
      else if (hour >= 12 && hour < 18) favoriteTimeOfDay = 'afternoon';
      else favoriteTimeOfDay = 'evening';
    }
    
    // Get reading mode preference
    const groupReads = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM group_segment_completion
    `);
    
    const totalReads = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM segment_completion
    `);
    
    let preferredReadingMode: 'group' | 'individual' | 'mixed' | null = null;
    if (totalReads && totalReads.count > 0) {
      const groupPercentage = ((groupReads?.count || 0) / totalReads.count) * 100;
      if (groupPercentage > 70) preferredReadingMode = 'group';
      else if (groupPercentage < 30) preferredReadingMode = 'individual';
      else preferredReadingMode = 'mixed';
    }
    
    // Get session statistics
    const sessionStats = await db.getFirstAsync<{ 
      avgLength: number; 
      maxLength: number; 
      totalSessions: number;
    }>(`
      SELECT 
        ROUND(AVG(segmentCount), 1) as avgLength,
        MAX(segmentCount) as maxLength,
        COUNT(*) as totalSessions
      FROM reading_sessions
    `);
    
    // Get streak data
    const streakData = await db.getFirstAsync<{ 
      currentStreak: number; 
      longestStreak: number;
    }>(`
      SELECT currentStreak, longestStreak 
      FROM streak_data 
      ORDER BY id DESC 
      LIMIT 1
    `);
    
    // Get most active day of week
    const dayAnalysis = await db.getFirstAsync<{ dayOfWeek: string; count: number }>(`
      SELECT 
        CASE CAST(strftime('%w', completionDate) AS INTEGER)
          WHEN 0 THEN 'Sunday'
          WHEN 1 THEN 'Monday'
          WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday'
          WHEN 4 THEN 'Thursday'
          WHEN 5 THEN 'Friday'
          WHEN 6 THEN 'Saturday'
        END as dayOfWeek,
        COUNT(*) as count
      FROM segment_completion 
      WHERE completionDate IS NOT NULL
      GROUP BY CAST(strftime('%w', completionDate) AS INTEGER)
      ORDER BY count DESC
      LIMIT 1
    `);
    
    // Get reading pattern (single vs multiple stories)
    const singleStoryDays = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count 
      FROM daily_activity 
      WHERE segmentCount = 1
    `);
    
    const multipleStoryDays = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count 
      FROM daily_activity 
      WHERE segmentCount > 1
    `);
    
    let readingPattern: 'single' | 'multiple' | 'mixed' | null = null;
    const totalDays = (singleStoryDays?.count || 0) + (multipleStoryDays?.count || 0);
    if (totalDays > 0) {
      const multiplePercentage = ((multipleStoryDays?.count || 0) / totalDays) * 100;
      if (multiplePercentage > 70) readingPattern = 'multiple';
      else if (multiplePercentage < 30) readingPattern = 'single';
      else readingPattern = 'mixed';
    }
    
    // Get total active days
    const activeDays = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(DISTINCT date) as count 
      FROM daily_activity
    `);
    
    return {
      favoriteTimeOfDay,
      preferredReadingMode,
      averageSessionLength: sessionStats?.avgLength || 0,
      longestSession: sessionStats?.maxLength || 0,
      mostActiveDay: dayAnalysis?.dayOfWeek || null,
      streakRecords: {
        current: streakData?.currentStreak || 0,
        longest: streakData?.longestStreak || 0,
      },
      readingPattern,
      totalDaysActive: activeDays?.count || 0,
    };
  } catch (error) {
    logger.error('Error getting user activity insights:', error);
    return {
      favoriteTimeOfDay: null,
      preferredReadingMode: null,
      averageSessionLength: 0,
      longestSession: 0,
      mostActiveDay: null,
      streakRecords: { current: 0, longest: 0 },
      readingPattern: null,
      totalDaysActive: 0,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export async function hasUserData(): Promise<{
  hasEmojis: boolean;
  hasReadBooks: boolean;
  hasReadStories: boolean;
  hasActivity: boolean;
}> {
  try {
    const db = databaseManager.getDatabase();
    
    const emojiCount = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM emojis
    `);
    
    // Check for read books (any stories read, not necessarily completed books)
    const readBooksCount = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(DISTINCT segmentID) as count 
      FROM segment_read_count 
      WHERE totalReads > 0
    `);
    
    const readStoriesCount = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(DISTINCT segmentID) as count 
      FROM segment_read_count 
      WHERE totalReads > 0
    `);
    
    const activityCount = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM daily_activity
    `);
    
    return {
      hasEmojis: (emojiCount?.count || 0) > 0,
      hasReadBooks: (readBooksCount?.count || 0) > 0, // Show if any books have been read
      hasReadStories: (readStoriesCount?.count || 0) > 0,
      hasActivity: (activityCount?.count || 0) > 0,
    };
  } catch (error) {
    logger.error('Error checking user data:', error);
    return {
      hasEmojis: false,
      hasReadBooks: false,
      hasReadStories: false,
      hasActivity: false,
    };
  }
}
