import logger from '@/utils/logger';
import { StatusBar } from "expo-status-bar";
import { SQLiteGlobalProvider } from '@/context/SQLiteGlobalContext';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useState, useEffect } from 'react';
import { AppState, View, Text } from 'react-native';
// Removed duplicate logger import
import 'react-native-reanimated';
import 'react-native-worklets';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomNavProvider } from '@/context/BottomNavContext';
import { SyncAppSettingsProvider, useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { initializeAppSystems } from '@/services/app-startup-manager';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SimpleLoadingScreen } from '@/components/SimpleLoadingScreen';
import '../config/i18n'; // Import this to initialize i18next
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { rescheduleReadingReminders } from '@/utils/readingReminders';
import { initSentry } from '@/utils/sentry';
import { applyPendingOtaOnColdStart, fetchOtaInBackground } from '@/utils/otaUpdates';

initSentry();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isDarkMode, colors } = useSyncAppSettings();
  const [dbReady, setDbReady] = useState(false);
  const [dbError] = useState<string | null>(null);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.info('[INIT] Starting app initialization...');
        const result = await initializeAppSystems();
        logger.info('[INIT] initializeAppSystems completed:', result.success);
        
        if (result.success) {
          setDbReady(true);
          logger.info('[INIT] Database ready, checking updates...');
          void fetchOtaInBackground();
        } else {
          logger.error('[CRASH] Database initialization failed:', result.error);
          setDbReady(true);
        }
      } catch (error) {
        logger.error('[CRASH] Critical initialization error:', error);
        logger.error('[CRASH] Error details:', JSON.stringify(error, null, 2));
        if (error instanceof Error) {
          logger.error('[CRASH] Error stack:', error.stack);
        }
        setDbReady(true);
      }
    };

    void applyPendingOtaOnColdStart().then(() => {
      initializeApp();
    });
  }, []);

  useEffect(() => {
    if (!dbReady) return;
    void rescheduleReadingReminders();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void rescheduleReadingReminders();
    });
    return () => sub.remove();
  }, [dbReady]);
  
  if (dbError) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: colors.background,
        padding: 20 
      }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          Database Error
        </Text>
        <Text style={{ color: colors.text, textAlign: 'center', marginBottom: 20 }}>
          {dbError}
        </Text>
        <Text style={{ color: colors.secondary, textAlign: 'center', fontSize: 12 }}>
          Please restart the app. If the problem persists, contact support.
        </Text>
      </View>
    );
  }
  
  if (!dbReady) {
    return <SimpleLoadingScreen />;
  }
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
      <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <SQLiteGlobalProvider>
              <BottomNavProvider>
                <StatusBar style={isDarkMode ? "light" : "dark"} />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="onboarding"
                    options={{ gestureEnabled: false, animation: 'fade', headerShown: false }}
                  />
                  <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'card' }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </BottomNavProvider>
            </SQLiteGlobalProvider>
          
        </View>
      </ThemeProvider>
      </SafeAreaProvider>
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
    <ErrorBoundary>
      <SyncAppSettingsProvider>
        <AppContent />
      </SyncAppSettingsProvider>
    </ErrorBoundary>
  );
}
