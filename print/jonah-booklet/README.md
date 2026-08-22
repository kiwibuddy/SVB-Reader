# Jonah, A5 print booklet

A print edition of the app's reading experience for segment **S255, "Nineveh
Spared!" (Jonah 1:1–4:11)**, the complete book of Jonah, laid out for a
148 × 210 mm (A5) saddle-stitched booklet, in four cover colours.

## Build

```bash
node print/jonah-booklet/build.mjs
```

Writes four self-contained HTML files to `dist/`. Everything is embedded
(Manrope, all styles, all content), so a file can be emailed to a print shop
on its own.

To regenerate the PDFs, start a headless Chrome with the DevTools port open and
run the renderer against it:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --remote-debugging-port=9222 about:blank &
```

```bash
node print/jonah-booklet/render.mjs
```

Pass colour names to do just some of them (`node print/jonah-booklet/render.mjs blue`).
Chrome's `--print-to-pdf` shortcut hangs on this machine's build, which is why
the renderer drives `Page.printToPDF` over the protocol instead.

From a normal browser: open the HTML and print with **paper size A5, margins
None, Background graphics ON**. The page furniture is drawn inside fixed
148 × 210 mm blocks, so screen and print are identical.

## Page plan, 20 pages

| Page | Content |
| --- | --- |
| 1 | Cover (full bleed, one of four colours) |
| 2 | The four colours, what each one reads, name / class fields |
| 3 | How to use this booklet |
| 4 | Story title, voice-share bar, cast list |
| 5–15 | The story, Jonah 1–4, complete |
| 16 | End of story, closing pull quote, translator notes |
| 17–18 | The four school questions, four writing lines each |
| 19 | Read-it-again-as-another-colour tracker |
| 20 | Back cover (full bleed) |

20 is a multiple of 4, so it folds and staples with no blank leftovers. If the
story reflows to a different length, the paginator inserts filler pages (18,
19, then extra Notes pages) until the total is a multiple of four again.

**Pages 2–19 are byte-identical across all four files.** Only page 1, page 20
and the four cover CSS variables differ, so the interior can be printed once
and wrapped in four different covers.

## Printing

### Printers **with** a Booklet preset

Print `dist/jonah-booklet-<colour>.pdf` using the printer's Booklet option (A4 →
A5 saddle stitch).

### Printers **without** a Booklet preset (recommended)

Impose the A5 PDF onto ready-to-fold A4 sheets first:

```bash
python3 -m venv print/.venv   # once
print/.venv/bin/pip install -r print/requirements.txt
print/.venv/bin/python print/impose-a5-booklet.py \
  print/jonah-booklet/dist/jonah-booklet-green.pdf
```

Writes `jonah-booklet-green-a4-print.pdf` (10 landscape A4 sides = 5 physical
sheets). Then print that file:

- **Paper:** A4
- **Two-sided:** ON, **flip on short edge**
- **Scale:** 100% / Actual size (not "Fit to page")
- **Margins:** None, or borderless if your driver offers it

Keep the sheets in order, fold the stack in half, staple the spine twice.
The two A5 pages fill the A4 sheet (covers run to the paper edge). Interior
type already sits 12–16 mm in, so a typical 5 mm printer unprintable band
only clips cover colour. If that clip looks ugly, re-run with `--margin-mm 3`.
If the backs come out upside-down, re-run with `--rotate-backs` and flip on
the long edge instead.

20 pages impose as 20|1, 2|19, 18|3, 4|17, … on five A4 sheets. Interior
margins are mirrored: 16 mm on the binding edge, 12 mm on the outside. No
bleed is set; covers run to the trim edge. The four cover colours are
`#26262A` graphite, `#B3261E` red, `#2E7D32` green, `#1565C0` blue.

## Files

| File | Role |
| --- | --- |
| `content.mjs` | Pulls S255 out of `assets/data/newBibleNLT1.json` and renders it to HTML. A port of `components/Bible/{Segment,Block,Inline,Leaf}.tsx` and `scripts/{splitIntoParagraphs,getColors}.ts` |
| `styles.mjs` | The whole stylesheet, in mm and pt |
| `pages.mjs` | The fixed pages: covers, how-to, questions, fillers |
| `build.mjs` | Fonts, assembly, and the client-side paginator |
| `render.mjs` | HTML to PDF over the DevTools protocol |
| `../impose-a5-booklet.py` | A5 sequential PDF → A4 duplex print PDF |

## Where print differs from the app on purpose

Everything else, bubble fills, text colours, tail sides, speaker labels,
paragraph splitting, verse superscripts, small-caps `Lord`, follows the app
exactly.

1. **Chapter dividers.** The app renders chapter numbers as a bare digit inline.
   Print pulls them out into a labelled rule so a group can find its place.
2. **Translator footnotes.** The app prints the raw `*` with nothing attached.
   Print letters them a–e and collects the five notes on page 15.
3. **Stanza breaks.** The app drops `break` runs; print keeps them as a small
   gap, which poetry needs on paper.
4. **Type size.** 10.8 pt on a book serif, sized for a 120 mm measure rather
   than a phone.

## Typography

Scripture is set in the Thread design's book serif stack (Iowan Old Style,
Palatino, Book Antiqua, Charter, Georgia). Unlike Manrope, that face is not
embedded in the HTML, because the Mac builds of it are not redistributable.
Chrome subsets it into the PDFs, so the PDFs are exact everywhere; open the HTML
on a non-Mac and it falls back down the stack to Georgia. Labels, headings, page
furniture and verse numbers stay in Manrope, which is embedded.
