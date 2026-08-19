import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import Books from '@/assets/data/BookChapterList.json';
import conversations from '@/assets/data/conversations.json';
import {
  DIVISIONS,
  divisionForStory,
  storiesInDivision,
  storyNumber,
  type Division,
} from '@/constants/divisions';
import { DEPTH_X, ROW_HEIGHT, buildThread, type ThreadRow } from '@/components/thread/buildThread';
import { DUR, SPRING, timing } from '@/constants/Motion';
import { ThreadColors, inkHex } from '@/constants/Colors';
import { dominantInk } from '@/utils/ink';
import { localizeBookName, localizeStoryTitle, localizeVoiceName, formatCount } from '@/utils/localize';
import { ConversationsFile } from '@/types/conversations';
import { bibleLoader } from '@/services/BibleLoader';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { FilterChip } from '@/components/thread/FilterChip';
import { hapticImpactLight, hapticSelection } from '@/utils/haptics';
import { formatReadingMinutes, getSegmentReadingTime } from '@/utils/readingTime';
import { resolveContinueTarget, type ActiveReading } from '@/utils/continueTarget';
import { getPlanProgress } from '@/api/sqlite';
import { getActivePlanFromDB } from '@/api/sqlite';

type Scope = 'all' | 'voices' | 'books' | 'stories' | 'words';

interface ThreadListProps {
  completedIds: Set<string>;
  currentId?: string | null;
  storyFilter?: string[];
  hideSearch?: boolean;
}

type VisibleKind = 'division' | 'book' | 'story';

type VisibleRow = ThreadRow & {
  kind: VisibleKind;
  division?: Division;
  bookId?: string;
  bookName?: string;
  storyId?: string;
  current?: boolean;
};

const conv = conversations as ConversationsFile;
const titles = SegmentTitles as Record<string, { title?: string; ref?: string; book?: string[] }>;
const books = Books as Record<string, { bookName: string; segments: string[] }>;

const AnimatedPath = Animated.createAnimatedComponent(Path);

function booksForDivision(division: Division, allowed: Set<string> | null) {
  const inDivision = new Set(storiesInDivision(division));
  return Object.entries(books)
    .map(([id, info]) => ({
      id,
      name: info.bookName,
      stories: (info.segments || []).filter((storyId) => {
        if (!storyId.startsWith('S') || !inDivision.has(storyId)) return false;
        return !allowed || allowed.has(storyId);
      }),
    }))
    .filter((book) => book.stories.length > 0);
}

const ThreadList: React.FC<ThreadListProps> = ({
  completedIds,
  currentId,
  storyFilter,
  hideSearch,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const lang = language.startsWith('fr') ? 'fr' : 'en';
  const [openDivision, setOpenDivision] = useState(0);
  const [openBook, setOpenBook] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [activeReading, setActiveReading] = useState<ActiveReading | null>(null);
  const seeded = useRef(false);

  const bible = bibleLoader.getCurrentBible();
  const allowed = useMemo(() => (storyFilter ? new Set(storyFilter) : null), [storyFilter]);

  useEffect(() => {
    if (hideSearch) return;
    let alive = true;
    (async () => {
      try {
        const plan = await getActivePlanFromDB();
        if (!alive) return;
        const planId = plan?.planId || plan?.itemID || null;
        if (planId) {
          const progress = await getPlanProgress(planId);
          if (!alive) return;
          setActiveReading({
            id: planId,
            type: 'plan',
            completedIds: new Set(progress?.completedSegmentIds || []),
          });
        } else {
          setActiveReading(null);
        }
      } catch {
        if (alive) setActiveReading(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [hideSearch, completedIds]);

  useEffect(() => {
    if (seeded.current || !currentId) return;
    const division = divisionForStory(currentId);
    if (!division) return;
    seeded.current = true;
    setOpenDivision(division.id);
    setOpenBook(titles[currentId]?.book?.[0] || null);
  }, [currentId]);

  const divisions = useMemo(() => {
    return DIVISIONS.map((division) => {
      const stories = storiesInDivision(division).filter((id) => !allowed || allowed.has(id));
      const completed = stories.filter((id) => completedIds.has(id)).length;
      return { division, stories, completed, books: booksForDivision(division, allowed) };
    }).filter((entry) => entry.stories.length > 0);
  }, [allowed, completedIds]);

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
        });
        if (openBook !== book.id) continue;
        const unread = book.stories.filter((id) => !completedIds.has(id));
        const nextUnread = unread.length
          ? unread.reduce((best, id) => {
              const n = storyNumber(id) || 999;
              const b = storyNumber(best) || 999;
              return n < b ? id : best;
            }, unread[0])
          : null;
        for (const id of book.stories) {
          const current = currentId === id || (!completedIds.has(id) && id === nextUnread);
          rows.push({
            key: id,
            kind: 'story',
            depth: 2,
            height: current ? ROW_HEIGHT.current : ROW_HEIGHT.story,
            storyId: id,
            current,
          });
        }
      }
    }
    return rows;
  }, [completedIds, currentId, divisions, openBook, openDivision]);

  const thread = useMemo(
    () => buildThread(visibleRows.map(({ key, depth, height }) => ({ key, depth, height }))),
    [visibleRows]
  );

  const progress = useSharedValue(0);
  const prevLength = useSharedValue(0);
  const scrollY = useSharedValue(0);

  useEffect(() => {
    if (!thread.length) return;
    const from = prevLength.value > 0 ? Math.min(prevLength.value / thread.length, 1) : 0;
    progress.value = from;
    progress.value = withTiming(1, timing(DUR.slow));
    prevLength.value = thread.length;
  }, [prevLength, progress, thread.length]);

  const pathProps = useAnimatedProps(() => ({
    strokeDashoffset: thread.length * (1 - progress.value),
  }));

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, 60], [0, -20], Extrapolation.CLAMP) }],
  }));

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const searchResults = useMemo(() => {
    if (!searching) return { voices: [], books: [], stories: [] };
    const voices = Object.values(conv.voices)
      .filter((voice) => localizeVoiceName(voice.name, language).toLowerCase().includes(q) || voice.name.toLowerCase().includes(q))
      .sort((a, b) => b.words - a.words)
      .slice(0, 20);
    const bookHits = Object.entries(books)
      .filter(([, info]) => info.bookName.toLowerCase().includes(q))
      .map(([id, info]) => ({
        id,
        name: info.bookName,
        stories: (info.segments || []).filter((s) => s.startsWith('S')).length,
      }));
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
        minutes: getSegmentReadingTime(id),
      }));
    return { voices, books: bookHits, stories: storyHits };
  }, [language, q, searching]);

  const continueTarget = hideSearch || searching
    ? null
    : resolveContinueTarget(completedIds, currentId, activeReading);
  const continueInfo = continueTarget
    ? titles[continueTarget.storyId]
    : null;
  const continueMinutes = continueTarget ? getSegmentReadingTime(continueTarget.storyId) : 0;

  const openStory = (id: string, extra?: { planId?: string; challengeId?: string }) => {
    void hapticImpactLight();
    if (extra?.planId || extra?.challengeId) {
      router.push({
        pathname: '/[segment]',
        params: {
          segment: id,
          ...(extra.planId ? { planId: extra.planId } : {}),
          ...(extra.challengeId ? { challengeId: extra.challengeId } : {}),
        },
      });
    } else {
      router.push(`/${id}`);
    }
  };

  const toggleDivision = (id: number, firstBookId?: string) => {
    void hapticSelection();
    if (openDivision === id) {
      setOpenDivision(0);
      setOpenBook(null);
      return;
    }
    setOpenDivision(id);
    const currentBook = currentId ? titles[currentId]?.book?.[0] : null;
    const currentDiv = currentId ? divisionForStory(currentId)?.id : null;
    setOpenBook(currentDiv === id && currentBook ? currentBook : firstBookId || null);
  };

  const toggleBook = (id: string) => {
    void hapticSelection();
    setOpenBook((current) => (current === id ? null : id));
  };

  const scopes: Scope[] = ['all', 'voices', 'books', 'stories', 'words'];
  const showVoices = scope === 'all' || scope === 'voices';
  const showBooks = scope === 'all' || scope === 'books';
  const showStories = scope === 'all' || scope === 'stories' || scope === 'words';

  const continueKicker =
    continueTarget?.kind === 'plan'
      ? t('UI.thread.day', { n: continueTarget.day })
      : continueTarget?.kind === 'continue'
        ? t('UI.thread.continueTitle')
        : t('UI.thread.today');

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      {!hideSearch && continueTarget && continueInfo && (
        <Animated.View
          entering={FadeInDown.duration(DUR.base).springify().damping(SPRING.damping).stiffness(SPRING.stiffness)}
          style={cardStyle}
        >
          <Pressable
            onPress={() => openStory(continueTarget.storyId, {
              planId: continueTarget.planId,
              challengeId: continueTarget.challengeId,
            })}
            style={[styles.continue, { backgroundColor: palette.surf, borderColor: palette.hair }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.continueKicker, { color: palette.acc }]}>{continueKicker}</Text>
              <Text style={[styles.continueTitle, { color: palette.ink }]}>
                {localizeStoryTitle(continueTarget.storyId, continueInfo.title || continueTarget.storyId, language)}
              </Text>
              <Text style={[styles.continueMeta, { color: palette.mute }]}>
                {continueInfo.book?.[0]} {continueInfo.ref}
                {continueMinutes ? ` · ${formatReadingMinutes(continueMinutes)}` : ''}
              </Text>
            </View>
            <Text style={[styles.continueGo, { color: palette.acc }]}>▶</Text>
          </Pressable>
        </Animated.View>
      )}
      {!hideSearch && !searching && openDivision === 0 && (
        <Text style={[styles.nudge, { color: palette.mute }]}>{t('UI.thread.nudge')}</Text>
      )}
      {!hideSearch && (
        <View style={[styles.search, { backgroundColor: palette.surf, borderColor: palette.hair }]}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('UI.thread.searchPlaceholder')}
            placeholderTextColor={palette.mute}
            style={[styles.searchInput, { color: palette.ink }]}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      )}
      {searching && (
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scopes}
          style={styles.scopeScroll}
        >
          {scopes.map((item) => (
            <FilterChip
              key={item}
              label={t(`UI.thread.scope${item.charAt(0).toUpperCase()}${item.slice(1)}`)}
              selected={scope === item}
              onPress={() => setScope(item)}
              palette={palette}
            />
          ))}
        </Animated.ScrollView>
      )}
      <Animated.ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {searching ? (
          <View>
            {showVoices && searchResults.voices.length > 0 && (
              <View>
                <Text style={[styles.groupLabel, { color: palette.mute }]}>{t('UI.thread.scopeVoices')}</Text>
                {searchResults.voices.map((voice) => (
                  <Pressable
                    key={voice.name}
                    onPress={() => router.push(`/cast/${encodeURIComponent(voice.name)}`)}
                    style={[styles.row, { borderBottomColor: palette.hair }]}
                  >
                    <View style={[styles.dot, { backgroundColor: inkHex(voice.color, palette) }]} />
                    <View style={styles.rowBody}>
                      <Text style={[styles.rowTitle, { color: palette.ink }]}>{localizeVoiceName(voice.name, language)}</Text>
                      <Text style={[styles.rowMeta, { color: palette.mute }]}>
                        {voice.storyIds.length} {t('UI.thread.stories')}
                      </Text>
                    </View>
                    <Text style={[styles.rowCount, { color: palette.mute }]}>{formatCount(voice.words)} w</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {showBooks && searchResults.books.length > 0 && (
              <View>
                <Text style={[styles.groupLabel, { color: palette.mute }]}>{t('UI.thread.scopeBooks')}</Text>
                {searchResults.books.map((book) => (
                  <View key={book.id} style={[styles.row, { borderBottomColor: palette.hair }]}>
                    <View style={styles.rowBody}>
                      <Text style={[styles.rowTitle, { color: palette.ink }]}>{book.name}</Text>
                    </View>
                    <Text style={[styles.rowCount, { color: palette.mute }]}>{book.stories}</Text>
                  </View>
                ))}
              </View>
            )}
            {showStories && searchResults.stories.length > 0 && (
              <View>
                <Text style={[styles.groupLabel, { color: palette.mute }]}>{t('UI.thread.scopeStories')}</Text>
                {searchResults.stories.map((story) => (
                  <Pressable
                    key={story.id}
                    onPress={() => openStory(story.id)}
                    style={[styles.row, { borderBottomColor: palette.hair }]}
                  >
                    <View style={styles.rowBody}>
                      <Text style={[styles.rowTitle, { color: palette.ink }]}>{story.title}</Text>
                      <Text style={[styles.rowMeta, { color: palette.mute }]}>
                        {story.ref}
                        {story.minutes ? ` · ${formatReadingMinutes(story.minutes)}` : ''}
                      </Text>
                    </View>
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
                const entry = divisions.find((item) => item.division.id === row.division?.id);
                const open = openDivision === row.division.id;
                return (
                  <Pressable
                    key={row.key}
                    onPress={() => toggleDivision(row.division!.id, entry?.books[0]?.id)}
                    style={[styles.threadRow, { height: row.height }]}
                  >
                    <View
                      style={[
                        styles.knot,
                        {
                          left: mark.x - 6,
                          top: row.height / 2 - 6,
                          borderColor: palette.thread,
                          backgroundColor: open ? palette.acc : palette.bg,
                        },
                      ]}
                    />
                    <View style={[styles.rowBody, { paddingLeft: DEPTH_X[0] + 16 }]}>
                      <Text style={[styles.divisionTitle, { color: palette.ink }]}>
                        {lang === 'fr' ? row.division.titleFr : row.division.titleEn}
                      </Text>
                      <Text style={[styles.divisionBooks, { color: palette.mute }]}>
                        {lang === 'fr' ? row.division.booksFr : row.division.booksEn}
                      </Text>
                    </View>
                    <Text style={[styles.divisionCount, { color: palette.mute }]}>
                      {entry && entry.completed > 0 ? `${entry.completed} / ${entry.stories.length}` : `${entry?.stories.length || 0}`}
                    </Text>
                  </Pressable>
                );
              }
              if (row.kind === 'book') {
                const open = openBook === row.bookId;
                const bookStories = divisions
                  .find((item) => item.division.id === row.division?.id)
                  ?.books.find((book) => book.id === row.bookId)?.stories.length;
                return (
                  <Pressable
                    key={row.key}
                    onPress={() => toggleBook(row.bookId!)}
                    style={[styles.threadRow, { height: row.height }]}
                  >
                    <View
                      style={[
                        styles.bead,
                        {
                          left: mark.x - 7,
                          top: row.height / 2 - 7,
                          borderColor: palette.bg,
                          backgroundColor: open ? palette.ink : 'transparent',
                          borderWidth: open ? 3 : 1.5,
                        },
                        !open && { borderColor: palette.thread, width: 8, height: 8, left: mark.x - 4, top: row.height / 2 - 4 },
                      ]}
                    />
                    <View style={[styles.rowBody, { paddingLeft: DEPTH_X[1] + 16 }]}>
                      <Text style={[styles.bookTitle, { color: palette.ink }]}>
                        {localizeBookName(row.bookId || '', row.bookName || '', language)}
                      </Text>
                    </View>
                    <Text style={[styles.divisionCount, { color: palette.mute }]}>{bookStories}</Text>
                  </Pressable>
                );
              }
              const id = row.storyId!;
              const info = titles[id];
              const done = completedIds.has(id);
              const current = !!row.current;
              const colors = bible?.[id]?.colors;
              const ink = dominantInk(colors || {});
              const minutes = getSegmentReadingTime(id);
              const title = localizeStoryTitle(id, info?.title || id, language);
              const beadSize = current ? 15 : 14;
              return (
                <Pressable key={row.key} onPress={() => openStory(id)} style={[styles.threadRow, { height: row.height }]} hitSlop={12}>
                  <View
                    style={[
                      styles.bead,
                      {
                        width: beadSize,
                        height: beadSize,
                        borderRadius: beadSize / 2,
                        left: mark.x - beadSize / 2,
                        top: row.height / 2 - beadSize / 2,
                        borderWidth: 3,
                        borderColor: palette.bg,
                        backgroundColor: done
                          ? inkHex(ink, palette)
                          : current
                            ? palette.acc
                            : 'transparent',
                      },
                      !done && !current && { borderWidth: 1.5, borderColor: palette.thread, width: 8, height: 8, left: mark.x - 4, top: row.height / 2 - 4 },
                    ]}
                  />
                  <View style={[styles.storyText, { paddingLeft: DEPTH_X[2] + 16 }]}>
                    <Text
                      style={[
                        styles.storyTitle,
                        { color: done ? palette.mute : palette.ink },
                        current && styles.storyNow,
                      ]}
                    >
                      {title}
                    </Text>
                    <Text style={[styles.storyRef, { color: current ? palette.acc : palette.mute }]}>
                      {info?.book?.[0]} {info?.ref}
                      {minutes ? ` · ${formatReadingMinutes(minutes)}` : ''}
                      {done ? ` · ${t('UI.thread.read')}` : current ? ` · ${t('UI.thread.continue')}` : ''}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  continue: {
    marginHorizontal: 14,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  continueKicker: { fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '600' },
  continueTitle: { fontSize: 18, fontWeight: '600', marginTop: 2 },
  continueMeta: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 3 },
  continueGo: { fontSize: 14 },
  nudge: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 10,
    marginBottom: 2,
    paddingHorizontal: 14,
  },
  search: {
    marginHorizontal: 14,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { fontSize: 15, padding: 0 },
  scopeScroll: { flexGrow: 0 },
  scopes: { alignItems: 'flex-start', paddingHorizontal: 14, paddingTop: 10, gap: 6 },
  list: { paddingBottom: 120 },
  threadWrap: { position: 'relative', paddingTop: 0 },
  threadRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 14 },
  knot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1.5,
    transform: [{ rotate: '45deg' }],
  },
  bead: { position: 'absolute', width: 14, height: 14, borderRadius: 7, borderWidth: 3 },
  rowBody: { flex: 1 },
  divisionTitle: { fontSize: 15, fontWeight: '600' },
  divisionBooks: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 },
  divisionCount: { fontSize: 10, fontVariant: ['tabular-nums'] },
  bookTitle: { fontSize: 14, fontWeight: '500' },
  storyText: { flex: 1, paddingVertical: 6 },
  storyTitle: { fontSize: 14 },
  storyNow: { fontSize: 18, fontWeight: '600' },
  storyRef: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  groupLabel: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowTitle: { fontSize: 15 },
  rowMeta: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  rowCount: { fontSize: 10, fontVariant: ['tabular-nums'] },
});

export default ThreadList;
