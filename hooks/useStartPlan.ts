import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { hapticImpactLight } from '@/utils/haptics';
import { openSegment } from '@/utils/openSegment';
import { lateJoinIndex, startCatalogPlan } from '@/utils/planActions';
import { nextUnreadStory, type CatalogItem } from '@/utils/planCatalog';
import { ADVENT_PLAN_ID, datedWindow, formatLongDate, todayIndex } from '@/utils/seasonalPlans';

export type StartOptions = {
  /** Stories already read in this plan this season. */
  completedIds?: Set<string>;
  /** Skip the late-join question: the reader already chose where to begin. */
  chosenStartIndex?: number;
};

/**
 * Start (or join) a plan the same way everywhere: the Plan tab, the plan
 * page, and the Advent card on both tabs.
 *
 * - A dated plan joined after Day 1 asks: today's reading, or Day 1?
 * - Joined before its first day: a "you're in" note, nothing opens yet.
 * - Otherwise the first story to read opens.
 */
export function useStartPlan(onStarted?: () => unknown) {
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useSyncAppSettings();

  const start = useCallback(
    (item: CatalogItem, opts: StartOptions = {}): Promise<void> => {
      const window = item.isUserPlan ? null : datedWindow(item.id, item.stories.length);
      const isAdvent = item.id === ADVENT_PLAN_ID;
      const completed = opts.completedIds ?? new Set<string>();

      const run = async (chosenStartIndex?: number): Promise<void> => {
        void hapticImpactLight();
        if (chosenStartIndex === undefined && window && completed.size === 0) {
          const late = lateJoinIndex(item);
          if (late !== null) {
            const date = formatLongDate(window.start, language);
            Alert.alert(
              isAdvent ? t('UI.advent.lateTitle', { date }) : t('UI.advent.lateTitleGeneric', { date }),
              t('UI.advent.lateBody', { n: late + 1 }),
              [
                { text: t('UI.alerts.cancel'), style: 'cancel' },
                { text: t('UI.advent.lateFromStart'), onPress: () => void run(0) },
                { text: t('UI.advent.lateToday'), onPress: () => void run(late) },
              ]
            );
            return;
          }
        }

        const startIndex = chosenStartIndex ?? 0;
        await startCatalogPlan(item, startIndex);
        await onStarted?.();

        if (window && todayIndex(window) < 0) {
          const date = formatLongDate(window.start, language);
          Alert.alert(
            isAdvent ? t('UI.advent.joinedTitle') : t('UI.advent.joinedTitleGeneric'),
            isAdvent ? t('UI.advent.joinedBody', { date }) : t('UI.advent.joinedBodyGeneric', { date })
          );
          return;
        }

        const next = nextUnreadStory(item.stories, completed, startIndex);
        if (next) {
          openSegment(router, next.storyId, {
            planId: item.type === 'plan' ? item.id : undefined,
            challengeId: item.type === 'challenge' ? item.id : undefined,
          });
        }
      };

      return run(opts.chosenStartIndex);
    },
    [language, onStarted, router, t]
  );

  return start;
}
