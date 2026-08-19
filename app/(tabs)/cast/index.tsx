import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import conversations from '@/assets/data/conversations.json';
import { ThreadColors, fillHex, inkHex } from '@/constants/Colors';
import { ConversationsFile, ConversationVoice } from '@/types/conversations';
import { localizeVoiceName, formatCount } from '@/utils/localize';
import { inkLabel, Ink } from '@/utils/ink';
import { NARRATION_VOICES } from '@/utils/voicesMet';
import { isWrittenVoice, writtenLetterCount } from '@/utils/writtenVoices';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { hapticSelection } from '@/utils/haptics';

const conv = conversations as ConversationsFile;

type CastFilter = 'green' | 'blue' | 'red' | 'all';

const CastIndex = () => {
  const router = useRouter();
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const lang = language.startsWith('fr') ? 'fr' : 'en';
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CastFilter>('green');

  const voices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(conv.voices)
      .filter((voice) => !NARRATION_VOICES.has(voice.name) && voice.group !== 'narration')
      .filter((voice) => (filter === 'all' ? true : voice.color === filter))
      .filter((voice) => {
        if (!q) return true;
        return localizeVoiceName(voice.name, language).toLowerCase().includes(q) || voice.name.toLowerCase().includes(q);
      })
      .sort((a, b) => b.words - a.words);
  }, [filter, language, query]);

  const pills: { id: CastFilter; label: string; ink: Ink }[] = [
    { id: 'green', label: t('UI.thread.mainFilter'), ink: 'green' },
    { id: 'blue', label: t('UI.thread.supportingFilter'), ink: 'blue' },
    { id: 'red', label: t('UI.thread.divineFilter'), ink: 'red' },
    { id: 'all', label: t('UI.thread.scopeAll'), ink: 'black' },
  ];

  const storyLabel = (count: number) =>
    count === 1 ? t('UI.thread.storySingular') : t('UI.thread.stories');

  const renderVoice = ({ item: voice }: { item: ConversationVoice }) => {
    const written = isWrittenVoice(voice.name, voice.storyIds);
    const letters = writtenLetterCount(voice.name);
    return (
      <Pressable
        onPress={() => router.push(`/cast/${encodeURIComponent(voice.name)}`)}
        style={[styles.row, { borderBottomColor: palette.hair }, written && { opacity: 0.72 }]}
      >
        <View
          style={[
            styles.dot,
            written && styles.dotWritten,
            { backgroundColor: written ? palette.mute : inkHex(voice.color, palette) },
          ]}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: palette.ink }]}>{localizeVoiceName(voice.name, language)}</Text>
          <Text style={[styles.meta, { color: palette.mute }]}>
            {written
              ? `${t('UI.thread.written')} · ${letters || voice.storyIds.length} ${letters === 1 ? t('UI.thread.letter') : t('UI.thread.letters')}`
              : `${inkLabel(voice.color, lang)} · ${voice.storyIds.length} ${storyLabel(voice.storyIds.length)}`}
          </Text>
        </View>
        <Text style={[styles.count, { color: palette.mute }]}>{formatCount(voice.words)} w</Text>
      </Pressable>
    );
  };

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filterScroll}
      >
        {pills.map((item) => {
          const selected = filter === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                void hapticSelection();
                setFilter(item.id);
              }}
              style={[
                styles.bubble,
                {
                  backgroundColor: selected ? inkHex(item.ink, palette) : fillHex(item.ink, palette),
                  borderColor: inkHex(item.ink, palette),
                },
              ]}
            >
              <Text style={[styles.bubbleText, { color: selected ? palette.bg : inkHex(item.ink, palette) }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <FlatList
        data={voices}
        keyExtractor={(voice) => voice.name}
        renderItem={renderVoice}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  search: { margin: 14, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  input: { fontSize: 15, padding: 0 },
  filterScroll: { flexGrow: 0 },
  filters: { alignItems: 'flex-start', paddingHorizontal: 14, paddingBottom: 8, gap: 6 },
  bubble: {
    borderWidth: 1,
    borderRadius: 12,
    borderTopLeftRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  bubbleText: { fontSize: 9, letterSpacing: 1.1, textTransform: 'uppercase', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 44 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotWritten: { borderRadius: 2, borderTopLeftRadius: 1 },
  name: { fontSize: 16 },
  meta: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  count: { fontSize: 10, fontVariant: ['tabular-nums'] },
});

export default CastIndex;
