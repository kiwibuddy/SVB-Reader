# Why the store copy reads the way it does

Three questions shaped every line: how are premium apps writing right now, what
makes a listing read unmistakably as a Bible app, and how do you say what is
distinctive about this one without ever comparing it to anything.

---

## 1 · How premium apps are writing in 2026

Reviewed against current App Store and Play listings in and around this category,
and against the ASO guidance published in the last few months. Five patterns are
consistent enough to treat as the register:

**Specifics have replaced adjectives.** The advice is now explicit that
"Search now filters by date" beats "improved search experience", and premium
listings read that way throughout. Flighty's line is *"real-time updates, the
fastest alerts, and delay predictions so you're always the first to know and
rebook"* — three concrete capabilities and the consequence of each. There is no
"powerful", no "seamless", no "intuitive". This is the fastest tell for whether a
listing was written by someone who built the thing.

**Short paragraphs, one idea each.** The prevailing structure is an opening of
two or three sentences, then short labelled sections of one to two sentences
each. Flighty's listing is described as splitting each value proposition into its
own section specifically to avoid the wall of text that makes people leave. Our
descriptions follow this exactly.

**The first three lines are the whole pitch.** Both stores truncate at roughly
three lines. Premium listings therefore front-load the category and the mechanic
and treat everything after the fold as reference material for people who are
already interested.

**Concrete nouns from inside the product.** Dwell names *sleep mode*, *Repeat &
Reflect*, *300+ curated Passages*. Naming the real furniture of the app makes a
listing feel like it belongs to something that exists. Our equivalents are the
call sheet, the Saved tab, the You tab, the four colours — all of them real
things a reader will meet within a minute of opening the app.

**Restraint reads as confidence.** The one thing current guidance is most
emphatic about is that keyword-stuffed, superlative-laden copy now reads as
low-quality to humans and no longer helps with ranking either, since both stores
weigh full context rather than term frequency. Quiet, plain, specific copy is the
premium signal.

### What this replaced

`APP_DESCRIPTION.md` in the repo root is written in the opposite register, and it
is worth being blunt about why none of it was reused:

> "SourceView **isn't just another Bible app**—it's a **revolutionary** way to
> experience Scripture…"
>
> "## The Problem with Traditional Bible Apps"

That is comparative positioning, superlative language, and a competitor teardown
in the first two headings — three of the four things the brief explicitly ruled
out, and all three read as dated in 2026. It also contains claims the code
contradicts (see §4). Keep it as an internal product document if it is useful;
do not paste any of it into a store field.

---

## 2 · Signalling "this is a Bible app" without saying it twice

A first-time visitor should not have to work this out. The signals, and where
each one lands:

| Signal | Where it appears |
| --- | --- |
| The word **Bible**, early and literally | Apple subtitle (`Read the Bible aloud, together`), Play short description, first line of both descriptions |
| A named, credible **translation** | "the New Living Translation", in the details block and the mandatory Tyndale attribution |
| **Scripture** as a word | Used once, in the "365 stories, not chapters" section, where it carries the register without becoming filler |
| **Reading plans**, the category's most expected feature | Its own section in both descriptions |
| Familiar biblical **proper nouns** | The Gospels, Paul's letters, David's life, the women of the Bible, Advent, Lent — the plan list does this work naturally |
| Category placement | Reference on Apple, Books & Reference on Play |
| **Offline** availability | Details block. A long-standing trust signal in this category, and repeatedly named in reviews of Bible apps as a deciding factor |
| **No ads, no account, nothing to buy** | Details block. The other long-standing trust signal in this category |

Note what is *not* used: no crosses, no doves, no "God's Word" as a product
descriptor, no devotional register in the marketing voice. The copy stays plain
and lets the content be the content. That is itself a premium signal in this
category, where the common failure is a listing that sounds like a sermon about
the app.

---

## 3 · Distinctiveness without comparison

The brief was precise: describe what makes this app what it is, using no
comparative language and never the sentence "this app is different". The method
used throughout is simple and worth naming, because it generalises.

**Describe the mechanism, and let the reader do the comparing.**

A distinctive mechanism, stated plainly, is self-evidently distinctive. Nobody
needs to be told. If you write "one person takes each colour and you read it out
loud together", a reader who has used other Bible apps knows immediately that
they have not seen this before — and a reader who has never used one simply
learns how this works. The same sentence serves both, which is exactly what the
brief asked for.

Every distinctive claim in the listings is therefore phrased as a description of
what happens:

| Instead of | The copy says |
| --- | --- |
| "Unlike other Bible apps, we show who's speaking" | "Every word is coloured by who spoke it" |
| "A group feature no other app has" | "One person takes each colour and you read it out loud together" |
| "Better than chapter-based reading" | "Scripture arrives as whole stories with a beginning and an end" |
| "The most advanced reaction system" | "Press and hold any speech bubble to leave a heart… It saves to that verse" |

One phrase needs a note. **"365 stories, not chapters"** contains a *not*, and it
was kept deliberately. It contrasts with the Bible's own conventional
presentation — chapter and verse divisions — not with any product. It is also the
app's own onboarding line ("Not chapters and verses"), so removing it would put
the store voice and the product voice out of step. If you would rather have no
negation anywhere at all, `365 stories, each with a beginning and an end` is a
clean swap in both descriptions.

**"React the way you already do"** is the one line that leans on outside
knowledge, and it does so without naming anything. It signals the social-media
familiarity you asked for by pointing at the reader's own habit rather than at a
platform. The emoji row immediately below it finishes the thought faster than a
sentence could.

---

## 4 · Fact check

Every number and capability claimed in the listings, checked against the code on
`claude/app-store-submission-docs-8hjx0a`. This matters more than usual: the
listing is the thing Apple and Google check the build against.

| Claim | Verified against | Status |
| --- | --- | --- |
| 365 stories | `constants/divisions.ts` divisions span 1–365; `SegmentReadingTimes.json` has exactly 365 `S*` keys | ✅ |
| Ten divisions, The Beginning to The End | `constants/divisions.ts` — 10 entries, first `The Beginning`, last `The End` | ✅ |
| Four colours: narrator, God, main characters, everyone else | `utils/ink.ts`, `UI-ENG.json` onboarding labels | ✅ |
| "Most take about ten minutes" | `SegmentReadingTimes.json` across 365 stories: median 10, mean 9.6, range 2–14 | ✅ |
| Complete NLT, bundled and offline | `assets/data/newBibleNLT1.json` (14.8 MB) ships in the bundle; `.gitignore` excludes only the French Bible | ✅ |
| Four reactions ❤️ 👍 🤔 🙏 | `components/EmojiPicker.tsx:41–45` | ✅ |
| Saved filters by reaction, book, testament, speaker | `app/(tabs)/Reading-emoji.tsx` `matchesFilters`, plus `SavedFilterSheet` | ✅ |
| Call sheet shows speakers and word shares; tap a colour to dim the rest | `components/thread/CallSheet.tsx`; `Segment.tsx:570,590` passes `dimmed` at 0.55 opacity | ✅ |
| Reading plans: year / 100 days / school year / short runs | `ReadingPlansChallenges.json` — 3 plans (365, 180, 100 stories) and 12 challenges (6–57) | ✅ |
| Seasonal plans appear in season | `utils/planCatalog.ts` `isSeasonalChallengeVisible` gates Advent, Lent and Christmas | ✅ |
| You tab: stories / 365, voices met / 774, streak, plan progress | `app/(tabs)/you.tsx` | ✅ |
| Questions in three sets after each story | `components/thread/TalkAboutCard.tsx` — family, school, small group; `Questions-EN.json` covers 365 segments × 3 audiences × 2 sets | ✅ |
| Verse reference search, `gen 4:3` | `utils/reference.ts` + `assets/data/verseSearchIndex.json` (558 KB) | ⚠️ **broken today** — `gen 4:3` works, `1 co 13` and Isaiah do not. See [`PRE-SUBMISSION-FIXES.md`](PRE-SUBMISSION-FIXES.md) §1 |
| Share a bubble as an image | `utils/shareTurn.ts` — falls back to citation text when `react-native-view-shot` is unavailable | ⚠️ **needs production-build check** — [§2](PRE-SUBMISSION-FIXES.md) |
| No account, no ads, nothing to buy | No auth surface; no ad, analytics or IAP dependency in `package.json` | ✅ |
| Nothing leaves your phone | Local SQLite only. Network use is `expo-updates` and optional translation downloads | ✅ |
| Light and dark, adjustable text size | `app/settings.tsx` — appearance light/dark/auto, font size, orientation lock | ✅ |

**The copy is written as if the two ⚠️ rows are fixed.** That is deliberate: the
listings describe the app you are shipping, not the branch as it stands. Both are
tracked in [`PRE-SUBMISSION-FIXES.md`](PRE-SUBMISSION-FIXES.md), and if either
one is still broken when you submit, the affected sentence has to come out of
both descriptions.

### Three things to fix or watch

**1. The voice count is 774 in the app and 773 in the data.**
`utils/voicesMet.ts` sets `TOTAL_VOICES = 774` and the You tab renders "X / 774".
`conversations.json` metadata reports `"voices": 773`.
`MVP2/03-DESIGN-DIRECTION.md` explains 774 as the union of the per-colour sets
and is the authoritative figure, so **774 is used in the listings** and matches
what a user sees on screen. Worth reconciling the data file at some point so the
two agree, but it does not block submission.

Related: the Cast tab lists 769, because it hides the four narration voices. That
is intentional and the listings do not claim otherwise — they say "774 voices
across the 365 stories", not "774 browsable profiles".

**2. `APP_DESCRIPTION.md` says stories are "15-20 minutes each".** The data says
a median of 10 and a maximum of 14. Nothing in the new copy repeats the old
figure, but the old file should not be handed to anyone writing marketing.

**3. `PRIVACY_POLICY.md` still lists "App language settings (English or French)"
and an optional French Bible download.** With `FF.FRENCH_ENABLED = false` there
is no way for a user to reach French in this build. Given the listings say French
is returning, this is consistent rather than contradictory — but if a reviewer
asks why the policy mentions a language the app does not offer, the answer is
that the download machinery ships dormant behind a flag. Both the Markdown and
the HTML are clean of QR-code and camera references, which was the actual
rejection risk.

---

## 5 · A note on the French line

You chose to say French is returning. It appears once, low in both descriptions,
and once at the end of the Apple release note. Two things to hold to:

- **Do not add French as a supported localisation in App Store Connect or Play**
  for this release, and remove it if it is currently listed. Both stores check
  that advertised languages are reachable in the build, and with the flag off it
  is not. The sentence in the description is a statement of intent; a localisation
  entry is a claim about this binary.
- **Do not put it in the promotional text, the subtitle or the short
  description.** Forward-looking claims in the fields Apple reads first are the
  ones that draw questions.

---

## Sources

Market and ASO research, August 2026:

- [App Store Optimization Description: The 2026 Guide — AppFollow](https://appfollow.io/blog/aso-description)
- [How to Write an App Store Description That Converts in 2026 — Appilot](https://appilot.ai/blog/app-store-description-guide)
- [App Store Optimization in 2026: Strategy, Trends, Best Practices — ASOMobile](https://asomobile.net/en/blog/aso-in-2026-the-complete-guide-to-app-optimization/)
- [Mobile App Release Notes: How to Write "What's New" — ReleasePad](https://www.releasepad.io/blog/mobile-app-release-notes/)
- [App Store Release Notes: Character Limits, ASO Impact & 10 Examples — ReleaseGlow](https://releaseglow.com/blog/app-store-release-notes-guide)
- [What's New Section & App Store Promotional Text — yellowHEAD](https://www.yellowhead.com/blog/whats-new-section-in-your-app/)
- [Flighty — App Store Spotlight — Gummicube](https://www.gummicube.com/blog/flighty-app-store-spotlight)

Category listings reviewed:

- [Dwell: Audio Bible — App Store](https://apps.apple.com/us/app/dwell-bible-audio-read/id1343917374)
- [Lectio 365: Daily Bible Prayer — App Store](https://apps.apple.com/us/app/lectio-365/id1483974820)
- [YouVersion Bible App + Audio — Google Play](https://play.google.com/store/apps/details?id=com.sirma.mobile.bible.android&hl=en_US)
- [Glorify: Devotional & Prayer — Google Play](https://play.google.com/store/apps/details?id=com.glorify.app&hl=en)
- [Hallow ASO Audit Report — ShyftUp](https://www.shyftup.com/blog/hallow-aso-audit-report/)

Store listings were read through search summaries; this environment's network
policy blocks direct fetches of `apps.apple.com` and `play.google.com`, so
individual listing text quoted above is second-hand and should be spot-checked on
a phone before you rely on any single competitor phrasing. The pattern-level
conclusions are drawn across enough sources to stand.
