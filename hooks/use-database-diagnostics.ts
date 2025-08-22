import { useState, useCallback } from 'react';
import logger from '@/utils/logger';
import {
  getDatabaseInfo,
  analyzeDataConflicts,
  isDatabaseOutdated,
  logDatabaseDiagnostics,
  type DatabaseInfo,
  type ConflictAnalysis
} from '@/api/database-diagnostics';
import {
  checkAndMigrate,
  type MigrationResult
} from '@/api/database-migration';

export interface UseDatabaseDiagnosticsReturn {
  // State
  dbInfo: DatabaseInfo | null;
  conflicts: ConflictAnalysis | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadDatabaseInfo: () => Promise<void>;
  checkForUpdates: () => Promise<boolean>;
  performAutoMigration: () => Promise<MigrationResult | null>;
  logDiagnostics: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for database diagnostics and management
 */
export const useDatabaseDiagnostics = (): UseDatabaseDiagnosticsReturn => {
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [conflicts, setConflicts] = useState<ConflictAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadDatabaseInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [dbData, conflictData] = await Promise.all([
        getDatabaseInfo(),
        analyzeDataConflicts()
      ]);
      
      setDbInfo(dbData);
      setConflicts(conflictData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load database info: ${errorMessage}`);
      logger.error('Database diagnostics error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    setError(null);
    
    try {
      const versionCheck = await isDatabaseOutdated();
      return versionCheck.needsMigration;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to check for updates: ${errorMessage}`);
      logger.error('Version check error:', err);
      return false;
    }
  }, []);

  const performAutoMigration = useCallback(async (): Promise<MigrationResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await checkAndMigrate();
      
      if (result.error) {
        setError(result.error);
        return null;
      }
      
      if (result.migrationPerformed && result.result) {
        // Refresh database info after migration
        await loadDatabaseInfo();
        return result.result;
      }
      
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Migration failed: ${errorMessage}`);
      logger.error('Auto-migration error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadDatabaseInfo]);

  const logDiagnostics = useCallback(async () => {
    setError(null);
    
    try {
      await logDatabaseDiagnostics();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to log diagnostics: ${errorMessage}`);
      logger.error('Diagnostics logging error:', err);
    }
  }, []);

  return {
    dbInfo,
    conflicts,
    loading,
    error,
    loadDatabaseInfo,
    checkForUpdates,
    performAutoMigration,
    logDiagnostics,
    clearError
  };
};
