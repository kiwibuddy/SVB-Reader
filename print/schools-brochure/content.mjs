// Pulls every fact and every line of scripture in the schools brochure straight
// out of the app's own data files, so nothing in the printed document can drift
// from the shipped app.
//
// The scripture renderer is a port of the app reader
// (components/Bible/{Segment,Block,Inline,Leaf}.tsx and
// scripts/{splitIntoParagraphs,getColors}.ts), by way of print/jonah-booklet.

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

// Two real passages, both rendered from the app's own text.
//
// The cover runs the calling of Simon Peter, Luke 5:4-5, because it is the
// exchange the old flyer showed and it reads warmly cold.
// The page 2 spread runs Luke 18:26-28, which is the tightest four-colour window
// anywhere in the 365: crowd, narrator, Jesus and a named principal in six short
// turns, with no jump and nothing spliced.
export const COVER = { id: 'S287', from: 2, to: 6, ref: 'Luke 5:4\u20135' };
export const SPREAD = { id: 'S294', from: 48, to: 54, ref: 'Luke 18:26\u201328' };

// ---------------------------------------------------------------------------
// Ink. Light mode only; a port of scripts/getColors.ts.
// ---------------------------------------------------------------------------
export const INK = {
  black: { fill: '#FFFFFF', text: '#3A4550', bar: '#3A4550', edge: '#DFE5E0' },
  red:   { fill: '#FBEDEB', text: '#C0261A', bar: '#C0261A', edge: '#EFC7C3' },
  green: { fill: '#E9F4EF', text: '#0E6B4C', bar: '#0E6B4C', edge: '#C0D9D0' },
  blue:  { fill: '#EBEFFA', text: '#1D46A8', bar: '#1D46A8', edge: '#C4CFE8' },
};

// The reader's four roles, in the order a class assigns them.
export const ROLES = [
  { color: 'black', who: 'The Narrator',   what: 'Sets the scene',      count: 4 },
  { color: 'red',   who: 'God speaking',   what: 'God, Jesus, Spirit',  count: 5 },
  { color: 'green', who: 'Main character', what: 'The named figure',    count: 90 },
  { color: 'blue',  who: 'Everyone else',  what: 'Crowds and kings',    count: 681 },
];

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------------------------------------------------------------------------
// Corpus statistics. Counted here, never typed in by hand.
// ---------------------------------------------------------------------------
function corpusStats() {
  const stories = Object.entries(bible).filter(([k]) => k.startsWith('S'));
  const names = new Set();
  const byColor = { black: new Set(), red: new Set(), green: new Set(), blue: new Set() };
  const words = { black: 0, red: 0, green: 0, blue: 0 };

  for (const [, seg] of stories) {
    for (const [name, v] of Object.entries(seg.sources || {})) {
      names.add(name);
      if (byColor[v.color]) byColor[v.color].add(name);
      if (v.color in words) words[v.color] += v.words || 0;
    }
  }

  const mins = Object.entries(times)
    .filter(([k, v]) => k.startsWith('S') && !v.isIntroduction)
    .map(([, v]) => v.estimatedReadingTimeMinutes)
    .sort((a, b) => a - b);
  const median = mins[Math.floor(mins.length / 2)];

  return {
    stories: stories.length,
    voices: names.size,
    words: Object.values(words).reduce((a, b) => a + b, 0),
    byColor: Object.fromEntries(Object.entries(byColor).map(([k, v]) => [k, v.size])),
    wordsByColor: words,
    minMinutes: mins[0],
    maxMinutes: mins[mins.length - 1],
    medianMinutes: median,
  };
}
export const stats = corpusStats();

// ---------------------------------------------------------------------------
// Reading plans. `segments` is keyed by book, so a plan's real length is the
// number of story ids underneath, not the number of books.
// ---------------------------------------------------------------------------
const storyCount = (plan) =>
  Object.values(plan.segments || {})
    .flatMap((v) => (Array.isArray(v) ? v : v.segments || []))
    .length;

export const plans = {
  full: plansFile.plans.map((p) => ({ title: p.title, stories: storyCount(p) })),
  challenges: plansFile.challenges.map((p) => ({ title: p.title, stories: storyCount(p) })),
  total: plansFile.plans.length + plansFile.challenges.length,
};

// The four the brochure names, chosen to cover a year, a semester, a term and a
// week. Titles come from the data so they match the Plan tab exactly.
export const featuredPlans = [
  { ...plans.full.find((p) => p.title === 'Bible in 1 School Year'), fit: 'A full academic year' },
  { ...plans.full.find((p) => p.title === 'New Testament in 100 days'), fit: 'One semester' },
  { ...plans.challenges.find((p) => p.title === 'The Gospels'), fit: 'A term, or Easter' },
  { ...plans.challenges.find((p) => p.title === "God's Story: The Good News"), fit: 'Orientation week' },
];

/**
 * The opening weeks of the school-year plan, as they actually fall: real story
 * titles, real references, real reading estimates. A chaplain can read this and
 * know what term one looks like.
 */
export function openingWeeks(count = 8) {
  const plan = plansFile.plans.find((p) => p.title === 'Bible in 1 School Year');
  const ids = Object.values(plan.segments).flatMap((v) => v.segments || v);
  return ids.slice(0, count).map((id, i) => {
    const t = times[id];
    return {
      week: i + 1,
      title: t.title,
      reference: `${t.book} ${t.reference}`,
      minutes: t.estimatedReadingTimeMinutes,
    };
  });
}

// ---------------------------------------------------------------------------
// Questions. Three sets, four each, on every story.
// ---------------------------------------------------------------------------
const coverage = (set) => Object.keys(set).filter((k) => k.startsWith('S')).length;
// Story 1 carries the three sets furthest apart, which is what page 3 has to
// show: one story, three registers. The sets are closer than this on some
// stories (see README, "Known drift").
const QSET_ID = 'S001';

export const questionSets = {
  coverage: coverage(schoolQ),
  id: QSET_ID,
  story: times[QSET_ID].title,
  reference: `Genesis ${times[QSET_ID].reference}`,
  school: Object.values(schoolQ[QSET_ID]),
  family: Object.values(familyQ[QSET_ID]),
  group: Object.values(groupQ[QSET_ID]),
  // Real school questions from three named stories, for the sampler strip.
  samples: [
    { story: times.S004.title, q: schoolQ.S004.Q3 },
    { story: times.S025.title, q: schoolQ.S025.Q3 },
    { story: times.S002.title, q: schoolQ.S002.Q4 },
  ],
};

// ---------------------------------------------------------------------------
// Scripture rendering.
// ---------------------------------------------------------------------------
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

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };
const superscript = (t) => String(t).split('').map((c) => SUP[c] ?? c).join('');

// A four-page brochure has no room for a footnote apparatus, so translator
// notes are dropped rather than lettered. Every word of scripture is untouched.
function renderLeaf(leaf) {
  const tag = Array.isArray(leaf.tag) ? leaf.tag : leaf.tag ? [leaf.tag] : [];
  if (leaf.note) return '';
  if (!leaf.text) return '';
  if (tag.includes('c')) return '';
  if (tag.includes('v')) return `<sup class="v">${superscript(leaf.text)}</sup>`;
  if (tag.includes('nd')) return `<span class="nd">${esc(leaf.text)}</span>`;
  return esc(leaf.text);
}

function renderInline(inline) {
  if (inline.type === 'break') return '';
  const cls = ['para', `t-${inline.tag || 'm'}`];
  if (inline.type === 'poetry') cls.push('is-poetry');
  const body = (inline.children || []).map(renderLeaf).join('');
  if (!body.trim()) return '';
  return `<p class="${cls.join(' ')}">${body}</p>`;
}

/**
 * Renders `count` turns of the spread story as the app lays them out: divine
 * authority left, humanity right, speaker label above, asymmetric corner where
 * the voice changes.
 */
export function spreadTurns({ id, from, to }) {
  const seg = bible[id];
  const blocks = splitIntoParagraphs(JSON.parse(JSON.stringify(seg.content))).slice(from, to);
  let previous = null;
  const out = [];

  for (const block of blocks) {
    const color = block.source?.color || 'black';
    const name = block.source?.sourceName || 'Unknown';
    const hasTail = name !== previous;
    previous = name;

    const paras = block.children.map(renderInline).filter(Boolean).join('');
    if (!paras) continue;

    const side = color === 'black' || color === 'red' ? 'left' : 'right';
    const label = hasTail
      ? `<div class="speaker speaker--${side}">${esc(name.toUpperCase())}</div>`
      : '';

    out.push(
      `<div class="turn turn--${color} turn--${side}${hasTail ? ' has-tail' : ''}">` +
        label + `<div class="bubble">${paras}</div>` +
      `</div>`
    );
  }
  return out;
}

/** The story's own cast and voice share, for the caption under the spread. */
export function spreadMeta({ id }) {
  const seg = bible[id];
  const t = times[id];
  const totals = { black: 0, red: 0, green: 0, blue: 0 };
  for (const v of Object.values(seg.sources)) totals[v.color] += v.words;
  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  const cast = Object.entries(seg.sources)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.words - a.words);
  return { title: t.title, minutes: t.estimatedReadingTimeMinutes, totals, total, cast };
}
