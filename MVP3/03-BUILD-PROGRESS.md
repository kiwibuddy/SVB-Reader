# Build progress — post-Advent plan

Tracks the build of [`02-POST-ADVENT-BUILD-PLAN.md`](./02-POST-ADVENT-BUILD-PLAN.md).
Updated and pushed after every work item, so an interrupted build can resume from
the last row marked **done**. Branch: `claude/advent-reading-plan-review-81kch8`.

**To resume:** find the first item not marked done, read its section in the plan,
check `git log` for a partial commit, and carry on.

## Status

| Release | Item | Status | Commit | Notes |
| --- | --- | --- | --- | --- |
| A | W0 Season reset for plans left unfinished last year | done | `130c2c0` | |
| A | W1 SQL string literals in double quotes | done | `1ab28d0` | 14 queries; `api/sqlQuoting.test.ts` guards it |
| A | W2 Stories read inside a plan count everywhere | done | `96817ad` | Backfill SQL checked against the real schema; typecheck clean |
| A | W3 Finishing a story keeps a plan's status | done | `51bc0d3` | Upsert simulated on the real schema |
| A | W4 After a story: stay put, up-next card, plan-order arrows | done | `1ec87b0` | Browser check: Advent S199 → S257, Bible S199 → S200; Up next card shows after Done |
| A | W5 Journey view for started plans, plan page in plan order, no long-press start | done | `5686251` | One start flow (`hooks/useStartPlan.ts`); Advent card "See the plan"; reminders open `/plan/adventJourneyChronological` |
| A | Extra: Old/New Testament progress always 0 | done | `ec501e8` | Found in the browser check; book list bound twice. `api/testamentProgress.test.ts` |
| A | W6 Onboarding Save demo style helper | done | `9b981d2` | RN 0.86 phones lack the helper; web still has it, so check on a device. Guard test in `api/sqlQuoting.test.ts` |
| B | W7 A streak that forgives | done | `f76bc2b` | `utils/streak.ts` + 25 tests; browser walk over faked days (read 14–16 Nov, skip 17th, covered on 18th). Also fixed: first read on install day not counted; completion banner squeezed into the Done button. Heatmap rest marks skipped (heatmap is by story, not date) |
| B | W8 Reminders that work | done | `809290c` | `utils/reminderPlan.ts` + 16 tests; time sheet checked in browser (8:15 PM saved). Advent `dailyOverride` removed, teasers unchanged |
| C | W9 Follow-a-voice plans | done | `7fb39d4` | `utils/voicePlans.ts` + 6 tests; browser: Moses → "Follow Moses" (33 stories) opens expanded; story opens with `voice=Moses`; "Open your plan" after reload |
| C | W10 Apply updates sooner | done | `ef72b0d` | `utils/otaPolicy.ts` + 6 tests. Browser: onboarding still lands on today's story, returning user on Home (updates can't run on web). Only helps people who already have this update |
| D | W11 Bible text out of the update bundle | pending | | Behind a flag, off by default |

## Release readiness

| Release | Ready to publish | Checked in container | Needs a real device |
| --- | --- | --- | --- |
| A | **yes** — JS only, no native change | 139 tests pass; `tsc` clean outside `Marketing/`; lint shows only the 6 errors that were already there; browser check of Plan tab, plan page, Read tab card, arrows, Up next, You tab | Onboarding Save demo (last page); late-join "today or Day 1" question (alerts don't show on web); tapping an Advent reminder opens the plan page |
| B | **yes** — JS only, no native change | 182 tests pass; `tsc` clean outside `Marketing/`; lint: only errors that were already there; browser walk of streak across faked days, banner, You ring, weekly goal, time sheet | Set the reminder 2 minutes ahead and check text + tap target in English and French; miss a day and confirm the streak holds; check the 20:00 streak nudge |
| C | **yes** — JS only, no native change | 195 tests pass; `tsc` clean outside `Marketing/`; lint: only errors that were already there; browser: Follow a voice end to end, onboarding and start-up routes | Publish an update, background the app 30+ minutes on a list screen, return: it should reload; in a story it should not. Finish onboarding with an update waiting |
| D | no | | |

## Log

- 17 Nov — W10 done. **Release C ready.**
- 17 Nov — W9 done.
- 17 Nov — W8 done. **Release B ready.**
- 17 Nov — W7 done. Two existing bugs found in the browser walk and fixed (see W7 row).
- 17 Nov — W6 done. **Release A ready.** Note: the web preview needs a restart to pick up edits (`CI=1` turns off file watching).
- 17 Nov — W5 done; browser check of Plan tab, plan page, Read tab card, arrows and Up next. Found and fixed testament progress bug.
- 17 Nov — W4 done (tests, typecheck, lint clean for new code).
- 17 Nov — W2 typecheck clean; W3 done.
- 17 Nov — W2 committed mid-way after an interrupted check; typecheck outstanding.
- 17 Nov — progress file created. Advent videos rendered (`Marketing/ads/out/`).
