#!/usr/bin/env node
/**
 * Is any scripture missing from what the reader displays?
 *
 *   node scripts/audit-scripture.js            # summary
 *   node scripts/audit-scripture.js --verbose  # list every gap
 *
 * Checks, against the blocks the reader actually renders (content put through
 * the real splitters), that:
 *
 *   A  every chapter of all 66 books appears
 *   B  verses run 1..N within each chapter, with no holes
 *   C  every verse carries visible text, not just a number marker
 *   D  tables have content in their cells
 *   E  no leaf is silently dropped by the renderer
 *
 * Ground truth for A is BookChapterList.json. B and C are self-checking: a hole
 * in a sequence, or a verse marker with nothing after it, is a defect whatever
 * the reference says.
 */

const path = require('path');
const { runTsHarness, ROOT } = require('./lib/run-ts-harness');

const verbose = process.argv.includes('--verbose');
const DATA = path.join(ROOT, 'assets', 'data');

const harness = `
import { splitIntoParagraphs } from './splitIntoParagraphs.ts';
import { splitContentIntoReaderParts } from './splitContentIntoReaderParts.ts';
import { createRequire } from 'node:module';

const req = createRequire(import.meta.url);
const bible = req('${DATA}/newBibleNLT1.json');
const bcl = req('${DATA}/BookChapterList.json');
const VERBOSE = ${verbose};

/** Exactly what Segment.tsx renders. */
function render(seg) {
  const data = bible[seg];
  if (!data?.content) return [];
  const split = splitIntoParagraphs(data.content);
  const readers = data.readers || [];
  return new Set(readers).size !== readers.length
    ? splitContentIntoReaderParts(split, readers)
    : split;
}

const TABLE_TAGS = ['tr','th','tc','th1','th2','th3','tc1','tc2','tc3'];
// tag is a string on table elements and an array on inline runs. Both occur.
const hasTag = (leaf, list) => {
  const t = leaf.tag;
  if (Array.isArray(t)) return t.some((x) => list.includes(x));
  if (typeof t === 'string') return list.includes(t);
  return false;
};

// Text carried per verse ref, and the structural facts we need.
const textByRef = new Map();   // "Gen-1-1" -> accumulated visible text length
const seenRefs = new Set();
let tables = 0, tableCells = 0, emptyTableCells = 0, deepCells = 0;
const deepSamples = [];
let droppedLeaves = 0;
const droppedSamples = [];
let markerOnlyLeaves = 0;

/** Walk a leaf the way Leaf.tsx does, recording what would render. */
function walkLeaf(leaf, seg, depth = 0) {
  if (!leaf || typeof leaf !== 'object') return;

  const refs = Array.isArray(leaf.ref) ? leaf.ref : [];
  for (const r of refs) seenRefs.add(r);

  const isTable = hasTag(leaf, TABLE_TAGS);

  if (isTable) {
    if (!Array.isArray(leaf.children) || leaf.children.length === 0) {
      // Leaf.tsx renders nothing for a table element with no children.
      emptyTableCells += 1;
      if (droppedSamples.length < 6) droppedSamples.push(\`\${seg}: childless table element \${JSON.stringify(leaf).slice(0, 90)}\`);
      return;
    }
    if (hasTag(leaf, ['tr'])) tables += 1;
    if (hasTag(leaf, ['tc','tc1','tc2','tc3','th','th1','th2','th3'])) {
      tableCells += 1;
      const text = leaf.children.map((c) => (typeof c.text === 'string' ? c.text : '')).join('').trim();
      if (!text) emptyTableCells += 1;
      // Leaf.tsx's row renderer reads cell children one level deep and returns
      // child.text. Anything nested below that would render as nothing.
      for (const c of leaf.children) {
        if (typeof c.text !== 'string' && Array.isArray(c.children)) {
          deepCells += 1;
          if (deepSamples.length < 5) deepSamples.push(\`\${seg}: \${JSON.stringify(c).slice(0, 100)}\`);
        }
      }
    }
    leaf.children.forEach((c) => walkLeaf(c, seg, depth + 1));
    return;
  }

  if (typeof leaf.text !== 'string') {
    // Leaf.tsx returns null here and logs a warning.
    if (Array.isArray(leaf.children)) {
      leaf.children.forEach((c) => walkLeaf(c, seg, depth + 1));
      return;
    }
    droppedLeaves += 1;
    if (droppedSamples.length < 6) {
      droppedSamples.push(\`\${seg}: \${JSON.stringify(leaf).slice(0, 110)}\`);
    }
    return;
  }

  // A verse or chapter number is a marker, not scripture text.
  const isMarker = Array.isArray(leaf.tag) && leaf.tag.some((t) => t === 'v' || t === 'c');
  if (isMarker) { markerOnlyLeaves += 1; return; }

  const visible = leaf.text.replace(/\\s+/g, '').length;
  if (visible === 0) return;
  for (const r of refs) {
    textByRef.set(r, (textByRef.get(r) || 0) + visible);
  }
}

for (let n = 1; n <= 365; n += 1) {
  const seg = \`S\${String(n).padStart(3, '0')}\`;
  for (const block of render(seg)) {
    for (const inline of block.children || []) {
      for (const leaf of inline?.children || []) walkLeaf(leaf, seg);
    }
  }
}

// ---- Build book → chapter → verses actually present ----
const present = new Map(); // code -> Map(chapter -> Set(verse))
for (const ref of seenRefs) {
  const parts = ref.split('-');
  if (parts.length !== 3) continue;
  const [code, c, v] = parts;
  if (!present.has(code)) present.set(code, new Map());
  const chapters = present.get(code);
  const ch = Number(c);
  if (!chapters.has(ch)) chapters.set(ch, new Set());
  chapters.get(ch).add(Number(v));
}

// ---- A · chapter coverage ----
const missingChapters = [];
for (const [code, info] of Object.entries(bcl)) {
  const expected = String(info.chapters).split(',').filter(Boolean).map(Number);
  const got = present.get(code) || new Map();
  const missing = expected.filter((c) => !got.has(c));
  if (missing.length) missingChapters.push([info.bookName, missing]);
}

// ---- B · verse gaps within a chapter ----
const gaps = [];
for (const [code, chapters] of present) {
  const name = bcl[code]?.bookName || code;
  for (const [ch, verses] of chapters) {
    const nums = [...verses].filter((v) => v > 0).sort((a, b) => a - b);
    if (!nums.length) continue;
    if (nums[0] !== 1) gaps.push(\`\${name} \${ch} starts at verse \${nums[0]}\`);
    for (let i = 1; i < nums.length; i += 1) {
      if (nums[i] !== nums[i - 1] + 1) {
        const from = nums[i - 1] + 1, to = nums[i] - 1;
        gaps.push(\`\${name} \${ch}:\${from === to ? from : from + '-' + to}\`);
      }
    }
  }
}

// ---- C · verses with a marker but no text ----
const textless = [];
for (const ref of seenRefs) {
  if (!textByRef.has(ref)) {
    const [code, c, v] = ref.split('-');
    if (Number(v) === 0) continue; // psalm superscriptions are titles
    textless.push(\`\${bcl[code]?.bookName || code} \${c}:\${v}\`);
  }
}

// ---- Report ----
const totalVerses = [...present.values()]
  .reduce((sum, ch) => sum + [...ch.values()].reduce((s, v) => s + v.size, 0), 0);

console.log('\\nScripture audit — against what the reader renders\\n');
console.log(\`  books present                \${present.size} / 66\`);
console.log(\`  verse references             \${totalVerses.toLocaleString()}\`);
console.log(\`  verses carrying text         \${textByRef.size.toLocaleString()}\`);
console.log(\`  verse/chapter number markers \${markerOnlyLeaves.toLocaleString()}\`);
console.log();
console.log(\`  A  chapters missing          \${missingChapters.length === 0 ? 'none' : missingChapters.length + ' book(s)'}\`);
console.log(\`  B  verse-sequence gaps       \${gaps.length}\`);
console.log(\`  C  verses with no text       \${textless.length}\`);
console.log(\`  D  table rows / cells        \${tables} / \${tableCells}\${emptyTableCells ? '  (' + emptyTableCells + ' EMPTY)' : '  (all populated)'}\`);
console.log(\`  D2 cells nested too deep     \${deepCells}\`);
console.log(\`  E  leaves the renderer drops \${droppedLeaves}\`);

if (missingChapters.length) {
  console.log('\\n  MISSING CHAPTERS:');
  for (const [book, list] of missingChapters) console.log(\`    \${book}: \${list.join(', ')}\`);
}
if (gaps.length) {
  console.log(\`\\n  VERSE GAPS (\${gaps.length}):\`);
  (VERBOSE ? gaps : gaps.slice(0, 30)).forEach((g) => console.log('    ' + g));
  if (!VERBOSE && gaps.length > 30) console.log(\`    … \${gaps.length - 30} more, run with --verbose\`);
}
if (textless.length) {
  console.log(\`\\n  VERSES WITH A NUMBER BUT NO TEXT (\${textless.length}):\`);
  (VERBOSE ? textless : textless.slice(0, 20)).forEach((t) => console.log('    ' + t));
  if (!VERBOSE && textless.length > 20) console.log(\`    … \${textless.length - 20} more, run with --verbose\`);
}
if (deepSamples.length) {
  console.log('\\n  CELLS NESTED DEEPER THAN THE ROW RENDERER READS (sample):');
  deepSamples.forEach((d) => console.log('    ' + d));
}
if (droppedSamples.length) {
  console.log('\\n  DROPPED LEAVES (sample):');
  droppedSamples.forEach((d) => console.log('    ' + d));
}

const clean = missingChapters.length === 0 && textless.length === 0 && emptyTableCells === 0 && deepCells === 0;
console.log(clean
  ? '\\n  No chapter missing, every verse carries text, every table cell populated.\\n'
  : '\\n  See above.\\n');
process.exit(clean ? 0 : 1);
`;

process.exit(
  runTsHarness({
    modules: ['scripts/splitIntoParagraphs.ts', 'scripts/splitContentIntoReaderParts.ts'],
    harness,
  })
);
