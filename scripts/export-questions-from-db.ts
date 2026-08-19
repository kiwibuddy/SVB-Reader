/**
 * Export questions from SQLite database for translation
 * Run this in the app context (add to a test screen temporarily)
 */

import { databaseManager } from '@/api/database-manager';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

interface QuestionRow {
  segmentID: string;
  audienceType: string;
  questionSet: number;
  Q1: string | null;
  Q2: string | null;
  Q3: string | null;
  Q4: string | null;
}

export async function exportQuestionsForTranslation() {
  try {
    const db = await databaseManager.getSafeDatabase();
    if (!db) {
      console.error('Database not available');
      return;
    }

    // Get all questions
    const questions = await db.getAllAsync<QuestionRow>(
      `SELECT segmentID, audienceType, questionSet, Q1, Q2, Q3, Q4
       FROM questions
       ORDER BY segmentID, audienceType, questionSet`
    );

    console.log(`📊 Total questions: ${questions.length} rows`);

    // Organize by audience and set
    const organized: {
      school: { [segmentId: string]: { set1: string[]; set2: string[] } };
      family: { [segmentId: string]: { set1: string[]; set2: string[] } };
      smallgroup: { [segmentId: string]: { set1: string[]; set2: string[] } };
    } = {
      school: {},
      family: {},
      smallgroup: {}
    };

    questions.forEach(q => {
      const audience = q.audienceType as 'school' | 'family' | 'smallgroup';
      const segmentId = q.segmentID;
      
      if (!organized[audience][segmentId]) {
        organized[audience][segmentId] = { set1: [], set2: [] };
      }

      const questionsArray = [q.Q1, q.Q2, q.Q3, q.Q4].filter((q): q is string => q !== null);
      const setKey = q.questionSet === 1 ? 'set1' : 'set2';
      organized[audience][segmentId][setKey] = questionsArray;
    });

    // Count questions per audience
    console.log('\n📈 Questions per audience:');
    Object.entries(organized).forEach(([audience, segments]) => {
      const totalQuestions = Object.values(segments).reduce((sum, sets) => {
        return sum + sets.set1.length + sets.set2.length;
      }, 0);
      console.log(`   ${audience}: ${totalQuestions} questions across ${Object.keys(segments).length} segments`);
    });

    // Save to files
    const documentsDir = FileSystem.documentDirectory;
    
    // Save each audience separately for easier translation
    await FileSystem.writeAsStringAsync(
      `${documentsDir}school-questions-english.json`,
      JSON.stringify(organized.school, null, 2)
    );
    
    await FileSystem.writeAsStringAsync(
      `${documentsDir}family-questions-english.json`,
      JSON.stringify(organized.family, null, 2)
    );
    
    await FileSystem.writeAsStringAsync(
      `${documentsDir}smallgroup-questions-english.json`,
      JSON.stringify(organized.smallgroup, null, 2)
    );

    console.log('\n✅ Files created:');
    console.log('   - school-questions-english.json');
    console.log('   - family-questions-english.json');
    console.log('   - smallgroup-questions-english.json');
    console.log(`\n📁 Location: ${documentsDir}`);

    // Share the files
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(`${documentsDir}school-questions-english.json`);
    }

    return organized;

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
}

/**
 * Sample output format for translation:
 * 
 * {
 *   "S001": {
 *     "set1": [
 *       "What did God create on each day?",
 *       "What does this passage teach us about God?",
 *       "How does this apply to your life?"
 *     ],
 *     "set2": [
 *       "What stands out to you most in this story?",
 *       "What questions do you have?",
 *       "What will you do differently this week?"
 *     ]
 *   },
 *   "S002": { ... }
 * }
 */

