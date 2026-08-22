# Custom reading plans — feature development plan

**Target:** app version **2.1** (after 2.0 / store ship)  
**Status:** Spec locked — ready to schedule build  
**Written:** 22 August 2026  
**Metaphor:** Apple Music / iTunes playlists — pick stories, name the list, read it like any other plan

---

## 1 · Summary

Users create their own reading plans from the Plan tab. Under the curated catalog
(Whole Year / Monthly / Mini), a **Your Plans** section shows a `+` control.
Tapping `+` opens a full-screen picker modeled on the Read page (same division →
book → story thread, same search). Stories (and whole books / whole voices) can
be checked; on create, the selected set is saved in **canonical story order**,
the plan is **started immediately** with **creation day as day 1**, and it
appears under Your Plans.

Custom plans are **device-local** (SQLite), same as progress and Saved — no
accounts in this version.

---

## 2 · Locked product decisions

| Topic | Decision |
| --- | --- |
| **Story order** | On create, sort selected stories into the same natural order as the Read page (book → chapter → verse / segment sequence). Selection tap order does **not** define reading order. |
| **Reorder** | Out of scope for 2.1. A later version may reopen the plan and drag stories to a custom order, then save. |
| **Intros (`I###`)** | Custom plans are **stories only** (`S###`). No intro segments. |
| **One active plan** | Same rule as catalog plans: starting a custom plan pauses other incomplete plans. |
| **Day 1** | Creating a custom plan **starts it immediately**. The calendar day of creation is **day 1**. |
| **Edit after create** | 2.1 ships **create + delete** only. Add/remove stories (and reorder) is a follow-up. |
| **Naming** | UI label stays **Your Plans** / **Vos plans**. Distinguish *user-created* plans (always listed) from *started catalog* plans (listed only while active / started), via copy or grouping inside that section if both appear. |

---

## 3 · User flows

### 3.1 Create

1. Plan tab → **Your Plans** → tap `+`.
2. Full-screen modal: Read-like thread (10 divisions collapsed) + search bar with
   the same scopes as Read (Voices / Books / Stories / Reference).
3. Browse or search; toggle stories with `+` ↔ check.
4. **Book-level `+`:** add or remove all stories in that book.
5. **Voice-level `+` (search):** add or remove all stories for that voice
   (e.g. Simon Peter).
6. Sticky bottom: **Create reading plan** (enabled when ≥ 1 story selected).
7. Sheet: title field + summary (“N stories”) → **Create** or **Cancel**
   (returns to picker with selection preserved).
8. On Create: persist plan, sort stories canonically, auto-start (day 1 =
   today), dismiss modal, show plan under Your Plans.

### 3.2 Use

- Tap a custom plan → same detail / continue / progress behaviour as a catalog
  plan (`plan/[id]` path, story list from the saved ordered IDs).
- Completing stories marks progress against that plan ID.
- Starting another plan (catalog or custom) pauses this one per existing rules.

### 3.3 Delete

- From Your Plans (and/or plan detail): delete custom plan and its progress rows.
- Confirm before destructive delete.
- Catalog plans are unaffected (pause / end only, as today).

### 3.4 Out of scope (follow-ups)

- Edit membership (add/remove stories after create)
- Drag-reorder
- Cloud backup / accounts / share a custom plan
- Import from a catalog plan as a starting template

---

## 4 · UX notes

- Visual language matches Plan / Thread chrome — do **not** copy mockup
  handwriting or ad-hoc fonts; mockup was layout-only.
- Your Plans section is **always** visible below the three catalog groups, even
  when empty (header + `+` + empty hint).
- Picker must not navigate into the reader; taps only toggle selection.
- Partial book/voice selection: parent control shows mixed state if useful;
  otherwise checked only when all child stories are selected.
- French parity for all new strings (`Your Plans` already exists; add create /
  picker / empty / delete copy).

---

## 5 · Technical approach

### 5.1 Persistence

New SQLite table, e.g. `user_plans`:

| Column | Notes |
| --- | --- |
| `id` | Stable string, e.g. `user_<uuid>` — never collide with catalog IDs |
| `title` | User string |
| `story_ids` | JSON array of `S###`, **already sorted** into canonical order at write time |
| `created_at` | ISO date; defines day 1 for scheduling / “day N” if shown |
| `updated_at` | Optional |

Reuse existing:

- `reading_plan_progress` with `planID = user_plans.id`
- `plan_challenge_status` with `itemType = 'plan'` **or** dedicated `'user_plan'`
  (prefer explicit `'user_plan'` if it keeps queries clearer)

Migration via existing `database-manager` / migration path (G3-style schema
discipline).

### 5.2 Canonical sort

When the user confirms create, take the selected `Set<string>` and sort by the
same ordering the Read browse tree uses (segment / story number order as in
`BookChapterList` / division ranges — equivalent to natural Scripture sequence
on the home thread). Persist that ordered array; reading and progress use it
as the plan’s segment list.

### 5.3 Catalog & progress plumbing

Extend:

- `utils/planCatalog.ts` — `findCatalogItem` / list helpers merge **static JSON +
  user_plans** (or a thin `getUserPlans()` parallel API that plan screens call).
- `getPlanProgress` / `startPlan` / pause / resume / end — resolve story lists
  from `user_plans` when ID is a user plan; do not require
  `ReadingPlansChallenges.json`.
- Auto-start on create: insert status as active and set day-1 baseline from
  `created_at` (align with however catalog plans compute “day N” today; if no
  day counter UI yet, at minimum mark started + active on create day).

### 5.4 UI surfaces

| Surface | Change |
| --- | --- |
| `app/(tabs)/plan/index.tsx` | Always-on **Your Plans** block: created plans + started catalog items; `+` opens picker |
| New picker modal / route | Selection-mode thread + search; sticky create CTA; title sheet |
| `components/thread/ThreadList.tsx` (or fork) | **Selection mode** props: selected set, toggle story/book/voice, no `openSegment` |
| `app/(tabs)/plan/[id].tsx` | Load custom plan by id; `storyFilter` from saved list |
| Delete affordance | Your Plans row and/or detail |

Best reuse: Read’s `ThreadList` hierarchy and search (Voices from
`conversations.json`, books, stories, reference). Selection mode is the main
new work.

### 5.5 Identity & sync

No accounts. Custom plans live only on device. Document in UI or About if
needed: deleting the app clears custom plans (same as other local data).

---

## 6 · Build queue (suggested order)

| # | Work | Est. |
| --- | --- | --- |
| **C1** | Schema + CRUD (`user_plans`); migration | 1–1.5 d |
| **C2** | Progress / start / pause / end resolve user plan IDs; auto-start on create (day 1) | 1–1.5 d |
| **C3** | Plan tab Your Plans section: empty state, list created plans, `+` entry | 1 d |
| **C4** | Picker modal — browse selection (story + book bulk) | 2–2.5 d |
| **C5** | Picker search parity + voice bulk-add | 1–1.5 d |
| **C6** | Title sheet, canonical sort on save, wire create end-to-end | 0.5–1 d |
| **C7** | Plan detail + reading + completion for custom IDs | 1 d |
| **C8** | Delete + confirm; exclusivity with one active plan | 0.5 d |
| **C9** | FR strings, empty/error states, light QA on device | 1 d |
| | **Total** | **~9–12 d** |

Do **not** schedule inside the 2.0 ship window; this is **2.1**.

---

## 7 · Acceptance criteria (2.1)

- [ ] Your Plans section sits below catalog groups with a working `+`.
- [ ] Picker mirrors Read hierarchy and search; stories start collapsed.
- [ ] Story / book / voice toggles add and remove correctly; no reader navigation.
- [ ] Create requires a title and ≥ 1 story; summary shows story count.
- [ ] Saved story list is canonical order, stories only (no `I###`).
- [ ] New plan appears under Your Plans and is **already started**; creation day is day 1.
- [ ] Starting another plan pauses the custom plan (same as catalog).
- [ ] User can read and mark stories complete against the custom plan.
- [ ] User can delete a custom plan (with confirm); progress for that id is cleared.
- [ ] No edit / reorder UI in 2.1.
- [ ] EN + FR copy for new strings.
- [ ] Works offline; no network required for create/use/delete.

---

## 8 · Risks & notes

1. **ThreadList selection mode** is the largest UI risk — prefer additive props
   over a permanent fork if possible.
2. **Progress APIs** that hard-read JSON will return empty totals for unknown
   IDs until C2 lands — land C1–C2 before relying on the Plan tab list.
3. **ID collisions** — prefix user ids (`user_`) and never reuse catalog ids.
4. **“Your Plans” overload** — section already means started catalog items;
   clarify created vs started in layout/copy so the `+` does not look orphaned.
5. **Day 1 semantics** — confirm against current plan “day” UI (if any); creation
   timestamp must be enough to show day N later without a separate field.

---

## 9 · Follow-up (post–2.1)

- Edit: reopen picker to add/remove; preserve canonical sort after edits unless
  user has customized order.
- Drag-reorder + save custom order.
- Optional: duplicate a catalog plan into a custom plan as a starting set.
- Optional: export / backup when accounts or sync exist.

---

## 10 · Related code (today)

| Area | Path |
| --- | --- |
| Plan tab | `app/(tabs)/plan/index.tsx` |
| Plan detail | `app/(tabs)/plan/[id].tsx` |
| Catalog | `assets/data/ReadingPlansChallenges.json`, `utils/planCatalog.ts` |
| Read / search | `components/thread/ThreadList.tsx` |
| SQLite plans | `api/sqlite.ts`, `api/database-manager.ts` |
| Deferred MVP3 notes | [`README.md`](./README.md) |
