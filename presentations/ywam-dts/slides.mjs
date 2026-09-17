import * as D from './data.mjs';
import { STATS, REACH, TRANSLATION } from './stats.mjs';
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

let ai = 0;
const a = (h) => `<div class="a" style="--i:${ai++}">${h}</div>`;
const reset = () => { ai = 0; };

const sec = (no, label) =>
  `<div class="sec"><span class="eyebrow"><b>${no}</b> &nbsp;${label}</span><i></i></div>`;

const counter = (c) => `
  <div class="tile">
    <div class="n${c.to && c.from ? ' acc' : ''}" data-count="${c.to}" data-dec="${c.decimals || 0}"
         data-suffix="${c.suffix || ''}">0${c.suffix || ''}</div>
    <div class="l">${esc(c.label)}</div>
    ${c.note ? `<div class="s">${esc(c.note)}</div>` : ''}
  </div>`;

const bars = (rows, unit) => {
  // Percentages are drawn against a full 100, so a 43 never looks like a 75.
  const peak = Math.max(...rows.map((r) => r.value));
  const max = String(unit).trim() === '%' ? 100 : peak;
  return `<div class="bars">${rows.map((r, i) => {
    const tint = r.color ? `background:var(--k-${r.color});` : '';
    const ink = r.color ? `color:var(--k-${r.color});` : '';
    return `
    <div class="barrow" style="--bi:${i}">
      <span class="lab">${esc(r.label)}</span>
      <span class="track"><span class="fill" style="--w:${(r.value / max) * 100}%;${tint}"></span></span>
      <span class="val" style="${ink}">${r.value}${unit}</span>
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
  const add = (cls, html, note) => { reset(); out.push({ cls, html, note }); };

  // ---- 00-04 OPEN ---------------------------------------------------------
  add('pad', `
    <div class="cover-grid">
      <div class="cover-top">
        <div class="brand">
          <span class="dots">${['black','red','green','blue'].map((c)=>`<i style="background:${D.INK[c].bar}"></i>`).join('')}</span>
          <span>SourceView Together</span>
        </div>
        <span class="pill">YWAM Kona &nbsp;·&nbsp; DTS staff training</span>
      </div>
      <div style="margin:auto 0">
        ${a(`<div class="eyebrow">Reading the Bible together</div>`)}
        ${a(`<h1 style="margin-top:22px">The Bible is coming back.<br>We are still reading it <em>alone</em>.</h1>`)}
        ${a(`<div class="lede" style="margin-top:30px;max-width:980px">One hour on what the research is showing, why the habit we have built works against it, and a tool that puts four people around one story. We will read Jonah together before the end.</div>`)}
      </div>
      ${a(`<div style="display:flex;align-items:flex-end;justify-content:space-between">
        <div class="small"><b style="color:var(--ink)">Nathaniel Baldock</b><br>Tauranga, New Zealand</div>
        <div class="small" style="text-align:right">${n(S.books)} books &nbsp;·&nbsp; ${n(S.stories)} stories &nbsp;·&nbsp; ${n(S.voices)} voices</div>
      </div>`)}
    </div>`, 'Welcome. Name the shape of the hour, and tell them there is a live exercise at the end so they stay.');

  const run = [
    ['00–04', 'Open', 'Where this is going'],
    ['04–16', 'What the research shows', 'The turn, and who is driving it'],
    ['16–25', 'The habit we built', 'Access is solved. Formation is not'],
    ['25–33', 'SourceView Together', 'The format change'],
    ['33–38', 'Two plans for the DTS', 'Lecture phase and outreach'],
    ['38–42', 'How four people read', 'The mechanic'],
    ['42–57', 'Breakouts: read Jonah', 'You do it, not me'],
    ['57–60', 'Feedback and questions', ''],
  ];
  add('', `
    ${sec('00', 'The hour')}
    ${a(`<h2>Here is the shape of it.</h2>`)}
    ${a(`<div class="run" style="margin-top:26px">${run.map(([t, ti, no], i) => `
      <div class="r${i === 6 ? ' now' : ''}"><span class="tm">${t}</span><span class="ti">${ti}</span><span class="no">${no}</span></div>`).join('')}</div>`)}
    ${a(`<div class="body" style="margin-top:30px"><b>The green row is the point of the session.</b> Everything before it exists to get you into a breakout room with three other people and one story.</div>`)}
  `, 'Flag the breakout now so nobody is surprised. Ask them to have a phone within reach.');

  // ---- 04-16 RESEARCH -----------------------------------------------------
  const R = STATS.resurgence;
  add('', `
    ${sec('01', R.eyebrow)}
    ${a(`<h2>${R.head}</h2>`)}
    ${a(`<div class="tiles" style="margin-top:44px">${R.counters.map(counter).join('')}</div>`)}
    ${a(`<div class="src" style="margin-top:26px">${esc(R.source)}</div>`)}
  `, 'Do not rush this. The number that matters is the direction of travel, not the decimal.');

  const M = STATS.men;
  add('', `
    ${sec('01', M.eyebrow)}
    ${a(`<h2>${M.head}</h2>`)}
    ${a(`<div class="lede" style="margin-top:22px">${esc(M.lede)}</div>`)}
    ${a(`<div style="margin-top:38px">${bars(M.bars, M.unit)}</div>`)}
    ${a(`<div class="src" style="margin-top:22px">${esc(M.source)}</div>`)}
  `, 'This is the slide that usually gets a reaction. Let it land before moving on.');

  const U = STATS.uk;
  add('', `
    ${sec('01', U.eyebrow)}
    ${a(`<h2>${U.head}</h2>`)}
    ${a(`<div class="tiles" style="margin-top:44px">${U.counters.map(counter).join('')}</div>`)}
    ${a(`<div class="body" style="margin-top:28px"><b>${esc(U.footnote)}</b> Not a small poll, and the same age and gender pattern as the reading figures.</div>`)}
    ${a(`<div class="src" style="margin-top:18px">${esc(U.source)}</div>`)}
  `, 'The UK number is useful because it is attendance, not self-reported reading.');

  const G = STATS.digital;
  add('', `
    ${sec('01', G.eyebrow)}
    ${a(`<h2>${G.head}</h2>`)}
    ${a(`<div class="tiles" style="margin-top:40px">${G.counters.map(counter).join('')}</div>`)}
    ${a(`<div class="lede" style="margin-top:34px">${esc(G.kicker)}</div>`)}
    ${a(`<div class="src" style="margin-top:22px">${esc(G.source)}</div>`)}
  `, 'This is the hinge of the whole talk. Access is solved. Say it plainly and pause.');

  const A = STATS.ai;
  add('', `
    ${sec('01', A.eyebrow)}
    ${a(`<h2>${A.head}</h2>`)}
    ${a(`<div style="margin-top:38px">${bars(A.bars, A.unit)}</div>`)}
    ${a(`<div class="src" style="margin-top:24px">${esc(A.source)}</div>`)}
  `, 'Do not moralise here. Just show it. The argument comes next.');

  add('', `
    ${sec('01', REACH.eyebrow)}
    ${a(`<h2>${REACH.head}</h2>`)}
    ${a(`<div class="lede" style="margin-top:22px">${esc(REACH.lede)}</div>`)}
    ${a(`<div class="cards" style="margin-top:36px">
      <div class="card"><div class="tag">Long-form conversation</div>
        <ul style="margin-top:16px;list-style:none">${REACH.items.slice(0,3).map((i)=>`<li style="font-size:19px;padding:9px 0;border-bottom:1px solid var(--rule-soft);color:var(--soft)">${esc(i)}</li>`).join('')}</ul></div>
      <div class="card"><div class="tag">&nbsp;</div>
        <ul style="margin-top:16px;list-style:none">${REACH.items.slice(3).map((i)=>`<li style="font-size:19px;padding:9px 0;border-bottom:1px solid var(--rule-soft);color:var(--soft)">${esc(i)}</li>`).join('')}</ul></div>
    </div>`)}
  `, 'Name it as appetite rather than belief. It sets up the question of what people do next.');

  add('', `
    ${sec('01', 'The whole compilation')}
    ${a(`<h2>Every figure, with its source.</h2>`)}
    ${a(`<div class="lede" style="margin-top:22px">I have put the research behind all of this in one place. It carries the original source and link for each number, and a note on when each was last checked.</div>`)}
    ${a(`<div style="margin-top:44px;display:flex;gap:56px;align-items:center">
      ${qr('research', 'The research')}
      <div style="flex:1">
        <div class="body"><b>Scan it, or take the link from the chat.</b> The figures on the last five slides all come from here.</div>
        <div class="body" style="margin-top:18px">It notes that each statistic was checked against its linked source in July 2026, and asks that they be re-checked before anyone republishes after October 2026.</div>
      </div>
    </div>`)}
  `, 'Paste the link in Zoom chat now.');

  // ---- 16-25 THE ARGUMENT -------------------------------------------------
  add('dark', `
    ${sec('02', 'The habit we built')}
    ${a(`<h2>Access is solved.<br><em>Formation</em> is not.</h2>`)}
    ${a(`<div class="lede" style="margin-top:32px;max-width:1020px">A billion installs, and a Bible on every phone in this call. Whatever the problem is now, it is not that people cannot get to the text.</div>`)}
  `, 'Slow down. This is the turn from data to argument.');

  add('', `
    ${sec('02', 'What the numbers do not show')}
    ${a(`<h2>Almost every Bible habit we teach is a <em>solo</em> habit.</h2>`)}
    ${a(`<div class="cards" style="margin-top:42px">
      <div class="card"><div class="tag">What we hand people</div>
        <p style="font-size:20px">A quiet time. A reading plan on their own phone. A study method. A journal. A streak.</p>
        <p style="font-size:20px;margin-top:14px">Every one of those is good, and every one of those can be done without ever speaking to another human being.</p></div>
      <div class="card"><div class="tag">What it forms</div>
        <p style="font-size:20px">A private reader with a private interpretation and no one in the room to push back, fill in, or notice what they skipped.</p>
        <p style="font-size:20px;margin-top:14px">We then wonder why discipleship feels thin.</p></div>
    </div>`)}
  `, 'Be careful not to dismiss personal devotion. The claim is that it is incomplete on its own.');

  add('', `
    ${sec('02', 'The device problem')}
    ${a(`<h2>The same phone that carries the text<br>is the one pulling them <em>away</em> from the room.</h2>`)}
    ${a(`<div class="lede" style="margin-top:30px">Social platforms promise connection and deliver an audience. AI promises a conversation partner and delivers a mirror. Both are excellent at making a person feel accompanied while they are, in fact, on their own.</div>`)}
    ${a(`<div class="body" style="margin-top:34px;max-width:1080px">So when the Bible arrives on that same device, inside that same posture, it inherits the posture. Reading becomes one more thing done alone, at speed, between other things done alone.</div>`)}
  `, 'This is the heart of it. Your own AI and discipleship material sits underneath this slide.');

  add('', `
    ${sec('02', 'It has happened before')}
    ${a(`<h2>Twice the book was found, read out loud to everyone,<br>and the <em>society</em> changed.</h2>`)}
    ${a(`<div class="precedent" style="margin-top:34px">
      <div class="ph"><span></span><span>Josiah</span><span>Nehemiah</span></div>
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
        <div class="pr">
          <span class="bt">${beat}</span>
          <span class="pc">${j}</span>
          <span class="pc">${n2}</span>
        </div>`).join('')}
      <div class="pf">
        <span></span>
        <span>Story ${jos.id.replace('S','')} &nbsp;·&nbsp; ${esc(jos.book)} ${esc(jos.reference)} &nbsp;·&nbsp; ${jos.minutes} min &nbsp;·&nbsp; ${jos.cast.length} voices</span>
        <span>Story ${neh.id.replace('S','')} &nbsp;·&nbsp; ${esc(neh.book)} ${esc(neh.reference)} &nbsp;·&nbsp; ${neh.minutes} min &nbsp;·&nbsp; ${neh.cast.length} voices</span>
      </div>
    </div>`)}
    ${a(`<div class="body" style="margin-top:26px">Neither of them handed out scrolls. The reading was the public event, and the reform followed it.</div>`)}
  `, 'Your slide to talk over. The point is that reading aloud to a gathered people is the oldest pattern, not a new format.');

  add('dark', `
    ${sec('02', 'The counter-move')}
    ${a(`<h2>Make the Bible the <em>reason</em><br>people are in a room together.</h2>`)}
    ${a(`<div class="lede" style="margin-top:32px;max-width:1040px">Not a warm-up before the real thing. Not homework you did separately and now discuss. The reading itself is the shared act, and it needs other people present to happen at all.</div>`)}
  `, 'Say it as a thesis, not a suggestion.');

  add('', `
    ${sec('02', 'Why it matters')}
    ${a(`<h2>Some revelation only arrives in the <em>room</em>.</h2>`)}
    ${a(`<div class="lede" style="margin-top:26px">Read Jonah on your own and you meet a reluctant prophet. Read it with three other people, one of them holding God's lines and one of them holding Jonah’s, and someone in the group hears the last question of the book pointed straight at them.</div>`)}
    ${a(`<ol class="steps" style="margin-top:40px">
      <li><b>You hear it in someone else's voice.</b> The text stops sounding like your own interior monologue, which is the version you have already agreed with.</li>
      <li><b>You have to keep up.</b> Your part is coming, so you are reading forward rather than skimming.</li>
      <li><b>Someone notices what you missed.</b> Four readers produce four readings, and the gaps between them are where the conversation starts.</li>
    </ol>`)}
  `, 'Three reasons, not ten. Leave room for the exercise to prove it.');

  // ---- 25-33 THE APP ------------------------------------------------------
  add('', `
    ${sec('03', 'The tool')}
    ${a(`<h2>Red letters gave one voice a colour.<br>This gives all <em>${n(S.voices)}</em>.</h2>`)}
    ${a(`<div class="lede" style="margin-top:26px">A publisher put the words of Jesus in red, and one voice in your Bible has looked different ever since. SourceView Together does that for every speaker in Scripture. Not one word is added, moved or removed.</div>`)}
    ${a(`<div style="margin-top:40px;display:flex;gap:0;align-items:stretch;border-top:1px solid var(--hair);border-bottom:1px solid var(--hair)">
      ${[['c. 1227','Chapters'],['1551','Verse numbers'],['1899','Red letters'],['Now','Four colours']].map(([y,w],i)=>`
        <div style="flex:1;padding:22px 18px;${i<3?'border-right:1px solid var(--rule-soft)':''};${i===3?'background:var(--f-green)':''}">
          <div style="font-size:14px;font-weight:800;letter-spacing:.1em;color:${i===3?'var(--k-green)':'#A9B0AA'}">${y}</div>
          <div style="margin-top:7px;font-size:23px;font-weight:800;letter-spacing:-.02em;color:${i===3?'var(--k-green)':'var(--ink)'}">${w}</div>
        </div>`).join('')}
    </div>`)}
  `, 'Langton, Estienne, Klopsch. Every change to the page made Scripture easier to navigate.');

  const roles = [
    ['black','The Narrator','Sets the scene',S.byColor.black],
    ['red','God speaking','God, Jesus, Spirit',S.byColor.red],
    ['green','Main character','The named figure',S.byColor.green],
    ['blue','Everyone else','Crowds and kings',S.byColor.blue],
  ];
  add('', `
    ${sec('03', 'The four colours')}
    ${a(`<h2>Four parts. Four readers. One story.</h2>`)}
    ${a(`<div class="keys" style="margin-top:40px">${roles.map(([c,who,what,cnt])=>`
      <div class="key k-${c}">
        <span class="dot" style="background:${D.INK[c].bar}"></span>
        <span class="who">${who}</span>
        <span class="what">${what}</span>
        <span class="n">${n(cnt)} ${cnt===1?'voice':'voices'}</span>
      </div>`).join('')}</div>`)}
  `, 'Hand out four colours. That is the whole instruction.');

  add('', `
    ${sec('03', 'The reader')}
    <div style="display:flex;gap:64px;align-items:center;flex:1">
      <div style="flex:1">
        ${a(`<h2 style="font-size:52px">This is Jonah,<br>running live.</h2>`)}
        ${a(`<div class="lede" style="margin-top:24px;font-size:23px">Every word carries the colour of whoever said it. Narration and divine speech sit left, everyone else right, so the shape of the conversation is visible before you read a line of it.</div>`)}
        ${a(`<div class="body" style="margin-top:26px"><b>${jonah.cast.length} voices in this story.</b> ${jonah.cast.slice(0,3).map((c)=>esc(c.name)).join(', ')}, and three more.</div>`)}
        ${a(`<div class="small" style="margin-top:22px">Press <b style="color:var(--ink)">R</b> to replay the reading.</div>`)}
      </div>
      <div class="a" style="--i:1">${P.phone(P.reader(jonah, jTurns, { id: 'rd1' }), 574, '9:41')}</div>
    </div>
  `, 'Let it run. Do not talk over the first few turns.');

  add('', `
    ${sec('03', 'Who is in it')}
    <div style="display:flex;gap:64px;align-items:center;flex:1">
      <div style="flex:1">
        ${a(`<h2 style="font-size:52px">Every voice, counted.</h2>`)}
        ${a(`<div class="lede" style="margin-top:24px;font-size:23px">Tap any name and you get their page: what they say across the whole Bible, which books they turn up in, and who they speak with most.</div>`)}
        ${a(`<div class="body" style="margin-top:26px">Moses speaks in 33 stories, and the voice he speaks with most is God. That is not a devotional thought, it is what the text does when you count it.</div>`)}
        ${a(`<div class="src" style="margin-top:26px">Colour comes from a word-level tagging of the whole Bible by speaker, audience and role, built with David Joel Hamilton and the Overcommitted team</div>`)}
      </div>
      <div class="a" style="--i:1">${P.phone(P.callSheet(jonah), 574, '9:43')}</div>
    </div>
  `, 'Cast is the thing no other Bible app has. Dwell here for a moment.');

  // ---- 33-38 PLANS --------------------------------------------------------
  add('', `
    ${sec('04', 'Two plans')}
    ${a(`<h2>One for lecture phase. One for outreach.</h2>`)}
    ${a(`<div class="lede" style="margin-top:22px">Both already ship in the app. Neither needs setting up.</div>`)}
    ${a(`<div style="display:flex;gap:28px;margin-top:38px">
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
    ${a(`<div class="small" style="margin-top:26px">Progress carries across a break, so a student who joins in week six starts where the school is.</div>`)}
  `, 'Confirm the phase lengths against Kona before you say the weekday line.');

  add('', `
    ${sec('04', 'On the phone')}
    <div style="display:flex;gap:64px;align-items:center;flex:1">
      <div style="flex:1">
        ${a(`<h2 style="font-size:52px">Start it once.<br>It opens where you are.</h2>`)}
        ${a(`<div class="lede" style="margin-top:24px;font-size:23px">A plan is a list of stories with a place kept in it. ${D.planCount} plans and challenges ship with the app, and a school can build its own out of any stories it likes.</div>`)}
      </div>
      <div class="a" style="--i:1">${P.phone(P.planScreen(OT, NT), 574, '9:45')}</div>
    </div>
  `, '');

  // ---- 38-42 HOW A GROUP READS -------------------------------------------
  add('', `
    ${sec('05', 'The mechanic')}
    ${a(`<h2>How four people read one story.</h2>`)}
    ${a(`<ol class="steps" style="margin-top:40px">
      <li><b>Get into a group of four.</b> Everyone opens the same story on their own phone. Nobody signs in and there is nothing to set up.</li>
      <li><b>Take a colour each.</b> Narrator, God, main character, everyone else. The layout tells you when your part is coming.</li>
      <li><b>Read it out loud.</b> About ${jonah.minutes} minutes for Jonah. You read your colour and only your colour.</li>
      <li><b>Talk about it.</b> Four questions are already waiting at the end, in three versions. Pick the one that fits the room.</li>
    </ol>`)}
  `, 'Say step three twice. People default to reading everything.');

  add('', `
    ${sec('05', 'After the reading')}
    <div style="display:flex;gap:56px;align-items:center;flex:1">
      <div style="flex:1">
        ${a(`<h2 style="font-size:50px">Three sets of questions,<br>on all ${n(S.stories)} stories.</h2>`)}
        ${a(`<div class="lede" style="margin-top:20px;font-size:21px">Same story, three times over for three different rooms. For a DTS you want the small group set.</div>`)}
        ${a(`<div class="cards" style="margin-top:28px">
          <div class="card lead" style="padding:22px 20px"><div class="tag">For a DTS</div><h3 style="font-size:24px">Small group</h3>
            <ol style="margin-top:12px">${jonah.questions.group.map((q)=>`<li style="font-size:15px">${esc(q)}</li>`).join('')}</ol></div>
        </div>`)}
      </div>
      <div class="a" style="--i:1">${P.phone(P.talkAbout(jonah, 'group'), 570, '9:52')}</div>
    </div>
  `, 'Read one of the questions out loud so they hear the register.');

  // ---- 42-57 THE EXERCISE -------------------------------------------------
  add('dark pad withsec', `
    ${sec('06', 'Your turn')}
    ${a(`<h2 style="font-size:78px;margin-top:10px">Breakout rooms.<br>Fifteen minutes.</h2>`)}
    ${a(`<div style="display:flex;gap:56px;margin-top:44px">
      <ol class="steps" style="flex:1">
        <li><b>Open the app</b> and find story ${jonah.id.replace('S','')}, <b>${esc(jonah.title)}</b>. It is the book of Jonah, all four chapters.</li>
        <li><b>Take a colour each.</b> If you are three, one person takes narrator and everyone else. If you are five, two share blue.</li>
        <li><b>Read it out loud, in parts.</b> About ${jonah.minutes} minutes.</li>
        <li><b>Work the four small group questions</b> at the end together.</li>
      </ol>
      <div style="width:330px;flex:none">
        <div style="border:1.5px solid rgba(242,234,224,.3);border-radius:16px;padding:26px">
          <div class="eyebrow" style="color:rgba(242,234,224,.55)">The story</div>
          <div style="margin-top:12px;font-size:32px;font-weight:800;letter-spacing:-.03em;color:var(--cream)">${esc(jonah.title)}</div>
          <div style="margin-top:8px;font-size:17px;color:rgba(242,234,224,.7)">${esc(jonah.book)} ${esc(jonah.reference)}</div>
          <div style="margin-top:20px;display:flex;gap:16px">
            <div><div style="font-size:30px;font-weight:800;color:#8FE3C0">${jonah.minutes}</div><div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(242,234,224,.55)">Minutes</div></div>
            <div><div style="font-size:30px;font-weight:800;color:#8FE3C0">${jonah.cast.length}</div><div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(242,234,224,.55)">Voices</div></div>
            <div><div style="font-size:30px;font-weight:800;color:#8FE3C0">4</div><div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(242,234,224,.55)">Parts</div></div>
          </div>
        </div>
        <div class="small" style="margin-top:18px;color:rgba(242,234,224,.6)">Press <b style="color:#8FE3C0">T</b> to start the countdown.</div>
      </div>
    </div>`)}
  `, 'Open breakouts of four. Leave this slide up. Press T to run the timer.');

  add('', `
    ${sec('06', 'Who reads what')}
    ${a(`<h2>Jonah, by the numbers.</h2>`)}
    ${a(`<div class="lede" style="margin-top:20px">If your group is deciding who takes which colour, this is how much each part actually speaks.</div>`)}
    ${a(`<div style="margin-top:34px">${bars(
      jonah.cast.map((c)=>({ label: c.name, value: c.words, color: c.color })), ' words'
    )}</div>`)}
    ${a(`<div class="small" style="margin-top:20px">Blue is shared across ${jonah.cast.filter((c)=>c.color==='blue').length} speakers, so one reader covers all of them.</div>`)}
  `, 'Useful if a group stalls on who takes what.');

  // ---- 57-60 CLOSE --------------------------------------------------------
  add('', `
    ${sec('07', 'Back together')}
    ${a(`<h2>What happened in your room?</h2>`)}
    ${a(`<div class="cards" style="margin-top:40px">
      <div class="card"><div class="tag">Ask first</div><p style="font-size:21px">What did you notice reading it out loud that you would have missed reading it silently?</p></div>
      <div class="card"><div class="tag">Then</div><p style="font-size:21px">Did holding one voice for the whole story change how you heard that character?</p></div>
      <div class="card"><div class="tag">Then</div><p style="font-size:21px">Where would this fit in your school, and what would stop it working?</p></div>
    </div>`)}
    ${a(`<div class="body" style="margin-top:34px">The last one is the one worth writing down. If this is going to run at Kona it will be staff who make it run.</div>`)}
  `, 'Take three rooms, not ten. Keep four minutes for questions.');

  add('dark', `
    ${sec('08', 'Get it')}
    ${a(`<h2 style="font-size:64px">Free. No ads, no accounts,<br>nothing leaves the phone.</h2>`)}
    ${a(`<div class="qrs" style="margin-top:46px">
      ${qr('ios','App Store')}
      ${qr('android','Google Play')}
      <div style="flex:1;padding-left:20px">
        <div class="lede" style="font-size:21px">Search <b>SourceView Together</b> in either store if the code will not scan off a shared screen.</div>
        <div class="body" style="margin-top:22px;color:rgba(242,234,224,.78)">Both links are in the chat. English and French, iOS 16.4 or later, Android 8 or later, and it works offline once the text is down.</div>
        <div class="body" style="margin-top:22px;color:rgba(242,234,224,.78)">If you want the two DTS plans set up for your school, or the printable booklets for groups without devices, email me.</div>
        <div style="margin-top:22px;font-size:20px;font-weight:700;color:#8FE3C0">sourceviewbible@gmail.com</div>
      </div>
    </div>`)}
  `, 'Paste both store links in Zoom chat. Scanning from a shared screen is unreliable.');

  add('pad', `
    <div style="display:flex;flex-direction:column;height:100%">
      <div class="brand"><span class="dots">${['black','red','green','blue'].map((c)=>`<i style="background:${D.INK[c].bar}"></i>`).join('')}</span><span>SourceView Together</span></div>
      <div style="margin:auto 0">
        ${a(`<h1 style="font-size:82px">The Bible was a conversation<br>before it was a <em>book</em>.</h1>`)}
        ${a(`<div class="lede" style="margin-top:26px;max-width:920px">Ezra read the law aloud to a square full of people who had never heard it. Paul wrote letters expecting a room. Reading it quietly and alone is the recent habit, and it is the one your students have inherited.</div>`)}
      </div>
      ${a(`<div style="display:flex;justify-content:space-between;align-items:flex-end">
        <div class="small">Questions</div>
        <div class="small" style="text-align:right">sourceviewbible@gmail.com</div>
      </div>`)}
    </div>
  `, 'Q and A. If it runs dry, ask them what would stop this working in their school.');

  return out;
}
