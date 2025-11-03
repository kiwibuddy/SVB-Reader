const fs = require('fs');
const path = require('path');

console.log('🔄 Merging French Questions into FRA-Bible-with-questions.json...\n');

// File paths
const projectRoot = path.join(__dirname, '..');
const schoolQuestionsPath = path.join(projectRoot, 'assets/data/SchoolQuestions-FR.json');
const familyQuestionsPath = path.join(projectRoot, 'assets/data/FamilyQuestions-FR.json');
const smallGroupQuestionsPath = path.join(projectRoot, 'assets/data/SmallGroupQuestions-FR.json');
const fraBiblePath = path.join(projectRoot, 'FRA-Bible-with-questions.json');
const outputPath = path.join(projectRoot, 'FRA-Bible-with-questions.json');

try {
  // Load all question files
  console.log('📖 Reading question files...');
  const schoolQuestions = JSON.parse(fs.readFileSync(schoolQuestionsPath, 'utf8')).SchoolQuestions;
  const familyQuestions = JSON.parse(fs.readFileSync(familyQuestionsPath, 'utf8')).FamilyQuestions;
  const smallGroupQuestions = JSON.parse(fs.readFileSync(smallGroupQuestionsPath, 'utf8')).SmallGroupQuestions;
  
  console.log(`  ✅ School Questions: ${Object.keys(schoolQuestions).length} segments`);
  console.log(`  ✅ Family Questions: ${Object.keys(familyQuestions).length} segments`);
  console.log(`  ✅ Small Group Questions: ${Object.keys(smallGroupQuestions).length} segments`);

  // Load French Bible
  console.log('\n📖 Reading FRA-Bible-with-questions.json...');
  const fraBible = JSON.parse(fs.readFileSync(fraBiblePath, 'utf8'));
  
  if (!fraBible.questions) {
    console.error('❌ Error: FRA-Bible-with-questions.json does not have a "questions" section');
    process.exit(1);
  }

  console.log(`  ✅ Found ${Object.keys(fraBible.questions).length} question placeholders\n`);

  // Function to convert question object to array
  function convertQuestionsToArray(questionsObj) {
    if (!questionsObj) return [];
    const questions = [];
    for (let i = 1; i <= 4; i++) {
      const key = `Q${i}`;
      if (questionsObj[key]) {
        questions.push(questionsObj[key]);
      }
    }
    return questions;
  }

  // Merge questions into Bible
  console.log('🔄 Merging questions...');
  let schoolCount = 0;
  let familyCount = 0;
  let smallGroupCount = 0;

  // Get all segment IDs from the questions (S001-S365)
  const allSegmentIds = new Set([
    ...Object.keys(schoolQuestions),
    ...Object.keys(familyQuestions),
    ...Object.keys(smallGroupQuestions)
  ]);

  for (const segmentId of allSegmentIds) {
    // Initialize segment in questions if it doesn't exist
    if (!fraBible.questions[segmentId]) {
      fraBible.questions[segmentId] = {
        school: { set1: [], set2: [] },
        family: { set1: [], set2: [] },
        smallgroup: { set1: [], set2: [] }
      };
    }

    // Merge school questions
    if (schoolQuestions[segmentId]) {
      fraBible.questions[segmentId].school.set1 = convertQuestionsToArray(schoolQuestions[segmentId]);
      schoolCount++;
    }

    // Merge family questions
    if (familyQuestions[segmentId]) {
      fraBible.questions[segmentId].family.set1 = convertQuestionsToArray(familyQuestions[segmentId]);
      familyCount++;
    }

    // Merge small group questions
    if (smallGroupQuestions[segmentId]) {
      fraBible.questions[segmentId].smallgroup.set1 = convertQuestionsToArray(smallGroupQuestions[segmentId]);
      smallGroupCount++;
    }
  }

  console.log(`  ✅ Merged ${schoolCount} school question sets`);
  console.log(`  ✅ Merged ${familyCount} family question sets`);
  console.log(`  ✅ Merged ${smallGroupCount} small group question sets`);

  // Save updated Bible
  console.log('\n💾 Saving FRA-Bible-with-questions.json...');
  fs.writeFileSync(outputPath, JSON.stringify(fraBible, null, 2), 'utf8');
  
  // Get file size
  const stats = fs.statSync(outputPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`  ✅ Saved successfully (${fileSizeMB} MB)\n`);

  // Verify a sample segment
  console.log('🔍 Verification - Sample segment S001:');
  const sample = fraBible.questions.S001;
  console.log(`  School Q1: ${sample.school.set1[0]?.substring(0, 50)}...`);
  console.log(`  Family Q1: ${sample.family.set1[0]?.substring(0, 50)}...`);
  console.log(`  Small Group Q1: ${sample.smallgroup.set1[0]?.substring(0, 50)}...`);

  console.log('\n✅ All French questions successfully merged!\n');
  console.log('📊 Summary:');
  console.log(`  • Total segments with questions: ${allSegmentIds.size}`);
  console.log(`  • Total questions merged: ${(schoolCount + familyCount + smallGroupCount) * 4}`);
  console.log(`  • Output file: FRA-Bible-with-questions.json (${fileSizeMB} MB)\n`);

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}

