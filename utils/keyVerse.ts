/**
 * Pull the NLT wording of a key-verse reference out of a story's rendered
 * blocks, split by speaker colour so the intro card can colour each span.
 */

import type { BibleBlock, BibleLeaf } from '@/types';

export type KeyVerseSpan = {
  text: string;
  colour: string;
  speaker: string;
};

function isVerseNumber(leaf: BibleLeaf): boolean {
  const tag = leaf?.tag;
  if (Array.isArray(tag)) return tag.includes('v');
  return tag === 'v';
}

function leafText(leaf: BibleLeaf): string {
  if (!leaf || typeof leaf !== 'object') return '';
  if (isVerseNumber(leaf)) return '';
  let text = typeof leaf.text === 'string' ? leaf.text : '';
  // Poetry / line breaks become spaces so the intro card stays one paragraph.
  if (leaf.tag === 'br' || leaf.type === 'break') return ' ';
  if (Array.isArray(leaf.children)) {
    text += leaf.children.map(leafText).join('');
  }
  return text;
}

function collectForRef(
  leaf: BibleLeaf,
  ref: string,
  colour: string,
  speaker: string,
  into: { colour: string; speaker: string; parts: string[] }[]
): void {
  if (!leaf || typeof leaf !== 'object') return;
  const refs = Array.isArray(leaf.ref) ? leaf.ref : [];
  if (refs.includes(ref) && !isVerseNumber(leaf)) {
    const text = leafText(leaf);
    if (text) {
      const last = into[into.length - 1];
      if (last && last.colour === colour && last.speaker === speaker) {
        last.parts.push(text);
      } else {
        into.push({ colour, speaker, parts: [text] });
      }
    }
    return;
  }
  for (const child of leaf.children || []) {
    collectForRef(child, ref, colour, speaker, into);
  }
}

/**
 * Spans of a key verse (`Gen-15-5`) inside a story's content blocks, in reading
 * order, one per speaker colour run.
 */
export function keyVerseSpans(content: BibleBlock[] | undefined | null, ref: string): KeyVerseSpan[] {
  if (!Array.isArray(content) || !ref) return [];
  const runs: { colour: string; speaker: string; parts: string[] }[] = [];
  for (const block of content) {
    const colour = block.source?.color || 'black';
    const speaker = block.source?.sourceName || colour;
    for (const inline of block.children || []) {
      for (const leaf of inline.children || []) {
        collectForRef(leaf, ref, colour, speaker, runs);
      }
    }
  }
  return runs
    .map((run) => ({
      text: joinLeaves(run.parts),
      colour: run.colour,
      speaker: run.speaker,
    }))
    .filter((s) => s.text.length > 0);
}

/** Join leaf texts, inserting a space where the NLT file runs words together. */
function joinLeaves(parts: string[]): string {
  let out = '';
  for (const part of parts) {
    if (!part) continue;
    if (out && /\w$/.test(out) && /^\w/.test(part)) out += ' ';
    out += part;
  }
  return out.replace(/\s+/g, ' ').trim();
}

/** Parse `Gen-15-5` into book / chapter / verse for the reader scroll target. */
export function parseKeyVerseRef(ref: string): { book: string; chapter: number; verse: number } | null {
  const m = /^([A-Za-z0-9]+)-(\d+)-(\d+)$/.exec(ref.trim());
  if (!m) return null;
  return { book: m[1], chapter: Number(m[2]), verse: Number(m[3]) };
}
