/**
 * English Bible loaded from a file asset instead of the JS bundle.
 * Only used when the app is bundled with EXPO_PUBLIC_BIBLE_AS_ASSET=1
 * (metro.config.js swaps it in for englishBibleSource.ts). Same exports.
 */
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import logger from '@/utils/logger';

let bible: any = null;
let loading: Promise<boolean> | null = null;

export const ENGLISH_BIBLE_SOURCE: 'bundle' | 'asset' = 'asset';

export function getEnglishBibleSync(): any | null {
  return bible;
}

async function readAsset(): Promise<any> {
  // Resolved by metro.config.js to assets/data/newBibleNLT1.json as a file asset.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const asset = Asset.fromModule(require('svb-english-bible-asset'));
  await asset.downloadAsync();
  const uri = asset.localUri || asset.uri;
  const text =
    Platform.OS === 'web' ? await (await fetch(uri)).text() : await FileSystem.readAsStringAsync(uri);
  const parsed = JSON.parse(text);
  // Never hand the reader an empty or partial Bible.
  if (!parsed || typeof parsed !== 'object' || !parsed.S001 || !parsed.S365) {
    throw new Error('English Bible asset is incomplete');
  }
  return parsed;
}

/** Load once; later calls share the same load. Resolves false on failure (retry allowed). */
export function loadEnglishBible(): Promise<boolean> {
  if (bible) return Promise.resolve(true);
  if (!loading) {
    const started = Date.now();
    loading = readAsset()
      .then((parsed) => {
        bible = parsed;
        logger.info(`[BIBLE] English Bible loaded from asset in ${Date.now() - started} ms`);
        return true;
      })
      .catch((error) => {
        logger.error('[BIBLE] Could not load the English Bible asset:', error);
        loading = null;
        return false;
      });
  }
  return loading;
}
