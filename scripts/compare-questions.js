#!/usr/bin/env node

/**
 * Compare English vs French Questions
 * 
 * This script identifies:
 * - Segments with identical/similar questions across audiences
 * - Missing questions in either language
 * - Mismatches between English and French content
 * - Potential mapping errors
 */

const fs = require('fs');
const path = require('path');

// Load all question files
const projectRoot = path.resolve(__dirname, '..');

const loadQuestions = (filePath) => {
  try {
    const fullPath = path.join(projectRoot, filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error loading ${filePath}:`, error.message);
    return null;
  }
};

console.log('📊 Loading question files...\n');

// Load English questions
const schoolQuestionsEN = loadQuestions('assets/data/SchoolQuestions.json');
const familyQuestionsEN = loadQuestions('assets/data/FamilyQuestions.json');
const smallGroupQuestionsEN = loadQuestions('assets/data/SmallGroupQuestions.json');

// Load French questions
const schoolQuestionsFR = loadQuestions('assets/data/SchoolQuestions-FR.json');
const familyQuestionsFR = loadQuestions('assets/data/FamilyQuestions-FR.json');
const smallGroupQuestionsFR = loadQuestions('assets/data/SmallGroupQuestions-FR.json');

// Extract question sets
const schoolEN = schoolQuestionsEN?.SchoolQuestions || {};
const familyEN = familyQuestionsEN?.FamilyQuestions || {};
const smallGroupEN = smallGroupQuestionsEN?.SmallGroupQuestions || {};

const schoolFR = schoolQuestionsFR?.SchoolQuestions || {};
const familyFR = familyQuestionsFR?.FamilyQuestions || {};
const smallGroupFR = smallGroupQuestionsFR?.SmallGroupQuestions || {};

// Get all segment IDs
const allSegments = new Set([
  ...Object.keys(schoolEN),
  ...Object.keys(familyEN),
  ...Object.keys(smallGroupEN),
  ...Object.keys(schoolFR),
  ...Object.keys(familyFR),
  ...Object.keys(smallGroupFR),
]);

console.log(`📈 Found ${allSegments.size} total segments\n`);

// Helper to normalize questions for comparison
const normalizeQuestion = (q) => {
  if (!q) return '';
  return q.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Calculate similarity between two question arrays
const calculateSimilarity = (questions1, questions2) => {
  if (!questions1 || !questions2) return 0;
  
  const q1 = questions1.map(normalizeQuestion);
  const q2 = questions2.map(normalizeQuestion);
  
  if (q1.length === 0 || q2.length === 0) return 0;
  
  let matches = 0;
  const total = Math.max(q1.length, q2.length);
  
  for (let i = 0; i < Math.min(q1.length, q2.length); i++) {
    if (q1[i] === q2[i]) {
      matches++;
    } else {
      // Check for partial matches (same words, different order)
      const words1 = q1[i].split(' ').sort();
      const words2 = q2[i].split(' ').sort();
      if (words1.join(' ') === words2.join(' ')) {
        matches += 0.5;
      }
    }
  }
  
  return (matches / total) * 100;
};

// Compare questions within a language (across audiences)
const compareAudiences = (segmentId, lang) => {
  const questions = {
    school: lang === 'en' ? schoolEN[segmentId] : schoolFR[segmentId],
    family: lang === 'en' ? familyEN[segmentId] : familyFR[segmentId],
    smallgroup: lang === 'en' ? smallGroupEN[segmentId] : smallGroupFR[segmentId],
  };
  
  const qArrays = {
    school: questions.school ? [questions.school.Q1, questions.school.Q2, questions.school.Q3, questions.school.Q4].filter(q => q) : [],
    family: questions.family ? [questions.family.Q1, questions.family.Q2, questions.family.Q3, questions.family.Q4].filter(q => q) : [],
    smallgroup: questions.smallgroup ? [questions.smallgroup.Q1, questions.smallgroup.Q2, questions.smallgroup.Q3, questions.smallgroup.Q4].filter(q => q) : [],
  };
  
  const similarities = {
    school_vs_family: calculateSimilarity(qArrays.school, qArrays.family),
    school_vs_smallgroup: calculateSimilarity(qArrays.school, qArrays.smallgroup),
    family_vs_smallgroup: calculateSimilarity(qArrays.family, qArrays.smallgroup),
  };
  
  return { similarities, questions, qArrays };
};

// Compare English vs French for same audience
const compareLanguages = (segmentId, audience) => {
  const en = audience === 'school' ? schoolEN[segmentId] : 
             audience === 'family' ? familyEN[segmentId] : 
             smallGroupEN[segmentId];
  
  const fr = audience === 'school' ? schoolFR[segmentId] : 
             audience === 'family' ? familyFR[segmentId] : 
             smallGroupFR[segmentId];
  
  if (!en && !fr) return null;
  if (!en || !fr) return { missing: en ? 'fr' : 'en' };
  
  const enArray = [en.Q1, en.Q2, en.Q3, en.Q4].filter(q => q);
  const frArray = [fr.Q1, fr.Q2, fr.Q3, fr.Q4].filter(q => q);
  
  return {
    similarity: calculateSimilarity(enArray, frArray),
    enCount: enArray.length,
    frCount: frArray.length,
  };
};

// Analyze segments
const results = {
  identicalWithinLanguage: [], // Same questions across audiences in same language
  verySimilarWithinLanguage: [], // >80% similar across audiences
  missingQuestions: [], // Missing in one language or audience
  languageMismatches: [], // Very different between EN/FR (potential translation issues)
  mappingErrors: [], // Questions don't match the segment topic
};

// Load segment titles to check for mapping errors
const segmentTitles = loadQuestions('assets/data/SegmentTitles.json') || {};

for (const segmentId of allSegments) {
  const segmentTitle = segmentTitles[segmentId];
  const book = segmentTitle?.book?.[0] || 'Unknown';
  const ref = segmentTitle?.ref || '';
  
  // Compare within English
  const enComparison = compareAudiences(segmentId, 'en');
  const enSimilarities = enComparison.similarities;
  
  // Compare within French
  const frComparison = compareAudiences(segmentId, 'fr');
  const frSimilarities = frComparison.similarities;
  
  // Check for identical questions within language
  const enMaxSimilarity = Math.max(enSimilarities.school_vs_family, enSimilarities.school_vs_smallgroup, enSimilarities.family_vs_smallgroup);
  const frMaxSimilarity = Math.max(frSimilarities.school_vs_family, frSimilarities.school_vs_smallgroup, frSimilarities.family_vs_smallgroup);
  
  if (enMaxSimilarity === 100) {
    results.identicalWithinLanguage.push({
      segmentId,
      language: 'en',
      similarity: enMaxSimilarity,
      book,
      ref,
    });
  }
  
  if (frMaxSimilarity === 100) {
    results.identicalWithinLanguage.push({
      segmentId,
      language: 'fr',
      similarity: frMaxSimilarity,
      book,
      ref,
    });
  }
  
  // Check for very similar questions (>80%)
  if (enMaxSimilarity >= 80 && enMaxSimilarity < 100) {
    results.verySimilarWithinLanguage.push({
      segmentId,
      language: 'en',
      similarity: enMaxSimilarity,
      book,
      ref,
      details: enSimilarities,
    });
  }
  
  if (frMaxSimilarity >= 80 && frMaxSimilarity < 100) {
    results.verySimilarWithinLanguage.push({
      segmentId,
      language: 'fr',
      similarity: frMaxSimilarity,
      book,
      ref,
      details: frSimilarities,
    });
  }
  
  // Check for missing questions
  const hasSchoolEN = !!schoolEN[segmentId];
  const hasFamilyEN = !!familyEN[segmentId];
  const hasSmallGroupEN = !!smallGroupEN[segmentId];
  const hasSchoolFR = !!schoolFR[segmentId];
  const hasFamilyFR = !!familyFR[segmentId];
  const hasSmallGroupFR = !!smallGroupFR[segmentId];
  
  if (!hasSchoolEN || !hasFamilyEN || !hasSmallGroupEN || !hasSchoolFR || !hasFamilyFR || !hasSmallGroupFR) {
    results.missingQuestions.push({
      segmentId,
      book,
      ref,
      en: { school: hasSchoolEN, family: hasFamilyEN, smallgroup: hasSmallGroupEN },
      fr: { school: hasSchoolFR, family: hasFamilyFR, smallgroup: hasSmallGroupFR },
    });
  }
  
  // Check language mismatches
  for (const audience of ['school', 'family', 'smallgroup']) {
    const langComparison = compareLanguages(segmentId, audience);
    if (langComparison && langComparison.similarity !== undefined) {
      if (langComparison.similarity < 30) {
        // Very different - might be a mapping error
        const enQ = audience === 'school' ? schoolEN[segmentId] : 
                    audience === 'family' ? familyEN[segmentId] : 
                    smallGroupEN[segmentId];
        const frQ = audience === 'school' ? schoolFR[segmentId] : 
                    audience === 'family' ? familyFR[segmentId] : 
                    smallGroupFR[segmentId];
        
        // Check if French question references wrong book
        const frQ1 = frQ?.Q1 || '';
        const enQ1 = enQ?.Q1 || '';
        
        // Simple check: if French question mentions a different book than expected
        const expectedBook = book.toLowerCase();
        const frQ1Lower = frQ1.toLowerCase();
        
        // Common book name mappings
        const bookMappings = {
          'act': ['acts', 'actes', 'acts of the apostles'],
          'rom': ['romans', 'romains'],
          'gen': ['genesis', 'genèse'],
        };
        
        let potentialMappingError = false;
        for (const [bookCode, variations] of Object.entries(bookMappings)) {
          if (expectedBook.includes(bookCode)) {
            // Check if French question mentions a different book
            for (const [otherCode, otherVariations] of Object.entries(bookMappings)) {
              if (otherCode !== bookCode) {
                if (otherVariations.some(v => frQ1Lower.includes(v))) {
                  potentialMappingError = true;
                }
              }
            }
          }
        }
        
        results.languageMismatches.push({
          segmentId,
          audience,
          book,
          ref,
          similarity: langComparison.similarity,
          enQ1: enQ1.substring(0, 60),
          frQ1: frQ1.substring(0, 60),
          potentialMappingError,
        });
      }
    }
  }
}

// Generate report
console.log('═══════════════════════════════════════════════════════════════');
console.log('           QUESTION COMPARISON REPORT');
console.log('═══════════════════════════════════════════════════════════════\n');

// 1. Identical questions within language
console.log(`🔴 IDENTICAL QUESTIONS ACROSS AUDIENCES (${results.identicalWithinLanguage.length} found)`);
console.log('───────────────────────────────────────────────────────────────');
if (results.identicalWithinLanguage.length === 0) {
  console.log('✅ No identical questions found!\n');
} else {
  results.identicalWithinLanguage.forEach(item => {
    console.log(`   ${item.segmentId} (${item.book} ${item.ref}) - ${item.language.toUpperCase()}: ${item.similarity}% identical`);
  });
  console.log('');
}

// 2. Very similar questions
console.log(`🟡 VERY SIMILAR QUESTIONS (>80% similar) (${results.verySimilarWithinLanguage.length} found)`);
console.log('───────────────────────────────────────────────────────────────');
if (results.verySimilarWithinLanguage.length === 0) {
  console.log('✅ No very similar questions found!\n');
} else {
  results.verySimilarWithinLanguage.slice(0, 10).forEach(item => {
    console.log(`   ${item.segmentId} (${item.book} ${item.ref}) - ${item.language.toUpperCase()}: ${item.similarity.toFixed(1)}% similar`);
    console.log(`      School vs Family: ${item.details.school_vs_family.toFixed(1)}%`);
    console.log(`      School vs SmallGroup: ${item.details.school_vs_smallgroup.toFixed(1)}%`);
    console.log(`      Family vs SmallGroup: ${item.details.family_vs_smallgroup.toFixed(1)}%`);
  });
  if (results.verySimilarWithinLanguage.length > 10) {
    console.log(`   ... and ${results.verySimilarWithinLanguage.length - 10} more`);
  }
  console.log('');
}

// 3. Missing questions
console.log(`⚠️  MISSING QUESTIONS (${results.missingQuestions.length} found)`);
console.log('───────────────────────────────────────────────────────────────');
if (results.missingQuestions.length === 0) {
  console.log('✅ All segments have questions for all audiences!\n');
} else {
  results.missingQuestions.slice(0, 10).forEach(item => {
    const missing = [];
    if (!item.en.school) missing.push('EN-School');
    if (!item.en.family) missing.push('EN-Family');
    if (!item.en.smallgroup) missing.push('EN-SmallGroup');
    if (!item.fr.school) missing.push('FR-School');
    if (!item.fr.family) missing.push('FR-Family');
    if (!item.fr.smallgroup) missing.push('FR-SmallGroup');
    console.log(`   ${item.segmentId} (${item.book} ${item.ref}): Missing ${missing.join(', ')}`);
  });
  if (results.missingQuestions.length > 10) {
    console.log(`   ... and ${results.missingQuestions.length - 10} more`);
  }
  console.log('');
}

// 4. Language mismatches (potential mapping errors)
console.log(`🚨 LANGUAGE MISMATCHES / POTENTIAL MAPPING ERRORS (${results.languageMismatches.length} found)`);
console.log('───────────────────────────────────────────────────────────────');
if (results.languageMismatches.length === 0) {
  console.log('✅ No significant mismatches found!\n');
} else {
  const mappingErrors = results.languageMismatches.filter(m => m.potentialMappingError);
  const lowSimilarity = results.languageMismatches.filter(m => !m.potentialMappingError && m.similarity < 30);
  
  if (mappingErrors.length > 0) {
    console.log(`   🔴 POTENTIAL MAPPING ERRORS (${mappingErrors.length}):`);
    mappingErrors.forEach(item => {
      console.log(`   ${item.segmentId} (${item.book} ${item.ref}) - ${item.audience}:`);
      console.log(`      EN: ${item.enQ1}...`);
      console.log(`      FR: ${item.frQ1}...`);
      console.log(`      Similarity: ${item.similarity.toFixed(1)}%`);
    });
    console.log('');
  }
  
  if (lowSimilarity.length > 0) {
    console.log(`   ⚠️  LOW SIMILARITY (<30%) (${lowSimilarity.length}):`);
    lowSimilarity.slice(0, 5).forEach(item => {
      console.log(`   ${item.segmentId} (${item.book} ${item.ref}) - ${item.audience}: ${item.similarity.toFixed(1)}% similar`);
      console.log(`      EN: ${item.enQ1}...`);
      console.log(`      FR: ${item.frQ1}...`);
    });
    if (lowSimilarity.length > 5) {
      console.log(`   ... and ${lowSimilarity.length - 5} more`);
    }
    console.log('');
  }
}

// Summary statistics
console.log('═══════════════════════════════════════════════════════════════');
console.log('                         SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Total segments: ${allSegments.size}`);
console.log(`Segments with identical questions (EN): ${results.identicalWithinLanguage.filter(r => r.language === 'en').length}`);
console.log(`Segments with identical questions (FR): ${results.identicalWithinLanguage.filter(r => r.language === 'fr').length}`);
console.log(`Segments with very similar questions (>80%): ${results.verySimilarWithinLanguage.length}`);
console.log(`Segments with missing questions: ${results.missingQuestions.length}`);
console.log(`Segments with language mismatches: ${results.languageMismatches.length}`);
console.log(`Potential mapping errors: ${results.languageMismatches.filter(m => m.potentialMappingError).length}`);
console.log('═══════════════════════════════════════════════════════════════\n');

// Export detailed results to JSON
const outputPath = path.join(projectRoot, 'question-comparison-results.json');
fs.writeFileSync(outputPath, JSON.stringify({
  summary: {
    totalSegments: allSegments.size,
    identicalWithinLanguage: results.identicalWithinLanguage.length,
    verySimilarWithinLanguage: results.verySimilarWithinLanguage.length,
    missingQuestions: results.missingQuestions.length,
    languageMismatches: results.languageMismatches.length,
    mappingErrors: results.languageMismatches.filter(m => m.potentialMappingError).length,
  },
  identicalWithinLanguage: results.identicalWithinLanguage,
  verySimilarWithinLanguage: results.verySimilarWithinLanguage,
  missingQuestions: results.missingQuestions,
  languageMismatches: results.languageMismatches,
}, null, 2));

console.log(`📄 Detailed results saved to: ${outputPath}`);
