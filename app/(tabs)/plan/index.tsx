import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import { DEPTH_X, ROW_HEIGHT, buildThread, type ThreadRow } from '@/components/thread/buildThread';
import { DUR, timing } from '@/constants/Motion';
import { ThreadColors, inkHex } from '@/constants/Colors';
import type { ThreadPalette } from '@/constants/Colors';
import { dominantInk } from '@/utils/ink';
import { localizeStoryTitle, localizeBookName } from '@/utils/localize';
import { bibleLoader } from '@/services/BibleLoader';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { hapticImpactLight, hapticSelection } from '@/utils/haptics';
import { formatReadingMinutes, getSegmentReadingTime } from '@/utils/readingTime';
import {
  getActivePlanFromDB,
  getPlanProgress,
  getChallengeProgress,
  startPlan,
  startChallenge,
  pausePlan,
  resumePlan,
  endPlan,
  pauseChallenge,
  resumeChallenge,
  endChallenge,
  getStartedPlansFromDB,
  getStartedChallengesFromDB,
  type StartedItem,
} from '@/api/sqlite';
import { getCompletedStoryIds } from '@/utils/threadProgress';
import {
  getCatalogItems,
  itemsByGroup,
  PLAN_GROUPS,
  nextUnreadStory,
  type CatalogItem,
  type PlanGroupId,
} from '@/utils/planCatalog';
import { openSegment } from '@/utils/openSegment';

const titles = SegmentTitles as Record<string, { title?: string; ref?: string; book?: string[] }>;
const AnimatedPath = Animated.createAnimatedComponent(Path);

const GROUP_LABELS: Record<PlanGroupId, { en: string; fr: string }> = {
  year: { en: 'Whole Year Plans', fr: 'Plans annuels' },
  monthly: { en: 'Monthly Challenges', fr: 'Défis mensuels' },
  mini: { en: 'Mini Studies', fr: 'Mini-études' },
};

const GROUP_COLORS: Record<PlanGroupId, string> = {
  year: '#007AFF',
  monthly: '#FF9800',
  mini: '#E91E63',
};

type ActivePlanData = {
  catalog: CatalogItem;
  started: StartedItem;
  completed: number;
  completedIds: Set<string>;
};

type RowKind = 'group' | 'plan' | 'story';

type VisibleRow = ThreadRow & {
  kind: RowKind;
  groupId?: PlanGroupId;
  catalogItem?: CatalogItem;
  storyId?: string;
  current?: boolean;
};

const PlanScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette: ThreadPalette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const lang = language.startsWith('fr') ? 'fr' : 'en';

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [activePlans, setActivePlans] = useState<ActivePlanData[]>([]);
  const [openGroup, setOpenGroup] = useState<PlanGroupId | null>(null);
  const [openPlanId, setOpenPlanId] = useState<string | null>(null);
  const [progressById, setProgressById] = useState<Record<string, { done: number; ids: string[] }>>({});
  const loading = useRef(false);

  const catalog = useMemo(() => getCatalogItems(), []);

  const loadData = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      const [completed, startedPlans, startedChallenges] = await Promise.all([
        getCompletedStoryIds(),
        getStartedPlansFromDB(),
        getStartedChallengesFromDB(),
      ]);
      setCompletedIds(completed);

      const allStarted = [...startedPlans, ...startedChallenges];
      const activeItems: ActivePlanData[] = [];
      const prog: Record<string, { done: number; ids: string[] }> = {};

      for (const item of catalog) {
        const progress =
          item.type === 'plan'
            ? await getPlanProgress(item.id)
            : await getChallengeProgress(item.id);
        prog[item.id] = {
          done: progress?.completedSegments || 0,
          ids: progress?.completedSegmentIds || [],
        };

        const started = allStarted.find((s) => s.id === item.id);
        if (started) {
          activeItems.push({
            catalog: item,
            started,
            completed: progress?.completedSegments || 0,
            completedIds: new Set(progress?.completedSegmentIds || []),
          });
        }
      }

      setProgressById(prog);
      setActivePlans(activeItems.sort((a, b) => (a.started.isActive ? -1 : 1) - (b.started.isActive ? -1 : 1)));
    } finally {
      loading.current = false;
    }
  }, [catalog]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const activeIds = useMemo(() => new Set(activePlans.map((a) => a.catalog.id)), [activePlans]);
  const grouped = useMemo(() => itemsByGroup(catalog, activeIds), [catalog, activeIds]);

  // Thread rows for the catalog browser
  const visibleRows: VisibleRow[] = useMemo(() => {
    const rows: VisibleRow[] = [];
    for (const groupId of PLAN_GROUPS) {
      const items = grouped[groupId];
      if (!items.length) continue;
      rows.push({
        key: `g-${groupId}`,
        kind: 'group',
        depth: 0,
        height: ROW_HEIGHT.division,
        groupId,
      });
      if (openGroup !== groupId) continue;
      for (const item of items) {
        rows.push({
          key: `p-${item.id}`,
          kind: 'plan',
          depth: 1,
          height: ROW_HEIGHT.book,
          catalogItem: item,
        });
        if (openPlanId !== item.id) continue;
        for (const storyId of item.stories) {
          const done = completedIds.has(storyId);
          const next = nextUnreadStory(item.stories, completedIds);
          const current = !done && next?.storyId === storyId;
          rows.push({
            key: storyId,
            kind: 'story',
            depth: 2,
            height: current ? ROW_HEIGHT.current : ROW_HEIGHT.story,
            storyId,
            current,
            catalogItem: item,
          });
        }
      }
    }
    return rows;
  }, [completedIds, grouped, openGroup, openPlanId]);

  const thread = useMemo(
    () => buildThread(visibleRows.map(({ key, depth, height }) => ({ key, depth, height }))),
    [visibleRows]
  );

  const progress = useSharedValue(0);
  const prevLength = useSharedValue(0);
  const scrollY = useSharedValue(0);

  useEffect(() => {
    if (!thread.length) return;
    const from = prevLength.value > 0 ? Math.min(prevLength.value / thread.length, 1) : 0;
    progress.value = from;
    progress.value = withTiming(1, timing(DUR.slow));
    prevLength.value = thread.length;
  }, [prevLength, progress, thread.length]);

  const pathProps = useAnimatedProps(() => ({
    strokeDashoffset: thread.length * (1 - progress.value),
  }));

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const bible = bibleLoader.getCurrentBible();

  const toggleGroup = (id: PlanGroupId) => {
    void hapticSelection();
    if (openGroup === id) {
      setOpenGroup(null);
      setOpenPlanId(null);
    } else {
      setOpenGroup(id);
      setOpenPlanId(null);
    }
  };

  const togglePlan = (id: string) => {
    void hapticSelection();
    setOpenPlanId((prev) => (prev === id ? null : id));
  };

  const handleStartPlan = async (item: CatalogItem) => {
    void hapticImpactLight();
    if (item.type === 'plan') {
      await startPlan(item.id);
    } else {
      await startChallenge(item.id);
    }
    await loadData();
    const next = nextUnreadStory(item.stories, completedIds);
    if (next) {
      openSegment(router, next.storyId, {
        planId: item.type === 'plan' ? item.id : undefined,
        challengeId: item.type === 'challenge' ? item.id : undefined,
      });
    }
  };

  const handlePauseResume = async (data: ActivePlanData) => {
    if (data.started.isPaused) {
      if (data.catalog.type === 'plan') await resumePlan(data.catalog.id);
      else await resumeChallenge(data.catalog.id);
    } else {
      if (data.catalog.type === 'plan') await pausePlan(data.catalog.id);
      else await pauseChallenge(data.catalog.id);
    }
    await loadData();
  };

  const handleEndPlan = (data: ActivePlanData) => {
    const label = data.catalog.type === 'plan' ? t('UI.alerts.endReadingPlan') : t('UI.alerts.endReadingChallenge');
    Alert.alert(label, t('UI.alerts.endConfirmation').replace('{title}', data.catalog.title), [
      { text: t('UI.alerts.cancel'), style: 'cancel' },
      {
        text: t('UI.alerts.end'),
        style: 'destructive',
        onPress: async () => {
          if (data.catalog.type === 'plan') await endPlan(data.catalog.id);
          else await endChallenge(data.catalog.id);
          await loadData();
        },
      },
    ]);
  };

  const renderActivePlan = (data: ActivePlanData) => {
    const { catalog: item, started, completed, completedIds: planCompleted } = data;
    const total = item.stories.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const next = nextUnreadStory(item.stories, planCompleted);
    const nextInfo = next ? titles[next.storyId] : null;
    const nextTitle = next && nextInfo
      ? localizeStoryTitle(next.storyId, nextInfo.title || next.storyId, language)
      : null;

    return (
      <Pressable
        key={item.id}
        onPress={() => {
          if (next) {
            openSegment(router, next.storyId, {
              planId: item.type === 'plan' ? item.id : undefined,
              challengeId: item.type === 'challenge' ? item.id : undefined,
            });
          } else {
            router.push(`/plan/${item.id}`);
          }
        }}
        style={[styles.activeCard, { backgroundColor: palette.surf, borderColor: started.isPaused ? palette.hair : palette.acc }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.activeKicker, { color: started.isPaused ? palette.mute : palette.acc }]}>
            {started.isPaused
              ? (lang === 'fr' ? 'En pause' : 'Paused')
              : next
                ? t('UI.thread.day', { n: next.day })
                : (lang === 'fr' ? 'Terminé' : 'Complete')}
          </Text>
          <Text style={[styles.activeTitle, { color: palette.ink }]}>{item.title}</Text>
          {nextTitle && (
            <Text style={[styles.activeMeta, { color: palette.mute }]}>
              {nextTitle}
              {nextInfo?.ref ? ` · ${nextInfo.book?.[0]} ${nextInfo.ref}` : ''}
            </Text>
          )}
          <View style={[styles.prog, { backgroundColor: palette.hair, marginTop: 8 }]}>
            <View style={[styles.progFill, { width: `${pct}%`, backgroundColor: palette.acc }]} />
          </View>
          <Text style={[styles.progText, { color: palette.mute }]}>
            {completed} {t('UI.thread.of')} {total}
          </Text>
        </View>
        <View style={styles.activeActions}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              handlePauseResume(data);
            }}
            hitSlop={12}
            style={[styles.actionCircle, { backgroundColor: started.isPaused ? palette.acc : '#FF9F0A' }]}
          >
            <Text style={{ color: '#fff', fontSize: 11 }}>{started.isPaused ? '▶' : '❚❚'}</Text>
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              handleEndPlan(data);
            }}
            hitSlop={12}
            style={[styles.actionCircle, { backgroundColor: palette.hair }]}
          >
            <Text style={{ color: palette.mute, fontSize: 11 }}>✕</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      <Animated.ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Active plans as standalone cards */}
        {activePlans.length > 0 && (
          <View style={styles.activeSection}>
            <Text style={[styles.lab, { color: palette.mute }]}>
              {lang === 'fr' ? 'Vos plans' : 'Your plans'}
            </Text>
            {activePlans.map(renderActivePlan)}
          </View>
        )}

        {/* Catalog browser using the thread layout */}
        <Text style={[styles.lab, { color: palette.mute, marginTop: activePlans.length > 0 ? 6 : 0 }]}>
          {t('UI.thread.plans')}
        </Text>

        <View style={[styles.threadWrap, { height: thread.height }]}>
          <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height={thread.height}>
            <AnimatedPath
              d={thread.d}
              fill="none"
              stroke={palette.thread}
              strokeWidth={1.5}
              strokeDasharray={thread.length}
              animatedProps={pathProps}
            />
          </Svg>
          {visibleRows.map((row, index) => {
            const mark = thread.marks[index];
            if (!mark) return null;

            if (row.kind === 'group' && row.groupId) {
              const items = grouped[row.groupId];
              const open = openGroup === row.groupId;
              const color = GROUP_COLORS[row.groupId];
              return (
                <Pressable
                  key={row.key}
                  onPress={() => toggleGroup(row.groupId!)}
                  style={[styles.threadRow, { height: row.height }]}
                >
                  <View
                    style={[
                      styles.knot,
                      {
                        left: mark.x - 6,
                        top: row.height / 2 - 6,
                        borderColor: palette.thread,
                        backgroundColor: open ? color : palette.bg,
                      },
                    ]}
                  />
                  <View style={[styles.rowBody, { paddingLeft: DEPTH_X[0] + 16 }]}>
                    <Text style={[styles.groupTitle, { color }]}>
                      {GROUP_LABELS[row.groupId][lang]}
                    </Text>
                    <Text style={[styles.groupSub, { color: palette.mute }]}>
                      {items.length} {items.length === 1 ? (lang === 'fr' ? 'plan' : 'plan') : (lang === 'fr' ? 'plans' : 'plans')}
                    </Text>
                  </View>
                  <Text style={[styles.countText, { color: palette.mute }]}>{items.length}</Text>
                </Pressable>
              );
            }

            if (row.kind === 'plan' && row.catalogItem) {
              const item = row.catalogItem;
              const open = openPlanId === item.id;
              const prog = progressById[item.id];
              const done = prog?.done || 0;
              return (
                <Pressable
                  key={row.key}
                  onPress={() => togglePlan(item.id)}
                  onLongPress={() => handleStartPlan(item)}
                  style={[styles.threadRow, { height: row.height }]}
                >
                  <View
                    style={[
                      styles.bead,
                      {
                        left: mark.x - 7,
                        top: row.height / 2 - 7,
                        borderColor: palette.bg,
                        backgroundColor: open ? palette.ink : 'transparent',
                        borderWidth: open ? 3 : 1.5,
                      },
                      !open && { borderColor: palette.thread, width: 8, height: 8, left: mark.x - 4, top: row.height / 2 - 4 },
                    ]}
                  />
                  <View style={[styles.rowBody, { paddingLeft: DEPTH_X[1] + 16 }]}>
                    <Text style={[styles.planTitle, { color: palette.ink }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.planMeta, { color: palette.mute }]}>
                      {item.stories.length} {t('UI.thread.stories')}
                      {done > 0 ? ` · ${done} ${t('UI.thread.read')}` : ''}
                      {item.chronologicalOrder ? ` · ${t('UI.thread.chronological')}` : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleStartPlan(item)}
                    hitSlop={12}
                    style={[styles.startBtn, { borderColor: palette.acc }]}
                  >
                    <Text style={{ color: palette.acc, fontSize: 9, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      {lang === 'fr' ? 'Démarrer' : 'Start'}
                    </Text>
                  </Pressable>
                </Pressable>
              );
            }

            if (row.kind === 'story' && row.storyId) {
              const id = row.storyId;
              const info = titles[id];
              const done = completedIds.has(id);
              const current = !!row.current;
              const colors = bible?.[id]?.colors;
              const ink = dominantInk(colors || {});
              const minutes = getSegmentReadingTime(id);
              const title = localizeStoryTitle(id, info?.title || id, language);
              const beadSize = current ? 15 : 14;
              return (
                <Pressable
                  key={row.key}
                  onPress={() => {
                    void hapticImpactLight();
                    router.push(`/${id}`);
                  }}
                  style={[styles.threadRow, { height: row.height }]}
                  hitSlop={12}
                >
                  <View
                    style={[
                      styles.bead,
                      {
                        width: beadSize,
                        height: beadSize,
                        borderRadius: beadSize / 2,
                        left: mark.x - beadSize / 2,
                        top: row.height / 2 - beadSize / 2,
                        borderWidth: 3,
                        borderColor: palette.bg,
                        backgroundColor: done
                          ? inkHex(ink, palette)
                          : current
                            ? palette.acc
                            : 'transparent',
                      },
                      !done && !current && { borderWidth: 1.5, borderColor: palette.thread, width: 8, height: 8, left: mark.x - 4, top: row.height / 2 - 4 },
                    ]}
                  />
                  <View style={[styles.storyText, { paddingLeft: DEPTH_X[2] + 16 }]}>
                    <Text
                      style={[
                        styles.storyTitle,
                        { color: done ? palette.mute : palette.ink },
                        current && styles.storyNow,
                      ]}
                    >
                      {title}
                    </Text>
                    <Text style={[styles.storyRef, { color: current ? palette.acc : palette.mute }]}>
                      {info?.book?.[0]} {info?.ref}
                      {minutes ? ` · ${formatReadingMinutes(minutes)}` : ''}
                      {done ? ` · ${t('UI.thread.read')}` : current ? ` · ${t('UI.thread.continue')}` : ''}
                    </Text>
                  </View>
                </Pressable>
              );
            }

            return null;
          })}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingBottom: 120 },
  lab: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase' },

  // Active plan cards
  activeSection: { marginBottom: 4 },
  activeCard: {
    marginHorizontal: 14,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeKicker: { fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '600' },
  activeTitle: { fontSize: 18, fontWeight: '600', marginTop: 2 },
  activeMeta: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 3 },
  activeActions: { gap: 8, alignItems: 'center' },
  actionCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  prog: { height: 4, borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%' },
  progText: { fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 3 },

  // Thread rows
  threadWrap: { position: 'relative', paddingTop: 0 },
  threadRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 14 },
  knot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1.5,
    transform: [{ rotate: '45deg' }],
  },
  bead: { position: 'absolute', width: 14, height: 14, borderRadius: 7, borderWidth: 3 },
  rowBody: { flex: 1 },
  groupTitle: { fontSize: 15, fontWeight: '600' },
  groupSub: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 },
  countText: { fontSize: 10, fontVariant: ['tabular-nums'] },
  planTitle: { fontSize: 14, fontWeight: '500' },
  planMeta: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  startBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  storyText: { flex: 1, paddingVertical: 6 },
  storyTitle: { fontSize: 14 },
  storyNow: { fontSize: 18, fontWeight: '600' },
  storyRef: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
});

export default PlanScreen;
