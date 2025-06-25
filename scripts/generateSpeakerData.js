const fs = require('fs');
const path = require('path');

// Load the Bible data
const bibleData = require('../assets/data/newBibleNLT1.json');
const segmentTitles = require('../assets/data/SegmentTitles.json');

// Define Old and New Testament books
const oldTestamentBooks = ['Gen', 'Exo', 'Lev', 'Num', 'Deu', 'Jos', 'Jdg', 'Rut', '1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch', 'Ezr', 'Neh', 'Est', 'Job', 'Psa', 'Pro', 'Ecc', 'SoS', 'Isa', 'Jer', 'Lam', 'Eze', 'Dan', 'Hos', 'Joe', 'Amo', 'Oba', 'Jon', 'Mic', 'Nah', 'Hab', 'Zep', 'Hag', 'Zec', 'Mal'];
const newTestamentBooks = ['Mat', 'Mar', 'Luk', 'Joh', 'Act', 'Rom', '1Co', '2Co', 'Gal', 'Eph', 'Php', 'Col', '1Th', '2Th', '1Ti', '2Ti', 'Tit', 'Phm', 'Heb', 'Jam', '1Pe', '2Pe', '1Jn', '2Jn', '3Jn', 'Jud', 'Rev'];

function getBookFromSegmentId(segmentId) {
  const segmentData = segmentTitles[segmentId];
  if (!segmentData || !segmentData.book || segmentData.book.length === 0) {
    return null;
  }
  return segmentData.book[0]; // Get the first book
}

function isOldTestament(bookKey) {
  return oldTestamentBooks.includes(bookKey);
}

function isNewTestament(bookKey) {
  return newTestamentBooks.includes(bookKey);
}

function analyzeSpeakers() {
  const otSpeakers = {}; // Old Testament speakers (only those with green roles)
  const ntSpeakers = {}; // New Testament speakers (only those with green roles)
  const speakerSegments = {}; // Track ALL segments each speaker appears in (green OR blue)

  // First pass: identify speakers who have GREEN speaking roles
  const greenSpeakers = new Set();
  
  Object.keys(bibleData).forEach(segmentId => {
    const segment = bibleData[segmentId];
    if (!segment.sources) return;

    Object.keys(segment.sources).forEach(speakerName => {
      const speaker = segment.sources[speakerName];
      if (speaker.color === 'green') {
        greenSpeakers.add(speakerName.trim());
      }
    });
  });

  console.log(`Found ${greenSpeakers.size} speakers with green speaking roles`);

  // Second pass: collect ALL appearances (green AND blue) of green speakers
  Object.keys(bibleData).forEach(segmentId => {
    const segment = bibleData[segmentId];
    if (!segment.sources) return;

    const bookKey = getBookFromSegmentId(segmentId);
    if (!bookKey) return;

    const isOT = isOldTestament(bookKey);
    const isNT = isNewTestament(bookKey);
    
    if (!isOT && !isNT) return;

    // Analyze each speaker in this segment
    Object.keys(segment.sources).forEach(speakerName => {
      const speaker = segment.sources[speakerName];
      const cleanSpeakerName = speakerName.trim();
      
      // Only process speakers who have green roles somewhere
      if (!greenSpeakers.has(cleanSpeakerName)) return;
      
      // Count both green and blue appearances for green speakers
      if (speaker.color !== 'green' && speaker.color !== 'blue') return;

      const wordCount = speaker.words || 0;

      // Initialize speaker tracking for ALL appearances
      if (!speakerSegments[cleanSpeakerName]) {
        speakerSegments[cleanSpeakerName] = {
          segments: new Set(),
          totalWords: 0,
          greenWords: 0,
          colors: new Set(),
          testament: isOT ? 'OT' : 'NT'
        };
      }

      // Track this appearance
      speakerSegments[cleanSpeakerName].segments.add(segmentId);
      speakerSegments[cleanSpeakerName].totalWords += wordCount;
      if (speaker.color === 'green') {
        speakerSegments[cleanSpeakerName].greenWords += wordCount;
      }
      speakerSegments[cleanSpeakerName].colors.add(speaker.color);

      // Add to appropriate testament collection (only count green words for ranking)
      const targetCollection = isOT ? otSpeakers : ntSpeakers;
      
      if (!targetCollection[cleanSpeakerName]) {
        targetCollection[cleanSpeakerName] = {
          name: cleanSpeakerName,
          greenWords: 0,
          totalWords: 0,
          segmentCount: 0,
          colors: new Set(),
          segments: new Set()
        };
      }

      targetCollection[cleanSpeakerName].totalWords += wordCount;
      targetCollection[cleanSpeakerName].segments.add(segmentId);
      targetCollection[cleanSpeakerName].segmentCount = targetCollection[cleanSpeakerName].segments.size;
      targetCollection[cleanSpeakerName].colors.add(speaker.color);
      
      if (speaker.color === 'green') {
        targetCollection[cleanSpeakerName].greenWords += wordCount;
      }
    });
  });

  return { otSpeakers, ntSpeakers, speakerSegments, greenSpeakersCount: greenSpeakers.size };
}

function getTopSpeakers(speakers, count = 20) {
  return Object.values(speakers)
    .map(speaker => ({
      ...speaker,
      colors: Array.from(speaker.colors),
      segments: Array.from(speaker.segments)
    }))
    .sort((a, b) => {
      // Primary sort: green words (descending) - only rank by green speaking roles
      if (b.greenWords !== a.greenWords) {
        return b.greenWords - a.greenWords;
      }
      // Secondary sort: segment count (descending)
      return b.segmentCount - a.segmentCount;
    })
    .slice(0, count);
}

function generateSpeakerSegmentMap(speakerSegments, topOTSpeakers, topNTSpeakers) {
  const speakerSegmentMap = {};
  
  // Combine top speakers from both testaments
  const allTopSpeakers = [
    ...topOTSpeakers.map(s => s.name),
    ...topNTSpeakers.map(s => s.name)
  ];

  allTopSpeakers.forEach(speakerName => {
    if (speakerSegments[speakerName]) {
      speakerSegmentMap[speakerName] = Array.from(speakerSegments[speakerName].segments);
    }
  });

  return speakerSegmentMap;
}

function main() {
  console.log('Analyzing Bible speakers...');
  
  const { otSpeakers, ntSpeakers, speakerSegments, greenSpeakersCount } = analyzeSpeakers();
  
  console.log(`Found ${Object.keys(otSpeakers).length} Old Testament speakers`);
  console.log(`Found ${Object.keys(ntSpeakers).length} New Testament speakers`);
  
  const topOTSpeakers = getTopSpeakers(otSpeakers, 20);
  const topNTSpeakers = getTopSpeakers(ntSpeakers, 20);
  
  console.log('\nTop 20 Old Testament Speakers (ranked by green words):');
  topOTSpeakers.forEach((speaker, index) => {
    console.log(`${index + 1}. ${speaker.name} - ${speaker.greenWords} green words (${speaker.totalWords} total) in ${speaker.segmentCount} segments (${speaker.colors.join(', ')})`);
  });
  
  console.log('\nTop 20 New Testament Speakers (ranked by green words):');
  topNTSpeakers.forEach((speaker, index) => {
    console.log(`${index + 1}. ${speaker.name} - ${speaker.greenWords} green words (${speaker.totalWords} total) in ${speaker.segmentCount} segments (${speaker.colors.join(', ')})`);
  });

  // Generate the speaker-segment mapping
  const speakerSegmentMap = generateSpeakerSegmentMap(speakerSegments, topOTSpeakers, topNTSpeakers);

  // Create the output data structure
  const outputData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      description: "Top 20 Old Testament and 20 New Testament speakers with green speaking roles (ranked by green words, includes all green+blue appearances)",
      totalOTSpeakers: Object.keys(otSpeakers).length,
      totalNTSpeakers: Object.keys(ntSpeakers).length,
      totalGreenSpeakers: greenSpeakersCount
    },
    oldTestament: topOTSpeakers,
    newTestament: topNTSpeakers,
    speakerSegmentMap: speakerSegmentMap
  };

  // Write to JSON file
  const outputPath = path.join(__dirname, '../assets/data/TopSpeakers.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  
  console.log(`\nData written to ${outputPath}`);
  console.log('Speaker analysis complete!');
}

if (require.main === module) {
  main();
}

module.exports = { analyzeSpeakers, getTopSpeakers }; 