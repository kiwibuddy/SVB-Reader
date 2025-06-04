import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import { type FontSize, type TextSizes } from './FontSizeContext';
import { Appearance, ColorSchemeName } from 'react-native';
import { createTheme, Theme } from '@/constants/DesignSystem';
import i18next from 'i18next';

// Create the context
const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export type SupportedLanguage = 'en' | 'fr' | 'de';

export interface AppSettingsContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  sizes: TextSizes;
  isOrientationLocked: boolean;
  setOrientationLock: (locked: boolean) => Promise<void>;
  isDarkMode: boolean;
  setDarkMode: (enabled: boolean) => Promise<void>;
  colors: Theme['colors'] & {
    // Backward compatibility properties
    secondary: string;
  };
  theme: Theme;
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
}

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOrientationLocked, setIsOrientationLocked] = useState(true);
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [sizes, setSizes] = useState<TextSizes>({
    title: 24,
    subtitle: 18,
    body: 16,
    caption: 14,
    button: 16,
    navigation: 16,
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const systemColorScheme = Appearance.getColorScheme();
    const getSavedMode = async () => {
      const savedMode = await AsyncStorage.getItem('darkMode');
      return savedMode !== null ? savedMode === 'true' : systemColorScheme === 'dark';
    };
    return systemColorScheme === 'dark';
  });
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  
  // Create theme using the new design system
  const theme = createTheme(isDarkMode);
  
  // Create backward-compatible colors object
  const colors = {
    ...theme.colors,
    // Map secondary to textSecondary for backward compatibility
    // This ensures all existing code using colors.secondary gets gray text instead of blue
    secondary: theme.colors.textSecondary,
  };

  // Load saved orientation setting
  useEffect(() => {
    const loadSettings = async () => {
      const savedOrientation = await AsyncStorage.getItem('orientationLocked');
      if (savedOrientation !== null) {
        setIsOrientationLocked(savedOrientation === 'true');
        await updateOrientation(savedOrientation === 'true');
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
      console.error('Error updating orientation:', error);
    }
  };

  const setOrientationLock = async (locked: boolean) => {
    setIsOrientationLocked(locked);
    await AsyncStorage.setItem('orientationLocked', locked.toString());
    await updateOrientation(locked);
  };

  // Listen for system color scheme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      AsyncStorage.getItem('darkMode').then(savedMode => {
        if (savedMode === null) {
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
      const savedMode = await AsyncStorage.getItem('darkMode');
      if (savedMode !== null) {
        setIsDarkMode(savedMode === 'true');
      }
    };
    loadSavedMode();
  }, []);

  const setDarkMode = async (enabled: boolean) => {
    setIsDarkMode(enabled);
    await AsyncStorage.setItem('darkMode', enabled.toString());
  };

  // Add this effect to handle language changes
  useEffect(() => {
    const loadSavedLanguage = async () => {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage) {
        setLanguage(savedLanguage as SupportedLanguage);
        i18next.changeLanguage(savedLanguage);
      }
    };
    loadSavedLanguage();
  }, []);

  const handleSetLanguage = async (newLanguage: SupportedLanguage) => {
    setLanguage(newLanguage);
    await AsyncStorage.setItem('language', newLanguage);
    await i18next.changeLanguage(newLanguage);
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
      theme,
      language,
      setLanguage: handleSetLanguage,
    }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}; 