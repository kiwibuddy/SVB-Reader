import React, { createContext, useContext, useState, useEffect } from 'react';
import logger from '@/utils/logger';
import * as ScreenOrientation from 'expo-screen-orientation';
import { type FontSize, type TextSizes } from './FontSizeContext';
import { Appearance, ColorSchemeName } from 'react-native';
import { type ColorScheme } from './types';
import i18next from 'i18next';
import { settingsHelpers } from '@/services/settings-manager';

// Create the context
const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

// MVP: Only English supported for launch
export type SupportedLanguage = 'en' | 'fr'; // German support - coming in future version

export interface AppSettingsContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  sizes: TextSizes;
  isOrientationLocked: boolean;
  setOrientationLock: (locked: boolean) => Promise<void>;
  isDarkMode: boolean;
  setDarkMode: (enabled: boolean) => Promise<void>;
  colors: ColorScheme;
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  isReady: boolean;
}

const lightColors: ColorScheme = {
  background: '#FFFFFF',
  text: '#000000',
  primary: '#FF5733',
  secondary: '#666666',
  bubbles: {
    default: '#F5F5F5',
    red: '#FFE5E5',
    blue: '#E5F1FF',
    green: '#E5FFE5',
    black: '#F5F5F5',
  },
  card: '#FFFFFF',
  border: '#E5E5E5',
};

const darkColors: ColorScheme = {
  background: '#121212',
  text: '#FFFFFF',
  primary: '#FF7B5C',
  secondary: '#A0A0A0',
  bubbles: {
    default: '#2A2A2A',
    red: '#4A2A2A',
    blue: '#2A2A4A',
    green: '#2A4A2A',
    black: '#2A2A2A',
  },
  card: '#1E1E1E',
  border: '#333333',
};

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // MVP: Default to unlocked orientation (follows system like iPhone lock screen)
  const [isOrientationLocked, setIsOrientationLocked] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [sizes, setSizes] = useState<TextSizes>({
    title: 24,
    subtitle: 18,
    body: 16,
    caption: 14,
    button: 16,
    navigation: 16,
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [isReady, setIsReady] = useState(false);
  
  const colors = isDarkMode ? darkColors : lightColors;

  // Load saved orientation setting - MVP: Default to system behavior
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Initialize dark mode from system
        const systemColorScheme = Appearance.getColorScheme();
        setIsDarkMode(systemColorScheme === 'dark');
        
        const savedOrientation = await settingsHelpers.getOrientationLock();
        setIsOrientationLocked(savedOrientation);
        await updateOrientation(savedOrientation);
        
        // Mark as ready after initial settings are loaded
        setIsReady(true);
      } catch (error) {
        logger.error('Error loading settings:', error);
        // Still mark as ready even if there's an error
        setIsReady(true);
      }
    };
    loadSettings();
  }, []);

  const updateOrientation = async (locked: boolean) => {
    try {
      if (locked) {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      } else {
        await ScreenOrientation.unlockAsync();
      }
    } catch (error) {
      logger.error('Error updating orientation:', error);
    }
  };

  const setOrientationLock = async (locked: boolean) => {
    setIsOrientationLocked(locked);
    await settingsHelpers.setOrientationLock(locked);
    await updateOrientation(locked);
  };

  // Listen for system color scheme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      settingsHelpers.getDarkMode().then(savedMode => {
        if (savedMode === false) { // Only auto-switch if user hasn't manually set dark mode
          setIsDarkMode(colorScheme === 'dark');
        }
      });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Load saved dark mode preference on mount
  useEffect(() => {
    const loadSavedMode = async () => {
      const savedMode = await settingsHelpers.getDarkMode();
      setIsDarkMode(savedMode);
    };
    loadSavedMode();
  }, []);

  const setDarkMode = async (enabled: boolean) => {
    setIsDarkMode(enabled);
    await settingsHelpers.setDarkMode(enabled);
  };

  // Add this effect to handle language changes
  useEffect(() => {
    const loadSavedLanguage = async () => {
      const savedLanguage = await settingsHelpers.getLanguage();
      if (savedLanguage) {
        setLanguage(savedLanguage as SupportedLanguage);
        i18next.changeLanguage(savedLanguage);
      }
    };
    loadSavedLanguage();
  }, []);

  const handleSetLanguage = async (newLanguage: SupportedLanguage) => {
    console.log('[AppSettings] Setting language to:', newLanguage);
    try {
    setLanguage(newLanguage);
      console.log('[AppSettings] State updated to:', newLanguage);
    await settingsHelpers.setLanguage(newLanguage);
      console.log('[AppSettings] Saved to storage:', newLanguage);
    await i18next.changeLanguage(newLanguage);
      console.log('[AppSettings] i18next changed to:', newLanguage);
    } catch (error) {
      console.error('[AppSettings] Error setting language:', error);
    }
  };

  return (
    <AppSettingsContext.Provider value={{
      fontSize,
      setFontSize,
      sizes,
      isOrientationLocked,
      setOrientationLock,
      isDarkMode,
      setDarkMode,
      colors,
      language,
      setLanguage: handleSetLanguage,
      isReady,
    }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    // Return a default context instead of throwing an error
    return {
      fontSize: 'medium' as FontSize,
      setFontSize: () => {},
      sizes: {
        title: 24,
        subtitle: 18,
        body: 16,
        caption: 14,
        button: 16,
        navigation: 16,
      },
      isOrientationLocked: false,
      setOrientationLock: async () => {},
      isDarkMode: false,
      setDarkMode: async () => {},
      colors: lightColors,
      language: 'en' as SupportedLanguage,
      setLanguage: () => {},
      isReady: false,
    };
  }
  return context;
}; 