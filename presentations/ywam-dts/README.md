# The Bible is coming back — YWAM Kona DTS staff training

A standalone HTML deck for a one hour Zoom session. Open
`dist/ywam-kona-dts.html` by double-click. No build step to present, no network
beyond the Manrope webfont.

## Presenting

| Key | Does |
| --- | --- |
| `→` `space` | Next slide (or click the right of the board) |
| `←` | Back |
| `F` | Fullscreen. Share this window in Zoom |
| `N` | Speaker notes along the bottom, for your own screen |
| `R` | Replay the live reading on the Jonah slides |
| `T` | Start and stop the 15 minute breakout countdown, bottom right |
| `1`–`27` via `#n` | `…html#23` opens straight at the breakout slide |

The board is a fixed 1600 × 900 scaled to the window, so it looks the same on
any screen you share from.

## The hour

| Time | Slides | |
| --- | --- | --- |
| 00–04 | 1–2 | Open, and the shape of the hour |
| 04–16 | 3–9 | What the research shows |
| 16–25 | 10–14 | The habit we built |
| 25–33 | 15–18 | SourceView Together |
| 33–38 | 19–20 | Two plans for the DTS |
| 38–42 | 21–22 | How four people read |
| 42–57 | 23–24 | Breakouts: read Jonah |
| 57–60 | 25–27 | Feedback, download, questions |

Slide 23 is the breakout brief. Leave it up, press `T`, open rooms of four.

## The phones are not screenshots

Every phone on these slides is drawn in CSS and filled from the app's own
source, so it can move:

| From | Used for |
| --- | --- |
| `constants/Colors.ts` | every fill, edge and ink |
| `constants/Motion.ts` | the real easing `cubic-bezier(0.32,0.72,0,1)` and the app's own `DUR` and `STAGGER.turn` of 24ms |
| `assets/data/newBibleNLT1.json` | the actual text of Jonah, all 54 turns |
| `components/Bible/*` | bubble geometry, tail corners, left/right split |
| `School/Family/SmallGroupQuestions.json` | the four questions, verbatim |

The reader on slide 17 reveals Jonah turn by turn and scrolls to follow, the
way a thumb would. Slide 18 is the real call sheet for the story. Slide 22 is
the real Talk about it card with the Small Group set selected.

## Statistics

Every number lives in `stats.mjs` and nowhere else. Edit that file and run
`node build.mjs`. Figures came from Nathaniel out of
`kiwibuddy.github.io/bible-resurgence`, which states each was checked against
its linked source in July 2026 and asks that they be re-checked before
republication after October 2026. That domain is blocked from the build
environment, so nothing here was scraped: the numbers were supplied by hand.

`build.mjs` prints every field still marked `confirm` on each run, so a blank
cannot ship by accident.

## Rebuild

```bash
node presentations/ywam-dts/build.mjs
```

| File | Role |
| --- | --- |
| `data.mjs` | app palette, motion, the reader port, corpus totals, plans |
| `stats.mjs` | every research figure, with its source and open questions |
| `phone.mjs` | the live phone screens |
| `slides.mjs` | the 27 slides |
| `styles.mjs` | the stylesheet, built from the app's tokens |
| `runtime.mjs` | nav, counters, the reading animation, the countdown |
| `qr.json` | App Store, Google Play and research QR codes as inline SVG |
