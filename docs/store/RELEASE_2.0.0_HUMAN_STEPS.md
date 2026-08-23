# 2.0.0 release — human console steps

Repo-side release prep is on branch `release/2.0.0`. These steps cannot be finished from the repo alone.

## Before production EAS build

1. **Confirm build numbers in consoles**
   - App Store Connect: use iOS build **25** (build 24 rejected — Error 90101 dropped iPad; `supportsTablet` restored to `true`)
   - Play Console: Android `versionCode` **23** is fine (90101 is Apple-only)
   - If higher exists, bump `app.json` and rebuild with `autoIncrement: false` still set

2. **EAS secrets / env**
   ```bash
   npx eas-cli env:list --environment production
   # REQUIRED before claiming crash reporting in store privacy:
   # npx eas-cli env:create --name EXPO_PUBLIC_SENTRY_DSN --value "…" --environment production --visibility sensitive
   # Optional source maps: SENTRY_AUTH_TOKEN
   ```
   As of prep: production env had **no** variables — set DSN before relying on Sentry in the binary.

3. **Play service account**
   - Place `google-service-account.json` at repo root (gitignored)
   - Path must match `eas.json` → `submit.production-android.android.serviceAccountKeyPath`

4. **Privacy URL**
   - Host updated `privacy-policy.html` (uninstall-only deletion language) at a stable HTTPS URL
   - Paste that URL into App Store Connect + Play Console

## Store listing paste (from `docs/store/STORE_LISTING_2.0.0.md`)

- [ ] ASC: subtitle, promotional text, description, keywords, What’s New EN
- [ ] Play: short description, full description, What’s New
- [ ] **Scrub** any live PIN / QR / host-session wording from both consoles
- [ ] Do **not** claim French UI while `FRENCH_ENABLED` is false
- [ ] App Privacy / Data Safety: crash diagnostics (Sentry) = yes

## After production binary

- [ ] TestFlight / Play internal smoke (hardware checklist in store listing doc)
- [ ] Submit App Store review (Apple first)
- [ ] Promote Play internal → production
- [ ] Record production fingerprint; only then `npm run update:production`

### Production fingerprints (2.0.0)

| Platform | Build ID | App version / build | Fingerprint hash |
| --- | --- | --- | --- |
| iOS | `58f7055b-252e-43b8-ab55-94c42c1a9b7a` | 2.0.0 (24) **FAILED ASC 90101** | `e5578c26c01447e68840110d7620802185df197b` |
| iOS | `38254b2e-28fe-438f-99ee-5fc0662963b7` | 2.0.0 (25) submitted (iPad restored) | `f9d9eb63e0d3500524486afbc0155ef8ca24a327` |
| Android | `fbdf5fa5-8074-470d-8dd2-9477b107bf17` | 2.0.0 (23) | `421ba001bc5a7c4952bdbb6048cdffd5ed3a9879` |

OTA: only run `npm run update:production` after both store binaries are live and fingerprints match the update runtime.
