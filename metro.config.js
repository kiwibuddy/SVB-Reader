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
  /node_modules\/sqlite3\/.*/,
  // Marketing/ holds browser-only ad source (JSX + HTML). Nothing in the app
  // imports it; blocking it keeps it out of the module graph and the watcher.
  /Marketing\/.*/,
];

// Ensure JSON files are properly resolved
config.resolver.assetExts = [...config.resolver.assetExts, 'json'];

// Bible text as a file asset instead of inside the JS bundle (W11). Off by
// default; turn on by bundling with EXPO_PUBLIC_BIBLE_AS_ASSET=1 (store build
// and/or `eas update`). Swaps services/englishBibleSource.ts for its .asset.ts
// twin and serves the Bible JSON as a file asset. Needs testing
// on real phones before use: see MVP3/02-POST-ADVENT-BUILD-PLAN.md §13.
if (process.env.EXPO_PUBLIC_BIBLE_AS_ASSET === '1') {
  const fs = require('fs');
  // Expo inlines every .json file into the bundle, even one resolved as an
  // asset, so the asset gets its own extension: a git-ignored copy made here,
  // before Metro scans the project.
  const source = path.resolve(__dirname, 'assets/data/newBibleNLT1.json');
  const bibleAsset = path.resolve(__dirname, 'assets/generated/newBibleNLT1.bible');
  fs.mkdirSync(path.dirname(bibleAsset), { recursive: true });
  fs.copyFileSync(source, bibleAsset);
  config.resolver.assetExts = [...config.resolver.assetExts, 'bible'];

  const upstream = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === 'svb-english-bible-asset') {
      return { type: 'assetFiles', filePaths: [bibleAsset] };
    }
    const name = /(^|\/)englishBibleSource$/.test(moduleName) ? `${moduleName}.asset` : moduleName;
    return (upstream || context.resolveRequest)(context, name, platform);
  };
}

module.exports = config;
