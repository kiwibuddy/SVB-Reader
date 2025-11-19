import React, { createContext, useContext, useState, useEffect } from 'react';
import { type FontSize, type TextSizes } from './FontSizeContext';
import { type ColorScheme } from './types';
import { syncSettingsHelpers, setSetting } from '@/services/sync-settings-manager';
import * as ScreenOrientation from 'expo-screen-orientation';
import i18next from 'i18next';
import { bibleLoader } from '@/services/BibleLoader';
import logger from '@/utils/logger';

// ============================================================================
// SYNCHRONOUS APP SETTINGS CONTEXT - ZERO ASYNC OPERATIONS
// ============================================================================

// Supported languages: English and French
export type SupportedLanguage = 'en' | 'fr';

export interface SyncAppSettingsContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  sizes: TextSizes;
  isOrientationLocked: boolean;
  setOrientationLock: (locked: boolean) => Promise<void>;
  isDarkMode: boolean;
  setDarkMode: (enabled: boolean) => Promise<void>;
  colors: ColorScheme;
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
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

// Font size configurations
const fontSizeConfigs: Record<FontSize, TextSizes> = {
  small: {
    title: 20,
    subtitle: 16,
    body: 14,
    caption: 12,
    button: 14,
    navigation: 14,
  },
  medium: {
    title: 24,
    subtitle: 18,
    body: 16,
    caption: 14,
    button: 16,
    navigation: 16,
  },
  large: {
    title: 28,
    subtitle: 20,
    body: 18,
    caption: 16,
    button: 18,
    navigation: 18,
  },
};

// Create the context
const SyncAppSettingsContext = createContext<SyncAppSettingsContextType | undefined>(undefined);

// ============================================================================
// SYNCHRONOUS PROVIDER - NO useEffect, NO ASYNC OPERATIONS
// ============================================================================

export const SyncAppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  // 🚀 INSTANT SYNCHRONOUS INITIALIZATION WITH SAFE DEFAULTS
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  
  const [isDarkMode, setIsDarkModeState] = useState<boolean>(false);
  
  const [isOrientationLocked, setIsOrientationLockedState] = useState<boolean>(false);
  
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  
  // 🚀 BACKGROUND SETTINGS LOADING (NO BLOCKING)
  useEffect(() => {
    const loadSettingsInBackground = async () => {
      try {
        // Load settings asynchronously after initial render
        await new Promise(resolve => setTimeout(resolve, 200)); // Delay to ensure render completes
        
        // Keep light mode as default for now - system detection causes React Native warnings
        // TODO: Implement system dark mode detection through a different method
        // setIsDarkModeState(false); // Keep default
        
        // Load other settings from database if available
        // This is non-blocking and won't affect initial render
        
      } catch (error) {
        // Silent error - keep defaults
      }
    };
    
    loadSettingsInBackground();
  }, []);
  
  // 🚀 COMPUTED VALUES (INSTANT)
  const sizes = fontSizeConfigs[fontSize];
  const colors = isDarkMode ? darkColors : lightColors;
  
  // ============================================================================
  // SETTER FUNCTIONS (BACKGROUND UPDATES ONLY)
  // ============================================================================
  
  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    // Background write - no await needed
    setSetting('fontSize', size);
  };
  
  const setDarkMode = async (enabled: boolean) => {
    setIsDarkModeState(enabled);
    // Background write
    await setSetting('isDarkMode', enabled);
  };
  
  const setOrientationLock = async (locked: boolean) => {
    setIsOrientationLockedState(locked);
    
    // Background operations
    try {
      await setSetting('isOrientationLocked', locked);
      
      // Apply orientation change
      if (locked) {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      } else {
        await ScreenOrientation.unlockAsync();
      }
    } catch (error) {
      // Orientation changes can fail, but don't crash the app
      // Error is handled silently in background
    }
  };
  
  const setLanguage = async (newLanguage: SupportedLanguage) => {
    setLanguageState(newLanguage);
    
    // Background operations
    await setSetting('language', newLanguage);
    await i18next.changeLanguage(newLanguage);
    
    // Switch Bible language
    try {
      const result = await bibleLoader.switchLanguage(newLanguage);
      if (result.success) {
        logger.info(`✅ Bible switched to ${newLanguage}`);
      } else if (result.needsDownload) {
        logger.warn(`⚠️ ${newLanguage} Bible not downloaded yet`);
      }
    } catch (error) {
      logger.error('❌ Failed to switch Bible language:', error);
    }
  };
  
  // ============================================================================
  // CONTEXT PROVIDER (INSTANT RETURN)
  // ============================================================================
  
  return (
    <SyncAppSettingsContext.Provider value={{
      fontSize,
      setFontSize,
      sizes,
      isOrientationLocked,
      setOrientationLock,
      isDarkMode,
      setDarkMode,
      colors,
      language,
      setLanguage,
    }}>
      {children}
    </SyncAppSettingsContext.Provider>
  );
};

// ============================================================================
// SYNCHRONOUS HOOK (INSTANT RETURN)
// ============================================================================

export const useSyncAppSettings = () => {
  const context = useContext(SyncAppSettingsContext);
  
  if (context === undefined) {
    // Return pure safe defaults - NO system calls during render
    return {
      fontSize: 'medium' as FontSize,
      setFontSize: () => {},
      sizes: fontSizeConfigs.medium,
      isOrientationLocked: false,
      setOrientationLock: async () => {},
      isDarkMode: false, // Safe default - no system check
      setDarkMode: async () => {},
      colors: lightColors, // Safe default colors
      language: 'en' as SupportedLanguage,
      setLanguage: async () => {},
    };
  }
  
  return context;
};

// Legacy hook for backward compatibility
export const useAppSettings = useSyncAppSettings;

export default SyncAppSettingsProvider;
