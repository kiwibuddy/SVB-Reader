// Builds the YWAM Kona DTS deck as one self-contained HTML file.
//   node presentations/ywam-dts/build.mjs
//
// Engine and theme per the nb-presentation skill in sphere-worldview-corpus:
// keyed slide deck, NB house style, everything inlined except the webfonts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slides } from './slides.mjs';
import { css } from './styles.mjs';
import { js } from './runtime.mjs';
import { STATS, sourceMap } from './stats.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'dist');
fs.mkdirSync(out, { recursive: true });

// The app icon, downscaled from the 1024px original because it never renders
// larger, carried once as a token so the blob is not repeated per use.
const icon = fs.readFileSync(path.join(here, 'icon-420.png')).toString('base64');
const iconVar = `:root{--appicon:url(data:image/png;base64,${icon})}`;

const list = slides();
const body = list.map((s) => `
<section class="slide" data-note="${(s.note || '').replace(/"/g, '&quot;')}">
${s.html}
</section>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reading Scripture Together · YWAM Kona DTS staff training</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz@0,6..72,300;0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=Instrument+Serif:ital@1&family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${iconVar}
${css}</style>
</head>
<body>

<div id="entry">
  <div class="entry-inner">
    <div class="entry-label">YWAM Kona &nbsp;·&nbsp; DTS staff training</div>
    <div class="entry-duration"><span class="dot"></span>60 minutes &nbsp;·&nbsp; one breakout</div>
    <h1 class="entry-title">Reading <em>Scripture</em> together.</h1>
    <p class="entry-sub">How reading Scripture together can become part of forming students who know God, live His Word and make Him known.</p>
    <div class="entry-cta">Click or press space to begin</div>
  </div>
  <div class="entry-author">Nathaniel Baldock &nbsp;·&nbsp; Tauranga, New Zealand</div>
</div>

<main id="deck">
${body}
</main>

<div class="progress"><span id="prog"></span></div>
<div class="nav"><button id="prev" aria-label="Previous">&uarr;</button><button id="next" aria-label="Next">&darr;</button></div>
<div id="clock">15:00</div>
<div id="notes"></div>

<div class="overlay-modal" id="modal">
  <div class="modal">
    <button class="m-close" id="m-close" aria-label="Close">&times;</button>
    <div class="m-stat" id="m-stat"></div>
    <div class="m-title" id="m-title"></div>
    <div class="m-body" id="m-body"></div>
    <div class="m-src" id="m-src"></div>
  </div>
</div>

<script>
const SOURCES = ${JSON.stringify(sourceMap(), null, 2)};
${js}
</script>
</body>
</html>`;

const file = path.join(out, 'ywam-kona-dts.html');
fs.writeFileSync(file, html);
console.log('wrote', path.relative(path.resolve(here, '../..'), file),
  Math.round(html.length / 1024) + 'KB');
console.log('slides:', list.length);

// Every clickable stat card must open a source with a real link, since this
// deck gets sent to people who read the cards on their own. The build fails
// loudly if any live figure is missing its source or link.
const cards = Object.entries(sourceMap());
const unsourced = cards.filter(([, d]) => !d.source || !/^https?:\/\//.test(d.link || ''));
console.log('\nSOURCES  ' + cards.length + ' stat cards, each with a link:');
cards.forEach(([id, d]) => console.log('  ' + id + '  ' + d.stat + '  ' + d.source));
if (unsourced.length) {
  console.log('\n  MISSING a source or link: ' + unsourced.map(([id]) => id).join(', ') +
    '  <-- fix before sending');
}

// brand-strategy/voice-rules.md is binding on anything in Nathaniel's voice, so
// the pre-send checklist runs on every build rather than from memory. Scripture,
// story titles and the question sets come from the app and keep their own
// punctuation, so only this deck's own copy is judged.
const prose = html.replace(/<style>[\s\S]*?<\/style>/g, '')
                  .replace(/<script>[\s\S]*?<\/script>/g, '')
                  .replace(/<[^>]+>/g, ' ');
const CHECKS = [
  ['em dashes', /—/g],
  ['mojibake', /â€/g],
  ['signposting', /\b(here is why|here is the vision|let me be clear|the real question is)\b/gi],
  ['AI vocabulary', /\b(delve|robust|landscape|navigate|crucial|vital|blueprint|unlock|holistic|seamless|empower|leverage|utilis|cutting-edge|game-chang)\b/gi],
  ['stacked antithesis', /\bnot [a-z ,']{2,40} but\b/gi],
];
const hits = CHECKS.map(([name, re]) => [name, (prose.match(re) || []).length]);
const openers = (prose.match(/(^|[.!?]\s+)(And|So|But)\s/g) || []).length;
console.log('\nVOICE CHECK');
hits.forEach(([name, k]) => console.log('  ' + (k ? 'FIX  ' : 'ok   ') + name + ': ' + k));
console.log('  ' + (openers >= 3 ? 'ok   ' : 'thin ') + 'sentences opening And/So/But: ' + openers);
if (hits.some(([, k]) => k)) console.log('\n  ^ voice-rules.md violations. Fix before presenting.');
