// Renders the Advent book to PDF with Playwright's Chromium.
//   node print/advent-book/render.mjs [--spine-per-page 0.05] [--preview] [--shots 1,5,9]
// Writes dist/advent-book-interior.pdf and dist/advent-book-cover-<colour>.pdf
// (back + spine + front, 3 mm bleed), and PNG previews of each cover.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { COVERS } from './content.mjs';
import { css } from './styles.mjs';
import { fontFaces, interiorHtml, coverPreviewHtml } from './build.mjs';
import { spineWidth, wrapHtml, BLEED } from './cover.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');
fs.mkdirSync(dist, { recursive: true });
const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > -1 ? process.argv[i + 1] : d;
};
const perPage = Number(arg('--spine-per-page', 0.05));
const previewOnly = process.argv.includes('--preview');

const browser = await chromium.launch();
const page = await browser.newPage();

// Interior: lay it out, count the pages, print.
const interiorFile = path.join(dist, 'advent-book-interior.html');
fs.writeFileSync(interiorFile, interiorHtml());
await page.goto('file://' + interiorFile);
await page.waitForFunction(() => document.documentElement.getAttribute('data-pages'), null, { timeout: 600000 });
await page.evaluate(() => document.fonts.ready);
const pages = Number(await page.evaluate(() => document.documentElement.getAttribute('data-pages')));
console.log('interior pages:', pages);

if (arg('--shots')) {
  await page.setViewportSize({ width: 1200, height: 900 });
  const all = await page.$$('#doc > section');
  for (const n of arg('--shots').split(',').map(Number)) {
    await all[n - 1].screenshot({ path: path.join(dist, `shot-p${n}.png`) });
  }
}

if (!previewOnly) {
  await page.pdf({
    path: path.join(dist, 'advent-book-interior.pdf'),
    width: '148mm', height: '210mm', printBackground: true, preferCSSPageSize: true,
  });
}

const spine = spineWidth(pages, perPage);
for (const key of ['black', 'red', 'green', 'blue']) {
  const cover = COVERS[key];
  const front = path.join(dist, `advent-book-front-${key}.html`);
  fs.writeFileSync(front, coverPreviewHtml(cover));
  await page.goto('file://' + front);
  await page.evaluate(() => document.fonts.ready);
  await page.setViewportSize({ width: 700, height: 950 });
  await (await page.$('section.page')).screenshot({ path: path.join(dist, `advent-book-front-${key}.png`) });

  const wrapFile = path.join(dist, `advent-book-cover-${key}.html`);
  fs.writeFileSync(wrapFile, wrapHtml(cover, { pages, spine, fontFaces, css: css(cover) }));
  await page.goto('file://' + wrapFile);
  await page.evaluate(() => document.fonts.ready);
  await page.setViewportSize({ width: 1600, height: 900 });
  await (await page.$('.wrap')).screenshot({ path: path.join(dist, `advent-book-cover-${key}.png`) });
  if (previewOnly) continue;
  const W = BLEED * 2 + 148 * 2 + spine;
  const H = BLEED * 2 + 210;
  await page.pdf({
    path: path.join(dist, `advent-book-cover-${key}.pdf`),
    width: `${W}mm`, height: `${H}mm`, printBackground: true, preferCSSPageSize: true,
  });
}
console.log(`spine ${spine} mm at ${perPage} mm a page`);
await browser.close();
