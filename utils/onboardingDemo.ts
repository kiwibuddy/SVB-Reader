import type { BibleBlock } from '@/types';
import { bibleLoader } from '@/services/BibleLoader';
import { getSegmentWordCount } from '@/utils/readingTime';

const DEMO_STORY_ID = 'S008';
const FEATURED_VOICES = ['The Narrator', 'God', 'Abraham', 'Sarah', 'Isaac'] as const;

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
