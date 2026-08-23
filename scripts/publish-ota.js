#!/usr/bin/env node

/**
 * Publish an EAS Update to a store binary's runtime, not the local fingerprint.
 *
 * TestFlight 2.0.0 (25) is baked with runtime f9d9eb63…. A plain
 * `eas update` from this repo fingerprints to 7fd8cc0b…, which that
 * binary ignores. This script pins app.json.runtimeVersion for the
 * publish only, then restores fingerprint policy.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const APP_JSON = path.join(ROOT, 'app.json');
const TARGETS = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'ota-targets.json'), 'utf8')
);

function parseArgs(argv) {
  const out = {
    platform: 'ios',
    message: '',
    branch: TARGETS.branch || 'production',
    environment: TARGETS.environment || 'production',
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--platform' || a === '-p') out.platform = argv[++i];
    else if (a === '--message' || a === '-m') out.message = argv[++i];
    else if (a === '--branch') out.branch = argv[++i];
    else if (a === '--environment') out.environment = argv[++i];
    else if (!a.startsWith('-') && !out.message) out.message = a;
  }
  if (!['ios', 'android'].includes(out.platform)) {
    throw new Error(`platform must be ios or android, got ${out.platform}`);
  }
  return out;
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: opts.stdio || 'pipe',
    env: process.env,
  });
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || '').trim();
    throw new Error(`${cmd} ${args.join(' ')} failed (${result.status}): ${err.slice(-2000)}`);
  }
  return result;
}

function assertCleanAppJson() {
  const st = run('git', ['status', '--porcelain', '--', 'app.json']);
  if (st.stdout.trim()) {
    throw new Error(
      'app.json has uncommitted changes. Commit or stash them before publishing an OTA so we can restore fingerprint policy cleanly.'
    );
  }
}

function pinRuntime(runtimeVersion) {
  const original = fs.readFileSync(APP_JSON, 'utf8');
  const data = JSON.parse(original);
  data.expo.runtimeVersion = runtimeVersion;
  fs.writeFileSync(APP_JSON, `${JSON.stringify(data, null, 2)}\n`);
  return () => fs.writeFileSync(APP_JSON, original);
}

function latestRuntime(platform, branch) {
  const result = run('npx', [
    'eas-cli',
    'update:list',
    '--branch',
    branch,
    '--json',
    '--non-interactive',
    '--limit',
    '10',
  ]);
  const jsonStart = result.stdout.indexOf('{');
  const data = JSON.parse(result.stdout.slice(jsonStart));
  const page = data.currentPage || [];
  return page.find((u) => String(u.platforms).includes(platform)) || page[0];
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const target = TARGETS[opts.platform];
  if (!target || !target.runtimeVersion) {
    throw new Error(`No runtime pin in scripts/ota-targets.json for ${opts.platform}`);
  }
  if (!opts.message) {
    console.error(`
Publish an OTA that ${opts.platform} ${target.label} will actually install.

  npm run update:production -- -m "what changed"

Do not run eas update / npx eas-cli update directly while app.json uses
fingerprint policy — this machine fingerprints to 7fd8cc0b…, which
TestFlight 2.0.0 (25) ignores.

Target runtime: ${target.runtimeVersion}
`);
    process.exit(1);
  }

  console.log(`OTA target: ${target.label}`);
  console.log(`Runtime:    ${target.runtimeVersion}`);
  console.log(`Platform:   ${opts.platform}`);
  console.log(`Message:    ${opts.message}`);

  assertCleanAppJson();
  const restore = pinRuntime(target.runtimeVersion);
  try {
    run(
      'npx',
      [
        'eas-cli',
        'update',
        '--branch',
        opts.branch,
        '--platform',
        opts.platform,
        '--environment',
        opts.environment,
        '--non-interactive',
        '--message',
        opts.message,
      ],
      { stdio: 'inherit' }
    );
  } finally {
    restore();
    console.log('Restored app.json runtimeVersion policy to fingerprint.');
  }

  const published = latestRuntime(opts.platform, opts.branch);
  const publishedRuntime = published && published.runtimeVersion ? published.runtimeVersion : '';
  const banned = new Set(target.neverPublishRuntimes || []);
  console.log(`\nLatest ${opts.platform} update: ${published && published.message ? published.message : '(none)'}`);
  console.log(`Runtime: ${publishedRuntime}`);
  if (published && published.group) {
    console.log(
      `Dashboard: https://expo.dev/accounts/kiwibuddy/projects/SVB-Youth/updates/${published.group}`
    );
  }

  if (banned.has(publishedRuntime)) {
    throw new Error(
      `Published to ${publishedRuntime}, which no store binary uses. The pin did not stick.`
    );
  }
  if (publishedRuntime !== target.runtimeVersion) {
    throw new Error(
      `Published runtime ${publishedRuntime} does not match ${target.runtimeVersion}. TestFlight 2.0.0 (25) will ignore this update.`
    );
  }

  console.log(`
OK — this update matches ${target.label}.

On device: force-quit → open once (download) → force-quit → open (apply).
Settings → Info shows "binary" until the second cold start, then an OTA id.
`);
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
