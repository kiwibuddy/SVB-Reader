# Version notes — SourceView Together 2.0.0

**Written for someone who has never opened the app.**

That is the whole design constraint here, and it is worth stating plainly because
it is unusual. A normal release note assumes the reader already has the app and
wants to know what moved. This one cannot assume that. Most of the people who
read it will be standing on the store page for the first time, having arrived
from the public push, looking at new screenshots of an app they have no memory
of. A changelog would mean nothing to them.

So these notes describe **the app**, not the diff. The only line about change is
the reassurance at the end that existing readers keep their data — one sentence,
last, where a returning user will find it and a new one will skip past it.

---

## Apple — What's New

App Store Connect allows 4,000 characters. In practice the first ~150 are what
shows before "more", so the first two sentences carry the category and the hook.

**144 characters in the opening paragraph; 1,115 total.**

```
The Bible, told as 365 stories — and every word is coloured by who spoke it. The narrator, God, the people the story follows, and everyone else.

Read one out loud with three friends. One person takes each colour, and the call sheet at the top of every story shows who speaks and how much, so everyone knows their part before you begin. Tap your colour and the other voices step back. No setup, no host, no code to join.

It reads just as well on your own.

Press and hold any speech bubble to react with ❤️ 👍 🤔 🙏, or to write a note. It stays with that verse, keeping its speaker and its colour, and the Saved tab gathers everything you have marked so you can find it again.

Choose a reading plan — a year, a season, or a fortnight — and watch the year fill in on the You tab: stories read, voices met, and your streak.

The complete New Living Translation is included and works offline. No account, no ads, nothing to buy, and nothing you read or write leaves your phone.

This version is a full redesign. Everything you have already read, saved and noted comes with you.

French is returning in a future update.
```

---

## Google Play — What's New

Play enforces a hard **500-character** limit. This is 478, which leaves headroom
in case Play's counter treats the emoji as more than one character each.

```
The Bible told as 365 stories, every word coloured by who spoke it.

Read one out loud with three friends — one person takes each colour, and the call sheet shows who speaks and how much. No setup, no code to join. It reads just as well alone.

Press and hold any bubble to react with ❤️ 👍 🤔 🙏 or add a note. It stays with the verse.

Pick a plan and watch your year fill in: stories read, voices met, streak.

A full redesign. Everything you have read and saved comes with you.
```

---

## Why these read the way they do

Four rules were applied, and they are worth keeping for the next release too.

**Specifics instead of adjectives.** "The call sheet shows who speaks and how
much" tells you something. "An enhanced reading experience" does not. Every claim
in these notes points at a thing on screen that a reader could go and find. This
is the single clearest divide between how premium apps and filler apps write
right now.

**One idea per paragraph, one or two sentences each.** Store pages are read in
seconds on a phone, standing up. The 1.2.1 notes in this repo used five emoji
headings and twenty-odd bullets across categories like "Technical Improvements"
— an internal changelog wearing a customer-facing hat. Nobody outside the project
had a use for "Improved TypeScript type safety".

**Second person, present tense, plain verbs.** *You read. You take a colour. It
stays with that verse.* No "empowering", no "revolutionary", no "seamless". The
app's own onboarding copy already writes this way — "One person takes each
colour and you read it out loud together" — so the store voice and the product
voice are now the same voice, which is what makes a listing feel like it belongs
to a real thing.

**The last line does the reassurance.** Existing users need to know a redesign
did not eat their notes. New users need to not care. Putting it last serves both.

---

## What was deliberately left out

| Left out | Why |
| --- | --- |
| The QR-code and host/join removal | It is the removal of something a new reader never knew existed. Existing users get "a full redesign" and will find the app simpler. |
| SDK 57, React Native 0.86, the API 36 work | Real work, zero customer meaning. |
| The verse-reference search | It is in the descriptions under "the details". It is a capability people expect a Bible app to have, so leading with it would signal catching-up rather than distinctiveness. |
| Voices met, as a headline | It is a lovely number but it needs a sentence of setup. It earns its place in the "watch the year fill in" line without demanding explanation. |
| Comparisons of any kind | See the rationale document. |

---

## Before you paste these in

Three claims in these notes are true of the code but have **not been confirmed on
a production build**. Verify each one, because the listing asserts it:

1. **Image share.** `react-native-view-shot` is in `package.json`, but the share
   path falls back to sharing citation text when the native module is missing.
   The Apple description says "send a bubble to someone as an image". Open a
   story on the production build, long-press a bubble, tap Share, and confirm an
   image appears rather than text.
2. **Verse reference search.** `utils/reference.ts` and `verseSearchIndex.json`
   both ship, and the notes claim `gen 4:3` works. Run the acceptance list in
   `MVP2/14-SHIP-PLAN.md` §2 before submitting.
3. **Data survives the upgrade.** "Everything you have already read, saved and
   noted comes with you" is a promise to your existing users. Install 1.2.1 from
   TestFlight, generate real data, install 2.0.0 over the top without deleting,
   and check completions, reactions, notes, the active plan and the streak. This
   is the migration pass in `MVP2/14-SHIP-PLAN.md` §4.
