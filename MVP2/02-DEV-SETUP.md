# Dev setup — getting running again in Cursor

Everything here is read from the actual config on `Nov-New-Build-` @ `f07b650`,
not from memory. Where something needs checking on your machine, it says so.

## One-time setup

```bash
git clone https://github.com/kiwibuddy/SVB-Reader.git
cd SVB-Reader
git checkout main            # after the fast-forward merge; until then: Nov-New-Build-

nvm use                      # reads .nvmrc → Node 18.20.6
npm install
```

**Node 18.20.6** is pinned in `.nvmrc`. If `nvm use` errors, run
`nvm install 18.20.6` first. Node version mismatches are the most common cause
of "it worked last month and doesn't now" in this project.

You will also want:

```bash
npm install -g eas-cli
eas login                    # account: kiwibuddy
```

EAS project ID is `4b89909c-ac28-498a-9e46-5591000b8616`, owner `kiwibuddy`.

## Running the app day to day

**This project cannot use Expo Go.** `ios/` and `android/` are committed and the
app uses native modules beyond the Expo Go runtime (sqlite, camera, blur,
haptics). You need a **development build** installed on the device or simulator,
then Metro connects to it.

```bash
npm run start:dev        # expo start --dev-client --clear   ← your normal command
```

`--dev-client` targets the development build rather than Expo Go. `--clear`
wipes the Metro cache, which is what fixes most "my change isn't showing up"
problems.

Other entry points, all already in `package.json`:

| Command | What it does |
| --- | --- |
| `npm start` | `expo start` — plain, no dev-client flag |
| `npm run ios` | Start and open the iOS simulator |
| `npm run android` | Start and open an Android emulator |
| `npm run web` | Metro web build |
| `npm run prebuild` | `expo prebuild --clean` — regenerates `ios/` and `android/` |
| `npm run build:local` | `expo run:ios --configuration Release` — local native release build |

Once Metro is running: `r` reloads, `j` opens the debugger, `m` toggles the dev
menu. Saving a file hot-reloads automatically.

### If you don't have a dev build installed any more

That is the likely state after this long a gap. Build one:

```bash
npm run build:dev-local          # eas build --profile development-local
# or, for a cloud build you can install from a link:
eas build --platform ios --profile development
```

`INSTALL_ON_IPHONE.md` in the repo root covers installing to a physical device.
`QUICK_START.md` documents the notes-feature test walkthrough and has an
install link for an old build — that link is from November 2025 and its build
has almost certainly expired, so generate a fresh one.

## Test and lint

```bash
npm test         # jest --watchAll, preset jest-expo
npm run lint     # expo lint
```

Existing tests live in `components/__tests__/`. Coverage is thin — this is a
snapshot-test setup, not a safety net. Do not treat a green `npm test` as
evidence the upgrade worked; step 5 of the critical path is the real check.

## Builds and releases

| Command | Profile |
| --- | --- |
| `npm run build:ios` | production |
| `npm run build:ios-preview` | preview (internal distribution) |
| `npm run build:ios-simulator` | production-simulator |
| `npm run build:android` | production |
| `npm run build:android-preview` | preview |
| `npm run submit:ios` | `eas submit --platform ios` |
| `npm run update:production` | `eas update --branch production` |
| `npm run update:preview` | `eas update --branch preview` |

Seven EAS profiles are defined: `development`, `development-local`,
`development-android`, `preview`, `production`, `production-android`,
`production-simulator`.

### Two traps in the release config

**`appVersionSource: "local"`.** Version and build numbers come from the native
projects, *not* from `app.json`. `app.json` says build 20; `Info.plist` and
`build.gradle` both say 19. The native files win. Check TestFlight before
assuming what you shipped.

**OTA updates are dangerous right now.** `runtimeVersion` is hardcoded to
`"1.2.1"` with `ON_LOAD` updates. Because it is a pinned string rather than a
policy, it will not change when native code does — so an `eas update` published
after the SDK upgrade would be delivered to SDK 53 binaries and **crash them on
launch**. Do not run `update:production` until `runtimeVersion` is fixed as part
of step 4.

## Cursor specifically

There is already a rules file in the repo root:

```
Rules file for cursor for react native@0.78.mdc
```

It targets React Native 0.78 and the app is on 0.79.6, heading to 0.86 — so it
is mildly stale now and will be properly wrong after the upgrade. Worth
rewriting at step 4. Cursor picks up `.mdc` rules files from the project root
and from `.cursor/rules/`; consider moving it to `.cursor/rules/` and splitting
it, which is the current convention.

Two things worth adding to the rules once you upgrade: the Reanimated 4 +
`react-native-worklets` split, and the fact that native directories are
committed (or, if you take the managed route at step 2, that they must never be
edited by hand).

## Fast reference

```bash
nvm use && npm install        # after any branch switch
npm run start:dev             # normal dev loop
npx expo-doctor               # health check — run this first when something is odd
rm -rf node_modules && npm install    # when doctor finds resolution problems
npx expo start --clear        # when a change won't appear
```
