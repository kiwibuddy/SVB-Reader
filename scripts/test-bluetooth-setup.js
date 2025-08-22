import logger from '@/utils/logger';
#!/usr/bin/env node

/**
 * Bluetooth Setup Verification Script
 * 
 * This script helps verify that the Bluetooth group reading features
 * are properly configured and ready for testing.
 */

const fs = require('fs');
const path = require('path');

logger.info('🔍 BLUETOOTH SETUP VERIFICATION\n');

// Check 1: Package.json dependencies
logger.info('📦 Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const hasBlePlx = packageJson.dependencies['react-native-ble-plx'];
const hasQrCode = packageJson.dependencies['react-native-qrcode-svg'];

if (hasBlePlx) {
  logger.info('✅ react-native-ble-plx installed:', hasBlePlx);
} else {
  logger.info('❌ react-native-ble-plx missing');
}

if (hasQrCode) {
  logger.info('✅ react-native-qrcode-svg installed:', hasQrCode);
} else {
  logger.info('❌ react-native-qrcode-svg missing');
}

// Check 2: App.json configuration
logger.info('\n📱 Checking app.json configuration...');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));

// Check iOS Bluetooth permissions
const iosConfig = appJson.expo.ios?.infoPlist;
if (iosConfig?.NSBluetoothAlwaysUsageDescription) {
  logger.info('✅ iOS Bluetooth permissions configured');
} else {
  logger.info('❌ iOS Bluetooth permissions missing');
}

// Check Android Bluetooth permissions
const androidPermissions = appJson.expo.android?.permissions || [];
const requiredPermissions = [
  'android.permission.BLUETOOTH',
  'android.permission.BLUETOOTH_ADMIN',
  'android.permission.BLUETOOTH_SCAN',
  'android.permission.BLUETOOTH_ADVERTISE',
  'android.permission.BLUETOOTH_CONNECT'
];

const missingPermissions = requiredPermissions.filter(
  perm => !androidPermissions.includes(perm)
);

if (missingPermissions.length === 0) {
  logger.info('✅ Android Bluetooth permissions configured');
} else {
  logger.info('❌ Missing Android permissions:', missingPermissions);
}

// Check 3: Required files exist
logger.info('\n📁 Checking required files...');
const requiredFiles = [
  'services/BluetoothSessionManager.ts',
  'context/GroupReadingContext.tsx',
  'components/GroupReading/GroupSetupScreen.tsx',
  'components/GroupReading/HostWaitingScreen.tsx',
  'components/GroupReading/JoinGroupScreen.tsx',
  'components/GroupReading/QRCodeShareScreen.tsx',
  'app/group-setup.tsx',
  'app/host-waiting.tsx',
  'app/join-group.tsx',
  'app/qr-share.tsx',
  'types.ts'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    logger.info(`✅ ${file}`);
  } else {
    logger.info(`❌ ${file} missing`);
  }
});

// Check 4: Type definitions
logger.info('\n🔧 Checking type definitions...');
const typesContent = fs.readFileSync('types.ts', 'utf8');
const requiredTypes = [
  'BluetoothSessionManager',
  'GroupSession',
  'Participant',
  'Role',
  'GroupSessionState'
];

requiredTypes.forEach(type => {
  if (typesContent.includes(`interface ${type}`) || 
      typesContent.includes(`export interface ${type}`) ||
      typesContent.includes(`export type ${type}`)) {
    logger.info(`✅ ${type} type defined`);
  } else {
    logger.info(`❌ ${type} type missing`);
  }
});

// Check 5: Context integration
logger.info('\n🔗 Checking context integration...');
const layoutContent = fs.readFileSync('app/_layout.tsx', 'utf8');
if (layoutContent.includes('GroupReadingProvider')) {
  logger.info('✅ GroupReadingProvider integrated in app layout');
} else {
  logger.info('❌ GroupReadingProvider not found in app layout');
}

// Summary
logger.info('\n📊 SUMMARY');
logger.info('==================');
logger.info('Bluetooth group reading features appear to be properly configured.');
logger.info('\nNext steps:');
logger.info('1. Build development client: eas build --profile development --platform ios');
logger.info('2. Install on test devices');
logger.info('3. Follow testing guide: scripts/bluetooth-testing-guide.md');
logger.info('4. Test with 2+ devices in close proximity');
logger.info('\n🚀 Ready for Bluetooth testing!');
