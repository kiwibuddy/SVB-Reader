# App Store Connect — SourceView Together 2.0.0

Every block below is final copy. Copy the contents of the fenced blocks verbatim
into the matching App Store Connect field. **App Store Connect descriptions are
plain text** — no Markdown, no HTML, no bold. The fenced blocks are already
plain text; the headings inside them are just capitalised lines, which is how
Apple listings carry structure.

Character counts are given against Apple's limits and were measured on the exact
strings below.

---

## App Name — 19 / 30

```
SourceView Together
```

Keep it. It is the name on the existing listing, it carries the ratings and
reviews you already have, and renaming resets nothing you want reset. "Bible"
is missing from it, which is why the subtitle below has to carry that word — the
App Store indexes name and subtitle together, so the pair does the work the name
alone cannot.

---

## Subtitle — 30 / 30

```
Read the Bible aloud, together
```

This is the highest-leverage field in the whole listing. It has to do three
things at once and this line does all three: it says *Bible* so nobody has to
guess the category, it says *aloud* which is the reading posture the app is
built around, and it says *together* which is the thing you are pushing.

If you want a different emphasis, both of these fit and are indexed the same
way:

| Alternate | Chars | Trades |
| --- | --- | --- |
| `The Bible in 365 stories` | 24 | Leads with structure. Loses "aloud" and "together". |
| `Read the Bible in four voices` | 29 | Leads with the colours. "Four voices" is intriguing but not searched. |

---

## Promotional Text — 146 / 170

Sits above the description and can be changed any time without a review. Use it
for the public push, then swap it seasonally.

```
The Bible told as 365 stories, every word coloured by who spoke it. Read one out loud with three friends — one person takes each colour. No setup.
```

---

## Keywords — 97 / 100

Comma-separated, no spaces after commas. Do not repeat words already in the name
or subtitle: Apple indexes those fields too and recombines terms across them, so
"bible" is deliberately absent — it is already in the subtitle, and spending
characters on it here buys nothing.

```
scripture,devotional,christian,study,group,family,church,plan,verse,nlt,offline,youth,aloud,faith
```

---

## Description — 2,860 / 4,000

Plain text. The first three lines are what shows before "more", so they carry the
category, the mechanic and the hook on their own.

```
The Bible, told as 365 stories.

SourceView Together is a Bible reader built around the voices in the text. Every word is coloured by who spoke it — the narrator, God, the people the story follows, and everyone else. Open a story and a conversation appears: speech bubbles down the screen, each one in its speaker's colour.


READ IT WITH THREE FRIENDS

One person takes each colour and you read it out loud together. There is no setup, no host and no code to join — the colours are the only thing you need to agree on.

Before a story begins, the call sheet shows who speaks in it and how much, so a group of four knows who is reading what at a glance. Tap your colour and the other voices step back while yours stays sharp.

It reads just as well on your own.


365 STORIES, NOT CHAPTERS

Scripture arrives as whole stories with a beginning and an end, gathered into ten divisions from The Beginning to The End. Most take about ten minutes, and every story tells you its length before you open it.


REACT THE WAY YOU ALREADY DO

Press and hold any speech bubble to leave a heart, a thumbs up, a thinking face or hands together — or to write a note. It saves to that verse and keeps its speaker, its colour and its place in the story.

The Saved tab gathers everything you have marked. Filter by reaction, by book, by testament, or by who was speaking, and go straight back to the moment. Send a bubble to someone as an image, or copy it with its reference.


PLANS FOR THE YEAR YOU ARE HAVING

The whole Bible in a year. The New Testament in 100 days. A school year. Shorter runs through the Gospels, Paul's letters, David's life, the women of the Bible, Advent and Lent — the seasonal ones appear when their season comes round.

Start a plan, pause it, or switch. Your place is kept either way.


A YEAR YOU CAN SEE

The You tab draws your reading as one thread through the year: stories finished out of 365, voices you have met out of 774, and your current streak. Any plan you are running shows its progress beside it.


QUESTIONS WHEN YOU FINISH

Every story ends with discussion questions written three ways — for a family, for a classroom, and for a small group.


THE DETAILS

• The complete Bible in the New Living Translation, included and readable offline
• 774 voices across the 365 stories — look anyone up and see who they spoke with and their longest exchange
• Jump to any verse by reference: type "gen 4:3" or "1 co 13"
• Light and dark, with adjustable text size
• No account, no ads, nothing to buy
• Nothing you read, react to or write ever leaves your phone

French is returning in a future update.

Scripture quotations are taken from the Holy Bible, New Living Translation, copyright ©1996, 2004, 2007 by Tyndale House Foundation. Used by permission of Tyndale House Publishers, Inc., Carol Stream, Illinois 60188. All rights reserved.
```

**On the emoji.** The description spells the reactions out in words rather than
printing ❤️ 👍 🤔 🙏. Apple renders emoji in descriptions inconsistently across
locales and they can read as clutter in a listing that is otherwise quiet. The
What's New note below does use them, because there they are the fastest way to
signal "this works like the apps you already use".

---

## What's New — see `RELEASE-NOTES-2.0.0.md`

The Apple release note lives in [`RELEASE-NOTES-2.0.0.md`](RELEASE-NOTES-2.0.0.md).

---

## Category

| Field | Value |
| --- | --- |
| Primary | **Reference** |
| Secondary | **Education** |

Reference is where Bible readers browse and where the established Bible apps
sit, so it is the shelf a first-time visitor expects to find this on. Education
as secondary is worth having because of the school-year plan and the classroom
question set — it puts the app in front of teachers without diluting the primary
signal.

---

## Age Rating

Answer the questionnaire honestly and expect **12+**.

The one question that matters is realistic violence. Scripture narrative contains
it, and the honest answer for a full-Bible text is *Infrequent/Mild*. Everything
else is None: no web access (the app opens no external URLs — `ExternalLink.tsx`
exists but nothing renders it), no user-generated content shared between users,
no gambling, no contests, no purchases.

If you answer all-None you will get 4+ and it will very likely stand, since other
full-text Bible apps carry low ratings. It is not worth the risk of a rating
challenge mid-review during a public push.

---

## App Privacy — "Data Not Collected"

Select **Data Not Collected** and nothing else. This is the honest answer and it
is worth knowing exactly why, because Apple will hold you to it:

| Claim | Why it holds |
| --- | --- |
| No analytics SDK | `package.json` has no analytics, attribution or crash-reporting dependency |
| No account system | Nothing in the app authenticates, and there is no sign-in surface |
| No advertising | No ad SDK, no ad identifiers |
| No tracking | Nothing collects an identifier for cross-app or cross-site purposes |
| Reading data stays local | Completions, reactions, notes, plans and streaks are written to a local SQLite database via `expo-sqlite` and never uploaded |

Two network calls exist and neither one is data collection: `expo-updates`
fetches JavaScript updates from Expo, and an optional Bible download fetches
translation files. Neither carries user content.

**Tracking:** answer No.

---

## URLs

| Field | Value |
| --- | --- |
| Privacy Policy URL | Must be a live HTTPS page serving `privacy-policy.html`. Apple checks that this resolves. |
| Support URL | Must be a working web page, not a `mailto:`. Apple has rejected `mailto:` support URLs. |
| Marketing URL | Optional, but this is the single biggest lever on web search visibility — see `docs/APP_STORE_SEO_OPTIMIZATION.md`. |
| Copyright | `© 2026 SourceView` |

**This is a blocker, not a nice-to-have.** There is no hosted privacy policy URL
recorded anywhere in the repo — `app.json` previously pointed at a raw GitHub
Markdown link. Stand up a real page before submitting.

---

## App Review Information

```
Sign-in required: No

Notes for the reviewer:

SourceView Together needs no account, no sign-in and no network connection to
review. The complete New Living Translation is bundled in the app.

Getting to the features named in the listing:

1. Four-colour reading — onboarding runs on first launch and explains the four
   colours in four screens. Tap "Start reading" at the end and today's story
   opens. Every speech bubble is coloured by who is speaking.

2. Reading together — inside any story, tap the call sheet bar under the title.
   It lists every speaker in the story and their share of the words. Tap one of
   the four colours and the other voices dim, so one reader in a group of four
   can follow their own part. There is no networking involved: coordination
   happens between people in the room.

3. Reactions and notes — press and hold any speech bubble. A sheet offers four
   reactions, a note, share and copy. Anything you save appears in the Saved tab
   and can be filtered by reaction, book, testament or speaker.

4. Reading plans — the Plan tab. Start one and progress appears on the You tab
   alongside stories read, voices met and your streak.

5. Verse search — the search field on the Read tab accepts references such as
   "gen 4:3" or "1 co 13" and opens the story at that verse.

Permissions: none are requested. The app has no camera, microphone, location or
contacts access, and asks for no notification permission.

Data: all reading progress, reactions and notes are stored in a local SQLite
database on the device. Nothing is uploaded and there is no analytics SDK.

Bible text is the New Living Translation, used by permission of Tyndale House
Publishers.
```

---

## Screenshots

Required device classes, because `supportsTablet` is `true` in `app.json`:

| Class | Needed |
| --- | --- |
| iPhone 6.9" | Yes |
| iPhone 6.5" / 6.7" | Yes |
| iPad Pro 12.9" (or the current required iPad size) | **Yes — mandatory while `supportsTablet: true`** |

If iPad is not genuinely a good experience, set `supportsTablet: false` in
`app.json` before you start shooting and save yourself a whole device class. Make
that call first; it is cheaper than reshooting.

Six shots, in this order — the sequence is the pitch, and the first two are what
most people will actually see:

1. **A story mid-conversation**, four colours visible on screen. This is the
   whole app in one image. Caption: *Every word coloured by who spoke it.*
2. **The call sheet expanded**, showing speakers and their word shares. Caption:
   *One person takes each colour.*
3. **The reaction sheet open on a bubble.** Caption: *React and note any verse.*
4. **The Saved tab** with a filtered list. Caption: *Everything you marked, kept
   with its verse.*
5. **Plan detail** with progress. Caption: *A year, a season, or a fortnight.*
6. **The You tab** with the year thread drawn. Caption: *Watch your year fill
   in.*

Shoot these only after the division titles are final — they appear on every Read
tab shot, and any screenshot taken before they land is wasted work.
