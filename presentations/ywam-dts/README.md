# The Bible is coming back · YWAM Kona DTS staff training

A standalone HTML deck for a one hour Zoom session. Open
`dist/ywam-kona-dts.html` by double-click. No build step to present, and no
network at all: Manrope is embedded in the file, so it looks the same on a dead
wifi as it does on a good one.

## Presenting

| Key | Does |
| --- | --- |
| `→` `space` | Next slide (or click the right of the board) |
| `←` | Back |
| `F` | Fullscreen. Share this window in Zoom |
| `N` | Speaker notes along the bottom, for your own screen |
| `R` | Replay the live reading on the Jonah slides |
| `T` | Start and stop the 15 minute breakout countdown, bottom right |
| `1`–`28` via `#n` | `…html#24` opens straight at the breakout slide |

The board is a fixed 1600 × 900 scaled to the window, so it looks the same on
any screen you share from.

## The hour

| Time | Slides | |
| --- | --- | --- |
| 00–04 | 1–2 | Open, and the shape of the hour |
| 04–16 | 3–9 | What the research shows |
| 16–25 | 10–15 | The habit we built, and Josiah and Nehemiah |
| 25–33 | 16–19 | SourceView Together |
| 33–38 | 20–21 | Two plans for the DTS |
| 38–42 | 22–23 | How four people read |
| 42–57 | 24–25 | Breakouts: read Jonah |
| 57–60 | 26–28 | Feedback, download, questions |

Slide 24 is the breakout brief. Leave it up, press `T`, open rooms of four.

Slide 13 is the Josiah and Nehemiah precedent, laid out as one grid with four
beats down the side. It carries no argument of its own on purpose: it is there
to talk over, with the two story numbers along the foot so the stories can be
opened in the app if anyone asks.

## The phones are not screenshots

Every phone on these slides is drawn in CSS and filled from the app's own
source, so it can move:

| From | Used for |
| --- | --- |
| `constants/Colors.ts` | every fill, edge and ink |
| `constants/Motion.ts` | the real easing `cubic-bezier(0.32,0.72,0,1)` and the app's own `DUR` and `STAGGER.turn` of 24ms |
| `assets/data/newBibleNLT1.json` | the actual text of Jonah, all 54 turns |
| `components/Bible/*` | bubble geometry, tail corners, left/right split |
| `components/navigation/BottomNavigation.tsx` | the five tabs and their Ionicons, filled on the active tab |
| `School/Family/SmallGroupQuestions.json` | the four questions, verbatim |

The reader on slide 18 reveals Jonah turn by turn and scrolls to follow, the
way a thumb would. Slide 19 is the real call sheet for the story. Slide 21 is
the plan screen with the two DTS journeys. Slide 23 is the real Talk about it
card with the Small Group set selected.

## Statistics

Every number lives in `stats.mjs` and nowhere else. Edit that file and run
`node build.mjs`. Figures came from Nathaniel out of
`kiwibuddy.github.io/bible-resurgence`, which states each was checked against
its linked source in July 2026 and asks that they be re-checked before
republication after October 2026. That domain is blocked from the build
environment, so nothing here was scraped: the numbers were supplied by hand.

`build.mjs` prints every field still marked `confirm` on each run, so a blank
cannot ship by accident.

Percentage bars are drawn against a full 100 rather than against the tallest
bar in the set, so a 43 never reads as a 75.

## Rebuild

```bash
node presentations/ywam-dts/build.mjs
```

| File | Role |
| --- | --- |
| `data.mjs` | app palette, motion, the reader port, corpus totals, plans |
| `stats.mjs` | every research figure, with its source and open questions |
| `phone.mjs` | the live phone screens |
| `slides.mjs` | the 28 slides |
| `styles.mjs` | the stylesheet, built from the app's tokens |
| `runtime.mjs` | nav, counters, the reading animation, the countdown |
| `qr.json` | App Store, Google Play and research QR codes as inline SVG |

Manrope is read from `assets/fonts/` at build time and embedded, so the one
HTML file is the whole deliverable.
