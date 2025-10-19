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

module.exports = config;