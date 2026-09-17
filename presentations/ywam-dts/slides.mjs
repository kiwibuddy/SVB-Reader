import * as D from './data.mjs';
import { STATS, REACH } from './stats.mjs';
import * as P from './phone.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const QR = JSON.parse(fs.readFileSync(path.join(here, 'qr.json'), 'utf8'));

const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const n = (x) => x.toLocaleString('en-NZ');
const S = D.stats();
const jonah = D.story(D.JONAH);
const jTurns = D.turns(D.JONAH);
const jos = D.story('S123');
const neh = D.story('S151');
const OT = D.plan('Old Testament Journey');
const NT = D.plan('New Testament Journey');

// House reveal wrapper: .a plus .d1-.d5 for the stagger.
let ai = 0;
const a = (h) => { const d = ai ? ` d${Math.min(ai,5)}` : ''; ai++; return `<div class="a${d}">${h}</div>`; };
const reset = () => { ai = 0; };

const label = (t) => `<span class="t-label a">${t}</span>`;
const foot = (movement) =>
  `<div class="slide-foot"><span>Reading together &nbsp;·&nbsp; YWAM Kona</span><span>${movement}</span></div>`;

const statCard = (c, cls) => `
  <button class="card stat-card ${cls}" ${c.modal ? `data-modal="${c.id}"` : ''}>
    <span class="stat-num"><span class="counter" data-target="${c.to}" data-suffix="${c.suffix || ''}">0${c.suffix || ''}</span></span>
    <p>${esc(c.label)}</p>
    ${c.note ? `<div class="stat-src">${esc(c.note)}</div>` : ''}
    ${c.modal ? `<div class="click-hint">Tap for source</div>` : ''}
  </button>`;

const bars = (rows, unit) => {
  // Percentages draw against a full 100, so a 43 never reads as a 75.
  const peak = Math.max(...rows.map((r) => r.value));
  const max = String(unit).trim() === '%' ? 100 : peak;
  return `<div class="chart-wrap">${rows.map((r) => {
    const tint = r.color ? `background:var(--k-${r.color})` : '';
    return `
    <div class="bar-row">
      <div class="bar-label">${esc(r.label)}</div>
      <div class="bar-track"><div class="bar-fill" style="--w:${(r.value / max) * 100}%;${tint}"></div></div>
      <div class="bar-val">${r.value}${unit}</div>
    </div>`;
  }).join('')}</div>`;
};

const qr = (k, name) => `
  <div class="qrbox">
    <div class="q">${QR[k].svg}</div>
    <div class="n">${name}</div>
    <div class="u">${esc(QR[k].short)}</div>
  </div>`;

// ===========================================================================
export function slides() {
  const out = [];
  const add = (html, note) => { reset(); out.push({ html, note }); };

  // ---- OPENING ------------------------------------------------------------
  const run = [
    ['00-04', 'Open', 'Where this goes'],
    ['04-16', 'What is happening', 'The research, and who is driving it'],
    ['16-26', 'The habit we built', 'And an older one we stopped using'],
    ['26-33', 'Four colours', 'The format change'],
    ['33-38', 'Two plans', 'Lecture phase and outreach'],
    ['38-42', 'How four people read', 'The mechanic'],
    ['42-57', 'Breakouts: read Jonah', 'You do it, not me'],
    ['57-60', 'Back together', 'Feedback and questions'],
  ];
  add(`
    <div class="sl"><div class="sl-pad">
      ${label('Opening &nbsp;·&nbsp; where this goes')}
      ${a(`<h2 class="t-h3">You are going to end up in a breakout room reading Jonah out loud with three other people.</h2>`)}
      ${a(`<div class="run" style="margin-top:1.4rem">${run.map(([t, ti, no], i) => `
        <div class="r${i === 6 ? ' now' : ''}"><span class="tm">${t}</span><span class="ti">${ti}</span><span class="no">${no}</span></div>`).join('')}</div>`)}
      ${a(`<p class="t-body" style="margin-top:1.2rem;max-width:960px">Everything before that green row exists to get you into that room. So keep a phone within reach.</p>`)}
      ${foot('Opening')}
    </div></div>`,
    'Flag the breakout now so nobody is surprised. Ask them to have a phone within reach.');

  // ---- MOVEMENT 1 · WHAT IS HAPPENING -------------------------------------
  const R = STATS.resurgence;
  add(`
    <div class="sl"><div class="sl-pad">
      ${label(R.eyebrow)}
      ${a(`<h2 class="t-h3">${R.head}</h2>`)}
      ${a(`<div class="grid grid-3" style="margin-top:1.6rem">${R.counters.map((c, i) => statCard(c, `d${i + 2}`)).join('')}</div>`)}
      ${a(`<div class="src-note" style="margin-top:1.3rem">${esc(R.source)}</div>`)}
      ${foot('Movement 1 &nbsp;·&nbsp; What is happening')}
    </div></div>`,
    'Do not rush this. The direction of travel is the point, not the decimal. Every card opens its source.');

  const M = STATS.men;
  add(`
    <div class="sl"><div class="sl-pad">
      ${label(M.eyebrow)}
      ${a(`<h2 class="t-h3">${M.head}</h2>`)}
      ${a(`<p class="t-body-lg" style="margin-top:.9rem">${esc(M.lede)}</p>`)}
      ${a(`<div style="margin-top:1.6rem">${bars(M.bars, M.unit)}</div>`)}
      ${a(`<div class="src-note" style="margin-top:1.3rem">${esc(M.source)}</div>`)}
      ${foot('Movement 1 &nbsp;·&nbsp; What is happening')}
    </div></div>`,
    'This is the slide that usually gets a reaction. Let it land before moving on.');

  const U = STATS.uk;
  add(`
    <div class="sl"><div class="sl-pad">
      ${label(U.eyebrow)}
      ${a(`<h2 class="t-h3">${U.head}</h2>`)}
      ${a(`<div class="grid grid-2" style="margin-top:1.6rem;max-width:840px">${U.counters.map((c, i) => statCard(c, `d${i + 2}`)).join('')}</div>`)}
      ${a(`<div class="callout blue" style="margin-top:1.4rem;max-width:840px">Sample size 13,146. Not a small poll, and the same age and gender pattern as the reading figures.</div>`)}
      ${a(`<div class="src-note" style="margin-top:1rem">${esc(U.source)}</div>`)}
      ${foot('Movement 1 &nbsp;·&nbsp; What is happening')}
    </div></div>`,
    'The UK number is useful because it counts attendance, not self-reported reading.');

  const A = STATS.ai;
  add(`
    <div class="sl"><div class="sl-pad">
      ${label(A.eyebrow)}
      ${a(`<h2 class="t-h3">${A.head}</h2>`)}
      ${a(`<div style="margin-top:1.6rem">${bars(A.bars, A.unit)}</div>`)}
      ${a(`<p class="t-body" style="margin-top:1.3rem">I am not going to moralise about any of that. I just want it sitting on the table before we talk about what happens when people read together.</p>`)}
      ${a(`<div class="src-note" style="margin-top:1rem">${esc(A.source)}</div>`)}
      ${foot('Movement 1 &nbsp;·&nbsp; What is happening')}
    </div></div>`,
    'Show it, do not preach it. The argument comes later.');

  add(`
    <div class="sl"><div class="sl-pad">
      ${label(REACH.eyebrow)}
      ${a(`<h2 class="t-h3">${REACH.head}</h2>`)}
      ${a(`<p class="t-body-lg" style="margin-top:.9rem">${esc(REACH.lede)}</p>`)}
      ${a(`<div class="grid grid-2" style="margin-top:1.6rem">
        <div class="card"><div class="t-label" style="margin-bottom:.8rem">Long-form conversation</div>
          <div>${REACH.items.slice(0, 3).map((i) => `<div style="padding:.6rem 0;border-bottom:1px solid var(--fog);color:var(--mid)">${esc(i)}</div>`).join('')}</div></div>
        <div class="card"><div class="t-label" style="margin-bottom:.8rem">&nbsp;</div>
          <div>${REACH.items.slice(3).map((i) => `<div style="padding:.6rem 0;border-bottom:1px solid var(--fog);color:var(--mid)">${esc(i)}</div>`).join('')}</div></div>
      </div>`)}
      ${foot('Movement 1 &nbsp;·&nbsp; What is happening')}
    </div></div>`,
    'View counts, not survey data. Say that out loud so nobody quotes you wrongly.');

  add(`
    <div class="sl"><div class="sl-pad">
      ${label('Movement 1 &nbsp;·&nbsp; the whole compilation')}
      ${a(`<h2 class="t-h3">I put all of it in one place, with the links.</h2>`)}
      ${a(`<div style="margin-top:1.6rem;display:flex;gap:clamp(1.6rem,3.4vw,3.4rem);align-items:flex-start">
        ${qr('research', 'The research')}
        <div style="flex:1">
          <p class="t-body">Every number on the last five slides came from here, with its original source and the date it was last checked. Scan it, or grab the link out of the chat.</p>
          <div class="callout" style="margin-top:1.2rem">It says each figure was checked against its source in July 2026, and it asks that they be checked again before anyone republishes after October. So treat it as working research rather than settled fact.</div>
        </div>
      </div>`)}
      ${foot('Movement 1 &nbsp;·&nbsp; What is happening')}
    </div></div>`,
    'Paste the link in Zoom chat now.');

  // ---- MOVEMENT 2 · THE HABIT WE BUILT ------------------------------------
  const G = STATS.digital;
  add(`
    <div class="sl sl-deep"><div class="sl-pad">
      ${label(G.eyebrow)}
      ${a(`<h2 class="t-h2">${G.head}</h2>`)}
      ${a(`<div class="grid grid-2" style="margin-top:1.6rem;max-width:820px">${G.counters.map((c, i) => statCard(c, `d${i + 2}`)).join('')}</div>`)}
      ${a(`<p class="t-body-lg" style="margin-top:1.5rem;max-width:960px">${esc(G.kicker)}</p>`)}
      ${a(`<div class="src-note" style="margin-top:1rem">${esc(G.source)}</div>`)}
      ${foot('Movement 2 &nbsp;·&nbsp; The habit we built')}
    </div></div>`,
    'This is the hinge of the whole hour. Access is solved. Say it plainly and pause.');

  add(`
    <div class="sl"><div class="sl-pad">
      ${label('Movement 2 &nbsp;·&nbsp; what the numbers do not show')}
      ${a(`<h2 class="t-h3">Almost every Bible habit we teach is a <span class="accent">solo</span> habit.</h2>`)}
      ${a(`<div class="grid grid-2" style="margin-top:1.6rem">
        <div class="card"><h3>What we hand people</h3>
          <p>A quiet time. A reading plan on their own phone. A study method. A journal. A streak.</p>
          <p style="margin-top:.8rem">Every one of those is good. But every one of them can be done without ever speaking to another person.</p></div>
        <div class="card"><h3>What it forms</h3>
          <p>A private reader with a private interpretation, and nobody in the room to push back, fill in, or notice what got skipped.</p>
          <p style="margin-top:.8rem">Then we wonder why discipleship feels thin.</p></div>
      </div>`)}
      ${foot('Movement 2 &nbsp;·&nbsp; The habit we built')}
    </div></div>`,
    'Careful not to dismiss personal devotion. The claim is that it is incomplete on its own.');

  add(`
    <div class="sl"><div class="sl-pad">
      ${label('Movement 2 &nbsp;·&nbsp; the device problem')}
      ${a(`<h2 class="t-h3">The same phone that carries the text is the one pulling them <span class="accent">away</span> from the room.</h2>`)}
      ${a(`<p class="t-body-lg" style="margin-top:1.1rem">Social platforms promise connection and hand you an audience. AI promises a conversation partner and hands you a mirror. Both are very good at making a person feel accompanied while they are, in fact, on their own.</p>`)}
      ${a(`<p class="t-body" style="margin-top:1.2rem;max-width:1020px">So when the Bible turns up on that same device, inside that same posture, it picks the posture up. Reading becomes one more thing done alone, at speed, in between other things done alone.</p>`)}
      ${foot('Movement 2 &nbsp;·&nbsp; The habit we built')}
    </div></div>`,
    'The heart of it. Your own AI and discipleship material sits underneath this slide.');

  add(`
    <div class="sl"><div class="sl-pad">
      ${label('Movement 2 &nbsp;·&nbsp; it has happened before')}
      ${a(`<h2 class="t-h3">Twice the book was found, read out loud to everyone, and the <span class="accent">society</span> changed.</h2>`)}
      ${a(`<div class="precedent">
        <span class="hd"></span><span class="hd">Josiah</span><span class="hd">Nehemiah</span>
        ${[
          ['Found',
           'Hilkiah the priest finds the Book of the Law in the Temple during repairs.',
           'The people ask Ezra to bring out the Book of the Law of Moses.'],
          ['Read aloud',
           'The king goes up with all the people of Judah and Jerusalem and reads them the entire Book of the Covenant.',
           'Read at the Water Gate from early morning until noon, to everyone old enough to understand.'],
          ['Understood together',
           'Josiah tears his clothes, then sends to Huldah the prophetess to ask what it means.',
           'The Levites move through the crowd explaining it, so the people grasp what is being read.'],
          ['Then the society moves',
           'The altars come down, the practices stop, and Passover is kept as it had not been in centuries.',
           'The assembly renews the covenant in writing and signs it.'],
        ].map(([beat, j, n2]) => `
          <span class="bt">${beat}</span><span class="cl">${j}</span><span class="cl">${n2}</span>`).join('')}
        <span class="ref"></span>
        <span class="ref">Story ${jos.id.replace('S','')} &nbsp;·&nbsp; ${esc(jos.book)} ${esc(jos.reference)} &nbsp;·&nbsp; ${jos.minutes} min &nbsp;·&nbsp; ${jos.cast.length} voices</span>
        <span class="ref">Story ${neh.id.replace('S','')} &nbsp;·&nbsp; ${esc(neh.book)} ${esc(neh.reference)} &nbsp;·&nbsp; ${neh.minutes} min &nbsp;·&nbsp; ${neh.cast.length} voices</span>
      </div>`)}
      ${a(`<p class="t-body" style="margin-top:1rem;max-width:1020px">Neither of them handed out scrolls. The reading was the public event, and the reform came after it.</p>`)}
      ${foot('Movement 2 &nbsp;·&nbsp; The habit we built')}
    </div></div>`,
    'Your slide to talk over. Reading aloud to a gathered people is the oldest pattern here, not a new format.');

  add(`
    <div class="sl sl-deep"><div class="sl-pad">
      ${label('Movement 2 &nbsp;·&nbsp; the counter-move')}
      ${a(`<h2 class="t-h2">Make the Bible the <span class="accent">reason</span> people are in a room together.</h2>`)}
      ${a(`<p class="t-body-lg" style="margin-top:1.3rem;max-width:1000px">The reading itself is the shared act. It needs other people present to happen at all, the way a play needs more than one person holding the script.</p>`)}
      ${foot('Movement 2 &nbsp;·&nbsp; The habit we built')}
    </div></div>`,
    'Say it as a thesis, not a suggestion.');

  add(`
    <div class="sl"><div class="sl-pad">
      ${label('Movement 2 &nbsp;·&nbsp; why it matters')}
      ${a(`<h2 class="t-h3">Some revelation only arrives in the <span class="accent">room</span>.</h2>`)}
      ${a(`<p class="t-body-lg" style="margin-top:1rem">Read Jonah on your own and you meet a reluctant prophet. Read it with three other people, one of them holding God's lines and one of them holding Jonah's, and somebody in that group hears the last question of the book pointed straight at them.</p>`)}
      ${a(`<ol class="steps" style="margin-top:1.6rem">
        <li><b>You hear it in someone else's voice.</b> The text stops sounding like your own interior monologue, which is the version you have already agreed with.</li>
        <li><b>You have to keep up.</b> Your part is coming, so you read forward instead of skimming.</li>
        <li><b>Someone notices what you missed.</b> Four readers produce four readings, and the gaps between them are where the conversation starts.</li>
      </ol>`)}
      ${foot('Movement 2 &nbsp;·&nbsp; The habit we built')}
    </div></div>`,
    'Three reasons, not ten. Leave room for the exercise to prove it.');

  // ---- MOVEMENT 3 · FOUR COLOURS ------------------------------------------
  add(`
    <div class="sl"><div class="sl-pad">
      ${label('Movement 3 &nbsp;·&nbsp; the format change')}
      ${a(`<h2 class="t-h3">Red letters gave one voice a colour. This gives all <span class="accent">${n(S.voices)}</span>.</h2>`)}
      ${a(`<p class="t-body-lg" style="margin-top:1rem">A publisher put the words of Jesus in red back in 1899, and one voice in your Bible has looked different ever since. This does the same thing for every speaker in Scripture. Not one word added, moved or removed.</p>`)}
      ${a(`<div class="line">${[['c. 1227','Chapters'],['1551','Verse numbers'],['1899','Red letters'],['Now','Four colours']].map(([y, w]) => `
        <div><div class="y">${y}</div><div class="w">${w}</div></div>`).join('')}</div>`)}
      ${foot('Movement 3 &nbsp;·&nbsp; Four colours')}
    </div></div>`,
    'Langton, Estienne, Klopsch. Every change to the page made Scripture easier to find your way around.');

  const roles = [
    ['black', 'The Narrator', 'Sets the scene', S.byColor.black],
    ['red', 'God speaking', 'God, Jesus, Spirit', S.byColor.red],
    ['green', 'Main character', 'The named figure', S.byColor.green],
    ['blue', 'Everyone else', 'Crowds and kings', S.byColor.blue],
  ];
  add(`
    <div class="sl"><div class="sl-pad">
      ${label('Movement 3 &nbsp;·&nbsp; the four colours')}
      ${a(`<h2 class="t-h3">Everything anyone says gets a colour, and there are only four of them.</h2>`)}
      ${a(`<div class="keys" style="margin-top:1.6rem">${roles.map(([c, who, what, cnt]) => `
        <div class="key">
          <span class="dot" style="background:${D.INK[c].bar}"></span>
          <span class="who">${who}</span>
          <span class="what">${what}</span>
          <span class="n">${n(cnt)} ${cnt === 1 ? 'voice' : 'voices'}</span>
        </div>`).join('')}</div>`)}
      ${foot('Movement 3 &nbsp;·&nbsp; Four colours')}
    </div></div>`,
    'Hand out four colours. That is the whole instruction.');

  add(`
    <div class="sl"><div class="sl-split">
      <div class="stack">
        ${label('Movement 3 &nbsp;·&nbsp; the reader')}
        ${a(`<h2 class="t-h3">This is Jonah, running live.</h2>`)}
        ${a(`<p class="t-body-lg" style="margin-top:1rem">Every word carries the colour of whoever said it. Narration and God sit left, everyone else right, so you can see the shape of the conversation before you read a line of it.</p>`)}
        ${a(`<div class="callout sage" style="margin-top:1.2rem"><b>${jonah.cast.length} voices in this story.</b> ${jonah.cast.slice(0, 3).map((c) => esc(c.name)).join(', ')}, and three more.</div>`)}
        ${a(`<div class="src-note" style="margin-top:1.1rem">Press <span class="mono-em">R</span> to replay the reading</div>`)}
      </div>
      <div class="dev a d1">${P.phone(P.reader(jonah, jTurns, { id: 'rd1' }), '9:41')}</div>
      ${foot('Movement 3 &nbsp;·&nbsp; Four colours')}
    </div></div>`,
    'Let it run. Do not talk over the first few turns.');

  add(`
    <div class="sl"><div class="sl-split">
      <div class="stack">
        ${label('Movement 3 &nbsp;·&nbsp; who is in it')}
        ${a(`<h2 class="t-h3">Every voice, counted.</h2>`)}
        ${a(`<p class="t-body-lg" style="margin-top:1rem">Tap any name and you get their page. What they say across the whole Bible, which books they turn up in, who they speak with most.</p>`)}
        ${a(`<p class="t-body" style="margin-top:1.1rem">Moses speaks in 33 stories, and the voice he speaks with most is God. You can count it.</p>`)}
        ${a(`<div class="src-note" style="margin-top:1.2rem">Colour comes from a word-level tagging of the whole Bible by speaker, audience and role, built with David Joel Hamilton and the Overcommitted team</div>`)}
      </div>
      <div class="dev a d1">${P.phone(P.callSheet(jonah), '9:43')}</div>
      ${foot('Movement 3 &nbsp;·&nbsp; Four colours')}
    </div></div>`,
    'Cast is the thing no other Bible app has. Dwell here for a moment.');

  // ---- MOVEMENT 4 · TWO PLANS ---------------------------------------------
  add(`
    <div class="sl"><div class="sl-pad">
      ${label('Movement 4 &nbsp;·&nbsp; two plans')}
      ${a(`<h2 class="t-h3">Two plans already in the app, one for each half of the school.</h2>`)}
      ${a(`<div class="grid grid-2" style="margin-top:1.6rem">
        <div class="plan">
          <div class="ph">Lecture phase</div><h3>${esc(OT.title)}</h3>
          <div class="cnt"><b>${OT.count}</b><span>stories</span></div>
          <p>${esc(OT.short)}</p>
          <div class="fit">Close to one story per weekday of a twelve week lecture phase.</div>
        </div>
        <div class="plan">
          <div class="ph">Outreach phase</div><h3>${esc(NT.title)}</h3>
          <div class="cnt"><b>${NT.count}</b><span>stories</span></div>
          <p>${esc(NT.short)}</p>
          <div class="fit">One story per weekday of a ten week outreach.</div>
        </div>
      </div>`)}
      ${a(`<p class="t-body" style="margin-top:1.2rem">Progress carries across the break, so a student who joins in week six starts where the school is.</p>`)}
      ${foot('Movement 4 &nbsp;·&nbsp; Two plans')}
    </div></div>`,
    'Check the phase lengths against Kona before you say the weekday line.');

  add(`
    <div class="sl"><div class="sl-split">
      <div class="stack">
        ${label('Movement 4 &nbsp;·&nbsp; on the phone')}
        ${a(`<h2 class="t-h3">Start it once and it keeps your place.</h2>`)}
        ${a(`<p class="t-body-lg" style="margin-top:1rem">A plan is just a list of stories with a bookmark in it. ${D.planCount} plans and challenges ship with the app, and a school can build its own out of any stories it likes.</p>`)}
      </div>
      <div class="dev a d1">${P.phone(P.planScreen(OT, NT), '9:45')}</div>
      ${foot('Movement 4 &nbsp;·&nbsp; Two plans')}
    </div></div>`,
    '');

  // ---- MOVEMENT 5 · HOW FOUR PEOPLE READ ----------------------------------
  add(`
    <div class="sl"><div class="sl-pad">
      ${label('Movement 5 &nbsp;·&nbsp; the mechanic')}
      ${a(`<h2 class="t-h3">How four people read one story.</h2>`)}
      ${a(`<ol class="steps" style="margin-top:1.6rem">
        <li><b>Get into a group of four.</b> Everyone opens the same story on their own phone. Nobody signs in and there is nothing to set up.</li>
        <li><b>Take a colour each.</b> Narrator, God, main character, everyone else. The layout tells you when your part is coming.</li>
        <li><b>Read it out loud.</b> About ${jonah.minutes} minutes for Jonah. You read your colour and only your colour.</li>
        <li><b>Talk about it.</b> Four questions are already waiting at the end, in three versions. Pick the one that fits the room.</li>
      </ol>`)}
      ${foot('Movement 5 &nbsp;·&nbsp; How four people read')}
    </div></div>`,
    'Say step three twice. People default to reading everything.');

  add(`
    <div class="sl"><div class="sl-split">
      <div class="stack">
        ${label('Movement 5 &nbsp;·&nbsp; after the reading')}
        ${a(`<h2 class="t-h3">Three sets of questions, on all ${n(S.stories)} stories.</h2>`)}
        ${a(`<p class="t-body-lg" style="margin-top:1rem">Same story, three times over for three different rooms. For a DTS you want the small group set.</p>`)}
        ${a(`<div class="card" style="margin-top:1.2rem;border-color:rgba(124,204,30,.28);background:rgba(124,204,30,.06)">
          <div class="t-label" style="margin-bottom:.7rem;color:var(--lime)">For a DTS &nbsp;·&nbsp; small group</div>
          <ol style="padding-left:1.1rem;color:var(--mid);line-height:1.6">${jonah.questions.group.map((q) => `<li style="margin-bottom:.4rem">${esc(q)}</li>`).join('')}</ol>
        </div>`)}
      </div>
      <div class="dev a d1">${P.phone(P.talkAbout(jonah, 'group'), '9:52')}</div>
      ${foot('Movement 5 &nbsp;·&nbsp; How four people read')}
    </div></div>`,
    'Read one of the questions out loud so they hear the register.');

  // ---- MOVEMENT 6 · YOUR TURN ---------------------------------------------
  add(`
    <div class="sl"><div class="discussion">
      <div class="disc-label a">Movement 6 &nbsp;·&nbsp; your turn</div>
      ${a(`<div class="q t-h2">Breakout rooms. Fifteen minutes.</div>`)}
      ${a(`<div style="display:flex;gap:clamp(1.6rem,3.4vw,3.4rem);margin-top:1.8rem;align-items:flex-start">
        <ol class="steps" style="flex:1">
          <li><b>Open the app</b> and find story ${jonah.id.replace('S','')}, <b>${esc(jonah.title)}</b>. It is the book of Jonah, all four chapters.</li>
          <li><b>Take a colour each.</b> If you are three, one person takes narrator and everyone else. If you are five, two of you share blue.</li>
          <li><b>Read it out loud, in parts.</b> About ${jonah.minutes} minutes.</li>
          <li><b>Work the four small group questions</b> at the end together. Have fun with it!</li>
        </ol>
        <div style="width:clamp(230px,24vw,310px);flex:none">
          <div class="card">
            <div class="t-label" style="margin-bottom:.6rem">The story</div>
            <h3 style="font-size:clamp(1.4rem,2.4vw,2rem)">${esc(jonah.title)}</h3>
            <p style="margin-top:.35rem">${esc(jonah.book)} ${esc(jonah.reference)}</p>
            <div style="margin-top:1.1rem;display:flex;gap:1.3rem">
              ${[[jonah.minutes, 'minutes'], [jonah.cast.length, 'voices'], [4, 'parts']].map(([v, l]) => `
                <div><div style="font-family:var(--display);font-size:clamp(1.5rem,2.6vw,2.1rem);font-weight:700;color:var(--lime);line-height:1">${v}</div>
                <div class="t-label" style="margin:.3rem 0 0;font-size:.58rem">${l}</div></div>`).join('')}
            </div>
          </div>
          <div class="src-note" style="margin-top:.9rem">Press <span class="mono-em">T</span> to start the countdown</div>
        </div>
      </div>`)}
      ${foot('Movement 6 &nbsp;·&nbsp; Your turn')}
    </div></div>`,
    'Open breakouts of four. Leave this slide up. Press T to run the timer.');

  add(`
    <div class="sl"><div class="sl-pad">
      ${label('Movement 6 &nbsp;·&nbsp; who reads what')}
      ${a(`<h2 class="t-h3">Jonah, by the numbers.</h2>`)}
      ${a(`<p class="t-body-lg" style="margin-top:.9rem">If your group stalls on who takes which colour, this is how much each part actually speaks.</p>`)}
      ${a(`<div style="margin-top:1.6rem">${bars(
        jonah.cast.map((c) => ({ label: c.name, value: c.words, color: c.color })), ' words'
      )}</div>`)}
      ${a(`<div class="src-note" style="margin-top:1.2rem">Blue is shared across ${jonah.cast.filter((c) => c.color === 'blue').length} speakers, so one reader covers all of them</div>`)}
      ${foot('Movement 6 &nbsp;·&nbsp; Your turn')}
    </div></div>`,
    'Useful if a group stalls on who takes what.');

  // ---- CLOSE --------------------------------------------------------------
  add(`
    <div class="sl"><div class="discussion">
      <div class="disc-label a">Close &nbsp;·&nbsp; back together</div>
      ${a(`<div class="q t-h2">What happened in your room?</div>`)}
      ${a(`<div class="grid grid-3" style="margin-top:1.8rem">
        <div class="card"><div class="t-label" style="margin-bottom:.7rem">Ask first</div><p style="font-size:clamp(.95rem,1.25vw,1.1rem)">What did you notice reading it out loud that you would have missed reading it silently?</p></div>
        <div class="card"><div class="t-label" style="margin-bottom:.7rem">Then</div><p style="font-size:clamp(.95rem,1.25vw,1.1rem)">Did holding one voice for the whole story change how you heard that character?</p></div>
        <div class="card"><div class="t-label" style="margin-bottom:.7rem">Then</div><p style="font-size:clamp(.95rem,1.25vw,1.1rem)">Where would this fit in your school, and what would stop it working?</p></div>
      </div>`)}
      ${a(`<p class="t-body" style="margin-top:1.5rem">That last one is the one worth writing down. If this ends up running at Kona it will be staff who make it run.</p>`)}
      ${foot('Close')}
    </div></div>`,
    'Take three rooms, not ten. Keep four minutes for questions.');

  add(`
    <div class="sl sl-deep"><div class="sl-pad">
      ${label('Close &nbsp;·&nbsp; get it')}
      ${a(`<h2 class="t-h3">Free. No ads, no accounts, nothing leaves the phone.</h2>`)}
      ${a(`<div class="qr" style="margin-top:1.8rem">
        ${qr('ios', 'App Store')}
        ${qr('android', 'Google Play')}
        <div style="flex:1;padding-left:.6rem">
          <p class="t-body">Search <b style="color:var(--ink)">SourceView Together</b> in either store if the code will not scan off a shared screen. Both links are in the chat.</p>
          <p class="t-body" style="margin-top:.9rem">English and French, iOS 16.4 or later, Android 8 or later, and it works offline once the text is down.</p>
          <p class="t-body" style="margin-top:.9rem">Email me if you want the two DTS plans set up for your school, or the printable booklets for groups without devices.</p>
          <div style="margin-top:1rem;font-family:var(--mono);font-size:.9rem;color:var(--lime)">sourceviewbible@gmail.com</div>
        </div>
      </div>`)}
      ${foot('Close')}
    </div></div>`,
    'Paste both store links in Zoom chat. Scanning off a shared screen is unreliable.');

  add(`
    <div class="sl sl-deep"><div class="sl-pad">
      ${label('Close &nbsp;·&nbsp; questions')}
      ${a(`<h2 class="t-h2">The Bible was a conversation before it was a <span class="accent">book</span>.</h2>`)}
      ${a(`<p class="t-body-lg" style="margin-top:1.3rem;max-width:960px">Ezra read the law out loud to a square full of people who had never heard it. Paul wrote letters expecting a room. Reading it quietly on our own is the recent habit, and it is the one your students have inherited.</p>`)}
      ${a(`<div class="src-note" style="margin-top:1.8rem">Nathaniel Baldock &nbsp;·&nbsp; Tauranga, New Zealand &nbsp;·&nbsp; sourceviewbible@gmail.com</div>`)}
      ${foot('Close')}
    </div></div>`,
    'Take questions here.');

  return out;
}
