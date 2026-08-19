import dailyStoryMap from '@/assets/data/DailyStoryMap.json';

const daily = dailyStoryMap as string[];

export type ContinueKind = 'today' | 'continue' | 'plan';

export type ContinueTarget = {
  kind: ContinueKind;
  storyId: string;
  day?: number;
  planId?: string;
  challengeId?: string;
};

export type ActiveReading = {
  id: string;
  type: 'plan' | 'challenge';
  completedIds: Set<string>;
};

export function dayOfYear(date = new Date()): number {
  const start = Date.UTC(date.getFullYear(), 0, 1);
  const now = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((now - start) / 86400000) + 1;
}

export function todayStoryId(date = new Date()): string {
  const index = Math.min(Math.max(dayOfYear(date) - 1, 0), daily.length - 1);
  return daily[index] || 'S001';
}

export function resolveContinueTarget(
  completedIds: Set<string>,
  lastReadId: string | null | undefined,
  active?: ActiveReading | null
): ContinueTarget | null {
  const last = lastReadId?.match(/S\d+/i)?.[0] || lastReadId || null;
  if (last && last.startsWith('S') && !completedIds.has(last)) {
    return {
      kind: 'continue',
      storyId: last,
    };
  }

  const today = todayStoryId();
  if (completedIds.has(today) && completedIds.size >= 365) return null;
  return { kind: 'today', storyId: today };
}
