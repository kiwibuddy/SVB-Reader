# MVP2

Everything needed to take SourceView Together from its current blocked state to
a redesigned, shippable v2.

Assembled 17 August 2026 against `Nov-New-Build-` @ `f07b650`.

## Read in this order

| File | What it is |
| --- | --- |
| [`01-CRITICAL-PATH.md`](01-CRITICAL-PATH.md) | **Start here.** The store blockers, in the order they must be done. Nothing else ships until this is clear. |
| [`02-DEV-SETUP.md`](02-DEV-SETUP.md) | Getting the project running again in Cursor — install, run, test, build. |
| [`03-DESIGN-DIRECTION.md`](03-DESIGN-DIRECTION.md) | The chosen design direction, the data behind it, and the decisions still open. |
| [`04-PRD-AND-ROADMAP.md`](04-PRD-AND-ROADMAP.md) | **The product spec and phased build plan.** Scope, screen-by-screen acceptance criteria, estimates, risks, and the decision register. |
| [`audit/maintenance-audit.html`](audit/maintenance-audit.html) | Full maintenance audit. Open in a browser. |
| [`mockups/`](mockups/) | Design mockups. Open in a browser — no build step. |

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

Then five build phases, 19-25 working days — see
[`04-PRD-AND-ROADMAP.md`](04-PRD-AND-ROADMAP.md) §8.

**Three decisions are unresolved and block estimation:** whether group reading
stays, the division titles, and whether to promote figures out of the blue
source group. All three are in the decision register.

Do not start design work before step 5. A redesign landing on top of an
unbuildable app means every failure has two possible causes.
