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

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');
fs.mkdirSync(dist, { recursive: true });

const extra = `
.facts{ display:flex; gap:6mm; margin-top:6mm; }
.facts div{ display:flex; flex-direction:column; }
.facts b{ font-size:19pt; font-weight:800; letter-spacing:-.02em; line-height:1; }
.facts span{ margin-top:1.4mm; font-size:6.4pt; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); max-width:22mm; }
.lede b{ color:var(--body); }
.sample{ margin-top:3mm; }
.sample .turn.has-tail{ margin-top:2.6mm; }
.sample .para{ font-size:9.4pt; line-height:1.42; }
.sample .bubble{ padding:2.6mm 3.6mm 2.8mm; }
.sample .turn{ margin-bottom:1.6mm; }
.sample .turn.has-tail{ margin-top:2mm; }
.small-note{ margin-top:auto; padding-top:3mm; font-size:8.2pt; line-height:1.45; color:var(--muted); }
.steps.tight li{ margin-bottom:3.6mm; font-size:9.4pt; }
.qrs.big{ justify-content:center; gap:14mm; margin-top:2mm; }
.qrs.big .qr svg{ width:28mm; height:28mm; }
.uses{ margin-top:6mm; display:flex; flex-direction:column; gap:3.2mm; }
.use{ border-left:1.2mm solid var(--body); padding:1mm 0 1mm 4mm; }
.use:nth-child(1){ border-color:var(--ink-black-bar); } .use:nth-child(2){ border-color:var(--ink-red-bar); }
.use:nth-child(3){ border-color:var(--ink-green-bar); } .use:nth-child(4){ border-color:var(--ink-blue-bar); }
.use-t{ font-size:11pt; font-weight:800; }
.use-b{ font-size:9.3pt; line-height:1.48; color:#4B555C; margin-top:1mm; }
.notice{ margin-top:auto; border:.4mm dashed #B9C1C5; border-radius:3mm; padding:4mm 4.6mm; }
.notice p{ margin:2mm 0 0; font-size:9pt; line-height:1.5; color:#3E474D; }
h2.page-title.small{ font-size:18pt; }
.tr-row{ display:flex; align-items:center; gap:2.2mm; padding:.62mm 0; border-bottom:.3mm solid var(--rule); font-size:7.8pt; }
.tr-day{ width:4.5mm; text-align:right; font-weight:800; }
.tr-date{ width:15mm; color:var(--muted); font-weight:600; white-space:nowrap; flex:none; }
.tr-title{ flex:1; font-weight:600; color:var(--body); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tr-ref{ color:var(--muted); white-space:nowrap; }
.ct-week{ margin:2.6mm 0 .2mm; }
.ct-box.big{ display:inline-block; width:4.4mm; height:4.4mm; margin-right:2.4mm; vertical-align:2mm; border-color:var(--wk); }
.cp-day .day-title.cp{ font-size:19pt; margin-top:3.4mm; }
.cp-day .day-note{ margin-top:3.6mm; font-size:8.8pt; padding:2.6mm 3.6mm; }
.cp-day .kv{ margin-top:4mm; }
.cp-day .kv .para{ font-size:10.4pt; }
.cp-parts{ margin-top:3.6mm; }
.cp-talk{ margin-top:4mm; padding-top:3mm; }
.cp-talk .tq{ font-size:9.4pt; margin-bottom:2mm; }
.cp-ant{ margin-top:3mm; padding:3.2mm 4mm; }
.cp-ant p{ font-size:9.4pt; line-height:1.42; margin-top:1.4mm; }
.cp-notes{ flex:1 1 auto; min-height:0; overflow:hidden; margin-top:0; position:relative;
  background:repeating-linear-gradient(to bottom, transparent 0, transparent 7.6mm, #DCE3DD 7.6mm, #DCE3DD 7.95mm); }
.cp-notes span{ position:absolute; top:1.6mm; left:0; font-size:6.6pt; font-weight:800; letter-spacing:.22em; text-transform:uppercase; color:#B0B8BC; background:#fff; padding-right:2mm; }
.back .qrs.back-qrs{ margin-top:7mm; gap:8mm; }
.back .qrs > div{ color:rgba(242,234,224,.75); }
.qr.light{ background:#fff; padding:1.6mm; border-radius:1.6mm; }
.qr.light svg{ width:20mm; height:20mm; }
`;

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
