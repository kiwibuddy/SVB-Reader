import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import Books from '@/assets/data/BookChapterList.json';
import conversations from '@/assets/data/conversations.json';
import {
  DIVISIONS,
  storiesInDivision,
  type Division,
} from '@/constants/divisions';
import { DEPTH_X, ROW_HEIGHT, buildThread, type ThreadRow } from '@/components/thread/buildThread';
import { useThreadReveal } from '@/hooks/useThreadReveal';
import { ThreadRevealRow } from '@/components/thread/ThreadRevealRow';
import { ThreadColors, inkHex, type ThreadPalette } from '@/constants/Colors';
import { localizeBookName, localizeStoryTitle, localizeVoiceName, formatCount } from '@/utils/localize';
import { ConversationsFile } from '@/types/conversations';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { FilterChip } from '@/components/thread/FilterChip';
import SearchField from '@/components/thread/SearchField';
import { hapticImpactLight, hapticSelection } from '@/utils/haptics';
import { lookupReference, type ReferenceLookup } from '@/utils/reference';
import { BookBead, StoryBead, ThreadKnot } from '@/components/thread/ThreadBead';

type Scope = 'all' | 'voices' | 'books' | 'stories';

type Props = {
  selected: Set<string>;
  onChangeSelected: (next: Set<string>) => void;
  /** Extra bottom padding so sticky CTA doesn't cover rows */
  bottomInset?: number;
};

type VisibleKind = 'division' | 'book' | 'story';

type VisibleRow = ThreadRow & {
  kind: VisibleKind;
  division?: Division;
  bookId?: string;
  bookName?: string;
  storyId?: string;
  bookStories?: string[];
};

const conv = conversations as ConversationsFile;
const titles = SegmentTitles as Record<string, { title?: string; ref?: string; book?: string[] }>;
const books = Books as Record<string, { bookName: string; segments: string[] }>;

const AnimatedPath = Animated.createAnimatedComponent(Path);

function booksForDivision(division: Division) {
  const inDivision = new Set(storiesInDivision(division));
  return Object.entries(books)
    .map(([id, info]) => ({
      id,
      name: info.bookName,
      stories: (info.segments || []).filter(
        (storyId) => storyId.startsWith('S') && inDivision.has(storyId)
      ),
    }))
    .filter((book) => book.stories.length > 0);
}

function storyIdsForBook(bookId: string): string[] {
  return (books[bookId]?.segments || []).filter((id) => id.startsWith('S'));
}

function SelectionControl({
  state,
  onPress,
  palette,
}: {
  state: 'none' | 'some' | 'all';
  onPress: () => void;
  palette: ThreadPalette;
}) {
  const checked = state === 'all';
  const mixed = state === 'some';
  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation?.();
        onPress();
      }}
      hitSlop={10}
      style={[
        styles.selectBtn,
        {
          borderColor: checked || mixed ? palette.acc : palette.mute,
          backgroundColor: checked ? palette.acc : 'transparent',
        },
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: checked ? true : mixed ? 'mixed' : false }}
    >
      <Text
        style={{
          color: checked ? palette.bg : mixed ? palette.acc : palette.mute,
          fontSize: checked || mixed ? 12 : 16,
          fontWeight: '700',
          lineHeight: 16,
        }}
      >
        {checked ? '✓' : mixed ? '–' : '+'}
      </Text>
    </Pressable>
  );
}

function selectionState(ids: string[], selected: Set<string>): 'none' | 'some' | 'all' {
  if (!ids.length) return 'none';
  let n = 0;
  for (const id of ids) if (selected.has(id)) n += 1;
  if (n === 0) return 'none';
  if (n === ids.length) return 'all';
  return 'some';
}

const PlanStoryPicker: React.FC<Props> = ({ selected, onChangeSelected, bottomInset = 0 }) => {
  const { width: windowWidth } = useWindowDimensions();
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette: ThreadPalette = isDarkMode ? ThreadColors.dark : ThreadColors.light;

  const [openDivision, setOpenDivision] = useState(0);
  const [openBook, setOpenBook] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [expandedSearch, setExpandedSearch] = useState<{ type: 'voice' | 'book'; id: string } | null>(
    null
  );

  const toggleStories = (ids: string[]) => {
    void hapticImpactLight();
    const next = new Set(selected);
    const allOn = ids.length > 0 && ids.every((id) => next.has(id));
    if (allOn) {
      for (const id of ids) next.delete(id);
    } else {
      for (const id of ids) next.add(id);
    }
    onChangeSelected(next);
  };

  const toggleOne = (id: string) => toggleStories([id]);

  const divisions = useMemo(() => {
    return DIVISIONS.map((division) => ({
      division,
      books: booksForDivision(division),
      stories: storiesInDivision(division),
    })).filter((entry) => entry.books.length > 0);
  }, []);

  const visibleRows: VisibleRow[] = useMemo(() => {
    const rows: VisibleRow[] = [];
    for (const entry of divisions) {
      rows.push({
        key: `d-${entry.division.id}`,
        kind: 'division',
        depth: 0,
        height: ROW_HEIGHT.division,
        division: entry.division,
      });
      if (openDivision !== entry.division.id) continue;
      for (const book of entry.books) {
        rows.push({
          key: `b-${book.id}`,
          kind: 'book',
          depth: 1,
          height: ROW_HEIGHT.book,
          bookId: book.id,
          bookName: book.name,
          division: entry.division,
          bookStories: book.stories,
        });
        if (openBook !== book.id) continue;
        for (const id of book.stories) {
          rows.push({
            key: id,
            kind: 'story',
            depth: 2,
            height: ROW_HEIGHT.story,
            storyId: id,
          });
        }
      }
    }
    return rows;
  }, [divisions, openBook, openDivision]);

  const thread = useMemo(
    () =>
      buildThread(
        visibleRows.map(({ key, depth, height }) => ({ key, depth, height })),
        { width: windowWidth }
      ),
    [visibleRows, windowWidth]
  );

  const { progress, pathProps } = useThreadReveal(thread.length);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const searchResults = useMemo(() => {
    if (!searching) return { voices: [], books: [], stories: [], refResult: { kind: 'notFound' } as ReferenceLookup };
    const voices = Object.values(conv.voices)
      .filter(
        (voice) =>
          localizeVoiceName(voice.name, language).toLowerCase().includes(q) ||
          voice.name.toLowerCase().includes(q)
      )
      .sort((a, b) => b.words - a.words)
      .slice(0, 20);
    const bookHits = Object.entries(books)
      .filter(([, info]) => info.bookName.toLowerCase().includes(q))
      .map(([id, info]) => {
        const storyIds = (info.segments || []).filter((s) => s.startsWith('S'));
        return { id, name: info.bookName, storyIds, stories: storyIds.length };
      });
    const storyHits = Object.entries(titles)
      .filter(([id, info]) => {
        if (!id.startsWith('S')) return false;
        const title = localizeStoryTitle(id, info.title || id, language);
        return title.toLowerCase().includes(q) || (info.ref || '').toLowerCase().includes(q);
      })
      .slice(0, 20)
      .map(([id, info]) => ({
        id,
        title: localizeStoryTitle(id, info.title || id, language),
        ref: info.ref || '',
      }));
    let refResult: ReferenceLookup = { kind: 'notFound' };
    if (/\d/.test(q)) {
      try {
        refResult = lookupReference(query.trim());
      } catch {
        /* ignore */
      }
    }
    return { voices, books: bookHits, stories: storyHits, refResult };
  }, [language, q, query, searching]);

  const hasRefHit =
    searchResults.refResult?.kind === 'exact' || searchResults.refResult?.kind === 'disambiguate';
  const hasVoices = searchResults.voices.length > 0;
  const hasBooks = searchResults.books.length > 0;
  const hasStories = searchResults.stories.length > 0;
  const availableScopes = useMemo(() => {
    if (!searching) return [] as Scope[];
    const next: Scope[] = [];
    if (hasVoices || hasBooks || hasStories || hasRefHit) next.push('all');
    if (hasVoices) next.push('voices');
    if (hasBooks) next.push('books');
    if (hasStories) next.push('stories');
    return next;
  }, [hasBooks, hasRefHit, hasStories, hasVoices, searching]);

  useEffect(() => {
    if (!searching) {
      if (scope !== 'all') setScope('all');
      return;
    }
    if (availableScopes.length > 0 && !availableScopes.includes(scope)) {
      setScope(availableScopes[0]);
    }
  }, [availableScopes, scope, searching]);

  const showVoices = scope === 'all' || scope === 'voices';
  const showBooks = scope === 'all' || scope === 'books';
  const showStories = scope === 'all' || scope === 'stories';

  const toggleDivision = (id: number, firstBookId?: string) => {
    void hapticSelection();
    if (openDivision === id) {
      setOpenDivision(0);
      setOpenBook(null);
      return;
    }
    setOpenDivision(id);
    setOpenBook(firstBookId || null);
  };

  const toggleBook = (id: string) => {
    void hapticSelection();
    setOpenBook((current) => (current === id ? null : id));
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <View style={[styles.searchHeader, { backgroundColor: palette.bg }]}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={t('UI.thread.searchPlaceholder')}
          palette={palette}
          isDarkMode={isDarkMode}
          clearLabel={t('UI.search.clearSearch')}
          style={styles.search}
        />
        {searching && availableScopes.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.scopeScroll}
            contentContainerStyle={styles.scopes}
          >
            {availableScopes.map((item) => (
              <FilterChip
                key={item}
                label={t(`UI.thread.scope${item.charAt(0).toUpperCase()}${item.slice(1)}`)}
                selected={scope === item}
                onPress={() => {
                  Keyboard.dismiss();
                  setScope(item);
                }}
                palette={palette}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {!searching && openDivision === 0 && (
        <Text style={[styles.nudge, { color: palette.mute }]}>{t('UI.customPlans.pickerNudge')}</Text>
      )}

      <Animated.ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: 24 + bottomInset }]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {searching ? (
          <View>
            {searchResults.refResult?.kind === 'exact' && (() => {
              const refHit = searchResults.refResult;
              if (refHit.kind !== 'exact') return null;
              const r = refHit.result;
              return (
              <View>
                <Text style={[styles.groupLabel, { color: palette.mute }]}>REFERENCE</Text>
                <Pressable
                  onPress={() => toggleOne(r.segmentId)}
                  style={[styles.row, { borderBottomColor: palette.hair }]}
                >
                  <View style={styles.rowBody}>
                    <Text style={[styles.rowTitle, { color: palette.ink }]}>
                      {r.book} {r.chapter}:{r.verse}
                    </Text>
                    <Text style={[styles.rowMeta, { color: palette.mute }]}>{r.segmentId}</Text>
                  </View>
                  <SelectionControl
                    state={selected.has(r.segmentId) ? 'all' : 'none'}
                    onPress={() => toggleOne(r.segmentId)}
                    palette={palette}
                  />
                </Pressable>
              </View>
              );
            })()}
            {searchResults.refResult?.kind === 'disambiguate' && (
              <View>
                <Text style={[styles.groupLabel, { color: palette.mute }]}>DID YOU MEAN?</Text>
                {searchResults.refResult.options.map((opt) => (
                  <Pressable
                    key={opt.bookIndex}
                    onPress={() => setQuery(opt.book + ' ')}
                    style={[styles.row, { borderBottomColor: palette.hair }]}
                  >
                    <View style={styles.rowBody}>
                      <Text style={[styles.rowTitle, { color: palette.ink }]}>{opt.book}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {showVoices && searchResults.voices.length > 0 && (
              <View>
                <Text style={[styles.groupLabel, { color: palette.mute }]}>{t('UI.thread.scopeVoices')}</Text>
                {searchResults.voices.map((voice) => {
                  const storyIds = (voice.storyIds || []).filter((id) => id.startsWith('S'));
                  const open = expandedSearch?.type === 'voice' && expandedSearch.id === voice.name;
                  const state = selectionState(storyIds, selected);
                  return (
                    <View key={voice.name}>
                      <Pressable
                        onPress={() => setExpandedSearch(open ? null : { type: 'voice', id: voice.name })}
                        style={[styles.row, { borderBottomColor: palette.hair }]}
                      >
                        <View style={[styles.dot, { backgroundColor: inkHex(voice.color, palette) }]} />
                        <View style={styles.rowBody}>
                          <Text style={[styles.rowTitle, { color: palette.ink }]}>
                            {localizeVoiceName(voice.name, language)}
                          </Text>
                          <Text style={[styles.rowMeta, { color: palette.mute }]}>
                            {storyIds.length} {t('UI.thread.stories')}
                          </Text>
                        </View>
                        <SelectionControl
                          state={state}
                          onPress={() => toggleStories(storyIds)}
                          palette={palette}
                        />
                      </Pressable>
                      {open &&
                        storyIds.map((id) => {
                          const info = titles[id];
                          return (
                            <Pressable
                              key={id}
                              onPress={() => toggleOne(id)}
                              style={[styles.row, { borderBottomColor: palette.hair, paddingLeft: 28 }]}
                            >
                              <View style={styles.rowBody}>
                                <Text style={[styles.rowTitle, { color: palette.ink }]}>
                                  {localizeStoryTitle(id, info?.title || id, language)}
                                </Text>
                                <Text style={[styles.rowMeta, { color: palette.mute }]}>{info?.ref || ''}</Text>
                              </View>
                              <SelectionControl
                                state={selected.has(id) ? 'all' : 'none'}
                                onPress={() => toggleOne(id)}
                                palette={palette}
                              />
                            </Pressable>
                          );
                        })}
                    </View>
                  );
                })}
              </View>
            )}

            {showBooks && searchResults.books.length > 0 && (
              <View>
                <Text style={[styles.groupLabel, { color: palette.mute }]}>{t('UI.thread.scopeBooks')}</Text>
                {searchResults.books.map((book) => {
                  const open = expandedSearch?.type === 'book' && expandedSearch.id === book.id;
                  const state = selectionState(book.storyIds, selected);
                  return (
                    <View key={book.id}>
                      <Pressable
                        onPress={() => setExpandedSearch(open ? null : { type: 'book', id: book.id })}
                        style={[styles.row, { borderBottomColor: palette.hair }]}
                      >
                        <View style={styles.rowBody}>
                          <Text style={[styles.rowTitle, { color: palette.ink }]}>
                            {localizeBookName(book.id, book.name, language)}
                          </Text>
                          <Text style={[styles.rowMeta, { color: palette.mute }]}>
                            {book.stories} {t('UI.thread.stories')}
                          </Text>
                        </View>
                        <SelectionControl
                          state={state}
                          onPress={() => toggleStories(book.storyIds)}
                          palette={palette}
                        />
                      </Pressable>
                      {open &&
                        book.storyIds.map((id) => {
                          const info = titles[id];
                          return (
                            <Pressable
                              key={id}
                              onPress={() => toggleOne(id)}
                              style={[styles.row, { borderBottomColor: palette.hair, paddingLeft: 28 }]}
                            >
                              <View style={styles.rowBody}>
                                <Text style={[styles.rowTitle, { color: palette.ink }]}>
                                  {localizeStoryTitle(id, info?.title || id, language)}
                                </Text>
                                <Text style={[styles.rowMeta, { color: palette.mute }]}>{info?.ref || ''}</Text>
                              </View>
                              <SelectionControl
                                state={selected.has(id) ? 'all' : 'none'}
                                onPress={() => toggleOne(id)}
                                palette={palette}
                              />
                            </Pressable>
                          );
                        })}
                    </View>
                  );
                })}
              </View>
            )}

            {showStories && searchResults.stories.length > 0 && (
              <View>
                <Text style={[styles.groupLabel, { color: palette.mute }]}>{t('UI.thread.scopeStories')}</Text>
                {searchResults.stories.map((story) => (
                  <Pressable
                    key={story.id}
                    onPress={() => toggleOne(story.id)}
                    style={[styles.row, { borderBottomColor: palette.hair }]}
                  >
                    <View style={styles.rowBody}>
                      <Text style={[styles.rowTitle, { color: palette.ink }]}>{story.title}</Text>
                      <Text style={[styles.rowMeta, { color: palette.mute }]}>{story.ref}</Text>
                    </View>
                    <SelectionControl
                      state={selected.has(story.id) ? 'all' : 'none'}
                      onPress={() => toggleOne(story.id)}
                      palette={palette}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.threadWrap, { height: thread.height }]}>
            <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height={thread.height}>
              <AnimatedPath
                d={thread.d}
                fill="none"
                stroke={palette.thread}
                strokeWidth={1.5}
                strokeDasharray={thread.length}
                animatedProps={pathProps}
              />
            </Svg>
            {visibleRows.map((row, index) => {
              const mark = thread.marks[index];
              if (!mark) return null;

              if (row.kind === 'division' && row.division) {
                const open = openDivision === row.division.id;
                const firstBook = booksForDivision(row.division)[0]?.id;
                return (
                  <ThreadRevealRow key={row.key} index={index} total={visibleRows.length} progress={progress}>
                    <Pressable
                      onPress={() => toggleDivision(row.division!.id, firstBook)}
                      style={[styles.threadRow, { height: row.height }]}
                    >
                      <ThreadKnot x={mark.x} rowHeight={row.height} open={open} palette={palette} />
                      <View style={[styles.rowBody, { paddingLeft: DEPTH_X[0] + 16 }]}>
                        <Text style={[styles.divTitle, { color: palette.ink }]}>
                          {language.startsWith('fr') ? row.division.titleFr : row.division.titleEn}
                        </Text>
                        <Text style={[styles.rowMeta, { color: palette.mute }]}>
                          {language.startsWith('fr') ? row.division.booksFr : row.division.booksEn}
                        </Text>
                      </View>
                    </Pressable>
                  </ThreadRevealRow>
                );
              }

              if (row.kind === 'book' && row.bookId) {
                const open = openBook === row.bookId;
                const ids = row.bookStories || storyIdsForBook(row.bookId);
                const state = selectionState(ids, selected);
                return (
                  <ThreadRevealRow key={row.key} index={index} total={visibleRows.length} progress={progress}>
                    <Pressable
                      onPress={() => toggleBook(row.bookId!)}
                      style={[styles.threadRow, { height: row.height }]}
                    >
                      <BookBead x={mark.x} rowHeight={row.height} open={open} palette={palette} />
                      <View style={[styles.rowBody, { paddingLeft: DEPTH_X[1] + 16 }]}>
                        <Text style={[styles.bookTitle, { color: palette.ink }]}>
                          {localizeBookName(row.bookId!, row.bookName || row.bookId!, language)}
                        </Text>
                        <Text style={[styles.rowMeta, { color: palette.mute }]}>
                          {ids.length} {t('UI.thread.stories')}
                        </Text>
                      </View>
                      <SelectionControl
                        state={state}
                        onPress={() => toggleStories(ids)}
                        palette={palette}
                      />
                    </Pressable>
                  </ThreadRevealRow>
                );
              }

              if (row.kind === 'story' && row.storyId) {
                const id = row.storyId;
                const info = titles[id];
                const on = selected.has(id);
                return (
                  <ThreadRevealRow key={row.key} index={index} total={visibleRows.length} progress={progress}>
                    <Pressable
                      onPress={() => toggleOne(id)}
                      style={[styles.threadRow, { height: row.height }]}
                    >
                      <StoryBead
                        x={mark.x}
                        rowHeight={row.height}
                        done={on}
                        current={false}
                        justCompleted={false}
                        palette={palette}
                      />
                      <View style={[styles.rowBody, { paddingLeft: DEPTH_X[2] + 16 }]}>
                        <Text style={[styles.storyTitle, { color: palette.ink }]}>
                          {localizeStoryTitle(id, info?.title || id, language)}
                        </Text>
                        <Text style={[styles.rowMeta, { color: palette.mute }]}>
                          {info?.book?.[0]} {info?.ref}
                        </Text>
                      </View>
                      <SelectionControl
                        state={on ? 'all' : 'none'}
                        onPress={() => toggleOne(id)}
                        palette={palette}
                      />
                    </Pressable>
                  </ThreadRevealRow>
                );
              }

              return null;
            })}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchHeader: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 4, zIndex: 2 },
  search: { marginBottom: 4 },
  scopeScroll: { marginTop: 4, marginBottom: 2 },
  scopes: { gap: 8, paddingRight: 8 },
  nudge: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  list: { paddingTop: 4 },
  groupLabel: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 6,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowMeta: { fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  threadWrap: { position: 'relative', overflow: 'visible' },
  threadRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 14, zIndex: 1 },
  divTitle: { fontSize: 16, fontWeight: '600' },
  bookTitle: { fontSize: 15, fontWeight: '500' },
  storyTitle: { fontSize: 14 },
  selectBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PlanStoryPicker;
