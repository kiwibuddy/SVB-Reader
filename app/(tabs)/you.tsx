import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import YearThread from '@/components/thread/YearThread';
import { ThreadColors } from '@/constants/Colors';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getCompletedStoryIds } from '@/utils/threadProgress';
import { getCurrentStreak, getLastReadSegment } from '@/api/sqlite';
import { getVoicesMetCount, TOTAL_VOICES } from '@/utils/voicesMet';
import { formatCount } from '@/utils/localize';

const YouScreen = () => {
  const router = useRouter();
  const { isDarkMode, setDarkMode, language, setLanguage, fontSize, setFontSize } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [voicesMet, setVoicesMet] = useState(0);
  const [appearance, setAppearance] = useState<'light' | 'dark' | 'auto'>(isDarkMode ? 'dark' : 'light');

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

  const applyAppearance = async (mode: 'light' | 'dark' | 'auto') => {
    setAppearance(mode);
    if (mode === 'auto') {
      const { Appearance } = require('react-native');
      await setDarkMode(Appearance.getColorScheme() === 'dark');
    } else {
      await setDarkMode(mode === 'dark');
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
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
        <Text style={[styles.section, { color: palette.mute }]}>{t('UI.thread.settings')}</Text>
        <Text style={[styles.rowLabel, { color: palette.ink }]}>{t('UI.thread.appearance')}</Text>
        <View style={[styles.seg, { backgroundColor: palette.bg, borderColor: palette.hair }]}>
          {(['light', 'dark', 'auto'] as const).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => applyAppearance(mode)}
              style={[styles.segItem, appearance === mode && { backgroundColor: palette.ink }]}
            >
              <Text style={{ color: appearance === mode ? palette.bg : palette.mute, fontSize: 10, textTransform: 'uppercase' }}>
                {t(`UI.thread.appearance${mode.charAt(0).toUpperCase()}${mode.slice(1)}`)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.rowLabel, { color: palette.ink }]}>{t('UI.settings.fontSize')}</Text>
        <View style={[styles.seg, { backgroundColor: palette.bg, borderColor: palette.hair }]}>
          {(['small', 'medium', 'large'] as const).map((size) => (
            <Pressable
              key={size}
              onPress={() => setFontSize(size)}
              style={[styles.segItem, fontSize === size && { backgroundColor: palette.ink }]}
            >
              <Text style={{ color: fontSize === size ? palette.bg : palette.mute, fontSize: 10, textTransform: 'uppercase' }}>{size}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.rowLabel, { color: palette.ink }]}>{t('UI.settings.language')}</Text>
        <View style={[styles.seg, { backgroundColor: palette.bg, borderColor: palette.hair }]}>
          {(['en', 'fr'] as const).map((code) => (
            <Pressable
              key={code}
              onPress={() => setLanguage(code)}
              style={[styles.segItem, language === code && { backgroundColor: palette.ink }]}
            >
              <Text style={{ color: language === code ? palette.bg : palette.mute, fontSize: 10, textTransform: 'uppercase' }}>
                {code}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => router.push('/About')} style={[styles.link, { borderTopColor: palette.hair }]}>
          <Text style={{ color: palette.ink }}>{t('UI.settings.title')}</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(tabs)/Achievements')} style={[styles.link, { borderTopColor: palette.hair }]}>
          <Text style={{ color: palette.ink }}>{t('UI.navigation.achievements')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 8 },
  big: { fontSize: 28, letterSpacing: -0.8 },
  em: { fontSize: 14 },
  lab: { fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 4 },
  section: { paddingHorizontal: 14, paddingTop: 28, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase' },
  rowLabel: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 8, fontSize: 14 },
  seg: { marginHorizontal: 14, flexDirection: 'row', borderWidth: 1, borderRadius: 11, padding: 3, gap: 3 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
  link: { marginTop: 18, marginHorizontal: 14, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth },
});

export default YouScreen;
