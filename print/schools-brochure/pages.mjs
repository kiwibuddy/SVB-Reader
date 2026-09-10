// The four A4 pages. Fixed composition, no paginator: every page is authored to
// its own height, which is what lets a four-page piece hold its rhythm.

import {
  INK, ROLES, stats, plans, featuredPlans, questionSets,
  spreadTurns, spreadMeta, openingWeeks,
} from './content.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n = (x) => x.toLocaleString('en-NZ');

const folio = (mark, num) =>
  `<div class="folio"><span class="mark">${mark}</span><span class="num">${num}</span></div>`;

const sec = (no, label) =>
  `<div class="sec-no"><b>${no}</b><span>${label}</span><i></i></div>`;

/** An iPhone frame. Falls back to a labelled slot until the screenshot lands. */
const device = (shot, cap, note) => `
<div class="shot">
  <div class="device"><div class="notch"></div><div class="glass">
    ${shot
      ? `<img src="${shot}" alt="${esc(cap)}">`
      : `<div class="slot"><b>${esc(cap)}</b><span>${esc(note)}</span></div>`}
  </div></div>
  <div class="cap">${esc(cap)}<span>${esc(note)}</span></div>
</div>`;

// ===========================================================================
// PAGE 1 · COVER
// ===========================================================================
export function coverPage() {
  // Luke 5:4-5, contiguous, straight out of the app's own Bible data.
  const stage = spreadTurns(2, 6).join('\n');
  return `
<section class="page cover">
  <div class="wash">
    <svg viewBox="0 0 210 297" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stop-color="#1E2833"/><stop offset="1" stop-color="#151C24"/>
        </linearGradient>
      </defs>
      <rect width="210" height="297" fill="url(#g1)"/>
      <!-- The thread: the app's spine motif, run through the band the type leaves
           empty between the sample exchange and the headline. -->
      <path d="M-10 132 C 44 120, 66 156, 112 148 S 178 104, 224 116"
            fill="none" stroke="#F2EAE0" stroke-opacity="0.12" stroke-width="0.5"/>
      <path d="M-10 141 C 38 130, 74 164, 120 155 S 182 114, 224 125"
            fill="none" stroke="#F2EAE0" stroke-opacity="0.06" stroke-width="0.5"/>
      <circle cx="112" cy="148" r="1.6" fill="#8FE3C0" fill-opacity="0.55"/>
    </svg>
  </div>
  <div class="cover-body">
    <div class="cover-top">
      <div class="brandmark">
        <div class="dots">
          ${ROLES.map((r) => `<i style="background:${INK[r.color].bar}"></i>`).join('')}
        </div>
        <div class="nm">SourceView Together</div>
      </div>
      <div class="free">Free · No ads · No accounts</div>
    </div>

    <div class="cover-stage">
      ${stage}
      <div class="ref">Luke 5:4–5 · Story 287 of 365 · Rendered from the app</div>
    </div>

    <div class="cover-title">
      <h1>Everyone in the room<br>has a <em>part</em>.</h1>
      <div class="say">
        A Bible reading app that sets Scripture out as the conversation it already is.
        Four source colours, four readers, and a complete story your class can read
        out loud inside one chapel period.
      </div>
    </div>

    <div class="cover-facts">
      <div><b>${n(stats.stories)}</b><span>Stories, Genesis to Revelation</span></div>
      <div><b>${n(stats.voices)}</b><span>Voices, each in its colour</span></div>
      <div><b>${ROLES.length}</b><span>Source colours to hand out</span></div>
      <div><b>${plans.total}</b><span>Reading plans and challenges</span></div>
    </div>

    <div class="cover-foot">
      <div>
        <b>For schools, chapels and student small groups</b><br>
        iOS and Android · English and French · New Living Translation
      </div>
      <div style="text-align:right">
        sourceviewbible@gmail.com<br>
        <b>Tauranga, New Zealand</b>
      </div>
    </div>
  </div>
</section>`;
}

// ===========================================================================
// PAGE 2 · HOW IT WORKS
// ===========================================================================
export function readingPage(shots = {}) {
  const meta = spreadMeta();
  const share = ROLES.map(
    (r) => `<i style="width:${(meta.totals[r.color] / meta.total) * 100}%;background:${INK[r.color].bar}"></i>`
  ).join('');

  const keys = ROLES.map((r) => `
    <div class="key k-${r.color}">
      <span class="dot" style="background:${INK[r.color].bar}"></span>
      <span class="who">${esc(r.who)}</span>
      <span class="what">${esc(r.what)}</span>
      <span class="n">${n(r.count)} ${r.count === 1 ? 'voice' : 'voices'}</span>
    </div>`).join('');

  return `
<section class="page">
  <div class="page-body">
    ${sec('01', 'The reading')}
    <h2 class="head" style="font-size:22.5pt">A class disengages the moment<br>it cannot tell who is speaking.</h2>
    <p class="lede">
      Open a printed Bible at the valley of Elah and the words of God, of Goliath and of a
      terrified army all arrive in the same black type. Reading aloud becomes a chore nobody
      volunteers for. SourceView Together colours every word by the voice that said it:
      <b>${n(stats.voices)} voices across ${n(stats.stories)} stories</b>, in four colours.
    </p>

    <div class="cols2" style="margin-top:6.5mm;">
      <div style="width:80mm; display:flex; flex-direction:column;">
        <h4 class="min">The four colours a class hands out</h4>
        <div class="keys">${keys}</div>

        <h4 class="min" style="margin-top:9mm">How a class reads a story</h4>
        <ol class="steps">
          <li><b>Open the same story.</b> Each student on their own device, or one
            device passed along a row. Nobody signs in and nothing needs setting up.</li>
          <li><b>Take a colour.</b> Four readers, one colour each. You read your colour
            out loud when it comes round, and the layout tells you when that is.</li>
          <li><b>Talk about it.</b> Four questions written for students sit at the end
            of every story, ready to go.</li>
        </ol>

        <div class="panel" style="margin-top:6mm">
          <p><b>Timing.</b> Stories run ${stats.minMinutes} to ${stats.maxMinutes} minutes
          of reading, about ${stats.medianMinutes} for most. Allow fifteen to twenty for a
          group reading aloud with the questions afterwards, which is a chapel slot or the
          back half of a period.</p>
        </div>
      </div>

      <div style="flex:1; display:flex; flex-direction:column;">
        <div class="spread">
          <div class="spread-head">
            <span class="t">${esc(meta.title)}</span>
            <span class="r">${esc(meta.reference.split(':')[0])} · ${meta.minutes} min</span>
          </div>
          ${spreadTurns(2, 6).join('\n')}
          <div class="spread-break">Later in the same story · Luke 5:12</div>
          ${spreadTurns(16, 17).join('\n')}
          <div class="spread-foot">
            <span class="sharebar">${share}</span>
            <span>Who does the talking in this story</span>
          </div>
        </div>
        <p class="body" style="margin-top:3.4mm; font-size:7.6pt">
          Set from the app's own text and colours. Narration and divine speech sit left,
          everyone else right, so the shape of a conversation is visible before a word
          is read.
        </p>
      </div>
    </div>


    <div class="shotband">
      <div class="why">
        <h4 class="min">On the phone</h4>
        <p>Five tabs, and a school only needs four of them. <b>Read</b> holds the year as
        one thread, so the whole Bible sits on a screen. <b>Cast</b> keeps every voice a
        student has heard. <b>Saved</b> holds the lines they reacted to.</p>
      </div>
      ${device(shots.thread, 'Read', 'The year on one thread')}
      ${device(shots.reader, 'The reader', 'A story in four colours')}
      ${device(shots.plan, 'Plan', 'Pick one, or build one')}
      ${device(shots.questions, 'Talk about it', 'Four questions, three sets')}
    </div>
  </div>
  ${folio('SourceView Together · For schools', '2')}
</section>`;
}

// ===========================================================================
// PAGE 3 · IN THE CLASSROOM
// ===========================================================================
export function classroomPage(shots = {}) {
  const q = questionSets;
  const set = (cls, tag, nm, dsc, items) => `
    <div class="qset ${cls}">
      <div class="tag">${esc(tag)}</div>
      <div class="nm">${esc(nm)}</div>
      <div class="dsc">${esc(dsc)}</div>
      <ol>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
    </div>`;

  const rows = featuredPlans.map((p) => `
    <tr>
      <td class="nm">${esc(p.title)}</td>
      <td class="fit">${esc(p.fit)}</td>
      <td class="num">${n(p.stories)}<span>stories</span></td>
    </tr>`).join('');

  const weekRows = openingWeeks(8).map((w) => `
    <div class="weeks-row">
      <span class="wk">${w.week}</span>
      <span class="ti">${esc(w.title)}</span>
      <span class="rf">${esc(w.reference)}</span>
      <span class="mn">${w.minutes} min</span>
    </div>`);

  return `
<section class="page">
  <div class="page-body">
    ${sec('02', 'After the reading')}
    <h2 class="head">One story, three sets of questions.</h2>
    <p class="lede">
      Every story ends with four questions, written three times over for three different
      rooms. Below is story one, <b>${esc(q.story)}</b>, in all three.
    </p>

    <div class="qsets" style="margin-top:7mm">
      ${set('is-lead', 'For schools', 'School', 'Middle and high school. Aimed at how a student sees the corridor on Monday.', q.school)}
      ${set('', 'For families', 'Family', 'Younger readers at the table. Shorter, plainer, asked as "we".', q.family)}
      ${set('', 'For small groups', 'Small group', 'Older students and staff. Room for a longer answer.', q.group)}
    </div>

    <div class="samples">
      <h4 class="min">School questions from elsewhere in the year</h4>
      ${q.samples.map((s) => `
        <div class="row"><span class="q">${esc(s.q)}</span><span class="from">${esc(s.story)}</span></div>`).join('')}
    </div>

    <div class="hair"></div>

    ${sec('03', 'The plans')}
    <h2 class="head" style="font-size:21pt">Built to fit a term, not a calendar year.</h2>
    <div class="cols2" style="margin-top:4mm; align-items:flex-start; gap:10mm;">
      <div style="flex:1">
        <table class="plans">
          <thead><tr><th>Plan</th><th>Fits</th><th class="num">Length</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div style="width:72mm">
        <div class="panel is-quiet">
          <p><b>${plans.total} plans and challenges</b> ship with the app, Advent and Lent
          among them. A class can also build its own from any stories it likes.</p>
          <p>Progress carries across a break, so a plan survives the holidays, and a
          student who joins in week six starts where the class is.</p>
        </div>
      </div>
    </div>
    <div class="weeks">
      <h4 class="min">Term one of Bible in 1 School Year, as it actually falls</h4>
      <div class="weeks-grid">
        <div>${weekRows.slice(0, 4).join("")}</div>
        <div>${weekRows.slice(4).join("")}</div>
      </div>
    </div>
  </div>
  ${folio('SourceView Together · For schools', '3')}
</section>`;
}

// ===========================================================================
// PAGE 4 · RUNNING IT, AND THE ASK
// ===========================================================================
export function runningPage(qrSvg) {
  const way = (t, body) => `
    <div>
      <h3 class="sub">${esc(t)}</h3>
      <p class="body">${body}</p>
    </div>`;

  return `
<section class="page">
  <div class="page-body">
    ${sec('04', 'Running it')}
    <h2 class="head">Three ways schools use it.</h2>

    <div class="cols3" style="margin-top:7mm">
      ${way('Chapel', `Four readers on stage with the story on their phones, the rest of the
        year level following on theirs. Rotate the colours weekly so the reading is never
        the same four students. Senior students can run it for junior grades without a
        staff member scripting it.`)}
      ${way('Small groups', `A group of four is exactly the shape of the app. One story, one
        colour each, then the school questions. It works in a form room at lunch, in a
        boarding house after dinner, or with staff before the day starts.`)}
      ${way('Classroom', `Religious education, character or ethics. The colours make the
        source of a claim visible, which is a useful habit well beyond this text. Set a
        story as reading, then run the discussion questions in class.`)}
    </div>

    <div class="hair"></div>

    ${sec('05', 'What a school is agreeing to')}
    <div class="cols2" style="align-items:flex-start; margin-top:4mm">
      <div style="flex:1">
        <h2 class="head" style="font-size:20pt">Nothing about a student<br>leaves their device.</h2>
        <p class="body" style="max-width:86mm">
          There are no accounts to create, so there is no student roll to hand over and no
          password for a fourteen year old to forget. A phone that never had the app can
          be handed to a student and used inside a minute.
        </p>
        <div class="reqs">
          <h4 class="min">What a device needs</h4>
          <div class="row"><span>Apple</span><span>iOS 16.4 or later</span></div>
          <div class="row"><span>Android</span><span>Android 8 or later</span></div>
          <div class="row"><span>Tablets</span><span>Supported on both</span></div>
          <div class="row"><span>Network</span><span>Download, then offline</span></div>
        </div>
      </div>
      <div style="width:88mm">
        <ul class="ticks">
          <li><b>No accounts, no sign-in, no email address.</b> A student opens the app and reads.</li>
          <li><b>No advertising and no in-app purchases.</b> The app is free, and free is the whole model.</li>
          <li><b>No behavioural analytics.</b> Progress, notes and reactions are written to a database on the phone and stay there.</li>
          <li><b>Works offline.</b> Useful on camp, on a bus, and in a hall where the wifi gives up.</li>
          <li><b>Optional reminders</b> are scheduled by the phone itself. No notification server, no tokens leaving the device.</li>
          <li><b>English and French</b>, both offline, for a bilingual or immersion setting.</li>
        </ul>
        <p class="body" style="font-size:8pt; color:#7A857D">
          Crash reports may be sent if the app fails. They carry the device model and the
          error, never notes, reactions or reading history.
        </p>
      </div>
    </div>

    <div class="close">
      <h3>Try it with one group of eight before you take it to a staff meeting.</h3>
      <p>
        Download it, hand four colours to four students, and read one story. That is the whole
        trial, and it takes a lunchtime. If it works, I will help you plan the term or the year
        around it, at no cost. <b>Book a setup call and we will map it to your chapel calendar.</b>
      </p>
      <div class="close-grid">
        <div class="who">
          <div class="lbl">Set it up with</div>
          <div class="val">Nathaniel Baldock<span>Built SourceView Together · Tauranga, New Zealand</span></div>
          <div class="lbl" style="margin-top:6mm">Email</div>
          <div class="val">sourceviewbible@gmail.com</div>
          <div class="storelinks">
            <div class="storelink"><b>iOS</b>App Store · SourceView Together</div>
            <div class="storelink"><b>Android</b>Google Play · SourceView Together</div>
          </div>
        </div>
        <div>
          <div class="qr">${qrSvg}</div>
          <div class="qr-cap">Scan to<br>download</div>
        </div>
      </div>
    </div>

    <div class="colophon">
      <div><b>SourceView Together ${'1.3.0'}</b> · New Living Translation · iOS 16.4+ or Android 8+</div>
      <div>${n(stats.stories)} stories · ${n(stats.voices)} voices · ${n(stats.words)} attributed words</div>
    </div>
  </div>
  ${folio('SourceView Together · For schools', '4')}
</section>`;
}
