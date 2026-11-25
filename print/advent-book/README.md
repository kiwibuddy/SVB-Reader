# From promise to manger: the Advent book

A print edition of the app's **Advent Journey** plan: all 26 stories, complete,
in the Jonah booklet's style (`print/jonah-booklet`). It is A5 (148 × 210 mm) and
perfect-bound. There are four cover colours, one per reading part; the interior
is the same in every copy.

## Build

```bash
node print/advent-book/render.mjs                 # interior + 4 cover wraps
node print/advent-book/render.mjs --spine-per-page 0.056   # printer's paper figure
node print/advent-book/proof.mjs day-19:0,-1 465  # proof sheets of chosen pages
```

Uses Playwright's Chromium. Output in `dist/`:

| File | What it is |
| --- | --- |
| `advent-book-interior.pdf` | 468 A5 pages, no bleed (nothing in the interior runs to the edge) |
| `advent-book-cover-<colour>.pdf` | Back + spine + front on one sheet, 3 mm bleed all round |
| `advent-book-front-<colour>.png`, `advent-book-cover-<colour>.png` | Previews |

## For the printer

- **Trim:** A5, 148 × 210 mm. **Binding:** perfect bound (too thick to staple).
- **Interior:** 468 pages, full colour (the voice colours are the point).
- **Spine:** 23.4 mm at 0.05 mm a page (80 gsm uncoated). Ask the printer for the
  calliper of their paper and re-run with `--spine-per-page`; the cover wrap
  resizes itself.
- **Covers:** four versions, Graphite, Red, Green and Blue. Order them in fours
  so each reading group gets one of each.
- Colour is RGB from Chromium; most digital printers convert to CMYK themselves.
  Check a proof copy for the cover colours before a full run.

## Permission for the Scripture text

The book reprints about 52,000 words of the NLT, far beyond Tyndale's
quotation allowance (500 verses, and not a complete book of the Bible). **Printing
it for distribution needs written permission from Tyndale House Publishers**,
unless SourceView's existing NLT licence already covers print. The copyright
page carries the app's NLT notice.

## Page plan

| Pages | Content |
| --- | --- |
| 1–2 | Title page, copyright |
| 3–5 | Read it out loud (colour key, belongs-to), How to use this book, The shape of the journey |
| 6–7 | Contents and reading tracker (page numbers filled in after layout) |
| then per week | A week divider (candles lit to that week, its days) |
| then per day | An opening page (day, date, week, note, key verse, the four reading parts, the cast), the story, the family questions, the O Antiphon on Days 19–25, notes on the text |
| last | Christmas page with the app codes, then Notes pages to a multiple of four |

## Content sources

- Stories, voices, reading parts: `assets/data/newBibleNLT1.json`, rendered by the
  same port of the app reader as the Jonah booklet.
- Plan order, weeks, dates: `assets/data/ChronologicalMappings.json`
  (`adventJourneyChronological`), 2026 dates.
- Day notes: the 2026 wording from `MVP3/05-ADVENT-COMPANION-BUILD-PLAN.md` (A3).
- Key verses: `docs/advent/ADVENT-2026-REVIEW-PACK.md`.
- Antiphons: the owner-approved translation (MVP3/05, B3).
- Questions: the app's family questions, **set 2**. (Set 1 was mismatched for
  many stories when the book was made; fixed on 25 Nov 2026, see
  `docs/questions-fix-2026-11.md`.)

## Typography

Manrope for headings and furniture (from `assets/fonts`), Charis SIL for
Scripture (`fonts/`, SIL Open Font License). Charis is the open release of
Charter, which is in the Jonah booklet's serif stack, so the two books match on
any machine.
