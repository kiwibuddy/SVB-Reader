# Source / Voice Count Audit — 2026-08-22

Requested because sources/voices are far more prominent in the current UI
(Cast tab, "voices met" celebrations, per-verse ink coloring) than before, and
there was concern that a mistake introduced somewhere across the version
history — specifically between Rob Wiebe's original branch and the current
"mvp2" state — could have corrupted the source/voice counts or attributions.

**Bottom line: the underlying scripture attribution data has never been
touched and is identical across every version.** The one real issue found is
a small, pre-existing data artifact (present since the very first commit,
long before Rob's branch or mvp2) that makes the well-known "774" figure one
higher than the actual number of legitimate named voices — a *data* bug, not
a version-regression bug. Details below.

## What "Rob Wiebe's branch" and "mvp2" actually are

- **Rob Wiebe's original branch** = `origin/Rob's-Branch`, branched from
  `ac2f609`. All 7 of its commits unique to it are unrelated to source/voice
  data (sqlite progress tracking, a `checkCircle` UI fix, a "story/stories"
  naming tweak, `.gitignore`/`package-lock` housekeeping) — confirmed by
  diffing them: no `.ts`/`.tsx`/`.json` file with "source" or "voice" in the
  name is touched. It was never merged forward and `main` moved 176 commits
  past it.
- **"mvp2" is not a branch** — it's a run of git tags on `main`
  (`mvp2-00` → `mvp2-H1`, dated 2026-08-19) marking save points of the
  "Thread" UI rebuild that made sources/voices so visible (Cast tab, ink
  colors as the spine of the reader). `main` has since moved 23 commits past
  `mvp2-H1` into TestFlight prep. **mvp2 ≈ current `main`.**

## Data integrity check

The single source of truth for every verse's speaker attribution is
`assets/data/newBibleNLT1.json`. Git history shows **exactly one commit ever
touched this file** ("Initial App") — it has not been edited since, on any
branch.

To be certain nothing computed on top of it drifted, I independently
recomputed the unique source/voice count (union of `Object.keys(sources)`
across the 365 `S*` story segments, excluding the 66 `I*` book-intro segments
which duplicate each book's roll-up) at five points in history:

| Ref | Unique sources | Per-color sum | Cross-color names |
|---|---|---|---|
| `Rob's-Branch` | 774 | 781 | 7 |
| `mvp2-00` | 774 | 781 | 7 |
| `mvp2-G2` | 774 | 781 | 7 |
| `mvp2-H1` | 774 | 781 | 7 |
| `main` (current HEAD) | 774 | 781 | 7 |

Identical at every version, and identical to the figures already documented
in `MVP2/03-DESIGN-DIRECTION.md` (4 narration + 5 divine + 90 named principals
+ 681 everyone else = 774 union; 781 per-color because 7 names — Moses,
Joshua, Solomon, Isaiah, Hezekiah of Judah, Ahaz of Judah, Jeremiah — are
filed under two ink colors in different passages). **No drift, no
regression.**

I also regenerated `assets/data/conversations.json` (the derived, committed
file that powers the Cast tab) via `scripts/precompute-conversations.js` and
diffed it against the version in the repo: byte-identical except for the
`generatedAt` timestamp. **It is not stale.**

## The one real finding: a phantom `"undefined"` voice inflates 774 to a false total

While recomputing the count, my naive union (`Object.keys(seg.sources)`,
matching how `utils/voicesMet.ts` counts) landed on **774** — but
`conversations.json`, which the Cast tab actually reads, has only **773**
voices. The one name present in the raw data but absent from
`conversations.json` is the literal string `"undefined"`.

Three segments carry a bogus `"undefined"` key in their `sources` dictionary,
each with an empty `color` and a small word count:

| Segment | Story | Bogus entry |
|---|---|---|
| S176 | Book 5: The Word of God | `{"color":"","words":22}` |
| S284 | Tried, Crucified & Risen | `{"color":"","words":28}` |
| S301 | Who is this Doer of Signs? | `{"color":"","words":11}` |

Tracing it to source: in all three stories, this comes from blocks whose
`source` is a structural label — `"Psalm Title"` (the Psalm 119 Hebrew-letter
headings, e.g. "Aleph", "Beth", "Gimel"...) or `"Editorial Insert"` (the
manuscript notes on Mark 16:9-20 and John 7:53-8:11) — not an object with a
`sourceName`. Whatever script originally built the precomputed `sources`
roll-up for `newBibleNLT1.json` read `block.source.sourceName` off those
string-typed blocks, got JS `undefined`, and used it as a dictionary key
literally spelled `"undefined"`. **This has been in the data since the very
first commit — it predates both Rob's branch and mvp2, so it is not a
version-update regression.**

The person who wrote `scripts/precompute-conversations.js` during the mvp2
build evidently found this too — it has an explicit guard,
`if (!name || name === 'undefined') continue;` — so the Cast tab and
`conversations.json` are clean. But that fix was never propagated to:

- `utils/voicesMet.ts`: `export const TOTAL_VOICES = 774;` — the hardcoded
  denominator used in "voices met" celebrations (e.g. "215 of 774 voices").
  Its numerator, `getVoicesMetCount()`, reads the raw `sources` dict
  directly and does *not* filter `"undefined"` — so a user who completes
  S176, S284, or S301 can have their met-count include the phantom entry.
- All the marketing/product copy repeating "774": `app.json`,
  `APP_DESCRIPTION.md`, `app/+html.tsx`, `docs/store/STORE_LISTING_1.3.0.md`,
  `assets/data/UI-ENG.json`, `assets/data/thread-ui.json`, and the `MVP2/`
  docs.

**Net effect:** it's internally self-consistent enough that nothing crashes
or displays "undefined" to a user (the Cast list itself is clean, since it's
built from `conversations.json`), but the number "774" quoted everywhere as
"how many voices are in the Bible" is one higher than the actual count of
named voices a user can find in the Cast tab (773). If someone ever reaches
"774 of 774" in the met-count celebration, they'll have hit a number the
Cast tab can't actually match.

## Minor finding: 2 voice names missing French translation

`utils/localize.ts` falls back to the English name when a French translation
is missing, so this is not a crash or data-loss risk — just a completeness
gap. Of 773 real voice names, 2 have no entry in `FRA-UI.json`'s `Sources`
table: **"Saul's Servants"** and **"The Philippian Officials' Messengers"**.

## Recommendations

1. Fix `scripts/precompute-conversations.js`'s root cause, not just its
   symptom: the underlying `sources` roll-up in `newBibleNLT1.json` still
   carries the bogus `"undefined"` key for S176/S284/S301. Either strip it
   from the data file directly, or apply the same
   `name !== 'undefined'` guard everywhere `Object.keys(seg.sources)` is
   read raw (`utils/voicesMet.ts` at minimum).
2. Decide the official number: is it 774 or 773? Given the Cast tab and its
   underlying data (`conversations.json`) only ever show 773 legitimate
   named voices, 773 is arguably the more defensible number to promote in
   `TOTAL_VOICES` and in marketing copy — or fix the data so 774 is
   genuinely correct and consistent everywhere.
3. Add the two missing French translations to `FRA-UI.json`'s `Sources`
   table.
4. Consider committing a small `scripts/audit-sources.js` (not included in
   this pass, per scope) that recomputes the clean count from
   `newBibleNLT1.json` and fails if it disagrees with `TOTAL_VOICES`, so this
   kind of drift is caught automatically after future data or code changes.

## Methodology notes

- All comparisons were done by reading file contents directly at each git
  ref (`git show <ref>:<path>`) rather than checking out branches, so no
  working-tree state was disturbed.
- Rob's-Branch's 7 unique commits were reviewed individually; none touch any
  file with "source" or "voice" in its path.
- No `scripts/audit-scripture.js` (a verse-completeness check referenced in
  one commit message) exists in the current tree — noted for completeness,
  but out of scope for a source-count audit.
