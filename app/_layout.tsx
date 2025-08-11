import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import logger from '@/utils/logger';import { StatusBar } from "expo-status-bar";
import { SQLiteGlobalProvider } from '@/context/SQLiteGlobalContext';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { BottomNavProvider } from '@/context/BottomNavContext';
import { FontSizeProvider } from '@/context/FontSizeContext';
import { AppSettingsProvider, useAppSettings } from '@/context/AppSettingsContext';
import { GroupReadingProvider } from '@/context/GroupReadingContext';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initializeDatabaseWithDiagnostics } from '@/api/database-initialization';
import * as Updates from 'expo-updates';
import { SimpleLoadingScreen } from '@/components/SimpleLoadingScreen';
import '../config/i18n'; // Import this to initialize i18next

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isDarkMode, colors } = useAppSettings();
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simple initialization
        const result = await initializeDatabaseWithDiagnostics();
        
        if (result.success) {
          // Database initialized successfully
          if (result.migrationPerformed) {
            logger.info('🔄 Data migration was performed');
          }
          
          // Check for updates in background (non-blocking)
          if (!__DEV__) {
            checkForUpdates();
          }
          
          setDbReady(true);
        } else {
          logger.error('❌ Database initialization failed:', result.error);
          setDbError(result.error || 'Unknown database error');
        }
      } catch (error) {
        logger.error('❌ Critical initialization error:', error);
        setDbError(error instanceof Error ? error.message : 'Critical initialization error');
      }
    };

    const checkForUpdates = async () => {
      try {
        logger.info('🔄 Checking for OTA updates...');
        const update = await Updates.checkForUpdateAsync();
        logger.info('📱 Update check result:', update);
        
        if (update.isAvailable) {
          logger.info('⬇️ Update available, fetching...');
          await Updates.fetchUpdateAsync();
          logger.info('🔄 Update fetched, reloading app...');
          await Updates.reloadAsync();
        } else {
          logger.info('✅ No updates available');
        }
      } catch (error) {
        logger.error('❌ Update check failed:', error);
      }
    };
    
    initializeApp();
  }, []);
  
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
