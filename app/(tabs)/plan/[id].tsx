import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThreadList from '@/components/thread/ThreadList';
import { shortStoryId } from '@/utils/threadProgress';
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
import { findCatalogItem, nextUnreadStory, getLocalizedPlanText } from '@/utils/planCatalog';
import { openSegment } from '@/utils/openSegment';
import { hapticImpactLight } from '@/utils/haptics';

const PlanDetail = () => {
  const { id, completedSegment } = useLocalSearchParams<{ id: string; completedSegment?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isActive, setIsActive] = useState(false);
  const [planDone, setPlanDone] = useState(0);

  const item = useMemo(() => findCatalogItem(id), [id]);
  const storyFilter = useMemo(() => item?.stories || [], [item]);
  const minutes = useMemo(
    () => storyFilter.reduce((sum, sid) => sum + getSegmentReadingTime(sid), 0),
    [storyFilter]
  );
  const focusId = completedSegment ? shortStoryId(String(completedSegment)) : null;

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        if (!item) return;
        const [activePlan, progress] = await Promise.all([
          getActivePlanFromDB(),
          item.type === 'plan' ? getPlanProgress(item.id) : getChallengeProgress(item.id),
        ]);
        if (!alive) return;
        setIsActive(activePlan?.planId === id || activePlan?.itemID === id);
        const ids = new Set((progress?.completedSegmentIds || []).map(shortStoryId));
        setCompletedIds(ids);
        setPlanDone(progress?.completedSegments || 0);
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
  const storyNav =
    item.type === 'plan'
      ? { planId: item.id }
      : { challengeId: item.id };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={{ color: palette.mute, letterSpacing: 1.4, textTransform: 'uppercase', fontSize: 11 }}>
          ‹ {t('UI.tabs.plan')}
        </Text>
      </Pressable>
      <Text style={[styles.title, { color: palette.ink }]}>{getLocalizedPlanText(item, 'title', language)}</Text>
      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: palette.mute }]}>
          {storyFilter.length} {t('UI.thread.stories')} · {formatReadingMinutes(minutes)}
          {planDone > 0 ? ` · ${planDone} ${t('UI.thread.read')}` : ''}
          {item.chronologicalOrder ? ` · ${t('UI.thread.chronological')}` : ''}
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
            <View style={[styles.progFill, { width: `${pct}%`, backgroundColor: palette.chor }]} />
          </View>
        </View>
      )}
      {(item.longDescription || item.longDescriptionFr || item.shortDescription || item.shortDescriptionFr) && (
        <Text style={[styles.desc, { color: palette.mute }]}>
          {getLocalizedPlanText(item, 'longDescription', language) || getLocalizedPlanText(item, 'shortDescription', language)}
        </Text>
      )}
      <ThreadList
        completedIds={completedIds}
        currentId={focusId}
        storyFilter={storyFilter}
        hideSearch
        storyNav={storyNav}
      />
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
