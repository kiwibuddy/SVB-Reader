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

interface UnifiedQuestionsData {
  metadata?: {
    version?: string;
    lastUpdated?: string;
    totalSegments?: number;
  };
  questions: {
    [segmentId: string]: {
      school?: { set1: string[]; set2: string[] };
      family?: { set1: string[]; set2: string[] };
      smallgroup?: { set1: string[]; set2: string[] };
    };
  };
}

export interface MigrationResult {
  success: boolean;
  totalInserted: number;
  error?: string;
  migratedAt?: string;
}

/**
 * Check migration key
 */
async function checkMigrationKey(key: string): Promise<boolean> {
  try {
    const db = await databaseManager.getSafeDatabase();
    if (!db) return false;

    const result = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_state WHERE key = ?`,
      key
    );

    return result?.value === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Set migration key
 */
async function setMigrationKey(key: string): Promise<void> {
  try {
    const db = await databaseManager.getSafeDatabase();
    if (!db) return;

    await db.runAsync(
      `INSERT OR REPLACE INTO app_state (key, value, lastUpdated) 
       VALUES (?, 'true', datetime('now'))`,
      key
    );
  } catch (error) {
    logger.error(`Error setting migration key ${key}:`, error);
  }
}

/**
 * Check if questions file has been updated (version check)
 */
async function checkQuestionsVersion(): Promise<string | null> {
  try {
    // @ts-ignore - Metro will bundle this JSON
    const unifiedData = require('@/assets/data/Questions-EN.json') as UnifiedQuestionsData;
    return unifiedData.metadata?.version || null;
  } catch (error) {
    logger.error('Error checking questions version:', error);
    return null;
  }
}

/**
 * Get stored questions version from database
 */
async function getStoredQuestionsVersion(): Promise<string | null> {
  try {
    const db = await databaseManager.getSafeDatabase();
    if (!db) return null;

    const result = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_state WHERE key = 'questions_version'"
    );

    return result?.value || null;
  } catch (error) {
    return null;
  }
}

/**
 * Store questions version in database
 */
async function setStoredQuestionsVersion(version: string): Promise<void> {
  try {
    const db = await databaseManager.getSafeDatabase();
    if (!db) return;

    await db.runAsync(
      `INSERT OR REPLACE INTO app_state (key, value, lastUpdated) 
       VALUES ('questions_version', ?, datetime('now'))`,
      version
    );
  } catch (error) {
    logger.error(`Error setting questions version:`, error);
  }
}

/**
 * Check if questions have already been migrated (v2)
 */
export async function areQuestionsMigrated(): Promise<boolean> {
  try {
    const db = await databaseManager.getSafeDatabase();
    if (!db) return false;

    const result = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_state WHERE key = 'questions_migrated_v2'"
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
 * Supports both unified format (v2) and legacy format (v1)
 * Automatically detects version changes and updates questions
 */
export async function migrateQuestionsToDatabase(): Promise<MigrationResult> {
  try {
    // Check version first - if file version is newer or missing, we need to update
    const fileVersion = await checkQuestionsVersion();
    const storedVersion = await getStoredQuestionsVersion();
    
    // If versions differ, or if stored version doesn't exist, we need to re-migrate
    const needsUpdate = fileVersion && (!storedVersion || fileVersion !== storedVersion);
    
    if (needsUpdate && storedVersion) {
      logger.info(`🔄 Questions file updated (${storedVersion} → ${fileVersion}), re-migrating...`);
    } else if (needsUpdate && !storedVersion) {
      logger.info(`🔄 Questions version ${fileVersion} detected, storing version...`);
    } else if (fileVersion && storedVersion && fileVersion === storedVersion) {
      // Same version, check if already migrated
      const alreadyMigratedV2 = await areQuestionsMigrated();
      if (alreadyMigratedV2) {
        logger.info(`✅ Questions already migrated (v2, version ${storedVersion}), skipping`);
        return {
          success: true,
          totalInserted: 0,
          error: 'Already migrated'
        };
      }
    }

    // Check if already migrated to v2 FIRST (fast check without importing JSON)
    const alreadyMigratedV2 = await areQuestionsMigrated();
    if (alreadyMigratedV2 && !needsUpdate) {
      logger.info('✅ Questions already migrated (v2), skipping');
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

    // Check if questions already exist in database
    const existingQuestions = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM questions LIMIT 1'
    );
    
    // Check migration versions
    const oldMigrated = await checkMigrationKey('questions_migrated_v1');
    const newMigrated = await checkMigrationKey('questions_migrated_v2');

    // If questions exist and v2 migration flag exists and version matches, we're done
    if (existingQuestions && existingQuestions.count > 0 && newMigrated && !needsUpdate) {
      logger.info('✅ Questions already exist in database (v2), skipping migration');
      return {
        success: true,
        totalInserted: 0,
        error: 'Questions already migrated'
      };
    }

    // If questions exist but only v1 flag exists, mark as v2 migrated (data already there)
    if (existingQuestions && existingQuestions.count > 0 && oldMigrated && !newMigrated && !needsUpdate) {
      logger.info('✅ Questions exist with v1 flag, upgrading to v2 flag');
      await setMigrationKey('questions_migrated_v2');
      if (fileVersion) {
        await setStoredQuestionsVersion(fileVersion);
      }
      return {
        success: true,
        totalInserted: 0,
        error: 'Upgraded migration flag'
      };
    }
    
    // Try to load from unified file first (new format)
    let totalInserted = 0;
    
    try {
      logger.info('📦 Loading questions from unified file (Questions-EN.json)...');
      
      // @ts-ignore - Metro will bundle this JSON
      const unifiedData = require('@/assets/data/Questions-EN.json') as UnifiedQuestionsData;
      
      if (!unifiedData.questions) {
        throw new Error('Unified file missing questions section');
      }

      logger.info(`✅ Loaded unified file: ${Object.keys(unifiedData.questions).length} segments`);
      if (unifiedData.metadata?.version) {
        logger.info(`📌 Questions version: ${unifiedData.metadata.version}`);
      }

      // Insert all questions into database from unified structure
      // INSERT OR REPLACE will update existing questions
      const insertQuestionsFromUnified = async () => {
        let inserted = 0;
        for (const [segmentId, segmentQuestions] of Object.entries(unifiedData.questions)) {
          for (const [audience, sets] of Object.entries(segmentQuestions)) {
            const audienceType = audience as 'school' | 'family' | 'smallgroup';
            
            // Insert set1
            if (sets.set1 && sets.set1.length > 0) {
              try {
                await db.runAsync(
                  `INSERT OR REPLACE INTO questions (segmentID, audienceType, questionSet, Q1, Q2, Q3, Q4)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  segmentId,
                  audienceType,
                  1,
                  sets.set1[0] || null,
                  sets.set1[1] || null,
                  sets.set1[2] || null,
                  sets.set1[3] || null
                );
                inserted++;
              } catch (error) {
                logger.error(`Error inserting question ${segmentId}/${audienceType}/set1:`, error);
              }
            }

            // Insert set2
            if (sets.set2 && sets.set2.length > 0) {
              try {
                await db.runAsync(
                  `INSERT OR REPLACE INTO questions (segmentID, audienceType, questionSet, Q1, Q2, Q3, Q4)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  segmentId,
                  audienceType,
                  2,
                  sets.set2[0] || null,
                  sets.set2[1] || null,
                  sets.set2[2] || null,
                  sets.set2[3] || null
                );
                inserted++;
              } catch (error) {
                logger.error(`Error inserting question ${segmentId}/${audienceType}/set2:`, error);
              }
            }
          }
        }
        return inserted;
      };
      
      totalInserted = await insertQuestionsFromUnified();
      
      // Mark migration as complete (v2)
      await setMigrationKey('questions_migrated_v2');
      
      // Store version
      if (unifiedData.metadata?.version) {
        await setStoredQuestionsVersion(unifiedData.metadata.version);
      }
      
      logger.info(`✅ Migration complete! Inserted/Updated ${totalInserted} question rows`);
      if (needsUpdate) {
        logger.info(`📌 Updated from version ${storedVersion || 'none'} to ${fileVersion}`);
      }
      
      return {
        success: true,
        totalInserted,
        migratedAt: new Date().toISOString()
      };
      
    } catch (unifiedError) {
      logger.warn('⚠️ Failed to load unified file, falling back to legacy format:', unifiedError);
      
      // Fallback to legacy 6-file format for backward compatibility
      try {
        logger.info('📦 Loading questions from legacy files (6 separate files)...');
        
        // @ts-ignore - Metro will bundle this JSON
        const schoolQuestions1 = require('@/assets/data/SchoolQuestions.json').SchoolQuestions as QuestionSet;
        const schoolQuestions2 = require('@/assets/data/SchoolQuestionsSet2.json').SchoolQuestionsSet2 as QuestionSet;
        const familyQuestions1 = require('@/assets/data/FamilyQuestions.json').FamilyQuestions as QuestionSet;
        const familyQuestions2 = require('@/assets/data/FamilyQuestionsSet2.json').FamilyQuestionsSet2 as QuestionSet;
        const smallGroupQuestions1 = require('@/assets/data/SmallGroupQuestions.json').SmallGroupQuestions as QuestionSet;
        const smallGroupQuestions2 = require('@/assets/data/SmallGroupQuestionsSet2.json').SmallGroupQuestionsSet2 as QuestionSet;
        
        logger.info(`✅ Loaded legacy files: School(${Object.keys(schoolQuestions1).length} segments), Family(${Object.keys(familyQuestions1).length} segments), SmallGroup(${Object.keys(smallGroupQuestions1).length} segments)`);
        
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
        
        // Mark migration as complete (v2, even though using legacy files)
        await setMigrationKey('questions_migrated_v2');
        
        // Try to get version from unified file if available
        try {
          const unifiedData = require('@/assets/data/Questions-EN.json') as UnifiedQuestionsData;
          if (unifiedData.metadata?.version) {
            await setStoredQuestionsVersion(unifiedData.metadata.version);
          }
        } catch (e) {
          // Unified file not available, that's okay
        }
        
        logger.info(`✅ Migration complete (legacy format)! Inserted ${totalInserted} question rows`);
        
        return {
          success: true,
          totalInserted,
          migratedAt: new Date().toISOString()
        };
        
      } catch (legacyError) {
        logger.error('❌ Error importing questions from legacy files:', legacyError);
        return {
          success: false,
          totalInserted,
          error: `Both unified and legacy formats failed: ${legacyError instanceof Error ? legacyError.message : 'Unknown error'}`
        };
      }
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
 * Force update questions from current Questions-EN.json file
 * This will update all questions in the database with the latest from the JSON file
 * Useful when Questions-EN.json has been updated
 */
export async function forceUpdateQuestions(): Promise<MigrationResult> {
  try {
    logger.info('🔄 Forcing questions update from Questions-EN.json...');

    const db = await databaseManager.getSafeDatabase();
    if (!db) {
      throw new Error('Database not available');
    }

    // Get current version
    const fileVersion = await checkQuestionsVersion();
    
    // Load unified file
    logger.info('📦 Loading questions from unified file (Questions-EN.json)...');
    
    // @ts-ignore - Metro will bundle this JSON
    const unifiedData = require('@/assets/data/Questions-EN.json') as UnifiedQuestionsData;
    
    if (!unifiedData.questions) {
      throw new Error('Unified file missing questions section');
    }

    logger.info(`✅ Loaded unified file: ${Object.keys(unifiedData.questions).length} segments`);
    if (unifiedData.metadata?.version) {
      logger.info(`📌 Questions version: ${unifiedData.metadata.version}`);
    }

    // Update all questions using INSERT OR REPLACE
    let totalUpdated = 0;
    for (const [segmentId, segmentQuestions] of Object.entries(unifiedData.questions)) {
      for (const [audience, sets] of Object.entries(segmentQuestions)) {
        const audienceType = audience as 'school' | 'family' | 'smallgroup';
        
        // Update set1
        if (sets.set1 && sets.set1.length > 0) {
          try {
            await db.runAsync(
              `INSERT OR REPLACE INTO questions (segmentID, audienceType, questionSet, Q1, Q2, Q3, Q4)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              segmentId,
              audienceType,
              1,
              sets.set1[0] || null,
              sets.set1[1] || null,
              sets.set1[2] || null,
              sets.set1[3] || null
            );
            totalUpdated++;
          } catch (error) {
            logger.error(`Error updating question ${segmentId}/${audienceType}/set1:`, error);
          }
        }

        // Update set2
        if (sets.set2 && sets.set2.length > 0) {
          try {
            await db.runAsync(
              `INSERT OR REPLACE INTO questions (segmentID, audienceType, questionSet, Q1, Q2, Q3, Q4)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              segmentId,
              audienceType,
              2,
              sets.set2[0] || null,
              sets.set2[1] || null,
              sets.set2[2] || null,
              sets.set2[3] || null
            );
            totalUpdated++;
          } catch (error) {
            logger.error(`Error updating question ${segmentId}/${audienceType}/set2:`, error);
          }
        }
      }
    }
    
    // Mark migration as complete (v2)
    await setMigrationKey('questions_migrated_v2');
    
    // Store version
    if (unifiedData.metadata?.version) {
      await setStoredQuestionsVersion(unifiedData.metadata.version);
    }
    
    logger.info(`✅ Questions update complete! Updated ${totalUpdated} question rows`);
    if (fileVersion) {
      logger.info(`📌 Version updated to: ${fileVersion}`);
    }
    
    return {
      success: true,
      totalInserted: totalUpdated,
      migratedAt: new Date().toISOString()
    };

  } catch (error) {
    logger.error('❌ Force update questions failed:', error);
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

    // Reset migration flags (both v1 and v2) and version
    await db.runAsync(
      "DELETE FROM app_state WHERE key IN ('questions_migrated_v1', 'questions_migrated_v2', 'questions_version')"
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

    const isMigrated = await checkMigrationKey('questions_migrated_v2') || await checkMigrationKey('questions_migrated_v1');

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

