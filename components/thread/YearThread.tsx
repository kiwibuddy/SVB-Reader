import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { DIVISIONS, storyNumber } from '@/constants/divisions';
import { DUR } from '@/constants/Motion';
import { ThreadColors } from '@/constants/Colors';
import { useGrowOnFocus } from '@/hooks/useGrowOnFocus';

interface YearThreadProps {
  completedIds: Set<string>;
  currentId?: string | null;
  isDarkMode: boolean;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

function buildYearSparkline(
  completedIds: Set<string>,
  width: number,
  height: number
) {
  const padX = 4;
  const baseline = height * 0.67;
  const amplitude = height * 0.38;
  const inner = Math.max(width - padX * 2, 1);
  const marks = DIVISIONS.map((division, index) => {
    const total = division.end - division.start + 1;
    let done = 0;
    for (let n = division.start; n <= division.end; n += 1) {
      if (completedIds.has(`S${String(n).padStart(3, '0')}`)) done += 1;
    }
    const x = padX + (index / Math.max(DIVISIONS.length - 1, 1)) * inner;
    const y = baseline - (done / total) * amplitude;
    return { key: division.key, x, y, done, total };
  });

  if (!marks.length) return { d: '', length: 0, marks, height };

  let d = `M ${marks[0].x} ${marks[0].y}`;
  let length = 0;
  for (let i = 1; i < marks.length; i += 1) {
    const prev = marks[i - 1];
    const next = marks[i];
    const dx = (next.x - prev.x) / 3;
    d += ` C ${prev.x + dx} ${prev.y} ${next.x - dx} ${next.y} ${next.x} ${next.y}`;
    length += Math.hypot(next.x - prev.x, next.y - prev.y) * 1.08;
  }
  return { d, length, marks, height };
}

const YearThread: React.FC<YearThreadProps> = ({ completedIds, currentId, isDarkMode }) => {
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const { width } = useWindowDimensions();
  const svgWidth = Math.max(width - 28, 200);
  const svgHeight = 96;
  const grow = useGrowOnFocus(DUR.epic);
  const currentNum = currentId ? storyNumber(currentId) : null;

  const spark = useMemo(
    () => buildYearSparkline(completedIds, svgWidth, svgHeight),
    [completedIds, svgWidth]
  );

  const doneCount = completedIds.size;
  const completion = Math.min(doneCount / 365, 1);

  const trackProps = useAnimatedProps(() => ({
    strokeDashoffset: spark.length * (1 - grow.value),
  }));

  const doneProps = useAnimatedProps(() => ({
    strokeDashoffset: spark.length * (1 - grow.value * completion),
  }));

  const currentMark = currentNum
    ? spark.marks.find((_, index) => {
        const division = DIVISIONS[index];
        return currentNum >= division.start && currentNum <= division.end;
      })
    : spark.marks[0];

  return (
    <View style={styles.wrap}>
      <Svg width={svgWidth} height={svgHeight}>
        <AnimatedPath
          d={spark.d}
          fill="none"
          stroke={palette.hair}
          strokeWidth={2.5}
          strokeDasharray={spark.length}
          animatedProps={trackProps}
        />
        <AnimatedPath
          d={spark.d}
          fill="none"
          stroke={palette.acc}
          strokeWidth={2.5}
          strokeDasharray={spark.length}
          animatedProps={doneProps}
        />
        {currentMark && (
          <Circle cx={currentMark.x} cy={currentMark.y} r={4.5} fill={palette.acc} />
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center' },
});

export default YearThread;
