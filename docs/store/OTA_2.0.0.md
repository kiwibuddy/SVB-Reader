# OTA for 2.0.0 (TestFlight build 25)

TestFlight **2.0.0 (25)** only installs JS updates whose runtime is exactly:

`f9d9eb63e0d3500524486afbc0155ef8ca24a327`

That hash is baked into the native binary (EAS build `38254b2e-28fe-438f-99ee-5fc0662963b7`). It is **not** recomputed from the current git tree.

## Why a plain publish misses the phone

`app.json` uses `"runtimeVersion": { "policy": "fingerprint" }`. Publishing from this laptop currently fingerprints iOS to `7fd8cc0b645f7a23e0e19d62ad11dc0ec488ede6` (`eas.json` hashing differs from the cloud build). Expo stores that bundle under `7fd8cc0b…`. Build 25 asks for `f9d9eb63…` and skips it.

Android Play **2.0.0 (23)** is a separate runtime: `421ba001bc5a7c4952bdbb6048cdffd5ed3a9879`. An iOS OTA never reaches Android.

## Command that works

```bash
# iOS TestFlight 2.0.0 (25) — default
npm run update:production -- -m "what changed"

# Android Play 2.0.0 (23)
npm run update:production:android -- -m "what changed"

# See which recent publishes the phone can actually install
npm run ota:status
```

Those scripts pin `app.json` `runtimeVersion` to the store hash for the publish only, then restore fingerprint policy. **Do not commit** a pinned `runtimeVersion`.

Do **not** run `npx eas-cli update` / `eas update` directly while fingerprint policy is in `app.json`.

## How the phone applies it

`updates.checkAutomatically` is `NEVER`. The app downloads in the background and reloads on the **next cold start**:

1. Force-quit SourceView Together (swipe away).
2. Open once (download).
3. Force-quit again, open (apply).

A fresh TestFlight install first runs the JS **inside the binary**. You still need those two cold starts after install.

Settings → Info shows `binary` until an OTA is applied, then a short update id.

## Do not

- Publish with dirty `app.json` / `eas.json`
- Leave a pinned `runtimeVersion` committed
- Expect `7fd8cc0b…` updates to appear on build 25
- Change native config (`app.json` ios/android, plugins, permissions) via OTA — that needs a new binary and a new runtime
