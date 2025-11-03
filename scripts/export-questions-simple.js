/**
 * Export questions from SQLite database to JSON for translation
 * 
 * USAGE:
 * 1. Run the app on iOS simulator OR physical device
 * 2. Make sure questions are loaded
 * 3. Find the SQLite database file location (check console logs)
 * 4. Update DB_PATH below with the actual path
 * 5. Run: node scripts/export-questions-simple.js
 */

const fs = require('fs');
const path = require('path');

// ⚠️ UPDATE THIS PATH based on your iOS simulator or device
// Example iOS Simulator path:
// ~/Library/Developer/CoreSimulator/Devices/[DEVICE-ID]/data/Containers/Data/Application/[APP-ID]/Library/SQLite/sourceview.db
const DB_PATH = process.argv[2] || './sourceview.db';

if (!fs.existsSync(DB_PATH)) {
  console.error(`❌ Database not found at: ${DB_PATH}`);
  console.log('\n📝 To find your database:');
  console.log('  1. Run your app');
  console.log('  2. Check console logs for database path');
  console.log('  3. Pass the path as argument:');
  console.log('     node scripts/export-questions-simple.js /path/to/sourceview.db');
  process.exit(1);
}

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY);

console.log('📖 Reading questions from database...\n');

db.all(
  `SELECT segmentID, audienceType, questionSet, Q1, Q2, Q3, Q4 
   FROM questions 
   ORDER BY segmentID, audienceType, questionSet`,
  [],
  (err, rows) => {
    if (err) {
      console.error('❌ Error reading database:', err);
      process.exit(1);
    }

    // Organize by audience and set
    const organized = {
      school: { set1: {}, set2: {} },
      family: { set1: {}, set2: {} },
      smallgroup: { set1: {}, set2: {} }
    };

    rows.forEach(row => {
      const { segmentID, audienceType, questionSet, Q1, Q2, Q3, Q4 } = row;
      const setKey = questionSet === 1 ? 'set1' : 'set2';
      
      organized[audienceType][setKey][segmentID] = {
        Q1: Q1 || '',
        Q2: Q2 || '',
        Q3: Q3 || '',
        Q4: Q4 || ''
      };
    });

    // Count questions
    const countQuestions = (data) => {
      return Object.values(data).reduce((sum, segment) => {
        return sum + Object.values(segment).filter(q => q).length;
      }, 0);
    };

    console.log('📊 Export Summary:');
    console.log(`  School Set 1: ${Object.keys(organized.school.set1).length} segments, ${countQuestions(organized.school.set1)} questions`);
    console.log(`  School Set 2: ${Object.keys(organized.school.set2).length} segments, ${countQuestions(organized.school.set2)} questions`);
    console.log(`  Family Set 1: ${Object.keys(organized.family.set1).length} segments, ${countQuestions(organized.family.set1)} questions`);
    console.log(`  Family Set 2: ${Object.keys(organized.family.set2).length} segments, ${countQuestions(organized.family.set2)} questions`);
    console.log(`  Small Group Set 1: ${Object.keys(organized.smallgroup.set1).length} segments, ${countQuestions(organized.smallgroup.set1)} questions`);
    console.log(`  Small Group Set 2: ${Object.keys(organized.smallgroup.set2).length} segments, ${countQuestions(organized.smallgroup.set2)} questions`);

    // Save to files
    const outputDir = path.join(__dirname, '../exported-questions');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save each audience-set combination
    fs.writeFileSync(
      path.join(outputDir, 'SchoolQuestions.json'),
      JSON.stringify({ SchoolQuestions: organized.school.set1 }, null, 2)
    );
    fs.writeFileSync(
      path.join(outputDir, 'SchoolQuestionsSet2.json'),
      JSON.stringify({ SchoolQuestionsSet2: organized.school.set2 }, null, 2)
    );
    fs.writeFileSync(
      path.join(outputDir, 'FamilyQuestions.json'),
      JSON.stringify({ FamilyQuestions: organized.family.set1 }, null, 2)
    );
    fs.writeFileSync(
      path.join(outputDir, 'FamilyQuestionsSet2.json'),
      JSON.stringify({ FamilyQuestionsSet2: organized.family.set2 }, null, 2)
    );
    fs.writeFileSync(
      path.join(outputDir, 'SmallGroupQuestions.json'),
      JSON.stringify({ SmallGroupQuestions: organized.smallgroup.set1 }, null, 2)
    );
    fs.writeFileSync(
      path.join(outputDir, 'SmallGroupQuestionsSet2.json'),
      JSON.stringify({ SmallGroupQuestionsSet2: organized.smallgroup.set2 }, null, 2)
    );

    console.log(`\n✅ Questions exported to: ${outputDir}/`);
    console.log('\n📝 Next steps:');
    console.log('  1. Translate each file to French');
    console.log('  2. Save as: SchoolQuestions-FR.json, FamilyQuestions-FR.json, etc.');
    console.log('  3. Run merge script to add to FRA-Bible.json');

    db.close();
  }
);

