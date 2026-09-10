# Where every number in these documents comes from

Checked 1 Sep 2026 against the shipping data in this repo. If a figure changes in
the app, change it here first, then in the HTML.

## What lives where

| Asset | Where | Format |
| --- | --- | --- |
| Schools / youth flyer | `print/leader-flyer-schools.html` | One A4 page, print |
| YWAM DTS flyer | `print/leader-flyer-dts.html` | One A4 page, print |
| Schools guide | `site/leader-guide-schools.html` | Continuous web page |
| Landing page | `site/index.html` | Web |

The schools guide used to be a five-page A4 document. It is now a scrolling web
page sharing the landing page's stylesheet, so there is one link to send rather
than an attachment to email. The flyers stay as print, because a flyer's whole
job is to be handed to someone.

## Rendering the flyers

```bash
cd Marketing/print
open leader-flyer-schools.html   # File > Print > A4, margins None,
open leader-flyer-dts.html       # "Background graphics" ON
```

Or from the command line, which is what produced the PDFs in this folder:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless --no-pdf-header-footer \
  --print-to-pdf=leader-flyer-dts.pdf "file://$PWD/leader-flyer-dts.html"
```

## Claims

| Claim | Value | Source |
| --- | --- | --- |
| Stories | 365 | `assets/data/SegmentReadingTimes.json`, keys S001–S365 |
| Median story length | 10 min | Same file. Mean 9.6, range 2–14 |
| Longest story | 14 min | Same file |
| Stories 12 min or under | 314 of 365 | Same file |
| Reading-time histogram (p3) | 2:2 · 3:1 · 4:6 · 5:15 · 6:24 · 7:31 · 8:45 · 9:39 · 10:58 · 11:47 · 12:46 · 13:34 · 14:17 | Same file |
| 100% of the biblical text | verified | Traced all 365 reference ranges end to end across all 66 books. Continuous from Gen 1:1 to the end of Revelation, including stories that span book boundaries (S096 runs 1Sa 31:1 → 2Sa 2:7; S115 runs 1Ki 22:41 → 2Ki 3:27) |
| School-year plan | 180 stories, ~29 hours | `ReadingPlansChallenges.json`, plan `SchoolYear1`; hours are the sum of its stories' reading times |
| Plans available year round | 11 | `ReadingPlansChallenges.json` minus the hidden IDs in `utils/planCatalog.ts` (`SchoolYear2`, `SchoolYear3`, `test`, `jesusFilm`) and minus the four date-gated seasonal challenges. 15 including seasonal |
| Over 700 people speak | 769 | `assets/data/conversations.json`, excluding the four narration voices |
| Questions per story | 4, in three audience sets | `FamilyQuestions.json`, `SchoolQuestions.json`, `SmallGroupQuestions.json` — set 1 covers all 365 |
| The Flood question examples | verbatim | Same three files, segment S003 |
| Genesis 3 passage on page 2 | verbatim | `assets/data/newBibleNLT1.json`, segment S002, via `Marketing/ads/scripts/dump-segment.mjs` |
| Free, no accounts, offline | verified | No auth or cloud sync anywhere in the app; `services/BibleLoader.ts` bundles the English NLT |

## Claims specific to the DTS flyer

| Claim | Value | Source |
| --- | --- | --- |
| Old Testament Journey | 57 stories, 11 weeks | `ReadingPlansChallenges.json`, `oldTestamentJourney` — the plan's own description reads "57 Stories - 11 Weeks" and the contents match |
| — five a week | 57 ÷ 11 = 5.2 | Same. Close enough to one per weekday to say so |
| — 8.9 hours total | 535 min | Sum of its stories in `SegmentReadingTimes.json` |
| — 22 books, Genesis to Habakkuk | verified | Gen 6, Exo 5, Lev 1, Num 1, Deu 3, Jos 2, Jdg 2, Rut 1, 1Sa 3, 2Sa 1, 1Ki 3, 2Ki 2, Neh 2, Psa 6, Pro 1, Isa 6, Jer 4, Eze 3, Dan 2, Joe 1, Jon 1, Hab 1 |
| — nothing over 13 minutes | verified | Longest is *Israel's Idolatry & God's Mercy*, 13 min |
| New Testament Journey | 40 stories, 8 weeks | `newTestamentJourney` — description reads "40 Stories - 8 Weeks" |
| — five a week | 40 ÷ 8 = 5.0 | Same |
| — 6.3 hours total | 376 min | Sum of its 40 stories |
| — 10 books, Luke to Revelation | verified | Luk, Act, Rom, 1Co, Eph, Tit, Jam, 1Pe, 1Jn, Rev |
| — each book opens with an introduction | verified | The plan holds 50 entries: 40 stories plus 10 `I`-prefixed book introductions |
| Combined 97 stories, 19 weeks, ~15 hours | 911 min | The two sums added |

**The DTS phase mapping is an observation, not a claim about the app.** A DTS is
commonly around twelve weeks of lecture phase followed by eight to twelve weeks
of outreach; the two plans were built to their own lengths and happen to land
there. The flyer says "happen to be the length of", which is the honest framing —
do not rewrite it as "designed for a DTS".

**Do not quote a reading time for the book introductions.** The `I` entries carry
plainly wrong figures in `SegmentReadingTimes.json` — *Introduction to Luke* is
listed at 113 minutes and *Introduction to Acts* at 105, which look like whole-book
times rather than introduction times. The flyer mentions the introductions exist
and gives no duration for them.

## What the old deck claimed that these do not

The 2024 *"A NEW Bible reading experience designed specifically for student
communities"* PDF is superseded by `leader-guide-schools.html`. Three of its
claims were wrong and must not come back.

**"15–20 minutes each."** The real range is 2–14 minutes, median 10. This error
worked against the product twice over: it was false, and it made the stories
sound too long for a single period when fitting a period is the entire pitch.

**"Achievement System — reading streaks and milestone badges."** There is a
complete Achievements screen at `app/(tabs)/Achievements.tsx`, but it is
registered with `href: null` in `app/(tabs)/_layout.tsx` and nothing in the UI
links to it. Streaks are real and appear on the You tab; **badges are not
reachable** and must not be advertised. The same overclaim appears in
`app/About.tsx` and should be fixed there.

**"11 reading plans"** was right by luck — it matches the year-round count, but
the deck listed *The Gospels* at 42 stories and implied the others were similar.
Two challenges have descriptions that disagree with their own contents:
*Paul's Letters* says 35 stories and holds 27, *David's Life* says 35 and holds
46. Both are left out of the new documents until the data is corrected.

Two claims from the old deck were checked and **do** hold: 100% biblical
coverage, and the three question sets.

## Never put in a leader document

Audio or "listen along" · French (the `FRENCH_ENABLED` flag is `false`) ·
accounts, sync or cross-device progress · networked group sessions, PINs or QR
codes · highlights or bookmarks (reactions and notes are the real feature) · AI ·
badges or achievements · "774 voices" — `APP_DESCRIPTION.md` and the You tab say
774, `conversations.json` holds 773 and the Cast screen counts 769. Say "over
700" until the three agree.
