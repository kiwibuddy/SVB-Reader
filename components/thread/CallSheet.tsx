import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { LinearTransition, useAnimatedStyle } from 'react-native-reanimated';
import { ThreadColors, inkHex, fillHex } from '@/constants/Colors';
import { localizeVoiceName } from '@/utils/localize';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useGrowOnFocus } from '@/hooks/useGrowOnFocus';
import { DUR } from '@/constants/Motion';
import { hapticSelection } from '@/utils/haptics';
import { useRouter } from 'expo-router';
import type { Ink } from '@/utils/ink';

interface CallSheetProps {
  sources: Record<string, { words: number; color: string }>;
  colorData?: { black?: number; red?: number; green?: number; blue?: number; total?: number };
  selectedInk?: Ink | null;
  onSelectInk?: (ink: Ink | null) => void;
}

const INKS: Ink[] = ['black', 'red', 'green', 'blue'];

const CallSheet: React.FC<CallSheetProps> = ({ sources, colorData, selectedInk, onSelectInk }) => {
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const [open, setOpen] = useState(false);
  const grow = useGrowOnFocus();
  const router = useRouter();

  const cast = useMemo(() => {
    const entries = Object.entries(sources || {})
      .filter(([name]) => name && name !== 'undefined')
      .sort((a, b) => (b[1].words || 0) - (a[1].words || 0));
    if (entries.length > 0) return entries;
    // Fallback: synthesize from colorData so the expanded list is never empty
    const inkLabels: Record<string, string> = { black: 'Narrator', red: 'God', green: 'Main Character', blue: 'Other Voices' };
    return INKS
      .filter((ink) => (colorData?.[ink] || 0) > 0)
      .map((ink) => [inkLabels[ink], { words: colorData?.[ink] || 0, color: ink }] as [string, { words: number; color: string }]);
  }, [sources, colorData]);

  const mix = useMemo(() => {
    const total = colorData?.total || INKS.reduce((sum, ink) => sum + (colorData?.[ink] || 0), 0);
    return INKS.map((ink) => ({ ink, value: colorData?.[ink] || 0 })).filter((part) => part.value > 0 && total > 0);
  }, [colorData]);

  const mixStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: grow.value }],
  }));

  return (
    <Animated.View
      layout={LinearTransition.duration(DUR.base)}
      style={[styles.wrap, { backgroundColor: palette.surf, borderColor: palette.hair }]}
    >
      <Pressable
        onPress={() => {
          void hapticSelection();
          setOpen((value) => !value);
        }}
        style={styles.top}
      >
        <Animated.View style={[styles.mix, mixStyle, { transformOrigin: 'left' }]}>
          {mix.map((part) => (
            <View
              key={part.ink}
              style={{ flex: part.value, backgroundColor: inkHex(part.ink, palette), height: 8, borderRadius: 4 }}
            />
          ))}
        </Animated.View>
        <Text style={[styles.count, { color: palette.mute }]}>
          {cast.length} {t('UI.thread.scopeVoices').toLowerCase()} {open ? '⌃' : '⌄'}
        </Text>
      </Pressable>
      {open && (
        <View style={styles.cast}>
          {cast.map(([name, info]) => {
            const ink = (info.color || 'black') as Ink;
            const active = !selectedInk || selectedInk === ink;
            return (
              <Pressable
                key={name}
                onPress={() => {
                  void hapticSelection();
                  router.push({ pathname: '/cast/[voice]', params: { voice: name } });
                }}
                onLongPress={() => {
                  void hapticSelection();
                  onSelectInk?.(selectedInk === ink ? null : ink);
                }}
                style={[styles.row, { opacity: active ? 1 : 0.55 }]}
              >
                <View
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: fillHex(ink, palette),
                      borderColor: inkHex(ink, palette),
                    },
                  ]}
                />
                <Text style={[styles.name, { color: palette.ink }]}>{localizeVoiceName(name, language)}</Text>
                <Text style={[styles.words, { color: palette.mute }]}>{info.words}</Text>
              </Pressable>
            );
          })}
          <Text style={[styles.hint, { color: palette.mute }]}>{t('UI.thread.readingTogether')}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 14, marginTop: 8, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12 },
  mix: { flex: 1, flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 },
  count: { fontSize: 9, letterSpacing: 1.1, textTransform: 'uppercase' },
  cast: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  swatch: { width: 13, height: 13, borderRadius: 5, borderTopLeftRadius: 2, borderWidth: 1 },
  name: { flex: 1, fontSize: 13 },
  words: { fontSize: 11, fontVariant: ['tabular-nums'] },
  hint: { fontSize: 10, marginTop: 4 },
});

export default CallSheet;
