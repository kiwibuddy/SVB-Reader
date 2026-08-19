// The fixed pages of the booklet: cover, inside cover, how-to, story title,
// question pages, notes and back cover. The story pages in between are laid
// out at load time by the paginator in build.mjs.

import { COVERS, INK } from './content.mjs';

const ORDER = ['black', 'red', 'green', 'blue'];

// Background motif: overlapping speech bubbles, the app's signature shape,
// scaled up until it reads as pattern rather than illustration.
function coverArt() {
  const bubble = (x, y, w, h, r, op, tail) => `
    <g opacity="${op}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" style="fill:var(--cover-mid)"/>
      ${tail ? `<path d="M ${x + 14} ${y + h} l 0 12 l 13 -12 Z" style="fill:var(--cover-mid)"/>` : ''}
    </g>`;
  return `<svg viewBox="0 0 148 210" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${bubble(-18, 16, 104, 34, 12, 0.55, true)}
    ${bubble(58, 62, 108, 30, 11, 0.4, true)}
    ${bubble(-24, 104, 86, 26, 10, 0.3, false)}
    <g opacity="0.5" stroke="rgba(255,255,255,0.22)" stroke-width="0.7" fill="none">
      <rect x="86" y="140" width="86" height="30" rx="11"/>
      <rect x="-30" y="176" width="92" height="28" rx="10"/>
    </g>
  </svg>`;
}

function swatchRow(active) {
  return `<div class="swatches">
    ${ORDER.map((c) => `<span class="sw${c === active ? ' on' : ''}"></span>`).join('')}
    <span class="sw-label">${COVERS[active].name} copy</span>
  </div>`;
}

export function coverPage(cover) {
  return `
<section class="page cover" data-fixed="cover">
  <div class="art">${coverArt()}</div>
  <div class="cover-inner">
    <div class="cover-kicker">SourceView Together</div>
    <div class="title-bubble">
      <h1>Nineveh<br>Spared!</h1>
      <div class="ref">Jonah 1–4</div>
      <div class="story-no">Story 255 of 365</div>
    </div>
    <div class="cover-foot">
      <div class="cover-line">Four colours. Four voices.<br><em>Find the other three and read it out loud.</em></div>
      ${swatchRow(cover.key)}
    </div>
  </div>
</section>`;
}

export function insideCoverPage() {
  return `
<section class="page" data-fixed="inside">
  <div class="page-body">
    <div class="stack">
      <div class="eyebrow">Before you start</div>
      <h2 class="page-title">Read it out loud.</h2>
      <p class="lede">
        Much of the Bible was first heard rather than read. When Ezra brought out
        the book of the Law, the people stood in the square and listened from
        early morning until noon (Nehemiah 8:1–3). Reading aloud brings more of
        you to the text. Your eyes see it, your mouth says it, your ears hear it.
        And the more of you that is engaged, the more chance the words have to
        take hold. Faith comes from hearing (Romans 10:17).
      </p>
      <p class="lede">
        Something changes when the words come out of your own mouth. Jonah stops
        being a figure on the page and becomes a man arguing with God about
        mercy, and you are the one saying his lines. You are not reading
        <i>about</i> it any more. You are inside it, and God's words are being
        spoken in the room.
      </p>
      <p class="lede">
        It does something to the four of you, too. Paul told Timothy to devote
        himself to the public reading of Scripture (1 Timothy 4:13). Scripture
        has nearly always been engaged in company. It is hard to say these words
        to each other and stay strangers. And this is how a group of friends
        becomes people who know God's word together.
      </p>
      <div class="hairline"></div>
      <div class="eyebrow" style="margin-bottom:2.5mm;">Your colour decides what you read</div>
      <div class="keyrow">
        ${ORDER.map((c) => `<div class="keychip k-${c}"><div class="who">${COVERS[c].name}</div><div class="what">${INK[c].label}</div></div>`).join('')}
      </div>
      <div class="ownership">
        <div class="lbl">This booklet belongs to</div>
        <div class="rule"></div>
        <div class="lbl" style="margin-top:4mm;">Group / class</div>
        <div class="rule"></div>
      </div>
    </div>
  </div>
  <div class="folio"><span class="mark">Jonah</span><span class="num"></span></div>
</section>`;
}

export function howToPage() {
  return `
<section class="page" data-fixed="howto">
  <div class="page-body">
    <div class="stack">
      <div class="eyebrow">Six minutes, start to finish</div>
      <h2 class="page-title">How to use<br>this booklet.</h2>
      <ol class="steps">
        <li><b>Sit in a group of four.</b> One of each colour. Three works, five works, someone just doubles up or shares.</li>
        <li><b>Read your colour out loud.</b> Every speech bubble is tinted. When a bubble is your colour, that line is yours. Read it like you are auditioning for the part, with the emotion the scene actually has, and the story comes alive.</li>
        <li><b>Don't stop for questions.</b> Read the whole story through first, straight from chapter 1 to the last line of chapter 4. It takes about six minutes.</li>
        <li><b>Then turn to the questions</b> at the back and write your own answers before anyone talks. Short is fine. Honest is better.</li>
        <li><b>Talk it through</b> as a group. Everybody reads out one answer they wrote down.</li>
      </ol>
      <div class="readnote" style="margin-top:auto;">
        <b>The small numbers</b> in the text are verse numbers, so ignore them
        while reading aloud. <b>The grey name</b> above a bubble tells you who is speaking.
        Where a speaker keeps going, the bubbles keep their colour and the name
        isn't repeated.
      </div>
    </div>
  </div>
  <div class="folio"><span class="mark">Jonah</span><span class="num"></span></div>
</section>`;
}

export function storyTitlePage(meta, share, cast) {
  const pct = (n) => ((n / share.total) * 100).toFixed(2);
  const bar = ORDER.map((c) => `<i style="width:${pct(share.totals[c])}%;background:${INK[c].bar}"></i>`).join('');
  const rows = cast
    .map(
      (s) => `<div class="cast-row">
        <span class="cast-dot" style="background:${INK[s.color].bar}"></span>
        <span class="cast-name">${s.name}</span>
        <span class="cast-words">${s.words} words</span>
      </div>`
    )
    .join('');
  return `
<section class="page" data-fixed="storytitle">
  <div class="page-body">
    <div class="stack">
      <div class="story-head">
        <div class="eyebrow">Story 255 of 365</div>
        <h1>${meta.title}</h1>
        <div class="ref">Jonah ${meta.ref.replace(/-/g, "\u2013")}</div>
      </div>
      <div class="voicebar">${bar}</div>
      <div class="voicebar-key"><span>Narration</span><span>God</span><span>Jonah</span><span>Everyone else</span></div>
      <div class="cast">
        <h3>Who speaks in this story</h3>
        ${rows}
      </div>
      <div class="readnote">
        <b>Reading it out loud.</b> The narration is the biggest part by a long way,
        so give it to a confident reader, or split it between two. Jonah gets the
        prayer in chapter 2, which is the hardest and best bit to read well.
      </div>
    </div>
  </div>
  <div class="folio"><span class="mark">Jonah</span><span class="num"></span></div>
</section>`;
}

function answerLines(n) {
  return `<div class="answer">${'<div class="ln"></div>'.repeat(n)}</div>`;
}

export function questionPages(questions) {
  const card = (q, i) => `
    <div class="qcard">
      <div class="qhead"><span class="qnum">${i + 1}</span><span class="qtext">${q}</span></div>
      ${answerLines(4)}
    </div>`;

  const page1 = `
<section class="page" data-fixed="questions">
  <div class="page-body">
    <div class="stack">
      <div class="eyebrow">Now talk about it</div>
      <h2 class="page-title">Four questions.<br>Write first, talk after.</h2>
      <div class="qflow">
        ${card(questions[0], 0)}
        ${card(questions[1], 1)}
      </div>
      <div class="q-foot">Nobody has to share everything they wrote. Everybody shares something.</div>
    </div>
  </div>
  <div class="folio"><span class="mark">Jonah</span><span class="num"></span></div>
</section>`;

  const page2 = `
<section class="page" data-fixed="questions">
  <div class="page-body">
    <div class="stack">
      <div class="eyebrow">Four questions, continued</div>
      <div class="qflow">
        ${card(questions[2], 2)}
        ${card(questions[3], 3)}
      </div>
      <div class="q-foot">Question 4 is the one that leaves the room with you. Make it small enough to actually do before you meet again.</div>
    </div>
  </div>
  <div class="folio"><span class="mark">Jonah</span><span class="num"></span></div>
</section>`;

  return [page1, page2];
}

// Spare pages needed to reach a multiple of four. Three different ones, so a
// padded booklet never ends in a run of identical blank sheets.
export function fillerPages() {
  const swapRow = (c) => `
    <div class="swap-row">
      <span class="swap-chip" style="background:${COVERS[c].deep}"></span>
      <span class="swap-name">${COVERS[c].name}</span>
      <span class="swap-part">${INK[c].label}</span>
      <span class="swap-line"></span>
    </div>`;

  const swap = `
<section class="page" data-fixed="filler">
  <div class="page-body">
    <div class="stack">
      <div class="eyebrow">Do it again</div>
      <h2 class="page-title">Read it again as<br>a different colour.</h2>
      <p class="lede">
        The story never changes. Your part does. Swap covers with someone in your
        group and read Jonah again as another voice. The narration feels nothing
        like being God, and neither feels anything like being Jonah.
      </p>
      <div class="swap-head">
        <span>Colour</span><span>What you read</span><span>Date · who with</span>
      </div>
      ${ORDER.map(swapRow).join('')}
      <div class="readnote" style="margin-top:auto;">
        <b>Four times through</b> and you will have read every word of Jonah out
        loud, and heard the other three read theirs.
      </div>
    </div>
  </div>
  <div class="folio"><span class="mark">Jonah</span><span class="num"></span></div>
</section>`;

  const keep = `
<section class="page" data-fixed="filler">
  <div class="page-body">
    <div class="stack">
      <div class="eyebrow">One line worth keeping</div>
      <h2 class="page-title">Copy out the line<br>that stuck.</h2>
      <p class="lede" style="font-size:9.6pt;">
        Write it in the bubble, in the colour of whoever said it.
      </p>
      <div class="keep-bubble">
        ${'<div class="ln"></div>'.repeat(5)}
      </div>
      <div class="keep-ref"><span>Jonah</span><span class="ln"></span></div>
      <div class="eyebrow" style="margin-top:9mm;">Why it stuck</div>
      <div class="notes-grid">${'<div class="ln"></div>'.repeat(5)}</div>
    </div>
  </div>
  <div class="folio"><span class="mark">Jonah</span><span class="num"></span></div>
</section>`;

  const notes = `
<section class="page" data-fixed="filler">
  <div class="page-body">
    <div class="stack">
      <div class="eyebrow">Notes</div>
      <h2 class="page-title">Anything you<br>want to keep.</h2>
      <div class="notes-grid">${'<div class="ln"></div>'.repeat(16)}</div>
    </div>
  </div>
  <div class="folio"><span class="mark">Jonah</span><span class="num"></span></div>
</section>`;

  return [swap, keep, notes];
}

export function storyEndPage(footnotes) {
  return `
<section class="page" data-fixed="storyend">
  <div class="page-body">
    <div class="stack">
      <div class="eyebrow">End of the story</div>
      <h2 class="page-title">That's all four<br>chapters of Jonah.</h2>
      <p class="lede">
        It stops on a question, and God is the one asking it. Nobody records
        Jonah's answer.
      </p>
      <div class="pullquote">
        <div class="speaker speaker--left">God</div>
        <div class="bubble">
          <p class="para">“Shouldn't I feel sorry for such a great city?”</p>
        </div>
        <div class="pullquote-ref">Jonah 4:11, the last line of the book</div>
      </div>
      <p class="lede" style="font-size:9.6pt;color:#6A6A6E;margin-top:auto;">
        Turn the page. Write your answers down before anybody starts talking.
      </p>
      <div class="textnotes">
        <h4>Notes on the text</h4>
        <ul>${footnotes.map((f) => `<li><sup>${f.letter}</sup>${f.html}</li>`).join('')}</ul>
      </div>
    </div>
  </div>
  <div class="folio"><span class="mark">Jonah</span><span class="num"></span></div>
</section>`;
}

export function backCoverPage(share, cover) {
  const pct = (c) => ((share.totals[c] / share.total) * 100).toFixed(2);
  return `
<section class="page back" data-fixed="back">
  <div class="back-inner">
    <h2>One story.<br>Four voices.<br>Read it together.</h2>
    <div class="rulez"></div>
    <p>
      SourceView colours every word of the Bible by who said it. The narration,
      God, the main character, and everyone else. Once you can see who is
      speaking, a story you thought you knew starts behaving like a conversation.
    </p>
    <p>
      The full biblical text is laid out in 365 segments, one for every day of
      the year, averaging about 15 minutes each. The divisions follow the flow of
      the story rather than the chapter breaks, so nothing cuts you off mid-scene.
    </p>
    <div class="back-share">
      <div class="back-bubbles">
        ${ORDER.map((c) => `<i style="background:${COVERS[c].tint};width:${pct(c)}%"></i>`).join('')}
      </div>
      <div class="back-share-key">How Jonah divides between the four of you</div>
    </div>
    <div class="back-facts">
      <div><b>4</b><span>chapters</span></div>
      <div><b>48</b><span>verses</span></div>
      <div><b>6</b><span>speaking parts</span></div>
      <div><b>255</b><span>of 365 stories</span></div>
    </div>
    <div class="back-colophon">
      <div class="back-dots">
        ${ORDER.map((c) => `<i style="background:${c === cover.key ? COVERS[c].tint : 'transparent'}"></i>`).join('')}
      </div>
      This is the <b>${COVERS[cover.key].name}</b> cover. Three others are out there,
      with exactly this story inside.
    </div>
    <div class="back-mark">SourceView Together</div>
  </div>
</section>`;
}
