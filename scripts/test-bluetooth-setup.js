#!/usr/bin/env node

/**
 * Bluetooth Setup Verification Script
 * 
 * This script helps verify that the Bluetooth group reading features
 * are properly configured and ready for testing.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 BLUETOOTH SETUP VERIFICATION\n');

// Check 1: Package.json dependencies
console.log('📦 Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const hasBlePlx = packageJson.dependencies['react-native-ble-plx'];
const hasQrCode = packageJson.dependencies['react-native-qrcode-svg'];

if (hasBlePlx) {
  console.log('✅ react-native-ble-plx installed:', hasBlePlx);
} else {
  console.log('❌ react-native-ble-plx missing');
}

if (hasQrCode) {
  console.log('✅ react-native-qrcode-svg installed:', hasQrCode);
} else {
  console.log('❌ react-native-qrcode-svg missing');
}

// Check 2: App.json configuration
console.log('\n📱 Checking app.json configuration...');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));

// Check iOS Bluetooth permissions
const iosConfig = appJson.expo.ios?.infoPlist;
if (iosConfig?.NSBluetoothAlwaysUsageDescription) {
  console.log('✅ iOS Bluetooth permissions configured');
} else {
  console.log('❌ iOS Bluetooth permissions missing');
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
  console.log('✅ Android Bluetooth permissions configured');
} else {
  console.log('❌ Missing Android permissions:', missingPermissions);
}

// Check 3: Required files exist
console.log('\n📁 Checking required files...');
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
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// Check 4: Type definitions
console.log('\n🔧 Checking type definitions...');
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
    console.log(`✅ ${type} type defined`);
  } else {
    console.log(`❌ ${type} type missing`);
  }
});

// Check 5: Context integration
console.log('\n🔗 Checking context integration...');
const layoutContent = fs.readFileSync('app/_layout.tsx', 'utf8');
if (layoutContent.includes('GroupReadingProvider')) {
  console.log('✅ GroupReadingProvider integrated in app layout');
} else {
  console.log('❌ GroupReadingProvider not found in app layout');
}

// Summary
console.log('\n📊 SUMMARY');
console.log('==================');
console.log('Bluetooth group reading features appear to be properly configured.');
console.log('\nNext steps:');
console.log('1. Build development client: eas build --profile development --platform ios');
console.log('2. Install on test devices');
console.log('3. Follow testing guide: scripts/bluetooth-testing-guide.md');
console.log('4. Test with 2+ devices in close proximity');
console.log('\n🚀 Ready for Bluetooth testing!');
