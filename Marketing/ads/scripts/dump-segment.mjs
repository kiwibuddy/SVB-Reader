/**
 * Dump one story's blocks in reading order, with the voice and source colour
 * the app assigns to each. Ad copy is lifted from this, never retyped.
 *
 *   node scripts/dump-segment.mjs S002
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BIBLE = path.resolve(HERE, '../../../assets/data/newBibleNLT1.json');

const segId = process.argv[2];
if (!segId) {
  console.error('usage: node scripts/dump-segment.mjs S002');
  process.exit(1);
}

const flatten = (node) => {
  if (!node || typeof node !== 'object') return '';
  if (Array.isArray(node)) return node.map(flatten).join('');
  if (node.note) return '';
  const tags = node.tag ?? [];
  const own =
    typeof node.text === 'string' && !tags.includes('c') && !tags.includes('v')
      ? node.text
      : '';
  return own + flatten(node.children);
};

const firstRef = (node) => {
  let found = null;
  JSON.stringify(node, (k, v) => {
    if (!found && k === 'ref' && Array.isArray(v) && v.length) found = v[0];
    return v;
  });
  return found;
};

const data = JSON.parse(fs.readFileSync(BIBLE, 'utf8'));
const seg = data[segId];
if (!seg) {
  console.error(`no segment ${segId}`);
  process.exit(1);
}

seg.content.forEach((block, i) => {
  const text = flatten(block.children).replace(/\s+/g, ' ').trim();
  if (!text) return;
  console.log(
    `[${String(i).padStart(2, '0')}] ${block.source?.color?.padEnd(5)} ${block.source?.sourceName} — ${firstRef(block.children)}`
  );
  console.log(`     ${text}`);
});
