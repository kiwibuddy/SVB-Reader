/**
 * Restructure FRA-Bible.json to include questions
 * 
 * Original structure:
 * {
 *   "S001": { segment data },
 *   "S002": { segment data }
 * }
 * 
 * New structure:
 * {
 *   "segments": {
 *     "S001": { segment data },
 *     "S002": { segment data }
 *   },
 *   "questions": {
 *     "S001": {
 *       "school": { "set1": ["Q1", "Q2", "Q3"], "set2": ["Q1", "Q2", "Q3"] },
 *       "family": { "set1": ["Q1", "Q2", "Q3"], "set2": ["Q1", "Q2", "Q3"] },
 *       "smallgroup": { "set1": ["Q1", "Q2", "Q3"], "set2": ["Q1", "Q2", "Q3"] }
 *     }
 *   }
 * }
 */

const fs = require('fs');
const path = require('path');

// File paths
const FRENCH_BIBLE_PATH = path.join(__dirname, '../FRA-Bible.json');
const FRENCH_UI_PATH = path.join(__dirname, '../assets/data/FRA-UI.json');
const OUTPUT_PATH = path.join(__dirname, '../FRA-Bible-with-questions.json');

console.log('📖 Starting Bible restructuring...\n');

// Read the French Bible
console.log('1️⃣ Reading FRA-Bible.json...');
const frenchBible = JSON.parse(fs.readFileSync(FRENCH_BIBLE_PATH, 'utf8'));
console.log(`   ✅ Loaded ${Object.keys(frenchBible).length} segments\n`);

// Read the French UI for questions
console.log('2️⃣ Reading FRA-UI.json for questions...');
const frenchUI = JSON.parse(fs.readFileSync(FRENCH_UI_PATH, 'utf8'));
const questionsData = frenchUI.Questions || {};
console.log(`   ✅ Loaded ${Object.keys(questionsData).length} question entries\n`);

// Create new structure
console.log('3️⃣ Restructuring Bible JSON...');
const restructured = {
  segments: frenchBible,
  questions: {}
};

// Extract questions for each segment
// Question format in FRA-UI.json: "Q011-S32-Q4" (Plan-Segment-Question)
// We need to map these to segment questions

// Get all segment IDs from the Bible
const segmentIds = Object.keys(frenchBible);

console.log('4️⃣ Processing questions for each segment...\n');

// Map question types
// Based on your database structure, questions are stored as:
// - audienceType: 'school', 'family', 'smallgroup'
// - questionSet: 1 or 2
// - Q1, Q2, Q3, Q4

// Since the Questions in FRA-UI.json are for reading plans (Q011-S32-Q4 format),
// we need to check if you have the actual segment questions elsewhere

// For now, let's create the structure with empty questions as a placeholder
// You'll need to provide the French translations for the segment questions

let processedCount = 0;
for (const segmentId of segmentIds) {
  // Initialize question structure for this segment
  restructured.questions[segmentId] = {
    school: {
      set1: [],
      set2: []
    },
    family: {
      set1: [],
      set2: []
    },
    smallgroup: {
      set1: [],
      set2: []
    }
  };
  
  processedCount++;
  
  // Show progress every 50 segments
  if (processedCount % 50 === 0) {
    console.log(`   Processing: ${processedCount}/${segmentIds.length} segments`);
  }
}

console.log(`   ✅ Processed all ${processedCount} segments\n`);

// Write the restructured Bible
console.log('5️⃣ Writing restructured Bible to file...');
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(restructured, null, 2), 'utf8');

// Get file sizes
const originalSize = fs.statSync(FRENCH_BIBLE_PATH).size;
const newSize = fs.statSync(OUTPUT_PATH).size;

console.log(`   ✅ Written to: ${OUTPUT_PATH}\n`);

console.log('📊 File Size Comparison:');
console.log(`   Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`   New:      ${(newSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Increase: ${(((newSize - originalSize) / originalSize) * 100).toFixed(1)}%\n`);

console.log('⚠️  IMPORTANT NOTES:');
console.log('   1. The questions are currently EMPTY placeholders');
console.log('   2. You need to provide French translations for segment questions');
console.log('   3. Questions in FRA-UI.json are for reading plans, not segments');
console.log('   4. Review the output file: FRA-Bible-with-questions.json\n');

console.log('✅ Restructuring complete!');
console.log('\n📝 Next steps:');
console.log('   1. Check the output file: FRA-Bible-with-questions.json');
console.log('   2. Provide French question translations (see instructions below)');
console.log('   3. Replace FRA-Bible.json with the new file');
console.log('   4. Update code to handle new structure');
console.log('   5. Upload to Firebase');

