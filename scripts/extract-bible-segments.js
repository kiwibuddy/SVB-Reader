/**
 * Extract Bible segments only from FRA-Bible-with-questions.json
 * Creates a new FRA-Bible.json file with only segments (no questions)
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const inputFile = path.join(projectRoot, 'FRA-Bible-with-questions.json');
const outputFile = path.join(projectRoot, 'FRA-Bible.json');

console.log('🔄 Extracting Bible segments only from FRA-Bible-with-questions.json...\n');

try {
  // Read the existing file
  console.log('📖 Reading input file...');
  const bibleData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  
  // Check structure
  if (!bibleData.segments) {
    console.error('❌ Error: Input file does not have a "segments" section');
    process.exit(1);
  }
  
  const segmentCount = Object.keys(bibleData.segments).length;
  console.log(`  ✅ Found ${segmentCount} segments`);
  
  if (bibleData.questions) {
    const questionCount = Object.keys(bibleData.questions).length;
    console.log(`  ℹ️  Also found ${questionCount} question segments (will be excluded)`);
  }
  
  // Create new structure with only segments
  const bibleOnly = {
    segments: bibleData.segments
  };
  
  // Save to new file
  console.log(`\n💾 Saving ${outputFile}...`);
  fs.writeFileSync(outputFile, JSON.stringify(bibleOnly, null, 2), 'utf8');
  
  // Get file size
  const stats = fs.statSync(outputFile);
  const fileSizeKB = (stats.size / 1024).toFixed(2);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  const fileSizeBytes = stats.size;
  
  console.log(`  ✅ Saved successfully (${fileSizeKB} KB / ${fileSizeMB} MB)`);
  
  console.log('\n✅ Extraction complete!');
  console.log(`\n📁 Output file: ${outputFile}`);
  console.log(`📊 Summary:`);
  console.log(`   - Segments: ${segmentCount}`);
  console.log(`   - File size: ${fileSizeMB} MB (${fileSizeBytes} bytes)`);
  console.log(`   - Ready for Firebase upload`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Upload ${path.basename(outputFile)} to Firebase Storage`);
  console.log(`   2. Update metadata.json with new file size and URL`);
  console.log(`   3. Delete old FRA-Bible-with-questions.json after verification`);

} catch (error) {
  console.error('\n❌ Error extracting Bible:', error);
  process.exit(1);
}

