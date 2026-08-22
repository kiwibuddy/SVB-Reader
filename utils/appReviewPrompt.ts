import { getSetting, setSetting } from '@/services/sync-settings-manager';
import logger from '@/utils/logger';

const STREAK_THRESHOLD = 7;
const STORY_THRESHOLD = 10;

export async function maybeRequestReview(opts: {
  streak?: number;
  completedCount?: number;
  planCompleted?: boolean;
}): Promise<void> {
  const shouldAsk =
    opts.planCompleted === true ||
    (typeof opts.streak === 'number' && opts.streak >= STREAK_THRESHOLD) ||
    (typeof opts.completedCount === 'number' && opts.completedCount >= STORY_THRESHOLD);

  if (!shouldAsk) return;

  try {
    const alreadyShown = await getSetting('reviewPromptShown');
    if (alreadyShown === true) return;

    const StoreReview = await import('expo-store-review');
    const available = await StoreReview.isAvailableAsync();
    if (!available) return;
    const hasAction = await StoreReview.hasAction();
    if (!hasAction) return;

    await setSetting('reviewPromptShown', true);
    await StoreReview.requestReview();
  } catch (error) {
    logger.warn('Store review prompt skipped:', error);
  }
}
