// A5 booklet stylesheet. Everything is expressed in mm/pt so the page is the
// unit of design, not the viewport.
export const css = (cover) => `
:root{
  --page-w:148mm; --page-h:210mm;
  --m-top:14mm; --m-bottom:13mm; --m-inner:16mm; --m-outer:12mm;

  --ink-black-fill:#FFFFFF; --ink-black-text:#3A4550; --ink-black-bar:#3A4550; --ink-black-edge:#DFE5E0;
  --ink-red-fill:#FBEDEB;   --ink-red-text:#C0261A;   --ink-red-bar:#C0261A;   --ink-red-edge:#EFC7C3;
  --ink-green-fill:#E9F4EF; --ink-green-text:#0E6B4C; --ink-green-bar:#0E6B4C; --ink-green-edge:#C0D9D0;
  --ink-blue-fill:#EBEFFA;  --ink-blue-text:#1D46A8;  --ink-blue-bar:#1D46A8;  --ink-blue-edge:#C4CFE8;

  --cover-deep:${cover.deep};
  --cover-mid:${cover.mid};
  --cover-tint:${cover.tint};
  --cover-ink:${cover.ink};

  --paper:#ffffff;
  --tint:#F3F5F2;
  --rule:#DFE5E0;
  --muted:#5E6B70;
  --body:#101619;
  --cream:#F2EAE0;
  --book:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Charter,Georgia,serif;
}

*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
html,body{margin:0;padding:0;background:#8b8b90;}
body{
  font-family:'Manrope',-apple-system,'Helvetica Neue',Arial,sans-serif;
  font-weight:400;
  color:var(--body);
  font-feature-settings:"kern" 1,"liga" 1;
  text-rendering:optimizeLegibility;
}

/* ---------- page shell ---------- */
.page{
  position:relative;
  width:var(--page-w); height:var(--page-h);
  background:var(--paper);
  overflow:hidden;
  page-break-after:always; break-after:page;
  margin:0 auto;
}
.page:last-child{page-break-after:auto;break-after:auto;}

.page-body{
  position:absolute; inset:0;
  padding:var(--m-top) var(--m-outer) var(--m-bottom) var(--m-inner);
}
.page.verso .page-body{padding:var(--m-top) var(--m-inner) var(--m-bottom) var(--m-outer);}

.folio{
  position:absolute; bottom:6.5mm; left:var(--m-inner); right:var(--m-outer);
  display:flex; align-items:baseline; justify-content:space-between;
  font-size:6.6pt; letter-spacing:.14em; text-transform:uppercase;
  color:#A9A9AE;
}
.page.verso .folio{left:var(--m-outer); right:var(--m-inner); flex-direction:row-reverse;}
.folio .num{font-weight:600; letter-spacing:.06em;}

/* ---------- screen preview only ---------- */
@media screen{
  body{padding:24px 0;}
  .page{box-shadow:0 6px 24px rgba(0,0,0,.35); margin:0 auto 18px;}
}

@page{ size:148mm 210mm; margin:0; }
@media print{
  html,body{background:#fff;}
  .page{margin:0; box-shadow:none;}
}

/* ================= COVER ================= */
.cover{background:var(--cover-deep); color:var(--cream);}
.cover .art{position:absolute; inset:0;}
.cover .art svg{width:100%; height:100%; display:block;}

.cover-inner{
  position:absolute; inset:0;
  padding:16mm 13mm 14mm;
  display:flex; flex-direction:column;
}
.cover-kicker{
  font-size:7.6pt; font-weight:700; letter-spacing:.26em; text-transform:uppercase;
  color:rgba(242,234,224,.82);
}
.cover-kicker .dot{opacity:.55; padding:0 .45em;}

.title-bubble{
  margin-top:auto;
  position:relative;
  background:var(--cover-tint);
  border-radius:8mm; border-top-left-radius:2.5mm;
  padding:9mm 8mm 8.5mm;
}
.title-bubble h1{
  margin:0; font-weight:800; font-size:44pt; line-height:.94;
  letter-spacing:-.035em; color:var(--cover-ink);
}
.title-bubble .ref{
  margin-top:5mm; font-size:11.5pt; font-weight:700; color:var(--cover-ink); opacity:.82;
}
.title-bubble .story-no{
  margin-top:2mm; font-size:7pt; font-weight:700; letter-spacing:.22em;
  text-transform:uppercase; color:var(--cover-ink); opacity:.6;
}

.cover-foot{margin-top:12mm;}
.cover-line{
  font-size:11.5pt; font-weight:600; line-height:1.42; color:var(--cream); max-width:96mm;
}
.cover-line em{font-style:normal; color:var(--cover-tint);}

.swatches{display:flex; gap:3.6mm; margin-top:7mm; align-items:center;}
.sw{width:7mm; height:7mm; border-radius:50%; border:.5mm solid rgba(242,234,224,.55);}
.sw.on{background:var(--cover-tint); border-color:var(--cream); box-shadow:0 0 0 1.1mm rgba(242,234,224,.28);}
.sw-label{
  margin-left:1.5mm; font-size:7pt; font-weight:700; letter-spacing:.2em;
  text-transform:uppercase; color:rgba(242,234,224,.8);
}

/* ================= INSIDE COVER / HOW TO ================= */
.eyebrow{
  font-size:7pt; font-weight:700; letter-spacing:.24em; text-transform:uppercase;
  color:var(--muted);
}
h2.page-title{
  margin:2.5mm 0 0; font-size:23pt; font-weight:800; letter-spacing:-.025em;
  line-height:1.06; color:var(--body);
}
.lede{margin:3.6mm 0 0; font-size:9.9pt; line-height:1.52; color:#4B555C;}
.lede i{font-style:italic;}
.hairline{height:.35mm; background:var(--rule); margin:5mm 0;}


.steps{margin:6mm 0 0; padding:0; list-style:none; counter-reset:step;}
.steps li{
  position:relative; padding-left:11mm; margin-bottom:5.4mm;
  font-size:10.2pt; line-height:1.52; color:#4B555C;
}
.steps li::before{
  counter-increment:step; content:counter(step);
  position:absolute; left:0; top:-0.4mm;
  width:7.4mm; height:7.4mm; border-radius:50%;
  background:var(--body); color:var(--cream);
  font-size:8.4pt; font-weight:800;
  display:flex; align-items:center; justify-content:center;
}
.steps li b{color:var(--body); font-weight:700;}

.keyrow{display:flex; gap:2.4mm; margin-top:2mm;}
.keychip{
  flex:1; border-radius:2.4mm; padding:2.8mm 2.6mm; text-align:center;
}
.keychip .who{font-size:6.4pt; font-weight:800; letter-spacing:.14em; text-transform:uppercase;}
.keychip .what{font-size:7.2pt; white-space:nowrap; font-weight:500; margin-top:.8mm; opacity:.8;}
.k-black{background:var(--ink-black-fill); color:var(--ink-black-text); box-shadow:inset 0 0 0 .3mm var(--ink-black-edge);}
.k-red{background:var(--ink-red-fill); color:var(--ink-red-text);}
.k-green{background:var(--ink-green-fill); color:var(--ink-green-text);}
.k-blue{background:var(--ink-blue-fill); color:var(--ink-blue-text);}

.ownership{
  margin-top:auto; border:.4mm dashed var(--rule); border-radius:3mm; padding:4.4mm 5mm;
}
.ownership .lbl{font-size:7pt; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted);}
.ownership .rule{border-bottom:.4mm solid #C9C9CE; height:8mm;}
.stack{display:flex; flex-direction:column; height:100%;}

/* ================= STORY TITLE PAGE ================= */
.story-head h1{
  margin:3mm 0 0; font-size:30pt; font-weight:800; letter-spacing:-.03em; line-height:1.02;
  color:var(--body);
}
.story-head .ref{margin-top:2.5mm; font-size:10pt; font-weight:600; color:var(--muted);}
.voicebar{display:flex; height:2.4mm; border-radius:1.2mm; overflow:hidden; margin:7mm 0 3mm;}
.voicebar i{display:block; height:100%;}
.voicebar-key{display:flex; justify-content:space-between; font-size:6.6pt; font-weight:700;
  letter-spacing:.12em; text-transform:uppercase; color:var(--muted);}
.cast{margin-top:8mm;}
.cast h3{font-size:7pt; font-weight:800; letter-spacing:.24em; text-transform:uppercase;
  color:var(--muted); margin:0 0 3.5mm;}
.cast-row{display:flex; align-items:center; gap:3mm; padding:2.4mm 0; border-bottom:.3mm solid var(--rule);}
.cast-row:last-child{border-bottom:0;}
.cast-dot{width:4.4mm; height:4.4mm; border-radius:50%; flex:none;}
.cast-name{font-size:10pt; font-weight:600; color:var(--body);}
.cast-words{margin-left:auto; font-size:7.6pt; font-weight:600; color:#A9A9AE;}
.readnote{
  margin-top:auto; background:var(--tint); border-radius:3mm; padding:4.5mm 5mm;
  font-size:8.8pt; line-height:1.5; color:#4B555C;
}
.readnote b{color:var(--body);}

/* ================= STORY ================= */
.chapter-rule{
  display:flex; align-items:baseline; gap:3.4mm;
  margin:8mm 0 5mm; padding-bottom:2.4mm;
  border-bottom:.3mm solid var(--rule);
}
.chapter-rule b{
  font-size:19pt; font-weight:800; letter-spacing:-.03em; line-height:1;
  color:var(--body);
}
.chapter-rule span{
  font-size:7pt; font-weight:600; letter-spacing:.22em; text-transform:uppercase;
  color:var(--muted);
}
.flow-item:first-child.chapter-rule{margin-top:0;}

.turn{margin-bottom:2.4mm;}
.turn.has-tail{margin-top:4mm;}
.flow-item:first-child.turn{margin-top:0;}

.speaker{
  font-size:6.6pt; font-weight:700; letter-spacing:.17em; text-transform:uppercase;
  margin-bottom:1.5mm;
}
.speaker--right{text-align:right;}
.speaker--left{text-align:left;}
.turn--black .speaker{color:var(--ink-black-text);}
.turn--red .speaker{color:var(--ink-red-text);}
.turn--green .speaker{color:var(--ink-green-text);}
.turn--blue .speaker{color:var(--ink-blue-text);}

/* The squared corner replaces the tail: it marks the side the voice speaks from. */
.bubble{
  position:relative; max-width:88%;
  border-radius:4.6mm; padding:3.6mm 4.4mm 3.8mm;
  border:.3mm solid transparent;
}
.turn--left .bubble{margin-right:auto;}
.turn--right .bubble{margin-left:auto;}
.turn--left.has-tail .bubble{border-top-left-radius:1.4mm;}
.turn--right.has-tail .bubble{border-top-right-radius:1.4mm;}

.turn--black .bubble{background:var(--ink-black-fill); color:var(--ink-black-text); border-color:var(--ink-black-edge);}
.turn--red .bubble{background:var(--ink-red-fill); color:var(--ink-red-text); border-color:var(--ink-red-edge);}
.turn--green .bubble{background:var(--ink-green-fill); color:var(--ink-green-text); border-color:var(--ink-green-edge);}
.turn--blue .bubble{background:var(--ink-blue-fill); color:var(--ink-blue-text); border-color:var(--ink-blue-edge);}

.para{margin:0; font-family:var(--book); font-size:10.8pt; line-height:1.5;}
.para + .para{margin-top:1.6mm;}
.para.is-start{text-indent:0;}
.para--gap{height:2.2mm;}
.para.is-poetry{padding-left:4.5mm; text-indent:-4.5mm;}
.t-q1{margin-left:2mm;} .t-q2{margin-left:6mm;}
.t-pmo{font-style:italic;}
.nd{font-variant:small-caps; letter-spacing:.02em;}
.v{
  font-family:'Manrope',sans-serif; font-size:6.2pt; font-weight:600;
  opacity:.5; vertical-align:.5em; line-height:0; padding-right:.5mm;
}
/* A carried-over bubble is not a new turn, so it keeps every corner round. */
.turn--cont .bubble{border-radius:4.6mm;}

/* ---- footnotes ---- */
.fn{
  font-family:'Manrope',sans-serif; font-size:6pt; font-weight:700;
  vertical-align:.5em; line-height:0; opacity:.62; padding-left:.3mm;
}
.textnotes{
  margin-top:7mm; padding-top:3.5mm; border-top:.3mm solid var(--rule);
}
.textnotes h4{
  margin:0 0 2.4mm; font-size:6.6pt; font-weight:800; letter-spacing:.24em;
  text-transform:uppercase; color:var(--muted);
}
.textnotes ul{margin:0; padding:0; list-style:none;}
.textnotes li{
  font-size:7.6pt; line-height:1.42; color:#5E6B70; margin-bottom:1.4mm;
  padding-left:4mm; text-indent:-4mm;
}
.textnotes li sup{font-weight:700; padding-right:1.2mm;}
.textnotes li b{color:#4B555C;}

/* ================= QUESTIONS ================= */
.qflow{flex:1; display:flex; flex-direction:column; justify-content:space-evenly;}
.qhead{display:flex; align-items:flex-start; gap:2.6mm;}
.qcard{margin-top:7mm;}
.qnum{
  display:inline-flex; align-items:center; justify-content:center;
  width:7.4mm; height:7.4mm; border-radius:50%;
  background:var(--ink-green-fill); color:var(--ink-green-text);
  font-size:8.4pt; font-weight:800; flex:none; margin-top:.6mm;
}
.qtext{
  font-size:12pt; font-weight:700; line-height:1.34; color:var(--body);
}
.answer{margin-top:4mm;}
.answer .ln{border-bottom:.35mm solid #C9D2CC; height:9.6mm;}
.q-foot{
  margin-top:auto; font-size:8.6pt; line-height:1.5; color:#5E6B70;
  border-top:.35mm solid var(--rule); padding-top:4mm;
}

/* ================= NOTES ================= */
.notes-grid{margin-top:6mm;}
.notes-grid .ln{border-bottom:.35mm solid #DCE3DD; height:8.6mm;}

/* ---- closing page pull quote ---- */
.pullquote{margin:10mm 0 9mm; padding-left:2mm;}
.pullquote .speaker{
  font-size:6.6pt; font-weight:700; letter-spacing:.17em;
  text-transform:uppercase; color:var(--ink-red-text); margin-bottom:1.5mm;
}
.pullquote .bubble{
  position:relative; background:var(--ink-red-fill); color:var(--ink-red-text);
  border:.3mm solid var(--ink-red-edge);
  border-radius:5.5mm; border-top-left-radius:1.6mm; padding:6mm;
  max-width:none;
}
.pullquote .para{font-family:var(--book); font-size:14pt; font-weight:600; line-height:1.36;}
.pullquote-ref{
  margin-top:3mm; font-size:7pt; font-weight:700; letter-spacing:.16em;
  text-transform:uppercase; color:var(--muted); text-align:right;
}

/* ================= FILLER PAGES ================= */
.swap-head{
  display:flex; gap:3mm; margin-top:7mm; padding-bottom:2mm;
  border-bottom:.3mm solid var(--rule);
  font-size:6.2pt; font-weight:800; letter-spacing:.18em; text-transform:uppercase;
  color:#B0B0B5;
}
.swap-head span:nth-child(1){width:26mm;}
.swap-head span:nth-child(2){width:32mm;}
.swap-head span:nth-child(3){flex:1;}
.swap-row{
  display:flex; align-items:center; gap:3mm; padding:4.6mm 0;
  border-bottom:.3mm solid var(--rule);
}
.swap-chip{width:5mm; height:5mm; border-radius:1.4mm; flex:none;}
.swap-name{width:21mm; font-size:9.4pt; font-weight:700; color:var(--body);}
.swap-part{width:32mm; font-size:8pt; color:var(--muted);}
.swap-line{flex:1; border-bottom:.35mm solid #C9C9CE; height:5mm;}

.keep-bubble{
  position:relative; margin-top:5mm; border-radius:5mm;
  border:.5mm dashed #C4C4CA; padding:6mm 6mm 4mm;
}
/* No tail here: an outlined tail on a dashed box reads as a smudge in print. */
.keep-bubble .ln{border-bottom:.35mm solid #DCDCE1; height:9mm;}
.keep-ref{display:flex; align-items:flex-end; gap:2.6mm; margin-top:8mm;}
.keep-ref span:first-child{
  font-size:7pt; font-weight:800; letter-spacing:.2em; text-transform:uppercase;
  color:var(--muted); padding-bottom:1mm;
}
.keep-ref .ln{flex:1; border-bottom:.35mm solid #C9C9CE; height:7mm;}

/* ================= BACK COVER ================= */
.back{background:var(--cover-deep); color:var(--cream);}
.back-inner{position:absolute; inset:0; padding:18mm 13mm 14mm; display:flex; flex-direction:column;}
.back h2{margin:0; font-size:20pt; font-weight:800; letter-spacing:-.02em; line-height:1.14; max-width:100mm;}
.back p{font-size:9.6pt; line-height:1.55; color:rgba(242,234,224,.86); max-width:100mm;}
.back .rulez{height:.4mm; background:rgba(242,234,224,.28); margin:7mm 0;}
.back-colophon{
  margin-top:auto; font-size:9pt; line-height:1.5; color:rgba(242,234,224,.8);
  padding-bottom:6mm;
}
.back-colophon b{color:var(--cover-tint); font-weight:700;}
.back-dots{display:flex; gap:2.6mm; margin-bottom:3.5mm;}
.back-dots i{width:5mm; height:5mm; border-radius:50%; display:block; border:.4mm solid rgba(242,234,224,.5);}
.back-mark{ font-size:7.4pt; font-weight:700; letter-spacing:.24em; text-transform:uppercase; color:rgba(242,234,224,.7);}
.back-share{margin-top:9mm;}
.back-bubbles{display:flex; gap:1.6mm;}
.back-bubbles i{height:4mm; border-radius:2mm; display:block;}
.back-share-key{
  margin-top:3mm; font-size:6.6pt; font-weight:700; letter-spacing:.18em;
  text-transform:uppercase; color:rgba(242,234,224,.62);
}
.back-facts{display:flex; gap:6mm; margin-top:11mm;}
.back-facts div{display:flex; flex-direction:column;}
.back-facts b{font-size:19pt; font-weight:800; letter-spacing:-.02em; line-height:1;}
.back-facts span{
  margin-top:1.6mm; font-size:6.4pt; font-weight:700; letter-spacing:.16em;
  text-transform:uppercase; color:rgba(242,234,224,.6); max-width:20mm;
}
`;
