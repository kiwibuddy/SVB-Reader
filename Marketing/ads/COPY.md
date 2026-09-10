# Meta ad copy — one set per video

Paste-ready copy for Ads Manager. Each ad has **primary text** (above the video),
a **headline** (below it) and a **CTA button** (chosen from Meta's fixed list —
you cannot write your own).

**Why the first sentence carries the weight.** Meta truncates primary text at
roughly 125 characters on mobile and hides the rest behind *See more*. Every
first sentence below is under 100 characters, so the hook lands whether or not
anyone expands it, and sentence two is the reward for expanding.

**Headlines** are kept under 40 characters. Meta will shrink or truncate longer
ones depending on placement, and a truncated headline reads as a mistake.

**Spelling.** British throughout — "colour", not "color". The app's own
onboarding says *"Four voices, four colours"* (`assets/data/thread-ui.json`), and
ad copy that doesn't match the product a viewer just installed erodes trust.

**Policy.** No line asserts or implies the reader's religion. Meta's personal
attributes policy prohibits ad copy of the form "your faith", "as a Christian",
"your church" or anything that tells the viewer what they believe. Where a line
needs a religious setting it names the *room* — a family, a classroom, a small
group — not the person.

---

## Wave one — novelty

### Ad 01 · `ScriptAd.mp4`

> Every line in the Bible was said by someone — but nothing on the page tells you
> who. SourceView Together colours all 365 stories by speaker, so narration,
> divine speech and every named person read as a conversation instead of a wall
> of text.

**Headline:** The Bible, colour-coded by speaker
**CTA:** Install Now

### Ad 02 · `CastAd.mp4`

> Over 700 people speak in the Bible, and most of them get a single scene.
> SourceView Together gives every one of them a page — Jesus speaks 41,239 words
> across 47 stories, and you can see exactly who he spoke with most.

**Headline:** Every voice in the Bible has a page
**CTA:** Install Now

### Ad 03 · `ThreadAd.mp4`

> Chapters end mid-sentence because they were added centuries after the fact.
> SourceView Together splits the Bible into 365 complete stories instead — none
> longer than 15 minutes, and most about ten.

**Headline:** 365 stories. None over 15 minutes.
**CTA:** Install Now

### Ad 04 · `ColourAd.mp4`

> Pick a story, hand out four colours, and read it out loud around a table.
> Everyone follows their own colour through the passage, so a chapter of Matthew
> becomes something four people perform rather than one person reading at the
> others.

**Headline:** Read the Bible out loud, in parts
**CTA:** Install Now

---

## Wave two — jobs to be done

### Ad 05 · `QuestionsAd.mp4`

> The hard part of leading a group isn't the reading, it's the twenty minutes
> after. All 365 stories come with discussion questions written three ways — for
> a family, a classroom or a small group — so the prep is done before you open
> it.

**Headline:** Questions for all 365 stories
**CTA:** Install Now

### Ad 06 · `PlanAd.mp4`

> Most Bible reading plans die in Leviticus, because a year is a long thing to
> commit to on day one. SourceView Together runs plans and challenges from seven
> stories to all 365, so you can pick a finish line you'll actually reach.

**Headline:** From seven stories to all 365
**CTA:** Install Now

### Ad 07 · `YouAd.mp4`

> Progress in most Bible apps is a number you have to take on trust. This one
> draws all 365 stories on a single screen and fills them in as you read, so the
> year you've had is something you can actually look at.

**Headline:** Watch the whole Bible fill in
**CTA:** Install Now

### Ad 08 · `SearchAd.mp4`

> Switching Bible apps usually means giving up the one thing you know how to do:
> find a verse. Type John 3:16 and SourceView Together takes you straight there —
> into the whole story it belongs to, not a line stranded on its own.

**Headline:** Type any reference. Find the story.
**CTA:** Install Now

---

## Claims used, and where they come from

Every number above is checked against shipping data. If any of these change in
the app, change them here before the ads run again.

| Claim | Source |
| --- | --- |
| 365 stories | `assets/data/SegmentReadingTimes.json`, S001–S365 |
| None longer than 15 min, most about ten | Same file — range 2–14, median 10, mean 9.6 |
| Over 700 people speak | `conversations.json` — 769 excluding the four narration voices |
| Jesus: 41,239 words, 47 stories | `conversations.json` |
| Questions for family / school / small group, all 365 | `FamilyQuestions.json`, `SchoolQuestions.json`, `SmallGroupQuestions.json` — set 1 is complete |
| Plans from seven stories to 365 | `ReadingPlansChallenges.json` — God's Story (7) to Bible in 1 year (365) |
| John 3:16 resolves to a story | S299, *The First Sign*, Joh 2:1–4:42 |

**Do not write** into any of this copy: audio or "listen"; French; accounts,
sync or cross-device progress; networked group sessions; highlights or
bookmarks; AI; badges or achievements. None of them ship. See the "Do not
advertise" list in `SCRIPTS.md`.

**"774 voices" is wrong** — it appears in `APP_DESCRIPTION.md` and in the You
tab's ring, but the data holds 773 and the Cast screen counts 769. Say "over
700" until the three agree.

---

## Testing notes

Each ad is a different **motivation**, not just a different feature, so treat
the two waves as separate tests rather than eight variants of one idea. Wave one
sells novelty and will win on click-through; wave two sells a job the viewer
already has and should win on install-to-retention. If wave one gets the cheaper
clicks but wave two gets the better day-7 numbers, that is the expected result
and not a reason to kill wave two.

Ad 08 is the odd one out and worth watching separately: it is the only creative
aimed at an objection rather than a desire, so it should underperform on
click-through and overperform on the people who do click.
