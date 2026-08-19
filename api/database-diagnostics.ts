import logger from '@/utils/logger';
import { databaseManager } from './database-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// DATABASE DIAGNOSTICS AND VERSIONING
// ============================================================================

export interface DatabaseInfo {
  version: number;
  schemaHash: string;
  createdAt: string;
  lastMigration: string | null;
  totalTables: number;
  tablesSummary: TableInfo[];
}

export interface TableInfo {
  name: string;
  rowCount: number;
  columns: ColumnInfo[];
  hasData: boolean;
}

export interface ColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  defaultValue: any;
  primaryKey: boolean;
}

export interface AsyncStorageData {
  [key: string]: any;
}

export interface ConflictAnalysis {
  hasConflicts: boolean;
  conflicts: DataConflict[];
  asyncStorageKeys: string[];
  sqliteTableCount: number;
  recommendations: string[];
}

export interface DataConflict {
  key: string;
  asyncStorageValue: any;
  sqliteEquivalent: any;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

// Current database version - increment when schema changes
export const CURRENT_DB_VERSION = 2;

/**
 * Initialize database versioning table and metadata
 */
export async function initializeDatabaseVersioning(): Promise<void> {
  try {
    const db = databaseManager.getDatabase();
    
    // Create versioning metadata table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS db_metadata (
        id INTEGER PRIMARY KEY NOT NULL,
        version INTEGER NOT NULL,
        schemaHash TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        lastMigration TEXT,
        appVersion TEXT,
        deviceInfo TEXT
      );
    `);

    // Check if version info exists
    const versionInfo = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM db_metadata WHERE id = 1'
    );

    if (!versionInfo) {
      // First time initialization
      const schemaHash = await generateSchemaHash();
      await db.runAsync(`
        INSERT INTO db_metadata (
          id, version, schemaHash, createdAt, appVersion
        ) VALUES (1, ?, ?, datetime('now'), ?)
      `, CURRENT_DB_VERSION, schemaHash, '1.0.5'); // Using version from package.json
    }
  } catch (error) {
    logger.error('Error initializing database versioning:', error);
    throw error;
  }
}

/**
 * Generate a hash of the current database schema
 */
export async function generateSchemaHash(): Promise<string> {
  try {
    const db = databaseManager.getDatabase();
    
    // Get all table schemas
    const tables = await db.getAllAsync<{ sql: string }>(
      "SELECT sql FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    
    const schemaString = tables.map(t => t.sql).join('|');
    
    // Simple hash function (for production, consider crypto-js)
    let hash = 0;
    for (let i = 0; i < schemaString.length; i++) {
      const char = schemaString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(16);
  } catch (error) {
    logger.error('Error generating schema hash:', error);
    return 'unknown';
  }
}

/**
 * Get comprehensive database information
 */
export async function getDatabaseInfo(): Promise<DatabaseInfo> {
  try {
    const db = databaseManager.getDatabase();
    
    // Get version info
    const versionInfo = await db.getFirstAsync<{
      version: number;
      schemaHash: string;
      createdAt: string;
      lastMigration: string | null;
    }>('SELECT version, schemaHash, createdAt, lastMigration FROM db_metadata WHERE id = 1');
    
    // Get all tables
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    
    const tablesSummary: TableInfo[] = [];
    
    for (const table of tables) {
      const columns = await db.getAllAsync<{
        name: string;
        type: string;
        notnull: number;
        dflt_value: any;
        pk: number;
      }>(`PRAGMA table_info(${table.name})`);
      
      const rowCount = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${table.name}`
      );
      
      tablesSummary.push({
        name: table.name,
        rowCount: rowCount?.count || 0,
        hasData: (rowCount?.count || 0) > 0,
        columns: columns.map(col => ({
          name: col.name,
          type: col.type,
          notNull: col.notnull === 1,
          defaultValue: col.dflt_value,
          primaryKey: col.pk === 1
        }))
      });
    }
    
    return {
      version: versionInfo?.version || 0,
      schemaHash: versionInfo?.schemaHash || 'unknown',
      createdAt: versionInfo?.createdAt || 'unknown',
      lastMigration: versionInfo?.lastMigration || null,
      totalTables: tables.length,
      tablesSummary
    };
  } catch (error) {
    logger.error('Error getting database info:', error);
    throw error;
  }
}

/**
 * Analyze conflicts between AsyncStorage and SQLite data
 */
export async function analyzeDataConflicts(): Promise<ConflictAnalysis> {
  try {
    const conflicts: DataConflict[] = [];
    const recommendations: string[] = [];
    
    // Get all AsyncStorage keys
    const asyncKeys = await AsyncStorage.getAllKeys();
    const asyncData: AsyncStorageData = {};
    
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
        logger.warn(`Error reading AsyncStorage key ${key}:`, error);
      }
    }
    
    const db = databaseManager.getDatabase();
    
    // Check specific conflicts
    await checkSegmentCompletionConflicts(asyncData, conflicts, db);
    await checkPlanChallengeConflicts(asyncData, conflicts, db);
    await checkSettingsConflicts(asyncData, conflicts);
    
    // Generate recommendations
    if (conflicts.length > 0) {
      recommendations.push('Migration required: AsyncStorage data conflicts with SQLite');
      recommendations.push('Consider implementing data migration strategy');
      
      const highSeverityConflicts = conflicts.filter(c => c.severity === 'high');
      if (highSeverityConflicts.length > 0) {
        recommendations.push('Critical: High severity conflicts detected - immediate action required');
      }
    }
    
    if (asyncKeys.length > 10) {
      recommendations.push('Consider cleaning up unused AsyncStorage keys');
    }
    
    const tableCount = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'"
    );
    
    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      asyncStorageKeys: [...asyncKeys],
      sqliteTableCount: tableCount?.count || 0,
      recommendations
    };
  } catch (error) {
    logger.error('Error analyzing data conflicts:', error);
    throw error;
  }
}

/**
 * Check for segment completion conflicts
 */
async function checkSegmentCompletionConflicts(
  asyncData: AsyncStorageData,
  conflicts: DataConflict[],
  db: any
): Promise<void> {
  // Check completed segments
  if (asyncData.completedSegments) {
    const asyncCompleted = Array.isArray(asyncData.completedSegments) 
      ? asyncData.completedSegments 
      : [];
    
    const sqliteCompleted = await db.getAllAsync(
      'SELECT segmentID FROM completedSegments WHERE isCompleted = 1'
    ) as { segmentID: string }[];
    
    const sqliteCompletedIds = sqliteCompleted.map((s: { segmentID: string }) => s.segmentID);
    
    const onlyInAsync = asyncCompleted.filter((id: string) => !sqliteCompletedIds.includes(id));
    const onlyInSqlite = sqliteCompletedIds.filter((id: string) => !asyncCompleted.includes(id));
    
    if (onlyInAsync.length > 0 || onlyInSqlite.length > 0) {
      conflicts.push({
        key: 'completedSegments',
        asyncStorageValue: asyncCompleted,
        sqliteEquivalent: sqliteCompletedIds,
        severity: 'high',
        description: `Completed segments mismatch: ${onlyInAsync.length} only in AsyncStorage, ${onlyInSqlite.length} only in SQLite`
      });
    }
  }
  
  // Check read segments
  if (asyncData.readSegments) {
    conflicts.push({
      key: 'readSegments',
      asyncStorageValue: asyncData.readSegments,
      sqliteEquivalent: 'No direct equivalent - using completion tracking',
      severity: 'medium',
      description: 'readSegments in AsyncStorage has no direct SQLite equivalent'
    });
  }
}

/**
 * Check for plan and challenge conflicts
 */
async function checkPlanChallengeConflicts(
  asyncData: AsyncStorageData,
  conflicts: DataConflict[],
  db: any
): Promise<void> {
  // Check active plan
  if (asyncData.activePlan) {
    const sqliteActivePlan = await db.getFirstAsync(
      'SELECT * FROM plan_challenge_status WHERE itemType = "plan" AND isActive = 1'
    );
    
    if (JSON.stringify(asyncData.activePlan) !== JSON.stringify(sqliteActivePlan)) {
      conflicts.push({
        key: 'activePlan',
        asyncStorageValue: asyncData.activePlan,
        sqliteEquivalent: sqliteActivePlan,
        severity: 'high',
        description: 'Active plan data differs between AsyncStorage and SQLite'
      });
    }
  }
  
  // Check active challenges
  if (asyncData.activeChallenges) {
    const sqliteActiveChallenges = await db.getAllAsync(
      'SELECT * FROM plan_challenge_status WHERE itemType = "challenge" AND isActive = 1'
    );
    
    conflicts.push({
      key: 'activeChallenges',
      asyncStorageValue: asyncData.activeChallenges,
      sqliteEquivalent: sqliteActiveChallenges,
      severity: 'medium',
      description: 'Active challenges structure differs between storage systems'
    });
  }
}

/**
 * Check for settings conflicts
 */
async function checkSettingsConflicts(
  asyncData: AsyncStorageData,
  conflicts: DataConflict[]
): Promise<void> {
  const settingsKeys = ['darkMode', 'language', 'orientationLocked', 'groupUserName'];
  
  for (const key of settingsKeys) {
    if (asyncData[key] !== undefined) {
      conflicts.push({
        key,
        asyncStorageValue: asyncData[key],
        sqliteEquivalent: 'Settings should remain in AsyncStorage',
        severity: 'low',
        description: `${key} is correctly stored in AsyncStorage for settings`
      });
    }
  }
}

/**
 * Check if database is from a previous version
 */
export async function isDatabaseOutdated(): Promise<{
  isOutdated: boolean;
  currentVersion: number;
  expectedVersion: number;
  needsMigration: boolean;
}> {
  try {
    await initializeDatabaseVersioning();
    
    const db = databaseManager.getDatabase();
    const versionInfo = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM db_metadata WHERE id = 1'
    );
    
    const currentVersion = versionInfo?.version || 0;
    const isOutdated = currentVersion < CURRENT_DB_VERSION;
    
    return {
      isOutdated,
      currentVersion,
      expectedVersion: CURRENT_DB_VERSION,
      needsMigration: isOutdated
    };
  } catch (error) {
    logger.error('Error checking database version:', error);
    return {
      isOutdated: true,
      currentVersion: 0,
      expectedVersion: CURRENT_DB_VERSION,
      needsMigration: true
    };
  }
}

/**
 * Log comprehensive database diagnostics
 */
export async function logDatabaseDiagnostics(): Promise<void> {
  try {
    // Database diagnostics completed
    
    const dbInfo = await getDatabaseInfo();
    // Database info logged
    
    const versionCheck = await isDatabaseOutdated();
    // Version check completed
    
    const conflictAnalysis = await analyzeDataConflicts();
    // Conflict analysis completed
    
    // Database diagnostics completed
  } catch (error) {
    logger.error('Error in database diagnostics:', error);
  }
}
