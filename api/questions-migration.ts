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
    const existingQuestions = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM questions LIMIT 1'
    );
    
    if (existingQuestions && existingQuestions.count > 0) {
      logger.info('✅ Questions already exist in database, skipping migration');
      // Mark as migrated even if we didn't run migration (questions already there)
      await db.runAsync(
        `INSERT OR REPLACE INTO app_state (key, value, lastUpdated) 
         VALUES ('questions_migrated_v1', 'true', datetime('now'))`
      );
      return {
        success: true,
        totalInserted: 0,
        error: 'Questions already migrated'
      };
    }
    
    // Import questions from bundled JSON files
    logger.info('📦 Loading questions from bundled JSON files...');
    
    let totalInserted = 0;
    
    try {
      // Import School Questions Set 1
      // @ts-ignore - Metro will bundle this JSON
      const schoolQuestions1 = require('@/assets/data/SchoolQuestions.json').SchoolQuestions as QuestionSet;
      // Import School Questions Set 2
      // @ts-ignore - Metro will bundle this JSON
      const schoolQuestions2 = require('@/assets/data/SchoolQuestionsSet2.json').SchoolQuestionsSet2 as QuestionSet;
      
      // Import Family Questions Set 1
      // @ts-ignore - Metro will bundle this JSON
      const familyQuestions1 = require('@/assets/data/FamilyQuestions.json').FamilyQuestions as QuestionSet;
      // Import Family Questions Set 2
      // @ts-ignore - Metro will bundle this JSON
      const familyQuestions2 = require('@/assets/data/FamilyQuestionsSet2.json').FamilyQuestionsSet2 as QuestionSet;
      
      // Import SmallGroup Questions Set 1
      // @ts-ignore - Metro will bundle this JSON
      const smallGroupQuestions1 = require('@/assets/data/SmallGroupQuestions.json').SmallGroupQuestions as QuestionSet;
      // Import SmallGroup Questions Set 2
      // @ts-ignore - Metro will bundle this JSON
      const smallGroupQuestions2 = require('@/assets/data/SmallGroupQuestionsSet2.json').SmallGroupQuestionsSet2 as QuestionSet;
      
      logger.info(`✅ Loaded question files: School(${Object.keys(schoolQuestions1).length} segments), Family(${Object.keys(familyQuestions1).length} segments), SmallGroup(${Object.keys(smallGroupQuestions1).length} segments)`);
      
      // Insert all questions into database
      const insertQuestions = async (questions: QuestionSet, audienceType: 'school' | 'family' | 'smallgroup', questionSet: 1 | 2) => {
        let inserted = 0;
        for (const [segmentId, questionData] of Object.entries(questions)) {
          try {
            await db.runAsync(
              `INSERT OR REPLACE INTO questions (segmentID, audienceType, questionSet, Q1, Q2, Q3, Q4)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              segmentId,
              audienceType,
              questionSet,
              questionData.Q1 || null,
              questionData.Q2 || null,
              questionData.Q3 || null,
              questionData.Q4 || null
            );
            inserted++;
          } catch (error) {
            logger.error(`Error inserting question ${segmentId}/${audienceType}/set${questionSet}:`, error);
          }
        }
        return inserted;
      };
      
      // Insert all question sets
      totalInserted += await insertQuestions(schoolQuestions1, 'school', 1);
      totalInserted += await insertQuestions(schoolQuestions2, 'school', 2);
      totalInserted += await insertQuestions(familyQuestions1, 'family', 1);
      totalInserted += await insertQuestions(familyQuestions2, 'family', 2);
      totalInserted += await insertQuestions(smallGroupQuestions1, 'smallgroup', 1);
      totalInserted += await insertQuestions(smallGroupQuestions2, 'smallgroup', 2);
      
      // Mark migration as complete
      await db.runAsync(
        `INSERT OR REPLACE INTO app_state (key, value, lastUpdated) 
         VALUES ('questions_migrated_v1', 'true', datetime('now'))`
      );
      
      logger.info(`✅ Migration complete! Inserted ${totalInserted} question rows`);
      
      return {
        success: true,
        totalInserted,
        migratedAt: new Date().toISOString()
      };
      
    } catch (importError) {
      logger.error('❌ Error importing questions from JSON files:', importError);
      return {
        success: false,
        totalInserted,
        error: importError instanceof Error ? importError.message : 'Failed to import questions'
      };
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

