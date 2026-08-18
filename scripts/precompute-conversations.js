/**
 * Build-time conversation graph from the 365 S* stories.
 * Filter to S* keys only. Exclude narration before adjacency.
 *
 * Run: node scripts/precompute-conversations.js
 */
const fs = require('fs');
const path = require('path');

const biblePath = path.join(__dirname, '../assets/data/newBibleNLT1.json');
const titlesPath = path.join(__dirname, '../assets/data/SegmentTitles.json');
const outPath = path.join(__dirname, '../assets/data/conversations.json');

const NARRATION = new Set(['The Narrator', 'The Compiler', 'The Preacher', 'The Choir']);

function groupFor(color) {
  if (color === 'black') return 'narration';
  if (color === 'red') return 'divine';
  if (color === 'green') return 'principal';
  return 'chorus';
}

function extractText(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  if (node.note) return '';
  const tags = Array.isArray(node.tag) ? node.tag : node.tag ? [node.tag] : [];
  if (tags.some((t) => ['f', 'fr', 'ft', 'fqa', 'fk', 'fq'].includes(t))) return '';
  let text = node.text ? String(node.text) : '';
  if (node.children) text += ' ' + extractText(node.children);
  return text;
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function ensureVoice(voices, name, color) {
  if (!voices.has(name)) {
    voices.set(name, {
      name,
      color,
      wordsByColor: { black: 0, red: 0, green: 0, blue: 0 },
      words: 0,
      turns: 0,
      stories: new Set(),
      partners: new Map(),
      exchanges: [],
      longestSpeech: { words: 0, storyId: '', storyTitle: '' },
    });
  }
  return voices.get(name);
}

function main() {
  const bible = JSON.parse(fs.readFileSync(biblePath, 'utf8'));
  const titles = JSON.parse(fs.readFileSync(titlesPath, 'utf8'));
  const voices = new Map();

  for (const [id, seg] of Object.entries(bible)) {
    if (!id.startsWith('S')) continue;
    const title = titles[id]?.title || id;
    const content = seg.content || [];

    for (const [name, info] of Object.entries(seg.sources || {})) {
      if (!name || name === 'undefined') continue;
      const color = info.color || 'blue';
      const v = ensureVoice(voices, name, color);
      const w = Number(info.words) || 0;
      v.words += w;
      v.wordsByColor[color] = (v.wordsByColor[color] || 0) + w;
      v.stories.add(id);
    }

    const seq = [];
    for (const block of content) {
      const name = block?.source?.sourceName;
      const color = block?.source?.color || 'blue';
      if (!name) continue;
      const words = countWords(extractText(block));
      const last = seq[seq.length - 1];
      if (last && last.name === name) {
        last.words += words;
      } else {
        seq.push({ name, color, words });
      }
    }

    for (const turn of seq) {
      const v = ensureVoice(voices, turn.name, turn.color);
      v.turns += 1;
      if (turn.words > v.longestSpeech.words) {
        v.longestSpeech = { words: turn.words, storyId: id, storyTitle: title };
      }
    }

    const spoken = seq.filter((t) => !NARRATION.has(t.name));
    for (let i = 0; i < spoken.length - 1; i++) {
      const a = spoken[i].name;
      const b = spoken[i + 1].name;
      if (a === b) continue;
      const va = ensureVoice(voices, a, spoken[i].color);
      const vb = ensureVoice(voices, b, spoken[i + 1].color);
      va.partners.set(b, (va.partners.get(b) || 0) + 1);
      vb.partners.set(a, (vb.partners.get(a) || 0) + 1);
    }

    let i = 0;
    while (i < spoken.length) {
      if (i + 1 >= spoken.length) break;
      const a = spoken[i].name;
      const b = spoken[i + 1].name;
      if (a === b) {
        i += 1;
        continue;
      }
      let len = 2;
      let j = i + 2;
      while (j < spoken.length) {
        const expect = (j - i) % 2 === 0 ? a : b;
        if (spoken[j].name !== expect) break;
        len += 1;
        j += 1;
      }
      if (len >= 3) {
        ensureVoice(voices, a, spoken[i].color).exchanges.push({
          partner: b,
          turns: len,
          storyId: id,
          storyTitle: title,
        });
        ensureVoice(voices, b, spoken[i + 1].color).exchanges.push({
          partner: a,
          turns: len,
          storyId: id,
          storyTitle: title,
        });
      }
      i += Math.max(1, len - 1);
    }
  }

  const outVoices = {};
  for (const [name, v] of voices) {
    const color = Object.entries(v.wordsByColor).sort((a, b) => b[1] - a[1])[0][0];
    const storyIds = [...v.stories].sort();
    const spokeWith = [...v.partners.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([partner, count]) => ({ name: partner, count }));
    const longestExchange = v.exchanges.sort((a, b) => b.turns - a.turns)[0] || null;
    outVoices[name] = {
      name,
      color,
      group: groupFor(color),
      words: v.words,
      turns: v.turns,
      storyIds,
      firstStoryId: storyIds[0] || null,
      lastStoryId: storyIds[storyIds.length - 1] || null,
      spokeWith,
      longestExchange,
      longestSpeech: v.longestSpeech.words > 0 ? v.longestSpeech : null,
    };
  }

  const payload = {
    meta: {
      stories: 365,
      voices: Object.keys(outVoices).length,
      generatedAt: new Date().toISOString(),
      source: 'assets/data/newBibleNLT1.json',
      filter: 'S*',
      narrationExcludedFromAdjacency: [...NARRATION],
    },
    voices: outVoices,
  };

  fs.writeFileSync(outPath, JSON.stringify(payload));
  const jesus = outVoices.Jesus;
  const abraham = outVoices.Abraham;
  const ruth = outVoices.Ruth;
  console.log('Wrote', outPath);
  console.log('voices', payload.meta.voices);
  console.log('Jesus', jesus?.words, jesus?.turns, jesus?.storyIds?.length, jesus?.spokeWith?.[0], jesus?.longestExchange);
  console.log('Abraham', abraham?.words, abraham?.spokeWith?.[0], abraham?.longestExchange);
  console.log('Ruth', ruth?.words, ruth?.spokeWith);
}

main();
