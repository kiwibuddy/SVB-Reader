const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const BACKUP_RULES = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <exclude domain="database" path="." />
    <exclude domain="file" path="SQLite/" />
    <exclude domain="file" path="SQLite" />
</full-backup-content>
`;

const DATA_EXTRACTION_RULES = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <exclude domain="database" path="." />
        <exclude domain="file" path="SQLite/" />
        <exclude domain="file" path="SQLite" />
    </cloud-backup>
    <device-transfer>
        <exclude domain="database" path="." />
        <exclude domain="file" path="SQLite/" />
        <exclude domain="file" path="SQLite" />
    </device-transfer>
</data-extraction-rules>
`;

function withAndroidBackupRules(config) {
  config = withAndroidManifest(config, (config) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    app.$['android:allowBackup'] = 'true';
    app.$['android:fullBackupContent'] = '@xml/backup_rules';
    app.$['android:dataExtractionRules'] = '@xml/data_extraction_rules';
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'backup_rules.xml'), BACKUP_RULES);
      fs.writeFileSync(path.join(xmlDir, 'data_extraction_rules.xml'), DATA_EXTRACTION_RULES);
      return config;
    },
  ]);

  return config;
}

module.exports = withAndroidBackupRules;
