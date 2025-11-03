import { databaseManager } from '@/api/database-manager';
import { initializeSettingsTable, migrateFromAsyncStorage } from './sync-settings-manager';
import { migrateEmojiTableForNotes } from '@/api/database-migration';
import { migrateQuestionsToDatabase } from '@/api/questions-migration';
import { bibleStorageManager } from './BibleStorageManager';
import logger from '@/utils/logger';

// ============================================================================
// APP STARTUP MANAGER - SYNCHRONOUS INITIALIZATION
// ============================================================================

/**
 * Initialize all app systems synchronously during startup
 * This ensures database and settings are ready before any components render
 */
export async function initializeAppSystems(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 1. Initialize database first (this is critical)
    await databaseManager.initialize();
    
    // 2. Run schema migrations (before settings initialization)
    await runSchemaMigrations();
    
    // 3. Initialize settings table structure
    await initializeSettingsTable();
    
    // 4. Migrate from AsyncStorage if needed (background operation)
    migrateFromAsyncStorage().catch(error => {
      // Don't block startup for migration failures
      setTimeout(() => {
        logger.info('AsyncStorage migration completed with warnings:', error);
      }, 1000);
    });
    
    // 5. Initialize Bible storage manager (background operation)
    bibleStorageManager.initialize().catch(error => {
      logger.error('Bible storage initialization failed:', error);
    });
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown initialization error'
    };
  }
}

/**
 * Run necessary schema migrations
 */
async function runSchemaMigrations(): Promise<void> {
  try {
    // Check if we need to migrate emoji table for notes feature
    const db = databaseManager.getDatabase();
    
    // Check if the emojis table has the old schema (emoji NOT NULL)
    const tableInfo = await db.getAllAsync<{ name: string; type: string; notnull: number }>(
      "PRAGMA table_info(emojis)"
    );
    
    const emojiColumn = tableInfo.find(col => col.name === 'emoji');
    const needsMigration = emojiColumn && emojiColumn.notnull === 1;
    
    if (needsMigration) {
      logger.info('📝 Emoji table needs migration for notes feature');
      const result = await migrateEmojiTableForNotes();
      if (result.success) {
        logger.info('✅ Emoji table migration successful');
      } else {
        logger.error('❌ Emoji table migration failed:', result.error);
      }
    } else {
      logger.info('✅ Emoji table already supports notes feature');
    }

    // Migrate questions from JSON to SQLite (one-time migration) - run in background to not block startup
    migrateQuestionsToDatabase().then((questionsResult) => {
      if (questionsResult.success && questionsResult.totalInserted > 0) {
        logger.info(`Questions migrated: ${questionsResult.totalInserted} sets`);
      }
    }).catch(error => {
      logger.error('Questions migration error:', error);
    });

  } catch (error) {
    logger.error('Error checking/running migrations:', error);
    // Don't throw - allow app to continue even if migration check fails
  }
}

/**
 * Check if app systems are ready for synchronous operations
 */
export function areAppSystemsReady(): boolean {
  return databaseManager.isReady();
}

/**
 * Quick health check for all systems
 */
export async function performAppHealthCheck(): Promise<{
  database: boolean;
  settings: boolean;
  overall: boolean;
}> {
  const databaseHealthy = databaseManager.isReady();
  
  let settingsHealthy = false;
  try {
    if (databaseHealthy) {
      const db = databaseManager.getDatabase();
      const result = db.getFirstSync<{ count: number }>(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='user_settings'"
      );
      settingsHealthy = (result?.count || 0) > 0;
    }
  } catch {
    settingsHealthy = false;
  }
  
  return {
    database: databaseHealthy,
    settings: settingsHealthy,
    overall: databaseHealthy && settingsHealthy
  };
}

export default {
  initializeAppSystems,
  areAppSystemsReady,
  performAppHealthCheck
};
