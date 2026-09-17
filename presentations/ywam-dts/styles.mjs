import { INK, MOTION } from './data.mjs';
import { theme } from './theme.mjs';

// The deck engine shell, per
// sphere-worldview-corpus/.claude/skills/nb-presentation/assets/deck-template.html
const engine = `
html,body{width:100%;height:100%;overflow:hidden;background:var(--bg);color:var(--ink);
  font-family:var(--body);-webkit-font-smoothing:antialiased}

/* --- entry cover ------------------------------------------------------- */
#entry{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;
  background:var(--surface);cursor:pointer;overflow:hidden;
  transition:opacity .8s var(--sharp),visibility .8s}
#entry.out{opacity:0;visibility:hidden;pointer-events:none}
#entry::before{content:"";position:absolute;inset:0;
  background:linear-gradient(135deg,#1a1520,#0f1014 50%,#101820)}
#entry::after{content:"";position:absolute;inset:0;
  background:radial-gradient(70% 60% at 50% 82%,rgba(124,204,30,.13),transparent 62%)}
.entry-inner{position:relative;z-index:2;text-align:center;max-width:1120px;padding:2rem;
  animation:rise .9s var(--sharp) both}
.entry-label{font-family:var(--mono);font-size:.7rem;letter-spacing:.28em;text-transform:uppercase;
  color:var(--lime);margin-bottom:1.8rem}
.entry-duration{display:inline-flex;align-items:center;gap:.5rem;margin-bottom:1.7rem;
  padding:.45rem 1rem;border-radius:999px;border:1px solid var(--fog);background:rgba(15,16,20,.5);
  font-family:var(--mono);font-size:.62rem;font-weight:500;letter-spacing:.16em;
  text-transform:uppercase;color:var(--gold-l)}
.entry-duration .dot{width:6px;height:6px;border-radius:50%;background:var(--red)}
.entry-title{font-family:var(--display);font-size:clamp(2.7rem,6.6vw,5.4rem);font-weight:400;
  line-height:1.03;letter-spacing:-.028em;color:var(--ink)}
.entry-title em{font-family:var(--italic);font-style:italic;color:var(--gold-l);font-weight:400}
.entry-sub{max-width:620px;margin:1.5rem auto 2.2rem;color:var(--mid);
  font-size:clamp(.94rem,1.25vw,1.08rem);line-height:1.75}
.entry-cta{display:inline-flex;align-items:center;gap:.7rem;border:1px solid var(--fog);
  border-radius:999px;padding:.85rem 1.5rem;background:rgba(15,16,20,.58);color:var(--ink);
  font-family:var(--mono);font-size:.7rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase}
.entry-author{position:absolute;left:0;right:0;bottom:2rem;text-align:center;font-family:var(--mono);
  font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
@keyframes rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}

/* --- stage ------------------------------------------------------------- */
#deck{position:relative;width:100vw;height:100vh;overflow:hidden;background:var(--surface)}
.slide{position:absolute;inset:0;opacity:0;visibility:hidden;pointer-events:none;
  transition:opacity .48s var(--sharp);z-index:1}
.slide.active{opacity:1;visibility:visible;pointer-events:auto;z-index:2}
.sl{position:relative;width:100%;height:100%;overflow:hidden;background:var(--surface)}
.sl-pad{height:100%;padding:clamp(2rem,4.4vw,4.4rem) clamp(2.2rem,5vw,5.4rem) clamp(3.4rem,5vw,4.6rem);
  display:flex;flex-direction:column;justify-content:center}
.sl-pad.top{justify-content:flex-start;padding-top:clamp(2.6rem,5vw,4.6rem)}
.sl-split{height:100%;display:grid;grid-template-columns:1fr minmax(300px,38%);
  gap:clamp(1.6rem,3.4vw,3.4rem);align-items:center;
  padding:clamp(2rem,4.4vw,4.4rem) clamp(2.2rem,5vw,5.4rem) clamp(3.4rem,5vw,4.6rem)}
.sl-split .stack{display:flex;flex-direction:column;justify-content:center;min-width:0}
.sl-split .dev{display:flex;align-items:center;justify-content:center}
.sl-deep{background:linear-gradient(160deg,#11141b,#0f1014)}
.discussion{background:linear-gradient(160deg,#11141b,#0f1014);height:100%;
  padding:clamp(2.4rem,5vw,5.2rem) clamp(2.2rem,5vw,5.4rem) clamp(3.4rem,5vw,4.6rem);
  display:flex;flex-direction:column;justify-content:center}
.disc-label{font-family:var(--mono);letter-spacing:.24em;text-transform:uppercase;color:var(--lime);
  font-size:.74rem;font-weight:500;margin-bottom:1rem}

/* --- chrome ------------------------------------------------------------ */
.slide-foot{position:absolute;left:clamp(1.6rem,3vw,3rem);right:clamp(1.6rem,3vw,3rem);
  bottom:1.05rem;display:flex;justify-content:space-between;gap:1rem;
  color:var(--dim);font-family:var(--mono);font-size:.62rem;font-weight:500;letter-spacing:.14em;
  text-transform:uppercase;z-index:4;pointer-events:none}
.progress{position:fixed;left:0;right:0;bottom:0;height:4px;background:rgba(255,255,255,.08);z-index:20}
.progress span{display:block;height:100%;width:0;
  background:linear-gradient(90deg,var(--green),var(--lime));transition:width .35s var(--sharp)}
.nav{position:fixed;right:1rem;top:50%;z-index:22;display:flex;flex-direction:column;gap:.5rem;
  transform:translateY(-50%)}
.nav button{width:38px;height:38px;border-radius:50%;border:1px solid var(--fog);
  background:rgba(15,16,20,.65);color:var(--ink);cursor:pointer;backdrop-filter:blur(8px)}
.nav button:hover{border-color:var(--gold);color:var(--gold)}
#clock{position:fixed;right:1rem;top:1rem;z-index:22;font-family:var(--mono);font-size:.78rem;
  font-weight:500;letter-spacing:.1em;color:var(--dim);border:1px solid var(--fog);border-radius:999px;
  padding:.4rem .8rem;background:rgba(15,16,20,.65)}
#clock.run{color:var(--lime);border-color:rgba(124,204,30,.5)}
#notes{position:fixed;left:0;right:0;bottom:0;background:#07080B;color:var(--ink);
  padding:.9rem clamp(1.6rem,3vw,3rem);font-size:.92rem;line-height:1.55;display:none;z-index:40;
  border-top:1px solid var(--fog)}
.click-hint{font-family:var(--mono);font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--lime);margin-top:.6rem;opacity:.5;transition:opacity .2s}
.click-hint::before{content:"";display:inline-block;width:5px;height:5px;border-radius:50%;
  background:currentColor;margin-right:.45em;vertical-align:.12em}
.stat-card:hover .click-hint{opacity:1}
.stat-card{border-color:rgba(124,204,30,.22)}
`;

// Components this deck needs beyond the house set: the live phone, the ported
// reader, the colour key, the two plans, the precedent grid.
const parts = `
:root{
  --k-black:${INK.black.bar};  --f-black:${INK.black.fill};  --e-black:${INK.black.edge};
  --k-red:${INK.red.bar};      --f-red:${INK.red.fill};      --e-red:${INK.red.edge};
  --k-green:${INK.green.bar};  --f-green:${INK.green.fill};  --e-green:${INK.green.edge};
  --k-blue:${INK.blue.bar};    --f-blue:${INK.blue.fill};    --e-blue:${INK.blue.edge};
  --book:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Charter,Georgia,serif;
  --ease:${MOTION.ease};
  --d-instant:${MOTION.dur.instant}ms; --d-quick:${MOTION.dur.quick}ms;
  --d-base:${MOTION.dur.base}ms; --d-slow:${MOTION.dur.slow}ms; --d-epic:${MOTION.dur.epic}ms;
}

/* ---- the phone. The app is a light app, so the screen stays light on the
       dark stage. Everything inside .screen uses the app's own tokens, and
       every size is a share of the screen width (app px / 2.865). ---- */
.phone{position:relative;display:inline-block;border-radius:40px;padding:5px;flex:none;
  background:linear-gradient(148deg,#9AA2A9 0%,#6E767E 9%,#454C54 26%,#3A4149 50%,#454C54 74%,#6E767E 91%,#9AA2A9 100%);
  box-shadow:0 34px 90px -20px rgba(0,0,0,.85)}
.phone .screen{position:relative;height:var(--ph,min(72vh,660px));aspect-ratio:1170/2532;
  border-radius:36px;overflow:hidden;background:#F3F5F2;color:#101619;
  font-family:'Inter',system-ui,sans-serif;container-type:inline-size}
.phone .island{position:absolute;top:3.5%;left:50%;transform:translateX(-50%);
  width:29%;height:9.1cqw;border-radius:14px;background:#080A0D;z-index:9}
.phone::before{content:'';position:absolute;left:-2.5px;top:16%;width:2.5px;height:3.2%;
  border-radius:2px;background:#7B838B;box-shadow:0 26px 0 #7B838B,0 60px 0 #7B838B}
.phone::after{content:'';position:absolute;right:-2.5px;top:22%;width:2.5px;height:7%;
  border-radius:2px;background:#7B838B}

.sbar{position:absolute;top:0;left:0;right:0;height:18.2cqw;display:flex;align-items:center;
  justify-content:space-between;padding:5.6cqw 9.1cqw 0;font-size:5.2cqw;font-weight:700;z-index:8}
.sbar .sig{display:flex;gap:1.4cqw;align-items:center;opacity:.9}
.sbar .sig i{display:block;width:1.4cqw;background:#101619;border-radius:1px}
.sbar .bat{width:9.1cqw;height:4.5cqw;border:1.5px solid #101619;border-radius:1.4cqw;
  position:relative;opacity:.9}
.sbar .bat::after{content:'';position:absolute;inset:1.5px;right:auto;width:60%;
  background:#101619;border-radius:1px}

.ascreen{position:absolute;inset:0;display:flex;flex-direction:column;background:#F3F5F2}
.ahead{padding:21.6% 7.7% 3.5%}
.ahead .t{font-size:8cqw;font-weight:800;letter-spacing:-.02em;line-height:1.15}
.ahead .m{margin-top:1.7%;font-size:3.8cqw;font-weight:700;letter-spacing:.12em;
  text-transform:uppercase;color:#5E6B70}
.mixbar{display:flex;height:1.8cqw;border-radius:3px;overflow:hidden;margin:4.2% 0 0}
.mixbar i{display:block;height:100%}
.abody{flex:1;overflow:hidden;position:relative;padding:4.9% 6.3% 2.8%}
.scroller{position:absolute;left:6.3%;right:6.3%;top:4.9%;
  transition:transform var(--d-epic) var(--ease)}
.tabs{display:flex;border-top:1px solid #DFE5E0;background:#FFF;padding:3.1% 2.1% 5.6%}
.tabs div{flex:1;text-align:center;font-size:3.5cqw;font-weight:600;color:#5E6B70}
.tabs div.on{color:#0E6B4C;font-weight:800}
.tabs div b{display:block;width:6.6cqw;height:6.6cqw;margin:0 auto 1.4cqw}
.tabs div b svg{display:block;width:100%;height:100%}

/* ---- bubbles, geometry ported from components/Bible/* ------------------ */
.turn{margin-bottom:3.1%}
.turn.tail{margin-top:4.9%}
.turn:first-child{margin-top:0}
.speaker{font-size:3.3cqw;font-weight:800;letter-spacing:.16em;text-transform:uppercase;
  margin-bottom:1.7%}
.turn.r .speaker{text-align:right}
.bubble{max-width:90%;border-radius:5.2cqw;padding:3.5% 4.5%;border:1px solid transparent}
.turn.l .bubble{margin-right:auto}
.turn.r .bubble{margin-left:auto}
.turn.l.tail .bubble{border-top-left-radius:1.7cqw}
.turn.r.tail .bubble{border-top-right-radius:1.7cqw}
.turn.black .speaker{color:var(--k-black)}
.turn.black .bubble{background:var(--f-black);color:var(--k-black);border-color:var(--e-black)}
.turn.red .speaker{color:var(--k-red)}
.turn.red .bubble{background:var(--f-red);color:var(--k-red);border-color:var(--e-red)}
.turn.green .speaker{color:var(--k-green)}
.turn.green .bubble{background:var(--f-green);color:var(--k-green);border-color:var(--e-green)}
.turn.blue .speaker{color:var(--k-blue)}
.turn.blue .bubble{background:var(--f-blue);color:var(--k-blue);border-color:var(--e-blue)}
.para{font-family:var(--book);font-size:4.7cqw;line-height:1.46}
.para+.para{margin-top:2.1%}
.v{font-family:'Inter',sans-serif;font-size:3.1cqw;font-weight:700;opacity:.5;vertical-align:.5em;
  line-height:0;padding-right:1px}
.nd{font-variant:small-caps;letter-spacing:.02em}
.turn.pend{opacity:0;transform:translateY(10px)}
.turn.in{opacity:1;transform:none;
  transition:opacity var(--d-base) var(--ease),transform var(--d-base) var(--ease)}

/* in-app pieces the mockups need */
.picker{display:flex;align-items:center;gap:2.4%;background:#FFF;border:1px solid #DFE5E0;
  border-radius:4.5cqw;padding:3.1%}
.picker .sw{width:12.6cqw;height:12.6cqw;border-radius:3.1cqw;border:1.8px solid;
  transition:transform var(--d-instant) var(--ease),box-shadow var(--d-instant) var(--ease)}
.picker .sw.pick{transform:scale(1.1);box-shadow:0 0 0 3px rgba(14,107,76,.22)}
.picker .cnt{margin-left:auto;white-space:nowrap;font-size:3.8cqw;font-weight:800;
  letter-spacing:.1em;color:#5E6B70;padding-right:2%}
.castrow{display:flex;align-items:center;gap:3.5%;padding:3.8% 0;border-bottom:1px solid #DFE5E0}
.castrow .cd{width:6.3cqw;height:6.3cqw;border-radius:50%;flex:none}
.castrow .cn{font-size:4.5cqw;font-weight:700;line-height:1.25}
.castrow .cw{margin-left:auto;font-size:3.8cqw;color:#5E6B70;font-variant-numeric:tabular-nums}
.segs{display:flex;gap:1.7%;margin:0 0 4.9%}
.segs div{flex:1;text-align:center;font-size:3.8cqw;font-weight:700;padding:2.8% 1.4%;
  border-radius:3.1cqw;border:1px solid #DFE5E0;background:#FFF;color:#5E6B70}
.segs div.on{background:#E9F4EF;border-color:#C0D9D0;color:#0E6B4C}
.qlist{list-style:none}
.qlist li{position:relative;padding-left:6.3%;margin-bottom:4.5%;font-size:4.5cqw;line-height:1.4}
.qlist li::before{content:'';position:absolute;left:0;top:2.1cqw;width:2.1cqw;height:2.1cqw;
  border-radius:50%;background:#0E6B4C}
.pcard{border:1px solid #DFE5E0;border-radius:4.5cqw;background:#FFF;padding:4.5% 4.5%;
  margin-bottom:3.8%}
.pcard .pt{font-size:3.1cqw;font-weight:800;letter-spacing:.14em;text-transform:uppercase;
  color:#0E6B4C}
.pcard .ph{margin-top:1.7%;font-size:5.2cqw;font-weight:800;letter-spacing:-.01em}
.pcard .pb{margin-top:1.7%;font-size:3.8cqw;line-height:1.4;color:#5E6B70}
.pcard .pp{margin-top:3.5%;height:1.4cqw;border-radius:3px;background:#DFE5E0;overflow:hidden}
.pcard .pp i{display:block;height:100%;background:#0E6B4C}
.pcard .pn{margin-top:2.1%;font-size:3.1cqw;font-weight:700;letter-spacing:.12em;
  text-transform:uppercase;color:#5E6B70}

/* ---- deck-side components --------------------------------------------- */
.keys{display:flex;flex-direction:column;gap:.7rem}
.key{display:flex;align-items:center;gap:1.2rem;border-radius:14px;padding:.95rem 1.3rem;
  border:1px solid var(--fog);background:rgba(255,255,255,.035)}
.key .dot{width:18px;height:18px;border-radius:50%;flex:none}
.key .who{font-family:var(--display);font-size:clamp(1.15rem,1.9vw,1.6rem);font-weight:600}
.key .what{margin-left:auto;color:var(--mid);font-size:clamp(.82rem,1.05vw,.98rem)}
.key .n{font-family:var(--mono);font-size:.76rem;color:var(--gold-l);padding-left:1.1rem;
  margin-left:1.1rem;border-left:1px solid var(--fog);width:96px;text-align:right}

.steps{list-style:none;counter-reset:s;display:grid;gap:.95rem}
.steps li{position:relative;padding-left:3.1rem;font-size:clamp(.98rem,1.3vw,1.16rem);
  line-height:1.58;color:var(--mid)}
.steps li b{color:var(--ink);font-weight:600}
.steps li::before{counter-increment:s;content:counter(s);position:absolute;left:0;top:-.1rem;
  width:2.05rem;height:2.05rem;border-radius:50%;border:1px solid rgba(124,204,30,.45);
  color:var(--lime);font-family:var(--mono);font-size:.82rem;display:flex;align-items:center;
  justify-content:center}

.plan{background:rgba(255,255,255,.035);border:1px solid var(--fog);border-radius:16px;
  padding:clamp(1.1rem,2vw,1.7rem)}
.plan .ph{font-family:var(--mono);font-size:.66rem;font-weight:500;letter-spacing:.2em;
  text-transform:uppercase;color:var(--lime)}
.plan h3{font-family:var(--display);margin-top:.55rem;font-size:clamp(1.4rem,2.5vw,2.1rem);
  font-weight:600;letter-spacing:-.02em}
.plan .cnt{margin-top:.8rem;display:flex;align-items:baseline;gap:.55rem}
.plan .cnt b{font-family:var(--display);font-size:clamp(2.3rem,4.6vw,3.6rem);font-weight:700;
  letter-spacing:-.03em;color:var(--gold-l);line-height:1;font-variant-numeric:tabular-nums}
.plan .cnt span{font-family:var(--mono);font-size:.64rem;letter-spacing:.16em;
  text-transform:uppercase;color:var(--dim)}
.plan p{margin-top:.75rem;color:var(--mid);line-height:1.56;font-size:clamp(.88rem,1.1vw,1rem)}
.plan .fit{margin-top:.85rem;padding-top:.75rem;border-top:1px solid var(--fog);
  color:var(--ink);font-size:clamp(.88rem,1.1vw,1rem);line-height:1.5}

/* the Josiah / Nehemiah precedent grid */
.precedent{display:grid;grid-template-columns:minmax(120px,.7fr) 1fr 1fr;
  column-gap:clamp(1.1rem,2.4vw,2.4rem);row-gap:0;margin-top:1.2rem;align-items:start}
.precedent .hd{font-family:var(--mono);font-size:.66rem;font-weight:500;letter-spacing:.2em;
  text-transform:uppercase;color:var(--gold-l);padding:0 0 .7rem}
.precedent .bt{font-family:var(--mono);font-size:.63rem;font-weight:500;letter-spacing:.16em;
  text-transform:uppercase;color:var(--dim);padding:.85rem 0;
  border-top:1px solid var(--fog);line-height:1.45}
.precedent .cl{color:var(--mid);font-size:clamp(.88rem,1.12vw,1.02rem);line-height:1.52;
  padding:.85rem 0;border-top:1px solid var(--fog)}
.precedent .ref{font-family:var(--mono);font-size:.62rem;letter-spacing:.12em;
  text-transform:uppercase;color:var(--dim);padding:.7rem 0;border-top:1px solid var(--fog)}

/* the running order on the opening slide */
.run{display:grid;gap:0}
.run .r{display:grid;grid-template-columns:5.5rem 1fr auto;align-items:baseline;gap:1.1rem;
  padding:.62rem .8rem;border-radius:9px}
.run .r .tm{font-family:var(--mono);font-size:.72rem;letter-spacing:.1em;color:var(--dim)}
.run .r .ti{font-family:var(--display);font-size:clamp(1.02rem,1.5vw,1.28rem);color:var(--ink)}
.run .r .no{color:var(--dim);font-size:clamp(.78rem,1vw,.9rem)}
.run .r.now{background:rgba(124,204,30,.09);border:1px solid rgba(124,204,30,.3)}
.run .r.now .ti{color:var(--lime)}
.run .r.now .tm,.run .r.now .no{color:rgba(124,204,30,.75)}

/* the format lineage strip */
.line{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--fog);
  margin-top:1.3rem}
.line>div{padding:.95rem 1rem;border-right:1px solid var(--fog)}
.line>div:last-child{border-right:0;background:rgba(124,204,30,.08)}
.line .y{font-family:var(--mono);font-size:.66rem;letter-spacing:.14em;color:var(--dim)}
.line .w{font-family:var(--display);margin-top:.3rem;font-size:clamp(1rem,1.5vw,1.3rem);
  font-weight:600;color:var(--ink)}
.line>div:last-child .y,.line>div:last-child .w{color:var(--lime)}

.qr{display:flex;gap:clamp(1.2rem,2.6vw,2.4rem);align-items:flex-start}
.qrbox{text-align:center}
.qrbox .q{width:clamp(120px,15vw,168px);height:clamp(120px,15vw,168px);background:#fff;
  border-radius:14px;padding:9px}
.qrbox .q svg{width:100%;height:100%;display:block}
.qrbox .n{margin-top:.6rem;font-family:var(--display);font-size:1rem;font-weight:600}
.qrbox .u{margin-top:.15rem;font-family:var(--mono);font-size:.58rem;letter-spacing:.06em;
  color:var(--dim)}

.src-note{font-family:var(--mono);font-size:.62rem;font-weight:500;letter-spacing:.12em;
  text-transform:uppercase;color:var(--dim);line-height:1.6}
.hair{height:1px;background:var(--fog)}
.mono-em{font-family:var(--mono);font-size:.88em;color:var(--gold-l)}

@media(max-width:900px){
  .sl-split{grid-template-columns:1fr}
  .sl-split .dev{display:none}
  .precedent{grid-template-columns:1fr}
  .line{grid-template-columns:repeat(2,1fr)}
}
`;

const projection = `
/* ===========================================================================
   PROJECTION SCALE
   This deck is shared to a projector in front of about 150 people, so the back
   row sets the minimum. The house ramp is sized for a laptop and is too small.

   Everything here is one unit: --u is a hundredth of the stage, taken from
   whichever axis is tighter. Nothing carries a rem cap, because a cap makes
   type proportionally larger on a small screen than on a big one, which is how
   a slide that fits at 1600 overflows at 1366. With no caps the whole stage
   scales together, so if it fits once it fits everywhere.

   1u == 16px on a 1600-wide screen, so these numbers read like rem.
   theme.mjs stays untouched; this is an override on top of it.
   =========================================================================== */
:root{--u:min(1vw,1.78vh)}

.t-label{font-size:calc(1.05 * var(--u));letter-spacing:.22em;margin-bottom:calc(.9 * var(--u))}
.t-h1{font-size:calc(6.2 * var(--u));line-height:1.02}
.t-h2{font-size:calc(5.4 * var(--u));line-height:1.05}
.t-h3{font-size:calc(4 * var(--u));line-height:1.08}
.t-body{font-size:calc(1.8 * var(--u));line-height:1.55;max-width:calc(74 * var(--u))}
.t-body-lg{font-size:calc(2.2 * var(--u));line-height:1.44;max-width:calc(80 * var(--u))}
.callout{font-size:calc(1.68 * var(--u));line-height:1.44;
  padding:calc(1.45 * var(--u)) calc(1.75 * var(--u));border-left-width:calc(.3 * var(--u))}
.rule{width:calc(3.5 * var(--u));height:calc(.19 * var(--u))}
.accent{font-style:italic}

.grid{gap:calc(1.15 * var(--u))}
.card{padding:calc(1.85 * var(--u)) calc(2 * var(--u));border-radius:calc(1.1 * var(--u))}
.card h3{font-size:calc(2.3 * var(--u));margin-bottom:calc(.8 * var(--u))}
.card p{font-size:calc(1.58 * var(--u));line-height:1.44}

.stat-card{min-height:calc(18 * var(--u))}
.stat-num{font-size:calc(6.8 * var(--u));margin-bottom:calc(.7 * var(--u))}
.stat-num.small{font-size:calc(4.4 * var(--u))}
.stat-src{font-size:calc(.8 * var(--u));letter-spacing:.12em;margin-top:calc(.85 * var(--u))}
.click-hint{font-size:calc(.78 * var(--u));margin-top:calc(.6 * var(--u))}
.click-hint::before{width:calc(.32 * var(--u));height:calc(.32 * var(--u))}

.chart-wrap{gap:calc(.95 * var(--u));margin-top:calc(1.7 * var(--u))}
.bar-row{grid-template-columns:calc(16.5 * var(--u)) 1fr calc(7.5 * var(--u));
  gap:calc(1.1 * var(--u))}
.bar-label{font-size:calc(1.14 * var(--u));letter-spacing:.05em}
.bar-track{height:calc(1.65 * var(--u))}
.bar-val{font-size:calc(1.3 * var(--u))}

.steps{gap:calc(1.35 * var(--u))}
.steps li{padding-left:calc(4.2 * var(--u));font-size:calc(1.85 * var(--u));line-height:1.4}
.steps li::before{width:calc(2.95 * var(--u));height:calc(2.95 * var(--u));
  font-size:calc(1.1 * var(--u));top:calc(-.1 * var(--u))}

.keys{gap:calc(.85 * var(--u))}
.key{padding:calc(1.5 * var(--u)) calc(1.85 * var(--u));gap:calc(1.5 * var(--u));
  border-radius:calc(.9 * var(--u))}
.key .dot{width:calc(1.7 * var(--u));height:calc(1.7 * var(--u))}
.key .who{font-size:calc(2.55 * var(--u))}
.key .what{font-size:calc(1.42 * var(--u))}
.key .n{font-size:calc(1.05 * var(--u));width:calc(9.2 * var(--u));
  padding-left:calc(1.5 * var(--u));margin-left:calc(1.5 * var(--u))}

.plan{padding:calc(1.9 * var(--u));border-radius:calc(1 * var(--u))}
.plan .ph{font-size:calc(.8 * var(--u))}
.plan h3{font-size:calc(2.55 * var(--u));margin-top:calc(.5 * var(--u))}
.plan .cnt{margin-top:calc(.7 * var(--u))}
.plan .cnt b{font-size:calc(4.6 * var(--u))}
.plan .cnt span{font-size:calc(.78 * var(--u))}
.plan p{font-size:calc(1.52 * var(--u));line-height:1.4;margin-top:calc(.7 * var(--u))}
.plan .fit{font-size:calc(1.52 * var(--u));line-height:1.36;
  margin-top:calc(1 * var(--u));padding-top:calc(.95 * var(--u))}

.precedent{column-gap:calc(2.3 * var(--u))}
.precedent .hd{font-size:calc(.86 * var(--u));padding-bottom:calc(.8 * var(--u))}
.precedent .bt{font-size:calc(.86 * var(--u));padding:calc(1.15 * var(--u)) 0;letter-spacing:.14em}
.precedent .cl{font-size:calc(1.45 * var(--u));line-height:1.38;padding:calc(1.15 * var(--u)) 0}
.precedent .ref{font-size:calc(.76 * var(--u));padding:calc(.8 * var(--u)) 0}

.line{margin-top:calc(1.3 * var(--u))}
.line>div{padding:calc(1.6 * var(--u)) calc(1.3 * var(--u))}
.line .y{font-size:calc(.82 * var(--u))}
.line .w{font-size:calc(2.2 * var(--u));margin-top:calc(.3 * var(--u))}

.qr{gap:calc(2.3 * var(--u))}
.qrbox .q{width:calc(12.6 * var(--u));height:calc(12.6 * var(--u));
  border-radius:calc(.85 * var(--u));padding:calc(.55 * var(--u))}
.qrbox .n{font-size:calc(1.28 * var(--u));margin-top:calc(.7 * var(--u))}
.qrbox .u{font-size:calc(.72 * var(--u))}

.disc-label{font-size:calc(.95 * var(--u));margin-bottom:calc(1.1 * var(--u))}
.discussion .q{font-size:calc(5.4 * var(--u));line-height:1.05;max-width:none}
.src-note{font-size:calc(.8 * var(--u));letter-spacing:.1em}
.slide-foot{font-size:calc(.78 * var(--u));bottom:max(1.05rem,calc(1.1 * var(--u)));
  left:calc(2.6 * var(--u));right:calc(2.6 * var(--u))}
#clock{font-size:calc(1 * var(--u));padding:calc(.45 * var(--u)) calc(.95 * var(--u));
  top:calc(1.4 * var(--u));right:calc(1.4 * var(--u))}
#notes{font-size:calc(1.1 * var(--u))}
.nav button{width:calc(2.7 * var(--u));height:calc(2.7 * var(--u));font-size:calc(1 * var(--u))}

/* The mockup is the evidence on its slide, so it gets the height it needs. */
.phone .screen{height:min(80vh,calc(48 * var(--u)))}
.sl-split{grid-template-columns:1fr minmax(calc(20 * var(--u)),36%);gap:calc(2.6 * var(--u))}

/* Tighter margins, because the room needs the pixels more than the page does. */
.sl-pad,.sl-split,.discussion{
  padding:calc(2.9 * var(--u)) calc(3.4 * var(--u)) calc(4 * var(--u))}

/* The entry cover is read from the same seats. */
.entry-inner{max-width:calc(84 * var(--u))}
.entry-label{font-size:calc(.92 * var(--u));margin-bottom:calc(1.6 * var(--u))}
.entry-duration{font-size:calc(.78 * var(--u));margin-bottom:calc(1.5 * var(--u))}
.entry-title{font-size:calc(6.2 * var(--u))}
.entry-sub{font-size:calc(1.6 * var(--u));max-width:calc(52 * var(--u));
  margin:calc(1.5 * var(--u)) auto calc(2.1 * var(--u))}
.entry-cta{font-size:calc(.86 * var(--u));padding:calc(.95 * var(--u)) calc(1.6 * var(--u))}
.entry-author{font-size:calc(.76 * var(--u));bottom:calc(2 * var(--u))}
`;

export const css = theme + engine + parts + projection;
