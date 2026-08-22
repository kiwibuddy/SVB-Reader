# SourceMetadata.json Audit — 2026-08-22

Reviews `assets/data/SourceMetadata.json`, added on branch `add-source-metadata`
(commit `7015041`, "Add basic source metadata (name, gender, nature,
profession, chronology) from SourceViewBible"), and compares it against the
source/voice data currently live in the app (`assets/data/newBibleNLT1.json`
via `assets/data/conversations.json`, 773 clean speaking voices — see the
[2026-08-22 source-count audit](source-count-audit-2026-08-22.md)).

**Bottom line: this is a real, useful, additive data file — new
gender/nature/profession/chronology fields the app doesn't have anywhere
today — not yet wired into any code. It reconciles cleanly against ~96% of
the app's existing 773 voices once you account for a few naming-convention
differences. There are two things worth fixing before it's used: a handful
of genuinely-missing entries, and inconsistent character encoding /
formatting between this file and the rest of the app's data.**

## What the file is

- **Source**: exported from `kiwibuddy/SourceViewBible` (a separate,
  presumably-fuller "Kraken" database this app's content was originally
  drawn from), not derived from this repo's own `newBibleNLT1.json`.
- **Structure**: `{ meta, lookups, sources }`. `sources` is a flat array of
  **1,257 "actant" records** — every person, group, or being that either
  speaks or is spoken to anywhere in the source corpus. Each record has:
  `id`, `name`, `firstInitial`, `gender` (female/male/unspecified),
  `actantNumber` (Group/Individual/Unspecified), `isSource` (bool),
  `isRecipient` (bool), `natures` (Angelic/Demonic/Divine/Human/Other, can be
  multiple), `professions` (0+ from a 40+ term list), `chronologies` (0+ date
  ranges).
- Deliberately excludes computed stats (word counts, sphere counts) that
  belong to this app's own pipeline, not upstream metadata — good scoping.
- **Not referenced anywhere in code yet**, on either `add-source-metadata` or
  `main` — this is a raw data drop, not a shipped feature.

## Reconciliation against the app's 773 speaking voices

Of the 1,257 records, **903 are flagged `isSource: true`** (832 distinct
names — 45 names are reused across multiple disambiguated records, e.g. 11
different "All Present" entries for different stories/contexts, 9 different
"An Angel" entries). The other ~354 are recipient-only (spoken to, never
speaking) and out of scope for a voice/source comparison.

Matching the app's 773 voice names against those 832 `isSource` names:

| Match type | Count |
|---|---|
| Exact match | 735 |
| Matched ignoring a leading article ("A"/"The") | 1 |
| Matched via epithet suffix (app says `"Bildad"`, metadata says `"Bildad the Shuhite"`) | 5 |
| **No match found** | **32** |
| **Total** | **773** |

A large chunk of the *apparent* mismatches before normalization (184 → 54 →
32, as I tightened the matching) turned out to be formatting, not missing
data — see "Data-quality issues" below. The **32 true unresolved names**
break down as:

- **1 expected non-match**: `"The Narrator"` — narration isn't a "person" in
  the upstream actant schema, so it has no reason to appear here.
- **~13 compound joint-speaker labels** the app synthesizes when two or more
  people speak a line together — e.g. `"Simeon & Levi"`, `"Aaron & Miriam"`,
  `"Saul & Saul's Men"`, `"The Leaders of Israel & The People of Israel"`,
  `"The People of Tyre & Sidon"`. The metadata models each person as a
  separate individual actant, not as one joint entity, so these don't have a
  1:1 counterpart — a structural difference between the two data models, not
  a bug in either.
- **~18 genuine gaps** — named individuals or groups that speak in the app's
  365 stories but have no corresponding record in `SourceMetadata.json` at
  all, under any spelling: `"The Heralds"`, `"The Egyptians"`,
  `"Balak's Officials"`, `"King Balak's Messengers"`, `"The Gileadite
  Leaders"`, `"The Mother of Micah of Ephraim"`, `"Saul's Servants"`,
  `"Jehoiakim of Judah"`, `"The People of Nineveh"`, `"The Women at the
  Empty Tomb"`, `"Simeon of Jerusalem"` (the man who blessed the infant
  Jesus in Luke 2 — distinct from the patriarch Simeon, who *is* covered),
  `"The Apostles"`, `"The Philippian Officials' Messengers"`, `"The Jewish
  Leaders in Rome"`, `"Voices in Heaven"`, `"An Angel with Fire Power"`,
  `"The Angel over the Waters"`, `"Jacob-Israel's Sons"`.

In the other direction, **~119 of the metadata's 832 `isSource` names have no
match anywhere in the app's current speaking-voice set** — e.g. `"Abiram"`,
`"Dathan"`, `"Baanah"`, `"Bethuel"`, `"Joel"`, `"Nahum"`, `"Malachi"`,
`"Jude"`, `"Mark"`, `"Luke"`, `"James the Disciple"`. This is expected, not a
bug: `SourceViewBible`/Kraken is evidently the fuller upstream corpus, and
this app's 365-story NLT retelling is a curated subset — plenty of named
figures in the wider Bible simply don't get quoted dialogue in this app's
specific text.

## Data-quality issues to fix before wiring this in

1. **Curly vs. straight apostrophes.** The metadata uses typographic quotes
   (`’`) throughout (e.g. `"Balak’s Officials"`); the app's own data
   (`newBibleNLT1.json`, `conversations.json`) uses straight quotes (`'`)
   exclusively. Naive exact-string matching between the two files will silently
   miss ~130 names that are otherwise identical. Any join code needs to
   normalize both sides first.
2. **A likely misspelling**: metadata has `"Guerilla Leaders"` (one `r`) in
   three separate records (Jeremiah/Johanan-son-of-Kareah story); the app's
   text uses the correctly-spelled `"Guerrilla Leaders"` (two `r`s). These
   look like the same entity — worth confirming with whoever maintains the
   Kraken source and fixing there rather than special-casing it here.
3. **Leading-article inconsistency**: the app has `"A Bystander at the
   Cross"`; the metadata has the same entity as `"Bystander at the Cross"`
   (no leading "A"). Minor, but another thing exact matching will trip on.
4. **144 recipient-only records have zero `natures` classification** (vs.
   1,113/1,257 that have at least one). All 144 are `isSource: false`, so
   this doesn't affect anything speaker-related, but flagging it as an
   incompleteness in the source file.
5. **Genuine coverage gap**: the ~18 named app voices listed above aren't in
   the metadata under any spelling. If/when this file starts backing
   Cast-screen fields like gender or era, those ~18 voices need either new
   metadata records or a defined fallback (don't let a missing-metadata
   voice silently disappear from a filtered Cast list).

## What's new and useful here

This file adds four dimensions the app has never had anywhere: **gender**
(434 male / 88 female / 735 unspecified — mostly groups and divine beings),
**nature** (Angelic/Demonic/Divine/Human/Other), **profession** (445 records
have at least one, from a 40+ term list — farmer, judge, high priest,
fisherman, etc.), and **chronology** (1,211 records have at least one
date-range tag). None of this exists in `newBibleNLT1.json` or
`conversations.json` today. If the Cast tab is meant to grow beyond "who
spoke and to whom" into "who *is* this person" — filtering by era, gender,
or profession — this is the data that would power it, once the gaps above
are closed.

## Recommendations

1. Normalize apostrophes (and ideally article-prefix/spelling variants) on
   both sides before ever joining this file against `newBibleNLT1.json` or
   `conversations.json` by name — don't rely on exact string equality.
2. Add or correct metadata records for the ~18 genuinely-missing voices
   before surfacing any metadata-backed field in the UI, so no current voice
   silently loses its Cast entry or shows blank gender/nature/profession.
3. Decide how to handle the app's compound joint-speaker labels (`"X & Y"`)
   — either keep them metadata-less by design, or split UI lookups to
   resolve each half of the label against its own individual actant record.
4. Fix (or flag upstream in `SourceViewBible`) the `"Guerilla Leaders"`
   spelling and the "Bystander at the Cross" article inconsistency.
5. This file is not yet imported anywhere — when it is, treat the join as
   the first real integration test of everything above.
