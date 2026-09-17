# Reading Scripture Together · YWAM Kona DTS staff training

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
| 00-08 | 1-2 | Movement 1: the numbers |
| 08-20 | 3-5 | Movement 2: the habit we built, and Josiah and Nehemiah |
| 20-28 | 6-8 | Movement 3: four colours |
| 28-32 | 9 | Movement 4: two plans for the DTS |
| 32-48 | 10-11 | Movement 5: breakouts, read Jonah |
| 48-60 | 12-14 | Close: back together, download, questions |

Slide 10 is the breakout brief. Leave it up, press `T`, open rooms of four.
Slide 11 is a back-pocket slide: only put it up if a room stalls on who takes
which colour.

Slide 4 is the Josiah and Nehemiah precedent, four beats down the side with
the two stories as parallel columns. It carries no argument of its own on
purpose: it is there to talk over, with the story numbers along the foot so
they can be opened in the app if anyone asks.

## What was cut, and why

Fourteen slides, down from twenty-six. Roughly twenty-five minutes of talking,
fifteen of breakout, ten back together, and room to run over.

| Cut | Why |
| --- | --- |
| Young men 54/46 bar chart | A 54 to 46 split does not carry "young men are driving this". The UK 4% to 21% attendance figure makes the same point on firmer ground, so it moved onto the numbers slide instead. |
| UK attendance as its own slide | Folded into the numbers slide as the third card. |
| AI usage bar chart | The percentages have no stated denominator yet. The device slide makes the AI argument without leaning on an unmeasured number. |
| Podcast view counts | Labelled "not a statistic" on its own slide, which is a sign it did not need to be there. |
| Research QR as its own slide | Moved to the download slide as a third code. |
| "Some revelation only arrives in the room" | Told the room what the breakout was about to prove. Let the breakout prove it. |
| Cast screen | A feature tour, not part of the argument. Demo it live if someone asks. |
| Plan screen mockup | The two-plans slide already carries it. |
| "How four people read" four steps | The breakout brief has the same four steps, ten minutes later. |
| Talk about it screen | The questions are named in the breakout brief where they are actually needed. |
| Running order slide | Cut on request. The cover carries the framing, and the movement footer carries the position. |
| The device slide | Cut on request. It held the only social and AI argument in the deck, so that thread is now gone rather than shortened. |

Every cut block is still in `stats.mjs` or in git, so restoring one is a slide
rather than a rewrite. The build lists parked figures separately from the ones
that still need confirming, which is why the outstanding list is three items
rather than eight.

## Josiah and Nehemiah

Both columns run the same four beats, checked line by line against the app
data rather than from memory:

| Beat | Josiah, 2Ki 22-23 | Nehemiah, Neh 8-10 |
| --- | --- | --- |
| Found | 22:8-10 | 8:1 |
| Read to everyone | 23:1-2 | 8:3 |
| Understood together | 23:3 | 8:7-8 |
| Then society changed | 23:4-23 | 8:13-18, 10:28-39 |

The Huldah consultation used to sit in the third row. It came out because it
is the king sending messengers to a prophetess in private, which is neither
communal nor in sequence with the public reading. The covenant renewal at
23:3, where all the people pledge themselves alongside the king, is the beat
that actually matches the Levites explaining the text to the crowd.

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

Slide 8 plays the reading turn by turn and scrolls to follow, the way a thumb
would.

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

## Sized for a projector

The house type ramp is built for a laptop or a web essay. This deck is shared
to a projector in front of about 150 people, so the back row sets the minimum
and everything in `styles.mjs` under PROJECTION SCALE overrides it. `theme.mjs`
stays untouched.

The whole stage is one unit. `--u` is a hundredth of the board, taken from
whichever axis is tighter:

```css
:root{ --u: min(1vw, 1.78vh) }
```

Nothing in that block carries a `rem` cap, and that is the point. A cap makes
type proportionally *larger* on a small screen than on a big one, which is how
a slide that fits at 1600 overflows at 1366. With no caps the entire stage
scales together, so if it fits once it fits everywhere. Checked at 1024x768,
1280x720, 1366x768, 1600x900, 1920x1080 and 2560x1440.

1u is 16px on a 1600-wide screen, so the numbers in that block read like rem.
Body copy lands near 29px there and grows with the screen.

## Voice

`brand-strategy/voice-rules.md` is binding on everything here that is in
Nathaniel's own voice. The build runs the pre-send checklist rather than
trusting memory: em dashes, mojibake, signposting, AI vocabulary, stacked
antithesis, and whether enough sentences still open with And, So or But.
Scripture, story titles and the question sets come from the app and keep their
own punctuation, so they are not judged.

The deck spends its one permitted antithesis on the cover.

Five more rules on top, from Nathaniel:

1. Direct, not dramatic. Say the uncomfortable thing without inflating it.
2. Evidence first, interpretation second. No headline claims more than the
   number under it. Where a reading is Nathaniel's rather than the data's, the
   slide says so.
3. Talk to people like adults. Clear, never dumbed down.
4. Do not sound like a Bible study or like personal devotions.
5. Keep the punchy lines.

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
| `slides.mjs` | the 14 slides |
| `runtime.mjs` | nav, counters, source cards, the reading animation, the countdown |
| `qr.json` | App Store, Google Play and research QR codes as inline SVG |

Fonts load from Google Fonts, per the skill. The fallback stack is Georgia for
the display serif and system-ui for the body, so a dead connection costs the
typefaces and nothing else.
