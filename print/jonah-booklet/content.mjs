// Extracts and renders the Jonah story (segment S255) from the app's Bible data
// into print-ready HTML fragments. The rendering rules here are a faithful port
// of the app reader: components/Bible/{Segment,Block,Inline,Leaf}.tsx and
// scripts/{splitIntoParagraphs,getColors}.ts.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

export const SEGMENT_ID = 'S255';

const bible = read('assets/data/newBibleNLT1.json');
const titles = read('assets/data/SegmentTitles.json');
const schoolQuestions = read('assets/data/SchoolQuestions.json').SchoolQuestions;

export const segment = bible[SEGMENT_ID];
export const meta = titles[SEGMENT_ID];
export const questions = Object.values(schoolQuestions[SEGMENT_ID]);

// --- port of scripts/splitIntoParagraphs.ts -------------------------------
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

// --- port of scripts/getColors.ts (light mode only) -----------------------
export const INK = {
  black: { fill: '#FFFFFF', text: '#3A4550', bar: '#3A4550', edge: '#DFE5E0', label: 'Narration' },
  red: { fill: '#FBEDEB', text: '#C0261A', bar: '#C0261A', edge: '#EFC7C3', label: 'God speaking' },
  green: { fill: '#E9F4EF', text: '#0E6B4C', bar: '#0E6B4C', edge: '#C0D9D0', label: 'Main character' },
  blue: { fill: '#EBEFFA', text: '#1D46A8', bar: '#1D46A8', edge: '#C4CFE8', label: 'Everyone else' },
};

// Cover palette — saturated relatives of the four inks, so a cover reads as
// "the green booklet" from across a room while still matching the bubbles.
export const COVERS = {
  black: { key: 'black', name: 'Graphite', deep: '#3A4550', mid: '#4A5560', tint: '#F3F5F2', ink: '#3A4550' },
  red: { key: 'red', name: 'Red', deep: '#C0261A', mid: '#CE3A2E', tint: '#FBEDEB', ink: '#C0261A' },
  green: { key: 'green', name: 'Green', deep: '#0E6B4C', mid: '#1B7D5C', tint: '#E9F4EF', ink: '#0E6B4C' },
  blue: { key: 'blue', name: 'Blue', deep: '#1D46A8', mid: '#2C57BB', tint: '#EBEFFA', ink: '#1D46A8' },
};

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// --- port of components/Bible/Leaf.tsx ------------------------------------
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };
const superscript = (t) => String(t).split('').map((c) => SUP[c] ?? c).join('');

// Translator footnotes ride in the text as a bare "*" in the app. Print can do
// better: lettered markers, collected at the end of the story.
const FOOTNOTE_LETTERS = 'abcdefghijklmnop';
let footnotes = [];

function noteText(note) {
  return (note.children || [])
    .map((c) => {
      const tag = Array.isArray(c.tag) ? c.tag : [];
      const text = esc(c.text || '');
      if (tag.includes('fr')) return `<b>${text.trim()}</b> `;
      if (tag.includes('fqa')) return `<i>${text}</i>`;
      return text;
    })
    .join('');
}

function renderLeaf(leaf) {
  const tag = Array.isArray(leaf.tag) ? leaf.tag : leaf.tag ? [leaf.tag] : [];
  if (leaf.note) {
    const letter = FOOTNOTE_LETTERS[footnotes.length];
    footnotes.push({ letter, html: noteText(leaf.note) });
    return `<sup class="fn">${letter}</sup>`;
  }
  if (!leaf.text) return '';
  if (tag.includes('v')) return `<sup class="v">${superscript(leaf.text)}</sup>`;
  if (tag.includes('nd')) return `<span class="nd">${esc(leaf.text)}</span>`;
  return esc(leaf.text);
}

export const getFootnotes = () => footnotes;

// --- port of components/Bible/Inline.tsx ----------------------------------
// Each inline is a block-level run in the app (a <Text> inside a <View>), so
// each becomes one <p> here. Paragraphs are the unit the paginator splits on.
function renderInline(inline) {
  if (inline.type === 'break') return '<p class="para para--gap"></p>';
  const tag = inline.tag || 'm';
  const cls = ['para', `t-${tag}`];
  if (inline.start) cls.push('is-start');
  if (inline.type === 'poetry') cls.push('is-poetry');
  const body = (inline.children || []).map(renderLeaf).join('');
  if (!body.trim()) return '';
  return `<p class="${cls.join(' ')}">${body}</p>`;
}

// Chapter markers ride inline in the app (an untagged digit). In print they are
// pulled out into a divider so a group can find its place when reading aloud.
function extractChapter(block) {
  let chapter = null;
  for (const child of block.children) {
    child.children = (child.children || []).filter((leaf) => {
      const tag = Array.isArray(leaf.tag) ? leaf.tag : [];
      if (tag.includes('c')) {
        chapter = leaf.text;
        return false;
      }
      return true;
    });
  }
  return chapter;
}

// --- port of components/Bible/{Segment,Block}.tsx -------------------------
export function buildStoryFlow() {
  footnotes = [];
  const blocks = splitIntoParagraphs(JSON.parse(JSON.stringify(segment.content)));
  const items = [];
  let previousSourceName = null;

  blocks.forEach((block) => {
    const color = block.source?.color || 'black';
    const sourceName = block.source?.sourceName || 'Unknown';
    // Segment.tsx: the tail + speaker name appear when the speaker changes.
    const hasTail = sourceName !== previousSourceName;
    previousSourceName = sourceName;

    const chapter = extractChapter(block);
    if (chapter) {
      items.push(
        `<div class="flow-item chapter-rule"><b>${esc(chapter)}</b><span>Jonah ${esc(chapter)}:1</span></div>`
      );
    }

    const paras = block.children.map(renderInline).filter(Boolean).join('');
    if (!paras) return;

    // Thread design: the two divine-authority voices sit left, humanity right.
    const side = (color === 'black' || color === 'red') ? 'left' : 'right';
    // A chapter divider re-introduces the speaker underneath it.
    const showLabel = hasTail || Boolean(chapter);
    const label = showLabel
      ? `<div class="speaker speaker--${side}">${esc(sourceName.toUpperCase())}</div>`
      : '';

    items.push(
      `<div class="flow-item turn turn--${color} turn--${side}${showLabel ? ' has-tail' : ''}">` +
        label +
        `<div class="bubble">${paras}</div>` +
      `</div>`
    );
  });

  return items;
}

export function castList() {
  const order = ['black', 'green', 'red', 'blue'];
  const entries = Object.entries(segment.sources).map(([name, v]) => ({ name, ...v }));
  entries.sort((a, b) => order.indexOf(a.color) - order.indexOf(b.color) || b.words - a.words);
  return entries;
}

export function voiceShare() {
  const totals = { black: 0, red: 0, green: 0, blue: 0 };
  for (const v of Object.values(segment.sources)) totals[v.color] += v.words;
  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  return { totals, total };
}
