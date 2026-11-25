// Interior pages of the Advent book: front matter, week dividers, the page
// that opens each day, the questions and prayer that close it, and the back
// matter. The story pages themselves are laid out by the paginator in build.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COVERS, DAYS, INK, WEEKS, esc } from './content.mjs';
import { candleStrip } from './art.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const ORDER = ['black', 'red', 'green', 'blue'];
const qr = (f) => fs.readFileSync(path.join(root, 'Marketing/print', f), 'utf8');

const folio = (mark) => `<div class="folio"><span class="mark">${esc(mark)}</span><span class="num"></span></div>`;

// ---------------------------------------------------------------- front matter
export function titlePage() {
  return `
<section class="page" data-fixed="title">
  <div class="page-body">
    <div class="stack title-stack">
      <div class="eyebrow">SourceView Together</div>
      <h1 class="book-title">From promise<br>to manger</h1>
      <p class="book-sub">An Advent journey in 26 Bible stories, to read aloud together</p>
      <div class="title-candles">${candleStrip(4, { width: 84 })}</div>
      <p class="book-dates">Sunday 29 November to Christmas Eve 2026</p>
    </div>
  </div>
</section>`;
}

export function copyrightPage() {
  return `
<section class="page" data-fixed="copyright">
  <div class="page-body">
    <div class="stack">
      <div class="colophon">
        <p><b>From promise to manger</b><br>An Advent journey in 26 Bible stories.<br>The Advent Journey reading plan from the SourceView Together app, 2026 edition.</p>
        <p>Scripture quotations are taken from the Holy Bible, New Living Translation, copyright © 1996, 2004, 2007 by Tyndale House Foundation. Used by permission of Tyndale House Publishers, Inc., Carol Stream, Illinois 60188. All rights reserved.</p>
        <p>The voice attribution of every word, the division of the Bible into 365 stories and the reading parts come from the SourceView Bible and the SourceView Together app.</p>
        <p>The O Antiphons on Days 19–25 are translated from the Latin for this book.</p>
        <p>Story questions are the app's family questions. Small group and school questions for every story are in the app.</p>
      </div>
    </div>
  </div>
</section>`;
}

export function readAloudPage() {
  return `
<section class="page" data-fixed="inside">
  <div class="page-body">
    <div class="stack">
      <div class="eyebrow">Before you start</div>
      <h2 class="page-title">Read it out loud.</h2>
      <p class="lede">
        The Christmas story was first told, not read. Shepherds told it in
        Bethlehem, and “all who heard the shepherds’ story were astonished”
        (Luke 2:18). For most of history God’s people have heard Scripture read
        aloud in company, and Advent is a good season to do it again.
      </p>
      <p class="lede">
        This book gives you one complete story a day, from the first promise in
        Genesis to the night Jesus is born. Every word is coloured by the voice
        that speaks it. So the narration, God, the main characters and everyone
        else can each be read by a different person, and a story you know starts
        to sound like a conversation in the room.
      </p>
      <div class="hairline"></div>
      <div class="eyebrow" style="margin-bottom:2.5mm;">Your colour decides what you read</div>
      <div class="keyrow">
        ${ORDER.map((c) => `<div class="keychip k-${c}"><div class="who">${COVERS[c].name}</div><div class="what">${INK[c].label}</div></div>`).join('')}
      </div>
      <div class="ownership">
        <div class="lbl">This book belongs to</div>
        <div class="rule"></div>
        <div class="lbl" style="margin-top:4mm;">We read it with</div>
        <div class="rule"></div>
      </div>
    </div>
  </div>
  ${folio('Before you start')}
</section>`;
}

export function howToPage() {
  return `
<section class="page" data-fixed="howto">
  <div class="page-body">
    <div class="stack">
      <div class="eyebrow">One story a day to Christmas Eve</div>
      <h2 class="page-title">How to use<br>this book.</h2>
      <ol class="steps">
        <li><b>Gather your four.</b> A family at the table, a small group, a class. Three works, five works: someone doubles up or shares.</li>
        <li><b>Take a colour each.</b> When a bubble is your colour, those words are yours. Each day’s opening page shows the four reading parts; where two readers share a colour, take turns paragraph by paragraph.</li>
        <li><b>Light the candles.</b> One for each week of Advent so far: Hope, Peace, Joy, Love.</li>
        <li><b>Read the whole story straight through,</b> out loud, before anyone stops to talk.</li>
        <li><b>Talk about it.</b> Four questions close every story. From 17 December, an ancient prayer of the church follows them.</li>
        <li><b>Missed a day?</b> Read today’s story and catch up when you can. Nobody needs to start Christmas behind.</li>
      </ol>
      <div class="readnote" style="margin-top:auto;">
        <b>The small numbers</b> in the text are verse numbers, so skip them while
        reading aloud. <b>The name</b> above a bubble tells you who is speaking.
        The same plan is free in the SourceView Together app, with reminders and
        questions for families, schools and small groups.
      </div>
    </div>
  </div>
  ${folio('Before you start')}
</section>`;
}

export function shapePage() {
  return `
<section class="page" data-fixed="shape">
  <div class="page-body">
    <div class="stack">
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
      <p class="lede" style="font-size:9.2pt;margin-top:auto;">
        The order is not the Bible’s order. Advent begins by looking ahead to
        Christ’s return, goes back to the first promise in Genesis, listens to the
        prophets, and arrives at the manger on Christmas Eve. On three of the four
        Sundays, the story holds the passage many churches read that day.
      </p>
    </div>
  </div>
  ${folio('Before you start')}
</section>`;
}

// Contents doubles as the reading tracker: tick a box each day.
export function contentsPages() {
  const row = (d) => `
    <div class="ct-row">
      <span class="ct-box"></span>
      <span class="ct-day" style="color:${d.week.color}">${d.n}</span>
      <span class="ct-main"><span class="ct-title">${esc(d.title)}</span><span class="ct-ref">${d.date.short} · ${esc(d.ref)}</span></span>
      <span class="ct-page" data-page-of="day-${d.n}"></span>
    </div>`;
  const half = (weeks, first) => `
<section class="page" data-fixed="contents">
  <div class="page-body">
    <div class="stack">
      ${first ? '<div class="eyebrow">Contents</div><h2 class="page-title">Tick a box<br>each day.</h2>' : '<div class="eyebrow">Contents, continued</div>'}
      ${weeks.map((w) => `
        <div class="ct-week" style="color:${w.color}">Week ${w.n} · ${w.name}</div>
        ${DAYS.filter((d) => d.week.key === w.key).map(row).join('')}`).join('')}
    </div>
  </div>
  ${folio('Contents')}
</section>`;
  return [half(WEEKS.slice(0, 2), true), half(WEEKS.slice(2), false)];
}

// ---------------------------------------------------------------- per week / day
export function weekPage(w) {
  const days = DAYS.filter((d) => d.week.key === w.key);
  return `
<section class="page week-page" data-fixed="week" style="--wk:${w.color};--wk-tint:${w.tint}">
  <div class="page-body">
    <div class="stack">
      <div class="eyebrow" style="color:${w.color}">Week ${w.n} of 4 · from ${days[0].date.long}</div>
      <h1 class="wk-big">${w.name}</h1>
      <p class="wk-lede">${esc(w.line)}.</p>
      <div class="wk-candles">${candleStrip(w.n, { width: 80 })}</div>
      <div class="wk-table">
        ${days.map((d) => `<div class="wk-row"><b>Day ${d.n}</b><span>${d.date.short}</span><em>${esc(d.title)}</em></div>`).join('')}
      </div>
    </div>
  </div>
  ${folio(`Week ${w.n} · ${w.name}`)}
</section>`;
}

const PART_LABEL = { black: 'Narration', red: 'God speaking', green: 'Main characters', blue: 'Everyone else' };

function readingParts(d) {
  const counts = {};
  d.readers.forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
  const seen = {};
  return d.readers
    .map((c, i) => {
      seen[c] = (seen[c] || 0) + 1;
      const share = counts[c] > 1 ? `<i>${seen[c]} of ${counts[c]}</i>` : '';
      return `<div class="part k-${c}"><div class="who">Reader ${i + 1}</div><div class="what">${PART_LABEL[c]}${share}</div></div>`;
    })
    .join('');
}

export function dayOpener(d) {
  const pct = (n) => ((n / d.share.total) * 100).toFixed(2);
  const bar = ORDER.map((c) => `<i style="width:${pct(d.share.totals[c])}%;background:${INK[c].bar}"></i>`).join('');
  const kv = d.keyVerses[0];
  const side = kv.color === 'black' || kv.color === 'red' ? 'left' : 'right';
  const many = d.cast.length > 8;
  return `
<section class="page day-open" data-fixed="day" data-anchor="day-${d.n}" style="--wk:${d.week.color};--wk-tint:${d.week.tint}">
  <div class="page-body">
    <div class="stack">
      <div class="day-top">
        <span class="day-no">Day ${d.n}<small> of 26</small></span>
        <span class="day-date">${d.date.long}</span>
      </div>
      <div class="wk-chip">Week ${d.week.n} · ${d.week.name}${d.antiphon ? ` · ${d.antiphon[0]}` : ''}</div>
      <h1 class="day-title">${esc(d.title)}</h1>
      <div class="day-ref">${esc(d.ref)} · story ${d.storyNo} of 365</div>
      <div class="day-note">${esc(d.note)}</div>
      <div class="kv turn turn--${kv.color} turn--${side} has-tail">
        <div class="speaker speaker--${side}">Key verse · ${esc(kv.speaker.toUpperCase())}</div>
        <div class="bubble"><p class="para">${esc(kv.text)}</p></div>
        <div class="kv-ref">${esc(kv.label)}</div>
      </div>
      <div class="day-foot">
        <div class="eyebrow" style="margin-bottom:2mm;">Reading parts</div>
        <div class="parts">${readingParts(d)}</div>
        <div class="voicebar">${bar}</div>
        <div class="cast-grid${many ? ' many' : ''}">
          ${d.cast.map((s) => `<span class="cg"><i style="background:${INK[s.color].bar}"></i>${esc(s.name)}</span>`).join('')}
        </div>
      </div>
    </div>
  </div>
  ${folio(`Day ${d.n} · ${d.week.name}`)}
</section>`;
}

// Closes every story: the four questions, the antiphon on Days 19–25, and the
// translator's notes. These ride in the flow, after the last bubble.
export function dayClose(d) {
  const qs = d.questions
    .map((q, i) => `<div class="tq"><span class="qnum">${i + 1}</span><span>${esc(q)}</span></div>`)
    .join('');
  const ant = d.antiphon
    ? `<div class="flow-item antiphon">
        <div class="eyebrow">Pray together · ${esc(d.antiphon[0])}</div>
        <p>${esc(d.antiphon[1])}</p>
        <div class="ant-note">An ancient prayer of the church for these last days of Advent.</div>
      </div>`
    : '';
  const notes = d.footnotes.length
    ? `<div class="flow-item textnotes">
        <h4>Notes on the text · Day ${d.n}</h4>
        <ul>${d.footnotes.map((f) => `<li><sup>${f.letter}</sup>${f.html}</li>`).join('')}</ul>
      </div>`
    : '';
  return [
    `<div class="flow-item talk"><div class="eyebrow">Talk about it</div>${qs}</div>`,
    ant,
    notes,
  ].filter(Boolean);
}

// ---------------------------------------------------------------- back matter
export function christmasPage() {
  return `
<section class="page" data-fixed="christmas">
  <div class="page-body">
    <div class="stack">
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
        Over 26 stories you have followed a promise from the garden in Genesis,
        through Abraham, Ruth and David, through the prophets in exile, to a
        manger in Bethlehem. God kept his word. And Advent ends where it began:
        looking ahead to the day he makes all things new.
      </p>
      <div class="readnote" style="margin-top:auto;">
        <b>Keep reading over Christmas.</b> The 12 Days of Christmas plan starts on
        25 December in the SourceView Together app, free on the App Store and
        Google Play.
        <div class="qrs">
          <div><div class="qr">${qr('qr-app-store.svg')}</div><span>App Store</span></div>
          <div><div class="qr">${qr('qr-google-play.svg')}</div><span>Google Play</span></div>
        </div>
      </div>
    </div>
  </div>
  ${folio('Christmas')}
</section>`;
}

export function notesPage() {
  return `
<section class="page" data-fixed="filler">
  <div class="page-body">
    <div class="stack">
      <div class="eyebrow">Notes</div>
      <h2 class="page-title">Anything you<br>want to keep.</h2>
      <div class="notes-grid">${'<div class="ln"></div>'.repeat(16)}</div>
    </div>
  </div>
  ${folio('Notes')}
</section>`;
}
