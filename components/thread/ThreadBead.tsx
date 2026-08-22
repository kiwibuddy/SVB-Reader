import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { ThreadPalette } from '@/constants/Colors';
import { DUR, timing } from '@/constants/Motion';

type StoryBeadProps = {
  x: number;
  rowHeight: number;
  done: boolean;
  current?: boolean;
  justCompleted?: boolean;
  palette: ThreadPalette;
  /** Distance from the top of the row to the bead center. Defaults to the row midpoint. */
  anchor?: number;
};

/** Opaque beads so the thread never shows through the middle. Completed = chor blue. */
export function StoryBead({ x, rowHeight, done, current, justCompleted, palette, anchor }: StoryBeadProps) {
  const fill = useSharedValue(justCompleted ? 0 : done ? 1 : 0);
  const size = current ? 15 : 14;
  const top = (anchor ?? rowHeight / 2) - size / 2;

  useEffect(() => {
    if (justCompleted) {
      fill.value = 0;
      fill.value = withTiming(1, timing(DUR.slow));
      return;
    }
    fill.value = withTiming(done ? 1 : 0, timing(DUR.quick));
  }, [done, fill, justCompleted]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.35 + fill.value * 0.65 }],
    opacity: fill.value,
  }));

  return (
    <View
      pointerEvents="none"
      style={[
        styles.bead,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: x - size / 2,
          top,
          backgroundColor: palette.bg,
          borderColor: current ? palette.acc : palette.thread,
          borderWidth: done || justCompleted ? 0 : current ? 2 : 1.5,
          zIndex: 2,
        },
      ]}
    >
      {current && !done && !justCompleted ? (
        <View style={[styles.fill, { backgroundColor: palette.acc, borderRadius: size / 2 }]} />
      ) : null}
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: palette.chor, borderRadius: size / 2 },
          fillStyle,
        ]}
      />
    </View>
  );
}

export function BookBead({
  x,
  rowHeight,
  open,
  palette,
  anchor,
}: {
  x: number;
  rowHeight: number;
  open: boolean;
  palette: ThreadPalette;
  anchor?: number;
}) {
  const size = open ? 14 : 10;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.bead,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: x - size / 2,
          top: (anchor ?? rowHeight / 2) - size / 2,
          backgroundColor: open ? palette.ink : palette.bg,
          borderColor: open ? palette.bg : palette.thread,
          borderWidth: open ? 3 : 1.5,
          zIndex: 2,
        },
      ]}
    />
  );
}

export function ThreadKnot({
  x,
  rowHeight,
  open,
  palette,
  fillColor,
  anchor,
}: {
  x: number;
  rowHeight: number;
  open: boolean;
  palette: ThreadPalette;
  fillColor?: string;
  anchor?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.knot,
        {
          left: x - 6,
          top: (anchor ?? rowHeight / 2) - 6,
          borderColor: palette.thread,
          backgroundColor: open ? fillColor || palette.acc : palette.bg,
          zIndex: 2,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  bead: {
    position: 'absolute',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  knot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1.5,
    transform: [{ rotate: '45deg' }],
  },
});
