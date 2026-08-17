# Critical path — do this before any design work

Both app stores have closed their doors on the current build, for two unrelated
reasons. One has a deadline you can still get ahead of.

Full detail: [`audit/maintenance-audit.html`](audit/maintenance-audit.html).
Audited statically at `f07b650` on 8 August 2026 — nothing was installed,
compiled, or run, so a real build will likely surface more.

## The two blockers

**B1 · iOS — blocked, deadline already passed.** Since 28 April 2026, every
iOS upload must be built against the iOS 26 SDK (Xcode 26). Expo SDK 53 cannot
do that; SDK 54 is the floor. No partial fix, no extension. Note this raises the
*build* SDK only — `deploymentTarget` 15.1 can stay, so no users get dropped.

**B2 · Android — 31 August 2026.** `app.json` pins `targetSdkVersion: 34` and
`compileSdkVersion: 34` via `expo-build-properties`, a deliberate downgrade from
SDK 53's own default of 35. Two consequences, one already live:

- Since 31 August 2025, apps below API 35 stop being discoverable to new users
  on newer Android devices. Your Play listing has likely been invisible to a
  growing share of new users for a year.
- From 31 August 2026, Play rejects any update below API 36 outright.

An extension to 1 November 2026 can be requested. **If the timeline below
doesn't fit, request it now rather than later** — it costs nothing and buys two
months.

Both roads lead to the same destination: Expo SDK 57.

## Order of work

### Step 0 — Make `main` the app again

`Nov-New-Build-` is a strict descendant of `main`, so this is a fast-forward.

```bash
git checkout main
git merge --ff-only origin/Nov-New-Build-
git push origin main
```

Do this before the upgrade, so the SDK work has an ordinary branch to land on.
28 of 31 branches are already fully contained in `Nov-New-Build-` and can be
deleted. Five hold 12 unique commits from Jan–June 2025, all on the pre-rebrand
codebase and all superseded — check them if you want, then delete.

### Step 1 — Reconcile versions and the manifest

Safe on SDK 53. Get a clean baseline first, so the first red build after the
upgrade means something.

- **Settle the build number.** `app.json` says version 1.2.1 / build 20 /
  versionCode 20. But `ios/SourceViewTogether/Info.plist` says **19** and
  `android/app/build.gradle:95` says `versionCode 19`. With native directories
  committed and `eas.json` set to `appVersionSource: "local"`, **the native
  values win** — so the commit labelled "Testflight v1.2.1 (Build 20)" most
  likely produced a binary stamped 19. Check what TestFlight actually holds
  before assuming.
- **Declare three phantom packages.** `@react-navigation/bottom-tabs`,
  `@react-navigation/elements` and `expo-file-system` are imported but never
  declared — the last used in earnest by `services/BibleStorageManager.ts` and
  `services/QuestionsLoader.ts`, both core to loading Bible content. They
  resolve today only via hoisting.
- **Delete `expo-av` and `expo-video`.** Nothing imports either — no `Video`,
  no `Audio.Sound`, anywhere. They sit in `package.json` and the `plugins` array
  as pure residue. The SDK 55 removal of `expo-av` is normally the headline cost
  of an upgrade this size; here it is free.
- **Remove the dead barcode-scanner comment** at `app/(tabs)/Home.tsx:17`. QR
  scanning correctly moved to `expo-camera` long ago.

```bash
npx expo install @react-navigation/bottom-tabs @react-navigation/elements expo-file-system
npm uninstall expo-av expo-video
```

Then remove `"expo-av"` and `"expo-video"` from the `plugins` array in
`app.json`. Verify the app still builds and runs before moving on.

### Step 2 — Decide managed vs bare. This is the fork in the road.

`ios/SourceViewTogether.xcodeproj`, a `Podfile`, and a full `android/` Gradle
project are all committed. **That means `npx expo install` alone will not
upgrade you** — the native projects hold their own copies of the build settings
and won't move on their own.

Diff `ios/` and `android/` against a fresh `expo prebuild --clean` on SDK 53:

```bash
git status --porcelain ios android > /tmp/before.txt
npx expo prebuild --clean
git status --porcelain ios android
```

- **If nothing meaningful differs → return to managed (recommended).** Delete
  `ios/` and `android/`, let prebuild regenerate them from `app.json` on every
  build. Every future SDK upgrade becomes a one-line version bump.
- **If real hand-edits exist → stay bare.** Document them now, because you will
  be re-applying them by hand across four SDK versions.

Settle this before touching a version number.

### Step 3 — Upgrade to SDK 57 and API 36

Go straight across rather than one SDK at a time. SDK 56→57 and RN 0.85→0.86
carry no breaking changes; the real work sits at the 53→54 and 54→55 boundaries
regardless of how many steps you take getting there.

```bash
npx expo install expo@^57.0.0
npx expo install --fix
npx expo-doctor
```

Raise `targetSdkVersion` and `compileSdkVersion` to **36** in the same pass.

| | Current | Needed |
| --- | --- | --- |
| `expo` | ~53.0.23 | 57.x |
| `react-native` | 0.79.6 | 0.86.x (carried by the SDK bump) |
| android `targetSdk` | 34 | **36** |
| ios `deploymentTarget` | 15.1 | verify against SDK 57 |
| `react-native-reanimated` | ~3.17.4 | 4.x |
| React | 19.0.0 | 19.2 (carried) |

### Step 4 — Clear the fallout

**Expect this step, not step 3, to consume the time.**

- **U1 · Android edge-to-edge becomes mandatory.**
  `android/gradle.properties:59` sets `expo.edgeToEdgeEnabled=false`. SDK 54
  makes edge-to-edge mandatory and *deletes that opt-out*, so content will draw
  beneath the system bars whether or not your layouts expect it. This is the
  most likely source of visible breakage.
- **U2 · Reanimated 4 relocates its runtime.** v4 is New-Arch-only (you already
  satisfy that) but moves its core into `react-native-worklets`, installed
  alongside and registered in the Babel config. Configuration work, not
  rewriting animations.
- **U4 · One deprecated import.** `app/(tabs)/[segment]/index.tsx:4` still
  imports `SafeAreaView` from `react-native`, deprecated since RN 0.81.
  `react-native-safe-area-context` 5.4.0 is already a dependency and used
  correctly elsewhere — one-line change.
- **L4 · `runtimeVersion` is a hardcoded string.** It is pinned to `"1.2.1"`
  with updates set to `ON_LOAD`. Because it is pinned rather than derived by
  policy, it will not move when native code changes — and an OTA update built
  against SDK 57 delivered to a binary built on SDK 53 **crashes on launch**.
  This must be changed *as part of* the upgrade, not after it.

### Step 5 — Test on real hardware, both platforms

- **iOS 26 device** for Liquid Glass. Building against the iOS 26 SDK opts you
  into the new material for navigation bars, tab bars and sheets — not
  deferrable. This app uses a custom header and a `BlurView` tab background,
  which interact with it directly. A simulator understates this.
- **Android 16 device** for edge-to-edge.
- Walk the full reading flow in **both English and French** — the localisation
  is the newest and least-exercised code in the app.

Ship a compliant 1.3.0. **Only then start MVP2 design work.**

## Already handled — do not spend time here

- **New Architecture is on** everywhere, with Hermes. The legacy architecture
  was dropped in SDK 55; this would have been the single most expensive item.
- **The dependency manifest is clean** on this branch — no deprecated
  `@types/react-native`, no legacy `expo-cli`, no committed `dist/`,
  `expo-haptics` properly declared. All of these are wrong on `main` and right
  here.
- React 19.0.0 and RN 0.79.6 are correctly matched to SDK 53.

## Hygiene — worth doing while you are in there

- **100 MB of source Bibles at the repo root.** `FRA-Bible.json` (50 MB) and
  `FRA-Bible-with-questions.json` (50 MB) are imported by no application code —
  they are inputs to `scripts/`, not app assets. Every clone pays for them
  forever.
- **25 MB of JSON ships inside the binary.** `assets/data/` is dominated by
  `newBibleNLT1.json` (15 MB) and `verseIndex.json` (6.4 MB), parsed at runtime.
  Real download size, real startup cost on low-end devices. You already have
  `expo-sqlite` and a substantial database layer — moving the bulk text there
  would pay off on both counts. A project, not a fix.
- **Tracked cruft**: `backup_code/`, `dist-android/`, `api/sqlite.ts.backup`,
  a committed `sourceview.db`. The `.backup` file shadows the real module in
  searches.
- **`scheme: "myapp"`** is still the template default. Deep links resolve as
  `myapp://` — unbranded and liable to collide.
- **`RELEASE_NOTES_1.2.1.md` is dated a year early** — "January 2025", but the
  commits behind that build run October–November 2025.

## Not covered by the audit

- Whether the app builds today. No install, no type check, no bundle.
- Whether `ios/` and `android/` contain hand-edits — the step 2 decision.
- What TestFlight actually holds, and whether the live listing matches
  `com.sourceview.together`. Both need the consoles.
- The database layer — seven modules including migrations — and how it behaves
  across an app update with an existing user database.
- Correctness of the French translations. The plumbing is wired; the content
  was not checked.
- Apple's privacy-manifest requirements for your dependency set on SDK 57.
