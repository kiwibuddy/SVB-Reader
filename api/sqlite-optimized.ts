import logger from '@/utils/logger';
import { databaseManager } from './database-manager';

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const queryCache = new QueryCache();

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

interface BatchOperation {
  type: 'get' | 'set' | 'delete';
  key: string;
  value?: any;
}

class BatchProcessor {
  private batch: BatchOperation[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly batchDelay = 100; // milliseconds

  add(operation: BatchOperation): void {
    this.batch.push(operation);
    this.scheduleBatch();
  }

  private scheduleBatch(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.executeBatch();
    }, this.batchDelay) as any;
  }

  private async executeBatch(): Promise<void> {
    if (this.batch.length === 0) return;

    const currentBatch = [...this.batch];
    this.batch = [];

    try {
      const db = databaseManager.getDatabase();
      await db.runAsync('BEGIN TRANSACTION');

      for (const operation of currentBatch) {
        switch (operation.type) {
          case 'set':
            await db.runAsync(
              'INSERT OR REPLACE INTO app_state (key, value, lastUpdated) VALUES (?, ?, ?)',
              [operation.key, JSON.stringify(operation.value), new Date().toISOString()]
            );
            break;
          case 'delete':
            await db.runAsync('DELETE FROM app_state WHERE key = ?', [operation.key]);
            break;
        }
      }

      await db.runAsync('COMMIT');
    } catch (error) {
      logger.error('Error executing batch operations:', error);
      const rollbackDb = databaseManager.getDatabase();
      await rollbackDb.runAsync('ROLLBACK');
    }
  }
}

export const batchProcessor = new BatchProcessor();

// ============================================================================
// OPTIMIZED QUERY FUNCTIONS
// ============================================================================

// Optimized segment completion status with caching
export const getSegmentCompletionStatusOptimized = async (
  segmentId: string,
  context: 'main' | 'plan' | 'challenge' | 'today' = 'main',
  planId?: string,
  challengeId?: string
): Promise<{ isCompleted: boolean; color: string | null }> => {
  const cacheKey = `completion_${segmentId}_${context}_${planId || ''}_${challengeId || ''}`;
  
  // Check cache first
  const cached = queryCache.get<{ isCompleted: boolean; color: string | null }>(cacheKey);
  if (cached) return cached;

  // Introduction segments should never be tracked for completion
  if (segmentId.startsWith('I')) {
    const result = { isCompleted: false, color: null };
    queryCache.set(cacheKey, result, 60 * 1000); // Cache for 1 minute
    return result;
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
      const today = new Date().toISOString().split('T')[0];
      result = await db.getFirstAsync<{ isCompleted: number }>(
        'SELECT isCompleted FROM completedSegments WHERE segmentID = ? AND completionDate LIKE ?',
        [segmentId, `${today}%`]
      );
    }

    const completionData = {
      isCompleted: result?.isCompleted === 1,
      color: null,
    };

    // Cache the result with different TTL based on context
    const ttl = context === 'today' ? 30 * 1000 : 5 * 60 * 1000; // 30s for today, 5min for others
    queryCache.set(cacheKey, completionData, ttl);

    return completionData;
  } catch (error) {
    logger.error("Error getting segment completion status:", error);
    return { isCompleted: false, color: null };
  }
};

// Optimized batch completion status
export const getBatchSegmentCompletionStatus = async (
  segmentIds: string[],
  context: 'main' | 'plan' | 'challenge' | 'today' = 'main',
  planId?: string,
  challengeId?: string
): Promise<Record<string, { isCompleted: boolean; color: string | null }>> => {
  const results: Record<string, { isCompleted: boolean; color: string | null }> = {};
  
  // Filter out introduction segments
  const validSegmentIds = segmentIds.filter(id => !id.startsWith('I'));
  
  if (validSegmentIds.length === 0) {
    segmentIds.forEach(id => {
      results[id] = { isCompleted: false, color: null };
    });
    return results;
  }

  try {
    const db = databaseManager.getDatabase();
    let query: string;
    let params: any[];

    if (context === 'main') {
      query = 'SELECT segmentID, isCompleted FROM completedSegments WHERE segmentID IN (' + validSegmentIds.map(() => '?').join(',') + ')';
      params = validSegmentIds;
    } else if (context === 'plan' && planId) {
      query = 'SELECT segmentID, isCompleted FROM reading_plan_progress WHERE planID = ? AND segmentID IN (' + validSegmentIds.map(() => '?').join(',') + ')';
      params = [planId, ...validSegmentIds];
    } else if (context === 'challenge' && challengeId) {
      query = 'SELECT segmentID, isCompleted FROM reading_challenge_progress WHERE challengeID = ? AND segmentID IN (' + validSegmentIds.map(() => '?').join(',') + ')';
      params = [challengeId, ...validSegmentIds];
    } else {
      // Fallback to individual queries for other contexts
      for (const segmentId of segmentIds) {
        results[segmentId] = await getSegmentCompletionStatusOptimized(segmentId, context, planId, challengeId);
      }
      return results;
    }

    const dbResults = await db.getAllAsync<{ segmentID: string; isCompleted: number }>(query, params);
    
    // Build results map
    segmentIds.forEach(segmentId => {
      if (segmentId.startsWith('I')) {
        results[segmentId] = { isCompleted: false, color: null };
      } else {
        const dbResult = dbResults.find(r => r.segmentID === segmentId);
        results[segmentId] = {
          isCompleted: dbResult?.isCompleted === 1,
          color: null,
        };
      }
    });

    return results;
  } catch (error) {
    logger.error("Error getting batch segment completion status:", error);
    // Fallback to individual queries
    for (const segmentId of segmentIds) {
      results[segmentId] = await getSegmentCompletionStatusOptimized(segmentId, context, planId, challengeId);
    }
    return results;
  }
};

// Optimized progress queries with caching
export const getOptimizedPlanProgress = async (planId: string): Promise<any> => {
  const cacheKey = `plan_progress_${planId}`;
  
  const cached = queryCache.get<any>(cacheKey);
  if (cached) return cached;

  try {
    const db = databaseManager.getDatabase();
    
    // Use a single query to get both total and completed counts
    const result = await db.getFirstAsync<{ total: number; completed: number }>(`
      SELECT 
        (SELECT COUNT(*) FROM segments WHERE planID = ? AND segmentID NOT LIKE 'I%') as total,
        (SELECT COUNT(*) FROM reading_plan_progress WHERE planID = ? AND isCompleted = 1 AND segmentID NOT LIKE 'I%') as completed
    `, [planId, planId]);
    
    const totalSegments = result?.total || 0;
    const completedSegments = result?.completed || 0;
    const progressPercentage = totalSegments > 0 ? (completedSegments / totalSegments) * 100 : 0;
    
    const progressData = {
      totalSegments,
      completedSegments,
      progressPercentage,
      isCompleted: completedSegments >= totalSegments && totalSegments > 0,
      completedSegmentIds: [], // Would need separate query if needed
    };

    queryCache.set(cacheKey, progressData, 2 * 60 * 1000); // Cache for 2 minutes
    return progressData;
  } catch (error) {
    logger.error("Error getting optimized plan progress:", error);
    return {
      totalSegments: 0,
      completedSegments: 0,
      progressPercentage: 0,
      isCompleted: false,
      completedSegmentIds: [],
    };
  }
};

// Optimized statistics queries
export const getOptimizedStatistics = async (): Promise<{
  currentStreak: number;
  bestStreak: number;
  completedSegmentsCount: number;
  totalSegmentsCount: number;
  emojiStats: any;
  sourceStats: any;
}> => {
  const cacheKey = 'statistics';
  
  const cached = queryCache.get<any>(cacheKey);
  if (cached) return cached;

  try {
    const db = databaseManager.getDatabase();
    
    // Use a single query to get multiple statistics
    const result = await db.getFirstAsync<{
      currentStreak: number;
      bestStreak: number;
      completedCount: number;
      totalCount: number;
    }>(`
      SELECT 
        (SELECT currentStreak FROM streak_data LIMIT 1) as currentStreak,
        (SELECT bestStreak FROM streak_data LIMIT 1) as bestStreak,
        (SELECT COUNT(*) FROM completedSegments WHERE isCompleted = 1) as completedCount,
        (SELECT COUNT(*) FROM segments WHERE segmentID NOT LIKE 'I%') as totalCount
    `);

    const statistics = {
      currentStreak: result?.currentStreak || 0,
      bestStreak: result?.bestStreak || 0,
      completedSegmentsCount: result?.completedCount || 0,
      totalSegmentsCount: result?.totalCount || 0,
      emojiStats: {}, // Would need separate query
      sourceStats: {}, // Would need separate query
    };

    queryCache.set(cacheKey, statistics, 5 * 60 * 1000); // Cache for 5 minutes
    return statistics;
  } catch (error) {
    logger.error("Error getting optimized statistics:", error);
    return {
      currentStreak: 0,
      bestStreak: 0,
      completedSegmentsCount: 0,
      totalSegmentsCount: 0,
      emojiStats: {},
      sourceStats: {},
    };
  }
};

// ============================================================================
// CACHE INVALIDATION
// ============================================================================

export const invalidateCompletionCache = (segmentId?: string): void => {
  if (segmentId) {
    queryCache.invalidate(`completion_${segmentId}`);
  } else {
    queryCache.invalidate('completion_');
  }
};

export const invalidateProgressCache = (planId?: string): void => {
  if (planId) {
    queryCache.invalidate(`plan_progress_${planId}`);
  } else {
    queryCache.invalidate('plan_progress_');
  }
};

export const invalidateStatisticsCache = (): void => {
  queryCache.invalidate('statistics');
};

export const invalidateAllCache = (): void => {
  queryCache.clear();
};

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

class PerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private readonly maxMetrics = 1000;

  recordQuery(query: string, duration: number, success: boolean): void {
    this.metrics.push({
      query,
      duration,
      timestamp: Date.now(),
      success,
    });

    // Keep only the last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(): QueryMetrics[] {
    return [...this.metrics];
  }

  getAverageQueryTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / this.metrics.length;
  }

  getSlowQueries(threshold: number = 100): QueryMetrics[] {
    return this.metrics.filter(metric => metric.duration > threshold);
  }

  clear(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// ============================================================================
// OPTIMIZED WRAPPER FUNCTIONS
// ============================================================================

export const withPerformanceMonitoring = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  queryName: string
) => {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    let success = false;
    
    try {
      const result = await fn(...args);
      success = true;
      return result;
    } finally {
      const duration = Date.now() - startTime;
      performanceMonitor.recordQuery(queryName, duration, success);
    }
  };
};

// Export optimized versions of existing functions
export const optimizedGetSegmentCompletionStatus = withPerformanceMonitoring(
  getSegmentCompletionStatusOptimized,
  'getSegmentCompletionStatus'
);

export const optimizedGetPlanProgress = withPerformanceMonitoring(
  getOptimizedPlanProgress,
  'getPlanProgress'
);

export const optimizedGetStatistics = withPerformanceMonitoring(
  getOptimizedStatistics,
  'getStatistics'
);

export default {
  queryCache,
  batchProcessor,
  performanceMonitor,
  invalidateCompletionCache,
  invalidateProgressCache,
  invalidateStatisticsCache,
  invalidateAllCache,
  optimizedGetSegmentCompletionStatus,
  optimizedGetPlanProgress,
  optimizedGetStatistics,
};
