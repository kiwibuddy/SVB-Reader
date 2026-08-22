import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Alert,
} from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import {
  DIVISIONS,
  storiesInDivision,
  type Division,
} from '@/constants/divisions';
import { ThreadColors, type ThreadPalette } from '@/constants/Colors';
import { DUR, timing } from '@/constants/Motion';
import { useGrowOnFocus } from '@/hooks/useGrowOnFocus';
import { openSegment } from '@/utils/openSegment';
import { localizeStoryTitle } from '@/utils/localize';

const titles = SegmentTitles as Record<string, { title?: string; ref?: string }>;

const DOT = 7;
const GAP = 2;
const LABEL_W = 76;
const ROW_PAD = 14;

type StoryDotProps = {
  storyId: string;
  read: boolean;
  isCurrent: boolean;
  grow: SharedValue<number>;
  pulse: SharedValue<number>;
  palette: ThreadPalette;
  onPress: () => void;
};

const StoryDot: React.FC<StoryDotProps> = ({
  storyId,
  read,
  isCurrent,
  grow,
  pulse,
  palette,
  onPress,
}) => {
  const dotStyle = useAnimatedStyle(() => ({
    opacity: read ? 0.35 + grow.value * 0.65 : 0.85,
    transform: [{ scale: read ? 0.85 + grow.value * 0.15 : 1 }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.35 }],
    opacity: 0.35 + pulse.value * 0.45,
  }));

  return (
    <Pressable
      onPress={onPress}
      hitSlop={2}
      accessibilityLabel={titles[storyId]?.title || storyId}
    >
      <Animated.View
        style={[
          styles.dot,
          dotStyle,
          {
            width: DOT,
            height: DOT,
            borderRadius: DOT / 2,
            marginRight: GAP,
            marginBottom: GAP,
            backgroundColor: read ? palette.acc : palette.bg,
            borderColor: read ? palette.acc : palette.thread,
            borderWidth: read ? 0 : StyleSheet.hairlineWidth * 2,
          },
          isCurrent && styles.currentWrap,
        ]}
      >
        {isCurrent ? (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: DOT / 2, backgroundColor: palette.acc },
              pulseStyle,
            ]}
          />
        ) : null}
      </Animated.View>
    </Pressable>
  );
};

type DivisionRowProps = {
  division: Division;
  completedIds: Set<string>;
  currentId?: string | null;
  language: string;
  palette: ThreadPalette;
  dotAreaWidth: number;
  grow: SharedValue<number>;
  pulse: SharedValue<number>;
  rowRef?: (ref: View | null) => void;
};

const DivisionRow: React.FC<DivisionRowProps> = ({
  division,
  completedIds,
  currentId,
  language,
  palette,
  dotAreaWidth,
  grow,
  pulse,
  rowRef,
}) => {
  const router = useRouter();
  const storyIds = storiesInDivision(division);
  let done = 0;
  for (const id of storyIds) {
    if (completedIds.has(id)) done += 1;
  }

  const showStoryPreview = useCallback(
    (storyId: string) => {
      const meta = titles[storyId];
      const title = localizeStoryTitle(storyId, meta?.title || storyId, language);
      const ref = meta?.ref ? ` · ${meta.ref}` : '';
      Alert.alert(title, ref.trim() || storyId);
    },
    [language]
  );

  const label = language.startsWith('fr') ? division.titleFr : division.titleEn;

  return (
    <View ref={rowRef} style={styles.row}>
      <View style={styles.labelCol}>
        <Text style={[styles.label, { color: palette.mute }]} numberOfLines={2}>
          {label}
        </Text>
        <Text style={[styles.count, { color: palette.mute }]}>
          {done}/{storyIds.length}
        </Text>
      </View>
      <View style={[styles.dots, { width: dotAreaWidth }]}>
        {storyIds.map((storyId) => (
          <StoryDot
            key={storyId}
            storyId={storyId}
            read={completedIds.has(storyId)}
            isCurrent={currentId === storyId}
            grow={grow}
            pulse={pulse}
            palette={palette}
            onPress={() => {
              if (completedIds.has(storyId)) openSegment(router, storyId);
              else showStoryPreview(storyId);
            }}
          />
        ))}
      </View>
    </View>
  );
};

type StoryHeatmapProps = {
  completedIds: Set<string>;
  currentId?: string | null;
  isDarkMode: boolean;
  language: string;
  focusDivisionKey?: string | null;
};

const StoryHeatmap: React.FC<StoryHeatmapProps> = ({
  completedIds,
  currentId,
  isDarkMode,
  language,
  focusDivisionKey,
}) => {
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const { width } = useWindowDimensions();
  const grow = useGrowOnFocus(DUR.slow);
  const pulse = useSharedValue(0);
  const rowRefs = useRef<Record<string, View | null>>({});

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, timing(DUR.base)), withTiming(0, timing(DUR.slow))),
      -1,
      false
    );
  }, [pulse]);

  const dotAreaWidth = Math.max(width - LABEL_W - ROW_PAD * 2 - 8, 120);

  return (
    <View style={styles.root}>
      {DIVISIONS.map((division) => (
        <DivisionRow
          key={division.key}
          division={division}
          completedIds={completedIds}
          currentId={currentId}
          language={language}
          palette={palette}
          dotAreaWidth={dotAreaWidth}
          grow={grow}
          pulse={pulse}
          rowRef={(ref) => {
            rowRefs.current[division.key] = ref;
            if (focusDivisionKey === division.key && ref) {
              ref.setNativeProps?.({ opacity: 1 });
            }
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { paddingHorizontal: ROW_PAD, paddingTop: 8, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  labelCol: { width: LABEL_W, paddingRight: 6, paddingTop: 1 },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 0.2, lineHeight: 13 },
  count: { fontSize: 9, letterSpacing: 0.4, marginTop: 2, opacity: 0.75 },
  dots: { flexDirection: 'row', flexWrap: 'wrap' },
  dot: { overflow: 'hidden' },
  currentWrap: { zIndex: 1 },
});

export default StoryHeatmap;
