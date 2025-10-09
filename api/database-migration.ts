import logger from '@/utils/logger';
import { databaseManager } from './database-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  initializeDatabaseVersioning, 
  CURRENT_DB_VERSION,
  isDatabaseOutdated 
} from './database-diagnostics';
import {
  safeExecute,
  safeMigrationExecute,
  createSettingsBackup,
  restoreSettingsBackup,
  getCleanupOperations,
  logError,
  type RollbackOperation
} from './error-handling';

// ============================================================================
// DATABASE MIGRATION AND CLEANUP UTILITIES
// ============================================================================

export interface MigrationResult {
  success: boolean;
  migratedData: string[];
  errors: string[];
  cleanedAsyncStorageKeys: string[];
  summary: string;
}

export interface ResetResult {
  success: boolean;
  tablesReset: string[];
  asyncStorageKeysCleared: string[];
  errors: string[];
  summary: string;
}

/**
 * Migrate data from AsyncStorage to SQLite with comprehensive error handling
 */
export async function migrateAsyncStorageToSQLite(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedData: [],
    errors: [],
    cleanedAsyncStorageKeys: [],
    summary: ''
  };

  let settingsBackup: string | null = null;

  try {
    // Create settings backup before starting migration
    settingsBackup = await createSettingsBackup();
    logger.info('📦 Settings backup created before migration');

    // Define rollback operations
    const rollbackOperations: RollbackOperation[] = [
      {
        type: 'settings',
        description: 'Restore AsyncStorage keys if migration fails',
        execute: async () => {
          if (settingsBackup) {
            await restoreSettingsBackup(settingsBackup);
          }
        }
      },
      ...getCleanupOperations()
    ];

    // Execute migration within safe transaction
    await safeMigrationExecute(async () => {
      const db = databaseManager.getDatabase();
      await initializeDatabaseVersioning();

      // Get all AsyncStorage data
      const asyncKeys = await AsyncStorage.getAllKeys();
      const asyncData: { [key: string]: any } = {};
      
      for (const key of asyncKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value !== null) {
            try {
              asyncData[key] = JSON.parse(value);
            } catch {
              asyncData[key] = value;
            }
          }
        } catch (error) {
          result.errors.push(`Error reading AsyncStorage key ${key}: ${error}`);
          logError(error as Error, { operation: `readAsyncStorage:${key}`, timestamp: new Date().toISOString() });
        }
      }

      // Migrate completed segments
      await migrateCompletedSegments(asyncData, db, result);
      
      // Migrate active plans and challenges
      await migrateActivePlansAndChallenges(asyncData, db, result);
      
      // Clean up migrated AsyncStorage keys (but keep settings)
      await cleanupMigratedAsyncStorageData(result);

      // Update database version
      await updateDatabaseVersion();

      result.success = result.errors.length === 0;
      result.summary = `Migration ${result.success ? 'completed successfully' : 'completed with errors'}. ` +
                      `Migrated ${result.migratedData.length} data types, ` +
                      `cleaned ${result.cleanedAsyncStorageKeys.length} AsyncStorage keys.`;

    }, 'AsyncStorage to SQLite Migration', rollbackOperations);

    logger.info('✅ Migration completed successfully');

  } catch (error) {
    result.errors.push(`Migration failed: ${error}`);
    result.summary = 'Migration failed due to critical error.';
    result.success = false;
    
    logError(error as Error, { 
      operation: 'migrateAsyncStorageToSQLite',
      timestamp: new Date().toISOString()
    });

    // Attempt to restore settings if migration failed
    if (settingsBackup) {
      try {
        await restoreSettingsBackup(settingsBackup);
        logger.info('🔄 Settings restored after migration failure');
      } catch (restoreError) {
        logger.error('❌ Failed to restore settings after migration failure:', restoreError);
        result.errors.push(`Failed to restore settings: ${restoreError}`);
      }
    }
  }

  return result;
}

/**
 * Migrate completed segments from AsyncStorage to SQLite
 */
async function migrateCompletedSegments(
  asyncData: { [key: string]: any },
  db: any,
  result: MigrationResult
): Promise<void> {
  try {
    // Migrate completedSegments
    if (asyncData.completedSegments && Array.isArray(asyncData.completedSegments)) {
      const completedSegments = asyncData.completedSegments;
      const currentDate = new Date().toISOString();
      
      for (const segmentID of completedSegments) {
        if (typeof segmentID === 'string' && segmentID.trim()) {
          await db.runAsync(`
            INSERT OR REPLACE INTO completedSegments (
              segmentID, isCompleted, completionDate
            ) VALUES (?, 1, ?)
          `, segmentID, currentDate);
          
          // Also add to legacy completion table
          await db.runAsync(`
            INSERT OR REPLACE INTO segment_completion (
              segmentID, completionType, completionDate, isCurrentlyCompleted
            ) VALUES (?, 'main', ?, 1)
          `, segmentID, currentDate);
        }
      }
      
      result.migratedData.push(`completedSegments (${completedSegments.length} items)`);
    }

    // Migrate readSegments (mark as read but not necessarily completed)
    if (asyncData.readSegments && Array.isArray(asyncData.readSegments)) {
      const readSegments = asyncData.readSegments;
      const currentDate = new Date().toISOString();
      
      for (const segmentID of readSegments) {
        if (typeof segmentID === 'string' && segmentID.trim()) {
          // Add to read count table
          await db.runAsync(`
            INSERT OR REPLACE INTO segment_read_count (
              segmentID, totalReads, lastReadDate
            ) VALUES (
              ?, 
              COALESCE((SELECT totalReads FROM segment_read_count WHERE segmentID = ?), 0) + 1,
              ?
            )
          `, segmentID, segmentID, currentDate);
        }
      }
      
      result.migratedData.push(`readSegments (${readSegments.length} items)`);
    }

  } catch (error) {
    result.errors.push(`Error migrating completed segments: ${error}`);
  }
}

/**
 * Migrate active plans and challenges
 */
async function migrateActivePlansAndChallenges(
  asyncData: { [key: string]: any },
  db: any,
  result: MigrationResult
): Promise<void> {
  try {
    // Migrate activePlan
    if (asyncData.activePlan && typeof asyncData.activePlan === 'object') {
      const plan = asyncData.activePlan;
      
      await db.runAsync(`
        INSERT OR REPLACE INTO plan_challenge_status (
          itemID, itemType, isActive, isCompleted, progressPercentage,
          startDate, lastUpdated
        ) VALUES (?, 'plan', 1, ?, ?, ?, datetime('now'))
      `, 
        plan.planId || plan.id || 'unknown',
        plan.isCompleted ? 1 : 0,
        plan.progressPercentage || 0,
        plan.dateStarted || plan.startDate || new Date().toISOString()
      );
      
      result.migratedData.push('activePlan');
    }

    // Migrate activeChallenges
    if (asyncData.activeChallenges && typeof asyncData.activeChallenges === 'object') {
      const challenges = asyncData.activeChallenges;
      
      for (const [challengeId, challenge] of Object.entries(challenges)) {
        if (typeof challenge === 'object' && challenge !== null) {
          const challengeData = challenge as any;
          
          await db.runAsync(`
            INSERT OR REPLACE INTO plan_challenge_status (
              itemID, itemType, isActive, isCompleted, progressPercentage,
              startDate, lastUpdated
            ) VALUES (?, 'challenge', 1, ?, ?, ?, datetime('now'))
          `, 
            challengeId,
            challengeData.isCompleted ? 1 : 0,
            challengeData.progressPercentage || 0,
            challengeData.dateStarted || challengeData.startDate || new Date().toISOString()
          );
        }
      }
      
      result.migratedData.push(`activeChallenges (${Object.keys(challenges).length} items)`);
    }

  } catch (error) {
    result.errors.push(`Error migrating plans and challenges: ${error}`);
  }
}

/**
 * Clean up migrated AsyncStorage data (keep settings)
 */
async function cleanupMigratedAsyncStorageData(result: MigrationResult): Promise<void> {
  const keysToRemove = [
    'completedSegments',
    'readSegments', 
    'activePlan',
    'activeChallenges',
    'segmentId', // This should be managed differently
    'readingPlan', // This should be managed differently
    'lastReadSegment'
  ];

  // Keep settings-related keys
  const settingsKeys = ['darkMode', 'language', 'orientationLocked', 'groupUserName'];

  for (const key of keysToRemove) {
    try {
      await AsyncStorage.removeItem(key);
      result.cleanedAsyncStorageKeys.push(key);
    } catch (error) {
      result.errors.push(`Error removing AsyncStorage key ${key}: ${error}`);
    }
  }
}

/**
 * Update database version after successful migration
 */
async function updateDatabaseVersion(): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    const newSchemaHash = await require('./database-diagnostics').generateSchemaHash();
    
    await db.runAsync(`
      UPDATE db_metadata 
      SET version = ?, 
          schemaHash = ?, 
          lastMigration = datetime('now')
      WHERE id = 1
    `, CURRENT_DB_VERSION, newSchemaHash);
  } catch (error) {
    logger.error('Error updating database version:', error);
  }
}

/**
 * Completely reset SQLite database and AsyncStorage
 */
export async function resetDatabaseAndStorage(): Promise<ResetResult> {
  const result: ResetResult = {
    success: false,
    tablesReset: [],
    asyncStorageKeysCleared: [],
    errors: [],
    summary: ''
  };

  try {
    const db = databaseManager.getDatabase();

    // Get all table names (excluding sqlite system tables)
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );

    // Clear all tables
    for (const table of tables) {
      try {
        await db.runAsync(`DELETE FROM ${table.name}`);
        result.tablesReset.push(table.name);
      } catch (error) {
        result.errors.push(`Error clearing table ${table.name}: ${error}`);
      }
    }

    // Reset database metadata
    await db.runAsync(`
      INSERT OR REPLACE INTO db_metadata (
        id, version, schemaHash, createdAt, appVersion
      ) VALUES (1, ?, ?, datetime('now'), ?)
    `, CURRENT_DB_VERSION, 'reset', '1.0.5');

    // Clear all AsyncStorage (except system keys)
    const allKeys = await AsyncStorage.getAllKeys();
    const systemKeys = ['expo-auth-session', 'expo-clipboard']; // Keep Expo system keys
    
    const keysToRemove = allKeys.filter(key => 
      !systemKeys.some(systemKey => key.startsWith(systemKey))
    );

    for (const key of keysToRemove) {
      try {
        await AsyncStorage.removeItem(key);
        result.asyncStorageKeysCleared.push(key);
      } catch (error) {
        result.errors.push(`Error removing AsyncStorage key ${key}: ${error}`);
      }
    }

    // Reinitialize essential data structures
    await initializeEssentialData(db);

    result.success = result.errors.length === 0;
    result.summary = `Reset ${result.success ? 'completed successfully' : 'completed with errors'}. ` +
                    `Cleared ${result.tablesReset.length} tables, ` +
                    `removed ${result.asyncStorageKeysCleared.length} AsyncStorage keys.`;

  } catch (error) {
    result.errors.push(`Reset failed: ${error}`);
    result.summary = 'Reset failed due to critical error.';
  }

  return result;
}

/**
 * Initialize essential data after reset
 */
async function initializeEssentialData(db: any): Promise<void> {
  try {
    // Initialize streak data
    await db.runAsync(`
      INSERT INTO streak_data (currentStreak, longestStreak, lastReadDate, lastUpdated)
      VALUES (0, 0, date('now', 'localtime'), datetime('now', 'localtime'))
    `);

    // Repopulate segments table
    await (databaseManager as any).populateSegmentsTable();
    
  } catch (error) {
    logger.error('Error initializing essential data:', error);
  }
}

/**
 * Safely check and perform migration if needed
 */
export async function checkAndMigrate(): Promise<{
  wasOutdated: boolean;
  migrationPerformed: boolean;
  result?: MigrationResult;
  error?: string;
}> {
  try {
    const versionCheck = await isDatabaseOutdated();
    
    if (versionCheck.needsMigration) {
      const migrationResult = await migrateAsyncStorageToSQLite();
      return {
        wasOutdated: true,
        migrationPerformed: true,
        result: migrationResult
      };
    }
    
    return {
      wasOutdated: false,
      migrationPerformed: false
    };
  } catch (error) {
    return {
      wasOutdated: true,
      migrationPerformed: false,
      error: `Migration check failed: ${error}`
    };
  }
}

/**
 * Force refresh database by closing and reinitializing
 */
export async function forceRefreshDatabase(): Promise<void> {
  try {
    await databaseManager.close();
    await databaseManager.initialize();
  } catch (error) {
    logger.error('Error force refreshing database:', error);
    throw error;
  }
}

/**
 * Migrate emojis table to allow NULL emoji values (for note-only reactions)
 * Version 1.0.1 - Notes Feature Migration
 */
export async function migrateEmojiTableForNotes(): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('🔄 Starting emoji table migration for notes feature...');
    const db = databaseManager.getDatabase();
    
    // Begin transaction
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      // Step 1: Create new table with updated schema
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS emojis_new (
          id INTEGER PRIMARY KEY NOT NULL,
          segmentID TEXT NOT NULL,
          blockID TEXT NOT NULL,
          blockData TEXT NOT NULL,
          emoji TEXT,
          note TEXT DEFAULT '',
          lastUpdated DATETIME DEFAULT (datetime('now')),
          UNIQUE(segmentID, blockID)
        );
      `);
      
      // Step 2: Copy existing data
      await db.execAsync(`
        INSERT INTO emojis_new (id, segmentID, blockID, blockData, emoji, note)
        SELECT id, segmentID, blockID, blockData, emoji, COALESCE(note, '') FROM emojis;
      `);
      
      // Step 3: Drop old table
      await db.execAsync('DROP TABLE emojis;');
      
      // Step 4: Rename new table
      await db.execAsync('ALTER TABLE emojis_new RENAME TO emojis;');
      
      // Commit transaction
      await db.execAsync('COMMIT');
      
      logger.info('✅ Emoji table migration completed successfully');
      return { success: true };
      
    } catch (error) {
      // Rollback on error
      await db.execAsync('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    const errorMessage = `Failed to migrate emoji table: ${error}`;
    logger.error('❌', errorMessage);
    return { success: false, error: errorMessage };
  }
}
