const fs = require('fs');
const path = require('path');

// Load segment titles to get book/chapter info
const segmentTitles = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'assets', 'data', 'SegmentTitles.json'), 'utf8')
);

// Load English questions
const dataFolder = path.join(__dirname, '..', 'assets', 'data');
const englishQuestions = {
  school: JSON.parse(fs.readFileSync(path.join(dataFolder, 'SchoolQuestions.json'), 'utf8')),
  family: JSON.parse(fs.readFileSync(path.join(dataFolder, 'FamilyQuestions.json'), 'utf8')),
  smallGroup: JSON.parse(fs.readFileSync(path.join(dataFolder, 'SmallGroupQuestions.json'), 'utf8'))
};

// Load French questions
const frenchQuestions = {
  school: JSON.parse(fs.readFileSync(path.join(dataFolder, 'SchoolQuestions-FR.json'), 'utf8')),
  family: JSON.parse(fs.readFileSync(path.join(dataFolder, 'FamilyQuestions-FR.json'), 'utf8')),
  smallGroup: JSON.parse(fs.readFileSync(path.join(dataFolder, 'SmallGroupQuestions-FR.json'), 'utf8'))
};

// Extract questions from nested structure
function getQuestions(data, audience) {
  if (data[`${audience}Questions`]) {
    return data[`${audience}Questions`];
  }
  return data;
}

const audiences = ['school', 'family', 'smallGroup'];
const audienceNames = {
  school: 'School',
  family: 'Family',
  smallGroup: 'SmallGroup'
};

console.log('🔍 Verifying English-French Question Mapping\n');
console.log('='.repeat(60));

let totalSegments = 0;
let matchedSegments = 0;
let issues = [];

// Get all segment IDs from English questions
const allSegments = new Set();
Object.values(englishQuestions.school).forEach(q => {
  if (q && typeof q === 'object' && q.Q1) {
    Object.keys(q).forEach(key => {
      if (key.startsWith('S') && q[key] && q[key].Q1) {
        allSegments.add(key);
      }
    });
  }
});

// Check each segment
Object.values(englishQuestions.school).forEach(segData => {
  if (!segData || typeof segData !== 'object') return;
  
  Object.keys(segData).forEach(segId => {
    if (!segId.startsWith('S')) return;
    
    totalSegments++;
    const segment = segmentTitles[segId];
    if (!segment) {
      issues.push({
        segment: segId,
        type: 'missing_segment_info',
        message: 'Segment not found in SegmentTitles.json'
      });
      return;
    }

    const book = Array.isArray(segment.book) ? segment.book[0] : segment.book;
    const ref = segment.ref || '';

    // Check each audience
    audiences.forEach(audience => {
      const engQ = getQuestions(englishQuestions[audience], audienceNames[audience])[segId];
      const frQ = getQuestions(frenchQuestions[audience], audienceNames[audience])[segId];

      if (!engQ && !frQ) return; // Skip if neither exists

      if (!engQ) {
        issues.push({
          segment: segId,
          audience,
          book,
          ref,
          type: 'missing_english',
          message: `Missing English questions for ${audience}`
        });
      }

      if (!frQ) {
        issues.push({
          segment: segId,
          audience,
          book,
          ref,
          type: 'missing_french',
          message: `Missing French questions for ${audience}`
        });
      }

      if (engQ && frQ) {
        // Check if questions match semantically (same number of questions)
        const engKeys = Object.keys(engQ).filter(k => k.startsWith('Q'));
        const frKeys = Object.keys(frQ).filter(k => k.startsWith('Q'));
        
        if (engKeys.length !== frKeys.length) {
          issues.push({
            segment: segId,
            audience,
            book,
            ref,
            type: 'question_count_mismatch',
            message: `English has ${engKeys.length} questions, French has ${frKeys.length}`
          });
        }

        matchedSegments++;
      }
    });
  });
});

// Summary
console.log(`\n✅ Total segments checked: ${totalSegments}`);
console.log(`✅ Matched segments: ${matchedSegments}`);
console.log(`⚠️  Issues found: ${issues.length}\n`);

if (issues.length > 0) {
  console.log('\n📋 Issues by Type:');
  const byType = {};
  issues.forEach(issue => {
    if (!byType[issue.type]) byType[issue.type] = [];
    byType[issue.type].push(issue);
  });

  Object.keys(byType).forEach(type => {
    console.log(`\n${type} (${byType[type].length}):`);
    byType[type].slice(0, 10).forEach(issue => {
      console.log(`  ${issue.segment} (${issue.book || 'unknown'} ${issue.ref || ''}) - ${issue.audience || 'all'}: ${issue.message}`);
    });
    if (byType[type].length > 10) {
      console.log(`  ... and ${byType[type].length - 10} more`);
    }
  });
} else {
  console.log('\n✅ All questions mapped correctly!');
}

// Save detailed report
const report = {
  summary: {
    totalSegments,
    matchedSegments,
    issuesFound: issues.length
  },
  issues
};

fs.writeFileSync(
  path.join(__dirname, '..', 'question-mapping-final-report.json'),
  JSON.stringify(report, null, 2)
);

console.log(`\n📄 Detailed report saved to: question-mapping-final-report.json`);

