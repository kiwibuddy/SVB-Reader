import logger from '@/utils/logger';
import { databaseManager } from './database-manager';

// ============================================================================
// QUESTIONS MIGRATION TO SQLITE
// ============================================================================

interface QuestionSet {
  [segmentId: string]: {
    Q1?: string;
    Q2?: string;
    Q3?: string;
    Q4?: string;
  };
}

interface QuestionsData {
  [key: string]: QuestionSet;
}

export interface MigrationResult {
  success: boolean;
  totalInserted: number;
  error?: string;
  migratedAt?: string;
}

/**
 * Check if questions have already been migrated
 */
export async function areQuestionsMigrated(): Promise<boolean> {
  try {
    const db = await databaseManager.getSafeDatabase();
    if (!db) return false;

    const result = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_state WHERE key = 'questions_migrated_v1'"
    );

    return result?.value === 'true';
  } catch (error) {
    logger.error('Error checking migration status:', error);
    return false;
  }
}

/**
 * Migrate all questions from JSON files to SQLite database
 * This is a one-time migration that runs on first app launch
 */
export async function migrateQuestionsToDatabase(): Promise<MigrationResult> {
  try {
    // Check if already migrated FIRST (fast check without importing JSON)
    const alreadyMigrated = await areQuestionsMigrated();
    if (alreadyMigrated) {
      logger.info('✅ Questions already migrated, skipping');
      return {
        success: true,
        totalInserted: 0,
        error: 'Already migrated'
      };
    }

    logger.info('🔄 Starting questions migration check...');

    const db = await databaseManager.getSafeDatabase();
    if (!db) {
      throw new Error('Database not available');
    }

    // Check if questions already exist in database first
    // This avoids Metro trying to bundle non-existent JSON files
    const existingQuestions = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM questions LIMIT 1'
    );
    
    if (existingQuestions && existingQuestions.count > 0) {
      logger.info('✅ Questions already exist in database, skipping migration');
      return {
        success: true,
        totalInserted: 0,
        error: 'Questions already migrated'
      };
    }
    
    // IMPORTANT: Question JSON files are NOT in the bundle (they're in exported-questions/)
    // Since questions are already migrated to SQLite in production builds,
    // we skip the JSON import entirely to avoid Metro bundling errors.
    // If questions don't exist in DB, the migration will fail gracefully.
    logger.error('[CRASH] Questions migration attempted but JSON files not bundled');
    logger.error('[CRASH] This is expected - questions should already be in SQLite');
    return {
      success: false,
      totalInserted: 0,
      error: 'Question JSON files not bundled (questions should already be in SQLite)'
    };

  } catch (error) {
    logger.error('❌ Questions migration failed:', error);
    return {
      success: false,
      totalInserted: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Force re-migration (for testing or data updates)
 * This will delete all existing questions and re-migrate
 */
export async function forceRemigrate(): Promise<MigrationResult> {
  try {
    logger.info('🔄 Forcing questions re-migration...');

    const db = await databaseManager.getSafeDatabase();
    if (!db) {
      throw new Error('Database not available');
    }

    // Delete all existing questions
    await db.runAsync('DELETE FROM questions');

    // Reset migration flag
    await db.runAsync(
      "DELETE FROM app_state WHERE key = 'questions_migrated_v1'"
    );

    // Run migration
    return await migrateQuestionsToDatabase();

  } catch (error) {
    logger.error('❌ Force re-migration failed:', error);
    return {
      success: false,
      totalInserted: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get migration statistics
 */
export async function getMigrationStats(): Promise<{
  isMigrated: boolean;
  totalQuestions: number;
  byAudience: Record<string, number>;
  bySets: Record<number, number>;
}> {
  try {
    const db = await databaseManager.getSafeDatabase();
    if (!db) {
      return {
        isMigrated: false,
        totalQuestions: 0,
        byAudience: {},
        bySets: {}
      };
    }

    const isMigrated = await areQuestionsMigrated();

    // Count total questions
    const totalResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM questions'
    );
    const totalQuestions = totalResult?.count || 0;

    // Count by audience
    const audienceResults = await db.getAllAsync<{ audienceType: string; count: number }>(
      'SELECT audienceType, COUNT(*) as count FROM questions GROUP BY audienceType'
    );
    const byAudience: Record<string, number> = {};
    audienceResults.forEach(row => {
      byAudience[row.audienceType] = row.count;
    });

    // Count by set
    const setResults = await db.getAllAsync<{ questionSet: number; count: number }>(
      'SELECT questionSet, COUNT(*) as count FROM questions GROUP BY questionSet'
    );
    const bySets: Record<number, number> = {};
    setResults.forEach(row => {
      bySets[row.questionSet] = row.count;
    });

    return {
      isMigrated,
      totalQuestions,
      byAudience,
      bySets
    };

  } catch (error) {
    logger.error('Error getting migration stats:', error);
    return {
      isMigrated: false,
      totalQuestions: 0,
      byAudience: {},
      bySets: {}
    };
  }
}

