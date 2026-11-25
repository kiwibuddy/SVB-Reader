// Advent 2026 for Anglican parishes: a two-sided A4 sheet in a restrained
// editorial style. White paper, Cormorant Garamond headings with Manrope,
// one motif (a stained-glass star in the four week colours).
//   node Marketing/print/advent-anglican/build.mjs
// Writes advent-anglican.pdf and PNG previews of each side. Fails on overflow.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { DAYS, WEEKS, esc } from '../../../print/advent-book/content.mjs';
import { fontFaces } from '../../../print/advent-book/build.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const qr = (f) => fs.readFileSync(path.join(root, 'Marketing/print', f), 'utf8');

const serifFaces = fs.readFileSync(path.join(here, 'fonts/cormorant.css'), 'utf8').replace(
  /url\(https:\/\/fonts\.gstatic\.com\/[^)]*\/([^/)]+\.woff2)\)/g,
  (_, f) => `url(data:font/woff2;base64,${fs.readFileSync(path.join(here, 'fonts', f)).toString('base64')})`
);

const PLUM = '#463449';
const GOLD = '#B69A62';
const W = 210;
const H = 297;

// Liturgical names for the Sundays, for the schedule.
const SUNDAYS = { 1: 'Advent Sunday', 8: 'Advent 2', 15: 'Advent 3', 22: 'Advent 4' };

// One motif: an eight-pointed star in leaded-glass facets. The four long rays
// carry the week colours (Hope at the top, then clockwise); the short rays are
// antique gold. Fine engraved rays sit behind it.
function star(r = 50) {
  const c = r + 20;
  const pt = (a, d) => [c + Math.sin(a) * d, c - Math.cos(a) * d];
  const f = (p) => p.map((v) => v.toFixed(2)).join(' ');
  const rays = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const long = i % 2 === 0;
    const len = long ? r : r * 0.6;
    const half = long ? 0.2 : 0.26;
    const base = long ? r * 0.2 : r * 0.17;
    const color = long ? WEEKS[i / 2].color : GOLD;
    const tip = pt(a, len);
    const left = pt(a - half, base);
    const right = pt(a + half, base);
    const mid = [c, c];
    rays.push(`
      <path d="M ${f(mid)} L ${f(left)} L ${f(tip)} Z" fill="${color}" opacity="${long ? 0.62 : 0.5}"/>
      <path d="M ${f(mid)} L ${f(right)} L ${f(tip)} Z" fill="${color}"/>
      <path d="M ${f(mid)} L ${f(left)} L ${f(tip)} L ${f(right)} Z M ${f(mid)} L ${f(tip)}" fill="none" stroke="${PLUM}" stroke-width="0.55" stroke-linejoin="round"/>`);
  }
  let hair = '';
  for (let i = 0; i < 120; i++) {
    const a = (i * Math.PI) / 60;
    const [x1, y1] = pt(a, r * 0.32);
    const [x2, y2] = pt(a, r + 16 + (i % 3) * 3);
    hair += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`;
  }
  return `<svg viewBox="0 0 ${c * 2} ${c * 2}" width="${c * 2}mm" height="${c * 2}mm" aria-hidden="true">
    <g stroke="${GOLD}" stroke-width="0.18" opacity="0.55">${hair}</g>
    <circle cx="${c}" cy="${c}" r="${r + 9}" fill="none" stroke="${GOLD}" stroke-width="0.3" opacity="0.7"/>
    <circle cx="${c}" cy="${c}" r="${r + 10.6}" fill="none" stroke="${GOLD}" stroke-width="0.15" opacity="0.7"/>
    ${rays.join('')}
    <circle cx="${c}" cy="${c}" r="${r * 0.11}" fill="#FBF6EC" stroke="${PLUM}" stroke-width="0.55"/>
  </svg>`;
}

const weekRange = (w) => {
  const days = DAYS.filter((d) => d.week.key === w.key);
  const a = days[0].date.short.split(' ');
  const b = days[days.length - 1].date.short.split(' ');
  return a[2] === b[2] ? `${a[1]} – ${b[1]} ${b[2]}` : `${a[1]} ${a[2]} – ${b[1]} ${b[2]}`;
};

const head = (right) => `<div class="runhead"><span>SourceView Together</span><span>${right}</span></div>`;

const cover = `
<section class="sheet cover">
  ${head('Advent 2026')}
  <div class="motif">${star(40)}</div>
  <div class="title-block">
    <div class="kicker">A parish reading journey</div>
    <h1>From promise<br>to manger</h1>
    <p class="sub">26 Bible stories. One unfolding story. A journey towards Christmas.</p>
    <p class="intro">Read aloud together, one story a day from Advent Sunday to Christmas Eve, in the free SourceView Together app.</p>
  </div>
  <div class="weeks">
    ${WEEKS.map((w) => `
      <div class="wk" style="--c:${w.color}">
        <div class="wk-no">0${w.n}</div>
        <div class="wk-name">${w.name}</div>
        <div class="wk-dates">${weekRange(w)}</div>
      </div>`).join('')}
  </div>
  <div class="foot"><span>29 November – 24 December 2026</span><span>Free on the App Store and Google Play</span></div>
</section>`;

function schedule() {
  return WEEKS.map((w) => `
    <div class="s-week" style="--c:${w.color}">
      <div class="s-head"><span class="s-no">0${w.n}</span><span class="s-name">${w.name}</span><span class="s-dates">${weekRange(w)}</span></div>
      ${DAYS.filter((d) => d.week.key === w.key).map((d) => `
        <div class="s-row${SUNDAYS[d.n] ? ' sun' : ''}">
          <span class="s-day">${d.n}</span>
          <span class="s-date">${d.date.short.replace(/^(\w+) /, '$1 ')}</span>
          <span class="s-title">${esc(d.title)}${SUNDAYS[d.n] ? `<span class="tag sun-tag">${SUNDAYS[d.n]}</span>` : ''}${d.antiphon ? `<span class="tag ant-tag">${esc(d.antiphon[0])}</span>` : ''}</span>
          <span class="s-ref">${esc(d.ref.replace(/(\d+):\d+–(\d+):\d+$/, '$1–$2').replace(/(\d+):\d+–\d+$/, '$1'))}</span>
        </div>`).join('')}
    </div>`).join('');
}

const back = `
<section class="sheet back">
  ${head('Advent 2026 · For parishes')}
  <h2>A parish journey through Scripture, prayer and the story of Christ’s coming.</h2>
  <div class="cols">
    <div class="left">
      <div class="block">
        <div class="b-no">01</div><h3>The journey</h3>
        <p>One complete Bible story a day, from Advent Sunday to Christmas Eve. Readers follow God’s promise from Genesis, through Abraham, Ruth, David and the prophets, to the birth of Jesus in Bethlehem.</p>
      </div>
      <div class="block">
        <div class="b-no">02</div><h3>Shaped by the Church’s year</h3>
        <p><b>Advent Sunday</b> looks to Christ’s coming in glory (Revelation 21–22), in the spirit of the Collect:</p>
        <p class="collect">“Almighty God, give us grace that we may cast away the works of darkness, and put upon us the armour of light.”<span>Book of Common Prayer</span></p>
        <p><b>Advent 2, 3 and 4:</b> the day’s story holds the Old Testament reading set in the Revised Common Lectionary, Year B: Isaiah 40, Isaiah 61 and 2 Samuel 7.</p>
        <p><b>17–23 December:</b> each story sits behind one of the O Antiphons, the Church’s historic Advent prayers, traditionally sung with the Magnificat at Evening Prayer.</p>
        <p><b>Christmas Eve:</b> Luke 1–2, with the Magnificat.</p>
      </div>
      <div class="block">
        <div class="b-no">03</div><h3>Four voices</h3>
        <p>Every word is coloured by the voice that speaks it, so four people can share a story aloud.</p>
        <div class="voices">
          <span><i style="background:#3A4550"></i>Narration</span><span><i style="background:#C0261A"></i>God speaking</span>
          <span><i style="background:#0E6B4C"></i>Main characters</span><span><i style="background:#1D46A8"></i>Everyone else</span>
        </div>
      </div>
      <div class="block">
        <div class="b-no">04</div><h3>Part of parish life</h3>
        <p><b>Households</b> read after supper and light the week’s candle. <b>Home groups</b> read the Sunday story in four voices. <b>Sunday worship</b> shares the Old Testament reading in four voices. <span class="muted">Schools and youth groups have questions written for mixed beliefs.</span></p>
      </div>
      <div class="join">
        <div class="qr">${qr('qr-app-store.svg')}<span>App Store</span></div>
        <div class="qr">${qr('qr-google-play.svg')}<span>Google Play</span></div>
        <p><b>To join:</b> download SourceView Together, open the Plan tab and tap Join Advent. Free, no account needed.</p>
      </div>
    </div>
    <div class="right">
      <div class="s-top"><span>The 26 stories</span></div>
      ${schedule()}
    </div>
  </div>
  <div class="foot small">Scripture quotations from the Holy Bible, New Living Translation, © 1996, 2004, 2007 by Tyndale House Foundation. Used by permission. Collect from the Book of Common Prayer.</div>
</section>`;

const css = `
@page{ size:${W}mm ${H}mm; margin:0; }
*{ box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
html,body{ margin:0; padding:0; background:#fff; }
body{ font-family:'Manrope',sans-serif; color:#2B2530; font-variant-numeric:lining-nums; }
.sheet{ position:relative; width:${W}mm; height:${H}mm; overflow:hidden; background:#fff; padding:15mm 18mm 12mm; display:flex; flex-direction:column; page-break-after:always; }
.sheet:last-child{ page-break-after:auto; }
.serif, h1, h2, h3, .sub, .wk-name, .s-name, .s-top, .collect, .s-ref{ font-family:'Cormorant Garamond', Georgia, serif; }
.runhead{ display:flex; justify-content:space-between; padding-bottom:2.6mm; border-bottom:.35mm solid ${PLUM}; font-size:7.6pt; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:${PLUM}; }

/* cover */
.motif{ position:absolute; right:14mm; top:24mm; }
.title-block{ margin-top:auto; max-width:150mm; }
.kicker{ font-size:9pt; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#765676; }
h1{ margin:3mm 0 0; font-weight:600; font-size:62pt; line-height:.9; letter-spacing:-.01em; color:${PLUM}; }
.sub{ margin:5mm 0 0; font-style:italic; font-weight:500; font-size:17pt; line-height:1.2; color:#765676; }
.intro{ margin:5mm 0 0; font-size:10pt; line-height:1.55; color:#4A4250; max-width:120mm; }
.weeks{ margin-top:13mm; display:grid; grid-template-columns:repeat(4,1fr); gap:5mm; }
.wk{ border-top:1.2mm solid var(--c); padding-top:3mm; }
.wk-no{ font-size:7.6pt; font-weight:700; color:#8A8290; }
.wk-name{ font-size:22pt; font-weight:600; line-height:1; margin-top:1mm; color:var(--c); }
.wk-dates{ font-size:8pt; color:#6B6370; margin-top:1.6mm; }
.foot{ margin-top:9mm; padding-top:2.6mm; border-top:.25mm solid #CFC7D3; display:flex; justify-content:space-between; font-size:8pt; color:#6B6370; }
.foot.small{ margin-top:auto; font-size:6.6pt; display:block; }

/* back */
h2{ margin:5mm 0 0; font-weight:600; font-size:21pt; line-height:1.08; color:${PLUM}; max-width:160mm; }
.cols{ margin-top:5mm; display:flex; gap:7mm; flex:1; min-height:0; }
.left{ width:64mm; flex:none; display:flex; flex-direction:column; }
.right{ flex:1; min-width:0; }
.block{ margin-bottom:3.4mm; }
.b-no{ font-size:7.6pt; font-weight:800; color:${GOLD}; }
h3{ margin:.2mm 0 1.2mm; font-size:13pt; font-weight:600; color:${PLUM}; line-height:1.1; }
.block p{ margin:0 0 1.3mm; font-size:7.7pt; line-height:1.45; color:#4A4250; }
.block p b{ color:#2B2530; font-weight:700; }
.collect{ font-style:italic; font-size:10pt !important; line-height:1.32 !important; color:${PLUM} !important; border-left:.6mm solid ${GOLD}; padding-left:3mm; }
.collect span{ display:block; font-family:'Manrope',sans-serif; font-style:normal; font-size:6.8pt; color:#8A8290; margin-top:1mm; }
.voices{ display:grid; grid-template-columns:1fr 1fr; gap:1.4mm 3mm; margin-top:1mm; }
.voices span{ display:flex; align-items:center; gap:1.8mm; font-size:8pt; color:#2B2530; font-weight:600; }
.voices i{ width:5mm; height:2.2mm; border-radius:.6mm; display:block; }
.muted{ color:#8A8290; }
.join{ margin-top:auto; border:.3mm solid #CFC7D3; padding:3mm; display:flex; gap:2.6mm; align-items:center; }
.join .qr{ display:flex; flex-direction:column; align-items:center; gap:.8mm; font-size:5.6pt; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#8A8290; }
.join .qr svg{ width:15mm; height:15mm; display:block; }
.join p{ margin:0; font-size:7.4pt; line-height:1.45; color:#4A4250; }
.s-top{ font-size:14pt; font-weight:600; color:${PLUM}; padding-bottom:1.6mm; }
.s-week{ margin-top:2.2mm; }
.s-head{ display:flex; align-items:baseline; gap:2mm; border-bottom:.5mm solid var(--c); padding-bottom:1mm; }
.s-no{ font-size:7pt; font-weight:800; color:#8A8290; }
.s-name{ font-size:15pt; font-weight:600; color:var(--c); line-height:1; }
.s-dates{ margin-left:auto; font-size:7.2pt; color:#6B6370; }
.s-row{ display:flex; align-items:baseline; gap:2mm; padding:.8mm 0; border-bottom:.2mm solid #ECE7EE; }
.s-day{ width:4.5mm; flex:none; text-align:right; font-size:7.4pt; font-weight:700; color:#8A8290; }
.s-date{ width:13.5mm; flex:none; font-size:7.4pt; color:#6B6370; white-space:nowrap; }
.s-title{ flex:1; min-width:0; font-size:7.6pt; line-height:1.3; color:#2B2530; }
.s-ref{ flex:none; font-style:italic; font-size:9pt; color:#6B6370; white-space:nowrap; }
.sun .s-title, .sun .s-date, .sun .s-day{ font-weight:800; color:#2B2530; }
.tag{ display:inline-block; margin-left:1.6mm; font-size:6.2pt; font-weight:700; padding:.2mm 1.2mm; border-radius:.6mm; vertical-align:.25mm; }
.sun-tag{ color:${PLUM}; background:#EFE9F1; }
.ant-tag{ color:#7A6232; background:#F3ECDD; }
`;

// The photograph version: a real candlelit Advent wreath (CC0, Wikimedia
// Commons, see photo/SOURCE.md) bleeding off the top of the cover.
const photo = fs.readFileSync(path.join(here, 'photo/advent-wreath-2600.jpg')).toString('base64');
const photoCover = `
<section class="sheet cover photo-cover">
  <div class="photo" style="background-image:url(data:image/jpeg;base64,${photo})"></div>
  <div class="runhead light"><span>SourceView Together</span><span>Advent 2026</span></div>
  <div class="photo-title">
    <div class="kicker">A parish reading journey</div>
    <h1>From promise<br>to manger</h1>
    <p class="sub">26 Bible stories. One unfolding story. A journey towards Christmas.</p>
  </div>
  <div class="weeks">
    ${WEEKS.map((w) => `
      <div class="wk" style="--c:${w.color}">
        <div class="wk-no">0${w.n}</div>
        <div class="wk-name">${w.name}</div>
        <div class="wk-dates">${weekRange(w)}</div>
      </div>`).join('')}
  </div>
  <div class="foot"><span>Read aloud together, one story a day, in the free SourceView Together app</span><span>29 Nov – 24 Dec 2026</span></div>
</section>`;
const photoCss = `
.photo-cover{ padding-top:0; }
.photo-cover .photo{ position:absolute; left:0; right:0; top:0; height:168mm; background-size:cover; background-position:50% 62%; }
.photo-cover .photo::after{ content:''; position:absolute; inset:0; background:linear-gradient(to bottom, rgba(0,0,0,.35), rgba(0,0,0,0) 30%); }
.runhead.light{ position:relative; z-index:1; margin-top:15mm; color:rgba(255,255,255,.9); border-bottom-color:rgba(255,255,255,.55); }
.photo-title{ margin-top:auto; }
.photo-title h1{ font-size:54pt; line-height:.95; margin-top:2.6mm; }
.photo-title .sub{ font-size:15.5pt; margin-top:3.6mm; }
.photo-cover .weeks{ margin-top:10mm; }
.photo-cover .foot{ margin-top:7mm; }
`;
const photoCredit = 'Cover photograph: Advent wreath, Wikimedia Commons, CC0. ';

const versions = [
  { name: 'advent-anglican', cover, back, extraCss: '' },
  { name: 'advent-anglican-photo', cover: photoCover, back: back.replace('<div class="foot small">', `<div class="foot small">${photoCredit}`), extraCss: photoCss },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1300 } });
let failed = false;
for (const v of versions) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Advent 2026 for parishes</title>
<style>${fontFaces}${serifFaces}</style><style>${css}${v.extraCss}</style></head><body>${v.cover}${v.back}</body></html>`;
  const file = path.join(here, `${v.name}.html`);
  fs.writeFileSync(file, html);
  await page.goto('file://' + file);
  await page.evaluate(() => document.fonts.ready);
  const over = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.sheet').forEach((s, i) => {
      if (s.scrollHeight > s.clientHeight + 1) out.push(`sheet ${i + 1}`);
      s.querySelectorAll('.left, .right').forEach((c) => {
        if (c.scrollHeight > c.clientHeight + 1) out.push(`sheet ${i + 1} ${c.className}`);
      });
    });
    return out;
  });
  console.log(v.name, 'overflow:', over);
  if (over.length) failed = true;
  await page.pdf({ path: path.join(here, `${v.name}.pdf`), width: `${W}mm`, height: `${H}mm`, printBackground: true, preferCSSPageSize: true });
  const sheets = await page.$$('.sheet');
  await sheets[0].screenshot({ path: path.join(here, `${v.name}-front.png`) });
  await sheets[1].screenshot({ path: path.join(here, `${v.name}-back.png`) });
}
await browser.close();
if (failed) process.exit(1);
