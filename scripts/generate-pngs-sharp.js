import logger from '@/utils/logger';
#!/usr/bin/env node

/**
 * PNG Asset Generator using Sharp
 * Converts SVG to PNG with proper dimensions and rounded corners
 */

const fs = require('fs');
const path = require('path');

logger.info('🚀 SourceView Together PNG Asset Generator (Sharp)');
logger.info('==================================================');

// Check if Sharp is available
let sharp;
try {
  sharp = require('sharp');
  logger.info('✅ Sharp library found');
} catch (error) {
  logger.info('❌ Sharp library not found. Installing...');
  logger.info('📦 Run: npm install sharp');
  logger.info('Then run this script again.');
  process.exit(1);
}

// Define assets to generate
const assets = [
  {
    name: 'icon.png',
    size: 1024,
    borderRadius: 180,
    description: 'Main app icon (iOS App Store)',
  },
  {
    name: 'splash-icon.png',
    size: 512,
    borderRadius: 80,
    description: 'Splash screen icon',
  },
  {
    name: 'adaptive-icon.png',
    size: 1024,
    borderRadius: 0,
    description: 'Android adaptive icon foreground',
  },
  {
    name: 'favicon.png',
    size: 32,
    borderRadius: 6,
    description: 'Web favicon',
  }
];

async function generatePNGs() {
  const svgPath = path.join(__dirname, '../assets/images/SourceView Together Icon.svg');
  
  // Check if SVG exists
  if (!fs.existsSync(svgPath)) {
    logger.error('❌ SVG file not found:', svgPath);
    process.exit(1);
  }
  
  logger.info('✅ Found SVG file:', svgPath);
  
  try {
    for (const asset of assets) {
      logger.info(`\n🔄 Generating ${asset.name} (${asset.size}x${asset.size}px)...`);
      
      let pipeline = sharp(svgPath)
        .resize(asset.size, asset.size)
        .png({ quality: 100 });
      
      // Apply rounded corners if specified
      if (asset.borderRadius > 0) {
        const radius = asset.borderRadius;
        const mask = Buffer.from(`
          <svg width="${asset.size}" height="${asset.size}">
            <rect x="0" y="0" width="${asset.size}" height="${asset.size}" 
                  rx="${radius}" ry="${radius}" fill="white"/>
          </svg>
        `);
        
        pipeline = pipeline.composite([{
          input: mask,
          blend: 'dest-in'
        }]);
      }
      
      const outputPath = path.join(__dirname, '../assets/images', asset.name);
      await pipeline.toFile(outputPath);
      
      logger.info(`✅ Generated: ${asset.name}`);
      logger.info(`   📁 Path: ${outputPath}`);
      logger.info(`   📝 ${asset.description}`);
    }
    
    logger.info('\n🎉 All PNG assets generated successfully!');
    logger.info('\n📋 Generated files:');
    assets.forEach(asset => {
      logger.info(`   - ${asset.name} (${asset.size}x${asset.size}px)`);
    });
    
    logger.info('\n✅ Files are ready for app submission!');
    logger.info('🎯 All files include the grey background as required.');
    
  } catch (error) {
    logger.error('❌ Error generating PNGs:', error.message);
    process.exit(1);
  }
}

// Run the generator
generatePNGs();
