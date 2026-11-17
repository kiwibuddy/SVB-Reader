/**
 * "Follow a voice": a custom plan of every story where one voice speaks.
 *
 * - Offered for voices with 3 or more stories that are not narration.
 * - One plan per voice: a voice → plan id map (persisted, cached in memory
 *   for synchronous lookups) opens the existing plan instead of a copy.
 * - Stories opened from a voice plan pass that voice to the reader, so its
 *   turns are highlighted; the plan still decides the ‹ › order.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import conversations from '@/assets/data/conversations.json';
import type { ConversationsFile } from '@/types/conversations';
import { NARRATION_VOICES } from '@/utils/voicesMet';
import logger from '@/utils/logger';

export const MIN_VOICE_PLAN_STORIES = 3;
const KEY = 'svb.voicePlans';

type Voices = Record<string, { storyIds: string[] }>;
const ALL_VOICES = (conversations as unknown as ConversationsFile).voices as unknown as Voices;

/** Whether a voice gets a "Follow" plan, and its stories in Bible order. */
export function voicePlanFor(name: string, voices: Voices = ALL_VOICES): { eligible: boolean; storyIds: string[] } {
  const storyIds = [...(voices[name]?.storyIds ?? [])];
  const eligible = !NARRATION_VOICES.has(name) && storyIds.length >= MIN_VOICE_PLAN_STORIES;
  return { eligible, storyIds };
}

// voice name → user plan id
let cache: Record<string, string> = {};
let loading: Promise<void> | null = null;

/** Load once (startup does this); later calls wait for the same load. */
export function ensureVoicePlansLoaded(): Promise<void> {
  if (!loading) loading = loadVoicePlans();
  return loading;
}

export async function loadVoicePlans(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch (error) {
    logger.warn('Could not load voice plans', error);
    cache = {};
  }
}

export function planIdForVoice(name: string): string | null {
  return cache[name] ?? null;
}

/** The voice a plan follows, if it is a voice plan. Synchronous. */
export function voiceForPlan(planId: string | null | undefined): string | null {
  if (!planId) return null;
  for (const [voice, id] of Object.entries(cache)) if (id === planId) return voice;
  return null;
}

export async function rememberVoicePlan(name: string, planId: string | null): Promise<void> {
  if (planId) cache[name] = planId;
  else delete cache[name];
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  } catch (error) {
    logger.warn('Could not save voice plans', error);
  }
}
