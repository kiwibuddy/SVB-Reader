import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import readingPlansData from '@/assets/data/ReadingPlansChallenges.json';
import ThreadList from '@/components/thread/ThreadList';
import { getCompletedStoryIds } from '@/utils/threadProgress';
import { ThreadColors } from '@/constants/Colors';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getSegmentReadingTime, formatReadingMinutes } from '@/utils/readingTime';

function storyIdsFromSegments(segments: Record<string, { segments?: string[] } | undefined> | undefined): string[] {
  return Object.values(segments || {})
    .flatMap((entry) => entry?.segments || [])
    .filter((id) => id.startsWith('S'));
}

const PlanDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const item =
    readingPlansData.plans.find((plan) => plan.id === id) ||
    readingPlansData.challenges.find((challenge) => challenge.id === id);

  const storyFilter = useMemo(() => storyIdsFromSegments(item?.segments || {}), [item]);
  const minutes = useMemo(
    () => storyFilter.reduce((sum, id) => sum + getSegmentReadingTime(id), 0),
    [storyFilter]
  );

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getCompletedStoryIds().then((ids) => {
        if (alive) setCompletedIds(ids);
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  if (!item) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Text>Not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={{ color: palette.mute, letterSpacing: 1.4, textTransform: 'uppercase', fontSize: 11 }}>
          ‹ {t('UI.tabs.plan')}
        </Text>
      </Pressable>
      <Text style={[styles.title, { color: palette.ink }]}>{item.title}</Text>
      {minutes > 0 && (
        <Text style={[styles.meta, { color: palette.mute }]}>
          {storyFilter.length} {t('UI.thread.stories')} · {formatReadingMinutes(minutes)}
        </Text>
      )}
      <ThreadList completedIds={completedIds} storyFilter={storyFilter} hideSearch />
    </View>
  );
};

const styles = StyleSheet.create({
  back: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 6 },
  title: { fontSize: 22, fontWeight: '600', paddingHorizontal: 14, paddingBottom: 2, letterSpacing: -0.4 },
  meta: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 14, paddingBottom: 8 },
});

export default PlanDetail;
