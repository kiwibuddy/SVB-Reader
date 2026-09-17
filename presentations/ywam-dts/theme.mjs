// The NB house style, pasted unchanged from
//   sphere-worldview-corpus/.claude/skills/nb-presentation/assets/theme.css
// Do not edit component rules here. To re-theme, swap the :root block only.

export const theme = `
/* ============================================================================
   NB HOUSE STYLE — shared theme for all three presentation engines.
   Extracted from ai-and-you.html / broken-cisterns-keynote.html (the flagship
   decks) so every future presentation inherits one coherent visual language.

   HOW TO USE:
   - House-style build: paste this file's contents inside <style> unchanged.
   - Reference-derived build: keep every rule below EXCEPT the :root token block.
     Replace only the tokens (colours, fonts) with values sampled from the
     reference site. Because every component reads from these tokens, swapping
     the block re-themes the whole deck without touching a single component.
   ============================================================================ */

:root{
  /* --- GROUND & INK --------------------------------------------------- */
  --bg:#0F1014; --surface:#13151B; --surface-2:#1A1D24; --surface-3:#20232C;
  --ink:#F4EFE2; --white:#fff;
  --mid:rgba(244,239,226,.66); --dim:rgba(244,239,226,.42); --fog:rgba(244,239,226,.14);
  /* --- ACCENTS -------------------------------------------------------- */
  --lime:#7CCC1E; --green:#11C25C;
  --gold:#D9B25A; --gold-l:#E8C96A; --gold-xl:rgba(232,201,106,.10);
  --red:#E06A5E; --red-l:rgba(224,106,94,.12);
  --blue:#8FB8DC; --blue-l:rgba(143,184,220,.12);
  --sage:#A4C892; --sage-l:rgba(164,200,146,.12);
  --plum:#B9A1E8; --plum-l:rgba(185,161,232,.12);
  /* --- TYPE ----------------------------------------------------------- */
  --display:"Newsreader",Georgia,serif;
  --italic:"Instrument Serif",Georgia,serif;
  --body:"Inter",system-ui,sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,monospace;
  /* --- MOTION --------------------------------------------------------- */
  --sharp:cubic-bezier(.16,1,.3,1);
  --spring:cubic-bezier(.34,1.4,.64,1);
}

/* Font import to place in <head> alongside this stylesheet:
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz@0,6..72,300;0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=Instrument+Serif:ital@1&family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet"> */

*{box-sizing:border-box;margin:0;padding:0}
button{font:inherit}

/* --- TYPOGRAPHIC COMPONENTS (shared by all engines) --------------------- */
.t-label{font-family:var(--mono);font-size:clamp(.68rem,.9vw,.82rem);font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--gold-l);margin-bottom:1rem}
.t-h1,.t-h2,.t-h3{font-family:var(--display);font-weight:700;letter-spacing:-.018em;color:var(--ink)}
.t-h1{font-size:clamp(3rem,6vw,5.5rem);line-height:1.02}
.t-h2{font-size:clamp(2.4rem,5vw,4.4rem);line-height:1.08}
.t-h3{font-size:clamp(1.9rem,3.5vw,3rem);line-height:1.13}
.t-body{font-size:clamp(1rem,1.35vw,1.18rem);line-height:1.72;color:var(--mid);max-width:820px}
.t-body-lg{font-size:clamp(1.16rem,1.7vw,1.45rem);line-height:1.7;color:var(--mid);max-width:880px}
.accent{color:var(--gold-l);font-style:italic;font-weight:400}
.lime{color:var(--lime)} .red{color:var(--red)}
.rule{width:42px;height:2px;background:var(--gold);margin:1.35rem 0}

.callout{border-left:3px solid var(--gold);background:var(--gold-xl);padding:1.15rem 1.4rem;border-radius:0 10px 10px 0;color:var(--ink);font-size:clamp(.98rem,1.25vw,1.14rem);line-height:1.6}
.callout.blue{border-left-color:var(--blue);background:var(--blue-l)}
.callout.red{border-left-color:var(--red);background:var(--red-l)}
.callout.sage{border-left-color:var(--sage);background:var(--sage-l)}

/* --- LAYOUT HELPERS ---------------------------------------------------- */
.grid{display:grid;gap:1rem}
.grid-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.grid-4{grid-template-columns:repeat(4,minmax(0,1fr))}

.card{background:rgba(255,255,255,.035);border:1px solid var(--fog);border-radius:16px;padding:1.25rem;position:relative;overflow:hidden}
.card h3{font-family:var(--display);font-size:clamp(1.25rem,1.8vw,1.6rem);line-height:1.2;margin-bottom:.55rem}
.card p{color:var(--mid);line-height:1.55;font-size:clamp(.9rem,1.08vw,1rem)}

/* --- STAT CARD + ANIMATED COUNTER -------------------------------------- */
.stat-card{cursor:pointer;transition:transform .25s var(--spring),background .25s,border-color .25s;text-align:center;display:flex;flex-direction:column;justify-content:center;min-height:190px}
.stat-card:hover{transform:translateY(-4px);background:rgba(255,255,255,.06);border-color:rgba(232,201,106,.36)}
.stat-num{font-family:var(--display);font-size:clamp(2.7rem,6.4vw,5.8rem);font-weight:700;line-height:.95;color:var(--ink);margin-bottom:.65rem}
.stat-num.small{font-size:clamp(2rem,4vw,3.6rem)}
.stat-src{font-family:var(--mono);font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin-top:.75rem}
.counter{display:inline-block}

/* --- ANIMATED BAR CHART ------------------------------------------------ */
.chart-wrap{margin-top:1.4rem;display:grid;gap:.7rem}
.bar-row{display:grid;grid-template-columns:165px 1fr 72px;align-items:center;gap:.8rem}
.bar-label{font-family:var(--mono);font-size:.72rem;color:var(--mid);letter-spacing:.06em;text-transform:uppercase}
.bar-track{height:16px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;border:1px solid var(--fog)}
.bar-fill{width:0;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--green),var(--lime));transition:width 1.2s var(--sharp)}
.reveal-on .bar-fill,.active .bar-fill{width:var(--w)}
.bar-val{font-family:var(--mono);color:var(--gold-l);font-size:.78rem;text-align:right}

/* --- REVEAL ANIMATION (used by deck .active and scroll .reveal-on) ------ */
/* Wrap any element in class "a" and it fades/rises in when its parent gains
   .active (deck engine) or .reveal-on (scroll engine). Stagger with d1..d5. */
.a{opacity:0;transform:translateY(18px);transition:opacity .7s var(--sharp),transform .7s var(--sharp)}
.active .a,.reveal-on .a{opacity:1;transform:none}
.d1{transition-delay:.12s}.d2{transition-delay:.24s}.d3{transition-delay:.36s}.d4{transition-delay:.48s}.d5{transition-delay:.6s}

/* --- SOURCE-CITATION MODAL (shared) ------------------------------------ */
.overlay-modal{position:fixed;inset:0;background:rgba(7,8,11,.76);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:1.4rem;z-index:60;opacity:0;visibility:hidden;transition:.25s}
.overlay-modal.open{opacity:1;visibility:visible}
.modal{width:min(680px,100%);max-height:86vh;overflow:auto;background:var(--surface-2);border:1px solid rgba(244,239,226,.18);border-radius:20px;padding:2rem;position:relative;box-shadow:0 50px 120px -40px rgba(0,0,0,.95)}
.m-close{position:absolute;right:1rem;top:1rem;width:34px;height:34px;border-radius:50%;border:1px solid var(--fog);background:var(--surface-3);color:var(--mid);cursor:pointer}
.m-stat{font-family:var(--display);font-size:3rem;color:var(--gold);line-height:1;margin-bottom:.6rem}
.m-title{font-family:var(--display);font-size:1.6rem;font-weight:700;line-height:1.25;margin-bottom:1rem}
.m-body{color:var(--mid);line-height:1.72;white-space:pre-line}
.m-src{border-top:1px solid var(--fog);margin-top:1rem;padding-top:1rem;color:var(--dim);font-size:.82rem;line-height:1.5}
.m-src a{display:inline-block;margin-top:.65rem;color:var(--gold-l);text-decoration:none;border:1px solid rgba(217,178,90,.4);border-radius:999px;padding:.48rem .82rem;font-weight:700;font-size:.76rem}

@media(max-width:900px){
  .grid-2,.grid-3,.grid-4{grid-template-columns:1fr}
  .bar-row{grid-template-columns:1fr}.bar-val{text-align:left}
}
`;
