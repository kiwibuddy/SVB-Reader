import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '@/utils/logger';

export const CURRENT_ONBOARDING_VERSION = 3;
const VERSION_KEY = 'onboardingVersion';
const LEGACY_KEY = 'hasLaunchedBefore';

export type FirstLaunchState = {
  needsOnboarding: boolean | null;
  isFirstLaunch: boolean | null;
  isLoading: boolean;
  markAsLaunched: () => Promise<void>;
  error: string | null;
};

async function readStoredVersion(): Promise<number> {
  const raw = await AsyncStorage.getItem(VERSION_KEY);
  if (raw != null) {
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const legacy = await AsyncStorage.getItem(LEGACY_KEY);
  if (legacy != null) return 1;
  return 0;
}

export const useFirstLaunch = (): FirstLaunchState => {
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const version = await readStoredVersion();
      const needs = version < CURRENT_ONBOARDING_VERSION;
      logger.info(needs ? '🎉 Onboarding needed' : '🔄 Returning user detected', { version });
      setNeedsOnboarding(needs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error checking first launch';
      logger.error('❌ Error checking first launch status:', errorMessage);
      setError(errorMessage);
      setNeedsOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsLaunched = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(VERSION_KEY, String(CURRENT_ONBOARDING_VERSION));
      await AsyncStorage.setItem(LEGACY_KEY, 'true');
      logger.info('✅ Onboarding marked complete', { version: CURRENT_ONBOARDING_VERSION });
      setNeedsOnboarding(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error marking launch';
      logger.error('❌ Error marking first launch as complete:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  return {
    needsOnboarding,
    isFirstLaunch: needsOnboarding,
    isLoading,
    markAsLaunched,
    error,
  };
};

export const clearFirstLaunchFlag = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([VERSION_KEY, LEGACY_KEY]);
    logger.info('🧹 Onboarding version cleared for testing');
  } catch (err) {
    logger.error('❌ Error clearing first launch flag:', err);
  }
};
