import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import Books from '@/assets/data/BookChapterList.json';
import conversations from '@/assets/data/conversations.json';
import { DIVISIONS, storiesInDivision, storyNumber } from '@/constants/divisions';
import { ThreadColors, inkHex } from '@/constants/Colors';
import { dominantInk } from '@/utils/ink';
import { localizeStoryTitle, localizeVoiceName, formatCount } from '@/utils/localize';
import { ConversationsFile } from '@/types/conversations';
import { bibleLoader } from '@/services/BibleLoader';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';

type Scope = 'all' | 'voices' | 'books' | 'stories' | 'words';

interface ThreadListProps {
  completedIds: Set<string>;
  currentId?: string | null;
  storyFilter?: string[];
  hideSearch?: boolean;
}

const conv = conversations as ConversationsFile;
const titles = SegmentTitles as Record<string, { title?: string; ref?: string; book?: string[] }>;
const books = Books as Record<string, { bookName: string; segments: string[] }>;

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
  const [openDivision, setOpenDivision] = useState(1);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('all');

  const bible = bibleLoader.getCurrentBible();
  const allowed = storyFilter ? new Set(storyFilter) : null;

  const divisions = useMemo(() => {
    return DIVISIONS.map((division) => {
      const stories = storiesInDivision(division).filter((id) => !allowed || allowed.has(id));
      const completed = stories.filter((id) => completedIds.has(id)).length;
      return { division, stories, completed };
    });
  }, [allowed, completedIds]);

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
      }));
    return { voices, books: bookHits, stories: storyHits };
  }, [language, q, searching]);

  const openStory = (id: string) => {
    router.push(`/${id}`);
  };

  const scopes: Scope[] = ['all', 'voices', 'books', 'stories', 'words'];
  const showVoices = scope === 'all' || scope === 'voices';
  const showBooks = scope === 'all' || scope === 'books';
  const showStories = scope === 'all' || scope === 'stories' || scope === 'words';

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scopes}>
          {scopes.map((item) => (
            <Pressable
              key={item}
              onPress={() => setScope(item)}
              style={[
                styles.chip,
                { borderColor: palette.hair },
                scope === item && { backgroundColor: palette.ink, borderColor: palette.ink },
              ]}
            >
              <Text style={[styles.chipText, { color: scope === item ? palette.bg : palette.mute }]}>
                {t(`UI.thread.scope${item.charAt(0).toUpperCase()}${item.slice(1)}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
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
                      <Text style={[styles.rowMeta, { color: palette.mute }]}>{story.ref}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.threadWrap}>
            <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
              <Path
                d="M30 0 L30 24 C30 46 52 40 52 58 L52 240 C52 260 30 252 30 280 C30 340 32 400 30 1200"
                fill="none"
                stroke={palette.thread}
                strokeWidth={1.5}
              />
            </Svg>
            {divisions.map(({ division, stories, completed }) => {
              const open = openDivision === division.id;
              return (
                <View key={division.id}>
                  <Pressable
                    onPress={() => setOpenDivision(open ? 0 : division.id)}
                    style={styles.division}
                  >
                    <View
                      style={[
                        styles.knot,
                        { borderColor: palette.thread, backgroundColor: open ? palette.acc : palette.bg },
                      ]}
                    />
                    <View style={styles.divisionText}>
                      <Text style={[styles.divisionTitle, { color: palette.ink }]}>
                        {lang === 'fr' ? division.titleFr : division.titleEn}
                      </Text>
                      <Text style={[styles.divisionBooks, { color: palette.mute }]}>
                        {lang === 'fr' ? division.booksFr : division.booksEn}
                      </Text>
                    </View>
                    <Text style={[styles.divisionCount, { color: palette.mute }]}>
                      {completed > 0 ? `${completed} / ${stories.length}` : `${stories.length}`}
                    </Text>
                  </Pressable>
                  {open &&
                    stories.map((id) => {
                      const info = titles[id];
                      const n = storyNumber(id) || 0;
                      const done = completedIds.has(id);
                      const current = currentId === id || (!done && n === Math.min(...stories.filter((s) => !completedIds.has(s)).map((s) => storyNumber(s) || 999)));
                      const colors = bible?.[id]?.colors;
                      const ink = dominantInk(colors || {});
                      const title = localizeStoryTitle(id, info?.title || id, language);
                      return (
                        <Pressable key={id} onPress={() => openStory(id)} style={styles.story}>
                          <View
                            style={[
                              styles.bead,
                              current && styles.beadNow,
                              done && { backgroundColor: inkHex(ink, palette) },
                              !done && !current && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: palette.thread },
                              current && { backgroundColor: palette.acc },
                            ]}
                          />
                          <View style={styles.storyText}>
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
                              {done ? ` · ${t('UI.thread.read')}` : current ? ` · ${t('UI.thread.continue')}` : ''}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  search: {
    marginHorizontal: 14,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { fontSize: 15, padding: 0 },
  scopes: { paddingHorizontal: 14, paddingTop: 10, gap: 6 },
  chip: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 9, paddingVertical: 4, marginRight: 6 },
  chipText: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase' },
  list: { paddingBottom: 120 },
  threadWrap: { position: 'relative', paddingTop: 8 },
  division: { height: 46, paddingLeft: 54, paddingRight: 14, flexDirection: 'row', alignItems: 'center' },
  knot: { position: 'absolute', left: 24, width: 12, height: 12, borderRadius: 3, borderWidth: 1.5, transform: [{ rotate: '45deg' }] },
  divisionText: { flex: 1 },
  divisionTitle: { fontSize: 15, fontWeight: '600' },
  divisionBooks: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 },
  divisionCount: { fontSize: 10, fontVariant: ['tabular-nums'] },
  story: { minHeight: 44, paddingLeft: 74, paddingRight: 14, justifyContent: 'center' },
  bead: { position: 'absolute', left: 48, width: 8, height: 8, borderRadius: 4 },
  beadNow: { width: 15, height: 15, borderRadius: 8, left: 44.5 },
  storyText: { paddingVertical: 6 },
  storyTitle: { fontSize: 14 },
  storyNow: { fontSize: 18, fontWeight: '600' },
  storyRef: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  groupLabel: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15 },
  rowMeta: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  rowCount: { fontSize: 10, fontVariant: ['tabular-nums'] },
});

export default ThreadList;
