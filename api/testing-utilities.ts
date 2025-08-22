import logger from '@/utils/logger';
import { databaseManager } from './database-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  resetDatabaseAndStorage,
  migrateAsyncStorageToSQLite,
  type MigrationResult,
  type ResetResult 
} from './database-migration';
import { 
  getDatabaseInfo,
  analyzeDataConflicts,
  logDatabaseDiagnostics,
  type DatabaseInfo,
  type ConflictAnalysis 
} from './database-diagnostics';
import { initializeDatabaseWithDiagnostics } from './database-initialization';
import { settingsHelpers, getSettingsKeys } from '@/services/settings-manager';

// ============================================================================
// CLEAN INSTALL TESTING UTILITIES
// ============================================================================

export interface TestScenario {
  name: string;
  description: string;
  setup: () => Promise<void>;
  execute: () => Promise<any>;
  verify: (result: any) => Promise<boolean>;
  cleanup: () => Promise<void>;
}

export interface TestResult {
  scenario: string;
  success: boolean;
  duration: number;
  result?: any;
  error?: string;
  details?: any;
}

export interface CleanInstallTestSuite {
  name: string;
  scenarios: TestScenario[];
}

// ============================================================================
// TEST DATA GENERATION
// ============================================================================

/**
 * Generate test AsyncStorage data that simulates legacy app state
 */
export async function generateLegacyTestData(): Promise<void> {
  logger.info('📝 Generating legacy test data...');
  
  const testData = {
    // Reading progress data
    completedSegments: ['S001', 'S002', 'S003', 'S010', 'S015'],
    readSegments: ['S001', 'S002', 'S003', 'S004', 'S005', 'S010', 'S015', 'S020'],
    segmentId: 'S020',
    readingPlan: 'chronological',
    lastReadSegment: 'S015',
    
    // Plan data
    activePlan: {
      planId: 'plan_chronological',
      completedSegments: ['S001', 'S002'],
      dateStarted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      lastRead: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      isCompleted: false,
      isPaused: false,
      progressPercentage: 15
    },
    
    // Challenge data
    activeChallenges: {
      'challenge_30_day': {
        challengeId: 'challenge_30_day',
        completedSegments: ['S001', 'S010'],
        dateStarted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        lastRead: new Date().toISOString(),
        isCompleted: false,
        isPaused: false,
        progressPercentage: 6
      }
    },
    
    // User settings (these should remain in AsyncStorage)
    darkMode: 'true',
    language: 'en',
    orientationLocked: 'false',
    groupUserName: 'TestUser123'
  };
  
  // Write test data to AsyncStorage
  for (const [key, value] of Object.entries(testData)) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }
  
  logger.info('✅ Legacy test data generated');
}

/**
 * Clear all test data
 */
export async function clearAllTestData(): Promise<void> {
  logger.info('🧹 Clearing all test data...');
  
  // Clear AsyncStorage
  await AsyncStorage.clear();
  
  // Reset database
  await resetDatabaseAndStorage();
  
  logger.info('✅ All test data cleared');
}

/**
 * Generate clean install state (no previous data)
 */
export async function generateCleanInstallState(): Promise<void> {
  await clearAllTestData();
  logger.info('✅ Clean install state generated');
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

/**
 * Test: Fresh app install (no existing data)
 */
export const freshInstallScenario: TestScenario = {
  name: 'fresh_install',
  description: 'Test database initialization on fresh app install',
  
  setup: async () => {
    await generateCleanInstallState();
  },
  
  execute: async () => {
    const result = await initializeDatabaseWithDiagnostics();
    const dbInfo = await getDatabaseInfo();
    const conflicts = await analyzeDataConflicts();
    
    return { initResult: result, dbInfo, conflicts };
  },
  
  verify: async (result) => {
    const { initResult, dbInfo, conflicts } = result;
    
    // Should initialize successfully
    if (!initResult.success) return false;
    
    // Should not perform migration on fresh install
    if (initResult.migrationPerformed) return false;
    
    // Should have proper database structure
    if (dbInfo.totalTables < 10) return false;
    
    // Should have no conflicts
    if (conflicts.hasConflicts) return false;
    
    return true;
  },
  
  cleanup: async () => {
    await clearAllTestData();
  }
};

/**
 * Test: App update with legacy AsyncStorage data
 */
export const legacyMigrationScenario: TestScenario = {
  name: 'legacy_migration',
  description: 'Test migration from AsyncStorage to SQLite',
  
  setup: async () => {
    await generateCleanInstallState();
    await generateLegacyTestData();
  },
  
  execute: async () => {
    const preMigrationConflicts = await analyzeDataConflicts();
    const initResult = await initializeDatabaseWithDiagnostics();
    const postMigrationConflicts = await analyzeDataConflicts();
    const dbInfo = await getDatabaseInfo();
    
    return { 
      preMigrationConflicts, 
      initResult, 
      postMigrationConflicts, 
      dbInfo 
    };
  },
  
  verify: async (result) => {
    const { preMigrationConflicts, initResult, postMigrationConflicts, dbInfo } = result;
    
    // Should have conflicts before migration
    if (!preMigrationConflicts.hasConflicts) return false;
    
    // Should initialize successfully and perform migration
    if (!initResult.success || !initResult.migrationPerformed) return false;
    
    // Should have reduced conflicts after migration
    if (postMigrationConflicts.conflicts.length >= preMigrationConflicts.conflicts.length) return false;
    
    // Should have populated database
    const segmentsTable = dbInfo.tablesSummary.find((t: { name: string; rowCount: number }) => t.name === 'segments');
    if (!segmentsTable || segmentsTable.rowCount === 0) return false;
    
    return true;
  },
  
  cleanup: async () => {
    await clearAllTestData();
  }
};

/**
 * Test: Database reset and recovery
 */
export const resetRecoveryScenario: TestScenario = {
  name: 'reset_recovery',
  description: 'Test complete database reset and recovery',
  
  setup: async () => {
    await generateCleanInstallState();
    await initializeDatabaseWithDiagnostics();
    // Add some test data
    await generateLegacyTestData();
  },
  
  execute: async () => {
    const preResetInfo = await getDatabaseInfo();
    const resetResult = await resetDatabaseAndStorage();
    const postResetInfo = await getDatabaseInfo();
    const recoveryResult = await initializeDatabaseWithDiagnostics();
    
    return { preResetInfo, resetResult, postResetInfo, recoveryResult };
  },
  
  verify: async (result) => {
    const { preResetInfo, resetResult, postResetInfo, recoveryResult } = result;
    
    // Reset should be successful
    if (!resetResult.success) return false;
    
    // Should have cleared tables
    if (resetResult.tablesReset.length === 0) return false;
    
    // Should recover successfully
    if (!recoveryResult.success) return false;
    
    // Database should be functional after recovery
    if (postResetInfo.totalTables === 0) return false;
    
    return true;
  },
  
  cleanup: async () => {
    await clearAllTestData();
  }
};

/**
 * Test: Settings preservation during migration
 */
export const settingsPreservationScenario: TestScenario = {
  name: 'settings_preservation',
  description: 'Test that user settings are preserved during migration',
  
  setup: async () => {
    await generateCleanInstallState();
    
    // Set specific user settings
    await settingsHelpers.setDarkMode(true);
    await settingsHelpers.setLanguage('en');
    await settingsHelpers.setOrientationLock(true);
    await settingsHelpers.setGroupUserName('PreservationTest');
    
    await generateLegacyTestData();
  },
  
  execute: async () => {
    const preSettings = {
      darkMode: await settingsHelpers.getDarkMode(),
      language: await settingsHelpers.getLanguage(),
      orientationLocked: await settingsHelpers.getOrientationLock(),
      groupUserName: await settingsHelpers.getGroupUserName()
    };
    
    const migrationResult = await migrateAsyncStorageToSQLite();
    
    const postSettings = {
      darkMode: await settingsHelpers.getDarkMode(),
      language: await settingsHelpers.getLanguage(),
      orientationLocked: await settingsHelpers.getOrientationLock(),
      groupUserName: await settingsHelpers.getGroupUserName()
    };
    
    return { preSettings, migrationResult, postSettings };
  },
  
  verify: async (result) => {
    const { preSettings, migrationResult, postSettings } = result;
    
    // Migration should be successful
    if (!migrationResult.success) return false;
    
    // Settings should be preserved
    if (preSettings.darkMode !== postSettings.darkMode) return false;
    if (preSettings.language !== postSettings.language) return false;
    if (preSettings.orientationLocked !== postSettings.orientationLocked) return false;
    if (preSettings.groupUserName !== postSettings.groupUserName) return false;
    
    return true;
  },
  
  cleanup: async () => {
    await clearAllTestData();
  }
};

// ============================================================================
// TEST SUITE EXECUTION
// ============================================================================

/**
 * Execute a single test scenario
 */
export async function runTestScenario(scenario: TestScenario): Promise<TestResult> {
  const startTime = Date.now();
  let result: TestResult = {
    scenario: scenario.name,
    success: false,
    duration: 0
  };
  
  try {
          // Running test: ${scenario.name}
    logger.info(`📝 Description: ${scenario.description}`);
    
    // Setup
    await scenario.setup();
    logger.info('✅ Setup completed');
    
    // Execute
    const executeResult = await scenario.execute();
    logger.info('✅ Execution completed');
    
    // Verify
    const isValid = await scenario.verify(executeResult);
    logger.info(`${isValid ? '✅' : '❌'} Verification ${isValid ? 'passed' : 'failed'}`);
    
    // Cleanup
    await scenario.cleanup();
    logger.info('✅ Cleanup completed');
    
    result.success = isValid;
    result.result = executeResult;
    result.duration = Date.now() - startTime;
    
  } catch (error) {
    logger.error(`❌ Test failed: ${scenario.name}`, error);
    result.error = error instanceof Error ? error.message : String(error);
    result.duration = Date.now() - startTime;
    
    // Attempt cleanup even if test failed
    try {
      await scenario.cleanup();
    } catch (cleanupError) {
      logger.error('❌ Cleanup failed:', cleanupError);
    }
  }
  
  return result;
}

/**
 * Run complete test suite
 */
export async function runCleanInstallTestSuite(): Promise<TestResult[]> {
  // Starting Clean Install Test Suite
  
  const scenarios = [
    freshInstallScenario,
    legacyMigrationScenario,
    resetRecoveryScenario,
    settingsPreservationScenario
  ];
  
  const results: TestResult[] = [];
  
  for (const scenario of scenarios) {
    const result = await runTestScenario(scenario);
    results.push(result);
    
    logger.info(`${result.success ? '✅' : '❌'} ${scenario.name}: ${result.success ? 'PASSED' : 'FAILED'} (${result.duration}ms)`);
    
    if (result.error) {
      logger.error(`   Error: ${result.error}`);
    }
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  logger.info('\n📊 Test Suite Summary:');
  logger.info(`${passed}/${total} tests passed`);
  
  if (passed === total) {
    logger.info('🎉 All tests passed!');
  } else {
    logger.info('❌ Some tests failed. Review logs above.');
  }
  
  return results;
}

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

/**
 * Quick database state inspection for development
 */
export async function inspectDatabaseState(): Promise<void> {
      // Database State Inspection
  
  try {
    const dbInfo = await getDatabaseInfo();
    const conflicts = await analyzeDataConflicts();
    
    logger.info('\n📊 Database Info:');
    logger.info(`- Version: ${dbInfo.version}`);
    logger.info(`- Tables: ${dbInfo.totalTables}`);
    logger.info(`- Schema Hash: ${dbInfo.schemaHash}`);
    
    logger.info('\n📊 Tables:');
    dbInfo.tablesSummary.forEach(table => {
      logger.info(`- ${table.name}: ${table.rowCount} rows${table.hasData ? ' ✓' : ' (empty)'}`);
    });
    
    logger.info('\n⚠️ Conflicts:');
    if (conflicts.hasConflicts) {
      conflicts.conflicts.forEach(conflict => {
        logger.info(`- ${conflict.key} (${conflict.severity}): ${conflict.description}`);
      });
    } else {
      logger.info('- No conflicts detected ✅');
    }
    
    logger.info('\n💾 AsyncStorage Keys:');
    const asyncKeys = await AsyncStorage.getAllKeys();
    const settingsKeys = getSettingsKeys();
    
    asyncKeys.forEach(key => {
      const isSettings = settingsKeys.includes(key);
      logger.info(`- ${key}${isSettings ? ' (settings)' : ''}`);
    });
    
  } catch (error) {
    logger.error('❌ Failed to inspect database state:', error);
  }
}

/**
 * Export current state for debugging
 */
export async function exportCurrentState(): Promise<string> {
  try {
    const dbInfo = await getDatabaseInfo();
    const conflicts = await analyzeDataConflicts();
    const asyncKeys = await AsyncStorage.getAllKeys();
    
    const state = {
      timestamp: new Date().toISOString(),
      databaseInfo: dbInfo,
      conflicts,
      asyncStorageKeys: asyncKeys,
      appVersion: '1.0.5'
    };
    
    return JSON.stringify(state, null, 2);
  } catch (error) {
    throw new Error(`Failed to export state: ${error}`);
  }
}
