import type { BibleBlock } from '@/types';
import { bibleLoader } from '@/services/BibleLoader';
import { getSegmentWordCount } from '@/utils/readingTime';
import conversations from '@/assets/data/conversations.json';
import type { ConversationsFile } from '@/types/conversations';
import { DIVISIONS, storyIdFromNumber } from '@/constants/divisions';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import Books from '@/assets/data/BookChapterList.json';

const DEMO_STORY_ID = 'S008';
const LUKE_STORY_ID = 'S290';
const FEATURED_VOICES = ['The Narrator', 'God', 'Abraham', 'Sarah', 'Isaac'] as const;
const conv = conversations as ConversationsFile;
const titles = SegmentTitles as Record<string, { title?: string; ref?: string; book?: string[] }>;
const books = Books as Record<string, { bookName: string; segments: string[] }>;

export const CAST_FAN_VOICES = ['Jesus', 'Samuel', 'David'] as const;
export const HABIT_DEMO_STORIES = 146;
export const HABIT_DEMO_VOICES = 310;
export const HABIT_DEMO_STREAK = 25;

function walkText(node: unknown): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(walkText).join('');
  if (typeof node === 'object') {
    const rec = node as { text?: string; children?: unknown };
    return `${rec.text || ''}${walkText(rec.children)}`;
  }
  return '';
}

export function blockText(block: BibleBlock): string {
  return walkText(block.children).replace(/\s+/g, ' ').trim();
}

function keepLeaves(block: BibleBlock, pred: (text: string) => boolean): BibleBlock {
  const filterNode = (node: unknown): unknown => {
    if (!node || typeof node !== 'object') return node;
    const rec = node as { text?: string; children?: unknown[] };
    if (typeof rec.text === 'string' && !rec.children) {
      return pred(rec.text) ? rec : null;
    }
    if (Array.isArray(rec.children)) {
      const children = rec.children.map(filterNode).filter(Boolean);
      if (!children.length) return null;
      return { ...rec, children };
    }
    return rec;
  };
  return {
    ...block,
    children: ((block.children || []) as unknown[]).map(filterNode).filter(Boolean) as BibleBlock['children'],
  };
}

type StorySegment = {
  content?: BibleBlock[];
  sources?: Record<string, { words: number; color: string }>;
  colors?: { black?: number; red?: number; green?: number; blue?: number; total?: number };
};

function bibleData(bible?: Record<string, StorySegment>): Record<string, StorySegment> | undefined {
  return bible || (bibleLoader.getCurrentBible() as Record<string, StorySegment> | undefined);
}

export function getDemoStory(bible?: Record<string, StorySegment>) {
  const data = bibleData(bible);
  return data?.[DEMO_STORY_ID] || null;
}

export function getAbrahamExchange(bible?: Record<string, StorySegment>): BibleBlock[] {
  const found = findAbrahamExchange(bibleData(bible));
  if (found.length) return found;
  return findAbrahamExchange(bibleLoader.getCurrentBible('en') as Record<string, StorySegment> | undefined);
}

function findAbrahamExchange(data?: Record<string, StorySegment>): BibleBlock[] {
  const content = data?.[DEMO_STORY_ID]?.content || [];
  const godIndex = content.findIndex((block) => {
    const name = block.source?.sourceName;
    const text = blockText(block);
    return name === 'God' && /Abraham!/.test(text) && text.length < 40;
  });
  if (godIndex < 0) return [];

  let narrator: BibleBlock | undefined;
  for (let i = godIndex - 1; i >= 0; i -= 1) {
    if (blockText(content[i]).includes('tested Abraham')) {
      narrator = keepLeaves(content[i], (text) => /tested Abraham/i.test(text));
      break;
    }
  }

  const abraham = content.slice(godIndex + 1).find((block) => {
    return block.source?.sourceName === 'Abraham' && /Here I am/i.test(blockText(block));
  });

  return [narrator, content[godIndex], abraham].filter(Boolean) as BibleBlock[];
}

/** Luke 9:54–58 from S290 — disciples, narrator, Someone Along the Road, Jesus. */
export function getLukeVoiceExchange(bible?: Record<string, StorySegment>): BibleBlock[] {
  const found = findLukeVoiceExchange(bibleData(bible));
  if (found.length) return found;
  return findLukeVoiceExchange(bibleLoader.getCurrentBible('en') as Record<string, StorySegment> | undefined);
}

function findLukeVoiceExchange(data?: Record<string, StorySegment>): BibleBlock[] {
  const content = data?.[LUKE_STORY_ID]?.content || [];
  const fire = content.findIndex((block) => /call down fire from heaven/i.test(blockText(block)));
  if (fire < 0) return [];
  // Opening narrator + the exchange through a few follow-ups so demos can fill the slot
  const start = Math.max(0, fire - 1);
  const slice = content.slice(start, start + 12);
  return slice.filter((block) => blockText(block).length > 0);
}

/** Longer Luke stretch for the Keep backdrop (fills behind the modal). */
export function getLukeKeepBackdrop(bible?: Record<string, StorySegment>): BibleBlock[] {
  return getLukeVoiceExchange(bible).slice(0, 8);
}

/** One short sample block per ink for the Friends reading-parts demo. */
export function getFriendsSampleBlocks(bible?: Record<string, StorySegment>): Record<string, BibleBlock | null> {
  const luke = getLukeVoiceExchange(bible);
  const byInk = (ink: string) => luke.find((b) => (b.source?.color || 'black') === ink) || null;
  return {
    black: byInk('black'),
    red: byInk('red'),
    green: byInk('green'),
    blue: byInk('blue'),
  };
}

export function getShareDemoBlock(bible?: Record<string, StorySegment>): BibleBlock | null {
  return getKeepDemoItems(bible)[0]?.block || null;
}

/** Backdrop bubble for the Keep / long-press modal demo. */
export function getKeepDemoItems(bible?: Record<string, StorySegment>): {
  block: BibleBlock;
  emoji: string;
  noteKey: 'sampleNote' | 'sampleNote2' | null;
  storyId: string;
}[] {
  const luke = getLukeVoiceExchange(bible);
  const jesus = luke.find((b) => b.source?.sourceName === 'Jesus');
  if (jesus) {
    return [{ block: jesus, emoji: '🙏', noteKey: 'sampleNote', storyId: LUKE_STORY_ID }];
  }
  const content = getDemoStory(bible)?.content || [];
  const takeSon = content.find((item) => /Take your son, your only son/i.test(blockText(item)));
  if (!takeSon) return [];
  return [
    {
      block: keepLeaves(takeSon, (text) => /Take your son|only son/i.test(text) && !/^\d+$/.test(text.trim())),
      emoji: '🙏',
      noteKey: 'sampleNote',
      storyId: DEMO_STORY_ID,
    },
  ];
}

export function getCallSheetDemo(bible?: Record<string, StorySegment>) {
  const story = getDemoStory(bible);
  const sources = story?.sources || {};
  const colors = story?.colors || {};
  const voices = FEATURED_VOICES.map((name) => ({
    name,
    words: sources[name]?.words || 0,
    color: sources[name]?.color || 'black',
  })).filter((voice) => voice.words > 0);

  return {
    storyId: DEMO_STORY_ID,
    words: colors.total || getSegmentWordCount(DEMO_STORY_ID),
    colors,
    voices,
    sources,
    readers: (story as { readers?: string[] } | null)?.readers,
  };
}

export const ONBOARDING_STORY_IDS = ['S001', 'S002', 'S003'] as const;

/** Books in The Beginning for the ShapeDemo expand loop. */
export function booksForDivision(divisionId: number) {
  const division = DIVISIONS.find((d) => d.id === divisionId);
  if (!division) return [];
  const inDivision = new Set(
    Array.from({ length: division.end - division.start + 1 }, (_, i) => storyIdFromNumber(division.start + i))
  );
  return Object.entries(books)
    .map(([id, info]) => ({
      id,
      name: info.bookName,
      stories: (info.segments || []).filter((storyId) => storyId.startsWith('S') && inDivision.has(storyId)),
    }))
    .filter((book) => book.stories.length > 0);
}

/** Curated habit demo (~40% of the Bible + a 25-day streak). */
export function getHabitDemo() {
  return {
    streakDays: HABIT_DEMO_STREAK,
    storiesDone: HABIT_DEMO_STORIES,
    voicesMet: HABIT_DEMO_VOICES,
    startStories: 42,
    startVoices: 100,
    startStreak: 5,
  };
}

export function habitCompletedIds(storiesDone: number): Set<string> {
  const completedIds = new Set<string>();
  const n = Math.max(0, Math.min(365, Math.round(storiesDone)));
  for (let i = 1; i <= n; i += 1) {
    completedIds.add(storyIdFromNumber(i));
  }
  return completedIds;
}

export type CastPartner = { name: string; count: number; color: string };

export type CastDemoData = {
  name: string;
  color: string;
  rank: number;
  total: number;
  words: number;
  turns: number;
  storyCount: number;
  bookIds: string[];
  topPartner: CastPartner | null;
  partners: CastPartner[];
  longestSpeech: { words: number; storyId: string; storyTitle: string } | null;
};

/** Real Cast data for a voice from conversations.json. */
export function getCastDemo(voiceName: string = 'David'): CastDemoData | null {
  const voice = conv.voices[voiceName];
  if (!voice) return null;
  const speaking = Object.values(conv.voices).filter((item) => item.group !== 'narration');
  const rank =
    speaking
      .slice()
      .sort((a, b) => b.words - a.words)
      .findIndex((item) => item.name === voiceName) + 1;
  const partners: CastPartner[] = (voice.spokeWith || []).slice(0, 4).map((partner) => ({
    name: partner.name,
    count: partner.count,
    color: conv.voices[partner.name]?.color || 'blue',
  }));
  const bookIds: string[] = [];
  const seen = new Set<string>();
  for (const id of voice.storyIds) {
    const bookId = titles[id]?.book?.[0];
    if (bookId && !seen.has(bookId)) {
      seen.add(bookId);
      bookIds.push(bookId);
    }
  }
  return {
    name: voice.name,
    color: voice.color,
    rank,
    total: speaking.length,
    words: voice.words,
    turns: voice.turns,
    storyCount: voice.storyIds.length,
    bookIds,
    topPartner: partners[0] || null,
    partners,
    longestSpeech: voice.longestSpeech,
  };
}

export function bookNameForId(bookId: string): string {
  return books[bookId]?.bookName || bookId;
}
