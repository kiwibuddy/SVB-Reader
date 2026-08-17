# Design direction — Thread

Chosen from three directions explored in
[`mockups/01-three-directions.html`](mockups/01-three-directions.html).
Built out in [`mockups/02-thread-built-out.html`](mockups/02-thread-built-out.html)
— five tabs, two levels each, light and dark. Open either in a browser.

`mockups/00-superseded-option-d.html` is the earlier round, kept only for
reference. It was rejected for looking generic.

## The premise

Your database attributes **every word of scripture to the voice that spoke it**.
No other Bible app has this. The old design buried it under cards; Thread is
built out of it.

A single flowing line runs through the app. It is the spine of the story list,
bowing outward to hold a division's stories when you open one. It becomes the
gutter line in the reader. It lies flat across the canon on your year screen.

## Structure

Five tabs: **Read · Cast · Plan · Saved · You**. Year folded into You — it is a
glance-and-leave thing. Saved stays top level because it is content you hunt
through and it grows.

**Reader.** Speech bubbles retained. Narrator and God on the left, named
principals and everyone else on the right — so the two divine-authority voices
always read as one side of a conversation and humanity as the other. *That is a
theological claim the layout makes on every screen; confirm you agree with it.*
One continuous thread runs down the left gutter with a dot in the speaker's ink
where each turn joins.

**Light mode is the default.** Dark is a designed second mode, not an inversion.
In the mockup both are the same markup with one class changed; ship it that way
out of `constants/Colors.ts`.

## Data facts

From `assets/data/newBibleNLT1.json` and `assets/data/ReadingPlansChallenges.json`.

**774 distinct sources** across the four ink colours — 4 narration, 5 divine, 90
named principals, 681 everyone else. The per-colour sets sum to 781 because
seven names (Moses, Joshua, Solomon, Isaiah, Hezekiah + 2) are filed under two
colours in different passages. The union is 774.

**The file holds 431 segments: 365 stories plus 66 book introductions.** The
introductions carry a near-complete duplicate roll-up of each book's source
statistics. **Any aggregate must filter to `S*` keys** or word totals roughly
double. This caught me twice.

Corrected totals across the 365 stories only:

| Source | Words | Stories |
| --- | --- | --- |
| The Narrator | 334,842 | 365 |
| God | 140,659 | 186 |
| Jesus | 41,239 | 47 |
| Moses | 30,310 | 33 |
| David | 29,139 | — |
| **Total attributed** | **747,039** | 365 |

## Ten divisions

Traditional grouping, plain-English titles. Counts computed from the
`Bible1Year` plan and correct. **The titles are a placeholder** — they need
checking against the earlier research.

| # | Title | Books | Stories |
| --- | --- | --- | --- |
| 01 | The Beginning | Genesis – Deuteronomy | 68 (001–068) |
| 02 | The Land | Joshua – Esther | 86 (069–154) |
| 03 | The Songs | Job – Song of Songs | 35 (155–189) |
| 04 | The Warnings | Isaiah – Daniel | 59 (190–248) |
| 05 | The Messengers | Hosea – Malachi | 17 (249–265) |
| 06 | The Life | Matthew – John | 42 (266–307) |
| 07 | The Church Begins | Acts | 12 (308–319) |
| 08 | The Letters | Romans – Philemon | 27 (320–346) |
| 09 | Letters to Everyone | Hebrews – Jude | 12 (347–358) |
| 10 | The End | Revelation | 7 (359–365) |

Collapsed, these ten rows are the whole Bible on one screen. That plus scoped
search is what removes the 365-story scroll problem.

## The conversation precompute — highest-value item not yet built

Who each source speaks with, and their longest exchange. Neither is stored;
both are derivable from turn order within each segment. The trick is
**excluding narration** (`The Narrator`, `The Compiler`, `The Preacher`,
`The Choir`) — otherwise raw adjacency returns The Narrator 1,301 times for
Jesus and drowns everything.

Verified output:

- **Jesus** — The Disciples ×94, Simon Peter ×68, The Crowd ×63, Jewish Leaders
  ×60. Longest exchange 10 turns with The Crowd. Longest single speech 2,404
  words, in "Principles for Kingdom Living".
- **Abraham** — 943 words, 38 turns, God ×32 and almost nobody else. Longest
  exchange **8 turns with God** in "Sodom & Gomorrah" — the longest back-and-forth
  any human has with God anywhere in the Bible.
- **Ruth** — 200 words, one story. Naomi ×10, Boaz ×7.

Build-time script in `scripts/`, emitting JSON alongside the Bible data. Roughly
200 lines, output in tens of kilobytes, no runtime cost. This turns Cast from a
stats page into a reason to download the app.

## Decisions still open

1. **Division titles.** Mine are a guess. Confirm or replace.
2. **Sarah is filed in blue.** She sits in the 681-strong "everyone else" group,
   reading the same colour as "30 Men of Timnah" — as do Hagar and Abimelech.
   Ninety named principals is a small cast for a book this size. Promoting a few
   dozen figures is a data edit, not a design change, but every screen in this
   design makes the current grouping visible in a way the old one did not.
3. **The left/right split** puts God and the Narrator on one side and all
   humanity on the other. Deliberate, and worth agreeing to explicitly.

## Build order when design work starts

Read level 1 and Read level 2 are the bet — the flowing thread list and the
bubble reader. Plan level 2 reuses the thread component outright; Saved level 2
reuses the reader's turn component outright. Building those two screens well is
most of the work, and it is why this direction is affordable despite looking
expensive.

`react-native-reanimated` and `react-native-svg` are both already dependencies.
After the SDK upgrade Reanimated will be v4 with the `react-native-worklets`
split — build the thread against that, not against v3.
