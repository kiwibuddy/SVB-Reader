# Build review — device testing, 19 August 2026

First run of the MVP2 build on device. This is a punch list, a set of design
decisions taken from your notes, and a revised plan for what remains.

**Basis of this review:** the screenshots plus the code on
`store-compliance-130` @ `8565195`. Every cause below is now confirmed at file
and line — nothing here is inferred.

**Revision 2, 19 August:** updated after reading the branch. One diagnosis was
wrong and is corrected in §2.

---

## 1. Where the build actually is

### Phase 0 is done

Confirmed on the branch. This is the hard part and it is behind you:

| | |
| --- | --- |
| `expo` | **57.0.14** — was 53 |
| `react-native` | **0.86.2** — was 0.79.6 |
| `expo-router` | **57.0.14** |
| `react-native-reanimated` | **4.5.1** + `react-native-worklets` 0.10.1 |
| `@react-navigation/*` | **gone** — the bundling error is resolved |
| `expo-camera`, `react-native-qrcode-svg` | **gone** |
| Native `ios/` `android/` | **gone — managed workflow** (resolves D5) |
| `.nvmrc` | 22.13.1 |
| Group/QR screens, services, context | **all removed** |
| Group tables | no longer written |
| `CheckCircle.tsx` | **rebuilt, 1,064 → 316 lines** |

D5 is resolved as **managed**, which was the recommendation. Every future SDK
upgrade is now a version bump rather than a native migration.

### The screens

Further than the roadmap assumed, and out of the planned order.

| Item | Planned phase | State |
| --- | --- | --- |
| S1 design tokens | 1 | **Done** — light mode, appearance control present |
| S2 Read L1 thread | 2 | **Partial** — renders, line breaks after 4 rows |
| S3 Read L2 reader | 2 | **Partial** — bubbles render, several defects |
| S4 scoped search | 3 | **Partial** — field and pills present on Cast |
| S5 Cast L1 | 3 | **Partial** — lists 774, wrong sort and filters |
| S6 Cast L2 | 3 | Unknown — not screenshotted |
| S7 Plan L1/L2 | 4 | **Partial** — L1 renders, L2 broken |
| S8 Saved | 4 | **Not started** — still the old Reactions screen |
| S10 You L1 | 4 | **Not started** — L2 content is showing in its place |
| S13 remove QR machinery | 1 | Unknown — role selector still present |
| S13b rebuild CheckCircle | 1 | **Not done** — confirmed by the completion bug |
| S15 call sheet | 2 | **Partial** — bar and count, no names |
| S16 read-aloud | 4 | **Present** |
| S9 conversation precompute | 1 | Unknown |

**Building ahead of Phase 0 was a risk and it has now cost you** — you are
debugging a redesign and an SDK migration at the same time, which is exactly the
"every failure has two possible causes" problem. Not worth unwinding now, but
finish the SDK 57 upgrade before adding any more screens.

---

## 2. Two root causes explain most of the visual defects

### RC1 — The SVG path is hard-coded. Confirmed. This is my fault.

`components/thread/ThreadList.tsx:198` — my mockup path, copied verbatim:

```
d="M30 0 L30 24 C30 46 52 40 52 58 L52 240 C52 260 30 252 30 280 C30 340 32 400 30 1200"
```

`L52 240` holds the indent at x=52 from y≈58 to y≈240 — **about four rows at
44px each.** That is precisely the "indent covers only four stories" bug, and
`30 1200` then runs the spine to a fixed 1200px regardless of content height,
which is why it stops mid-Exodus.

Those coordinates describe one specific layout. They cannot survive real data,
which is why the Genesis indent covers only the first four stories and then the
line stops somewhere in Exodus, and why the year line on **You** renders as
disconnected dashes.

**The fix is architectural, not cosmetic.** The path must be *generated at
runtime* from measured row positions: each row reports its offset and depth via
`onLayout`, and the path is rebuilt from that list. Straight segments at each
indent depth, short cubic bows at every depth change. It is roughly 40 lines of
path-building code and it makes the thread work for any expansion state,
including the new three-level hierarchy below.

Treat this as the single most important piece of work remaining on Read L1. Do
not patch the fixed path.

### RC2 — Three stale route names in `CheckCircle`

**I got this wrong first time.** `CheckCircle.tsx` *has* been rebuilt — 316
lines, one-tap completion, voices-met celebration, commit `cf1e5e9`. The bug is
much smaller than a rebuild: three `router.push` calls still name routes the
redesign replaced.

| Line | Pushes to | Should be |
| --- | --- | --- |
| 160 | `/(tabs)/ReadingPlans` | `/(tabs)/plan` |
| 172 | `/(tabs)/ReadingPlans` | `/(tabs)/plan` |
| 183 | `/(tabs)/Navigation` | `/(tabs)/index` |

Line 183 is the one you hit — `/(tabs)/Navigation` **is** the old story finder,
still present as a route. A three-line fix, not a rebuild.

### RC3 — The pills stretch because the scroller has no cross-axis alignment

Both pill bugs — the tall vertical bars on Read search, and Cast pills going
"big and out of shape" — are one cause in two files.

| File | Line | |
| --- | --- | --- |
| `components/thread/ThreadList.tsx` | 121 / style `scopes` | `{ paddingHorizontal: 14, paddingTop: 10, gap: 6 }` |
| `app/(tabs)/cast/index.tsx` | 49 / style `filters` | `{ paddingHorizontal: 14, paddingBottom: 8, gap: 6 }` |

Both are the `contentContainerStyle` of a horizontal `ScrollView`, and **neither
sets `alignItems`.** React Native defaults the cross axis to `stretch`, so each
chip grows to the scroller's full height — which is why they become full-height
columns exactly when the results list is empty and the scroller has room to
expand.

```diff
- scopes: { paddingHorizontal: 14, paddingTop: 10, gap: 6 },
+ scopes: { paddingHorizontal: 14, paddingTop: 10, gap: 6, alignItems: 'flex-start' },
```

One line in each file. Add `flexGrow: 0` on the ScrollView itself so it never
claims vertical space at all.

---

## 3. P0 — broken, fix before anything else

| # | Defect | Cause |
| --- | --- | --- |
| P0-1 | Thread line stops after ~4 stories | RC1 hard-coded path |
| P0-2 | Completion returns to old story-finder | RC2 CheckCircle not rebuilt |
| P0-3 | Plan detail loses the tab bar entirely | `app/plan/[id].tsx` sits outside the `(tabs)` group — move it to `app/(tabs)/plan/[id].tsx` |
| P0-4 | "The Gospels" shows 10 stories | Wiring, not data — see below |
| P0-5 | Reader text overlapped by floating ‹ › buttons | No bottom inset on the scroll container |
| P0-6 | You L1 missing; settings shown in its place | Screen not built |
| P0-7 | Filter pills render as full-height bars | RC3 — missing `alignItems` |
| P0-8 | `gen 4:3` finds nothing | No reference parsing — see §4.4 |

**On P0-4:** your data is fine. `theGospels` holds **46 segments** (42 stories +
4 book intros). `Bible1Year` holds 431 (365 + 66 intros). The app is showing 10,
so the plan-to-segment resolution is dropping entries — likely filtering on
something that only matches a subset. Also note **you have three plans**
(`Bible1Year`, `SchoolYear1` 180, `NT100Days` 127) and only one is rendering.

---

## 4. Read L1 — the story list

### 4.1 Three-level hierarchy — Division → Book → Story

Your call, and it is right. 68 stories under "The Beginning" is too long a list,
and the book is the unit people actually think in.

```
The Beginning              ◆ spine, x = 30
   Genesis      18         ◇ book,  x = 52
      God Creates          ● story, x = 74
      People Sin           ●
      …
   Exodus       14         ◇
   Leviticus    11         ◇
The Land                   ◆
```

- Tapping a **division** reveals its **books only** — never stories
- Tapping a **book** reveals that book's stories
- The line bows out at each level and returns at the close of each level, so the
  indent covers **the whole set**, not the first few
- One book open at a time within a division; one division open at a time
- Collapsed, ten rows is still the whole canon

This depends entirely on RC1 being fixed. With a generated path it is nearly
free; with the fixed path it is impossible.

### 4.2 Beads must mask the line

The line currently runs visibly through each dot. Give every bead a ring in the
background colour so it punches a hole in the thread:

```
box-shadow: 0 0 0 3px var(--p-bg)
```

The reader's speaker dot (`.spk`) already does exactly this — same treatment,
applied to `.mk.bead`.

### 4.3 The continue card

Yes — a card above the search bar, and it appears only when there is something
to continue.

- **Nothing started:** no card. Search sits at the top, thread below. Clean
  first-run.
- **Unfinished story:** a card showing the story title, its division and book,
  and how far in you are. Tap resumes at the last-read turn, not the top.
- **Active plan, no story open:** the card shows the plan's next story and the
  plan name.
- Card scrolls away with content; **search stays pinned**. So the answer to
  "does something happen above the search bar and that lowers it" — the card
  pushes search down while at the top of the list, and search sticks to the top
  once you scroll past it.

Only ever one card. If both a plan and an unfinished story exist, the unfinished
story wins — finishing beats starting.

### 4.4 Scripture reference search — and the 6.6 MB file nothing reads

`gen 4:3` returns nothing because there is no reference parsing.
`ThreadList.tsx:65–85` lowercases the query and runs `.includes()` against voice
names, book names, story titles and `info.ref`. A story's `ref` is `"3:1-5:32"`
— the book code is not in that string, so no combination of book and verse can
ever match.

**The fix is far smaller than it looks, because the index already exists.**

`assets/data/verseIndex.json` is **6.6 MB, 24,935 entries**, keyed by full book
name:

```json
"Genesis-1-3": { "segmentId": "S001", "blockIndex": 0, "position": 80,
                 "book": "Genesis", "chapter": 1, "verse": 3,
                 "segmentTitle": "God Creates" }
```

**Nothing in the app reads it.** It ships inside the binary and is never
imported — 6.6 MB of dead weight today, and the entire feature tomorrow.

So reference lookup is: normalise → one dictionary hit → navigate. And because
each entry carries `blockIndex` and `position`, you can scroll **to the exact
verse**, not merely open the story.

**The only real work is book-name aliasing.** `BookChapterList.json` already
gives four forms per book — the key (`Gen`), `bookName` (`Genesis`), `FCBH` and
`YV` (`GEN`). Add a hand-written alias table for the rest:

- `Gn` `Ge` → Genesis · `Ps` `Psalm` `Psalms` → Psalms · `Mt` `Matt` → Matthew
- `Song` `Song of Solomon` `SoS` `Cant` → Song of Songs
- `1 Cor` `1Cor` `1Co` `I Corinthians` → 1 Corinthians (roman numerals, no space)
- `Rev` `Rv` `Apoc` → Revelation

**Watch the ambiguous prefixes** — these need either longest-match or showing
both results rather than guessing:

| Input | Could be |
| --- | --- |
| `Phil` | Philippians / Philemon |
| `Jud` | Jude / Judges |
| `Jo` `Joh` | John / Job / Joel / Jonah / Joshua |
| `Ma` | Matthew / Mark / Malachi |

Separators to accept: `:` `.` and a space (`Gen 4:3`, `Gen 4.3`, `Gen 4 3`),
optional space after the book (`gen4:3`), ranges on `-` and `–`, and a
chapter-only form (`Gen 4`) resolving to the segment containing verse 1.

Result row should read as a reference, not a story: **Genesis 4:3 — "The Flood"
· story 003**, and tapping it opens the story scrolled to that verse.

This belongs in the **Read** search where you hit it, and the same parser serves
the Cast search for free.

---

## 5. Read L2 — the reader

This screen has the most wrong with it.

### 5.1 Typography

Body text in the bubbles is far too large — "Some time later, the Lord spoke to
Abram in a vision and said to him," breaks across five lines. The mockup sets
**13.5px on a bubble at 84% max-width**, giving roughly 8–10 words per line. The
build looks closer to 20px in a 60%-width bubble.

Fix both together: bubble `max-width: 84%`, body 15–16px at the Medium font
setting (respecting the Font Size control), line-height ~1.45.

### 5.2 Speaker labels are attached to the wrong bubble

"GOD" currently sits hard against the bottom edge of the narrator's bubble, so
it reads as a caption on the speech above rather than a label for the speech
below. Needs the turn spacing from the mockup: `padding-top: 9px` on the turn,
`margin-bottom: 3px` on the label. Visually the gap above a label must always be
larger than the gap below it.

### 5.3 Remove the bubble tails

The build has pointed tails. The mockup deliberately has none — it uses an
asymmetric corner radius instead (16px everywhere, 5px on the corner nearest the
gutter), so the bubble points at the thread without a tail. Tails read as
generic messaging UI, which is the thing we moved away from.

### 5.4 The gutter thread is missing

The continuous line down the left gutter is absent. It is what ties the reader to
the rest of the app, and it was the answer to "can the thread carry into reading
mode". Same generated-path approach as Read L1, in a 30px gutter, with the
speaker dot sitting on it in each speaker's ink.

### 5.5 Bubbles are not alternating

Everything appears left-aligned. The rule: **Narrator and God on the left;
Main Characters and Supporting Cast on the right.** Only narrator and God appear
in that screenshot so this may be fine — confirm on a story with green and blue
speakers, e.g. `S008` Abraham's Faith Tested, which has all four inks.

### 5.6 Floating navigation obscures the text

The ‹ › buttons sit on top of the last bubble. Add bottom padding to the scroll
container equal to the button height plus the safe-area inset, so content can
always scroll clear of them.

### 5.7 "Select Your Reading Role:" — remove the framing, keep the swatches

This is the one thing in the build that contradicts the decision in
[`05-GROUP-READING.md`](05-GROUP-READING.md). A titled, imperative step called
*"Select Your Reading Role"* sitting above the text is a mode choice before
reading — precisely what we removed with the QR flow. It was listed there as
*"optional, flagged as optional — do not build it in MVP2"*.

The swatches themselves are good and you clearly like the motif. So keep them
and demote them:

- Drop the heading entirely
- Move the four swatches **inside the call sheet**, where they read as "these are
  the voices in this story" rather than "choose before you may begin"
- Selecting one is optional and purely local — it gently emphasises that ink's
  turns and nothing else
- Nothing is gated on making a selection

### 5.8 Story reference is missing its book

The header shows `15:1-18:15`. It should read `Gen 15:1–18:15`, with an en dash.

### 5.9 The call sheet needs the names

Right now it is a colour bar and "CALL SHEET · 6". The whole point is the names:

> **God Makes a Covenant with Abraham** · Gen 15:1–18:15 · 1,664 w
> The Narrator 1,230 · Abraham 196 · God 149 · Melchizedek 25 · The King of Sodom 19 · Pharaoh 45

Tap the bar to expand. That is the six the counter is referring to, and it is
what four people read off before they start.

---

## 6. Cast

### 6.1 Sort and exclusions

Alphabetical is the wrong default — the first screen is "24 Elders, 30 Men of
Timnah, 40 Sworn Assassins, 42 Boys of Bethel", which makes a rich dataset look
like noise.

- **Default sort: words, descending**
- **Exclude all four narration sources entirely** — The Narrator, The Compiler,
  The Preacher, The Choir. Cast is for speaking parts.
- Fix the pluralisation: "1 STORIES" → "1 story"

With those two changes the first screen becomes God, Jesus, Moses, David,
Solomon — which is a completely different first impression.

### 6.2 Filter pills

- **Shape them as speech bubbles** — same outline treatment as a reader bubble,
  tinted fill in that ink, asymmetric corner
- **Order: Main Characters · Supporting Cast · Divine · All**
- **Fix the sizing bug.** Selecting a pill currently makes it grow and lose
  shape. The selected state must change *only* fill, border and font weight —
  never padding, font size or border radius. Reserve the bold metrics in the
  unselected state so the box never reflows.

### 6.3 Terminology change

Rename throughout the app and the docs:

| Old | New |
| --- | --- |
| Named Principal | **Main Character** |
| Everyone Else | **Supporting Cast** |
| Divine Voice | Divine Voice *(unchanged)* |
| Narration | *(not shown in Cast)* |

### 6.4 Letters are not conversation

Real problem, and you are right to raise it. Paul's 7,090 words are not spoken
dialogue — they are written correspondence, and listing them beside Jesus's
spoken words compares two different things.

Proposal: derive a **`mode: spoken | written`** flag from the book. Any source
whose words fall in an epistle (Romans–Philemon, Hebrews–Jude) is written.

- Written sources render in **neutral grey** in Cast, not in an ink colour
- The cast card splits the count: **Spoken 1,240 · Written 5,850**
- Written words are excluded from "spoke with" and "longest exchange", which
  would otherwise be meaningless
- Revelation needs a judgement call — it contains letters *and* speech

This is new data work. It belongs with the conversation precompute (S9).

### 6.5 The cast card

- **Add the books they speak in.** Currently absent and it is the most obvious
  missing fact.
- **The horizontal line under the name is the appearance ribbon** — 365 hairlines
  showing where in the canon someone speaks. At that width it is illegible, which
  is why it reads as a mystery line. **Replace it with ten division buckets**, one
  bar per division, height by word count. Ten legible bars beat 365 invisible
  ones, and it matches the divisions used everywhere else.
- **God needs a different layout.** 186 stories and dozens of interlocutors do
  not fit the card built for Abraham's five stories. For any voice above ~40
  stories, switch to an era-organised card: division buckets as the primary
  graphic, then top interlocutors **per division** rather than one flat top-four.
  Same for Jesus at 47.

### 6.6 Conversation navigation — the best idea in your list

Tapping a name in "Spoke with" should open a **conversation view**: every
exchange between those two voices, in canonical order, across all stories.

- Only the turns where those two speak in sequence, with a little surrounding
  context
- A header naming both voices and the exchange count
- Each exchange labelled with its story, tappable to open the full story there
- **The floating ‹ › become previous/next *exchange* instead of previous/next
  *story*** — exactly as you suggested. This is a genuinely new axis of
  navigation through scripture and nothing else has it.

Abraham → God gives you the eight-turn haggle over Sodom. Ruth → Naomi gives you
the whole relationship in ten exchanges.

**New scope item, S17.** Depends on the precompute (S9) storing exchange
positions, not just counts.

---

## 7. Plan

### 7.1 Structure — three plans, then challenges

Your data already has the shape you remember:

| | |
| --- | --- |
| **Plans** (3) | `Bible1Year` 431 · `SchoolYear1` 180 · `NT100Days` 127 |
| **Challenges** (12) | 7 to 57 segments each |

Group them as: **Full year · School year · 100 days**, then **Challenges**. Only
one plan card is currently rendering — all three should show, with the active one
marked.

### 7.2 Restore the descriptive content

The challenge records carry `longDescription`, `shortDescription`,
`chronologicalOrder` and `chronologicalMapping`. The new UI is using only the
short description. Restore the long copy on the plan detail screen, and surface
**chronological vs thematic** as a label on the card — that distinction is in the
data and it is the main thing that helps someone choose.

### 7.3 Fix the wiring and the layout

- Plan detail must render **inside the `(tabs)` stack** so the tab bar survives
  (P0-3)
- Fix segment resolution (P0-4) — the counts are right in the file
- Plan detail should use the **Read L1 thread component**, filtered to the plan
  and drawn accented to your completion point, per the mockup. That reuse is a
  large part of why this direction was affordable.

---

## 8. Saved

Not started — still the old Reactions screen with the four coloured emoji tiles.
Build to the mockup: saved verses keep their bubble, their ink and their side, so
the list reads like the reading rather than a spreadsheet, with reaction filter
chips along the top.

---

## 9. You

L1 does not exist; L2's settings are showing in its place. Build L1 per the
mockup:

- Name, "Your year"
- Stories read, voices met (of 774), streak, words read
- **The year thread** — laid flat left to right across the canon, accented behind
  you, muted ahead, a dot at your position, ticks at division boundaries. The
  broken dashes at the top of the current screen are this failing to render:
  same RC1 hard-coded path.
- A single **Settings** row pushing to L2

Everything currently on that screen belongs in L2.

---

## 10. Revised remaining work

| # | Item | Days |
| --- | --- | --- |
| ~~Phase 0~~ | ~~SDK 57, Reanimated 4, managed workflow~~ | **done** |
| R1 | Generated thread paths (RC1) — Read L1, Plan L2, You L1 | 2–3 |
| R2 | Three-level hierarchy, division → book → story | 1.5–2 |
| R3 | Bead masking, continue card | 1 |
| R3b | **RC3 pill alignment** — one line in each of two files | 0.1 |
| R3c | **Reference search** — parser, alias table, `verseIndex` wiring | 1.5–2 |
| R4 | Reader typography, labels, tails, alternation, bottom inset | 1.5 |
| R5 | Gutter thread in the reader | 1 |
| R6 | Call sheet expansion + swatches moved into it, role heading removed | 1 |
| R7 | **RC2 — three stale route names in `CheckCircle`** | 0.2 |
| R8 | Cast sort, exclusions, pill shape and sizing, terminology | 1.5 |
| R9 | Spoken vs written derivation | 1–1.5 |
| R10 | Cast card: books, division buckets, large-voice layout | 2 |
| R11 | **S17 conversation navigation** | 3–4 |
| R12 | Plan grouping, descriptions, wiring fix, tabs fix, thread reuse | 2.5–3 |
| R13 | Saved L1 + L2 | 2 |
| R14 | You L1 | 1.5 |
| R15 | Onboarding (S14) | 2–3 |
| R16 | French parity across everything new | 2 |
| R17 | Migration testing, both platforms, real hardware | 3 |
| | **Total** | **24–31** |

Down from 30–39: Phase 0 is complete, `CheckCircle` was already rebuilt, and the
pill and reference-search fixes turned out far smaller than the screenshots
suggested.

### Order

1. **R3b, R7, P0-3** — three trivial fixes, under a day together, that clear
   four of the eight P0 defects.
2. **R1** — the generated path, which unblocks Read L1, Plan L2 and You L1. Almost every visual defect is downstream
   of one of them.
3. **R2–R6** — Read, which is the app.
4. **R8–R11** — Cast, which is the differentiator.
5. **R12–R14** — Plan, Saved, You.
6. **R15–R17** — onboarding, French, hardening.

---

## 11. Still unresolved

- **D2 division titles** — now more urgent, since the book level makes the
  division names more prominent
- **D3 promotion out of Supporting Cast** — the Cast list makes this vivid: "72
  Disciples" currently reads as a Main Character while Sarah does not
- **New:** where Revelation falls in the spoken/written split
