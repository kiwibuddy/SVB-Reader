import { databaseManager } from './database-manager';
import { 
  initializeDatabaseVersioning, 
  logDatabaseDiagnostics,
  isDatabaseOutdated 
} from './database-diagnostics';
import { checkAndMigrate } from './database-migration';

// ============================================================================
// DATABASE INITIALIZATION WITH AUTOMATIC DIAGNOSTICS
// ============================================================================

/**
 * Initialize database with automatic migration detection and diagnostics
 * This should be called early in your app startup process
 */
export async function initializeDatabaseWithDiagnostics(): Promise<{
  success: boolean;
  migrationPerformed: boolean;
  error?: string;
}> {
  try {
    // Initialize the database
    await databaseManager.initialize();
    
    // Initialize versioning system
    await initializeDatabaseVersioning();
    
    // Check if migration is needed and perform it
    const migrationResult = await checkAndMigrate();
    
    // Log diagnostics in development
    if (__DEV__) {
      // Database initialization completed
      await logDatabaseDiagnostics();
      
      if (migrationResult.migrationPerformed) {
        console.log('✅ Migration performed successfully');
      } else if (migrationResult.error) {
        console.error('❌ Migration failed:', migrationResult.error);
      } else {
        // Database up to date, no migration needed
      }
    }
    
    return {
      success: true,
      migrationPerformed: migrationResult.migrationPerformed,
      error: migrationResult.error
    };
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    return {
      success: false,
      migrationPerformed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Quick health check for database
 */
export async function performDatabaseHealthCheck(): Promise<{
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  try {
    // Check if database is ready
    if (!databaseManager.isReady()) {
      issues.push('Database is not initialized');
      recommendations.push('Call initializeDatabaseWithDiagnostics() first');
      return { isHealthy: false, issues, recommendations };
    }
    
    // Check version status
    const versionCheck = await isDatabaseOutdated();
    if (versionCheck.isOutdated) {
      issues.push(`Database version is outdated (current: ${versionCheck.currentVersion}, expected: ${versionCheck.expectedVersion})`);
      recommendations.push('Run migration to update database');
    }
    
    // Check basic table existence
    const db = databaseManager.getDatabase();
    const tableCount = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'"
    );
    
    if ((tableCount?.count || 0) < 5) {
      issues.push('Missing expected database tables');
      recommendations.push('Reset and reinitialize database');
    }
    
    // Check for empty critical tables
    const criticalTables = ['segments', 'streak_data'];
    for (const tableName of criticalTables) {
      try {
        const rowCount = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM ${tableName}`
        );
        if ((rowCount?.count || 0) === 0) {
          issues.push(`Critical table '${tableName}' is empty`);
          recommendations.push(`Repopulate ${tableName} table`);
        }
      } catch (error) {
        issues.push(`Cannot access table '${tableName}': ${error}`);
        recommendations.push('Check database schema integrity');
      }
    }
    
    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations
    };
    
  } catch (error) {
    issues.push(`Health check failed: ${error}`);
    recommendations.push('Investigate database connectivity issues');
    return { isHealthy: false, issues, recommendations };
  }
}
