# Back to the Source: three 30-second films

Design for three new vertical video ads for SourceView Together. The plan as
presented to the owner (frames, beat sheets, rollout) is the Artifact page
"Back to the Source"; this file is the builder's copy.

## Intent

Three 30-second videos, each a different kind of video, each about one thing
the app does:

1. **Speech bubbles**: every voice in the Bible in its own colour.
2. **365 stories**: the whole Bible, one story a day.
3. **Reading together**: getting back to reading the Bible out loud with other
   people.

Audience, kept invisible in the work: 20 to 35, returning to scripture after
stepping back from it, wanting simple practices with the text at the centre and
community without hype. The owner asked for something a trend-setting agency
would make, and nothing that looks AI-generated or costs scripture its
credibility.

**Insight.** The people coming back don't want a bigger show. They want
something solid, honest and shared: the text itself, read with people they
trust. Barna and Gloo's 2025 State of the Church research reports weekly Bible
reading among Gen Z and millennials up sharply and driven by curiosity, so the
tone is invitation, not persuasion. (Do not cite the UK "Quiet Revival"
figures; Bible Society withdrew that report in March 2026.)

**Campaign line, on every end card:** "Back to the source." It is what the
audience is doing, it echoes *ad fontes*, and it is the brand's own name.

## Goals, non-goals, anti-goals

- Goals: stop the scroll in the first two seconds; leave each viewer with one
  idea and the app's name; look made by people.
- Non-goals: explaining every feature; replacing the Advent ads (they run to
  24 Dec); a live-action shoot.
- Anti-goals, a failure even if it renders: any AI imagery or AI voice; any
  paraphrased or cropped-out-of-meaning scripture; hype words or exclamation
  marks in our own lines; naming the audience ("deconstruction", "church hurt",
  "come back"); any line telling the viewer what they believe (Meta policy);
  sniping at churches; implying features that don't ship (audio or "listen",
  networked group sessions, AI, accounts or sync; see `Marketing/ads/COPY.md`).

## Constraints

- 1080x1920, 30 fps, 900 frames each; Meta safe box x 65 to 1015, y 269 to 1248
  for anything legible in the first and last seconds. 4:5 (1080x1350) feed
  cuts follow.
- Every quotation verbatim from `assets/data/newBibleNLT1.json`, with speaker
  and colour as the app shows them, checked by script the way
  `scripts/advent-data.mjs` checks the Advent excerpts. References carry "NLT"
  (Tyndale's terms for quotations in non-salable media).
- Art must be public domain with an open-access image (Art Institute of
  Chicago, The Met, National Gallery of Art, Wikimedia PD-Art). Credit each work
  on screen with a museum label.
- Music is original, written in code like `music/veni.py` (FluidSynth, MIT
  soundfont), from public-domain melodies where a melody is borrowed; loudnorm
  to -14 LUFS.
- British spelling. Primary text first sentence under 100 characters;
  headlines under 40.

## Approaches considered

| Approach | Trade-off | Decision |
| --- | --- | --- |
| **One campaign, three techniques**: kinetic type, generative data art, etching collage | Each film looks different and plays to its feature; all three can be built here with no shoot and no AI | **Chosen** (owner handed over the how) |
| Live action with real people (UGC style) | Most native to Reels, but needs a cast and a shoot the owner would have to run | Not now; real voices are offered as an optional upgrade to Film 1 |
| One technique for all three (more felt 3D) | Consistent, but the owner asked for completely different styles, and Cycles renders take hours | Rejected |
| AI-generated video | Fast, but exactly the look the owner wants to avoid, and it undercuts trust in the text | Rejected |

## Shared system

- Type: Instrument Serif (`@remotion/google-fonts/InstrumentSerif`) for every
  big line; Inter for labels and references.
- Colour: the app's four voice colours only, from `src/theme.ts`: the light set
  on paper (`light.narr/divine/prin/chor`, fills `divFill/prinFill/chorFill`),
  the dark-mode set on black (`dark.*`). Night ground `#0B0F12`, paper
  `#F2EAE0`.
- Layout rule from the app (`IS_LEFT`): narration and God on the left,
  humanity on the right.
- Fine paper grain on every frame.
- End card, 26.0 to 30.0 s on all three: app icon, "Back to the source.",
  "SourceView Together", the four colour bars, App Store and Google Play chips.

## Film 1: Never a Monologue (speech bubbles)

Call-and-response kinetic type. Human lines on night, right-aligned in their
dark-mode colour; God's replies flip to the divine fill `#FBEDEB`, left-aligned
in red. Hard cuts on the beat.

| Time (s) | On screen | Speaker, colour, source |
| --- | --- | --- |
| 0.0–2.0 | "Who am I to appear before Pharaoh?" Exodus 3:11 | Moses, green, S019 turn 55 (first sentence of the turn) |
| 2.0–3.5 | "I will be with you." Exodus 3:12 | God, red, S019 turn 57 (first sentence) |
| 3.5–6.5 | "…if the Lord is with us, why has all this happened to us?" Judges 6:13 | Gideon, green, S079 turn 6 |
| 6.5–8.5 | "Go with the strength you have…" Judges 6:14 | God, red, S079 turn 8 |
| 8.5–11.5 | "I won't believe it unless I see the nail wounds in his hands…" John 20:25 | Thomas, green, S307 turn 34 |
| 11.5–13.5 | "Put your finger here, and look at my hands." John 20:27 | Jesus, red, S307 turn 38 |
| 13.5–14.0 | Black, silence | |
| 14.0–17.5 | "I do believe, but help me overcome my unbelief!" Mark 9:24, word by word | An Epileptic's Father ("A father" on screen), blue, S280 turn 66 |
| 17.5–20.0 | "It was never a monologue." on paper | |
| 20.0–26.0 | The app's reading screen for S079 at the Gideon exchange, bubbles left and right. "Every voice in its own colour." then "Read it out loud. Take a part." | |
| 26.0–30.0 | End card | |

Sound: felt piano over a low pulse; cuts on beats; music out from 13.5 to 17.5;
returns warm under "It was never a monologue."
Hook B (A/B test): "Over half the words in the Bible are spoken by someone in
it." (53.9% of 747,039 words are non-narrator, from each story's `sources`
word counts.)

## Film 2: The Whole Story (365 stories)

Generative data art. A familiar verse pulls back into its story, then into all
365 stories drawn as a rose window: one spoke per story, clockwise from
Genesis at 12 o'clock, each spoke's length split by its voice mix (narrator
innermost, then everyone else, principals, God at the rim), dark-mode colours
on night.

| Time (s) | On screen |
| --- | --- |
| 0.0–2.5 | A deliberately familiar verse-of-the-day graphic (peach-to-lilac gradient, italic serif): "For I know the plans I have for you," says the Lord. Jeremiah 29:11. Caption "You know the verse." |
| 2.5–6.0 | The graphic falls away into S215 as the app shows it (Jeremiah, green, turn 1). Highlight "all the captives he has exiled to Babylon" (29:4) and "You will be in Babylon for seventy years." (29:10). Caption "It was written to exiles. Seventy years from home." |
| 6.0–8.0 | "Do you know the story?" |
| 8.0–16.0 | Pull back: S215 becomes one spoke; 365 spokes build clockwise. "365 stories. Genesis to Revelation." "Each one coloured by who is speaking." |
| 16.0–20.0 | Finished rose. "The whole Bible, in 365 stories." then "One a day, for a year." (No reading-time totals: the app's minutes are silent-reading estimates.) |
| 20.0–26.0 | The app: the Bible in 1 year plan at Day 1, then S001 opening. "365 stories. One a day." |
| 26.0–30.0 | End card |

The rose is our visualisation, not an app screen; never present it as one.
Data: per-story voice mix from `newBibleNLT1.json` `sources[*].words` by
colour; minutes from `SegmentReadingTimes.json` (total 3,507, mean 9.6).
Sound: drone and rising arpeggio; an instrument added per division as the
rose fills (divisions from `constants/divisions.ts`); one bell when it closes.
Hook B: "The whole Bible, in 365 stories."

## Film 3: Out Loud (reading together)

Museum collage. Public-domain etchings printed on warm paper (levels to paper
and ink), loose hand-cut spot-colour shapes behind readers in the app's inks
(multiply, slight misregistration, grain), app-style bubbles carrying the
lines, a museum label on every image. The plan's mock frames used
wobbly-ellipse masks multiplied at about 0.7 strength, offset a few pixels.

| Time (s) | On screen |
| --- | --- |
| 0.0–2.5 | Rembrandt, *Jews in the Synagogue*, 1648 (AIC 13103), tall crop of the two men talking, green and blue. "Long before most people owned a Bible," |
| 2.5–4.5 | "it was read out loud." |
| 4.5–6.0 | "Together." |
| 6.0–8.0 | "In city squares." Ezra reading the Law (to source). Bubble, narrator: "All the people listened closely to the Book of the Law." Nehemiah 8:3 (S151 turn 0) |
| 8.0–10.0 | "In synagogues." Pull back to the whole Rembrandt plate, or a Luke 4 image. Bubble: "…stood up to read the Scriptures." Luke 4:16 (S286 turn 38) |
| 10.0–12.0 | "In letters passed between homes." Paul writing (to source). Bubble: "After you have read this letter, pass it on…" Colossians 4:16 (S340 turn 0) |
| 12.0–14.0 | "Around dinner tables." Legros, *The Refectory*, 1862 (AIC 116597), four monks in four inks |
| 14.0–16.0 | The four inks lift off and become the app's four part boxes |
| 16.0–24.0 | The app: parts picker with Maya, Josh, Sione, Priya on S019 (all four inks speak; confirm `readers`), then turns lighting up. "Everyone takes a part." "Nobody has to lead." "Questions after every story." |
| 24.0–26.0 | "Pull up a chair." |
| 26.0–30.0 | End card |

Sound (as built): an original folk melody in the Advent "bright" style: cello alone, then
glockenspiel, guitar and a light beat from "Together."
Hook B: "Much of the Bible was written to be read out loud." over Revelation
1:3: "God blesses the one who reads the words of this prophecy to the church,
and he blesses all who listen to its message…" (S359 turn 0, narrator).

## Copy (draft for COPY.md, wave three)

- Film 1. Primary: "Moses asked "Who am I?" Gideon asked why. Thomas wanted
  proof. The Bible keeps every one of those questions, and SourceView Together
  colours each voice so you can see who's speaking and read it out loud with
  others." Headline: "The Bible, as a conversation". CTA: Install Now.
- Film 2. Primary: "You know the verse. Do you know the story? SourceView
  Together splits the whole Bible into 365 stories of about ten minutes each,
  so all of it fits in a year of ordinary days." Headline: "The whole story,
  one day at a time". CTA: Install Now.
- Film 3. Primary: "For most of history, the Bible was read out loud,
  together. SourceView Together gives every story four colour-coded parts, so a
  few friends can read it around a table. Nobody has to lead, and there are
  questions after every story." Headline: "Read it out loud, together". CTA:
  Install Now.

## Rollout

Advent ads to 24 Dec. Film 1 from 26 Dec; Film 2 from 1 Jan (Bible in 1 year,
Day 1); Film 3 mid-Jan to Feb as groups restart. Two hooks per film, same
body. Judge on 3-second view rate, then ThruPlay rate, then cost per install.
Broad targeting, 20 to 35 (Meta removed religion-based detailed targeting in
2022).

## Build notes

- New folder `Marketing/ads/src/source/`; compositions `SourceMonologue`,
  `SourceWholeStory`, `SourceOutLoud`, registered in `src/Root.tsx`; outputs
  `out/Source*.mp4`.
- `scripts/source-data.mjs` writes `src/source/data.ts`: the quoted lines
  (checked against expected openings), the 365-story voice mix and minutes.
- `scripts/etch.py` fetches the artworks by museum object ID, records title,
  artist, date and credit line, and writes the printed versions to
  `public/source/art/`.
- `music/source.py` writes the three tracks to `public/music/source-*.mp3`.
- Build order: Film 1, Film 2, Film 3. Send each film as it is finished.
- Rebuild steps and credits in `Marketing/ads/SOURCE.md`.

## Decided by the builder (owner to check)

- Typeface (Instrument Serif), the reader names in Film 3, the rollout dates,
  the SLANE melody, and which two images still need sourcing for Film 3 (Ezra
  reading the Law; Paul's letters).

## Open with the owner

- Approval of this design.
- Optional: real voices for Film 1 (four friends reading the lines into Voice
  Memos). Ships without them.
