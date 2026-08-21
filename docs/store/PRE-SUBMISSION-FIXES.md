# Fix before submitting 2.0.0

The store copy in this folder is written **as if everything below is fixed.**
That was a deliberate choice — the listings describe the app you are shipping,
not the branch as it stands today. Every item here has to be true before those
words go live.

Ordered by what breaks if you skip it.

Re-run the verse search checks at any point with:

```bash
node scripts/test-reference-search.js
```

It prints the acceptance list from `MVP2/14-SHIP-PLAN.md` §2 and a coverage
sweep over all 66 books, and exits non-zero while anything is wrong. As of
21 August 2026 it reports **10/15 acceptance cases passing, 20 books
unreachable, 3 books displaying a wrong name.**

---

## 1 · Verse reference search is broken for a fifth of the Bible

**Blocks a claim in both listings.** The descriptions say *"Jump to any verse by
reference: type `gen 4:3` or `1 co 13`"*, and the Apple reviewer notes repeat it.
Right now `1 co 13` returns nothing, and neither does Isaiah.

There are four separate faults tangled together here. They are independent — fixing
the index does not fix the parser.

### 1a · The index only ever contained 49 of the 66 books

`assets/data/verseIndex.json` — and therefore `verseSearchIndex.json`, which is
built from it by `scripts/build-verse-index.js` — is missing **every numbered
book**:

> 1 & 2 Samuel · 1 & 2 Kings · 1 & 2 Chronicles · 1 & 2 Corinthians ·
> 1 & 2 Thessalonians · 1 & 2 Timothy · 1 & 2 Peter · 1, 2 & 3 John

Seventeen books, **6,128 of 31,102 verses — one verse in five — unfindable.**
That includes 1 Corinthians 13, 1 Samuel, 1 Kings, 1 Peter and 1 John.

`scripts/build-verse-index.js` is not at fault; it copies `entry.book` faithfully.
The gap is upstream in `verseIndex.json`, whose generator is not in this repo.

`assets/data/bookAliases.json` has all 66 entries, but `getAliasMap()` in
`utils/reference.ts:52` drops any whose canonical name is absent from the index —
so the 17 fail silently rather than erroring.

**The fix.** Rebuild the index from source rather than repairing the intermediate.
`assets/data/newBibleNLT1.json` carries every verse link keyed by three-letter
code (`1Co`, `1Sa`, `Joh`), and `assets/data/BookChapterList.json` maps all 66
codes to correct full names. Point `build-verse-index.js` at those two directly
and the intermediate stops mattering — which also lets you delete the 6.6 MB
`verseIndex.json` the ship plan already wanted gone.

### 1b · Five books carry a truncated code instead of a name

The index stores `Eze`, `Jam`, `Joe`, `Joh` and `SoS` where it should hold
Ezekiel, James, Joel, John and Song of Songs. Two consequences:

| Typed | Happens now | Should happen |
| --- | --- | --- |
| `John 3:16` | resolves, but the result row reads **"Joh 3:16"** | reads "John 3:16" |
| `James 1` | resolves, reads "Jam 1:1" | reads "James 1:1" |
| `Joel 2` | resolves, reads "Joe 2:1" | reads "Joel 2:1" |
| `Ezekiel 1` | **not found** — only `eze 1` works | resolves |
| `Song of Songs 1` | **not found** | resolves |

John is the one that will get noticed. It is plausibly the most-searched
reference in the app, and it currently renders a truncated code in the results
list. Same rebuild fixes all five.

### 1c · Any book starting with "I" is unreachable — Isaiah included

This one is independent of the index and is the worst single defect in the
feature.

The parser at `utils/reference.ts:99` treats a leading `I`, `II` or `III` as a
Roman numeral:

```
/^([iI]{1,3}|[123]|premier|deuxi[eè]me|troisi[eè]me|first|second|third)?\s*([a-zA-ZÀ-ÿ]+)…/
```

So `Isaiah 40` is parsed as ordinal `I` plus book `saiah`, becomes `1saiah`, and
resolves to nothing. Verified — every one of these returns not-found today:

```
"Isaiah 40" · "isaiah 40" · "isa 40" · "Is 40"
```

**Isaiah is 1,292 verses and one of the most-read books in the Bible.** It cannot
currently be reached by reference at all.

There is a latent trap too: once 1a is fixed and `1Sa` exists in the index,
`isa 40` will parse as `1` + `sa` and cheerfully open **1 Samuel 40**. Fixing the
index without fixing the parser makes this worse, not better.

**The fix.** Only treat a leading `I`/`II`/`III` as an ordinal when what follows
is separated by whitespace or a dot — `i cor`, `ii tim`, `iii jn` — never when the
letters run straight into the rest of the word. Resolving the whole token as a
book name first, and only falling back to ordinal-splitting if that fails, is the
more robust ordering.

### 1d · Multi-word book names cannot be parsed

The book portion of the pattern is a single `[a-zA-ZÀ-ÿ]+` token, so anything
with a space in it fails: `Song of Songs 1`, `Song of Solomon 1`. Widen the book
capture to allow internal spaces, then let the alias table decide where the book
name ends and the numbers begin.

### 1e · Partial names should offer every match — your question

You asked:

> any partial written … should show the possible bible matches, so "Jud" should
> show all possible matches, then as you continue to type "judg" etc Jude
> disappears?

That is exactly the intent, and **it already works that way — right up until you
type a number.** The distinction is worth knowing because it tells you how small
this fix is.

`ThreadList.tsx:343` only runs the reference lookup when the query contains a
digit:

```js
if (searching && /\d/.test(q)) { refResult = lookupReference(query.trim()); }
```

So:

| You type | What you get | Right? |
| --- | --- | --- |
| `jud` | The **Books** section lists Judges *and* Jude, both expandable in place | ✅ exactly what you described |
| `judg` | Books narrows to Judges alone | ✅ |
| `jude` | Books narrows to Jude alone | ✅ |
| `jud 1` | Jumps **straight to Judges 1:1**. Jude is never offered. | ❌ |
| `phil 1:1` | Jumps **straight to Philippians 1:1**. Philemon is never offered. | ❌ |
| `jo 3` | Offers five books — Joshua, Job, Joel, Jonah, John | ✅ |

The as-you-type narrowing you are picturing is the Books section doing substring
matching, and it is fine. The bug is only in the reference path: `resolveBook()`
at `utils/reference.ts:130` returns immediately on *any* alias hit, and `jud` and
`phil` happen to be registered aliases for Judges and Philippians. `jo` is not an
alias of anything, which is why it falls through to prefix matching and correctly
offers five.

`MVP2/14-SHIP-PLAN.md` §2 specifies the rule that fixes it: *an exact canonical
match wins outright; a prefix matching more than one book shows all of them as
rows.* "Judges" and "Jude" typed in full are exact canonical names and still win
outright, so nothing regresses — only the ambiguous stems change.

Worth doing, and lower stakes than 1a–1c: today `jud 1` silently takes someone to
Judges when they may have wanted Jude, which is a wrong answer delivered
confidently rather than a missing one.

### Acceptance

`node scripts/test-reference-search.js` must exit clean: 15/15 acceptance cases,
all 66 books reachable, no wrong display names.

Then one thing the harness cannot check, because it needs a device: tapping a
result must **scroll to the verse**, not just open the story at the top.
`openSegment` passes a `pos`, and `app/(tabs)/[segment]/index.tsx` has to act on
it. Check `gen 4:3` lands on Genesis 4:3 inside "People Sin", not at the head of
the story.

---

## 2 · Confirm image share on a production build

**Blocks a claim in both listings** — *"Send a bubble to someone as an image"*.

`react-native-view-shot@5.1.0` is in `package.json`, but `utils/shareTurn.ts:81`
falls back to sharing citation text whenever the native module is unavailable,
silently. The dev client that predates the dependency has never rendered the
card.

Open a story on the production build, long-press a bubble, tap Share, and confirm
an **image** appears — speaker name, ink colour, reference, wordmark, correct in
both light and dark. If it hands you text instead, delete that sentence from both
descriptions before submitting.

---

## 3 · Run the migration pass on a real 1.2.1 database

**Blocks a promise to your existing users.** The Apple release note says
*"Everything you have already read, saved and noted comes with you."*

Full procedure in `MVP2/14-SHIP-PLAN.md` §4. In short: install 1.2.1 build 20
from TestFlight, generate real data (six completed stories across two divisions,
four reactions, two notes, a paused `Bible1Year`, a three-day streak), then
install 2.0.0 **over the top without deleting the app** and verify completions,
reactions, notes, active plan, streak, and that onboarding v2 shows exactly once.

Note the schema question in §4 of that document is still open: the bundled
`sourceview.db` carries `completedSegments`, `sourceReadings` and `user_settings`,
while `api/database-manager.ts` creates `completed`, `source` and no
`user_settings`. Settle which shape real installs have by pulling a database off a
1.2.1 device — not by reading the repo file.

---

## 4 · Two external accounts, both pure lead time

Start these first; they are waiting, not working.

- **A hosted privacy policy URL.** `privacy-policy.html` exists in the repo but is
  not served anywhere recorded, and `app.json` previously pointed at a raw GitHub
  Markdown link. Apple checks the link resolves. The same host can serve the
  support page, which **must be a web page, not a `mailto:`** — Apple has rejected
  `mailto:` support URLs.
- **The Play service account.** `eas.json` points the Android submit at
  `./google-service-account.json`, which does not exist. Google Cloud service
  account → enable the Play Android Publisher API → link the key in Play Console
  under Users & permissions. About an hour.

---

## 5 · Finalise the division titles before shooting screenshots

The ten titles in `constants/divisions.ts` ship as defaults per the step log's X5
note. They appear on **every Read-tab screenshot**, so any shot taken before they
are final is wasted work. This gates §6 of the screenshot brief in
`APP-STORE-LISTING.md`.

---

## 6 · Remove French from the store consoles

`FF.FRENCH_ENABLED` is `false` in `constants/featureFlags.ts`, so `app/settings.tsx`
hides the language rows and no user can reach French in this build.

The listings say only that French is returning, which is a statement of intent and
fine. But **delete any French localisation entry in App Store Connect and Play**
for this release. Both stores check that an advertised language is actually
reachable in the binary, and a localised listing is a claim about this build
rather than a future one.

---

## 7 · Housekeeping — none of it blocks submission

**The voice count disagrees with itself.** `utils/voicesMet.ts` sets
`TOTAL_VOICES = 774` and the You tab renders "X / 774";
`conversations.json` metadata says `773`. `MVP2/03-DESIGN-DIRECTION.md` explains
774 as the union of the per-colour sets and is authoritative, so the listings use
774 and match what a user sees. Reconcile the data file when convenient.

**`APP_DESCRIPTION.md` says stories are "15-20 minutes each".** The data says a
median of 10 and a maximum of 14. Nothing in the new copy repeats it, but do not
hand that file to anyone writing marketing — see `COPY-RATIONALE.md` §1 for the
other reasons.

**`PRIVACY_POLICY.md` still lists "English or French" and the French Bible
download.** Consistent with "French is returning", so no action needed. If a
reviewer asks, the answer is that the download machinery ships dormant behind a
flag. Both the Markdown and the HTML are clean of QR and camera references, which
was the real risk.

---

## Summary

| | Item | Blocks |
| --- | --- | --- |
| 1 | Verse reference search — index, names, the "I" parser, multi-word, ambiguity | A claim in both listings |
| 2 | Image share on a production build | A claim in both listings |
| 3 | Migration pass on a real 1.2.1 database | A promise to existing users |
| 4 | Privacy policy URL · Play service account | Submission itself |
| 5 | Division titles final | Screenshots |
| 6 | French removed from both consoles | Review risk |
| 7 | Voice count, old marketing doc | Nothing |
