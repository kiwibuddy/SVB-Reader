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
| A | W4 After a story: stay put, up-next card, plan-order arrows | done | `1ec87b0` | `utils/storyOrder.test.ts` proves Advent Day 8 → Day 9; visual check with W5 |
| A | W5 Journey view for started plans, plan page in plan order, no long-press start | pending | | |
| A | W6 Onboarding Save demo style helper | pending | | |
| B | W7 A streak that forgives | pending | | |
| B | W8 Reminders that work | pending | | |
| C | W9 Follow-a-voice plans | pending | | |
| C | W10 Apply updates sooner | pending | | |
| D | W11 Bible text out of the update bundle | pending | | Behind a flag, off by default |

## Release readiness

| Release | Ready to publish | Checked in container | Needs a real device |
| --- | --- | --- | --- |
| A | no | | |
| B | no | | |
| C | no | | |
| D | no | | |

## Log

- 17 Nov — W4 done (tests, typecheck, lint clean for new code).
- 17 Nov — W2 typecheck clean; W3 done.
- 17 Nov — W2 committed mid-way after an interrupted check; typecheck outstanding.
- 17 Nov — progress file created. Advent videos rendered (`Marketing/ads/out/`).
