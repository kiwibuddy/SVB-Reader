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

    logger.info('🔄 Starting questions migration to SQLite...');

    const db = await databaseManager.getSafeDatabase();
    if (!db) {
      throw new Error('Database not available');
    }

    // Import question data from JSON files (only when needed)
    logger.info('📥 Importing question JSON files...');
    const SchoolQuestions = require('@/assets/data/SchoolQuestions.json');
    const FamilyQuestions = require('@/assets/data/FamilyQuestions.json');
    const SmallGroupQuestions = require('@/assets/data/SmallGroupQuestions.json');
    const SchoolQuestionsSet2 = require('@/assets/data/SchoolQuestionsSet2.json');
    const FamilyQuestionsSet2 = require('@/assets/data/FamilyQuestionsSet2.json');
    const SmallGroupQuestionsSet2 = require('@/assets/data/SmallGroupQuestionsSet2.json');
    logger.info('✅ JSON files imported');

    // Prepare data structure
    const questionSets = [
      { data: SchoolQuestions.SchoolQuestions, audience: 'school', set: 1 },
      { data: FamilyQuestions.FamilyQuestions, audience: 'family', set: 1 },
      { data: SmallGroupQuestions.SmallGroupQuestions, audience: 'smallgroup', set: 1 },
      { data: SchoolQuestionsSet2.SchoolQuestionsSet2, audience: 'school', set: 2 },
      { data: FamilyQuestionsSet2.FamilyQuestionsSet2, audience: 'family', set: 2 },
      { data: SmallGroupQuestionsSet2.SmallGroupQuestionsSet2, audience: 'smallgroup', set: 2 }
    ];

    let totalInserted = 0;

    // Begin transaction for atomic operation
    await db.execAsync('BEGIN TRANSACTION');

    try {
      for (const { data, audience, set } of questionSets) {
        logger.info(`  Migrating ${audience} questions set ${set}...`);
        
        for (const [segmentId, questions] of Object.entries(data as QuestionSet)) {
          const q = questions;
          
          // Insert questions for this segment
          await db.runAsync(
            `INSERT OR REPLACE INTO questions (segmentID, audienceType, questionSet, Q1, Q2, Q3, Q4)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            segmentId,
            audience,
            set,
            q.Q1 || null,
            q.Q2 || null,
            q.Q3 || null,
            q.Q4 || null
          );
          
          totalInserted++;
        }
      }

      // Mark migration as complete in app_state
      const currentDate = new Date().toISOString();
      await db.runAsync(
        `INSERT OR REPLACE INTO app_state (key, value, lastUpdated)
         VALUES ('questions_migrated_v1', 'true', ?)`,
        currentDate
      );

      // Commit transaction
      await db.execAsync('COMMIT');

      logger.info(`✅ Questions migration complete! Inserted ${totalInserted} question sets`);

      return {
        success: true,
        totalInserted,
        migratedAt: currentDate
      };

    } catch (error) {
      // Rollback on error
      await db.execAsync('ROLLBACK');
      throw error;
    }

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

