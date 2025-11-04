import logger from '@/utils/logger';
import { databaseManager } from './database-manager';

// ============================================================================
// QUESTIONS API - SQLite Database Access
// ============================================================================

export type AudienceType = 'school' | 'family' | 'smallgroup';
export type QuestionSetNumber = 1 | 2;

export interface QuestionData {
  Q1: string | null;
  Q2: string | null;
  Q3: string | null;
  Q4: string | null;
}

/**
 * Get questions for a specific segment, audience, and question set
 * Returns an array of questions (filtering out null values)
 */
export async function getQuestionsForSegment(
  segmentId: string,
  audienceType: AudienceType,
  questionSet: QuestionSetNumber = 1
): Promise<string[]> {
  try {
    const db = await databaseManager.getSafeDatabase();
    if (!db) {
      logger.error('Database not available for questions query');
      return [];
    }

    // Debug: Check what exists for this segment
    const allForSegment = await db.getAllAsync<{ audienceType: string; questionSet: number }>(
      `SELECT DISTINCT audienceType, questionSet 
       FROM questions 
       WHERE segmentID = ?
       ORDER BY audienceType, questionSet`,
      segmentId
    );

    if (allForSegment.length === 0) {
      logger.warn(`No questions found for segment ${segmentId} (checked all audiences and sets)`);
      return [];
    }

    logger.info(`🔍 Found questions for ${segmentId}: ${allForSegment.map(r => `${r.audienceType}/set${r.questionSet}`).join(', ')}`);

    const result = await db.getFirstAsync<QuestionData>(
      `SELECT Q1, Q2, Q3, Q4 
       FROM questions 
       WHERE segmentID = ? AND audienceType = ? AND questionSet = ?`,
      segmentId,
      audienceType,
      questionSet
    );

    if (!result) {
      logger.warn(`No questions found for segment ${segmentId}, audience ${audienceType}, set ${questionSet}. Available: ${allForSegment.map(r => `${r.audienceType}/set${r.questionSet}`).join(', ')}`);
      return [];
    }

    // Convert to array and filter out null values
    const questions = [result.Q1, result.Q2, result.Q3, result.Q4].filter(
      (q): q is string => q !== null && q !== undefined && q.trim() !== ''
    );

    if (questions.length === 0) {
      logger.warn(`Questions found for ${segmentId}/${audienceType}/set${questionSet} but all fields are null/empty`);
    }

    return questions;

  } catch (error) {
    logger.error('Error fetching questions from database:', error);
    return [];
  }
}

/**
 * Check which question sets are available for a given segment and audience
 */
export async function getAvailableQuestionSetsForSegment(
  segmentId: string,
  audienceType: AudienceType
): Promise<QuestionSetNumber[]> {
  try {
    const db = await databaseManager.getSafeDatabase();
    if (!db) {
      return [];
    }

    const results = await db.getAllAsync<{ questionSet: number }>(
      `SELECT DISTINCT questionSet 
       FROM questions 
       WHERE segmentID = ? AND audienceType = ?
       ORDER BY questionSet`,
      segmentId,
      audienceType
    );

    return results.map(r => r.questionSet as QuestionSetNumber);

  } catch (error) {
    logger.error('Error checking available question sets:', error);
    return [];
  }
}

/**
 * Get all questions for a segment across all audiences and sets
 * Useful for debugging and admin purposes
 */
export async function getAllQuestionsForSegment(
  segmentId: string
): Promise<{
  [audience: string]: {
    set1?: string[];
    set2?: string[];
  };
}> {
  try {
    const db = await databaseManager.getSafeDatabase();
    if (!db) {
      return {};
    }

    const results = await db.getAllAsync<QuestionData & { audienceType: string; questionSet: number }>(
      `SELECT audienceType, questionSet, Q1, Q2, Q3, Q4 
       FROM questions 
       WHERE segmentID = ?
       ORDER BY audienceType, questionSet`,
      segmentId
    );

    const organized: {
      [audience: string]: {
        set1?: string[];
        set2?: string[];
      };
    } = {};

    results.forEach(row => {
      if (!organized[row.audienceType]) {
        organized[row.audienceType] = {};
      }

      const questions = [row.Q1, row.Q2, row.Q3, row.Q4].filter(
        (q): q is string => q !== null && q !== undefined && q.trim() !== ''
      );

      const setKey = `set${row.questionSet}` as 'set1' | 'set2';
      organized[row.audienceType][setKey] = questions;
    });

    return organized;

  } catch (error) {
    logger.error('Error fetching all questions for segment:', error);
    return {};
  }
}

/**
 * Check if questions data exists in the database
 */
export async function hasQuestionsData(): Promise<boolean> {
  try {
    const db = await databaseManager.getSafeDatabase();
    if (!db) {
      return false;
    }

    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM questions LIMIT 1'
    );

    return (result?.count || 0) > 0;

  } catch (error) {
    logger.error('Error checking questions data:', error);
    return false;
  }
}

/**
 * Manually insert a question into the database
 * Useful for fixing missing questions or adding new ones
 */
export async function insertQuestion(
  segmentId: string,
  audienceType: AudienceType,
  questionSet: QuestionSetNumber,
  questions: string[]
): Promise<boolean> {
  try {
    const db = await databaseManager.getSafeDatabase();
    if (!db) {
      logger.error('Database not available for question insert');
      return false;
    }

    // Ensure we have exactly 4 questions (pad with null if needed)
    const [Q1, Q2, Q3, Q4] = [
      questions[0] || null,
      questions[1] || null,
      questions[2] || null,
      questions[3] || null
    ];

    await db.runAsync(
      `INSERT OR REPLACE INTO questions (segmentID, audienceType, questionSet, Q1, Q2, Q3, Q4)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      segmentId,
      audienceType,
      questionSet,
      Q1,
      Q2,
      Q3,
      Q4
    );

    logger.info(`✅ Inserted question for ${segmentId}/${audienceType}/set${questionSet}`);
    return true;

  } catch (error) {
    logger.error(`Error inserting question for ${segmentId}/${audienceType}/set${questionSet}:`, error);
    return false;
  }
}

/**
 * Get total count of questions in database
 */
export async function getQuestionsCount(): Promise<{
  total: number;
  byAudience: Record<string, number>;
  bySets: Record<number, number>;
}> {
  try {
    const db = await databaseManager.getSafeDatabase();
    if (!db) {
      return { total: 0, byAudience: {}, bySets: {} };
    }

    // Total count
    const totalResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM questions'
    );
    const total = totalResult?.count || 0;

    // By audience
    const audienceResults = await db.getAllAsync<{ audienceType: string; count: number }>(
      'SELECT audienceType, COUNT(*) as count FROM questions GROUP BY audienceType'
    );
    const byAudience: Record<string, number> = {};
    audienceResults.forEach(row => {
      byAudience[row.audienceType] = row.count;
    });

    // By set
    const setResults = await db.getAllAsync<{ questionSet: number; count: number }>(
      'SELECT questionSet, COUNT(*) as count FROM questions GROUP BY questionSet'
    );
    const bySets: Record<number, number> = {};
    setResults.forEach(row => {
      bySets[row.questionSet] = row.count;
    });

    return { total, byAudience, bySets };

  } catch (error) {
    logger.error('Error getting questions count:', error);
    return { total: 0, byAudience: {}, bySets: {} };
  }
}

