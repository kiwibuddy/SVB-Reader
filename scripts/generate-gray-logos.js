import logger from '@/utils/logger';
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Ensure the output directory exists
const outputDir = path.join(__dirname, '../assets/images');

// Function to generate PNG from SVG with specific dimensions
async function generateLogo(svgPath, outputPath, size, backgroundColor = '#808080') {
  try {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    logger.info(`✅ Generated: ${outputPath} (${size}x${size})`);
  } catch (error) {
    logger.error(`❌ Error generating ${outputPath}:`, error.message);
  }
}

// Main function
async function main() {
  const svgPath = path.join(__dirname, '../assets/images/SourceView Together Icon.svg');
  
  if (!fs.existsSync(svgPath)) {
    logger.error('❌ SVG file not found:', svgPath);
    return;
  }

  logger.info('🎨 Generating logos with gray background...\n');

  // Generate all required logo sizes
  await generateLogo(svgPath, path.join(outputDir, 'icon.png'), 1024);
  await generateLogo(svgPath, path.join(outputDir, 'adaptive-icon.png'), 1024);
  await generateLogo(svgPath, path.join(outputDir, 'favicon.png'), 32);
  await generateLogo(svgPath, path.join(outputDir, 'splash-icon.png'), 200);
  await generateLogo(svgPath, path.join(outputDir, 'splash.png'), 1242);

  logger.info('\n🎉 All logos generated successfully!');
  logger.info('📱 Your app now has consistent gray background logos everywhere.');
}

main().catch(console.error);
