import logger from '@/utils/logger';
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
  logger.info('🚀 Starting reading time calculation...');
  
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

  logger.info(`📊 Found ${stats.totalSegments} segments to process`);

  // Process each segment
  allSegmentIds.forEach(segmentId => {
    try {
      const segmentData = BibleData[segmentId];
      const segmentTitle = SegmentTitles[segmentId];
      
      if (!segmentData) {
        logger.warn(`⚠️  No Bible data found for segment: ${segmentId}`);
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
        logger.warn(`⚠️  No sources data found for segment: ${segmentId}`);
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
        logger.info(`📈 Processed ${stats.processedSegments}/${stats.totalSegments} segments`);
      }

    } catch (error) {
      logger.error(`❌ Error processing segment ${segmentId}:`, error.message);
      stats.errorSegments++;
    }
  });

  logger.info('\n📊 Processing Statistics:');
  logger.info(`✅ Successfully processed: ${stats.processedSegments} segments`);
  logger.info(`❌ Failed to process: ${stats.errorSegments} segments`);
  logger.info(`📝 Total words: ${stats.totalWords.toLocaleString()}`);
  logger.info(`⏱️  Total reading time: ${stats.totalMinutes} minutes (${Math.round(stats.totalMinutes / 60)} hours)`);
  logger.info(`📊 Average words per segment: ${Math.round(stats.totalWords / stats.processedSegments)}`);
  logger.info(`⏰ Average reading time: ${Math.round(stats.totalMinutes / stats.processedSegments)} minutes`);
  logger.info(`📈 Segments WITH word counts: ${stats.segmentsWithWordCounts}`);
  logger.info(`📉 Segments WITHOUT word counts: ${stats.segmentsWithoutWordCounts}`);

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
    
    logger.info(`\n✅ Reading times saved to: ${outputPath}`);
    logger.info(`📄 File contains ${Object.keys(readingTimes).length} segment entries`);
    
    // Show some sample entries
    logger.info('\n📝 Sample entries:');
    const sampleSegments = ['S001', 'S002', 'S003', 'I001', 'I002'];
    sampleSegments.forEach(segmentId => {
      if (readingTimes[segmentId]) {
        const data = readingTimes[segmentId];
        logger.info(`${segmentId}: "${data.title}" - ${data.wordCount} words, ${data.estimatedReadingTimeMinutes} min`);
      }
    });

    // Show top 5 longest segments
    logger.info('\n📚 Top 5 longest segments:');
    const sortedByWords = Object.values(readingTimes)
      .filter(segment => !segment.isIntroduction && segment.wordCount > 0)
      .sort((a, b) => b.wordCount - a.wordCount)
      .slice(0, 5);
    
    sortedByWords.forEach((segment, index) => {
      logger.info(`${index + 1}. ${segment.segmentId}: "${segment.title}" - ${segment.wordCount} words, ${segment.estimatedReadingTimeMinutes} min`);
    });

    return outputPath;
  } catch (error) {
    logger.error('❌ Error saving reading times:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  logger.info('🎯 Generating segment reading times...\n');
  try {
    saveReadingTimes();
    logger.info('\n🎉 Reading times generation completed successfully!');
  } catch (error) {
    logger.error('\n💥 Script failed:', error);
    process.exit(1);
  }
}

module.exports = {
  generateReadingTimes,
  saveReadingTimes,
  calculateReadingTime
}; 