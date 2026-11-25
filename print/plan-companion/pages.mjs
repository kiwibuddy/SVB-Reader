// Companion booklets for the seasonal plans after Advent (Christmas, Lent):
// the Advent companion's design, driven by a plan config (see configs/).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COVERS, INK, esc, excerpt, verse } from '../advent-book/content.mjs';
import { candleStrip } from '../advent-book/art.mjs';
import { frontCoverPage } from '../advent-book/cover.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const ORDER = ['black', 'red', 'green', 'blue'];
const qr = (f) => fs.readFileSync(path.join(root, 'Marketing/print', f), 'utf8');
const folio = (mark) => `<div class="folio"><span class="mark">${esc(mark)}</span><span class="num"></span></div>`;
const page = (body, mark) => `
<section class="page">
  <div class="page-body"><div class="stack">${body}</div></div>
  ${mark ? folio(mark) : ''}
</section>`;
const paras = (list) => list.map((p) => `<p class="lede">${p}</p>`).join('');
const strip = (cfg, width) => (cfg.candles === false ? '' : candleStrip(4, { width, christ: cfg.art?.christ }));

export const cover = (c, cfg) => frontCoverPage(c, cfg.cover);

export function welcomePage(plan, cfg) {
  return page(`
    <div class="eyebrow">${esc(cfg.season)}</div>
    <h2 class="page-title">${cfg.welcome.title}</h2>
    ${paras(cfg.welcome.body)}
    <div class="facts">
      <div><b>${plan.days.length}</b><span>stories</span></div>
      <div><b>${plan.phases.length}</b><span>${esc(cfg.welcome.phaseWord)}</span></div>
      <div><b>${plan.speakers}</b><span>speaking parts</span></div>
      <div><b>0</b><span>cost</span></div>
    </div>
    <div style="margin-top:auto;display:flex;justify-content:center;">${strip(cfg, 70)}</div>
  `, 'Welcome');
}

export function voicesPage(cfg) {
  return page(`
    <div class="eyebrow">How it works</div>
    <h2 class="page-title">Four colours.<br>Four voices.</h2>
    <p class="lede">
      Every word of the Bible in the app is attributed to the voice that speaks it.
      Narration and God’s words sit on the left, people on the right, so a story
      reads like a conversation. Take a colour each and read your lines aloud.
    </p>
    <div class="keyrow" style="margin-top:5mm;">
      ${ORDER.map((c) => `<div class="keychip k-${c}"><div class="who">${COVERS[c].name}</div><div class="what">${INK[c].label}</div></div>`).join('')}
    </div>
    <div class="eyebrow" style="margin-top:6mm;">${esc(cfg.sample.label)}</div>
    <div class="sample">${excerpt(cfg.sample.seg, cfg.sample.refs)}</div>
    <p class="small-note">Every story is split into four reading parts. When a story has fewer kinds of voice, two readers share the busiest one, so four people always have a part.</p>
  `, 'How it works');
}

export function appPage(cfg) {
  return page(`
    <div class="eyebrow">Get started</div>
    <h2 class="page-title">${cfg.app.title}</h2>
    <ol class="steps">
      <li><b>Download SourceView Together.</b> It’s free on the App Store and Google Play, with no account or sign-in.</li>
      <li>${cfg.app.find}</li>
      <li><b>Gather your readers and take a colour each.</b> Open the day’s story and read it aloud, all the way through.</li>
      <li><b>Talk about it.</b> Questions for families, schools and small groups follow every story in the app, and the family questions are in this booklet too.</li>
    </ol>
    <div class="qrs big">
      <div><div class="qr">${qr('qr-app-store.svg')}</div><span>App Store</span></div>
      <div><div class="qr">${qr('qr-google-play.svg')}</div><span>Google Play</span></div>
    </div>
    <div class="readnote" style="margin-top:auto;">${cfg.app.note}</div>
  `, 'Get started');
}

export function shapePage(plan, cfg) {
  return page(`
    <div class="eyebrow">The shape of the plan</div>
    <h2 class="page-title">${cfg.shape.title}</h2>
    <div class="weeks-list">
      ${plan.phases.map((w) => {
        const days = plan.days.filter((d) => d.week.key === w.key);
        const span = days.length > 1 ? `Days ${days[0].n}–${days[days.length - 1].n} · ${days[0].date.short} to ${days[days.length - 1].date.short}` : `Day ${days[0].n} · ${days[0].date.short}`;
        return `<div class="wk" style="--wk:${w.color};--wk-tint:${w.tint}">
          <div class="wk-name">${esc(w.name)}</div>
          <div class="wk-line">${esc(w.line)}</div>
          <div class="wk-days">${span}</div>
        </div>`;
      }).join('')}
    </div>
    <p class="lede" style="font-size:9pt;margin-top:auto;">${cfg.shape.note}</p>
  `, 'The plan');
}

// A table of dates: e.g. the feasts of the twelve days.
export function tablePage(t) {
  return page(`
    <div class="eyebrow">${esc(t.eyebrow)}</div>
    <h2 class="page-title">${t.title}</h2>
    <div class="feasts">
      ${t.rows.map(([d, n, b]) => `<div class="feast"><div class="f-date">${d}</div><div><div class="f-name">${n}</div><div class="f-body">${b}</div></div></div>`).join('')}
    </div>
    ${t.note ? `<p class="small-note">${t.note}</p>` : ''}
  `, t.mark);
}

export function usesPage(cfg) {
  const use = ([t, b]) => `<div class="use"><div class="use-t">${t}</div><div class="use-b">${b}</div></div>`;
  return page(`
    <div class="eyebrow">Ways to use it</div>
    <h2 class="page-title">${cfg.uses.title}</h2>
    <div class="uses">${cfg.uses.items.map(use).join('')}</div>
  `, 'Ways to use it');
}

export function leadersPage(cfg) {
  return page(`
    <div class="eyebrow">For church leaders</div>
    <h2 class="page-title">${cfg.leaders.title}</h2>
    <ol class="steps tight">${cfg.leaders.items.map((x) => `<li>${x}</li>`).join('')}</ol>
    <div class="notice">
      <div class="eyebrow">Notice to copy</div>
      <p>${cfg.leaders.notice}</p>
    </div>
  `, 'For leaders');
}

export function trackerPage(plan) {
  return page(`
    <div class="eyebrow">Reading tracker</div>
    <h2 class="page-title small">Tick a box each day.</h2>
    ${plan.phases.map((w) => `
      <div class="ct-week" style="color:${w.color}">${esc(w.name)}</div>
      ${plan.days.filter((d) => d.week.key === w.key).map((d) => `
        <div class="tr-row roomy"><span class="ct-box"></span><span class="tr-day" style="color:${d.week.color}">${d.n}</span><span class="tr-date">${d.date.short}</span><span class="tr-title">${esc(d.title)}</span><span class="tr-ref">${esc(d.shortRef)}</span></div>`).join('')}`).join('')}
  `, 'Tracker');
}

export function phasePage(w, plan, cfg) {
  const days = plan.days.filter((d) => d.week.key === w.key);
  const long = w.name.length > 9;
  return `
<section class="page week-page" style="--wk:${w.color};--wk-tint:${w.tint}">
  <div class="page-body"><div class="stack">
    <div class="eyebrow" style="color:${w.color}">Part ${w.n} of ${plan.phases.length} · from ${days[0].date.long}</div>
    <h1 class="wk-big${long ? ' long' : ''}">${esc(w.name)}</h1>
    <p class="wk-lede">${esc(w.line)}.</p>
    <div class="wk-candles">${strip(cfg, 80)}</div>
    <div class="wk-table">
      ${days.map((d) => `<div class="wk-row"><b>Day ${d.n}</b><span>${d.date.short}</span><em>${esc(d.title)}</em></div>`).join('')}
    </div>
  </div></div>
  ${folio(w.name)}
</section>`;
}

const PART_LABEL = { black: 'Narration', red: 'God speaking', green: 'Main characters', blue: 'Everyone else' };
function parts(d) {
  const counts = {};
  d.readers.forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
  const seen = {};
  return d.readers.map((c, i) => {
    seen[c] = (seen[c] || 0) + 1;
    const share = counts[c] > 1 ? `<i>${seen[c]} of ${counts[c]}</i>` : '';
    return `<div class="part k-${c}"><div class="who">Reader ${i + 1}</div><div class="what">${PART_LABEL[c]}${share}</div></div>`;
  }).join('');
}

export function dayPage(d, plan, cfg) {
  const kv = d.keyVerses[0];
  const side = kv.color === 'black' || kv.color === 'red' ? 'left' : 'right';
  const ant = d.antiphon
    ? `<div class="antiphon cp-ant"><div class="eyebrow">Pray together · ${esc(d.antiphon[0])}</div><p>${esc(d.antiphon[1])}</p></div>`
    : '';
  return `
<section class="page day-open cp-day" style="--wk:${d.week.color};--wk-tint:${d.week.tint}">
  <div class="page-body"><div class="stack">
    <div class="day-top">
      <span class="day-no"><span class="ct-box big"></span>Day ${d.n}<small> of ${plan.days.length}</small></span>
      <span class="day-date">${d.date.long}</span>
    </div>
    <div class="wk-chip">${esc(d.week.name)}</div>
    <h1 class="day-title cp">${esc(d.title)}</h1>
    <div class="day-ref">${esc(d.ref)} · Day ${d.n} of ${esc(cfg.planName)} in the app</div>
    <div class="day-note">${esc(d.note)}</div>
    <div class="kv turn turn--${kv.color} turn--${side} has-tail">
      <div class="speaker speaker--${side}">Key verse · ${esc(kv.speaker.toUpperCase())}</div>
      <div class="bubble"><p class="para">${esc(kv.text)}</p></div>
      <div class="kv-ref">${esc(kv.label)}</div>
    </div>
    <div class="parts cp-parts">${parts(d)}</div>
    <div class="talk cp-talk"><div class="eyebrow">Talk about it</div>
      ${d.questions.map((q, i) => `<div class="tq"><span class="qnum">${i + 1}</span><span>${esc(q)}</span></div>`).join('')}
    </div>
    ${ant}
    <div class="cp-notes"><span>Notes</span></div>
  </div></div>
  ${folio(`Day ${d.n} · ${d.week.name}`)}
</section>`;
}

export function closingPage(cfg) {
  const c = cfg.closing;
  const v = verse(c.verse[0], c.verse[1]);
  const right = v.color === 'green' || v.color === 'blue';
  return page(`
    <div class="eyebrow">${esc(c.eyebrow)}</div>
    <h2 class="page-title">${c.title}</h2>
    <div class="pullquote">
      <div class="speaker speaker--${right ? 'right' : 'left'}" style="color:var(--ink-${v.color}-text)">${esc(c.speaker || v.speaker)}</div>
      <div class="bubble" style="background:var(--ink-${v.color}-fill);color:var(--ink-${v.color}-text);border-color:var(--ink-${v.color}-edge);${right ? 'border-top-left-radius:5.5mm;border-top-right-radius:1.6mm;' : ''}">
        <p class="para">${esc(v.text)}</p>
      </div>
      <div class="pullquote-ref">${esc(v.label)}</div>
    </div>
    ${paras(c.body)}
    <div class="eyebrow" style="margin-top:6mm;">Notes</div>
    <div class="notes-grid">${'<div class="ln"></div>'.repeat(c.lines || 6)}</div>
  `, c.mark);
}

export function notesPage() {
  return page(`
    <div class="eyebrow">Notes</div>
    <h2 class="page-title">Anything you<br>want to keep.</h2>
    <div class="notes-grid">${'<div class="ln"></div>'.repeat(16)}</div>
  `, 'Notes');
}

export function backPage(c, cfg) {
  return `
<section class="page back">
  <div class="back-inner">
    <h2>${cfg.back.title}</h2>
    <div class="rulez"></div>
    ${cfg.back.body.map((p) => `<p>${p}</p>`).join('')}
    <div class="qrs back-qrs">
      <div><div class="qr light">${qr('qr-app-store.svg')}</div><span>App Store</span></div>
      <div><div class="qr light">${qr('qr-google-play.svg')}</div><span>Google Play</span></div>
    </div>
    <div class="back-colophon">
      <div class="back-dots">
        ${ORDER.map((k) => `<i style="background:${k === c.key ? COVERS[k].tint : 'transparent'}"></i>`).join('')}
      </div>
      This is the <b>${COVERS[c.key].name}</b> copy. Scripture quotations from the Holy Bible, New Living
      Translation, © 1996, 2004, 2007 by Tyndale House Foundation. Used by permission. All rights reserved.
    </div>
    <div class="back-mark">SourceView Together</div>
  </div>
</section>`;
}
