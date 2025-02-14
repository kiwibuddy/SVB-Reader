import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from "expo-status-bar";
import { AppProvider } from '@/context/GlobalContext'
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import {
  SQLiteProvider,
  useSQLiteContext,
  type SQLiteDatabase,
} from "expo-sqlite";
import { BottomNavProvider } from '@/context/BottomNavContext';
import { FontSizeProvider } from '@/context/FontSizeContext';
import { AppSettingsProvider, useAppSettings } from '@/context/AppSettingsContext';
import { View, Text, ActivityIndicator } from 'react-native';
import ErrorBoundary from 'react-native-error-boundary';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function ErrorFallback({error}: {error: Error}) {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>Something went wrong!</Text>
      <Text>{error.toString()}</Text>
    </View>
  );
}

function SafeView() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Loading...</Text>
    </View>
  );
}

export default function RootLayout() {
  // Add some debugging logs here
  console.log('RootLayout initializing...');
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Wait for fonts to load
        if (loaded) {
          // Hide splash screen
          await SplashScreen.hideAsync();
          // Any other initialization code here
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error during initialization:', error);
        setIsLoading(false);
      }
    }

    prepare();
  }, [loaded]);

  if (!loaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AppSettingsProvider>
        <AppContent />
      </AppSettingsProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const settings = useAppSettings();
  
  // Add safety check
  if (!settings) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  const { isDarkMode, colors } = settings;
  
  return (
    <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1, backgroundColor: colors?.background || '#FFFFFF' }}>
        <AppProvider>
          <FontSizeProvider>
            <BottomNavProvider>
              <SQLiteProvider databaseName="test.db">
                <StatusBar 
                  style={isDarkMode ? "light" : "dark"}
                  backgroundColor={colors?.background}
                />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors?.background },
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
