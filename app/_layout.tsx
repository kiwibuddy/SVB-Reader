import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import logger from '@/utils/logger';
import { StatusBar } from "expo-status-bar";
import { SQLiteGlobalProvider } from '@/context/SQLiteGlobalContext';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useState, useEffect } from 'react';
// Removed duplicate logger import
import 'react-native-reanimated';
import { BottomNavProvider } from '@/context/BottomNavContext';
import { FontSizeProvider } from '@/context/FontSizeContext';
import { SyncAppSettingsProvider, useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { initializeAppSystems } from '@/services/app-startup-manager';
import { GroupReadingProvider } from '@/context/GroupReadingContext';
import { View, Text, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Updates from 'expo-updates';
import { SimpleLoadingScreen } from '@/components/SimpleLoadingScreen';
import '../config/i18n'; // Import this to initialize i18next
import { languageDetectionService } from '@/services/LanguageDetectionService';
import BibleDownloadModal from '@/components/BibleDownloadModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useTranslation } from '@/hooks/useTranslation';
import { analytics } from '@/services/analytics';
import AnalyticsConsentDialog from '@/components/AnalyticsConsentDialog';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isDarkMode, colors, setLanguage } = useSyncAppSettings();
  const { t } = useTranslation();
  const [dbReady, setDbReady] = useState(false);
  const [dbError] = useState<string | null>(null);
  const [showBibleDownload, setShowBibleDownload] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<'fr' | 'es' | 'pt' | null>(null);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.info('[INIT] Starting app initialization...');
        
        // Initialize analytics (privacy-first, opt-out by default)
        await analytics.initialize();
        logger.info('[INIT] Analytics service initialized');
        
        const result = await initializeAppSystems();
        logger.info('[INIT] initializeAppSystems completed:', result.success);
        
        if (result.success) {
          setDbReady(true);
          logger.info('[INIT] Database ready, checking updates...');
          checkForUpdates();
          checkDeviceLanguage();
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

    const checkForUpdates = async () => {
      try {
        // Skip update checks in development builds
        if (__DEV__ || !Updates.isEnabled) {
          logger.info('⏭️ Skipping OTA update check (development build or updates disabled)');
          return;
        }
        
        logger.info('🔄 Checking for OTA updates...');
        
        // OTA update check completed
        
        const update = await Updates.checkForUpdateAsync();
        
        if (update.isAvailable) {
          const fetchResult = await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        logger.error('❌ Update check failed:', error);
        logger.error('❌ Error details:', JSON.stringify(error, null, 2));
      }
    };

    const checkDeviceLanguage = async () => {
      try {
        const detection = await languageDetectionService.detectLanguageOnLaunch();
        
        if (detection.shouldPromptDownload && detection.deviceLanguage !== 'en') {
          // Device is set to French (or other supported language) and it's first launch
          setDetectedLanguage(detection.deviceLanguage as 'fr' | 'es' | 'pt');
          
          // Wait a bit for UI to settle, then show prompt
          setTimeout(() => {
            Alert.alert(
              `Télécharger la Bible en ${languageDetectionService.getLanguageDisplayName(detection.deviceLanguage)}?`,
              `Votre appareil est configuré en ${languageDetectionService.getLanguageDisplayName(detection.deviceLanguage)}. Souhaitez-vous télécharger la Bible dans cette langue?`,
              [
                {
                  text: 'Non merci',
                  style: 'cancel',
                  onPress: () => {
                    languageDetectionService.markLanguageDetectionShown();
                    languageDetectionService.markFirstLaunchComplete();
                  },
                },
                {
                  text: 'Télécharger',
                  onPress: async () => {
                    // Switch to detected language (only 'en' or 'fr' are supported for UI)
                    const uiLanguage = detection.deviceLanguage === 'fr' ? 'fr' : 'en';
                    await setLanguage(uiLanguage as 'en' | 'fr');
                    setShowBibleDownload(true);
                    languageDetectionService.markLanguageDetectionShown();
                    languageDetectionService.markFirstLaunchComplete();
                  },
                },
              ]
            );
          }, 2000); // 2 second delay for smooth UX
        }
      } catch (error) {
        logger.error('❌ Language detection failed:', error);
      }
    };
    
    initializeApp();
  }, [setLanguage]);
  
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
      <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <FontSizeProvider>
            <GroupReadingProvider>
              <SQLiteGlobalProvider>
                <BottomNavProvider>
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
                </BottomNavProvider>
              </SQLiteGlobalProvider>
            </GroupReadingProvider>
          </FontSizeProvider>
          
          {/* Auto-detected language Bible download modal */}
          {detectedLanguage && (
            <BibleDownloadModal
              visible={showBibleDownload}
              language={detectedLanguage}
              languageDisplay={languageDetectionService.getLanguageDisplayName(detectedLanguage)}
              fileSize={52073208} // Updated to correct size: 49.7 MB (was 16.4 MB)
              onClose={() => setShowBibleDownload(false)}
              onDownloadComplete={() => {
                setShowBibleDownload(false);
                Alert.alert(
                  t('UI.alerts.success'),
                  `${languageDetectionService.getLanguageDisplayName(detectedLanguage)} ${t('UI.alerts.bibleDownloaded')}`
                );
              }}
            />
          )}
          
          {/* Analytics consent dialog (shown once on first launch) */}
          <AnalyticsConsentDialog />
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
    <ErrorBoundary>
      <SyncAppSettingsProvider>
        <AppContent />
      </SyncAppSettingsProvider>
    </ErrorBoundary>
  );
}
