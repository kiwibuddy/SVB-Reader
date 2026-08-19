import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThreadList from '@/components/thread/ThreadList';
import { getCompletedStoryIds } from '@/utils/threadProgress';
import { ThreadColors } from '@/constants/Colors';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getSegmentReadingTime, formatReadingMinutes } from '@/utils/readingTime';
import {
  getActivePlanFromDB,
  startPlan,
  startChallenge,
  getPlanProgress,
  getChallengeProgress,
} from '@/api/sqlite';
import { findCatalogItem, nextUnreadStory } from '@/utils/planCatalog';
import { openSegment } from '@/utils/openSegment';
import { hapticImpactLight } from '@/utils/haptics';

const PlanDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const lang = language.startsWith('fr') ? 'fr' : 'en';
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isActive, setIsActive] = useState(false);
  const [planDone, setPlanDone] = useState(0);

  const item = useMemo(() => findCatalogItem(id), [id]);
  const storyFilter = useMemo(() => item?.stories || [], [item]);
  const minutes = useMemo(
    () => storyFilter.reduce((sum, sid) => sum + getSegmentReadingTime(sid), 0),
    [storyFilter]
  );

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [completed, activePlan] = await Promise.all([
          getCompletedStoryIds(),
          getActivePlanFromDB(),
        ]);
        if (!alive) return;
        setCompletedIds(completed);
        setIsActive(activePlan?.planId === id || activePlan?.itemID === id);

        if (item) {
          const progress =
            item.type === 'plan'
              ? await getPlanProgress(item.id)
              : await getChallengeProgress(item.id);
          if (alive) setPlanDone(progress?.completedSegments || 0);
        }
      })();
      return () => { alive = false; };
    }, [id, item])
  );

  if (!item) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Text>Not found</Text>
      </View>
    );
  }

  const handleStart = async () => {
    void hapticImpactLight();
    if (item.type === 'plan') await startPlan(item.id);
    else await startChallenge(item.id);
    setIsActive(true);
    const next = nextUnreadStory(item.stories, completedIds);
    if (next) {
      openSegment(router, next.storyId, {
        planId: item.type === 'plan' ? item.id : undefined,
        challengeId: item.type === 'challenge' ? item.id : undefined,
      });
    }
  };

  const pct = item.stories.length > 0 ? Math.round((planDone / item.stories.length) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={{ color: palette.mute, letterSpacing: 1.4, textTransform: 'uppercase', fontSize: 11 }}>
          ‹ {t('UI.tabs.plan')}
        </Text>
      </Pressable>
      <Text style={[styles.title, { color: palette.ink }]}>{item.title}</Text>
      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: palette.mute }]}>
          {storyFilter.length} {t('UI.thread.stories')} · {formatReadingMinutes(minutes)}
          {planDone > 0 ? ` · ${planDone} ${t('UI.thread.read')}` : ''}
        </Text>
        {!isActive && (
          <Pressable onPress={handleStart} style={[styles.startBtn, { borderColor: palette.acc }]}>
            <Text style={{ color: palette.acc, fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              {item.type === 'plan' ? t('UI.startConfirmation.startPlan') : t('UI.startConfirmation.startChallenge')}
            </Text>
          </Pressable>
        )}
      </View>
      {planDone > 0 && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 8 }}>
          <View style={[styles.prog, { backgroundColor: palette.hair }]}>
            <View style={[styles.progFill, { width: `${pct}%`, backgroundColor: palette.acc }]} />
          </View>
        </View>
      )}
      {item.longDescription && (
        <Text style={[styles.desc, { color: palette.mute }]}>{item.longDescription}</Text>
      )}
      <ThreadList completedIds={completedIds} storyFilter={storyFilter} hideSearch />
    </View>
  );
};

const styles = StyleSheet.create({
  back: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 6 },
  title: { fontSize: 22, fontWeight: '600', paddingHorizontal: 14, paddingBottom: 2, letterSpacing: -0.4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 8 },
  meta: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', flex: 1 },
  startBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  prog: { height: 4, borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%' },
  desc: { fontSize: 13, lineHeight: 18, paddingHorizontal: 14, paddingBottom: 8 },
});

export default PlanDetail;
