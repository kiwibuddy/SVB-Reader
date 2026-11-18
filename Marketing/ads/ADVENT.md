# Advent 2026 — two 30-second ads

Two 9:16 ads for Facebook and Instagram Reels/Stories. 1080×1920, 30 fps, H.264,
30.0 seconds. Built on the same brand spine as the 2.0 set (`src/lib/`), so the
opening and the end card match the ads people may already have seen.

| File | Audience | Composition |
| --- | --- | --- |
| `out/AdventFamilyAd.mp4` | Families | `AdventFamilyAd` |
| `out/AdventGroupsAd.mp4` | Churches and small groups | `AdventGroupsAd` |
| `out/AdventFamily3DAd.mp4` | Families, with the felt family in 3D | `AdventFamily3DAd` |

```bash
cd Marketing/ads
node scripts/advent-data.mjs                     # refresh on-screen data from the app
npx remotion render AdventFamilyAd out/AdventFamilyAd.mp4 --codec=h264 --crf=18
npx remotion render AdventGroupsAd out/AdventGroupsAd.mp4 --codec=h264 --crf=18
npx remotion still AdventGroupsAd check.png --frame=432 --props='{"showGuides":true}'
```

**Everything on the device is the app's own data.** `scripts/advent-data.mjs`
writes `src/advent/data.ts` from `ChronologicalMappings.json` (dates, notes, week
titles), `SegmentTitles.json`, `SegmentReadingTimes.json` and `newBibleNLT1.json`
(Scripture, speakers, colours, the four reading parts). It stops with an error if
the plan no longer runs 26 days to 24 December.

---

## Beat map (`src/advent/timeline.ts`)

| Frames | Seconds | Beat |
| --- | --- | --- |
| 0–76 | 0.0–2.5 | Title card, then the logo travels into the header (same as the 2.0 set) |
| 80–178 | 2.7–5.9 | Hook: two lines, word by word, second line in Advent purple |
| 178–440 | 5.9–14.7 | Device rises; screen A |
| 440–666 | 14.7–22.2 | Screen B slides in from the right |
| 666–780 | 22.2–26.0 | Statement over the washed-out device |
| 780–900 | 26.0–30.0 | End card: "Starts Sunday 29 November · The Advent Journey. Read it together." · Download now |

---

## Ad A · Families — `AdventFamilyAd.mp4`

**Hook.** "Advent starts Sunday, 29 November." / "Read it together, out loud."

**Screen A — kicker "One story a day to Christmas Eve."** The Plan tab with the
Advent card ("Advent begins Sunday, November 29 · Join Advent · Remind me") and
Week 1 · Hope beneath it, each day with its date, reference, minutes and note. A tap
on **Join Advent** turns the card into the in-progress card ("Starts Sun, Nov 29").

**Screen B — kicker "Everyone takes a part."** *Two Miraculous Births*, Luke 1:28–30.
The app's picker, "Four parts — take one to read in your group", with Dad, Mum, Gran
and Ana. This story's parts are three narrator parts and one for everyone else
(`readers: black, black, black, blue`), so three people share the narration and Ana
reads Gabriel. Her phone is shown: her turns glow, the rest dim.

Verbatim, in order: Gabriel "Greetings, favored woman! The Lord is with you!" ·
Narrator "Confused and disturbed, Mary tried to think what the angel could mean." ·
Gabriel "Don't be afraid, Mary," · Narrator "the angel told her," · Gabriel "for you
have found favor with God! …"

**Statement.** "Ten minutes after dinner, every night to Christmas Eve." /
"Four questions for families follow every story."

### Meta copy

> One Bible story a day from 29 November to Christmas Eve, read out loud as a
> family. SourceView Together splits every story into four colour-coded parts, so a
> child can read the angel while a grandparent narrates — about ten minutes after
> dinner, with four questions to talk over.

**Headline:** Advent, read aloud as a family
**CTA:** Install Now

---

## Ad A3 · Families, felt — `AdventFamily3DAd.mp4`

The families ad with a felt family of four (Dad, Mum, Leo, Ana) at the kitchen table
around an Advent wreath, between the app screens. Chosen after a style test of felt
against clay: felt sits better with the app's calm cream look, and its fuzz, seams
and stitched smiles read as made by someone, where smooth glossy clay is now the
look most often faked with AI video tools.

**What it is, honestly.** Computer 3D built from simple shapes in Blender
(`blender/advent_felt.py`) and rendered with Cycles. No AI-generated imagery. It is
not physically handmade, so the copy must not call it "handmade"; "no AI imagery" is
true if anyone asks.

**Look.** Needle-felt materials (matte wool with a fibre sheen), tufted wool hair,
cream running-stitch seams at shoulders, cuffs and collars, a felt candle flame,
shallow focus like a miniature set. The 3D is rendered "on twos" (15 images a second,
each held two frames) with a little hand-nudged jitter, so it moves like stop-motion.
Each family member wears one of the app's four reading-part colours: charcoal (Dad),
red (Mum), green (Leo), blue (Ana).

| Frames | Seconds | Beat |
| --- | --- | --- |
| 0–158 | 0.0–5.3 | 3D: the family at the wreath; the first candle (Hope) lights. Header and hook over the top: "Advent starts Sunday, 29 November." / "Read it together, out loud." The camera then pushes into the phone on the table |
| 158–170 | 5.3–5.7 | Match cut: the felt phone lands exactly where the app graphic sits and dissolves into it |
| 170–350 | 5.7–11.7 | Screen A, "One story a day to Christmas Eve.": the Plan tab; a tap on Join Advent |
| 350–640 | 11.7–21.3 | Screen B, "Everyone takes a part.": Luke 1:28–30 with Dad, Mum, Leo and Ana; Ana reads Gabriel |
| 640–780 | 21.3–26.0 | 3D: the other three candles light in turn. "Ten minutes after dinner, every night to Christmas Eve." and Hope · Peace · Joy · Love lighting with them |
| 780–900 | 26.0–30.0 | End card (shared with Ad A) |

**Rendering the 3D.** The frames are not committed (about 150 PNGs); rebuild them:

```bash
cd Marketing/ads/blender
python3 -m venv .venv && .venv/bin/pip install bpy==5.3.0      # once
.venv/bin/python advent_felt.py shot open    --res 0.6 --samples 24 --out-dir ../public/advent3d/open
.venv/bin/python advent_felt.py shot candles --res 0.6 --samples 24 --out-dir ../public/advent3d/candles
cd .. && npx remotion render AdventFamily3DAd out/AdventFamily3DAd.mp4 --codec=h264 --crf=18
```

About a minute a frame on four CPU cores at 60% size (upscaled in the ad, under grain).
`--res 1 --samples 64` gives full-size frames at roughly four times the time.
The phone screens in the 3D (`blender/screens/plan.png`, `read.png`) are crops of
stills of Ad A, so the felt phone shows exactly what the app graphic shows at the cut.
`advent_felt.py still --out x.png --frame 30` renders one frame for a quick look.

### Meta copy

> One Bible story a day from 29 November to Christmas Eve, read out loud as a
> family. Everyone takes a colour-coded part, so a child can read the angel while
> Dad narrates. About ten minutes after dinner, with four questions to talk over.

**Headline:** Advent, read aloud as a family
**CTA:** Install Now

---

## Ad B · Churches and small groups — `AdventGroupsAd.mp4`

**Hook.** "From promise to manger in 26 days." / "Read it in fours, out loud."

**Screen A — kicker "Four parts. Four readers. One story."** *Isaiah Volunteers; God
Promises Emmanuel*, Isaiah 6:7–8. All four colours speak in this story
(`readers: black, red, green, blue`). Jo, Sam, Priya and Tom take the parts; the part
reading each turn lights up in the picker. This is Priya's phone, reading Isaiah, so
the last turn it lights is "Here I am. Send me."

Verbatim, in order: Seraphim "See, this coal has touched your lips. Now your guilt is
removed, and your sins are forgiven." · Narrator "Then I heard the Lord asking," ·
God "Whom should I send as a messenger to this people? Who will go for us?" ·
Narrator "I said," · Isaiah "Here I am. Send me."

**Screen B — kicker "Four weeks: Hope, Peace, Joy, Love."** The whole Advent Journey
scrolls from Week 1 to Christmas Eve, Sundays lit in their week's colour.

**Statement.** "Split into fours. Take a part. Read it out loud." /
"Questions for small groups follow every story."

### Meta copy

> 26 stories from the first promise to the manger, one a day through Advent. Every
> story in SourceView Together has four reading parts, so a small group can split
> into fours and read it out loud — and on three Sundays the story holds the passage
> many churches read that day.

**Headline:** Advent in fours, out loud
**CTA:** Install Now

---

## Music

Each ad has its own original arrangement of "O come, O come, Emmanuel" (VENI
EMMANUEL, Helmore 1851, public domain), written by `music/veni.py` with the FluidR3
GM soundfont (MIT licence). The arrangements are ours, so the music can be used
anywhere, not only inside Meta's apps. (Popular or trending songs cannot be used in
paid ads.) All three end on "O Israel" at 30.0 s and are normalised for social.

| Ad | Track | Why |
| --- | --- | --- |
| `AdventFamily3DAd` | `public/music/advent-music-box.mp3`: music box, strings, cello | Sounds like the felt look; chimes as each candle lights |
| `AdventFamilyAd` | `public/music/advent-bright.mp3`: glockenspiel, guitar, light beat | Most scroll-stopping; the beat drops as the phone rises |
| `AdventGroupsAd` | `public/music/advent-piano-cello.mp3`: piano, cello, strings | Reverent and warm, for church leaders |

```bash
cd Marketing/ads/music        # needs fluidsynth, fluid-soundfont-gm, ffmpeg, mido
python veni.py music-box   /tmp/a.wav felt && ffmpeg -i /tmp/a.wav -b:a 320k ../public/music/advent-music-box.mp3
python veni.py bright      /tmp/b.wav 2d   && ffmpeg -i /tmp/b.wav -b:a 320k ../public/music/advent-bright.mp3
python veni.py piano-cello /tmp/c.wav 2d   && ffmpeg -i /tmp/c.wav -b:a 320k ../public/music/advent-piano-cello.mp3
```

---

## Rules carried over from COPY.md

- First sentence of each primary text is under 100 characters; headlines under 40.
- British spelling ("colour"). Scripture stays in the NLT's own spelling ("favored").
- **Policy.** No line asserts the viewer's religion — no "your church", "your faith".
  Copy names the room (a family, a small group) and describes churches in the third
  person.
- Everything legible sits inside the safe box (x 65–1015, y 269–1248); check with
  `showGuides`.

## Before these run as paid ads

1. **Store badges.** The end card uses the placeholder store chips from
   `src/lib/Brand.tsx`. Swap in the official Apple and Google badge artwork first.
2. **Fonts.** These files were rendered in a Linux container, where the system font
   stack falls back to Inter. Re-render on a Mac for San Francisco.
3. **New installs.** Someone who installs from an ad sees the store build first; the
   Advent card and the 26-story plan arrive on their second launch, after the update
   applies. A 2.0.1 store build closes that gap and is worth having before spend
   starts.
4. **Timing.** Run Ad B to church leaders from now until about 26 November so groups
   can plan; run Ad A from about 24 November into the first week of Advent. The app
   lets late joiners start at today's reading, so Ad A keeps working through December.
