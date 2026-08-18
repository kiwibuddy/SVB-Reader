# Implementation spec — how to build it well

Companion to [`08-BUILD-QUEUE.md`](08-BUILD-QUEUE.md), which says *what* and in
what order. This says *how*, and specifies the motion.

Written for the stack actually on `store-compliance-130`: Reanimated **4.5.1**,
`react-native-worklets` 0.10.1, `react-native-svg` **15.15.4**, `expo-haptics`,
`react-native-gesture-handler` 2.32, expo-router 57.

---

# Part 1 · The motion system

Build this first, before any queue item. Every animation below references these
tokens. Two afternoons here saves a fortnight of inconsistent one-off timings.

## 1.1 Principles

1. **The thread is the protagonist.** It is the thing that moves. Everything
   else fades, settles, or holds still. If two things would animate at once, the
   thread wins and the other fades.
2. **Motion encodes meaning, never decoration.** Growth is progress. Drawing is
   sequence. Dimming is focus. If an animation doesn't say one of those, cut it.
3. **Reading is calm.** No bounce, no overshoot, nothing playful anywhere in the
   reader. Springs are critically damped.
4. **Nothing waits on an animation.** Every transition is interruptible and the
   underlying state changes immediately.
5. **Once per arrival.** Entrance animations play when a screen gains focus, not
   on every re-render.

## 1.2 Tokens

`constants/Motion.ts` — the single source. No literal durations anywhere else.

```ts
import { Easing, ReduceMotion } from 'react-native-reanimated';

// iOS-style decelerate. Use for everything unless stated.
export const EASE = Easing.bezier(0.32, 0.72, 0, 1);
export const EASE_IN = Easing.bezier(0.4, 0, 1, 1);   // exits only

export const DUR = {
  instant: 120,   // pill fill, chevron rotate, tap feedback
  quick:   200,   // fades, dimming, chrome hide
  base:    320,   // accordion, card enter, sheet
  slow:    560,   // thread draw, graphs growing in
  epic:    900,   // the year thread on You — first paint only
} as const;

export const STAGGER = {
  row:   28,      // thread rows expanding
  bar:   40,      // bars in a chart
  turn:  24,      // bubbles entering the reader
  max:   8,       // never stagger more than this many; the rest arrive together
} as const;

// Critically damped — settles, never bounces.
export const SPRING = { damping: 18, stiffness: 160, mass: 1 } as const;

// Attach to every animation config so the OS setting is honoured for free.
export const RM = { reduceMotion: ReduceMotion.System } as const;

export const timing = (duration: number, easing = EASE) =>
  ({ duration, easing, ...RM });
```

## 1.3 Reduced motion

Reanimated ships `useReducedMotion()`; use it rather than reading
`AccessibilityInfo` by hand (`LoadingScreen.tsx` does the manual version — leave
it, but don't copy it).

Passing `...RM` in every config makes Reanimated skip to the end value
automatically. Two things it can't do for you:

- **Looping animations must be cancelled**, not just shortened. The breathing
  halo on the current bead has to be `cancelAnimation()`'d and set static.
- **Staggers must collapse to zero**, or a reduced-motion user waits through
  delays with nothing to look at.

```ts
const reduced = useReducedMotion();
const stagger = reduced ? 0 : STAGGER.row;
```

**Acceptance:** with Reduce Motion on in iOS Settings, every screen still shows
its final state, nothing loops, and no screen takes longer to become usable.

## 1.4 Haptics

`expo-haptics` is already a dependency. The rule: **haptics confirm a state
change the user caused.** Never on scroll, never on arrival, never on anything
the app decided by itself.

| Event | Call |
| --- | --- |
| Pill / filter / accordion tap | `selectionAsync()` |
| Bead or story row tap | `impactAsync(Light)` |
| Story completed | `notificationAsync(Success)` |
| Reaction saved | `impactAsync(Medium)` |
| Reaching a division boundary while scrubbing | `selectionAsync()` |
| Anything else | nothing |

Wrap in `try {} catch {}` — haptics throw on some Android hardware, and
`CheckCircle.tsx` already does this correctly. Copy that pattern.

## 1.5 Performance rules

- **All animation on the UI thread.** Shared values and `useAnimatedStyle` /
  `useAnimatedProps`. If you find yourself in `setState` inside a loop, stop.
- **Never rebuild an SVG path string per frame.** Build `d` once per layout
  change; animate `strokeDashoffset`, which is an animated prop.
- **Thread rows have fixed heights** — 46 for a division, 46 for a book, 44 for
  a story, 58 for the current story. So offsets are arithmetic, no measurement
  pass, no flicker, and `getItemLayout` is trivial if you move to `FlatList`.
- Memoise row components with `React.memo` and stable keys — the thread re-renders
  on every expand.
- `removeClippedSubviews` on the Cast list (774 rows).
- Profile on a real low-end Android before calling any of this done. The 25 MB
  of JSON parsed at startup is still there and will dominate.

---

# Part 2 · The generated thread path

Queue item **B1**. The most important piece of work remaining, and everything
visual depends on it.

## 2.1 Why arithmetic beats `onLayout`

I said earlier to measure with `onLayout`. **Don't** — the row heights are fixed
constants. Computing offsets arithmetically is better on every axis: it is
deterministic, needs no measurement pass, produces no first-paint flicker, and
gives you the path *before* the rows render rather than one frame after.

Use `onLayout` only if a row's height ever becomes dynamic (a wrapping two-line
title, say). If that happens, fix the height instead.

## 2.2 The builder

`components/thread/buildThread.ts`:

```ts
export const DEPTH_X = [30, 52, 74];   // division, book, story
const BOW = 18;                        // vertical control-point offset

export type ThreadRow = { key: string; depth: 0 | 1 | 2; height: number };

export function buildThread(rows: ThreadRow[]) {
  let y = 0;
  const marks = rows.map((r) => {
    const mark = { key: r.key, x: DEPTH_X[r.depth], y: y + r.height / 2 };
    y += r.height;
    return mark;
  });
  if (!marks.length) return { d: '', length: 0, marks, height: 0 };

  let d = `M ${marks[0].x} 0`;
  let length = marks[0].y;
  let prev = { x: marks[0].x, y: 0 };

  for (const m of marks) {
    if (m.x === prev.x) {
      d += ` L ${m.x} ${m.y}`;
      length += Math.abs(m.y - prev.y);
    } else {
      // S-bow between depths: control points pull vertically, so the line
      // eases sideways instead of turning a corner.
      d += ` C ${prev.x} ${prev.y + BOW} ${m.x} ${m.y - BOW} ${m.x} ${m.y}`;
      length += Math.hypot(m.x - prev.x, m.y - prev.y) * 1.08; // chord + 8%
    }
    prev = m;
  }
  d += ` L ${prev.x} ${y}`;
  length += Math.abs(y - prev.y);

  return { d, length, marks, height: y };
}
```

Three things fall out of this for free, and they are why it's worth doing
properly:

1. **`marks`** gives every bead its exact position — no more hand-written `left`
   and `top` on each row.
2. **`length`** is what the draw animation needs. Because you built the path you
   know its length; `getTotalLength()` is unnecessary.
3. **`height`** sizes the `<Svg>` so it never clips and never runs to a fixed
   1200px.

The indent then covers **the whole set**, at any depth, for any expansion state —
which is B2 solved as a side effect.

## 2.3 Drawing it

```tsx
const AnimatedPath = Animated.createAnimatedComponent(Path);

const { d, length, marks, height } = useMemo(() => buildThread(rows), [rows]);
const progress = useSharedValue(0);
const prevLength = useSharedValue(0);

// On expand/collapse: jump to the fraction already drawn, then draw the delta.
useEffect(() => {
  const from = prevLength.value > 0 ? Math.min(prevLength.value / length, 1) : 0;
  progress.value = from;
  progress.value = withTiming(1, timing(DUR.slow));
  prevLength.value = length;
}, [length]);

const pathProps = useAnimatedProps(() => ({
  strokeDashoffset: length * (1 - progress.value),
}));

<Svg width="100%" height={height} pointerEvents="none">
  <AnimatedPath
    d={d}
    stroke={palette.thread}
    strokeWidth={1.5}
    fill="none"
    strokeDasharray={length}
    animatedProps={pathProps}
  />
</Svg>
```

**The detail that makes it feel right:** seeding `progress` with the already-drawn
fraction means opening a division draws *only the new segment*, growing downward
from where the line already was. Animating from zero would redraw the whole
canon every tap, which looks like a loading state.

## 2.4 Beads mask the line

Queue **B3**. React Native has no `box-shadow` — use a ring view, or a second
SVG circle in the background colour beneath each bead.

```ts
bead: {
  position: 'absolute', width: 8, height: 8, borderRadius: 4,
  borderWidth: 3, borderColor: palette.bg,   // the mask
},
```

Size the bead 8px with a 3px border so the hit target stays honest; add a
transparent `hitSlop` of 12 rather than growing the dot.

---

# Part 3 · Per-item implementation notes

## A · Quick wins

**A1 · Pills.** Add `alignItems: 'flex-start'` to the `contentContainerStyle`,
and `flexGrow: 0` on the `ScrollView` itself so it never claims vertical space.
While you're there: the selected state must change **only** `backgroundColor`,
`borderColor` and `fontWeight`. Never padding, font size or radius — that's what
made them "go out of shape". Animate the fill with
`withTiming(DUR.instant)` on a shared value driving `backgroundColor` via
`interpolateColor`.

**A2 · Routes.** `CheckCircle.tsx:160,172` → `/(tabs)/plan`; `:183` →
`/(tabs)/index`. Then **delete `app/(tabs)/Navigation.tsx`** — leaving the old
story finder registered is how this recurs.

**A4 · Plan route.** Moving `app/plan/[id].tsx` into `app/(tabs)/plan/[id].tsx`
changes its URL. Grep for `/plan/` pushes and update them, and check deep links.

**A5 · Plan resolution.** The bug is filtering. `theGospels` holds 46 segments —
42 stories plus 4 book intros. Filter on `id.startsWith('S')` to drop intros and
you get 42; anything else is wrong. Render all three plans from `plans[]`.

**A6 · Reader inset.** `contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}`
using `useSafeAreaInsets()`. 88 = button height + breathing room.

## B · Structural — see Part 2

**B4 · Continue card.** Enters with `FadeIn.duration(DUR.base)` +
`SlideInDown.springify()`. On scroll it should translate up and fade using the
scroll offset, not a threshold — thresholds feel like a glitch:

```ts
const y = useSharedValue(0);
const onScroll = useAnimatedScrollHandler((e) => { y.value = e.contentOffset.y; });
const cardStyle = useAnimatedStyle(() => ({
  opacity:   interpolate(y.value, [0, 60], [1, 0], Extrapolation.CLAMP),
  transform: [{ translateY: interpolate(y.value, [0, 60], [0, -20], Extrapolation.CLAMP) }],
}));
```

Search stays pinned — put it outside the scroll container, not inside it.

## C · The reader

**C1–C3 · Bubbles.** `max-width: 84%`, body 15–16px at Medium honouring
`FontSizeContext`, line-height 1.45. Corner radius 16 everywhere, **5 on the
corner nearest the gutter** — that replaces the tail. Delete the tail views
entirely rather than hiding them.

**Turn entrance.** On first render of a story, bubbles fade and rise 8px,
staggered by `STAGGER.turn`, **capped at `STAGGER.max`** — a 60-turn story must
not take a second and a half to appear. Everything past the cap arrives with the
eighth.

```tsx
<Animated.View entering={FadeInDown.duration(DUR.base).delay(Math.min(i, STAGGER.max) * STAGGER.turn)}>
```

**C4 · Gutter thread.** Same builder, one x-depth, 30px gutter. Speaker dots are
`marks` in each speaker's ink. Draw it once on story open at `DUR.base` — slower
than that and it competes with the text.

**C7 · Call sheet.** Collapsed it's the mix bar; expanded it lists the cast.
Animate with `LinearTransition.duration(DUR.base)` on the container — do **not**
animate `height` manually. Chevron rotates 180° over `DUR.instant`.

**C8 · The swatches.** Remove the heading. Inside the call sheet they become
part of the cast list rather than a step. Selecting one dims the *other* inks to
0.55 over `DUR.quick` — the selected ink doesn't brighten, the others recede.
That reads as focus rather than as a mode.

**Read-aloud mode.** Chrome fades out over `DUR.quick`; text reflows under
`LinearTransition`; non-current turns dim to 0.35. Don't try to animate
`fontSize` — it isn't animatable on `Text`. Change the value and let
`LinearTransition` carry the reflow.

## D · Search

**D1 · Reference lookup.** `verseIndex.json` is 6.6 MB and 24,935 entries. **Do
not `import` it into the bundle** — that parses the whole thing at startup on a
screen that may never be used. Load it lazily on first reference-shaped query
and cache in a module-level variable, or better, move it into the existing
SQLite layer with an index on `(book, chapter, verse)` and drop the JSON from the
binary.

Parse → `${bookName}-${chapter}-${verse}` → lookup → the entry gives
`segmentId`, `blockIndex`, `position`. Navigate to the story and scroll to
`position` — arriving at the exact verse rather than the top of the story is the
difference between a feature and a trick.

**Debounce input at 180ms.** Below that you re-run 774-row filters per keystroke.

**D3 · Expandable rows.** Same accordion mechanics as B2 — `LinearTransition` on
the container, rows entering with `FadeIn` and `STAGGER.row`. The voice row's
chevron rotates; a separate tap target on the right opens the Cast card.

## E · Cast

**E1 · Sort.** Sort once, memoised, outside render. Excluding the four narration
sources changes the first screen from "24 Elders" to God, Jesus, Moses, David,
Solomon — check it does.

**E5 · Division buckets.** Ten bars replacing the illegible 365-hairline ribbon.
**Grow on focus**, not on mount:

```tsx
const focused = useIsFocused();          // from expo-router
const grow = useSharedValue(0);
useEffect(() => {
  if (!focused) { grow.value = 0; return; }
  grow.value = withDelay(80, withTiming(1, timing(DUR.slow)));
}, [focused]);

const barStyle = (i: number, target: number) => useAnimatedStyle(() => ({
  height: interpolate(grow.value, [0, 1], [2, target]),
}));
```

Stagger by `STAGGER.bar` per bar. Reset to 0 on blur so it replays on return —
that's the "graphs grow when you get to a page" you asked for, and it applies
identically to the mix bar on the story header, the progress bars on Plan, and
the year thread on You.

**Same pattern, one hook.** Write `useGrowOnFocus()` once and use it in all four
places. Four bespoke implementations is how a design system dies.

**E7 · Conversation navigation.** Exchanges are a horizontal pager —
`react-native-gesture-handler` `Pager`, or a `FlatList` with `pagingEnabled`. The
‹ › buttons drive the same shared value as the swipe, so both feel identical.
Spring with `SPRING` between exchanges. Haptic `selectionAsync()` on each
change. The story title above cross-fades over `DUR.quick`.

## F · Screens

**F1 · Plan detail** reuses `ThreadList` filtered to the plan. Draw the completed
portion in the accent colour — a second `AnimatedPath` over the first, clipped by
its own `strokeDasharray` at the completion fraction. That's one extra element,
not a second component.

**F3 · You — the year thread.** The one place to spend `DUR.epic`. Draw left to
right over 900ms on first focus; the position dot then springs in and its ring
pulses **once**. Not a loop — a loop on a progress indicator reads as buffering.

## G · Finish

**G1 · Onboarding.** The four-colour screen should animate the colours in one at
a time, `STAGGER.bar * 3` apart, with the real passage underneath. It is the one
place a slightly showy animation earns its place, because it's teaching.

---

# Part 4 · Definition of done

Every queue item ships only when all of these hold:

- [ ] Works in **light and dark**, from tokens, no literal colours
- [ ] Works in **English and French** — French strings run ~20% longer, so check
      nothing clips
- [ ] **Reduce Motion on**: final state visible, nothing loops, no added delay
- [ ] Text sizes **Small / Medium / Large** all legible, nothing overlaps
- [ ] Safe areas respected top and bottom — edge-to-edge is mandatory on SDK 57
- [ ] Tap targets ≥ 44×44, using `hitSlop` rather than visual padding
- [ ] Tested on a **real low-end Android**, not only the simulator
- [ ] No animation blocks interaction; every transition is interruptible
- [ ] VoiceOver reaches everything and reads speaker names before speech text

## Screens that need a device pass before release

The reader in a four-ink story (`S008`), the Cast list at 774 rows, the thread
with a division open at the bottom of the canon, and the year thread on first
launch with zero progress — the four places where these mechanics are most
likely to break.
