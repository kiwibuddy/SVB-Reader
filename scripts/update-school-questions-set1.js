/**
 * Update School Questions Set 1 from TSV files
 * 
 * Reads TSV files from "New school Questions" folder and updates
 * Questions-EN.json with new Set 1 questions for school audience only.
 * Set 2 remains unchanged.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const tsvFolder = path.join(projectRoot, 'assets', 'data', 'New school Questions');
const questionsFile = path.join(projectRoot, 'assets', 'data', 'Questions-EN.json');

console.log('🔄 Updating School Questions Set 1 from TSV files...\n');

try {
  // Load current Questions-EN.json
  console.log('📖 Loading Questions-EN.json...');
  const questionsData = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));
  
  if (!questionsData.questions) {
    throw new Error('Questions-EN.json missing questions section');
  }
  
  console.log(`  ✅ Loaded ${Object.keys(questionsData.questions).length} segments\n`);

  // Get all TSV files
  const tsvFiles = fs.readdirSync(tsvFolder)
    .filter(file => file.endsWith('.tsv'))
    .sort(); // Sort to process in order

  console.log(`📁 Found ${tsvFiles.length} TSV files:`);
  tsvFiles.forEach(file => console.log(`  - ${file}`));
  console.log('');

  let totalUpdated = 0;
  let totalSkipped = 0;
  const updatedSegments = [];
  const skippedSegments = [];

  // Process each TSV file
  for (const tsvFile of tsvFiles) {
    const tsvPath = path.join(tsvFolder, tsvFile);
    console.log(`📖 Processing ${tsvFile}...`);
    
    const content = fs.readFileSync(tsvPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    // Skip header line
    const dataLines = lines.slice(1);
    
    let fileUpdated = 0;
    let fileSkipped = 0;

    for (const line of dataLines) {
      if (!line.trim()) continue;
      
      // Parse TSV line: Segment\tQ1\tQ2\tQ3\tQ4
      const parts = line.split('\t');
      if (parts.length < 5) {
        console.warn(`  ⚠️  Skipping malformed line: ${line.substring(0, 50)}...`);
        continue;
      }

      const segmentId = parts[0].trim();
      const q1 = parts[1]?.trim() || '';
      const q2 = parts[2]?.trim() || '';
      const q3 = parts[3]?.trim() || '';
      const q4 = parts[4]?.trim() || '';

      // Validate segment ID format
      if (!segmentId.match(/^S\d{3}$/)) {
        console.warn(`  ⚠️  Invalid segment ID: ${segmentId}`);
        fileSkipped++;
        skippedSegments.push(segmentId);
        continue;
      }

      // Check if segment exists in questions data
      if (!questionsData.questions[segmentId]) {
        console.warn(`  ⚠️  Segment ${segmentId} not found in Questions-EN.json`);
        fileSkipped++;
        skippedSegments.push(segmentId);
        continue;
      }

      // Check if school questions exist
      if (!questionsData.questions[segmentId].school) {
        console.warn(`  ⚠️  School questions not found for ${segmentId}`);
        fileSkipped++;
        skippedSegments.push(segmentId);
        continue;
      }

      // Update Set 1 only (Set 2 remains unchanged)
      const questions = [q1, q2, q3, q4].filter(q => q && q.trim() !== '');
      
      if (questions.length === 0) {
        console.warn(`  ⚠️  No valid questions found for ${segmentId}`);
        fileSkipped++;
        skippedSegments.push(segmentId);
        continue;
      }

      // Update Set 1
      questionsData.questions[segmentId].school.set1 = questions;
      fileUpdated++;
      updatedSegments.push(segmentId);
    }

    console.log(`  ✅ Updated ${fileUpdated} segments, skipped ${fileSkipped}`);
    totalUpdated += fileUpdated;
    totalSkipped += fileSkipped;
  }

  // Update metadata
  questionsData.metadata.lastUpdated = new Date().toISOString().split('T')[0];
  questionsData.metadata.version = '1.1.0'; // Increment version

  // Save updated file
  console.log(`\n💾 Saving updated Questions-EN.json...`);
  fs.writeFileSync(questionsFile, JSON.stringify(questionsData, null, 2), 'utf8');

  // Get file size
  const stats = fs.statSync(questionsFile);
  const fileSizeKB = (stats.size / 1024).toFixed(2);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`  ✅ Saved successfully (${fileSizeKB} KB / ${fileSizeMB} MB)`);

  // Summary
  console.log('\n✅ Update complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Total segments updated: ${totalUpdated}`);
  console.log(`   - Total segments skipped: ${totalSkipped}`);
  console.log(`   - Updated segments: ${updatedSegments.slice(0, 10).join(', ')}${updatedSegments.length > 10 ? ` ... and ${updatedSegments.length - 10} more` : ''}`);
  
  if (skippedSegments.length > 0) {
    console.log(`   - Skipped segments: ${skippedSegments.slice(0, 10).join(', ')}${skippedSegments.length > 10 ? ` ... and ${skippedSegments.length - 10} more` : ''}`);
  }

  console.log(`\n📝 Next steps:`);
  console.log(`   1. Review the updated Questions-EN.json`);
  console.log(`   2. Run migration to update database (or it will auto-migrate on next app launch)`);
  console.log(`   3. Test questions in the app`);

} catch (error) {
  console.error('\n❌ Error updating questions:', error);
  process.exit(1);
}

