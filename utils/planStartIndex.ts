import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '@/utils/logger';

/**
 * Where a reader chose to begin a dated plan when joining late
 * ("start at today's reading"). Kept in memory for synchronous lookups by the
 * Plan and Read tabs, and persisted so it survives restarts.
 */

const KEY = 'svb.plan.startIndex';

let cache: Record<string, number> = {};
let loaded = false;

export async function loadPlanStartIndexes(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch (error) {
    logger.warn('Could not load plan start indexes', error);
    cache = {};
  }
  loaded = true;
}

export function getPlanStartIndex(planId: string): number {
  return cache[planId] ?? 0;
}

export function planStartIndexesLoaded(): boolean {
  return loaded;
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  } catch (error) {
    logger.warn('Could not save plan start indexes', error);
  }
}

export async function setPlanStartIndex(planId: string, index: number): Promise<void> {
  if (index > 0) cache = { ...cache, [planId]: index };
  else {
    const { [planId]: _removed, ...rest } = cache;
    cache = rest;
  }
  await persist();
}

export async function clearPlanStartIndex(planId: string): Promise<void> {
  if (!(planId in cache)) return;
  await setPlanStartIndex(planId, 0);
}
