import { Easing } from 'react-native';

export const ANIMATION = {
  duration: {
    fast: 200,
    base: 300,
    medium: 450,
    long: 600,
    longer: 800,
    xlong: 1200,
  },
  easing: {
    in: Easing.in(Easing.quad),
    out: Easing.out(Easing.quad),
    inOut: Easing.inOut(Easing.quad),
    linear: Easing.linear,
  },
} as const;

export type AnimationDurations = typeof ANIMATION.duration;
export type AnimationEasing = typeof ANIMATION.easing;


