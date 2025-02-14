import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SupportedLanguage = 'en' | 'fr' | 'de';

interface ColorScheme {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  bubbles: {
    default: string;
    red: string;
    blue: string;
    green: string;
    black: string;
  };
  card: string;
  border: string;
}

interface AppSettingsState {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  language: SupportedLanguage;
  colors: ColorScheme;
  setLanguage: (lang: SupportedLanguage) => void;
  isOrientationLocked: boolean;
  setIsOrientationLocked: (value: boolean) => void;
}

const defaultColors: ColorScheme = {
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

const AppSettingsContext = createContext<AppSettingsState | undefined>(undefined);

export const AppSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isOrientationLocked, setIsOrientationLocked] = useState(false);

  const setLanguage = async (newLanguage: SupportedLanguage) => {
    setLanguageState(newLanguage);
    await AsyncStorage.setItem('appLanguage', newLanguage);
  };

  useEffect(() => {
    const loadSettings = async () => {
      const savedLanguage = await AsyncStorage.getItem('appLanguage');
      if (savedLanguage) {
        setLanguageState(savedLanguage as SupportedLanguage);
      }
    };
    loadSettings();
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const toggleOrientationLock = useCallback(() => {
    setIsOrientationLocked(prev => !prev);
  }, []);

  const value: AppSettingsState = {
    isDarkMode,
    setIsDarkMode,
    language,
    colors: defaultColors,
    setLanguage,
    isOrientationLocked,
    setIsOrientationLocked,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
}; 