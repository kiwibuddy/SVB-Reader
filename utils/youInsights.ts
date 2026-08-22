import { databaseManager } from '@/api/database-manager';
import { bibleLoader } from '@/services/BibleLoader';
import conversations from '@/assets/data/conversations.json';
import { DIVISIONS, storyIdFromNumber, storyNumber } from '@/constants/divisions';
import { inkHex, ThreadPalette } from '@/constants/Colors';
import { NARRATION_VOICES } from '@/utils/voicesMet';
import { addLocalCalendarDays, localCalendarDate, localCalendarDateFromISO } from '@/utils/localDate';
import logger from '@/utils/logger';
import type { ConversationsFile } from '@/types/conversations';

const conv = conversations as ConversationsFile;

export type ColorWordMix = {
  total: number;
  black: number;
  red: number;
  green: number;
  blue: number;
};

export type VoicesByColor = {
  green: number;
  blue: number;
  red: number;
  black: number;
  total: number;
};

export type NextVoice = {
  name: string;
  storyId: string;
};

export type ThinEra = {
  key: string;
  title: string;
  done: number;
  total: number;
};

type StoryColors = {
  colors?: { black?: number; red?: number; green?: number; blue?: number; total?: number };
  sources?: Record<string, { words?: number; color?: string }>;
};

function shortId(segmentId: string): string {
  return segmentId.includes('-') ? segmentId.split('-').pop() || segmentId : segmentId;
}

function voiceColor(name: string): 'green' | 'blue' | 'red' | 'black' {
  const v = conv.voices[name];
  const c = v?.color || 'black';
  if (c === 'green' || c === 'blue' || c === 'red') return c;
  return 'black';
}

export async function getWeekStreak(): Promise<number> {
  try {
    const db = await databaseManager.ensureDatabase();
    const rows = await db.getAllAsync<{ completionDate: string }>(
      `SELECT DISTINCT completionDate FROM segment_completion WHERE completionDate IS NOT NULL`
    );
    const weeks = new Set<string>();
    for (const row of rows) {
      const cal = localCalendarDateFromISO(row.completionDate);
      if (cal) weeks.add(weekStartKey(cal));
    }
    if (weeks.size === 0) return 0;

    let streak = 0;
    let cursor = weekStartKey(localCalendarDate());
    while (weeks.has(cursor)) {
      streak += 1;
      cursor = addLocalCalendarDays(cursor, -7);
    }
    return streak;
  } catch (error) {
    logger.error('Error computing week streak:', error);
    return 0;
  }
}

/** Monday of the local calendar week containing dateStr (YYYY-MM-DD). */
export function weekStartKey(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dow = date.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  return addLocalCalendarDays(dateStr, mondayOffset);
}

export function getSourceWordMix(completedIds: Set<string>): ColorWordMix {
  const bible = bibleLoader.getCurrentBible() as Record<string, StoryColors> | null;
  const mix: ColorWordMix = { total: 0, black: 0, red: 0, green: 0, blue: 0 };
  if (!bible) return mix;

  for (const id of completedIds) {
    const story = bible[shortId(id)];
    const colors = story?.colors;
    if (!colors) continue;
    mix.black += colors.black || 0;
    mix.red += colors.red || 0;
    mix.green += colors.green || 0;
    mix.blue += colors.blue || 0;
    mix.total += colors.total || 0;
  }
  if (mix.total === 0) {
    mix.total = mix.black + mix.red + mix.green + mix.blue;
  }
  return mix;
}

export function getVoicesMetByColor(completedIds: Set<string>): VoicesByColor {
  const bible = bibleLoader.getCurrentBible() as Record<string, StoryColors> | null;
  const met = new Map<string, 'green' | 'blue' | 'red' | 'black'>();
  if (!bible) return { green: 0, blue: 0, red: 0, black: 0, total: 0 };

  for (const id of completedIds) {
    const story = bible[shortId(id)];
    const sources = story?.sources;
    if (!sources) continue;
    for (const name of Object.keys(sources)) {
      if (!met.has(name)) met.set(name, voiceColor(name));
    }
  }

  const counts = { green: 0, blue: 0, red: 0, black: 0 };
  for (const c of met.values()) counts[c] += 1;
  return { ...counts, total: met.size };
}

export function getNextUnmetVoices(
  completedIds: Set<string>,
  lastReadId: string | null,
  limit = 3
): NextVoice[] {
  const bible = bibleLoader.getCurrentBible() as Record<string, StoryColors> | null;
  if (!bible) return [];

  const met = new Set<string>();
  for (const id of completedIds) {
    const sources = bible[shortId(id)]?.sources;
    if (sources) Object.keys(sources).forEach((n) => met.add(n));
  }

  const startNum = lastReadId ? (storyNumber(lastReadId) || 1) : 1;
  const found: NextVoice[] = [];
  const seen = new Set<string>();

  for (let n = startNum; n <= 365 && found.length < limit; n += 1) {
    const sid = storyIdFromNumber(n);
    if (completedIds.has(sid)) continue;
    const sources = bible[sid]?.sources;
    if (!sources) continue;
    for (const name of Object.keys(sources)) {
      if (NARRATION_VOICES.has(name) || met.has(name) || seen.has(name)) continue;
      seen.add(name);
      found.push({ name, storyId: sid });
      if (found.length >= limit) break;
    }
  }

  if (found.length < limit) {
    for (let n = 1; n < startNum && found.length < limit; n += 1) {
      const sid = storyIdFromNumber(n);
      if (completedIds.has(sid)) continue;
      const sources = bible[sid]?.sources;
      if (!sources) continue;
      for (const name of Object.keys(sources)) {
        if (NARRATION_VOICES.has(name) || met.has(name) || seen.has(name)) continue;
        seen.add(name);
        found.push({ name, storyId: sid });
        if (found.length >= limit) break;
      }
    }
  }

  return found;
}

export function getThinEras(completedIds: Set<string>, lang: 'en' | 'fr'): ThinEra[] {
  const results: ThinEra[] = [];
  for (const division of DIVISIONS) {
    let done = 0;
    const total = division.end - division.start + 1;
    for (let n = division.start; n <= division.end; n += 1) {
      if (completedIds.has(storyIdFromNumber(n))) done += 1;
    }
    const pct = total > 0 ? done / total : 0;
    if (done === 0 || pct < 0.08) {
      results.push({
        key: division.key,
        title: lang === 'fr' ? division.titleFr : division.titleEn,
        done,
        total,
      });
    }
  }
  return results.slice(0, 3);
}

export function colorMixSegments(mix: ColorWordMix, palette: ThreadPalette) {
  const total = mix.total || mix.black + mix.red + mix.green + mix.blue;
  if (total <= 0) return [];
  return [
    { value: mix.green, color: inkHex('green', palette) },
    { value: mix.blue, color: inkHex('blue', palette) },
    { value: mix.red, color: inkHex('red', palette) },
    { value: mix.black, color: inkHex('black', palette) },
  ].filter((s) => s.value > 0);
}

export function voiceColorSegments(byColor: VoicesByColor, palette: ThreadPalette) {
  if (byColor.total <= 0) return [];
  return [
    { value: byColor.green, color: inkHex('green', palette) },
    { value: byColor.blue, color: inkHex('blue', palette) },
    { value: byColor.red, color: inkHex('red', palette) },
    { value: byColor.black, color: inkHex('black', palette) },
  ].filter((s) => s.value > 0);
}
