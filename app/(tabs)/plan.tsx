import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import readingPlansData from '@/assets/data/ReadingPlansChallenges.json';
import { ThreadColors } from '@/constants/Colors';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getActivePlanFromDB, getActiveChallengesFromDB, getPlanProgress, getChallengeProgress, getCurrentStreak } from '@/api/sqlite';

function storyIdsFromSegments(segments: Record<string, { segments?: string[] } | undefined> | undefined): string[] {
  return Object.values(segments || {})
    .flatMap((entry) => entry?.segments || [])
    .filter((id) => id.startsWith('S'));
}

const PlanScreen = () => {
  const router = useRouter();
  const { isDarkMode } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [planDone, setPlanDone] = useState(0);
  const [streak, setStreak] = useState(0);
  const [challengeProgress, setChallengeProgress] = useState<Record<string, number>>({});

  const plans = readingPlansData.plans;
  const challenges = readingPlansData.challenges;
  const activePlan = plans.find((plan) => plan.id === activePlanId) || plans[0];
  const planStories = useMemo(() => storyIdsFromSegments(activePlan?.segments || {}), [activePlan]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [plan, challengesState, streakValue] = await Promise.all([
          getActivePlanFromDB(),
          getActiveChallengesFromDB(),
          getCurrentStreak(),
        ]);
        if (!alive) return;
        const planId = plan?.itemID || plan?.planID || 'Bible1Year';
        setActivePlanId(planId);
        setStreak(streakValue || 0);
        try {
          const progress = await getPlanProgress(planId);
          setPlanDone(progress?.completedSegments || 0);
        } catch {
          setPlanDone(0);
        }
        const next: Record<string, number> = {};
        for (const challenge of challenges) {
          try {
            const progress = await getChallengeProgress(challenge.id);
            const total = storyIdsFromSegments(challenge.segments).length || 1;
            next[challenge.id] = Math.round(((progress?.completedSegments || 0) / total) * 100);
          } catch {
            next[challenge.id] = 0;
          }
        }
        if (alive) setChallengeProgress(next);
        void challengesState;
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={[styles.lab, { color: palette.mute }]}>{t('UI.thread.yourPlan')}</Text>
        <Pressable
          onPress={() => router.push(`/plan/${activePlan.id}`)}
          style={[styles.card, { backgroundColor: palette.surf, borderColor: palette.acc }]}
        >
          <Text style={[styles.cardTitle, { color: palette.ink }]}>{activePlan.title}</Text>
          <Text style={[styles.cardMeta, { color: palette.mute }]}>
            {planDone} {t('UI.thread.of')} {planStories.length} · {streak}d {t('UI.thread.streak')}
          </Text>
          <View style={[styles.prog, { backgroundColor: palette.hair }]}>
            <View style={[styles.progFill, { width: `${Math.round((planDone / Math.max(planStories.length, 1)) * 100)}%`, backgroundColor: palette.acc }]} />
          </View>
        </Pressable>
        <Text style={[styles.lab, { color: palette.mute }]}>{t('UI.thread.challenges')}</Text>
        {challenges.map((challenge) => (
          <Pressable
            key={challenge.id}
            onPress={() => router.push(`/plan/${challenge.id}`)}
            style={[styles.card, { backgroundColor: palette.surf, borderColor: palette.hair }]}
          >
            <Text style={[styles.cardTitle, { color: palette.ink }]}>{challenge.title}</Text>
            <Text style={[styles.cardMeta, { color: palette.mute }]}>{challenge.shortDescription || challenge.description}</Text>
            <View style={[styles.prog, { backgroundColor: palette.hair }]}>
              <View style={[styles.progFill, { width: `${challengeProgress[challenge.id] || 0}%`, backgroundColor: palette.divine }]} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  lab: { paddingHorizontal: 14, paddingTop: 12, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase' },
  card: { marginHorizontal: 14, marginTop: 10, borderWidth: 1, borderRadius: 16, padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardMeta: { fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4 },
  prog: { height: 4, borderRadius: 3, overflow: 'hidden', marginTop: 10 },
  progFill: { height: '100%' },
});

export default PlanScreen;
