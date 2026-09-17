import { INK, PALETTE, MOTION } from './data.mjs';

export const css = `
:root{
  --bg:${PALETTE.bg}; --surf:${PALETTE.surf}; --ink:${PALETTE.ink}; --mute:${PALETTE.mute};
  --hair:${PALETTE.hair}; --acc:${PALETTE.acc}; --thread:${PALETTE.thread};
  --soft:#4B555C; --rule-soft:#EAEEE9; --deep:#151C24; --cream:#F2EAE0;

  --k-black:${INK.black.bar};  --f-black:${INK.black.fill};  --e-black:${INK.black.edge};
  --k-red:${INK.red.bar};      --f-red:${INK.red.fill};      --e-red:${INK.red.edge};
  --k-green:${INK.green.bar};  --f-green:${INK.green.fill};  --e-green:${INK.green.edge};
  --k-blue:${INK.blue.bar};    --f-blue:${INK.blue.fill};    --e-blue:${INK.blue.edge};

  --ease:${MOTION.ease}; --ease-in:${MOTION.easeIn};
  --d-instant:${MOTION.dur.instant}ms; --d-quick:${MOTION.dur.quick}ms;
  --d-base:${MOTION.dur.base}ms; --d-slow:${MOTION.dur.slow}ms; --d-epic:${MOTION.dur.epic}ms;

  --book:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Charter,Georgia,serif;
  --sans:'Manrope',-apple-system,'Helvetica Neue',Arial,sans-serif;
}

*{box-sizing:border-box;margin:0;padding:0;}
html,body{height:100%;background:#0B0F14;overflow:hidden;}
body{font-family:var(--sans);color:var(--ink);-webkit-font-smoothing:antialiased;}

/* ---------------- stage: a fixed 1600x900 board scaled to the window ------- */
#stage{position:fixed;inset:0;display:grid;place-items:center;}
#board{
  width:1600px;height:900px;position:relative;background:var(--bg);
  transform-origin:center center;overflow:hidden;
  box-shadow:0 30px 90px rgba(0,0,0,.5);
}

.slide{
  position:absolute;inset:0;padding:150px 96px 138px;
  display:flex;flex-direction:column;justify-content:center;
  opacity:0;visibility:hidden;pointer-events:none;
  transition:opacity var(--d-quick) var(--ease), visibility 0s linear var(--d-quick);
}
.slide.on{opacity:1;visibility:visible;pointer-events:auto;transition-delay:0s,0s;}

/* Staggered reveal. Children with .a lift in once their slide is live. */
.slide .a{opacity:0;transform:translateY(14px);}
.slide.on .a{
  opacity:1;transform:none;
  transition:opacity var(--d-base) var(--ease), transform var(--d-base) var(--ease);
  transition-delay:calc(var(--i,0) * 70ms);
}

/* ---------------- type ---------------- */
.eyebrow{font-size:14px;font-weight:800;letter-spacing:.26em;text-transform:uppercase;color:var(--mute);}
.eyebrow b{color:var(--acc);}
h1{font-size:104px;line-height:.94;letter-spacing:-.04em;font-weight:800;}
h1 em{font-style:normal;color:var(--acc);}
h2{font-size:62px;line-height:1.02;letter-spacing:-.035em;font-weight:800;text-wrap:balance;}
h2 em{font-style:normal;color:var(--acc);}
h3{font-size:30px;line-height:1.14;letter-spacing:-.02em;font-weight:800;}
.lede{font-size:26px;line-height:1.48;color:var(--soft);max-width:1080px;font-weight:500;}
.lede b{color:var(--ink);font-weight:700;}
.body{font-size:20px;line-height:1.55;color:var(--soft);}
.body b{color:var(--ink);font-weight:700;}
.small{font-size:16px;line-height:1.5;color:var(--mute);}
.hair{height:1px;background:var(--hair);}

/* section rule pinned above the centred content block */
.sec{position:absolute;top:74px;left:96px;right:96px;display:flex;align-items:center;gap:18px;}

/* cover and closer run edge to edge instead */
.slide.pad{padding:70px 96px 86px;justify-content:flex-start;}
/* A pad slide that still carries the section rule needs to clear it. */
.slide.pad.withsec{padding-top:150px;}
.sec i{flex:1;height:1px;background:var(--hair);}

/* ---------------- chrome ---------------- */
#chrome{position:absolute;left:96px;right:96px;bottom:34px;display:flex;align-items:center;gap:20px;
  font-size:13px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;color:#A9B0AA;z-index:5;}
#chrome .dots{display:flex;gap:7px;}
#chrome .dots i{width:8px;height:8px;border-radius:50%;display:block;}
#bar{position:absolute;left:0;top:0;height:3px;background:var(--acc);width:0;
  transition:width var(--d-base) var(--ease);z-index:6;}
#clock{margin-left:auto;font-variant-numeric:tabular-nums;}
#clock.run{color:var(--acc);}
#phase{color:var(--mute);}

/* ---------------- cover ---------------- */
.cover-grid{display:flex;flex-direction:column;height:100%;}
.cover-top{display:flex;align-items:center;justify-content:space-between;}
.brand{display:flex;align-items:center;gap:14px;}
.brand .dots{display:flex;gap:6px;}
.brand .dots i{width:11px;height:11px;border-radius:50%;display:block;}
.brand span{font-size:15px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;}
.pill{font-size:13px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--acc);
  border:1.5px solid rgba(14,107,76,.35);border-radius:100px;padding:9px 20px;}

/* ---------------- stat tiles + counters ---------------- */
.tiles{display:flex;gap:26px;}
.tile{flex:1;background:var(--surf);border:1px solid var(--hair);border-radius:18px;padding:32px 30px 30px;}
.tile .n{font-size:68px;font-weight:800;letter-spacing:-.035em;line-height:1;color:var(--ink);
  font-variant-numeric:tabular-nums;}
.tile .n.acc{color:var(--acc);}
.tile .l{margin-top:14px;font-size:15px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);line-height:1.45;}
.tile .s{margin-top:12px;font-size:15px;color:var(--soft);line-height:1.5;}
.src{margin-top:10px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#A9B0AA;font-weight:700;}

/* bar chart */
.bars{display:flex;flex-direction:column;gap:20px;margin-top:8px;}
.barrow{display:flex;align-items:center;gap:22px;}
.barrow .lab{width:290px;font-size:19px;font-weight:700;color:var(--ink);text-align:right;flex:none;}
.barrow .track{flex:1;height:32px;background:#E7EBE6;border-radius:6px;overflow:hidden;}
.barrow .fill{display:block;height:100%;width:0;background:var(--acc);border-radius:6px;
  transition:width var(--d-slow) var(--ease);}
.slide.on .barrow .fill{width:var(--w);transition-delay:calc(var(--bi,0) * ${MOTION.stagger.bar}ms);}
.barrow .val{flex:none;white-space:nowrap;font-size:21px;font-weight:800;color:var(--acc);
  font-variant-numeric:tabular-nums;}

/* ---------------- the phone ---------------- */
.phone{
  position:relative;display:inline-block;border-radius:40px;padding:5px;flex:none;
  background:linear-gradient(148deg,#9AA2A9 0%,#6E767E 9%,#454C54 26%,#3A4149 50%,#454C54 74%,#6E767E 91%,#9AA2A9 100%);
  box-shadow:0 22px 50px rgba(16,22,25,.20);
}
.phone .screen{
  position:relative;height:var(--ph,620px);aspect-ratio:1170/2532;
  border-radius:36px;overflow:hidden;background:var(--bg);
}
.phone .island{position:absolute;top:10px;left:50%;transform:translateX(-50%);
  width:29%;height:26px;border-radius:14px;background:#080A0D;z-index:9;}
.phone::before{content:'';position:absolute;left:-2.5px;top:16%;width:2.5px;height:3.2%;
  border-radius:2px;background:#7B838B;box-shadow:0 26px 0 #7B838B,0 60px 0 #7B838B;}
.phone::after{content:'';position:absolute;right:-2.5px;top:22%;width:2.5px;height:7%;
  border-radius:2px;background:#7B838B;}
.phone img{width:100%;height:100%;object-fit:cover;object-position:top;display:block;}

/* status bar drawn to match the captures */
.sbar{position:absolute;top:0;left:0;right:0;height:52px;display:flex;align-items:center;
  justify-content:space-between;padding:16px 26px 0;font-size:15px;font-weight:700;z-index:8;color:var(--ink);}
.sbar .sig{display:flex;gap:4px;align-items:center;opacity:.9;}
.sbar .sig i{display:block;width:4px;background:var(--ink);border-radius:1px;}
.sbar .bat{width:26px;height:13px;border:1.5px solid var(--ink);border-radius:4px;position:relative;opacity:.9;}
.sbar .bat::after{content:'';position:absolute;inset:2px;right:auto;width:60%;background:var(--ink);border-radius:2px;}

/* app chrome */
.ascreen{position:absolute;inset:0;display:flex;flex-direction:column;background:var(--bg);}
.ahead{padding:62px 22px 10px;}
.ahead .t{font-size:23px;font-weight:800;letter-spacing:-.02em;}
.ahead .m{margin-top:5px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);}
.mixbar{display:flex;height:5px;border-radius:3px;overflow:hidden;margin:12px 0 0;}
.mixbar i{display:block;height:100%;}
.abody{flex:1;overflow:hidden;position:relative;padding:14px 18px 8px;}
.scroller{position:absolute;left:18px;right:18px;top:14px;transition:transform var(--d-epic) var(--ease);}

/* tab bar, real labels */
.tabs{display:flex;border-top:1px solid var(--hair);background:var(--surf);padding:9px 6px 16px;}
.tabs div{flex:1;text-align:center;font-size:10px;font-weight:600;color:var(--mute);}
.tabs div.on{color:var(--acc);font-weight:800;}
.tabs div b{display:block;width:19px;height:19px;margin:0 auto 4px;}
.tabs div b svg{display:block;width:19px;height:19px;}

/* ---------------- bubbles (geometry ported from the reader) ---------------- */
.turn{margin-bottom:9px;}
.turn.tail{margin-top:14px;}
.turn:first-child{margin-top:0;}
.speaker{font-size:9.5px;font-weight:800;letter-spacing:.17em;text-transform:uppercase;margin-bottom:5px;}
.turn.r .speaker{text-align:right;}
.bubble{max-width:90%;border-radius:15px;padding:10px 13px;border:1px solid transparent;}
.turn.l .bubble{margin-right:auto;}
.turn.r .bubble{margin-left:auto;}
.turn.l.tail .bubble{border-top-left-radius:5px;}
.turn.r.tail .bubble{border-top-right-radius:5px;}
.turn.black .speaker{color:var(--k-black);} .turn.black .bubble{background:var(--f-black);color:var(--k-black);border-color:var(--e-black);}
.turn.red   .speaker{color:var(--k-red);}   .turn.red   .bubble{background:var(--f-red);color:var(--k-red);border-color:var(--e-red);}
.turn.green .speaker{color:var(--k-green);} .turn.green .bubble{background:var(--f-green);color:var(--k-green);border-color:var(--e-green);}
.turn.blue  .speaker{color:var(--k-blue);}  .turn.blue  .bubble{background:var(--f-blue);color:var(--k-blue);border-color:var(--e-blue);}
.para{font-family:var(--book);font-size:13.5px;line-height:1.46;}
.para+.para{margin-top:6px;}
.v{font-family:var(--sans);font-size:9px;font-weight:700;opacity:.5;vertical-align:.5em;line-height:0;padding-right:1px;}
.nd{font-variant:small-caps;letter-spacing:.02em;}

/* turns arrive one at a time, at the app's own stagger */
.turn.pend{opacity:0;transform:translateY(10px);}
.turn.in{opacity:1;transform:none;
  transition:opacity var(--d-base) var(--ease),transform var(--d-base) var(--ease);}

/* ---------------- colour key + picker ---------------- */
.keys{display:flex;flex-direction:column;gap:14px;}
.key{display:flex;align-items:center;gap:20px;border-radius:14px;padding:20px 26px;}
.key .dot{width:26px;height:26px;border-radius:50%;flex:none;}
.key .who{font-size:26px;font-weight:800;letter-spacing:-.015em;}
.key .what{margin-left:auto;font-size:19px;color:var(--soft);}
.key .n{font-size:17px;font-weight:800;padding-left:22px;margin-left:22px;border-left:1px solid currentColor;opacity:.55;width:132px;text-align:right;}
.k-black{background:#EDF0EC;color:var(--k-black);} .k-red{background:var(--f-red);color:var(--k-red);}
.k-green{background:var(--f-green);color:var(--k-green);} .k-blue{background:var(--f-blue);color:var(--k-blue);}

/* the in-app four-part picker */
.picker{display:flex;align-items:center;gap:7px;background:var(--surf);border:1px solid var(--hair);
  border-radius:13px;padding:9px;}
.picker .sw{width:36px;height:36px;border-radius:9px;border:1.8px solid;cursor:default;
  transition:transform var(--d-instant) var(--ease),box-shadow var(--d-instant) var(--ease);}
.picker .sw.pick{transform:scale(1.1);box-shadow:0 0 0 3px rgba(14,107,76,.22);}
.picker .cnt{margin-left:auto;font-size:11px;font-weight:800;letter-spacing:.1em;color:var(--mute);padding-right:6px;}

/* ---------------- cards / steps / plans ---------------- */
.cards{display:flex;gap:24px;}
.card{flex:1;background:var(--surf);border:1px solid var(--hair);border-radius:18px;padding:30px 28px;}
.card.lead{background:var(--f-green);border-color:var(--e-green);}
.card .tag{font-size:12px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--mute);}
.card.lead .tag{color:var(--k-green);}
.card h3{margin-top:10px;}
.card.lead h3{color:var(--k-green);}
.card p{margin-top:12px;font-size:18px;line-height:1.5;color:var(--soft);}
.card ol{margin-top:16px;padding-left:0;list-style:none;counter-reset:q;}
.card ol li{position:relative;padding-left:26px;margin-bottom:11px;font-family:var(--book);font-size:17px;line-height:1.4;color:var(--ink);}
.card ol li::before{counter-increment:q;content:counter(q);position:absolute;left:0;top:1px;
  font-family:var(--sans);font-size:12px;font-weight:800;color:var(--mute);}

.steps{list-style:none;counter-reset:s;}
.steps li{position:relative;padding-left:64px;margin-bottom:26px;font-size:22px;line-height:1.5;color:var(--soft);}
.steps li b{color:var(--ink);font-weight:700;}
.steps li::before{counter-increment:s;content:counter(s);position:absolute;left:0;top:-3px;
  width:42px;height:42px;border-radius:50%;background:var(--ink);color:#fff;
  font-size:19px;font-weight:800;display:flex;align-items:center;justify-content:center;}

.plan{background:var(--surf);border:1px solid var(--hair);border-radius:20px;padding:34px 34px 30px;flex:1;}
.plan .ph{font-size:13px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--acc);}
.plan h3{margin-top:12px;font-size:40px;letter-spacing:-.03em;}
.plan .cnt{margin-top:20px;display:flex;align-items:baseline;gap:12px;}
.plan .cnt b{font-size:64px;font-weight:800;letter-spacing:-.04em;color:var(--acc);line-height:1;font-variant-numeric:tabular-nums;}
.plan .cnt span{font-size:15px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);}
.plan p{margin-top:18px;font-size:18px;line-height:1.52;color:var(--soft);}
.plan .fit{margin-top:20px;padding-top:18px;border-top:1px solid var(--hair);font-size:17px;color:var(--ink);font-weight:700;}

/* ---------------- big moment / instruction slides ---------------- */
.slide.dark{background:var(--deep);color:var(--cream);}
.slide.dark h1,.slide.dark h2{color:var(--cream);}
.slide.dark h2 em,.slide.dark h1 em{color:#8FE3C0;}
.slide.dark .lede{color:rgba(242,234,224,.82);}
.slide.dark .lede b{color:var(--cream);}
.slide.dark .eyebrow{color:rgba(242,234,224,.55);}
.slide.dark .sec i{background:rgba(242,234,224,.22);}
.slide.dark .steps li{color:rgba(242,234,224,.85);}
.slide.dark .steps li b{color:var(--cream);}
.slide.dark .steps li::before{background:#8FE3C0;color:var(--deep);}
.slide.dark .hair{background:rgba(242,234,224,.22);}

/* ---------------- QR ---------------- */
.qrs{display:flex;gap:56px;}
.qrbox{text-align:center;}
.qrbox .q{width:236px;height:236px;background:#fff;border-radius:16px;padding:14px;}
.qrbox .q svg{width:100%;height:100%;display:block;}
.qrbox .n{margin-top:18px;font-size:19px;font-weight:800;letter-spacing:.04em;}
.qrbox .u{margin-top:7px;font-size:14px;color:var(--mute);}
.slide.dark .qrbox .u{color:rgba(242,234,224,.62);}

/* ---------------- the precedent grid ---------------- */
.precedent{border-top:1px solid var(--hair);}
.precedent .ph,.precedent .pr,.precedent .pf{display:grid;grid-template-columns:186px 1fr 1fr;gap:34px;}
.precedent .ph{padding:14px 0 12px;border-bottom:1px solid var(--hair);}
.precedent .ph span{font-size:13px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--acc);}
.precedent .pr{padding:16px 0;border-bottom:1px solid var(--rule-soft);align-items:start;}
.precedent .bt{font-size:15px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--mute);padding-top:2px;}
.precedent .pc{font-size:18px;line-height:1.46;color:var(--soft);}
.precedent .pf{padding:13px 0 0;}
.precedent .pf span{font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#A9B0AA;}

/* ---------------- runsheet ---------------- */
.run{display:flex;flex-direction:column;gap:0;}
.run .r{display:flex;align-items:baseline;gap:26px;padding:11px 0;border-bottom:1px solid var(--hair);}
.run .r:last-child{border-bottom:0;}
.run .tm{width:128px;font-size:17px;font-weight:800;letter-spacing:.06em;color:var(--acc);font-variant-numeric:tabular-nums;flex:none;}
.run .ti{font-size:22px;font-weight:700;color:var(--ink);}
.run .no{margin-left:auto;font-size:14px;color:var(--mute);}
.run .r.now{background:var(--f-green);margin:0 -18px;padding-left:18px;padding-right:18px;border-radius:10px;}

@media (prefers-reduced-motion: reduce){
  *{animation-duration:.01ms!important;transition-duration:.01ms!important;}
}
`;
