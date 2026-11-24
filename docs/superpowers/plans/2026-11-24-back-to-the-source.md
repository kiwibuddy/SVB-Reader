# Back to the Source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three 30-second vertical ads (Never a Monologue, The Whole Story, Out Loud) in `Marketing/ads`, render them, and ship them with copy and credits.

**Architecture:** One data script reads the app's Bible JSON and writes every quoted line and the 365-story voice mix into `src/source/data.ts`, throwing if a line no longer matches. Each film is one Remotion composition built from small shared pieces (grain, end card, kinetic line). Music and etching prints are made by Python scripts and committed as assets.

**Tech Stack:** Remotion 4.0.409, React, TypeScript, `@remotion/google-fonts` (InstrumentSerif, Inter), Node ESM scripts, Python 3 (Pillow, numpy), FluidSynth + FluidR3 GM, ffmpeg.

**Spec:** `docs/superpowers/specs/2026-11-24-back-to-the-source-design.md`

## Global Constraints

- 1080x1920, 30 fps, 900 frames (`W`, `H`, `FPS` from `src/theme.ts`). Legible text in the safe box x 65–1015, y 269–1248 during the hook (0–3 s) and the end card (26–30 s).
- Quotes verbatim from `assets/data/newBibleNLT1.json`; every on-screen reference ends in "NLT".
- Colours only from `src/theme.ts` (`light`, `dark`); night `#0B0F12`, paper `#F2EAE0`.
- No AI imagery or voices. Art public domain with open-access source; museum label on screen.
- Music original; loudnorm to -14 LUFS; mp3 320k in `public/music/`.
- British spelling. No exclamation marks in our own lines. Don't advertise audio, sync, networked groups or AI.

## Review Focus

- A quote changes in the Bible JSON: `source-data.mjs` must throw, not silently ship different words (test: run with a deliberately wrong expected opening).
- Long lines at 1080 px: no line may overflow the frame or the safe box (test: render a still at the frame each line is fullest and check).
- Word-by-word reveal finishes early enough to be read: each line fully visible at least 0.8 s before its cut (test: still at cut − 24 frames shows the whole line).
- Font not loaded at render: Instrument Serif must be awaited (`loadFont`) so no frame falls back to Georgia (test: still at frame 0).
- Audio length: each track exactly 30.0 s and ending on the end card (test: ffprobe duration of mp3 and final mp4).

---

### Task 1: Data script and shared pieces

**Files:**
- Create: `scripts/source-data.mjs`, `src/source/data.ts` (generated), `src/source/kit.tsx`
- Modify: `src/Root.tsx`

**Interfaces:**
- Produces: `QUOTES: Record<QuoteId, { text: string; speaker: string; color: VoiceColor; ref: string }>` with ids `moses, godWith, gideon, godGo, thomas, jesus, father, jer11, jer4, jer10, neh, luke, col, rev`; `MIX: Array<{ id: string; title: string; mix: [number, number, number, number] /* black, blue, green, red shares */; minutes: number }>` (365 items); `SERIF_DISPLAY`, `INTER` font families; `<Grain />`, `<EndCard at={number} />`, `<Line text color align size start perWord />` in `kit.tsx`.

- [ ] Step 1: Write `source-data.mjs` with `take(segId, turn, expectStart, cut?)` that throws `"<seg>#<turn> starts …, expected …"` on mismatch; run it once with a wrong `expectStart` and see it throw.
- [ ] Step 2: Fix the expectation, run `node scripts/source-data.mjs`; expect `wrote src/source/data.ts`, 14 quotes, 365 mix rows.
- [ ] Step 3: `kit.tsx`: load Instrument Serif and Inter via `@remotion/google-fonts`; `EndCard` (icon, "Back to the source.", "SourceView Together", four bars, store chips); `Grain` (SVG turbulence overlay, opacity 0.12).
- [ ] Step 4: `npx tsc --noEmit -p .` passes. Commit.

### Task 2: Film 1, Never a Monologue

**Files:** Create `src/source/MonologueAd.tsx`, `music/source.py`, `public/music/source-monologue.mp3`; modify `src/Root.tsx` (id `SourceMonologue`).

- [ ] Step 1: Composition per the spec's beat table (cuts at 60, 105, 195, 255, 345, 405, 420, 525, 600, 780 frames). Human lines right on night in `dark.*`; replies left on `light.divFill` in `light.divine`; father word by word.
- [ ] Step 2: App section 600–780: S079 Gideon exchange using the existing `Bubble` from `src/lib/ReaderBits.tsx` inside `Phone`.
- [ ] Step 3: Music `python music/source.py monologue out.wav` (felt piano + pulse, silent 405–525), mp3 at -14 LUFS.
- [ ] Step 4: Stills at frames 0, 80, 180, 240, 330, 500, 560, 700, 840; check overflow and safe box. Render `out/SourceMonologue.mp4`; ffprobe 30.0 s. Commit.

### Task 3: Film 2, The Whole Story

**Files:** Create `src/source/WholeStoryAd.tsx`, `src/source/Rose.tsx`; track `source-wholestory` in `music/source.py`; Root id `SourceWholeStory`.

- [ ] Step 1: `Rose` draws `MIX` to a canvas: spoke i at angle −90° + 360·i/365, bands narrator→blue→green→red outward, `progress` prop reveals spokes clockwise.
- [ ] Step 2: Beats per spec: verse graphic 0–75, Jeremiah bubble 75–180 (highlights jer4, jer10), question 180–240, rose 240–600 with captions, app 600–780 (Plan "Bible in 1 year" Day 1 then S001 opening), end card.
- [ ] Step 3: Music (drone + arpeggio, instrument per division, bell at 480). Stills, render, ffprobe. Commit.

### Task 4: Film 3, Out Loud

**Files:** Create `scripts/etch.py`, `public/source/art/*.jpg`, `src/source/OutLoudAd.tsx`; track `source-outloud` (SLANE); Root id `SourceOutLoud`.

- [ ] Step 1: `etch.py` fetches by museum id (AIC 13103, AIC 116597, plus Ezra and Paul images from open-access sources), prints with riso shapes, writes `credits.json` (artist, title, date, institution).
- [ ] Step 2: Beats per spec with museum labels from `credits.json`; inks lift into the parts picker at 420–480; app 480–720 using `PartsPicker`/`PartsReader` from `src/advent/screens.tsx` on S019 with names Maya, Josh, Sione, Priya.
- [ ] Step 3: Music, stills, render, ffprobe. Commit.

### Task 5: Copy, docs, delivery

- [ ] Add "Wave three — Back to the source" to `COPY.md` (spec's copy), write `SOURCE.md` (rebuild steps, art credits, NLT note), commit, push, send the three videos.
