# Group reading — the mechanism dissolves, the behaviour stays

**Resolves D1.** Decided 17 August 2026.

Group reading is core to SourceView and is not being cut. What is being cut is
the *coordination software* around it — QR codes, host/join handshakes, role
selection, and the choice between "group read" and "individual read".

## The principle

**The app never asks "alone or together?"**

WhatsApp has no mode picker. You do not choose between solo and social; you have
chats because you want to connect with people, and the artifact implies the
behaviour. Nobody has to be told.

The four ink colours already *are* the group mechanism. Four voices, four
readers. That coordination happens between humans sitting in a room — it does not
need a server, a QR code, or a host. Teach it once in onboarding and people
know.

One reading experience. Read it alone and it is a beautiful Bible app. Read it
with three others and the colours have already done the work.

## What gets deleted

| | |
| --- | --- |
| Routes | `group-setup.tsx`, `host-waiting.tsx`, `join-group.tsx`, `qr-info.tsx`, `qr-share.tsx`, `role-selection.tsx` |
| Components | `components/QRCodeScanner.tsx` |
| Services | `services/QRCodeGenerator.ts`, `services/QRCodeDiscoveryManager.ts` |
| Context | `context/GroupReadingContext.tsx` |
| Dependencies | `expo-camera`, `react-native-qrcode-svg` |
| Plugins | `expo-camera` from the `app.json` plugins array |
| Permissions | `NSCameraUsageDescription`, `android.permission.CAMERA` |
| Branches | Group-mode conditionals in `Home.tsx`, `Navigation.tsx`, `ReadingPlans.tsx`, `[segment]/index.tsx` |

**Verified: `expo-camera` is imported only by `QRCodeScanner.tsx` and
`Home.tsx`.** Nothing else in the app uses the camera, so the permission can go
entirely.

### Why this is a win beyond simplicity

- **No camera permission at all.** One fewer iOS prompt, one fewer thing to
  justify in App Store review, and a materially better privacy story for an app
  used by churches and families. An app that requests camera access and barely
  uses it is also a rejection risk.
- **Two fewer native modules** to carry across SDK 53 → 57. Phase 0 gets
  slightly cheaper and slightly less likely to break.
- **No bifurcated UI.** The design system applies once rather than twice, and
  there is no second navigation path to style, test, and localise.

## What replaces it

### 1. Onboarding — taught once, then never again

Four screens on first launch, skippable, re-openable from You → About.

1. **The idea.** The Bible as 365 stories, not chapters and verses.
2. **The four colours.** Black narrates. Red is God, Jesus, the Spirit. Green is
   the named people who carry the story. Blue is everyone else. Show a real
   passage, not a diagram.
3. **Reading together.** *"Reading with others? One person takes each colour."*
   That single sentence is the entire coordination protocol. Show four colours,
   four people. No buttons, no setup.
4. **Make it yours.** React and note on any verse; it is saved to that verse.

`hooks/useFirstLaunch.ts` already exists and gates first-run behaviour — build
on it rather than adding a parallel mechanism.

### 2. The call sheet — the group feature, made subtle

**This is the replacement for role selection, and it costs almost nothing.**

Every story already knows its own cast and the word split between voices. Read L2
already shows the split as a bar under the title. Make that bar expandable into
the named cast:

> **Abraham's Faith Tested** · 2,167 words
> The Narrator 1,191 · God 315 · Abraham 252 · Sarah 62 · Isaac 17 · Hagar 8

A group of four glances at that and knows who reads what. No handshake, no host,
no waiting screen. The data is already in `newBibleNLT1.json` — this is a
presentation change, not a feature build.

It also helps solo readers, who get to see the shape of a story before entering
it. That is the test for anything replacing the group machinery: **it should be
useful whether or not anyone else is in the room.**

### 3. Read-aloud mode — a reading affordance, not a coordination one

A toggle inside the reader. Chrome hides, type scales up, the current turn holds
full ink while the rest dim back.

Useful alone as a focus mode, and useful in a group of four where a phone might
be passed or propped. It is entered from *inside* a story, never from the home
screen, so it never becomes a mode you have to choose before you can read.

### 4. The group idea lives in copy, not code

Store listing, onboarding screen 3, the About page, and the reading-plan
descriptions. That is where "read this with three others" belongs — not in a
navigation flow.

## Consequences to handle

- **Group achievement badges become unearnable.** Anything that required the QR
  handshake cannot be completed after this change. Already addressed in the
  design: progress becomes **voices met** (214 of 774), which is honest, ungameable
  and survives the removal. See `03-DESIGN-DIRECTION.md`.
- **Existing users may have group state in SQLite.** `GroupReadingContext` and
  the sync-settings layer may have persisted rows. **The migration must not crash
  when it finds them** — read them, ignore them, do not assume the tables are
  absent. The audit never covered the database layer, so this needs real testing
  against a pre-MVP2 user database.
- **Store listing and screenshots reference group sessions.** Update the copy in
  the same release. The positioning does not change — churches, families and
  small groups are still the audience — but "scan a QR code to join" becomes
  "one person takes each colour".
- **The camera permission string must be removed from `app.json`** before the
  next submission, or you are declaring a capability you no longer use.

## Optional, flagged as optional

**"I'm reading Green today."** A purely local, entirely optional preference that
gently emphasises one colour's turns. No coordination, no server, no awareness of
anyone else. It could make a group of four feel supported without any handshake
— or it could be one setting too many. **Do not build it in MVP2.** Note it,
watch how people actually read, decide later.

## Cost

| | Days |
| --- | --- |
| Remove routes, services, context, dependencies, permissions, conditionals | 2–3 |
| Onboarding, four screens, both languages | 2–3 |
| Call sheet — expand the existing mix bar | 0.5 |
| Read-aloud mode | 1.5–2 |
| **Total** | **6–9** |

Against the 5–8 days that restyling the six group routes would have cost, this
is roughly cost-neutral and leaves a materially simpler app — one navigation
path, one fewer permission, two fewer native dependencies, and no mode selector
standing between a person and the text.
