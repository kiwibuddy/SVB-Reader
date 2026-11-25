// The Advent companion: a stapled A5 booklet to go with the Advent Journey
// plan in the app. No story text. Pages 2–8 introduce the plan for churches;
// then one page per day with the note, key verse, reading parts, questions and
// (Days 19–25) the O Antiphon.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COVERS, DAYS, INK, WEEKS, TOTALS, esc, excerpt } from '../advent-book/content.mjs';
import { candleStrip } from '../advent-book/art.mjs';
import { frontCoverPage } from '../advent-book/cover.mjs';
import { weekPage } from '../advent-book/pages.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const ORDER = ['black', 'red', 'green', 'blue'];
const qr = (f) => fs.readFileSync(path.join(root, 'Marketing/print', f), 'utf8');
const folio = (mark) => `<div class="folio"><span class="mark">${esc(mark)}</span><span class="num"></span></div>`;
const page = (body, mark, attrs = '') => `
<section class="page"${attrs}>
  <div class="page-body"><div class="stack">${body}</div></div>
  ${mark ? folio(mark) : ''}
</section>`;

export const cover = (c) => frontCoverPage(c, {
  kicker: 'Advent companion · 2026',
  line: 'A companion to the Advent Journey in the free SourceView Together app. One Bible story a day, 29 November to Christmas Eve.',
});

// p2
export function welcomePage() {
  return page(`
    <div class="eyebrow">Advent 2026</div>
    <h2 class="page-title">Read the Bible<br>together this Advent.</h2>
    <p class="lede">
      The Advent Journey is 26 Bible stories, one a day from Sunday 29 November to
      Christmas Eve. It follows God’s promise from the first pages of Genesis,
      through Abraham, Ruth and David and the prophets, to the night Jesus is born
      in Bethlehem.
    </p>
    <p class="lede">
      The stories are in the free <b>SourceView Together</b> app, where every word
      is coloured by the voice that speaks it. So a family, a small group or a class
      can share the reading out loud, one colour each.
    </p>
    <p class="lede">
      This booklet goes alongside the app. For each day it gives the story, a note
      on why it belongs in Advent, the key verse, the reading parts and four
      questions to talk about. From 17 December it adds the ancient prayers the
      church has sung in the last days of Advent.
    </p>
    <div class="facts">
      <div><b>26</b><span>stories</span></div>
      <div><b>4</b><span>weeks, 4 candles</span></div>
      <div><b>${TOTALS.speakers}</b><span>speaking parts</span></div>
      <div><b>0</b><span>cost</span></div>
    </div>
    <div class="title-candles" style="margin-top:auto;display:flex;justify-content:center;">${candleStrip(4, { width: 70 })}</div>
  `, 'Welcome');
}

// p3
export function voicesPage() {
  const refs = ['Gen-15-1', 'Gen-15-2'];
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
    <div class="eyebrow" style="margin-top:6mm;">From Day 3 · Genesis 15</div>
    <div class="sample">${excerpt('S006', refs)}</div>
    <p class="small-note">Every story is split into four reading parts. When a story has fewer kinds of voice, two readers share the busiest one, so four people always have a part.</p>
  `, 'How it works');
}

// p4
export function appPage() {
  return page(`
    <div class="eyebrow">Get started</div>
    <h2 class="page-title">Join the Advent<br>Journey in the app.</h2>
    <ol class="steps">
      <li><b>Download SourceView Together.</b> It’s free on the App Store and Google Play, with no account or sign-in.</li>
      <li><b>Open the Plan tab and tap Join Advent.</b> Turn on reminders and the app tells you each day’s story.</li>
      <li><b>Gather your readers and take a colour each.</b> Open the day’s story and read it aloud, all the way through.</li>
      <li><b>Talk about it.</b> Questions for families, schools and small groups follow every story in the app, and the family questions are in this booklet too.</li>
    </ol>
    <div class="qrs big">
      <div><div class="qr">${qr('qr-app-store.svg')}</div><span>App Store</span></div>
      <div><div class="qr">${qr('qr-google-play.svg')}</div><span>Google Play</span></div>
    </div>
    <div class="readnote" style="margin-top:auto;">
      <b>Starting late?</b> The app offers today’s story or Day 1, so nobody has to
      start Advent behind. Progress, notes and reminders stay on the phone.
    </div>
  `, 'Get started');
}

// p5
export function weeksPage() {
  return page(`
    <div class="eyebrow">The shape of the journey</div>
    <h2 class="page-title">Four weeks,<br>four candles.</h2>
    <div class="weeks-list">
      ${WEEKS.map((w) => {
        const days = DAYS.filter((d) => d.week.key === w.key);
        return `<div class="wk" style="--wk:${w.color};--wk-tint:${w.tint}">
          <div class="wk-name">Week ${w.n} · ${w.name}</div>
          <div class="wk-line">${esc(w.line)}</div>
          <div class="wk-days">Days ${days[0].n}–${days[days.length - 1].n} · ${days[0].date.short} to ${days[days.length - 1].date.short}</div>
        </div>`;
      }).join('')}
    </div>
    <p class="lede" style="font-size:9pt;margin-top:auto;">
      Advent begins by looking ahead to Christ’s return, goes back to the first
      promise in Genesis, listens to the prophets, and arrives at the manger on
      Christmas Eve. From 17 December, each day’s story sits behind one of the seven
      O Antiphons, the church’s ancient prayers for the last days of Advent.
    </p>
  `, 'The journey');
}

// p6
export function usesPage() {
  const use = (title, body) => `<div class="use"><div class="use-t">${title}</div><div class="use-b">${body}</div></div>`;
  return page(`
    <div class="eyebrow">Ways to use it</div>
    <h2 class="page-title">At home, in groups,<br>in class, on Sunday.</h2>
    <div class="uses">
      ${use('Families', 'After dinner at the table. Light the week’s candles, give everyone a colour (the youngest can read the angel), read the story, then talk through the four questions.')}
      ${use('Small groups', 'Split into fours and read the week’s Sunday story together, or meet midweek. The app has small group questions for every story.')}
      ${use('Schools and youth', 'A class reads in fours, one colour each. The school questions in the app are written to suit a class with mixed beliefs.')}
      ${use('The whole church', 'On three of the four Sundays the day’s story holds the passage many churches read that day, so a service can read it aloud with four voices.')}
    </div>
  `, 'Ways to use it');
}

// p7
export function leadersPage() {
  return page(`
    <div class="eyebrow">For church leaders</div>
    <h2 class="page-title">Bring your church<br>along.</h2>
    <ol class="steps tight">
      <li><b>Announce it on Advent Sunday</b> (29 November), or the Sunday before. The notice below is ready to copy.</li>
      <li><b>Hand out this booklet in its four colours,</b> Graphite, Red, Green and Blue, so each household or group can share out the parts.</li>
      <li><b>Read the Sunday story in worship:</b> Isaiah 40 on 6 December, Isaiah 61 on 13 December, 2 Samuel 7 on 20 December (Revised Common Lectionary, Year B).</li>
      <li><b>Pray the O Antiphons</b> together from 17 to 23 December. They are printed on Days 19–25.</li>
    </ol>
    <div class="notice">
      <div class="eyebrow">Notice to copy</div>
      <p>This Advent, read the Bible together out loud. The Advent Journey is 26 Bible stories, one a day from 29 November to Christmas Eve, in the free SourceView Together app. Every story is split into four colour-coded parts, so a family or small group can share the reading. Pick up a companion booklet, download the app, and tap Join Advent on the Plan tab.</p>
    </div>
  `, 'For leaders');
}

// p8
export function trackerPage() {
  return page(`
    <div class="eyebrow">Reading tracker</div>
    <h2 class="page-title small">Tick a box each day.</h2>
    ${WEEKS.map((w) => `
      <div class="ct-week" style="color:${w.color}">Week ${w.n} · ${w.name}</div>
      ${DAYS.filter((d) => d.week.key === w.key).map((d) => `
        <div class="tr-row"><span class="ct-box"></span><span class="tr-day" style="color:${d.week.color}">${d.n}</span><span class="tr-date">${d.date.short}</span><span class="tr-title">${esc(d.title)}</span><span class="tr-ref">${esc(d.shortRef)}</span></div>`).join('')}`).join('')}
  `, 'Tracker');
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

export function dayPage(d) {
  const kv = d.keyVerses[0];
  const side = kv.color === 'black' || kv.color === 'red' ? 'left' : 'right';
  const ant = d.antiphon
    ? `<div class="antiphon cp-ant"><div class="eyebrow">Pray together · ${esc(d.antiphon[0])}</div><p>${esc(d.antiphon[1])}</p></div>`
    : '';
  return `
<section class="page day-open cp-day" style="--wk:${d.week.color};--wk-tint:${d.week.tint}">
  <div class="page-body"><div class="stack">
    <div class="day-top">
      <span class="day-no"><span class="ct-box big"></span>Day ${d.n}<small> of 26</small></span>
      <span class="day-date">${d.date.long}</span>
    </div>
    <div class="wk-chip">Week ${d.week.n} · ${d.week.name}${d.antiphon ? ` · ${d.antiphon[0]}` : ''}</div>
    <h1 class="day-title cp">${esc(d.title)}</h1>
    <div class="day-ref">${esc(d.ref)} · Day ${d.n} of the Advent Journey in the app</div>
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

export { weekPage };

export function christmasPage() {
  return page(`
    <div class="eyebrow">Christmas Day</div>
    <h2 class="page-title">The promise<br>is kept.</h2>
    <div class="pullquote">
      <div class="speaker speaker--right" style="color:var(--ink-blue-text)">An angel</div>
      <div class="bubble" style="background:var(--ink-blue-fill);color:var(--ink-blue-text);border-color:var(--ink-blue-edge);border-top-left-radius:5.5mm;border-top-right-radius:1.6mm;">
        <p class="para">“Don’t be afraid! I bring you good news that will bring great joy to all people.”</p>
      </div>
      <div class="pullquote-ref">Luke 2:10</div>
    </div>
    <p class="lede">
      Over 26 stories you have followed a promise from the garden in Genesis to a
      manger in Bethlehem. God kept his word. Keep reading over Christmas: the
      12 Days of Christmas plan in the app starts on 25 December.
    </p>
    <div class="eyebrow" style="margin-top:6mm;">Notes</div>
    <div class="notes-grid">${'<div class="ln"></div>'.repeat(7)}</div>
  `, 'Christmas');
}

export function backPage(c) {
  return `
<section class="page back">
  <div class="back-inner">
    <h2>One story a day.<br>Four voices.<br>Read Advent together.</h2>
    <div class="rulez"></div>
    <p>
      This booklet is a companion to the Advent Journey in the free SourceView
      Together app: 26 Bible stories from the first promise in Genesis to the night
      in Bethlehem, one a day from 29 November to Christmas Eve.
    </p>
    <p>
      In the app every word is coloured by the voice that speaks it, so four people
      can share the reading: the narration, God, the main characters, and everyone
      else.
    </p>
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
