import { purgeChallengeProgressBefore } from '@/api/sqlite';
import { clearPlanStartIndex } from '@/utils/planStartIndex';
import {
  SEASONAL_PLAN_IDS,
  isSeasonalPlanOffered,
  seasonProgressCutoff,
} from '@/utils/seasonalPlans';
import logger from '@/utils/logger';

/**
 * While a seasonal plan is in season, forget progress saved in an earlier
 * season, so last year's Advent doesn't show as half-read this year.
 */
export async function refreshSeasonalProgress(date: Date = new Date()): Promise<void> {
  for (const planId of SEASONAL_PLAN_IDS) {
    if (!isSeasonalPlanOffered(planId, date)) continue;
    const cutoff = seasonProgressCutoff(planId, date);
    if (!cutoff) continue;
    try {
      if (await purgeChallengeProgressBefore(planId, cutoff)) {
        await clearPlanStartIndex(planId);
      }
    } catch (error) {
      logger.warn(`Could not refresh seasonal progress for ${planId}`, error);
    }
  }
}
