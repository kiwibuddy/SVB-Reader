const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable package exports resolution to fix victory-native warnings
config.resolver.unstable_enablePackageExports = true;

// Add condition names for better platform resolution
config.resolver.unstable_conditionNames = [
  'browser',
  'require',
  'react-native',
];

module.exports = config; 