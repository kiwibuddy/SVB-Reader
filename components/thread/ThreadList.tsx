import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
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
import { DUR, SPRING } from '@/constants/Motion';
import { useThreadReveal } from '@/hooks/useThreadReveal';
import { ThreadRevealRow } from '@/components/thread/ThreadRevealRow';
import { ThreadColors, inkHex } from '@/constants/Colors';
import { localizeBookName, localizeStoryTitle, localizeVoiceName, formatCount } from '@/utils/localize';
import { ConversationsFile } from '@/types/conversations';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { FilterChip } from '@/components/thread/FilterChip';
import { hapticImpactLight, hapticSelection } from '@/utils/haptics';
import { formatReadingMinutes, getSegmentReadingTime } from '@/utils/readingTime';
import { resolveContinueTarget, type ActiveReading } from '@/utils/continueTarget';
import { getPlanProgress, getStartedPlansFromDB, getStartedChallengesFromDB, getChallengeProgress } from '@/api/sqlite';
import { lookupReference, type ReferenceLookup } from '@/utils/reference';
import { openSegment } from '@/utils/openSegment';
import { findCatalogItem, getLocalizedPlanText, nextUnreadStory } from '@/utils/planCatalog';
import { shortStoryId } from '@/utils/threadProgress';
import { BookBead, StoryBead, ThreadKnot } from '@/components/thread/ThreadBead';

type Scope = 'all' | 'voices' | 'books' | 'stories' | 'words';

interface ThreadListProps {
  completedIds: Set<string>;
  currentId?: string | null;
  storyFilter?: string[];
  hideSearch?: boolean;
  storyNav?: { planId?: string; challengeId?: string };
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

function ReferenceSearchResult({ refResult, palette, router, setQuery }: {
  refResult?: ReferenceLookup;
  palette: typeof ThreadColors.light | typeof ThreadColors.dark;
  router: ReturnType<typeof useRouter>;
  setQuery: (q: string) => void;
}) {
  if (!refResult) return null;
  if (refResult.kind === 'exact') {
    const r = refResult.result;
    return (
      <View>
        <Text style={{ fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: palette.mute, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 6 }}>REFERENCE</Text>
        <Pressable
          onPress={() => openSegment(router, r.segmentId, { pos: r.position })}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.hair }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: palette.ink }}>{r.book} {r.chapter}:{r.verse}</Text>
            <Text style={{ fontSize: 11, color: palette.mute, marginTop: 2 }}>{r.segmentId}</Text>
          </View>
        </Pressable>
      </View>
    );
  }
  if (refResult.kind === 'disambiguate') {
    return (
      <View>
        <Text style={{ fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: palette.mute, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 6 }}>DID YOU MEAN?</Text>
        {refResult.options.map((opt) => (
          <Pressable
            key={opt.bookIndex}
            onPress={() => setQuery(opt.book + ' ')}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.hair }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: palette.ink }}>{opt.book}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    );
  }
  return null;
}

const ThreadList: React.FC<ThreadListProps> = ({
  completedIds,
  currentId,
  storyFilter,
  hideSearch,
  storyNav,
}) => {
  const router = useRouter();
  const params = useLocalSearchParams<{ completedSegment?: string }>();
  const justCompletedId = params.completedSegment
    ? shortStoryId(String(params.completedSegment))
    : null;
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const lang = language.startsWith('fr') ? 'fr' : 'en';
  const [openDivision, setOpenDivision] = useState(0);
  const [openBook, setOpenBook] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [expandedSearch, setExpandedSearch] = useState<{ type: 'voice' | 'book'; id: string } | null>(null);
  const [activeReading, setActiveReading] = useState<ActiveReading | null>(null);
  const [startedPlans, setStartedPlans] = useState<{
    id: string;
    type: 'plan' | 'challenge';
    title: string;
    nextStoryId: string | null;
    day?: number;
    done: number;
    total: number;
    isPaused: boolean;
  }[]>([]);
  const seeded = useRef(false);

  const allowed = useMemo(() => (storyFilter ? new Set(storyFilter) : null), [storyFilter]);

  useEffect(() => {
    if (hideSearch) return;
    let alive = true;
    (async () => {
      try {
        const [startedP, startedC] = await Promise.all([
          getStartedPlansFromDB(),
          getStartedChallengesFromDB(),
        ]);
        if (!alive) return;
        const cards = [];
        for (const started of [...startedP, ...startedC]) {
          const item = findCatalogItem(started.id);
          if (!item) continue;
          const progress =
            item.type === 'plan'
              ? await getPlanProgress(item.id)
              : await getChallengeProgress(item.id);
          if (!alive) return;
          const planDone = new Set((progress?.completedSegmentIds || []).map(shortStoryId));
          const next = nextUnreadStory(item.stories, planDone);
          cards.push({
            id: item.id,
            type: item.type,
            title: getLocalizedPlanText(item, 'title', language),
            nextStoryId: next?.storyId || null,
            day: next?.day,
            done: progress?.completedSegments || 0,
            total: item.stories.length,
            isPaused: started.isPaused,
          });
        }
        setStartedPlans(cards);
        const first = cards.find((c) => !c.isPaused) || cards[0];
        if (first) {
          setActiveReading({
            id: first.id,
            type: first.type,
            completedIds: new Set(),
          });
        } else {
          setActiveReading(null);
        }
      } catch {
        if (alive) {
          setStartedPlans([]);
          setActiveReading(null);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [hideSearch, completedIds, language]);

  const seedId = justCompletedId || currentId;
  useEffect(() => {
    if (seeded.current || !seedId) return;
    const division = divisionForStory(seedId);
    if (!division) return;
    seeded.current = true;
    setOpenDivision(division.id);
    setOpenBook(titles[seedId]?.book?.[0] || null);
  }, [seedId]);

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
    () => buildThread(visibleRows.map(({ key, depth, height }) => ({ key, depth, height })), { width: windowWidth }),
    [visibleRows, windowWidth]
  );

  const { progress, pathProps } = useThreadReveal(thread.length);
  const scrollY = useSharedValue(0);

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
        minutes: getSegmentReadingTime(id),
      }));
    // Reference search (D1)
    let refResult: ReferenceLookup = { kind: 'notFound' };
    if (searching && /\d/.test(q)) {
      try { refResult = lookupReference(query.trim()); } catch { /* ignore */ }
    }

    return { voices, books: bookHits, stories: storyHits, refResult };
  }, [language, q, query, searching]);

  const continueTarget = hideSearch || searching
    ? null
    : resolveContinueTarget(completedIds, currentId, activeReading);
  const continueInfo = continueTarget
    ? titles[continueTarget.storyId]
    : null;
  const continueMinutes = continueTarget ? getSegmentReadingTime(continueTarget.storyId) : 0;

  const openStory = (id: string, extra?: { planId?: string; challengeId?: string }) => {
    void hapticImpactLight();
    openSegment(router, id, extra || storyNav);
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
            onPress={() => openStory(continueTarget.storyId)}
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
      {!hideSearch && startedPlans.length > 0 && startedPlans.map((plan) => (
        <Pressable
          key={plan.id}
          onPress={() => {
            if (plan.nextStoryId) {
              openStory(plan.nextStoryId, {
                planId: plan.type === 'plan' ? plan.id : undefined,
                challengeId: plan.type === 'challenge' ? plan.id : undefined,
              });
            } else {
              router.push(`/plan/${plan.id}`);
            }
          }}
          style={[styles.continue, { backgroundColor: palette.surf, borderColor: plan.isPaused ? palette.hair : palette.chor }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.continueKicker, { color: plan.isPaused ? palette.mute : palette.chor }]}>
              {plan.isPaused
                ? (lang === 'fr' ? 'En pause' : 'Paused')
                : plan.day
                  ? t('UI.thread.day', { n: plan.day })
                  : t('UI.thread.yourPlan')}
            </Text>
            <Text style={[styles.continueTitle, { color: palette.ink }]}>{plan.title}</Text>
            <Text style={[styles.continueMeta, { color: palette.mute }]}>
              {plan.done} {t('UI.thread.of')} {plan.total}
              {plan.nextStoryId ? ` · ${localizeStoryTitle(plan.nextStoryId, titles[plan.nextStoryId]?.title || plan.nextStoryId, language)}` : ''}
            </Text>
          </View>
          <Text style={[styles.continueGo, { color: palette.chor }]}>▶</Text>
        </Pressable>
      ))}
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
            <ReferenceSearchResult refResult={searchResults.refResult} palette={palette} router={router} setQuery={setQuery} />
            {showVoices && searchResults.voices.length > 0 && (
              <View>
                <Text style={[styles.groupLabel, { color: palette.mute }]}>{t('UI.thread.scopeVoices')}</Text>
                {searchResults.voices.map((voice) => {
                  const open = expandedSearch?.type === 'voice' && expandedSearch.id === voice.name;
                  return (
                    <View key={voice.name}>
                      <Pressable
                        onPress={() =>
                          setExpandedSearch(open ? null : { type: 'voice', id: voice.name })
                        }
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
                      {open && voice.storyIds.map((id) => {
                        const info = titles[id];
                        return (
                          <Pressable
                            key={id}
                            onPress={() => openStory(id)}
                            style={[styles.row, { borderBottomColor: palette.hair, paddingLeft: 28 }]}
                          >
                            <View style={styles.rowBody}>
                              <Text style={[styles.rowTitle, { color: palette.ink }]}>
                                {localizeStoryTitle(id, info?.title || id, language)}
                              </Text>
                              <Text style={[styles.rowMeta, { color: palette.mute }]}>{info?.ref || ''}</Text>
                            </View>
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
                  return (
                    <View key={book.id}>
                      <Pressable
                        onPress={() =>
                          setExpandedSearch(open ? null : { type: 'book', id: book.id })
                        }
                        style={[styles.row, { borderBottomColor: palette.hair }]}
                      >
                        <View style={styles.rowBody}>
                          <Text style={[styles.rowTitle, { color: palette.ink }]}>{book.name}</Text>
                        </View>
                        <Text style={[styles.rowCount, { color: palette.mute }]}>{book.stories}</Text>
                      </Pressable>
                      {open && book.storyIds.map((id) => {
                        const info = titles[id];
                        return (
                          <Pressable
                            key={id}
                            onPress={() => openStory(id)}
                            style={[styles.row, { borderBottomColor: palette.hair, paddingLeft: 28 }]}
                          >
                            <View style={styles.rowBody}>
                              <Text style={[styles.rowTitle, { color: palette.ink }]}>
                                {localizeStoryTitle(id, info?.title || id, language)}
                              </Text>
                              <Text style={[styles.rowMeta, { color: palette.mute }]}>{info?.ref || ''}</Text>
                            </View>
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
                  <ThreadRevealRow key={row.key} index={index} total={visibleRows.length} progress={progress}>
                    <Pressable
                      onPress={() => toggleDivision(row.division!.id, entry?.books[0]?.id)}
                      style={[styles.threadRow, { height: row.height }]}
                    >
                      <ThreadKnot x={mark.x} rowHeight={row.height} open={open} palette={palette} />
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
                  </ThreadRevealRow>
                );
              }
              if (row.kind === 'book') {
                const open = openBook === row.bookId;
                const bookStories = divisions
                  .find((item) => item.division.id === row.division?.id)
                  ?.books.find((book) => book.id === row.bookId)?.stories.length;
                return (
                  <ThreadRevealRow key={row.key} index={index} total={visibleRows.length} progress={progress}>
                    <Pressable
                      onPress={() => toggleBook(row.bookId!)}
                      style={[styles.threadRow, { height: row.height }]}
                    >
                      <BookBead x={mark.x} rowHeight={row.height} open={open} palette={palette} />
                      <View style={[styles.rowBody, { paddingLeft: DEPTH_X[1] + 16 }]}>
                        <Text style={[styles.bookTitle, { color: palette.ink }]}>
                          {localizeBookName(row.bookId || '', row.bookName || '', language)}
                        </Text>
                      </View>
                      <Text style={[styles.divisionCount, { color: palette.mute }]}>{bookStories}</Text>
                    </Pressable>
                  </ThreadRevealRow>
                );
              }
              const id = row.storyId!;
              const info = titles[id];
              const done = completedIds.has(id);
              const current = !!row.current && !done;
              const minutes = getSegmentReadingTime(id);
              const title = localizeStoryTitle(id, info?.title || id, language);
              return (
                <ThreadRevealRow key={row.key} index={index} total={visibleRows.length} progress={progress}>
                  <Pressable onPress={() => openStory(id)} style={[styles.threadRow, { height: row.height }]} hitSlop={12}>
                    <StoryBead
                      x={mark.x}
                      rowHeight={row.height}
                      done={done}
                      current={current}
                      justCompleted={justCompletedId === id}
                      palette={palette}
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
                </ThreadRevealRow>
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
  threadWrap: { position: 'relative', paddingTop: 0, overflow: 'visible' },
  threadRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 14, zIndex: 1 },
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
