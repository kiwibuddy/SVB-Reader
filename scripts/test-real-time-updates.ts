import { 
  getSegmentCompletionStatus,
  markSegmentComplete,
  getPlanProgress,
  getChallengeProgress,
  getCurrentStreak,
  getBestStreak,
  getCompletedSegmentsCount,
  getTotalSegmentsCount,
  getEmojiStats,
  getSourceStats,
  getOldTestamentProgress,
  getNewTestamentProgress,
  getLongestSession,
  getCompletedBooks,
  checkEmojiCollection,
  getReadingStreak,
  getBookProgress,
  startPlan,
  startChallenge,
  getActivePlanFromDB,
  getActiveChallengesFromDB,
} from '@/api/sqlite';

import {
  queryCache,
  batchProcessor,
  performanceMonitor,
  getSegmentCompletionStatusOptimized,
  getBatchSegmentCompletionStatus,
  getOptimizedPlanProgress,
  getOptimizedStatistics,
  invalidateCompletionCache,
  invalidateProgressCache,
  invalidateStatisticsCache,
  invalidateAllCache,
} from '@/api/sqlite-optimized';

// ============================================================================
// TEST TYPES
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalDuration: number;
  passedCount: number;
  failedCount: number;
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

const measurePerformance = async <T>(
  name: string,
  testFunction: () => Promise<T>
): Promise<TestResult> => {
  const startTime = Date.now();
  let passed = false;
  let error: string | undefined;
  let details: any;

  try {
    details = await testFunction();
    passed = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    passed = false;
  }

  const duration = Date.now() - startTime;

  return {
    name,
    passed,
    duration,
    error,
    details,
  };
};

const runTestSuite = async (
  suiteName: string,
  tests: Array<{ name: string; test: () => Promise<any> }>
): Promise<TestSuite> => {
  console.log(`\n🧪 Running test suite: ${suiteName}`);
  console.log('='.repeat(50));

  const testResults: TestResult[] = [];
  let totalDuration = 0;

  for (const { name, test } of tests) {
    const result = await measurePerformance(name, test);
    testResults.push(result);
    totalDuration += result.duration;

    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${name} (${result.duration}ms)`);
    
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  const passedCount = testResults.filter(r => r.passed).length;
  const failedCount = testResults.filter(r => !r.passed).length;

  console.log('\n📊 Summary:');
  console.log(`   Total: ${testResults.length}`);
  console.log(`   Passed: ${passedCount}`);
  console.log(`   Failed: ${failedCount}`);
  console.log(`   Total Duration: ${totalDuration}ms`);
  console.log(`   Average Duration: ${Math.round(totalDuration / testResults.length)}ms`);

  return {
    name: suiteName,
    tests: testResults,
    totalDuration,
    passedCount,
    failedCount,
  };
};

// ============================================================================
// TEST SUITES
// ============================================================================

export const testBasicSQLiteOperations = async (): Promise<TestSuite> => {
  return await runTestSuite('Basic SQLite Operations', [
    {
      name: 'Get Current Streak',
      test: async () => {
        const streak = await getCurrentStreak();
        if (typeof streak !== 'number') {
          throw new Error('Expected number, got ' + typeof streak);
        }
        return streak;
      },
    },
    {
      name: 'Get Best Streak',
      test: async () => {
        const streak = await getBestStreak();
        if (typeof streak !== 'number') {
          throw new Error('Expected number, got ' + typeof streak);
        }
        return streak;
      },
    },
    {
      name: 'Get Completed Segments Count',
      test: async () => {
        const count = await getCompletedSegmentsCount();
        if (typeof count !== 'number') {
          throw new Error('Expected number, got ' + typeof count);
        }
        return count;
      },
    },
    {
      name: 'Get Total Segments Count',
      test: async () => {
        const count = await getTotalSegmentsCount();
        if (typeof count !== 'number') {
          throw new Error('Expected number, got ' + typeof count);
        }
        return count;
      },
    },
    {
      name: 'Get Emoji Stats',
      test: async () => {
        const stats = await getEmojiStats();
        if (!stats || typeof stats !== 'object') {
          throw new Error('Expected object, got ' + typeof stats);
        }
        return stats;
      },
    },
    {
      name: 'Get Source Stats',
      test: async () => {
        const stats = await getSourceStats();
        if (!stats || typeof stats !== 'object') {
          throw new Error('Expected object, got ' + typeof stats);
        }
        return stats;
      },
    },
    {
      name: 'Get Old Testament Progress',
      test: async () => {
        const progress = await getOldTestamentProgress();
        if (!progress || typeof progress !== 'object') {
          throw new Error('Expected object, got ' + typeof progress);
        }
        return progress;
      },
    },
    {
      name: 'Get New Testament Progress',
      test: async () => {
        const progress = await getNewTestamentProgress();
        if (!progress || typeof progress !== 'object') {
          throw new Error('Expected object, got ' + typeof progress);
        }
        return progress;
      },
    },
    {
      name: 'Get Longest Session',
      test: async () => {
        const session = await getLongestSession();
        if (typeof session !== 'number') {
          throw new Error('Expected number, got ' + typeof session);
        }
        return session;
      },
    },
    {
      name: 'Get Completed Books',
      test: async () => {
        const books = await getCompletedBooks();
        if (!Array.isArray(books)) {
          throw new Error('Expected array, got ' + typeof books);
        }
        return books;
      },
    },
    {
      name: 'Check Emoji Collection',
      test: async () => {
        const collection = await checkEmojiCollection();
        if (!collection || typeof collection !== 'object') {
          throw new Error('Expected object, got ' + typeof collection);
        }
        return collection;
      },
    },
    {
      name: 'Get Reading Streak',
      test: async () => {
        const streak = await getReadingStreak();
        if (!streak || typeof streak !== 'object') {
          throw new Error('Expected object, got ' + typeof streak);
        }
        return streak;
      },
    },
    {
      name: 'Get Active Plan',
      test: async () => {
        const plan = await getActivePlanFromDB();
        // Can be null, so just check it's not undefined
        if (plan === undefined) {
          throw new Error('Expected null or object, got undefined');
        }
        return plan;
      },
    },
    {
      name: 'Get Active Challenges',
      test: async () => {
        const challenges = await getActiveChallengesFromDB();
        if (!challenges || typeof challenges !== 'object') {
          throw new Error('Expected object, got ' + typeof challenges);
        }
        return challenges;
      },
    },
  ]);
};

export const testSegmentCompletionOperations = async (): Promise<TestSuite> => {
  return await runTestSuite('Segment Completion Operations', [
    {
      name: 'Get Segment Completion Status (S001)',
      test: async () => {
        const status = await getSegmentCompletionStatus('S001');
        if (!status || typeof status !== 'object') {
          throw new Error('Expected object, got ' + typeof status);
        }
        if (typeof status.isCompleted !== 'boolean') {
          throw new Error('Expected boolean isCompleted, got ' + typeof status.isCompleted);
        }
        return status;
      },
    },
    {
      name: 'Get Segment Completion Status (I001)',
      test: async () => {
        const status = await getSegmentCompletionStatus('I001');
        if (!status || typeof status !== 'object') {
          throw new Error('Expected object, got ' + typeof status);
        }
        // Introduction segments should always be false
        if (status.isCompleted !== false) {
          throw new Error('Expected isCompleted to be false for introduction segment');
        }
        return status;
      },
    },
    {
      name: 'Get Segment Completion Status with Plan Context',
      test: async () => {
        const status = await getSegmentCompletionStatus('S001', 'plan', 'testPlan');
        if (!status || typeof status !== 'object') {
          throw new Error('Expected object, got ' + typeof status);
        }
        return status;
      },
    },
    {
      name: 'Get Segment Completion Status with Challenge Context',
      test: async () => {
        const status = await getSegmentCompletionStatus('S001', 'challenge', undefined, 'testChallenge');
        if (!status || typeof status !== 'object') {
          throw new Error('Expected object, got ' + typeof status);
        }
        return status;
      },
    },
    {
      name: 'Get Segment Completion Status with Today Context',
      test: async () => {
        const status = await getSegmentCompletionStatus('S001', 'today');
        if (!status || typeof status !== 'object') {
          throw new Error('Expected object, got ' + typeof status);
        }
        return status;
      },
    },
  ]);
};

export const testOptimizedOperations = async (): Promise<TestSuite> => {
  return await runTestSuite('Optimized Operations', [
    {
      name: 'Get Optimized Segment Completion Status',
      test: async () => {
        const status = await getSegmentCompletionStatusOptimized('S001');
        if (!status || typeof status !== 'object') {
          throw new Error('Expected object, got ' + typeof status);
        }
        return status;
      },
    },
    {
      name: 'Get Batch Segment Completion Status',
      test: async () => {
        const statuses = await getBatchSegmentCompletionStatus(['S001', 'S002', 'S003']);
        if (!statuses || typeof statuses !== 'object') {
          throw new Error('Expected object, got ' + typeof statuses);
        }
        if (Object.keys(statuses).length !== 3) {
          throw new Error('Expected 3 results, got ' + Object.keys(statuses).length);
        }
        return statuses;
      },
    },
    {
      name: 'Get Optimized Statistics',
      test: async () => {
        const stats = await getOptimizedStatistics();
        if (!stats || typeof stats !== 'object') {
          throw new Error('Expected object, got ' + typeof stats);
        }
        return stats;
      },
    },
    {
      name: 'Cache Operations',
      test: async () => {
        // Test cache set/get
        queryCache.set('test_key', { test: 'data' }, 60000);
        const cached = queryCache.get('test_key');
        if (!cached || cached.test !== 'data') {
          throw new Error('Cache get/set failed');
        }
        
        // Test cache invalidation
        queryCache.invalidate('test_key');
        const invalidated = queryCache.get('test_key');
        if (invalidated !== null) {
          throw new Error('Cache invalidation failed');
        }
        
        return { success: true };
      },
    },
    {
      name: 'Performance Monitoring',
      test: async () => {
        const metrics = performanceMonitor.getMetrics();
        const avgTime = performanceMonitor.getAverageQueryTime();
        const slowQueries = performanceMonitor.getSlowQueries(100);
        
        return {
          metricsCount: metrics.length,
          averageTime: avgTime,
          slowQueriesCount: slowQueries.length,
        };
      },
    },
  ]);
};

export const testCacheInvalidation = async (): Promise<TestSuite> => {
  return await runTestSuite('Cache Invalidation', [
    {
      name: 'Invalidate Completion Cache',
      test: async () => {
        invalidateCompletionCache('S001');
        return { success: true };
      },
    },
    {
      name: 'Invalidate All Completion Cache',
      test: async () => {
        invalidateCompletionCache();
        return { success: true };
      },
    },
    {
      name: 'Invalidate Progress Cache',
      test: async () => {
        invalidateProgressCache('testPlan');
        return { success: true };
      },
    },
    {
      name: 'Invalidate All Progress Cache',
      test: async () => {
        invalidateProgressCache();
        return { success: true };
      },
    },
    {
      name: 'Invalidate Statistics Cache',
      test: async () => {
        invalidateStatisticsCache();
        return { success: true };
      },
    },
    {
      name: 'Invalidate All Cache',
      test: async () => {
        invalidateAllCache();
        return { success: true };
      },
    },
  ]);
};

export const testPlanAndChallengeOperations = async (): Promise<TestSuite> => {
  return await runTestSuite('Plan and Challenge Operations', [
    {
      name: 'Get Optimized Plan Progress',
      test: async () => {
        const progress = await getOptimizedPlanProgress('testPlan');
        if (!progress || typeof progress !== 'object') {
          throw new Error('Expected object, got ' + typeof progress);
        }
        return progress;
      },
    },
    {
      name: 'Get Plan Progress (Original)',
      test: async () => {
        const progress = await getPlanProgress('testPlan');
        if (!progress || typeof progress !== 'object') {
          throw new Error('Expected object, got ' + typeof progress);
        }
        return progress;
      },
    },
    {
      name: 'Get Challenge Progress',
      test: async () => {
        const progress = await getChallengeProgress('testChallenge');
        if (!progress || typeof progress !== 'object') {
          throw new Error('Expected object, got ' + typeof progress);
        }
        return progress;
      },
    },
  ]);
};

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

export const runAllRealTimeUpdateTests = async (): Promise<{
  suites: TestSuite[];
  summary: {
    totalSuites: number;
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    totalDuration: number;
  };
}> => {
  console.log('🚀 Starting Real-Time Update Tests');
  console.log('='.repeat(60));

  const suites = await Promise.all([
    testBasicSQLiteOperations(),
    testSegmentCompletionOperations(),
    testOptimizedOperations(),
    testCacheInvalidation(),
    testPlanAndChallengeOperations(),
  ]);

  const summary = {
    totalSuites: suites.length,
    totalTests: suites.reduce((sum, suite) => sum + suite.tests.length, 0),
    totalPassed: suites.reduce((sum, suite) => sum + suite.passedCount, 0),
    totalFailed: suites.reduce((sum, suite) => sum + suite.failedCount, 0),
    totalDuration: suites.reduce((sum, suite) => sum + suite.totalDuration, 0),
  };

  console.log('\n🎯 FINAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Test Suites: ${summary.totalSuites}`);
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Passed: ${summary.totalPassed}`);
  console.log(`Failed: ${summary.totalFailed}`);
  console.log(`Total Duration: ${summary.totalDuration}ms`);
  console.log(`Average Duration: ${Math.round(summary.totalDuration / summary.totalTests)}ms`);
  console.log(`Success Rate: ${Math.round((summary.totalPassed / summary.totalTests) * 100)}%`);

  if (summary.totalFailed > 0) {
    console.log('\n❌ FAILED TESTS:');
    suites.forEach(suite => {
      suite.tests.forEach(test => {
        if (!test.passed) {
          console.log(`   ${suite.name} - ${test.name}: ${test.error}`);
        }
      });
    });
  }

  return { suites, summary };
};

// ============================================================================
// PERFORMANCE BENCHMARKING
// ============================================================================

export const benchmarkPerformance = async (): Promise<void> => {
  console.log('\n⚡ Performance Benchmarking');
  console.log('='.repeat(40));

  // Benchmark original vs optimized functions
  const iterations = 10;
  const segmentIds = ['S001', 'S002', 'S003', 'S004', 'S005'];

  // Test individual segment completion status
  console.log('\n📊 Individual Segment Completion Status:');
  
  const originalTimes: number[] = [];
  const optimizedTimes: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start1 = Date.now();
    await getSegmentCompletionStatus('S001');
    originalTimes.push(Date.now() - start1);

    const start2 = Date.now();
    await getSegmentCompletionStatusOptimized('S001');
    optimizedTimes.push(Date.now() - start2);
  }

  const avgOriginal = originalTimes.reduce((a, b) => a + b, 0) / originalTimes.length;
  const avgOptimized = optimizedTimes.reduce((a, b) => a + b, 0) / optimizedTimes.length;
  const improvement = ((avgOriginal - avgOptimized) / avgOriginal) * 100;

  console.log(`   Original: ${Math.round(avgOriginal)}ms average`);
  console.log(`   Optimized: ${Math.round(avgOptimized)}ms average`);
  console.log(`   Improvement: ${Math.round(improvement)}%`);

  // Test batch operations
  console.log('\n📊 Batch Segment Completion Status:');
  
  const batchStart = Date.now();
  await getBatchSegmentCompletionStatus(segmentIds);
  const batchTime = Date.now() - batchStart;

  const individualStart = Date.now();
  await Promise.all(segmentIds.map(id => getSegmentCompletionStatus(id)));
  const individualTime = Date.now() - individualStart;

  const batchImprovement = ((individualTime - batchTime) / individualTime) * 100;

  console.log(`   Individual: ${individualTime}ms`);
  console.log(`   Batch: ${batchTime}ms`);
  console.log(`   Improvement: ${Math.round(batchImprovement)}%`);

  // Cache performance
  console.log('\n📊 Cache Performance:');
  const cacheStats = queryCache.getStats();
  console.log(`   Cache Size: ${cacheStats.size}`);
  console.log(`   Cached Keys: ${cacheStats.keys.length}`);
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  runAllRealTimeUpdateTests,
  benchmarkPerformance,
  testBasicSQLiteOperations,
  testSegmentCompletionOperations,
  testOptimizedOperations,
  testCacheInvalidation,
  testPlanAndChallengeOperations,
};
