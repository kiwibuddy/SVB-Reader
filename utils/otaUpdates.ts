import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import logger from '@/utils/logger';

const PENDING_OTA_KEY = 'pendingOtaRestart';
const FOREGROUND_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
let lastCheckAt = 0;

export async function applyPendingOtaOnColdStart(): Promise<void> {
  try {
    if (__DEV__ || !Updates.isEnabled) return;
    const pending = await AsyncStorage.getItem(PENDING_OTA_KEY);
    if (!pending) return;
    await AsyncStorage.removeItem(PENDING_OTA_KEY);
    logger.info('[OTA] Applying downloaded update on cold start');
    await Updates.reloadAsync();
  } catch (error) {
    logger.error('[OTA] Failed to apply pending update:', error);
  }
}

export async function fetchOtaInBackground(): Promise<void> {
  lastCheckAt = Date.now();
  try {
    if (__DEV__ || !Updates.isEnabled) {
      logger.info('Skipping OTA update check (development build or updates disabled)');
      return;
    }

    const update = await Updates.checkForUpdateAsync();
    if (!update.isAvailable) return;

    await Updates.fetchUpdateAsync();
    await AsyncStorage.setItem(PENDING_OTA_KEY, '1');
    logger.info('[OTA] Update downloaded; will apply on next cold start');
  } catch (error) {
    logger.error('Update check failed:', error);
  }
}

/**
 * Check for an update when the app returns to the foreground, at most every
 * six hours. iOS keeps apps suspended for days, so checking only on cold start
 * means many people never pick an update up in time.
 */
export async function fetchOtaOnForeground(): Promise<void> {
  if (Date.now() - lastCheckAt < FOREGROUND_CHECK_INTERVAL_MS) return;
  await fetchOtaInBackground();
}

/** Settings row: "binary" until a matching OTA reloads, then a short update id. */
export function getOtaDebugLabel(): string {
  if (__DEV__ || !Updates.isEnabled) return 'dev';
  if (Updates.isEmbeddedLaunch) return 'binary';
  const id = Updates.updateId?.replace(/-/g, '').slice(0, 8) ?? 'applied';
  const at = Updates.createdAt
    ? Updates.createdAt.toISOString().slice(0, 16).replace('T', ' ')
    : '';
  return at ? `${id} · ${at} UTC` : id;
}
