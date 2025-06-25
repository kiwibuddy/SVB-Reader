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
import { GroupReadingProvider } from '@/context/GroupReadingContext';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../config/i18n'; // Import this to initialize i18next

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isDarkMode, colors } = useAppSettings();
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <FontSizeProvider>
            <GroupReadingProvider>
              <AppProvider>
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
              </AppProvider>
            </GroupReadingProvider>
          </FontSizeProvider>
        </View>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Mistrully': require('../assets/fonts/Mistrully.ttf'),
    'Manrope-Light': require('../assets/fonts/Manrope-Light.ttf'),
    'Manrope-Regular': require('../assets/fonts/Manrope-Regular.ttf'),
    'Manrope-Medium': require('../assets/fonts/Manrope-Medium.ttf'),
    'Manrope-SemiBold': require('../assets/fonts/Manrope-SemiBold.ttf'),
    'Manrope-Bold': require('../assets/fonts/Manrope-Bold.ttf'),
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
      <AppContent />
    </AppSettingsProvider>
  );
}
