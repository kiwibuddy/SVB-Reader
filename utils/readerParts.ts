/**
 * Four reading parts per story.
 *
 * A story is always read by four people, whatever its cast. Each story in
 * `newBibleNLT1.json` carries a four-slot `readers` array holding the ink each
 * part reads — `["black","red","green","blue"]` for a story with all four
 * voices, `["black","black","black","black"]` for one that is narration all the
 * way through. The array is authored so the four parts carry a fair share of the
 * story, so it is the split we display rather than one we recompute.
 *
 * The boxes are those four slots, sorted into ink order so repeated colours sit
 * together. When several slots share an ink they take turns: the k-th bubble of
 * that ink goes to the (k mod n)-th slot holding it. Four grey slots means
 * reader 1 takes bubbles 1, 5, 9…, reader 2 takes 2, 6, 10…, and so on.
 */

import type { BibleBlock } from '@/types';
import type { Ink } from '@/utils/ink';

export interface ReaderSlot {
  /** Position on screen, 0-3. What "reader 3" means when a group says it. */
  index: number;
  ink: Ink;
}

interface ColorCounts {
  black?: number;
  red?: number;
  green?: number;
  blue?: number;
}

export const READER_COUNT = 4;

/** No reader takes this row — an editorial insert or a psalm title. */
export const NO_READER = -1;

/** Narrator first, then divine, principals, everyone else. */
const INK_ORDER: Ink[] = ['black', 'red', 'green', 'blue'];

function isInk(value: unknown): value is Ink {
  return typeof value === 'string' && (INK_ORDER as string[]).includes(value);
}

/**
 * Four inks derived from word counts, for a story whose `readers` array is
 * missing or malformed. Every ink that speaks gets a part; the rest are handed
 * out by largest remainder, so the loudest voice picks up the spare parts.
 */
function deriveReaderInks(colorData?: ColorCounts): Ink[] {
  const present = INK_ORDER.map((ink) => ({ ink, words: colorData?.[ink] || 0 })).filter(
    (entry) => entry.words > 0
  );
  if (present.length === 0) return Array(READER_COUNT).fill('black');

  const total = present.reduce((sum, entry) => sum + entry.words, 0);
  const shares = present.map((entry) => {
    const exact = (entry.words / total) * READER_COUNT;
    return { ...entry, whole: Math.max(1, Math.floor(exact)), remainder: exact - Math.floor(exact) };
  });

  // Trim from the quietest voice if the floors alone already overshoot four.
  let assigned = shares.reduce((sum, share) => sum + share.whole, 0);
  const byWords = [...shares].sort((a, b) => a.words - b.words);
  for (const share of byWords) {
    while (assigned > READER_COUNT && share.whole > 1) {
      share.whole -= 1;
      assigned -= 1;
    }
  }

  // Hand out what is left, biggest remainder first, ties to the loudest voice.
  const byRemainder = [...shares].sort((a, b) => b.remainder - a.remainder || b.words - a.words);
  let cursor = 0;
  while (assigned < READER_COUNT) {
    byRemainder[cursor % byRemainder.length].whole += 1;
    assigned += 1;
    cursor += 1;
  }

  return shares.flatMap((share) => Array(share.whole).fill(share.ink) as Ink[]);
}

/**
 * The four boxes shown above a story, left to right.
 *
 * Sorting is presentation only — it groups repeated inks and keeps the narrator
 * on the left — because which slot a reader picks matters, not which entry of
 * the stored array it came from.
 */
export function readerSlots(readers?: string[], colorData?: ColorCounts): ReaderSlot[] {
  const stored = (readers || []).filter(isInk);
  const inks =
    stored.length === READER_COUNT && stored.length === (readers || []).length
      ? stored
      : deriveReaderInks(colorData);

  return [...inks]
    .sort((a, b) => INK_ORDER.indexOf(a) - INK_ORDER.indexOf(b))
    .map((ink, index) => ({ index, ink }));
}

/**
 * A manuscript note is not a speaking turn. Psalm headings (`kind: 'title'`)
 * are, though — someone says "Psalm 23" out loud — and the reader already
 * glows and dims them like any other turn, so only editorial rows are skipped.
 */
export function isSpokenBlock(block: BibleBlock): boolean {
  return block.source?.kind !== 'editorial';
}

/**
 * The slot that reads each block, parallel to `blocks`. `NO_READER` marks a row
 * nobody takes.
 *
 * Bubbles of an ink are dealt round-robin to the slots holding that ink, in the
 * order they appear in the story. Editorial rows are skipped rather than
 * counted, so a bracketed note cannot push the rest of the story out of step.
 */
export function assignReaders(blocks: BibleBlock[], slots: ReaderSlot[]): number[] {
  const slotsByInk = new Map<Ink, number[]>();
  for (const slot of slots) {
    const list = slotsByInk.get(slot.ink);
    if (list) list.push(slot.index);
    else slotsByInk.set(slot.ink, [slot.index]);
  }

  const seen = new Map<Ink, number>();
  return blocks.map((block) => {
    if (!isSpokenBlock(block)) return NO_READER;
    const ink = (isInk(block.source?.color) ? block.source?.color : 'black') as Ink;
    const candidates = slotsByInk.get(ink);
    // An ink nobody was cast for reads with the first slot rather than nobody.
    if (!candidates || candidates.length === 0) return slots[0]?.index ?? 0;
    const count = seen.get(ink) || 0;
    seen.set(ink, count + 1);
    return candidates[count % candidates.length];
  });
}
