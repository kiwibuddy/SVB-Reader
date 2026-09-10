# SourceView Together — Meta ad scripts

Four 9:16 ads for Facebook and Instagram. 1080×1920, 30fps, H.264.

Every figure below was read out of the shipping data on 1 Sep 2026 via
`scripts/dump-segment.mjs` and `scripts/find-quote.mjs`. Nothing is written
from memory. If a number changes in the app, re-run the scripts and change it
here before changing any copy.

---

## The shared spine

All four ads use the same four-part structure, so they read as a family while
the middle section differs enough to stand as separate creative.

| Frames | Seconds | Beat |
| --- | --- | --- |
| 0–48 | 0.0–1.6 | **Title card.** Logo large and centred, "SourceView Together", "BIBLE APP", four-colour rule drawing in beneath. |
| 48–76 | 1.6–2.5 | **Morph.** Logo travels up and shrinks into the header; the title setting crosses over to the header setting. |
| 76–166 | 2.5–5.5 | **Hook.** Two lines, word-by-word reveal, second line in divine red. Held long enough to read at scroll speed. |
| 166–330 | 5.5–11.0 | **Feature.** Device springs up from below with a tilt that settles, then drifts slowly. This is the only section that differs between ads. |
| 330–420 | 11.0–14.0 | **Statement.** The device washes out behind a single large line — the reason to care. Roughly 3s, which is what a three-line setting needs to be read rather than glimpsed. Ad 01 has none; its script beat runs to the end instead. |
| 440–580 | 14.7–19.3 | **End card.** Slate field. "Scripture redesigned for a social generation." · "Over 700 voices · 365 stories" · **Download now** · App Store and Google Play. Settles by 14.9s and then holds still for 3.2s. |

The spine lives in `src/lib/AdShell.tsx` and `src/lib/timeline.ts`. Each ad file
supplies only its two hook lines, its kicker, what plays on the device, and its
statement — so a change to the branding or pacing lands on all four at once.

**Fixed rules for all four.** Everything legible sits inside x 65–1015, y 269–1248 —
Meta covers the top 14% and bottom 35%. On-device type is rendered larger than
the app truly draws it, because real 16pt body text is unreadable at feed size;
layout, colour and side-assignment stay exact. Voice totals are always stated as
"over 700", never a precise figure, because the codebase currently disagrees with
itself (774 hardcoded, 773 in data, 769 shown in Cast). No French claims —
`FRENCH_ENABLED` is `false` in production.

---

## Ad 01 · The script *(built — `ScriptAd.mp4`)*

**Feature:** source colours and the attributed reading layout.
**Target reaction:** "that doesn't look like my Bible app."

**Hook.** "Every word was said by someone." / "This app shows you who."
**Kicker during device:** "Every voice in its own colour."

**On the device.** Story 002, *People Sin*, `002 · GEN 3:1–5:32 · 8 min`, colour
mix bar beneath. Genesis 3:9–13 arrives one turn at a time, every 22 frames,
scrolling under a masked header. Narrator and God read down the left, Adam and
Eve down the right — the app's real `isLeftVoice` rule, which lays the passage
out as a conversation between God and humanity.

Verbatim, in order: The Narrator "Then the Lord God called to the man," · God
"Where are you?" · Adam "I heard you walking in the garden, so I hid. I was
afraid because I was naked." · God "Who told you that you were naked?" · Adam
"It was the woman you gave me who gave me the fruit, and I ate it." · God "What
have you done?" · Eve "The serpent deceived me,"

**Motion signature:** vertical arrival and scroll.

---

## Ad 02 · Cast *(built — `CastAd.mp4`)*

**Feature:** the Cast screen and the conversation graph.
**Target reaction:** "wow, my Bible app doesn't have that."

**Hook.** "The Bible has a cast list." / "Over 700 people speak in it."

**Kicker during device:** "Everyone who speaks, and who they spoke to."

**On the device.** The Jesus voice card, which is a full-bleed divine-red field
with cream type — visually unlike anything in Ad 01, which is the point.

1. **166–200** — Device rises. Screen opens on the Cast index: a searchable list
   with filter pills *Main · Supporting · Divine · All*, voices sorted by word
   count. Hold ~1s so the list length registers.
2. **200–214** — A tap ripple on the Jesus row; the red field wipes up from the
   tap point and takes the whole screen. This wipe is the ad's signature move.
3. **214–250** — The card assembles: rank line `DIVINE VOICE · 002 OF 769`, then
   the name **Jesus** set large in Didot, then the stat line counting up from
   zero to its real value — **41,239 words across 716 turns, in 47 of the 365
   stories.** The counter animating is the moment that earns the reaction.
4. **250–300** — `SPOKE WITH` — horizontal bars grow left to right, staggered:
   The Disciples **94** · Simon Peter **68** · The Crowd **63** · Jewish Leaders
   **60** · The Pharisees **33**. Bar colour is each partner's own source colour,
   so the Disciples' green and the Crowd's blue read against the red field.
5. **324–420** — The device washes out and the statement takes the frame:
   **"See who speaks with whom, and follow the relationship."** This is what the
   bars are *for* — the ad should leave a reason to open the screen, not a
   trivia fact. (An earlier draft closed on "559 of them speak in exactly one
   story." True, but it makes the cast sound thin rather than traceable.)

**Motion signature:** a colour field wipe, counters, and bars growing sideways.
Deliberately horizontal where Ad 01 was vertical.

**Data check:** `conversations.json` — Jesus 41,239 words / 716 turns / 47
stories, group `divine`; `spokeWith` counts exactly as listed; `meta.voices` 773;
559 voices with a single `storyIds` entry. The Cast screen itself displays
"of 769" because it excludes the four narration voices, so that string is correct
on-device even though the ad says "over 700" in copy.

---

## Ad 03 · Stories, not chapters *(built — `ThreadAd.mp4`)*

**Feature:** the 365-story thread and reading times.
**Target reaction:** "my daily reading in 5–15 minute stories — that's better
than chapter and verse."

**Hook.** "A chapter ends mid-sentence." / "A story ends when it ends."

**Kicker during device:** "365 stories. None longer than 15 minutes."

**On the device.** The Read tab.

1. **166–190** — Device rises on the collapsed thread: the whole Bible as ten
   rows — The Beginning · History · Wisdom · Major Prophets · Minor Prophets ·
   Gospels · The Church Begins · Paul's Letters · Letters to Everyone ·
   Revelation. The fact that the entire canon fits on one screen is the first
   beat and needs a full second to land.
2. **190–224** — The thread line draws itself down the left gutter through all
   ten division diamonds, top to bottom, as a stroke-dashoffset reveal.
3. **224–262** — The Beginning bows open. Stories appear as beads on the thread,
   each with its real title and reading time: *God Creates · 6 min*,
   *People Sin · 8 min*, *A Flood · 11 min*. Each time chip pops in on its own
   beat — the rhythm of the numbers is the message.
4. **294–328** — The list drifts up to bring Revelation into view. Built as a
   drift, not the long scroll this originally called for: the ten divisions plus
   the opened first one already nearly fill the screen, so there was nothing to
   scroll through.
5. **334–420** — The device washes out and the statement takes the frame:
   **"Know the whole Bible, one ten-minute story at a time."** The goal, not the
   statistic. (An earlier draft read "356 of the 365 take between 5 and 15
   minutes" — accurate, but it asks the viewer to do arithmetic instead of
   picturing themselves finishing.)

**Motion signature:** a single continuous line drawing and a long vertical
travel. Distinct from Ad 01's discrete arrivals.

**Data check:** `SegmentReadingTimes.json` — 365 stories, range 2–14 minutes,
median 10, and 356 of 365 (98%) between 5 and 15. Titles and times: S001 *God
Creates* 6 min, S002 *People Sin* 8 min. Division names and story ranges from
`constants/divisions.ts`. **Do not** use "15–20 minutes" — that appears in
`APP_DESCRIPTION.md` and the store listing but no story in the data reaches 15
minutes read silently.

---

## Ad 04 · Take a colour *(built — `ColourAd.mp4`)*

**Feature:** group reading with no setup.
**Target reaction:** "you could actually do this at the table tonight."

**Hook.** "Pick a story. Gather three friends." / "Read your colour parts out
loud." An instruction, not a description — it tells the viewer what to do
tonight, which is the only thing this ad is asking for.

**Kicker during device:** "Four readers. One story. Out loud."

An earlier draft used "No codes. No accounts. Nothing to join." Cut, along with
every other absence-of-friction line in the set. Naming what the product doesn't
require makes the viewer think about setup friction they hadn't considered, and
it sells nothing.

**On the device.** The reader again, but the ad is about the CallSheet rather
than the passage, so it opens where Ad 01 ended.

1. **166–196** — Device rises on story 268, *Prepared to Extend the Kingdom*,
   with the CallSheet visible at the top of the story: four empty colour boxes.
2. **196–246** — Four taps, one per colour, ~12 frames apart. Each tap fires a
   ring ripple in that colour and drops a tick into the box. A small name label
   appears beside each. Nothing else happens — no dialog, no code, no waiting
   screen. The absence is the argument.
3. **246–300** — The passage plays, but only the blue voice is lit: every other
   turn dims to 45% opacity while blue holds full colour and gains a soft glow.
   This is exactly what a reader watching for their turn sees.
4. **310–330** — Dim lifts; all four colours come back at once.
5. **336–420** — The device washes out and the statement takes the frame:
   **"See the Bible come alive as you read it together."** The payoff of the
   activity the hook asked for. (An earlier draft repeated the instruction —
   "Open the same story. Take a colour." — which told the viewer twice how to
   start and never once why.)

**Motion signature:** tap ripples and a dim-and-lift. Almost no travel, where
the other three all move a lot.

**Copy caution:** this ad describes a room, so keep every line about the
activity and never about the viewer. "Read together" is fine; anything of the
form "read with other Christians" asserts the viewer's religion and is a Meta
personal-attributes rejection.

---

# Wave two

Wave one sells novelty — "that doesn't look like my Bible app." These four sell
jobs the viewer already has: lead a group, finish the thing, keep the habit,
don't lose your bearings. Same spine, same 19.3s, same end card.

Two features were considered and cut. **Emoji reactions and the Saved tab** ship
and work, but reactions and notes are table stakes in this category and would not
stop a scroll. **Achievements** has a complete screen at `app/(tabs)/Achievements.tsx`
but `href: null` in the tab layout and no link anywhere in the UI, so it is not a
shipping feature and nothing may imply badges exist.

---

## Ad 05 · Talk about it *(built — `QuestionsAd.mp4`)*

**Feature:** the discussion questions attached to every story.
**Target reaction:** "I could lead small group on Thursday with no prep."

**Hook.** "Someone has to lead the discussion." / "The questions are already
written."

**Kicker during device:** "Family, school or small group. One tap."

**On the device.** Story S003, *The Flood*, scrolled to the Talk about it card.
The audience pill slides Family → School → Small Group, and the three questions
under it are replaced each time. 48 frames per audience, which is enough to read
one question and see that the others changed.

**Statement.** "Every story comes with questions for the room you're in."

**Why this story.** S003 has the widest divergence between audiences of any of
the 365 — Q3 runs from *"How can our family choose what is right?"* to *"When is
it hardest for you to follow God at school?"* to *"How does this challenge our
comfort with cultural norms that conflict with God's ways?"* Q2 is nearly
identical across the three and is left out; showing it would undercut the point.

**Data check:** `FamilyQuestions.json`, `SchoolQuestions.json`,
`SmallGroupQuestions.json` — set 1 covers all 365 stories, four questions each.
Set 2 covers 345 / 345 / 344, so **never claim two sets for every story**.
8,516 questions in the bundle across both sets. Rendered by
`components/thread/TalkAboutCard.tsx`.

---

## Ad 06 · Pick an ending *(built — `PlanAd.mp4`)*

**Feature:** reading plans and challenges.
**Target reaction:** "I've failed at this three times because I never picked a
finish line."

**Hook.** "You've started the Bible before." / "This time, pick an ending."

**Kicker during device:** "Plans and challenges, a week to a year."

**On the device.** The Plan tab. The active *Bible in 1 year* card fills to 34 of
365, then the catalog lists three plans and five challenges, and the seven-story
challenge lights up — the ad's argument is that the shortest option is a week.

**Statement.** "Start with seven stories, or all 365."

**Data check:** `ReadingPlansChallenges.json`. Plans: Bible in 1 year (365),
Bible in 1 School Year (180), New Testament in 100 days (100). Challenges shown:
God's Story (7), In The Beginning (18), Women of the Bible (20), The Gospels
(42), Advent Journey (16).

**Excluded on purpose.** Several challenge descriptions disagree with their own
segment lists — *Paul's Letters* is described as 35 stories and contains 27,
*David's Life* as 35 and contains 46. Both are kept out of this ad until the data
is corrected. Seasonal challenges are date-gated in `utils/planCatalog.ts`, so
Advent and Lent are only visible in their months; that is fine on screen but
means a viewer may not find them the day they install.

---

## Ad 07 · The year, filling in *(built — `YouAd.mp4`)*

**Feature:** the You tab — story heatmap, stat rings, streak.
**Target reaction:** "I want to see that screen full."

**Hook.** "You've read more than you think." / "Here's the proof."

**Kicker during device:** "Every story you finish, on one screen."

**On the device.** All 365 stories as dots in ten division rows. They fill in
reading order over ~2.5s, then three rings spin up: 128 of 365, 214 voices met,
14-day streak.

**Statement.** "The whole Bible on one screen, filling in as you go."

**The numbers are a demo state, not a claim** — a plausible reader partway
through, and nothing on screen asserts anything about the product's contents
except the 365 and the division counts, which are real.

**One deliberate omission.** The real voices ring shows `/ 774`
(`components/thread/YouStatRings.tsx`), but `conversations.json` holds 773 voices
and the Cast screen counts 769. The ad uses the app's other real ring state — the
count with no denominator — rather than putting a disputed number on screen.

---

## Ad 08 · Type the reference *(built — `SearchAd.mp4`)*

**Feature:** reference search.
**Target reaction:** "I won't lose the one thing I know how to do."

**Hook.** "You still think in chapter and verse." / "Type it. We'll find the
story."

**Kicker during device:** "Search a reference, a person, or a story."

**On the device.** "John 3:16" types into the search field a character at a time,
a Verse reference card resolves to *The First Sign*, and tapping it slides the
story in from the right.

**Statement.** "Your reference still works. What's around it is new."

**Why it matters.** This is the only ad in either wave aimed at the objection
rather than the novelty. Every other one asks the viewer to want something new;
this one promises they lose nothing. It is also the plainest-looking of the eight,
which is the trade.

**Data check:** John 3:16 falls inside S299, *The First Sign*, Joh 2:1–4:42,
10 min, confirmed against `SegmentReadingTimes.json`. Opening lines verbatim from
`newBibleNLT1.json`. Search behaviour is real — `lookupReference` in
`components/thread/ThreadList.tsx` resolves references alongside voice, book and
story hits.

---

## Still open before any of these run as paid ads

- **Store badges.** The App Store and Google Play chips are drawn by hand.
  Replace with the official Apple and Google artwork.
- **Audio.** All four are silent. Over 80% of Instagram Reels play with sound
  on, and this product is about reading aloud — real voices reading the Genesis 3
  exchange would carry Ad 01 on its own, and it is a voice memo, not a shoot.
- **The app icon.** It appears on every end card. It is currently pastel pink,
  green and blue on grey, which matches none of the four source colours the ads
  are built on.
- **Brand share.** The title card plus end card is about 36% of each ad's
  duration. Meta's direct-response data favours keeping brand presence under
  25%. If install numbers disappoint, shorten the title card first.
