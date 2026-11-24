#!/usr/bin/env node
/**
 * Parse, check and build Advent companion content.
 *
 *   node scripts/companion.mjs check
 *   node scripts/companion.mjs build
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'docs/advent/ADVENT-COMPANION-CONTENT.md');
const OUT = path.join(ROOT, 'assets/data/PlanCompanion.json');
const BIBLE = path.join(ROOT, 'assets/data/newBibleNLT1.json');
const MAPPINGS = path.join(ROOT, 'assets/data/ChronologicalMappings.json');

const PLAN_ID = 'adventJourneyChronological';
const RESPONSES = new Set(['pray', 'give thanks', 'notice', 'reconcile', 'act']);

const ANTIPHONS = {
  19: {
    title: 'O Wisdom',
    prayer:
      'O Wisdom, who came from the mouth of the Most High, reaching from one end of creation to the other and ordering all things with strength and gentleness: come and teach us the way of understanding.',
    sources: 'Sirach 24:3; Wisdom 8:1; John 1',
  },
  20: {
    title: 'O Lord',
    prayer:
      'O Lord and Ruler of the house of Israel, who appeared to Moses in the flame of the burning bush and gave him the law on Sinai: come and rescue us with your outstretched arm.',
    sources: 'Exodus 3; 20',
  },
  21: {
    title: 'O Root of Jesse',
    prayer:
      'O Root of Jesse, standing as a sign for the peoples, before whom kings fall silent and whom the nations seek: come and set us free, and do not delay.',
    sources: 'Isaiah 11:1, 10; 52:15',
  },
  22: {
    title: 'O Key of David',
    prayer:
      'O Key of David, sceptre of the house of Israel, you open and no one can shut, you shut and no one can open: come and lead the prisoners out of the prison house, those who sit in darkness and the shadow of death.',
    sources: 'Isaiah 22:22; 42:7; Revelation 3:7',
  },
  23: {
    title: 'O Dayspring',
    prayer:
      'O Dayspring, radiance of eternal light and Sun of Righteousness: come and give light to those who sit in darkness and the shadow of death.',
    sources: 'Malachi 4:2; Luke 1:78–79',
  },
  24: {
    title: 'O King of the Nations',
    prayer:
      'O King of the nations, the one they long for, the cornerstone who makes the two into one: come and save the people you formed from the dust of the earth.',
    sources: 'Isaiah 28:16; Ephesians 2:14',
  },
  25: {
    title: 'O Emmanuel',
    prayer:
      'O Emmanuel, our King and Lawgiver, the hope of the nations and their Saviour: come and save us, Lord our God.',
    sources: 'Isaiah 7:14; 33:22',
  },
};

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeQuote(s) {
  return s
    .normalize('NFKC')
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    // NLT leaves often join without a space; ignore whitespace for matching.
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase();
}

function storyText(bible, storyId) {
  const seg = bible[storyId];
  if (!seg?.content) return '';
  const parts = [];
  const visit = (leaf) => {
    if (!leaf || typeof leaf !== 'object') return;
    if (typeof leaf.text === 'string') parts.push(leaf.text);
    for (const child of leaf.children || []) visit(child);
  };
  for (const block of seg.content) {
    for (const inline of block.children || []) {
      for (const leaf of inline.children || []) visit(leaf);
    }
  }
  // Drop footnote markers (*); NLT stores them inline in the leaf text.
  return normalizeQuote(parts.join('').replace(/\*/g, ''));
}

function storyRefs(bible, storyId) {
  const seg = bible[storyId];
  const refs = new Set();
  const visit = (leaf) => {
    if (!leaf || typeof leaf !== 'object') return;
    if (Array.isArray(leaf.ref)) for (const r of leaf.ref) refs.add(r);
    for (const child of leaf.children || []) visit(child);
  };
  for (const block of seg?.content || []) {
    for (const inline of block.children || []) {
      for (const leaf of inline.children || []) visit(leaf);
    }
  }
  return refs;
}

function extractQuotes(text) {
  const out = [];
  const re = /"([^"\n]{2,})"/g;
  let m;
  while ((m = re.exec(text))) out.push(m[1]);
  return out;
}

function parseNumberedList(block) {
  return block
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^\d+\.\s+/.test(l))
    .map((l) => l.replace(/^\d+\.\s+/, '').trim());
}

function parseContent(md) {
  const days = {};
  const dayBlocks = md.split(/^## Day /m).slice(1);
  for (const block of dayBlocks) {
    const header = block.match(/^(\d+)\s*·\s*(S\d+)\s*·\s*([^\n]+)/);
    if (!header) throw new Error(`Bad day header: ${block.slice(0, 60)}`);
    const day = Number(header[1]);
    const storyId = header[2];
    const body = block.slice(header[0].length);

    const intro = body.match(/^Intro:\s*([\s\S]*?)(?=\nKey verses:)/m)?.[1]?.trim();
    const keyVerses = (body.match(/^Key verses:\s*(.+)$/m)?.[1] || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const response = body.match(/^Response:\s*(.+)$/m)?.[1]?.trim();
    const family = parseNumberedList(body.match(/^Family:\s*\n([\s\S]*?)(?=\nSchool:)/m)?.[1] || '');
    const school = parseNumberedList(body.match(/^School:\s*\n([\s\S]*?)(?=\nSmall group:)/m)?.[1] || '');
    const smallgroup = parseNumberedList(
      body.match(/^Small group:\s*\n([\s\S]*?)(?=\nClosing:)/m)?.[1] || ''
    );
    const closing = body.match(/^Closing:\s*(.+)$/m)?.[1]?.trim();

    let antiphon = null;
    // Do not use the /m flag here: $ would match end-of-line and stop after Title.
    const antiphonBlock = body.match(/\nAntiphon:\s*\n([\s\S]*)$/)?.[1];
    if (antiphonBlock && antiphonBlock.trim()) {
      antiphon = {
        title: antiphonBlock.match(/^Title:\s*(.+)$/m)?.[1]?.trim() || '',
        prayer: antiphonBlock.match(/^Prayer:\s*(.+)$/m)?.[1]?.trim() || '',
        sources: antiphonBlock.match(/^Sources:\s*(.+)$/m)?.[1]?.trim() || '',
      };
    }

    days[day] = {
      storyId,
      intro,
      keyVerses,
      response,
      questions: { family, school, smallgroup },
      closing,
      antiphon,
    };
  }

  const finishBlock = md.split(/^## Finish\s*$/m)[1] || '';
  const finish = {
    title: finishBlock.match(/^Title:\s*(.+)$/m)?.[1]?.trim() || '',
    body: finishBlock.match(/^Body:\s*([\s\S]*?)(?=\nNext:)/m)?.[1]?.trim() || '',
    nextPlanId: finishBlock.match(/^Next:\s*(.+)$/m)?.[1]?.trim() || '',
  };

  return { days, finish };
}

function check(parsed, bible, storyOrder) {
  const errors = [];
  const dayNums = Object.keys(parsed.days)
    .map(Number)
    .sort((a, b) => a - b);

  if (dayNums.length !== 26) errors.push(`Expected 26 days, got ${dayNums.length}`);
  if (dayNums.join(',') !== Array.from({ length: 26 }, (_, i) => i + 1).join(',')) {
    errors.push(`Day numbers must be 1–26 consecutive; got ${dayNums.join(',')}`);
  }

  let prevResponse = null;
  for (const day of dayNums) {
    const d = parsed.days[day];
    const expectedStory = storyOrder[day - 1];
    if (d.storyId !== expectedStory) {
      errors.push(`Day ${day}: storyId ${d.storyId} !== plan order ${expectedStory}`);
    }
    if (!d.intro) errors.push(`Day ${day}: missing intro`);
    else if (wordCount(d.intro) > 60) {
      errors.push(`Day ${day}: intro has ${wordCount(d.intro)} words (max 60)`);
    }
    if (!RESPONSES.has(d.response)) errors.push(`Day ${day}: bad Response "${d.response}"`);
    if (prevResponse && d.response === prevResponse) {
      errors.push(`Day ${day}: Response "${d.response}" repeats Day ${day - 1}`);
    }
    prevResponse = d.response;

    for (const aud of ['family', 'school', 'smallgroup']) {
      if (d.questions[aud].length !== 4) {
        errors.push(`Day ${day}: ${aud} has ${d.questions[aud].length} questions (need 4)`);
      }
    }
    if (!d.closing) errors.push(`Day ${day}: missing closing`);

    const expectedAntiphon = ANTIPHONS[day] || null;
    if (expectedAntiphon) {
      if (!d.antiphon) errors.push(`Day ${day}: missing antiphon`);
      else {
        if (d.antiphon.title !== expectedAntiphon.title) {
          errors.push(`Day ${day}: antiphon title mismatch`);
        }
        if (d.antiphon.prayer !== expectedAntiphon.prayer) {
          errors.push(`Day ${day}: antiphon prayer mismatch`);
        }
        if (d.antiphon.sources !== expectedAntiphon.sources) {
          errors.push(`Day ${day}: antiphon sources mismatch`);
        }
      }
    } else if (d.antiphon) {
      errors.push(`Day ${day}: unexpected antiphon`);
    }

    const text = storyText(bible, d.storyId);
    const refs = storyRefs(bible, d.storyId);
    for (const ref of d.keyVerses) {
      if (!refs.has(ref)) errors.push(`Day ${day}: key verse ${ref} not in story ${d.storyId}`);
    }

    const allText = [
      d.intro,
      d.closing,
      ...d.questions.family,
      ...d.questions.school,
      ...d.questions.smallgroup,
    ].join('\n');
    for (const q of extractQuotes(allText)) {
      // Allow a trailing pause mark in the draft that the NLT does not share.
      const needle = normalizeQuote(q).replace(/[.,;:!?'"…]+$/g, '');
      if (!needle || !text.includes(needle)) {
        errors.push(`Day ${day}: quoted phrase not in NLT story: "${q.slice(0, 60)}…"`);
      }
    }
  }

  if (!parsed.finish.title) errors.push('Finish: missing title');
  if (!parsed.finish.body) errors.push('Finish: missing body');
  else if (wordCount(parsed.finish.body) > 80) {
    errors.push(`Finish: body has ${wordCount(parsed.finish.body)} words (max 80)`);
  }
  if (parsed.finish.nextPlanId !== 'christmas12') {
    errors.push(`Finish: Next must be christmas12, got "${parsed.finish.nextPlanId}"`);
  }

  return errors;
}

function toJson(parsed) {
  const days = {};
  for (const [num, d] of Object.entries(parsed.days)) {
    days[num] = {
      storyId: d.storyId,
      intro: d.intro,
      keyVerses: d.keyVerses,
      questions: d.questions,
      closing: d.closing,
      antiphon: d.antiphon,
      response: d.response,
    };
  }
  return {
    [PLAN_ID]: {
      version: 1,
      days,
      finish: parsed.finish,
    },
  };
}

function main() {
  const cmd = process.argv[2] || 'check';
  const md = fs.readFileSync(CONTENT, 'utf8');
  const bible = JSON.parse(fs.readFileSync(BIBLE, 'utf8'));
  const mappings = JSON.parse(fs.readFileSync(MAPPINGS, 'utf8'));
  const storyOrder = mappings[PLAN_ID].segments
    .map((s) => s.segmentId)
    .filter((id) => id.startsWith('S'));

  const parsed = parseContent(md);
  const errors = check(parsed, bible, storyOrder);
  if (errors.length) {
    console.error(`companion ${cmd}: ${errors.length} error(s)`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  if (cmd === 'check') {
    console.log(`OK — 26 days, finish, antiphons and NLT quotes check out.`);
    return;
  }
  if (cmd === 'build') {
    const json = toJson(parsed);
    fs.writeFileSync(OUT, `${JSON.stringify(json, null, 2)}\n`);
    console.log(`Wrote ${path.relative(ROOT, OUT)}`);
    return;
  }
  console.error(`Unknown command: ${cmd} (use check|build)`);
  process.exit(1);
}

main();
