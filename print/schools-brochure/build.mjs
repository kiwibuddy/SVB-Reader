// Builds the four-page A4 schools brochure.
//   node print/schools-brochure/build.mjs
// Output: print/schools-brochure/dist/sourceview-together-schools.html
//
// Self-contained: Manrope, every style, the QR and any screenshots are embedded,
// so the file can be emailed to a print shop on its own.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { css } from './styles.mjs';
import { coverPage, readingPage, classroomPage, runningPage } from './pages.mjs';
import { stats, plans } from './content.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const dist = path.join(here, 'dist');
fs.mkdirSync(dist, { recursive: true });

// --- fonts ---------------------------------------------------------------
const FACES = [
  ['Manrope-Regular.ttf', 400],
  ['Manrope-Medium.ttf', 500],
  ['Manrope-SemiBold.ttf', 600],
  ['Manrope-Bold.ttf', 700],
  ['Manrope-ExtraBold.ttf', 800],
];
const fontFaces = FACES.map(([file, weight]) => {
  const b64 = fs.readFileSync(path.join(root, 'assets/fonts', file)).toString('base64');
  return `@font-face{font-family:'Manrope';font-style:normal;font-weight:${weight};font-display:block;` +
    `src:url(data:font/ttf;base64,${b64}) format('truetype');}`;
}).join('\n');

// --- screenshots ---------------------------------------------------------
// Drop App Store screenshots into ./screenshots using these names. Anything
// missing renders as a labelled slot at the exact final size, so the layout is
// finished either way.
const SHOTS = {
  thread: 'read',
  reader: 'reader',
  plan: 'plan',
  questions: 'talk-about-it',
};
const EXT = ['.png', '.PNG', '.jpg', '.jpeg', '.JPG'];
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

function loadShots() {
  const dir = path.join(here, 'screenshots');
  const out = {};
  const found = [];
  for (const [key, base] of Object.entries(SHOTS)) {
    for (const ext of EXT) {
      const file = path.join(dir, base + ext);
      if (!fs.existsSync(file)) continue;
      const mime = MIME[ext.toLowerCase()] || 'image/png';
      out[key] = `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
      found.push(base + ext);
      break;
    }
  }
  return { out, found };
}

const { out: shots, found } = loadShots();
const qrSvg = fs.readFileSync(path.join(here, 'qr-appstore.svg'), 'utf8');

// --- assemble ------------------------------------------------------------
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SourceView Together — for schools</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${fontFaces}</style>
<style>${css}</style>
</head>
<body>
<main id="doc">
${coverPage()}
${readingPage(shots)}
${classroomPage(shots)}
${runningPage(qrSvg)}
</main>
</body>
</html>`;

const file = path.join(dist, 'sourceview-together-schools.html');
fs.writeFileSync(file, html);

const missing = Object.keys(SHOTS).filter((k) => !shots[k]);
console.log('wrote', path.relative(root, file), (fs.statSync(file).size / 1024).toFixed(0) + 'KB');
console.log(`data: ${stats.stories} stories · ${stats.voices} voices · ${plans.total} plans`);
console.log('screenshots found:', found.length ? found.join(', ') : 'none');
if (missing.length) console.log('screenshot slots still empty:', missing.join(', '));
