import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import conversations from '@/assets/data/conversations.json';
import { ThreadColors, inkHex } from '@/constants/Colors';
import { ConversationsFile } from '@/types/conversations';
import { localizeVoiceName, formatCount } from '@/utils/localize';
import { inkLabel, Ink } from '@/utils/ink';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';

const conv = conversations as ConversationsFile;
const FILTERS: Array<Ink | 'all'> = ['all', 'black', 'red', 'green', 'blue'];

const CastIndex = () => {
  const router = useRouter();
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const lang = language.startsWith('fr') ? 'fr' : 'en';
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Ink | 'all'>('all');

  const voices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(conv.voices)
      .filter((voice) => (filter === 'all' ? true : voice.color === filter))
      .filter((voice) => {
        if (!q) return true;
        return localizeVoiceName(voice.name, language).toLowerCase().includes(q) || voice.name.toLowerCase().includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filter, language, query]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['top']}>
      <View style={[styles.search, { backgroundColor: palette.surf, borderColor: palette.hair }]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('UI.thread.searchPlaceholder')}
          placeholderTextColor={palette.mute}
          style={[styles.input, { color: palette.ink }]}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((item) => (
          <Pressable
            key={item}
            onPress={() => setFilter(item)}
            style={[
              styles.chip,
              { borderColor: palette.hair },
              filter === item && { backgroundColor: palette.ink, borderColor: palette.ink },
            ]}
          >
            <Text style={[styles.chipText, { color: filter === item ? palette.bg : palette.mute }]}>
              {item === 'all' ? t('UI.thread.scopeAll') : inkLabel(item, lang)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {voices.map((voice) => (
          <Pressable
            key={voice.name}
            onPress={() => router.push(`/cast/${encodeURIComponent(voice.name)}`)}
            style={[styles.row, { borderBottomColor: palette.hair }]}
          >
            <View style={[styles.dot, { backgroundColor: inkHex(voice.color, palette) }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: palette.ink }]}>{localizeVoiceName(voice.name, language)}</Text>
              <Text style={[styles.meta, { color: palette.mute }]}>
                {inkLabel(voice.color, lang)} · {voice.storyIds.length} {t('UI.thread.stories')}
              </Text>
            </View>
            <Text style={[styles.count, { color: palette.mute }]}>{formatCount(voice.words)} w</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  search: { margin: 14, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  input: { fontSize: 15, padding: 0 },
  filters: { paddingHorizontal: 14, paddingBottom: 8, gap: 6 },
  chip: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 9, paddingVertical: 4, marginRight: 6 },
  chipText: { fontSize: 9, letterSpacing: 1.1, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { fontSize: 16 },
  meta: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  count: { fontSize: 10, fontVariant: ['tabular-nums'] },
});

export default CastIndex;
