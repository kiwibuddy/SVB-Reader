#!/usr/bin/env node
/**
 * Builds the verse search index from source.
 *
 *   node scripts/build-verse-index.js
 *
 * Output: assets/data/verseSearchIndex.json
 *   { books: string[], segs: string[], v: { "bookIdx-chapter-verse": [segIdx, blockIdx] } }
 *
 * This reads `newBibleNLT1.json` — the same file the reader renders — and takes
 * book names from `BookChapterList.json`. It used to derive from an intermediate
 * `verseIndex.json`, which had silently lost every numbered book (1 & 2 Samuel
 * through 3 John — 17 books, 6,128 verses) and left five more under truncated
 * codes, so "John 3:16" resolved but displayed as "Joh 3:16". Building from
 * source removes that whole class of problem: if a verse is in the Bible the app
 * ships, it is in this index.
 *
 * `blockIndex` addresses `segmentData.content`. The reader does NOT use it to
 * locate a verse — it splits content before rendering, so the indices diverge.
 * See utils/verseLocator.ts. It is kept because it is cheap, correct, and useful
 * for diagnostics.
 */

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'assets', 'data');

const bible = JSON.parse(fs.readFileSync(path.join(DATA, 'newBibleNLT1.json'), 'utf8'));
const books = JSON.parse(fs.readFileSync(path.join(DATA, 'BookChapterList.json'), 'utf8'));

// Book order is BookChapterList's own key order, which is canonical Bible order.
const codes = Object.keys(books);
const bookIndexByCode = new Map(codes.map((code, i) => [code, i]));
const bookNames = codes.map((code) => books[code].bookName);

/** Every `ref` string carried by a block, at any depth. */
function refsOf(block) {
  const out = new Set();
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node.ref)) node.ref.forEach((r) => out.add(r));
    if (Array.isArray(node.children)) node.children.forEach(visit);
  };
  for (const inline of block.children || []) (inline?.children || []).forEach(visit);
  return out;
}

const segs = [];
const v = {};
const unknownCodes = new Set();
let duplicates = 0;

for (let n = 1; n <= 365; n += 1) {
  const segmentId = `S${String(n).padStart(3, '0')}`;
  const content = bible[segmentId]?.content;
  if (!Array.isArray(content)) {
    console.warn(`  warning: ${segmentId} has no content`);
    continue;
  }

  const segIdx = segs.length;
  segs.push(segmentId);

  content.forEach((block, blockIdx) => {
    for (const ref of refsOf(block)) {
      // "Gen-1-1" → code, chapter, verse. Codes never contain a hyphen.
      const parts = ref.split('-');
      if (parts.length !== 3) continue;
      const [code, chapter, verse] = parts;

      const bookIdx = bookIndexByCode.get(code);
      if (bookIdx === undefined) {
        unknownCodes.add(code);
        continue;
      }

      const key = `${bookIdx}-${Number(chapter)}-${Number(verse)}`;
      // First occurrence in story order wins.
      if (key in v) {
        duplicates += 1;
        continue;
      }
      v[key] = [segIdx, blockIdx];
    }
  });
}

const out = { books: bookNames, segs, v };
const json = JSON.stringify(out);
const dst = path.join(DATA, 'verseSearchIndex.json');
fs.writeFileSync(dst, json, 'utf8');

// ---- Report, and check the alias table still lines up ----

const covered = new Set(Object.keys(v).map((k) => Number(k.split('-')[0])));
const missingBooks = codes.filter((_, i) => !covered.has(i)).map((c) => books[c].bookName);

const aliases = JSON.parse(fs.readFileSync(path.join(DATA, 'bookAliases.json'), 'utf8'));
const nameSet = new Set(bookNames);
const strayCanonicals = aliases
  .map((entry) => entry.canonical)
  .filter((canonical) => !nameSet.has(canonical));

console.log(`Books      ${bookNames.length}`);
console.log(`Stories    ${segs.length}`);
console.log(`Verses     ${Object.keys(v).length.toLocaleString()}`);
console.log(`Size       ${(Buffer.byteLength(json, 'utf8') / 1024).toFixed(0)} KB`);
console.log(`Written    ${dst}`);

if (duplicates) console.log(`\nRepeated verse refs (first occurrence kept): ${duplicates.toLocaleString()}`);
if (unknownCodes.size) console.log(`\nUNKNOWN BOOK CODES: ${[...unknownCodes].join(', ')}`);
if (missingBooks.length) console.log(`\nBOOKS WITH NO VERSES: ${missingBooks.join(', ')}`);
if (strayCanonicals.length) {
  console.log(`\nbookAliases.json canonicals not in the index (${strayCanonicals.length}):`);
  console.log(`  ${strayCanonicals.join(', ')}`);
  console.log('  These resolve to nothing. Fix them before shipping.');
}

const bad = unknownCodes.size + missingBooks.length + strayCanonicals.length;
console.log(bad === 0 ? '\nIndex and alias table agree.\n' : `\n${bad} problem(s) above.\n`);
process.exit(bad === 0 ? 0 : 1);
