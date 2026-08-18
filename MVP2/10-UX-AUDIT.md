# UX audit — simple user stories, and what other Bible apps do

The test applied throughout: **can a person who has never seen this app say what
a screen is for in one sentence?** Where the answer is no, it is listed.

Audited against the build on `store-compliance-130` and the conventions people
arrive with from YouVersion, Dwell, Lectio and the ESV app.

---

## 1. The ten user stories

Written the way a reader would say them, not the way a backlog would.

| # | "I want to…" | Served? |
| --- | --- | --- |
| U1 | carry on where I left off | **Planned** — continue card, B4 |
| U2 | read today's reading | **No surface** — see 3.1 |
| U3 | read this out loud with three friends | **Yes** — call sheet + read-aloud |
| U4 | find a verse I half remember | **Partly** — reference search missing, D1 |
| U5 | find out who said something | **Yes** — Cast. This is the app's reason to exist |
| U6 | keep a verse that hit me | **Yes** — reactions and notes |
| U7 | see how I'm doing | **Planned** — You L1, F3 |
| U8 | send a verse to someone | **No** — see 3.2. The biggest gap |
| U9 | know how long this will take | **Data exists, unused** — see 3.3 |
| U10 | talk about it afterwards | **Content exists, no home** — see 3.4 |

Five are in hand. **U2, U8, U9 and U10 are all cases where the content or data
is already in the repo and nothing surfaces it.** That is the theme of this
audit: the app is richer than the app knows.

---

## 2. What the build gets right, measured against the category

Worth stating plainly, because the punch lists have been long.

- **Fully offline.** No account, no network, no sign-in wall. Most Bible apps
  make you register before you can read. This one does not, and after the QR
  removal it asks for **no permissions at all**. That is now a genuine selling
  point and belongs in the store listing.
- **Story-shaped, not chapter-shaped.** 365 named stories is a real structural
  difference, and "God Creates" is a better invitation than "Genesis 1".
- **Attribution.** Nothing else can tell you who is speaking, let alone who they
  spoke with. Cast is not a nice-to-have; it is the product.
- **Five tabs.** Under the six or seven most competitors carry.

---

## 3. Gaps, in order of what I would fix

### 3.1 · U2 — there is no "today"

Every mainstream Bible app opens on something for today. This one opens on a
list, which asks the reader to make a choice before they have read a word.

**`assets/data/DailyStoryMap.json` exists and nothing imports it.** A daily
story mapping is already in the repo.

The fix is not a new screen — it is one line of copy on the continue card (B4):

- Nothing started → *"Today · The Flood"* from `DailyStoryMap`
- Mid-story → *"Continue · The Flood"*
- Plan active → *"Day 149 · Solomon Builds the Temple"*

Same card, three states, no new surface. `completionType` already accepts
`'today'` as a context, so the plumbing anticipated this.

### 3.2 · U8 — you cannot share a verse. This is the biggest gap.

There is no share anywhere. `expo-clipboard` appears only in `NoteModal.tsx`,
for copying a note.

Sharing a verse is the primary way Bible apps grow, and **SourceView has a
uniquely shareable object that no competitor can copy: an attributed, colour-coded
speech bubble.**

> **GOD** · Genesis 22:2
> *"Take your son, your only son — yes, Isaac, whom you love so much."*
> — SourceView

A shared image that says *who said it*, in their ink, is unmistakable. Every
share is an advertisement for the one thing the app does differently.

**Spec:** long-press a bubble → the existing sheet gains **Share** and **Copy**
beside the reactions. Share renders the bubble to an image (`react-native-view-shot`,
or draw to SVG and rasterise) with the speaker, reference and a small wordmark.
Copy puts `"text" — Genesis 22:2 (NLT)` on the clipboard, which is the format
people expect.

**Estimate 1.5–2 days.** I would put it above half of group E.

### 3.3 · U9 — reading times are computed and never shown

**`assets/data/SegmentReadingTimes.json` is 96 KB and unused.** The mockup shows
"12 min" on every story row; the build shows nothing.

Put the estimate on the story row, the continue card, and the plan detail. "12
min" is the difference between opening a story on a bus and not.

### 3.4 · U10 — 900 KB of questions with nowhere to go

Four question sets ship in the app: `Questions-EN` (601 KB), plus Small Group,
Family and School sets. They reach the reader via `[segment]/index.tsx`, but the
new five-tab design gives them **no home of their own**, and the question sets
are the natural next step for exactly the audience we just decided to keep — a
group of four who have finished reading aloud.

**Spec:** at the end of a story, after the completion moment, a quiet card:
*"Talk about it — 4 questions"*. Tapping expands them in place. The set is chosen
by an audience preference in Settings (Small Group / Family / School /
Personal), defaulting to Personal.

This costs little, it uses content that is already written and already migrated
into SQLite, and it closes the loop on group reading without any coordination
software.

### 3.5 · Empty states are bleak

A new user's **You** tab reads `0 / 365`, `0 / 774`, `0` streak. Three zeros is a
poor welcome.

Before any progress exists, that screen should say what is *ahead*, not what is
absent: *"365 stories. 774 voices. Start with The Flood."* Swap to counters once
the first story is done. Same for Saved, which should show what saving is for
rather than "No reactions yet".

### 3.6 · Two data files are about to be orphaned

- `TopSpeakers.json` (19 KB) — used only by `app/(tabs)/Navigation.tsx`, which
  A2 deletes
- `ChronologicalMappings.json` (95 KB) — used only by
  `components/navigation/ChronologicalView.tsx`, an old-design component

Decide deliberately: rewire into Cast and Plan respectively, or delete both file
and data. **Do not leave them shipping in the binary unreferenced** — that is how
`verseIndex.json` came to be 6.6 MB of dead weight.

### 3.7 · Smaller conventions worth having

| | |
| --- | --- |
| **Copy verse with reference** | Expected everywhere; trivial. Ships with 3.2 |
| **"Where was I?" on cold start** | Open on the last-read story if it was within ~24h, else the list |
| **Long-press to select a range** | Deferred — single-verse reactions are fine for MVP2 |
| **Audio** | Deferred to MVP3, correctly. It is the one expectation you will be asked for |
| **Multiple translations** | Out of scope. NLT + French is defensible; say so in the listing |

---

## 4. Where the app is still hard to explain

Three places fail the one-sentence test.

**The Cast card's numbers need a subject.** "41,239 · 716" means nothing
unlabelled. It should read *"41,239 words across 716 turns"* — the same data,
now a sentence.

**"Voices met" needs one line of explanation the first time it appears.** It is
a new idea and nothing else uses it. On the completion card the first time:
*"You've now heard 215 of the Bible's 774 speaking voices."* Once only.

**The division names must not need explaining.** This is D2, still open. If
"The Songs" makes someone pause and think, the traditional name belongs
underneath it — which the design already allows for, since each division row has
a subtitle line carrying the book range.

---

## 5. Recommended additions to the queue

| New | Item | Days | Where |
| --- | --- | --- | --- |
| **H1** | Share and copy a verse — bubble-as-image | 1.5–2 | after C |
| **H2** | "Today" state on the continue card, wire `DailyStoryMap` | 0.5 | with B4 |
| **H3** | Reading times on rows and cards, wire `SegmentReadingTimes` | 0.5 | with B |
| **H4** | End-of-story questions card, audience preference in Settings | 1.5 | with F |
| **H5** | Empty states for You and Saved | 0.5 | with F |
| **H6** | Decide `TopSpeakers` and `ChronologicalMappings` — rewire or delete | 0.5 | with E, F |

**Total 5–5.5 days**, taking the build from 31.5–36.5 to **36.5–42**.

H1 and H4 are the two that change what the app *is* rather than how it looks —
one gives it a way to spread, the other completes the group-reading loop that
started this whole redesign.
