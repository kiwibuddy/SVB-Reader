const path = require('path');

module.exports = function(api) {
  api.cache(true);
  return {
    // babel-preset-expo on SDK 57 already registers react-native-worklets for Reanimated 4.
    presets: ['babel-preset-expo'],
    plugins: [
      // Removed module-resolver plugin - Metro handles all @/ imports
    ]
  };
};
