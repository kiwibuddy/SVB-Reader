/**
 * Consolidate French Questions into Unified Structure
 * 
 * Reads current 3 French question files and creates a single unified JSON file
 * with structure: { metadata: {...}, questions: { S001: { school: { set1: [...], set2: [...] }, ... } } }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const assetsDataPath = path.join(projectRoot, 'assets', 'data');

// Input files
const inputFiles = {
  school: path.join(assetsDataPath, 'SchoolQuestions-FR.json'),
  family: path.join(assetsDataPath, 'FamilyQuestions-FR.json'),
  smallgroup: path.join(assetsDataPath, 'SmallGroupQuestions-FR.json')
};

// Also check if questions are in FRA-Bible-with-questions.json
const bibleWithQuestionsPath = path.join(projectRoot, 'FRA-Bible-with-questions.json');

// Output file
const outputFile = path.join(assetsDataPath, 'Questions-FR.json');

console.log('🔄 Consolidating French Questions into Unified Structure...\n');

try {
  // Load all question files
  console.log('📖 Loading question files...');
  
  const schoolQuestions = JSON.parse(fs.readFileSync(inputFiles.school, 'utf8')).SchoolQuestions;
  const familyQuestions = JSON.parse(fs.readFileSync(inputFiles.family, 'utf8')).FamilyQuestions;
  const smallGroupQuestions = JSON.parse(fs.readFileSync(inputFiles.smallgroup, 'utf8')).SmallGroupQuestions;

  console.log(`  ✅ School: ${Object.keys(schoolQuestions).length} segments`);
  console.log(`  ✅ Family: ${Object.keys(familyQuestions).length} segments`);
  console.log(`  ✅ SmallGroup: ${Object.keys(smallGroupQuestions).length} segments`);

  // Check if Bible file with questions exists (for reference)
  let bibleQuestions = null;
  if (fs.existsSync(bibleWithQuestionsPath)) {
    try {
      const bibleData = JSON.parse(fs.readFileSync(bibleWithQuestionsPath, 'utf8'));
      if (bibleData.questions) {
        bibleQuestions = bibleData.questions;
        console.log(`  ℹ️  Found questions in FRA-Bible-with-questions.json: ${Object.keys(bibleQuestions).length} segments`);
      }
    } catch (error) {
      console.log(`  ⚠️  Could not read FRA-Bible-with-questions.json: ${error.message}`);
    }
  }

  // Get all unique segment IDs
  const allSegmentIds = new Set([
    ...Object.keys(schoolQuestions),
    ...Object.keys(familyQuestions),
    ...Object.keys(smallGroupQuestions)
  ]);

  if (bibleQuestions) {
    Object.keys(bibleQuestions).forEach(id => allSegmentIds.add(id));
  }

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

  // Function to extract questions from Bible format (already arrays)
  function extractFromBibleFormat(bibleQObj) {
    if (!bibleQObj) return { set1: [], set2: [] };
    return {
      set1: Array.isArray(bibleQObj.set1) ? bibleQObj.set1 : [],
      set2: Array.isArray(bibleQObj.set2) ? bibleQObj.set2 : []
    };
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
  let fromBibleCount = 0;

  // Process each segment
  for (const segmentId of Array.from(allSegmentIds).sort()) {
    // Try to get from Bible format first (if available), then fall back to separate files
    let schoolQ = { set1: [], set2: [] };
    let familyQ = { set1: [], set2: [] };
    let smallgroupQ = { set1: [], set2: [] };

    if (bibleQuestions && bibleQuestions[segmentId]) {
      const bibleSeg = bibleQuestions[segmentId];
      schoolQ = extractFromBibleFormat(bibleSeg.school);
      familyQ = extractFromBibleFormat(bibleSeg.family);
      smallgroupQ = extractFromBibleFormat(bibleSeg.smallgroup);
      if (schoolQ.set1.length > 0 || familyQ.set1.length > 0 || smallgroupQ.set1.length > 0) {
        fromBibleCount++;
      }
    }

    // Fall back to separate files if Bible format doesn't have questions
    if (schoolQ.set1.length === 0 && schoolQuestions[segmentId]) {
      schoolQ.set1 = questionsToArray(schoolQuestions[segmentId]);
      schoolQ.set2 = []; // Set2 not available in separate files yet
    }
    if (familyQ.set1.length === 0 && familyQuestions[segmentId]) {
      familyQ.set1 = questionsToArray(familyQuestions[segmentId]);
      familyQ.set2 = []; // Set2 not available in separate files yet
    }
    if (smallgroupQ.set1.length === 0 && smallGroupQuestions[segmentId]) {
      smallgroupQ.set1 = questionsToArray(smallGroupQuestions[segmentId]);
      smallgroupQ.set2 = []; // Set2 not available in separate files yet
    }

    unified.questions[segmentId] = {
      school: schoolQ,
      family: familyQ,
      smallgroup: smallgroupQ
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
  if (fromBibleCount > 0) {
    console.log(`  ℹ️  ${fromBibleCount} segments loaded from Bible file`);
  }
  if (missingCount > 0) {
    console.log(`  ⚠️  ${missingCount} segments have no questions`);
  }

  // Validate structure
  console.log('\n🔍 Validating structure...');
  const validationErrors = [];

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
  console.log(`   - Ready for Firebase upload`);

} catch (error) {
  console.error('\n❌ Error consolidating questions:', error);
  process.exit(1);
}

