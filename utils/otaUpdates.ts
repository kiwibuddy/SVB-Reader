import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import logger from '@/utils/logger';

const PENDING_OTA_KEY = 'pendingOtaRestart';

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
