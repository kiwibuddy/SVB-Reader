# Discussion questions fix (25 November 2026)

## What was wrong

In `assets/data/Questions-EN.json`, **set 1** of the family and school questions
did not match its story for most of the Bible:

| Set | Wrong from | Stories rewritten |
| --- | --- | --- |
| Family, set 1 | S101 (2 Samuel 14) onward | 265 (S101–S365) |
| School, set 1 | S051 (Numbers 19) onward | 315 (S051–S365) |

Examples: Isaiah 6–9 asked about Proverbs and friendship; Isaiah 9–12 about
Ecclesiastes; Nehemiah got Esther's questions; Job got the Psalms'; Luke 1–2 (Christmas
Eve) asked about "courage before the cross"; John 1 asked about Peter's confession.
Several family questions were also garbled ("Which moment challenge or call from
Jesus' story feels personal?").

Set 1 is the set the app shows first, so every reader using the default set
saw these questions.

## Why

Set 1 for family and school came from the TSV files in `assets/data/New Questions/`.
Those lists were written against a different division of the Bible (for example
fewer stories for Job, more for Proverbs), so from about a third of the way
through, each row described a different passage from the story it was keyed to.
It was not a single offset that could be shifted back. The older per-audience
files (`FamilyQuestions.json`, `SchoolQuestions.json`) still match their stories,
but they are near copies of the small group questions, which is presumably why
they were replaced.

Family set 2, school set 2 and both small group sets matched their stories.

## What changed

- **580 sets rewritten** for their stories: family set 1 for S101–S365, school set 1
  for S051–S365. Same pattern as the rest of the data: notice → what it shows →
  our life → a small action this week. Family questions are short and concrete;
  school questions are invitational and set in school life. None repeat set 2.
- `Questions-EN.json` version **1.2.0 → 1.3.0**. On next launch the app sees the new
  version and reloads every question into its database (`api/questions-migration.ts`),
  so the fix ships in an ordinary over-the-air update.
- The source TSVs in `assets/data/New Questions/` carry the same new rows, so a
  rebuild from them cannot bring the old ones back.
- Also fixed while testing: small group set 2 was a copy of set 1 for S047, S053,
  S057, S059, S060 (new set 2 written); one family question for S338 was cut off
  ("What new").
- **French:** the French file uses the older, story-matched questions, except
  school set 1 for 11 stories (S237, S238, S240, S281, S285–S291: e.g. Luke got
  questions about Acts). Those 11 now carry a French translation of the matching
  English school set. `Questions-FR.json` version 1.0.0 → 1.0.1. French questions are
  downloaded from Firebase Storage, so **the new file needs uploading** there
  before French readers see it.

## Guard

`utils/questionsData.test.ts` checks every story has four questions per set,
that set 2 is not a copy of set 1, and that no question names a different book
of the Bible from its story. Run against the old data, the last check flags 36
sets; against the new data, none.

## Reviewing

The new text is easiest to read in the TSVs (one row per story):
`assets/data/New Questions/FamilyQuestions_All_S001–S365.tsv` (rows S101–S365) and
`SchoolQuestions_S051-S100.tsv` onwards.
