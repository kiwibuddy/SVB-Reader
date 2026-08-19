import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  FadeInDown,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { DEPTH_X, ROW_HEIGHT, buildThread } from '@/components/thread/buildThread';
import { DUR, STAGGER, timing } from '@/constants/Motion';
import { ThreadColors, fillHex, inkHex } from '@/constants/Colors';
import { getColors, getBubbleTextColorSafe } from '@/scripts/getColors';
import BibleInlineComponent from '@/components/Bible/Inline';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import { localizeStoryTitle, localizeVoiceName } from '@/utils/localize';
import { formatReadingMinutes, getSegmentReadingTime } from '@/utils/readingTime';
import { isLeftVoice } from '@/utils/ink';
import type { BibleBlock } from '@/types';
import type { ThreadPalette } from '@/constants/Colors';
import {
  ONBOARDING_STORY_IDS,
  getAbrahamExchange,
  getCallSheetDemo,
  getShareDemoBlock,
} from '@/utils/onboardingDemo';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const titles = SegmentTitles as Record<string, { title?: string; ref?: string; book?: string[] }>;
const BUBBLE_GAP = 280;

type DemoProps = {
  active: boolean;
  token: number;
  palette: ThreadPalette;
  isDarkMode: boolean;
  language: string;
  t: (key: string) => string;
};

function entering(reduced: boolean, delay: number) {
  if (reduced) return undefined;
  return FadeInDown.duration(DUR.base).delay(delay);
}

function DemoBubble({
  block,
  index,
  reduced,
  isDarkMode,
  language,
  palette,
}: {
  block: BibleBlock;
  index: number;
  reduced: boolean;
  isDarkMode: boolean;
  language: string;
  palette: ThreadPalette;
}) {
  const color = block.source?.color || 'black';
  const sourceName = block.source?.sourceName || '';
  const left = isLeftVoice(color);
  const fills = getColors(color);
  const ink = getBubbleTextColorSafe(color, isDarkMode);
  const delay = reduced ? 0 : index * BUBBLE_GAP;
  const radius = {
    borderRadius: 16,
    borderTopLeftRadius: left ? 5 : 16,
    borderTopRightRadius: left ? 16 : 5,
  };

  return (
    <Animated.View
      entering={entering(reduced, delay)}
      style={{ alignItems: left ? 'flex-start' : 'flex-end' }}
    >
      <Text
        accessibilityLabel={localizeVoiceName(sourceName, language)}
        style={[styles.who, { color: ink, textAlign: left ? 'left' : 'right' }]}
      >
        {localizeVoiceName(sourceName, language)}
      </Text>
      <View
        style={[
          styles.bubble,
          radius,
          {
            backgroundColor: isDarkMode ? fills.dark : fills.light,
            borderColor: color === 'black' ? palette.hair : ink,
          },
        ]}
      >
        {(block.children || []).map((item, childIndex) => {
          if (item.type === 'break' || item.tag === 'b') return null;
          return (
            <BibleInlineComponent
              key={`${index}-${childIndex}`}
              iIndex={`${index}-${childIndex}`}
              inline={item}
              textColor={ink}
              bubbleColor={color}
              bodySize={15}
              bodyLineHeight={22}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

export function ShapeDemo({ active, token, palette, language }: DemoProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  const rows = ONBOARDING_STORY_IDS.map((id) => ({
    key: id,
    depth: 2 as const,
    height: ROW_HEIGHT.story,
  }));
  const thread = useMemo(() => buildThread(rows), []);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withTiming(1, timing(DUR.slow));
  }, [active, progress, reduced, token]);

  const pathProps = useAnimatedProps(() => ({
    strokeDashoffset: thread.length * (1 - progress.value),
  }));

  return (
    <View style={[styles.card, { backgroundColor: palette.surf, borderColor: palette.hair }]}>
      <View style={{ height: thread.height, position: 'relative' }}>
        <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height={thread.height}>
          <AnimatedPath
            d={thread.d}
            fill="none"
            stroke={palette.thread}
            strokeWidth={1.5}
            strokeDasharray={thread.length}
            animatedProps={pathProps}
          />
        </Svg>
        {rows.map((row, index) => {
          const mark = thread.marks[index];
          const info = titles[row.key];
          const minutes = getSegmentReadingTime(row.key);
          const title = localizeStoryTitle(row.key, info?.title || row.key, language);
          return (
            <View key={row.key} style={[styles.storyRow, { height: row.height }]}>
              <View
                style={[
                  styles.bead,
                  {
                    left: (mark?.x || DEPTH_X[2]) - 4,
                    borderColor: palette.thread,
                    backgroundColor: palette.bg,
                  },
                ]}
              />
              <View style={{ paddingLeft: DEPTH_X[2] + 16, flex: 1 }}>
                <Text style={[styles.storyTitle, { color: palette.ink }]}>{title}</Text>
                <Text style={[styles.storyRef, { color: palette.mute }]}>
                  {info?.book?.[0]} {info?.ref}
                  {minutes ? ` · ${formatReadingMinutes(minutes)}` : ''}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function VoicesDemo({ active, token, palette, isDarkMode, language, t }: DemoProps) {
  const reduced = useReducedMotion();
  const blocks = useMemo(() => getAbrahamExchange(), []);
  const legend = [
    { ink: 'black', label: t('UI.onboarding.narratorLabel'), body: t('UI.onboarding.narratorRoleDescription') },
    { ink: 'red', label: t('UI.onboarding.godLabel'), body: t('UI.onboarding.godRoleDescription') },
    { ink: 'green', label: t('UI.onboarding.mainCharactersLabel'), body: t('UI.onboarding.mainCharacterRoleDescription') },
    { ink: 'blue', label: t('UI.onboarding.everyoneElseLabel'), body: t('UI.onboarding.otherVoicesRoleDescription') },
  ];

  return (
    <View>
      <View style={styles.exchange}>
        {blocks.map((block, index) => (
          <DemoBubble
            key={`${token}-${index}`}
            block={block}
            index={reduced ? 0 : index}
            reduced={reduced || !active}
            isDarkMode={isDarkMode}
            language={language}
            palette={palette}
          />
        ))}
      </View>
      <View style={{ marginTop: 12, gap: 8 }}>
        {legend.map((item, index) => (
          <Animated.View
            key={`${token}-leg-${item.ink}`}
            entering={entering(
              reduced || !active,
              reduced ? 0 : BUBBLE_GAP * Math.max(blocks.length, 1) + STAGGER.bar * 3 * index
            )}
            style={styles.legendRow}
          >
            <View
              style={[
                styles.swatch,
                {
                  backgroundColor: fillHex(item.ink, palette),
                  borderColor: inkHex(item.ink, palette),
                },
              ]}
            />
            <Text style={[styles.legendLabel, { color: palette.ink }]}>{item.label}</Text>
            <Text style={[styles.legendBody, { color: palette.mute }]}>{item.body}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

export function FriendsDemo({ active, token, palette, language, t }: DemoProps) {
  const reduced = useReducedMotion();
  const demo = useMemo(() => getCallSheetDemo(), []);
  const grow = useSharedValue(reduced ? 1 : 0);
  const names = useSharedValue(reduced ? 1 : 0);
  const title = localizeStoryTitle(demo.storyId, titles[demo.storyId]?.title || demo.storyId, language);
  const mix = [
    { ink: 'black', value: demo.colors.black || 0 },
    { ink: 'red', value: demo.colors.red || 0 },
    { ink: 'green', value: demo.colors.green || 0 },
    { ink: 'blue', value: demo.colors.blue || 0 },
  ].filter((part) => part.value > 0);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      grow.value = 1;
      names.value = 1;
      return;
    }
    grow.value = 0;
    names.value = 0;
    grow.value = withTiming(1, timing(DUR.slow));
    names.value = withDelay(DUR.base, withTiming(1, timing(DUR.quick)));
  }, [active, grow, names, reduced, token]);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: grow.value }],
  }));
  const namesStyle = useAnimatedStyle(() => ({ opacity: names.value }));

  return (
    <View style={[styles.card, { backgroundColor: palette.surf, borderColor: palette.hair }]}>
      <Text style={[styles.callTitle, { color: palette.ink }]}>{title}</Text>
      <Text style={[styles.callMeta, { color: palette.mute }]}>
        {demo.words.toLocaleString()} {t('UI.thread.words').toLowerCase()}
      </Text>
      <Animated.View style={[styles.mix, barStyle, { transformOrigin: 'left' }]}>
        {mix.map((part) => (
          <View key={part.ink} style={{ flex: part.value, backgroundColor: inkHex(part.ink, palette), height: 4 }} />
        ))}
      </Animated.View>
      <Animated.View style={namesStyle}>
        <Text style={[styles.callLine, { color: palette.mute }]}>
          {demo.voices.map((voice) => `${localizeVoiceName(voice.name, language)} ${voice.words}`).join(' · ')}
        </Text>
        <View style={styles.avatars}>
          {mix.map((part) => (
            <View
              key={part.ink}
              pointerEvents="none"
              style={[
                styles.avatar,
                {
                  backgroundColor: fillHex(part.ink, palette),
                  borderColor: inkHex(part.ink, palette),
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.four, { color: palette.mute }]}>{t('UI.onboarding.fourReaders')}</Text>
      </Animated.View>
    </View>
  );
}

export function KeepDemo({ active, token, palette, isDarkMode, language, t }: DemoProps) {
  const reduced = useReducedMotion();
  const block = useMemo(() => getShareDemoBlock(), []);
  if (!block) return null;

  return (
    <View>
      <DemoBubble
        key={token}
        block={block}
        index={0}
        reduced={reduced || !active}
        isDarkMode={isDarkMode}
        language={language}
        palette={palette}
      />
      <Animated.View
        entering={entering(reduced || !active, reduced ? 0 : 120)}
        style={styles.reactions}
      >
        <Text style={styles.emoji}>🙏</Text>
        <Text style={styles.emoji}>❤️</Text>
        <Text style={[styles.note, { color: palette.mute }]}>{t('UI.onboarding.sampleNote')}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 12, overflow: 'hidden' },
  storyRow: { flexDirection: 'row', alignItems: 'center' },
  bead: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    top: ROW_HEIGHT.story / 2 - 4,
  },
  storyTitle: { fontSize: 14, fontWeight: '600' },
  storyRef: { fontSize: 10, letterSpacing: 0.6, marginTop: 2, textTransform: 'uppercase' },
  exchange: { gap: 6 },
  who: {
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  bubble: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    maxWidth: '84%',
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({ web: { boxShadow: 'none' }, default: {} }),
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 13, height: 13, borderRadius: 5, borderTopLeftRadius: 2, borderWidth: 1 },
  legendLabel: { fontSize: 13, fontWeight: '600', minWidth: 108 },
  legendBody: { flex: 1, fontSize: 12 },
  callTitle: { fontSize: 15, fontWeight: '600' },
  callMeta: { fontSize: 11, marginTop: 4 },
  mix: { flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden', gap: 1, marginTop: 10 },
  callLine: { fontSize: 11, marginTop: 12, lineHeight: 16 },
  avatars: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  avatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5 },
  four: { fontSize: 10, textAlign: 'center', marginTop: 9 },
  reactions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingLeft: 4 },
  emoji: { fontSize: 16 },
  note: { fontSize: 13, fontStyle: 'italic', flex: 1 },
});
