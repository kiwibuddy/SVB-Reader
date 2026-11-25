// Advent 2026 promo for Anglican parishes: an A4 sheet, cover on the front,
// the plan and how a parish can use it on the back.
//   node Marketing/print/advent-anglican/build.mjs
// Writes advent-anglican.pdf (2 pages) and PNG previews of each side.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { DAYS, WEEKS, esc } from '../../../print/advent-book/content.mjs';
import { DEFS, candleRow, sky, star } from '../../../print/advent-book/art.mjs';
import { fontFaces } from '../../../print/advent-book/build.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const qr = (f) => fs.readFileSync(path.join(root, 'Marketing/print', f), 'utf8');

const W = 210;
const H = 297;

function coverArt() {
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" aria-hidden="true">
    ${DEFS}
    <defs>
      <linearGradient id="season" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0%" stop-color="#1E1638"/>
        <stop offset="34%" stop-color="#2E3B78"/>
        <stop offset="62%" stop-color="#4E3C86"/>
        <stop offset="84%" stop-color="#7A3F86"/>
        <stop offset="100%" stop-color="#A2486F"/>
      </linearGradient>
      <radialGradient id="dawn" cx="50%" cy="92%" r="60%">
        <stop offset="0%" stop-color="#F7C35F" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="#F7C35F" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#season)"/>
    <rect width="${W}" height="${H}" fill="url(#dawn)"/>
    ${sky(W, 200, { seed: 41, count: 300, top: 0, bottom: 200, avoid: [[16, 74, 178, 96]] })}
    ${star(160, 40, 18)}
    ${candleRow(105, 250, 1.5, 4, { label: false })}
  </svg>`;
}

const cover = `
<section class="sheet cover">
  <div class="art">${coverArt()}</div>
  <div class="cover-top">SourceView Together <span>·</span> Advent 2026</div>
  <div class="bubble-title">
    <div class="kick">A reading plan for the parish</div>
    <h1>From promise<br>to manger</h1>
    <p>26 Bible stories to read aloud together, one a day from Advent Sunday to Christmas Eve, in the free SourceView Together app.</p>
  </div>
  <div class="chips">
    ${WEEKS.map((w) => {
      const d = DAYS.find((x) => x.week.key === w.key);
      return `<div class="chip" style="background:${w.color}"><b>${w.name}</b><span>from ${d.date.short.replace(/^\w+ /, '')}</span></div>`;
    }).join('')}
  </div>
</section>`;

function planTable() {
  return WEEKS.map((w) => `
    <div class="wk-head" style="background:${w.color}">Week ${w.n} · ${w.name}</div>
    ${DAYS.filter((d) => d.week.key === w.key).map((d) => `
      <div class="row${d.date.long.startsWith('Sunday') ? ' sun' : ''}">
        <span class="dt">${d.date.short}</span>
        <span class="ttl">${esc(d.title)}${d.antiphon ? ` <em>· ${esc(d.antiphon[0])}</em>` : ''}</span>
        <span class="rf">${esc(d.shortRef)}</span>
      </div>`).join('')}`).join('');
}

const back = `
<section class="sheet back">
  <div class="cols">
    <div class="left">
      <div class="eyebrow">For parishes · Advent 2026</div>
      <h2>Read Advent<br>together, out loud.</h2>
      <p class="lede">The Advent Journey is a daily Bible reading plan in the free SourceView Together app: one complete story a day from Advent Sunday, 29 November, to Christmas Eve. It follows God’s promise from Genesis, through Abraham, Ruth, David and the prophets, to the manger.</p>

      <h3>Shaped by the Church’s year</h3>
      <ul>
        <li><b>Advent Sunday</b> begins with Christ’s coming in glory (Revelation 21–22), in the spirit of the Collect: “that we may cast away the works of darkness, and put upon us the armour of light”.</li>
        <li><b>Advent 2, 3 and 4:</b> the day’s story holds the Old Testament reading set in the Revised Common Lectionary, Year B: Isaiah 40, Isaiah 61 and 2 Samuel 7. Check against your own lectionary.</li>
        <li><b>17–23 December:</b> each day’s story sits behind one of the O Antiphons, traditionally sung with the Magnificat at Evening Prayer, with the prayer printed in the companion booklet.</li>
        <li><b>Christmas Eve:</b> Luke 1–2, with the Magnificat and the birth of Jesus.</li>
      </ul>

      <h3>Four voices</h3>
      <p class="small">Every word is coloured by the voice that speaks it, so four people can share a story aloud.</p>
      <div class="keys">
        <span class="k k-black">Narration</span><span class="k k-red">God speaking</span><span class="k k-green">Main characters</span><span class="k k-blue">Everyone else</span>
      </div>

      <h3>In the parish</h3>
      <ul class="tight">
        <li><b>Home groups</b> read the week’s Sunday story in fours, with small group questions in the app.</li>
        <li><b>Households</b> read after supper, lighting the week’s candles.</li>
        <li><b>Schools and youth</b> use the school questions, written for mixed beliefs.</li>
        <li><b>Sunday worship:</b> read the Old Testament lesson with four voices.</li>
      </ul>

      <div class="join">
        <div class="qr">${qr('qr-app-store.svg')}<span>App Store</span></div>
        <div class="qr">${qr('qr-google-play.svg')}<span>Google Play</span></div>
        <p><b>Join in three taps.</b> Download SourceView Together, open the Plan tab, tap <b>Join Advent</b>. Free, with no account or sign-in. A printable companion booklet is available for each household.</p>
      </div>
    </div>
    <div class="right">
      <div class="eyebrow">The 26 stories</div>
      ${planTable()}
      <p class="foot-note">Sundays in bold. Scripture quotations from the Holy Bible, New Living Translation, © 1996, 2004, 2007 by Tyndale House Foundation. Used by permission. The Collect is from the Book of Common Prayer.</p>
    </div>
  </div>
</section>`;

const css = `
@page{ size:${W}mm ${H}mm; margin:0; }
*{ box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
html,body{ margin:0; padding:0; background:#fff; font-family:'Manrope',sans-serif; color:#101619; }
.sheet{ position:relative; width:${W}mm; height:${H}mm; overflow:hidden; page-break-after:always; }
.sheet:last-child{ page-break-after:auto; }
.cover .art{ position:absolute; inset:0; }
.cover .art svg{ display:block; }
.cover-top{ position:absolute; top:16mm; left:18mm; font-size:8.6pt; font-weight:700; letter-spacing:.26em; text-transform:uppercase; color:rgba(255,248,236,.86); }
.cover-top span{ opacity:.6; padding:0 .4em; }
.bubble-title{ position:absolute; left:18mm; right:18mm; top:74mm; background:#FBF6EC; border-radius:10mm; border-top-left-radius:3mm; padding:11mm 11mm 10mm; }
.bubble-title .kick{ font-size:8pt; font-weight:800; letter-spacing:.22em; text-transform:uppercase; color:#8E3FA0; }
.bubble-title h1{ margin:3mm 0 0; padding-bottom:2.4mm; font-size:46pt; line-height:1; letter-spacing:-.035em; font-weight:800;
  background:linear-gradient(90deg,#6A4C93 0%,#3F6FB5 40%,#C2507A 75%,#8E3FA0 100%); -webkit-background-clip:text; background-clip:text; color:transparent; }
.bubble-title p{ margin:5mm 0 0; font-size:12pt; line-height:1.42; font-weight:600; color:#3E3350; max-width:150mm; }
.chips{ position:absolute; left:18mm; right:18mm; bottom:14mm; display:flex; gap:3mm; }
.chip{ flex:1; border-radius:3mm; padding:3mm 3.4mm; color:#fff; display:flex; flex-direction:column; gap:.6mm; box-shadow:0 0 0 .4mm rgba(255,255,255,.35) inset; }
.chip b{ font-size:11pt; font-weight:800; }
.chip span{ font-size:7.6pt; font-weight:700; letter-spacing:.12em; text-transform:uppercase; opacity:.9; }

.back{ padding:13mm 13mm 11mm; }
.cols{ display:flex; gap:8mm; height:100%; }
.left{ width:86mm; flex:none; display:flex; flex-direction:column; }
.right{ flex:1; display:flex; flex-direction:column; }
.eyebrow{ font-size:7pt; font-weight:800; letter-spacing:.24em; text-transform:uppercase; color:#8E3FA0; }
h2{ margin:2mm 0 0; font-size:22pt; line-height:1.04; letter-spacing:-.025em; font-weight:800; }
h3{ margin:5mm 0 1.6mm; font-size:10pt; font-weight:800; color:#3F6FB5; }
.lede{ margin:3mm 0 0; font-size:9pt; line-height:1.5; color:#3E474D; }
ul{ margin:0; padding-left:4mm; }
li{ font-size:8.2pt; line-height:1.45; color:#3E474D; margin-bottom:1.6mm; }
li b{ color:#101619; }
ul.tight li{ margin-bottom:1mm; }
.small{ margin:0 0 2mm; font-size:8.2pt; line-height:1.45; color:#3E474D; }
.keys{ display:flex; gap:1.4mm; }
.k{ flex:1; text-align:center; font-size:6.8pt; font-weight:700; padding:1.8mm 0; border-radius:1.6mm; }
.k-black{ background:#fff; color:#3A4550; box-shadow:inset 0 0 0 .3mm #DFE5E0; } .k-red{ background:#FBEDEB; color:#C0261A; }
.k-green{ background:#E9F4EF; color:#0E6B4C; } .k-blue{ background:#EBEFFA; color:#1D46A8; }
.join{ margin-top:auto; display:flex; gap:3mm; align-items:center; background:#F3F0F7; border-radius:3mm; padding:3.4mm; }
.join .qr{ display:flex; flex-direction:column; align-items:center; gap:1mm; font-size:5.8pt; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#5E6B70; }
.join .qr svg{ width:17mm; height:17mm; display:block; }
.join p{ margin:0; font-size:7.6pt; line-height:1.42; color:#3E474D; }
.join p b{ color:#101619; }
.right .eyebrow{ margin-bottom:2mm; }
.wk-head{ color:#fff; font-size:7.6pt; font-weight:800; letter-spacing:.14em; text-transform:uppercase; padding:1.3mm 2.4mm; border-radius:1.4mm; margin-top:1.8mm; }
.row{ display:flex; gap:2mm; align-items:baseline; padding:1.05mm 1mm; border-bottom:.25mm solid #E4E8E5; font-size:7.8pt; }
.row .dt{ width:17mm; flex:none; white-space:nowrap; color:#5E6B70; font-weight:600; }
.row .ttl{ flex:1; color:#101619; font-weight:600; }
.row .ttl em{ font-style:normal; color:#9A6B12; font-weight:700; }
.row .rf{ color:#5E6B70; white-space:nowrap; }
.row.sun .dt, .row.sun .ttl{ font-weight:800; }
.foot-note{ margin-top:auto; padding-top:2mm; font-size:6.4pt; line-height:1.4; color:#8A9296; }
`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Advent 2026 for parishes</title>
<style>${fontFaces}</style><style>${css}</style></head><body>${cover}${back}</body></html>`;

const file = path.join(here, 'advent-anglican.html');
fs.writeFileSync(file, html);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1300 } });
await page.goto('file://' + file);
await page.evaluate(() => document.fonts.ready);
const over = await page.evaluate(() => {
  const out = [];
  for (const col of document.querySelectorAll('.left, .right')) {
    const kids = [...col.children];
    const last = kids[kids.length - 1];
    if (col.scrollHeight > col.clientHeight + 1) out.push(col.className);
    void last;
  }
  return out;
});
console.log('overflow:', over);
await page.pdf({ path: path.join(here, 'advent-anglican.pdf'), width: `${W}mm`, height: `${H}mm`, printBackground: true, preferCSSPageSize: true });
const sheets = await page.$$('.sheet');
await sheets[0].screenshot({ path: path.join(here, 'advent-anglican-front.png') });
await sheets[1].screenshot({ path: path.join(here, 'advent-anglican-back.png') });
await browser.close();
if (over.length) process.exit(1);
