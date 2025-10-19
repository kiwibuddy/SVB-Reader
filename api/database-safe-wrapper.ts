import { databaseManager } from './database-manager';
import logger from '@/utils/logger';

/**
 * Safe database wrapper that provides error-safe database operations
 * This prevents the cascading errors that cause React Native text rendering warnings
 */
export class SafeDatabaseWrapper {
  /**
   * Safely execute a database query with automatic error handling
   */
  static async safeQuery<T>(
    operation: (db: any) => Promise<T>,
    defaultValue: T,
    operationName: string = 'database operation'
  ): Promise<T> {
    try {
      const db = await databaseManager.getSafeDatabase();
      
      if (!db) {
        // Silent return - no logging during potential render cycles
        return defaultValue;
      }
      
      const result = await operation(db);
      return result;
    } catch (error) {
      // Check if this is the "shared object already released" error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('shared object that was already released')) {
        // Database connection corrupted - reset and return default
        try {
          databaseManager.close();
          await databaseManager.initialize();
        } catch (resetError) {
          // Reset failed, just return default
        }
      }
      
      // Use setTimeout to prevent render cycle interference
      setTimeout(() => {
        logger.error(`Error in ${operationName}:`, error);
      }, 0);
      
      return defaultValue;
    }
  }

  /**
   * Safely execute a database query that returns a single record
   */
  static async safeGetFirst<T>(
    query: string,
    params: any[] = [],
    defaultValue: T | null = null,
    operationName: string = 'get first query'
  ): Promise<T | null> {
    return this.safeQuery(
      async (db) => {
        const result = await db.getFirstAsync(query, params) as T | null;
        return result || defaultValue;
      },
      defaultValue,
      operationName
    );
  }

  /**
   * Safely execute a database query that returns multiple records
   */
  static async safeGetAll<T>(
    query: string,
    params: any[] = [],
    defaultValue: T[] = [],
    operationName: string = 'get all query'
  ): Promise<T[]> {
    return this.safeQuery(
      async (db) => {
        const result = await db.getAllAsync(query, params) as T[];
        return result || defaultValue;
      },
      defaultValue,
      operationName
    );
  }

  /**
   * Safely execute a database update/insert/delete operation
   */
  static async safeRun(
    query: string,
    params: any[] = [],
    operationName: string = 'run query'
  ): Promise<{ success: boolean; changes?: number }> {
    return this.safeQuery<{ success: boolean; changes?: number }>(
      async (db) => {
        const result = await db.runAsync(query, params);
        return { success: true, changes: result.changes };
      },
      { success: false },
      operationName
    );
  }

  /**
   * Validate parameters before database operations
   */
  static validateParams(params: any[], operationName: string): boolean {
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      if (param === null || param === undefined) {
        continue; // null/undefined are valid SQL values
      }
      
      if (typeof param === 'object' && !Array.isArray(param)) {
        logger.warn(`Invalid parameter type in ${operationName} at index ${i}:`, typeof param);
        return false;
      }
    }
    return true;
  }
}

export default SafeDatabaseWrapper;
