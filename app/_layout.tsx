import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from "expo-status-bar";
import { AppProvider } from '@/context/GlobalContext'
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import {
  SQLiteProvider,
  useSQLiteContext,
  type SQLiteDatabase,
} from "expo-sqlite";
import { BottomNavProvider } from '@/context/BottomNavContext';
import { FontSizeProvider } from '@/context/FontSizeContext';
import { AppSettingsProvider, useAppSettings } from '@/context/AppSettingsContext';
import { View } from 'react-native';
import '../config/i18n'; // Import this to initialize i18next

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Mistrully': require('../assets/fonts/Mistrully.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AppSettingsProvider>
      <FontSizeProvider>
        <AppProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AppProvider>
      </FontSizeProvider>
    </AppSettingsProvider>
  );
}

function AppContent() {
  const { isDarkMode, colors } = useAppSettings();
  
  return (
    <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppProvider>
          <FontSizeProvider>
            <BottomNavProvider>
              <SQLiteProvider databaseName="test.db">
                <StatusBar 
                  style={isDarkMode ? "light" : "dark"}
                  backgroundColor={colors.background}
                />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </SQLiteProvider>
            </BottomNavProvider>
          </FontSizeProvider>
        </AppProvider>
      </View>
    </ThemeProvider>
  );
}
