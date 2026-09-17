# Reading together · YWAM Kona DTS staff training

A standalone HTML deck for a one hour Zoom session. Open
`dist/ywam-kona-dts.html` by double-click, click the cover to begin, press `F`
to go fullscreen and share that window.

Built with the **nb-presentation** skill in `sphere-worldview-corpus`:
keyed slide deck engine, NB house style, everything inlined except the
webfonts. `theme.mjs` is `.claude/skills/nb-presentation/assets/theme.css`
pasted unchanged, so re-theming means swapping that file's `:root` block and
nothing else.

## Presenting

| Key | Does |
| --- | --- |
| `→` `↓` `space` | Next slide |
| `←` `↑` | Back |
| `F` | Fullscreen |
| `N` | Speaker notes along the bottom, for your own screen |
| `R` | Replay the live reading on the Jonah slide |
| `T` | Start and stop the 15 minute breakout countdown |
| `Esc` | Close a source card |
| `#n` | `…html#22` opens straight at the breakout brief |

Click any stat card and it opens the figure's source, the date it was checked,
and what about it is still unconfirmed. That is the answer if someone in the
room asks where a number came from.

## The hour

| Time | Slides | |
| --- | --- | --- |
| 00-04 | 1 | Open, and the shape of the hour |
| 04-16 | 2-7 | Movement 1: what is happening |
| 16-26 | 8-13 | Movement 2: the habit we built, and Josiah and Nehemiah |
| 26-33 | 14-17 | Movement 3: four colours |
| 33-38 | 18-19 | Movement 4: two plans for the DTS |
| 38-42 | 20-21 | Movement 5: how four people read |
| 42-57 | 22-23 | Movement 6: breakouts, read Jonah |
| 57-60 | 24-26 | Close: back together, download, questions |

Slide 22 is the breakout brief. Leave it up, press `T`, open rooms of four.

Slide 11 is the Josiah and Nehemiah precedent, four beats down the side with
the two stories as parallel columns. It carries no argument of its own on
purpose: it is there to talk over, with the story numbers along the foot so
they can be opened in the app if anyone asks.

## The phones are not screenshots

Every phone is drawn in CSS and filled from the app's own source, so it moves:

| From | Used for |
| --- | --- |
| `constants/Colors.ts` | every fill, edge and ink inside the screen |
| `constants/Motion.ts` | the real easing `cubic-bezier(0.32,0.72,0,1)`, the app's `DUR`, and `STAGGER.turn` of 24ms |
| `assets/data/newBibleNLT1.json` | the actual text of Jonah, all 54 turns |
| `components/Bible/*` | bubble geometry, tail corners, left/right split |
| `components/navigation/BottomNavigation.tsx` | the five tabs and their Ionicons, filled on the active tab |
| `School/Family/SmallGroupQuestions.json` | the four questions, verbatim |

The app is a light app, so the screen stays light on the dark stage and
nothing inside `.screen` reads the deck's theme tokens. Every size in there is
a share of the screen width (app px ÷ 2.865, the 1170/2532 aspect), so the
whole mockup scales with the slide rather than with the viewport.

Slide 16 plays the reading turn by turn and scrolls to follow, the way a thumb
would. Slide 17 is the real call sheet. Slide 19 is the plan screen with the
two DTS journeys. Slide 21 is the real Talk about it card, Small Group set
selected.

## Statistics

Every number lives in `stats.mjs` and nowhere else. Edit that file and run
`node build.mjs`. Figures came from Nathaniel out of
`kiwibuddy.github.io/bible-resurgence`, which states each was checked against
its linked source in July 2026 and asks that they be re-checked before
republication after October 2026. That caution is in every source card, not
just in this file.

`build.mjs` prints every field still marked `confirm` on each run, so a blank
cannot ship by accident. Percentage bars draw against a full 100 rather than
against the tallest bar, so a 43 never reads as a 75.

## Voice

`brand-strategy/voice-rules.md` is binding on everything here that is in
Nathaniel's own voice. The build runs the pre-send checklist rather than
trusting memory: em dashes, mojibake, signposting, AI vocabulary, stacked
antithesis, and whether enough sentences still open with And, So or But.
Scripture, story titles and the question sets come from the app and keep their
own punctuation, so they are not judged.

The deck spends its one permitted antithesis on the cover.

## Rebuild

```bash
node presentations/ywam-dts/build.mjs
```

| File | Role |
| --- | --- |
| `theme.mjs` | the NB house style, pasted from the skill. Swap `:root` to re-theme |
| `styles.mjs` | deck engine shell plus the components this deck adds |
| `data.mjs` | app palette, motion, the reader port, corpus totals, plans |
| `stats.mjs` | every research figure, its source card, and its open questions |
| `phone.mjs` | the live phone screens |
| `slides.mjs` | the 26 slides |
| `runtime.mjs` | nav, counters, source cards, the reading animation, the countdown |
| `qr.json` | App Store, Google Play and research QR codes as inline SVG |

Fonts load from Google Fonts, per the skill. The fallback stack is Georgia for
the display serif and system-ui for the body, so a dead connection costs the
typefaces and nothing else.
