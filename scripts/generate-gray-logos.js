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
    
    console.log(`✅ Generated: ${outputPath} (${size}x${size})`);
  } catch (error) {
    console.error(`❌ Error generating ${outputPath}:`, error.message);
  }
}

// Main function
async function main() {
  const svgPath = path.join(__dirname, '../assets/images/SourceView Together Icon.svg');
  
  if (!fs.existsSync(svgPath)) {
    console.error('❌ SVG file not found:', svgPath);
    return;
  }

  console.log('🎨 Generating logos with gray background...\n');

  // Generate all required logo sizes
  await generateLogo(svgPath, path.join(outputDir, 'icon.png'), 1024);
  await generateLogo(svgPath, path.join(outputDir, 'adaptive-icon.png'), 1024);
  await generateLogo(svgPath, path.join(outputDir, 'favicon.png'), 32);
  await generateLogo(svgPath, path.join(outputDir, 'splash-icon.png'), 200);
  await generateLogo(svgPath, path.join(outputDir, 'splash.png'), 1242);

  console.log('\n🎉 All logos generated successfully!');
  console.log('📱 Your app now has consistent gray background logos everywhere.');
}

main().catch(console.error);
