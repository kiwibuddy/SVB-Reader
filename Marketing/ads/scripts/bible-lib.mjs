/** Shared helpers: read the app's Bible text the way the reader shows it. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(HERE, '../../../assets/data');
export const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));

export const bible = read('newBibleNLT1.json');
export const titles = read('SegmentTitles.json');
export const times = read('SegmentReadingTimes.json');

/** Text as the reader shows it, without chapter/verse numbers or notes. */
const flatten = (node) => {
  if (!node || typeof node !== 'object') return '';
  if (Array.isArray(node)) return node.map(flatten).join('');
  if (node.note) return '';
  const tags = node.tag ?? [];
  if (tags.includes('c') || tags.includes('v')) return flatten(node.children);
  return (typeof node.text === 'string' ? node.text : '') + flatten(node.children);
};
export const tidy = (t) => t.replace(/\s+/g, ' ').trim();

export function turn(segId, i) {
  const block = bible[segId]?.content?.[i];
  if (!block) throw new Error(`${segId}#${i} does not exist`);
  let src = block.source ?? {};
  if (typeof src === 'string') src = { sourceName: src, color: bible[segId].sources?.[src]?.color };
  return {
    speaker: src.sourceName ?? '',
    color: src.color ?? 'black',
    text: tidy((block.children || []).map((c) => tidy(flatten(c))).join(' ')),
  };
}

/**
 * The words of turn `i` from `from` through the end of `to` (searched after `from`).
 * Throws if either is missing, so a change in the Bible data stops the build.
 */
export function take(segId, i, from, to, speaker) {
  const t = turn(segId, i);
  const a = t.text.indexOf(from);
  if (a < 0) throw new Error(`${segId}#${i} (${t.speaker}) has no "${from}" — starts "${t.text.slice(0, 50)}"`);
  const b = t.text.indexOf(to, a);
  if (b < 0) throw new Error(`${segId}#${i} has no "${to}" after "${from}"`);
  if (speaker && t.speaker !== speaker) throw new Error(`${segId}#${i} is ${t.speaker}, expected ${speaker}`);
  return { text: t.text.slice(a, b + to.length), speaker: t.speaker, color: t.color };
}

