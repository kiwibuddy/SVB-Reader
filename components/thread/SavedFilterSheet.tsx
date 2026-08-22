import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ThreadPalette } from '@/constants/Colors';
import { useTranslation } from '@/hooks/useTranslation';
import { hapticSelection } from '@/utils/haptics';
import { localizeVoiceName, localizeBookName } from '@/utils/localize';

export type SavedFilters = {
  testament: Array<'ot' | 'nt'>;
  sourceColor: string[];
  sourceName: string[];
  book: string[];
  emoji: string[];
  hasNotes: boolean;
};

export const EMPTY_SAVED_FILTERS: SavedFilters = {
  testament: [],
  sourceColor: [],
  sourceName: [],
  book: [],
  emoji: [],
  hasNotes: false,
};

export function savedFilterCount(filters: SavedFilters): number {
  return (
    filters.testament.length +
    filters.sourceColor.length +
    filters.sourceName.length +
    filters.book.length +
    filters.emoji.length +
    (filters.hasNotes ? 1 : 0)
  );
}

export function toggleSavedFilter<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export const COLOR_KEYS = [
  { key: 'black', labelKey: 'UI.filters.narrator' },
  { key: 'red', labelKey: 'UI.filters.godJesus' },
  { key: 'green', labelKey: 'UI.filters.mainSpeaker' },
  { key: 'blue', labelKey: 'UI.filters.otherSpeakers' },
] as const;

export const EMOJI_OPTIONS = ['❤️', '👍', '🤔', '🙏'] as const;

type Props = {
  visible: boolean;
  filters: SavedFilters;
  speakers: string[];
  books: { id: string; name: string }[];
  language: string;
  palette: ThreadPalette;
  onClose: () => void;
  onApply: (filters: SavedFilters) => void;
};

export function SavedFilterSheet({
  visible,
  filters,
  speakers,
  books,
  language,
  palette,
  onClose,
  onApply,
}: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<SavedFilters>(filters);
  const [showAllSpeakers, setShowAllSpeakers] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(filters);
      setShowAllSpeakers(false);
    }
  }, [filters, visible]);

  const visibleSpeakers = useMemo(
    () => (showAllSpeakers ? speakers : speakers.slice(0, 8)),
    [showAllSpeakers, speakers]
  );

  const Option = ({
    label,
    selected,
    onPress,
    swatch,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
    swatch?: string;
  }) => (
    <Pressable onPress={() => { void hapticSelection(); onPress(); }} style={styles.option}>
      <View
        style={[
          styles.check,
          { borderColor: selected ? palette.acc : palette.hair },
          selected && { backgroundColor: palette.acc },
        ]}
      >
        {selected ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
      </View>
      {swatch ? <View style={[styles.swatch, { backgroundColor: swatch }]} /> : null}
      <Text style={[styles.optionText, { color: palette.ink }]}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
        <View style={[styles.head, { borderBottomColor: palette.hair }]}>
          <Text style={[styles.title, { color: palette.ink }]}>{t('UI.filters.filterReactions')}</Text>
          <View style={styles.headBtns}>
            <Pressable
              onPress={() => setDraft(EMPTY_SAVED_FILTERS)}
              style={[styles.clear, { backgroundColor: palette.surf, borderColor: palette.hair }]}
            >
              <Text style={[styles.clearText, { color: palette.mute }]}>{t('UI.filters.clearAll')}</Text>
            </Pressable>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={palette.ink} />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={[styles.section, { color: palette.mute }]}>{t('UI.filters.content')}</Text>
          <Option
            label={t('UI.filters.hasNotes')}
            selected={draft.hasNotes}
            onPress={() => setDraft((prev) => ({ ...prev, hasNotes: !prev.hasNotes }))}
          />

          <Text style={[styles.section, { color: palette.mute }]}>{t('UI.filters.reaction')}</Text>
          {EMOJI_OPTIONS.map((emoji) => (
            <Option
              key={emoji}
              label={emoji}
              selected={draft.emoji.includes(emoji)}
              onPress={() => setDraft((prev) => ({ ...prev, emoji: toggleSavedFilter(prev.emoji, emoji) }))}
            />
          ))}

          <Text style={[styles.section, { color: palette.mute }]}>{t('UI.filters.testament')}</Text>
          <Option
            label={t('UI.filters.oldTestament')}
            selected={draft.testament.includes('ot')}
            onPress={() => setDraft((prev) => ({ ...prev, testament: toggleSavedFilter(prev.testament, 'ot') }))}
          />
          <Option
            label={t('UI.filters.newTestament')}
            selected={draft.testament.includes('nt')}
            onPress={() => setDraft((prev) => ({ ...prev, testament: toggleSavedFilter(prev.testament, 'nt') }))}
          />

          <Text style={[styles.section, { color: palette.mute }]}>{t('UI.filters.speakerType')}</Text>
          {COLOR_KEYS.map((item) => (
            <Option
              key={item.key}
              label={t(item.labelKey)}
              selected={draft.sourceColor.includes(item.key)}
              swatch={item.key === 'black' ? palette.narr : item.key === 'red' ? palette.divine : item.key === 'green' ? palette.prin : palette.chor}
              onPress={() => setDraft((prev) => ({ ...prev, sourceColor: toggleSavedFilter(prev.sourceColor, item.key) }))}
            />
          ))}

          <Text style={[styles.section, { color: palette.mute }]}>{t('UI.filters.speaker')}</Text>
          {speakers.length === 0 ? (
            <Text style={[styles.empty, { color: palette.mute }]}>{t('UI.filters.noSpeakersAvailable')}</Text>
          ) : (
            <>
              {visibleSpeakers.map((name) => (
                <Option
                  key={name}
                  label={localizeVoiceName(name, language)}
                  selected={draft.sourceName.includes(name)}
                  onPress={() => setDraft((prev) => ({ ...prev, sourceName: toggleSavedFilter(prev.sourceName, name) }))}
                />
              ))}
              {speakers.length > 8 && (
                <Pressable onPress={() => setShowAllSpeakers((prev) => !prev)} style={styles.more}>
                  <Text style={{ color: palette.acc, fontSize: 13 }}>
                    {showAllSpeakers ? t('UI.filters.showLess') : t('UI.filters.showMore')}
                  </Text>
                </Pressable>
              )}
            </>
          )}

          <Text style={[styles.section, { color: palette.mute }]}>{t('UI.filters.book')}</Text>
          {books.map((book) => (
            <Option
              key={book.id}
              label={localizeBookName(book.id, book.name, language)}
              selected={draft.book.includes(book.id)}
              onPress={() => setDraft((prev) => ({ ...prev, book: toggleSavedFilter(prev.book, book.id) }))}
            />
          ))}
        </ScrollView>

        <Pressable
          onPress={() => onApply(draft)}
          style={[styles.apply, { backgroundColor: palette.ink }]}
        >
          <Text style={[styles.applyText, { color: palette.bg }]}>{t('UI.filters.applyFilters')}</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: '600' },
  headBtns: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  clear: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  clearText: { fontSize: 12, fontWeight: '500' },
  body: { paddingHorizontal: 14, paddingBottom: 24 },
  section: {
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 6,
  },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 40 },
  check: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  optionText: { fontSize: 15, flex: 1 },
  empty: { fontSize: 14, paddingVertical: 8 },
  more: { paddingVertical: 10 },
  apply: {
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyText: { fontSize: 15, fontWeight: '600' },
});
