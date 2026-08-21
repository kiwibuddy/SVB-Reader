# Fix before submitting 2.0.0

The store copy in this folder is written **as if everything below is fixed.** That
was deliberate — the listings describe the app you are shipping, not the branch as
it stands today. Every item marked HIGH has to be true before those words go live.

Findings come from a full static review on 21 August 2026: every route and
navigation target, every interactive handler on a live screen, the content data,
and the logic behind completion, streaks, plans, search and onboarding. Where a
bug could be demonstrated, it was — the evidence is quoted inline.

**Two standing checks:**

```bash
node scripts/build-verse-index.js       # rebuilds the index — PASSES
node scripts/test-reference-search.js   # resolution        — PASSES (H1 fixed)
node scripts/test-verse-landing.js      # landing           — PASSES (H2 fixed)
```

The builder regenerates `verseSearchIndex.json` from `newBibleNLT1.json` and
fails if the index and `bookAliases.json` disagree.

The second runs the acceptance list from `MVP2/14-SHIP-PLAN.md` §2 plus a
coverage sweep over all 66 books. Today: **32/32 cases, all 66 books reachable,
no wrong display names.**

The third checks that a resolved reference lands on the turn holding the verse,
across **all 31,244 indexed verses**. Today: **all pass**, plus 11 end-to-end
cases from typed input.

Both load the app's real modules rather than reimplementing them, so a pass means
the shipped code works. Neither needs `node_modules`.

What no script can prove — rendered layout, scroll behaviour, gestures, the
share sheet, migration from a real 1.2.1 database — is collected in the **Device
test checklist** near the end of this document. Work it before you submit.

---

# HIGH — a claim in the listing is false, or a core feature misbehaves

## ~~H1 · Verse reference search is broken for a fifth of the Bible~~ — FIXED 21 Aug

**Fixed.** `node scripts/test-reference-search.js` is green: 32/32 acceptance
cases, **all 66 books reachable under their real names**.

### What was wrong

Four independent faults.

**The index only ever held 49 of the 66 books.** `verseIndex.json` — the
intermediate the old builder read — was missing **every numbered book**:
1 & 2 Samuel, Kings, Chronicles, Corinthians, Thessalonians, Timothy, Peter,
1/2/3 John. Seventeen books, **6,128 verses**, including 1 Corinthians 13.
`bookAliases.json` had all 66, but `getAliasMap()` silently dropped any whose
canonical name was absent from the index, so they failed without erroring.

**Five books carried a truncated code.** `Joh`, `Jam`, `Joe`, `Eze`, `SoS`. So
`John 3:16` resolved but the row read **"Joh 3:16"**, and Ezekiel and Song of
Songs could not be found by their full names at all.

**Any book starting with "I" was unreachable.** The parser read a leading
`I`/`II`/`III` as a Roman numeral, so `Isaiah 40` became `1saiah`. **Isaiah —
1,292 verses — could not be reached by any spelling.**

**Multi-word names could not parse.** The book capture was a single
`[a-zA-ZÀ-ÿ]+` token, so `Song of Songs 1` failed.

And the ambiguity rule (your `jud` question): `resolveBook()` returned on *any*
alias hit, so `jud 1` went straight to Judges and never offered Jude.

### How it works now

**The index is built from source.** `scripts/build-verse-index.js` now reads
`newBibleNLT1.json` — the same file the reader renders — and takes book names
from `BookChapterList.json`. The broken intermediate is gone. If a verse is in
the Bible the app ships, it is in the index. **31,244 verses, 66 books, 561 KB.**

The builder also validates `bookAliases.json` against the index and **fails the
build** if any canonical name does not resolve. That is what caught the 22 stale
entries; they now carry full book names plus a `code` field.

**The parser tokenises instead of pattern-matching.** Trailing digits are taken
as chapter and verse; everything before them names the book, so multi-word names
work. A leading Roman numeral is only treated as an ordinal when another token
follows it — `i cor` becomes `1 cor`, while `Isaiah` is left alone.

**Ambiguity is offered, not guessed.** An exact canonical name wins outright, so
`judges` and `jude` are unambiguous. Anything shorter that more than one book
answers to comes back as a list: `jud` → Judges · Jude, `phil` → Philippians ·
Philemon, `jo` → five books.

**One extra fix found while testing.** Obadiah, Philemon, 2 and 3 John and Jude
have a single chapter, so a lone number after them is a verse, not a chapter.
`jude 3` now resolves to Jude 1:3 rather than a chapter 3 that does not exist.

### Notes on the numbers

The index holds 31,244 verses against BookChapterList's 31,102. The difference
is accounted for exactly:

- **+156** psalm superscriptions ("A psalm of David"), indexed at verse 0 — 150
  in Psalms, 6 in Song of Songs.
- **−16** verses the NLT genuinely omits as later additions — Matthew 17:21,
  Mark 7:16, John 5:4, Acts 8:37 and the rest. BookChapterList's counts are not
  NLT-based.
- **+2** minor, in 3 John and Revelation.

`assets/data/verseIndex.json` (6.4 MB) is deleted; nothing reads it now, and its
Metro blocklist entry has gone with it.

## ~~H2 · Tapping a search result does not land on the verse~~ — FIXED 21 Aug

**Fixed.** `node scripts/test-verse-landing.js` covers it: all 24,935 indexed
verses land on a turn that contains them.

### What was wrong

Three things, not one.

**The offset was fictional.** `app/(tabs)/[segment]/index.tsx` fed the index's
`position` straight into `scrollTo({ y })`, but `position` is a synthetic
estimate at 40px per verse — the same `currentY += 40` heuristic that sat dead at
the top of that file. Every value a multiple of 40, and not even monotonic:
Genesis 1:1 → 40, 1:2 → 200, 1:3 → **80**. S001's largest was 2,440px for a story
several thousand pixels tall, so it always undershot to near the top.

**`blockIndex` is right but is not the rendered index.** It is trustworthy —
verified 100% across all 24,935 entries — but it addresses `segmentData.content`,
and the reader renders that through `splitIntoParagraphs()` and, for **232 of the
365 stories**, `splitContentIntoReaderParts()` too. The rendered list is
1.2×–2.2× longer, so using `blockIndex` as a rendered index would have replaced
one wrong answer with another.

**The highlight had never fired.** `GlowBubble` decided the target verse by
reading `leaf.link.chapter`. Across the whole Bible only **782 of 135,679 leaves
carry `link`, and only inside book introductions**. Story verses use
`ref: ["Gen-1-1"]` — 131,090 leaves. The same dead lookup drove
`findVerseLocation()` and its four staged timeouts.

**And a race underneath all of it.** A scroll-reset effect fired at 0ms, 50ms and
200ms on every story open. Any correct scroll arriving inside that window was
undone — which is very likely why the original code reached for 300/800/1500/2500ms
timers.

### How it works now

Locate the verse by its own `ref` in the blocks that were actually rendered, in
`utils/verseLocator.ts`. That is immune to both splitters, needs no index
mapping, and survived the H1 index rebuild unchanged — that rebuild renamed
books and added the 17 missing ones, but never touched `ref`.

- `openSegment()` carries `chapter`/`verse` instead of `pos`.
- `Segment` finds the turn, measures it with `onLayout`, and reports the offset
  up once layout is known — no timers, no estimates.
- The reader scrolls to it, leaving 90px of the preceding turn visible.
- The turn washes in a new `find` tint and fades back over ~1.5s. Colour only:
  animating border width would reflow the bubble the reader just measured.
- The scroll-reset is skipped when a reference sent you here.
- `findVerseLocation()`, the `pos` effect, the dead `link` lookup and a dead
  `flatListRef` in `Segment` are gone.

`position` is gone from the index entirely — the H1 rebuild dropped it, since
nothing reads it any more.

### Still to check on a device

Everything above is verified as logic. What a script cannot prove is the
rendered result: that `gen 4:3` visibly lands on Genesis 4:3 partway down "People
Sin" rather than at the head, that the pulse reads clearly against all four
bubble colours in light and dark, and that a story opened *without* a reference
still starts at the top.

## H3 · Streaks are computed in UTC and break for everyone east of it

`updateStreak()` at `api/sqlite.ts:1023` stamps the day with

```js
const today = new Date().toISOString().split('T')[0];   // UTC
```

while the row is initialised with `date('now','localtime')` at
`api/database-manager.ts:458` — **local**. The two never agree outside UTC.

Demonstrated for `Pacific/Auckland`:

```
local 2026-08-21 09:00  →  stored as 2026-08-20
local 2026-08-21 21:00  →  stored as 2026-08-21
```

So a reader who finishes a story at **9pm Monday** and another at **9am Tuesday**
stores the same date twice. `updateStreak` hits `if (lastReadDate === today)
return;` — *"Already read today, no change to streak"* — and **Tuesday's reading
never counts.** Read at 9am Monday and 9pm Monday instead and it counts as two
days.

Every user in New Zealand, Australia and Asia has a streak that is wrong in a way
that depends on what time of day they read. `getContextualStreaks()` at
`api/sqlite.ts:476` has the same `toISOString()` bug.

**Fix.** Use one local-date helper everywhere — `toLocaleDateString('en-CA')`
gives `YYYY-MM-DD` in local time — for `today`, for `yesterdayStr`, and for the
initialising INSERT. The streak is on the You tab and named in the store copy, so
it should be right.

**Also worth a look while you are in there:** the `UPDATE streak_data … WHERE
id = 1` at `api/sqlite.ts:1070` assumes the row is `id = 1`. It will be if the
table was created empty, but `database-migration.ts:387` also inserts, and a row
at `id = 2` would make the update silently affect nothing while `LIMIT 1` still
reads. Safer to drop the `WHERE`, since the table holds one row by design.

---

# MEDIUM — real defects that will be noticed, but no listing claim rests on them

## M1 · "More questions" is a one-way trip on ~20 stories

`Questions-EN.json` covers all 365 stories for set 1, but **set 2 is missing for
20 school, 20 family and 21 small-group stories.**

`components/thread/TalkAboutCard.tsx` renders the toggle only when there is
something to show:

```jsx
{questions.length > 0 && (<Pressable onPress={handleRefresh}>More questions ↻</Pressable>)}
```

So on one of those stories: tap **More questions** → set 2 is empty → the body
reads "No questions available" → **and the button that would take you back
disappears.** The only way out is to leave the story and come back.

**Fix.** Either keep the toggle visible when the list is empty, or fall back to
set 1 automatically, or hide the toggle when set 2 is known to be absent. Filling
the 61 missing question sets is the other half, and the better one.

## M2 · The Continue card ignores your reading plan

`resolveContinueTarget()` in `utils/continueTarget.ts` accepts an
`active?: ActiveReading` argument and **never reads it.** `ContinueKind` declares
`'plan'` and the function can never return it. Consequently
`ThreadList.tsx:388`:

```jsx
continueTarget?.kind === 'plan' ? t('UI.thread.day', { n: continueTarget.day }) : …
```

is unreachable — the "Day N" kicker never renders on the Continue card. (The
`UI.thread.day` string itself is fine; the plan cards below use it at
`ThreadList.tsx:438` with their own `plan.day`.)

Compounding it, `ThreadList.tsx:210` builds the object with the progress it just
computed thrown away:

```js
setActiveReading({ id: first.id, type: first.type, completedIds: new Set() });
```

`completedIds` is **always empty**, even though `planDone` was computed ten lines
above.

Net effect: someone reading "New Testament in 100 days" opens the app and the
headline card offers today's *calendar* story — possibly deep in the Old
Testament — rather than their plan's next one. Their plan does still appear as its
own card below, so this is a hierarchy problem rather than a dead end.

**Fix.** Either wire `active` through so the card leads with the plan's next
story and the "Day N" kicker, or delete the parameter, the `'plan'` kind and the
dead branch. Half-implemented is the worst of the three.

## M3 · A whole screen and its subtree are unreachable

`app/(tabs)/Achievements.tsx` is registered `href: null` at
`app/(tabs)/_layout.tsx:31` and **nothing in the app navigates to it.** The only
other mention is a vestigial active-state check at
`components/navigation/BottomNavigation.tsx:37`.

It is the sole importer of `components/navigation/NavBook.tsx`, which is the sole
importer of `SegmentItem.tsx`. `SegmentNavigation.tsx` sits in the same dead
subtree and contains a navigation call to a route that does not exist:

```js
router.push('/Bible'); // Navigate to the Bible tab   ← SegmentNavigation.tsx:43
```

Harmless only because nothing can reach it.

**Fix.** Delete `Achievements.tsx`, `NavBook.tsx`, `SegmentItem.tsx`,
`SegmentNavigation.tsx`, `AccordionItem.tsx` and the `Tabs.Screen` entry. This is
the ship plan's X2 item, extended — it also removes a large slice of the lint
count.

## M4 · Roughly half the component tree is orphaned

Reachability from every route file:

| | Reachable | Orphaned |
| --- | --- | --- |
| `components/` | 39 | **29** |
| `utils/` | 14 | 6 |
| `api/` | 8 | 6 |
| `hooks/` | 5 | 5 |
| `context/` | 7 | 2 |
| `services/` | 7 | 1 |

**49 orphaned modules.** Among them `Questions.tsx`, `NoteModal.tsx`,
`ExternalLink.tsx`, the whole `components/loading/` directory, `components/demo/`,
`utils/parseReference.ts` (superseded by `reference.ts`), and
`api/sqlite-optimized.ts`.

This is the real reason the lint count is 55 errors / 204 warnings. The ship
plan's X3 assumed deleting four files would fix it; the number is closer to fifty.
Deleting dead code is the cheapest way to get lint to zero, and it removes the
risk of someone wiring a stale component back up — which is exactly how the QR
string survived in `thread-ui.json` until this review.

---

# LOW — worth doing, nothing breaks if you don't

## L1 · 877 KB of French strings ship in a build where French is off

`FF.FRENCH_ENABLED` is `false`, so no user can select French — but
`config/i18n.ts:4`, `utils/localize.ts:1` and `components/CheckCircle.tsx:25` all
import `assets/data/FRA-UI.json` unconditionally, so all 877 KB is bundled.

Not worth restructuring the i18n layer for. Worth knowing about if download size
comes up, and worth revisiting when French returns.

## L2 · `metro.config.js` puts `json` in both `sourceExts` and `assetExts`

```js
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];
config.resolver.assetExts  = [...config.resolver.assetExts, 'json'];
```

An extension in both lists is a known Metro footgun: JSON imports can resolve as
*assets* (a URI) rather than parsed data. It evidently resolves the right way
today, but it is the kind of thing that flips on an SDK upgrade — and you have
just done one. `ts`/`tsx` are already in Expo's default `sourceExts` too, so both
lines are redundant.

Note the same file correctly blocks the 6.5 MB `verseIndex.json` from the bundle,
so that file costs repo weight only, not app size.

## L3 · Build artifacts tracked in git

`assets/data/FRA-UI.json.backup`, `ReadingPlansChallenges.json.backup`,
`ReadingPlansChallenges.json.recovery`, root `sourceview.db` (757 KB) and
`verseIndex.json` (6.5 MB) are all tracked. None is imported. `sourceview.db` is
the stale artifact behind the schema question in H-adjacent item S3 below —
deleting it removes the ambiguity.

## L4 · `CheckCircle` navigates to a differently-spelled Home

`components/CheckCircle.tsx:119` uses `pathname: '/(tabs)/Home'` where every other
call site uses `/Home`. Both resolve, but with `typedRoutes: true` the
inconsistency is the kind that breaks on an expo-router upgrade.

## L5 · The Continue card re-offers a story you just finished

`resolveContinueTarget` returns `{ kind: 'today' }` whenever today's story is not
your unfinished last-read — including when you have **already completed it**. It
only returns `null` at 365/365. There is no "done for today" state.

## L6 · 13 raw `console.*` calls bypass the logger

`utils/logger.ts` correctly gates `info` behind `__DEV__`; thirteen call sites
skip it and will log in production.

## L7 · Question set 2 is incomplete

20 school, 20 family and 21 small-group stories have no second set — the data half
of M1.

---

# Still open from the original submission list

These are unchanged and still required.

## S1 · Confirm image share on a production build

**Blocks a claim in both listings** — *"Send a bubble to someone as an image"*.
`react-native-view-shot@5.1.0` is in `package.json`, but `utils/shareTurn.ts:87`
falls back to citation text whenever the native module is unavailable, silently,
and the card has never been seen rendering. Long-press a bubble on the production
build and confirm an image appears — speaker, ink colour, reference, wordmark,
correct in light and dark. If it hands you text, cut the sentence.

## S2 · Two external accounts, both pure lead time

- **A hosted privacy policy URL.** `privacy-policy.html` is in the repo but served
  nowhere recorded. Apple checks the link resolves. The same host can serve the
  support page, which **must be a web page, not a `mailto:`**.
- **The Play service account.** `eas.json` points at `./google-service-account.json`,
  which does not exist. Google Cloud service account → enable the Play Android
  Publisher API → link the key in Play Console. About an hour.

## S3 · Run the migration pass on a real 1.2.1 database

**Blocks a promise to your existing users** — *"Everything you have already read,
saved and noted comes with you."* Procedure in `MVP2/14-SHIP-PLAN.md` §4.

The schema question there is still open: bundled `sourceview.db` carries
`completedSegments`, `sourceReadings` and `user_settings`; `api/database-manager.ts`
creates `completed`, `source` and no `user_settings`. Settle it by pulling a
database off a 1.2.1 device, not by reading the repo file.

## S4 · Finalise division titles before shooting screenshots

The ten in `constants/divisions.ts` ship as defaults. They appear on **every
Read-tab screenshot**.

## S5 · Remove French from both store consoles

The flag is off, so French is unreachable. The listings only say it is returning,
which is fine — but delete any French **localisation entry** in App Store Connect
and Play. Both stores check an advertised language is reachable in the binary.

## S6 · Housekeeping

- **Voice count disagrees with itself.** `TOTAL_VOICES = 774` and the You tab
  renders "/ 774"; `conversations.json` metadata says 773.
  `MVP2/03-DESIGN-DIRECTION.md` explains 774 as the union of the per-colour sets
  and is authoritative, so the listings use 774 and match the screen.
- **`APP_DESCRIPTION.md` says "15-20 minutes each".** The data says median 10,
  max 14. Do not hand that file to anyone writing marketing.
- **`PRIVACY_POLICY.md` mentions French.** Consistent with "French is returning".
  Both files are clean of QR and camera references.

---

# Consider adding before 2.0

Not defects. These are the gaps most likely to cost you on a public push, roughly
in order of what I would do first.

## C1 · A way to remove a reaction or note from the Saved tab

You can un-react from inside the reader (`EmojiHandler.tsx:316` calls
`deleteEmoji`), but the Saved tab offers only "tap to open the story". Saved is
the screen that grows without limit, and it is the one place with no edit or
delete. A swipe-to-delete, or the same long-press sheet the reader uses, closes
the loop on a feature both listings sell.

## C2 · A daily reminder

There is no notification code and no notification permission in the app — nothing
in `package.json`, nothing in `app.json`. You are shipping a streak, a "Today"
card and reading plans, which is the full apparatus of a daily habit, with no way
to ask someone to come back. For a public push this is the single largest
retention lever available, and `expo-notifications` with one local daily
reminder is a small build.

It costs you the "asks for no permissions" line, so it is a real trade — but a
local notification permission is the least objectionable one there is, and you can
ask for it after someone's third day rather than at launch.

## C3 · A review prompt

No `expo-store-review` and no prompt anywhere. Ratings are the main lever on store
ranking and on how the listing converts, and you are about to send a wave of new
users at it. Trigger it after a completed story on a multi-day streak — never on
first launch.

## ~~C4 · The highlight pulse on verse arrival~~ — done

Built as part of H2. The turn washes in the new `find` tint and fades back over
~1.5s. Still worth looking at on a device: it needs to read clearly against all
four bubble colours, in light and dark.

## C5 · Read-aloud mode

`MVP2/05-GROUP-READING.md` §3 specifies it — chrome hides, type scales up, the
current turn holds full ink while the rest dim back. **It was never built**; the
only "aloud" string in the codebase is in the NLT description. The Apple subtitle
is *"Read the Bible aloud, together"*, and the call sheet's tap-a-colour dimming
does cover the group case, so nothing in the copy is false. But a focus mode is
the obvious companion to it, and the group-reading spec assumed it would exist.

## C6 · Bare book names could offer the reference row too

Still open after the H1 fix. Typing `psalm` alone does nothing in the reference path because
of the digit gate, so you get book results but never "Psalms 1:1". Dropping the
digit requirement — and letting a bare book name resolve to chapter 1, verse 1 —
would make the search feel like it understands references rather than waiting for
you to prove it.

## C7 · Decide iPad properly

`supportsTablet: true` makes iPad screenshots mandatory and invites reviewers to
judge the tablet layout. Nothing in the codebase suggests a tablet-specific
layout beyond `constants/sizes.ts` helpers. Either give it a pass on a real iPad
or set `supportsTablet: false` — before you start shooting.

## C8 · An accessibility pass

No `accessibilityLabel` audit was possible statically, but the reader is built
from coloured bubbles where **colour carries the meaning** — which is precisely
the case where a screen reader and a colour-blind reader need the speaker's name
announced rather than implied. The name is already in the data. This is also the
one area where a store reviewer can reject on principle.

---

# Device test checklist

Everything a script cannot prove. Nothing here is optional — each line covers a
fix whose logic is verified but whose *rendered* behaviour is not.

## D1 · Verse landing and the arrival pulse — the H2 fix

Logic verified across all 24,935 indexed verses; none of the following was, or
can be, checked off-device.

- [ ] Search `gen 4:3`. It should land **partway down** "People Sin" — turn 37 of
      64 — not at the head of the story.
- [ ] The preceding turn should be partly visible above it, about 90px of
      context. Not flush to the top, not centred.
- [ ] The pulse fires **once** on arrival and fades over ~1.5s. It must not
      re-fire when you scroll away and back.
- [ ] The pulse is legible against **all four bubble colours** — narrator, God,
      main character, supporting — in **light and dark**. The `find` tint was
      chosen to clear all four, but only a screen can confirm it.
- [ ] It does not read as the saved/reacted state. Put a reaction on a
      neighbouring turn and compare.
- [ ] Scrolling immediately after landing behaves normally — no snap-back, no
      fighting the animation.
- [ ] Open a story **without** a reference (tap it in the thread). It must still
      open at the top. This is the guard on the scroll-reset effect.
- [ ] Open a story from a **plan** and from the **Cast** longest-exchange link.
      Neither passes a verse, so both must open at the top.
- [ ] Try `rev 22` (last story), `psalm 23` (chapter-only → verse 1), and
      `Genesis 1:1` (first turn — should sit at the top with nothing above it).
- [ ] Rotate the device mid-scroll, and try a large font size from Settings.
      Both change layout after measurement; the landing should still be sane.
- [ ] With **Reduce Motion** on, the pulse should settle without animating.

## D2 · Image share — S1

- [ ] Long-press a turn → Share produces an **image**, not citation text.
- [ ] Speaker, ink colour, reference and wordmark all render, in light and dark.

## D3 · Migration from 1.2.1 — S3

Full procedure in `MVP2/14-SHIP-PLAN.md` §4.

- [ ] Completions, reactions, notes, active plan and streak all survive.
- [ ] Onboarding v2 shows exactly once.

## D4 · The C device checklist

Never yet run on hardware; carried over from `MVP2/13-STEP-LOG.md`.

- [ ] S008 left/right alternation on a four-ink story.
- [ ] Cast list order and pills.
- [ ] A late-division thread (Revelation) draws correctly.
- [ ] The You year thread at zero.
- [ ] The reader carries no gutter line and no speaker dots.

---

# Summary

| | Item | Blocks |
| --- | --- | --- |
| ~~H1~~ | ~~Verse search — index, names, the "I" parser, multi-word, ambiguity~~ — **fixed 21 Aug** | — |
| ~~H2~~ | ~~Search results do not scroll to the verse~~ — **fixed 21 Aug**; device checks in D1 | — |
| **H3** | Streaks computed in UTC — wrong for NZ/AU/Asia | A feature named in both listings |
| **M1** | "More questions" dead-ends on ~20 stories | — |
| **M2** | Continue card ignores the active plan | — |
| **M3** | Achievements and its subtree unreachable, with a dead `/Bible` route | — |
| **M4** | 49 orphaned modules; the real cause of the lint count | X3 |
| **L1–L7** | Bundle, config, tracked artifacts, logging, data gaps | — |
| **S1** | Image share on a production build (D2) | A claim in both listings |
| **S2** | Privacy policy URL · Play service account | Submission itself |
| **S3** | Migration pass on a real 1.2.1 database (D3) | A promise to existing users |
| **S4** | Division titles final | Screenshots |
| **S5** | French removed from both consoles | Review risk |
| **D1–D4** | Device test checklist — the part no script can prove | Submission |
| **C1–C8** | Suggestions, not defects | — |
