import type { BibleBlock } from '@/types';
import { bibleLoader } from '@/services/BibleLoader';
import { getSegmentWordCount } from '@/utils/readingTime';
import conversations from '@/assets/data/conversations.json';
import type { ConversationsFile } from '@/types/conversations';
import { DIVISIONS } from '@/constants/divisions';

const DEMO_STORY_ID = 'S008';
const FEATURED_VOICES = ['The Narrator', 'God', 'Abraham', 'Sarah', 'Isaac'] as const;
const conv = conversations as ConversationsFile;
const CAST_DEMO_VOICE = 'David';
const HABIT_DEMO_DIVISION = DIVISIONS[0]; // "The Beginning" — contains the S008 demo story

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

export function getDemoStory(bible?: Record<string, StorySegment>) {
  const data = bible || (bibleLoader.getCurrentBible() as Record<string, StorySegment> | undefined);
  return data?.[DEMO_STORY_ID] || null;
}

export function getAbrahamExchange(bible?: Record<string, StorySegment>): BibleBlock[] {
  const found = findAbrahamExchange(bible || (bibleLoader.getCurrentBible() as Record<string, StorySegment> | undefined));
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

export function getShareDemoBlock(bible?: Record<string, StorySegment>): BibleBlock | null {
  const content = getDemoStory(bible)?.content || [];
  const block = content.find((item) => /Take your son, your only son/i.test(blockText(item)));
  if (!block) return null;
  return keepLeaves(block, (text) => /Take your son|only son/i.test(text) && !/^\d+$/.test(text.trim()));
}

export function getCallSheetDemo(bible?: Record<string, StorySegment>) {
  const story = getDemoStory(bible);
  const sources = story?.sources || {};
  const voices = FEATURED_VOICES.map((name) => ({
    name,
    words: sources[name]?.words || 0,
    color: sources[name]?.color || 'black',
  })).filter((voice) => voice.words > 0);

  return {
    storyId: DEMO_STORY_ID,
    words: story?.colors?.total || getSegmentWordCount(DEMO_STORY_ID),
    colors: story?.colors || {},
    voices,
  };
}

export const ONBOARDING_STORY_IDS = ['S001', 'S002', 'S003'] as const;

/** Illustrative habit demo: a streak + a plan mid-way through, and one real
 * discussion question in the app's voice. Not the user's real progress —
 * onboarding runs before anyone has read anything — same as the other
 * demos, this is curated, deterministic, and never hits the DB. */
export function getHabitDemo() {
  return {
    streakDays: 12,
    plan: {
      title: HABIT_DEMO_DIVISION.titleEn,
      done: 24,
      total: HABIT_DEMO_DIVISION.end - HABIT_DEMO_DIVISION.start + 1,
    },
  };
}

/** Real Cast data for the demo voice, pulled from the same precomputed
 * conversations.json the live Cast tab reads. No invented numbers. */
export function getCastDemo() {
  const voice = conv.voices[CAST_DEMO_VOICE];
  if (!voice) return null;
  const speaking = Object.values(conv.voices).filter((item) => item.group !== 'narration');
  const rank = speaking.slice().sort((a, b) => b.words - a.words).findIndex((item) => item.name === CAST_DEMO_VOICE) + 1;
  return {
    name: voice.name,
    color: voice.color,
    rank,
    total: speaking.length,
    topPartner: voice.spokeWith[0] || null,
    longestSpeech: voice.longestSpeech,
  };
}
