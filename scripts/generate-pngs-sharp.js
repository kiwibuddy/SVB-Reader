#!/usr/bin/env node

/**
 * PNG Asset Generator using Sharp
 * Converts SVG to PNG with proper dimensions and rounded corners
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 SourceView Together PNG Asset Generator (Sharp)');
console.log('==================================================');

// Check if Sharp is available
let sharp;
try {
  sharp = require('sharp');
  console.log('✅ Sharp library found');
} catch (error) {
  console.log('❌ Sharp library not found. Installing...');
  console.log('📦 Run: npm install sharp');
  console.log('Then run this script again.');
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
    console.error('❌ SVG file not found:', svgPath);
    process.exit(1);
  }
  
  console.log('✅ Found SVG file:', svgPath);
  
  try {
    for (const asset of assets) {
      console.log(`\n🔄 Generating ${asset.name} (${asset.size}x${asset.size}px)...`);
      
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
      
      console.log(`✅ Generated: ${asset.name}`);
      console.log(`   📁 Path: ${outputPath}`);
      console.log(`   📝 ${asset.description}`);
    }
    
    console.log('\n🎉 All PNG assets generated successfully!');
    console.log('\n📋 Generated files:');
    assets.forEach(asset => {
      console.log(`   - ${asset.name} (${asset.size}x${asset.size}px)`);
    });
    
    console.log('\n✅ Files are ready for app submission!');
    console.log('🎯 All files include the grey background as required.');
    
  } catch (error) {
    console.error('❌ Error generating PNGs:', error.message);
    process.exit(1);
  }
}

// Run the generator
generatePNGs();
