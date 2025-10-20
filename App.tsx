import 'expo-dev-client';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { SplashScreen } from 'expo-router';
import { databaseManager } from './api/database-manager';
import logger from '@/utils/logger';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Mistrully': require('./assets/fonts/Mistrully.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Hide splash screen immediately - don't wait for database
      SplashScreen.hideAsync();
      
      // Initialize database in background (non-blocking)
      const initializeDatabase = async () => {
        try {
          await databaseManager.initialize();
        } catch (error) {
          logger.error('Database initialization failed:', error);
        }
      };
      
      initializeDatabase();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <Stack />;
}
