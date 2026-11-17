# Advent 2026 — two 30-second ads

Two 9:16 ads for Facebook and Instagram Reels/Stories. 1080×1920, 30 fps, H.264,
30.0 seconds. Built on the same brand spine as the 2.0 set (`src/lib/`), so the
opening and the end card match the ads people may already have seen.

| File | Audience | Composition |
| --- | --- | --- |
| `out/AdventFamilyAd.mp4` | Families | `AdventFamilyAd` |
| `out/AdventGroupsAd.mp4` | Churches and small groups | `AdventGroupsAd` |

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
