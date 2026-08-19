import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { getColors, getBubbleTextColorSafe } from '@/scripts/getColors';
import { BibleBlock } from '@/types';
import BibleInlineComponent from '@/components/Bible/Inline';
import { isLeftVoice } from '@/utils/ink';
import { ThreadColors } from '@/constants/Colors';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { localizeBookName, localizeStoryTitle, localizeVoiceName } from '@/utils/localize';
import { formatTurnCitation } from '@/utils/shareTurn';

type Props = {
  block: BibleBlock;
  index: number;
  segmentId?: string;
  citationBook?: string;
  storyTitle?: string;
  emoji?: string | null;
};

const SavedBubble = ({ block, index, segmentId, citationBook, storyTitle, emoji }: Props) => {
  const { source, children } = block;
  const { color = 'black', sourceName = 'Unknown' } = source || {};
  const { isDarkMode, language, sizes } = useSyncAppSettings();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const fills = getColors(color);
  const left = isLeftVoice(color);
  const ink = getBubbleTextColorSafe(color, isDarkMode);
  const bodySize = Math.max(14, (sizes.body || 16) - 1);
  const lineHeight = Math.round(bodySize * 1.45);
  const turn = formatTurnCitation(segmentId || '', block);
  const bookName = localizeBookName(turn.bookId, citationBook || turn.bookName, language);
  const title = localizeStoryTitle(
    (segmentId || '').match(/S\d+|I\d+/i)?.[0] || segmentId || '',
    storyTitle || turn.storyTitle,
    language
  );
  const passage = turn.verse
    ? `${bookName} ${turn.verse.chapter}:${turn.verse.verse}`
    : turn.passage.replace(turn.bookName, bookName);
  const metaLine = [title, passage].filter(Boolean).join('  ·  ');

  const radius = {
    borderRadius: 16,
    borderTopLeftRadius: left ? 5 : 16,
    borderTopRightRadius: left ? 16 : 5,
  };

  return (
    <View style={styles.row} pointerEvents="none">
      <View style={[styles.stack, { alignSelf: left ? 'flex-start' : 'flex-end' }]}>
        <View style={[styles.bubbleWrap, { alignSelf: left ? 'flex-start' : 'flex-end' }]}>
          {!!emoji && (
            <Text style={[styles.reaction, left ? styles.reactionLeft : styles.reactionRight]}>
              {emoji}
            </Text>
          )}
          <View
            style={[
              styles.bubble,
              radius,
              {
                backgroundColor: isDarkMode ? fills.dark : fills.light,
                borderColor: color === 'black' ? palette.hair : ink,
                borderWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            {(children || []).map((item, i) => {
              if (item.type === 'break' || item.tag === 'b') return null;
              return (
                <BibleInlineComponent
                  key={`${index}-${i}`}
                  iIndex={`${index}-${i}`}
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
        <View style={[styles.meta, { alignItems: left ? 'flex-start' : 'flex-end' }]}>
          <Text
            accessibilityLabel={localizeVoiceName(sourceName, language)}
            style={[styles.who, { color: ink, textAlign: left ? 'left' : 'right' }]}
          >
            {localizeVoiceName(sourceName, language)}
          </Text>
          {!!metaLine && (
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
    width: '100%',
    paddingHorizontal: 4,
  },
  stack: {
    maxWidth: '92%',
  },
  bubbleWrap: {
    position: 'relative',
    maxWidth: '100%',
  },
  reaction: {
    position: 'absolute',
    top: -4,
    fontSize: 22,
    lineHeight: 26,
    zIndex: 2,
  },
  reactionLeft: { left: -6 },
  reactionRight: { right: -6 },
  who: {
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  bubble: {
    maxWidth: '100%',
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 10,
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: {},
    }),
  },
  meta: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  cite: {
    fontSize: 10,
    letterSpacing: 0.4,
    marginTop: 2,
    marginBottom: 2,
  },
});

export default SavedBubble;
