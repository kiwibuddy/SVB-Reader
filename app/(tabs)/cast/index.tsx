import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, FlatList, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import conversations from '@/assets/data/conversations.json';
import { ThreadColors, fillHex, inkHex } from '@/constants/Colors';
import { ConversationsFile, ConversationVoice } from '@/types/conversations';
import { localizeVoiceName } from '@/utils/localize';
import { Ink } from '@/utils/ink';
import { NARRATION_VOICES } from '@/utils/voicesMet';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { hapticSelection } from '@/utils/haptics';
import { CastVoiceRow } from '@/components/thread/CastVoiceRow';
import SearchField from '@/components/thread/SearchField';

const conv = conversations as ConversationsFile;

type CastFilter = 'green' | 'blue' | 'red' | 'all';

const CastIndex = () => {
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CastFilter>('green');
  const [expandedName, setExpandedName] = useState<string | null>(null);

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
  const letterLabel = (count: number) =>
    count === 1 ? t('UI.thread.letter') : t('UI.thread.letters');

  const renderVoice = ({ item: voice }: { item: ConversationVoice }) => (
    <CastVoiceRow
      voice={voice}
      expanded={expandedName === voice.name}
      palette={palette}
      language={language}
      storyLabel={storyLabel}
      letterLabel={letterLabel}
      onToggle={() => setExpandedName((current) => (current === voice.name ? null : voice.name))}
    />
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['top']}>
      <SearchField
        value={query}
        onChangeText={(value) => {
          setQuery(value);
          setExpandedName(null);
        }}
        placeholder={t('UI.thread.searchPlaceholder')}
        palette={palette}
        isDarkMode={isDarkMode}
        clearLabel={t('UI.search.clearSearch')}
        style={styles.search}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filterScroll}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {pills.map((item) => {
          const selected = filter === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                Keyboard.dismiss();
                void hapticSelection();
                setFilter(item.id);
                setExpandedName(null);
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
        extraData={expandedName}
        keyExtractor={(voice) => voice.name}
        renderItem={renderVoice}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={!expandedName}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  search: { margin: 14 },
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
});

export default CastIndex;
