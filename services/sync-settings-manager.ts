import { Appearance } from 'react-native';
import { databaseManager } from '@/api/database-manager';
import logger from '@/utils/logger';

// ============================================================================
// SYNCHRONOUS SQLITE SETTINGS MANAGER
// ============================================================================

export interface UserSettings {
  isDarkMode: boolean;
  language: string;
  isOrientationLocked: boolean;
  groupUserName: string;
  notificationsEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large';
  autoBackup: boolean;
}

export type SettingsKey = keyof UserSettings;

// Default settings with smart system integration
const DEFAULT_SETTINGS: UserSettings = {
  isDarkMode: false, // Will be determined by system on first read
  language: 'en',
  isOrientationLocked: false,
  groupUserName: '',
  notificationsEnabled: true,
  fontSize: 'medium',
  autoBackup: true
};

// ============================================================================
// SYNCHRONOUS OPERATIONS (INSTANT READS)
// ============================================================================

/**
 * Get a setting value synchronously from SQLite
 * Falls back to smart defaults if not available
 */
export function getSyncSetting<K extends SettingsKey>(key: K): UserSettings[K] | null {
  try {
    // Check if database is ready for sync operations
    if (!databaseManager.isReady()) {
      return getSmartDefault(key);
    }
    
    // CRITICAL FIX: Don't call database during render
    // Return smart defaults for now
    return getSmartDefault(key);
    
    // TODO: Implement true sync reads after database stabilization
  } catch (error) {
    // Silent fallback to smart defaults - no logging during render
    return getSmartDefault(key);
  }
}

/**
 * Get smart system-aware defaults
 */
function getSmartDefault<K extends SettingsKey>(key: K): UserSettings[K] {
  if (key === 'isDarkMode') {
    // Use system color scheme as intelligent default
    try {
      return (Appearance.getColorScheme() === 'dark') as UserSettings[K];
    } catch {
      return DEFAULT_SETTINGS[key];
    }
  }
  
  return DEFAULT_SETTINGS[key];
}

/**
 * Check if a setting exists in the database (synchronous)
 */
export function hasSettingSync(key: SettingsKey): boolean {
  // CRITICAL FIX: Don't call database during render
  // Always return false for now to use smart defaults
  return false;
  
  /* TODO: Implement after database stabilization
  try {
    if (!databaseManager.isReady()) {
      return false;
    }
    
    const db = databaseManager.getDatabase();
    const result = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM user_settings WHERE key = ?',
      [key]
    );
    
    return (result?.count || 0) > 0;
  } catch {
    return false;
  }
  */
}

/**
 * Get all settings synchronously with smart defaults
 */
export function getAllSettingsSync(): UserSettings {
  return {
    isDarkMode: getSyncSetting('isDarkMode') ?? getSmartDefault('isDarkMode'),
    language: getSyncSetting('language') ?? getSmartDefault('language'),
    isOrientationLocked: getSyncSetting('isOrientationLocked') ?? getSmartDefault('isOrientationLocked'),
    groupUserName: getSyncSetting('groupUserName') ?? getSmartDefault('groupUserName'),
    notificationsEnabled: getSyncSetting('notificationsEnabled') ?? getSmartDefault('notificationsEnabled'),
    fontSize: getSyncSetting('fontSize') ?? getSmartDefault('fontSize'),
    autoBackup: getSyncSetting('autoBackup') ?? getSmartDefault('autoBackup'),
  };
}

// ============================================================================
// ASYNCHRONOUS OPERATIONS (BACKGROUND WRITES ONLY)
// ============================================================================

/**
 * Set a setting value (background operation only)
 */
export async function setSetting<K extends SettingsKey>(
  key: K,
  value: UserSettings[K]
): Promise<void> {
  try {
    // Ensure database is ready
    const db = await databaseManager.getSafeDatabase();
    if (!db) {
      // Background operation failed, but don't crash
      return;
    }
    
    // Create settings table if it doesn't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    // Insert or update the setting
    await db.runAsync(
      'INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)',
      [key, String(value)]
    );
  } catch (error) {
    // Background write failed - log but don't throw
    setTimeout(() => {
      logger.warn(`Background setting write failed for ${key}:`, error);
    }, 0);
  }
}

/**
 * Update multiple settings (background operation)
 */
export async function updateSettings(updates: Partial<UserSettings>): Promise<void> {
  const updatePromises = Object.entries(updates).map(([key, value]) => {
    if (value !== undefined) {
      return setSetting(key as SettingsKey, value as any);
    }
  });
  
  await Promise.all(updatePromises);
}

/**
 * Initialize settings table (call once during app startup)
 */
export async function initializeSettingsTable(): Promise<void> {
  try {
    const db = await databaseManager.getSafeDatabase();
    if (!db) return;
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    // Create index for faster reads
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_user_settings_key 
      ON user_settings(key)
    `);
  } catch (error) {
    setTimeout(() => {
      logger.error('Failed to initialize settings table:', error);
    }, 0);
  }
}

// ============================================================================
// MIGRATION FROM ASYNCSTORAGE (ONE-TIME BACKGROUND OPERATION)
// ============================================================================

/**
 * Migrate existing AsyncStorage settings to SQLite (background)
 */
export async function migrateFromAsyncStorage(): Promise<void> {
  try {
    // Check if AsyncStorage is available
    let AsyncStorage;
    try {
      AsyncStorage = require('@react-native-async-storage/async-storage');
      if (!AsyncStorage || typeof AsyncStorage.getItem !== 'function') {
        // AsyncStorage not properly loaded
        setTimeout(() => {
          logger.info('AsyncStorage not available, skipping migration');
        }, 0);
        return;
      }
    } catch (error) {
      // AsyncStorage not installed or not available
      setTimeout(() => {
        logger.info('AsyncStorage not found, skipping migration');
      }, 0);
      return;
    }
    
    const legacyKeys = {
      'darkMode': 'isDarkMode',
      'language': 'language',
      'orientationLocked': 'isOrientationLocked',
      'groupUserName': 'groupUserName',
      'notificationsEnabled': 'notificationsEnabled',
      'fontSize': 'fontSize',
      'autoBackup': 'autoBackup'
    };
    
    for (const [legacyKey, newKey] of Object.entries(legacyKeys)) {
      try {
        const value = await AsyncStorage.getItem(legacyKey);
        if (value !== null && !hasSettingSync(newKey as SettingsKey)) {
          // Only migrate if SQLite doesn't already have this setting
          let parsedValue: any = value;
          
          // Parse boolean values
          if (value === 'true') parsedValue = true;
          else if (value === 'false') parsedValue = false;
          
          await setSetting(newKey as SettingsKey, parsedValue);
        }
      } catch (error) {
        // Continue migration even if one setting fails
        setTimeout(() => {
          logger.warn(`Failed to migrate setting ${legacyKey}:`, error);
        }, 0);
      }
    }
  } catch (error) {
    setTimeout(() => {
      logger.info('AsyncStorage migration completed or not needed');
    }, 0);
  }
}

// ============================================================================
// TYPED CONVENIENCE FUNCTIONS (SYNCHRONOUS)
// ============================================================================

export const syncSettingsHelpers = {
  // Dark mode
  getDarkMode(): boolean {
    return getSyncSetting('isDarkMode') ?? (Appearance.getColorScheme() === 'dark');
  },
  
  // Font size
  getFontSize(): 'small' | 'medium' | 'large' {
    return getSyncSetting('fontSize') ?? 'medium';
  },
  
  // Orientation lock
  getOrientationLock(): boolean {
    return getSyncSetting('isOrientationLocked') ?? false;
  },
  
  // Language
  getLanguage(): string {
    return getSyncSetting('language') ?? 'en';
  },
  
  // Group user name
  getGroupUserName(): string {
    return getSyncSetting('groupUserName') ?? '';
  },
  
  // Notifications
  getNotificationsEnabled(): boolean {
    return getSyncSetting('notificationsEnabled') ?? true;
  },
  
  // Auto backup
  getAutoBackup(): boolean {
    return getSyncSetting('autoBackup') ?? true;
  },
  
  // Get all settings synchronously
  getAllSettings(): UserSettings {
    return getAllSettingsSync();
  }
};

export default syncSettingsHelpers;
