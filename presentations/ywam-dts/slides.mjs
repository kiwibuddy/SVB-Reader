import * as D from './data.mjs';
import { STATS } from './stats.mjs';
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
  `<div class="slide-foot"><span>Reading Scripture Together &nbsp;·&nbsp; YWAM Kona</span><span>${movement}</span></div>`;

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

  // ---- MOVEMENT 1 · THE NUMBERS -------------------------------------------
  const R = STATS.resurgence;
  add(`
    <div class="sl"><div class="sl-pad">
      ${label(R.eyebrow)}
      ${a(`<h2 class="t-h3">${R.head}</h2>`)}
      ${a(`<div class="grid grid-3" style="margin-top:1.6rem">${R.counters.map((c, i) => statCard(c, `d${i + 2}`)).join('')}</div>`)}
      ${a(`<p class="t-body" style="margin-top:1.4rem;max-width:1000px">The third one is the number I did not expect. It counts turning up at a church rather than what people say about themselves, which makes it harder to argue with.</p>`)}
      ${a(`<div class="src-note" style="margin-top:1rem">${esc(R.source)}</div>`)}
      ${foot('Movement 1 &nbsp;·&nbsp; The numbers')}
    </div></div>`,
    'Every card opens its source, including what is still unconfirmed. Do not oversell the reading figures: they are self-reported.');

  const G = STATS.digital;
  add(`
    <div class="sl sl-deep"><div class="sl-pad">
      ${label(G.eyebrow)}
      ${a(`<h2 class="t-h2">${G.head}</h2>`)}
      ${a(`<div class="grid grid-2" style="margin-top:1.6rem;max-width:820px">${G.counters.map((c, i) => statCard(c, `d${i + 2}`)).join('')}</div>`)}
      ${a(`<p class="t-body-lg" style="margin-top:1.5rem;max-width:960px">${esc(G.kicker)}</p>`)}
      ${a(`<div class="src-note" style="margin-top:1rem">${esc(G.source)}</div>`)}
      ${foot('Movement 1 &nbsp;·&nbsp; The numbers')}
    </div></div>`,
    'The hinge of the hour. Access is solved. Say it plainly and pause.');

  // ---- MOVEMENT 2 · THE HABIT WE BUILT ------------------------------------
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
      ${label('Movement 2 &nbsp;·&nbsp; it has happened before')}
      ${a(`<h2 class="t-h3">Twice the book was found, read out loud to everyone, and the <span class="accent">society</span> changed.</h2>`)}
      ${a(`<div class="precedent">
        <span class="hd"></span><span class="hd">Josiah</span><span class="hd">Nehemiah</span>
        ${[
          ['Found',
           'Hilkiah finds the Book of the Law during Temple repairs, and Shaphan reads it to the king.',
           'The people ask Ezra to bring out the Book of the Law of Moses.'],
          ['Read to everyone',
           'The king summons the elders and goes up to the Temple with all the people of Judah and Jerusalem, from the least to the greatest, and reads them the entire Book of the Covenant.',
           'Read at the Water Gate from early morning until noon, to everyone old enough to understand.'],
          ['Understood together',
           'Beside the pillar the king renews the covenant, and all the people pledge themselves to it with him.',
           'The Levites move through the crowd explaining it, so the people grasp what is being read.'],
          ['Then society changed',
           'Baal and Asherah stripped out of the Temple, the pagan shrines defiled from Geba to Beersheba, and Passover kept as it had not been since the judges.',
           'They keep the Festival of Shelters for the first time since Joshua, then sign a binding agreement: no intermarriage, nothing bought on the Sabbath, debts cancelled every seventh year, the Temple funded.'],
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
      ${a(`<p class="t-body-lg" style="margin-top:1.3rem;max-width:1000px">The reading itself is the shared act. It needs other people present to happen at all.</p>`)}
      ${foot('Movement 2 &nbsp;·&nbsp; The habit we built')}
    </div></div>`,
    'Say it as a thesis, not a suggestion. Then stop talking.');

  // ---- MOVEMENT 3 · FOUR COLOURS ------------------------------------------
  add(`
    <div class="sl"><div class="sl-pad">
      ${label('Movement 3 &nbsp;·&nbsp; the format change')}
      ${a(`<h2 class="t-h3">Red letters gave one voice a colour. This gives all <span class="accent">${n(S.voices)}</span>.</h2>`)}
      ${a(`<p class="t-body-lg" style="margin-top:1rem">A publisher put the words of Jesus in red in 1899, and one voice in your Bible has looked different ever since. This does it for every speaker. No word added, moved or removed.</p>`)}
      ${a(`<div class="line">${[['c. 1227','Chapters'],['1551','Verse numbers'],['1899','Red letters'],['Now','Four colours']].map(([y, w]) => `
        <div><div class="y">${y}</div><div class="w">${w}</div></div>`).join('')}</div>`)}
      ${a(`<div class="src-note" style="margin-top:1.2rem">Colour comes from a word-level tagging of the whole Bible by speaker, audience and role, built with David Joel Hamilton and the Overcommitted team</div>`)}
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
      ${a(`<h2 class="t-h3">Everything anyone says gets a colour, and there are only four.</h2>`)}
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
        ${a(`<p class="t-body-lg" style="margin-top:1rem">Every word carries the colour of whoever said it. Narration and God on the left, everyone else on the right, so you can see the shape of the conversation before you read a line.</p>`)}
        ${a(`<div class="callout sage" style="margin-top:1.2rem"><b>${jonah.cast.length} voices in this story.</b> ${jonah.cast.slice(0, 3).map((c) => esc(c.name)).join(', ')}, and three more.</div>`)}
        ${a(`<div class="src-note" style="margin-top:1.1rem">Press <span class="mono-em">R</span> to replay the reading</div>`)}
      </div>
      <div class="dev a d1">${P.phone(P.reader(jonah, jTurns, { id: 'rd1' }), '9:41')}</div>
      ${foot('Movement 3 &nbsp;·&nbsp; Four colours')}
    </div></div>`,
    'Let it run. Do not talk over the first few turns. Tap Cast live if anyone asks who is in a story.');

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
      ${a(`<p class="t-body" style="margin-top:1.2rem">Nothing to set up, and progress carries across the break, so a student who joins in week six starts where the school is.</p>`)}
      ${foot('Movement 4 &nbsp;·&nbsp; Two plans')}
    </div></div>`,
    'Check the phase lengths against Kona before you say the weekday line.');

  // ---- MOVEMENT 5 · YOUR TURN ---------------------------------------------
  add(`
    <div class="sl"><div class="discussion">
      <div class="disc-label a">Movement 5 &nbsp;·&nbsp; your turn</div>
      ${a(`<div class="q t-h2">Breakout rooms. Fifteen minutes.</div>`)}
      ${a(`<div style="display:flex;gap:clamp(1.6rem,3.4vw,3.4rem);margin-top:1.8rem;align-items:flex-start">
        <ol class="steps" style="flex:1">
          <li><b>Open the app</b> and find story ${jonah.id.replace('S','')}, <b>${esc(jonah.title)}</b>. It is the book of Jonah, all four chapters.</li>
          <li><b>Take a colour each.</b> If you are three, one person takes narrator and everyone else. If you are five, two of you share blue.</li>
          <li><b>Read it out loud, in parts.</b> You read your colour and only your colour. About ${jonah.minutes} minutes.</li>
          <li><b>Work the four questions</b> at the end together. They are already there, under Talk about it. Have fun with it!</li>
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
      ${foot('Movement 5 &nbsp;·&nbsp; Your turn')}
    </div></div>`,
    'Open breakouts of four. Leave this slide up. Press T to run the timer.');

  add(`
    <div class="sl"><div class="sl-pad">
      ${label('Movement 5 &nbsp;·&nbsp; who reads what')}
      ${a(`<h2 class="t-h3">Jonah, by the numbers.</h2>`)}
      ${a(`<p class="t-body-lg" style="margin-top:.9rem">If your group stalls on who takes which colour, this is how much each part actually speaks.</p>`)}
      ${a(`<div style="margin-top:1.6rem">${bars(
        jonah.cast.map((c) => ({ label: c.name, value: c.words, color: c.color })), ' words'
      )}</div>`)}
      ${a(`<div class="src-note" style="margin-top:1.2rem">Blue is shared across ${jonah.cast.filter((c) => c.color === 'blue').length} speakers, so one reader covers all of them</div>`)}
      ${foot('Movement 5 &nbsp;·&nbsp; Your turn')}
    </div></div>`,
    'Back-pocket slide. Only put it up if a room stalls on who takes what.');

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
        ${qr('research', 'The research')}
        <div style="flex:1;padding-left:.6rem">
          <p class="t-body">Search <b style="color:var(--ink)">SourceView Together</b> in either store if the code will not scan off a shared screen. All three links are in the chat.</p>
          <p class="t-body" style="margin-top:.9rem">The third code is every figure I used tonight, with its original source and the date it was last checked.</p>
          <p class="t-body" style="margin-top:.9rem">Email me if you want the two DTS plans set up for your school, or the printable booklets for groups without devices.</p>
          <div style="margin-top:1rem;font-family:var(--mono);font-size:.9rem;color:var(--lime)">sourceviewbible@gmail.com</div>
        </div>
      </div>`)}
      ${foot('Close')}
    </div></div>`,
    'Paste all three links in Zoom chat. Scanning off a shared screen is unreliable.');

  add(`
    <div class="sl sl-deep"><div class="sl-pad">
      ${label('Close &nbsp;·&nbsp; questions')}
      ${a(`<h2 class="t-h2">The Bible was a conversation before it was a <span class="accent">book</span>.</h2>`)}
      ${a(`<p class="t-body-lg" style="margin-top:1.3rem;max-width:960px">Ezra read the law out loud to a square full of people who had never heard it. Paul wrote letters expecting a room. Reading it quietly on your own is the recent habit, and it is the one your students arrive with.</p>`)}
      ${a(`<div class="src-note" style="margin-top:1.8rem">Nathaniel Baldock &nbsp;·&nbsp; Tauranga, New Zealand &nbsp;·&nbsp; sourceviewbible@gmail.com</div>`)}
      ${foot('Close')}
    </div></div>`,
    'Take questions here.');

  return out;
}
