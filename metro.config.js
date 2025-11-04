const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add path resolution for the @ alias
config.resolver.alias = {
  '@': path.resolve(__dirname),
};

// Ensure TypeScript files are handled correctly
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

// Add platform extensions for better resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Block Node.js-only packages from being bundled
config.resolver.blockList = [
  // Block sqlite3 and other Node.js-only packages
  /node_modules\/sqlite3\/.*/,
];

// Ensure JSON files are properly resolved
config.resolver.assetExts = [...config.resolver.assetExts, 'json'];

module.exports = config;