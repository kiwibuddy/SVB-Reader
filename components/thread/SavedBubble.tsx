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

const REACTION_EMOJI_SIZE = 22;
const REACTION_LINE_HEIGHT = 26;
const REACTION_TOP_OFFSET = -Math.round(REACTION_LINE_HEIGHT / 2);

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
  const speaker = localizeVoiceName(sourceName, language);
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
        <View style={[styles.meta, { alignItems: left ? 'flex-start' : 'flex-end' }]}>
          <Text
            accessibilityLabel={speaker}
            style={[styles.who, { color: ink, textAlign: left ? 'left' : 'right' }]}
          >
            {speaker}
          </Text>
          {!!metaLine && (
            <Text style={[styles.cite, { color: palette.mute, textAlign: left ? 'left' : 'right' }]}>
              {metaLine}
            </Text>
          )}
        </View>
        <View style={[styles.bubbleWrap, { alignSelf: left ? 'flex-start' : 'flex-end' }]}>
          {!!emoji && (
            <Text
              allowFontScaling={false}
              style={[styles.reaction, left ? styles.reactionRight : styles.reactionLeft]}
            >
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
    maxWidth: '84%',
    overflow: 'visible',
  },
  bubbleWrap: {
    position: 'relative',
    maxWidth: '100%',
    overflow: 'visible',
  },
  reaction: {
    position: 'absolute',
    top: REACTION_TOP_OFFSET,
    fontSize: REACTION_EMOJI_SIZE,
    lineHeight: REACTION_LINE_HEIGHT,
    zIndex: 2,
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: 'center' },
      default: {},
    }),
  },
  reactionLeft: { left: -6 },
  reactionRight: { right: -6 },
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
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  bubble: {
    maxWidth: '100%',
    paddingVertical: 9,
    paddingHorizontal: 12,
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: {},
    }),
  },
});

export default SavedBubble;
