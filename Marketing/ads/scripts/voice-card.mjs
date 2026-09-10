/**
 * Prepare a Voice of the Week card.
 *
 *   node scripts/voice-card.mjs "Ruth"
 *   npx remotion still src/index.ts VoiceCard out/voice-ruth.png
 *
 * Writes src/data/voice.json from the shipping conversation data, so the card
 * is never typed by hand. conversations.json is far too large to import into the
 * Remotion bundle, which is why this runs as a build step instead.
 *
 * With no argument, lists the voices that make the best cards: enough said to be
 * interesting, few enough stories to be a discovery.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONV = path.resolve(HERE, '../../../assets/data/conversations.json');
const TIMES = path.resolve(HERE, '../../../assets/data/SegmentReadingTimes.json');
const OUT = path.resolve(HERE, '../src/data/voice.json');

const conv = JSON.parse(fs.readFileSync(CONV, 'utf8'));
const times = JSON.parse(fs.readFileSync(TIMES, 'utf8'));

const narration = new Set(conv.meta.narrationExcludedFromAdjacency || []);
const ranked = Object.values(conv.voices)
  .filter((v) => !narration.has(v.name))
  .sort((a, b) => b.words - a.words);

const name = process.argv.slice(2).join(' ').trim();

if (!name) {
  // A good card needs someone who says a real amount in a small number of
  // places — that is what makes the number surprising.
  const picks = ranked
    .filter((v) => v.words >= 120 && v.storyIds.length <= 3 && v.spokeWith)
    .slice(0, 25);
  console.log('Voices that make good cards — said a lot, in very few places:\n');
  for (const v of picks) {
    console.log(
      `  ${String(ranked.indexOf(v) + 1).padStart(3, '0')}  ${v.name.padEnd(30)} ${String(v.words).padStart(5)} words  ${v.storyIds.length} story(s)  ${v.color}`
    );
  }
  console.log(`\n  node scripts/voice-card.mjs "${picks[0]?.name ?? 'Ruth'}"`);
  process.exit(0);
}

const voice =
  conv.voices[name] ||
  Object.values(conv.voices).find((v) => v.name.toLowerCase() === name.toLowerCase());

if (!voice) {
  console.error(`No voice named "${name}".`);
  const near = Object.values(conv.voices)
    .filter((v) => v.name.toLowerCase().includes(name.toLowerCase()))
    .slice(0, 8);
  if (near.length) console.error('Did you mean: ' + near.map((v) => v.name).join(', '));
  process.exit(1);
}

const rank = ranked.indexOf(voice) + 1;
const partners = Object.values(voice.spokeWith || {})
  .sort((a, b) => b.count - a.count)
  .slice(0, 4)
  .map((p) => ({
    name: p.name,
    count: p.count,
    color: conv.voices[p.name]?.color ?? 'blue',
  }));

const storyOf = (id) => ({
  id,
  title: times[id]?.title ?? id,
  ref: times[id] ? `${times[id].book} ${times[id].reference}` : '',
  minutes: times[id]?.estimatedReadingTimeMinutes ?? null,
});

const card = {
  name: voice.name,
  color: voice.color,
  group: voice.group,
  rank,
  rankOf: ranked.length,
  words: voice.words,
  turns: voice.turns,
  storyCount: voice.storyIds.length,
  stories: voice.storyIds.slice(0, 3).map(storyOf),
  partners,
  longestSpeech: voice.longestSpeech ?? null,
  longestExchange: voice.longestExchange ?? null,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(card, null, 2) + '\n');

console.log(`${card.name} — ${card.color}, rank ${rank} of ${ranked.length}`);
console.log(`${card.words} words across ${card.turns} turns in ${card.storyCount} story(s)`);
console.log(`spoke with: ${partners.map((p) => `${p.name} (${p.count})`).join(', ') || '—'}`);
console.log(`\nwrote ${path.relative(process.cwd(), OUT)}`);
console.log(`npx remotion still src/index.ts VoiceCard out/voice-${card.name.toLowerCase().replace(/\W+/g, '-')}.png`);
