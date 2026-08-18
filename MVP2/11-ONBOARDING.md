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

## 2. The four screens

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

### Screen 4 · Make it yours

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
| Progress dots | Width, not opacity — active dot is a 16px pill, others 6px circles |
| Button | Fill scales 0.97 on press, `DUR.instant` |

**Entrance animations replay on every visit to a screen**, forwards or back. A
static screen on the way back reads as broken.

**Reduce Motion:** everything final-state immediately, transitions become
cross-fades, and the screen-2 bubble sequence appears complete. No delays.

---

## 4. Technical

- `hooks/useFirstLaunch.ts` already gates first-run — build on it, don't add a
  parallel flag.
- Persist a **version number**, not a boolean: `onboardingVersion: 2`. When you
  change onboarding you can then re-show it to existing users, which a boolean
  makes impossible.
- Show it **after** the database has initialised, so "Start reading" opens
  instantly. If init is slow the splash covers it.
- Route: `app/onboarding.tsx`, outside `(tabs)` — no tab bar, and it must not be
  swipeable-back into.
- **Re-openable** from You → About → *"How SourceView works"*. People forget the
  colours and there must be somewhere to look.
- Screens 1–4 render **real components with real data**, not screenshots.
  Screenshots go stale the moment the design moves, and this design is still
  moving.

---

## 5. French

The copy above is English. French runs roughly 20% longer, so:

- Headlines must hold at **two lines** at the largest text size in French
- *"Read it with three friends"* → *« Lisez-le avec trois amis »* — check the
  headline still fits beside the Skip button
- All eight strings go in `UI-ENG.json` / `FRA-UI.json` under `onboarding.*` from
  the start. Do not hard-code English "temporarily".
- The four colour descriptions already exist in both languages under
  `groupReading.*` — **move them to `onboarding.*` rather than deleting them**
  with the rest of the group keys, or the French translation is lost and has to
  be redone.

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

- [ ] Four screens, under 45 seconds at a normal reading pace
- [ ] Skip visible on screen 1 and every screen after
- [ ] Every demonstration renders live components with real data
- [ ] "Start reading" opens today's story, not the list
- [ ] Re-openable from You → About
- [ ] English and French, both at all three text sizes, nothing clipped
- [ ] Reduce Motion: complete, static, no added delay
- [ ] Nothing is requested — no account, no permission, no preference
- [ ] Someone who has never seen the app can explain the four colours afterwards.
      **Test this on five people before shipping.** It is the only acceptance
      criterion that matters.
