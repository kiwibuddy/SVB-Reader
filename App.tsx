import 'expo-dev-client';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { SplashScreen } from 'expo-router';
import { databaseManager } from './api/database-manager';

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
      // Initialize database before hiding splash screen
      const initializeDatabase = async () => {
        const maxRetries = 3;
        let attempt = 0;
        
        while (attempt < maxRetries) {
          try {
            attempt++;
            console.log(`🔄 Database initialization attempt ${attempt}/${maxRetries}`);
            await databaseManager.initialize();
            console.log('✅ Database initialized successfully');
            return;
          } catch (error) {
            console.error(`❌ Database initialization attempt ${attempt} failed:`, error);
            if (attempt < maxRetries) {
              console.log(`⏳ Retrying in ${Math.pow(2, attempt)} seconds...`);
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
          }
        }
        
        console.error('❌ All database initialization attempts failed');
      };
      
      initializeDatabase().finally(() => {
        SplashScreen.hideAsync();
      });
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <Stack />;
}
