// The cover: front, spine and back, drawn as one wrap for a perfect-bound book.
// Four versions, one per reading colour, like the Jonah booklet; the interior
// is the same in all four.

import { COVERS, DAYS, TOTALS } from './content.mjs';
import { DEFS, candleRow, sky, star } from './art.mjs';

const ORDER = ['black', 'red', 'green', 'blue'];
export const BLEED = 3; // mm

// The front artwork in a 148 x 210 frame. `pad` extends the drawing into the
// bleed on the outer edges.
function frontArt(pad = 0) {
  const W = 148;
  const H = 210;
  return `<svg viewBox="${-0} ${-pad} ${W + pad} ${H + pad * 2}" width="${W + pad}mm" height="${H + pad * 2}mm" preserveAspectRatio="xMinYMid slice" aria-hidden="true">
    ${DEFS}
    <rect x="-10" y="-10" width="${W + 20}" height="${H + 20}" fill="url(#warm)"/>
    ${sky(W + pad, 150, { seed: 11, count: 190, top: -pad, bottom: 150, avoid: [[11, 52, 126, 78]] })}
    ${star(112, 30, 13)}
    <g transform="translate(0 0)">${candleRow(74, 172, 1.05, 4, { labelColor: 'rgba(242,234,224,0.86)' })}</g>
  </svg>`;
}

export function frontCoverInner(cover) {
  return `
  <div class="cover-inner advent-cover">
    <div class="cover-kicker">SourceView Together</div>
    <div class="title-bubble advent-title">
      <div class="story-no">An Advent journey · 2026</div>
      <h1>From promise<br>to manger</h1>
      <div class="ref">26 Bible stories to read aloud together, one a day from 29 November to Christmas Eve</div>
    </div>
    <div class="cover-swatches">${swatchRow(cover.key)}</div>
  </div>`;
}

function swatchRow(active) {
  return `<div class="swatches">
    ${ORDER.map((c) => `<span class="sw${c === active ? ' on' : ''}"></span>`).join('')}
    <span class="sw-label">${COVERS[active].name} copy</span>
  </div>`;
}

export function frontCoverPage(cover) {
  return `
<section class="page cover advent-front">
  <div class="art">${frontArt(0)}</div>
  ${frontCoverInner(cover)}
</section>`;
}

function backInner(cover) {
  const parts = TOTALS.speakers;
  return `
  <div class="back-inner">
    <h2>Twenty-six stories.<br>Four voices.<br>Read Advent together.</h2>
    <div class="rulez"></div>
    <p>
      From the first promise in Genesis to the night in Bethlehem, this book walks
      through Advent one complete Bible story at a time. Each week lights another
      candle: Hope, Peace, Joy and Love.
    </p>
    <p>
      Every word is coloured by the voice that speaks it, so four people can share
      the reading: the narration, God, the main characters, and everyone else. A
      family at the table, a small group or a class each takes a colour and reads
      it out loud.
    </p>
    <div class="back-facts">
      <div><b>26</b><span>complete stories</span></div>
      <div><b>4</b><span>weeks of Advent</span></div>
      <div><b>${parts}</b><span>speaking parts</span></div>
      <div><b>${Math.round(TOTALS.words / 1000)}k</b><span>words of Scripture</span></div>
    </div>
    <div class="back-colophon">
      <div class="back-dots">
        ${ORDER.map((c) => `<i style="background:${c === cover.key ? COVERS[c].tint : 'transparent'}"></i>`).join('')}
      </div>
      This is the <b>${COVERS[cover.key].name}</b> copy. Three others are out there,
      with exactly these stories inside. Free in the app: <b>SourceView Together</b>,
      on the App Store and Google Play.
    </div>
    <div class="back-mark">SourceView Together</div>
  </div>`;
}

// Spine width for the printer. Uncoated 80 gsm text paper is about 0.1 mm a
// leaf (0.05 mm a page). Ask the printer for their figure and pass it in.
export function spineWidth(pages, mmPerPage = 0.05) {
  return Math.round(pages * mmPerPage * 10) / 10;
}

export function wrapHtml(cover, { pages, spine, fontFaces, css }) {
  const W = BLEED * 2 + 148 * 2 + spine;
  const H = BLEED * 2 + 210;
  const frontX = BLEED + 148 + spine;
  const spineText = spine >= 6
    ? `<div class="spine-text" style="width:210mm;left:${BLEED + 148 + spine / 2}mm;top:${BLEED + 105}mm;">
         <span class="sp-title">From promise to manger</span>
         <span class="sp-sub">An Advent journey in 26 stories</span>
         <span class="sp-mark">SourceView Together</span>
       </div>`
    : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Advent book cover — ${cover.name} — ${pages} pages, ${spine} mm spine</title>
<style>${fontFaces}</style>
<style>${css}
@page{ size:${W}mm ${H}mm; margin:0; }
html,body{background:#fff;}
@media screen{ body{padding:0;} }
.wrap{position:relative; width:${W}mm; height:${H}mm; background:var(--cover-deep); overflow:hidden; color:var(--cream);}
.wrap .panel{position:absolute; top:${BLEED}mm; width:148mm; height:210mm;}
.wrap .front-art{position:absolute; top:0; left:${frontX}mm; width:${148 + BLEED}mm; height:${H}mm;}
.wrap .front-art svg{width:100%; height:100%; display:block;}
.wrap .back-art{position:absolute; top:0; left:0; width:${BLEED + 148 + spine}mm; height:${H}mm;}
.wrap .back-art svg{width:100%; height:100%; display:block;}
.spine-text{position:absolute; height:${Math.max(spine - 1.5, 4)}mm; transform:translate(-50%,-50%) rotate(90deg);
  display:flex; align-items:center; justify-content:space-between; padding:0 16mm; box-sizing:border-box; white-space:nowrap;}
.sp-title{font-weight:800; font-size:${Math.min(12, spine * 0.48).toFixed(1)}pt; letter-spacing:-.01em;}
.sp-sub{font-weight:600; font-size:${Math.min(7.5, spine * 0.32).toFixed(1)}pt; opacity:.8; margin-left:5mm; margin-right:auto;}
.sp-mark{font-weight:700; font-size:${Math.min(6.6, spine * 0.28).toFixed(1)}pt; letter-spacing:.22em; text-transform:uppercase; opacity:.75;}
.guides{display:none;}
</style></head>
<body>
<div class="wrap">
  <div class="back-art"><svg viewBox="0 0 ${BLEED + 148 + spine} ${H}" preserveAspectRatio="none" aria-hidden="true">
    ${DEFS}${sky(BLEED + 148 + spine, H * 0.55, { seed: 23, count: 120 })}
  </svg></div>
  <div class="front-art">${frontArt(BLEED)}</div>
  <div class="panel back" style="left:${BLEED}mm;background:transparent;">${backInner(cover)}</div>
  ${spineText}
  <div class="panel cover" style="left:${frontX}mm;background:transparent;">${frontCoverInner(cover)}</div>
</div>
</body></html>`;
}

export { DAYS };
