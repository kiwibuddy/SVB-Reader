import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StoryHeatmap from '@/components/thread/StoryHeatmap';
import YouStatRings from '@/components/thread/YouStatRings';
import PlanRingCard from '@/components/thread/PlanRingCard';
import YouInsightBlocks from '@/components/thread/YouInsightBlocks';
import { ThreadColors } from '@/constants/Colors';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getCompletedStoryIds } from '@/utils/threadProgress';
import {
  getCurrentStreak,
  getLastReadSegment,
  getPlanProgress,
  getChallengeProgress,
  getStartedPlansFromDB,
  getStartedChallengesFromDB,
  getOldTestamentProgress,
  getNewTestamentProgress,
  type StartedItem,
} from '@/api/sqlite';
import { getVoicesMetCount } from '@/utils/voicesMet';
import { findCatalogItem, getLocalizedPlanText } from '@/utils/planCatalog';
import { findPlanItem } from '@/api/userPlans';
import {
  getWeekStreak,
  getSourceWordMix,
  getVoicesMetByColor,
  getNextUnmetVoices,
  getThinEras,
  type ColorWordMix,
  type VoicesByColor,
  type NextVoice,
  type ThinEra,
} from '@/utils/youInsights';

type ActivePlanSummary = {
  id: string;
  title: string;
  done: number;
  total: number;
  isPaused: boolean;
};

const YouScreen = () => {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const lang = language.startsWith('fr') ? 'fr' : 'en';

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [dayStreak, setDayStreak] = useState(0);
  const [weekStreak, setWeekStreak] = useState(0);
  const [voicesMet, setVoicesMet] = useState(0);
  const [voicesByColor, setVoicesByColor] = useState<VoicesByColor>({
    green: 0,
    blue: 0,
    red: 0,
    black: 0,
    total: 0,
  });
  const [ot, setOt] = useState({ completed: 0, total: 219 });
  const [nt, setNt] = useState({ completed: 0, total: 146 });
  const [colorMix, setColorMix] = useState<ColorWordMix>({
    total: 0,
    black: 0,
    red: 0,
    green: 0,
    blue: 0,
  });
  const [nextVoices, setNextVoices] = useState<NextVoice[]>([]);
  const [thinEras, setThinEras] = useState<ThinEra[]>([]);
  const [planSummaries, setPlanSummaries] = useState<ActivePlanSummary[]>([]);
  const [focusDivisionKey, setFocusDivisionKey] = useState<string | null>(null);
  const [replayToken, setReplayToken] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setReplayToken((n) => n + 1);
      (async () => {
        const [
          completed,
          last,
          streakValue,
          weekValue,
          met,
          otProgress,
          ntProgress,
          startedPlans,
          startedChallenges,
        ] = await Promise.all([
          getCompletedStoryIds(),
          getLastReadSegment(),
          getCurrentStreak(),
          getWeekStreak(),
          getVoicesMetCount(),
          getOldTestamentProgress(),
          getNewTestamentProgress(),
          getStartedPlansFromDB(),
          getStartedChallengesFromDB(),
        ]);
        if (!alive) return;

        const lastStoryId = last?.match(/S\d+/i)?.[0] || last;
        setCompletedIds(completed);
        setCurrentId(lastStoryId);
        setDayStreak(streakValue || 0);
        setWeekStreak(weekValue || 0);
        setVoicesMet(met);
        setOt(otProgress);
        setNt(ntProgress);
        setVoicesByColor(getVoicesMetByColor(completed));
        setColorMix(getSourceWordMix(completed));
        setNextVoices(getNextUnmetVoices(completed, lastStoryId, 3));
        setThinEras(getThinEras(completed, lang));

        const allStarted: StartedItem[] = [...startedPlans, ...startedChallenges];
        const summaries: ActivePlanSummary[] = [];
        for (const started of allStarted) {
          const item = findCatalogItem(started.id) || (await findPlanItem(started.id));
          if (!item) continue;
          const progress =
            item.type === 'plan'
              ? await getPlanProgress(item.id)
              : await getChallengeProgress(item.id);
          if (!alive) return;
          summaries.push({
            id: item.id,
            title: getLocalizedPlanText(item, 'title', language),
            done: progress?.completedSegments || 0,
            total: item.stories.length,
            isPaused: started.isPaused,
          });
        }
        setPlanSummaries(summaries);
      })();
      return () => {
        alive = false;
      };
    }, [language, lang])
  );

  const ringLabels = {
    stories: t('UI.thread.stories'),
    voicesMet: t('UI.thread.voicesMet'),
    streak: t('UI.thread.streak'),
    ot: t('UI.thread.oldTestament'),
    nt: t('UI.thread.newTestament'),
    all: t('UI.thread.allStories'),
    day: t('UI.thread.dayStreak'),
    week: t('UI.thread.weekStreak'),
    principal: t('UI.thread.mainFilter'),
    supporting: t('UI.thread.supportingFilter'),
    divine: t('UI.thread.divineFilter'),
    narrator: t('UI.thread.narratorShort'),
  };

  const insightLabels = {
    colorMixTitle: t('UI.thread.colorMixTitle'),
    colorMixBody: t('UI.thread.colorMixBody'),
    nextVoicesTitle: t('UI.thread.nextVoicesTitle'),
    nextVoicesEmpty: t('UI.thread.nextVoicesEmpty'),
    thinErasTitle: t('UI.thread.thinErasTitle'),
    thinEraLine: t('UI.thread.thinEraLine'),
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.name, { color: palette.ink }]}>{t('UI.tabs.you')}</Text>
            <Text style={[styles.subtitle, { color: palette.mute }]}>{t('UI.thread.youSubtitle')}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            style={styles.gear}
            accessibilityRole="button"
            accessibilityLabel={t('UI.thread.settings')}
            hitSlop={8}
          >
            <Ionicons name="settings-outline" size={22} color={palette.mute} />
          </Pressable>
        </View>

        {completedIds.size === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: palette.ink }]}>{t('UI.thread.youEmptyTitle')}</Text>
            <Text style={[styles.emptyBody, { color: palette.mute }]}>{t('UI.thread.youEmptyBody')}</Text>
          </View>
        ) : null}

        <StoryHeatmap
          completedIds={completedIds}
          currentId={currentId}
          isDarkMode={isDarkMode}
          language={language}
          focusDivisionKey={focusDivisionKey}
        />

        <YouStatRings
          palette={palette}
          storiesDone={completedIds.size}
          ot={ot}
          nt={nt}
          voicesMet={voicesMet}
          voicesByColor={voicesByColor}
          dayStreak={dayStreak}
          weekStreak={weekStreak}
          replayToken={replayToken}
          labels={ringLabels}
        />

        {planSummaries.length > 0 && (
          <View style={styles.planSection}>
            <Text style={[styles.sectionLab, { color: palette.mute }]}>{t('UI.thread.yourPlan')}</Text>
            {planSummaries.map((plan) => (
              <PlanRingCard
                key={plan.id}
                title={plan.title}
                done={plan.done}
                total={plan.total}
                isPaused={plan.isPaused}
                palette={palette}
                pausedLabel={t('UI.thread.paused')}
                metaLabel={`${plan.done} ${t('UI.thread.of')} ${plan.total} ${t('UI.thread.stories')}`}
                replayToken={replayToken}
                onPress={() => router.push(`/plan/${plan.id}`)}
              />
            ))}
          </View>
        )}

        <YouInsightBlocks
          palette={palette}
          language={language}
          colorMix={colorMix}
          nextVoices={nextVoices}
          thinEras={thinEras}
          labels={insightLabels}
          onVoicePress={(name) => router.push(`/cast/${encodeURIComponent(name)}`)}
          onEraPress={(key) => {
            setFocusDivisionKey(key);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  headerText: { flex: 1 },
  name: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3 },
  subtitle: { fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 2 },
  gear: { padding: 6, marginTop: -2, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  empty: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyBody: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  sectionLab: {
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 16,
    paddingHorizontal: 14,
  },
  planSection: { marginBottom: 4 },
});

export default YouScreen;
