// The Jonah booklet's stylesheet, plus the pages only the Advent book has.
import { css as jonahCss } from '../jonah-booklet/styles.mjs';

export const css = (cover) => jonahCss(cover) + `
:root{ --gold:#D9A441;
  --book:"Charis SIL",Charter,"Iowan Old Style",Georgia,serif; }

/* ---------- cover ---------- */
.advent-front, .wrap{ --cover-tint:${cover.tint}; }
.advent-cover{ padding:15mm 12mm 12mm; }
.advent-title{ margin-top:38mm; padding:7mm 7.5mm 7.5mm; }
.advent-title h1{ font-size:33pt; line-height:.98; margin-top:2.5mm; }
.advent-title .ref{ font-size:9.6pt; line-height:1.38; font-weight:600; margin-top:4mm; }
.advent-title .story-no{ margin-top:0; }
.cover-swatches{ margin-top:auto; }
.cover-swatches .swatches{ margin-top:0; justify-content:flex-start; }
.cover-swatches .sw{ width:5mm; height:5mm; }

/* ---------- title + copyright ---------- */
.title-stack{ justify-content:center; text-align:center; align-items:center; }
.book-title{ margin:5mm 0 0; font-size:34pt; font-weight:800; letter-spacing:-.035em; line-height:.98; }
.book-sub{ margin:5mm auto 0; max-width:92mm; font-size:11pt; line-height:1.45; color:#4B555C; font-weight:500; }
.title-candles{ margin:12mm 0 6mm; }
.book-dates{ font-size:7.4pt; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }
.colophon{ margin-top:auto; font-size:7.8pt; line-height:1.5; color:#5E6B70; }
.colophon p{ margin:0 0 3mm; }
.colophon b{ color:var(--body); }

/* ---------- shape + contents ---------- */
.weeks-list{ margin-top:7mm; display:flex; flex-direction:column; gap:3.4mm; }
.wk{ background:var(--wk-tint); border-left:1.6mm solid var(--wk); border-radius:1.2mm 3mm 3mm 1.2mm; padding:3.4mm 4.4mm; }
.wk-name{ font-size:10.4pt; font-weight:800; color:var(--wk); }
.wk-line{ font-size:9pt; line-height:1.42; color:#4B555C; margin-top:1mm; }
.wk-days{ font-size:6.8pt; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); margin-top:1.6mm; }

.ct-week{ font-size:7pt; font-weight:800; letter-spacing:.22em; text-transform:uppercase; margin:4.6mm 0 .6mm; }
.ct-row{ display:flex; align-items:center; gap:2.6mm; padding:1.15mm 0; border-bottom:.3mm solid var(--rule); }
.ct-box{ width:3.6mm; height:3.6mm; border:.35mm solid #9AA3A8; border-radius:.8mm; flex:none; }
.ct-day{ width:5.5mm; font-size:10pt; font-weight:800; text-align:right; flex:none; }
.ct-main{ flex:1; display:flex; flex-direction:column; min-width:0; }
.ct-title{ font-size:8.8pt; font-weight:700; color:var(--body); line-height:1.25; }
.ct-ref{ font-size:7pt; color:var(--muted); margin-top:.4mm; }
.ct-page{ font-size:8.6pt; font-weight:700; color:var(--muted); flex:none; }

/* ---------- week divider ---------- */
.wk-big{ margin:2mm 0 0; font-size:64pt; line-height:.95; font-weight:800; letter-spacing:-.045em; color:var(--wk); }
.wk-lede{ margin:4mm 0 0; font-size:12pt; line-height:1.4; font-weight:600; color:#3E474D; max-width:105mm; }
.wk-candles{ margin:10mm 0 8mm; display:flex; justify-content:center; }
.wk-table{ margin-top:auto; border-top:.35mm solid var(--rule); }
.wk-row{ display:flex; gap:3mm; align-items:baseline; padding:2.2mm 0; border-bottom:.3mm solid var(--rule); font-size:8.6pt; }
.wk-row b{ width:12mm; color:var(--wk); font-weight:800; flex:none; }
.wk-row span{ width:20mm; color:var(--muted); flex:none; font-weight:600; }
.wk-row em{ font-style:normal; color:var(--body); font-weight:600; }

/* ---------- day opener ---------- */
.day-top{ display:flex; justify-content:space-between; align-items:baseline; }
.day-no{ font-size:20pt; font-weight:800; letter-spacing:-.03em; color:var(--wk); }
.day-no small{ font-size:9pt; font-weight:700; letter-spacing:0; color:var(--muted); }
.day-date{ font-size:7.4pt; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); }
.wk-chip{ align-self:flex-start; margin-top:2.6mm; background:var(--wk); color:#fff; border-radius:10mm;
  padding:1.3mm 3.4mm; font-size:6.8pt; font-weight:800; letter-spacing:.16em; text-transform:uppercase; }
.day-title{ margin:4.5mm 0 0; font-size:23pt; font-weight:800; letter-spacing:-.03em; line-height:1.04; color:var(--body); }
.day-ref{ margin-top:2.2mm; font-size:9pt; font-weight:600; color:var(--muted); }
.day-note{ margin-top:5mm; background:var(--wk-tint); border-left:1.4mm solid var(--wk); border-radius:1mm 2.6mm 2.6mm 1mm;
  padding:3.2mm 4mm; font-size:9.4pt; line-height:1.45; font-weight:600; color:#3E474D; }
.kv{ margin-top:6mm; }
.kv .bubble{ max-width:100%; }
.kv .para{ font-size:11.6pt; line-height:1.45; }
.kv-ref{ margin-top:1.8mm; font-size:6.8pt; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); }
.kv.turn--right .kv-ref{ text-align:right; }
.day-foot{ margin-top:auto; padding-top:5mm; }
.parts{ display:flex; gap:1.8mm; }
.part{ flex:1; border-radius:2mm; padding:2.2mm 2mm; text-align:center; }
.part .who{ font-size:6pt; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }
.part .what{ font-size:7pt; font-weight:600; margin-top:.6mm; line-height:1.25; }
.part .what i{ display:block; font-style:normal; opacity:.7; font-size:6.2pt; }
.day-foot .voicebar{ margin:3.6mm 0 2.6mm; }
.cast-grid{ display:grid; grid-template-columns:1fr 1fr; gap:1.1mm 4mm; }
.cast-grid.many{ grid-template-columns:1fr 1fr 1fr; }
.cg{ display:flex; align-items:center; gap:1.6mm; font-size:7.2pt; font-weight:600; color:#4B555C; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cast-grid.many .cg{ font-size:6.6pt; }
.cg i{ width:2.4mm; height:2.4mm; border-radius:50%; flex:none; }

/* ---------- end of each story ---------- */
.talk{ margin-top:7mm; border-top:.5mm solid var(--body); padding-top:3.6mm; }
.talk .eyebrow{ margin-bottom:2.6mm; color:var(--body); }
.tq{ display:flex; gap:2.6mm; align-items:flex-start; margin-bottom:2.6mm; font-size:10pt; font-weight:600; line-height:1.38; color:var(--body); }
.tq .qnum{ width:6mm; height:6mm; font-size:7.4pt; margin-top:0; }
.antiphon{ margin-top:4mm; background:#F7F1E3; border-radius:3.4mm; padding:4.4mm 5mm; border:.3mm solid #EADFC5; }
.antiphon .eyebrow{ color:#9A6B12; }
.antiphon p{ margin:2.2mm 0 0; font-family:var(--book); font-size:11pt; line-height:1.5; font-style:italic; color:#3E3424; }
.ant-note{ margin-top:2.4mm; font-size:7pt; color:#8A7A5C; }
.flow-item.textnotes{ margin-top:6mm; }

/* ---------- back matter ---------- */
.qrs{ display:flex; gap:8mm; margin-top:4mm; }
.qrs > div{ display:flex; flex-direction:column; align-items:center; gap:1.4mm; font-size:6.6pt; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
.qr svg{ width:22mm; height:22mm; display:block; }
`;
