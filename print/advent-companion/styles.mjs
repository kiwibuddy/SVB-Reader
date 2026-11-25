// Styles shared by every companion booklet (Advent, Christmas, Lent).
export const companionCss = `
.facts{ display:flex; gap:6mm; margin-top:6mm; }
.facts div{ display:flex; flex-direction:column; }
.facts b{ font-size:19pt; font-weight:800; letter-spacing:-.02em; line-height:1; }
.facts span{ margin-top:1.4mm; font-size:6.4pt; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); max-width:22mm; }
.lede b{ color:var(--body); }
.sample{ margin-top:3mm; }
.sample .turn.has-tail{ margin-top:2.6mm; }
.sample .para{ font-size:9.4pt; line-height:1.42; }
.sample .bubble{ padding:2.6mm 3.6mm 2.8mm; }
.sample .turn{ margin-bottom:1.6mm; }
.sample .turn.has-tail{ margin-top:2mm; }
.small-note{ margin-top:auto; padding-top:3mm; font-size:8.2pt; line-height:1.45; color:var(--muted); }
.steps.tight li{ margin-bottom:3.6mm; font-size:9.4pt; }
.qrs.big{ justify-content:center; gap:14mm; margin-top:2mm; }
.qrs.big .qr svg{ width:28mm; height:28mm; }
.uses{ margin-top:6mm; display:flex; flex-direction:column; gap:3.2mm; }
.use{ border-left:1.2mm solid var(--body); padding:1mm 0 1mm 4mm; }
.use:nth-child(1){ border-color:var(--ink-black-bar); } .use:nth-child(2){ border-color:var(--ink-red-bar); }
.use:nth-child(3){ border-color:var(--ink-green-bar); } .use:nth-child(4){ border-color:var(--ink-blue-bar); }
.use-t{ font-size:11pt; font-weight:800; }
.use-b{ font-size:9.3pt; line-height:1.48; color:#4B555C; margin-top:1mm; }
.notice{ margin-top:auto; border:.4mm dashed #B9C1C5; border-radius:3mm; padding:4mm 4.6mm; }
.notice p{ margin:2mm 0 0; font-size:9pt; line-height:1.5; color:#3E474D; }
h2.page-title.small{ font-size:18pt; }
.tr-row{ display:flex; align-items:center; gap:2.2mm; padding:.62mm 0; border-bottom:.3mm solid var(--rule); font-size:7.8pt; }
.tr-day{ width:4.5mm; text-align:right; font-weight:800; }
.tr-date{ width:15mm; color:var(--muted); font-weight:600; white-space:nowrap; flex:none; }
.tr-title{ flex:1; font-weight:600; color:var(--body); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tr-ref{ color:var(--muted); white-space:nowrap; }
.ct-week{ margin:2.6mm 0 .2mm; }
.ct-box.big{ display:inline-block; width:4.4mm; height:4.4mm; margin-right:2.4mm; vertical-align:2mm; border-color:var(--wk); }
.cp-day .day-title.cp{ font-size:19pt; margin-top:3.4mm; }
.cp-day .day-note{ margin-top:3.6mm; font-size:8.8pt; padding:2.6mm 3.6mm; }
.cp-day .kv{ margin-top:4mm; }
.cp-day .kv .para{ font-size:10.4pt; }
.cp-parts{ margin-top:3.6mm; }
.cp-talk{ margin-top:4mm; padding-top:3mm; }
.cp-talk .tq{ font-size:9.4pt; margin-bottom:2mm; }
.cp-ant{ margin-top:3mm; padding:3.2mm 4mm; }
.cp-ant p{ font-size:9.4pt; line-height:1.42; margin-top:1.4mm; }
.cp-notes{ flex:1 1 auto; min-height:0; overflow:hidden; margin-top:0; position:relative;
  background:repeating-linear-gradient(to bottom, transparent 0, transparent 7.6mm, #DCE3DD 7.6mm, #DCE3DD 7.95mm); }
.cp-notes span{ position:absolute; top:1.6mm; left:0; font-size:6.6pt; font-weight:800; letter-spacing:.22em; text-transform:uppercase; color:#B0B8BC; background:#fff; padding-right:2mm; }
.back .qrs.back-qrs{ margin-top:7mm; gap:8mm; }
.back .qrs > div{ color:rgba(242,234,224,.75); }
.qr.light{ background:#fff; padding:1.6mm; border-radius:1.6mm; }
.qr.light svg{ width:20mm; height:20mm; }
`;
