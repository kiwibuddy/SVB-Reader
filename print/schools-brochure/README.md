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

Portrait, `.png` or `.jpg`, App Store 6.7" (1290 × 2796) is ideal. Anything at
that aspect ratio works; the frame crops with `object-fit: cover`, so avoid
screenshots with a status-bar carrier name you would rather not print. Light mode,
to match the document. Drop the files in and re-run `build.mjs`.

## Where the numbers come from

Every figure is counted at build time from the app's own data. Nothing is typed
in by hand, so a data change shows up in the next build.

| Claim | Source |
| --- | --- |
| 365 stories, 774 voices, 746,978 attributed words | `assets/data/newBibleNLT1.json`, `S*` keys only |
| 4 / 5 / 90 / 681 voices per colour | same, grouped by `sources[].color` |
| 2 to 14 minutes, about 10 for most | `assets/data/SegmentReadingTimes.json` |
| 15 plans and challenges, and each plan's length | `assets/data/ReadingPlansChallenges.json` |
| The three question sets and every question shown | `School/Family/SmallGroupQuestions.json` |
| Term one of the school-year plan | first 8 story ids of `Bible in 1 School Year` |
| Privacy claims on page 4 | `PRIVACY_POLICY.md` |
| iOS 16.4+, Android 8+, tablets | `app.json` |

The scripture on the cover and in the page 2 spread is rendered from
`newBibleNLT1.json` through a port of the app reader, so bubble fills, text
colours, speaker labels, verse superscripts and the left/right split follow the
app exactly. The page 2 spread jumps from Luke 5:5 to Luke 5:12 inside the same
story; that jump is labelled on the page rather than hidden.

## Confirm before printing

- **The QR code** points at `https://apps.apple.com/app/id6748708102`, taken from
  `sphere-worldview-corpus/planning/sourceview-product-matrix.md`. It has not been
  opened and checked from this session. Regenerate with the snippet in
  `qr-appstore.svg`'s history, or replace the file, if the link is wrong or if you
  would rather it resolved to a page that offers both stores.
- **The Play Store line** on page 4 says "Google Play · SourceView Together". The
  package is `com.sourceview.together` (`app.json`). Confirm the listing is live
  before handing this to a school with Android devices.
- **"about 10 minutes"** is the app's own silent-reading estimate. The brochure
  says to allow fifteen to twenty for a group reading aloud with discussion.
  Worth checking that against a real chapel run before it goes out at volume.

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
- The old PDF and `APP_DESCRIPTION.md` both say 15–20 minutes per story. The app's
  own estimates are 2 to 14, median 10.

## Files

| File | Role |
| --- | --- |
| `content.mjs` | Every fact and every line of scripture, read from the app's data |
| `styles.mjs` | The whole stylesheet, in mm and pt |
| `pages.mjs` | The four page compositions |
| `build.mjs` | Fonts, screenshots, QR, assembly |
| `render.mjs` | HTML to PDF and page PNGs over the DevTools protocol |
| `check.mjs` | Per-page overflow report |
| `qr-appstore.svg` | App Store QR, path-based so it prints crisp at any size |
