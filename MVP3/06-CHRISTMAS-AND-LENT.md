# Christmas plans and Lent: status and app fixes

Written 25 Nov 2026. Christmas: small text fixes, can go in Advent Release A or B.
Lent: needs a rebuild before it is offered on 1 February 2027.

## Christmas plans: checked against the Advent changes

Both plans (`christmas7`, `christmas12`) were rebuilt on 17 Nov with Advent. Checked
again on 25 Nov:

- Dates: 7 Days runs 19–25 Dec, 12 Days 25 Dec – 5 Jan (`utils/seasonalPlans.ts`). Right.
- Day notes: every quoted phrase is NLT word for word and every verse cited is
  inside that day's story. Right.
- No reading-time claims in either plan's text.
- Stories: the owner decided to keep all 12 Days stories for 2026, including the
  four that repeat Advent (Luke 1–2, John 1, Matthew 1–4, Isaiah 58–62).

### Fixes for the builder

1. `ReadingPlansChallenges.json` → `christmas7.title` is "🎄 7 Days of Christmas Story 🌟".
   Change to **"7 Days of Christmas"** to match the other plans (and the French
   title in `FRA-UI.json` → `UI.plans.christmas7.title`: "7 jours de Noël").
   Also `ChronologicalMappings.json` → `christmas7Chronological.title`
   "7 Days of Christmas Story" → "7 Days of Christmas".
2. `UI-ENG.json` → `UI.plans` holds stale, unused strings ("Advent Journey · 16 Stories",
   "12 Days of Christmas · 6 Stories"). No code reads `UI.plans`; delete the block
   from `UI-ENG.json` and `FRA-UI.json`, or correct the counts if it is kept.
3. 12 Days `longDescription` (both files): "Keep the traditional feasts of St Stephen,
   St John and the Holy Innocents" → "Keep the feasts of St Stephen, St John and the
   Holy Innocents, as many churches do,". (Western calendar; Orthodox Christmas is 7 Jan.)

Checks: `npx jest --watchAll=false` (`utils/planData.test.ts` covers the plans).

The in-app companion (intro, key verse, plan questions) stays Advent-only for now,
as decided in `04-PLAN-QUESTIONS.md`.

## Lent: needs a rebuild (next)

`lentenReflectionChronological` is listed in `KNOWN_BROKEN` in `utils/planData.test.ts`:

- Its 21 entries use **old story numbers**. Every entry points at the wrong story:
  e.g. entry 1 says Matthew 3 (Jesus' baptism) but S267 is the Sermon on the Mount;
  entry 18 says John 17 but S306 is the crucifixion.
- No day notes, no dates. Eight phases with stock colours.
- 21 stories over "3 weeks", while Lent 2027 runs from Ash Wednesday, 10 February,
  to Easter Day, 28 March (46 days, or 40 without Sundays).

The catalogue offers it from 1 February. It needs a curated rebuild the way
Advent had: a decision on length and shape first, then stories, notes, dates and
tests. Proposal to follow.
