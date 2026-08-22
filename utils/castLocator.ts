import { NARRATION_VOICES } from '@/utils/voicesMet';
import { collectTurnText } from '@/utils/shareTurn';

type Block = { source?: { sourceName?: string }; children?: unknown };

function wordsIn(block: Block): number {
  return collectTurnText(block).split(/\s+/).filter(Boolean).length;
}

function speakerOf(block: Block): string {
  return block?.source?.sourceName || '';
}

/** First bubble of this voice's longest consecutive speech in the story. */
export function findLongestSpeechStart(blocks: Block[], voiceName: string): number {
  let bestStart = -1;
  let bestWords = 0;
  let i = 0;
  while (i < blocks.length) {
    if (speakerOf(blocks[i]) !== voiceName) {
      i += 1;
      continue;
    }
    const start = i;
    let words = 0;
    while (i < blocks.length && speakerOf(blocks[i]) === voiceName) {
      words += wordsIn(blocks[i]);
      i += 1;
    }
    if (words > bestWords) {
      bestWords = words;
      bestStart = start;
    }
  }
  return bestStart;
}

/**
 * First bubble of the longest back-and-forth between two voices,
 * matching the adjacency rules used to build conversations.json.
 */
export function findExchangeStart(blocks: Block[], voiceName: string, partnerName: string): number {
  type Turn = { name: string; start: number };
  const seq: Turn[] = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const name = speakerOf(blocks[i]);
    if (!name) continue;
    const last = seq[seq.length - 1];
    if (last && last.name === name) continue;
    seq.push({ name, start: i });
  }
  const spoken = seq.filter((turn) => !NARRATION_VOICES.has(turn.name));

  let bestStart = -1;
  let bestLen = 0;
  let i = 0;
  while (i < spoken.length) {
    if (i + 1 >= spoken.length) break;
    const a = spoken[i].name;
    const b = spoken[i + 1].name;
    if (a === b) {
      i += 1;
      continue;
    }
    const pair = (a === voiceName && b === partnerName) || (a === partnerName && b === voiceName);
    let len = 2;
    let j = i + 2;
    while (j < spoken.length) {
      const expect = (j - i) % 2 === 0 ? a : b;
      if (spoken[j].name !== expect) break;
      len += 1;
      j += 1;
    }
    if (pair && len >= 3 && len > bestLen) {
      bestLen = len;
      bestStart = spoken[i].start;
    }
    i += Math.max(1, len - 1);
  }

  if (bestStart >= 0) return bestStart;
  return blocks.findIndex((block) => speakerOf(block) === voiceName);
}
