// A4 stylesheet for the schools brochure. Everything is in mm and pt so the
// page is the unit of design, not the viewport. Palette and bubble geometry are
// the app's own (constants/Colors.ts), by way of print/jonah-booklet.
export const css = `
:root{
  --page-w:210mm; --page-h:297mm;
  --m-top:16mm; --m-bottom:14mm; --m-side:16mm;

  --ink-black-fill:#FFFFFF; --ink-black-text:#3A4550; --ink-black-edge:#DFE5E0;
  --ink-red-fill:#FBEDEB;   --ink-red-text:#C0261A;   --ink-red-edge:#EFC7C3;
  --ink-green-fill:#E9F4EF; --ink-green-text:#0E6B4C; --ink-green-edge:#C0D9D0;
  --ink-blue-fill:#EBEFFA;  --ink-blue-text:#1D46A8;  --ink-blue-edge:#C4CFE8;

  --deep:#151C24;      /* cover ground: the narrator ink, taken darker */
  --deep-2:#1E2833;
  --cream:#F2EAE0;
  --paper:#FFFFFF;
  --tint:#F3F5F2;
  --rule:#DFE5E0;
  --rule-soft:#EAEEE9;
  --muted:#5E6B70;
  --soft:#4B555C;
  --body:#101619;
  --acc:#0E6B4C;
  --book:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Charter,Georgia,serif;
}

*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
html,body{margin:0;padding:0;background:#8b8b90;}
body{
  font-family:'Manrope',-apple-system,'Helvetica Neue',Arial,sans-serif;
  font-weight:400; color:var(--body);
  font-feature-settings:"kern" 1,"liga" 1;
  text-rendering:optimizeLegibility;
}

/* ---------------- page shell ---------------- */
.page{
  position:relative; width:var(--page-w); height:var(--page-h);
  background:var(--paper); overflow:hidden;
  page-break-after:always; break-after:page; margin:0 auto;
}
.page:last-child{page-break-after:auto;break-after:auto;}
.page-body{position:absolute; inset:0; padding:var(--m-top) var(--m-side) var(--m-bottom); display:flex; flex-direction:column;}

.folio{
  position:absolute; bottom:7mm; left:var(--m-side); right:var(--m-side);
  display:flex; align-items:baseline; justify-content:space-between;
  font-size:6.6pt; letter-spacing:.16em; text-transform:uppercase; color:#A9AFA9;
}
.folio .num{font-weight:700; letter-spacing:.06em;}

@media screen{ body{padding:24px 0;} .page{box-shadow:0 8px 30px rgba(0,0,0,.35); margin:0 auto 20px;} }
@page{ size:210mm 297mm; margin:0; }
@media print{ html,body{background:#fff;} .page{margin:0; box-shadow:none;} }

/* ---------------- shared type ---------------- */
.eyebrow{font-size:7pt; font-weight:800; letter-spacing:.26em; text-transform:uppercase; color:var(--muted);}
.sec-no{
  display:flex; align-items:baseline; gap:3mm; margin-bottom:2mm;
  font-size:7pt; font-weight:800; letter-spacing:.26em; text-transform:uppercase; color:var(--muted);
}
.sec-no b{
  font-size:7pt; font-weight:800; color:var(--acc); letter-spacing:.26em;
}
.sec-no i{flex:1; height:.3mm; background:var(--rule); font-style:normal;}

h2.head{margin:0; font-size:24pt; font-weight:800; letter-spacing:-.032em; line-height:1.03; color:var(--body); text-wrap:balance;}
h3.sub{margin:0; font-size:13pt; font-weight:800; letter-spacing:-.02em; line-height:1.16; color:var(--body);}
h4.min{margin:0 0 1.8mm; font-size:7pt; font-weight:800; letter-spacing:.22em; text-transform:uppercase; color:var(--muted);}
p.lede{margin:3.2mm 0 0; font-size:10.2pt; line-height:1.48; color:var(--soft); max-width:152mm;}
p.body{margin:2.4mm 0 0; font-size:9pt; line-height:1.52; color:var(--soft);}
p.body b, p.lede b{color:var(--body); font-weight:700;}
.hair{height:.3mm; background:var(--rule); margin:5mm 0 4.5mm;}
.hair--soft{background:var(--rule-soft);}

/* ================= PAGE 1 · COVER ================= */
/* The cover prints on bare paper: no flood, so almost no ink on an A4 field.
   Bubble fills stay exactly as they were, which is the app's light-mode set. */
.cover{background:var(--paper); color:var(--body);}
.cover .wash{position:absolute; inset:0;}
.cover .wash svg{width:100%; height:100%; display:block;}
.cover-body{position:absolute; inset:0; padding:18mm 16mm 15mm; display:flex; flex-direction:column;}

.cover-top{display:flex; align-items:center; justify-content:space-between;}
.brandmark{display:flex; align-items:center; gap:3mm;}
.brandmark .dots{display:flex; gap:1.4mm;}
.brandmark .dots i{width:2.6mm; height:2.6mm; border-radius:50%; display:block;}
.brandmark .nm{font-size:8pt; font-weight:800; letter-spacing:.2em; text-transform:uppercase; color:var(--body);}
.cover-top .free{
  font-size:7pt; font-weight:800; letter-spacing:.22em; text-transform:uppercase;
  color:var(--acc); border:.35mm solid rgba(14,107,76,.38); border-radius:20mm; padding:1.6mm 4mm;
}

.cover-stage{margin-top:16mm;}
.cover-stage .turn{margin-bottom:2.6mm;}
.cover-stage .bubble{
  border-radius:5mm; padding:3.6mm 4.6mm; max-width:112mm;
  font-family:var(--book); font-size:11.5pt; line-height:1.36;
}
.cover-stage .speaker{
  font-size:6.6pt; font-weight:800; letter-spacing:.2em; text-transform:uppercase;
  margin-bottom:1.4mm;
}
.cover-stage .turn--black .speaker{color:var(--ink-black-text);}
.cover-stage .turn--red .speaker{color:var(--ink-red-text);}
.cover-stage .turn--green .speaker{color:var(--ink-green-text);}
.cover-stage .turn--blue .speaker{color:var(--ink-blue-text);}
.cover-stage .turn--left .bubble{margin-right:auto; border-top-left-radius:1.6mm;}
.cover-stage .turn--right .bubble{margin-left:auto; border-top-right-radius:1.6mm;}
.cover-stage .turn--right .speaker{text-align:right;}
.cover-stage .turn--black .bubble{background:var(--ink-black-fill); color:var(--ink-black-text); box-shadow:inset 0 0 0 .3mm var(--ink-black-edge);}
.cover-stage .turn--red .bubble{background:var(--ink-red-fill); color:var(--ink-red-text);}
.cover-stage .turn--green .bubble{background:var(--ink-green-fill); color:var(--ink-green-text);}
.cover-stage .turn--blue .bubble{background:var(--ink-blue-fill); color:var(--ink-blue-text);}
.cover-stage .ref{
  margin-top:3.5mm; font-size:6.6pt; font-weight:700; letter-spacing:.2em;
  text-transform:uppercase; color:#A9B0AA; text-align:right;
}

.cover-title{margin-top:auto;}
.cover-title h1{
  margin:0; font-size:45pt; font-weight:800; line-height:.96;
  letter-spacing:-.038em; color:var(--body); max-width:175mm;
}
.cover-title h1 em{font-style:normal; color:var(--acc);}
.cover-title .deck{
  margin-top:5mm; font-size:15pt; font-weight:700; line-height:1.3;
  letter-spacing:-.015em; color:var(--acc); max-width:140mm;
}
.cover-title .say{
  margin-top:4mm; font-size:11.5pt; font-weight:500; line-height:1.5;
  color:var(--soft); max-width:136mm;
}
.cover-title .say b{color:var(--body); font-weight:700;}

.cover-facts{display:flex; gap:9mm; margin-top:11mm; padding-top:7mm; border-top:.35mm solid var(--rule);}
.cover-facts div{display:flex; flex-direction:column;}
.cover-facts b{font-size:22pt; font-weight:800; letter-spacing:-.03em; line-height:1; color:var(--body);}
.cover-facts span{
  margin-top:1.8mm; font-size:6.4pt; font-weight:700; letter-spacing:.17em;
  text-transform:uppercase; color:var(--muted); max-width:26mm; line-height:1.4;
}
.cover-foot{
  margin-top:9mm; display:flex; align-items:flex-end; justify-content:space-between;
  font-size:8pt; line-height:1.5; color:var(--muted);
}
.cover-foot b{color:var(--body); font-weight:700;}

/* ============ FORMAT TIMELINE ============ */
.timeline{
  display:flex; align-items:baseline; gap:0; margin-top:4.6mm;
  border-top:.3mm solid var(--rule); border-bottom:.3mm solid var(--rule);
  padding:2.8mm 0 3mm;
}
.tl{flex:1; display:flex; align-items:baseline; gap:2.2mm; padding-right:2.5mm;}
.tl .yr{
  font-size:7pt; font-weight:800; letter-spacing:.1em; color:#A9B0AA; flex:none;
  font-variant-numeric:tabular-nums;
}
.tl .wh{font-size:8.4pt; font-weight:800; letter-spacing:-.015em; color:var(--body); white-space:nowrap;}
.tl.is-now .yr, .tl.is-now .wh{color:var(--ink-green-text);}
.tl-note{
  margin:2.2mm 0 0; font-size:6.8pt; line-height:1.42; color:var(--muted); max-width:158mm;
}
.tl .swatches{display:flex; gap:1.2mm; margin-left:.6mm;}
.tl .swatches i{width:2.4mm; height:2.4mm; border-radius:50%; display:block; align-self:center;}

/* ============ PULL-OUT ============ */
.pullout{
  margin-top:4.4mm; border-left:.9mm solid var(--ink-red-text);
  background:var(--ink-red-fill); border-radius:0 3mm 3mm 0; padding:3.4mm 4.2mm;
}
.pullout h5{
  margin:0; font-size:9.6pt; font-weight:800; letter-spacing:-.02em;
  line-height:1.18; color:var(--ink-red-text);
}
.pullout p{margin:2.2mm 0 0; font-size:7.8pt; line-height:1.44; color:#8A382F;}
.pullout p b{color:var(--ink-red-text); font-weight:700;}

/* ================= COLOUR KEY ================= */
.keys{display:flex; flex-direction:column; gap:1.4mm; margin-top:3.4mm;}
.key{
  display:flex; align-items:center; gap:3mm;
  border-radius:3mm; padding:2.2mm 3.4mm;
}
.key .dot{width:4.6mm; height:4.6mm; border-radius:50%; flex:none;}
.key .who{font-size:9.4pt; font-weight:800; letter-spacing:-.015em; white-space:nowrap;}
.key .what{font-size:6.9pt; font-weight:500; opacity:.74; margin-left:auto; text-align:right; white-space:nowrap; min-width:0;}
.key .n{
  font-size:7pt; font-weight:800; letter-spacing:.02em;
  padding-left:2.6mm; margin-left:2.4mm; border-left:.3mm solid currentColor;
  opacity:.62; white-space:nowrap; width:16mm; text-align:right; flex:none;
}
.k-black{background:var(--tint); color:var(--ink-black-text); box-shadow:inset 0 0 0 .3mm var(--ink-black-edge);}
.k-red{background:var(--ink-red-fill); color:var(--ink-red-text);}
.k-green{background:var(--ink-green-fill); color:var(--ink-green-text);}
.k-blue{background:var(--ink-blue-fill); color:var(--ink-blue-text);}

/* ================= THE RENDERED SPREAD ================= */
.spread{
  background:var(--paper); border:.35mm solid var(--rule); border-radius:4mm;
  padding:4.6mm 5mm 3.6mm; position:relative;
}
.spread-head{display:flex; align-items:baseline; justify-content:space-between; gap:4mm; margin-bottom:4mm; padding-bottom:2.4mm; border-bottom:.3mm solid var(--rule-soft);}
.spread-head .t{font-size:9.4pt; font-weight:800; letter-spacing:-.015em;}
.spread-head .r{font-size:6.8pt; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:var(--muted); white-space:nowrap;}

/* A jump inside one story, marked so the reader is never misled about it. */
.spread-break{
  display:flex; align-items:center; gap:3mm; margin:4.4mm 0 3.4mm;
  font-size:6pt; font-weight:800; letter-spacing:.2em; text-transform:uppercase; color:#A9B0AA;
}
.spread-break::before, .spread-break::after{content:''; flex:1; height:.25mm; background:var(--rule-soft);}

.turn{margin-bottom:1.3mm;}
.turn.has-tail{margin-top:2mm;}
.turn:first-child{margin-top:0;}
.speaker{font-size:6pt; font-weight:800; letter-spacing:.18em; text-transform:uppercase; margin-bottom:1.1mm;}
.speaker--right{text-align:right;}
.turn--black .speaker{color:var(--ink-black-text);}
.turn--red .speaker{color:var(--ink-red-text);}
.turn--green .speaker{color:var(--ink-green-text);}
.turn--blue .speaker{color:var(--ink-blue-text);}

/* The squared corner marks the side the voice speaks from; the app has no tails. */
.bubble{position:relative; max-width:92%; border-radius:3.6mm; padding:2.2mm 3mm 2.4mm; border:.3mm solid transparent;}
.turn--left .bubble{margin-right:auto;}
.turn--right .bubble{margin-left:auto;}
.turn--left.has-tail .bubble{border-top-left-radius:1.3mm;}
.turn--right.has-tail .bubble{border-top-right-radius:1.3mm;}
.turn--black .bubble{background:var(--ink-black-fill); color:var(--ink-black-text); border-color:var(--ink-black-edge);}
.turn--red .bubble{background:var(--ink-red-fill); color:var(--ink-red-text); border-color:var(--ink-red-edge);}
.turn--green .bubble{background:var(--ink-green-fill); color:var(--ink-green-text); border-color:var(--ink-green-edge);}
.turn--blue .bubble{background:var(--ink-blue-fill); color:var(--ink-blue-text); border-color:var(--ink-blue-edge);}

.para{margin:0; font-family:var(--book); font-size:8pt; line-height:1.38;}
.para + .para{margin-top:1.4mm;}
.para.is-poetry{padding-left:4mm; text-indent:-4mm;}
.t-pmo{font-style:italic;}
.nd{font-variant:small-caps; letter-spacing:.02em;}
.v{font-family:'Manrope',sans-serif; font-size:5.8pt; font-weight:700; opacity:.48; vertical-align:.5em; line-height:0; padding-right:.5mm;}

.spread-foot{
  display:flex; align-items:center; gap:3mm; margin-top:3.4mm; padding-top:2.6mm;
  border-top:.3mm solid var(--rule-soft);
  font-size:7pt; font-weight:600; color:var(--muted);
}
.sharebar{display:flex; height:2mm; width:52mm; border-radius:1mm; overflow:hidden; flex:none;}
.sharebar i{display:block; height:100%;}
.sharebar i + i{box-shadow:-.25mm 0 0 rgba(255,255,255,.9);}

/* ================= DEVICE FRAMES ================= */
/* A phone drawn in CSS rather than dropped in as an image, so it stays sharp at
   any print size and the shot inside is the only bitmap on the page.
   Aspect is 1170x2532, the resolution the screenshots were captured at. */
.shots{display:flex; gap:6mm; align-items:flex-start;}
.shot{display:flex; flex-direction:column; align-items:flex-start;}
/* Inside the page 2 band the shots share the row evenly, so the gaps between
   phones stay equal instead of being whatever the text column leaves over. */
.shotband .shot{flex:1;}
.shotband .shot .cap{width:100%;}

.device{
  position:relative;
  display:inline-block;
  border-radius:2.4mm;
  /* Brushed rail: light on the outer corners, dark along the flats. */
  background:linear-gradient(148deg,
    #9AA2A9 0%, #6E767E 9%, #454C54 26%, #3A4149 50%,
    #454C54 74%, #6E767E 91%, #9AA2A9 100%);
  padding:.34mm;
}

/* The screen carries the aspect, and the rail pads around it. Sizing the rail
   instead left the screen box very slightly narrower than 1170/2532, which
   object-fit:cover paid for by shaving the foot off every screenshot. */
.device .screen{
  position:relative;
  height:var(--dev-h,44mm);
  aspect-ratio:1170/2532;
  border-radius:2.1mm; overflow:hidden;
  background:#0B0F14;
}
.device .screen img{
  width:100%; height:100%; display:block;
  object-fit:cover; object-position:top;
}

/* Dynamic Island. The captures are from a notched device, so this is a
   deliberate modernisation: it sits in the gap the status bar already leaves. */
.device .island{
  position:absolute; top:1.5%; left:50%; transform:translateX(-50%);
  width:30%; height:2.9%; border-radius:1mm; background:#080A0D; z-index:2;
}

/* Side buttons. One pseudo-element each side; the left stacks three with
   box-shadow so the silent switch and both volume keys come free. */
.device::before{
  content:''; position:absolute; left:-.22mm; top:15.5%;
  width:.24mm; height:3.4%; border-radius:.12mm; background:#7B838B;
  box-shadow:0 .9mm 0 #7B838B, 0 2.1mm 0 #7B838B;
}
.device::after{
  content:''; position:absolute; right:-.22mm; top:21%;
  width:.24mm; height:7.4%; border-radius:.12mm; background:#7B838B;
}

.shot .cap{margin-top:2mm; width:var(--cap-w,30mm); font-size:6.2pt; font-weight:800; letter-spacing:.15em; text-transform:uppercase; color:var(--muted);}
.shot .cap span{display:block; margin-top:.8mm; font-size:6.8pt; font-weight:500; letter-spacing:0; text-transform:none; color:var(--soft); line-height:1.36;}

/* Placeholder, for a slot whose screenshot has not landed yet. */
.slot{
  position:absolute; inset:0; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:1.4mm; text-align:center;
  background:repeating-linear-gradient(135deg,#EDF1EC 0 2mm,#E6EBE5 2mm 4mm);
  padding:3mm;
}
.slot b{font-size:6.4pt; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#7E8A80;}
.slot span{font-size:5.6pt; font-weight:600; color:#95A098; line-height:1.4;}

/* The screenshot band that closes page 2. */
.shotband{display:flex; align-items:flex-start; gap:6mm; margin-top:auto; padding-top:8.5mm; border-top:.3mm solid var(--rule-soft); --dev-h:40.5mm;}
/* A narrow measure here is deliberate: the text runs to more lines and fills the
   band's height, instead of sitting wide and short with a hole underneath it. */
.shotband .why{width:52mm; flex:none;}
.shotband .why p{
  margin:2.2mm 0 0; font-size:8pt; line-height:1.48; color:var(--soft);
  /* Narrow measure, so let the browser pull a word down rather than strand one. */
  text-wrap:pretty;
}
.shotband .why b{color:var(--body); font-weight:700;}

/* ================= NUMBERED STEPS ================= */
.steps{margin:0; padding:0; list-style:none; counter-reset:step;}
.steps li{position:relative; padding-left:9.5mm; margin-bottom:2.6mm; font-size:8.5pt; line-height:1.44; color:var(--soft);}
.steps li:last-child{margin-bottom:0;}
.steps li::before{
  counter-increment:step; content:counter(step);
  position:absolute; left:0; top:-.2mm; width:6.2mm; height:6.2mm; border-radius:50%;
  background:var(--body); color:var(--cream); font-size:7.6pt; font-weight:800;
  display:flex; align-items:center; justify-content:center;
}
.steps li b{color:var(--body); font-weight:700;}

/* ================= QUESTION SETS ================= */
.qsets{display:flex; gap:4mm;}
.qset{
  flex:1; border:.35mm solid var(--rule); border-radius:3.4mm; padding:4.2mm 4.2mm 4.4mm;
  display:flex; flex-direction:column;
}
.qset.is-lead{background:var(--ink-green-fill); border-color:var(--ink-green-edge);}
.qset .tag{font-size:6.6pt; font-weight:800; letter-spacing:.2em; text-transform:uppercase; color:var(--muted);}
.qset.is-lead .tag{color:var(--ink-green-text);}
.qset .nm{margin-top:1.8mm; font-size:11pt; font-weight:800; letter-spacing:-.02em; line-height:1.1;}
.qset.is-lead .nm{color:var(--ink-green-text);}
.qset .dsc{margin-top:1.8mm; font-size:7.4pt; line-height:1.4; color:var(--soft); min-height:6.5mm;}
.qset.is-lead .dsc{color:#33604F;}
.qset ol{margin:3mm 0 0; padding:0; list-style:none; counter-reset:q;}
.qset ol li{
  position:relative; padding-left:5.2mm; margin-bottom:1.6mm;
  font-family:var(--book); font-size:8pt; line-height:1.34; color:var(--body);
}
.qset ol li:last-child{margin-bottom:0;}
.qset ol li::before{
  counter-increment:q; content:counter(q);
  position:absolute; left:0; top:.2mm; font-family:'Manrope',sans-serif;
  font-size:6.4pt; font-weight:800; color:var(--muted);
}
.qset.is-lead ol li::before{color:var(--ink-green-text); opacity:.7;}

.samples{margin-top:3.6mm; background:var(--tint); border-radius:3.4mm; padding:3.6mm 5mm;}
.samples .row{display:flex; gap:4mm; align-items:baseline; padding:1.5mm 0; border-bottom:.3mm solid var(--rule);}
.samples .row:last-child{border-bottom:0; padding-bottom:0;}
.samples .row:first-child{padding-top:0;}
.samples .q{font-family:var(--book); font-size:9pt; line-height:1.38; color:var(--body); flex:1;}
.samples .from{font-size:6.4pt; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:var(--muted); white-space:nowrap; text-align:right; width:38mm;}

/* ================= PLANS ================= */
.plans{width:100%; border-collapse:collapse; margin-top:4mm;}
.plans th{
  text-align:left; font-size:6.4pt; font-weight:800; letter-spacing:.2em; text-transform:uppercase;
  color:var(--muted); padding:0 0 2.4mm; border-bottom:.35mm solid var(--rule);
}
.plans th.num, .plans td.num{text-align:right;}
.plans td{padding:2.5mm 0; border-bottom:.3mm solid var(--rule-soft); font-size:9pt; vertical-align:baseline;}
.plans tr:last-child td{border-bottom:0;}
.plans td.nm{font-weight:700; color:var(--body);}
.plans td.fit{color:var(--muted); font-size:8.4pt;}
.plans td.num{font-weight:800; color:var(--acc); font-size:10pt; letter-spacing:-.01em;}
.plans td.num span{font-size:6.4pt; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); padding-left:1.6mm;}

/* ================= SMALL PANELS ================= */
.panel{background:var(--tint); border-radius:3.4mm; padding:5mm 5.5mm;}
.panel.is-quiet{background:#FFFFFF; border:.35mm solid var(--rule);}
.panel p{margin:0; font-size:8.8pt; line-height:1.5; color:var(--soft);}
.panel p + p{margin-top:2.4mm;}
.panel b{color:var(--body); font-weight:700;}

.weeks{margin-top:auto; padding-top:5mm; border-top:.3mm solid var(--rule-soft);}
.weeks-grid{display:flex; gap:9mm; margin-top:3mm;}
.weeks-grid > div{flex:1;}
.weeks-row{display:flex; align-items:baseline; gap:3mm; padding:1.6mm 0; border-bottom:.3mm solid var(--rule-soft);}
.weeks-row:last-child{border-bottom:0;}
.weeks-row .wk{width:5mm; flex:none; font-size:6.4pt; font-weight:800; letter-spacing:.06em; color:#A9B0AA;}
.weeks-row .ti{font-size:8.6pt; font-weight:700; color:var(--body); letter-spacing:-.01em;}
.weeks-row .rf{font-size:7.2pt; color:var(--muted); margin-left:auto; white-space:nowrap;}
.weeks-row .mn{width:11mm; flex:none; text-align:right; font-size:7pt; font-weight:700; color:var(--acc);}

.reqs{margin-top:4.4mm; border:.35mm solid var(--rule); border-radius:3mm; padding:3.4mm 4.4mm;}
.reqs h4{margin-bottom:2.6mm;}
.reqs .row{display:flex; justify-content:space-between; gap:4mm; padding:1.2mm 0; border-bottom:.3mm solid var(--rule-soft); font-size:7.6pt;}
.reqs .row:last-child{border-bottom:0; padding-bottom:0;}
.reqs .row span:first-child{color:var(--muted);}
.reqs .row span:last-child{font-weight:700; color:var(--body); text-align:right;}

.cols3{display:flex; gap:5mm;}
.cols3 p.body{font-size:8.6pt; line-height:1.48;}
.cols3 > div{flex:1;}
.cols2{display:flex; gap:8mm;}

.ticks{margin:3mm 0 0; padding:0; list-style:none;}
.ticks li{
  position:relative; padding-left:5.2mm; margin-bottom:1.5mm;
  font-size:7.8pt; line-height:1.4; color:var(--soft);
}
.ticks li:last-child{margin-bottom:0;}
.ticks li::before{
  content:''; position:absolute; left:0; top:1.4mm;
  width:2mm; height:2mm; border-radius:50%; background:var(--acc);
}
.ticks li b{color:var(--body); font-weight:700;}

/* ================= PAGE 4 · CLOSE ================= */
.close{background:var(--deep); color:var(--cream); border-radius:4mm; padding:5.6mm 7.6mm 5.8mm; margin-top:auto;}
.close h3{margin:0; font-size:16pt; font-weight:800; letter-spacing:-.028em; line-height:1.06; color:var(--cream); max-width:120mm; text-wrap:balance;}
.close p{margin:3.2mm 0 0; font-size:8.4pt; line-height:1.48; color:rgba(242,234,224,.82); max-width:122mm;}
.close p b{color:var(--cream); font-weight:700;}
.close-grid{display:flex; gap:9mm; align-items:flex-start; margin-top:4mm; padding-top:4mm; border-top:.35mm solid rgba(242,234,224,.22);}
.close-grid .who{flex:1;}
.close-grid .lbl{font-size:6.4pt; font-weight:800; letter-spacing:.2em; text-transform:uppercase; color:rgba(242,234,224,.5);}
.close-grid .val{margin-top:1.4mm; font-size:9.6pt; font-weight:700; line-height:1.38; color:var(--cream);}
.close-grid .val span{display:block; font-weight:500; font-size:8.2pt; color:rgba(242,234,224,.72); margin-top:1mm;}
.qr{width:27mm; height:27mm; background:#fff; border-radius:2.4mm; padding:1.8mm; flex:none;}
.qr svg, .qr img{width:100%; height:100%; display:block;}
.qr-cap{
  margin-top:2.2mm; font-size:6pt; font-weight:700; letter-spacing:.14em;
  text-transform:uppercase; color:rgba(242,234,224,.55); text-align:center; width:27mm; line-height:1.5;
}

.storelinks{display:flex; gap:3mm; margin-top:4mm;}
.storelink{
  border:.35mm solid rgba(242,234,224,.3); border-radius:2.4mm; padding:2.4mm 4mm;
  font-size:7.4pt; font-weight:700; color:rgba(242,234,224,.85); letter-spacing:.04em;
}
.storelink b{display:block; font-size:6pt; font-weight:800; letter-spacing:.2em; text-transform:uppercase; color:rgba(242,234,224,.5); margin-bottom:.8mm;}

/* colophon strip under the close panel */
.colophon{
  margin-top:3mm; display:flex; justify-content:space-between; align-items:baseline;
  font-size:7pt; line-height:1.5; color:var(--muted);
}
.colophon b{color:var(--body); font-weight:700;}
`;
