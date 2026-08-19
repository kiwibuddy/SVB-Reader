# Step log

Append-only. One entry per save point. Numbered 13 because `12-MOCKUP-DELTA.md` already exists.

## mvp2-00 · 2026-08-19

**Tag:** `mvp2-00`  
**Commands:** `npx tsc --noEmit`, `npx expo lint`

| Check | Result |
| --- | --- |
| tsc | **pass** |
| expo lint | **deferred** — 85 errors / 232 warnings, none in new Motion/buildThread/haptics/useGrowOnFocus files. Pre-existing (`SettingsModal.tsx` refs, etc.). Not caused by this step. |
| `@react-navigation/` imports | **clean** |
| `/(tabs)/Navigation` | **deferred to A2** — still in `CheckCircle.tsx:184` |

**This step:** brought 08–12 docs + `03-mvp2-screens.html`; added `constants/Motion.ts`, `components/thread/buildThread.ts`, `hooks/useGrowOnFocus.ts`, `utils/haptics.ts`.

---

## mvp2-A · 2026-08-19

**Tag:** `mvp2-A`  
**Commands:** `npx tsc --noEmit`, `npx expo lint`, grep `@react-navigation/` and `/(tabs)/Navigation`

| Check | Result |
| --- | --- |
| tsc | **pass** after in-step fix: `NavBook.tsx` indexed `SegmentTitles` with `String(segment)` after extracting `SegmentKey` to `types/bibleNav.ts`. |
| expo lint | **deferred** — 76 errors / 220 warnings, same pre-existing `SettingsModal` refs class. ThreadList exhaustive-deps warning not blocking. |
| `@react-navigation/` imports | **clean** |
| `/(tabs)/Navigation` | **clean** — `Navigation.tsx` and `TopSpeakers.json` deleted |

**This step:** A1 FilterChip + pill scroller alignment; A2 CheckCircle routes + delete Navigation; A3 keyboard dismiss on ThreadList/Cast; A4 plan detail inside tabs; A5 all three plans with `id.startsWith('S')`; A6 reader `paddingBottom: insets.bottom + 88`; H6 TopSpeakers deleted with Navigation.

---

## mvp2-B · 2026-08-19

**Tag:** `mvp2-B`  
**Commands:** `npx tsc --noEmit`, grep `@react-navigation/` and hard-coded `M30` path

| Check | Result |
| --- | --- |
| tsc | **pass** |
| expo lint | **deferred** — same pre-existing SettingsModal class as mvp2-A |
| `@react-navigation/` imports | **clean** |
| hard-coded thread `d=` | **clean** in app code — `buildThread` / `buildYearSparkline` only |

**This step:** B1 generated thread + YearThread sparkline; B2 division → book → story; B3 beads mask with `palette.bg` ring; B4 continue card fades with scroll, search pinned; H2 Today / Continue / plan day from `DailyStoryMap`; H3 reading times on rows, continue card, plan detail.

---

## mvp2-C · 2026-08-19

**Tag:** `mvp2-C`  
**Commands:** `npx tsc --noEmit`, grep `@react-navigation/` and reader gutter/dots

| Check | Result |
| --- | --- |
| tsc | **pass** |
| expo lint | **deferred** — pre-existing SettingsModal class |
| `@react-navigation/` imports | **clean** |
| reader gutter / speaker dots | **clean** in GlowBubble/Segment — no Svg, no tails. `Block.tsx` still has tails but is unused by the reader path. |
| Device checklist | **noted, not blocked** — confirm S008 left/right, Cast list, late-division thread, You year thread at zero, reader has no line and no dots. |

**This step:** C1–C3 bubbles 84% / 16px / 1.45 / 16+5 corners, no tails, stagger cap 8; C4 no gutter; C7–C8 call sheet mix bar + ink dim 0.55; header `Gen 15:1–18:15` style; read-aloud fades chrome and dims other turns to 0.35.

---

## mvp2-H1 · 2026-08-19

**Tag:** `mvp2-H1`  
**Commands:** `npx tsc --noEmit`

| Check | Result |
| --- | --- |
| tsc | **pass** |
| expo lint | **deferred** — pre-existing |
| `@react-navigation/` | **clean** |
| view-shot native | **deferred** — `react-native-view-shot` added; image share needs a new dev client. Copy and text share work without it. |

**This step:** long-press sheet gains Share + Copy. Copy is `"text" — Genesis 22:2 (NLT)`. Share captures a speaker/ink/wordmark card when view-shot is available, otherwise shares the citation.

---

## mvp2-E · 2026-08-19

**Tag:** `mvp2-E`  
**Commands:** `npx tsc --noEmit`

| Check | Result |
| --- | --- |
| tsc | **pass** |
| expo lint | **deferred** — pre-existing |
| `@react-navigation/` | **clean** |
| H6 ChronologicalMappings | **deferred to F** — still imported by `ChronologicalView.tsx`. TopSpeakers already deleted in A. |
| E6 / E7 | **cut** — era card and exchange pager, per plan cut order. |

**This step:** Cast sorts by words, hides four narration sources, speech-bubble pills Main/Supporting/Divine/All, renamed groups, written epistle authors grey, card sentence + books + ten growing division buckets.

---

