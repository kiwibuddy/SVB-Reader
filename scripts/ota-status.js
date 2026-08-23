#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'ota-targets.json'), 'utf8')
);

const result = spawnSync(
  'npx',
  [
    'eas-cli',
    'update:list',
    '--branch',
    TARGETS.branch || 'production',
    '--json',
    '--non-interactive',
    '--limit',
    '20',
  ],
  { cwd: ROOT, encoding: 'utf8' }
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status || 1);
}

const jsonStart = result.stdout.indexOf('{');
const data = JSON.parse(result.stdout.slice(jsonStart));
const iosRt = TARGETS.ios.runtimeVersion;
const androidRt = TARGETS.android.runtimeVersion;
const wrongIos = new Set(TARGETS.ios.neverPublishRuntimes || []);

console.log('production OTA status (TestFlight 2.0.0 (25) = ' + iosRt.slice(0, 8) + '…)\n');

for (const u of data.currentPage || []) {
  const rt = u.runtimeVersion || '';
  let tag = 'other runtime';
  if (rt === iosRt) tag = 'YES — TestFlight 25';
  else if (wrongIos.has(rt)) tag = 'NO — local fingerprint, phone ignores';
  else if (rt === androidRt) tag = 'YES — Play 23';
  else if (String(u.platforms).includes('android')) tag = 'NO — Android fingerprint mismatch';
  console.log(u.message);
  console.log('  ' + u.platforms + '  ' + tag);
  console.log('  ' + rt);
  if (u.group) {
    console.log('  https://expo.dev/accounts/kiwibuddy/projects/SVB-Youth/updates/' + u.group);
  }
  console.log('');
}
