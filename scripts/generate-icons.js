import logger from '@/utils/logger';
#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const svgPath = path.join(__dirname, '..', 'assets', 'images', 'SourceView Together Icon.svg');
  const outputDir = path.join(__dirname, '..', 'assets', 'images');

  logger.info('🎨 Generating app icons from SVG...');
  logger.info('📁 SVG Path:', svgPath);
  logger.info('📁 Output Dir:', outputDir);

  // Check if SVG exists
  if (!fs.existsSync(svgPath)) {
    logger.error('❌ SVG file not found:', svgPath);
    process.exit(1);
  }

  try {
    // Read SVG content
    const svgBuffer = fs.readFileSync(svgPath);

    // Generate icons
    const icons = [
      { name: 'icon.png', size: 1024, description: 'Main app icon' },
      { name: 'splash-icon.png', size: 512, description: 'Splash screen icon' },
      { name: 'adaptive-icon.png', size: 1024, description: 'Android adaptive icon' },
      { name: 'favicon.png', size: 32, description: 'Web favicon' }
    ];

    for (const icon of icons) {
      logger.info(`🖼️  Generating ${icon.description} (${icon.size}x${icon.size})...`);
      
      const outputPath = path.join(outputDir, icon.name);
      
      await sharp(svgBuffer)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      logger.info(`✅ Generated: ${icon.name}`);
    }

    logger.info('🎉 All icons generated successfully!');
    
  } catch (error) {
    logger.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
