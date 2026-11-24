/**
 * Writes src/source/data.ts for the "Back to the source" films: every line of
 * Scripture they quote, cut from the app's own Bible text, and the voice mix
 * and reading time of all 365 stories (Film 2's rose window).
 *
 *   node scripts/source-data.mjs
 *
 * A quote that no longer starts where it should throws: nothing on screen is retyped.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(HERE, '../../../assets/data');
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));

const bible = read('newBibleNLT1.json');
const titles = read('SegmentTitles.json');
const times = read('SegmentReadingTimes.json');

/** Text as the reader shows it, without chapter/verse numbers or notes. */
const flatten = (node) => {
  if (!node || typeof node !== 'object') return '';
  if (Array.isArray(node)) return node.map(flatten).join('');
  if (node.note) return '';
  const tags = node.tag ?? [];
  if (tags.includes('c') || tags.includes('v')) return flatten(node.children);
  return (typeof node.text === 'string' ? node.text : '') + flatten(node.children);
};
const tidy = (t) => t.replace(/\s+/g, ' ').trim();

function turn(segId, i) {
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

// id: [segment, turn, from, to, speaker in the data, label on screen, reference, before, after]
const QUOTES = {
  moses: ['S019', 55, 'Who am I to appear', 'Pharaoh?', 'Moses', 'Moses', 'Exodus 3:11', '', ''],
  godWith: ['S019', 57, 'I will be with you.', 'you.', 'God', 'God', 'Exodus 3:12', '', ''],
  gideon: ['S079', 6, 'if the Lord is with us', 'happened to us?', 'Gideon', 'Gideon', 'Judges 6:13', '…', ''],
  godGo: ['S079', 8, 'Go with the strength you have', 'you have', 'God', 'God', 'Judges 6:14', '', '…'],
  thomas: ['S307', 34, 'I won’t believe it', 'in his hands', 'Thomas', 'Thomas', 'John 20:25', '', '…'],
  jesus: ['S307', 38, 'Put your finger here', 'my hands.', 'Jesus', 'Jesus', 'John 20:27', '', ''],
  father: ['S280', 66, 'I do believe', 'unbelief!', "An Epileptic's Father", 'A father', 'Mark 9:24', '', ''],
  jer11: ['S215', 1, 'For I know the plans', 'says the Lord.', 'Jeremiah', 'Jeremiah', 'Jeremiah 29:11', '“', ''],
  jer4: ['S215', 1, 'This is what the Lord of Heaven’s Armies', 'from Jerusalem:', 'Jeremiah', 'Jeremiah', 'Jeremiah 29:4', '', ''],
  jer10: ['S215', 1, 'This is what the Lord says: “You will be in Babylon', 'seventy years.', 'Jeremiah', 'Jeremiah', 'Jeremiah 29:10', '', ' …'],
  neh: ['S151', 0, 'All the people listened closely', 'Book of the Law.', 'The Narrator', 'The Narrator', 'Nehemiah 8:3', '', ''],
  luke: ['S286', 38, 'stood up to read the Scriptures', 'Scriptures.', 'The Narrator', 'The Narrator', 'Luke 4:16', '…', ''],
  col: ['S340', 0, 'After you have read this letter, pass it on', 'pass it on', 'The Narrator', 'The Narrator', 'Colossians 4:16', '', '…'],
  thess: ['S341', 0, 'I command you in the name of the Lord to read this letter', 'brothers and sisters.', 'The Narrator', 'The Narrator', '1 Thessalonians 5:27', '', ''],
  rev: ['S359', 0, 'God blesses the one who reads', 'its message', 'The Narrator', 'The Narrator', 'Revelation 1:3', '', '…'],
};

const out = {};
for (const [id, [seg, i, from, to, speaker, label, ref, before, after]] of Object.entries(QUOTES)) {
  const q = take(seg, i, from, to, speaker);
  out[id] = { text: before + q.text + after, speaker: label, color: q.color, ref: `${ref} NLT`, seg };
}

/* Excerpts the films show inside the app, marked like scripts/advent-data.mjs:
   ⟪n⟫ chapter, ⟦n⟧ verse, "*" a note; narration split into its paragraphs. */
const marked = (node) => {
  if (!node || typeof node !== 'object') return '';
  if (Array.isArray(node)) return node.map(marked).join('');
  if (node.note) return '*';
  const tags = node.tag ?? [];
  if (tags.includes('c')) return `⟪${String(node.text ?? '').trim()}⟫` + marked(node.children);
  if (tags.includes('v')) return `⟦${String(node.text ?? '').trim()}⟧` + marked(node.children);
  return (typeof node.text === 'string' ? node.text : '') + marked(node.children);
};
const tidyMarked = (t) => tidy(t).replace(/\s*(⟦)/g, ' $1').replace(/⟫ ⟦/g, '⟫⟦').trim();
function excerpt(segId, from, to, expectStart) {
  const lines = [];
  for (let i = from; i <= to; i++) {
    const { speaker, color } = turn(segId, i);
    const paras = (bible[segId].content[i].children || []).map((c) => tidyMarked(marked(c))).filter(Boolean);
    const parts = color === 'black' ? paras : [paras.join(' ')];
    parts.forEach((text, k) => lines.push({ speaker, color, text, ...(k > 0 ? { cont: true } : {}) }));
  }
  const first = lines[0].text.replace(/⟪[^⟫]*⟫|⟦[^⟧]*⟧/g, '').trim();
  if (!first.startsWith(expectStart)) throw new Error(`${segId}#${from} starts "${first.slice(0, 40)}", expected "${expectStart}"`);
  const n = Number(segId.slice(1));
  return {
    id: segId,
    title: titles[segId].title,
    meta: `${n} · ${titles[segId].book[0]} ${titles[segId].ref} · ${times[segId].estimatedReadingTimeMinutes} min`,
    readers: bible[segId].readers,
    mix: { black: bible[segId].colors.black, red: bible[segId].colors.red, green: bible[segId].colors.green, blue: bible[segId].colors.blue },
    voices: Object.keys(bible[segId].sources).length,
    lines,
  };
}
const STORIES = {
  gideon: excerpt('S079', 2, 9, 'Then the angel of the Lord came'), // Film 1, the app
  creation: excerpt('S001', 0, 3, 'In the beginning God created'), // Film 2, Day 1
  moses: excerpt('S019', 50, 58, 'the Lord warned.'), // Film 3, four parts
};

const stories = Object.keys(bible).filter((k) => /^S\d{3}$/.test(k)).sort();
if (stories.length !== 365) throw new Error(`expected 365 stories, found ${stories.length}`);
const mix = stories.map((id) => {
  const w = { black: 0, blue: 0, green: 0, red: 0 };
  for (const s of Object.values(bible[id].sources)) if (s.color in w) w[s.color] += s.words ?? 0;
  const n = w.black + w.blue + w.green + w.red || 1;
  const r = (x) => Math.round((x / n) * 1000) / 1000;
  return { id, title: titles[id].title, mix: [r(w.black), r(w.blue), r(w.green), r(w.red)], minutes: times[id].estimatedReadingTimeMinutes };
});
const minutes = mix.reduce((a, s) => a + s.minutes, 0);

const ts = `// Generated by scripts/source-data.mjs — do not edit.
import type { VoiceColor } from '../theme';
import type { Story } from '../advent/data';

export type Quote = { text: string; speaker: string; color: VoiceColor; ref: string; seg: string };
export type QuoteId = ${Object.keys(out).map((k) => `'${k}'`).join(' | ')};
export const QUOTES: Record<QuoteId, Quote> = ${JSON.stringify(out, null, 2)};

/** Each story's share of words by voice: [narrator, everyone else, principals, God]. */
export type StoryMix = { id: string; title: string; mix: [number, number, number, number]; minutes: number };
export const MIX: StoryMix[] = ${JSON.stringify(mix)};

/** Stories as the app shows them (same shape as src/advent/data.ts). */
export const STORIES: Record<'gideon' | 'creation' | 'moses', Story> = ${JSON.stringify(STORIES, null, 2)};

/** Total reading time of all 365 stories, in minutes. */
export const TOTAL_MINUTES = ${minutes};
`;
fs.mkdirSync(path.resolve(HERE, '../src/source'), { recursive: true });
fs.writeFileSync(path.resolve(HERE, '../src/source/data.ts'), ts);
console.log(`wrote src/source/data.ts — ${Object.keys(out).length} quotes, ${mix.length} stories, ${minutes} min`);
