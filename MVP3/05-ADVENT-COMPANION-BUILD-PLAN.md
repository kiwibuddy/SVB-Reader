# Advent companion — build plan

Written 24 Nov 2026 on branch `claude/advent-reading-plan-review-81kch8`, after the
ChatGPT review of the Advent plan. Owner decisions are final; this plan says how to build
them. **Not started.** One plan, built in one go, shipped as two over-the-air updates
(Release A as soon as it's done, before Day 1; Release B after the owner approves the content).

## Start here (for the builder)

1. Work on branch `claude/advent-reading-plan-review-81kch8`. Pull first. Commit after every
   step (A1, A2, … B8) with a plain message; push after each commit.
2. Read, in this order:
   - this file;
   - `MVP3/04-PLAN-QUESTIONS.md` (locked decisions);
   - `docs/advent/ADVENT-2026-REVIEW-PACK.md` (the plan, all 26 days, key verses, how it works in the app);
   - `docs/advent/chatgpt-review-2026.md` (ChatGPT's draft intros and questions — source
     material only, with its known errors listed at the top).
3. Checks before every commit: `npx tsc --noEmit` and `npx jest --watchAll=false` (both must pass).
4. Publishing (only when the owner says so): `npm run update:production` (iOS) and
   `npm run update:production:android`. Check with `npm run ota:status`.
5. **Hard stop at B2.** After writing the content document, stop and wait for the owner's
   approval. Do not put any intro, question or closing text into the app until approved.
6. Don't touch marketing files (`Marketing/`), story lists, or the 365-story segmentation.
7. Scripture: NLT only, word for word from `assets/data/newBibleNLT1.json`. British spelling
   for app text; keep NLT spelling inside quotes.

## Owner decisions (24 Nov 2026)

1. Reading time: say **"One story a day"**, with no time. No minutes anywhere in Advent text.
2. Ship all app fixes before Sunday 29 Nov (Day 1). Marketing (flyer, ads, Meta copy) is
   updated later by the owner, not in this plan.
3. Keep all 26 stories for 2026. Story changes (Habakkuk for Philippians, Ezekiel balance,
   Mark 13 on the first Sunday, the 27-day 2027 length) wait for the 2027 edition.
4. O Antiphon prayers: our own translation from the Latin, exactly as in section B3.
5. Build the daily intro card and the key-verse highlight together with the Advent
   questions, so the week-coloured cards are designed once.
6. Earlier, locked in `MVP3/04-PLAN-QUESTIONS.md`: plan questions **replace** the general
   ones inside the plan; the card is **full colour** in the day's week colour; **three
   audiences** (Family, School, Small group), four questions each; Advent first.

Week colours: Hope #6A4C93, Peace #3F6FB5, Joy #C2507A, Love #8E3FA0
(`ChronologicalMappings.json` → `adventJourneyChronological.phases`).

## Releases

| Release | Contents | Ship by | How |
| --- | --- | --- | --- |
| **A — text fixes** | A1–A4 | **Sat 28 Nov** | OTA (`npm run update:production` and `:android`) |
| **B — Advent companion** | B1–B8 | **Sun 6 Dec** at the latest; the antiphon prayers (Day 19) must be live before **Thu 17 Dec** | OTA |

Both releases are JavaScript and data only: no native change, no store build.
Every change ships in English; the French fields are filled when the French release returns
(keep French keys in step so the existing key-parity test passes, copying English where
no French exists yet, as the app already does).

---

## Release A — text fixes before Day 1

### A1. Remove reading-time claims from Advent text
- `assets/data/UI-ENG.json` → `UI.advent.cardBody`:
  "26 days from promise to manger, one story a day to Christmas Eve."
- `UI.advent.notifWeekBody`: "Join 26 days of readings from promise to manger, one story a day."
- `assets/data/FRA-UI.json`: same two keys, French: "…un récit par jour jusqu'à la veille de Noël."
  and "…de la promesse à la crèche, un récit par jour."
- Leave `back2Body` ("One story takes about ten minutes.") for a separate app-wide pass;
  it is not Advent text. (Note it in the follow-ups list.)
- Test: extend the existing UI key test to assert no `UI.advent.*` string contains "minute".

### A2. Correct the plan description
In **both** `assets/data/ChronologicalMappings.json` (`adventJourneyChronological.longDescription`)
and `assets/data/ReadingPlansChallenges.json` (the `adventJourneyChronological` entry):

> The story of God's promise to be with us, one story a day from the first Sunday of Advent
> to Christmas Eve. Week 1 traces God's promise through Jesus' family line, week 2 listens to
> the prophets, and week 3 rejoices. From 17 December, seven ancient prayers of the church,
> the O Antiphons, lead day by day to Christmas Eve. On three of the four Sundays, the story
> holds the passage many churches read that day.

French (`longDescriptionFr`) translated to match. Test: both files carry the same English text.

### A3. More careful day notes
Edit `segments[].note` (and `noteFr`) in `ChronologicalMappings.json`. One line each, the
app's style. Only these days change:

| Day | New note |
| --- | --- |
| 1 | Advent begins by looking ahead: Christ will come again. "Come, Lord Jesus!" (22:20) |
| 3 | Count the stars: God's promise to Abraham (15:5), "father of a multitude of nations" (17:4) |
| 4 | "God will provide" — and through Abraham's family all nations will be blessed (22:8, 18) |
| 5 | Bethlehem, and a Moabite woman welcomed into the family line of David and Jesus (4:17) |
| 7 | Immanuel, and "a child is born" who will reign on David's throne (7:14; 9:6–7) |
| 13 | "A future and a hope", spoken to exiles, and the new covenant (29:11; 31:31) |
| 18 | "Rejoice!" — the words Gaudete Sunday is named after (4:4) |
| 19 | O Antiphon · O Wisdom — the Word who made all things became human (1:14) |
| 20 | O Antiphon · O Lord — God hears, comes down to rescue, and gives his name (ch. 3) |
| 21 | O Antiphon · O Root of Jesse — new life from Jesse's stump (11:1) |
| 22 | O Antiphon · O Key of David — a throne forever (7:16) · read in many churches today |
| 23 | O Antiphon · O Dayspring — "the Sun of Righteousness will rise" (4:2) |
| 24 | O Antiphon · O King of the Nations — "your king is coming", humble (9:9) |
| 25 | O Antiphon · O Emmanuel — "God is with us" (1:23) |
| 26 | Christmas Eve — Mary's song (1:46–55) and "The Savior… has been born today" (2:11) |

Test: `utils/planData.test.ts` already checks every plan reference; add a check that every
verse number cited in an Advent note lies inside that day's story range.

### A4. Release A
Typecheck, jest (`npx jest --watchAll=false`), web smoke check of the Advent card and plan
page, commit, push, then publish the OTA (owner runs it, or with the owner's go-ahead).
Owner checks on a phone: card text, plan description, day notes.

---

## Release B — the Advent companion

What a reader sees when a story is opened **from the Advent plan** (`planId` route param):

```
 ┌─ Intro card (week colour) ──────────────┐   top of the reader
 │ WEEK 1 · HOPE · DAY 3 OF 26             │
 │ ≤ 60-word introduction                  │
 │ TODAY'S KEY VERSE  (speaker colour)     │
 │ "Look up into the sky…"  Genesis 15:5   │
 │ [Find it in the story]                  │
 └─────────────────────────────────────────┘
   … the story, key verse marked in place …
 ┌─ Advent card (full week colour) ────────┐   replaces Talk about it
 │ Family · School · Small group           │
 │ four questions                          │
 │ Days 19–25: the O Antiphon prayer block │
 │ one-line closing                        │
 └─────────────────────────────────────────┘
```

Outside the plan (Read tab, search, other plans) the same story looks exactly as today.

### B1. Data: `assets/data/PlanCompanion.json`
One file, keyed by plan, then day number (not story id, so a story in two plans can differ):

```json
{
  "adventJourneyChronological": {
    "version": 1,
    "days": {
      "3": {
        "storyId": "S006",
        "intro": "…≤ 60 words…",
        "keyVerses": ["Gen-15-5"],
        "questions": {
          "family": ["…", "…", "…", "…"],
          "school": ["…", "…", "…", "…"],
          "smallgroup": ["…", "…", "…", "…"]
        },
        "closing": "…one line…",
        "antiphon": null
      }
    },
    "finish": { "title": "…", "body": "…", "nextPlanId": "christmas12" }
  }
}
```

- Key verses are **references only**; the text is read from the app's NLT data at runtime,
  so it is always exact and can be highlighted in place.
- `antiphon` on days 19–25: `{ "title": "O Wisdom", "prayer": "…", "sources": "…" }`.
- French: optional `introFr`, `questionsFr`, `closingFr`, `antiphon.prayerFr`; fall back to
  the general questions in French until written.

### B2. Content (written as a reviewable document first)
Produce `docs/advent/ADVENT-COMPANION-CONTENT.md` with all 26 days for the owner to approve
**before** it goes into `PlanCompanion.json`. Sources: ChatGPT's intro and reflection drafts,
corrected:
- Intros: ≤ 60 words; add on Day 1 "many churches hear Jesus' call to stay alert (Mark 13)"
  and "focus on chapters 21–22"; Day 3 uses 17:4, not "all nations" (that is Day 4, 22:18);
  Day 15 and Day 22 mention that many churches sing Mary's song today; Days 19–25 explain the
  antiphons were sung each evening before Mary's song; Day 26 names the Magnificat.
- Key verses: as in the review pack; add Isaiah 9:7 (Day 7) and Luke 1:46–47 (Day 26).
- Questions: Small group from ChatGPT's draft; Family simpler and concrete; School invitational
  (fine for a class with mixed beliefs). One question per line; vary the fourth question
  (pray, give thanks, notice, reconcile, act); fix ChatGPT's week groupings.
- Careful wording: "Matthew applies…", "Christians have long seen…", "points forward to";
  name first settings (Ahaz; the Servant as Israel and one who fulfils Israel's calling).
- Days 14 and 18 (nearly one voice): the intro says how four readers share the parts.
- Every quoted phrase is NLT wording. A script (`scripts/check-companion.mjs`) fails if any
  text in quotation marks is not found verbatim in that day's story, if a key-verse reference
  is outside the story, or if an intro exceeds 60 words.
- Recommended: two human readers from different traditions sign off before marketing to churches.

### B3. O Antiphon prayers (final wording, owner-approved)
| Day | Title | Prayer | Sources |
| --- | --- | --- | --- |
| 19 | O Wisdom | O Wisdom, who came from the mouth of the Most High, reaching from one end of creation to the other and ordering all things with strength and gentleness: come and teach us the way of understanding. | Sirach 24:3; Wisdom 8:1; John 1 |
| 20 | O Lord | O Lord and Ruler of the house of Israel, who appeared to Moses in the flame of the burning bush and gave him the law on Sinai: come and rescue us with your outstretched arm. | Exodus 3; 20 |
| 21 | O Root of Jesse | O Root of Jesse, standing as a sign for the peoples, before whom kings fall silent and whom the nations seek: come and set us free, and do not delay. | Isaiah 11:1, 10; 52:15 |
| 22 | O Key of David | O Key of David, sceptre of the house of Israel, you open and no one can shut, you shut and no one can open: come and lead the prisoners out of the prison house, those who sit in darkness and the shadow of death. | Isaiah 22:22; 42:7; Revelation 3:7 |
| 23 | O Dayspring | O Dayspring, radiance of eternal light and Sun of Righteousness: come and give light to those who sit in darkness and the shadow of death. | Malachi 4:2; Luke 1:78–79 |
| 24 | O King of the Nations | O King of the nations, the one they long for, the cornerstone who makes the two into one: come and save the people you formed from the dust of the earth. | Isaiah 28:16; Ephesians 2:14 |
| 25 | O Emmanuel | O Emmanuel, our King and Lawgiver, the hope of the nations and their Saviour: come and save us, Lord our God. | Isaiah 7:14; 33:22 |

Shown under the questions with the line "An ancient prayer of the church for these last days
of Advent. Pray it together." Translated by us from the public-domain Latin; no licensed text.

### B4. Loader: `utils/planCompanion.ts` (pure, tested)
- `getCompanionDay(planId, storyId, dayIndex?) → CompanionDay | null` — null for plans without
  companion content (every plan except Advent, for now) and for stories not in the plan.
- `weekColour(planId, dayIndex) → string` from the plan's phases.
- `utils/planCompanion.test.ts`: Advent day 3 resolves; Bible in 1 year returns null; every
  Advent day has 4 questions × 3 audiences, a ≤ 60-word intro, key verses inside the story;
  days 19–25 and only those have an antiphon.

### B5. Intro card: `components/thread/PlanIntroCard.tsx`
- Rendered at the top of `app/(tabs)/[segment]/index.tsx` when `getCompanionDay` returns a day.
- Full week colour, white text (check contrast with `utils/contrast.ts`, as `AdventInvite` does).
- Shows week and day ("Week 1 · Hope · Day 3 of 26"), the intro, the key verse text read from
  the Bible data in the speaker's voice colour with its reference, and **Find it in the story**.
- Open the first time per day (remember with `setAppState('companionIntroSeen:<plan>:<day>')`),
  collapsed to one line on later opens, tap to expand.

### B6. Key-verse highlight
- **Find it in the story** scrolls the reader to the key verse (reuse the existing
  `verse` / `locate` param handling in the reader) and pulses a highlight on that turn's bubble
  for about 2 seconds, plus a small persistent marker beside the verse while in plan context.

### B7. Advent card: replaces Talk about it in plan context
- In `app/(tabs)/[segment]/index.tsx`, when a companion day exists, render
  `components/thread/PlanQuestionsCard.tsx` instead of `TalkAboutCard`.
- Full week-colour card; audience chips (Family, School, Small group) inside, remembering the
  choice in the same `questionAudience` app state the general card uses; no set toggle.
- Four questions; the antiphon block on days 19–25 in a distinct inset style; the one-line closing.
- Outside the plan, `TalkAboutCard` is unchanged.

### B8. Finish screen and release
- When Day 26 is completed, the plan's completion view shows `finish.title` / `finish.body`
  (ChatGPT's closing reflection, trimmed to ≤ 80 words) and a button to start
  **12 Days of Christmas** (`christmas12`, which begins 25 December).
- Release B checks: `scripts/check-companion.mjs`, typecheck, jest, web check of Days 1, 18
  (one voice), 19 (antiphon) and 26 (Mary's song) in both themes, light and dark; then commit,
  push, OTA, and a phone check by the owner.

---

## Acceptance checks (a step is done only when every box is true)

**A1**
- [ ] The Advent home card reads "…one story a day to Christmas Eve." with no minutes.
- [ ] No `UI.advent.*` string in `UI-ENG.json` or `FRA-UI.json` contains "minute", "min" or "minutes".
- [ ] The new test fails if a minutes phrase is put back.

**A2**
- [ ] The plan page (Plans → Advent Journey) shows the new description in English and French.
- [ ] `ChronologicalMappings.json` and `ReadingPlansChallenges.json` carry identical English text (tested).

**A3**
- [ ] Days 1, 3, 4, 5, 7, 13 and 18–26 show the new notes; all other days are unchanged (diff shows only those segments).
- [ ] Day 3's note cites 17:4; "all nations blessed" appears only on Day 4.
- [ ] Every verse number in an Advent note lies inside that day's story (tested).

**A4**
- [ ] `npx tsc --noEmit` and `npx jest --watchAll=false` pass.
- [ ] Committed and pushed; OTA published for iOS and Android; `npm run ota:status` shows it.
- [ ] Owner confirms on a phone: card text, plan description, Day 1 and Day 19 notes.

**B2 — hard stop**
- [ ] `docs/advent/ADVENT-COMPANION-CONTENT.md` has all 26 days: intro, key verses, 12 questions, closing; Days 19–25 the antiphon; plus the finish text.
- [ ] `node scripts/check-companion.mjs` passes: every quoted phrase found word for word in that day's NLT story, every key verse inside the story, every intro ≤ 60 words.
- [ ] No two fourth questions on consecutive days are the same kind of question.
- [ ] **Stopped and asked the owner to approve.** Nothing from B1 onward starts until they say yes.

**B1 / B3**
- [ ] `PlanCompanion.json` holds exactly the approved text from B2 (no rewording during entry).
- [ ] Days 19–25 hold the B3 antiphon wording exactly; no other day has an antiphon.
- [ ] Key verses are references only; no Bible text is stored in the file.

**B4**
- [ ] `getCompanionDay('adventJourneyChronological', 'S006', 2)` returns Day 3.
- [ ] Any other plan (e.g. Bible in 1 year) returns null.
- [ ] Tests cover: 26 days, 3 audiences × 4 questions each, intros ≤ 60 words, key verses in range, antiphons on 19–25 only, week colours (Day 1 Hope #6A4C93, Day 8 Peace #3F6FB5, Day 15 Joy #C2507A, Day 22 Love #8E3FA0).

**B5**
- [ ] Opening Day 3 from the Advent plan shows the intro card in Hope purple with "Week 1 · Hope · Day 3 of 26".
- [ ] The key verse text matches the reader's NLT text exactly and uses the speaker's colour.
- [ ] First open: expanded. Second open the same day: one collapsed line that expands on tap.
- [ ] Opening the same story from the Read tab or search shows no intro card.
- [ ] Text contrast passes `utils/contrast.ts` for all four week colours.

**B6**
- [ ] Tapping **Find it in the story** scrolls to the key verse and pulses it for about 2 seconds, on web and phone.
- [ ] The small marker stays beside the verse in plan context and is absent outside it.

**B7**
- [ ] In plan context the Advent card (full week colour) replaces Talk about it; outside it, Talk about it is unchanged.
- [ ] Family, School and Small group chips switch the four questions; the choice is remembered (shared `questionAudience`).
- [ ] Day 19 shows the O Wisdom prayer with the line "An ancient prayer of the church…"; Day 18 and Day 26 show no prayer.
- [ ] Bible in 1 year still shows the normal questions with the set toggle for the same story.

**B8**
- [ ] Completing Day 26 shows the finish title and body (≤ 80 words) and a button that starts 12 Days of Christmas.
- [ ] Web check of Days 1, 18, 19 and 26 in light and dark themes; screenshots attached to the commit message or PR notes.
- [ ] Checks pass, committed, pushed, OTA published; owner confirms on a phone.

## Order of work

1. Release A (A1–A4) — before Sat 28 Nov.
2. B2 content document — **hard stop**: the owner approves it before anything else in Release B.
3. B1, B3, B4 data and loader.
4. B5–B7 cards and highlight.
5. B8 finish screen, checks, Release B OTA (before 6 Dec if possible; antiphons before 17 Dec at the latest).

## Not in this plan

- Marketing updates (flyer headline, first-wave ad endings, Meta copy) — the owner, later.
- 2027 edition: Habakkuk for Philippians, Ezekiel balance, Mark 13 on the first Sunday,
  27 days in 2027 and 22 in 2028.
- Companion content for the other themed plans (Lent, Christmas 7 and 12, Women of the Bible,
  David's Life, God's Story, In the Beginning, Paul's Letters, The Gospels).
- The app-wide "about ten minutes" line in the come-back reminder (`UI.reminders back2Body`).
