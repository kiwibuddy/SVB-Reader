import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { getColors, getBubbleTextColorSafe } from '@/scripts/getColors';
import { BibleBlock } from '@/types';
import BibleInlineComponent from './Inline';
import EmojiHandler from '@/components/EmojiHandler';
import { isLeftVoice } from '@/utils/ink';
import { DUR, STAGGER, timing } from '@/constants/Motion';
import { ThreadColors } from '@/constants/Colors';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { localizeVoiceName } from '@/utils/localize';

interface BibleBlockProps {
  block: BibleBlock;
  bIndex: number;
  hasTail: boolean;
  isGlowing: boolean;
  onLongPress?: (block: BibleBlock, index: number) => void;
  targetVerse?: number;
  targetChapter?: number;
  dimmed?: boolean;
  spokenDimmed?: boolean;
}

const GlowingBubble = ({
  block,
  bIndex,
  hasTail,
  isGlowing,
  onLongPress,
  targetVerse,
  targetChapter,
  dimmed,
  spokenDimmed,
}: BibleBlockProps) => {
  const { source, children } = block;
  const { color = 'black', sourceName = 'Unknown' } = source || {};
  const { isDarkMode, language, sizes } = useSyncAppSettings();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const fills = getColors(color);
  const left = isLeftVoice(color);
  const reduced = useReducedMotion();
  const ink = getBubbleTextColorSafe(color, isDarkMode);
  const bodySize = sizes.body;
  const lineHeight = Math.round(bodySize * 1.45);
  const opacity = useSharedValue(1);

  const isTargetVerse = React.useMemo(() => {
    if (!targetVerse || !targetChapter) return false;
    for (const child of children) {
      if (child.children && Array.isArray(child.children)) {
        for (const leaf of child.children) {
          if (leaf.link && leaf.link.chapter && leaf.link.verse) {
            if (parseInt(leaf.link.chapter, 10) === targetChapter && parseInt(leaf.link.verse, 10) === targetVerse) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }, [children, targetVerse, targetChapter]);

  useEffect(() => {
    const next = spokenDimmed ? 0.35 : dimmed ? 0.55 : 1;
    opacity.value = withTiming(next, timing(DUR.quick));
  }, [dimmed, opacity, spokenDimmed]);

  const wrapStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const delay = reduced ? 0 : Math.min(bIndex, STAGGER.max) * STAGGER.turn;
  const radius = {
    borderRadius: 16,
    borderTopLeftRadius: left ? 5 : 16,
    borderTopRightRadius: left ? 16 : 5,
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(DUR.base).delay(delay)}
      style={[{ alignItems: left ? 'flex-start' : 'flex-end', paddingHorizontal: 14 }, wrapStyle]}
    >
      <EmojiHandler block={block} blockIndex={bIndex} hasTail={hasTail} onLongPress={onLongPress}>
        {hasTail && (
          <Text
            accessibilityLabel={localizeVoiceName(sourceName, language)}
            style={[styles.who, { color: ink, textAlign: left ? 'left' : 'right' }]}
          >
            {localizeVoiceName(sourceName, language)}
          </Text>
        )}
        <View
          style={[
            styles.bubble,
            radius,
            {
              backgroundColor: isDarkMode ? fills.dark : fills.light,
              borderColor: color === 'black' ? palette.hair : ink,
              maxWidth: '84%',
              borderWidth: isTargetVerse || isGlowing ? 2 : StyleSheet.hairlineWidth,
            },
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
        </View>
      </EmojiHandler>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  who: {
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 11,
  },
  bubble: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 2,
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: {},
    }),
  },
});

export default GlowingBubble;
