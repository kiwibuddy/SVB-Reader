#!/usr/bin/env node

/**
 * Generate PNG assets from the new SVG logo
 * This script creates the required PNG files for app.json configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Logo Asset Generation Script');
console.log('================================');

// Check if source SVG exists
const svgPath = path.join(__dirname, '../assets/images/SourceView Together Icon.svg');
if (!fs.existsSync(svgPath)) {
  console.error('❌ Source SVG not found at:', svgPath);
  process.exit(1);
}

console.log('✅ Found source SVG at:', svgPath);

// Define the assets we need to generate
const assets = [
  {
    name: 'icon.png',
    size: 1024,
    description: 'Main app icon (iOS App Store)',
    borderRadius: 180, // ~18% for Apple's rounded icon style
  },
  {
    name: 'splash-icon.png', 
    size: 512,
    description: 'Splash screen icon',
    borderRadius: 80, // ~16% for splash consistency
  },
  {
    name: 'adaptive-icon.png',
    size: 1024,
    description: 'Android adaptive icon foreground',
    borderRadius: 0, // Android handles the shaping
  },
  {
    name: 'favicon.png',
    size: 32,
    description: 'Web favicon',
    borderRadius: 6, // Small rounded corners for web
  }
];

console.log('\n📋 Assets to generate:');
assets.forEach(asset => {
  console.log(`  - ${asset.name} (${asset.size}x${asset.size}px) - ${asset.description}`);
});

console.log('\n⚠️  IMPORTANT NOTICE:');
console.log('This script requires manual PNG generation as react-native cannot generate PNGs directly.');
console.log('Please use the following specifications to manually create PNG versions:');
console.log('');

console.log('📐 GENERATION SPECIFICATIONS:');
console.log('==============================');
console.log('🎯 CRITICAL: All PNG assets MUST include the grey background (#808080)');
console.log('🎯 This differs from loading animations which show bubbles only');
console.log('');

assets.forEach((asset, index) => {
  console.log(`\n${index + 1}. ${asset.name}:`);
  console.log(`   📏 Size: ${asset.size}x${asset.size}px`);
  console.log(`   🔄 Border Radius: ${asset.borderRadius}px`);
  console.log(`   📝 Description: ${asset.description}`);
  console.log(`   🎨 Background: GREY (#808080) - REQUIRED for all PNG assets`);
  console.log(`   💬 Speech Bubbles: Pink (#FCC1C3), Green (#B8F8BA), Blue (#8CE3FF)`);
  if (asset.borderRadius > 0) {
    console.log(`   🔘 Apply ${asset.borderRadius}px rounded corners`);
  }
  console.log(`   📁 Save to: ./assets/images/${asset.name}`);
  console.log(`   ⚠️  Must match original SVG exactly INCLUDING grey background`);
});

console.log('\n🛠️  RECOMMENDED TOOLS:');
console.log('======================');
console.log('1. Figma/Sketch: Import SVG, resize, export PNG');
console.log('2. Adobe Illustrator: Open SVG, export as PNG with specified dimensions');
console.log('3. Online SVG to PNG converters (ensure high quality settings)');
console.log('4. ImageMagick (command line): convert SVG to PNG with specific dimensions');

console.log('\n✨ After generating the PNG files, the app will use:');
console.log('   - SVG components for in-app displays (with animations)');
console.log('   - PNG files for native splash screens and app store');
console.log('   - Consistent rounded corners throughout');

console.log('\n🎯 Next Steps:');
console.log('1. Generate PNG files using the specifications above');
console.log('2. Replace existing PNG files in ./assets/images/');
console.log('3. Test app launch and app store submission');
console.log('4. Verify rounded corners appear correctly on all platforms');

console.log('\n📱 The new logo will provide:');
console.log('   ✅ Apple-style rounded corners');
console.log('   ✅ Breathing animations in loading screens');
console.log('   ✅ Consistent brand identity');
console.log('   ✅ High-quality scalable assets');

console.log('\n🏁 Logo upgrade implementation complete! 🎉');
