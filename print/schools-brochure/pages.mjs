// The four A4 pages. Fixed composition, no paginator: every page is authored to
// its own height, which is what lets a four-page piece hold its rhythm.
//
// Copy rule for this document: it is written to the person holding it, a teacher
// or a chaplain, not about them. "Your class", not "a class".

import {
  INK, ROLES, stats, plans, featuredPlans, questionSets,
  spreadTurns, spreadMeta, openingWeeks, COVER, SPREAD,
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
  <div class="device">
    <div class="screen">
      ${shot
        ? `<img src="${shot}" alt="${esc(cap)}">`
        : `<div class="slot"><b>${esc(cap)}</b><span>${esc(note)}</span></div>`}
    </div>
    <span class="island"></span>
  </div>
  <div class="cap">${esc(cap)}<span>${esc(note)}</span></div>
</div>`;

// ===========================================================================
// PAGE 1 · COVER
// ===========================================================================
export function coverPage() {
  const stage = spreadTurns(COVER).join('\n');
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
      <!-- The thread: the app's spine motif, run through the narrow band the type
           leaves empty between the sample exchange and the headline. Keep every
           point inside y 126-142 or it collides with one of them. -->
      <path d="M-10 134 C 40 128, 90 126, 150 133 S 210 140, 224 137"
            fill="none" stroke="#F2EAE0" stroke-opacity="0.12" stroke-width="0.5"/>
      <path d="M-10 139 C 44 133, 94 131, 152 138 S 212 142, 224 140"
            fill="none" stroke="#F2EAE0" stroke-opacity="0.06" stroke-width="0.5"/>
      <circle cx="150" cy="133" r="1.6" fill="#8FE3C0" fill-opacity="0.55"/>
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
      <div class="ref">${COVER.ref} · Story 287 of 365 · Rendered from the app</div>
    </div>

    <div class="cover-title">
      <h1>365 new adventures.<br>The whole Bible in <em>speech bubbles</em>.</h1>
      <div class="deck">A new Bible reading experience for your class.</div>
      <div class="say">
        Not one word has been added, moved or removed. This is the complete New Living
        Translation, all 66 books, set out so that every word carries the colour of
        whoever said it. Hand four colours to four students and the story reads itself.
      </div>
    </div>

    <div class="cover-facts">
      <div><b>66</b><span>Books, complete</span></div>
      <div><b>${n(stats.stories)}</b><span>Stories to read aloud</span></div>
      <div><b>${n(stats.voices)}</b><span>Voices, each in its colour</span></div>
      <div><b>${ROLES.length}</b><span>Colours to hand out</span></div>
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
  const meta = spreadMeta(SPREAD);
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

  const era = (yr, wh, now = false) => `
    <div class="tl${now ? ' is-now' : ''}">
      <span class="yr">${esc(yr)}</span>
      <span class="wh">${esc(wh)}</span>
      ${now ? `<span class="swatches">${ROLES.map((r) => `<i style="background:${INK[r.color].bar}"></i>`).join('')}</span>` : ''}
    </div>`;

  return `
<section class="page">
  <div class="page-body">
    ${sec('01', 'The reading')}
    <h2 class="head" style="font-size:22.5pt">Red letters gave one voice a colour.<br>This gives all ${n(stats.voices)}.</h2>
    <p class="lede">
      You already know how this works. A publisher put the words of Jesus in red, and one
      voice in your Bible has looked different ever since. SourceView Together does that for
      <b>every speaker in Scripture</b>: God and Jesus red, the narrator black, the main
      character green, everyone else blue.
    </p>

    <div class="timeline">
      ${era('c. 1227', 'Chapters')}
      ${era('1551', 'Verse numbers')}
      ${era('1899', 'Red letters')}
      ${era('Now', 'Four colours', true)}
    </div>

    <div class="cols2" style="margin-top:6.5mm;">
      <div style="width:80mm; display:flex; flex-direction:column;">
        <h4 class="min">The four colours you hand out</h4>
        <div class="keys">${keys}</div>

        <h4 class="min" style="margin-top:5.5mm">How your class reads a story</h4>
        <ol class="steps">
          <li><b>Open the same story.</b> Everyone on their own device, or pass one phone
            along a row. Nobody signs in and there is nothing to set up.</li>
          <li><b>Take a colour.</b> Four readers, one each. Each student reads their colour
            out loud when it comes round, and the layout tells them when.</li>
          <li><b>Talk about it.</b> Four questions are already waiting at the end. Fifteen
            to twenty minutes covers the lot, which is a chapel slot.</li>
        </ol>

        <div class="pullout">
          <h5>Leviticus is almost entirely red.<br>Esther has none at all.</h5>
          <p>Red is God speaking, so one book is <b>88 per cent his voice</b> and the other
          never quotes him once. Your students can see that from across the room.</p>
        </div>
      </div>

      <div style="flex:1; display:flex; flex-direction:column;">
        <div class="spread">
          <div class="spread-head">
            <span class="t">${esc(meta.title)}</span>
            <span class="r">${esc(SPREAD.ref)} · ${meta.minutes} min story</span>
          </div>
          ${spreadTurns(SPREAD).join('\n')}
          <div class="spread-foot">
            <span class="sharebar">${share}</span>
            <span>Who does the talking in this story</span>
          </div>
        </div>
        <p class="body" style="margin-top:3.4mm; font-size:7.6pt">
          Set from the app's own text and colours. Narration and divine speech sit left,
          everyone else right, so you see the shape of a conversation before you read it.
        </p>
      </div>
    </div>

    <div class="shotband">
      <div class="why">
        <h4 class="min">On the phone</h4>
        <p>Every one of the ${n(stats.voices)} voices has a page of its own: what they say,
        where they turn up, and who they speak with most. Moses talks with God 82 times.
        <b>Read</b> holds the year as one thread and <b>Saved</b> keeps the lines your
        students reacted to.</p>
      </div>
      ${device(shots.cast, 'Cast', 'Who each voice speaks with')}
      ${device(shots.reader, 'Reader', 'A story in four colours')}
      ${device(shots.plan, 'Plan', 'Pick one or build one')}
      ${device(shots.questions, 'Questions', 'Three sets, four each')}
    </div>
  </div>
  ${folio('SourceView Together · For schools', '2')}
</section>`;
}

// ===========================================================================
// PAGE 3 · IN THE CLASSROOM
// ===========================================================================
export function classroomPage() {
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
      Every story ends with four questions, written three times over so you can pick the
      set that matches the room you are in. Here is story one, <b>${esc(q.story)}</b>, in
      all three.
    </p>

    <div class="qsets" style="margin-top:7mm">
      ${set('is-lead', 'For your classroom', 'School', 'Middle and high school. Pointed at how your students treat each other on Monday morning.', q.school)}
      ${set('', 'For families', 'Family', 'Younger readers around a table. Shorter, plainer, and asked as "we".', q.family)}
      ${set('', 'For small groups', 'Small group', 'Senior students, youth group, or your staff. Room for a longer answer.', q.group)}
    </div>

    <div class="samples">
      <h4 class="min">School questions from elsewhere in the year</h4>
      ${q.samples.map((s) => `
        <div class="row"><span class="q">${esc(s.q)}</span><span class="from">${esc(s.story)}</span></div>`).join('')}
    </div>

    <div class="hair"></div>

    ${sec('03', 'The plans')}
    <h2 class="head" style="font-size:21pt">Plans that fit your term.</h2>
    <div class="cols2" style="margin-top:4mm; align-items:flex-start; gap:10mm;">
      <div style="flex:1">
        <table class="plans">
          <thead><tr><th>Plan</th><th>Fits</th><th class="num">Length</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div style="width:72mm">
        <div class="panel is-quiet">
          <p><b>${plans.total} plans and challenges</b> come with the app, Advent and Lent
          among them, and you can build your own out of any stories you like.</p>
          <p>Progress carries across a break, so a plan survives the holidays and a student
          who joins you in week six starts where your class is.</p>
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
    <h2 class="head">Three ways to run it.</h2>

    <div class="cols3" style="margin-top:7mm">
      ${way('In chapel', `Put four readers on stage with the story on their phones and let
        the year level follow on theirs. Rotate the colours weekly so it is never the same
        four students. Your seniors can run it for junior grades without you scripting
        anything for them.`)}
      ${way('In small groups', `A group of four is exactly the shape of the app. One story,
        one colour each, then the questions. It works in a form room at lunch, in a boarding
        house after dinner, or with your staff before the day starts.`)}
      ${way('In class', `Religious education, character, or ethics. The colours make the
        source of a claim visible, which is a habit worth having well beyond this text. Set
        a story as reading, then run the questions with your class.`)}
    </div>

    <div class="hair"></div>

    ${sec('05', 'What you are agreeing to')}
    <div class="cols2" style="align-items:flex-start; margin-top:4mm">
      <div style="flex:1">
        <h2 class="head" style="font-size:17.5pt">Nothing about your students<br>leaves their device.</h2>
        <p class="body" style="max-width:86mm">
          There are no accounts to create, so you have no student roll to hand over and no
          password for a fourteen year old to forget. Give a student a phone that has never
          had the app on it and they are reading inside a minute.
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
          <li><b>No accounts, no sign-in, no email address.</b> Your students open the app and read.</li>
          <li><b>No advertising and no in-app purchases.</b> It is free, and free is the whole model.</li>
          <li><b>No behavioural analytics.</b> Progress, notes and reactions are written to a database on the phone and stay there.</li>
          <li><b>Works offline.</b> Useful on camp, on a bus, and in a hall where the wifi gives up.</li>
          <li><b>Optional reminders</b> are scheduled by the phone itself. No notification server, no tokens leaving the device.</li>
          <li><b>English and French</b>, both offline, if you have a bilingual or immersion class.</li>
        </ul>
        <p class="body" style="font-size:8pt; color:#7A857D">
          If the app crashes, a diagnostic report may reach us. It carries the device model
          and the error, never a student's notes, reactions or reading history.
        </p>
      </div>
    </div>

    <div class="close">
      <h3>Try it with one group of eight before you take it to a staff meeting.</h3>
      <p>
        Download it, hand four colours to four students, and read one story together. That is
        the whole trial and it costs you a lunchtime. If it works, I will help you plan the
        term or the year around it, at no cost. <b>Book a setup call and we will map it to
        your chapel calendar.</b>
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
      <div><b>SourceView Together 1.3.0</b> · New Living Translation · iOS 16.4+ or Android 8+</div>
      <div>66 books · ${n(stats.stories)} stories · ${n(stats.voices)} voices</div>
    </div>
  </div>
  ${folio('SourceView Together · For schools', '4')}
</section>`;
}
