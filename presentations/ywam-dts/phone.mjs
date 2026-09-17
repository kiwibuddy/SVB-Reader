// The phone, rebuilt from the app rather than photographed, so it can move.
import { INK } from './data.mjs';

const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

export const statusBar = (time = '9:41') => `
<div class="sbar">
  <span>${time}</span>
  <span style="display:flex;gap:7px;align-items:center">
    <span class="sig"><i style="height:5px"></i><i style="height:8px"></i><i style="height:11px"></i><i style="height:14px"></i></span>
    <span class="bat"></span>
  </span>
</div>`;

export const tabs = (on = 'Read') => `
<div class="tabs">
  ${['Read','Cast','Plan','Saved','You'].map((t) =>
    `<div class="${t === on ? 'on' : ''}"><b></b>${t}</div>`).join('')}
</div>`;

/** A phone shell. `h` is screen height in px. */
export const phone = (inner, h = 620, time) => `
<div class="phone" style="--ph:${h}px">
  <div class="screen">
    ${statusBar(time)}
    <span class="island"></span>
    ${inner}
  </div>
</div>`;

export const mixbar = (totals, total) => `
<div class="mixbar">
  ${['black','red','green','blue'].map((c) =>
    `<i style="width:${(totals[c] / total) * 100}%;background:${INK[c].bar}"></i>`).join('')}
</div>`;

/** The reader, with every turn of the story ready to be revealed in order. */
export function reader(st, turns, { id = 'rd', picker = true } = {}) {
  const rows = turns.map((t, i) => `
    <div class="turn ${t.color} ${t.side === 'left' ? 'l' : 'r'}${t.speaker ? ' tail' : ''} pend" data-t="${i}">
      ${t.speaker ? `<div class="speaker">${esc(t.speaker)}</div>` : ''}
      <div class="bubble">${t.html}</div>
    </div>`).join('');
  return `
<div class="ascreen">
  <div class="ahead">
    <div class="t">${esc(st.title)}</div>
    <div class="m">${esc(st.id.replace('S',''))} · ${esc(st.book)} ${esc(st.reference)} · ${st.minutes} min</div>
    ${mixbar(st.totals, st.total)}
    ${picker ? `
    <div style="margin-top:12px">
      <div style="font-size:11px;color:var(--mute);margin-bottom:7px">Four parts, take one to read in your group</div>
      <div class="picker" id="${id}-pick">
        ${['black','red','green','blue'].map((c, i) => `<span class="sw" data-sw="${i}"
            style="background:${INK[c].fill};border-color:${INK[c].edge}"></span>`).join('')}
        <span class="cnt">${st.cast.length} VOICES</span>
      </div>
    </div>` : ''}
  </div>
  <div class="abody"><div class="scroller" id="${id}-scroll">${rows}</div></div>
  ${tabs('Read')}
</div>`;
}

/** The call sheet: who is in this story and how much they say. */
export function callSheet(st) {
  return `
<div class="ascreen">
  <div class="ahead">
    <div class="t">${esc(st.title)}</div>
    <div class="m">${st.cast.length} voices · ${st.words.toLocaleString('en-NZ')} words</div>
    ${mixbar(st.totals, st.total)}
  </div>
  <div class="abody"><div class="scroller">
    ${st.cast.map((c) => `
      <div style="display:flex;align-items:center;gap:10px;padding:11px 2px;border-bottom:1px solid var(--rule-soft)">
        <span style="width:18px;height:18px;border-radius:50%;flex:none;background:${INK[c.color].bar}"></span>
        <span style="font-size:13px;font-weight:700">${esc(c.name)}</span>
        <span style="margin-left:auto;font-size:11px;font-weight:700;color:var(--mute)">${c.words}</span>
      </div>`).join('')}
  </div></div>
  ${tabs('Cast')}
</div>`;
}

/** Talk about it: the three sets, School showing. */
export function talkAbout(st, which = 'school') {
  const names = { family: 'Family', school: 'School', group: 'Small Group' };
  return `
<div class="ascreen">
  <div class="ahead"><div class="t">Talk about it</div>
    <div class="m">${esc(st.title)} · four questions</div></div>
  <div class="abody"><div class="scroller">
    <div style="display:flex;gap:5px;margin-bottom:14px" id="ta-tabs">
      ${Object.entries(names).map(([k, n]) => `
        <span data-ta="${k}" style="flex:1;text-align:center;font-size:11px;font-weight:700;padding:8px 4px;border-radius:9px;
          border:1.5px solid ${k === which ? 'var(--e-green)' : 'var(--hair)'};
          background:${k === which ? 'var(--f-green)' : 'var(--surf)'};
          color:${k === which ? 'var(--k-green)' : 'var(--mute)'}">${n}</span>`).join('')}
    </div>
    ${st.questions[which].map((q) => `
      <div style="display:flex;gap:9px;margin-bottom:13px">
        <span style="width:6px;height:6px;border-radius:50%;background:var(--acc);margin-top:6px;flex:none"></span>
        <span style="font-size:13px;line-height:1.45;color:var(--ink)">${esc(q)}</span>
      </div>`).join('')}
  </div></div>
  ${tabs('Read')}
</div>`;
}

/** The plan screen, with the two DTS plans in progress. */
export function planScreen(ot, nt) {
  const card = (p, day, phase) => `
    <div style="border:1.5px solid var(--e-green);border-radius:13px;padding:13px;margin-bottom:11px;background:var(--surf)">
      <div style="font-size:9px;font-weight:800;letter-spacing:.14em;color:var(--k-green)">${phase}</div>
      <div style="margin-top:5px;font-size:15px;font-weight:800;letter-spacing:-.02em">${esc(p.title)}</div>
      <div style="margin-top:5px;font-size:11px;line-height:1.4;color:var(--mute)">${esc(p.short)}</div>
      <div style="margin-top:10px;height:4px;background:#E7EBE6;border-radius:2px;overflow:hidden">
        <span style="display:block;height:100%;width:${day}%;background:var(--acc);border-radius:2px"></span>
      </div>
      <div style="margin-top:6px;font-size:9px;font-weight:700;letter-spacing:.1em;color:var(--mute)">${p.count} STORIES</div>
    </div>`;
  return `
<div class="ascreen">
  <div class="ahead"><div class="t">Plan</div><div class="m">In progress</div></div>
  <div class="abody"><div class="scroller">
    ${card(ot, 34, 'LECTURE PHASE')}
    ${card(nt, 0, 'OUTREACH PHASE')}
    <div style="margin-top:14px;font-size:9px;font-weight:800;letter-spacing:.14em;color:var(--mute)">READING PLANS</div>
    ${[['Whole Year Plans', 2], ['Monthly Challenges', 4], ['Mini Studies', 3]].map(([n, c]) => `
      <div style="display:flex;align-items:center;gap:9px;padding:11px 0;border-bottom:1px solid var(--rule-soft)">
        <span style="width:7px;height:7px;border-radius:50%;background:var(--acc);flex:none"></span>
        <span style="font-size:13px;font-weight:700">${n}</span>
        <span style="margin-left:auto;font-size:11px;color:var(--mute)">${c}</span>
      </div>`).join('')}
  </div></div>
  ${tabs('Plan')}
</div>`;
}
