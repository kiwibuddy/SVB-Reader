const fs = require('fs');
const path = require('path');

// Import the Bible data
const BibleData = require('../assets/data/newBibleNLT1.json');
const SegmentTitles = require('../assets/data/SegmentTitles.json');

/**
 * Calculate reading time based on word count
 * @param {number} wordCount - Total word count
 * @returns {number} - Estimated reading time in minutes
 */
function calculateReadingTime(wordCount) {
  if (!wordCount || wordCount === 0) return 1; // Minimum 1 minute
  
  // Average reading speed is 200-250 words per minute, using 225 for estimate
  const readingTimeMinutes = Math.ceil(wordCount / 225);
  return Math.max(1, readingTimeMinutes); // Minimum 1 minute
}

/**
 * Get total word count from sources data
 * @param {Object} sources - Sources object with word counts
 * @returns {number} - Total word count
 */
function getTotalWordCount(sources) {
  if (!sources || typeof sources !== 'object') return 0;
  
  let totalWords = 0;
  Object.values(sources).forEach(source => {
    if (source && typeof source.words === 'number') {
      totalWords += source.words;
    }
  });
  
  return totalWords;
}

/**
 * Generate reading times for all segments
 */
function generateReadingTimes() {
  console.log('🚀 Starting reading time calculation...');
  
  const readingTimes = {};
  const stats = {
    totalSegments: 0,
    processedSegments: 0,
    errorSegments: 0,
    totalWords: 0,
    totalMinutes: 0,
    segmentsWithWordCounts: 0,
    segmentsWithoutWordCounts: 0
  };

  // Get all segment IDs from SegmentTitles (this includes both story and intro segments)
  const allSegmentIds = Object.keys(SegmentTitles);
  stats.totalSegments = allSegmentIds.length;

  console.log(`📊 Found ${stats.totalSegments} segments to process`);

  // Process each segment
  allSegmentIds.forEach(segmentId => {
    try {
      const segmentData = BibleData[segmentId];
      const segmentTitle = SegmentTitles[segmentId];
      
      if (!segmentData) {
        console.warn(`⚠️  No Bible data found for segment: ${segmentId}`);
        stats.errorSegments++;
        return;
      }

      // Get word count from sources data
      let wordCount = 0;
      if (segmentData.sources) {
        wordCount = getTotalWordCount(segmentData.sources);
        if (wordCount > 0) {
          stats.segmentsWithWordCounts++;
        } else {
          stats.segmentsWithoutWordCounts++;
        }
      } else {
        console.warn(`⚠️  No sources data found for segment: ${segmentId}`);
        stats.segmentsWithoutWordCounts++;
      }

      // Calculate reading time
      const readingTimeMinutes = calculateReadingTime(wordCount);

      // Store the data
      readingTimes[segmentId] = {
        segmentId: segmentId,
        title: segmentTitle?.title || 'Unknown Title',
        wordCount: wordCount,
        estimatedReadingTimeMinutes: readingTimeMinutes,
        book: segmentTitle?.book?.[0] || 'Unknown',
        reference: segmentTitle?.ref || '',
        isIntroduction: segmentId.startsWith('I')
      };

      // Update stats
      stats.processedSegments++;
      stats.totalWords += wordCount;
      stats.totalMinutes += readingTimeMinutes;

      // Log progress every 50 segments
      if (stats.processedSegments % 50 === 0) {
        console.log(`📈 Processed ${stats.processedSegments}/${stats.totalSegments} segments`);
      }

    } catch (error) {
      console.error(`❌ Error processing segment ${segmentId}:`, error.message);
      stats.errorSegments++;
    }
  });

  console.log('\n📊 Processing Statistics:');
  console.log(`✅ Successfully processed: ${stats.processedSegments} segments`);
  console.log(`❌ Failed to process: ${stats.errorSegments} segments`);
  console.log(`📝 Total words: ${stats.totalWords.toLocaleString()}`);
  console.log(`⏱️  Total reading time: ${stats.totalMinutes} minutes (${Math.round(stats.totalMinutes / 60)} hours)`);
  console.log(`📊 Average words per segment: ${Math.round(stats.totalWords / stats.processedSegments)}`);
  console.log(`⏰ Average reading time: ${Math.round(stats.totalMinutes / stats.processedSegments)} minutes`);
  console.log(`📈 Segments WITH word counts: ${stats.segmentsWithWordCounts}`);
  console.log(`📉 Segments WITHOUT word counts: ${stats.segmentsWithoutWordCounts}`);

  return readingTimes;
}

/**
 * Save reading times to JSON file
 */
function saveReadingTimes() {
  try {
    const readingTimes = generateReadingTimes();
    
    // Create the output file path
    const outputPath = path.join(__dirname, '../assets/data/SegmentReadingTimes.json');
    
    // Save the data
    fs.writeFileSync(outputPath, JSON.stringify(readingTimes, null, 2), 'utf8');
    
    console.log(`\n✅ Reading times saved to: ${outputPath}`);
    console.log(`📄 File contains ${Object.keys(readingTimes).length} segment entries`);
    
    // Show some sample entries
    console.log('\n📝 Sample entries:');
    const sampleSegments = ['S001', 'S002', 'S003', 'I001', 'I002'];
    sampleSegments.forEach(segmentId => {
      if (readingTimes[segmentId]) {
        const data = readingTimes[segmentId];
        console.log(`${segmentId}: "${data.title}" - ${data.wordCount} words, ${data.estimatedReadingTimeMinutes} min`);
      }
    });

    // Show top 5 longest segments
    console.log('\n📚 Top 5 longest segments:');
    const sortedByWords = Object.values(readingTimes)
      .filter(segment => !segment.isIntroduction && segment.wordCount > 0)
      .sort((a, b) => b.wordCount - a.wordCount)
      .slice(0, 5);
    
    sortedByWords.forEach((segment, index) => {
      console.log(`${index + 1}. ${segment.segmentId}: "${segment.title}" - ${segment.wordCount} words, ${segment.estimatedReadingTimeMinutes} min`);
    });

    return outputPath;
  } catch (error) {
    console.error('❌ Error saving reading times:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  console.log('🎯 Generating segment reading times...\n');
  try {
    saveReadingTimes();
    console.log('\n🎉 Reading times generation completed successfully!');
  } catch (error) {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }
}

module.exports = {
  generateReadingTimes,
  saveReadingTimes,
  calculateReadingTime
}; 