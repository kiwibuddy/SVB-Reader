/**
 * Pull a line of Scripture out of the shipping Bible data together with the
 * voice it is attributed to, so ad copy is never typed from memory.
 *
 *   node scripts/find-quote.mjs "wherever you go"
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BIBLE = path.resolve(HERE, '../../../assets/data/newBibleNLT1.json');

const needle = process.argv.slice(2).join(' ').toLowerCase();
if (!needle) {
  console.error('usage: node scripts/find-quote.mjs "<phrase>"');
  process.exit(1);
}

const flatten = (node) => {
  if (!node || typeof node !== 'object') return '';
  if (Array.isArray(node)) return node.map(flatten).join('');
  // Footnotes are editorial apparatus, not spoken words.
  if (node.note) return '';
  const own = typeof node.text === 'string' && !(node.tag || []).some((t) => t === 'c' || t === 'v')
    ? node.text
    : '';
  return own + flatten(node.children);
};

const data = JSON.parse(fs.readFileSync(BIBLE, 'utf8'));

for (const [segId, seg] of Object.entries(data)) {
  for (const block of seg.content ?? []) {
    const text = flatten(block.children).replace(/\s+/g, ' ').trim();
    if (!text.toLowerCase().includes(needle)) continue;
    const refs = new Set();
    JSON.stringify(block.children, (k, v) => (k === 'ref' ? (v.forEach?.((r) => refs.add(r)), v) : v));
    console.log(`segment   ${segId}`);
    console.log(`speaker   ${block.source?.sourceName} (${block.source?.color})`);
    console.log(`refs      ${[...refs][0]} … ${[...refs].at(-1)}`);
    console.log(`text      ${text}`);
    console.log('─'.repeat(72));
  }
}
