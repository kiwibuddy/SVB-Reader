# Post-Advent build plan — bug fixes, plan journey, reminders, streaks, voice plans

Written 17 Nov 2026 against branch `claude/advent-reading-plan-review-81kch8` at commit `ae8820b`.
Line numbers below are from that commit and will drift; function names are the stable reference.

This document is self-contained. Someone who has not seen the conversation that produced it
should be able to build every item from it.

---

## 0. Where things stand

| | |
| --- | --- |
| Live store builds | 2.0.0 — iOS build 26, Android version code 25 (`scripts/ota-targets.json`) |
| Live OTA | "Advent 2026" published 17 Nov from commit `2afe58c` (+ `8368b97` label fix) |
| `release/2.0.0` | `8368b97` — everything that is live |
| This branch | `release/2.0.0` + `130c2c0` (season-reset fix, **not yet published**) |
| Tests | 126 Jest tests pass |

**Dates that matter:** Sun 22 Nov (first Advent teaser fires), Sun 29 Nov (Advent Day 1), Thu 24 Dec (Day 26).

### What the owner asked for

Bugs 1–7, improvements 1–4, two features, and one new request (see the full plan of a started plan).
Mapped to work items:

| Asked for | Work item |
| --- | --- |
| Bug 1 — plan reads don't count elsewhere | W2 |
| Bug 2 — Done button navigates late / double-tap | W4 |
| Bug 3 — finishing a story un-pauses a plan, erases start date | W3 |
| Bug 4 — streak reminder only fires if app was opened | W8 |
| Bug 5 — onboarding style helper no longer exists | W6 |
| Bug 6 — long-press starts a plan | W5 |
| Bug 7 — non-standard SQL quoting | W1 |
| Improvement 1 — smaller updates | W11 (optional; numbers corrected, see W11) |
| Improvement 2 — apply updates on first launch | W10 |
| Improvement 3 — better reminders | W8 |
| Improvement 4 — offer what's next after a story | W4 |
| Feature — a streak that forgives | W7 |
| Feature — "Follow a voice" plans | W9 |
| New — see the whole journey of a started plan | W5 |

Found while planning, included because the work above depends on them:

- **Reader ‹ › arrows ignore plan order** (W4). In a plan they walk the book-grouped list, so in Advent
  the › arrow skips days. In custom plans there are no arrows at all.
- **The plan detail page shows stories in Bible order, not plan order** (W5). After finishing an Advent
  story the app lands on a list grouped by Bible division, without weeks, dates or notes.

Not in scope (not selected): accessibility + French pass, Lent rebuild (must happen before 1 Feb 2027),
listen mode, widgets, "year in voices". See §15.

---

## 1. Ground rules for the build

1. **Branch.** Work on `claude/advent-reading-plan-review-81kch8`. Commit per work item. Push after each.
   Do not push to `release/2.0.0` or `main` without the owner saying so.
2. **JS only.** Everything here must run on the existing 2.0.0 binaries. **Add no native dependency**
   (nothing that needs autolinking). Do not change `app.json`, `eas.json` or `package.json` dependencies.
   Usable native modules already in the binary: expo-notifications, expo-updates, expo-asset,
   expo-file-system, expo-sqlite, expo-haptics, expo-sharing, react-native-view-shot,
   `@react-native-community/slider`, `@react-native-picker/picker`, AsyncStorage.
3. **Publishing is the owner's step**, from their Mac, via `npm run update:production -- -m "…"` and
   `npm run update:production:android -- -m "…"`. The cloud container has no Expo login. Never commit a
   changed `app.json`; the publish script refuses to run if it is dirty.
4. **English and French for every new string.** Add to both `assets/data/UI-ENG.json` and
   `assets/data/FRA-UI.json` under `UI.*`. A test (`utils/planData.test.ts`) already asserts
   `UI.advent` has the same keys in both; add the same assertion for each new section.
   Interpolation is i18next style: `{{name}}`.
5. **Preserve data-file formatting** so diffs stay small:
   - `UI-ENG.json`, `FRA-UI.json`: `json.dumps(indent=2, ensure_ascii=False)` + trailing newline.
   - `ChronologicalMappings.json`: same, **no** trailing newline.
   - `ReadingPlansChallenges.json`: same, but non-breaking spaces must stay written as ` `.
6. **Pure logic gets pure functions and Jest tests.** Date rules, reminder planning, streak rules and
   story-order helpers must not import the database or React, so they can be tested with fixed dates.
   Follow the pattern of `utils/seasonalPlans.ts` and `utils/adventReminders.ts`.
7. **Never use UTC for calendar days.** Use `utils/localDate.ts` (`localCalendarDate`, `addLocalCalendarDays`,
   `daysBetweenLocalDates`). `toISOString().split('T')[0]` is wrong for anyone east or west of Greenwich.
8. **Commit messages**: imperative, explain why. No model names in commits, code or docs.

### Verification recipes

```bash
npx jest --ci                                            # all tests
NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .   # needs the big heap (15 MB Bible JSON)
npx eslint <changed files>
```

Known baseline noise (not ours): `tsc` errors under `Marketing/ads/*` (remotion not installed) and two
`absoluteFillObject` errors in `components/onboarding/OnboardingDemos.tsx` (W6 removes those).
`eslint` reports two existing `react-hooks/set-state-in-effect` errors in `components/thread/ThreadList.tsx`.

**Browser preview** (the only way to see screens in the container). Append this to `metro.config.js`
*temporarily* — **never commit it**:

```js
config.resolver.assetExts.push('wasm');
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  return middleware(req, res, next);
};
```

Then `CI=1 BROWSER=none npx expo start --web --port 8099 --clear` and drive it with Playwright
(pre-installed; `chromium.launch()` needs no options) at 390×844:
load `/`, wait ~20 s for the first bundle, click "Skip" on onboarding, then `goto('/plan')`, `/Home`, etc.
Each browser context is a fresh install (no saved data). `page.clock.install({ time })` +
`page.clock.runFor(ms)` fakes the date (e.g. 6 Dec) — use it for every date-dependent screen.
Notifications and native alerts do not exist on web; test their *planning* in Jest.

Until W1 lands, the web build logs SQL errors (`no such column: "plan"`) and plan progress does not
work there. **Do W1 first** so the browser preview can exercise plan flows.

---

## 2. Build order and releases

Three OTA releases, smallest risk first. Each release is independently shippable.

| Release | Target publish | Work items | Why this grouping |
| --- | --- | --- | --- |
| **A — "Advent readers"** | by Fri 20 Nov | W0 (done), W1, W2, W3, W4, W5, W6 | Everything an Advent reader touches from Day 1 |
| **B — "Habit"** | 24–27 Nov | W7, W8 | Streak and reminders share logic; ship together, after A has settled |
| **C — "Explore"** | early Dec | W9, W10 | Independent; no deadline |
| **D — optional** | with a 2.0.1 store build | W11 | Highest risk, modest gain; needs device testing on both platforms |

Within Release A build in this order: W1 → W2 → W3 → W4 → W5 → W6.

---

## 3. W0 — Season reset for plans left unfinished last year (DONE, unpublished)

Commit `130c2c0`. `purgeChallengeProgressBefore` in `api/sqlite.ts` now decides a status row is stale by
`COALESCE(lastUpdated, startDate) < cutoff` instead of `startDate`, because completing a story rewrites
the status row without its start date (W3). Ships with Release A. Nothing more to do.

---

## 4. W1 — SQL string literals in double quotes (bug 7)

**Problem.** Standard SQL uses single quotes for strings; double quotes mean identifiers. SQLite tolerates
`"plan"` as a string only as a legacy fallback. The web SQLite build rejects it, and a future expo-sqlite
could too — at which point plan lists and progress rings silently return nothing.

**Where.** 14 occurrences: 12 in `api/sqlite.ts`, 2 in `api/database-diagnostics.ts`. Find them with:

```bash
grep -rnE "(LIKE|=) \"[A-Za-z%]+\"" --include=*.ts api utils
```

Examples: `segmentID NOT LIKE "I%"`, `itemType = "plan"`, `itemType = "challenge"`.

**Fix.** Replace each with single quotes. Where the SQL is inside a single-quoted JS string, switch the
JS string to a template literal or double-quoted JS string rather than escaping.

**Test.** New `api/sqlQuoting.test.ts`: read every `.ts` file under `api/` and `utils/` (skip `*.test.ts`)
and assert no match for `/(?:LIKE|=|<>|!=)\s*"[A-Za-z%_ ]+"/`. This is a source scan, not a DB test.

**Accept.** Grep returns nothing; the web preview console shows no `no such column` errors on `/Home`,
`/plan`, `/you`.

---

## 5. W2 — Stories read inside a plan count everywhere (bug 1)

**Problem.** `markSegmentComplete` (`api/sqlite.ts:82`) writes the overall "read" table
(`completedSegments`) only for contexts `main` and `today`. A story finished inside a plan or challenge
is recorded only in `reading_plan_progress` / `reading_challenge_progress`. Everything that asks "has
this story been read?" reads `completedSegments`:

- Read tab ticks and the Continue card (`utils/threadProgress.ts:9`, `utils/continueTarget.ts`). After a
  plan reading, Continue points back at the story just finished.
- You tab story count, Old/New Testament rings, voices met, colour mix (`app/(tabs)/you.tsx`,
  `utils/voicesMet.ts:33,63`, `utils/youInsights.ts`).
- "X of 774 voices" on the completion banner.
- The first-story reminder prompt and the review prompt (`components/CheckCircle.tsx`, which checks
  `completed.size === 1` and `completedCount`).

**Fix — going forward.** In `markSegmentComplete`, move the `INSERT OR REPLACE INTO completedSegments`
out of the `main`/`today` branches so it runs for **every** context. Plan-specific progress stays as is
(a plan still tracks its own ticks, so re-reading a story inside a new plan works).

**Fix — history (one-time backfill).** Add `backfillPlanReadsToOverall()` to `api/sqlite.ts`, call it from
`runSchemaMigrations()` in `services/app-startup-manager.ts`, guarded by `getAppState('migration.planReadsBackfill.v1')`
(set to `'done'` afterwards with `setAppState`). It must run **before** the season purge; it does, because
`initializeAppSystems()` completes before `app/_layout.tsx` calls `refreshSeasonalProgress()`.

```sql
INSERT OR IGNORE INTO completedSegments (segmentID, isCompleted, completionDate)
SELECT segmentID, 1, MIN(completionDate) FROM (
  SELECT segmentID, completionDate FROM reading_plan_progress      WHERE isCompleted = 1
  UNION ALL
  SELECT segmentID, completionDate FROM reading_challenge_progress WHERE isCompleted = 1
  UNION ALL
  SELECT segmentID, completionDate FROM segment_completion
   WHERE completionType IN ('plan', 'challenge')
)
WHERE segmentID LIKE 'S%' OR segmentID LIKE '%-S%'
GROUP BY segmentID;
```

Then, because a row may already exist with `isCompleted = 0`:

```sql
UPDATE completedSegments SET isCompleted = 1
 WHERE isCompleted = 0 AND segmentID IN (<same sub-select of segmentIDs>);
```

Wrap in try/catch; a failed backfill must not block startup, and must not set the `done` flag.

**Edge cases.**
- Segment IDs are stored short (`S285`); a few legacy rows may be prefixed (`ENG-NLT-S285`).
  `getCompletedStoryIds` already normalises with `shortStoryId`. Keep whatever ID the source row has.
- Introductions (`I…`) are never marked complete — keep the existing early return.
- `resetSegmentCompletion` stays context-specific. It has no callers in the UI today.
- Reading on the Read tab does **not** tick the same story inside an active plan. That is unchanged
  and intentional for now (decision D5 in §14 offers the alternative).

**Verify.** Simulate the two SQL statements with Python's `sqlite3` against hand-built tables (rows with
`isCompleted` 0 and 1, prefixed IDs, an intro ID) before wiring them. In the browser preview (after W1):
start Advent on a faked 29 Nov, finish Day 1, then check `/Home` shows the story ticked and Continue does
**not** show it, and `/you` shows 1 story.

**Accept.** A story finished in any plan is ticked on Read, counted on You, and never offered by Continue.

---

## 6. W3 — Finishing a story must not rewrite a plan's status (bug 3)

**Problem.** `updatePlanStatus` (`api/sqlite.ts:1043`) and `updateChallengeStatus` (`:1071`) use
`INSERT OR REPLACE`, which deletes the row and inserts a new one with only six columns. `startDate`
becomes NULL and `isPaused` returns to 0, so finishing a story in a paused plan un-pauses it.

**Fix.** Use an upsert that touches only what a completion changes:

```sql
INSERT INTO plan_challenge_status
  (itemID, itemType, isActive, isPaused, isCompleted, progressPercentage, startDate, lastUpdated)
VALUES (?, 'challenge', 1, 0, ?, ?, ?, datetime('now'))
ON CONFLICT(itemID, itemType) DO UPDATE SET
  isCompleted        = excluded.isCompleted,
  progressPercentage = excluded.progressPercentage,
  lastUpdated        = excluded.lastUpdated;
```

(`startDate` parameter = `new Date().toISOString()`; it only applies when the row is new.) Same shape for
`'plan'`. `startChallenge` already uses `ON CONFLICT … DO UPDATE` in production, so the SQLite version
supports it. Keep the `maybeRequestReview({ planCompleted: true })` call in `updatePlanStatus`.

**Behaviour to keep.** Completing a story of a plan that was never started still creates an active row
(the plan then shows under "In progress").

**Verify.** Python `sqlite3` simulation: paused row with a start date → after upsert, still paused, same
start date, new percentage.

---

## 7. W4 — After a story: stay put, offer what's next (bug 2 + improvement 4 + arrow order)

### 7.1 Problems

1. `components/CheckCircle.tsx:177` — `setTimeout(navigateAfterComplete, 3200)` is never cleared. Leave the
   story within 3.2 s and the app still yanks you to the plan page or Read tab.
2. `handlePress` sets `isCompleted` only after two awaits. A fast double-tap records the story twice
   (`totalReads`, `segment_completion`, `daily_activity`).
3. The "Talk about it" questions (`TalkAboutCard`) sit **below** the Done button, but tapping Done
   navigates away 3.2 s later — the questions are unreachable after finishing.
4. The reader's ‹ › arrows (`app/(tabs)/[segment]/index.tsx:329-385`) build plan order from
   `Object.values(plan.segments)` — the book-grouped list — not the plan's reading order. In Advent,
   › from Day 8 (Isa 40) goes to Day 10. Custom plans (`user_…` ids) are not in
   `ReadingPlansChallenges.json`, so they get no arrows.

### 7.2 One helper for story order

New pure module `utils/storyOrder.ts`:

```ts
export type ReadingContext = { planId?: string; challengeId?: string; voice?: string };

/** Ordered story IDs for the context the reader was opened from. */
export function storiesInContext(
  ctx: ReadingContext,
  deps: { planStories: (id: string) => string[] | null; voiceStories: (name: string) => string[]; allStories: string[] }
): string[];

export function neighbours(order: string[], storyId: string): { prev: string | null; next: string | null };
```

- Plan/challenge order = `CatalogItem.stories` (already merged into reading order by
  `utils/planCatalog.ts`). For curated plans use `findCatalogItem(id)` (sync). For custom plans the reader
  must load `getUserPlanStoryIds(id)` (async, `api/userPlans.ts`) into state on mount.
- Voice order = `conversations.voices[name].storyIds` (as today).
- Default = all `S…` IDs in canonical order (filter out `I…`; today `segIds` includes introductions).

Replace the `useMemo` at `[segment]/index.tsx:329-385` with this helper. Test `neighbours` and
`storiesInContext` with a fake plan whose reading order differs from book order (use Advent's real
`stories` to assert Day 8 → Day 9 is `S199 → S257`).

### 7.3 CheckCircle changes

- Add `const busy = useRef(false)`; return early if set; set before the first await; never reset after
  success (the button is done). Reset on failure.
- **Remove navigation from CheckCircle.** Delete `navigateAfterComplete` and the timer. Add a prop
  `onCompleted?: () => void`, called after the banner is shown.
- Keep everything else (banner, haptic, reminder reschedule, review prompt).

### 7.4 "Up next" card

New `components/Bible/UpNextCard.tsx`, rendered by the reader between the Done button and `TalkAboutCard`
once the story is completed in this session (`completed` state set from `onCompleted`). Animate in with
`FadeInDown` (see `ThreadList`'s Continue card for the house style); scroll it into view.

Content rules, first match wins (`next` = next **unread** story in context via `nextUnreadStory(stories,
completedIds, getPlanStartIndex(id))`, after adding the story just finished to `completedIds`):

| Situation | Kicker | Title | Primary button | Secondary |
| --- | --- | --- | --- | --- |
| Plan finished (no `next`) | "Plan complete" | plan title | Back to plan | — |
| Dated plan, `next` is scheduled after today (`datedWindow` + `dateForDay`) | "Tomorrow · Mon, Nov 30" (or "Next · {{date}}") | next story title + its note | Back to plan | Read ahead |
| Plan / challenge | "Next · Day {{n}}" | next story title · ref · minutes | Next story | Back to plan |
| Opened from a voice (`voice` param) | "Next with {{name}}" | next story for that voice | Next story | Back to Cast |
| No context (Read tab) | "Next story" | next story in canonical order | Next story | Back to Read |

- "Next story" / "Read ahead" → `openSegment(router, next.storyId, sameContext)`.
- "Back to plan" → `router.replace({ pathname: '/plan/[id]', params: { id, completedSegment } })`;
  "Back to Read" → `router.replace({ pathname: '/(tabs)/Home', params: { completedSegment } })`.
  These are the old auto-navigation targets, so the bead animation on arrival still plays.
- No auto-navigation, no countdown.
- The card shows the dated plan's one-line note for the next story (`getStoryNote`).

Strings (new section `UI.upNext`):

| Key | EN | FR |
| --- | --- | --- |
| `planComplete` | Plan complete | Parcours terminé |
| `tomorrow` | Tomorrow · {{date}} | Demain · {{date}} |
| `nextOn` | Next · {{date}} | Suite · {{date}} |
| `nextDay` | Next · Day {{n}} | Suite · Jour {{n}} |
| `nextWith` | Next with {{name}} | Suite avec {{name}} |
| `nextStory` | Next story | Récit suivant |
| `readAhead` | Read ahead | Lire en avance |
| `backToPlan` | Back to plan | Retour au parcours |
| `backToRead` | Back to Read | Retour à Lire |
| `backToCast` | Back to Cast | Retour aux voix |

**Accept.** Finishing a story never navigates by itself. Questions are usable after Done. Double-tap
records one read. In Advent, › follows day order and the card names the right next day.

---

## 8. W5 — See the whole journey of a started plan (owner request + bug 6)

### 8.1 Problems

- Started plans are removed from the catalog list (`itemsByGroup(catalog, activeIds)`), and tapping the
  "In progress" card opens the next story. There is no way to see what has been read and what is ahead.
- After "Remind me" on the Advent card, the plan can only be seen by tapping the card body, which
  expands the plan far down the page under "Mini Studies" — easy to miss.
- `/plan/[id]` (`app/(tabs)/plan/[id].tsx`) renders `ThreadList` with a story filter: **Bible order**,
  grouped by division, no weeks, dates or notes. It is where the app lands after a plan reading.
- Long-pressing a plan row starts it with no confirmation (`app/(tabs)/plan/index.tsx:750`).
- The start flow (late-join choice, "you're in" alert) lives only in `plan/index.tsx`; `plan/[id].tsx` and
  the Read-tab invite each do their own simpler version.

### 8.2 Shared pieces

**`components/thread/PlanJourney.tsx`** — the expanded plan, extracted from the `visibleRows` builder and
row renderers in `plan/index.tsx` (phase rows, story rows, `storyRowText`, `storyRowHeight`, `buildThread`,
`ThreadRevealRow`, `StoryBead`, `ThreadKnot`). Props:

```ts
{
  item: CatalogItem;
  completedIds: Set<string>;
  startIndex: number;              // getPlanStartIndex(item.id)
  justCompletedId?: string | null; // bead animation
  window?: { before: number; after: number }; // see 8.3; omit = full journey
  baseDepth?: 0 | 1;               // thread indent when nested under a card
  onOpenStory: (storyId: string) => void;
  onSeeAll?: () => void;           // shown as a last row when windowed
}
```

It renders a plain `View` of fixed height (no inner scrolling) so it can sit inside the Plan tab's
`ScrollView` and inside the detail page's `ScrollView`. Catalog expansion in `plan/index.tsx` must switch
to this component too, so there is one implementation.

**`hooks/useStartPlan.ts`** — `const { start } = useStartPlan({ onStarted })`; contains the logic now in
`handleStartPlan` (`plan/index.tsx`): late-join alert for dated plans (`lateJoinIndex`), `startCatalogPlan`,
"you're in" alert before Day 1, otherwise open the first story. Use it in `plan/index.tsx`,
`plan/[id].tsx` and the `AdventInvite` `onJoin` handlers on both tabs (remove the duplicate in
`components/thread/ThreadList.tsx`).

### 8.3 Plan tab — "In progress" cards expand in place

- Tapping the **card body** toggles the journey open below the card (state `openActiveId`).
  Add a chevron (`Ionicons chevron-down/up`) and `accessibilityState={{ expanded }}`.
- Opening the next story moves to an explicit **Continue** pill on the card (label: "Continue" when
  something is read, "Start Day 1" when nothing is, "Starts Sun, Nov 29" disabled-looking but tappable
  before a dated plan begins — it opens the journey). Pause and End buttons stay.
- Expanded header line: `{{done}} of {{total}} read · {{pct}}%` plus, for dated plans,
  `Day {{n}} of {{total}} is today`.
- **Windowing for long plans.** If the plan has more than 60 stories (Bible in 1 Year 365, School Year
  180, NT 100, big custom plans), pass `window={{ before: 3, after: 14 }}` centred on the current story and
  show a final row "See all {{total}} stories" → `/plan/[id]`. 60 or fewer: full journey.
- Custom plans ("Your Plans" section) already expand in place; switch them to `PlanJourney` and keep
  their behaviour.

### 8.4 Plan detail page — plan order

In `app/(tabs)/plan/[id].tsx`:

- If `item.chronologicalMapping` exists → render `PlanJourney` (full) inside a `ScrollView`, scrolled so
  the current story is in view. This gives weeks, dates, notes and day order.
- Otherwise (book-order plans and custom plans) keep `ThreadList` with `storyFilter` — Bible order *is*
  their plan order, and `ThreadList` collapses by division, which matters at 365 stories.
- Header: title, `{{done}} of {{total}} read`, progress bar, description, and a Start/Join button via
  `useStartPlan` when not started (currently `handleStart` skips the late-join prompt).
- `isActive` is computed from `getActivePlanFromDB()`, which only knows `plan`-type items. Use
  `getStartedPlansFromDB()` + `getStartedChallengesFromDB()` instead so challenges show correctly.

### 8.5 Advent invite card

Add a text button "See the plan" (`UI.advent.seePlan` already exists in both languages) on
`components/thread/AdventInvite.tsx`, next to Join / Remind me, on both tabs →
`router.push('/plan/adventJourneyChronological')`. Keep the card-body tap doing the same thing (replace
the current "expand in catalog" handler in `plan/index.tsx` and the Read-tab link).

### 8.6 Long-press (bug 6)

Remove `onLongPress={() => handleStartPlan(item)}` from the catalog plan row. Starting is the Start button
only. (Custom plans keep long-press → delete confirmation; that one confirms.)

### 8.7 Strings (`UI.planJourney`)

| Key | EN | FR |
| --- | --- | --- |
| `continue` | Continue | Continuer |
| `startDay1` | Start Day 1 | Commencer le jour 1 |
| `progress` | {{done}} of {{total}} read · {{pct}}% | {{done}} sur {{total}} lus · {{pct}} % |
| `todayIs` | Day {{n}} of {{total}} is today | Aujourd'hui : jour {{n}} sur {{total}} |
| `seeAll` | See all {{total}} stories | Voir les {{total}} récits |
| `showJourney` | Show journey | Afficher le parcours |
| `hideJourney` | Hide journey | Masquer le parcours |

Also replace the hard-coded `lang === 'fr' ? 'En pause' : 'Paused'` / `'Démarrer' : 'Start'` /
`'Terminé' : 'Complete'` ternaries touched by this work with keys.

### 8.8 Verify

Browser preview, light and dark, 390×844 and 820×1180:
1. Today (before Advent): Join → card shows "Starts Sun, Nov 29"; tap card → 26 dated stories in four weeks.
2. Faked 6 Dec, joined at Day 8: journey shows Days 1–7 unread above the current Day 8; header says
   "Day 8 of 26 is today".
3. Start "Bible in 1 year": card expands to a window of ~18 stories + "See all 365 stories".
4. Finish a story → Up next → Back to plan → detail page in **week** order with the bead animation.
5. Long-press a catalog plan: nothing starts.

**Accept.** From any started plan, one tap shows what's read and what's ahead, in plan order.

---

## 9. W6 — Onboarding Save demo style helper (bug 5)

**Problem.** `components/onboarding/OnboardingDemos.tsx:1014` and `:1023` spread
`...StyleSheet.absoluteFillObject`. React Native 0.86 removed it (`StyleSheet.absoluteFill` remains and is
a plain object). Spreading `undefined` adds nothing, so `keepBackdrop` and `keepModalOverlay` are not
absolutely positioned. Recent commits ("Fix onboarding save modal visibility", "Raise onboarding save
pill") tuned the layout around this.

**Fix.** Replace both with `...StyleSheet.absoluteFill`. Then **look at it**: the surrounding padding and
`phoneLift` offsets were tuned while the overlay was in normal flow and may now over-correct.

**Verify.** Browser preview at `/onboarding`, the Save screen, at 375×667, 430×932 and 820×1180, light and
dark. The modal must sit over the dimmed backdrop, fully visible, pill not clipped. Screenshot before and
after; show the owner. `tsc` must no longer report the two errors.

**Risk.** Visual only. If the result looks worse and cannot be fixed quickly, keep the old appearance by
writing the four absolute-position properties explicitly only where intended, and note it.

---

## 10. W7 — A streak that forgives (feature) — Release B

### 10.1 Today

- `streak_data` holds `currentStreak`, `longestStreak`, `lastReadDate`. `updateStreak()`
  (`api/sqlite.ts:1122`) uses the pure `nextStreak()`; `getCurrentStreak()` uses `displayedStreak()`
  (`utils/localDate.ts`). Miss one day → 0.
- "Week streak" (`utils/youInsights.ts:57`) counts consecutive weeks (Mon–Sun) with at least one read,
  from `segment_completion` dates. That table loses rows when a challenge is ended or a season is reset;
  `daily_activity` (local dates, never deleted, may hold several rows per date) is the reliable history.
- The You tab ring toggles day ↔ week (`components/thread/YouStatRings.tsx`).

### 10.2 Rules

**Rest days**
- A rest day covers one missed day so the streak continues. It does not add to the count.
- Everyone starts with **1**. Earn **1 more for every 7 days read**. Hold at most **2**.
- Rest days are spent automatically, only when the reader comes back and reads.
- If more days were missed than rest days held, the streak restarts at 1. Unused rest days are kept.

**Weekly goal**
- Setting: **3, 5 or 7 days a week** (default 5). Shown as "3 of 5 this week".
- Week streak = consecutive weeks that met the goal. The current week counts if it has met the goal;
  if it has not yet, it neither counts nor breaks the streak.
- Weeks **before** the feature's first run keep the old rule (≥ 1 read), so nobody's week streak drops
  on update. Store the first-run date as `goalFrom`.

**Milestones** at day streaks 3, 7, 14, 30, 50, 100, 200, 365: one extra line on the completion banner.
Earning a rest day also gets a line.

### 10.3 Implementation

New pure module `utils/streak.ts`:

```ts
export type StreakState = {
  streak: number; longest: number; lastReadDate: string | null;   // YYYY-MM-DD local
  restDays: number;            // 0..2
  readsTowardRest: number;     // 0..6
  restDates: string[];         // days a rest day covered (keep last 60) — for the heatmap
  lastMilestone: number;       // highest milestone already celebrated in this streak
};
export function initialState(legacy: { currentStreak: number; longestStreak: number; lastReadDate: string | null }, today: string): StreakState;
export function onRead(state: StreakState, today: string): { state: StreakState; events: StreakEvent[] };
export function view(state: StreakState, today: string): { streak: number; restDays: number; coveredDays: number; readToday: boolean; lastDayToSave: string | null };
export function weekProgress(readDates: string[], today: string, goal: 3 | 5 | 7, goalFrom: string): { daysThisWeek: number; goal: number; weekStreak: number };
```

`onRead`:
1. `lastReadDate === today` → no change.
2. `missed = daysBetween(lastReadDate, today) - 1` (0 if null → streak 1).
3. `missed <= 0` → `streak + 1`. `0 < missed <= restDays` → spend `missed` rest days, record those dates
   in `restDates`, `streak + 1`. Otherwise `streak = 1`, `lastMilestone = 0`, `readsTowardRest = 0`.
4. `readsTowardRest += 1`; at 7 → `restDays = min(2, restDays + 1)`, reset to 0, emit `restDayEarned`.
5. `longest = max(longest, streak)`. If `streak` reaches a milestone above `lastMilestone`, emit
   `milestone(n)` and store it.

`view`: `missed = daysBetween(lastReadDate, today) - 1`. `missed <= 0` → streak alive.
`missed <= restDays` → alive, `coveredDays = missed`. Else streak 0.
`lastDayToSave = lastReadDate + 1 + restDays` (the last day a read keeps the streak) — W8 uses it.

`initialState` (migration): `streak = displayedStreak(currentStreak, lastReadDate, today)`, `longest`,
`lastReadDate`, `restDays = 1`, `readsTowardRest = streak % 7`, `lastMilestone` = highest milestone ≤ streak.

**Storage.** JSON in `app_state` under `streak.v2` (`getAppState` / `setAppState`). Also keep writing
`streak_data` (`currentStreak`, `longestStreak`, `lastReadDate`) so nothing else breaks.
`goalFrom` and the weekly goal: `app_state` keys `streak.goalFrom`, `streak.weeklyGoal`.

**Wiring.**
- `updateStreak()` → load state (or `initialState`), `onRead`, save, return events.
  `markSegmentComplete` should return those events so `CheckCircle` can add the banner line.
- `getCurrentStreak()` → `view(state, today).streak`. Stop zeroing `streak_data` on read
  (`UPDATE streak_data SET currentStreak = 0` at `:490`) unless the v2 view says 0.
- `getWeekStreak()` → `weekProgress()` over `SELECT DISTINCT date FROM daily_activity`.
- You tab ring: day view shows the count plus small dots for rest days held (0–2) and sublabel
  "1 rest day saved"; if `coveredDays > 0`, "Rest day covering yesterday". Week view shows
  "3 of 5" in the centre and "6-week streak" beneath.
- `StoryHeatmap`: render `restDates` as a hollow mark, if the component can take it simply; otherwise skip.
- Settings (`app/settings.tsx`): a "Weekly goal" row with three segmented options (3 · 5 · 7).

**Tests** (`utils/streak.test.ts`), at minimum:

| Case | Expect |
| --- | --- |
| Read 7 days running from a fresh state | streak 7, rest days 2, events: milestone 3, milestone 7, restDayEarned |
| Miss 1 day with 1 rest day, read next day | streak continues (+1), rest days 0, that date in `restDates` |
| Miss 2 days with 1 rest day | streak 1, rest day kept |
| Miss 2 days with 2 rest days | continues, rest days 0 |
| Two reads on one day | counted once |
| `view` on the day after a read, not yet read | streak unchanged, `readToday` false |
| `view` two days after, 0 rest days | 0 |
| `initialState` from legacy streak 10 read yesterday | streak 10, rest 1, `readsTowardRest` 3, `lastMilestone` 7 |
| Month and year boundaries, DST change day | correct day differences |
| `weekProgress` goal 5: 5 days this week | counts current week |
| `weekProgress`: 2 days so far this week, last week met | week streak = last week's run, not broken |
| `weekProgress`: a week before `goalFrom` with 1 read | counts (old rule) |

Strings (`UI.streak`):

| Key | EN | FR |
| --- | --- | --- |
| `restSavedOne` | 1 rest day saved | 1 jour de repos en réserve |
| `restSavedMany` | {{count}} rest days saved | {{count}} jours de repos en réserve |
| `restCoveredOne` | A rest day covered yesterday | Un jour de repos a couvert hier |
| `restCoveredMany` | Rest days covered {{count}} missed days | Des jours de repos ont couvert {{count}} jours manqués |
| `restEarned` | You earned a rest day | Vous avez gagné un jour de repos |
| `milestone` | {{n}}-day streak | Série de {{n}} jours |
| `weeklyGoal` | Weekly goal | Objectif hebdomadaire |
| `daysAWeek` | {{n}} days a week | {{n}} jours par semaine |
| `thisWeek` | {{done}} of {{goal}} this week | {{done}} sur {{goal}} cette semaine |
| `weekStreak` | {{n}}-week streak | Série de {{n}} semaines |

The project does not use i18next plural suffixes anywhere; keep to explicit One/Many keys and choose in code.

**Accept.** Missing one day no longer resets a streak when a rest day is held; nobody's numbers drop on
update; all rules covered by tests.

---

## 11. W8 — Reminders that work (bug 4 + improvement 3) — Release B

### 11.1 Today (`utils/readingReminders.ts`)

- One repeating daily notification with fixed text ("Read your story / Your next story is waiting."),
  forever, even for someone who left months ago.
- Time is chosen by cycling six presets (`REMINDER_TIMES`, `:35`).
- "Keep your streak" (`:335`) is scheduled only for **today 20:00**, only when the app is opened that day
  and nothing has been read — so a day the app is never opened gets no nudge. It also fires with no
  streak.
- Advent notifications are planned by the pure `utils/adventReminders.ts` and scheduled alongside.
  **Their IDs and rules must keep working unchanged** (teasers 22 and 28 Nov, 6 Dec; joiners' reminders).

### 11.2 Design

Because iOS cannot change the text of a repeating notification, schedule **dated** notifications and
refresh them whenever the app opens or a story is finished (already the case:
`rescheduleReadingReminders()` runs on start, on foreground and after Done).

New pure planner `utils/reminderPlan.ts` → `planReminders(input): PlannedNotification[]`
(same `PlannedNotification` shape as `adventReminders.ts`: `id`, `date`, `title`, `body`, `url`).

Only when daily reminders are on:

1. **Daily, next 14 days** — ids `svb-day-0` … `svb-day-13`, at the chosen time.
   - Skip today if the time has passed or a story was read today.
   - Text per day `d`:
     - Active dated plan (Advent, 7/12 Days of Christmas) and `d` inside its window →
       title "{{plan}} · Day {{n}}", body = that date's story title if unread, else the next unread one.
     - Other active plan (first non-paused, most recently updated): first scheduled day → title
       "{{plan}} · Day {{n}}", body = next unread story title. Later days → plan title + one of three
       rotating generic lines.
     - No active plan → title "Today's story", body = the story for that date from
       `todayStoryId(date)` (`utils/continueTarget.ts`; date-anchored, so every day can be named).
   - `url`: the plan (`/plan/<id>`) or the story (`/<storyId>`). The tap handler in `app/_layout.tsx`
     already routes any `url` starting with `/`.
2. **Streak nudge** — id `svb-streak-nudge`, 20:00 on `view(state, today).lastDayToSave` (W7), only if the
   streak is ≥ 2 and that moment is in the future. If the daily reminder that day is at 19:00 or later,
   skip the nudge and give that day's daily reminder the streak text instead.
   Text: "Keep your {{n}}-day streak" / "Read a story today to keep it going."
   Until W7 lands, `lastDayToSave` = the day after `lastReadDate`.
3. **Come-back notes** — ids `svb-back-1..3` at +21, +35 and +60 days at the chosen time, gentle text.
   After that, silence. (Today's behaviour is a daily notification forever; see decision D2.)

Always: cancel the legacy repeating id `svb-daily-read`, then every id in the new sets, then schedule.
Advent: keep calling `planAdventNotifications`. Its `dailyOverride` is no longer needed once the per-day
text above exists — remove the override path and its tests, keep the rest. iOS allows 64 pending local
notifications; this design uses at most 14 + 1 + 3 + 6.

### 11.3 Time picker

Replace the tap-to-cycle row in `app/settings.tsx` with a small sheet (`components/ReminderTimeSheet.tsx`,
plain JS, no new dependency): hour and minute columns (minutes in 5s) built from `ScrollView` snap lists
or +/− steppers, plus three shortcut chips (7:00, 12:00, 20:00). Save through the existing
`setReminderTime(hour, minute)`. Delete `REMINDER_TIMES` / `nextReminderTime`.
`formatReminderTime` must use 24-hour time in French ("20:00"), 12-hour in English.

### 11.4 Tests (`utils/reminderPlan.test.ts`)

Fixed `now`; assert ids, dates, hours and text keys for: no plan; undated plan; Advent on 8 Dec (each of
the next 14 days names that date's story until 24 Dec, then falls back); already read today (day 0
skipped); reminder time 20:30 (nudge folded into the daily); streak 1 (no nudge); two rest days held
(nudge two days later); reminders off (empty). Keep `utils/adventReminders.test.ts` green.

Strings (`UI.reminders`): `todayTitle` "Today's story" / "Le récit du jour"; `planDayTitle`
"{{plan}} · Day {{n}}" / "{{plan}} · Jour {{n}}"; three `generic1..3` bodies; `streakTitle`
"Keep your {{n}}-day streak" / "Gardez votre série de {{n}} jours"; `streakBody`
"Read a story today to keep it going." / "Lisez un récit aujourd'hui pour la poursuivre.";
`back1..3` title/body pairs; `timeSheetTitle` "Reminder time" / "Heure du rappel".
Write the generic and come-back lines in the app's plain, unhurried voice — no guilt, no exclamation marks.

**Device check (owner).** Notification delivery cannot be tested in the container. Ask the owner to set the
reminder two minutes ahead on a real phone and confirm text and tap target, in both languages.

---

## 12. Release C

### 12.1 W9 — "Follow a voice" plans (feature)

**Idea.** On a Cast voice page, one tap builds a reading plan of every story where that voice speaks.

**Data.** `assets/data/conversations.json` → `voices[name].storyIds` (canonical order). 773 voices:
559 speak in one story, 171 in 2–4, 33 in 5–19, 10 in 20 or more (God 186, Jesus 47).

**Rules.**
- Show the action when the voice has **3 or more stories** and is not narration
  (`NARRATION_VOICES` in `utils/voicesMet.ts`). 1–2 stories: no action (the page already links to them).
- Plan title: EN "Follow {{name}}", FR "Suivre {{name}}" (name via `localizeVoiceName`).
- Create with `createUserPlan(title, storyIds)` (`api/userPlans.ts`). It sorts canonically and does not
  start the plan.
- **No duplicates.** Keep a map `voice name → plan id` in AsyncStorage (`svb.voicePlans`). If the mapped
  plan still exists (`getUserPlan`), open it instead of creating another.
- After creating: `setPendingFocusUserPlan(id)` then `router.replace('/(tabs)/plan')` — the same hand-off
  `plan/create.tsx` uses — and open it expanded. The Plan tab currently throws away the id returned by
  `takePendingFocusUserPlan()` (`plan/index.tsx:223`); use it to set the open plan. Do not auto-start: starting a custom plan pauses any
  other running plan of type `plan` (`startPlan` in `api/sqlite.ts`), which should be the reader's choice.
- When a story is opened from a voice plan, pass `voice: name` to `openSegment` so the reader highlights
  that voice's turns. Look the voice up from the same `svb.voicePlans` map by plan id.
  With W4's order helper, `planId` decides ‹ › order and `voice` only drives highlighting.

**UI.** In `app/(tabs)/cast/[voice].tsx`, a "pull" row in the same style as "Longest exchange"
(`styles.pull`): label "Follow {{name}}", body "{{count}} stories, in order", arrow icon. If a plan
already exists: "Open your plan".

**Pure helper + test.** `utils/voicePlans.ts`: `voicePlanFor(name, voices) → { eligible, storyIds }`.
Test eligibility (narrator excluded, 2-story voice excluded, Mary 3 stories included) and order.

Strings (`UI.voicePlan`): `follow` "Follow {{name}}" / "Suivre {{name}}"; `count`
"{{count}} stories, in order" / "{{count}} récits, dans l'ordre"; `open` "Open your plan" /
"Ouvrir votre parcours"; `created` "Plan created" / "Parcours créé".

### 12.2 W10 — Apply updates sooner (improvement 2)

**Today** (`utils/otaUpdates.ts`, `app/_layout.tsx`): check on cold start and (new) on foreground at most
every six hours; a downloaded update is applied only on the **next cold start**.

**Change — two more moments to apply a downloaded update:**

1. **End of onboarding.** In `finish()` (`app/onboarding.tsx:98`), after `markAsLaunched()`: if an update is
   pending, save the intended destination (`svb.afterReloadRoute` = `/Home` or `/<todayStoryId>`) in
   AsyncStorage and call `Updates.reloadAsync()`. `app/(tabs)/index.tsx` reads and clears that key and
   routes there instead of `/Home`. Skip when `fromAbout` is true.
2. **Returning after 30+ minutes in the background.** In the `AppState` handler in `app/_layout.tsx`:
   record the time on `background`; on `active`, if an update is pending, the gap is ≥ 30 minutes and the
   current screen is **not** a story (`usePathname()` not matching `/S…`/`/I…`), reload.
   Never reload while someone is in the reader.

Add to `utils/otaUpdates.ts`: `hasPendingUpdate()`, `applyPendingUpdate(reason)` (clears the flag, logs the
reason, reloads; all inside try/catch — a failed reload must leave the app running).

**Be honest in the release notes to the owner:** this logic ships *inside* an update, so it only helps
people who already have it. A brand-new install still runs the store build's code on first launch.
First-launch freshness for new users needs a new store build (2.0.1) — see §12.3.

**Test.** Pure decision function `shouldApplyOnForeground({ pending, backgroundMs, pathname })` with Jest.
Device check by the owner (two-phone or TestFlight) — cannot be exercised in the container.

### 12.3 Optional: store build 2.0.1

Not requested, but it is the only way new downloads see current plans on first launch. If the owner wants
it: bump `app.json` to 2.0.1 / iOS build 27 / Android version code 26 on the release branch (build numbers
do not auto-increment), build, submit, and afterwards put the new builds' runtime versions in
`scripts/ota-targets.json`. Keep publishing OTAs to **both** 2.0.0 and 2.0.1 runtimes while 2.0.0 is in use.

---

## 13. W11 — Move the Bible text out of the update bundle (improvement 1) — optional

**Correction to the earlier estimate.** Measured with `npx expo export`:

| | Bundle (raw) | Bundle (gzipped, roughly what is downloaded) |
| --- | --- | --- |
| Today | 23.5 MB | 7.8 MB |
| Bible moved out | 10.1 MB | 4.1 MB |

So updates become about **half** the size, not a tenth. The rest is app code (~6.5 MB) and other data
files (French UI 0.9 MB, questions ~1.5 MB, search index 0.6 MB). The first update after the change also
carries the Bible once as a separate 14.8 MB file (2.6 MB gzipped).

**Recommendation.** Worth doing, but not urgent and not before Advent. It changes how the app starts on
both platforms and cannot be tested in the container. Do it together with a store build, with testing on
a real iPhone and a real Android phone.

**Design (if built).**
1. Rename `assets/data/newBibleNLT1.json` → `assets/data/newBibleNLT1.bible` and add `'bible'` to
   `config.resolver.assetExts` in `metro.config.js`, so Metro treats it as a file asset. Unchanged assets
   are not re-downloaded by later updates.
2. `services/BibleLoader.ts`: replace the module-level `require` (`:20`) with
   `loadEnglishBible(): Promise<void>` — `Asset.fromModule(require('…bible')).downloadAsync()`, read
   `localUri` with `expo-file-system/legacy` `readAsStringAsync`, `JSON.parse`, cache. This is the same
   read-and-parse path the French Bible already uses (`services/BibleStorageManager.ts:281`).
   Remove the second `require` at `BibleStorageManager.ts:264`.
3. Await it in `initializeAppSystems()` (`services/app-startup-manager.ts`) **before** the app renders
   anything that calls `bibleLoader.getCurrentBible()` (reader, `utils/voicesMet.ts`,
   `utils/youInsights.ts`, `utils/onboardingDemo.ts`, `components/navigation/NavBook.tsx`,
   `context/SyncAppSettingsContext.tsx`). The sync getter keeps returning the cached object.
4. Failure path: if the asset cannot be read, show the existing loading/error screen with a retry —
   never an empty Bible.
5. Jest: `utils/readerParts.data.test.ts` imports the JSON directly; point it at the renamed file via
   `fs.readFileSync` + `JSON.parse`.
6. Measure cold-start time before and after on a mid-range Android phone. If parsing 15 MB at launch is
   slower than today, stop and reconsider (per-story files or SQLite, already on the MVP3 list).

---

## 14. Decisions for the owner

Defaults are what will be built if nothing is said.

| # | Decision | Default |
| --- | --- | --- |
| D1 | Streak rules: start with 1 rest day, earn 1 per 7 days read, hold at most 2; weekly goal 3/5/7, default 5 | As stated |
| D2 | Reminders stop after ~2 months of not opening the app (14 daily + 3 come-back notes), instead of daily forever | Stop |
| D3 | Tapping an in-progress plan card opens its journey; a separate Continue button opens the story | As stated |
| D4 | W11 (smaller updates) given the corrected numbers | Defer to a store build |
| D5 | Should reading a story on the Read tab also tick it in an active plan that contains it? | No (unchanged) |
| D6 | Reading a story from a paused plan keeps it paused | Keep paused |

---

## 15. Not in this plan

- **Lent** — 16 of 21 entries still point at the wrong stories. It reappears 1 Feb 2027.
  `utils/planData.test.ts` lists it under `KNOWN_BROKEN`; remove it from that set when fixed.
- Accessibility and French pass (small text sizes, missing labels, English-only phase headings on older
  plans, hard-coded English strings in the reader's loading and error states).
- Listen mode, widgets, "year in voices".
- `daily_activity` has no unique key on `date`, so `INSERT OR REPLACE` adds a row per completion instead of
  updating. Harmless to this plan (W7 reads `DISTINCT date`) but it skews the unused insight queries.

---

## 16. Release checklist (each release)

1. `npx jest --ci`, `tsc`, `eslint` on changed files — no new failures.
2. Browser preview of every changed screen, light and dark; screenshots to the owner.
3. Push the branch. Tell the owner exactly what changed and what could not be tested here
   (notifications, alerts, update reloads, real-device layout).
4. Owner, on the Mac: pull the branch, `git status` clean (especially `app.json`), then
   `npm run update:production -- -m "<message>"`, `npm run update:production:android -- -m "<message>"`,
   `npm run ota:status`.
5. Owner, on a phone: force-quit → open → force-quit → open; Settings → Info shows a new update id.
6. Fast-forward `release/2.0.0` to the published commit and push.
