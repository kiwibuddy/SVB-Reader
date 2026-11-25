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

### Fixes (done on `ota/advent`)

1. `christmas7.title` → **"7 Days of Christmas"** / **"7 jours de Noël"**; mapping title matched.
2. Unused `UI.plans` block removed from `UI-ENG.json` and `FRA-UI.json`.
3. 12 Days `longDescription`: "traditional feasts" → "feasts … as many churches do,"
   (EN + FR). (Western calendar; Orthodox Christmas is 7 Jan.)

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
