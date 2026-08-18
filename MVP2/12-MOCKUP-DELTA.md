# What the mockup no longer shows

`mockups/02-thread-built-out.html` is dated **10 August** and is still the
reference for layout, colour, type and tone. But decisions on **17 and 19
August** changed six things it draws, and added several it never drew.

**Read this before building from the mockup.** Where the two disagree, the
documents win.

---

## 1. Superseded — the mockup is now wrong

| # | Mockup shows | Now | Where |
| --- | --- | --- | --- |
| M1 | **Two levels** — division opens straight to stories | **Three levels** — division → book → story. The mockup has no book row at all | 08 B2 |
| M2 | A **hard-coded** SVG path (`d="M30 0 L30 24 …"`) | **Generated** from row offsets. That literal string is the bug — never copy it again | 09 §2 |
| M3 | Beads sitting **on** the line | Beads **mask** the line with a background-coloured ring | 08 B3 |
| M4 | Cast filters = search scopes (All / Voices / Books / Stories / Words) | **Ink filters** — Main Characters · Supporting Cast · Divine · All, shaped as speech bubbles | 08 E2 |
| M5 | "Named principal", "Everyone else" | **"Main Character", "Supporting Cast"** | 08 E3 |
| M6 | The `.rib` **appearance ribbon** — 365 hairlines under the name | **Ten division buckets** — the ribbon was illegible, which is why you asked what the line was | 08 E5 |
| M7 | **One** plan card | **Three** plans, grouped Full year · School year · 100 days, then Challenges | 08 F1 |

M2 is the one that matters most. The mockup's path was authored for exactly ten
rows in a browser; it went into the app verbatim and produced the truncated line.
Treat every hard-coded coordinate in that file as illustration only.

---

## 2. Not in the mockup at all — additions since

| # | Addition | Where |
| --- | --- | --- |
| N1 | **Continue card** above the search bar, with a "Today" state | 08 B4, H2 |
| N2 | **Call sheet** expanding to the named cast — the mockup only draws the mix bar | 08 C7 |
| N3 | **Reading-role swatches**, demoted into the call sheet, optional | 08 C8 |
| N4 | **Read-aloud mode** | PRD S16 |
| N5 | **Reference search** — `gen 4:3` → exact verse | 08 D1 |
| N6 | **Expandable search rows** — a voice expands to its stories in place | 08 D3 |
| N7 | **Conversation navigation** — "spoke with" opens every exchange between two voices | 08 E7 |
| N8 | **Spoken vs written** — epistles grey, counted separately | 08 E4 |
| N9 | **Era-organised cast card** for God and Jesus | 08 E6 |
| N10 | **Books spoken in**, on the cast card | 08 E5 |
| N11 | **Share and copy a verse** — bubble as an image | 10 §3.2 |
| N12 | **Reading times** on story rows | 10 §3.3 |
| N13 | **End-of-story questions** | 10 §3.4 |
| N14 | **Empty states** | 10 §3.5 |
| N15 | **Four onboarding screens** | 11 |
| N16 | **The whole motion system** — the mockup is static | 09 §1 |

---

## 3. Still accurate — build from the mockup for these

- **The palette**, both modes, and the fact that they are one token set with a
  class swapped. This is the most reusable thing in the file.
- **Type scale and hierarchy** throughout.
- **The reader's bubble layout** — Narrator and God left, everyone else right,
  asymmetric corner radius, no tails, speaker label above, the mix bar under the
  title. C1–C3 are corrections *toward* the mockup, not away from it.
- **Saved**, both levels — unchanged by anything since.
- **You L1** — name, stats, flat year thread with division ticks, single settings
  row. Only the path generation changes.
- **The cast card's field treatment** — full-bleed ink, Didot name, the reserved
  use of that face for voice names only.
- **Tab structure** — Read · Cast · Plan · Saved · You.

---

## 4. Should the mockup be redrawn?

**No.** Three reasons:

1. Its job was to settle direction, and it did. Direction is settled.
2. The app now exists on device — screenshots of the real thing are a better
   reference than a drawing of it, and they cannot drift.
3. Redrawing costs a day and would be stale again within a week, since the
   remaining decisions (D2, D3, Revelation) will change details.

**What to do instead:** when a screen in group B–F is finished and approved, take
a device screenshot into `MVP2/screens/`. That folder becomes the living
reference and the mockup becomes what it should be — the record of the pitch that
set the direction.

The one exception: if D2 lands and the division titles change, update the ten
names in the mockup's divisions table so it does not teach the wrong vocabulary.
