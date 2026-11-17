/**
 * Where the English Bible text comes from.
 *
 * Default (this file): inside the JS bundle, available synchronously. Every
 * update then carries the whole text again (~15 MB raw).
 *
 * With EXPO_PUBLIC_BIBLE_AS_ASSET=1 set when bundling, metro.config.js swaps
 * in englishBibleSource.asset.ts, which loads the same JSON from a separate
 * file asset. Unchanged assets are not downloaded again, so updates shrink
 * to about half. Off by default: it changes start-up on both platforms and
 * must be tested on real phones first. See MVP3/02-POST-ADVENT-BUILD-PLAN.md §13.
 */
import logger from '@/utils/logger';

let bible: any = null;

try {
  // @ts-ignore - Metro bundles this JSON
  bible = require('@/assets/data/newBibleNLT1.json');
} catch (error) {
  logger.error('[CRASH] Failed to load English Bible at module level:', error);
}

export const ENGLISH_BIBLE_SOURCE: 'bundle' | 'asset' = 'bundle';

/** The English Bible if it is in memory (always, for the bundled source). */
export function getEnglishBibleSync(): any | null {
  return bible;
}

/** Bundled: nothing to load. Resolves true when the text is available. */
export async function loadEnglishBible(): Promise<boolean> {
  return !!bible;
}
