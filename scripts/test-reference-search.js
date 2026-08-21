#!/usr/bin/env node
/**
 * Acceptance tests for verse reference *resolution*.
 *
 *   node scripts/test-reference-search.js
 *
 * Runs the list from MVP2/14-SHIP-PLAN.md §2 against utils/reference.ts, plus a
 * coverage check that every one of the 66 books is reachable by name.
 *
 * Where a result *lands* once resolved is a separate concern — see
 * scripts/test-verse-landing.js.
 *
 * Requires node 22+.
 */

const path = require('path');
const { runTsHarness, ROOT } = require('./lib/run-ts-harness');

const DATA = path.join(ROOT, 'assets', 'data');

const harness = `
import { lookupReference } from './reference.ts';
import { createRequire } from 'node:module';

const req = createRequire(import.meta.url);
const bcl = req('${DATA}/BookChapterList.json');
const titles = req('${DATA}/SegmentTitles.json');

// 'exact:Book Ch:Vs' | 'multi:N' | 'notFound'
const cases = [
  ['gen 4:3',     'exact:Genesis 4:3'],
  ['Genesis 4:3', 'exact:Genesis 4:3'],
  ['gn 4.3',      'exact:Genesis 4:3'],
  ['GEN 4 3',     'exact:Genesis 4:3'],
  ['1 co 13',     'exact:1 Corinthians 13:1'],
  ['1co13',       'exact:1 Corinthians 13:1'],
  ['rev 22',      'exact:Revelation 22:1'],
  ['psalm 23',    'exact:Psalms 23:1'],
  ['Jean 3:16',   'exact:John 3:16'],
  ['Gen\\u00e8se 1',   'exact:Genesis 1:1'],
  ['phil 1:1',    'multi:2'],
  ['jud 1',       'multi:2'],
  ['jo 3',        'multi:5'],
  ['zzz',         'notFound'],
  ['',            'notFound'],
];

let pass = 0;
const failures = [];

console.log('\\nAcceptance list — MVP2/14-SHIP-PLAN.md §2\\n');
for (const [input, want] of cases) {
  let got = 'ERROR', detail = '';
  try {
    const r = lookupReference(input);
    if (r.kind === 'exact') {
      got = \`exact:\${r.result.book} \${r.result.chapter}:\${r.result.verse}\`;
      const t = titles[r.result.segmentId];
      detail = \`\${r.result.segmentId} \${t ? '"' + t.title + '"' : '(no title)'}\`;
    } else if (r.kind === 'disambiguate') {
      got = \`multi:\${r.options.length}\`;
      detail = r.options.map((o) => o.book).join(' · ');
    } else {
      got = 'notFound';
    }
  } catch (e) { detail = e.message; }

  const ok = got === want;
  ok ? pass++ : failures.push([input, want, got]);
  console.log(
    \`  \${ok ? 'PASS' : 'FAIL'}  \${JSON.stringify(input).padEnd(13)}\` +
    \`want \${want.padEnd(25)} got \${got.padEnd(25)} \${detail}\`
  );
}
console.log(\`\\n  \${pass}/\${cases.length} passed\\n\`);

// ---- Coverage: is every book reachable, under its real name? ----
console.log('Book coverage — all 66 books by canonical name\\n');
const unreachable = [];
const wrongName = [];
for (const info of Object.values(bcl)) {
  const name = info.bookName;
  const r = lookupReference(name + ' 1:1');
  if (r.kind !== 'exact') { unreachable.push(name); continue; }
  if (r.result.book !== name) wrongName.push([name, r.result.book]);
}

if (unreachable.length) {
  console.log(\`  UNREACHABLE (\${unreachable.length}):\`);
  for (const b of unreachable) console.log('    ' + b);
} else {
  console.log('  All 66 books reachable.');
}
if (wrongName.length) {
  console.log(\`\\n  WRONG DISPLAY NAME (\${wrongName.length}):\`);
  for (const [want, got] of wrongName) console.log(\`    \${want} displays as "\${got}"\`);
}

const bad = failures.length + unreachable.length + wrongName.length;
console.log(bad === 0 ? '\\nAll green.\\n' : \`\\n\${bad} problem(s). See docs/store/PRE-SUBMISSION-FIXES.md H1.\\n\`);
process.exit(bad === 0 ? 0 : 1);
`;

process.exit(runTsHarness({ modules: ['utils/reference.ts'], harness }));
