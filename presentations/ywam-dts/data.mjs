// Pulls every fact, every line of scripture and every motion constant the deck
// uses straight out of the app, so nothing on the slides can drift from what is
// on the phone. The scripture renderer is a port of the app reader
// (components/Bible/{Segment,Block,Inline,Leaf}.tsx), same port the print
// brochure uses.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const bible = read('assets/data/newBibleNLT1.json');
const times = read('assets/data/SegmentReadingTimes.json');
const plansFile = read('assets/data/ReadingPlansChallenges.json');
const schoolQ = read('assets/data/SchoolQuestions.json').SchoolQuestions;
const familyQ = read('assets/data/FamilyQuestions.json').FamilyQuestions;
const groupQ = read('assets/data/SmallGroupQuestions.json').SmallGroupQuestions;

export const JONAH = 'S255';

// --- palette, straight from constants/Colors.ts (light) ----------------------
export const INK = {
  black: { fill: '#FFFFFF', text: '#3A4550', bar: '#3A4550', edge: '#DFE5E0', label: 'The Narrator' },
  red:   { fill: '#FBEDEB', text: '#C0261A', bar: '#C0261A', edge: '#EFC7C3', label: 'God speaking' },
  green: { fill: '#E9F4EF', text: '#0E6B4C', bar: '#0E6B4C', edge: '#C0D9D0', label: 'Main character' },
  blue:  { fill: '#EBEFFA', text: '#1D46A8', bar: '#1D46A8', edge: '#C4CFE8', label: 'Everyone else' },
};
export const PALETTE = {
  bg: '#F3F5F2', surf: '#FFFFFF', ink: '#101619', mute: '#5E6B70',
  hair: '#DFE5E0', acc: '#0E6B4C', thread: '#B4C0B8',
};

// --- motion, straight from constants/Motion.ts -------------------------------
export const MOTION = {
  ease: 'cubic-bezier(0.32, 0.72, 0, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  dur: { instant: 120, quick: 200, base: 320, slow: 560, epic: 900 },
  stagger: { row: 28, bar: 40, turn: 24, max: 8 },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// --- reader port -------------------------------------------------------------
function splitIntoParagraphs(content) {
  const out = [];
  for (const block of content) {
    let copy = null;
    for (const child of block.children) {
      if (child.start || child.type === 'table') {
        if (copy && copy.children.length > 0) out.push(copy);
        copy = { ...block, children: [] };
      } else if (!copy) {
        copy = { ...block, children: [] };
      }
      copy.children.push(child);
    }
    if (copy) out.push(copy);
  }
  return out;
}

const SUP = { 0:'⁰',1:'¹',2:'²',3:'³',4:'⁴',5:'⁵',6:'⁶',7:'⁷',8:'⁸',9:'⁹','-':'⁻' };
const sup = (t) => String(t).split('').map((c) => SUP[c] ?? c).join('');

function renderLeaf(leaf) {
  const tag = Array.isArray(leaf.tag) ? leaf.tag : leaf.tag ? [leaf.tag] : [];
  if (leaf.note) return '';
  if (!leaf.text) return '';
  if (tag.includes('c')) return '';
  if (tag.includes('v')) return `<sup class="v">${sup(leaf.text)}</sup>`;
  if (tag.includes('nd')) return `<span class="nd">${esc(leaf.text)}</span>`;
  return esc(leaf.text);
}

function renderInline(inline) {
  if (inline.type === 'break') return '';
  const cls = ['para'];
  if (inline.type === 'poetry') cls.push('is-poetry');
  const body = (inline.children || []).map(renderLeaf).join('');
  if (!body.trim()) return '';
  return `<p class="${cls.join(' ')}">${body}</p>`;
}

/**
 * Every turn of a story, as the app lays it out: divine authority left,
 * humanity right, speaker label where the speaker changes.
 */
export function turns(id) {
  const blocks = splitIntoParagraphs(JSON.parse(JSON.stringify(bible[id].content)));
  let previous = null;
  const out = [];
  for (const block of blocks) {
    const color = block.source?.color || 'black';
    const name = block.source?.sourceName || 'Unknown';
    const hasTail = name !== previous;
    previous = name;
    const html = block.children.map(renderInline).filter(Boolean).join('');
    if (!html) continue;
    out.push({
      color,
      speaker: hasTail ? name.toUpperCase() : null,
      side: color === 'black' || color === 'red' ? 'left' : 'right',
      html,
    });
  }
  return out;
}

/** A story's cast and voice share, as the call sheet shows it. */
export function story(id) {
  const seg = bible[id];
  const t = times[id];
  const totals = { black: 0, red: 0, green: 0, blue: 0 };
  for (const v of Object.values(seg.sources)) totals[v.color] += v.words;
  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  const cast = Object.entries(seg.sources)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.words - a.words);
  return {
    id,
    title: t.title,
    reference: t.reference,
    book: t.book,
    minutes: t.estimatedReadingTimeMinutes,
    words: t.wordCount,
    totals, total, cast,
    questions: {
      school: Object.values(schoolQ[id]),
      family: Object.values(familyQ[id]),
      group: Object.values(groupQ[id]),
    },
  };
}

// --- corpus totals -----------------------------------------------------------
export function stats() {
  const ids = Object.keys(bible).filter((k) => k.startsWith('S'));
  const names = new Set();
  const byColor = { black: new Set(), red: new Set(), green: new Set(), blue: new Set() };
  const words = { black: 0, red: 0, green: 0, blue: 0 };
  for (const id of ids) {
    for (const [name, v] of Object.entries(bible[id].sources || {})) {
      names.add(name);
      if (byColor[v.color]) byColor[v.color].add(name);
      if (v.color in words) words[v.color] += v.words || 0;
    }
  }
  const mins = ids.map((i) => times[i].estimatedReadingTimeMinutes).sort((a, b) => a - b);
  return {
    stories: ids.length,
    voices: names.size,
    books: 66,
    words: Object.values(words).reduce((a, b) => a + b, 0),
    byColor: Object.fromEntries(Object.entries(byColor).map(([k, v]) => [k, v.size])),
    minMinutes: mins[0],
    maxMinutes: mins[mins.length - 1],
    medianMinutes: mins[Math.floor(mins.length / 2)],
  };
}

// --- the two plans the DTS runs on ------------------------------------------
const storyIds = (p) =>
  Object.values(p.segments || {}).flatMap((v) => (Array.isArray(v) ? v : v.segments || []));

export function plan(title) {
  const p = [...plansFile.plans, ...plansFile.challenges].find((x) => x.title === title);
  const ids = storyIds(p);
  return {
    title: p.title,
    count: ids.length,
    short: p.shortDescription,
    long: p.longDescription || p.description,
    first: ids.slice(0, 6).map((id) => ({
      id,
      title: times[id]?.title,
      ref: times[id] ? `${times[id].book} ${times[id].reference}` : '',
      minutes: times[id]?.estimatedReadingTimeMinutes,
    })),
  };
}

export const planCount = plansFile.plans.length + plansFile.challenges.length;
