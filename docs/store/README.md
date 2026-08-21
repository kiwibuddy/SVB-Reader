# Store submission — SourceView Together 2.0.0

Everything needed to fill out App Store Connect and Google Play Console for this
release. Written 21 August 2026.

## The files

| File | What it is |
| --- | --- |
| [`APP-STORE-LISTING.md`](APP-STORE-LISTING.md) | Every Apple field, final copy, with character counts. Includes App Privacy answers, reviewer notes and the screenshot brief. |
| [`PLAY-STORE-LISTING.md`](PLAY-STORE-LISTING.md) | Every Play field, final copy. Includes Data safety answers and the asset list. |
| [`RELEASE-NOTES-2.0.0.md`](RELEASE-NOTES-2.0.0.md) | What's New for both stores, plus what was left out and why. |
| [`COPY-RATIONALE.md`](COPY-RATIONALE.md) | The market research behind the register, how the copy signals "Bible app", how it states what is distinctive without comparing, and a fact check of every claim against the code. |

Copy is final. The fenced blocks are meant to be pasted verbatim.

## What changed in the repo

`app.json` was bumped for this release:

| Field | Was | Now |
| --- | --- | --- |
| `version` | 1.3.0 | **2.0.0** |
| `ios.buildNumber` | 21 | **1** |
| `android.versionCode` | 21 | **22** |
| `description` | mentioned the removed camera and QR codes | rewritten to the new positioning |
| `extra.storeKeywords` | generic keyword list | reworked around how people actually search this category |

The iOS build number resets to 1 because `CFBundleVersion` only has to be unique
within a `CFBundleShortVersionString`, and a new version string starts a fresh
sequence. The Android `versionCode` cannot reset — Play requires it to always
increase — so it goes to 22.

Note that `eas.json` sets `autoIncrement: false` on both production profiles, so
**every TestFlight upload needs a manual bump.** And because `runtimeVersion` uses
the `appVersion` policy, OTA updates for 1.3.0 will not reach 2.0.0 binaries.
That is expected for a fresh binary, but it means there is no JS safety net on
2.0.0 until a 2.0.0 build is live.

## Order of work

The first two items are lead time and should start today, before any copy is
pasted anywhere.

1. **Create the Play service account.** `eas.json` points the Android submit at
   `./google-service-account.json`, which does not exist. Google Cloud service
   account → enable the Play Android Publisher API → link the key in Play Console
   under Users & permissions. About an hour of clicking, then it is done forever.
2. **Stand up a real privacy policy URL.** `privacy-policy.html` exists in the
   repo but is not hosted anywhere recorded. Apple checks that the link resolves.
   The same host can serve the support page, which must be a web page and not a
   `mailto:` link.
3. **Finalise the division titles.** They appear on every Read-tab screenshot.
   Any shot taken before they land is wasted.
4. **Verify the three claims flagged in `RELEASE-NOTES-2.0.0.md`** — image share,
   verse reference search, and data survival across the upgrade. The listings
   assert all three.
5. **Shoot screenshots**, all required device classes, per the brief in
   `APP-STORE-LISTING.md`.
6. **Paste the copy**, run the checklist below, submit to TestFlight and the Play
   internal track.

## Pre-submission checklist

Copy and metadata:

- [ ] Apple name, subtitle, promotional text, keywords, description pasted
- [ ] Apple What's New pasted
- [ ] Play app name, short description, full description pasted
- [ ] Play What's New pasted, under 500 characters as Play counts them
- [ ] Apple category set to Reference / Education
- [ ] Play category set to Books & Reference
- [ ] Apple App Privacy set to Data Not Collected; Tracking answered No
- [ ] Play Data safety declared as no data collected, no data shared
- [ ] Content rating questionnaires completed on both
- [ ] Privacy policy URL live and resolving over HTTPS on both
- [ ] Support URL is a working web page, not a `mailto:`
- [ ] **French removed from the supported localisations on both stores** — the
      flag is off in this build, and the copy only says French is returning
- [ ] Reviewer notes pasted into App Review Information

Build:

- [ ] `npx tsc --noEmit` passes
- [ ] Lint errors in app code at zero
- [ ] `version` 2.0.0 in `app.json` matches the version in both consoles
- [ ] `buildNumber` / `versionCode` bumped for this upload specifically
- [ ] No QR-code or camera reference survives in the app, the listing, or either
      privacy policy file
- [ ] Real 1.2.1 database upgrades to 2.0.0 with zero data loss on a physical
      iPhone
- [ ] Share produces an image, not a fallback citation
- [ ] `gen 4:3` opens Genesis 4 at verse 3

Assets:

- [ ] iPhone 6.9" and 6.5"/6.7" screenshots
- [ ] iPad screenshots, or `supportsTablet` set to `false` before shooting
- [ ] Play phone, 7" tablet and 10" tablet screenshots
- [ ] Play feature graphic, 1024 × 500

## Superseded

`APP_DESCRIPTION.md` in the repo root is the previous marketing document. It is
written in a comparative, superlative register that this release deliberately
moves away from, and it contains at least one figure the data contradicts. Do not
paste from it. `COPY-RATIONALE.md` §1 and §4 explain both problems.

`RELEASE_NOTES_1.2.1.md` and `RELEASE_NOTES_1.0.0.md` are internal changelogs
rather than store copy, and are kept only as history.
