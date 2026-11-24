# Plan-specific discussion questions — decisions

Agreed with the owner on 24 Nov 2026. **Nothing is built yet.** When the owner says
**"begin building the Advent questions"**, follow the build plan in
`MVP3/05-ADVENT-COMPANION-BUILD-PLAN.md` (questions, intro card, key-verse highlight,
O Antiphon prayers), which supersedes the open points below.

## The idea

When a story is opened from a themed reading plan, the Talk about it card at the
bottom of the reader shows questions written for that plan (for Advent: questions
about waiting, promise and the coming of Christ), not the general Bible-study questions.

## Decisions (locked)

1. **Replace, don't add.** Inside a themed plan, the plan's questions replace the
   general sets for that story. Cleaner and simpler. Outside the plan (Read tab,
   search, other plans) the same story shows the normal questions.
2. **Look: a full card in the week's colour.** The whole Talk about it card takes the
   plan's colour (for Advent, the colour of that day's week: Hope #6A4C93, Peace
   #3F6FB5, Joy #C2507A, Love #8E3FA0), so readers can see these questions belong to
   the plan.
3. **Advent first** (pilot): 26 stories × 3 audiences (Family, School, Small group) ×
   4 questions = 312 questions.
4. **Themed plans that get their own questions later:** Advent Journey (26 stories),
   Lenten Reflection (21), 7 Days of Christmas (7), 12 Days of Christmas (12), Women
   of the Bible (20), David's Life (36), God's Story: The Good News (7), In The
   Beginning (18), Paul's Letters (27), The Gospels (42). 216 plan days in all, about
   2,600 questions.
5. **Cover-to-cover plans keep the normal questions:** Bible in 1 year, Bible in 1
   School Year, New Testament in 100 days, Old Testament Journey, New Testament
   Journey.

## What exists today (for the builder)

- Questions: `assets/data/Questions-EN.json` (and the per-audience files), keyed by story
  (`S001`–`S365`) → audience (`school`, `family`, `smallgroup`) → `set1` / `set2`, 4
  questions each. Loaded by `services/QuestionsLoader.ts` / `api/question-functions.ts`.
- Shown by `components/thread/TalkAboutCard.tsx` (audience chips, set toggle), rendered at
  the bottom of `app/(tabs)/[segment]/index.tsx`, which already receives the plan the
  story was opened from (`planId` route param, resolved with `findCatalogItem`).
- Advent plan data and week colours: `assets/data/ChronologicalMappings.json`
  → `adventJourneyChronological` (`segments[].phase`, `phases[].color`).

## Still open (decide when building)

- Questions are keyed by plan, then story (the same story can sit in two plans with
  different questions, e.g. Luke 1–2 in Advent and the Christmas plans).
- Whether the audience chips stay inside the coloured card (likely yes) and whether
  plan questions have one set or two.
- French: English first, French when the French release returns.
- Review: the owner is first processing outside (ChatGPT) reviews of the Advent plan;
  apply any agreed plan changes before writing questions, so questions match the final stories.
