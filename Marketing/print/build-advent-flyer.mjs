/**
 * Builds advent-flyer-churches.html — the two-page A4 Advent flyer for churches.
 *
 *   node build-advent-flyer.mjs          # writes the HTML next to this file
 *
 * Dates, references and reading times are read from the app's own data, so the
 * flyer cannot drift from what a reader sees in the Plan tab. Only the one-line
 * hooks are written here, and the script refuses to run if they stop matching
 * the plan. See SOURCES.md for where each claim comes from.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(HERE, '../../assets/data');
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));

const YEAR = 2026;
const plan = read('ChronologicalMappings.json').adventJourneyChronological;
const times = read('SegmentReadingTimes.json');

/* ── dates ────────────────────────────────────────────────────────────────── */

/** First Sunday of Advent: the fourth Sunday before Christmas Day. */
function firstSundayOfAdvent(year) {
  const christmas = new Date(year, 11, 25);
  const back = christmas.getDay() === 0 ? 7 : christmas.getDay();
  return new Date(year, 11, 25 - back - 21);
}
const START = firstSundayOfAdvent(YEAR);
const dayDate = (i) => new Date(START.getFullYear(), START.getMonth(), START.getDate() + i);
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = (d) => `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
const fmtShort = (d) => `${d.getDate()} ${MON[d.getMonth()]}`;

/* ── the one-line hooks, in plan order ────────────────────────────────────── */

const HOOKS = [
  ['S365', 'Looking ahead: “Come, Lord Jesus!”'],
  ['S002', 'The first promise of a rescuer'],
  ['S006', 'God’s promise to Abraham, under the stars'],
  ['S008', 'Abraham and Isaac: “God will provide”'],
  ['S085', 'Bethlehem, and the family line of David'],
  ['S090', 'A shepherd boy is anointed in Bethlehem'],
  ['S191', 'Immanuel, and “a child is born to us”'],
  ['S199', '“Comfort, comfort my people”'],
  ['S257', 'A ruler from Bethlehem who brings peace'],
  ['S200', 'The gentle Servant'],
  ['S202', 'The messenger with good news of peace'],
  ['S203', 'The suffering Servant of Isaiah 53'],
  ['S215', '“A future and a hope”; a new covenant'],
  ['S238', 'God himself will shepherd his sheep'],
  ['S204', 'Good news for the poor'],
  ['S260', '“He will rejoice over you with joyful songs”'],
  ['S172', 'Psalm 98, behind “Joy to the World”'],
  ['S339', '“Always be full of joy in the Lord”'],
  ['S298', 'The Word became human', 'O Wisdom'],
  ['S019', 'God speaks from the burning bush', 'O Lord'],
  ['S192', 'A shoot from Jesse’s stump', 'O Root of Jesse'],
  ['S098', 'A throne that lasts for ever', 'O Key of David'],
  ['S265', 'The Sun of Righteousness rises', 'O Dayspring'],
  ['S264', '“Your king is coming”', 'O King of the Nations'],
  ['S266', '“God is with us”', 'O Emmanuel'],
  ['S285', '“The Savior… has been born today”', 'Christmas Eve'],
];

const BOOKS = {
  Rev: 'Revelation', Gen: 'Genesis', Rut: 'Ruth', '1Sa': '1 Samuel', Isa: 'Isaiah', Mic: 'Micah',
  Jer: 'Jeremiah', Eze: 'Ezekiel', Zep: 'Zephaniah', Psa: 'Psalms', Php: 'Philippians', Joh: 'John',
  Exo: 'Exodus', '2Sa': '2 Samuel', Mal: 'Malachi', Zec: 'Zechariah', Mat: 'Matthew', Luk: 'Luke',
};

const WEEKS = [
  { key: 'hope', title: 'Week 1 · Hope', color: '#6A4C93' },
  { key: 'peace', title: 'Week 2 · Peace', color: '#3F6FB5' },
  { key: 'joy', title: 'Week 3 · Joy', color: '#C2507A' },
  { key: 'love', title: 'Week 4 · Love', color: '#8E3FA0' },
];

/* ── checks ───────────────────────────────────────────────────────────────── */

const segs = plan.segments;
const fail = (msg) => {
  console.error(`build-advent-flyer: ${msg}`);
  process.exit(1);
};
if (segs.length !== HOOKS.length) fail(`plan has ${segs.length} stories, flyer has ${HOOKS.length} hooks`);
segs.forEach((s, i) => {
  if (s.segmentId !== HOOKS[i][0]) fail(`day ${i + 1} is ${s.segmentId} in the app but ${HOOKS[i][0]} here`);
  if (!BOOKS[s.book]) fail(`no full name for book ${s.book}`);
});
const lastDay = dayDate(segs.length - 1);
if (!(lastDay.getMonth() === 11 && lastDay.getDate() === 24)) {
  fail(`${segs.length} stories from ${fmt(START)} end on ${fmt(lastDay)}, not 24 Dec`);
}
const minutes = segs.map((s) => times[s.segmentId].estimatedReadingTimeMinutes);
const total = minutes.reduce((a, b) => a + b, 0);
const mean = total / minutes.length;
const longest = Math.max(...minutes);
if (Math.round(mean) < 9 || Math.round(mean) > 10) fail(`mean story is ${mean.toFixed(1)} min — "about ten minutes" no longer holds`);

/* ── rows ─────────────────────────────────────────────────────────────────── */

function refText(ref) {
  const [a, b] = ref.split('-');
  if (!b) return a;
  const [ca] = a.split(':');
  const [cb, vb] = b.split(':');
  return ca === cb && vb ? `${a}–${vb}` : `${a}–${b}`;
}

const days = segs.map((s, i) => ({
  n: i + 1,
  date: dayDate(i),
  sunday: dayDate(i).getDay() === 0,
  last: i === segs.length - 1,
  week: s.phase,
  ref: `${BOOKS[s.book]} ${refText(s.ref)}`,
  hook: HOOKS[i][1],
  tag: HOOKS[i][2] || '',
  min: minutes[i],
}));

const sundays = days.filter((d) => d.sunday);
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const dayRow = (d, color) => `
            <div class="day${d.sunday ? ' sun' : ''}${d.last ? ' eve' : ''}" style="--wk: ${color}">
              <div class="when">${fmt(d.date)}</div>
              <div class="what">
                <div class="ref">${esc(d.ref)}</div>
                <div class="hook">${d.tag ? `<b>${esc(d.tag)}</b> · ` : ''}${esc(d.hook)}</div>
              </div>
            </div>`;

const weekBlock = (w) => {
  const rows = days.filter((d) => d.week === w.key);
  return `
          <div class="week" style="--wk: ${w.color}">
            <div class="week-head">
              <span class="week-title">${w.title}</span>
              <span class="week-dates">${fmtShort(rows[0].date)} – ${fmtShort(rows[rows.length - 1].date)}</span>
            </div>
            <div class="thread">${rows.map((d) => dayRow(d, w.color)).join('')}
            </div>
          </div>`;
};

const shortRef = (d) => d.ref.replace(/(\d+):\d+–(\d+):\d+$/, '$1–$2');
const keyDates = [
  ...sundays.map((d, i) => ({ when: fmt(d.date), label: WEEKS[i].title, ref: shortRef(d), color: WEEKS[i].color })),
  { when: fmt(lastDay), label: 'Christmas Eve', ref: days[days.length - 1].ref, color: '#0E6B4C' },
];

const qr = (file) => fs.readFileSync(path.join(HERE, file), 'utf8');

const masthead = (flag) => `
      <div class="masthead">
        <img src="icon.png" alt="" />
        <div>
          <div class="name">SourceView Together</div>
          <div class="sub">Bible App · iOS &amp; Android</div>
        </div>
        <div class="flag">${flag}</div>
      </div>
      <div class="rule"><i></i><i></i><i></i><i></i></div>`;

/* ── page ─────────────────────────────────────────────────────────────────── */

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>SourceView Together — Advent ${YEAR} for churches, families and small groups</title>
    <!--
      GENERATED by build-advent-flyer.mjs — edit that file, not this one.
      Two A4 pages. Print from Chrome: margins None, background graphics ON.
      Every date, reference and figure comes from the app's data; see SOURCES.md.
    -->
    <link rel="stylesheet" href="brand.css" />
    <style>
      :root {
        --advent: #6a4c93;
        --advent-fill: #f1edf6;
        --sans: 'ManropeFallback', Manrope, -apple-system, 'SF Pro Text', 'Helvetica Neue', Inter,
          Helvetica, Arial, sans-serif;
      }
      h1 { font-size: 26pt; margin-top: 5mm; }
      h1 em { font-style: normal; color: var(--advent); }
      .lede { font-size: 11pt; margin-top: 3mm; }
      .sect { margin-top: 4.5mm; }
      .roles .role { padding: 3mm 3.2mm 3.4mm; }
      .roles .what { font-size: 8.2pt; }

      .rooms { display: grid; grid-template-columns: 1fr 1fr; gap: 3.5mm; }
      .room { background: var(--surf); border: 0.4mm solid var(--hair); border-radius: 3.5mm; padding: 3.5mm 4.5mm 3.8mm; }
      .room .kick { font-size: 7.5pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase; color: var(--advent); }
      .room .t { font-size: 13pt; font-weight: 700; letter-spacing: -0.3pt; margin-top: 1mm; }
      .room .b { font-size: 9.2pt; line-height: 1.42; color: var(--narr); margin-top: 1.2mm; }
      .seats { display: flex; gap: 1.4mm; margin-top: 2.4mm; }
      .seats i { width: 5mm; height: 5mm; border-radius: 1.6mm; border-top-left-radius: 0.6mm; display: block; }

      .dates { display: grid; grid-template-columns: repeat(5, 1fr); gap: 2.5mm; }
      .date { border-top: 0.9mm solid var(--wk); padding-top: 2.2mm; }
      .date .when { font-size: 12pt; font-weight: 700; letter-spacing: -0.4pt; line-height: 1.1; }
      .date .label { font-size: 8pt; font-weight: 700; color: var(--wk); margin-top: 1mm; }
      .date .ref { font-size: 8pt; color: var(--mute); margin-top: 0.6mm; line-height: 1.3; }

      .steps .step::before { background: var(--advent); }
      .step::before { width: 6mm; height: 6mm; font-size: 9pt; margin-bottom: 1.8mm; }
      .step .t { font-size: 10.5pt; }
      .step .b { font-size: 8.7pt; }
      .foot { bottom: 9mm; padding-top: 3.5mm; }

      .qrs { display: flex; gap: 5mm; }
      .qr { text-align: center; }
      .qr svg { width: 17mm; height: 17mm; display: block; background: var(--surf); padding: 1.4mm; border-radius: 2mm; border: 0.3mm solid var(--hair); box-sizing: content-box; }
      .qr div { font-size: 7.5pt; font-weight: 700; margin-top: 1.2mm; letter-spacing: 0.2pt; }

      /* page 2 — the journey, drawn on the app's thread */
      .cal { display: grid; grid-template-columns: 1fr 1fr; gap: 0 6mm; margin-top: 4mm; }
      .week { margin-bottom: 3.2mm; }
      .week-head { display: flex; align-items: baseline; gap: 2.5mm; margin-bottom: 1.6mm; }
      .week-title { font-size: 11.5pt; font-weight: 700; letter-spacing: -0.3pt; color: var(--wk); }
      .week-dates { font-size: 7.5pt; letter-spacing: 1.1pt; text-transform: uppercase; color: var(--mute); }
      .thread { position: relative; padding-left: 5mm; }
      .thread::before { content: ''; position: absolute; left: 1.15mm; top: 2mm; bottom: 2.4mm; width: 0.45mm; background: var(--thread); border-radius: 1mm; }
      .day { position: relative; display: grid; grid-template-columns: 18.5mm 1fr; gap: 0 1.2mm; padding: 0.6mm 0; }
      .day::before { content: ''; position: absolute; left: -5mm; top: 1.7mm; width: 2.75mm; height: 2.75mm; border-radius: 50%; background: var(--bg); border: 0.45mm solid var(--thread); box-sizing: border-box; }
      .day.sun::before, .day.eve::before { background: var(--wk); border-color: var(--wk); }
      .day .when { font-size: 7.4pt; font-weight: 600; letter-spacing: 0.2pt; text-transform: uppercase; color: var(--mute); padding-top: 0.55mm; white-space: nowrap; }
      .day.sun .when, .day.eve .when { color: var(--wk); font-weight: 700; }
      .day .ref { font-size: 9.2pt; font-weight: 700; letter-spacing: -0.15pt; line-height: 1.22; }
      .day .hook { font-size: 8pt; line-height: 1.28; color: var(--mute); }
      .day .hook b { color: var(--wk); font-weight: 700; }
      .legend { font-size: 7.9pt; line-height: 1.42; color: var(--narr); background: var(--advent-fill); border-radius: 3mm; padding: 2.8mm 3.6mm; margin-top: 0.5mm; }
      .legend b { color: var(--advent); }
      .legend .dot { display: inline-block; width: 2.4mm; height: 2.4mm; border-radius: 50%; background: var(--advent); vertical-align: -0.2mm; margin-right: 1mm; }

      .lower { position: absolute; left: 15mm; right: 15mm; bottom: 15mm; display: grid; grid-template-columns: 1.15fr 1fr; gap: 4mm; }
      .notice { background: var(--surf); border: 0.4mm dashed var(--thread); border-radius: 3.5mm; padding: 3.4mm 4mm; }
      .notice p { font-size: 8.6pt; line-height: 1.42; margin-top: 1.2mm; color: var(--ink); }
      .slab { padding: 3.4mm 4mm; border-radius: 3.5mm; }
      .slab h3 { margin-bottom: 2mm; }
      .slab .bul li { font-size: 8.4pt; line-height: 1.38; color: var(--cream); margin-bottom: 1.2mm; padding-left: 4.5mm; }
      .slab .bul li::before { background: var(--cream); opacity: 0.7; width: 2mm; height: 2mm; top: 1.6mm; }
      .credit { position: absolute; left: 15mm; right: 15mm; bottom: 8mm; font-size: 7pt; color: var(--mute); letter-spacing: 0.2pt; display: flex; justify-content: space-between; }
    </style>
  </head>
  <body>
    <div class="page">${masthead('Advent ' + YEAR + '<br />Churches, families &amp; small groups')}

      <h1>Four voices. Ten minutes.<br />One story a day <em>to Christmas Eve.</em></h1>

      <p class="lede">
        From ${fmt(START).replace('Sun', 'Sunday').replace('Nov', 'November')}, the free SourceView Together app reads
        through Advent in ${segs.length} stories, from the first promise in Genesis to the manger in Luke.
        Every line is coloured by who is speaking and every story is split into four reading
        parts, so four people can read it out loud with nothing to prepare.
      </p>

      <div class="sect">
        <h3>Four parts, four colours</h3>
        <div class="roles">
          <div class="role narr">
            <div class="who">Narrator</div>
            <div class="what">Carries the story between the speeches</div>
          </div>
          <div class="role divine">
            <div class="who">God</div>
            <div class="what">Divine speech, including Jesus</div>
          </div>
          <div class="role prin">
            <div class="who">Principals</div>
            <div class="what">Abraham, Ruth, David, Isaiah — whoever the story centres on</div>
          </div>
          <div class="role chor">
            <div class="who">Everyone else</div>
            <div class="what">Angels, shepherds, crowds, supporting voices</div>
          </div>
        </div>
        <p class="small" style="margin-top: 2.5mm">
          When a story has fewer kinds of voice, the app splits the busiest one between readers,
          so all four still have a part, and nobody has to work out whose turn it is.
        </p>
      </div>

      <div class="sect">
        <h3>Two rooms where four people are already together</h3>
        <div class="rooms">
          <div class="room">
            <div class="kick">Families</div>
            <div class="t">Around the table</div>
            <div class="b">
              One story after dinner, each person reading a part: a child voices the angels while a
              grandparent narrates. Four questions written for families follow every story.
            </div>
            <div class="seats"><i style="background: var(--narr)"></i><i style="background: var(--divine)"></i><i style="background: var(--prin)"></i><i style="background: var(--chor)"></i></div>
          </div>
          <div class="room">
            <div class="kick">Small groups</div>
            <div class="t">In fours, out loud</div>
            <div class="b">
              Read the daily story through the week. When you meet, split into fours and read
              Sunday’s story in parts, then use the four questions written for small groups.
            </div>
            <div class="seats"><i style="background: var(--narr)"></i><i style="background: var(--divine)"></i><i style="background: var(--prin)"></i><i style="background: var(--chor)"></i></div>
          </div>
        </div>
      </div>

      <div class="sect">
        <h3>Key dates</h3>
        <div class="dates">${keyDates
          .map(
            (k) => `
          <div class="date" style="--wk: ${k.color}">
            <div class="when">${k.when}</div>
            <div class="label">${k.label}</div>
            <div class="ref">${esc(k.ref)}</div>
          </div>`
          )
          .join('')}
        </div>
      </div>

      <div class="sect">
        <h3>How to join</h3>
        <div class="steps">
          <div class="step">
            <div class="t">Get the free app</div>
            <div class="b">Search “SourceView Together” on the App Store or Google Play, or scan a code below.</div>
          </div>
          <div class="step">
            <div class="t">Join the Advent Journey</div>
            <div class="b">In the Plan tab, start the Advent Journey. The app can remind you each day.</div>
          </div>
          <div class="step">
            <div class="t">Take a part and read</div>
            <div class="b">Open the day’s story together, read your colour aloud, then talk it through.</div>
          </div>
        </div>
      </div>

      <div class="foot">
        <div style="flex: 1">
          <div style="font-size: 12pt; font-weight: 700; letter-spacing: -0.3pt">
            Advent begins Sunday 29 November.
          </div>
          <div class="small" style="margin-top: 1.2mm">
            Joining late? Start with today’s reading or from Day 1. Free, no accounts, no sign-in.
          </div>
        </div>
        <div class="qrs">
          <div class="qr">${qr('qr-app-store.svg')}<div>App Store</div></div>
          <div class="qr">${qr('qr-google-play.svg')}<div>Google Play</div></div>
        </div>
      </div>
    </div>

    <div class="page">${masthead('The Advent Journey<br />' + fmtShort(START) + ' – ' + fmtShort(lastDay) + ' ' + YEAR)}

      <h2 style="margin: 5mm 0 1.5mm; font-size: 19pt">The Advent Journey, day by day</h2>
      <p class="small" style="margin: 0; font-size: 9pt">
        ${segs.length} stories · about ten minutes each, none longer than ${longest} · every story has four
        reading parts and questions to talk over
      </p>

      <div class="cal">
        <div>${weekBlock(WEEKS[0])}${weekBlock(WEEKS[2])}
        </div>
        <div>${weekBlock(WEEKS[1])}${weekBlock(WEEKS[3])}
          <div class="legend">
            <span class="dot"></span><b>Sundays.</b> On 6, 13 and 20 December the story contains the
            passage many churches read that day (Isaiah 40, Isaiah 61, 2 Samuel 7).<br />
            <b>17–23 December</b> follow the O Antiphons, the seven ancient names for Christ
            behind “O come, O come, Emmanuel”.
          </div>
        </div>
      </div>

      <div class="lower">
        <div class="notice">
          <h3 style="margin-bottom: 0">For your notice sheet or newsletter</h3>
          <p>
            This Advent we are reading the story together. From Sunday 29 November the free
            <b>SourceView Together</b> app has one story a day to Christmas Eve: ${segs.length} readings of
            about ten minutes, each with parts for four voices and questions to talk over. Gather
            your family or three friends, take a colour each and read it out loud. Search
            “SourceView Together” on the App Store or Google Play.
          </p>
        </div>
        <div class="slab">
          <h3>Good to know</h3>
          <ul class="bul">
            <li>Free. No accounts, no sign-in, no personal data leaves the device.</li>
            <li>The Bible text is inside the app, so it works without Wi-Fi.</li>
            <li>Late starters choose today’s reading or Day 1.</li>
            <li>After Christmas Eve, “12 Days of Christmas” runs 25 December to 5 January.</li>
          </ul>
        </div>
      </div>

      <div class="credit">
        <span>Scripture quotations are taken from the Holy Bible, New Living Translation.</span>
        <span>SourceView Together · Bible App for iOS and Android</span>
      </div>
    </div>
  </body>
</html>
`;

const out = path.join(HERE, 'advent-flyer-churches.html');
fs.writeFileSync(out, html);
console.log(`wrote ${path.relative(process.cwd(), out)}`);
console.log(`${segs.length} stories, ${fmt(START)} – ${fmt(lastDay)}, ${total} min total, mean ${mean.toFixed(1)}, longest ${longest}`);
