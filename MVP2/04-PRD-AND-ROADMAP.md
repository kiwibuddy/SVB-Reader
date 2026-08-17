# MVP2 — Product requirements and build roadmap

Status: **draft for your review.** Three decisions inside are marked
**UNRESOLVED** and block estimation. Everything else is specified.

Written 17 August 2026 against `main` @ `41c432b` (= v1.2.1 build 20).

Companion documents: [`01-CRITICAL-PATH.md`](01-CRITICAL-PATH.md) for the store
blockers, [`03-DESIGN-DIRECTION.md`](03-DESIGN-DIRECTION.md) for the visual
direction, [`mockups/02-thread-built-out.html`](mockups/02-thread-built-out.html)
for the screens.

---

## 1. What MVP2 is

A redesign of SourceView Together around the one thing the product has that
nothing else does: **every word of scripture attributed to the voice that spoke
it.** 774 distinct sources, four ink colours, 365 stories.

MVP2 is *not* a rewrite. The data layer, the SQLite work, the reading engine and
the localisation all stay. What changes is the navigation model, the visual
system, and the addition of a Cast tab that makes the attribution data
explorable for the first time.

**MVP2 does not begin until v1.3.0 ships** — a store-compliant build on Expo SDK
57. See `01-CRITICAL-PATH.md`. Starting design work before that means every
failure has two possible causes.

---

## 2. Where the product stands today

Read from the codebase, not from memory.

**Screens that exist** (`app/`):

| Route | Role today | MVP2 fate |
| --- | --- | --- |
| `(tabs)/index.tsx` | Story list | → **Read L1** (rebuilt as thread) |
| `(tabs)/[segment]/index.tsx` | Reader | → **Read L2** (rebuilt as bubbles + gutter thread) |
| `(tabs)/Navigation.tsx` | Book/chapter browse | → folded into Read search + divisions |
| `(tabs)/ReadingPlans.tsx` | Plans | → **Plan L1** |
| `(tabs)/Reading-emoji.tsx` | Reactions list | → **Saved L1** |
| `(tabs)/Achievements.tsx` | Badges | → folded into **You L1** as the year |
| `(tabs)/Home.tsx` | Landing | → removed; Read becomes the landing tab |
| `About.tsx` | About | → moved under You L2 |
| `group-setup`, `host-waiting`, `join-group`, `qr-info`, `qr-share`, `role-selection` | Group reading via QR | → **UNRESOLVED, see D1** |

**Supporting code that stays:** `services/BibleLoader.ts`,
`BibleStorageManager.ts`, `QuestionsLoader.ts`, `LanguageDetectionService.ts`,
`settings-manager.ts`, the SQLite layer, `useTranslation`, `FontSizeContext`,
`AppSettingsContext`.

**New for MVP2:** a Cast tab, a divisions model, and a precomputed conversation
graph.

---

## 3. Product thesis

From `APP_DESCRIPTION.md`, the app already claims four differentiators:
script-style colour-coded reading, story-not-chapter structure, group reading,
and reaction memory. Three of those are real and shipping. The gap is that
**the attribution data is used for text colour and nothing else** — you hold a
complete conversational map of the Bible and the app never lets anyone look at
it.

MVP2 closes that gap. The measurable claim: *a user can look up any of 774
voices, see who they spoke with, and read their longest exchange.*

---

## 4. The three decisions that block estimation

### D1 — Group reading: keep, cut, or defer? **UNRESOLVED**

This is the biggest decision in the document and I will not make it for you.

- **Footprint:** 23 files reference `GroupReading` or `QRCode` — 6 dedicated
  routes, `components/QRCodeScanner.tsx`, `services/QRCodeGenerator.ts`,
  `services/QRCodeDiscoveryManager.ts`, `context/GroupReadingContext.tsx`, plus
  hooks into Home, Navigation, ReadingPlans and the reader itself.
- **The tension:** `APP_DESCRIPTION.md` positions the app squarely at
  *"churches, families, and small groups"*. Group reading is not a side feature
  — it is a third of the stated value proposition, and it is in the App Store
  listing copy and the camera permission string.
- **Earlier in this project** the working assumption was that QR group mode
  would be removed, and that the achievement badges tied to it would become
  unearnable. **That assumption deserves a second look now that the footprint is
  measured.**

| Option | Cost | Consequence |
| --- | --- | --- |
| **Keep and restyle** | +5–8 days | Group flows need the new visual system. Largest scope. |
| **Keep as-is, unstyled** | +1 day | Group screens look like the old app. Visibly inconsistent, but honest and cheap. |
| **Cut** | +3–4 days removal work | Simplifies everything downstream, but contradicts the store listing and orphans the group badges. Needs a marketing decision, not just an engineering one. |

**My recommendation: keep as-is and unstyled for MVP2**, ship the redesign
around it, and decide its future with usage data. Cutting a headline feature
during a redesign means you cannot tell which change caused a drop.

### D2 — Division titles **UNRESOLVED**

The ten traditional groupings and their story counts are computed and correct
(see `03-DESIGN-DIRECTION.md`). The plain-English titles — "The Beginning",
"The Land", "The Songs" — are my invention standing in for research you did
earlier that I could not find in the repo. **Confirm or replace.** Blocks the
Read L1 build only.

### D3 — Source colour promotion **UNRESOLVED**

Sarah, Hagar and Abimelech sit in the 681-strong blue "everyone else" group,
reading the same colour as "30 Men of Timnah". Ninety named principals is a
small cast for a book this size. This is a data edit, not a design change, but
every MVP2 screen surfaces the grouping in a way v1.2.1 did not. **Decide
whether to promote a set of figures to green, and if so, which.**

---

## 5. Scope

### In scope

| # | Item | Notes |
| --- | --- | --- |
| S1 | Design token system, light + dark | Single source in `constants/Colors.ts`; both modes are one skin swap |
| S2 | Read L1 — thread story list with 10 divisions | Replaces story list + Navigation |
| S3 | Read L2 — bubble reader with gutter thread | Replaces current reader |
| S4 | Scoped search (voices / books / stories / words) | New capability; voices are the differentiator |
| S5 | Cast L1 — voice index | New |
| S6 | Cast L2 — voice card with conversation data | New; depends on S9 |
| S7 | Plan L1 + L2 | L2 reuses the Read L1 thread component |
| S8 | Saved L1 + L2 | L2 reuses the Read L2 turn component |
| S9 | Conversation precompute script | Build-time; see §7 |
| S10 | You L1 (year) + L2 (settings) | Absorbs Achievements |
| S11 | Appearance control: Light / Dark / Auto | Light is the shipped default |
| S12 | French parity across all new screens | Non-negotiable; localisation already exists |

### Deferred to MVP3

Audio, daily devotions, monetisation (all five IAP features in
`MONETIZATION_IMPLEMENTATION_GUIDE.md`), moving bulk Bible JSON into SQLite,
character portrait artwork, cross-voice relationship browsing ("follow Peter's
thread from Jesus's card").

### Explicitly out

Account system, cloud sync, social features, web app, additional translations
beyond English and French.

---

## 6. Screen specifications

Each screen below has acceptance criteria. Visual reference:
`mockups/02-thread-built-out.html`.

### S2 · Read L1 — the thread

The story list is a single flowing line. Ten division knots, collapsed by
default; opening one bows the line outward to carry its stories and returns it.

- Ten divisions render collapsed on first load, entire canon visible without
  scrolling
- Opening a division expands its stories inline; only one open at a time
- Story beads take the ink of the dominant voice in that story
- Current story bead is enlarged and accented; read stories are muted; unread
  are hollow
- Search bar pinned above, always reachable
- Tapping a story pushes Read L2
- **No scrubber.** Removed — the ten collapsed divisions solved what it was for.

### S3 · Read L2 — the reader

- Speech bubbles alternate: **Narrator and God left; named principals and
  everyone else right**
- One continuous thread down the left gutter, unbroken across the whole story,
  with a dot in the speaker's ink where each turn joins
- Speaker name above each bubble in that voice's ink
- Word-split bar under the story title, from the segment's `colors` object
- Long-press a bubble → react & note sheet; context dims, chosen turn keeps full
  ink and gains a ring
- Reactions attach to the **verse**, not the story
- Thread is switchable off in Settings

### S4 · Search

- Four scopes: All, Voices, Books, Stories, Words
- Results grouped by kind, **voices first**
- Each voice row shows its ink colour as a dot, plus word count and story count
- A query like "jer" returns Jeremiah the person above Jeremiah the book

### S5/S6 · Cast

- L1: searchable index of all 774 voices, filterable by ink group
- L2: full-bleed colour field in the voice's ink; name set in Didot (reserved
  exclusively for voice names); ribbon showing appearances across 365 stories
- L2 shows: words, turns, stories, first/last appearance, **spoke with** (top 4,
  narration excluded), **longest exchange**, **longest single speech**
- Every number derived from real data — no placeholders

### S7 · Plan

- L1: active plan card with progress, plus challenge cards; progress bars take
  the ink of what they track
- L2: the Read L1 thread component filtered to one plan, drawn accented up to
  completion

### S8 · Saved

- L1: saved verses keep their bubble, ink and side; filter chips by reaction
- L2: the react & note sheet over dimmed story context

### S10 · You

- L1: the thread laid flat across the canon — accented behind you, muted ahead,
  a dot at your position, ticks at division boundaries. Plus streak, voices met
  (of 774), words read. Settings is one row.
- L2: Light/Dark/Auto, text size, verse numbers, thread toggle, translation,
  reminder, restore purchases, sign out

---

## 7. Data work

### S9 · Conversation precompute

The highest-value item in MVP2 and the only genuinely new data engineering.

- Input: `assets/data/newBibleNLT1.json`
- **Filter to `S*` keys only.** The 66 `I*` book introductions carry duplicate
  roll-ups; including them roughly doubles every word total. This has caught me
  twice.
- Walk `content` in order per segment, collecting `source.sourceName`
- **Exclude narration** (`The Narrator`, `The Compiler`, `The Preacher`,
  `The Choir`) before computing adjacency, or The Narrator dominates every
  result — 1,301 adjacencies for Jesus alone
- Emit per source: total words, turns, story list, first/last story, top
  dialogue partners with counts, longest alternating exchange (turn count +
  story), longest single speech (word count + story)
- Output JSON alongside the Bible data. Build-time only; no runtime cost.

Verified sample output:

| Voice | Words | Stories | Spoke with | Longest exchange |
| --- | --- | --- | --- | --- |
| Jesus | 41,239 | 47 | The Disciples ×94, Simon Peter ×68 | 10 turns with The Crowd |
| Abraham | 943 | 5 | God ×32 | **8 turns with God** — Sodom & Gomorrah |
| Ruth | 200 | 1 | Naomi ×10, Boaz ×7 | 3 turns with Naomi |

### Divisions model

Static mapping of book → division, with story ranges. Ten entries. Drives Read
L1, Plan L2 and You L1. Trivial to build once D2 is settled.

### Reaction storage

Already exists in SQLite. MVP2 changes presentation only. **Verify migration
behaviour against an existing user database before shipping** — the audit did
not cover the database layer, and users have reactions worth preserving.

---

## 8. Roadmap

Estimates assume one developer working with AI assistance, and are working days.
They are rough — treat the ordering as firm and the numbers as indicative.

### Phase 0 — Compliance (blocking everything)

**Ship v1.3.0.** See `01-CRITICAL-PATH.md` steps 0–5. **9–12 days.**
Android API 36 gate is **31 August 2026**. File for the 1 November extension
this week regardless — it costs nothing and it is the difference between a
sprint and a panic.

*Exit criteria: a build accepted by both stores on SDK 57.*

### Phase 1 — Foundation (3–4 days)

- S1 design tokens, light + dark, in `constants/Colors.ts`
- S9 conversation precompute script
- Divisions model (needs D2)
- Rewrite the Cursor rules file for RN 0.86 + Reanimated 4

*Exit criteria: tokens drive one existing screen; precompute JSON committed.*

### Phase 2 — The bet (6–8 days)

- S2 Read L1 thread
- S3 Read L2 bubble reader
- S12 French parity on both

These two screens are 60% of the perceived redesign and every later screen
reuses their components. **Ship nothing else until these feel right on a device.**

*Exit criteria: full reading flow works in both languages, both colour modes, on
real hardware.*

### Phase 3 — The differentiator (4–5 days)

- S4 scoped search
- S5 Cast L1
- S6 Cast L2

*Exit criteria: any of 774 voices is reachable in under three taps.*

### Phase 4 — Reuse (3–4 days)

- S7 Plan L1 + L2 (thread component reused)
- S8 Saved L1 + L2 (turn component reused)
- S10 You L1 + L2, absorbing Achievements
- S11 appearance control

*Exit criteria: all five tabs, both levels, no screens on the old system except
whatever D1 leaves behind.*

### Phase 5 — Hardening (3–4 days)

- Database migration testing against a real pre-MVP2 user database
- Both platforms, real hardware, both languages
- Accessibility: text sizing, contrast in both modes, screen reader on the reader
- Store assets and listing copy — **update if D1 changes group reading**

**Total after v1.3.0 ships: 19–25 working days**, plus whatever D1 adds.

---

## 9. Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| API 36 deadline missed | **High** | File the extension now |
| The redesign lands on an unstable SDK 57 base | High | Phase 0 exit criteria are strict; do not overlap |
| Database migration loses user reactions | High | Phase 5 explicitly tests it; audit never covered the DB layer |
| Group-mode decision reversed mid-build | Medium | Settle D1 before Phase 2 |
| Left/right bubble split reads as theological claim | Medium | It *is* one. Confirm intent before Phase 2. |
| Thread performance on low-end Android | Medium | SVG path per screen, not per row; profile in Phase 2 |
| 25 MB of JSON parsed at startup | Medium | Pre-existing. Deferred to MVP3, but it will feel worse alongside a faster-looking UI. |

---

## 10. Decision register

| ID | Decision | Owner | Blocks |
| --- | --- | --- | --- |
| **D1** | Group reading: keep / restyle / cut | You | Phase 2 onward, and the estimate |
| **D2** | Division titles | You | Phase 1 |
| **D3** | Promote figures from blue to green | You | Phase 1 |
| D4 | Confirm the left/right bubble split | You | Phase 2 |
| D5 | Managed vs bare native projects | You | Phase 0 step 2 |
| D6 | Request the API 36 extension | You | This week |

---

## 11. Success criteria for MVP2

1. Both stores accept the build.
2. Any of 774 voices reachable in under three taps from a cold start.
3. The whole canon visible without scrolling on the Read tab.
4. Light and dark both ship, light as default, one token set driving both.
5. Full parity in French.
6. No existing user loses a saved reaction or note in the upgrade.
