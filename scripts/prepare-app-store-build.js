import logger from '@/utils/logger';
#!/usr/bin/env node

/**
 * Apple App Store Build Preparation Script
 * Ensures all requirements are met before building for submission
 */

const fs = require('fs');
const path = require('path');

logger.info('🚀 Preparing SourceView Together for Apple App Store submission...\n');

// Check if all required files exist
const requiredFiles = [
  'app.json',
  'package.json', 
  'eas.json',
  'utils/version-manager.ts',
  'utils/logger.ts'
];

logger.info('📋 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    logger.info(`✅ ${file}`);
  } else {
    logger.info(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  logger.info('\n❌ Some required files are missing. Please ensure all files exist before building.');
  process.exit(1);
}

// Read and validate app.json
logger.info('\n📱 Validating app.json configuration...');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));

const checks = [
  {
    name: 'App name',
    value: appJson.expo.name,
    required: true
  },
  {
    name: 'Bundle identifier', 
    value: appJson.expo.ios?.bundleIdentifier,
    required: true,
    validation: (val) => val && val.includes('com.sourceview.together')
  },
  {
    name: 'Version',
    value: appJson.expo.version,
    required: true,
    validation: (val) => /^\d+\.\d+\.\d+$/.test(val)
  },
  {
    name: 'Build number',
    value: appJson.expo.ios?.buildNumber,
    required: true,
    validation: (val) => /^\d+$/.test(val)
  },
  {
    name: 'Privacy policy',
    value: appJson.expo.ios?.privacyPolicy,
    required: true,
    validation: (val) => val && val.includes('sourceviewbible@gmail.com')
  },
  {
    name: 'Support URL',
    value: appJson.expo.ios?.supportURL,
    required: true
  },
  {
    name: 'App description',
    value: appJson.expo.description,
    required: true,
    validation: (val) => val && val.length > 50
  },
  {
    name: 'Keywords',
    value: appJson.expo.keywords,
    required: true,
    validation: (val) => Array.isArray(val) && val.length > 0
  },
  {
    name: 'OTA updates configuration',
    value: appJson.expo.updates?.enabled,
    required: false,
    validation: (val) => val === true || val === false || val === undefined
  },
  {
    name: 'Runtime version policy',
    value: appJson.expo.runtimeVersion?.policy || appJson.expo.runtimeVersion,
    required: true,
    validation: (val) => val === 'appVersion' || (typeof val === 'string' && val.length > 0)
  }
];

let allChecksPassed = true;

checks.forEach(check => {
  const isValid = check.validation ? check.validation(check.value) : 
                  (check.required ? !!check.value : true);
  
  if (isValid) {
    logger.info(`✅ ${check.name}: ${check.value !== undefined ? check.value : 'Not configured'}`);
  } else {
    logger.info(`❌ ${check.name}: ${check.value || 'MISSING'}`);
    if (check.required) {
      allChecksPassed = false;
    }
  }
});

if (!allChecksPassed) {
  logger.info('\n❌ App configuration validation failed. Please fix the issues above.');
  process.exit(1);
}

// Check for console.log statements (should be replaced with logger)
logger.info('\n🔍 Checking for console statements in production code...');
const { execSync } = require('child_process');

try {
  const consoleCheck = execSync('find app components -name "*.tsx" -o -name "*.ts" | xargs grep -l "console\\." | grep -v logger.ts || true', { encoding: 'utf8' });
  
  if (consoleCheck.trim()) {
    logger.info('⚠️  Found console statements in:');
    logger.info(consoleCheck);
    logger.info('   These should be replaced with logger for production.');
  } else {
    logger.info('✅ No console statements found in production code');
  }
} catch (error) {
  logger.info('⚠️  Could not check for console statements');
}

// Final success message
logger.info('\n🎉 App Store build preparation complete!');
logger.info('\n📋 Next steps:');
logger.info('1. Run: npm run build:ios');
logger.info('2. Submit to TestFlight: npm run submit:ios');
logger.info('3. After TestFlight approval, submit to App Store review');

logger.info('\n🔄 For future OTA updates:');
logger.info('- JavaScript/asset changes: npm run update:production');
logger.info('- Native code changes: Increment buildNumber and rebuild');

logger.info('\n✅ Ready for Apple App Store submission!');
