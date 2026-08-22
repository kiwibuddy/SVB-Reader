# Store listing copy — SourceView Together 1.3.0

Paste into App Store Connect and Google Play Console. User-facing copy describes this version only. Do not mention former session features.

**Term:** source colors (never “ink”).

---

## Apple — subtitle (30 characters)

```
Bible by voice — read together
```

## Apple — promotional text (170 characters)

```
A Bible you read by voice. Every word is attributed to who spoke it, in four source colors. Follow 365 stories on the thread. Read alone, or sit together and take a color.
```

## Apple — keywords (100 characters, comma-separated, no spaces after commas)

```
bible,bible study,reading plans,sourceview,scripture,family,small group,faith,nlt,christian
```

Count: 91 characters.

## Apple / Play — description (English)

```
SourceView Together is a Bible you read by voice.

Every word is attributed to who spoke it — 774 voices across 365 stories, in four source colors. Narrator, divine speech, named principals, and everyone else each have a color, so conversation in Scripture is clear at a glance.

Follow the year on a visual thread. Each story is a complete narrative, about fifteen to twenty minutes, not a chapter checkbox. Meet the voices you have heard in Cast. Start a plan or a shorter challenge. Keep a daily streak. React and take notes on the words that land.

Read alone, or sit together. Open the same story, take a source color, and read that voice aloud. After the story, Talk about it offers discussion questions for family, school, or small group.

English and French. New Living Translation. Reading progress stays on your device. Optional daily reminders are scheduled on this device only.

Free. No ads, no subscriptions.
```

## Play — short description (80 characters)

```
A Bible you read by voice — 365 stories in four source colors.
```

Count: 64 characters.

---

## What's New — English

```
A new reading experience.

Every word is attributed to who spoke it, in four source colors. Follow 365 stories on the thread, meet voices in Cast, and read together by taking a color.

Daily reminders, a streak that follows your calendar, and discussion questions after each story. English and French.
```

## What's New — French

```
Une nouvelle façon de lire.

Chaque parole est attribuée à qui l’a dite, en quatre couleurs de source. Suivez 365 récits sur le fil, rencontrez les voix dans la distribution, et lisez ensemble en prenant une couleur.

Rappels quotidiens, une série selon votre calendrier, et des questions pour en parler après chaque récit. Anglais et français.
```

---

## App Privacy (Apple) / Data Safety (Play)

Update labels to match 1.3.0:

- **Crash diagnostics (Sentry):** yes. Not linked to user identity. Device type, OS version, stack traces. No names, email, or account.
- **Analytics / advertising / tracking:** no.
- **Account / contact / location / camera:** no.
- **Local notifications:** yes, on-device only (reading reminders). No push tokens sent to SourceView servers.

Paste after Sentry is live in the binary. Re-host `privacy-policy.html` at the listing URL.

---

## Console paste checklist (do before submit)

- [ ] App Store Connect: subtitle, promotional text, description, keywords, What’s New EN + FR
- [ ] Play Console: short description, full description, What’s New
- [ ] App Privacy / Data Safety: crash diagnostics = yes (Sentry)
- [ ] Privacy policy URL still resolves (updated HTML)

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
- [ ] Test crash appears in Sentry
- [ ] Tenth completed story requests a review once; second trigger does not
- [ ] OTA download does not relaunch mid-session; next cold start applies it
- [ ] `sourceview://` opens the app
- [ ] Splash and icons are not grey `#808080`
- [ ] Settings Dark vs Auto survive restart
- [ ] Daily reminder fires on a physical device

Do **not** start the production EAS build until `EXPO_PUBLIC_SENTRY_DSN` is set.

