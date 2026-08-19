import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import YearThread from '@/components/thread/YearThread';
import { ThreadColors } from '@/constants/Colors';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getCompletedStoryIds } from '@/utils/threadProgress';
import { getCurrentStreak, getLastReadSegment } from '@/api/sqlite';
import { getVoicesMetCount, TOTAL_VOICES } from '@/utils/voicesMet';

const YouScreen = () => {
  const router = useRouter();
  const { isDarkMode } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [voicesMet, setVoicesMet] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [completed, last, streakValue, met] = await Promise.all([
          getCompletedStoryIds(),
          getLastReadSegment(),
          getCurrentStreak(),
          getVoicesMetCount(),
        ]);
        if (!alive) return;
        setCompletedIds(completed);
        setCurrentId(last?.match(/S\d+/i)?.[0] || last);
        setStreak(streakValue || 0);
        setVoicesMet(met);
      })();
      return () => {
        alive = false;
      };
    }, [])
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
        <Pressable onPress={() => router.push('/About')} style={[styles.link, { borderTopColor: palette.hair }]}>
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
  lab: { fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 4 },
  link: { marginTop: 18, marginHorizontal: 14, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, minHeight: 44 },
});

export default YouScreen;
