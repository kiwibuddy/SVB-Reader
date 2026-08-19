# Ship plan — from `mvp2-G1` to the App Store and Play

**The remaining path.** [`08-BUILD-QUEUE.md`](08-BUILD-QUEUE.md) is the build
order; this is what is left of it plus everything the step log deferred, and the
release mechanics that follow. Written 19 August 2026 against
`store-compliance-130` @ `d78f9e5`.

---

## 1 · Is it just D, G2 and G3?

No. Those are three of **nine** open items. Six more are real and blocking, and
five of them are in your own documents already — they were just deferred rather
than dropped.

| | Item | Status | Est. days |
| --- | --- | --- | --- |
| **D** | Reference search — `verseIndex.json`, verse search UI | open, as scoped | 2.5–3 |
| **G2** | French parity across everything new | open, **wider than expected** — see §3 | 2.5–3 |
| **G3** | Migration + hardware pass | open, **one schema divergence found** — see §4 | 1.5–2 |
| **G4** | Store listing and screenshots | open, not previously in your list | 1.5–2 |
| **X1** | `react-native-view-shot` needs a new native build — H1 image share is text-only today | deferred at `mvp2-H1` | 0.25 (build wait) |
| **X2** | H6 `ChronologicalMappings` — still imported by `ReadingPlans.tsx` | deferred at `mvp2-E`/`F` | 0.5 |
| **X3** | Lint: 55 errors / 204 warnings | deferred since `mvp2-00` | 0.5–1 |
| **X4** | The C device checklist — never run on hardware | noted at `mvp2-C` | folded into G3 |
| **X5** | Four decisions still marked "blocked on you" | open | yours |
| **X6** | Release mechanics — versioning, missing Play service account, OTA reach | open | 0.5 |
| | | **Total** | **10–13** |

**A regression found while auditing, and it belongs to G2:**

> ### There is currently no way for a user to choose French.
>
> - The only picker is [`SettingsModal.tsx`](../components/navigation/SettingsModal.tsx)
>   — a working EN/Français toggle plus the French Bible download. It is rendered
>   only by [`CustomHeader.tsx:74`](../components/navigation/CustomHeader.tsx), and
>   **nothing renders `CustomHeader` any more.** Both files are orphaned.
> - The only live setter is the first-launch locale prompt at
>   [`_layout.tsx:87`](../app/_layout.tsx). It fires **once**, **only** when the
>   device locale is not `en`, and its `Alert` copy is hardcoded French whatever
>   locale was detected.
> - You → "Settings" routes to `/About` ([`you.tsx:140`](../app/(tabs)/you.tsx)),
>   which is legal modals and a reset-onboarding button. No language, appearance
>   or font control survives.
>
> So an English-locale user can never reach French, and a French-locale user who
> taps *Non merci* can never get back. The `t()` plumbing, `UI-ENG.json`,
> `FRA-UI.json`, `thread-ui.json` and the French Bible download service are all
> intact — only the entry point was deleted with the old chrome. **This is a
> store-review risk as much as a feature gap:** the listing claims French.

---

## 2 · D · Reference search

`assets/data/verseIndex.json` is 6.6 MB, 24,935 keys, and **zero readers** —
`grep -rn verseIndex` across the app returns nothing.

Its current shape, per key `"Genesis-1-1"`:

```json
{ "segmentId": "S001", "blockIndex": 0, "position": 40, "book": "Genesis",
  "chapter": 1, "verse": 1, "content": "1", "segmentTitle": "God Creates",
  "isChapter": false, "isVerse": true }
```

Six of those ten fields are derivable. `book`/`chapter`/`verse` come from the
key, `segmentTitle` from `SegmentTitles.json`, `isChapter`/`isVerse` from
whether a verse number is present, `content` duplicates `verse`.

### D0 · Slim the index (do this first)

**New:** `scripts/build-verse-index.js` → `assets/data/verseSearchIndex.json`

Target shape — a book table plus a segment table, and a flat map to a
three-number tuple:

```json
{ "books": ["Genesis", "Exodus", …],
  "segs":  ["S001", "S002", …],
  "v": { "0-1-1": [0, 0, 40], "0-1-2": [0, 0, 200] } }
```

`[segIndex, blockIndex, position]`. Expect ~700 KB–1 MB from 6.6 MB. Confirm the
real figure by running the script — do not assume it.

Load it **lazily**: a `getVerseIndex()` in `utils/reference.ts` that `require`s
on first search, never at boot. Nothing should parse a megabyte to render the
Read tab.

Keep `verseIndex.json` out of the bundle once the slim one lands — add it to
`.gitignore`'s bundle-exclusion block alongside `FRA-Bible.json`, or delete it if
the generator can rebuild it from source.

### D1 · Reference parsing

**New:** `utils/reference.ts`

| Step | Detail |
| --- | --- |
| Normalise | lowercase, strip punctuation, collapse whitespace, accept `.` `:` `,` as the chapter/verse separator, accept a leading ordinal in either form (`1 co`, `1co`, `i cor`, `premier`) |
| Resolve book | alias table (D2) → canonical book index |
| Look up | `v["<bookIdx>-<ch>-<vs>"]`; chapter-only queries resolve to verse 1 |
| Return | `{ segmentId, position, book, chapter, verse }` or a disambiguation list |

Wire the result through [`utils/openSegment.ts`](../utils/openSegment.ts) with a
new `pos` param.

**Sub-task, and the one that will take longest:** the reader has to *act* on
`position`. [`app/(tabs)/[segment]/index.tsx`](../app/(tabs)/[segment]/index.tsx)
currently opens at the top. It needs to accept `pos`, find the block via
`onLayout` offsets, and `scrollTo` with a highlight pulse on arrival. Budget half
a day for this alone; it is not a lookup problem.

### D2 · Alias table

66 books × { canonical, common abbreviations, French name, French
abbreviations }. Ship as `assets/data/bookAliases.json` so it is data, not code.

Ambiguity must resolve to a **choice**, not a guess:

| Input | Shows |
| --- | --- |
| `phil` | Philippians · Philemon |
| `jud` | Jude · Judges |
| `jo` | John · Job · Joel · Jonah · Joshua |
| `jean` (fr) | Jean · 1 Jean · 2 Jean · 3 Jean |

Rule: an exact canonical match wins outright; a prefix matching more than one
book shows all of them as rows.

### D3 · Expand in place

Voice and book rows in the search results currently navigate away.
[`ThreadList.tsx:389–440`](../components/thread/ThreadList.tsx) — reuse the
division→book→story accordion built in B2 so a search for `David` expands to his
34 stories inline, exactly like a book opens in the thread.

### Acceptance — run every one of these

`gen 4:3` · `Genesis 4:3` · `gn 4.3` · `GEN 4 3` · `1 co 13` · `1co13` ·
`phil 1:1` (two rows) · `jo` (five rows) · `rev 22` · `psalm 23` ·
`Jean 3:16` in French · `Genèse 1` in French · `David` (expands, no navigation) ·
`zzz` (empty state, no crash).

---

## 3 · G2 · French

Base string files are **already at parity** — 464 EN keys against 486 FR,
nothing missing; `thread-ui.json` is 69/69 both ways. The gap is not in the
dictionaries. It is in the five places below.

### G2a · A Settings screen — the regression fix, and the biggest piece

**New:** `app/settings.tsx`. Repoint You → Settings from `/About` to `/settings`
and make About a row *inside* it.

Salvage from the orphaned `SettingsModal.tsx`, which already works:

| Carries | From |
| --- | --- |
| Language — English / Français | `SettingsModal.tsx:415–470` |
| French Bible download + size + downloaded-state | `SettingsModal.tsx:55–140`, `BibleDownloadModal.tsx` |
| Font size | `FontSizeContext` |
| Appearance — light / dark / auto | `SyncAppSettingsContext` |
| Orientation lock | `SyncAppSettingsContext` |
| About → the existing legal screen | `app/About.tsx` |

Style it as the MVP2 screens are styled — hairline rows, `palette.hair`,
uppercase micro-labels — not as the SDK 53 modal. Then **delete
`SettingsModal.tsx` and `CustomHeader.tsx`**; they are the source of a large
share of the 55 lint errors, which makes X3 much cheaper.

This also restores the appearance and font controls the step log flagged as
lost at `mvp2-F`.

### G2b · Fix the first-launch prompt

[`_layout.tsx:87–129`](../app/_layout.tsx) — the `Alert` title and body are
hardcoded French regardless of detected locale, and the whole branch is skipped
for `en` devices. With onboarding (G1) and Settings (G2a) both in place, the
cleanest move is to **delete the prompt** and let onboarding ask once, with
Settings as the permanent home. If you keep it, it must be localised.

### G2c · Plans and challenges are English-only

`ReadingPlansChallenges.json` holds 3 plans and 12 challenges,
**~821 words** across `title` / `description` / `shortDescription` /
`longDescription`. There is no French for any of it — `FRA-UI.json` has no plan
keys at all. F1 surfaced `longDescription` on plan detail
([`plan/[id].tsx:117`](../app/(tabs)/plan/[id].tsx)), so a French user now reads
a French screen with an English paragraph in the middle.

Add a `fr` block to the JSON (or a sibling `FRA-Plans.json`) and resolve it in
[`utils/planCatalog.ts`](../utils/planCatalog.ts) the way `utils/localize.ts`
resolves story titles.

### G2d · Small string fixes

- `thread-ui.json` → `fr.thread.divineFilter` is `"Divine"`; should be `"Divin"`.
  (`tabs.plan`, `appearanceAuto`, `questions` are correctly identical.)
- 29 inline `lang === 'fr' ? … : …` ternaries across 11 files. They *work*;
  convert the user-facing ones to `t()` keys for consistency, leave the rest.
  Files: `you.tsx`, `plan/index.tsx`, `ThreadList.tsx`, `TalkAboutCard.tsx`,
  `CheckCircle.tsx`, `NavBook.tsx`, `ink.ts`, `Achievements.tsx`,
  `ReadingPlans.tsx`, `_layout.tsx`, `SettingsModal.tsx` (deleted in G2a).

### G2e · Verify, don't assume

The FR question sets exist (`Questions-FR`, `FamilyQuestions-FR`,
`SchoolQuestions-FR`, `SmallGroupQuestions-FR`). Confirm on device that
`TalkAboutCard` and `Questions.tsx` actually resolve them when language is `fr` —
this was never checked on hardware. Same for the G1 onboarding French copy.

### G2f · French book aliases

Feeds D2. Genèse, Exode, Lévitique, Nombres, Deutéronome … through Apocalypse,
with accent-insensitive matching (`genese` must find `Genèse`).

### Acceptance

Switch to French in Settings and walk every screen: Read L1 and L2, Cast list and
card, Plan list and detail, Saved, You, onboarding, the questions card, the share
sheet, search. No English should survive except scripture itself.

---

## 4 · G3 · Migration and hardware

You have a physical iPhone; Android is emulator-only. That shapes this section.

### G3a · Resolve the schema divergence first

The bundled `sourceview.db` carries `completedSegments`, `sourceReadings` and
`user_settings`. [`api/database-manager.ts`](../api/database-manager.ts) creates
`completed`, `source`, and **no** `user_settings`. Either that root-level `.db`
is a stale dev artifact, or shipped installs have tables the current code never
reads. Establish which **before** any migration testing, by pulling the real
database off a device running 1.2.1 — not by reading the repo file.

Also: `CURRENT_DB_VERSION` is still `1`
([`database-diagnostics.ts:54`](../api/database-diagnostics.ts)) and has not
moved across all of MVP2, although `group_reading_sessions` and
`group_segment_completion` are now written by nothing. Decide: bump to `2` with a
cleanup migration that drops them, or leave them dormant. Dormant is safer and
costs a few KB; dropping is tidier and risks a partial migration on a
mid-upgrade crash. **Recommend: leave them, bump the version anyway** so a future
migration has a rung to stand on.

### G3b · The iPhone pass — the one that has to be real

1. Install **1.2.1 build 20** from TestFlight on the physical iPhone.
2. Generate real data: complete six stories across two divisions, react to four
   turns, write two notes, start `Bible1Year` and pause it, build a 3-day streak.
3. Back the database up (`eas` dev client + `expo-file-system`, or Xcode's
   container download) so the corpus is reusable.
4. Install the MVP2 build over the top — **do not delete the app first.**
5. Check, in order:

| Check | Expect |
| --- | --- |
| Completions | all six still complete, in the right divisions |
| Reactions | all four, correct emoji, on the right turns |
| Notes | both present, text intact |
| Active plan | `Bible1Year` still active, still paused, correct % |
| Streak | 3 days, not reset |
| Onboarding | `onboardingVersion` 1 → 2, v2 shows **once**, never again |
| Settings | language, font size, appearance survive |
| Continue card | resolves to the right next story, not S001 |

6. Then the **C device checklist**, never yet run on hardware: S008 left/right
   alternation on a four-ink story; Cast list order and pills; a late-division
   thread (Revelation) drawing correctly; You year thread at zero; the reader
   carrying no gutter line and no speaker dots.
7. Then the **share pass** — which needs X1 first (below).

### G3c · Android, emulator-only

Emulators: **API 36 Pixel** (target) and **the minimum API you support** on a
small-screen profile. The second one matters more — it is where the JSON payloads
and the thread SVG will hurt.

| Check | Why |
| --- | --- |
| Cold-start time and memory after the slim verse index lands | 6.6 MB → ~1 MB was the point of D0 |
| Back button on plan detail, cast card, reader | Android-only, and A4 moved these routes |
| Edge-to-edge insets on a gesture-nav profile | changed in the SDK 57 upgrade |
| Thread SVG on a 320 dp width | B1 generates the path from `onLayout` |
| Haptics no-op cleanly | `utils/haptics.ts` |
| French Bible download over a throttled connection | 49.7 MB |

### G3d · About the "blind" Android release

Worth being precise, because it changes the plan: **do not ship Android blind.**
`eas.json`'s `production-android` submit profile already targets
`"track": "internal"`. Push there, install on the emulator from Play itself, and
promote to production only after the iPhone pass is green. That is a day of
calendar time, not a day of work, and it gets you a real Play install without a
physical device.

And OTA will not cover what you might hope. `runtimeVersion.policy` is
`appVersion`, so an `eas update` only reaches builds whose version string matches
— **1.3.0 updates reach 1.3.0 binaries only**, and any native change (view-shot
included) needs a new binary regardless. OTA is a JS-fix safety net inside a
version, not a way to fix a bad Android release.

**Blocker:** `eas.json` points the Android submit at
`./google-service-account.json`, which **does not exist**. Creating it — a Google
Cloud service account, the Play Android Publisher API enabled, the key linked in
Play Console under Users & permissions — takes an hour and can be done today. Do
it early; it is pure lead time.

---

## 5 · X · The deferred items

### X1 · A native build for view-shot

`react-native-view-shot@5.1.0` is in `package.json` but the dev client predates
it, so H1's image share silently falls back to sharing the citation text. Share
is the item your own build queue calls *"the one thing only this app can share"*,
and it has never been seen working.

```bash
npx eas build --platform ios --profile development
```

Do this **at the start** of the run, not the end — the build wait is dead time
you can spend on D0. Then verify the card renders: speaker name, ink colour,
reference, wordmark, correct on dark and light.

### X2 · ChronologicalMappings

`ReadingPlans.tsx` is registered with `href: null` but is still a reachable
route, and it imports `ChronologicalView.tsx`, which imports the 95 KB
`ChronologicalMappings.json`. The MVP2 plan screens replaced it.
**Delete `ReadingPlans.tsx`, `ChronologicalView.tsx`,
`ChronologicalSegmentItem.tsx` and the JSON**, and drop the `Tabs.Screen` entry
at [`_layout.tsx:31`](../app/(tabs)/_layout.tsx). Same for `Achievements` if
nothing in the MVP2 screens routes to it — check before deleting.

This closes H6, removes ~95 KB, and takes another slice out of the lint count.

### X3 · Lint

55 errors / 204 warnings today. Deleting `SettingsModal`, `CustomHeader`,
`ReadingPlans` and `ChronologicalView` will remove most of the errors for free —
re-run and re-count **after** G2a and X2 rather than triaging now. Then fix what
is left in app code and leave the `react-hooks/set-state-in-effect` warnings; do
not let this become a refactor.

### X5 · Four decisions still on you

| | Blocks |
| --- | --- |
| Division titles — the ten in the thread are placeholders | screenshots (G4), and every screenshot you take before they land is wasted |
| Promotion out of Supporting Cast — "72 Disciples" reads as Main Character, Sarah does not | Cast, already shipped at `mvp2-E` with the current rule |
| Where Revelation falls in the spoken/written split | Cast counts |
| API 36 extension to 1 November — file it regardless | Play deadline |

Division titles are the urgent one: they are on every Read-tab screenshot.

### X6 · Version and release mechanics

- `app.json`: version `1.3.0`, iOS `buildNumber` 21, Android `versionCode` 21.
  `eas.json` sets `autoIncrement: false` on both production profiles, so **every
  build needs a manual bump.** Bump on each TestFlight upload, not once.
- Confirm the branch↔channel link before relying on OTA: `eas channel:view production`.
- The `production` iOS profile sets `"scheme": "SourceViewTogether"`, but `/ios`
  and `/android` are gitignored and prebuilt. Harmless if the scheme name matches
  what prebuild generates; verify on the first production build rather than
  discovering it at submit time.

---

## 6 · G4 · Store listing

### Copy

- `PRIVACY_POLICY.md` has **5 QR references and 1 camera reference**;
  `privacy-policy.html` has 2 and 1. The camera permission is gone from
  `app.json` and the QR screens were deleted in `397b0d7`. Both files must be
  rewritten and the HTML re-hosted at whatever URL the listing points to —
  Apple checks that the link resolves.
- `APP_DESCRIPTION.md` is already clean of both.
- App Privacy (Apple) and Data Safety (Play): local-only storage, no account, no
  camera, no third-party analytics. Simpler than last time — say so.
- What's New, EN and FR. `metadata-fr-template.json` exists as a starting point.

### Screenshots

Take these **after** division titles land (X5) and **in both languages.**

| Platform | Sizes |
| --- | --- |
| iOS | 6.9" and 6.7" iPhone, plus **iPad** — `supportsTablet: true` makes iPad screenshots mandatory |
| Android | phone, 7" and 10" tablet |

Six shots, and they should tell the story the redesign tells: the thread with a
division open · a four-ink story mid-conversation · the call sheet expanded · a
Cast card with its division buckets · plan detail · the share card.

If iPad is not actually a supported experience, set `supportsTablet: false`
instead and save yourself a device class — decide this before you start shooting.

---

## 7 · Sequence

Order matters here: X1 goes first because it is a build wait, the Play service
account goes first because it is lead time, and screenshots go last because
division titles gate them.

| Day | Work |
| --- | --- |
| **1** | Kick off the view-shot dev-client build (X1) · create the Play service account (X6) · **D0** slim index script while both run |
| **2** | **D1** parsing + `utils/reference.ts` · reader `pos` param and scroll-to |
| **3** | **D2** alias table EN+FR · **D3** expand in place · run the D acceptance list |
| **4** | **G2a** Settings screen · delete `SettingsModal` + `CustomHeader` |
| **5** | **G2b–G2d** prompt, plan translations (821 words), string fixes · **X2** delete Chronological + ReadingPlans · re-run lint (**X3**) |
| **6** | **G3a** schema question · **G3b** iPhone migration pass with a real 1.2.1 corpus · C device checklist · share verification |
| **7** | **G3c** Android emulator matrix · fix what both passes found |
| **8** | Division titles land (**X5**) → **G4** screenshots EN+FR, all device classes · privacy policy rewrite |
| **9** | Store copy, App Privacy, Data Safety · bump `buildNumber`/`versionCode` · production builds both platforms |
| **10** | **TestFlight** external + Play **internal track** · soak |
| **11–12** | Feedback fixes · promote to App Store review and Play production |

**10–13 working days**, against the 7–8 the build queue estimated for G alone.
The difference is G4, the Settings regression, and the five deferred items.

### If you have to cut

Cut **D3** (expand in place — search still works, it just navigates) and **G2d's
ternary conversion** (cosmetic). Do not cut the Settings screen, the migration
pass, or the privacy policy rewrite; the first is a review risk, the second is a
data-loss risk, the third is a rejection.

---

## 8 · Definition of ready for TestFlight

- [ ] `npx tsc --noEmit` passes
- [ ] Lint errors in app code at zero (warnings allowed)
- [ ] A French user can switch to English and back from Settings, and the choice survives a restart
- [ ] `gen 4:3` opens Genesis 4 at verse 3
- [ ] A real 1.2.1 database upgrades with zero data loss on a physical iPhone
- [ ] The share card renders as an image, not a fallback citation
- [ ] No QR or camera reference survives in the app, the listing, or the privacy policy
- [ ] `buildNumber` and `versionCode` bumped
- [ ] Division titles are final
