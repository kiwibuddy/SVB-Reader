# Pre-launch review — MVP2 against 2026 premium-app expectations

Written 19 August 2026 against `store-compliance-130` @ `f44fbda`. Read alongside
[`14-SHIP-PLAN.md`](14-SHIP-PLAN.md) — that document is *what is unfinished*;
this one is *what is wrong, and what is missing*, judged against what people now
expect to find in a paid-tier reading app.

Everything below is grounded in the code, with file references. Nothing here is
already covered by the ship plan unless the ship plan is named.

---

## 0 · What is already right

Worth saying, because most of the list below is criticism.

- **Motion is a system, not decoration.** `constants/Motion.ts` has real duration
  tokens, one easing curve, a stagger cap, and `ReduceMotion.System` attached to
  every config. Most indie apps never get here.
- **The palette is designed.** `ThreadColors` in `constants/Colors.ts` carries a
  full light and dark set with separate fills, hairlines and thread greys — not a
  dark mode bolted on.
- **Local-first, no account, no analytics, no camera.** In 2026 this is a
  marketing asset, not just a shortcut. Your App Privacy and Data Safety forms
  will be close to empty, and you should say so on the listing in plain words.
- **`ErrorBoundary` at the root** (`app/_layout.tsx:151`) — the app degrades
  instead of white-screening.
- **The core idea is genuinely differentiated.** Nothing else formats scripture
  by speaker. The four inks are a real product, not a skin.

---

## 1 · Fixes

### High priority — do these before TestFlight

#### F1 · The streak "day" is UTC, not local

`api/sqlite.ts:1026` and `:1047`, plus ~12 other `new Date().toISOString().split('T')[0]`
sites across `api/sqlite.ts`, `api/sqlite-optimized.ts`, `api/insightQueries.ts`.

The streak day boundary is midnight **UTC**. You are in New Zealand, so for you
the day rolls over at **noon or 1pm local**:

| Reads at | UTC date | Result |
| --- | --- | --- |
| Mon 8pm NZ | Mon | streak → 1 |
| Tue 9am NZ | Mon | *"already read today"* — **no increment** |
| Wed 9am NZ | Tue | increments |

A morning reader in NZ under-counts their streak. A US evening reader gets the
opposite: read Mon 10am and Mon 8pm ET and that is two UTC days — the streak
**inflates**. Same bug reaches "today's story" and plan-day resolution.

**Fix:** one `localDateKey(d = new Date())` helper built from
`getFullYear/getMonth/getDate`, and replace every `toISOString().split('T')[0]`
that represents a *user-facing day*. Leave timestamps alone.

#### F2 · `getCurrentStreak()` returns a stale number forever

`api/sqlite.ts:446` — it reads `currentStreak` straight out of `streak_data` and
never compares `lastReadDate` to today. A user who last read three weeks ago
still sees **"12 day streak"** on the You screen. The number only corrects itself
the next time they read.

**Fix:** return `0` unless `lastReadDate` is today or yesterday (local, per F1).
This is on your most-visited screen and it is four lines.

#### F3 · The font-size control does nothing to the reader, and does not persist

There are **two parallel font systems**:

| | |
| --- | --- |
| `context/FontSizeContext.tsx` | plain `useState`, **no persistence**, no writes to SQLite |
| `context/SyncAppSettingsContext.tsx:97` | persisted via `setSetting('fontSize', …)` |

`app/settings.tsx:30` reads and writes the **first** one. The reader
(`components/Bible/GlowBubble.tsx:40` → `sizes.body`) reads the **second**. So
the slider moves, the sample "A" grows, scripture does not change size, and the
setting is gone on restart.

**Fix:** delete `FontSizeContext` and point `settings.tsx` at
`useSyncAppSettings().setFontSize`, or make `FontSizeContext` a thin proxy. Then
re-test the reader at all three sizes.

#### F4 · Accessibility is effectively absent

**11** accessibility props across **122** `Pressable`/`TouchableOpacity`. Only
seven files touch them at all. VoiceOver and TalkBack users cannot navigate this
app — every tap target announces as "button", unlabelled.

This is no longer only an ethical point. Apple's **Accessibility Nutrition
Labels** put VoiceOver / Larger Text / Sufficient Contrast support on your App
Store product page as a declared fact. Your demographic skews older than average.
Declaring "VoiceOver: not supported" on a Bible app is a bad look you can avoid
for about two days of work.

**Minimum before submission:** `accessibilityRole` + `accessibilityLabel` on
every interactive element; `accessibilityState={{ selected }}` on filter pills,
scope chips and `CheckCircle`; a sensible reading order in the reader (speaker
name should be announced *before* the words, not after — today the label sits
below the bubble in `GlowBubble.tsx:125`).

#### F5 · The whole product is colour-only meaning, and the pair is red/green

The four inks *are* the app. `divine: #C0261A` against `prin: #0E6B4C` is exactly
the pair that deuteranopia and protanopia collapse — roughly **8% of men**. For
them, God and the protagonist are the same colour, and the four-reader group
mechanic silently stops working.

The only non-colour cue is the speaker label at `GlowBubble.tsx:150`:

```
who: { fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase' }
```

**9pt, hardcoded, and it does not scale with the font-size setting.** Apple's own
floor is 11pt. So the single fallback for colour-blind users is the least legible
text in the app, and the accessibility affordance that would fix it is the one
control that is broken (F3).

**Fix, in order:** (a) make `who` scale from `sizes` with an 11pt floor;
(b) offer a colour-blind-safe ink set in Settings — shifting `prin` to a
blue-green and `chor` to a violet separates all four under both common
dichromacies; (c) consider a persistent left/right + weight cue so ink is never
the *only* signal.

#### F6 · No crash reporting at all

No Sentry, no Crashlytics, nothing. `utils/logger.ts` writes `error` and `warn`
to `console` in production, where nobody will ever read them.

You are about to ship a **schema migration over a live 1.2.1 install base**
(`14-SHIP-PLAN.md` §4) on two platforms, as a solo developer. If the migration
fails for 5% of users you will find out from one-star reviews, three weeks late,
with no stack trace.

`@sentry/react-native` via the Expo config plugin is an afternoon, free at your
volume, and it needs a native build — so it goes in the **same build as X1**, not
after.

#### F7 · `tsc --noEmit` currently fails — 5 errors

Your own definition of ready (§8) requires it to pass. It does not:

| File | Error |
| --- | --- |
| `components/thread/ThreadList.tsx:602` | `overflow` prop on `<Svg>` — not in `SvgProps` |
| `app/(tabs)/plan/index.tsx:388` | same |
| `components/onboarding/OnboardingDemos.tsx:143` | same |
| `components/Bible/Segment.tsx:310` | `FlatList` not imported (type-only — no runtime effect) |
| `utils/shareTurn.ts:49` | the `titles` cast omits `title`, which the JSON *does* have |

All five are annotation-level. Half an hour, but the gate is currently red.

#### F8 · The store listing describes a feature you deleted

`APP_DESCRIPTION.md` — and, more importantly, whatever is live on the two stores
right now — leads with **"Group Reading Mode: Host a Session… unique 4-digit
PIN… Real-Time Synchronized Reading."** That code is gone; only orphaned tables
in `api/database-manager.ts` remember it. `05-GROUP-READING.md` explains *why*
it went, and the reasoning is sound — but the listing has not caught up.

The ship plan flags the privacy policy (§6) and misses this. Shipping 1.3.0
against the current description is an **App Store 2.3.1 accurate-metadata
rejection**, and on Play it is guaranteed one-star "the group feature is gone"
reviews from your existing users.

**Fix:** rewrite the description around the four inks as the group mechanism, and
put a line in *What's New* that says plainly that PIN sessions were replaced —
existing users are owed that sentence.

---

### Medium — fold in if the schedule allows, or OTA after launch

| | Issue | Detail |
| --- | --- | --- |
| **F9** | **14 MB of JSON parsed before first paint** | `services/BibleLoader.ts:20` `require`s `newBibleNLT1.json` at module scope; `context/SyncAppSettingsContext.tsx:7` imports `bibleLoader`, and that provider wraps `AppContent` in `app/_layout.tsx:157`. Hermes bytecode softens the parse; **memory** is the real cost on 3–4 GB Android. Measure TTI and RSS on the low-end emulator during G3c — if TTI is over ~2s, move it behind a lazy `require()` on the reader route. Do not refactor speculatively; measure first. |
| **F10** | **The reader is an unvirtualised `ScrollView`** | `app/(tabs)/[segment]/index.tsx:653` renders every bubble of a 15–20 minute story at once, each wrapped in `EmojiHandler` and carrying a Reanimated animated style. `ThreadList.tsx:612` does the same with `visibleRows.map`. Fine on recent iPhones; this is where a 2023 mid-range Android will stutter. |
| **F11** | **No reading position inside a story** | You resume the right *story* but always at the top of it. Every premium reader restores the offset. Save `contentOffset.y` per segment on blur, restore on mount — the D-plan's `pos` scroll-to machinery does most of the work already. |
| **F12** | **OTA reloads the app at launch** | `app/_layout.tsx:63–72` calls `fetchUpdateAsync()` then `reloadAsync()` immediately, and `app.json` *also* sets `checkAutomatically: ON_LOAD` — so it checks twice and the user can watch the app launch, then relaunch. Standard pattern: fetch in the background, apply on the next cold start, or offer a "Restart to update" row in Settings. |
| **F13** | **`allowBackup: true` with a versioned SQLite DB** | `app.json` android block. Android Auto Backup can restore a *1.2.1-era* database into a 1.3.0 binary on a new device. Either add backup rules excluding the DB, or prove the migration is safe from any older schema — not just the one on your test phone. |
| **F14** | **`"scheme": "myapp"`** | Deep links are `myapp://`. Rename to `sourceview://` **before** shared links exist in the wild — after that it is a compatibility problem forever. |
| **F15** | **Icons are pre-2025** | One flat PNG. No iOS 26 layered icon (Expo supports `ios.icon: { light, dark, tinted }`), no Android monochrome/themed icon (`adaptiveIcon.monochromeImage`), and both the splash and adaptive-icon backgrounds are `#808080` **grey**. On a modern home screen this reads as unfinished next to any competitor — and it is the first thing a reviewer and a store browser sees. |
| **F16** | **28 MB of bundled assets, some dead** | `assets/data/FRA-UI.json.backup` is **868 KB, referenced by nothing**. `verseIndex.json` is 6.4 MB — Metro-blocked in `metro.config.js` but still in the repo and still in git. Delete both. |
| **F17** | **`Achievements.tsx` — 1,964 lines, unreachable** | Registered `href: null` in `app/(tabs)/_layout.tsx:31` and referenced only by `BottomNavigation.tsx:37`'s active-tab test. Nothing navigates to it. Same call as X2: revive it or delete it — it is your largest single file. |

---

### Low — nice to have, or fix over OTA once live

| | Issue |
| --- | --- |
| **F18** | `hitSlop` on only 18 of 122 touchables. Check the 44×44pt floor on thread beads, filter pills and the reader chevrons. |
| **F19** | The reader has no progress indicator and no swipe-to-next-story — the chevrons at `[segment]/index.tsx:686` are the only way forward. |
| **F20** | `logger.warn`/`logger.error` always fire in production. Harmless, but only *useful* once F6 gives them somewhere to go — wire them into Sentry's breadcrumbs when you add it. |
| **F21** | Appearance "auto" is not stored as a mode. `settings.tsx:43` re-derives it by comparing `isDarkMode` to the system scheme, so "dark" chosen while the system is dark reads back as "auto" on restart. |
| **F22** | 29 inline `lang === 'fr' ? … : …` ternaries (ship plan G2d). Cosmetic — it already works. |

---

## 2 · Features

### High value — these change the numbers

#### N1 · Daily reminder notifications

**The single biggest gap in the app.** Everything you built is a daily habit —
the streak, today's story, plan days, the year thread on You — and there is no
way for the app to ask for that habit. `expo-notifications` is not even a
dependency.

Local notifications only: no server, no push tokens, no privacy-label change, no
account. A user-chosen time ("Read your story"), plus a streak-at-risk nudge in
the evening. Ask for permission *after* the first completed story, never at
launch — asking cold is why most apps get denied.

For a habit app this is worth more than every other feature on this list
combined, and it is roughly one day. **Needs a native build** — so it goes in the
X1/F6 build with Sentry.

#### N2 · Export my reading

Everything lives in one local SQLite file with no account and no sync. A lost
phone is three years of notes, reactions and completions, gone. That is the
unspoken cost of local-first, and premium local-first apps all answer it.

You do not need sync to answer it. `expo-sharing` is **already a dependency**:
"Export my notes and progress" → a JSON or Markdown file the user can put in
iCloud, Drive, or an email to themselves. A day of work, it removes the fear
entirely, and it is a legitimate line on the store listing. Real cross-device
sync is a v1.5 project, not a launch blocker.

#### N3 · In-app review prompt

`expo-store-review`, fired at a *good* moment — a completed plan, a 7-day streak,
the tenth story — never at launch, and never twice.

Ratings volume is the largest single input to store ranking, and 1.3.0 is a big
enough change that you effectively restart the conversation with reviewers. Two
hours of work. Do not skip it.

#### N4 · Read aloud

Every premium Bible app in 2026 ships audio, and a **script-formatted Bible with
named speakers is the single best candidate for it that exists** — you can voice
each ink differently, at zero content cost, using `expo-speech`. Nobody else can
do this, because nobody else has the attribution data.

Scope honestly: a good version is weeks, not days, and it is a **v1.4 headline**,
not a 1.3.0 blocker. But it is the feature that makes the whole attribution
project pay off, so plan the release around it rather than treating it as an
extra.

---

### Medium — worth building in the next two releases

| | Feature | Why |
| --- | --- | --- |
| **N5** | **Home-screen widget** — today's story + streak | A free daily reminder that costs the user nothing to install. WidgetKit / Android Glance through a config plugin. Now a baseline expectation rather than a delight. |
| **N6** | **Decide monetization before launch** | `MONETIZATION_IMPLEMENTATION_GUIDE.md` exists; nothing is wired, and there is no IAP dependency. Shipping 1.3.0 free is a perfectly good answer — but decide it deliberately. Retro-fitting a paywall onto a free install base is materially harder than launching with one visible surface, and the Cast, the question sets and the group experience are all plausible paid surfaces. |
| **N7** | **Finish the share card** (ship plan X1) | Your build queue calls it *"the one thing only this app can share"* and it has never been seen working. Make it worth sharing: speaker, ink, reference, wordmark, correct in both themes — plus a 9:16 story-shaped variant. Shared cards are how a Bible app grows without a marketing budget. |
| **N8** | **"Talk about it" → send to the group** | `TalkAboutCard` already exists. One tap to send the questions to WhatsApp makes the group use case real with no server and no coordination software — exactly the principle in `05-GROUP-READING.md`. |
| **N9** | **Recent searches** | Once D lands, a recents row is nearly free and it is what makes search feel finished rather than shipped. |
| **N10** | **Reading time budget on Today** | You already have `SegmentReadingTimes.json` and surface times on rows (B/H3). "You have 12 minutes today" is a stronger daily invitation than a story title. |

---

### Low — if there is time, or after launch

| | Feature |
| --- | --- |
| **N11** | Highlights — marking a phrase, not only reacting to a whole turn. |
| **N12** | Verse of the day, as a widget surface and a notification payload. |
| **N13** | Apple Watch complication for the streak. |
| **N14** | Live Activity while a group is reading together. |
| **N15** | Spanish. It is the obvious third language and the FR plumbing already proves the pattern. |
| **N16** | **iPad, decided properly.** `supportsTablet: true` obliges you to shoot iPad screenshots for every submission. Either commit to a genuine tablet layout (two columns, or the thread beside the reader) or set it `false` and save a device class. The ship plan raises this as a screenshot question; it is really a product question. |

---

## 3 · How this lands on the ship plan

The ship plan is 10–13 days. This adds roughly **4–5**, and it does not all land
in the same place.

**Into the existing sequence, no new calendar time:**
F7 (tsc), F16 (dead assets), F17 (Achievements) fold into X3's cleanup day.
F8 (listing rewrite) folds into G4's copy day. F13, F14, F21 are single edits.

**Add before TestFlight — about 3 days:**
F1 + F2 (half a day, together), F3 (half a day), F4 + F5 (two days), and
**F6 + N1 must ride the same native build as X1** — which the ship plan already
puts on day 1. That is the ordering constraint that matters most: decide on
Sentry and notifications *before* you kick off that build, or you wait for
another one.

**Add after, or ship in 1.3.1 — about 2 days:**
N2, N3, F11, F12, F15.

**What OTA can actually fix once you are live.** `runtimeVersion.policy` is
`appVersion`, so a JS-only fix reaches 1.3.0 binaries only. That covers
F1, F2, F3, F7, F11, F12, F19, F21, and most of F4 — which is genuinely
reassuring. It does **not** cover F6, F13, F14, F15, N1, N3 or N5: all of those
are native and need a new binary. Plan accordingly, and do not talk yourself into
"I'll fix it over the air" for anything in that second list.

---

## 4 · The five things, if you only do five

1. **F6 + N1 in the day-1 native build** — crash reporting and daily reminders.
   Miss this build and you wait for another one.
2. **F8** — rewrite the listing before you submit. This is the rejection risk.
3. **F1 + F2** — the streak is your retention mechanic and it is currently wrong
   in both directions.
4. **F4 + F5** — accessibility, because it is now printed on your product page,
   and because red/green is the one colour pair your product cannot afford.
5. **F3** — the font-size control is visibly broken in the screen you just built.
