import React from 'react';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';

interface Props {
  /** Index of this row in the visible list */
  index: number;
  /** Total number of visible rows */
  total: number;
  /** The progress shared value (0→1) from useThreadReveal */
  progress: SharedValue<number>;
  /** Optional children */
  children: React.ReactNode;
}

/**
 * Wraps a thread row so it fades + slides in sync with the line drawing.
 * Each row starts appearing as the line's progress reaches its proportional position.
 */
export function ThreadRevealRow({ index, total, progress, children }: Props) {
  const style = useAnimatedStyle(() => {
    if (total <= 0) return {};
    const threshold = index / Math.max(total, 1);
    const lead = 0.08;
    const span = 0.14;
    const start = Math.max(threshold - lead, 0);
    const end = Math.min(start + span, 1);
    const t = interpolate(progress.value, [start, end], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: t,
      transform: [{ translateX: (1 - t) * -6 }],
    };
  });

  return <Animated.View style={style}>{children}</Animated.View>;
}
