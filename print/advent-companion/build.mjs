// Builds and renders the Advent companion booklet, 40 A5 pages, stapled.
//   node print/advent-companion/build.mjs
// Writes dist/advent-companion-<colour>.pdf (pages 2–39 are identical in all
// four) and a PNG of each front cover. Fails if any page's content overflows.
// For A4 home printing, impose with print/impose-a5-booklet.py (see README).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { COVERS, DAYS, WEEKS } from '../advent-book/content.mjs';
import { css as bookCss } from '../advent-book/styles.mjs';
import { fontFaces } from '../advent-book/build.mjs';
import * as P from './pages.mjs';
import { companionCss } from './styles.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');
fs.mkdirSync(dist, { recursive: true });

const extra = companionCss;

function html(cover) {
  const pages = [
    P.cover(cover), P.welcomePage(), P.voicesPage(), P.appPage(), P.weeksPage(), P.usesPage(),
    P.leadersPage(), P.trackerPage(),
  ];
  for (const w of WEEKS) {
    pages.push(P.weekPage(w));
    for (const d of DAYS.filter((x) => x.week.key === w.key)) pages.push(P.dayPage(d));
  }
  pages.push(P.christmasPage(), P.backPage(cover));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Advent companion — ${cover.name}</title>
<style>${fontFaces}</style><style>${bookCss(cover)}${extra}</style></head>
<body><main id="doc">${pages.join('\n')}</main>
<script>
  var secs = document.querySelectorAll('#doc > section');
  secs.forEach(function (s, i) {
    if ((i + 1) % 2 === 0) s.classList.add('verso');
    var n = s.querySelector('.folio .num'); if (n) n.textContent = i + 1;
  });
  document.documentElement.setAttribute('data-pages', secs.length);
</script></body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 950 } });
let failed = false;
for (const key of ['black', 'red', 'green', 'blue']) {
  const file = path.join(dist, `advent-companion-${key}.html`);
  fs.writeFileSync(file, html(COVERS[key]));
  await page.goto('file://' + file);
  await page.evaluate(() => document.fonts.ready);
  const report = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('#doc > section').forEach((s, i) => {
      const stack = s.querySelector('.stack');
      const body = s.querySelector('.page-body');
      if (!stack || !body) return;
      const limit = body.getBoundingClientRect().bottom - parseFloat(getComputedStyle(body).paddingBottom);
      const last = [...stack.children].filter((c) => !c.classList.contains('cp-notes')).pop();
      if (last && last.getBoundingClientRect().bottom > limit + 0.5) out.push(i + 1);
    });
    return { pages: document.querySelectorAll('#doc > section').length, overflow: out };
  });
  console.log(key, report);
  if (report.overflow.length || report.pages % 4) failed = true;
  await page.pdf({ path: path.join(dist, `advent-companion-${key}.pdf`), width: '148mm', height: '210mm', printBackground: true, preferCSSPageSize: true });
  await (await page.$('#doc > section')).screenshot({ path: path.join(dist, `advent-companion-front-${key}.png`) });
  if (process.argv.includes('--shots') && key === 'black') {
    const secs = await page.$$('#doc > section');
    for (const n of process.argv[process.argv.indexOf('--shots') + 1].split(',').map(Number)) {
      await secs[n - 1].screenshot({ path: path.join(dist, `shot-${n}.png`) });
    }
  }
}
await browser.close();
if (failed) { console.error('Layout problem: see overflow pages above'); process.exit(1); }
