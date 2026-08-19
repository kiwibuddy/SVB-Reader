import { databaseManager } from './database-manager';
import logger from '@/utils/logger';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
// ============================================================================
// SIMPLIFIED INSIGHTS MODE
// ============================================================================

// When database is having issues, we can track minimal data in memory
const simplifiedInsightsCache = new Map<string, { readCount: number; lastRead: string | null }>();

export const addSimplifiedStoryRead = (segmentId: string) => {
  const existing = simplifiedInsightsCache.get(segmentId);
  const now = new Date().toISOString();
  
  if (existing) {
    existing.readCount += 1;
    existing.lastRead = now;
  } else {
    simplifiedInsightsCache.set(segmentId, { readCount: 1, lastRead: now });
  }
};

export const getSimplifiedStoryInsights = (segmentId: string): StoryInsights => {
  const data = simplifiedInsightsCache.get(segmentId);
  
  return {
    totalReads: data?.readCount || 0,
    lastReadDate: data?.lastRead || null,
    groupReads: 0,
    individualReads: data?.readCount || 0,
    firstReadDate: null,
    readInPlans: 0,
    readInChallenges: 0,
  };
};

// Initialize insights system with health check
export const initializeInsights = async (): Promise<void> => {
  try {
    const isHealthy = await checkDatabaseHealth();
    if (!isHealthy) {
      logger.info('Database unhealthy, using simplified insights mode');
      setUseSimplifiedInsights(true);
    } else {
      logger.info('Database healthy, using full insights mode');
      setUseSimplifiedInsights(false);
    }
  } catch (error) {
    logger.error('Error initializing insights:', error);
    setUseSimplifiedInsights(true); // Default to simplified mode on error
  }
};

// ============================================================================
// CONFIGURATION AND FALLBACK MANAGEMENT
// ============================================================================

// Configuration to use simplified insights when database is having issues
let useSimplifiedInsights = false;

export const setUseSimplifiedInsights = (useSimple: boolean) => {
  useSimplifiedInsights = useSimple;
  logger.info(`Insights mode set to: ${useSimple ? 'simplified' : 'full'}`);
};

export const getUseSimplifiedInsights = () => useSimplifiedInsights;

// Check if database is healthy and switch to simplified mode if needed
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const db = await databaseManager.ensureDatabase();
    await db.execAsync('SELECT 1');
    return true;
  } catch (error) {
    logger.warn('Database health check failed, switching to simplified insights mode');
    setUseSimplifiedInsights(true);
    return false;
  }
};

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

export interface LastNoteData {
  note: string;
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
    const db = await databaseManager.ensureDatabase();
    
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
    `, ...segmentIds);
    
    // Get stories that have been read at least once
    const readStoriesCount = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count
      FROM segment_read_count 
      WHERE segmentID IN (${placeholders}) AND totalReads > 0
    `, ...segmentIds);
    
    // Get last read date for any story in this book
    const lastReadDate = await db.getFirstAsync<{ lastReadDate: string }>(`
      SELECT MAX(lastReadDate) as lastReadDate
      FROM segment_read_count 
      WHERE segmentID IN (${placeholders}) AND totalReads > 0
    `, ...segmentIds);
    
    // Get most read story in this book
    const favoriteStory = await db.getFirstAsync<{ segmentId: string; reads: number }>(`
      SELECT segmentID as segmentId, totalReads as reads
      FROM segment_read_count 
      WHERE segmentID IN (${placeholders})
      ORDER BY totalReads DESC, lastReadDate DESC
      LIMIT 1
    `, ...segmentIds);
    
    // Calculate minimum read count (for books where all stories have been read multiple times)
    const minReadCount = await db.getFirstAsync<{ minReads: number }>(`
      SELECT MIN(COALESCE(totalReads, 0)) as minReads
      FROM segment_read_count 
      WHERE segmentID IN (${placeholders}) AND totalReads > 0
    `, ...segmentIds);
    
    const totalReads = totalAllReads?.total || 0;
    const storiesRead = readStoriesCount?.count || 0;
    const groupReadCount = 0;
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

// Simplified fallback version that doesn't require complex database queries
export async function getStoryInsightsSimple(segmentId: string): Promise<StoryInsights> {
  try {
    const db = await databaseManager.ensureDatabase();
    
    // Just get basic read count - simpler query
    const readStats = await db.getFirstAsync<{ 
      totalReads: number; 
      lastReadDate: string;
    }>(`
      SELECT totalReads, lastReadDate
      FROM segment_read_count 
      WHERE segmentID = ?
    `, [segmentId]);
    
    return {
      totalReads: readStats?.totalReads || 0,
      lastReadDate: readStats?.lastReadDate || null,
      groupReads: 0, // Simplified - no complex joins
      individualReads: readStats?.totalReads || 0,
      firstReadDate: null, // Simplified - no complex queries
      readInPlans: 0, // Simplified - no complex joins
      readInChallenges: 0, // Simplified - no complex joins
    };
  } catch (error) {
    logger.error('Error getting simple story insights:', error);
    // Return safe defaults
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

export async function getStoryInsights(segmentId: string): Promise<StoryInsights> {
  // Check if we should use simplified insights
  if (useSimplifiedInsights) {
    logger.info('Using simplified story insights due to configuration');
    // Check both simplified database query and memory cache
    try {
      const dbResult = await getStoryInsightsSimple(segmentId);
      const cacheResult = getSimplifiedStoryInsights(segmentId);
      
      // Combine both sources, preferring database if available
      return {
        totalReads: Math.max(dbResult.totalReads, cacheResult.totalReads),
        lastReadDate: dbResult.lastReadDate || cacheResult.lastReadDate,
        groupReads: dbResult.groupReads,
        individualReads: Math.max(dbResult.individualReads, cacheResult.individualReads),
        firstReadDate: dbResult.firstReadDate,
        readInPlans: dbResult.readInPlans,
        readInChallenges: dbResult.readInChallenges,
      };
    } catch (error) {
      logger.error('Error getting simplified insights, using cache only:', error);
      return getSimplifiedStoryInsights(segmentId);
    }
  }

  try {
    const db = await databaseManager.ensureDatabase();
    
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
    const groupReadCount = 0;
    
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
    // Fallback to simple version if complex queries fail
    logger.info('Falling back to simple story insights');
    setUseSimplifiedInsights(true); // Switch to simplified mode for future calls
    return await getStoryInsightsSimple(segmentId);
  }
}

// ============================================================================
// LAST REACTION DATA
// ============================================================================

export async function getLastReactionData(): Promise<LastReactionData | null> {
  try {
    const db = await databaseManager.ensureDatabase();
    
    // Get the most recent emoji
    const lastEmoji = await db.getFirstAsync<{
      emoji: string;
      segmentID: string;
      blockData: string;
      id: number;
    }>(`
      SELECT emoji, segmentID, blockData, id
      FROM emojis 
      WHERE emoji IS NOT NULL AND emoji != ''
      ORDER BY id DESC 
      LIMIT 1
    `);
    
    if (!lastEmoji) {
      logger.info('📝 [getLastReactionData] No emoji found');
      return null;
    }
    
    logger.info('📝 [getLastReactionData] Last emoji data:', {
      segmentID: lastEmoji.segmentID,
      emoji: lastEmoji.emoji,
      hasBlockData: !!lastEmoji.blockData
    });
    
    // Get story title from SegmentTitles.json
    const segmentData = SegmentTitles[lastEmoji.segmentID as keyof typeof SegmentTitles] as any;
    const storyTitle = segmentData?.title || 'Unknown Story';
    
    logger.info('📝 [getLastReactionData] Segment lookup result:', {
      segmentID: lastEmoji.segmentID,
      hasSegmentData: !!segmentData,
      storyTitle,
      book: segmentData?.book,
      ref: segmentData?.ref
    });
    
    return {
      emoji: lastEmoji.emoji,
      segmentId: lastEmoji.segmentID,
      storyTitle,
      blockData: JSON.parse(lastEmoji.blockData || '{}'),
      date: new Date().toISOString(), // Since we don't have creation date, use current
    };
  } catch (error) {
    logger.error('Error getting last reaction:', error);
    return null;
  }
}

// ============================================================================
// LAST NOTE DATA
// ============================================================================

export async function getLastNoteData(): Promise<LastNoteData | null> {
  try {
    const db = await databaseManager.ensureDatabase();
    
    // Get the most recent note
    const lastNote = await db.getFirstAsync<{
      note: string;
      segmentID: string;
      blockData: string;
      id: number;
    }>(`
      SELECT note, segmentID, blockData, id
      FROM emojis 
      WHERE note IS NOT NULL AND note != ''
      ORDER BY id DESC 
      LIMIT 1
    `);
    
    if (!lastNote) {
      logger.info('📝 [getLastNoteData] No note found');
      return null;
    }
    
    logger.info('📝 [getLastNoteData] Last note data:', {
      segmentID: lastNote.segmentID,
      noteLength: lastNote.note?.length || 0,
      hasBlockData: !!lastNote.blockData
    });
    
    // Get story title from SegmentTitles.json
    const segmentData = SegmentTitles[lastNote.segmentID as keyof typeof SegmentTitles] as any;
    const storyTitle = segmentData?.title || 'Unknown Story';
    
    logger.info('📝 [getLastNoteData] Segment lookup result:', {
      segmentID: lastNote.segmentID,
      hasSegmentData: !!segmentData,
      storyTitle,
      book: segmentData?.book,
      ref: segmentData?.ref
    });
    
    return {
      note: lastNote.note,
      segmentId: lastNote.segmentID,
      storyTitle,
      blockData: JSON.parse(lastNote.blockData || '{}'),
      date: new Date().toISOString(), // Since we don't have creation date, use current
    };
  } catch (error) {
    logger.error('Error getting last note:', error);
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
    const db = await databaseManager.ensureDatabase();
    
    // Get reading time preferences (analyze completion times in local timezone)
    const timeAnalysis = await db.getAllAsync<{ hour: number; count: number }>(`
      SELECT 
        CAST(strftime('%H', datetime(completionDate, 'localtime')) AS INTEGER) as hour,
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
    
    // Reading mode is no longer split into group vs individual
    const totalReads = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM segment_completion
    `);
    
    const preferredReadingMode: 'group' | 'individual' | 'mixed' | null =
      totalReads && totalReads.count > 0 ? 'individual' : null;
    
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
  hasNotes: boolean;
}> {
  try {
    const db = await databaseManager.ensureDatabase();
    
    const emojiCount = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM emojis WHERE emoji IS NOT NULL AND emoji != ''
    `);
    
    const noteCount = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM emojis WHERE note IS NOT NULL AND note != ''
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
      hasNotes: (noteCount?.count || 0) > 0,
    };
  } catch (error) {
    logger.error('Error checking user data:', error);
    return {
      hasEmojis: false,
      hasReadBooks: false,
      hasReadStories: false,
      hasActivity: false,
      hasNotes: false,
    };
  }
}
