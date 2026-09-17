// The phone, rebuilt from the app rather than photographed, so it can move.
//
// Everything inside .screen is the app's own light interface, so its colours
// come from constants/Colors.ts and never from the deck's dark theme tokens.
// Sizes are container-query units against the screen width, so the whole
// mockup scales with the slide.
import { INK } from './data.mjs';

const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

// app palette, lifted from constants/Colors.ts
const APP = { surf: '#FFFFFF', ink: '#101619', mute: '#5E6B70', hair: '#DFE5E0', acc: '#0E6B4C' };

export const statusBar = (time = '9:41') => `
<div class="sbar">
  <span>${time}</span>
  <span style="display:flex;gap:2.4cqw;align-items:center">
    <span class="sig"><i style="height:1.7cqw"></i><i style="height:2.8cqw"></i><i style="height:3.8cqw"></i><i style="height:4.9cqw"></i></span>
    <span class="bat"></span>
  </span>
</div>`;

// The five tabs the app actually ships, with the Ionicons it actually uses
// (book / people / calendar / bookmark / person), filled on the active tab
// and outlined on the rest, exactly as BottomNavigation.tsx does it.
const GLYPH = {
  Read: `<path d="M12 6.2C10.4 4.9 8.3 4.3 6 4.3H3.6v13.4H6c2.3 0 4.4.6 6 1.9
          m0-13.4c1.6-1.3 3.7-1.9 6-1.9h2.4v13.4H18c-2.3 0-4.4.6-6 1.9m0-13.4v13.4"/>`,
  Cast: `<circle cx="9" cy="8" r="3.1"/><circle cx="16.6" cy="9.2" r="2.3"/>
         <path d="M3.4 18.6c.5-2.8 2.8-4.5 5.6-4.5s5.1 1.7 5.6 4.5"/>
         <path d="M16.1 14.3c2.2.1 3.9 1.6 4.4 3.8"/>`,
  Plan: `<rect x="3.4" y="5.2" width="17.2" height="15.1" rx="2.6"/>
         <path d="M3.4 9.9h17.2M8 3.4v3.4M16 3.4v3.4"/>`,
  Saved: `<path d="M6.1 3.9h11.8c.6 0 1.1.5 1.1 1.1v15.4L12 16.3l-7 4.1V5c0-.6.5-1.1 1.1-1.1z"/>`,
  You: `<circle cx="12" cy="7.8" r="3.7"/>
        <path d="M4.4 20.1c.7-3.7 3.8-5.9 7.6-5.9s6.9 2.2 7.6 5.9"/>`,
};

const icon = (t, active) =>
  `<svg viewBox="0 0 24 24" fill="${active && t === 'Saved' ? 'currentColor' : 'none'}"
        stroke="currentColor" stroke-width="${active ? 2.2 : 1.7}"
        stroke-linecap="round" stroke-linejoin="round">${GLYPH[t]}</svg>`;

export const tabs = (on = 'Read') => `
<div class="tabs">
  ${['Read','Cast','Plan','Saved','You'].map((t) =>
    `<div class="${t === on ? 'on' : ''}"><b>${icon(t, t === on)}</b>${t}</div>`).join('')}
</div>`;

/** A phone shell. Height comes from --ph on .phone, set by the stylesheet. */
export const phone = (inner, time) => `
<div class="phone">
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
    <div style="margin-top:4.2%">
      <div style="font-size:3.8cqw;color:${APP.mute};margin-bottom:2.4%">Four parts, take one to read in your group</div>
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
      <div class="castrow">
        <span class="cd" style="background:${INK[c.color].bar}"></span>
        <span class="cn">${esc(c.name)}</span>
        <span class="cw">${c.words}</span>
      </div>`).join('')}
  </div></div>
  ${tabs('Cast')}
</div>`;
}

/** Talk about it: the three sets, with one selected. */
export function talkAbout(st, which = 'school') {
  const names = { family: 'Family', school: 'School', group: 'Small Group' };
  return `
<div class="ascreen">
  <div class="ahead"><div class="t">Talk about it</div>
    <div class="m">${esc(st.title)} · four questions</div></div>
  <div class="abody"><div class="scroller">
    <div class="segs">
      ${Object.entries(names).map(([k, n]) =>
        `<div class="${k === which ? 'on' : ''}">${n}</div>`).join('')}
    </div>
    <ul class="qlist">
      ${st.questions[which].map((q) => `<li>${esc(q)}</li>`).join('')}
    </ul>
  </div></div>
  ${tabs('Read')}
</div>`;
}

/** The plan screen, with the two DTS plans in progress. */
export function planScreen(ot, nt) {
  const card = (p, pct, phase) => `
    <div class="pcard">
      <div class="pt">${phase}</div>
      <div class="ph">${esc(p.title)}</div>
      <div class="pb">${esc(p.short)}</div>
      <div class="pp"><i style="width:${pct}%"></i></div>
      <div class="pn">${p.count} stories</div>
    </div>`;
  return `
<div class="ascreen">
  <div class="ahead"><div class="t">Plan</div><div class="m">In progress</div></div>
  <div class="abody"><div class="scroller">
    ${card(ot, 34, 'Lecture phase')}
    ${card(nt, 0, 'Outreach phase')}
    <div class="pn" style="margin-top:4.9%">Reading plans</div>
    ${[['Whole Year Plans', 2], ['Monthly Challenges', 4], ['Mini Studies', 3]].map(([n, c]) => `
      <div class="castrow">
        <span class="cd" style="width:2.4cqw;height:2.4cqw;background:${APP.acc}"></span>
        <span class="cn">${n}</span>
        <span class="cw">${c}</span>
      </div>`).join('')}
  </div></div>
  ${tabs('Plan')}
</div>`;
}
