#!/usr/bin/env node

/**
 * Comprehensive Question Mapping Verification Script
 * 
 * This script verifies that questions match their segment references
 * by checking if the question content aligns with the segment's book and reference.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

// Load files
const loadJSON = (filePath) => {
  try {
    const fullPath = path.join(projectRoot, filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error loading ${filePath}:`, error.message);
    return null;
  }
};

console.log('🔍 Verifying question mappings...\n');

const segmentTitles = loadJSON('assets/data/SegmentTitles.json');
const schoolEN = loadJSON('assets/data/SchoolQuestions.json')?.SchoolQuestions || {};
const familyEN = loadJSON('assets/data/FamilyQuestions.json')?.FamilyQuestions || {};
const smallGroupEN = loadJSON('assets/data/SmallGroupQuestions.json')?.SmallGroupQuestions || {};
const schoolFR = loadJSON('assets/data/SchoolQuestions-FR.json')?.SchoolQuestions || {};
const familyFR = loadJSON('assets/data/FamilyQuestions-FR.json')?.FamilyQuestions || {};
const smallGroupFR = loadJSON('assets/data/SmallGroupQuestions-FR.json')?.SmallGroupQuestions || {};

// Book name mappings
const bookMappings = {
  'Act': ['acts', 'actes', 'acts of the apostles', 'ascension', 'pentecost', 'spirit', 'esprit', 'church', 'église'],
  'Rom': ['romans', 'romains', 'sin', 'péché', 'grace', 'grâce', 'faith', 'foi', 'israel', 'israël'],
  '1Co': ['1 corinthians', '1 corinthiens', 'corinth', 'corinthe', 'unity', 'unité'],
  '2Co': ['2 corinthians', '2 corinthiens'],
  'Gal': ['galatians', 'galates'],
  'Eph': ['ephesians', 'éphésiens'],
  'Gen': ['genesis', 'genèse', 'creation', 'création'],
};

// Check if question content matches expected book
const checkQuestionMatchesBook = (question, expectedBook) => {
  if (!question) return null;
  
  const qLower = question.toLowerCase();
  const expectedBookLower = expectedBook.toLowerCase();
  
  // Check if question mentions expected book
  const bookVariations = bookMappings[expectedBook] || [];
  const mentionsExpectedBook = bookVariations.some(v => qLower.includes(v));
  
  // Check if question mentions wrong books
  const wrongBooks = [];
  for (const [bookCode, variations] of Object.entries(bookMappings)) {
    if (bookCode !== expectedBook) {
      if (variations.some(v => qLower.includes(v))) {
        wrongBooks.push(bookCode);
      }
    }
  }
  
  return {
    matches: mentionsExpectedBook,
    wrongBooks: wrongBooks.length > 0 ? wrongBooks : null,
    mentionsExpectedBook,
  };
};

const issues = {
  english: {
    identicalAcrossAudiences: [],
    bookMismatches: [],
  },
  french: {
    identicalAcrossAudiences: [],
    bookMismatches: [],
  },
};

// Check all segments
for (const [segmentId, segmentData] of Object.entries(segmentTitles)) {
  if (!segmentId.startsWith('S')) continue; // Skip introduction segments
  
  const book = segmentData.book?.[0] || '';
  const ref = segmentData.ref || '';
  const title = segmentData.title || '';
  
  // Check English questions
  const schoolQ = schoolEN[segmentId];
  const familyQ = familyEN[segmentId];
  const smallGroupQ = smallGroupEN[segmentId];
  
  if (schoolQ && familyQ && smallGroupQ) {
    const schoolQ1 = schoolQ.Q1 || '';
    const familyQ1 = familyQ.Q1 || '';
    const smallGroupQ1 = smallGroupQ.Q1 || '';
    
    // Check if identical across audiences
    if (schoolQ1 === familyQ1 && schoolQ1 === smallGroupQ1 && schoolQ1) {
      issues.english.identicalAcrossAudiences.push({
        segmentId,
        book,
        ref,
        title,
        question: schoolQ1.substring(0, 60),
      });
    }
    
    // Check book mismatches for SmallGroup (most likely to have wrong references)
    if (smallGroupQ1) {
      const matchResult = checkQuestionMatchesBook(smallGroupQ1, book);
      if (matchResult && matchResult.wrongBooks) {
        issues.english.bookMismatches.push({
          segmentId,
          book,
          ref,
          title,
          audience: 'smallgroup',
          question: smallGroupQ1.substring(0, 80),
          wrongBooks: matchResult.wrongBooks,
        });
      }
    }
  }
  
  // Check French questions
  const schoolFRQ = schoolFR[segmentId];
  const familyFRQ = familyFR[segmentId];
  const smallGroupFRQ = smallGroupFR[segmentId];
  
  if (schoolFRQ && familyFRQ && smallGroupFRQ) {
    const schoolFRQ1 = schoolFRQ.Q1 || '';
    const familyFRQ1 = familyFRQ.Q1 || '';
    const smallGroupFRQ1 = smallGroupFRQ.Q1 || '';
    
    // Check if identical across audiences
    if (schoolFRQ1 === familyFRQ1 && schoolFRQ1 === smallGroupFRQ1 && schoolFRQ1) {
      issues.french.identicalAcrossAudiences.push({
        segmentId,
        book,
        ref,
        title,
        question: schoolFRQ1.substring(0, 60),
      });
    }
    
    // Check book mismatches for SmallGroup
    if (smallGroupFRQ1) {
      const matchResult = checkQuestionMatchesBook(smallGroupFRQ1, book);
      if (matchResult && matchResult.wrongBooks) {
        issues.french.bookMismatches.push({
          segmentId,
          book,
          ref,
          title,
          audience: 'smallgroup',
          question: smallGroupFRQ1.substring(0, 80),
          wrongBooks: matchResult.wrongBooks,
        });
      }
    }
  }
}

// Generate report
console.log('═══════════════════════════════════════════════════════════════');
console.log('         COMPREHENSIVE QUESTION MAPPING VERIFICATION');
console.log('═══════════════════════════════════════════════════════════════\n');

// English issues
console.log(`🔴 ENGLISH - Identical Questions Across Audiences (${issues.english.identicalAcrossAudiences.length} found)`);
console.log('───────────────────────────────────────────────────────────────');
if (issues.english.identicalAcrossAudiences.length === 0) {
  console.log('✅ No identical questions found!\n');
} else {
  issues.english.identicalAcrossAudiences.forEach(item => {
    console.log(`   ${item.segmentId} (${item.book} ${item.ref}): "${item.question}..."`);
  });
  console.log('');
}

console.log(`🔴 ENGLISH - Book Mismatches in SmallGroup (${issues.english.bookMismatches.length} found)`);
console.log('───────────────────────────────────────────────────────────────');
if (issues.english.bookMismatches.length === 0) {
  console.log('✅ No book mismatches found!\n');
} else {
  issues.english.bookMismatches.forEach(item => {
    console.log(`   ${item.segmentId} (${item.book} ${item.ref}) mentions ${item.wrongBooks.join(', ')}:`);
    console.log(`      "${item.question}..."`);
  });
  console.log('');
}

// French issues
console.log(`🔴 FRENCH - Identical Questions Across Audiences (${issues.french.identicalAcrossAudiences.length} found)`);
console.log('───────────────────────────────────────────────────────────────');
if (issues.french.identicalAcrossAudiences.length === 0) {
  console.log('✅ No identical questions found!\n');
} else {
  issues.french.identicalAcrossAudiences.forEach(item => {
    console.log(`   ${item.segmentId} (${item.book} ${item.ref}): "${item.question}..."`);
  });
  console.log('');
}

console.log(`🔴 FRENCH - Book Mismatches in SmallGroup (${issues.french.bookMismatches.length} found)`);
console.log('───────────────────────────────────────────────────────────────');
if (issues.french.bookMismatches.length === 0) {
  console.log('✅ No book mismatches found!\n');
} else {
  issues.french.bookMismatches.forEach(item => {
    console.log(`   ${item.segmentId} (${item.book} ${item.ref}) mentions ${item.wrongBooks.join(', ')}:`);
    console.log(`      "${item.question}..."`);
  });
  console.log('');
}

// Summary
console.log('═══════════════════════════════════════════════════════════════');
console.log('                         SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`English identical questions: ${issues.english.identicalAcrossAudiences.length}`);
console.log(`English book mismatches: ${issues.english.bookMismatches.length}`);
console.log(`French identical questions: ${issues.french.identicalAcrossAudiences.length}`);
console.log(`French book mismatches: ${issues.french.bookMismatches.length}`);
console.log('═══════════════════════════════════════════════════════════════\n');

// Save detailed results
const outputPath = path.join(projectRoot, 'question-mapping-verification.json');
fs.writeFileSync(outputPath, JSON.stringify({
  english: issues.english,
  french: issues.french,
}, null, 2));

console.log(`📄 Detailed results saved to: ${outputPath}`);

