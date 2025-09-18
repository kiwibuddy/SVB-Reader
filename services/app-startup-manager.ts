import { databaseManager } from '@/api/database-manager';
import { initializeSettingsTable, migrateFromAsyncStorage } from './sync-settings-manager';
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
    
    // 2. Initialize settings table structure
    await initializeSettingsTable();
    
    // 3. Migrate from AsyncStorage if needed (background operation)
    migrateFromAsyncStorage().catch(error => {
      // Don't block startup for migration failures
      setTimeout(() => {
        logger.info('AsyncStorage migration completed with warnings:', error);
      }, 1000);
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
