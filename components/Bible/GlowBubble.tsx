import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { getColors, getBubbleTextColorSafe } from '@/scripts/getColors';
import { BibleBlock } from '@/types';
import BibleInlineComponent from './Inline';
import EmojiHandler from '@/components/EmojiHandler';
import { isLeftVoice } from '@/utils/ink';
import { DUR, timing } from '@/constants/Motion';
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
}: BibleBlockProps) => {
  const { source, children } = block;
  const { color = 'black', sourceName = 'Unknown' } = source || {};
  const { isDarkMode, language, sizes } = useSyncAppSettings();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const fills = getColors(color);
  const left = isLeftVoice(color);
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
    opacity.value = withTiming(dimmed ? 0.55 : 1, timing(DUR.quick));
  }, [dimmed, opacity]);

  const bubbleStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const radius = {
    borderRadius: 16,
    borderTopLeftRadius: left ? 5 : 16,
    borderTopRightRadius: left ? 16 : 5,
  };

  return (
    <View style={styles.row}>
      <EmojiHandler block={block} blockIndex={bIndex} hasTail={hasTail} onLongPress={onLongPress}>
        {hasTail && (
          <Text
            accessibilityLabel={localizeVoiceName(sourceName, language)}
            style={[styles.who, { color: ink, textAlign: left ? 'left' : 'right' }]}
          >
            {localizeVoiceName(sourceName, language)}
          </Text>
        )}
        <Animated.View
          style={[
            styles.bubble,
            radius,
            bubbleStyle,
            {
              alignSelf: left ? 'flex-start' : 'flex-end',
              backgroundColor: isDarkMode ? fills.dark : fills.light,
              borderColor: color === 'black' ? palette.hair : ink,
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
        </Animated.View>
      </EmojiHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    position: 'relative',
    width: '100%',
    paddingHorizontal: 14,
  },
  who: {
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 11,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '84%',
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginVertical: 4,
    position: 'relative',
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: {},
    }),
  },
});

export default GlowingBubble;
