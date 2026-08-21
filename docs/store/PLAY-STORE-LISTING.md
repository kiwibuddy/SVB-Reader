# Google Play Console — SourceView Together 2.0.0

Copy the fenced blocks verbatim into the matching Play Console field.

Unlike App Store Connect, **Play's full description accepts a small amount of
HTML**: `<b>`, `<i>`, `<u>`, `<br>` and `<p>`. The full description below uses
`<b>` for section headings, which is what Play listings in this category
typically do. If you would rather keep it plain, delete the tags — the copy reads
correctly either way.

Play truncates the full description at around **three lines** before a "read
more", so the opening does the same job it does on Apple.

---

## App name — 19 / 30

```
SourceView Together
```

Play surfaces the app name in search more heavily than Apple does and there is no
subtitle field to lean on. If, after the public push, you find the listing is not
being found for "bible", the change to test is:

```
SourceView Together: Bible
```

That is 26 characters and puts the category word in the indexed name. It is a
real trade — you dilute a clean brand name to buy a keyword — so treat it as an
experiment to run later, not a launch decision.

---

## Short description — 76 / 80

Shown under the icon on the listing and in search results. On Play this line is
doing more conversion work than any other field.

```
The Bible as 365 stories, in four colours. Read it aloud with three friends.
```

Alternate, if you want the structure to lead rather than the group: `The Bible
told as 365 stories. Read it aloud together, one colour each.` (71).

---

## Full description — 2,868 / 4,000

```
The Bible, told as 365 stories.

SourceView Together is a Bible reader built around the voices in the text. Every word is coloured by who spoke it — the narrator, God, the people the story follows, and everyone else. Open a story and a conversation appears: speech bubbles down the screen, each one in its speaker's colour.

<b>Read it with three friends</b>

One person takes each colour and you read it out loud together. There is no setup, no host and no code to join — the colours are the only thing you need to agree on.

Before a story begins, the call sheet shows who speaks in it and how much, so a group of four knows who is reading what at a glance. Tap your colour and the other voices step back while yours stays sharp.

It reads just as well on your own.

<b>365 stories, not chapters</b>

Scripture arrives as whole stories with a beginning and an end, gathered into ten divisions from The Beginning to The End. Most take about ten minutes, and every story tells you its length before you open it.

<b>React the way you already do</b>

Press and hold any speech bubble to leave a ❤️, a 👍, a 🤔 or a 🙏 — or to write a note. It saves to that verse and keeps its speaker, its colour and its place in the story.

The Saved tab gathers everything you have marked. Filter by reaction, by book, by testament, or by who was speaking, and go straight back to the moment. Send a bubble to someone as an image, or copy it with its reference.

<b>Plans for the year you are having</b>

The whole Bible in a year. The New Testament in 100 days. A school year. Shorter runs through the Gospels, Paul's letters, David's life, the women of the Bible, Advent and Lent — the seasonal ones appear when their season comes round.

Start a plan, pause it, or switch. Your place is kept either way.

<b>A year you can see</b>

The You tab draws your reading as one thread through the year: stories finished out of 365, voices you have met out of 774, and your current streak. Any plan you are running shows its progress beside it.

<b>Questions when you finish</b>

Every story ends with discussion questions written three ways — for a family, for a classroom, and for a small group.

<b>The details</b>

• The complete Bible in the New Living Translation, included and readable offline
• 774 voices across the 365 stories — look anyone up and see who they spoke with and their longest exchange
• Jump to any verse by reference: type "gen 4:3" or "1 co 13"
• Light and dark, with adjustable text size
• No account, no ads, nothing to buy
• Nothing you read, react to or write ever leaves your phone

French is returning in a future update.

Scripture quotations are taken from the Holy Bible, New Living Translation, copyright ©1996, 2004, 2007 by Tyndale House Foundation. Used by permission of Tyndale House Publishers, Inc., Carol Stream, Illinois 60188. All rights reserved.
```

Play renders emoji reliably, so the reaction row is printed rather than described
— on this platform it is the fastest way to signal that reacting works the way
people already expect.

---

## What's New — see `RELEASE-NOTES-2.0.0.md`

Play caps this at **500 characters** and enforces it. The short form in
[`RELEASE-NOTES-2.0.0.md`](RELEASE-NOTES-2.0.0.md) is written to that limit.

---

## Category and tags

| Field | Value |
| --- | --- |
| App category | **Books & Reference** |
| Tags | Bible, Books & Reference, Religion, Reading, Education |
| Contains ads | **No** |
| In-app purchases | **No** |

Books & Reference is where the Bible-reading audience browses on Play. Lifestyle
would reach a broader but much vaguer audience and would cost you the category
signal at exactly the moment you are trying to establish it.

---

## Data safety

Declare **no data collected and no data shared**. Every answer below is
verifiable in the codebase, which matters because Play audits this section and a
false declaration is an enforcement action, not a rejection.

| Question | Answer |
| --- | --- |
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | N/A — no data is collected |
| Do you provide a way for users to request that their data is deleted? | N/A — no data leaves the device. Uninstalling removes the local database. |

Supporting facts, if Play asks:

- Reading progress, reactions, notes, plans and streaks are stored in a local
  SQLite database via `expo-sqlite`. Nothing is uploaded.
- There is no analytics, attribution, advertising or crash-reporting SDK in
  `package.json`.
- There is no account system and no sign-in surface.
- The app requests only `INTERNET` and `ACCESS_NETWORK_STATE`, used for
  JavaScript updates via `expo-updates` and for optional Bible translation
  downloads. Neither transmits user content.

---

## Content rating questionnaire

Answer honestly. Expect **Everyone** or **Teen** depending on how you answer the
violence question for scripture narrative — the same judgement call described in
[`APP-STORE-LISTING.md`](APP-STORE-LISTING.md#age-rating). Everything else is
None: no user-to-user communication, no sharing of location, no purchases, no
gambling, no unrestricted web browsing.

Note that Play asks specifically whether the app contains user-generated content
that is shared with others. It does not — notes and reactions are local and
private, and the share sheet hands an image to the operating system rather than
publishing anything.

---

## Store listing assets

| Asset | Spec |
| --- | --- |
| App icon | 512 × 512 PNG, 32-bit |
| Feature graphic | 1024 × 500 — **required**, and shown above your screenshots |
| Phone screenshots | Minimum 2, up to 8. Use the six from the Apple sheet. |
| 7" tablet screenshots | Required to be eligible for tablet surfaces |
| 10" tablet screenshots | Required to be eligible for tablet surfaces |

The feature graphic is the one asset with no Apple equivalent, so it is the one
most likely to be forgotten. Make it the four-colour conversation — the same
image doing the work in screenshot 1 — with the wordmark. It should be readable
at thumbnail size, which rules out putting a paragraph on it.

---

## Release blocker

`eas.json` points the Android submit step at `./google-service-account.json`,
**which does not exist in this repo.** Creating it means a Google Cloud service
account with the Play Android Publisher API enabled, and the key linked in Play
Console under Users & permissions. It takes about an hour of clicking and it is
pure lead time — do it before anything else on this list.

`eas.json`'s `production-android` profile already targets `"track": "internal"`.
Push there first, install from Play onto an emulator, and promote to production
only once the iOS pass is green.
