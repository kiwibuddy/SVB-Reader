/**
 * Export English questions from the app for translation
 * Since the JSON files were deleted, we need to export from the running app
 * 
 * THIS SCRIPT NEEDS TO RUN IN THE APP CONTEXT (not Node.js)
 * 
 * To use this:
 * 1. Copy this function
 * 2. Add it as a temporary export in api/question-functions.ts
 * 3. Call it from a test screen in the app
 * 4. Copy the output and save to a file
 */

/**
 * Add this function to api/question-functions.ts temporarily:
 */

// export async function exportAllQuestionsForTranslation(): Promise<string> {
//   try {
//     const db = await databaseManager.getSafeDatabase();
//     if (!db) {
//       return 'Database not available';
//     }

//     const questions = await db.getAllAsync(
//       `SELECT segmentID, audienceType, questionSet, Q1, Q2, Q3, Q4
//        FROM questions
//        ORDER BY segmentID, audienceType, questionSet`
//     );

//     // Format for easy translation
//     const formatted = {};
    
//     questions.forEach(q => {
//       const segmentId = q.segmentID;
//       if (!formatted[segmentId]) {
//         formatted[segmentId] = {
//           school: { set1: [], set2: [] },
//           family: { set1: [], set2: [] },
//           smallgroup: { set1: [], set2: [] }
//         };
//       }
      
//       const audience = q.audienceType;
//       const set = q.questionSet === 1 ? 'set1' : 'set2';
      
//       const questionsArray = [q.Q1, q.Q2, q.Q3, q.Q4].filter(q => q !== null);
//       formatted[segmentId][audience][set] = questionsArray;
//     });

//     return JSON.stringify(formatted, null, 2);
//   } catch (error) {
//     return `Error: ${error.message}`;
//   }
// }

console.log(`
📝 INSTRUCTIONS TO EXPORT QUESTIONS FROM YOUR APP:

Since the question JSON files were deleted after migration to SQLite,
we need to export them from the running app.

OPTION 1: Use the app's testing utilities
==========================================
1. Run your app
2. Open a test/debug screen
3. Import and call the export function from api/testing-utilities.ts
4. Copy the output

OPTION 2: Add a temporary export button
==========================================
1. Add this to any screen in your app:

   import { databaseManager } from '@/api/database-manager';
   
   const exportQuestions = async () => {
     const db = await databaseManager.getSafeDatabase();
     const questions = await db.getAllAsync(
       \`SELECT * FROM questions ORDER BY segmentID, audienceType, questionSet\`
     );
     console.log('QUESTIONS:', JSON.stringify(questions, null, 2));
   };
   
   <Button onPress={exportQuestions} title="Export Questions" />

2. Press the button
3. Copy from console logs
4. Save to a file

OPTION 3: Quick workaround - Use English questions temporarily
===============================================================
For now, we can structure the French Bible to:
- Use English questions (from SQLite) 
- Display French UI labels
- Translate questions later when you have the French text

Would you like me to implement Option 3 as a quick solution?
`);

