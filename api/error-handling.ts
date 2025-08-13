import { databaseManager } from './database-manager';
import logger from '@/utils/logger';
import { settingsHelpers } from '@/services/settings-manager';

// ============================================================================
// ERROR HANDLING AND ROLLBACK MECHANISMS
// ============================================================================

export interface ErrorContext {
  operation: string;
  timestamp: string;
  userId?: string;
  deviceInfo?: string;
  appVersion?: string;
}

export interface RollbackOperation {
  type: 'database' | 'settings' | 'mixed';
  description: string;
  execute: () => Promise<void>;
}

export interface DatabaseTransaction {
  id: string;
  operations: string[];
  startTime: string;
  rollbackOperations: RollbackOperation[];
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly context: ErrorContext,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class MigrationError extends Error {
  constructor(
    message: string,
    public readonly context: ErrorContext,
    public readonly rollbackOperations: RollbackOperation[],
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'MigrationError';
  }
}

// ============================================================================
// TRANSACTION MANAGEMENT
// ============================================================================

let activeTransactions = new Map<string, DatabaseTransaction>();

/**
 * Start a database transaction with rollback capabilities
 */
export async function startTransaction(description: string): Promise<string> {
  const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const transaction: DatabaseTransaction = {
    id: transactionId,
    operations: [],
    startTime: new Date().toISOString(),
    rollbackOperations: []
  };
  
  activeTransactions.set(transactionId, transaction);
  
  try {
    const db = databaseManager.getDatabase();
    await db.execAsync('BEGIN TRANSACTION');
    logger.info(`🔄 Started transaction: ${transactionId} - ${description}`);
  } catch (error) {
    activeTransactions.delete(transactionId);
    throw new DatabaseError(
      `Failed to start transaction: ${description}`,
      {
        operation: 'startTransaction',
        timestamp: new Date().toISOString()
      },
      error as Error
    );
  }
  
  return transactionId;
}

/**
 * Add rollback operation to transaction
 */
export function addRollbackOperation(
  transactionId: string,
  operation: RollbackOperation
): void {
  const transaction = activeTransactions.get(transactionId);
  if (transaction) {
    transaction.rollbackOperations.push(operation);
  }
}

/**
 * Commit transaction
 */
export async function commitTransaction(transactionId: string): Promise<void> {
  const transaction = activeTransactions.get(transactionId);
  if (!transaction) {
    throw new Error(`Transaction not found: ${transactionId}`);
  }
  
  try {
    const db = databaseManager.getDatabase();
    await db.execAsync('COMMIT');
    activeTransactions.delete(transactionId);
    logger.info(`✅ Committed transaction: ${transactionId}`);
  } catch (error) {
    // If commit fails, attempt rollback
    await rollbackTransaction(transactionId);
    throw new DatabaseError(
      `Failed to commit transaction: ${transactionId}`,
      {
        operation: 'commitTransaction',
        timestamp: new Date().toISOString()
      },
      error as Error
    );
  }
}

/**
 * Rollback transaction and execute custom rollback operations
 */
export async function rollbackTransaction(transactionId: string): Promise<void> {
  const transaction = activeTransactions.get(transactionId);
  if (!transaction) {
    logger.warn(`Transaction not found for rollback: ${transactionId}`);
    return;
  }
  
  const errors: Error[] = [];
  
  try {
    // First, rollback the database transaction
    const db = databaseManager.getDatabase();
    await db.execAsync('ROLLBACK');
    logger.info(`🔄 Database transaction rolled back: ${transactionId}`);
  } catch (error) {
    errors.push(error as Error);
    logger.error(`Error rolling back database transaction ${transactionId}:`, error);
  }
  
  // Execute custom rollback operations in reverse order
  for (let i = transaction.rollbackOperations.length - 1; i >= 0; i--) {
    const operation = transaction.rollbackOperations[i];
    try {
      await operation.execute();
      logger.info(`✅ Executed rollback: ${operation.description}`);
    } catch (error) {
      errors.push(error as Error);
      logger.error(`❌ Failed rollback operation: ${operation.description}`, error);
    }
  }
  
  activeTransactions.delete(transactionId);
  
  if (errors.length > 0) {
    throw new Error(`Rollback completed with ${errors.length} errors: ${errors.map(e => e.message).join(', ')}`);
  }
  
  logger.info(`🔄 Transaction rolled back successfully: ${transactionId}`);
}

// ============================================================================
// SAFE OPERATION WRAPPERS
// ============================================================================

/**
 * Execute database operation with automatic error handling and rollback
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  context: Partial<ErrorContext>,
  rollbackOperations: RollbackOperation[] = []
): Promise<T> {
  const transactionId = await startTransaction(context.operation || 'safeExecute');
  
  try {
    // Add rollback operations to transaction
    rollbackOperations.forEach(op => addRollbackOperation(transactionId, op));
    
    const result = await operation();
    await commitTransaction(transactionId);
    return result;
  } catch (error) {
    await rollbackTransaction(transactionId);
    
    const errorContext: ErrorContext = {
      operation: context.operation || 'unknown',
      timestamp: new Date().toISOString(),
      appVersion: '1.0.5',
      ...context
    };
    
    throw new DatabaseError(
      `Operation failed: ${context.operation}`,
      errorContext,
      error as Error
    );
  }
}

/**
 * Execute migration with comprehensive error handling
 */
export async function safeMigrationExecute<T>(
  operation: () => Promise<T>,
  description: string,
  rollbackOperations: RollbackOperation[] = []
): Promise<T> {
  try {
    return await safeExecute(
      operation,
      { operation: `migration: ${description}` },
      rollbackOperations
    );
  } catch (error) {
    throw new MigrationError(
      `Migration failed: ${description}`,
      {
        operation: `migration: ${description}`,
        timestamp: new Date().toISOString(),
        appVersion: '1.0.5'
      },
      rollbackOperations,
      error as Error
    );
  }
}

// ============================================================================
// RECOVERY OPERATIONS
// ============================================================================

/**
 * Attempt to recover from database corruption
 */
export async function recoverFromCorruption(): Promise<boolean> {
  try {
    logger.info('🔧 Attempting database recovery...');
    
    // Close current database connection
    await databaseManager.close();
    
    // Attempt to reinitialize
    await databaseManager.initialize();
    
    // Verify basic functionality
    const db = databaseManager.getDatabase();
    await db.getFirstAsync('SELECT 1');
    
    logger.info('✅ Database recovery successful');
    return true;
  } catch (error) {
    logger.error('❌ Database recovery failed:', error);
    return false;
  }
}

/**
 * Create backup of critical settings before risky operations
 */
export async function createSettingsBackup(): Promise<string> {
  try {
    const backup = await settingsHelpers.exportSettings();
    const backupKey = `settings_backup_${Date.now()}`;
    
    // Store backup temporarily (you might want to use a different storage mechanism)
    await settingsHelpers.setSetting('autoBackup', true);
    
    logger.info(`📦 Settings backup created: ${backupKey}`);
    return backup;
  } catch (error) {
    logger.error('❌ Failed to create settings backup:', error);
    throw error;
  }
}

/**
 * Restore settings from backup
 */
export async function restoreSettingsBackup(backup: string): Promise<void> {
  try {
    await settingsHelpers.importSettings(backup);
    logger.info('✅ Settings restored from backup');
  } catch (error) {
    logger.error('❌ Failed to restore settings backup:', error);
    throw error;
  }
}

// ============================================================================
// ERROR REPORTING
// ============================================================================

/**
 * Log error with context for debugging
 */
export function logError(error: Error, context: Partial<ErrorContext> = {}): void {
  const errorLog = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    context: {
      timestamp: new Date().toISOString(),
      appVersion: '1.2.0',
      ...context
    }
  };
  
  logger.error('🚨 Error logged:', JSON.stringify(errorLog, null, 2));
  
  // In production, you might want to send this to a crash reporting service
  if (!__DEV__) {
    // Example: Send to crash reporting service
    // crashlytics().recordError(error);
  }
}

/**
 * Handle critical errors that require app restart
 */
export function handleCriticalError(error: Error, context: Partial<ErrorContext> = {}): void {
  logError(error, { ...context, operation: 'critical_error' });
  
  // In production, you might want to show a user-friendly error screen
  logger.error('💥 CRITICAL ERROR - App may need restart:', error.message);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: Error): boolean {
  const recoverablePatterns = [
    'database is locked',
    'disk full',
    'connection timeout',
    'network error'
  ];
  
  const message = error.message.toLowerCase();
  return recoverablePatterns.some(pattern => message.includes(pattern));
}

/**
 * Get cleanup operations for failed migration
 */
export function getCleanupOperations(): RollbackOperation[] {
  return [
    {
      type: 'database',
      description: 'Clear temporary migration data',
      execute: async () => {
        const db = databaseManager.getDatabase();
        await db.runAsync('DELETE FROM db_metadata WHERE id > 1');
      }
    },
    {
      type: 'settings',
      description: 'Reset migration flags',
      execute: async () => {
        // Reset any migration-related settings
        await settingsHelpers.setSetting('autoBackup', true);
      }
    }
  ];
}
