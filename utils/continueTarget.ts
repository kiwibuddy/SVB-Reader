import dailyStoryMap from '@/assets/data/DailyStoryMap.json';
import { findCatalogItem, nextUnreadStory } from '@/utils/planCatalog';

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
    const inActive = !!active && !!findCatalogItem(active.id)?.stories.includes(last);
    return {
      kind: 'continue',
      storyId: last,
      ...(inActive && active?.type === 'plan' ? { planId: active.id } : {}),
      ...(inActive && active?.type === 'challenge' ? { challengeId: active.id } : {}),
    };
  }

  if (active) {
    const item = findCatalogItem(active.id);
    const next = item ? nextUnreadStory(item.stories, active.completedIds) : null;
    if (next) {
      return {
        kind: 'plan',
        storyId: next.storyId,
        day: next.day,
        ...(active.type === 'plan' ? { planId: active.id } : {}),
        ...(active.type === 'challenge' ? { challengeId: active.id } : {}),
      };
    }
  }

  const today = todayStoryId();
  if (completedIds.has(today) && completedIds.size >= 365) return null;
  return { kind: 'today', storyId: today };
}
