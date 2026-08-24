import React, { useMemo } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { inkHex, type ThreadPalette } from '@/constants/Colors';
import type { Ink } from '@/utils/ink';

type ColorCounts = {
  black?: number;
  red?: number;
  green?: number;
  blue?: number;
};

const INKS: Ink[] = ['black', 'red', 'green', 'blue'];

/** Proportional ink strip — story header and onboarding Friends demo. */
export default function StoryColorMix({
  colors,
  palette,
  height = 4,
  style,
}: {
  colors?: ColorCounts | null;
  palette: ThreadPalette;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const parts = useMemo(
    () =>
      INKS.map((ink) => ({ ink, value: colors?.[ink] || 0 })).filter((part) => part.value > 0),
    [colors]
  );

  if (parts.length === 0) return null;

  return (
    <View style={[styles.row, { height, gap: 1 }, style]}>
      {parts.map((part) => (
        <View
          key={part.ink}
          style={{
            flex: part.value,
            height,
            backgroundColor: inkHex(part.ink, palette),
            borderRadius: 1,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 2,
  },
});
