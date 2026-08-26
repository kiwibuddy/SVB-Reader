import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import Animated from 'react-native-reanimated';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import { DEPTH_X, ROW_HEIGHT, buildThread } from '@/components/thread/buildThread';
import { StoryBead } from '@/components/thread/ThreadBead';
import { useThreadReveal } from '@/hooks/useThreadReveal';
import { ThreadRevealRow } from '@/components/thread/ThreadRevealRow';
import { ThreadPalette, inkHex } from '@/constants/Colors';
import { ConversationVoice } from '@/types/conversations';
import { localizeStoryTitle, localizeVoiceName, formatCount } from '@/utils/localize';
import { isWrittenVoice, writtenLetterCount } from '@/utils/writtenVoices';
import { formatReadingMinutes, getSegmentReadingTime } from '@/utils/readingTime';
import { openSegment } from '@/utils/openSegment';
import { hapticImpactLight, hapticSelection } from '@/utils/haptics';

const titles = SegmentTitles as Record<string, { title?: string; ref?: string; book?: string[] }>;
const AnimatedPath = Animated.createAnimatedComponent(Path);
const VOICE_ROW = 56;

type Props = {
  voice: ConversationVoice;
  expanded: boolean;
  palette: ThreadPalette;
  language: string;
  storyLabel: (count: number) => string;
  letterLabel: (count: number) => string;
  onToggle: () => void;
};

export function CastVoiceRow({
  voice,
  expanded,
  palette,
  language,
  storyLabel,
  letterLabel,
  onToggle,
}: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const written = isWrittenVoice(voice.name, voice.storyIds);
  const letters = writtenLetterCount(voice.name);
  const count = written ? letters || voice.storyIds.length : voice.storyIds.length;
  const countText = written ? letterLabel(count) : storyLabel(count);
  const name = localizeVoiceName(voice.name, language);
  const ink = inkHex(voice.color, palette);
  const bead = written ? palette.mute : ink;

  const rows = useMemo(
    () =>
      expanded
        ? [
            { key: voice.name, depth: 0 as const, height: VOICE_ROW },
            ...voice.storyIds.map((id) => ({ key: id, depth: 2 as const, height: ROW_HEIGHT.story })),
          ]
        : [],
    [expanded, voice.name, voice.storyIds]
  );
  const thread = useMemo(() => buildThread(rows, { width, exit: 'right' }), [rows, width]);
  const { progress, pathProps } = useThreadReveal(thread.length, { replayOnFocus: false });

  const openCard = () => {
    router.push({ pathname: '/cast/[voice]', params: { voice: voice.name } });
  };

  const openVoiceStory = (id: string) => {
    void hapticImpactLight();
    openSegment(router, id, { voice: voice.name });
  };

  const onRowPress = () => {
    if (voice.storyIds.length <= 1) {
      const id = voice.storyIds[0] || voice.firstStoryId;
      if (id) openVoiceStory(id);
      return;
    }
    void hapticSelection();
    onToggle();
  };

  const header = (
    <Pressable
      onPress={onRowPress}
      style={[styles.header, expanded && styles.headerOpen]}
    >
      {!expanded ? (
        <View
          style={[
            styles.dot,
            written && styles.dotWritten,
            { backgroundColor: bead },
          ]}
        />
      ) : null}
      <View style={[styles.rowBody, expanded && { paddingLeft: DEPTH_X[0] + 16 }]}>
        <Text style={[styles.name, { color: palette.ink }]} numberOfLines={1}>
          {name}
          <Text style={[styles.nameCount, { color: palette.mute }]}>
            {' · '}
            {count} {countText.toLocaleLowerCase()}
          </Text>
        </Text>
        <Text style={[styles.meta, { color: palette.mute }]}>{formatCount(voice.words)} w</Text>
      </View>
      <Pressable
        onPress={openCard}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={name}
        style={[styles.cardRing, { borderColor: ink }]}
      >
        <Ionicons name="person-outline" size={15} color={ink} />
      </Pressable>
    </Pressable>
  );

  if (!expanded) {
    return <View style={[styles.shell, { borderBottomColor: palette.hair }]}>{header}</View>;
  }

  const voiceMark = thread.marks[0];

  return (
    <View style={[styles.threadWrap, { height: thread.height, borderBottomColor: palette.hair }]}>
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height={thread.height}>
        <AnimatedPath
          d={thread.d}
          fill="none"
          stroke={palette.thread}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={thread.length}
          animatedProps={pathProps}
        />
      </Svg>
      {header}
      {voiceMark ? (
        <View
          pointerEvents="none"
          style={[
            styles.voiceBead,
            written && styles.dotWritten,
            {
              left: voiceMark.x - 5,
              top: VOICE_ROW / 2 - 5,
              backgroundColor: bead,
              borderColor: palette.bg,
            },
          ]}
        />
      ) : null}
      {voice.storyIds.map((id, index) => {
        const mark = thread.marks[index + 1];
        if (!mark) return null;
        const info = titles[id];
        const minutes = getSegmentReadingTime(id);
        return (
          <ThreadRevealRow
            key={id}
            index={index + 1}
            total={rows.length}
            progress={progress}
          >
            <Pressable onPress={() => openVoiceStory(id)} style={[styles.storyRow, { height: ROW_HEIGHT.story }]} hitSlop={8}>
              <StoryBead x={mark.x} rowHeight={ROW_HEIGHT.story} done={false} palette={palette} />
              <View style={[styles.storyText, { paddingLeft: DEPTH_X[2] + 16 }]}>
                <Text style={[styles.storyTitle, { color: palette.ink }]} numberOfLines={1}>
                  {localizeStoryTitle(id, info?.title || id, language)}
                </Text>
                <Text style={[styles.storyRef, { color: palette.mute }]} numberOfLines={1}>
                  {info?.book?.[0]} {info?.ref}
                  {minutes ? ` · ${formatReadingMinutes(minutes)}` : ''}
                </Text>
              </View>
            </Pressable>
          </ThreadRevealRow>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  threadWrap: {
    position: 'relative',
    overflow: 'visible',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    zIndex: 1,
  },
  headerOpen: {
    height: VOICE_ROW,
    paddingVertical: 0,
    paddingLeft: 0,
    paddingRight: 14,
    gap: 0,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotWritten: { borderRadius: 2, borderTopLeftRadius: 1 },
  voiceBead: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    zIndex: 2,
  },
  rowBody: { flex: 1 },
  name: { fontSize: 16 },
  nameCount: { fontSize: 14, fontWeight: '400' },
  meta: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  cardRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
    zIndex: 1,
  },
  storyText: { flex: 1, paddingTop: 6, paddingBottom: 2 },
  storyTitle: { fontSize: 14 },
  storyRef: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
});
