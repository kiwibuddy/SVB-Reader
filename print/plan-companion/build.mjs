// Builds companion booklets for the seasonal plans after Advent.
//   node print/plan-companion/build.mjs christmas12 christmas7 [--shots 1,2,9]
// Writes dist/<plan>-companion-<colour>.pdf, the A4 print versions and cover PNGs.
// Fails if any page's content overflows or the page count is not a multiple of 4.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { COVERS, planDays } from '../advent-book/content.mjs';
import { css as bookCss } from '../advent-book/styles.mjs';
import { fontFaces } from '../advent-book/build.mjs';
import { companionCss } from '../advent-companion/styles.mjs';
import * as P from './pages.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');
fs.mkdirSync(dist, { recursive: true });

const extra = `
.wk-big.long{ font-size:40pt; line-height:1; }
.feasts{ margin-top:6mm; }
.feast{ display:flex; gap:4mm; padding:2.6mm 0; border-bottom:.3mm solid var(--rule); }
.f-date{ width:15mm; flex:none; font-size:8.6pt; font-weight:800; color:var(--muted); padding-top:.3mm; }
.f-name{ font-size:10pt; font-weight:800; color:var(--body); }
.f-body{ font-size:8.8pt; line-height:1.45; color:#4B555C; margin-top:.6mm; }
.tr-row.roomy{ padding:2mm 0; font-size:8.6pt; }
`;

function html(plan, cfg, cover) {
  const pages = [P.cover(cover, cfg), P.welcomePage(plan, cfg), P.voicesPage(cfg), P.appPage(cfg), P.shapePage(plan, cfg)];
  if (cfg.table) pages.push(P.tablePage(cfg.table));
  pages.push(P.usesPage(cfg), P.leadersPage(cfg), P.trackerPage(plan));
  for (const w of plan.phases) {
    pages.push(P.phasePage(w, plan, cfg));
    for (const d of plan.days.filter((x) => x.week.key === w.key)) pages.push(P.dayPage(d, plan, cfg));
  }
  pages.push(P.closingPage(cfg));
  while ((pages.length + 1) % 4) pages.push(P.notesPage());
  pages.push(P.backPage(cover, cfg));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${cfg.planName} companion — ${cover.name}</title>
<style>${fontFaces}</style><style>${bookCss(cover)}${companionCss}${extra}</style></head>
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

const names = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && all[i - 1] !== '--shots');
const shotsArg = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 950 } });
let failed = false;
for (const name of names) {
  const cfg = (await import(`./configs/${name}.mjs`)).default;
  const plan = planDays(cfg.mapping, cfg);
  for (const key of ['black', 'red', 'green', 'blue']) {
    const base = `${cfg.file}-${key}`;
    const file = path.join(dist, `${base}.html`);
    fs.writeFileSync(file, html(plan, cfg, COVERS[key]));
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
    console.log(name, key, JSON.stringify(report));
    if (report.overflow.length || report.pages % 4) failed = true;
    const pdf = path.join(dist, `${base}.pdf`);
    await page.pdf({ path: pdf, width: '148mm', height: '210mm', printBackground: true, preferCSSPageSize: true });
    await (await page.$('#doc > section')).screenshot({ path: path.join(dist, `${cfg.file}-front-${key}.png`) });
    if (shotsArg && key === 'black') {
      const secs = await page.$$('#doc > section');
      for (const n of shotsArg.split(',').map(Number)) {
        if (secs[n - 1]) await secs[n - 1].screenshot({ path: path.join(dist, `shot-${name}-${n}.png`) });
      }
    }
    execFileSync('python3', [path.join(here, '../impose-a5-booklet.py'), pdf], { stdio: 'ignore' });
  }
}
await browser.close();
if (failed) {
  console.error('Layout problem: see overflow pages above');
  process.exit(1);
}
