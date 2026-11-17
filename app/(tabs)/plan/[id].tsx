import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThreadList from '@/components/thread/ThreadList';
import PlanJourney from '@/components/thread/PlanJourney';
import { shortStoryId } from '@/utils/threadProgress';
import { ThreadColors } from '@/constants/Colors';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useStartPlan } from '@/hooks/useStartPlan';
import { getSegmentReadingTime, formatReadingMinutes } from '@/utils/readingTime';
import {
  getPlanProgress,
  getChallengeProgress,
  getStartedPlansFromDB,
  getStartedChallengesFromDB,
} from '@/api/sqlite';
import { getPlanStartIndex } from '@/utils/planStartIndex';
import { getLocalizedPlanText, type CatalogItem } from '@/utils/planCatalog';
import { findPlanItem, deleteUserPlan } from '@/api/userPlans';
import { openSegment } from '@/utils/openSegment';
import { datedWindow, formatDateRange, todayIndex } from '@/utils/seasonalPlans';

const PlanDetail = () => {
  const { id, completedSegment } = useLocalSearchParams<{ id: string; completedSegment?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isStarted, setIsStarted] = useState(false);
  const [planDone, setPlanDone] = useState(0);

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
        setLoading(true);
        const resolved = await findPlanItem(id);
        if (!alive) return;
        setItem(resolved || null);
        if (!resolved) {
          setLoading(false);
          return;
        }
        const [startedPlans, startedChallenges, progress] = await Promise.all([
          getStartedPlansFromDB(),
          getStartedChallengesFromDB(),
          resolved.type === 'plan' ? getPlanProgress(resolved.id) : getChallengeProgress(resolved.id),
        ]);
        if (!alive) return;
        // Plans and challenges both count — the old check only knew about plans.
        setIsStarted([...startedPlans, ...startedChallenges].some((s) => s.id === resolved.id));
        const ids = new Set((progress?.completedSegmentIds || []).map(shortStoryId));
        setCompletedIds(ids);
        setPlanDone(progress?.completedSegments || 0);
        setLoading(false);
      })();
      return () => {
        alive = false;
      };
    }, [id])
  );

  const start = useStartPlan(() => setIsStarted(true));

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top }} />;
  }

  if (!item) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: palette.bg }}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={{ color: palette.mute, letterSpacing: 1.4, textTransform: 'uppercase', fontSize: 11 }}>
            ‹ {t('UI.tabs.plan')}
          </Text>
        </Pressable>
        <Text style={{ paddingHorizontal: 14, color: palette.ink }}>Not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      t('UI.customPlans.delete'),
      t('UI.customPlans.deleteConfirm').replace('{title}', getLocalizedPlanText(item, 'title', language)),
      [
        { text: t('UI.alerts.cancel'), style: 'cancel' },
        {
          text: t('UI.customPlans.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteUserPlan(item.id);
            router.replace('/plan');
          },
        },
      ]
    );
  };

  const total = item.stories.length;
  const pct = total > 0 ? Math.round((planDone / total) * 100) : 0;
  const storyNav = item.type === 'plan' ? { planId: item.id } : { challengeId: item.id };
  const window = item.isUserPlan ? null : datedWindow(item.id, total);
  const today = window ? todayIndex(window) : -1;
  // Plans with their own reading order (weeks, dated days, notes) show their
  // journey in that order. Plans that simply walk the Bible keep the Bible
  // list, which folds 365 stories into divisions.
  const ownOrder = !!item.chronologicalMapping;

  const header = (
    <>
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={{ color: palette.mute, letterSpacing: 1.4, textTransform: 'uppercase', fontSize: 11 }}>
            ‹ {t('UI.tabs.plan')}
          </Text>
        </Pressable>
        {item.isUserPlan && (
          <Pressable onPress={handleDelete} hitSlop={10} style={styles.deleteBtn}>
            <Text style={{ color: palette.mute, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
              {t('UI.customPlans.delete')}
            </Text>
          </Pressable>
        )}
      </View>
      <Text style={[styles.title, { color: palette.ink }]}>{getLocalizedPlanText(item, 'title', language)}</Text>
      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: palette.mute }]}>
          {total} {t('UI.thread.stories')} · {formatReadingMinutes(minutes)}
          {window ? ` · ${formatDateRange(window, language)}` : item.chronologicalOrder ? ` · ${t('UI.thread.chronological')}` : ''}
        </Text>
        {!isStarted && (
          <Pressable
            onPress={() => start(item, { completedIds })}
            style={[styles.startBtn, { borderColor: palette.acc }]}
          >
            <Text style={{ color: palette.acc, fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              {item.type === 'plan' ? t('UI.startConfirmation.startPlan') : t('UI.startConfirmation.startChallenge')}
            </Text>
          </Pressable>
        )}
      </View>
      {(planDone > 0 || isStarted) && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 8 }}>
          <View style={[styles.prog, { backgroundColor: palette.hair }]}>
            <View style={[styles.progFill, { width: `${pct}%`, backgroundColor: palette.acc }]} />
          </View>
          <Text style={[styles.progText, { color: palette.mute }]}>
            {t('UI.planJourney.progress', { done: planDone, total, pct })}
            {window && today >= 0 && today < window.days
              ? ` · ${t('UI.planJourney.todayIs', { n: today + 1, total: window.days })}`
              : ''}
          </Text>
        </View>
      )}
      {(item.longDescription || item.longDescriptionFr || item.shortDescription || item.shortDescriptionFr) && (
        <Text style={[styles.desc, { color: palette.mute }]}>
          {getLocalizedPlanText(item, 'longDescription', language) || getLocalizedPlanText(item, 'shortDescription', language)}
        </Text>
      )}
    </>
  );

  if (ownOrder) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 180 }} showsVerticalScrollIndicator={false}>
          {header}
          <PlanJourney
            item={item}
            completedIds={completedIds}
            startIndex={getPlanStartIndex(item.id)}
            palette={palette}
            t={t}
            language={language}
            justCompletedId={focusId}
            onOpenStory={(storyId) => openSegment(router, storyId, storyNav)}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top }}>
      {header}
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
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 6 },
  deleteBtn: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 6 },
  title: { fontSize: 22, fontWeight: '600', paddingHorizontal: 14, paddingBottom: 2, letterSpacing: -0.4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 8 },
  meta: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', flex: 1 },
  startBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  prog: { height: 4, borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%' },
  progText: { fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4 },
  desc: { fontSize: 13, lineHeight: 18, paddingHorizontal: 14, paddingBottom: 8 },
});

export default PlanDetail;
