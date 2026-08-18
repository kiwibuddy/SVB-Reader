import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ThreadColors, inkHex } from '@/constants/Colors';
import { localizeVoiceName } from '@/utils/localize';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';

interface CallSheetProps {
  sources: Record<string, { words: number; color: string }>;
}

const CallSheet: React.FC<CallSheetProps> = ({ sources }) => {
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const [open, setOpen] = useState(false);

  const cast = useMemo(() => {
    return Object.entries(sources || {})
      .filter(([name]) => name && name !== 'undefined')
      .sort((a, b) => (b[1].words || 0) - (a[1].words || 0));
  }, [sources]);

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setOpen((value) => !value)} style={styles.header}>
        <Text style={[styles.label, { color: palette.mute }]}>
          {t('UI.thread.callSheet')} · {cast.length}
        </Text>
      </Pressable>
      {open &&
        cast.map(([name, info]) => (
          <View key={name} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: inkHex(info.color, palette) }]} />
            <Text style={[styles.name, { color: palette.ink }]}>{localizeVoiceName(name, language)}</Text>
            <Text style={[styles.words, { color: palette.mute }]}>{info.words}</Text>
          </View>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingBottom: 8 },
  header: { paddingVertical: 8 },
  label: { fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { flex: 1, fontSize: 13 },
  words: { fontSize: 11, fontVariant: ['tabular-nums'] },
});

export default CallSheet;
