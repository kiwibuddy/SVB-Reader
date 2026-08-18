import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { DUR, timing } from '@/constants/Motion';
import { hapticSelection } from '@/utils/haptics';
import type { ThreadPalette } from '@/constants/Colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FilterChip({
  label,
  selected,
  onPress,
  palette,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  palette: ThreadPalette;
}) {
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, timing(DUR.instant));
  }, [progress, selected]);

  const chipStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['transparent', palette.ink]),
    borderColor: interpolateColor(progress.value, [0, 1], [palette.hair, palette.ink]),
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        void hapticSelection();
        onPress();
      }}
      style={[styles.chip, chipStyle]}
      hitSlop={8}
    >
      <Text style={[styles.chipText, { color: selected ? palette.bg : palette.mute, fontWeight: selected ? '700' : '400' }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 9, paddingVertical: 4, marginRight: 6 },
  chipText: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase' },
});
