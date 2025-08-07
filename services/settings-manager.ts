import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// SETTINGS MANAGER - AsyncStorage-only user preferences
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

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
  isDarkMode: false,
  language: 'en',
  isOrientationLocked: false,
  groupUserName: '',
  notificationsEnabled: true,
  fontSize: 'medium',
  autoBackup: true
};

// Storage keys mapping
const STORAGE_KEYS: Record<SettingsKey, string> = {
  isDarkMode: 'darkMode',
  language: 'language',
  isOrientationLocked: 'orientationLocked',
  groupUserName: 'groupUserName',
  notificationsEnabled: 'notificationsEnabled',
  fontSize: 'fontSize',
  autoBackup: 'autoBackup'
};

// ============================================================================
// SETTINGS OPERATIONS
// ============================================================================

/**
 * Get a specific setting value
 */
export async function getSetting<K extends SettingsKey>(
  key: K
): Promise<UserSettings[K]> {
  try {
    const storageKey = STORAGE_KEYS[key];
    const value = await AsyncStorage.getItem(storageKey);
    
    if (value === null) {
      return DEFAULT_SETTINGS[key];
    }
    
    // Parse based on setting type
    const defaultValue = DEFAULT_SETTINGS[key];
    if (typeof defaultValue === 'boolean') {
      return (value === 'true') as UserSettings[K];
    } else if (typeof defaultValue === 'string') {
      return value as UserSettings[K];
    }
    
    return DEFAULT_SETTINGS[key];
  } catch (error) {
    console.warn(`Error getting setting ${key}:`, error);
    return DEFAULT_SETTINGS[key];
  }
}

/**
 * Set a specific setting value
 */
export async function setSetting<K extends SettingsKey>(
  key: K,
  value: UserSettings[K]
): Promise<void> {
  try {
    const storageKey = STORAGE_KEYS[key];
    const stringValue = typeof value === 'boolean' ? value.toString() : String(value);
    await AsyncStorage.setItem(storageKey, stringValue);
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    throw error;
  }
}

/**
 * Get all user settings
 */
export async function getAllSettings(): Promise<UserSettings> {
  try {
    const keys = Object.keys(DEFAULT_SETTINGS) as SettingsKey[];
    const settingsPromises = keys.map(async (key) => {
      const value = await getSetting(key);
      return [key, value] as const;
    });
    
    const settingsEntries = await Promise.all(settingsPromises);
    const settings = Object.fromEntries(settingsEntries) as UserSettings;
    
    return settings;
  } catch (error) {
    console.error('Error getting all settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update multiple settings at once
 */
export async function updateSettings(
  updates: Partial<UserSettings>
): Promise<void> {
  try {
    const updatePromises = Object.entries(updates).map(([key, value]) => 
      setSetting(key as SettingsKey, value as any)
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(): Promise<void> {
  try {
    const keys = Object.values(STORAGE_KEYS);
    const removePromises = keys.map(key => AsyncStorage.removeItem(key));
    await Promise.all(removePromises);
  } catch (error) {
    console.error('Error resetting settings:', error);
    throw error;
  }
}

/**
 * Export settings for backup
 */
export async function exportSettings(): Promise<string> {
  try {
    const settings = await getAllSettings();
    return JSON.stringify(settings, null, 2);
  } catch (error) {
    console.error('Error exporting settings:', error);
    throw error;
  }
}

/**
 * Import settings from backup
 */
export async function importSettings(settingsJson: string): Promise<void> {
  try {
    const settings = JSON.parse(settingsJson) as Partial<UserSettings>;
    
    // Validate settings object
    const validKeys = Object.keys(DEFAULT_SETTINGS) as SettingsKey[];
    const filteredSettings: Partial<UserSettings> = {};
    
    for (const key of validKeys) {
      if (key in settings && settings[key] !== undefined) {
        filteredSettings[key] = settings[key];
      }
    }
    
    await updateSettings(filteredSettings);
  } catch (error) {
    console.error('Error importing settings:', error);
    throw error;
  }
}

/**
 * Get AsyncStorage keys used by settings (for cleanup operations)
 */
export function getSettingsKeys(): string[] {
  return Object.values(STORAGE_KEYS);
}

/**
 * Check if a key belongs to settings
 */
export function isSettingsKey(key: string): boolean {
  return Object.values(STORAGE_KEYS).includes(key);
}

// ============================================================================
// TYPED CONVENIENCE FUNCTIONS
// ============================================================================

export const settingsHelpers = {
  // Dark mode
  async getDarkMode(): Promise<boolean> {
    return getSetting('isDarkMode');
  },
  
  async setDarkMode(enabled: boolean): Promise<void> {
    return setSetting('isDarkMode', enabled);
  },
  
  // Language
  async getLanguage(): Promise<string> {
    return getSetting('language');
  },
  
  async setLanguage(language: string): Promise<void> {
    return setSetting('language', language);
  },
  
  // Orientation lock
  async getOrientationLock(): Promise<boolean> {
    return getSetting('isOrientationLocked');
  },
  
  async setOrientationLock(locked: boolean): Promise<void> {
    return setSetting('isOrientationLocked', locked);
  },
  
  // Group user name
  async getGroupUserName(): Promise<string> {
    return getSetting('groupUserName');
  },
  
  async setGroupUserName(name: string): Promise<void> {
    return setSetting('groupUserName', name);
  },
  
  // Font size
  async getFontSize(): Promise<'small' | 'medium' | 'large'> {
    return getSetting('fontSize');
  },
  
  async setFontSize(size: 'small' | 'medium' | 'large'): Promise<void> {
    return setSetting('fontSize', size);
  }
};
