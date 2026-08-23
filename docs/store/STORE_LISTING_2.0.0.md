# Store listing copy - SourceView Together 2.0.0

Paste into App Store Connect and Google Play Console. User-facing copy describes this version only. Do not mention former session features (PIN/QR host), camera, ads, or subscriptions.

**Term:** source colors (never “ink”).

**Avoid:** never claim the app narrates or plays audio - no “read by voice,” “listen,” “audio,” “narrated.” There is no narration or text-to-speech; the format is visual: colored, attributed text you read with your eyes (and, with others, read aloud yourself). “Voices” as a noun for distinct attributed speakers (774 voices, Cast, “take a color and read that voice aloud”) is fine - that's not a narration claim, it's what the person does.

**Core pitch (use this as the throughline, don’t drift from it):** Scripture is laid out like a text thread - every line colored by who’s speaking (narrator, divine speech, principals, everyone else) - so conversation in the Bible reads the way people already read conversation. The whole Bible is 365 complete narrative stories, not chapter-and-verse fragments. Read it alone, or gather people to each take a color and read the scene aloud.

**Language:** product UI is English-only while `FRENCH_ENABLED` is false - do **not** claim French in descriptions or What’s New. Do not paste a French What’s New unless French is enabled and QA’d.

**In-app product language (match this):** Plans tab → **Your Plans**; actions **Create plan** / **Create reading plan**; empty hint about a playlist of stories.

**Supersedes:** `docs/store/STORE_LISTING_1.3.0.md` for the 2.0.0 submit.

---

## Apple - subtitle (30 characters)

```
Bible in color, together
```

Count: 24 characters.

## Apple - promotional text (170 characters)

```
Scripture colored by who's speaking, like a text thread. Follow 365 stories, or build Your Plans. Read alone, or take a color together.
```

Count: 135 characters.

## Apple - keywords (100 characters, comma-separated, no spaces after commas)

```
bible,bible study,reading plans,sourceview,scripture,family,small group,faith,nlt,christian
```

Count: 91 characters.

## Apple / Play - description (English)

```
SourceView Together turns Scripture into a thread you can actually follow.

Every line is colored by who is speaking - narrator, divine speech, named principals, and everyone else - the same way you already read a group text. At a glance, you know who's talking and how the conversation moves, across 774 distinct voices and 365 stories.

The Bible is laid out as 365 complete narrative stories, not chapter-and-verse fragments. Each story is a whole arc - Creation read start to finish in one sitting, about fifteen to twenty minutes, with nothing lost to an artificial chapter break. Follow the year on a visual thread, open a division, pick a story, and keep going. Meet the cast of voices as you go - Cast tracks who you've heard, how often, and where.

Read alone, or gather a few people and read it like a script: each person takes a source color and reads that voice aloud, so the story plays out as a conversation. After the story, Talk about it offers discussion questions for family, a class, or a small group.

Keep a daily streak, react and leave notes on the words that land, and see your reading history as a heatmap on the You tab. Search by verse when you need a specific place in Scripture. Follow a catalog plan or a shorter challenge, or open Your Plans and build your own reading plan as a playlist of stories.

English. New Living Translation. Reading progress, notes, and reactions stay on your device. Optional daily reminders are scheduled on this device only. French returns in a later update.

Free. No ads, no subscriptions.
```

## Play - short description (80 characters)

```
Scripture colored by speaker, like a text thread - 365 stories, Your Plans.
```

Count: 75 characters.

---

## What's New - English

Paste-ready for App Store Connect + Google Play:

```
Your Plans: build your own reading plan.

Pick stories into a playlist, name it, and follow it like any other plan. The reading experience is redesigned, the You tab shows your reading heatmap and insights, and verse search helps you find a specific place fast. Also polished: dark mode, fonts, and traditional division names.

Still free. Progress stays on your device. No ads, no subscriptions.
```

## What's New - French

**Do not paste** while `FRENCH_ENABLED` is false. Keep ASC/Play French locales aligned with English-only product claims, or leave FR What’s New empty / unupdated until French ships.

---

## App Privacy (Apple) / Data Safety (Play)

Update labels to match 2.0.0:

- **Crash diagnostics (Sentry):** yes. Not linked to user identity. Device type, OS version, stack traces. No names, email, or account.
- **Analytics / advertising / tracking:** no.
- **Account / contact / location / camera:** no.
- **Local notifications:** yes, on-device only (reading reminders). No push tokens sent to SourceView servers.

Paste after Sentry is live in the binary. Re-host `privacy-policy.html` at the listing URL.

---

## Console paste checklist (do before submit)

- [ ] App Store Connect: subtitle, promotional text, description, keywords, What’s New **EN** (no French UI claims)
- [ ] Play Console: short description, full description, What’s New
- [ ] Scrub any leftover PIN / QR / host-session wording from live listings
- [ ] App Privacy / Data Safety: crash diagnostics = yes (Sentry)
- [ ] Privacy policy URL still resolves (updated HTML)
- [ ] Screenshots reflect 2.0 UI; include Your Plans if possible

## EAS secrets (required before production build)

```bash
eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value "https://YOUR_KEY@oXXXX.ingest.sentry.io/XXXX"
eas secret:create --name SENTRY_AUTH_TOKEN --value "YOUR_SENTRY_AUTH_TOKEN"
```

Create the Sentry project `sourceview-together` first. `SENTRY_ALLOW_FAILURE=true` is set on the production EAS profile so a missing token does not fail the binary.

---

## Hardware verification (native binary)

Run after EAS production/preview build, before store submit:

- [ ] 1.2.1 database on a physical iPhone upgrades with streak, completions, and notes intact
- [ ] Fresh install: onboarding, first story, reminder prompt (not review)
- [ ] Your Plans: Create plan / Create reading plan, start and read, delete with confirm
- [ ] Test crash appears in Sentry
- [ ] Tenth completed story requests a review once; second trigger does not
- [ ] OTA download does not relaunch mid-session; next cold start applies it
- [ ] `sourceview://` opens the app
- [ ] Splash and icons are not grey `#808080`
- [ ] Settings Dark vs Auto survive restart
- [ ] Daily reminder fires on a physical device
- [ ] Settings language matches flag (English-only if French off)

Do **not** start the production EAS build until:

1. `main` contains the custom / Your Plans feature (see release plan gate)
2. `EXPO_PUBLIC_SENTRY_DSN` is set
