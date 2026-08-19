import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, SectionList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getEmojis } from '@/api/sqlite';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import Books from '@/assets/data/BookChapterList.json';
import { ThreadColors } from '@/constants/Colors';
import { storyNumber } from '@/constants/divisions';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { localizeBookName, localizeStoryTitle, localizeVoiceName } from '@/utils/localize';
import { collectTurnText } from '@/utils/shareTurn';
import { BibleBlock } from '@/types';
import SavedBubble from '@/components/thread/SavedBubble';
import {
  EMPTY_SAVED_FILTERS,
  SavedFilterSheet,
  savedFilterCount,
  type SavedFilters,
} from '@/components/thread/SavedFilterSheet';

type SavedRow = {
  id: number;
  segmentID: string;
  blockID: string;
  emoji?: string | null;
  note?: string | null;
  blockData?: string | BibleBlock | null;
};

const titles = SegmentTitles as Record<string, { title?: string; ref?: string; book?: string[] }>;
const books = Books as Record<string, { bookName: string }>;

function parseBlock(raw: SavedRow['blockData']): BibleBlock | null {
  if (!raw) return null;
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || typeof data !== 'object') return null;
    if (!Array.isArray(data.children)) return null;
    return data as BibleBlock;
  } catch {
    return null;
  }
}

function storyIdOf(row: SavedRow): string {
  return row.segmentID?.match(/S\d+/i)?.[0] || row.segmentID || '';
}

function testamentOf(id: string): 'ot' | 'nt' | null {
  const n = storyNumber(id);
  if (n == null) return null;
  return n <= 265 ? 'ot' : 'nt';
}

function matchesFilters(row: SavedRow, filters: SavedFilters, query: string, language: string): boolean {
  const id = storyIdOf(row);
  const block = parseBlock(row.blockData);
  const color = (block?.source?.color || '').toLowerCase();
  const sourceName = block?.source?.sourceName || '';
  const bookId = titles[id]?.book?.[0] || '';
  const note = row.note || '';
  const emoji = row.emoji || '';

  if (filters.hasNotes && !note.trim()) return false;
  if (filters.testament.length) {
    const testament = testamentOf(id);
    if (!testament || !filters.testament.includes(testament)) return false;
  }
  if (filters.sourceColor.length && !filters.sourceColor.includes(color)) return false;
  if (filters.sourceName.length && !filters.sourceName.includes(sourceName)) return false;
  if (filters.book.length && !filters.book.includes(bookId)) return false;
  if (filters.emoji.length && !filters.emoji.includes(emoji)) return false;

  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    localizeStoryTitle(id, titles[id]?.title || id, language),
    titles[id]?.ref || '',
    localizeBookName(bookId, books[bookId]?.bookName || '', language),
    localizeVoiceName(sourceName, language),
    sourceName,
    note,
    collectTurnText(block),
    emoji,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

const SavedScreen = () => {
  const router = useRouter();
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const [rows, setRows] = useState<SavedRow[]>([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SavedFilters>(EMPTY_SAVED_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getEmojis()
        .then((items) => {
          if (alive) setRows((items || []) as SavedRow[]);
        })
        .catch(() => {
          if (alive) setRows([]);
        });
      return () => {
        alive = false;
      };
    }, [])
  );

  const speakers = useMemo(() => {
    const names = new Set<string>();
    for (const row of rows) {
      const name = parseBlock(row.blockData)?.source?.sourceName;
      if (name) names.add(name);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const savedBooks = useMemo(() => {
    const byId = new Map<string, string>();
    for (const row of rows) {
      const id = titles[storyIdOf(row)]?.book?.[0];
      if (id && !byId.has(id)) byId.set(id, books[id]?.bookName || id);
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesFilters(row, filters, query, language)),
    [filters, language, query, rows]
  );

  const sections = useMemo(() => {
    const byStory = new Map<string, SavedRow[]>();
    for (const row of filteredRows) {
      const id = storyIdOf(row);
      if (!id) continue;
      const list = byStory.get(id) || [];
      list.push(row);
      byStory.set(id, list);
    }
    return [...byStory.entries()].map(([id, items]) => ({
      id,
      title: localizeStoryTitle(id, titles[id]?.title || id, language),
      ref: titles[id]?.ref || '',
      bookName: books[titles[id]?.book?.[0] || '']?.bookName || '',
      data: items,
    }));
  }, [filteredRows, language]);

  const activeCount = savedFilterCount(filters);
  const showingEmptySaved = rows.length === 0;
  const showingNoMatches = !showingEmptySaved && sections.length === 0;

  const header = (
    <>
      <View style={styles.head}>
        <Text style={[styles.page, { color: palette.ink }]}>{t('UI.tabs.saved')}</Text>
        {!showingEmptySaved && (
          <Pressable
            onPress={() => setSheetOpen(true)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('UI.filters.filterReactions')}
            style={styles.filterBtn}
          >
            <Ionicons name="options-outline" size={22} color={palette.ink} />
            {activeCount > 0 && (
              <View style={[styles.badge, { backgroundColor: palette.acc }]}>
                <Text style={styles.badgeText}>{activeCount}</Text>
              </View>
            )}
          </Pressable>
        )}
      </View>
      {!showingEmptySaved && (
        <View style={[styles.search, { backgroundColor: palette.surf, borderColor: palette.hair }]}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('UI.filters.searchSaved')}
            placeholderTextColor={palette.mute}
            style={[styles.searchInput, { color: palette.ink }]}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['top']}>
      {header}
      {showingEmptySaved ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: palette.ink }]}>{t('UI.thread.savedEmptyTitle')}</Text>
          <Text style={[styles.emptyBody, { color: palette.mute }]}>{t('UI.thread.savedEmptyBody')}</Text>
        </View>
      ) : showingNoMatches ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: palette.ink }]}>{t('UI.filters.noMatches')}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 140 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Pressable onPress={() => router.push(`/${section.id}`)} style={styles.header}>
              <Text style={[styles.story, { color: palette.ink }]}>{section.title}</Text>
              <Text style={[styles.ref, { color: palette.mute }]}>{section.ref}</Text>
            </Pressable>
          )}
          renderItem={({ item, index, section }) => {
            const block = parseBlock(item.blockData);
            return (
              <Pressable
                onPress={() => router.push(`/${section.id}`)}
                style={styles.card}
              >
                {block ? (
                  <SavedBubble
                    block={block}
                    index={index}
                    segmentId={section.id}
                    citationBook={section.bookName}
                    storyTitle={section.title}
                    emoji={item.emoji || (item.note ? '✎' : null)}
                  />
                ) : (
                  <Text style={[styles.fallback, { color: palette.ink }]}>
                    {item.note || t('UI.thread.savedReaction')}
                  </Text>
                )}
                {!!item.note && (
                  <Text style={[styles.note, { color: palette.mute, borderTopColor: palette.hair }]}>
                    {item.note}
                  </Text>
                )}
              </Pressable>
            );
          }}
        />
      )}
      <SavedFilterSheet
        visible={sheetOpen}
        filters={filters}
        speakers={speakers}
        books={savedBooks}
        language={language}
        palette={palette}
        onClose={() => setSheetOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setSheetOpen(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
  },
  page: { fontSize: 22, fontWeight: '600', flex: 1 },
  filterBtn: { padding: 4 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  search: {
    marginHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { fontSize: 15, padding: 0 },
  empty: { paddingHorizontal: 14, paddingTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyBody: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  header: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4 },
  story: { fontSize: 16, fontWeight: '600' },
  ref: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  card: { paddingHorizontal: 10, paddingBottom: 10, paddingTop: 8 },
  fallback: { fontSize: 15, lineHeight: 22, paddingHorizontal: 8, paddingVertical: 8 },
  note: {
    marginTop: 8,
    marginHorizontal: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default SavedScreen;
