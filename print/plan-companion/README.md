# Seasonal plan companion booklets

Stapled A5 companions for the seasonal plans after Advent, in the Advent
companion's design (`print/advent-companion`). No story text: readers open each
day's story in the app. Each plan is one config file in `configs/`.

```bash
node print/plan-companion/build.mjs christmas12 christmas7
```

Writes, per plan and per cover colour (Graphite, Red, Green, Blue):

- `dist/<plan>-companion-<colour>.pdf`: the A5 booklet in page order;
- `dist/<plan>-companion-<colour>-a4-print.pdf`: imposed on A4 for an ordinary
  printer (two-sided, flip on short edge, actual size; fold and staple twice);
- `dist/<plan>-companion-front-<colour>.png`: a cover preview.

The build fails if any page's content overflows or the page count is not a
multiple of four. Only the front and back covers differ between colours.

## Booklets

| Plan | Pages | Dates | Cover art |
| --- | --- | --- | --- |
| 12 Days of Christmas (`christmas12`) | 28 | 25 Dec 2026 – 5 Jan 2027 | Advent candles and the Christ candle, all lit |
| 7 Days of Christmas (`christmas7`) | 20 | 19 – 25 Dec 2026 | Advent candles lit, the Christ candle waiting |

Page plan: cover, welcome, how it works (a sample in voice colours), get started
(app codes), the shape of the plan, [12 Days: the feasts of the twelve days],
ways to use it, for church leaders (with a notice to copy), reading tracker, a
divider per part of the plan, one page per day (note, key verse, reading parts,
family questions, notes lines), a closing page, notes pages to a multiple of four,
back cover.

## Adding a plan

Copy a config, set `mapping` (the plan's key in `ChronologicalMappings.json`),
`start` (year, month from 0, day), a key verse per day, and the page text. Day
notes and phases come from the app's data; family questions are set 2.
