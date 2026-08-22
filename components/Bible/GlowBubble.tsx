import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, type ViewProps } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { getColors, getBubbleTextColorSafe } from '@/scripts/getColors';
import { BibleBlock } from '@/types';
import BibleInlineComponent from './Inline';
import EmojiHandler from '@/components/EmojiHandler';
import { isLeftVoice } from '@/utils/ink';
import { DUR, timing } from '@/constants/Motion';
import { ThreadColors } from '@/constants/Colors';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useSQLiteGlobalContext } from '@/context/SQLiteGlobalContext';
import { localizeBookName, localizeStoryTitle, localizeVoiceName } from '@/utils/localize';
import { formatTurnCitation } from '@/utils/shareTurn';

interface BibleBlockProps {
  block: BibleBlock;
  bIndex: number;
  hasTail: boolean;
  isGlowing: boolean;
  onLongPress?: (block: BibleBlock, index: number) => void;
  /** True for the turn a verse reference resolved to. Drives the arrival pulse. */
  isTarget?: boolean;
  dimmed?: boolean;
  showMeta?: boolean;
  onLayout?: ViewProps['onLayout'];
}

const GlowingBubble = ({
  block,
  bIndex,
  hasTail,
  isGlowing,
  onLongPress,
  isTarget = false,
  dimmed,
  showMeta = false,
  onLayout,
}: BibleBlockProps) => {
  const { source, children } = block;
  const { color = 'black', sourceName = 'Unknown' } = source || {};
  const { isDarkMode, language, sizes } = useSyncAppSettings();
  const { state } = useSQLiteGlobalContext();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const turn = formatTurnCitation(state.segmentId || '', block);
  const speaker = localizeVoiceName(sourceName, language);
  const storyTitle = localizeStoryTitle(
    (state.segmentId || '').match(/S\d+|I\d+/i)?.[0] || state.segmentId || '',
    turn.storyTitle,
    language
  );
  const bookName = localizeBookName(turn.bookId, turn.bookName, language);
  const passage = turn.verse
    ? `${bookName} ${turn.verse.chapter}:${turn.verse.verse}`
    : turn.passage.replace(turn.bookName, bookName);
  const metaLine = [storyTitle, passage].filter(Boolean).join('  ·  ');
  const fills = getColors(color);
  const left = isLeftVoice(color);
  const ink = getBubbleTextColorSafe(color, isDarkMode);
  const bodySize = sizes.body;
  const lineHeight = Math.round(bodySize * 1.45);
  const opacity = useSharedValue(1);
  const baseFill = isDarkMode ? fills.dark : fills.light;
  const baseBorder = color === 'black' ? palette.hair : ink;
  const pulse = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(dimmed ? 0.55 : 1, timing(DUR.quick));
  }, [dimmed, opacity]);

  useEffect(() => {
    if (!isTarget) return;
    pulse.value = withDelay(
      300,
      withSequence(withTiming(1, timing(DUR.base)), withTiming(0, timing(900)))
    );
  }, [isTarget, pulse]);

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    backgroundColor: interpolateColor(pulse.value, [0, 1], [baseFill, palette.find]),
    borderColor: interpolateColor(pulse.value, [0, 1], [baseBorder, palette.acc]),
  }));
  const radius = {
    borderRadius: 16,
    borderTopLeftRadius: left ? 5 : 16,
    borderTopRightRadius: left ? 16 : 5,
  };

  return (
    <View style={styles.row} onLayout={onLayout}>
      <View style={[styles.stack, { alignSelf: left ? 'flex-start' : 'flex-end' }]}>
        <View style={{ alignSelf: left ? 'flex-start' : 'flex-end', maxWidth: '100%' }}>
          <EmojiHandler block={block} blockIndex={bIndex} hasTail={hasTail} onLongPress={onLongPress}>
            <Animated.View
              style={[
                styles.bubble,
                radius,
                bubbleStyle,
                { borderWidth: isGlowing ? 2 : StyleSheet.hairlineWidth },
              ]}
            >
            <View>
              {children.map((item, index) => {
                if (item.type === 'break' || item.tag === 'b') return null;
                return (
                  <BibleInlineComponent
                    key={`${bIndex}-${index}`}
                    iIndex={`${bIndex}-${index}`}
                    inline={item}
                    textColor={ink}
                    bubbleColor={color}
                    bodySize={bodySize}
                    bodyLineHeight={lineHeight}
                  />
                );
              })}
            </View>
          </Animated.View>
        </EmojiHandler>
        </View>
        <View style={[styles.meta, { alignItems: left ? 'flex-start' : 'flex-end' }]}>
          <Text
            accessibilityLabel={speaker}
            style={[styles.who, { color: ink, textAlign: left ? 'left' : 'right' }]}
          >
            {speaker}
          </Text>
          {showMeta && !!metaLine && (
            <Text style={[styles.cite, { color: palette.mute, textAlign: left ? 'left' : 'right' }]}>
              {metaLine}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    position: 'relative',
    width: '100%',
    paddingHorizontal: 14,
  },
  stack: {
    maxWidth: '84%',
  },
  who: {
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  cite: {
    fontSize: 10,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  meta: {
    marginTop: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  bubble: {
    maxWidth: '100%',
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 10,
    position: 'relative',
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: {},
    }),
  },
});

export default GlowingBubble;
