import dailyStoryMap from '@/assets/data/DailyStoryMap.json';
import readingPlansData from '@/assets/data/ReadingPlansChallenges.json';

const daily = dailyStoryMap as string[];

export type ContinueKind = 'today' | 'continue' | 'plan';

export type ContinueTarget = {
  kind: ContinueKind;
  storyId: string;
  day?: number;
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

function storyIdsFromSegments(segments: Record<string, { segments?: string[] } | undefined> | undefined): string[] {
  return Object.values(segments || {})
    .flatMap((entry) => entry?.segments || [])
    .filter((id) => id.startsWith('S'));
}

export function resolveContinueTarget(
  completedIds: Set<string>,
  lastReadId: string | null | undefined,
  activePlanId: string | null | undefined
): ContinueTarget | null {
  const last = lastReadId?.match(/S\d+/i)?.[0] || lastReadId || null;
  if (last && last.startsWith('S') && !completedIds.has(last)) {
    return { kind: 'continue', storyId: last };
  }

  if (activePlanId) {
    const plan = readingPlansData.plans.find((item) => item.id === activePlanId);
    const stories = storyIdsFromSegments(plan?.segments);
    const index = stories.findIndex((id) => !completedIds.has(id));
    if (index >= 0) {
      return { kind: 'plan', storyId: stories[index], day: index + 1 };
    }
  }

  const today = todayStoryId();
  if (completedIds.has(today) && completedIds.size >= 365) return null;
  return { kind: 'today', storyId: today };
}
