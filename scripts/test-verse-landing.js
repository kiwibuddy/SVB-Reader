#!/usr/bin/env node
/**
 * Does a verse reference land on the right bubble?
 *
 *   node scripts/test-verse-landing.js          # every indexed verse
 *   node scripts/test-verse-landing.js --quick  # one verse per story
 *
 * Resolution is a separate concern — that is scripts/test-reference-search.js.
 * This checks the step after it: given a story and a chapter:verse, does the
 * reader find the block that actually contains that verse?
 *
 * It runs the app's *real* render pipeline — splitIntoParagraphs and
 * splitContentIntoReaderParts — and the app's *real* locator, so a pass here
 * means the shipped code works, not that a copy of it does.
 */

const path = require('path');
const { runTsHarness, ROOT } = require('./lib/run-ts-harness');

const quick = process.argv.includes('--quick');
const DATA = path.join(ROOT, 'assets', 'data');

const harness = `
import { splitIntoParagraphs } from './splitIntoParagraphs.ts';
import { splitContentIntoReaderParts } from './splitContentIntoReaderParts.ts';
import { findVerseBlockIndex, bookCodesForSegment } from './verseLocator.ts';
import { lookupReference } from './reference.ts';
import { createRequire } from 'node:module';

const req = createRequire(import.meta.url);
const bible = req('${DATA}/newBibleNLT1.json');
const index = req('${DATA}/verseSearchIndex.json');

const QUICK = ${quick};

/** Exactly what Segment.tsx renders: content through both splits. */
function render(seg) {
  const data = bible[seg];
  if (!data?.content) return [];
  const split = splitIntoParagraphs(data.content);
  const readers = data.readers || [];
  const unique = new Set(readers);
  return unique.size !== readers.length
    ? splitContentIntoReaderParts(split, readers)
    : split;
}

/** Every ref carried by a block, at any depth — the oracle we check against. */
function refsOf(block) {
  const out = new Set();
  const visit = (leaf) => {
    if (!leaf || typeof leaf !== 'object') return;
    if (Array.isArray(leaf.ref)) leaf.ref.forEach((r) => out.add(r));
    if (Array.isArray(leaf.children)) leaf.children.forEach(visit);
  };
  for (const inline of block.children || []) (inline?.children || []).forEach(visit);
  return out;
}

const rendered = new Map();
function blocksFor(seg) {
  if (!rendered.has(seg)) rendered.set(seg, render(seg));
  return rendered.get(seg);
}

let checked = 0, found = 0;
const notFound = [];
const wrongBlock = [];
const seenStories = new Set();

for (const [key, tuple] of Object.entries(index.v)) {
  const [segIdx, , ] = tuple;
  const seg = index.segs[segIdx];
  if (QUICK) {
    if (seenStories.has(seg)) continue;
    seenStories.add(seg);
  }

  const [, chapter, verse] = key.split('-').map(Number);
  const blocks = blocksFor(seg);
  const codes = bookCodesForSegment(seg);

  checked += 1;
  const at = findVerseBlockIndex(blocks, codes, chapter, verse);

  if (at < 0) {
    if (notFound.length < 8) notFound.push(\`\${seg} \${chapter}:\${verse} (books \${codes.join(',') || '?'})\`);
    continue;
  }
  // Independently confirm the block it chose really holds that verse.
  const refs = refsOf(blocks[at]);
  const hit = [...refs].some((r) => r.endsWith(\`-\${chapter}-\${verse}\`));
  if (hit) found += 1;
  else if (wrongBlock.length < 8) {
    wrongBlock.push(\`\${seg} \${chapter}:\${verse} → block \${at}, which holds \${[...refs].slice(0, 3).join(' ')}\`);
  }
}

const scope = QUICK ? 'one verse per story' : 'every indexed verse';
console.log(\`\\nVerse landing — \${scope}\\n\`);
console.log(\`  checked                       \${checked.toLocaleString()}\`);
console.log(\`  landed on a block holding it  \${found.toLocaleString()}\`);
console.log(\`  no block found                \${(checked - found - wrongBlock.length).toLocaleString()}\`);
console.log(\`  landed on the wrong block     \${wrongBlock.length.toLocaleString()}\`);

if (notFound.length) {
  console.log('\\n  NOT FOUND (first few):');
  notFound.forEach((f) => console.log('    ' + f));
}
if (wrongBlock.length) {
  console.log('\\n  WRONG BLOCK (first few):');
  wrongBlock.forEach((f) => console.log('    ' + f));
}

// ---- End to end: what the user types, through to the turn they land on ----
console.log('\\nEnd to end — typed reference to landed turn\\n');

const typed = [
  ['gen 4:3',     'S002', 'Cain and Abel'],
  ['Genesis 1:1', 'S001', 'the first verse'],
  ['gn 2.7',      'S001', 'later in the same story'],
  ['rev 22',      'S365', 'last chapter'],
  ['psalm 23',    null,   'chapter-only resolves to verse 1'],
  ['Jean 3:16',   null,   'French input'],
  ['1 co 13',     null,   'numbered book — unreachable before H1'],
  ['Isaiah 40',   null,   'was swallowed by the Roman-numeral parser'],
  ['1 sam 3:10',  null,   'numbered book, explicit verse'],
  ['jude 3',      null,   'single-chapter book — a lone number is a verse'],
  ['Song of Songs 1', null, 'multi-word book name'],
];

let e2ePass = 0;
for (const [input, wantSeg, note] of typed) {
  const r = lookupReference(input);
  if (r.kind !== 'exact') {
    console.log(\`  SKIP  \${input.padEnd(13)} does not resolve — \${note}\`);
    continue;
  }
  const { segmentId, chapter, verse } = r.result;
  const blocks = blocksFor(segmentId);
  const at = findVerseBlockIndex(blocks, bookCodesForSegment(segmentId), chapter, verse);
  const segOk = !wantSeg || segmentId === wantSeg;
  const ok = at >= 0 && segOk;
  if (ok) e2ePass += 1;
  const where = at >= 0 ? \`turn \${at + 1} of \${blocks.length}\` : 'NOT LOCATED';
  console.log(\`  \${ok ? 'PASS' : 'FAIL'}  \${input.padEnd(13)} \${segmentId} \${chapter}:\${verse} → \${where.padEnd(22)} \${note}\`);
}
console.log(\`\\n  \${e2ePass} of \${typed.length} typed references landed\\n\`);

const clean = found === checked;
console.log(clean
  ? \`  All \${checked.toLocaleString()} indexed verses land on a block that contains them.\\n\`
  : '  Failures above. See docs/store/PRE-SUBMISSION-FIXES.md H2.\\n');
process.exit(clean ? 0 : 1);
`;

process.exit(
  runTsHarness({
    modules: [
      'scripts/splitIntoParagraphs.ts',
      'scripts/splitContentIntoReaderParts.ts',
      'utils/verseLocator.ts',
      'utils/reference.ts',
    ],
    harness,
  })
);
