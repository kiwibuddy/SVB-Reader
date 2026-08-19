import { Easing, ReduceMotion } from 'react-native-reanimated';

// iOS-style decelerate. Use for everything unless stated.
export const EASE = Easing.bezier(0.32, 0.72, 0, 1);
export const EASE_IN = Easing.bezier(0.4, 0, 1, 1); // exits only

export const DUR = {
  instant: 120, // pill fill, chevron rotate, tap feedback
  quick: 200, // fades, dimming, chrome hide
  base: 320, // accordion, card enter, sheet
  slow: 560, // thread draw, graphs growing in
  epic: 900, // the year thread on You — first paint only
} as const;

export const STAGGER = {
  row: 28, // thread rows expanding
  bar: 40, // bars in a chart
  turn: 24, // bubbles entering the reader
  max: 8, // never stagger more than this many; the rest arrive together
} as const;

// Critically damped — settles, never bounces.
export const SPRING = { damping: 18, stiffness: 160, mass: 1 } as const;

// Attach to every animation config so the OS setting is honoured for free.
export const RM = { reduceMotion: ReduceMotion.System } as const;

export const timing = (duration: number, easing = EASE) => ({ duration, easing, ...RM });
