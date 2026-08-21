// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*'],
  overrides: [
    {
      // Build and test scripts run under node, not in the app bundle, so they
      // legitimately use __dirname, require, process and Buffer.
      files: ['scripts/**/*.js'],
      env: { node: true },
    },
  ],
};
