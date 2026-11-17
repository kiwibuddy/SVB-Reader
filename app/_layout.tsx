import logger from '@/utils/logger';
import { StatusBar } from "expo-status-bar";
import { SQLiteGlobalProvider } from '@/context/SQLiteGlobalContext';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useState, useEffect, useRef } from 'react';
import { AppState, View, Text, Pressable } from 'react-native';
import i18next from 'i18next';
import { bibleLoader } from '@/services/BibleLoader';
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
import { addNotificationTapListener, rescheduleReadingReminders } from '@/utils/readingReminders';
import { loadPlanStartIndexes } from '@/utils/planStartIndex';
import { ensureVoicePlansLoaded } from '@/utils/voicePlans';
import { refreshSeasonalProgress } from '@/utils/seasonalProgress';
import { initSentry } from '@/utils/sentry';
import {
  applyPendingOtaOnColdStart,
  applyPendingUpdate,
  fetchOtaInBackground,
  fetchOtaOnForeground,
  hasPendingUpdate,
} from '@/utils/otaUpdates';
import { shouldApplyOnForeground } from '@/utils/otaPolicy';

initSentry();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isDarkMode, colors } = useSyncAppSettings();
  // Read inside the AppState listener, which outlives renders.
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);
  const [dbReady, setDbReady] = useState(false);
  const [dbError] = useState<string | null>(null);
  // Only possible when built with the Bible as a file asset: never show an empty Bible.
  const [bibleFailed, setBibleFailed] = useState(false);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.info('[INIT] Starting app initialization...');
        // English text: instant when bundled; read from its asset when built that way.
        const englishReady = bibleLoader.ensureEnglishLoaded().catch(() => false);
        const result = await initializeAppSystems();
        logger.info('[INIT] initializeAppSystems completed:', result.success);
        if (!(await englishReady)) {
          logger.error('[CRASH] English Bible could not be loaded');
          setBibleFailed(true);
          void fetchOtaInBackground();
          return;
        }
        
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
    let alive = true;
    let removeTapListener: (() => void) | undefined;
    (async () => {
      await Promise.all([loadPlanStartIndexes(), ensureVoicePlansLoaded()]);
      await refreshSeasonalProgress();
      await rescheduleReadingReminders();
      const remove = await addNotificationTapListener((url) => {
        // Let the first screen mount before navigating from a cold start.
        setTimeout(() => {
          try {
            router.push(url as never);
          } catch (error) {
            logger.warn('Could not open notification link', error);
          }
        }, 600);
      });
      if (alive) removeTapListener = remove;
      else remove();
    })();
    let backgroundAt: number | null = null;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        backgroundAt = Date.now();
        return;
      }
      if (state !== 'active') return;
      const backgroundMs = backgroundAt == null ? null : Date.now() - backgroundAt;
      backgroundAt = null;
      void (async () => {
        // Back after 30+ minutes with an update waiting, and not mid-story:
        // apply it now rather than at the next cold start.
        const pending = await hasPendingUpdate();
        if (shouldApplyOnForeground({ pending, backgroundMs, pathname: pathnameRef.current })) {
          if (await applyPendingUpdate('foreground after a break')) return;
        }
        await refreshSeasonalProgress();
        await rescheduleReadingReminders();
        await fetchOtaOnForeground();
      })();
    });
    return () => {
      alive = false;
      sub.remove();
      removeTapListener?.();
    };
  }, [dbReady]);
  
  if (bibleFailed) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 24 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
          {i18next.t('UI.bibleLoad.title', { defaultValue: "The Bible text didn't load" })}
        </Text>
        <Text style={{ color: colors.text, textAlign: 'center', marginBottom: 20 }}>
          {i18next.t('UI.bibleLoad.body', { defaultValue: 'Please try again. If it keeps happening, restart the app.' })}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            setBibleFailed(false);
            const ok = await bibleLoader.ensureEnglishLoaded().catch(() => false);
            if (ok) setDbReady(true);
            else setBibleFailed(true);
          }}
          style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.text }}
        >
          <Text style={{ color: colors.text, fontWeight: '600' }}>
            {i18next.t('UI.bibleLoad.retry', { defaultValue: 'Try again' })}
          </Text>
        </Pressable>
      </View>
    );
  }

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
