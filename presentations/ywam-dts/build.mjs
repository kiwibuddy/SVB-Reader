import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slides } from './slides.mjs';
import { css } from './styles.mjs';
import { js } from './runtime.mjs';
import { INK } from './data.mjs';
import { STATS, REACH, TRANSLATION } from './stats.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'dist');
fs.mkdirSync(out, { recursive: true });

// Manrope is embedded rather than fetched, so the deck runs with no network.
const fontFaces = [
  ['Manrope-Regular.ttf', 400],
  ['Manrope-Medium.ttf', 500],
  ['Manrope-SemiBold.ttf', 600],
  ['Manrope-Bold.ttf', 700],
  ['Manrope-ExtraBold.ttf', 800],
].map(([file, weight]) => {
  const b64 = fs.readFileSync(path.resolve(here, '../../assets/fonts', file)).toString('base64');
  return `@font-face{font-family:'Manrope';font-style:normal;font-weight:${weight};font-display:block;` +
    `src:url(data:font/ttf;base64,${b64}) format('truetype');}`;
}).join('\n');

const PHASES = ['Open','Open','Research','Research','Research','Research','Research','Research','Research',
  'The habit','The habit','The habit','The habit','The habit','The habit',
  'The tool','The tool','The tool','The tool','Plans','Plans','Group reading','Group reading',
  'Breakout','Breakout','Feedback','Download','Questions'];

const list = slides();
const body = list.map((s, i) => `
<section class="slide ${s.cls}" data-phase="${PHASES[i] || ''}" data-note="${(s.note||'').replace(/"/g,'&quot;')}">
${s.html}
</section>`).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>The Bible is coming back · YWAM Kona DTS staff training</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${fontFaces}
${css}
#notes{position:fixed;left:0;right:0;bottom:0;background:#101619;color:#E9EDF2;padding:14px 26px;
  font-size:15px;line-height:1.5;display:none;z-index:40;font-family:var(--sans);}
body.dark-chrome #chrome{color:rgba(242,234,224,.5);}
</style>
</head>
<body>
<div id="stage"><div id="board">
  <div id="bar"></div>
  ${body}
  <div id="chrome">
    <span class="dots">${['black','red','green','blue'].map((c)=>`<i style="background:${INK[c].bar}"></i>`).join('')}</span>
    <span id="phase"></span>
    <span id="num"></span>
    <span id="clock">15:00</span>
  </div>
</div></div>
<div id="notes"></div>
<script>${js}</script>
</body>
</html>`;

const file = path.join(out, 'ywam-kona-dts.html');
fs.writeFileSync(file, html);
console.log('wrote', path.relative(path.resolve(here,'../..'), file), (fs.statSync(file).size/1024).toFixed(0)+'KB');
console.log('slides:', list.length);

const gaps = [];
const walk = (o, p) => {
  if (!o || typeof o !== 'object') return;
  if (o.confirm) gaps.push(`${p}: ${o.confirm}`);
  for (const [k, v] of Object.entries(o)) if (typeof v === 'object') walk(v, p ? `${p}.${k}` : k);
};
walk(STATS, ''); walk({ reach: REACH, translation: TRANSLATION }, '');
if (gaps.length) {
  console.log('\nSTATS STILL TO CONFIRM BEFORE PRESENTING:');
  gaps.forEach((g) => console.log('  -', g));
}
