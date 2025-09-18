import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '@/utils/logger';

const FIRST_LAUNCH_KEY = 'hasLaunchedBefore';

export type FirstLaunchState = {
  isFirstLaunch: boolean | null; // null = loading, boolean = determined
  isLoading: boolean;
  markAsLaunched: () => Promise<void>;
  error: string | null;
};

/**
 * Custom hook to detect if this is the user's first time launching the app.
 * Returns loading state while checking AsyncStorage, then boolean result.
 * Provides method to mark first launch as complete.
 */
export const useFirstLaunch = (): FirstLaunchState => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
      
      if (hasLaunched === null) {
        // No value found - this is the first launch
        logger.info('🎉 First app launch detected');
        setIsFirstLaunch(true);
      } else {
        // Value exists - user has launched before
        logger.info('🔄 Returning user detected');
        setIsFirstLaunch(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error checking first launch';
      logger.error('❌ Error checking first launch status:', errorMessage);
      setError(errorMessage);
      // On error, assume it's not first launch to avoid showing onboarding repeatedly
      setIsFirstLaunch(false);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsLaunched = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
      logger.info('✅ First launch marked as complete');
      setIsFirstLaunch(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error marking launch';
      logger.error('❌ Error marking first launch as complete:', errorMessage);
      setError(errorMessage);
      throw err; // Re-throw so caller can handle
    }
  };

  return {
    isFirstLaunch,
    isLoading,
    markAsLaunched,
    error
  };
};

// Utility function for testing - allows clearing the first launch flag
export const clearFirstLaunchFlag = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(FIRST_LAUNCH_KEY);
    logger.info('🧹 First launch flag cleared for testing');
  } catch (err) {
    logger.error('❌ Error clearing first launch flag:', err);
  }
};
