# SourceView Together, four-page A4 schools brochure

A print piece for principals, chaplains and heads of RE. Replaces the earlier
five-page `SourceView_Together_Bible.pdf`, which was written against an older
build and carries several counts that no longer match the app.

Design language is **Thread**, the app's own (`constants/Colors.ts`,
`MVP2/03-DESIGN-DIRECTION.md`), by way of `print/jonah-booklet`. Manrope for
everything except scripture, which is set in the book serif stack.

## Build

```bash
node print/schools-brochure/build.mjs      # → dist/sourceview-together-schools.html
```

One self-contained HTML file: Manrope, all styles, the QR and any screenshots are
embedded, so it can be emailed to a print shop on its own.

To make the PDF, start a headless Chrome with the DevTools port open and run the
renderer against it:

```bash
chrome --headless --no-sandbox --remote-debugging-port=9222 about:blank &
node print/schools-brochure/render.mjs --png   # → dist/*.pdf and page-N.png
node print/schools-brochure/check.mjs          # per-page overflow report, in mm
```

`check.mjs` is the one to run after any copy edit. The pages are fixed
compositions with no paginator, so a sentence that grows by a line pushes content
into the bottom margin silently. It should report `ok` on all four.

From a normal browser: open the HTML and print at **A4, margins None, background
graphics ON**. Page furniture is drawn inside fixed 210 × 297 mm blocks, so screen
and print are identical.

## Printing

Four pages. Two duplex A4 sheets, or one A3 folded. No bleed is set and covers
run to the trim edge; interior type sits 14–16 mm in, so a typical 5 mm
unprintable band only clips cover colour.

## Screenshots

Four device frames on page 2 read from `screenshots/`. Anything missing renders
as a labelled slot at the exact final size, so the layout is finished either way
and the files can arrive later.

| File | Screen | What it should show |
| --- | --- | --- |
| `screenshots/read.png` | Read | The year as one thread, divisions collapsed |
| `screenshots/reader.png` | Reader | A story mid-scroll, several source colours visible |
| `screenshots/plan.png` | Plan | The plan list, or a plan open with its ring |
| `screenshots/talk-about-it.png` | Talk about it | The four questions at the end of a story |

Portrait, `.png` or `.jpg`, App Store 6.7" (1290 x 2796) is ideal. Anything at
that aspect ratio works; the frame crops with `object-fit: cover`, so avoid
screenshots with a status-bar carrier name you would rather not print. Light mode,
to match the document. Drop the files in and re-run `build.mjs`.

The frames sit at 34 mm tall, which is as large as four across can be on a page
already carrying the timeline, the colour key, the pull-out and the spread. If a
printed proof shows them too small to read, the thing to cut is the pull-out,
which frees about 39 mm.

## Where the numbers come from

Every figure is counted at build time from the app's own data. Nothing is typed
in by hand, so a data change shows up in the next build.

| Claim | Source |
| --- | --- |
| 66 books, complete | `SegmentReadingTimes.json`, verified contiguous (see below) |
| 365 stories, 774 voices | `assets/data/newBibleNLT1.json`, `S*` keys only |
| 4 / 5 / 90 / 681 voices per colour | same, grouped by `sources[].color` |
| Leviticus 88 per cent red, Esther no red at all | same, aggregated by book |
| 2 to 14 minutes, about 10 for most | `assets/data/SegmentReadingTimes.json` |
| 15 plans and challenges, and each plan's length | `assets/data/ReadingPlansChallenges.json` |
| The three question sets and every question shown | `School/Family/SmallGroupQuestions.json` |
| Term one of the school-year plan | first 8 story ids of `Bible in 1 School Year` |
| Privacy claims on page 4 | `PRIVACY_POLICY.md` |
| iOS 16.4+, Android 8+, tablets | `app.json` |

### "The whole Bible", checked

The cover claims the app holds the whole Bible, so that was verified rather than
assumed. All 66 books are present and each runs from 1:1 to its final verse
(Genesis 1:1 to 50:26, Revelation 1:1 to 22:21). Segment references are
contiguous end to end: the five apparent gaps are all closed by single-chapter
segments (Genesis 41, 1 Kings 7, Jeremiah 49) and by verse-level splits written
with letter suffixes (`2Sa 19:8b-21:14`, `Neh 7:73b-10:39`, `1Sa 4:1b-8:22`),
which a naive `chapter:verse` parse skips over.

This contradicts the App Store FAQ in `APP_DESCRIPTION.md`, which says the 365
stories cover "major events, teachings, and themes in complete story arcs". That
reads as an abridgement. The data says otherwise, and the store copy is
underselling the product.

### The two passages on the page

Both are rendered from `newBibleNLT1.json` through a port of the app reader, so
bubble fills, text colours, speaker labels, verse superscripts and the left/right
split follow the app exactly. They are set in `content.mjs`:

- **`COVER`** = S287 turns 2-6, Luke 5:4-5. The calling of Simon Peter, the same
  exchange the old flyer showed.
- **`SPREAD`** = S294 turns 48-54, Luke 18:26-28. The tightest four-colour window
  in the whole corpus: crowd, narrator, Jesus and a named principal in six short
  turns, nothing spliced and no jump to explain.

Both `from`/`to` pairs index the **split** array that `splitIntoParagraphs`
returns, not `segment.content`. Those two arrays have different lengths, so a
window found by reading the raw JSON will land in the wrong place. Print the
range with `spreadTurns({id, from:0, to:200})` before changing either.

### The format timeline

Page 2 dates chapters to Stephen Langton around 1227, verse numbers to Robert
Estienne in 1551, and red letters to Louis Klopsch in 1899. These are standard
attributions but they are the only figures in the document not drawn from the
repo, so they carry the ordinary risk of any historical claim.

Note that red letters make the stronger cover claim ("only format change since
chapter and verse") untrue, which is why the page uses the red-letter lineage as
the on-ramp instead. Reader's editions such as Immerse, which strip chapter and
verse out, are also format changes.

## Confirm before printing

- **The QR code** points at `https://apps.apple.com/app/id6748708102`, taken from
  `sphere-worldview-corpus/planning/sourceview-product-matrix.md`. It has not been
  opened and checked. Replace `qr-appstore.svg` if the link is wrong, or if you
  would rather it resolved to a page offering both stores.
- **The Play Store line** on page 4 says "Google Play - SourceView Together". The
  package is `com.sourceview.together` (`app.json`). Confirm the listing is live
  before handing this to a school with Android devices.
- **"Fifteen to twenty minutes"** on page 2 is a read-aloud-plus-discussion
  estimate. The app's own silent-reading figures are 2 to 14 minutes, median 10.
  Worth checking against a real chapel run before this goes out at volume.
- **The three question sets vary in how far apart they are.** Page 3 uses story
  one, where they are genuinely three registers. On Luke 5 and Luke 23-24 the
  school and family sets are 94 per cent identical text. The claim on the page is
  true; it is not uniformly true.

## Known drift in the older source documents

Kept here so nobody copies these forward:

- `docs/product/School_Presentation.md` counts several plans wrongly. Real
  lengths: The Gospels 46 stories (not 42), Paul's Letters 40 (not 35), David's
  Life 50 (not 35), Women of the Bible 22 (not 20), Advent 20 (not 16), Lent 25
  (not 21), In The Beginning 19 (not 18). It also says 11 reading plans; there
  are 15.
- The same file claims the app works on computers. It is iOS and Android.
- `docs/product/SourceView_Together_User_Stories.md` describes QR code group
  sessions. That feature is not in 1.3.0, and `docs/store/STORE_LISTING_1.3.0.md`
  says not to mention it. Nothing about sessions appears in this brochure.
- The old PDF and `APP_DESCRIPTION.md` both say 15-20 minutes per story. The app's
  own estimates are 2 to 14, median 10.
- `APP_DESCRIPTION.md` describes the 365 stories as covering "major events,
  teachings, and themes", which reads as a selection. They are the complete text
  of all 66 books. See "The whole Bible, checked" above.
- Three stories (`S176`, `S284`, `S301`) carry a source literally named
  `undefined`, holding 61 words between them. It will surface in Cast. Not used
  anywhere in this document.

## Files

| File | Role |
| --- | --- |
| `content.mjs` | Every fact and every line of scripture, read from the app's data |
| `styles.mjs` | The whole stylesheet, in mm and pt |
| `pages.mjs` | The four page compositions |
| `build.mjs` | Fonts, screenshots, QR, assembly |
| `render.mjs` | HTML to PDF and page PNGs over the DevTools protocol |
| `check.mjs` | Per-page overflow report |
| `screenshots/` | Drop App Store screenshots here; see its own README |
| `qr-appstore.svg` | App Store QR, path-based so it prints crisp at any size |
