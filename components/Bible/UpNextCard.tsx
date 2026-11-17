import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import { getChallengeProgress, getPlanProgress } from '@/api/sqlite';
import { ThreadColors } from '@/constants/Colors';
import { DUR, SPRING } from '@/constants/Motion';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getStoryNote } from '@/utils/chronologicalPlans';
import { hapticImpactLight } from '@/utils/haptics';
import { localizeStoryTitle, localizeVoiceName } from '@/utils/localize';
import { getLocalizedPlanText, nextUnreadStory, type CatalogItem } from '@/utils/planCatalog';
import { getPlanStartIndex } from '@/utils/planStartIndex';
import { formatReadingMinutes, getSegmentReadingTime } from '@/utils/readingTime';
import { datedWindow, dateForDay, daysBetween, formatShortDate } from '@/utils/seasonalPlans';
import { neighbours } from '@/utils/storyOrder';
import { voiceForPlan } from '@/utils/voicePlans';
import { shortStoryId } from '@/utils/threadProgress';

const titles = SegmentTitles as Record<string, { title?: string; ref?: string; book?: string[] }>;

type Props = {
  /** The story just finished. */
  storyId: string;
  /** Reading order for the context the story was opened from. */
  order: string[];
  /** The plan the story was read in, if any. */
  plan?: CatalogItem | null;
  voice?: string | null;
};

type Choice = {
  kicker: string;
  title: string;
  meta?: string;
  note?: string;
  primary: { label: string; go: () => void };
  secondary?: { label: string; go: () => void };
};

/**
 * Shown under the Done button once a story is finished: what comes next in the
 * plan, voice or Bible the story was opened from. Replaces the old automatic
 * jump back to the list, so the questions below stay reachable.
 */
export default function UpNextCard({ storyId, order, plan, voice }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDarkMode, language } = useSyncAppSettings();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const [done, setDone] = useState<Set<string> | null>(plan ? null : new Set());

  useEffect(() => {
    if (!plan) return;
    let alive = true;
    (async () => {
      const progress =
        plan.type === 'plan' ? await getPlanProgress(plan.id) : await getChallengeProgress(plan.id);
      if (!alive) return;
      const ids = new Set((progress?.completedSegmentIds || []).map(shortStoryId));
      ids.add(storyId);
      setDone(ids);
    })();
    return () => {
      alive = false;
    };
  }, [plan, storyId]);

  if (!done) return null;

  const planVoice = plan ? voiceForPlan(plan.id) : null;
  const ctx = plan
    ? plan.type === 'plan'
      ? { planId: plan.id, ...(planVoice ? { voice: planVoice } : {}) }
      : { challengeId: plan.id }
    : voice
      ? { voice }
      : {};
  const open = (id: string) => {
    void hapticImpactLight();
    router.replace({ pathname: '/[segment]', params: { segment: id, ...ctx } });
  };
  const backToPlan = () => {
    void hapticImpactLight();
    router.replace({ pathname: '/plan/[id]', params: { id: plan!.id, completedSegment: storyId } });
  };
  const backToRead = () => {
    void hapticImpactLight();
    router.replace({ pathname: '/(tabs)/Home', params: { completedSegment: storyId } });
  };
  const backToCast = () => {
    void hapticImpactLight();
    router.replace({ pathname: '/cast/[voice]', params: { voice: voice || '' } });
  };

  const storyTitle = (id: string) => localizeStoryTitle(id, titles[id]?.title || id, language);
  const storyMeta = (id: string) => {
    const info = titles[id];
    const minutes = getSegmentReadingTime(id);
    return `${info?.book?.[0] || ''} ${info?.ref || ''}${minutes ? ` · ${formatReadingMinutes(minutes)}` : ''}`;
  };

  let choice: Choice | null = null;
  if (plan) {
    const next = nextUnreadStory(order, done, getPlanStartIndex(plan.id));
    const planTitle = getLocalizedPlanText(plan, 'title', language);
    if (!next) {
      choice = {
        kicker: t('UI.upNext.planComplete'),
        title: planTitle,
        primary: { label: t('UI.upNext.backToPlan'), go: backToPlan },
      };
    } else {
      const window = plan.isUserPlan ? null : datedWindow(plan.id, order.length);
      const nextDate = window ? dateForDay(window, next.day - 1) : null;
      const ahead = nextDate ? daysBetween(new Date(), nextDate) : 0;
      const note = getStoryNote(plan.chronologicalMapping, next.storyId, language);
      if (nextDate && ahead > 0) {
        const date = formatShortDate(nextDate, language);
        choice = {
          kicker: ahead === 1 ? t('UI.upNext.tomorrow', { date }) : t('UI.upNext.nextOn', { date }),
          title: storyTitle(next.storyId),
          meta: storyMeta(next.storyId),
          note,
          primary: { label: t('UI.upNext.backToPlan'), go: backToPlan },
          secondary: { label: t('UI.upNext.readAhead'), go: () => open(next.storyId) },
        };
      } else {
        choice = {
          kicker: t('UI.upNext.nextDay', { n: next.day }),
          title: storyTitle(next.storyId),
          meta: storyMeta(next.storyId),
          note,
          primary: { label: t('UI.upNext.nextStory'), go: () => open(next.storyId) },
          secondary: { label: t('UI.upNext.backToPlan'), go: backToPlan },
        };
      }
    }
  } else {
    const next = neighbours(order, storyId).next;
    const back = voice
      ? { label: t('UI.upNext.backToCast'), go: backToCast }
      : { label: t('UI.upNext.backToRead'), go: backToRead };
    choice = next
      ? {
          kicker: voice
            ? t('UI.upNext.nextWith', { name: localizeVoiceName(voice, language) })
            : t('UI.upNext.nextStory'),
          title: storyTitle(next),
          meta: storyMeta(next),
          primary: { label: t('UI.upNext.nextStory'), go: () => open(next) },
          secondary: back,
        }
      : { kicker: t('UI.thread.end'), title: storyTitle(storyId), primary: back };
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(DUR.base).springify().damping(SPRING.damping).stiffness(SPRING.stiffness)}
      style={[styles.card, { backgroundColor: palette.surf, borderColor: palette.hair }]}
    >
      <Text style={[styles.kicker, { color: palette.acc }]}>{choice.kicker}</Text>
      <Text style={[styles.title, { color: palette.ink }]}>{choice.title}</Text>
      {!!choice.meta && <Text style={[styles.meta, { color: palette.mute }]}>{choice.meta}</Text>}
      {!!choice.note && (
        <Text style={[styles.note, { color: palette.mute }]} numberOfLines={2}>
          {choice.note}
        </Text>
      )}
      <View style={styles.actions}>
        <Pressable
          onPress={choice.primary.go}
          accessibilityRole="button"
          style={[styles.primary, { backgroundColor: palette.acc }]}
        >
          <Text style={[styles.primaryText, { color: palette.bg }]}>{choice.primary.label}</Text>
        </Pressable>
        {choice.secondary && (
          <Pressable
            onPress={choice.secondary.go}
            accessibilityRole="button"
            style={[styles.secondary, { borderColor: palette.hair }]}
          >
            <Text style={[styles.secondaryText, { color: palette.ink }]}>{choice.secondary.label}</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  kicker: { fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '600', marginTop: 3 },
  meta: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginTop: 3 },
  note: { fontSize: 13, lineHeight: 18, marginTop: 5 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  primary: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  primaryText: { fontSize: 13, fontWeight: '700' },
  secondary: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  secondaryText: { fontSize: 13, fontWeight: '600' },
});
