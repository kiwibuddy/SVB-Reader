const { withEntitlementsPlist, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

function stripApsEnvironmentFromFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const stripped = original.replace(
    /\s*<key>aps-environment<\/key>\s*<string>[^<]*<\/string>/g,
    ''
  );
  if (stripped !== original) {
    fs.writeFileSync(filePath, stripped);
  }
}

function walkEntitlements(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walkEntitlements(full);
    else if (name.endsWith('.entitlements')) stripApsEnvironmentFromFile(full);
  }
}

/**
 * Daily reminders are local-only. Remove aps-environment so Ad Hoc profiles
 * without the Push Notifications capability can archive.
 */
function withLocalNotificationsOnly(config) {
  config = withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    return config;
  });
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      walkEntitlements(config.modRequest.platformProjectRoot);
      return config;
    },
  ]);
}

module.exports = withLocalNotificationsOnly;
