# Onboarding — design and content

Queue item **G1**. Until now this existed only as four line-items in
[`05-GROUP-READING.md`](05-GROUP-READING.md) §1. This is the actual spec: copy,
layout, interaction, motion and the technical notes.

**Why it matters more here than in most apps.** Onboarding carries the entire
group-reading protocol. We deleted the QR codes, the host/join handshake and the
role selection screens, and put the whole coordination model into **one sentence
taught once**. If screen 3 does not land, group reading does not happen.

---

## 1. Principles

1. **Four screens. Never five.** Every screen added loses readers.
   *(Revised for 2.0: two screens were added anyway — "Make it a habit" and
   "Meet the cast" — to teach two real, shipped feature areas that had no
   home anywhere else in the app's first run: reading plans/streak/
   discussion questions, and the Cast tab's per-voice conversation data.
   Both survive the "show the real thing" and "ask for nothing" rules below.
   Treat "never five" as "don't add a screen casually," not as an absolute —
   but every screen still has to earn its place the way these two did.)*
2. **Show the real thing.** No illustrations, no icons standing in for scripture.
   Screen 2 renders an actual passage with actual bubbles — the product *is* the
   explanation. This also means nothing to commission.
3. **Teach one idea per screen**, in the app's own visual language, so the first
   real screen feels like a continuation rather than a change.
4. **Skippable from the first screen**, and re-openable later.
5. **Ask for nothing.** No account, no email, no permissions — after the camera
   removal there are none. Do not introduce a request here.
6. **Under 45 seconds** read at a normal pace.

---

## 2. The six screens

Layout is identical throughout, so only the content changes:

```
  ┌─────────────────────────────┐
  │                      Skip   │   text button, top right
  │                             │
  │  Headline                   │   28px, weight 600, ≤ 6 words
  │  One or two lines of body.  │   16px, muted, ≤ 25 words
  │                             │
  │  ┌───────────────────────┐  │
  │  │                       │  │   the demonstration —
  │  │   live app content    │  │   real components, real data
  │  │                       │  │
  │  └───────────────────────┘  │
  │                             │
  │        ● ○ ○ ○              │   progress dots
  │      [   Next   ]           │   full-width, accent
  └─────────────────────────────┘
```

Swipe horizontally or tap Next. Dots are indicators, not controls.

---

### Screen 1 · The shape of it

> # The Bible, told as 365 stories
>
> Not chapters and verses. Stories with beginnings and endings — one a day for a
> year, or whenever you like.

**Demonstration.** Three real story rows on the thread — *God Creates*, *People
Sin*, *The Flood* — with their references and reading times. The thread draws in
from the top.

**Why first:** it reframes what the app is before any mechanic is introduced.

---

### Screen 2 · The four colours

> # Everyone has a voice
>
> Every word is coloured by who said it. The narrator tells the story. God
> speaks in red. The people in it speak in their own colours.

**Demonstration.** A real exchange, live-rendered from `S008`:

> **THE NARRATOR** — Some time later, God tested Abraham's faith.
> **GOD** — Abraham!
> **ABRAHAM** — Yes, here I am!

Bubbles arrive one at a time, ~280ms apart, in reading order.

**Then a legend**, using the four descriptions already written in the translation
file (`narratorRoleDescription` and its siblings — move them here rather than
deleting them with the rest of the group keys):

| | |
| --- | --- |
| ⬤ Narrator | tells the story |
| ⬤ God | God, Jesus, the Spirit |
| ⬤ Main characters | the people the story follows |
| ⬤ Everyone else | every other voice, down to a single blind beggar |

That last phrase is worth keeping. It tells you the data goes further than you
expected, which is the moment people become curious about Cast.

---

### Screen 3 · The one that matters

> # Read it with three friends
>
> One person takes each colour and you read it out loud together. That's it —
> no setup, no codes. Works just as well on your own.

**Demonstration.** The call sheet from a real story:

> **Abraham's Faith Tested** · 2,167 words
> The Narrator 1,191 · God 315 · Abraham 252 · Sarah 62 · Isaac 17

with four small avatars beneath, one per colour. Nothing tappable.

**This screen replaces six deleted routes, two services and a QR scanner.** The
last sentence is doing as much work as the first — someone reading alone must
not feel they are missing the real version of the app.

**Copy note:** "three friends" is deliberate. "A group" is abstract; three
friends is a number of people you can picture. Adjust the number if usage shows
groups are usually a different size.

---

### Screen 4 · Make it a habit

> # Make it a habit
>
> Pick a plan or read whenever you like — either way your streak follows your
> calendar, and every story ends with something worth discussing.

**Demonstration.** An illustrative streak ring (`StatRing`), a one-line plan
readout ("The Beginning · 24/68 stories"), and one real discussion question
about Abraham's test of faith. The streak and plan numbers are illustrative —
onboarding runs before anyone has read anything — same convention as every
other screen's curated demo data. Nothing tappable.

**Why it exists:** plans, streak and discussion questions are real, shipped
features (they carry the 1.3.0 "What's New" copy) that nothing in the
original four screens ever mentioned.

---

### Screen 5 · Meet the cast

> # Every voice has a page
>
> Tap any name to see who they spoke with most, their longest speech, and
> every story they're in — across all 774 voices.

**Demonstration.** A compact teaser of **David's** real Cast page, read
straight from `assets/data/conversations.json` (no invented numbers): his
rank among speaking voices, who he spoke with most (God, ×28), and his
longest single speech — 1,522 words, a psalm, in *"Book 4: God our
Deliverer"*. Nothing tappable.

**Why David, not Abraham:** every other screen's demo already uses Abraham;
switching protagonists here shows the onboarding isn't just retelling one
story, and David's numbers (rank 4 of 769 speaking voices, a 1,522-word
single speech) are the more striking hook for what Cast surfaces.

---

### Screen 6 · Make it yours

> # Keep what stays with you
>
> Press and hold any verse to react, add a note, or send it to someone. It's
> saved to that verse, so you'll find it again.

**Demonstration.** A bubble with the reaction row beneath it and one saved note
visible.

**Button:** *Start reading* — not "Get started", not "Done". It says what
happens next.

Tapping it opens **today's story** from `DailyStoryMap` (see
[`10-UX-AUDIT.md`](10-UX-AUDIT.md) §3.1), not the story list. Ending onboarding
on a list is ending it on another decision.

**If H1 (share) is not built**, drop "or send it to someone" from the body. Never
teach a control that isn't there.

---

## 3. Motion

Tokens from [`09-IMPLEMENTATION-SPEC.md`](09-IMPLEMENTATION-SPEC.md) §1.2. This
is the one place slightly showy motion earns its keep, because it is teaching.

| Element | Behaviour |
| --- | --- |
| Screen transition | Horizontal slide, `DUR.base`, follows the finger on swipe |
| Headline and body | `FadeInDown` on arrival, body delayed 60ms |
| Screen 1 thread | Draws top to bottom, `DUR.slow` |
| Screen 2 bubbles | One at a time, 280ms apart, fade + rise 8px |
| Screen 2 legend | Colours arrive in sequence, `STAGGER.bar * 3` apart |
| Screen 3 call sheet | Bar grows first, then names fade in |
| Screen 4 streak ring | Grows in on arrival (`StatRing`), one light haptic tick near completion |
| Screen 5 cast card | Rank and "spoke with" arrive, then the longest-speech pull-quote, with a haptic tick |
| Progress dots | Spring-animated width and colour, not a snap — active dot a 16px pill, others 6px circles |
| Demo depth | Demo card carries a subtle per-screen accent glow and a slight parallax lag against the swipe |
| Button | Spring scale on press; the final "Start reading" tap gets a small pop before navigating |

*(2.0 revision: entrances moved from `withTiming`/`FadeInDown.duration()` to
spring physics — `FadeInDown.springify()` and `withSpring()` against the
`SPRING` token in `constants/Motion.ts` — per current motion-design norms.
Timing-token durations above are historical; the spring config is now the
source of truth.)*

**Entrance animations replay on every visit to a screen**, forwards or back. A
static screen on the way back reads as broken.

**Reduce Motion:** everything final-state immediately, transitions become
cross-fades, the screen-2 bubble sequence appears complete, the dot pager and
CTA pop become instant, and the parallax layer holds still. No delays.

---

## 4. Technical

- `hooks/useFirstLaunch.ts` already gates first-run — build on it, don't add a
  parallel flag.
- Persist a **version number**, not a boolean: `onboardingVersion: 3` as of
  2.0 (was 2). When you change onboarding you can then re-show it to existing
  users, which a boolean makes impossible.
- Show it **after** the database has initialised, so "Start reading" opens
  instantly. If init is slow the splash covers it.
- Route: `app/onboarding.tsx`, outside `(tabs)` — no tab bar, and it must not be
  swipeable-back into.
- **Re-openable** from You → About → *"How SourceView works"*. People forget the
  colours and there must be somewhere to look.
- Screens 1–6 render **real components with real data**, not screenshots.
  Screenshots go stale the moment the design moves, and this design is still
  moving. Screen 5's numbers come straight from `assets/data/conversations.json`
  (the same file the live Cast tab reads) — never hand-type a stat there.

---

## 5. French

The copy for screens 1–3 and 6 is English and French, in `UI-ENG.json` /
`FRA-UI.json` under `onboarding.*`. French runs roughly 20% longer, so:

- Headlines must hold at **two lines** at the largest text size in French
- *"Read it with three friends"* → *« Lisez-le avec trois amis »* — check the
  headline still fits beside the Skip button
- The four colour descriptions already exist in both languages under
  `groupReading.*` — **move them to `onboarding.*` rather than deleting them**
  with the rest of the group keys, or the French translation is lost and has to
  be redone.

**Screens 4 and 5 (added in 2.0) are English-only.** 2.0 ships without French
for these two screens — no `FRA-UI.json` entries exist for
`screen4Title/Body` or `screen5Title/Body`. If French comes back for 2.0,
translate these two before anything else in this file changes; until then,
don't add French strings for them piecemeal.

---

## 6. What not to do

- **No account, no email capture, no notification permission prompt.** Ask for
  the daily reminder later, after someone has read a few stories and it means
  something.
- **No "choose your reading plan" step.** That is the mode selector wearing a
  different hat. Plans are one tab away.
- **No survey** — "How familiar are you with the Bible?" is a decision before a
  benefit.
- **No auto-playing audio.** There is no audio in MVP2, and it would be wrong
  here even when there is.
- **Do not explain the tab bar.** If the tabs need explaining, fix the tabs.

---

## 7. Done when

- [ ] Six screens, under a minute at a normal reading pace
- [ ] Skip visible on screen 1 and every screen after
- [ ] Every demonstration renders live components with real data (screen 5's
      numbers match `conversations.json` exactly)
- [ ] "Start reading" opens today's story, not the list
- [ ] Re-openable from You → About
- [ ] Screens 1–3 and 6: English and French, both at all three text sizes,
      nothing clipped. Screens 4–5: English, all three text sizes, nothing
      clipped
- [ ] Reduce Motion: complete, static, no added delay — spring entrances,
      dot pager, parallax and the final CTA pop all collapse correctly
- [ ] Nothing is requested — no account, no permission, no preference
- [ ] Someone who has never seen the app can explain the four colours afterwards.
      **Test this on five people before shipping.** It is the only acceptance
      criterion that matters.
