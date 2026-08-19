import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import YearThread from '@/components/thread/YearThread';
import { ThreadColors } from '@/constants/Colors';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getCompletedStoryIds } from '@/utils/threadProgress';
import { getCurrentStreak, getLastReadSegment, getPlanProgress, getChallengeProgress, getStartedPlansFromDB, getStartedChallengesFromDB, type StartedItem } from '@/api/sqlite';
import { getVoicesMetCount, TOTAL_VOICES } from '@/utils/voicesMet';
import { findCatalogItem, getLocalizedPlanText } from '@/utils/planCatalog';

type ActivePlanSummary = {
  id: string;
  title: string;
  done: number;
  total: number;
  isPaused: boolean;
};

const YouScreen = () => {
  const router = useRouter();
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const lang = language.startsWith('fr') ? 'fr' : 'en';
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [voicesMet, setVoicesMet] = useState(0);
  const [planSummaries, setPlanSummaries] = useState<ActivePlanSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [completed, last, streakValue, met, startedPlans, startedChallenges] = await Promise.all([
          getCompletedStoryIds(),
          getLastReadSegment(),
          getCurrentStreak(),
          getVoicesMetCount(),
          getStartedPlansFromDB(),
          getStartedChallengesFromDB(),
        ]);
        if (!alive) return;
        setCompletedIds(completed);
        setCurrentId(last?.match(/S\d+/i)?.[0] || last);
        setStreak(streakValue || 0);
        setVoicesMet(met);

        const allStarted: StartedItem[] = [...startedPlans, ...startedChallenges];
        const summaries: ActivePlanSummary[] = [];
        for (const started of allStarted) {
          const item = findCatalogItem(started.id);
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
    }, [language])
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <Text style={[styles.name, { color: palette.ink }]}>{t('UI.tabs.you')}</Text>
        <Text style={[styles.year, { color: palette.mute }]}>{t('UI.thread.yourYear')} · {new Date().getFullYear()}</Text>
        {completedIds.size === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: palette.ink }]}>{t('UI.thread.youEmptyTitle')}</Text>
            <Text style={[styles.emptyBody, { color: palette.mute }]}>{t('UI.thread.youEmptyBody')}</Text>
          </View>
        ) : (
          <>
            <YearThread completedIds={completedIds} currentId={currentId} isDarkMode={isDarkMode} />
            <View style={styles.stats}>
              <View>
                <Text style={[styles.big, { color: palette.ink }]}>{completedIds.size}<Text style={[styles.em, { color: palette.mute }]}> / 365</Text></Text>
                <Text style={[styles.lab, { color: palette.mute }]}>{t('UI.thread.stories')}</Text>
              </View>
              <View>
                <Text style={[styles.big, { color: palette.ink }]}>{voicesMet}<Text style={[styles.em, { color: palette.mute }]}> / {TOTAL_VOICES}</Text></Text>
                <Text style={[styles.lab, { color: palette.mute }]}>{t('UI.thread.voicesMet')}</Text>
              </View>
              <View>
                <Text style={[styles.big, { color: palette.ink }]}>{streak}</Text>
                <Text style={[styles.lab, { color: palette.mute }]}>{t('UI.thread.streak')}</Text>
              </View>
            </View>
          </>
        )}

        {/* Plan progress tracking */}
        {planSummaries.length > 0 && (
          <View style={styles.planSection}>
            <Text style={[styles.lab, { color: palette.mute }]}>
              {t('UI.thread.yourPlan')}
            </Text>
            {planSummaries.map((plan) => {
              const pct = plan.total > 0 ? Math.round((plan.done / plan.total) * 100) : 0;
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => router.push(`/plan/${plan.id}`)}
                  style={[styles.planCard, { borderColor: palette.hair }]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.planName, { color: palette.ink }]}>{plan.title}</Text>
                    <Text style={[styles.planPct, { color: plan.isPaused ? palette.mute : palette.acc }]}>
                      {plan.isPaused ? (lang === 'fr' ? 'Pause' : 'Paused') : `${pct}%`}
                    </Text>
                  </View>
                  <View style={[styles.prog, { backgroundColor: palette.hair, marginTop: 6 }]}>
                    <View style={[styles.progFill, { width: `${pct}%`, backgroundColor: plan.isPaused ? palette.mute : palette.acc }]} />
                  </View>
                  <Text style={[styles.planMeta, { color: palette.mute }]}>
                    {plan.done} {t('UI.thread.of')} {plan.total} {t('UI.thread.stories')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable onPress={() => router.push('/settings')} style={[styles.link, { borderTopColor: palette.hair }]}>
          <Text style={{ color: palette.ink }}>{t('UI.thread.settings')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  name: { fontSize: 22, fontWeight: '600', paddingHorizontal: 14, paddingTop: 8, letterSpacing: -0.3 },
  year: { fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', paddingHorizontal: 14, marginTop: 2 },
  empty: { paddingHorizontal: 14, paddingTop: 28, paddingBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyBody: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 8 },
  big: { fontSize: 28, letterSpacing: -0.8 },
  em: { fontSize: 14 },
  lab: { fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 4, paddingHorizontal: 14 },
  link: { marginTop: 18, marginHorizontal: 14, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, minHeight: 44 },

  planSection: { marginTop: 16 },
  planCard: { marginHorizontal: 14, marginTop: 8, borderWidth: 1, borderRadius: 12, padding: 12 },
  planName: { fontSize: 15, fontWeight: '600' },
  planPct: { fontSize: 12, fontWeight: '600' },
  planMeta: { fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 3 },
  prog: { height: 4, borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%' },
});

export default YouScreen;
