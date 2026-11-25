# Advent companion booklet

A 40-page A5 stapled booklet to go alongside the **Advent Journey** plan in the
app. It has no story text: readers open each day's story in the app. Same four
covers as the full Advent book (`print/advent-book`), with the subtitle changed.

## Build

```bash
node print/advent-companion/build.mjs          # 4 A5 PDFs + cover PNGs; fails if any page overflows
python3 print/impose-a5-booklet.py print/advent-companion/dist/advent-companion-red.pdf
```

`dist/advent-companion-<colour>.pdf` is the A5 booklet in page order (for a print
shop or a printer with a Booklet setting). `dist/advent-companion-<colour>-a4-print.pdf`
is imposed onto A4 for ordinary printers: print **two-sided, flip on short edge,
actual size**, then fold the stack and staple twice. Ten A4 sheets per booklet.

Pages 2–39 are identical in all four colours, so the inside can be printed once and
wrapped in four different covers.

## Page plan

| Page | Content |
| --- | --- |
| 1 | Front cover (Graphite, Red, Green or Blue) |
| 2 | Welcome: what the Advent Journey is, what this booklet is for |
| 3 | Four colours, four voices: the colour key and a sample from Day 3 (Genesis 15) |
| 4 | Get started: four steps and the App Store / Google Play codes |
| 5 | Four weeks, four candles |
| 6 | Ways to use it: families, small groups, schools, the whole church |
| 7 | For church leaders: four ideas and a notice to copy into a newsletter |
| 8 | Reading tracker, all 26 days |
| 9–38 | A divider for each week, then one page per day: date, story and reference, day note, key verse, the four reading parts, the family questions, the O Antiphon on Days 19–25, notes lines |
| 39 | Christmas: Luke 2:10 and the 12 Days of Christmas plan |
| 40 | Back cover with the app codes and the NLT notice |

Content comes from the same sources as the full book (`print/advent-book/content.mjs`).
The 26 key verses quoted are well within Tyndale's free quotation allowance.
