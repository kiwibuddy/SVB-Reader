/**
 * Finding a verse inside the blocks the reader actually rendered.
 *
 * The obvious approach — take `blockIndex` from `verseSearchIndex.json` and use
 * it as an index into what is on screen — does not work. `blockIndex` addresses
 * `segmentData.content`, but the reader renders that array through
 * `splitIntoParagraphs()` and, for 232 of the 365 stories, through
 * `splitContentIntoReaderParts()` as well. Both split blocks apart, so the
 * rendered list is 1.2×–2.2× longer and the indices no longer line up.
 *
 * What does survive both splits is the leaf data: every verse keeps its
 * `ref: ["Gen-4-3"]`. So we look for the verse in the rendered blocks rather
 * than trying to predict where the splitter put it. That makes this independent
 * of how the content is chunked, and independent of the verse index entirely.
 */

import type { BibleBlock, BibleLeaf } from '@/types';
import SegmentTitles from '@/assets/data/SegmentTitles.json';

const titles = SegmentTitles as Record<string, { book?: string[] }>;

/**
 * The three-letter book codes a story covers, e.g. `["Gen"]`.
 *
 * Two stories span two books — S096 and S115 — which is why a verse match is
 * qualified by book code rather than by chapter and verse alone.
 */
export function bookCodesForSegment(segmentId: string): string[] {
  const short = segmentId.match(/[SI]\d+/i)?.[0] || segmentId;
  return titles[short]?.book || [];
}

/** Collect every `ref` string carried by a block, at any depth. */
function collectRefs(block: BibleBlock, into: Set<string>): void {
  const visit = (leaf: BibleLeaf): void => {
    if (!leaf || typeof leaf !== 'object') return;
    if (Array.isArray(leaf.ref)) {
      for (const ref of leaf.ref) into.add(ref);
    }
    if (Array.isArray(leaf.children)) {
      for (const child of leaf.children) visit(child);
    }
  };

  for (const inline of block.children || []) {
    for (const leaf of inline?.children || []) visit(leaf);
  }
}

/**
 * Index of the first rendered block containing the verse, or -1.
 *
 * `bookCodes` narrows the match to the story's own books. Pass an empty array
 * and any book matches, which is the right fallback when the story's books are
 * unknown — a wrong book is still a better landing than the top of the story.
 */
export function findVerseBlockIndex(
  blocks: BibleBlock[],
  bookCodes: string[],
  chapter: number,
  verse: number
): number {
  // Verse 0 is real — psalm superscriptions ("A psalm of David") are indexed
  // that way — so test for absence, not falsiness.
  if (!Array.isArray(blocks) || chapter == null || verse == null) return -1;

  const suffix = `-${chapter}-${verse}`;
  const wanted = bookCodes.map((code) => `${code}${suffix}`);

  for (let i = 0; i < blocks.length; i += 1) {
    const refs = new Set<string>();
    collectRefs(blocks[i], refs);

    if (wanted.length === 0) {
      for (const ref of refs) {
        if (ref.endsWith(suffix)) return i;
      }
    } else {
      for (const ref of wanted) {
        if (refs.has(ref)) return i;
      }
    }
  }

  return -1;
}
