const fs = require('fs');
const path = require('path');

// Load English questions from both locations
const englishFolder = path.join(__dirname, '..', 'English questions');
const dataFolder = path.join(__dirname, '..', 'assets', 'data');

const audiences = ['School', 'Family', 'SmallGroup'];

function loadQuestions(folder, audience) {
  const filePath = path.join(folder, `${audience}Questions.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

function compareQuestions(segId) {
  const results = {
    segment: segId,
    englishFolder: {},
    dataFolder: {},
    differences: {}
  };

  audiences.forEach(audience => {
    const engQuestions = loadQuestions(englishFolder, audience);
    const dataQuestions = loadQuestions(dataFolder, audience);

    if (engQuestions && engQuestions[segId]) {
      results.englishFolder[audience] = engQuestions[segId];
    }
    if (dataQuestions && dataQuestions[segId]) {
      results.dataFolder[audience] = dataQuestions[segId];
    }

    // Check if they're different
    const engQ = engQuestions?.[segId];
    const dataQ = dataQuestions?.[segId];
    
    if (engQ && dataQ) {
      const engStr = JSON.stringify(engQ);
      const dataStr = JSON.stringify(dataQ);
      if (engStr !== dataStr) {
        results.differences[audience] = {
          englishFolder: engQ,
          dataFolder: dataQ
        };
      }
    }
  });

  return results;
}

// Check segments that were identified as having identical questions
const problematicSegments = ['S307', 'S309', 'S312', 'S313', 'S314', 'S320', 'S321', 'S322', 'S323', 'S324', 'S327', 'S336', 'S338'];

console.log('Comparing English question files for problematic segments...\n');

problematicSegments.forEach(segId => {
  const comparison = compareQuestions(segId);
  
  if (Object.keys(comparison.differences).length > 0) {
    console.log(`\n${segId} - DIFFERENCES FOUND:`);
    Object.keys(comparison.differences).forEach(audience => {
      console.log(`  ${audience}:`);
      console.log(`    English folder:`, JSON.stringify(comparison.differences[audience].englishFolder, null, 2));
      console.log(`    Data folder:`, JSON.stringify(comparison.differences[audience].dataFolder, null, 2));
    });
  }

  // Check uniqueness within each location
  const engUniqueness = checkUniqueness(comparison.englishFolder);
  const dataUniqueness = checkUniqueness(comparison.dataFolder);

  if (!engUniqueness || !dataUniqueness) {
    console.log(`\n${segId} - UNIQUENESS CHECK:`);
    if (!engUniqueness) {
      console.log(`  ❌ English folder: All questions identical across audiences`);
    } else {
      console.log(`  ✅ English folder: Questions are unique`);
    }
    if (!dataUniqueness) {
      console.log(`  ❌ Data folder: All questions identical across audiences`);
    } else {
      console.log(`  ✅ Data folder: Questions are unique`);
    }
  }
});

function checkUniqueness(questions) {
  const sets = Object.values(questions);
  if (sets.length < 2) return true;
  
  // Check if all sets are identical
  const first = JSON.stringify(sets[0]);
  return sets.some(q => JSON.stringify(q) !== first);
}

