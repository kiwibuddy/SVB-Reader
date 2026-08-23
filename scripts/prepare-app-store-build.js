#!/usr/bin/env node

/**
 * Apple App Store Build Preparation Script
 * Ensures all requirements are met before building for submission
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const log = (...args) => console.log(...args);

log('Preparing SourceView Together for Apple App Store submission...\n');

const requiredFiles = [
  'app.json',
  'package.json',
  'eas.json',
  'utils/version-manager.ts',
  'utils/logger.ts',
];

log('Checking required files...');
let allFilesExist = true;

requiredFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    log(`OK ${file}`);
  } else {
    log(`MISSING ${file}`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  log('\nSome required files are missing. Ensure all files exist before building.');
  process.exit(1);
}

log('\nValidating app.json configuration...');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));

const checks = [
  {
    name: 'App name',
    value: appJson.expo.name,
    required: true,
  },
  {
    name: 'Bundle identifier',
    value: appJson.expo.ios?.bundleIdentifier,
    required: true,
    validation: (val) => val && val.includes('com.sourceview.together'),
  },
  {
    name: 'Version',
    value: appJson.expo.version,
    required: true,
    validation: (val) => /^\d+\.\d+\.\d+$/.test(val),
  },
  {
    name: 'Build number',
    value: appJson.expo.ios?.buildNumber,
    required: true,
    validation: (val) => /^\d+$/.test(val),
  },
  {
    name: 'Android versionCode',
    value: appJson.expo.android?.versionCode,
    required: true,
    validation: (val) => Number.isInteger(val) && val > 0,
  },
  {
    name: 'Privacy policy file',
    value: fs.existsSync('PRIVACY_POLICY.md') ? 'PRIVACY_POLICY.md' : '',
    required: true,
  },
  {
    name: 'App description',
    value: appJson.expo.description,
    required: true,
    validation: (val) => val && val.length > 50,
  },
  {
    name: 'Keywords',
    value: appJson.expo.keywords || appJson.expo.extra?.storeKeywords,
    required: true,
    validation: (val) => Array.isArray(val) && val.length > 0,
  },
  {
    name: 'OTA updates configuration',
    value: appJson.expo.updates?.enabled,
    required: false,
    validation: (val) => val === true || val === false || val === undefined,
  },
  {
    name: 'Runtime version policy',
    value: appJson.expo.runtimeVersion?.policy || appJson.expo.runtimeVersion,
    required: true,
    // fingerprint is the production policy; appVersion remains accepted for older profiles
    validation: (val) =>
      val === 'fingerprint' ||
      val === 'appVersion' ||
      (typeof val === 'string' && val.length > 0),
  },
];

let allChecksPassed = true;

checks.forEach((check) => {
  const isValid = check.validation
    ? check.validation(check.value)
    : check.required
      ? !!check.value
      : true;

  if (isValid) {
    log(`OK ${check.name}: ${check.value !== undefined ? check.value : 'Not configured'}`);
  } else {
    log(`FAIL ${check.name}: ${check.value || 'MISSING'}`);
    if (check.required) {
      allChecksPassed = false;
    }
  }
});

if (!allChecksPassed) {
  log('\nApp configuration validation failed. Fix the issues above.');
  process.exit(1);
}

log('\nChecking for console statements in production code...');
try {
  const consoleCheck = execSync(
    'find app components -name "*.tsx" -o -name "*.ts" | xargs grep -l "console\\." | grep -v logger.ts || true',
    { encoding: 'utf8' }
  );

  if (consoleCheck.trim()) {
    log('Warning: Found console statements in:');
    log(consoleCheck);
    log('These should be replaced with logger for production.');
  } else {
    log('OK No console statements found in production code');
  }
} catch (error) {
  log('Warning: Could not check for console statements');
}

log('\nApp Store build preparation complete!');
log('\nNext steps:');
log('1. Run: npm run build:ios');
log('2. Submit to TestFlight: npm run submit:ios');
log('3. After TestFlight approval, submit to App Store review');
log('4. Android: npm run build:android && npm run submit:android');

log('\nFor future OTA updates:');
log('- JavaScript/asset changes: npm run update:production');
log('- Native code changes: Increment buildNumber/versionCode and rebuild');

log('\nReady for Apple App Store submission!');
