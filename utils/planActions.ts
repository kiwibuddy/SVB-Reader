import { purgeChallengeProgressBefore, setChallengeStartDate, startChallenge, startPlan } from '@/api/sqlite';
import type { CatalogItem } from '@/utils/planCatalog';
import { setPlanStartIndex } from '@/utils/planStartIndex';
import {
  ADVENT_PLAN_ID,
  datedWindow,
  isSeasonalPlanId,
  seasonProgressCutoff,
  todayIndex,
} from '@/utils/seasonalPlans';
import { rescheduleReadingReminders, requestNotificationPermission } from '@/utils/readingReminders';

/**
 * Start a curated plan. Seasonal plans first forget last season's progress
 * and record today as their start date. `startIndex` is the 0-based story a
 * late joiner chose to begin with.
 */
export async function startCatalogPlan(item: CatalogItem, startIndex = 0): Promise<void> {
  const seasonal = isSeasonalPlanId(item.id);
  if (seasonal) {
    const cutoff = seasonProgressCutoff(item.id);
    if (cutoff) await purgeChallengeProgressBefore(item.id, cutoff);
  }
  if (item.type === 'plan') await startPlan(item.id);
  else await startChallenge(item.id);
  if (seasonal && item.type === 'challenge') {
    await setChallengeStartDate(item.id, new Date().toISOString());
  }
  await setPlanStartIndex(item.id, startIndex);

  if (item.id === ADVENT_PLAN_ID) {
    // Joining is the opt-in for Advent reminders.
    await requestNotificationPermission();
    await rescheduleReadingReminders();
  }
}

/**
 * For a dated plan joined after its first day: the 0-based index of today's
 * reading. Null when there is no choice to offer (not dated, before or on
 * Day 1, or after the last day).
 */
export function lateJoinIndex(item: CatalogItem, date: Date = new Date()): number | null {
  const window = datedWindow(item.id, item.stories.length, date);
  if (!window) return null;
  const index = todayIndex(window, date);
  if (index < 1 || index >= window.days) return null;
  return index;
}
