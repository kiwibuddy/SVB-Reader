import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import { DEPTH_X, ROW_HEIGHT, buildThread, type ThreadRow } from '@/components/thread/buildThread';
import { BookBead, StoryBead, ThreadKnot } from '@/components/thread/ThreadBead';
import { useThreadReveal } from '@/hooks/useThreadReveal';
import { ThreadRevealRow } from '@/components/thread/ThreadRevealRow';
import { ThreadColors } from '@/constants/Colors';
import type { ThreadPalette } from '@/constants/Colors';
import { localizeStoryTitle } from '@/utils/localize';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { hapticImpactLight, hapticSelection } from '@/utils/haptics';
import { formatReadingMinutes, getSegmentReadingTime } from '@/utils/readingTime';
import {
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
import { shortStoryId } from '@/utils/threadProgress';
import {
  getCatalogItems,
  itemsByGroup,
  PLAN_GROUPS,
  nextUnreadStory,
  getLocalizedPlanText,
  findCatalogItem,
  type CatalogItem,
  type PlanGroupId,
} from '@/utils/planCatalog';
import { getChronologicalPhases, type ChronologicalPhase } from '@/utils/chronologicalPlans';
import { openSegment } from '@/utils/openSegment';
import { findPlanItem, listUserPlanCatalogItems, deleteUserPlan } from '@/api/userPlans';
import { isUserPlanId } from '@/utils/userPlans';

const titles = SegmentTitles as Record<string, { title?: string; ref?: string; book?: string[] }>;
const AnimatedPath = Animated.createAnimatedComponent(Path);

const GROUP_COPY: Record<PlanGroupId, { title: string; blurb: string }> = {
  year: { title: 'UI.planCategories.wholeYearPlans', blurb: 'UI.planCategories.wholeYearPlansBlurb' },
  monthly: { title: 'UI.planCategories.monthlyChallenges', blurb: 'UI.planCategories.monthlyChallengesBlurb' },
  mini: { title: 'UI.planCategories.miniStudies', blurb: 'UI.planCategories.miniStudiesBlurb' },
};

const PLAN_ROW_HEIGHT = 92;
const PHASE_ROW_HEIGHT = 64;
/** Sit the bead beside the title, not in the middle of the 2-line blurb. */
const PLAN_MARK = 20;
const PHASE_MARK = 18;

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

type RowKind = 'group' | 'plan' | 'phase' | 'story';

type VisibleRow = ThreadRow & {
  kind: RowKind;
  groupId?: PlanGroupId;
  catalogItem?: CatalogItem;
  storyId?: string;
  current?: boolean;
  phase?: ChronologicalPhase;
};

const PlanScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ completedSegment?: string; expandedPlan?: string }>();
  const justCompletedId = params.completedSegment ? shortStoryId(String(params.completedSegment)) : null;
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette: ThreadPalette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const lang = language.startsWith('fr') ? 'fr' : 'en';

  const [activePlans, setActivePlans] = useState<ActivePlanData[]>([]);
  const [createdPlans, setCreatedPlans] = useState<ActivePlanData[]>([]);
  const [openGroup, setOpenGroup] = useState<PlanGroupId | null>(null);
  const [openPlanId, setOpenPlanId] = useState<string | null>(null);
  const [progressById, setProgressById] = useState<Record<string, { done: number; ids: string[] }>>({});
  const loading = useRef(false);

  const catalog = useMemo(() => getCatalogItems(), []);

  const loadData = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      const [startedPlans, startedChallenges, userCatalog] = await Promise.all([
        getStartedPlansFromDB(),
        getStartedChallengesFromDB(),
        listUserPlanCatalogItems(),
      ]);

      const allStarted = [...startedPlans, ...startedChallenges];
      const catalogActive: ActivePlanData[] = [];
      const createdActive: ActivePlanData[] = [];
      const prog: Record<string, { done: number; ids: string[] }> = {};

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
        const started = allStarted.find((s) => s.id === item.id) || {
          id: item.id,
          type: 'plan' as const,
          isPaused: true,
          isActive: false,
          startDate: null,
          progressPercentage: 0,
        };
        createdActive.push({
          catalog: item,
          started,
          completed: progress?.completedSegments || 0,
          completedIds: new Set((progress?.completedSegmentIds || []).map(shortStoryId)),
        });
      }

      const sortActive = (list: ActivePlanData[]) =>
        list.sort((a, b) => (a.started.isActive ? -1 : 1) - (b.started.isActive ? -1 : 1));

      setProgressById(prog);
      setActivePlans(sortActive(catalogActive));
      setCreatedPlans(sortActive(createdActive));
    } finally {
      loading.current = false;
    }
  }, [catalog]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  useEffect(() => {
    const expandId = params.expandedPlan ? String(params.expandedPlan) : null;
    if (!expandId) return;
    (async () => {
      const item = findCatalogItem(expandId) || (await findPlanItem(expandId));
      if (!item || item.isUserPlan) return;
      setOpenGroup(item.group);
      setOpenPlanId(item.id);
    })();
  }, [params.expandedPlan]);

  const activeIds = useMemo(() => new Set(activePlans.map((a) => a.catalog.id)), [activePlans]);
  const grouped = useMemo(() => itemsByGroup(catalog, activeIds), [catalog, activeIds]);

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
      const planDone = new Set(progressById[item.id]?.ids || []);
      const next = nextUnreadStory(item.stories, planDone);
      const phases = getChronologicalPhases(item.chronologicalMapping, (key, field, fallback) =>
        t(`UI.chronologicalPhases.${item.chronologicalMapping}.${key}.${field}`, { defaultValue: fallback })
      );

      const pushStory = (storyId: string, depth: 1 | 2, phase?: ChronologicalPhase) => {
        const done = planDone.has(storyId);
        const current = !done && next?.storyId === storyId;
        rows.push({
          key: `${item.id}-${storyId}`,
          kind: 'story',
          depth,
          height: current ? ROW_HEIGHT.current : ROW_HEIGHT.story,
          storyId,
          current,
          catalogItem: item,
          phase,
        });
      };

      if (phases.length) {
        for (const phase of phases) {
          rows.push({
            key: `ph-${item.id}-${phase.key}`,
            kind: 'phase',
            depth: 1,
            height: PHASE_ROW_HEIGHT,
            markOffset: PHASE_MARK,
            catalogItem: item,
            phase,
          });
          for (const storyId of phase.storyIds) {
            pushStory(storyId, 2, phase);
          }
        }
      } else {
        for (const storyId of item.stories) {
          pushStory(storyId, 1);
        }
      }
    }
    return rows;
  }, [grouped, openGroup, openPlanId, progressById, t]);

  const thread = useMemo(
    () =>
      buildThread(
        visibleRows.map(({ key, depth, height, markOffset }) => ({ key, depth, height, markOffset })),
        { width: windowWidth, entry: 'none', exit: 'none' }
      ),
    [visibleRows, windowWidth]
  );

  const { progress, pathProps } = useThreadReveal(thread.length, { replayOnFocus: false });
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

  const handleStartPlan = async (item: CatalogItem) => {
    void hapticImpactLight();
    if (item.type === 'plan') {
      await startPlan(item.id);
    } else {
      await startChallenge(item.id);
    }
    await loadData();
    const planDone = new Set(progressById[item.id]?.ids || []);
    const next = nextUnreadStory(item.stories, planDone);
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
    const isUser = !!data.catalog.isUserPlan || isUserPlanId(data.catalog.id);
    const label = isUser
      ? t('UI.customPlans.delete')
      : data.catalog.type === 'plan'
        ? t('UI.alerts.endReadingPlan')
        : t('UI.alerts.endReadingChallenge');
    const message = isUser
      ? t('UI.customPlans.deleteConfirm').replace('{title}', getLocalizedPlanText(data.catalog, 'title', language))
      : t('UI.alerts.endConfirmation').replace('{title}', getLocalizedPlanText(data.catalog, 'title', language));
    Alert.alert(label, message, [
      { text: t('UI.alerts.cancel'), style: 'cancel' },
      {
        text: isUser ? t('UI.customPlans.delete') : t('UI.alerts.end'),
        style: 'destructive',
        onPress: async () => {
          if (isUser) await deleteUserPlan(data.catalog.id);
          else if (data.catalog.type === 'plan') await endPlan(data.catalog.id);
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
        {/* Curated catalog */}
        <Text style={[styles.lab, { color: palette.mute }]}>
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
                            onLongPress={() => handleStartPlan(item)}
                            style={[styles.threadRow, styles.planThreadRow, { height: row.height }]}
                          >
                            <BookBead x={mark.x} rowHeight={row.height} open={planOpen} palette={palette} anchor={PLAN_MARK} />
                            <View style={[styles.rowBody, { paddingLeft: DEPTH_X[0] + 16 }]}>
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
                        </ThreadRevealRow>
                      );
                    }

                    if (row.kind === 'phase' && row.phase) {
                      const phase = row.phase;
                      return (
                        <ThreadRevealRow key={row.key} index={index} total={visibleRows.length} progress={progress}>
                          <View style={[styles.threadRow, styles.phaseThreadRow, { height: row.height }]}>
                            <ThreadKnot x={mark.x} rowHeight={row.height} open palette={palette} fillColor={phase.color} anchor={PHASE_MARK} />
                            <View style={[styles.rowBody, { paddingLeft: DEPTH_X[1] + 16 }]}>
                              <Text style={[styles.phaseTitle, { color: phase.color }]} numberOfLines={1}>
                                {phase.title}
                              </Text>
                              {!!phase.description && (
                                <Text style={[styles.phaseBlurb, { color: palette.mute }]} numberOfLines={2}>
                                  {phase.description}
                                </Text>
                              )}
                            </View>
                          </View>
                        </ThreadRevealRow>
                      );
                    }

                    if (row.kind === 'story' && row.storyId) {
                      const id = row.storyId;
                      const info = titles[id];
                      const planDone = new Set(progressById[row.catalogItem?.id || '']?.ids || []);
                      const done = planDone.has(id);
                      const current = !!row.current && !done;
                      const minutes = getSegmentReadingTime(id);
                      const title = localizeStoryTitle(id, info?.title || id, language);
                      return (
                        <ThreadRevealRow key={row.key} index={index} total={visibleRows.length} progress={progress}>
                          <Pressable
                            onPress={() => {
                              void hapticImpactLight();
                              const item = row.catalogItem;
                              openSegment(router, id, {
                                planId: item?.type === 'plan' ? item.id : undefined,
                                challengeId: item?.type === 'challenge' ? item.id : undefined,
                              });
                            }}
                            style={[styles.threadRow, { height: row.height }]}
                            hitSlop={12}
                          >
                            <StoryBead
                              x={mark.x}
                              rowHeight={row.height}
                              done={done}
                              current={current}
                              justCompleted={justCompletedId === id}
                              palette={palette}
                            />
                            <View style={[styles.storyText, { paddingLeft: DEPTH_X[row.depth] + 16 }]}>
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

        {/* Your Plans — created + started catalog */}
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

          {createdPlans.length === 0 && activePlans.length === 0 && (
            <Text style={[styles.emptyHint, { color: palette.mute }]}>{t('UI.customPlans.empty')}</Text>
          )}

          {createdPlans.length > 0 && (
            <View>
              <Text style={[styles.subLab, { color: palette.mute }]}>{t('UI.customPlans.created')}</Text>
              {createdPlans.map(renderActivePlan)}
            </View>
          )}

          {activePlans.length > 0 && (
            <View>
              <Text style={[styles.subLab, { color: palette.mute }]}>{t('UI.customPlans.inProgress')}</Text>
              {activePlans.map(renderActivePlan)}
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingBottom: 140 },
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
  planThreadRow: { alignItems: 'flex-start', paddingTop: 12 },
  phaseThreadRow: { alignItems: 'flex-start', paddingTop: 10 },
  rowBody: { flex: 1 },
  groupTitle: { fontSize: 15, fontWeight: '600' },
  groupBlurb: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  groupSub: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 4 },
  countText: { fontSize: 10, fontVariant: ['tabular-nums'] },
  planTitle: { fontSize: 14, fontWeight: '500' },
  planBlurb: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  planMeta: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 },
  phaseTitle: { fontSize: 13, fontWeight: '600' },
  phaseBlurb: { fontSize: 12, lineHeight: 16, marginTop: 2 },
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
