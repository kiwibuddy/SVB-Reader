import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { SharedValue, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useGrowOnFocus } from '@/hooks/useGrowOnFocus';
import { DUR, timing } from '@/constants/Motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type RingSegment = {
  value: number;
  color: string;
};

type SegmentArcProps = {
  cx: number;
  cy: number;
  radius: number;
  strokeWidth: number;
  circumference: number;
  arcLen: number;
  startOffset: number;
  color: string;
  grow: SharedValue<number>;
  replay: SharedValue<number>;
};

const SegmentArc: React.FC<SegmentArcProps> = ({
  cx,
  cy,
  radius,
  strokeWidth,
  circumference,
  arcLen,
  startOffset,
  color,
  grow,
  replay,
}) => {
  const fraction = arcLen / circumference;
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - grow.value * replay.value * fraction),
  }));

  return (
    <AnimatedCircle
      cx={cx}
      cy={cy}
      r={radius}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeDasharray={`${arcLen} ${circumference - arcLen}`}
      strokeDashoffset={circumference}
      strokeLinecap="butt"
      rotation={90 + (startOffset / circumference) * 360}
      origin={`${cx}, ${cy}`}
      animatedProps={animatedProps}
    />
  );
};

type StatRingProps = {
  size?: number;
  strokeWidth?: number;
  progress?: number;
  segments?: RingSegment[];
  centerPrimary: string;
  centerSecondary?: string;
  trackColor: string;
  accentColor?: string;
  centerPrimaryColor?: string;
  centerSecondaryColor?: string;
  labelColor?: string;
  sublabelColor?: string;
  onPress?: () => void;
  label: string;
  sublabel?: string;
  replayToken?: number;
};

function arcLength(radius: number): number {
  return 2 * Math.PI * radius;
}

const StatRing: React.FC<StatRingProps> = ({
  size = 92,
  strokeWidth = 7,
  progress = 0,
  segments,
  centerPrimary,
  centerSecondary,
  trackColor,
  accentColor,
  centerPrimaryColor = '#101619',
  centerSecondaryColor = '#5E6B70',
  labelColor = '#5E6B70',
  sublabelColor = '#5E6B70',
  onPress,
  label,
  sublabel,
  replayToken = 0,
}) => {
  const grow = useGrowOnFocus(DUR.slow);
  const replay = useSharedValue(0);

  useEffect(() => {
    replay.value = 0;
    replay.value = withTiming(1, timing(DUR.slow));
  }, [replayToken, progress, segments, replay]);

  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = arcLength(radius);
  const rotation = -90;

  const animatedSingle = useAnimatedProps(() => ({
    strokeDashoffset:
      circumference * (1 - grow.value * replay.value * Math.min(Math.max(progress, 0), 1)),
  }));

  const segmentTotal = segments?.reduce((sum, s) => sum + s.value, 0) || 0;
  let segmentOffset = 0;
  const segmentArcs =
    segments && segmentTotal > 0
      ? segments
          .filter((s) => s.value > 0)
          .map((seg, index) => {
            const arcLen = (seg.value / segmentTotal) * circumference;
            const startOffset = segmentOffset;
            segmentOffset += arcLen;
            return (
              <SegmentArc
                key={`${seg.color}-${index}`}
                cx={cx}
                cy={cy}
                radius={radius}
                strokeWidth={strokeWidth}
                circumference={circumference}
                arcLen={arcLen}
                startOffset={startOffset}
                color={seg.color}
                grow={grow}
                replay={replay}
              />
            );
          })
      : null;

  const body = (
    <View style={[styles.wrap, !label && styles.wrapCompact]}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: `${rotation}deg` }] }}>
          <Circle cx={cx} cy={cy} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
          {segmentArcs || (
            <AnimatedCircle
              cx={cx}
              cy={cy}
              r={radius}
              stroke={accentColor || trackColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeLinecap="round"
              animatedProps={animatedSingle}
            />
          )}
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          <Text style={[styles.centerPrimary, { color: centerPrimaryColor }]} numberOfLines={1}>
            {centerPrimary}
          </Text>
          {centerSecondary ? (
            <Text style={[styles.centerSecondary, { color: centerSecondaryColor }]} numberOfLines={1}>
              {centerSecondary}
            </Text>
          ) : null}
        </View>
      </View>
      {label ? (
        <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
      {sublabel && label ? (
        <Text style={[styles.sublabel, { color: sublabelColor }]} numberOfLines={1}>
          {sublabel}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.press} accessibilityRole="button">
        {body}
      </Pressable>
    );
  }
  return body;
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', flex: 1, minWidth: 96 },
  wrapCompact: { flex: 0, minWidth: 0 },
  press: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  centerPrimary: { fontSize: 17, fontWeight: '600', letterSpacing: -0.4, textAlign: 'center' },
  centerSecondary: { fontSize: 10, letterSpacing: 0.2, marginTop: 1, textAlign: 'center', opacity: 0.65 },
  label: {
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 6,
    textAlign: 'center',
    opacity: 0.72,
  },
  sublabel: {
    fontSize: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center',
    opacity: 0.5,
  },
});

export default StatRing;
