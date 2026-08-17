# Story completion, and everything the QR removal touches

Follows [`05-GROUP-READING.md`](05-GROUP-READING.md), which decided the *what*.
This is the *where* — read from the codebase and the SQLite schema on
`main` @ `4c8d632`.

Headline: the removal is **29 files, 2 tables and about 30 translation keys**,
and it is larger than the six routes I first counted. But it also **rescues a
feature that already exists and is trapped behind the QR gate**, and it carries
**no risk to user progress** — verified below.

---

## 1. Story completion today

`components/CheckCircle.tsx` — **1,064 lines**, 46 references to group state — is
the completion control. Its props include:

```ts
mode?: 'auto' | 'normal' | 'group'
```

and its state includes `showScanner`, `showHostQRModal`, `hostQRData`,
`isGenerating`, `joinerScans`.

**So finishing a story currently means, depending on mode:** open a camera, scan
a QR code, validate a session ID, count how many people scanned you, or generate
a QR code for others to scan. All of that lives inside the button that marks a
story read.

Before that, `components/GroupReading/ReadingModeModal.tsx` asks the user to pick
between *"Read alone"* and *"Read with others"* — the mode selector, in so many
words.

This is the "too many mechanical steps" problem, and it is concentrated in
exactly two components.

## 2. Story completion in MVP2

**One tap. Nothing else.**

The circle marks the story read, records it, and celebrates. `markSegmentComplete()`
already takes everything it needs:

```ts
markSegmentComplete(segmentID, context: 'main'|'plan'|'challenge'|'today', planID?, challengeID?)
```

Note `completionType` is `'main' | 'plan' | 'challenge' | 'today'` — **reading
context, not reading mode.** The schema was never mode-aware. Nothing about
completion needs to change to support solo-or-together, because it never
distinguished them in the first place.

### The new completion moment

Confetti alone is thin, and the group badges that gave completion its stakes are
going away. Replace both with something the data already supports:

> **The Flood** complete.
> You met **Noah** for the first time. **215 of 774 voices.**

Completion reveals which voices you have now heard. It works identically alone or
in a group of four, it cannot be gamed, it pulls people toward the Cast tab, and
it makes the 774 number mean something across a year of reading.

This replaces the group achievement badge with a metric that survives the
removal — consistent with the *voices met* progress model in
[`03-DESIGN-DIRECTION.md`](03-DESIGN-DIRECTION.md).

### What CheckCircle becomes

From 1,064 lines to an estimated 200–300: completion state, read count, the tap
target, the celebration, and the context-aware navigation that follows a plan or
challenge completion. Everything QR, session, host and role goes.

---

## 3. The feature this rescues

The translation file already contains these keys:

```
groupReading.storyRoleDistribution     "Story role distribution:"
groupReading.readingRolesForThisStory  "Reading roles for this story:"
groupReading.narratorRoleDescription   "Reads the narrative portions"
groupReading.godRoleDescription        "Reads God's dialogue"
```

**The app already computes and displays each story's role distribution.** It is
just locked inside the group setup flow, reachable only after choosing a mode and
starting a session.

That is the call sheet. It is not new work — it is moving an existing computation
out from behind a gate and onto the story header, where it helps everyone:

> **Abraham's Faith Tested** · 2,167 words
> The Narrator 1,191 · God 315 · Abraham 252 · Sarah 62 · Isaac 17 · Hagar 8

Four people glance and know who reads what. A solo reader sees the shape of the
story before entering it. No mode, no session, no host.

**Revise S15 down to ~0.5 days.** The logic exists; it needs relocating and
restyling.

---

## 4. Full removal inventory

### Delete outright — 18 files

| Path | Notes |
| --- | --- |
| `app/group-setup.tsx` | route |
| `app/host-waiting.tsx` | route |
| `app/join-group.tsx` | route |
| `app/qr-info.tsx` | route |
| `app/qr-share.tsx` | route |
| `app/role-selection.tsx` | route |
| `components/GroupReading/GroupSetupScreen.tsx` | 22.5 KB |
| `components/GroupReading/HostWaitingScreen.tsx` | 20 KB |
| `components/GroupReading/JoinGroupScreen.tsx` | 22.5 KB |
| `components/GroupReading/BroadcastingScreen.tsx` | 19.7 KB |
| `components/GroupReading/QRCodeShareScreen.tsx` | 10.4 KB |
| `components/GroupReading/QRInfoScreen.tsx` | 8.4 KB |
| `components/GroupReading/NearbyGroupCard.tsx` | 10.5 KB |
| `components/GroupReading/ReadingModeModal.tsx` | **the mode selector** |
| `components/QRCodeScanner.tsx` | |
| `services/QRCodeGenerator.ts` | |
| `services/QRCodeDiscoveryManager.ts` | |
| `context/GroupReadingContext.tsx` | |

The whole `components/GroupReading/` directory goes — **8 files, ~125 KB of
screen code.** I under-counted this in the PRD; it was not in my original
six-route figure.

### Modify — 11 files

| Path | Work |
| --- | --- |
| `components/CheckCircle.tsx` | **The big one.** 1,064 → ~250 lines |
| `app/(tabs)/[segment]/index.tsx` | Reader: drop session/role wiring |
| `components/Bible/Segment.tsx` | Drop role-aware rendering; keep colours |
| `components/Bible/Intro.tsx` | Drop group references |
| `components/navigation/SegmentItem.tsx` | Queries `group_segment_completion` for list state — repoint at `segment_completion` |
| `components/navigation/ChronologicalSegmentItem.tsx` | Same |
| `app/(tabs)/Home.tsx` | Mostly group entry; screen is being removed anyway |
| `app/(tabs)/Navigation.tsx` | Folding into Read regardless |
| `app/(tabs)/ReadingPlans.tsx` | Drop group entry points |
| `app/(tabs)/Achievements.tsx` | Counts `group_segment_completion` for a badge — dies, replaced by voices met |
| `app/_layout.tsx` | Unregister the six routes, drop `GroupReadingContext` provider |

### Dependencies and config

- `expo-camera` — **verified used only by `QRCodeScanner.tsx` and `Home.tsx`**
- `react-native-qrcode-svg`
- `expo-camera` from the `app.json` plugins array
- `NSCameraUsageDescription` from `ios.infoPlist`
- `android.permission.CAMERA` from `android.permissions`

Two fewer native modules to carry across SDK 53 → 57, and **the app requests no
camera permission at all.**

---

## 5. Database

### The two group tables

```sql
group_reading_sessions    (sessionId, storyId, storyTitle, scriptureReference,
                           hostDeviceId, hostUserName, hostRole, status,
                           createdAt, expiresAt, planId, challengeId, sessionData)
group_segment_completion  (segmentID, sessionId, storyId, userRole, isHost, completedAt)
```

### No user progress is at risk — verified

`CheckCircle.tsx` calls `markSegmentComplete()` **before**
`recordGroupCompletion()` on both the host path (line ~786) and the joiner path
(line ~624). Every group completion was therefore already written to
`segment_completion` as well.

`group_segment_completion` is purely supplementary — it feeds one achievement
badge and three queries in `api/insightQueries.ts`. **Dropping it loses no
reading progress.**

### Recommended migration approach

**Do not drop the tables in the same release that removes the code.** Stop
writing to them, leave them in place, and make every read tolerant of their
presence. Drop them one release later, once the removal has shipped and held.
That keeps a rollback possible.

The migration must not assume the tables are absent, and must not assume they are
present. `api/database-migration.ts` is 15 KB and already handles versioned
migrations — extend it rather than adding a parallel path.

### Other schema findings, pre-existing

- **`segment_completion` and `completedSegments` overlap.** Two tables tracking
  the same thing; `markSegmentComplete` writes the former and comments call it
  "legacy". Worth resolving during MVP2 while the completion path is open, but it
  is pre-existing debt, not caused by this removal.
- **`segment_completion.readerColor`** records which ink you read as — written by
  the group role flow. With roles gone, nothing writes it. **Leave the column,
  stop writing it.** It becomes the natural home for the optional "I'm reading
  Green today" idea if that is ever built.
- **`sourceReadings (segmentID, blockID, color)`** records per-block colour
  reads. Check whether anything outside the group flow still writes it; if not it
  becomes dead and should be flagged rather than silently kept.
- **`api/insightQueries.ts`** — 3 queries read `group_segment_completion` at
  lines 199, 332, 523. Rewrite against `segment_completion` or remove the
  insights they feed.
- **`api/sqlite.ts.backup`** (34 KB) shadows the real module in searches. Delete
  it — noted in the audit, still there.

---

## 6. Localisation

Roughly **30 keys** across two languages, in three groups:

- `groupReading.*` — 20+ keys, all deleted
- `readingMode.*` — the whole subtree, deleted
- `alerts.qrScannerUnavailable`, `alerts.invalidQRCode`, `alerts.invalidQRMessage`,
  `alerts.failedToProcessQR` — deleted
- `landing.joinGroupReading`, `landing.scanQRCode` — deleted

**Rewrite rather than delete** — these describe the product, not the mechanism:

- `about.joinMovement`, `about.joinPara1`, `about.joinPara2` — the case for
  reading together. Keep the argument, drop any reference to scanning.
- `about.groupReadingData`, `about.groupReadingDataDesc` — a privacy disclosure
  about temporary session data. **This must change: there will be no session
  data.** The new text is shorter and better.
- `home.smallGroupQuestions` — unrelated to QR, keep.

The four role descriptions (`narratorRoleDescription`, `godRoleDescription`,
`mainCharacterRoleDescription`, `otherVoicesRoleDescription`) should **move, not
die** — they are the plain-English explanation of the four colours, and they
belong in onboarding screen 2 and the call sheet.

---

## 7. Revised cost

| | Days |
| --- | --- |
| Delete 18 files, unregister routes, strip dependencies and permissions | 1.5 |
| Rebuild `CheckCircle.tsx` | 2–3 |
| Repoint `SegmentItem` / `ChronologicalSegmentItem` / `insightQueries` | 1 |
| Modify the remaining 6 files | 1 |
| Migration: stop writing, tolerate existing rows, test against a real database | 1–1.5 |
| Localisation cleanup and About rewrite, both languages | 1 |
| Onboarding, four screens, both languages (S14) | 2–3 |
| Call sheet — relocate existing logic (S15, revised down) | 0.5 |
| Read-aloud mode (S16) | 1.5–2 |
| **Total** | **11.5–15** |

Up from the 6–9 first estimated in `05-GROUP-READING.md`, because the
`components/GroupReading/` directory and the `CheckCircle` rebuild were not
counted. **Phase 1 should absorb the deletions; Phase 4 the onboarding and
read-aloud mode.**

---

## 8. Sequence

1. **Delete first, before any redesign.** Deleting 18 files and stripping two
   native dependencies makes the SDK 57 upgrade smaller and stops every later
   phase working around code that is going away. Ideally do this in Phase 0 step
   1, alongside dropping `expo-av` and `expo-video` — it is the same kind of work
   and the same kind of win.
2. **Rebuild `CheckCircle` second.** It gates the completion experience, which
   Read L2 depends on.
3. **Migration and database testing before any beta.** Users have reading
   history worth more than any feature in this document.
4. **Onboarding last.** It teaches whatever the app finally is, so writing it
   early means writing it twice.

## 9. New risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| `CheckCircle` rebuild breaks plan/challenge completion navigation | **High** | It handles four contexts and routes differently for each. Test all four paths before removing the old file. |
| Insight queries silently return zero after repointing | Medium | Three call sites; verify each renders real numbers, not empty states. |
| Existing users see their group-completed stories as incomplete | Low | Verified not possible — `markSegmentComplete` always ran too. Confirm once against a real database anyway. |
| Store listing and screenshots still show QR flows | Medium | Update in the same release; the camera permission removal makes this mandatory, not cosmetic. |
