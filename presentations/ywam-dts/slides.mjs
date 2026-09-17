import * as D from './data.mjs';
import { STATS } from './stats.mjs';
import * as P from './phone.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const QR = JSON.parse(fs.readFileSync(path.join(here, 'qr.json'), 'utf8'));

// The icon is carried once as a CSS token (see build.mjs) rather than inlined
// at each use, so the base64 blob appears in the file a single time.

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

  // ---- BEFORE WE START · GET THE APP --------------------------------------
  // One code per slide, as big as the stage allows, so the back row can scan
  // it. Leave each one up while people find it.
  const getApp = (key, store, device, note) => `
    <div class="sl sl-deep"><div class="sl-pad">
      ${label('Before we start &nbsp;·&nbsp; download it now')}
      <div class="getbig">
        <div class="side">
          ${a(`<div class="appname">
            <span class="appicon" role="img" aria-label="SourceView Together app icon"></span>
            <div><h2 class="t-h2" style="line-height:1.02">SourceView<br>Together</h2></div>
          </div>`)}
          ${a(`<div class="store">${store}</div>`)}
          ${a(`<p class="t-body">${note}</p>`)}
          ${a(`<div class="src-note" style="margin-top:calc(1 * var(--u))">${esc(QR[key].short)}</div>`)}
        </div>
        ${a(`<div class="bigcode">
          <div class="code">${QR[key].svg}</div>
          <div class="cap">${device}</div>
        </div>`)}
      </div>
      ${foot('Before we start')}
    </div></div>`;

  add(getApp('ios', 'App Store', 'iPhone and iPad',
    'Point your camera at the code. It is free, there is no account to make, and it works offline once a story is open.'),
    'Leave this up while people arrive and scan. Do not move on until most of the room has it.');

  add(getApp('android', 'Google Play', 'Android',
    'Android is the next code. Same app, same plans, nothing to sign up for.'),
    'Second code. Wait here too. Search SourceView Together in the store if a camera will not scan off the screen.');

  // ---- MOVEMENT 1 · THE NUMBERS -------------------------------------------
  const R = STATS.resurgence;
  add(`
    <div class="sl"><div class="sl-pad">
      ${label(R.eyebrow)}
      ${a(`<h2 class="t-h3">${R.head}</h2>`)}
      ${a(`<div class="grid grid-3" style="margin-top:1.6rem">${R.counters.map((c, i) => statCard(c, `d${i + 2}`)).join('')}</div>`)}
      ${a(`<p class="t-body" style="margin-top:1.4rem">That is encouraging. People are opening Scripture. The question for a DTS is not only how much Scripture students encounter, but what kind of people our practices are forming them to become.</p>`)}
      ${a(`<div class="src-note" style="margin-top:1rem">${esc(R.source)}</div>`)}
      ${foot('Movement 1 &nbsp;·&nbsp; The numbers')}
    </div></div>`,
    'Every card opens its source, including what is still unconfirmed. Do not oversell the reading figures: they are self-reported.');

  const G = STATS.digital;
  add(`
    <div class="sl sl-deep"><div class="sl-pad">
      ${label(G.eyebrow)}
      ${a(`<h2 class="t-h2">${G.head}</h2>`)}
      ${a(`<div class="grid grid-2" style="margin-top:1.6rem;max-width:calc(52 * var(--u))">${G.counters.map((c, i) => statCard(c, `d${i + 2}`)).join('')}</div>`)}
      ${a(`<p class="t-body-lg" style="margin-top:1.5rem">${esc(G.kicker)}</p>`)}
      ${a(`<div class="src-note" style="margin-top:1rem">${esc(G.source)}</div>`)}
      ${foot('Movement 1 &nbsp;·&nbsp; The numbers')}
    </div></div>`,
    'The hinge of the hour. Access is solved. Say it plainly and pause.');

  // ---- MOVEMENT 2 · THE HABIT WE BUILT ------------------------------------
  add(`
    <div class="sl"><div class="sl-pad">
      ${label('Movement 2 &nbsp;·&nbsp; the practices we give students')}
      ${a(`<h2 class="t-h3">Many of the Bible practices we give students are practices they can do <span class="accent">alone</span>.</h2>`)}
      ${a(`<div class="grid grid-2" style="margin-top:1.5rem">
        <div class="card"><h3>What we already give them</h3>
          <p>A quiet time. A reading plan on their own phone. A study method. A journal. A way to keep showing up.</p>
          <p style="margin-top:.8rem">These are valuable. They help students build a personal life with God and learn to open Scripture for themselves.</p></div>
        <div class="card"><h3>What community adds</h3>
          <p>Other people help us hear what we might miss, ask questions we would not ask alone, and notice what we have overlooked.</p>
          <p style="margin-top:.8rem">So the question is not whether students should read alone. Of course they should. Have we also given them ways to encounter Scripture together?</p></div>
      </div>`)}
      ${foot('Movement 2 &nbsp;·&nbsp; The habit we built')}
    </div></div>`,
    'Careful not to dismiss personal devotion. The claim is that it is incomplete on its own.');

  add(`
    <div class="sl"><div class="sl-pad">
      ${label('Movement 2 &nbsp;·&nbsp; a biblical pattern')}
      ${a(`<h2 class="t-h3">There is an older pattern: God's people hearing His Word <span class="accent">together</span>.</h2>`)}
      ${a(`<div class="precedent">
        <span class="hd"></span><span class="hd">Josiah</span><span class="hd">Nehemiah</span>
        ${[
          ['Found',
           'Hilkiah finds it during Temple repairs. Shaphan reads it to the king.',
           'The people ask Ezra to bring out the Book of the Law of Moses.'],
          ['Read to everyone',
           'The king gathers all Judah and Jerusalem, from the least to the greatest, and reads them the whole Book of the Covenant.',
           'Read at the Water Gate from early morning until noon, to everyone old enough to understand.'],
          ['Understood together',
           'Beside the pillar the king renews the covenant, and all the people pledge themselves with him.',
           'The Levites move through the crowd explaining it, so the people grasp what they are hearing.'],
          ['Then society changed',
           'Baal and Asherah out of the Temple. The shrines defiled from Geba to Beersheba. Passover kept as it had not been since the judges.',
           'The Festival of Shelters kept for the first time since Joshua. Then a signed agreement: no intermarriage, nothing bought on the Sabbath, debts cancelled every seventh year.'],
        ].map(([beat, j, n2]) => `
          <span class="bt">${beat}</span><span class="cl">${j}</span><span class="cl">${n2}</span>`).join('')}
        <span class="ref"></span>
        <span class="ref">Story ${jos.id.replace('S','')} &nbsp;·&nbsp; ${esc(jos.book)} ${esc(jos.reference)} &nbsp;·&nbsp; ${jos.minutes} min &nbsp;·&nbsp; ${jos.cast.length} voices</span>
        <span class="ref">Story ${neh.id.replace('S','')} &nbsp;·&nbsp; ${esc(neh.book)} ${esc(neh.reference)} &nbsp;·&nbsp; ${neh.minutes} min &nbsp;·&nbsp; ${neh.cast.length} voices</span>
      </div>`)}
      ${foot('Movement 2 &nbsp;·&nbsp; The habit we built')}
    </div></div>`,
    'Your slide to talk over. Neither of them handed out scrolls: the reading was the public event, and the reform came after it. Reading aloud to a gathered people is the oldest pattern here, not a new format.');

  add(`
    <div class="sl sl-deep"><div class="sl-pad">
      ${label('Movement 2 &nbsp;·&nbsp; the invitation')}
      ${a(`<h2 class="t-h2">What if Scripture became one of the ways we form disciples <span class="accent">together</span>?</h2>`)}
      ${a(`<p class="t-body-lg" style="margin-top:1.3rem">Make the Bible one of the reasons people are in a room together. The reading itself becomes the shared act: everyone hears, everyone participates, everyone has a part to play.</p>`)}
      ${foot('Movement 2 &nbsp;·&nbsp; The habit we built')}
    </div></div>`,
    'Say it as an invitation, not a rebuke. Then stop talking and introduce the tool.');

  // ---- MOVEMENT 3 · THE TOOL ----------------------------------------------
  add(`
    <div class="sl sl-deep"><div class="sl-pad">
      ${label('Movement 3 &nbsp;·&nbsp; the tool')}
      ${a(`<div class="intro">
        <span class="appicon" role="img" aria-label="SourceView Together app icon"></span>
        <div>
          <h2 class="t-h2" style="line-height:1.02">SourceView<br>Together</h2>
          <p class="t-body-lg" style="margin-top:1rem">A free Bible app that gives every speaker in Scripture a colour, so a group can read a story out loud in parts.</p>
        </div>
      </div>`)}
      ${a(`<div class="facts">
        ${[[n(S.books), 'books'], [n(S.stories), 'stories'], [n(S.voices), 'voices'], ['0', 'accounts']].map(([v, l]) => `
          <div><b>${v}</b><span>${l}</span></div>`).join('')}
      </div>`)}
      ${foot('Movement 3 &nbsp;·&nbsp; Four colours')}
    </div></div>`,
    'Hold up your phone here if you have it. The whole Bible, not a selection. Nothing added, moved or removed.');

  // ---- MOVEMENT 3 · FOUR COLOURS ------------------------------------------
  add(`
    <div class="sl"><div class="sl-pad">
      ${label('Movement 3 &nbsp;·&nbsp; a simple format')}
      ${a(`<h2 class="t-h3">Red letters gave one voice a colour. This gives <span class="accent">every</span> voice a part.</h2>`)}
      ${a(`<p class="t-body-lg" style="margin-top:1rem">A publisher put the words of Jesus in red in 1899, and one voice in your Bible has looked different ever since. This applies the same idea across the whole Bible, so a group can read Scripture as a conversation. No word is added, moved or removed.</p>`)}
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
      ${label('Movement 3 &nbsp;·&nbsp; everyone has a part')}
      ${a(`<h2 class="t-h3">Four colours. Four ways to take part.</h2>`)}
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
        ${label('Movement 3 &nbsp;·&nbsp; see it in practice')}
        ${a(`<h2 class="t-h3">This is Jonah, read as a conversation.</h2>`)}
        ${a(`<p class="t-body-lg" style="margin-top:1rem">Every word carries the colour of whoever said it. You can see the shape of the conversation before you read a line, then hear it as four people share the story.</p>`)}
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
      ${label('Movement 4 &nbsp;·&nbsp; possible DTS rhythms')}
      ${a(`<h2 class="t-h3">Two simple rhythms for making shared Scripture part of DTS.</h2>`)}
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
      ${a(`<p class="t-body" style="margin-top:1.2rem">Nothing to set up, and progress carries across the break. The point is not another programme. It is a simple shared practice that can sit inside the formation you are already doing.</p>`)}
      ${foot('Movement 4 &nbsp;·&nbsp; Two plans')}
    </div></div>`,
    'Check the phase lengths against Kona before you say the weekday line.');

  // ---- MOVEMENT 5 · YOUR TURN ---------------------------------------------
  add(`
    <div class="sl"><div class="discussion">
      <div class="disc-label a">Movement 5 &nbsp;·&nbsp; experience it</div>
      ${a(`<div class="q t-h2">Do not just hear about it. Try it.</div>`)}
      ${a(`<div style="display:flex;gap:clamp(1.6rem,3.4vw,3.4rem);margin-top:1.8rem;align-items:flex-start">
        <ol class="steps" style="flex:1">
          <li><b>Open the app</b> and find story ${jonah.id.replace('S','')}, <b>${esc(jonah.title)}</b>. It is the book of Jonah, all four chapters.</li>
          <li><b>Take a colour each.</b> If you are three, one person takes narrator and everyone else. If you are five, two of you share blue.</li>
          <li><b>Read it out loud, in parts.</b> You read your colour and only your colour. About ${jonah.minutes} minutes.</li>
          <li><b>Work the four questions</b> at the end together. They are already there, under Talk about it.</li>
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
      ${label('Movement 5 &nbsp;·&nbsp; everyone gets a part')}
      ${a(`<h2 class="t-h3">Everyone gets a part.</h2>`)}
      ${a(`<p class="t-body-lg" style="margin-top:.9rem">If your group stalls on who takes which colour, here is the rough distribution in Jonah. The goal is not equal word counts. The goal is that everyone helps carry the story.</p>`)}
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
      <div class="disc-label a">Close &nbsp;·&nbsp; reflect together</div>
      ${a(`<div class="q t-h2">What did you experience together?</div>`)}
      ${a(`<div class="grid grid-3" style="margin-top:1.6rem">
        <div class="card"><div class="t-label" style="margin-bottom:.7rem">First</div><p>What did you notice hearing it out loud that you might have missed reading it silently?</p></div>
        <div class="card"><div class="t-label" style="margin-bottom:.7rem">Then</div><p>Did carrying one voice through the story change how you heard that character, or the whole story?</p></div>
        <div class="card"><div class="t-label" style="margin-bottom:.7rem">Finally</div><p>Where could a shared Scripture rhythm fit into your DTS, and what would help or hinder it?</p></div>
      </div>`)}
      ${a(`<p class="t-body" style="margin-top:1.4rem">If this becomes part of DTS it will not be because of the app. It will be because staff make space for Scripture to form students together.</p>`)}
      ${foot('Close')}
    </div></div>`,
    'Take three rooms, not ten. Keep four minutes for questions.');

  add(`
    <div class="sl sl-deep"><div class="sl-pad">
      ${label('Close &nbsp;·&nbsp; take the resource')}
      ${a(`<h2 class="t-h3">If this could serve your DTS, the resource is free.</h2>`)}
      ${a(`<div class="qr" style="margin-top:1.7rem">
        <div class="qrbox"><span class="appicon sm" role="img" aria-label="SourceView Together app icon"></span><div class="n">SourceView Together</div><div class="u">free &nbsp;·&nbsp; no accounts</div></div>
        ${qr('ios', 'App Store')}
        ${qr('android', 'Google Play')}
        <div style="flex:1;padding-left:.6rem">
          <p class="t-body">Search <b style="color:var(--ink)">SourceView Together</b> in either store if the code will not scan off a shared screen. Both links are in the chat, along with the research behind tonight's figures.</p>
          <p class="t-body" style="margin-top:.9rem">Email me if you want the two DTS plans set up for your school, or printable booklets for groups without devices.</p>
          <div style="margin-top:1rem;font-family:var(--mono);font-size:calc(1 * var(--u));color:var(--lime)">sourceviewbible@gmail.com</div>
        </div>
      </div>`)}
      ${foot('Close')}
    </div></div>`,
    'Paste all three links in Zoom chat. Scanning off a shared screen is unreliable.');

  add(`
    <div class="sl sl-deep"><div class="sl-pad">
      ${label('Close &nbsp;·&nbsp; questions')}
      ${a(`<h2 class="t-h2">The Bible was a conversation before it was a <span class="accent">book</span>.</h2>`)}
      ${a(`<p class="t-body-lg" style="margin-top:1.3rem">Ezra read the law out loud to a gathered people. Paul wrote letters expecting them to be heard in a room. Personal reading matters. So does learning to hear, understand and respond to Scripture together. If we want students to know God, live His Word and make Him known, the practices we give them matter.</p>`)}
      ${a(`<div class="src-note" style="margin-top:1.8rem">Nathaniel Baldock &nbsp;·&nbsp; Tauranga, New Zealand &nbsp;·&nbsp; sourceviewbible@gmail.com</div>`)}
      ${foot('Close')}
    </div></div>`,
    'Take questions here.');

  return out;
}
