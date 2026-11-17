import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import { DEPTH_X, ROW_HEIGHT, buildThread, type ThreadRow } from '@/components/thread/buildThread';
import { BookBead } from '@/components/thread/ThreadBead';
import PlanJourney, { buildJourneyRows, renderJourneyRow, type JourneyRow } from '@/components/thread/PlanJourney';
import { useStartPlan } from '@/hooks/useStartPlan';
import { useThreadReveal } from '@/hooks/useThreadReveal';
import { ThreadRevealRow } from '@/components/thread/ThreadRevealRow';
import { ThreadColors } from '@/constants/Colors';
import type { ThreadPalette } from '@/constants/Colors';
import { localizeStoryTitle } from '@/utils/localize';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { hapticImpactLight, hapticSelection } from '@/utils/haptics';
import {
  getPlanProgress,
  getChallengeProgress,
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
import { shortStoryId } from '@/utils/threadProgress';
import {
  getAllCatalogItems,
  isCatalogItemOffered,
  itemsByGroup,
  PLAN_GROUPS,
  nextUnreadStory,
  getLocalizedPlanText,
  findCatalogItem,
  type CatalogItem,
  type PlanGroupId,
} from '@/utils/planCatalog';
import { getStoryNote } from '@/utils/chronologicalPlans';
import {
  ADVENT_PLAN_ID,
  datedWindow,
  dateForDay,
  formatDateRange,
  formatShortDate,
  todayIndex,
} from '@/utils/seasonalPlans';
import { getPlanStartIndex, loadPlanStartIndexes, planStartIndexesLoaded } from '@/utils/planStartIndex';
import { refreshSeasonalProgress } from '@/utils/seasonalProgress';
import AdventInvite from '@/components/thread/AdventInvite';
import { openSegment } from '@/utils/openSegment';
import { findPlanItem, listUserPlanCatalogItems, deleteUserPlan } from '@/api/userPlans';
import { isUserPlanId } from '@/utils/userPlans';
import { takePendingFocusUserPlan } from '@/utils/pendingPlanUI';

const titles = SegmentTitles as Record<string, { title?: string; ref?: string; book?: string[] }>;
const AnimatedPath = Animated.createAnimatedComponent(Path);

const GROUP_COPY: Record<PlanGroupId, { title: string; blurb: string }> = {
  year: { title: 'UI.planCategories.wholeYearPlans', blurb: 'UI.planCategories.wholeYearPlansBlurb' },
  monthly: { title: 'UI.planCategories.monthlyChallenges', blurb: 'UI.planCategories.monthlyChallengesBlurb' },
  mini: { title: 'UI.planCategories.miniStudies', blurb: 'UI.planCategories.miniStudiesBlurb' },
};

/** Title + blurb + meta — fits one title line without overflowing into the path. */
const PLAN_ROW_HEIGHT = 88;
/** Bead beside the first line of text, not mid-blurb / mid-empty. */
const PLAN_MARK = 18;

/** Long plans show a window around today's story under their card, plus "See all". */
const JOURNEY_WINDOW_OVER = 60;
const JOURNEY_WINDOW = { before: 3, after: 14 } as const;

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

/** A plan row in the catalog, or one row of an expanded plan's journey. */
type VisibleRow = ThreadRow & {
  kind: 'plan' | 'journey';
  catalogItem?: CatalogItem;
  journey?: JourneyRow;
};

const asVisible = (item: CatalogItem) => (r: JourneyRow): VisibleRow => ({
  key: r.key,
  depth: r.depth,
  height: r.height,
  markOffset: r.markOffset,
  kind: 'journey',
  journey: r,
  catalogItem: item,
});

const PlanScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ completedSegment?: string; expandedPlan?: string }>();
  const justCompletedId = params.completedSegment ? shortStoryId(String(params.completedSegment)) : null;
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette: ThreadPalette = isDarkMode ? ThreadColors.dark : ThreadColors.light;

  const [activePlans, setActivePlans] = useState<ActivePlanData[]>([]);
  /** All user-created plans, shown as expandable catalog-style rows (not detail pages / big cards). */
  const [userPlans, setUserPlans] = useState<CatalogItem[]>([]);
  const [userStartedById, setUserStartedById] = useState<Record<string, StartedItem>>({});
  const [openGroup, setOpenGroup] = useState<PlanGroupId | null>(null);
  const [openPlanId, setOpenPlanId] = useState<string | null>(null);
  /** The in-progress card whose journey is open. */
  const [openActiveId, setOpenActiveId] = useState<string | null>(null);
  const [progressById, setProgressById] = useState<Record<string, { done: number; ids: string[] }>>({});
  const loading = useRef(false);

  /** Every curated plan, so a seasonal plan someone started stays listed after its season. */
  const catalog = useMemo(() => getAllCatalogItems(), []);
  const [loaded, setLoaded] = useState(false);

  const loadData = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      if (!planStartIndexesLoaded()) await loadPlanStartIndexes();
      await refreshSeasonalProgress();
      const [startedPlans, startedChallenges, userCatalog] = await Promise.all([
        getStartedPlansFromDB(),
        getStartedChallengesFromDB(),
        listUserPlanCatalogItems(),
      ]);

      const allStarted = [...startedPlans, ...startedChallenges];
      const catalogActive: ActivePlanData[] = [];
      const prog: Record<string, { done: number; ids: string[] }> = {};
      const userStarted: Record<string, StartedItem> = {};

      for (const item of catalog) {
        const progress =
          item.type === 'plan'
            ? await getPlanProgress(item.id)
            : await getChallengeProgress(item.id);
        prog[item.id] = {
          done: progress?.completedSegments || 0,
          ids: (progress?.completedSegmentIds || []).map(shortStoryId),
        };

        const started = allStarted.find((s) => s.id === item.id);
        if (started) {
          catalogActive.push({
            catalog: item,
            started,
            completed: progress?.completedSegments || 0,
            completedIds: new Set((progress?.completedSegmentIds || []).map(shortStoryId)),
          });
        }
      }

      for (const item of userCatalog) {
        const progress = await getPlanProgress(item.id);
        prog[item.id] = {
          done: progress?.completedSegments || 0,
          ids: (progress?.completedSegmentIds || []).map(shortStoryId),
        };
        const started = allStarted.find((s) => s.id === item.id);
        if (started) userStarted[item.id] = started;
      }

      const sortActive = (list: ActivePlanData[]) =>
        list.sort((a, b) => (a.started.isActive ? -1 : 1) - (b.started.isActive ? -1 : 1));

      setProgressById(prog);
      setLoaded(true);
      setActivePlans(sortActive(catalogActive));
      setUserPlans(userCatalog);
      setUserStartedById(userStarted);
    } finally {
      loading.current = false;
    }
  }, [catalog]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      // After create: stay on the list. A plan made from the Create screen stays
      // collapsed; a "Follow a voice" plan opens so its stories show.
      const pending = takePendingFocusUserPlan();
      setOpenGroup(null);
      if (pending?.expand) setOpenPlanId(pending.id);
    }, [loadData])
  );

  useEffect(() => {
    const expandId = params.expandedPlan ? String(params.expandedPlan) : null;
    if (!expandId) return;
    (async () => {
      const item = findCatalogItem(expandId) || (await findPlanItem(expandId));
      if (!item || item.isUserPlan) return;
      // Older reminders link here; open the plan in the catalog and, if it is
      // already started, its journey under the active card.
      setOpenGroup(item.group);
      setOpenPlanId(item.id);
      setOpenActiveId(item.id);
    })();
  }, [params.expandedPlan]);

  const activeIds = useMemo(() => new Set(activePlans.map((a) => a.catalog.id)), [activePlans]);
  const grouped = useMemo(
    () => itemsByGroup(catalog.filter((item) => isCatalogItemOffered(item)), activeIds),
    [catalog, activeIds]
  );

  // Thread rows for the expanded group (only when a group is open)
  const visibleRows: VisibleRow[] = useMemo(() => {
    if (!openGroup) return [];
    const items = grouped[openGroup];
    if (!items?.length) return [];
    const rows: VisibleRow[] = [];
    for (const item of items) {
      rows.push({
        key: `p-${item.id}`,
        kind: 'plan',
        depth: 0,
        height: PLAN_ROW_HEIGHT,
        markOffset: PLAN_MARK,
        catalogItem: item,
      });
      if (openPlanId !== item.id) continue;
      rows.push(
        ...buildJourneyRows(item, {
          completedIds: new Set(progressById[item.id]?.ids || []),
          startIndex: getPlanStartIndex(item.id),
          windowWidth,
          t,
          language,
          baseDepth: 1,
        }).map(asVisible(item))
      );
    }
    return rows;
  }, [grouped, openGroup, openPlanId, progressById, t, language, windowWidth]);

  // Stories under the expanded custom plan — depth 0 anchor + depth 1 stories
  // so the thread curves like catalog plan → story (same-depth rows stay vertical).
  const userStoryRows: VisibleRow[] = useMemo(() => {
    const rows: VisibleRow[] = [];
    const item = userPlans.find((p) => p.id === openPlanId);
    if (!item) return rows;
    rows.push({
      key: `up-anchor-${item.id}`,
      kind: 'plan',
      depth: 0,
      height: ROW_HEIGHT.book,
      markOffset: PLAN_MARK,
      catalogItem: item,
    });
    rows.push(
      ...buildJourneyRows(item, {
        completedIds: new Set(progressById[item.id]?.ids || []),
        startIndex: getPlanStartIndex(item.id),
        windowWidth,
        t,
        language,
        baseDepth: 1,
      }).map(asVisible(item))
    );
    return rows;
  }, [userPlans, openPlanId, progressById, t, language, windowWidth]);

  const thread = useMemo(
    () =>
      buildThread(
        visibleRows.map(({ key, depth, height, markOffset }) => ({ key, depth, height, markOffset })),
        { width: windowWidth, entry: 'left', exit: 'left' }
      ),
    [visibleRows, windowWidth]
  );

  const userStoryThread = useMemo(
    () =>
      buildThread(
        userStoryRows.map(({ key, depth, height, markOffset }) => ({ key, depth, height, markOffset })),
        { width: windowWidth, entry: 'left', exit: 'left' }
      ),
    [userStoryRows, windowWidth]
  );

  const { progress, pathProps } = useThreadReveal(thread.length, { replayOnFocus: false });
  const { progress: userProgress, pathProps: userPathProps } = useThreadReveal(userStoryThread.length, {
    replayOnFocus: false,
  });
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

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

  const toggleUserPlan = (id: string) => {
    void hapticSelection();
    setOpenGroup(null);
    setOpenPlanId((prev) => (prev === id ? null : id));
  };

  const startPlanFlow = useStartPlan(loadData);
  const handleStartPlan = (item: CatalogItem, chosenStartIndex?: number) =>
    startPlanFlow(item, {
      completedIds: new Set(progressById[item.id]?.ids || []),
      chosenStartIndex,
    });

  const openStoryIn = (item: CatalogItem) => (storyId: string) =>
    openSegment(router, storyId, {
      planId: item.type === 'plan' ? item.id : undefined,
      challengeId: item.type === 'challenge' ? item.id : undefined,
    });

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
    const isUser = !!data.catalog.isUserPlan || isUserPlanId(data.catalog.id);
    const label = data.catalog.type === 'plan' ? t('UI.alerts.endReadingPlan') : t('UI.alerts.endReadingChallenge');
    const message = t('UI.alerts.endConfirmation').replace(
      '{title}',
      getLocalizedPlanText(data.catalog, 'title', language)
    );
    const buttons: {
      text: string;
      style?: 'cancel' | 'destructive' | 'default';
      onPress?: () => void;
    }[] = [
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
    ];
    if (isUser) {
      buttons.push({
        text: t('UI.customPlans.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteUserPlan(data.catalog.id);
          await loadData();
        },
      });
    }
    Alert.alert(label, message, buttons);
  };

  const handlePauseResumeUser = async (item: CatalogItem) => {
    const started = userStartedById[item.id];
    if (!started) return;
    if (started.isPaused) await resumePlan(item.id);
    else await pausePlan(item.id);
    await loadData();
  };

  const handleDeleteUserPlan = (item: CatalogItem) => {
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
            if (openPlanId === item.id) setOpenPlanId(null);
            await loadData();
          },
        },
      ]
    );
  };

  const handleEndUserPlan = (item: CatalogItem) => {
    Alert.alert(
      t('UI.alerts.endReadingPlan'),
      t('UI.alerts.endConfirmation').replace('{title}', getLocalizedPlanText(item, 'title', language)),
      [
        { text: t('UI.alerts.cancel'), style: 'cancel' },
        {
          text: t('UI.alerts.end'),
          style: 'destructive',
          onPress: async () => {
            await endPlan(item.id);
            await loadData();
          },
        },
        {
          text: t('UI.customPlans.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteUserPlan(item.id);
            if (openPlanId === item.id) setOpenPlanId(null);
            await loadData();
          },
        },
      ]
    );
  };

  const renderActivePlan = (data: ActivePlanData) => {
    const { catalog: item, started, completed, completedIds: planCompleted } = data;
    const total = item.stories.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const next = nextUnreadStory(item.stories, planCompleted, getPlanStartIndex(item.id));
    const nextInfo = next ? titles[next.storyId] : null;
    const nextTitle = next && nextInfo
      ? localizeStoryTitle(next.storyId, nextInfo.title || next.storyId, language)
      : null;
    const nextNote = next ? getStoryNote(item.chronologicalMapping, next.storyId, language) : undefined;
    const window = item.isUserPlan ? null : datedWindow(item.id, total);
    const beforeStart = !!window && todayIndex(window) < 0;
    const dayLabel = !next
      ? null
      : beforeStart && window
        ? t('UI.advent.startsOn', { date: formatShortDate(window.start, language) })
        : window
          ? t('UI.advent.dayDate', { n: next.day, date: formatShortDate(dateForDay(window, next.day - 1), language) })
          : t('UI.thread.day', { n: next.day });

    const journeyOpen = openActiveId === item.id;
    const todayIdx = window ? todayIndex(window) : -1;
    const continueLabel = beforeStart && window
      ? t('UI.advent.startsOn', { date: formatShortDate(window.start, language) })
      : completed > 0
        ? t('UI.planJourney.continue')
        : t('UI.planJourney.startDay', { n: next?.day ?? 1 });

    return (
      <View key={item.id}>
      <Pressable
        onPress={() => {
          void hapticSelection();
          setOpenActiveId((prev) => (prev === item.id ? null : item.id));
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: journeyOpen }}
        accessibilityHint={journeyOpen ? t('UI.planJourney.hideJourney') : t('UI.planJourney.showJourney')}
        style={[styles.activeCard, { backgroundColor: palette.surf, borderColor: started.isPaused ? palette.hair : palette.acc }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.activeKicker, { color: started.isPaused ? palette.mute : palette.acc }]}>
            {started.isPaused
              ? t('UI.planJourney.paused')
              : dayLabel ?? t('UI.planJourney.complete')}
          </Text>
          <Text style={[styles.activeTitle, { color: palette.ink }]}>{getLocalizedPlanText(item, 'title', language)}</Text>
          {!!getLocalizedPlanText(item, 'shortDescription', language) && (
            <Text style={[styles.planBlurb, { color: palette.mute }]} numberOfLines={2}>
              {getLocalizedPlanText(item, 'shortDescription', language)}
            </Text>
          )}
          {nextTitle && (
            <Text style={[styles.activeMeta, { color: palette.mute }]}>
              {nextTitle}
              {nextInfo?.ref ? ` · ${nextInfo.book?.[0]} ${nextInfo.ref}` : ''}
            </Text>
          )}
          {!!nextNote && !started.isPaused && (
            <Text style={[styles.activeNote, { color: palette.mute }]} numberOfLines={2}>
              {nextNote}
            </Text>
          )}
          <View style={[styles.prog, { backgroundColor: palette.hair, marginTop: 8 }]}>
            <View style={[styles.progFill, { width: `${pct}%`, backgroundColor: palette.acc }]} />
          </View>
          <Text style={[styles.progText, { color: palette.mute }]}>
            {t('UI.planJourney.progress', { done: completed, total, pct })}
            {window && todayIdx >= 0 && todayIdx < window.days
              ? ` · ${t('UI.planJourney.todayIs', { n: todayIdx + 1, total: window.days })}`
              : ''}
          </Text>
          <View style={styles.activeFoot}>
            {next && !started.isPaused && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  void hapticImpactLight();
                  openStoryIn(item)(next.storyId);
                }}
                accessibilityRole="button"
                hitSlop={8}
                style={[styles.continueBtn, { backgroundColor: palette.acc }]}
              >
                <Text style={[styles.continueText, { color: palette.bg }]}>{continueLabel}</Text>
              </Pressable>
            )}
            <View style={styles.chevron}>
              <Text style={[styles.chevronText, { color: palette.mute }]}>
                {journeyOpen ? t('UI.planJourney.hideJourney') : t('UI.planJourney.showJourney')}
              </Text>
              <Ionicons name={journeyOpen ? 'chevron-up' : 'chevron-down'} size={14} color={palette.mute} />
            </View>
          </View>
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
      {journeyOpen && (
        <View style={styles.activeJourney}>
          <PlanJourney
            item={item}
            completedIds={planCompleted}
            startIndex={getPlanStartIndex(item.id)}
            palette={palette}
            t={t}
            language={language}
            justCompletedId={justCompletedId}
            limit={item.stories.length > JOURNEY_WINDOW_OVER ? JOURNEY_WINDOW : undefined}
            onOpenStory={openStoryIn(item)}
            onSeeAll={() => router.push(`/plan/${item.id}`)}
          />
        </View>
      )}
      </View>
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
        {loaded && (
          <AdventInvite
            palette={palette}
            language={language}
            started={activeIds.has(ADVENT_PLAN_ID)}
            onJoin={(item, startIndex) => handleStartPlan(item, startIndex)}
            onOpenPlan={() => {
              void hapticSelection();
              router.push(`/plan/${ADVENT_PLAN_ID}`);
            }}
          />
        )}

        {/* Catalog plans currently in progress */}
        {activePlans.length > 0 && (
          <View style={styles.activeSection}>
            <Text style={[styles.lab, { color: palette.mute }]}>
              {t('UI.customPlans.inProgress')}
            </Text>
            {activePlans.map(renderActivePlan)}
          </View>
        )}

        {/* Curated catalog */}
        <Text style={[styles.lab, { color: palette.mute, marginTop: activePlans.length > 0 ? 6 : 0 }]}>
          {t('UI.thread.plans')}
        </Text>

        {PLAN_GROUPS.map((groupId) => {
          const items = grouped[groupId];
          if (!items.length) return null;
          const open = openGroup === groupId;
          const color = GROUP_COLORS[groupId];
          return (
            <View key={groupId}>
              <Pressable
                onPress={() => toggleGroup(groupId)}
                style={[styles.groupRow, { borderBottomColor: palette.hair }]}
              >
                <View style={[styles.groupDot, { backgroundColor: color }]} />
                <View style={styles.rowBody}>
                  <Text style={[styles.groupTitle, { color: palette.ink }]}>
                    {t(GROUP_COPY[groupId].title)}
                  </Text>
                  <Text style={[styles.groupBlurb, { color: palette.mute }]} numberOfLines={2}>
                    {t(GROUP_COPY[groupId].blurb)}
                  </Text>
                  <Text style={[styles.groupSub, { color: palette.mute }]}>
                    {items.length} {items.length === 1 ? t('UI.planCategories.plan') : t('UI.planCategories.plans')}
                  </Text>
                </View>
                <Text style={[styles.countText, { color: palette.mute }]}>{items.length}</Text>
              </Pressable>

              {open && thread.length > 0 && (
                <View style={[styles.threadWrap, { height: thread.height }]}>
                  <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height={thread.height}>
                    <AnimatedPath
                      d={thread.d}
                      fill="none"
                      stroke={palette.thread}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={thread.length}
                      animatedProps={pathProps}
                    />
                  </Svg>
                  {visibleRows.map((row, index) => {
                    const mark = thread.marks[index];
                    if (!mark) return null;

                    if (row.kind === 'plan' && row.catalogItem) {
                      const item = row.catalogItem;
                      const planOpen = openPlanId === item.id;
                      const prog = progressById[item.id];
                      const done = prog?.done || 0;
                      return (
                        <ThreadRevealRow key={row.key} index={index} total={visibleRows.length} progress={progress}>
                          <Pressable
                            onPress={() => togglePlan(item.id)}
                            style={[styles.threadRow, styles.planThreadRow, { height: row.height }]}
                          >
                            <BookBead x={mark.x} rowHeight={row.height} open={planOpen} palette={palette} anchor={PLAN_MARK} />
                            <View
                              style={[
                                styles.rowBody,
                                { paddingLeft: DEPTH_X[0] + 16 },
                              ]}
                            >
                              <Text style={[styles.planTitle, { color: palette.ink }]} numberOfLines={2}>
                                {getLocalizedPlanText(item, 'title', language)}
                              </Text>
                              {!!getLocalizedPlanText(item, 'shortDescription', language) && (
                                <Text style={[styles.planBlurb, { color: palette.mute }]} numberOfLines={2}>
                                  {getLocalizedPlanText(item, 'shortDescription', language)}
                                </Text>
                              )}
                              <Text style={[styles.planMeta, { color: palette.mute }]}>
                                {item.stories.length} {t('UI.thread.stories')}
                                {done > 0 ? ` · ${done} ${t('UI.thread.read')}` : ''}
                                {(() => {
                                  const window = datedWindow(item.id, item.stories.length);
                                  if (window) return ` · ${formatDateRange(window, language)}`;
                                  return item.chronologicalOrder ? ` · ${t('UI.thread.chronological')}` : '';
                                })()}
                              </Text>
                            </View>
                            <Pressable
                              onPress={() => handleStartPlan(item)}
                              hitSlop={12}
                              style={[styles.startBtn, { borderColor: palette.acc }]}
                            >
                              <Text style={{ color: palette.acc, fontSize: 9, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                                {t('UI.planJourney.start')}
                              </Text>
                            </Pressable>
                          </Pressable>
                        </ThreadRevealRow>
                      );
                    }

                    if (row.kind === 'journey' && row.journey && row.catalogItem) {
                      return (
                        <ThreadRevealRow key={row.key} index={index} total={visibleRows.length} progress={progress}>
                          {renderJourneyRow(row.journey, mark, {
                            palette,
                            t,
                            justCompletedId,
                            onOpenStory: openStoryIn(row.catalogItem),
                            onSeeAll: () => router.push(`/plan/${row.catalogItem!.id}`),
                          })}
                        </ThreadRevealRow>
                      );
                    }

                    return null;
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Your Plans — category-style plan rows; stories use plan thread when expanded */}
        <View style={styles.yourPlansSection}>
          <View style={styles.yourPlansHeader}>
            <Text style={[styles.lab, { color: palette.mute, flex: 1, paddingTop: 18 }]}>
              {t('UI.customPlans.section')}
            </Text>
            <Pressable
              onPress={() => {
                void hapticImpactLight();
                router.push('/plan/create');
              }}
              hitSlop={12}
              accessibilityLabel={t('UI.customPlans.add')}
              style={[styles.plusBtn, { borderColor: palette.acc }]}
            >
              <Text style={{ color: palette.acc, fontSize: 22, fontWeight: '400', lineHeight: 24 }}>＋</Text>
            </Pressable>
          </View>

          {userPlans.length === 0 && (
            <Text style={[styles.emptyHint, { color: palette.mute }]}>{t('UI.customPlans.empty')}</Text>
          )}

          {userPlans.map((item) => {
            const prog = progressById[item.id];
            const done = prog?.done || 0;
            const started = userStartedById[item.id];
            const total = item.stories.length;
            const open = openPlanId === item.id;
            return (
              <View key={item.id}>
                <Pressable
                  onPress={() => toggleUserPlan(item.id)}
                  onLongPress={() => handleDeleteUserPlan(item)}
                  style={[styles.groupRow, { borderBottomColor: palette.hair }]}
                >
                  <View style={[styles.groupDot, { backgroundColor: palette.acc }]} />
                  <View style={styles.rowBody}>
                    <Text style={[styles.groupTitle, { color: palette.ink }]} numberOfLines={2}>
                      {getLocalizedPlanText(item, 'title', language)}
                    </Text>
                    <Text style={[styles.groupSub, { color: palette.mute }]}>
                      {started
                        ? `${done} ${t('UI.thread.of')} ${total}`
                        : `${total} ${t('UI.thread.stories')}`}
                      {started?.isPaused ? ` · ${t('UI.planJourney.paused')}` : ''}
                    </Text>
                  </View>
                  <View style={styles.planActions}>
                    {!started ? (
                      <Pressable
                        onPress={() => handleStartPlan(item)}
                        hitSlop={12}
                        style={[styles.startBtn, { borderColor: palette.acc }]}
                      >
                        <Text style={{ color: palette.acc, fontSize: 9, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                          {t('UI.planJourney.start')}
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => handlePauseResumeUser(item)}
                        hitSlop={12}
                        style={[styles.startBtn, { borderColor: started.isPaused ? palette.acc : '#FF9F0A' }]}
                      >
                        <Text
                          style={{
                            color: started.isPaused ? palette.acc : '#FF9F0A',
                            fontSize: 9,
                            fontWeight: '600',
                            letterSpacing: 0.8,
                            textTransform: 'uppercase',
                          }}
                        >
                          {started.isPaused ? t('UI.planJourney.resume') : t('UI.planJourney.pause')}
                        </Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => (started ? handleEndUserPlan(item) : handleDeleteUserPlan(item))}
                      hitSlop={12}
                      style={[styles.startBtn, { borderColor: palette.hair }]}
                    >
                      <Text style={{ color: palette.mute, fontSize: 9, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                        {started ? t('UI.planJourney.end') : t('UI.planJourney.delete')}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>

                {open && userStoryThread.length > 0 && (
                  <View style={[styles.threadWrap, { height: userStoryThread.height }]}>
                    <Svg
                      pointerEvents="none"
                      style={StyleSheet.absoluteFill}
                      width="100%"
                      height={userStoryThread.height}
                    >
                      <AnimatedPath
                        d={userStoryThread.d}
                        fill="none"
                        stroke={palette.thread}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={userStoryThread.length}
                        animatedProps={userPathProps}
                      />
                    </Svg>
                    {userStoryRows.map((row, index) => {
                      const mark = userStoryThread.marks[index];
                      if (!mark) return null;

                      if (row.kind === 'plan') {
                        return (
                          <ThreadRevealRow
                            key={row.key}
                            index={index}
                            total={userStoryRows.length}
                            progress={userProgress}
                          >
                            <View style={[styles.threadRow, { height: row.height }]}>
                              <BookBead
                                x={mark.x}
                                rowHeight={row.height}
                                open
                                palette={palette}
                                anchor={PLAN_MARK}
                              />
                            </View>
                          </ThreadRevealRow>
                        );
                      }

                      if (row.kind !== 'journey' || !row.journey) return null;
                      return (
                        <ThreadRevealRow
                          key={row.key}
                          index={index}
                          total={userStoryRows.length}
                          progress={userProgress}
                        >
                          {renderJourneyRow(row.journey, mark, {
                            palette,
                            t,
                            justCompletedId,
                            onOpenStory: openStoryIn(item),
                          })}
                        </ThreadRevealRow>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingBottom: 180 },
  lab: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase' },

  // Active plan cards
  activeSection: { marginBottom: 4 },
  yourPlansSection: { marginTop: 10, paddingBottom: 8 },
  yourPlansHeader: { flexDirection: 'row', alignItems: 'center', paddingRight: 14 },
  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyHint: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4, fontSize: 13, lineHeight: 18 },
  subLab: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 2,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
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

  // Group list (plain, no thread)
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  groupDot: { width: 8, height: 8, borderRadius: 4 },

  // Thread rows
  threadWrap: { position: 'relative', paddingTop: 0, overflow: 'visible' },
  threadRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 14, zIndex: 1 },
  planThreadRow: { alignItems: 'flex-start', paddingTop: 10, paddingBottom: 10 },
  phaseThreadRow: { alignItems: 'flex-start', paddingTop: 10, paddingBottom: 10 },
  rowBody: { flex: 1 },
  groupTitle: { fontSize: 15, fontWeight: '600' },
  groupBlurb: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  groupSub: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 4 },
  countText: { fontSize: 10, fontVariant: ['tabular-nums'] },
  planTitle: { fontSize: 14, fontWeight: '500' },
  planBlurb: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  planMeta: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 3 },
  phaseTitle: { fontSize: 13, fontWeight: '600' },
  phaseBlurb: { fontSize: 11, lineHeight: 15, marginTop: 2, paddingRight: 8 },
  startBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  planActions: { gap: 6, alignItems: 'flex-end' },
  storyText: { flex: 1, paddingTop: 6, paddingBottom: 2 },
  storyTitle: { fontSize: 14 },
  storyNow: { fontSize: 18, fontWeight: '600' },
  storyRef: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  storyNote: { fontSize: 11, lineHeight: 15, marginTop: 3 },
  activeNote: { fontSize: 12, lineHeight: 16, marginTop: 4 },
  activeFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 10 },
  continueBtn: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7 },
  continueText: { fontSize: 12, fontWeight: '700' },
  chevron: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  chevronText: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  activeJourney: { marginTop: 6, marginBottom: 6 },
});

export default PlanScreen;
