/**
 * Consolidate English Questions into Unified Structure
 * 
 * Reads all 6 English question files and creates a single unified JSON file
 * with structure: { metadata: {...}, questions: { S001: { school: { set1: [...], set2: [...] }, ... } } }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const assetsDataPath = path.join(projectRoot, 'assets', 'data');

// Input files
const inputFiles = {
  school: {
    set1: path.join(assetsDataPath, 'SchoolQuestions.json'),
    set2: path.join(assetsDataPath, 'SchoolQuestionsSet2.json')
  },
  family: {
    set1: path.join(assetsDataPath, 'FamilyQuestions.json'),
    set2: path.join(assetsDataPath, 'FamilyQuestionsSet2.json')
  },
  smallgroup: {
    set1: path.join(assetsDataPath, 'SmallGroupQuestions.json'),
    set2: path.join(assetsDataPath, 'SmallGroupQuestionsSet2.json')
  }
};

// Output file
const outputFile = path.join(assetsDataPath, 'Questions-EN.json');

console.log('🔄 Consolidating English Questions into Unified Structure...\n');

try {
  // Load all question files
  console.log('📖 Loading question files...');
  
  const schoolQuestions1 = JSON.parse(fs.readFileSync(inputFiles.school.set1, 'utf8')).SchoolQuestions;
  const schoolQuestions2 = JSON.parse(fs.readFileSync(inputFiles.school.set2, 'utf8')).SchoolQuestionsSet2;
  const familyQuestions1 = JSON.parse(fs.readFileSync(inputFiles.family.set1, 'utf8')).FamilyQuestions;
  const familyQuestions2 = JSON.parse(fs.readFileSync(inputFiles.family.set2, 'utf8')).FamilyQuestionsSet2;
  const smallGroupQuestions1 = JSON.parse(fs.readFileSync(inputFiles.smallgroup.set1, 'utf8')).SmallGroupQuestions;
  const smallGroupQuestions2 = JSON.parse(fs.readFileSync(inputFiles.smallgroup.set2, 'utf8')).SmallGroupQuestionsSet2;

  console.log(`  ✅ School Set1: ${Object.keys(schoolQuestions1).length} segments`);
  console.log(`  ✅ School Set2: ${Object.keys(schoolQuestions2).length} segments`);
  console.log(`  ✅ Family Set1: ${Object.keys(familyQuestions1).length} segments`);
  console.log(`  ✅ Family Set2: ${Object.keys(familyQuestions2).length} segments`);
  console.log(`  ✅ SmallGroup Set1: ${Object.keys(smallGroupQuestions1).length} segments`);
  console.log(`  ✅ SmallGroup Set2: ${Object.keys(smallGroupQuestions2).length} segments`);

  // Get all unique segment IDs
  const allSegmentIds = new Set([
    ...Object.keys(schoolQuestions1),
    ...Object.keys(schoolQuestions2),
    ...Object.keys(familyQuestions1),
    ...Object.keys(familyQuestions2),
    ...Object.keys(smallGroupQuestions1),
    ...Object.keys(smallGroupQuestions2)
  ]);

  console.log(`\n📊 Total unique segments: ${allSegmentIds.size}`);

  // Function to convert Q1-Q4 object to array
  function questionsToArray(qObj) {
    if (!qObj) return [];
    const arr = [];
    for (let i = 1; i <= 4; i++) {
      const key = `Q${i}`;
      if (qObj[key] && qObj[key].trim()) {
        arr.push(qObj[key]);
      }
    }
    return arr;
  }

  // Build unified structure
  console.log('\n🔄 Building unified structure...');
  const unified = {
    metadata: {
      version: '1.0.0',
      lastUpdated: new Date().toISOString().split('T')[0],
      totalSegments: allSegmentIds.size,
      audiences: ['school', 'family', 'smallgroup'],
      sets: [1, 2]
    },
    questions: {}
  };

  let processedCount = 0;
  let missingCount = 0;

  // Process each segment
  for (const segmentId of Array.from(allSegmentIds).sort()) {
    unified.questions[segmentId] = {
      school: {
        set1: questionsToArray(schoolQuestions1[segmentId]),
        set2: questionsToArray(schoolQuestions2[segmentId])
      },
      family: {
        set1: questionsToArray(familyQuestions1[segmentId]),
        set2: questionsToArray(familyQuestions2[segmentId])
      },
      smallgroup: {
        set1: questionsToArray(smallGroupQuestions1[segmentId]),
        set2: questionsToArray(smallGroupQuestions2[segmentId])
      }
    };

    processedCount++;

    // Check for missing questions
    const hasAnyQuestions = 
      unified.questions[segmentId].school.set1.length > 0 ||
      unified.questions[segmentId].school.set2.length > 0 ||
      unified.questions[segmentId].family.set1.length > 0 ||
      unified.questions[segmentId].family.set2.length > 0 ||
      unified.questions[segmentId].smallgroup.set1.length > 0 ||
      unified.questions[segmentId].smallgroup.set2.length > 0;

    if (!hasAnyQuestions) {
      missingCount++;
      console.log(`  ⚠️  ${segmentId} has no questions in any audience/set`);
    }
  }

  console.log(`\n✅ Processed ${processedCount} segments`);
  if (missingCount > 0) {
    console.log(`  ⚠️  ${missingCount} segments have no questions`);
  }

  // Validate structure
  console.log('\n🔍 Validating structure...');
  const validationErrors = [];

  // Check that all segments have all audiences
  for (const segmentId of Object.keys(unified.questions)) {
    const seg = unified.questions[segmentId];
    if (!seg.school || !seg.family || !seg.smallgroup) {
      validationErrors.push(`${segmentId}: Missing audience`);
    }
    if (seg.school && (!seg.school.set1 || !seg.school.set2)) {
      validationErrors.push(`${segmentId}: Missing school sets`);
    }
    if (seg.family && (!seg.family.set1 || !seg.family.set2)) {
      validationErrors.push(`${segmentId}: Missing family sets`);
    }
    if (seg.smallgroup && (!seg.smallgroup.set1 || !seg.smallgroup.set2)) {
      validationErrors.push(`${segmentId}: Missing smallgroup sets`);
    }
  }

  if (validationErrors.length > 0) {
    console.log(`  ❌ Validation errors: ${validationErrors.length}`);
    validationErrors.slice(0, 10).forEach(err => console.log(`    - ${err}`));
    if (validationErrors.length > 10) {
      console.log(`    ... and ${validationErrors.length - 10} more`);
    }
  } else {
    console.log('  ✅ Structure validation passed');
  }

  // Count total questions
  let totalQuestions = 0;
  for (const segmentId of Object.keys(unified.questions)) {
    const seg = unified.questions[segmentId];
    totalQuestions += seg.school.set1.length + seg.school.set2.length +
                     seg.family.set1.length + seg.family.set2.length +
                     seg.smallgroup.set1.length + seg.smallgroup.set2.length;
  }

  console.log(`\n📊 Total questions: ${totalQuestions}`);

  // Save unified file
  console.log(`\n💾 Saving ${outputFile}...`);
  fs.writeFileSync(outputFile, JSON.stringify(unified, null, 2), 'utf8');

  // Get file size
  const stats = fs.statSync(outputFile);
  const fileSizeKB = (stats.size / 1024).toFixed(2);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`  ✅ Saved successfully (${fileSizeKB} KB / ${fileSizeMB} MB)`);

  // Sample output
  console.log('\n📋 Sample structure (S001):');
  const sample = unified.questions['S001'];
  if (sample) {
    console.log(`  School Set1 Q1: ${sample.school.set1[0]?.substring(0, 60)}...`);
    console.log(`  Family Set1 Q1: ${sample.family.set1[0]?.substring(0, 60)}...`);
    console.log(`  SmallGroup Set1 Q1: ${sample.smallgroup.set1[0]?.substring(0, 60)}...`);
  }

  console.log('\n✅ Consolidation complete!');
  console.log(`\n📁 Output file: ${outputFile}`);
  console.log(`📊 Summary:`);
  console.log(`   - Segments: ${allSegmentIds.size}`);
  console.log(`   - Total questions: ${totalQuestions}`);
  console.log(`   - File size: ${fileSizeMB} MB`);
  console.log(`   - Ready for migration to SQLite`);

} catch (error) {
  console.error('\n❌ Error consolidating questions:', error);
  process.exit(1);
}

