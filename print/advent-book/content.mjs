// Content for the Advent Journey print book: the 26 stories of the app's
// Advent plan, rendered exactly as the Jonah booklet renders S255 (a port of
// components/Bible/{Segment,Block,Inline,Leaf}.tsx and
// scripts/{splitIntoParagraphs,getColors}.ts), plus the plan's days, weeks,
// notes, key verses and the app's family questions.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const bible = read('assets/data/newBibleNLT1.json');
const titles = read('assets/data/SegmentTitles.json');
const books = read('assets/data/BookChapterList.json');
const questionBank = read('assets/data/Questions-EN.json').questions;
const plan = read('assets/data/ChronologicalMappings.json').adventJourneyChronological;

export { INK, COVERS } from '../jonah-booklet/content.mjs';

// --- the plan ---------------------------------------------------------------
export const WEEKS = [
  { key: 'hope', n: 1, name: 'Hope', color: '#6A4C93', tint: '#EFEAF5', line: plan.phases.hope.description },
  { key: 'peace', n: 2, name: 'Peace', color: '#3F6FB5', tint: '#E8EEF8', line: plan.phases.peace.description },
  { key: 'joy', n: 3, name: 'Joy', color: '#C2507A', tint: '#F9E9EF', line: 'Rejoice, the Lord is near. From 17 December, the O Antiphons lead to Christmas' },
  { key: 'love', n: 4, name: 'Love', color: '#8E3FA0', tint: '#F3E8F6', line: plan.phases.love.description },
];

// Advent 2026 begins on Sunday 29 November.
const START = Date.UTC(2026, 10, 29);
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function dateOf(i) {
  const d = new Date(START + i * 86400000);
  return {
    long: `${DAY_NAMES[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`,
    short: `${DAY_NAMES[d.getUTCDay()].slice(0, 3)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`,
  };
}

// Day notes as agreed for Advent 2026 (MVP3/05, step A3). Days not listed keep
// the note in the app's data.
const NOTES_2026 = {
  1: 'Advent begins by looking ahead: Christ will come again. “Come, Lord Jesus!” (22:20)',
  3: 'Count the stars: God’s promise to Abraham (15:5), “father of a multitude of nations” (17:4)',
  4: '“God will provide” — and through Abraham’s family all nations will be blessed (22:8, 18)',
  5: 'Bethlehem, and a Moabite woman welcomed into the family line of David and Jesus (4:17)',
  7: 'Immanuel, and “a child is born” who will reign on David’s throne (7:14; 9:6–7)',
  13: '“A future and a hope”, spoken to exiles, and the new covenant (29:11; 31:31)',
  18: '“Rejoice!” — the words Gaudete Sunday is named after (4:4)',
  19: 'O Antiphon · O Wisdom — the Word who made all things became human (1:14)',
  20: 'O Antiphon · O Lord — God hears, comes down to rescue, and gives his name (ch. 3)',
  21: 'O Antiphon · O Root of Jesse — new life from Jesse’s stump (11:1)',
  24: 'O Antiphon · O King of the Nations — “your king is coming”, humble (9:9)',
  26: 'Christmas Eve — Mary’s song (1:46–55) and “The Savior… has been born today” (2:11)',
};

// The key verse for each day (docs/advent/ADVENT-2026-REVIEW-PACK.md).
const KEY_VERSES = {
  1: ['Rev-22-20'], 2: ['Gen-3-15'], 3: ['Gen-15-5'], 4: ['Gen-22-8'], 5: ['Rut-4-17'],
  6: ['1Sa-16-1'], 7: ['Isa-9-6'], 8: ['Isa-40-1'], 9: ['Mic-5-2'], 10: ['Isa-42-3'],
  11: ['Isa-52-7'], 12: ['Isa-53-5'], 13: ['Jer-29-11'], 14: ['Eze-34-11'], 15: ['Isa-61-1'],
  16: ['Zep-3-17'], 17: ['Psa-98-4'], 18: ['Php-4-4'], 19: ['Joh-1-14'], 20: ['Exo-3-14'],
  21: ['Isa-11-1'], 22: ['2Sa-7-16'], 23: ['Mal-4-2'], 24: ['Zec-9-9'], 25: ['Mat-1-23'],
  26: ['Luk-2-11'],
};

// The O Antiphons, in the owner-approved translation (MVP3/05, step B3).
export const ANTIPHONS = {
  19: ['O Wisdom', 'O Wisdom, who came from the mouth of the Most High, reaching from one end of creation to the other and ordering all things with strength and gentleness: come and teach us the way of understanding.'],
  20: ['O Lord', 'O Lord and Ruler of the house of Israel, who appeared to Moses in the flame of the burning bush and gave him the law on Sinai: come and rescue us with your outstretched arm.'],
  21: ['O Root of Jesse', 'O Root of Jesse, standing as a sign for the peoples, before whom kings fall silent and whom the nations seek: come and set us free, and do not delay.'],
  22: ['O Key of David', 'O Key of David, sceptre of the house of Israel, you open and no one can shut, you shut and no one can open: come and lead the prisoners out of the prison house, those who sit in darkness and the shadow of death.'],
  23: ['O Dayspring', 'O Dayspring, radiance of eternal light and Sun of Righteousness: come and give light to those who sit in darkness and the shadow of death.'],
  24: ['O King of the Nations', 'O King of the nations, the one they long for, the cornerstone who makes the two into one: come and save the people you formed from the dust of the earth.'],
  25: ['O Emmanuel', 'O Emmanuel, our King and Lawgiver, the hope of the nations and their Saviour: come and save us, Lord our God.'],
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export { esc };

const bookName = (code) => {
  const name = books[code]?.bookName || code;
  return name === 'Psalms' ? 'Psalm' : name;
};
const fullBookName = (code) => books[code]?.bookName || code;

// "15:1-18:15" in book Gen → "Genesis 15:1–18:15"; whole-book stories read
// "Ruth 1–4" the way the app shows them.
function prettyRef(seg) {
  const t = titles[seg];
  return `${fullBookName(t.book[0])} ${t.ref.replace(/-/g, '–')}`;
}

// --- port of scripts/splitIntoParagraphs.ts --------------------------------
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

// --- port of components/Bible/Leaf.tsx --------------------------------------
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };
const superscript = (t) => String(t).split('').map((c) => SUP[c] ?? c).join('');
const letter = (i) => {
  const a = 'abcdefghijklmnopqrstuvwxyz';
  return i < 26 ? a[i] : a[Math.floor(i / 26) - 1] + a[i % 26];
};

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

function makeLeafRenderer(footnotes) {
  return function renderLeaf(leaf) {
    const tag = Array.isArray(leaf.tag) ? leaf.tag : leaf.tag ? [leaf.tag] : [];
    if (leaf.note) {
      const l = letter(footnotes.length);
      footnotes.push({ letter: l, html: noteText(leaf.note) });
      return `<sup class="fn">${l}</sup>`;
    }
    if (!leaf.text) return '';
    if (tag.includes('v')) return `<sup class="v">${superscript(leaf.text)}</sup>`;
    if (tag.includes('nd')) return `<span class="nd">${esc(leaf.text)}</span>`;
    return esc(leaf.text);
  };
}

// --- port of components/Bible/Inline.tsx ------------------------------------
function makeInlineRenderer(renderLeaf) {
  return function renderInline(inline) {
    if (inline.type === 'break') return '<p class="para para--gap"></p>';
    const tag = inline.tag || 'm';
    const cls = ['para', `t-${tag}`];
    if (inline.start) cls.push('is-start');
    if (inline.type === 'poetry') cls.push('is-poetry');
    const body = (inline.children || []).map(renderLeaf).join('');
    if (!body.trim()) return '';
    return `<p class="${cls.join(' ')}">${body}</p>`;
  };
}

// Chapter markers ride inline in the app; print pulls them into a divider.
function extractChapter(block) {
  let chapter = null;
  for (const child of block.children) {
    child.children = (child.children || []).filter((leaf) => {
      const tag = Array.isArray(leaf.tag) ? leaf.tag : [];
      if (tag.includes('c')) {
        const ref = (leaf.ref && leaf.ref[0]) || '';
        chapter = { n: leaf.text, book: ref.split('-')[0] };
        return false;
      }
      return true;
    });
  }
  return chapter;
}

function firstRef(content) {
  const stack = [...content];
  while (stack.length) {
    const n = stack.shift();
    if (n && n.ref && n.ref[0]) return n.ref[0];
    if (n && n.children) stack.unshift(...n.children);
  }
  return null;
}

const rule = (book, chapter, verse) =>
  `<div class="flow-item chapter-rule"><b>${esc(chapter)}</b><span>${esc(bookName(book))} ${esc(chapter)}${
    String(verse) === '0' ? '' : ':' + verse}</span></div>`;

// --- port of components/Bible/{Segment,Block}.tsx ---------------------------
function storyFlow(segId) {
  const footnotes = [];
  const renderInline = makeInlineRenderer(makeLeafRenderer(footnotes));
  const content = JSON.parse(JSON.stringify(bible[segId].content));
  const blocks = splitIntoParagraphs(content);
  const items = [];
  let previousSourceName = null;

  // A story that opens mid-chapter (Revelation 20:4) gets a divider too, so
  // every story starts with its place in the Bible.
  const [startBook, startCh, startV] = firstRef(content).split('-');
  let openedWithChapter = false;

  blocks.forEach((block, bi) => {
    // "Psalm 90" headings ride as their own block; the chapter divider says it.
    if (typeof block.source === 'string') {
      const chapter = extractChapter(block);
      if (chapter) items.push(rule(chapter.book, chapter.n, 0));
      else if (bi === 0) items.push(rule(startBook, startCh, startV));
      return;
    }
    const color = block.source?.color || 'black';
    const sourceName = block.source?.sourceName || 'Unknown';
    const hasTail = sourceName !== previousSourceName;
    previousSourceName = sourceName;

    const chapter = extractChapter(block);
    if (bi === 0 && !chapter) items.push(rule(startBook, startCh, startV));
    if (chapter) {
      if (bi === 0) openedWithChapter = true;
      items.push(rule(chapter.book, chapter.n, chapter.book === 'Psa' ? 0 : 1));
    }

    const paras = block.children.map(renderInline).filter(Boolean).join('');
    if (!paras) return;
    const side = color === 'black' || color === 'red' ? 'left' : 'right';
    const showLabel = hasTail || Boolean(chapter);
    const label = showLabel ? `<div class="speaker speaker--${side}">${esc(sourceName.toUpperCase())}</div>` : '';
    items.push(
      `<div class="flow-item turn turn--${color} turn--${side}${showLabel ? ' has-tail' : ''}">` +
        label + `<div class="bubble">${paras}</div>` +
      `</div>`
    );
  });
  void openedWithChapter;
  return { items, footnotes };
}

// Plain text of one verse, with the voice that speaks it.
function verse(segId, ref) {
  let text = '';
  let voice = null;
  const walk = (n, src) => {
    if (Array.isArray(n)) return n.forEach((x) => walk(x, src));
    if (!n || typeof n !== 'object') return;
    if ((n.type === 'prose' || n.type === 'poetry') && text && !/\s$/.test(text)) text += ' ';
    const s = typeof n.source === 'object' ? n.source : src;
    const tag = Array.isArray(n.tag) ? n.tag : [];
    if (n.text && n.ref && n.ref.includes(ref) && !tag.includes('v') && !tag.includes('c') && !n.note) {
      text += n.text;
      if (!voice && s) voice = s;
    }
    if (n.children) walk(n.children, s);
  };
  walk(bible[segId].content, null);
  const [b, c, v] = ref.split('-');
  text = text.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  // A verse that starts inside someone's speech: open the quotation for print.
  const marks = text.replace(/[^“”]/g, '');
  if (marks[0] === '”') text = '“' + text;
  if (marks[marks.length - 1] === '“') text = text + '”';
  return {
    text,
    color: voice?.color || 'black',
    speaker: voice?.sourceName || 'The Narrator',
    label: `${bookName(b)} ${c}:${v}`,
  };
}

function cast(segId) {
  const order = ['black', 'green', 'red', 'blue'];
  return Object.entries(bible[segId].sources)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => order.indexOf(a.color) - order.indexOf(b.color) || b.words - a.words);
}

function share(segId) {
  const totals = { black: 0, red: 0, green: 0, blue: 0 };
  for (const v of Object.values(bible[segId].sources)) totals[v.color] += v.words;
  return { totals, total: Object.values(totals).reduce((a, b) => a + b, 0) };
}

export const DAYS = plan.segments.map((s, i) => {
  const n = i + 1;
  const week = WEEKS.find((w) => w.key === s.phase);
  const { items, footnotes } = storyFlow(s.segmentId);
  return {
    n,
    seg: s.segmentId,
    storyNo: Number(s.segmentId.slice(1)),
    title: titles[s.segmentId].title,
    ref: prettyRef(s.segmentId),
    shortRef: `${fullBookName(titles[s.segmentId].book[0])} ${titles[s.segmentId].ref.split(/[-:]/)[0]}`,
    date: dateOf(i),
    week,
    note: NOTES_2026[n] || s.note,
    keyVerses: KEY_VERSES[n].map((r) => verse(s.segmentId, r)),
    readers: bible[s.segmentId].readers,
    cast: cast(s.segmentId),
    share: share(s.segmentId),
    // Set 2, as printed in the first edition. (Set 1 was mismatched for many
    // stories until the 25 Nov 2026 fix; see docs/questions-fix-2026-11.md.)
    questions: questionBank[s.segmentId].family.set2,
    antiphon: ANTIPHONS[n] || null,
    words: bible[s.segmentId].colors.total,
    items,
    footnotes,
  };
});

export const TOTALS = {
  words: DAYS.reduce((a, d) => a + d.words, 0),
  speakers: new Set(DAYS.flatMap((d) => d.cast.map((c) => c.name))).size,
};
