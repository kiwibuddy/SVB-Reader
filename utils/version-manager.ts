/**
 * Version Management Utility for Apple App Store Submission
 * Ensures consistent versioning across all platforms and OTA compatibility
 */

export interface AppVersion {
  // User-facing version (CFBundleShortVersionString)
  version: string;
  // Internal build number (CFBundleVersion) 
  buildNumber: string;
  // Runtime version for OTA updates
  runtimeVersion: string;
  // Release date
  releaseDate: string;
  // Build type
  buildType: 'development' | 'preview' | 'production';
}

export const APP_VERSION_INFO: AppVersion = {
  version: '1.2.0',
  buildNumber: '17', 
  runtimeVersion: '1.2.0',
  releaseDate: new Date().toISOString(),
  buildType: 'production'
};

/**
 * Get current app version for display in UI
 */
export const getDisplayVersion = (): string => {
  return `${APP_VERSION_INFO.version} (${APP_VERSION_INFO.buildNumber})`;
};

/**
 * Get version for crash reporting and analytics
 */
export const getAnalyticsVersion = (): string => {
  return APP_VERSION_INFO.version;
};

/**
 * Get build number for internal tracking
 */
export const getBuildNumber = (): string => {
  return APP_VERSION_INFO.buildNumber;
};

/**
 * Check if this is a production build
 */
export const isProductionBuild = (): boolean => {
  return APP_VERSION_INFO.buildType === 'production';
};

/**
 * Version increment helpers for future builds
 */
export const VersionHelper = {
  /**
   * Increment patch version (1.0.0 -> 1.0.1)
   */
  incrementPatch: (version: string): string => {
    const [major, minor, patch] = version.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  },

  /**
   * Increment minor version (1.0.0 -> 1.1.0)
   */
  incrementMinor: (version: string): string => {
    const [major, minor] = version.split('.').map(Number);
    return `${major}.${minor + 1}.0`;
  },

  /**
   * Increment major version (1.0.0 -> 2.0.0)
   */
  incrementMajor: (version: string): string => {
    const major = parseInt(version.split('.')[0]);
    return `${major + 1}.0.0`;
  },

  /**
   * Increment build number
   */
  incrementBuild: (buildNumber: string): string => {
    return (parseInt(buildNumber) + 1).toString();
  }
};

/**
 * Apple App Store versioning guidelines:
 * 
 * FOR FIRST SUBMISSION:
 * - CFBundleShortVersionString: "1.0.0" (user-facing)
 * - CFBundleVersion: "1" (internal build)
 * 
 * FOR SUBSEQUENT BUILDS:
 * - Increment CFBundleVersion for each build: 1, 2, 3, etc.
 * - Only increment CFBundleShortVersionString for user-facing updates
 * 
 * FOR OTA UPDATES:
 * - Keep runtimeVersion consistent for compatible JS updates
 * - Only change runtimeVersion when native code changes
 */

export default APP_VERSION_INFO;
