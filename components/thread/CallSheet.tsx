import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThreadColors, inkHex, fillHex } from '@/constants/Colors';
import { localizeVoiceName } from '@/utils/localize';
import { NARRATION_VOICES } from '@/utils/voicesMet';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { hapticSelection } from '@/utils/haptics';
import { useRouter } from 'expo-router';
import type { Ink } from '@/utils/ink';

interface CallSheetProps {
  sources: Record<string, { words: number; color: string } | number | undefined>;
  colorData?: { black?: number; red?: number; green?: number; blue?: number; total?: number };
  selectedInk?: Ink | null;
  onSelectInk?: (ink: Ink | null) => void;
}

const INKS: Ink[] = ['black', 'red', 'green', 'blue'];

type CastRow = { name: string; words: number; color: Ink };

function inkLabelKey(ink: Ink): string {
  switch (ink) {
    case 'red':
      return 'UI.onboarding.godLabel';
    case 'green':
      return 'UI.onboarding.mainCharactersLabel';
    case 'blue':
      return 'UI.onboarding.everyoneElseLabel';
    default:
      return 'UI.onboarding.narratorLabel';
  }
}

function toCastList(
  sources: CallSheetProps['sources'],
  colorData: CallSheetProps['colorData']
): CastRow[] {
  const rows: CastRow[] = Object.entries(sources || {})
    .map(([name, info]) => {
      const words = typeof info === 'number' ? info : Number(info?.words) || 0;
      const color = (typeof info === 'object' && info?.color ? info.color : 'black') as Ink;
      return { name: String(name || '').trim(), words, color };
    })
    .filter((row) => row.name && row.name !== 'undefined');

  if (rows.length > 0) {
    return rows.sort((a, b) => b.words - a.words || a.name.localeCompare(b.name));
  }

  const labels: Record<Ink, string> = {
    black: 'The Narrator',
    red: 'God',
    green: 'Main Character',
    blue: 'Other Voices',
  };
  return INKS.filter((ink) => (colorData?.[ink] || 0) > 0).map((ink) => ({
    name: labels[ink],
    words: colorData?.[ink] || 0,
    color: ink,
  }));
}

const CallSheet: React.FC<CallSheetProps> = ({ sources, colorData, selectedInk, onSelectInk }) => {
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const cast = useMemo(() => toCastList(sources, colorData), [sources, colorData]);

  const openCast = (name: string) => {
    void hapticSelection();
    router.push({ pathname: '/cast/[voice]', params: { voice: name } });
  };

  return (
    <View style={styles.outer}>
      <Text style={[styles.prompt, { color: palette.mute }]}>
        {t('UI.thread.pickCastPrompt')}
      </Text>

      <View style={[styles.wrap, { backgroundColor: palette.surf, borderColor: palette.hair }]}>
        <View style={styles.top}>
          <View style={styles.boxes}>
            {INKS.map((ink) => {
              const present = (colorData?.[ink] || 0) > 0;
              const selected = selectedInk === ink;
              return (
                <Pressable
                  key={ink}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !present, selected }}
                  accessibilityLabel={`${t(inkLabelKey(ink))}${selected ? ', selected' : ''}`}
                  hitSlop={4}
                  disabled={!present}
                  onPress={() => {
                    if (!present) return;
                    void hapticSelection();
                    onSelectInk?.(selected ? null : ink);
                  }}
                  style={[
                    styles.box,
                    {
                      backgroundColor: fillHex(ink, palette),
                      borderColor: inkHex(ink, palette),
                      borderWidth: selected ? 2 : 1,
                      opacity: present ? 1 : 0.28,
                    },
                  ]}
                >
                  {selected && <Ionicons name="checkmark" size={20} color={inkHex(ink, palette)} />}
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={() => {
              void hapticSelection();
              setOpen((value) => !value);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            accessibilityLabel={`${cast.length} ${t('UI.thread.scopeVoices')}`}
            style={styles.countHit}
          >
            <Text style={[styles.count, { color: palette.ink }]}>
              {cast.length} {t('UI.thread.scopeVoices').toUpperCase()}
            </Text>
            <Ionicons
              name={open ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={palette.ink}
            />
          </Pressable>
        </View>

        {open ? (
          <View style={styles.cast} collapsable={false}>
            {cast.length === 0 ? (
              <Text style={[styles.hint, { color: palette.mute }]}>{t('UI.thread.noVoicesAvailable')}</Text>
            ) : (
              cast.map((row) => {
                const active = !selectedInk || selectedInk === row.color;
                const showCast = !NARRATION_VOICES.has(row.name);
                return (
                  <View
                    key={row.name}
                    style={[styles.row, { opacity: active ? 1 : 0.55 }]}
                  >
                    <View style={[styles.dot, { backgroundColor: inkHex(row.color, palette) }]} />
                    <Text style={[styles.name, { color: palette.ink }]} numberOfLines={1}>
                      {localizeVoiceName(row.name, language)}
                    </Text>
                    <Text style={[styles.words, { color: palette.mute }]}>
                      {row.words} {t('UI.thread.words').toLowerCase()}
                    </Text>
                    {showCast ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('UI.thread.openCastPage')}
                        hitSlop={10}
                        onPress={() => openCast(row.name)}
                        style={styles.castBtn}
                      >
                        <Ionicons name="person-circle-outline" size={26} color={inkHex(row.color, palette)} />
                      </Pressable>
                    ) : (
                      <View style={styles.castBtn} />
                    )}
                  </View>
                );
              })
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 14,
    marginTop: 2,
    marginBottom: 8,
  },
  prompt: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 2,
    paddingTop: 4,
    paddingBottom: 10,
  },
  wrap: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'visible',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  boxes: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  box: {
    width: 42,
    height: 42,
    borderRadius: 11,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countHit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingLeft: 4,
  },
  count: {
    fontSize: 13,
    letterSpacing: 1.1,
    fontWeight: '700',
  },
  cast: { paddingHorizontal: 14, paddingBottom: 14, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { flex: 1, fontSize: 15 },
  words: { fontSize: 11, fontVariant: ['tabular-nums'] },
  castBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 10, marginTop: 4, paddingBottom: 4 },
});

export default CallSheet;
