# Build queue

**The one ordered list.** Work top to bottom. Everything else in `MVP2/` is
reference; this is the path.

Current: `store-compliance-130` @ `8565195`. Updated 19 August 2026.

**Phase 0 is complete** — Expo 57.0.14, RN 0.86.2, Reanimated 4 + worklets,
managed workflow, react-navigation and camera removed, group machinery gone,
`CheckCircle` rebuilt. D5 resolved as managed.

Why each item exists: [`07-BUILD-REVIEW.md`](07-BUILD-REVIEW.md), referenced by
section below.

**How to build each item well, and the motion spec:**
[`09-IMPLEMENTATION-SPEC.md`](09-IMPLEMENTATION-SPEC.md). Build its motion token
file (`constants/Motion.ts`) *before* starting A1 — every item references it.

---

## A · Quick wins — under a day and a half, clears six of nine P0 defects

| # | Do | Where | § |
| --- | --- | --- | --- |
| A1 | Add `alignItems: 'flex-start'` to the pill scrollers | `thread/ThreadList.tsx` style `scopes`; `(tabs)/cast/index.tsx` style `filters` | RC3 |
| A2 | Repoint three stale routes | `CheckCircle.tsx:160,172` → `/(tabs)/plan`; `:183` → `/(tabs)/index` | RC2 |
| A3 | Add `keyboardDismissMode="on-drag"` + `keyboardShouldPersistTaps="handled"` | `ThreadList.tsx:139`, and the Cast search scroller | 4.6 |
| A4 | Move the plan detail route inside the tabs group | `app/plan/[id].tsx` → `app/(tabs)/plan/[id].tsx` | P0-3 |
| A5 | Fix plan→segment resolution; render all three plans | `theGospels` is 46 segments, not 10. `Bible1Year` 431, `SchoolYear1` 180, `NT100Days` 127 | P0-4, 7.1 |
| A6 | Bottom inset on the reader scroll container so ‹ › stop covering text | `(tabs)/[segment]/index.tsx` | P0-5 |

## B · The structural fix — everything visual depends on it

| # | Do | § |
| --- | --- | --- |
| B1 | **Replace the hard-coded SVG path with a generated one.** Rows report offset and depth via `onLayout`; rebuild the path from that list. Straight runs per depth, short cubic bows at each change. `ThreadList.tsx:198` | RC1 |
| B2 | Three-level hierarchy: Division → Book → Story. Division reveals books only; book reveals its stories; the indent covers the **whole** set | 4.1 |
| B3 | Beads mask the thread — `box-shadow: 0 0 0 3px var(--p-bg)` on `.mk.bead` | 4.2 |
| B4 | Continue card above the search bar. Only when something is unfinished. Card scrolls away, search stays pinned | 4.3 |

Apply B1 to `YearThread.tsx` too — the broken dashes on **You** are the same bug.

## C · Read L2 — the reader

| # | Do | § |
| --- | --- | --- |
| C1 | Typography: bubble `max-width: 84%`, body 15–16px at Medium, line-height ~1.45 | 5.1 |
| C2 | Speaker label spacing — gap above a label must exceed the gap below it | 5.2 |
| C3 | Remove bubble tails; asymmetric corner radius instead (16px / 5px nearest the gutter) | 5.3 |
| C4 | Add the gutter thread — same generated path, 30px gutter, speaker dot in ink | 5.4 |
| C5 | Confirm left/right alternation on a four-ink story — use `S008` | 5.5 |
| C6 | Story header shows the book: `Gen 15:1–18:15` | 5.8 |
| C7 | Call sheet expands to named cast with word counts | 5.9 |
| C8 | **Remove the "Select Your Reading Role:" heading.** Swatches move inside the call sheet, optional, nothing gated | 5.7 |

## D · Search

| # | Do | § |
| --- | --- | --- |
| D1 | **Reference parsing.** Normalise → `verseIndex.json` lookup → scroll to `position`. The index exists and nothing reads it | 4.4 |
| D2 | Book alias table; handle ambiguous prefixes (`Phil`, `Jud`, `Jo`) by showing both | 4.4 |
| D3 | Voice and book rows **expand in place** to their stories, like a book in the thread | 4.5 |

## E · Cast

| # | Do | § |
| --- | --- | --- |
| E1 | Sort by words descending; exclude all four narration sources; fix "1 stories" | 6.1 |
| E2 | Pills shaped as speech bubbles; order Main Characters · Supporting Cast · Divine · All | 6.2 |
| E3 | Rename: Named Principal → **Main Character**, Everyone Else → **Supporting Cast** | 6.3 |
| E4 | Spoken vs written split — epistles grey, separate counts, excluded from exchange data (S18) | 6.4 |
| E5 | Cast card: add books spoken in; replace the 365-hairline ribbon with ten division buckets | 6.5 |
| E6 | Era-organised card for voices above ~40 stories (God 186, Jesus 47) | 6.5 |
| E7 | **Conversation navigation (S17)** — tap a name in "spoke with" → every exchange between those two, ‹ › step through exchanges not stories | 6.6 |

## F · The remaining screens

| # | Do | § |
| --- | --- | --- |
| F1 | Plan: group as Full year · School year · 100 days, then Challenges; restore `longDescription`; surface chronological vs thematic; reuse the thread for plan detail | 7 |
| F2 | Saved L1 + L2 — still the old Reactions screen | 8 |
| F3 | You L1 — name, year thread, stories/voices/streak/words, single Settings row | 9 |

## G · Finish

| # | Do | § |
| --- | --- | --- |
| G1 | Onboarding — four screens, teaches the colours, "one person takes each colour" | 05 §1 |
| G2 | French parity across everything new | — |
| G3 | Migration testing against a real pre-MVP2 database; both platforms, real hardware | 06 §5 |
| G4 | Store listing and screenshots — remove QR references, camera permission is gone | 05 |

---

## Estimate

| Group | Days |
| --- | --- |
| A quick wins | 1.5 |
| B structural | 4–5 |
| C reader | 3–3.5 |
| D search | 2–2.5 |
| E cast | 7.5–9 |
| F screens | 6–7 |
| G finish | 7–8 |
| **Total** | **31.5–36.5** |

Wider than the 25–32 in `07` because that table omitted several items now
enumerated here. Treat this as the working figure.

---

## Still blocked on you

| | | Blocks |
| --- | --- | --- |
| **D2** | Division titles — mine are placeholders | B2 |
| **D3** | Promotion out of Supporting Cast — "72 Disciples" reads as a Main Character while Sarah does not | E1, E3 |
| **New** | Where Revelation falls in the spoken/written split | E4 |
| **D6** | API 36 extension to 1 November — file it regardless | — |

---

## Traceability — every point you raised has a home

| Your note | Item |
| --- | --- |
| Indent only covers 4 stories, line stops | B1 |
| Division → book → story | B2 |
| Line shows through the dots | B3 |
| Card above the search bar for unfinished story | B4 |
| Cast filter pills as speech bubbles | E2 |
| Default sort most→least words, no narrator | E1 |
| Letters shown grey, assigned to author | E4 |
| Pills go big and out of shape when tapped | A1 |
| Pill order Main / Supporting / Divine / All | E2 |
| Cast card needs books | E5 |
| God needs different organisation | E6 |
| What is the horizontal line under the name | E5 |
| "Spoke with" should navigate the exchanges | E7 |
| Plans in three categories | F1 |
| Missing plan descriptions, chronological/thematic | F1 |
| Gospels shows 10 stories | A5 |
| Navigation disappears inside a plan | A4 |
| Saved not updated | F2 |
| You shows only settings | F3 |
| Completion returns to old story finder | A2 |
| Speech bubbles and source selection look wrong | C1–C3, C8 |
| `gen 4:3` finds nothing | D1, D2 |
| Tapping David should expand to his 34 stories | D3 |
| Keyboard gets stuck | A3 |
