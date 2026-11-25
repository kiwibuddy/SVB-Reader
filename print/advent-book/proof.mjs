// Proof sheets: screenshots of chosen pages, laid side by side, for checking
// the layout without opening the 468-page PDF.
//   node print/advent-book/proof.mjs day-19:0,1,-1 day-17:1 copyright 1,2
// "day-N:k" is the k-th page from that day's opener (-1 = the page before the
// next day's opener, i.e. the last page of the story). A bare number is a page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { interiorHtml } from './build.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');
const out = process.env.PROOF_OUT || path.join(dist, 'proof.png');

const file = path.join(dist, 'advent-book-interior.html');
fs.writeFileSync(file, interiorHtml());
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.goto('file://' + file);
await page.waitForFunction(() => document.documentElement.getAttribute('data-pages'), null, { timeout: 600000 });
await page.evaluate(() => document.fonts.ready);
const total = await page.evaluate(() => document.querySelectorAll('#doc > section').length);

const wanted = [];
for (const a of process.argv.slice(2)) {
  if (/^\d+$/.test(a)) { wanted.push(Number(a) - 1); continue; }
  const [anchor, offs] = a.split(':');
  const idx = await page.evaluate((an) => {
    const secs = [...document.querySelectorAll('#doc > section')];
    const i = secs.findIndex((s) => s.getAttribute('data-anchor') === an || s.getAttribute('data-fixed') === an);
    const next = secs.findIndex((s, j) => j > i && (s.getAttribute('data-anchor') || s.getAttribute('data-fixed') === 'week' || s.getAttribute('data-fixed') === 'christmas'));
    return [i, next];
  }, anchor);
  for (const o of (offs || '0').split(',').map(Number)) wanted.push(o < 0 ? idx[1] + o : idx[0] + o);
}
const secs = await page.$$('#doc > section');
const shots = [];
for (const i of wanted) {
  const f = path.join(dist, `proof-${i + 1}.png`);
  await secs[i].screenshot({ path: f });
  shots.push(f);
}
await browser.close();
console.log('pages', total, 'shot', wanted.map((i) => i + 1).join(','));
fs.writeFileSync(path.join(dist, 'proof-list.txt'), shots.join('\n'));
