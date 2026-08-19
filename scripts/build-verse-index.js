#!/usr/bin/env node
/**
 * Builds a slim verse search index from verseIndex.json.
 * Output: assets/data/verseSearchIndex.json
 *
 * Shape: { books: string[], segs: string[], v: Record<string, [segIdx, blockIdx, position]> }
 * Key format: "bookIdx-chapter-verse" (e.g. "0-1-1" for Genesis 1:1)
 */

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'assets', 'data', 'verseIndex.json');
const dst = path.join(__dirname, '..', 'assets', 'data', 'verseSearchIndex.json');

const raw = JSON.parse(fs.readFileSync(src, 'utf8'));

const bookSet = [];
const bookMap = {};
const segSet = [];
const segMap = {};
const v = {};

for (const [key, entry] of Object.entries(raw)) {
  if (!(entry.book in bookMap)) {
    bookMap[entry.book] = bookSet.length;
    bookSet.push(entry.book);
  }
  if (!(entry.segmentId in segMap)) {
    segMap[entry.segmentId] = segSet.length;
    segSet.push(entry.segmentId);
  }

  const bIdx = bookMap[entry.book];
  const sIdx = segMap[entry.segmentId];
  const shortKey = `${bIdx}-${entry.chapter}-${entry.verse}`;
  v[shortKey] = [sIdx, entry.blockIndex, entry.position];
}

const out = { books: bookSet, segs: segSet, v };
const json = JSON.stringify(out);
fs.writeFileSync(dst, json, 'utf8');

const origSize = fs.statSync(src).size;
const newSize = Buffer.byteLength(json, 'utf8');
console.log(`Original: ${(origSize / 1024).toFixed(0)} KB (${Object.keys(raw).length} keys)`);
console.log(`Slim:     ${(newSize / 1024).toFixed(0)} KB`);
console.log(`Saved:    ${((1 - newSize / origSize) * 100).toFixed(1)}%`);
console.log(`Written:  ${dst}`);
