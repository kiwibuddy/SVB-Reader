#!/usr/bin/env node

/**
 * Build Fix Verification Script
 * 
 * This script verifies that the duplicate SERVICE_UUID declaration fix worked.
 */

const fs = require('fs');
const path = require('path');

function checkForDuplicateDeclarations() {
  console.log('🔍 Checking for duplicate declarations...');
  
  const bluetoothManagerPath = path.join(__dirname, '../services/BluetoothSessionManager.ts');
  const realBluetoothManagerPath = path.join(__dirname, '../services/RealBluetoothManager.ts');
  
  // Check if files exist
  if (!fs.existsSync(bluetoothManagerPath)) {
    console.error('❌ BluetoothSessionManager.ts not found');
    return false;
  }
  
  if (!fs.existsSync(realBluetoothManagerPath)) {
    console.error('❌ RealBluetoothManager.ts not found');
    return false;
  }
  
  // Read files
  const bluetoothManagerContent = fs.readFileSync(bluetoothManagerPath, 'utf8');
  const realBluetoothManagerContent = fs.readFileSync(realBluetoothManagerPath, 'utf8');
  
  // Check for duplicate SERVICE_UUID in BluetoothSessionManager.ts
  const serviceUuidMatches = bluetoothManagerContent.match(/const SERVICE_UUID/g);
  if (serviceUuidMatches && serviceUuidMatches.length > 1) {
    console.error('❌ Multiple SERVICE_UUID declarations found in BluetoothSessionManager.ts');
    return false;
  }
  
  // Check for undefined UUIDs
  const undefinedUuids = [
    'SESSION_INFO_CHARACTERISTIC',
    'JOIN_REQUEST_CHARACTERISTIC', 
    'SCROLL_SYNC_CHARACTERISTIC',
    'PARTICIPANT_UPDATE_CHARACTERISTIC'
  ];
  
  for (const uuid of undefinedUuids) {
    if (bluetoothManagerContent.includes(uuid)) {
      console.error(`❌ Undefined UUID found in BluetoothSessionManager.ts: ${uuid}`);
      return false;
    }
  }
  
  // Check that RealBluetoothManager.ts has the new UUIDs
  const newUuids = [
    '12345678-1234-1234-1234-123456789abc',
    '87654321-4321-4321-4321-cba987654321',
    '11111111-2222-3333-4444-555555555555',
    '22222222-3333-4444-5555-666666666666',
    '33333333-4444-5555-6666-777777777777'
  ];
  
  for (const uuid of newUuids) {
    if (!realBluetoothManagerContent.includes(uuid)) {
      console.error(`❌ New UUID not found in RealBluetoothManager.ts: ${uuid}`);
      return false;
    }
  }
  
  console.log('✅ No duplicate declarations found');
  console.log('✅ All new UUIDs properly defined in RealBluetoothManager.ts');
  console.log('✅ Build fix verification passed');
  
  return true;
}

function main() {
  console.log('🚀 Build Fix Verification\n');
  
  const success = checkForDuplicateDeclarations();
  
  if (success) {
    console.log('\n🎉 Build fix verification successful!');
    console.log('The app should now build without errors.');
  } else {
    console.log('\n⚠️ Build fix verification failed!');
    console.log('Please check the issues above.');
  }
  
  return success;
}

// Run if this script is executed directly
if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = { checkForDuplicateDeclarations, main };
