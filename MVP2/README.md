# MVP2

Everything needed to take SourceView Together from its current blocked state to
a redesigned, shippable v2.

Assembled 17 August 2026 against `Nov-New-Build-` @ `f07b650`.

## Read in this order

| File | What it is |
| --- | --- |
| [`08-BUILD-QUEUE.md`](08-BUILD-QUEUE.md) | **START HERE. The one ordered list — work top to bottom.** Everything else is reference. |
| [`01-CRITICAL-PATH.md`](01-CRITICAL-PATH.md) | The store blockers. **Phase 0 complete as of 19 Aug** — kept as the record of what was done. Formerly: The store blockers, in the order they must be done. Nothing else ships until this is clear. |
| [`02-DEV-SETUP.md`](02-DEV-SETUP.md) | Getting the project running again in Cursor — install, run, test, build. |
| [`03-DESIGN-DIRECTION.md`](03-DESIGN-DIRECTION.md) | The chosen design direction, the data behind it, and the decisions still open. |
| [`04-PRD-AND-ROADMAP.md`](04-PRD-AND-ROADMAP.md) | **The product spec and phased build plan.** Scope, screen-by-screen acceptance criteria, estimates, risks, and the decision register. |
| [`05-GROUP-READING.md`](05-GROUP-READING.md) | How group reading works without coordination software. Resolves the biggest open decision. |
| [`06-COMPLETION-AND-REMOVAL.md`](06-COMPLETION-AND-REMOVAL.md) | Everything the QR removal touches — 29 files, 2 tables, 30 translation keys — and what story completion becomes. |
| [`07-BUILD-REVIEW.md`](07-BUILD-REVIEW.md) | **Current punch list.** Device testing 19 Aug: what is built, what is broken, and the revised remaining work. |
| [`audit/maintenance-audit.html`](audit/maintenance-audit.html) | Full maintenance audit. Open in a browser. |
| [`mockups/`](mockups/) | Design mockups. Open in a browser — no build step. |

**Current state of the build** is in `07-BUILD-REVIEW.md` — start there if you
are picking up work.

**Authoritative figures** live in `03-DESIGN-DIRECTION.md` (data) and
`06-COMPLETION-AND-REMOVAL.md` (removal scope and cost). `mockups/01-three-directions.html`
predates two data corrections and is kept only as a record of the exploration —
its word counts are wrong. See the banner at the top of that file.

## The one thing to know first

**You have been working from the wrong branch.**

`main` is a dead 19-month-old snapshot of the pre-rebrand app — still named
SVB-Youth, bundle identifier `"y"`, no French, no native projects, Expo SDK 52.
It is **156 commits behind** the real app.

The real app is **`Nov-New-Build-`** — SourceView Together v1.2.1, build 20,
`com.sourceview.together`, French included, native `ios/` and `android/`
directories committed, Expo SDK 53. Last commit 19 November 2025.

`Nov-New-Build-` is a strict descendant of `main`, so merging it into `main` is
a fast-forward with no conflicts. **Do that first** — see step 0 of the critical
path. Every branch in this repo except `Nov-New-Build-` sits on the abandoned
codebase.

## Status at a glance

| | |
| --- | --- |
| Expo SDK | 53 — four majors behind 57 |
| iOS submission | **Blocked** since 28 April 2026 |
| Android update gate | **31 August 2026** — API 36 required |
| New Architecture | Already on. Nothing to do. |
| Design direction | Chosen: Thread. Two decisions outstanding. |

## The shape of the plan

```
Step 0    Merge Nov-New-Build- into main                    ½ day
Step 1    Reconcile versions and the manifest               1 day
Step 2    Decide managed vs bare  ← the fork in the road    1 day
Step 3    Upgrade to SDK 57, target API 36                  2-3 days
Step 4    Clear the fallout (edge-to-edge, Reanimated 4)    3-5 days
Step 5    Test on real hardware, both platforms             2 days
--------------------------------------------------------------------
          Ship a compliant 1.3.0. Only then start MVP2 design work.
```

**Phase 0 shipped.** SDK 57, RN 0.86.2, managed workflow, group machinery gone.
Remaining build work is **31.5–36.5 days** — see
[`08-BUILD-QUEUE.md`](08-BUILD-QUEUE.md), which is authoritative for order and
estimate.

**Group reading is resolved:** it stays, but the QR and host/join machinery goes
— the four colours already are the mechanism. See
[`05-GROUP-READING.md`](05-GROUP-READING.md).

**Two decisions still open:** the division titles, and whether to promote figures
out of the blue source group. Both block Phase 1 only.

*(Historic: design work did begin before Phase 0 finished, which cost some
debugging time. Phase 0 is now done and the point is moot.)*
