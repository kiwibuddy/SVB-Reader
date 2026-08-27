import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  FadeInDown,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { DEPTH_X, ROW_HEIGHT, buildThread } from '@/components/thread/buildThread';
import { DUR, RM, SPRING, STAGGER } from '@/constants/Motion';
import { fillHex, inkHex } from '@/constants/Colors';
import { getColors, getBubbleTextColorSafe } from '@/scripts/getColors';
import BibleInlineComponent from '@/components/Bible/Inline';
import StatRing from '@/components/thread/StatRing';
import StoryHeatmap from '@/components/thread/StoryHeatmap';
import EmojiPicker from '@/components/EmojiPicker';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import { DIVISIONS } from '@/constants/divisions';
import { localizeBookName, localizeStoryTitle, localizeVoiceName, formatCount } from '@/utils/localize';
import { formatReadingMinutes, getSegmentReadingTime } from '@/utils/readingTime';
import { inkLabel, isLeftVoice, roleFill, type Ink } from '@/utils/ink';
import { hapticImpactLight } from '@/utils/haptics';
import type { BibleBlock } from '@/types';
import type { ThreadPalette } from '@/constants/Colors';
import {
  blockText,
  booksForDivision,
  bookNameForId,
  getCastDemo,
  getFriendsSampleBlocks,
  getHabitDemo,
  getLukeKeepBackdrop,
  getLukeVoiceExchange,
  habitCompletedIds,
  type CastDemoData,
} from '@/utils/onboardingDemo';
import { Ionicons } from '@expo/vector-icons';

const spring = (value: number) => withSpring(value, { ...SPRING, ...RM });

const AnimatedPath = Animated.createAnimatedComponent(Path);
const titles = SegmentTitles as Record<string, { title?: string; ref?: string; book?: string[] }>;
const BUBBLE_GAP = 100;
const CREAM = '#F2EAE0';
const BEGINNING_ID = DIVISIONS[0].id;
const GENESIS_BOOK_ID = 'Gen';
const PHASE_HOLD_MS = 1600;
const FRIENDS_HOLD_MS = 900;
const HABIT_TICK_MS = 70;

type DemoProps = {
  active: boolean;
  token: number;
  palette: ThreadPalette;
  isDarkMode: boolean;
  language: string;
  t: (key: string, params?: Record<string, string | number>) => string;
};

function entering(reduced: boolean, delay: number) {
  if (reduced) return undefined;
  return FadeInDown.springify().damping(SPRING.damping).stiffness(SPRING.stiffness).mass(SPRING.mass).delay(delay);
}

function DemoBubble({
  block,
  index,
  reduced,
  isDarkMode,
  language,
  palette,
  glowing,
  staggerMs = BUBBLE_GAP,
}: {
  block: BibleBlock;
  index: number;
  reduced: boolean;
  isDarkMode: boolean;
  language: string;
  palette: ThreadPalette;
  glowing?: boolean;
  staggerMs?: number;
}) {
  const color = block.source?.color || 'black';
  const sourceName = block.source?.sourceName || '';
  const left = isLeftVoice(color);
  const fills = getColors(color);
  const ink = getBubbleTextColorSafe(color, isDarkMode);
  const glow = glowing ? inkHex(color, palette) : undefined;
  const delay = reduced ? 0 : index * staggerMs;
  const radius = {
    borderRadius: 16,
    borderTopLeftRadius: left ? 5 : 16,
    borderTopRightRadius: left ? 16 : 5,
  };

  return (
    <Animated.View
      entering={entering(reduced, delay)}
      style={{ alignItems: left ? 'flex-start' : 'flex-end', width: '100%' }}
    >
      <View style={[styles.bubbleStack, { alignSelf: left ? 'flex-start' : 'flex-end' }]}>
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
              borderColor: glow || (color === 'black' ? palette.hair : ink),
              borderWidth: glowing ? 2 : StyleSheet.hairlineWidth,
            },
            glowing && glow
              ? {
                  shadowColor: glow,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.45,
                  shadowRadius: 6,
                  elevation: isDarkMode ? 6 : 4,
                  ...Platform.select({
                    web: { boxShadow: `0 0 8px ${glow}` },
                    default: {},
                  }),
                }
              : null,
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
      </View>
    </Animated.View>
  );
}

type ShapePhase = 0 | 1 | 2;

export function ShapeDemo({ active, token, palette, language }: DemoProps) {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const progress = useSharedValue(reduced ? 1 : 0);
  const [phase, setPhase] = useState<ShapePhase>(reduced ? 2 : 0);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setPhase(2);
      progress.value = 1;
      return;
    }
    setPhase(0);
    progress.value = 0;
    progress.value = spring(1);
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const advance = (next: ShapePhase) => {
      timer = setTimeout(() => {
        if (cancelled) return;
        setPhase(next);
        progress.value = 0;
        progress.value = spring(1);
        if (next === 0) advance(1);
        else if (next === 1) advance(2);
        else advance(0);
      }, PHASE_HOLD_MS);
    };
    advance(1);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [active, progress, reduced, token]);

  const openDivision = phase >= 1 ? BEGINNING_ID : 0;
  const openBook = phase >= 2 ? GENESIS_BOOK_ID : null;
  const beginningBooks = useMemo(() => booksForDivision(BEGINNING_ID), []);

  const rows = useMemo(() => {
    const list: { key: string; depth: 0 | 1 | 2; height: number; kind: 'division' | 'book' | 'story'; label: string; sub?: string }[] = [];
    const langFr = language.startsWith('fr');
    for (const division of DIVISIONS) {
      list.push({
        key: `d-${division.id}`,
        depth: 0,
        height: ROW_HEIGHT.division,
        kind: 'division',
        label: langFr ? division.titleFr : division.titleEn,
        sub: langFr ? division.booksFr : division.booksEn,
      });
      if (openDivision !== division.id) continue;
      for (const book of beginningBooks) {
        list.push({
          key: `b-${book.id}`,
          depth: 1,
          height: ROW_HEIGHT.book,
          kind: 'book',
          label: localizeBookName(book.id, book.name, language),
          sub: `${book.stories.length}`,
        });
        if (openBook !== book.id) continue;
        for (const id of book.stories) {
          const info = titles[id];
          const minutes = getSegmentReadingTime(id);
          list.push({
            key: id,
            depth: 2,
            height: ROW_HEIGHT.story,
            kind: 'story',
            label: localizeStoryTitle(id, info?.title || id, language),
            sub: [info?.book?.[0], info?.ref, minutes ? formatReadingMinutes(minutes) : '']
              .filter(Boolean)
              .join(' · '),
          });
        }
      }
    }
    return list;
  }, [beginningBooks, language, openBook, openDivision]);

  const thread = useMemo(
    () => buildThread(
      rows.map(({ key, depth, height }) => ({ key, depth, height })),
      { width }
    ),
    [rows, width]
  );

  const pathProps = useAnimatedProps(() => ({
    strokeDashoffset: thread.length * (1 - progress.value),
  }));

  return (
    <View style={styles.fillBleed} pointerEvents="none">
      <View style={[styles.threadClip, { height: '100%' }]}>
        <View style={{ height: thread.height, position: 'relative', minWidth: width }}>
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
            const pad = DEPTH_X[row.depth] + 16;
            return (
              <View key={row.key} style={[styles.storyRow, { height: row.height }]}>
                <View
                  style={[
                    styles.bead,
                    {
                      left: (mark?.x || DEPTH_X[row.depth]) - 4,
                      top: row.height / 2 - 4,
                      borderColor: palette.thread,
                      backgroundColor: palette.bg,
                      borderRadius: row.kind === 'division' ? 2 : 4,
                    },
                  ]}
                />
                <View style={{ paddingLeft: pad, flex: 1, paddingRight: 16 }}>
                  <Text
                    style={[
                      row.kind === 'story' ? styles.storyTitle : styles.divisionTitle,
                      { color: palette.ink },
                    ]}
                    numberOfLines={1}
                  >
                    {row.label}
                    {row.kind === 'book' && row.sub ? (
                      <Text style={[styles.storyRef, { color: palette.mute }]}>{` · ${row.sub}`}</Text>
                    ) : null}
                  </Text>
                  {row.kind !== 'book' && row.sub ? (
                    <Text style={[styles.storyRef, { color: palette.mute }]} numberOfLines={1}>
                      {row.sub}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function VoicesDemo({ active, token, palette, isDarkMode, language }: DemoProps) {
  const reduced = useReducedMotion();
  const blocks = useMemo(() => getLukeVoiceExchange(), []);

  useEffect(() => {
    if (!active || reduced) return;
    const timers = blocks.map((_, index) => setTimeout(() => void hapticImpactLight(), index * BUBBLE_GAP));
    return () => timers.forEach(clearTimeout);
  }, [active, blocks, reduced, token]);

  return (
    <View style={[styles.fillBleed, styles.voicesPad]} pointerEvents="none">
      <View style={styles.exchangeClip}>
        <View style={styles.exchange} key={`voices-${token}`}>
          {blocks.map((block, index) => (
            <DemoBubble
              key={`${token}-${index}`}
              block={block}
              index={reduced || !active ? 0 : index}
              reduced={reduced || !active}
              isDarkMode={isDarkMode}
              language={language}
              palette={palette}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export function FriendsDemo({ active, token, palette, isDarkMode, language, t }: DemoProps) {
  const reduced = useReducedMotion();
  const samples = useMemo(() => getFriendsSampleBlocks(), []);
  const parts = [
    { ink: 'black' as const, label: t('UI.onboarding.narratorLabel'), body: t('UI.onboarding.narratorPartDescription') },
    { ink: 'red' as const, label: t('UI.onboarding.godLabel'), body: t('UI.onboarding.godRoleDescription') },
    { ink: 'green' as const, label: t('UI.onboarding.mainCharactersLabel'), body: t('UI.onboarding.mainCharacterRoleDescription') },
    { ink: 'blue' as const, label: t('UI.onboarding.everyoneElseLabel'), body: t('UI.onboarding.otherVoicesRoleDescription') },
  ];
  const [selected, setSelected] = useState(reduced ? 0 : -1);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setSelected(0);
      return;
    }
    setSelected(-1);
    let i = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      timer = setTimeout(() => {
        if (cancelled) return;
        setSelected(i % parts.length);
        void hapticImpactLight();
        i += 1;
        tick();
      }, i === 0 ? 200 : FRIENDS_HOLD_MS);
    };
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [active, reduced, token, parts.length]);

  return (
    <View style={[styles.fillBleed, styles.partsPad]} pointerEvents="none">
      <Text style={[styles.friendsHint, { color: palette.mute }]}>{t('UI.onboarding.friendsRoleHint')}</Text>
      <View style={styles.partsStack}>
        {parts.map((item, index) => {
          const on = selected === index;
          const sample = samples[item.ink];
          const glow = on ? inkHex(item.ink, palette) : undefined;
          const fills = getColors(item.ink);
          return (
            <Animated.View
              key={`${token}-part-${item.ink}`}
              entering={entering(reduced || !active, reduced ? 0 : STAGGER.bar * 2 * index)}
              style={[
                styles.partRow,
                on && { transform: [{ scale: 1.02 }] },
              ]}
            >
              <View
                style={[
                  styles.partBox,
                  {
                    backgroundColor: fillHex(item.ink, palette),
                    borderColor: glow || inkHex(item.ink, palette),
                    borderWidth: on ? 2.5 : 1.5,
                  },
                  on && glow
                    ? {
                        shadowColor: glow,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 8,
                        elevation: 6,
                      }
                    : null,
                ]}
              />
              <View style={styles.partText}>
                <Text style={[styles.partLabel, { color: palette.ink }]}>{item.label}</Text>
                <View
                  style={[
                    styles.partDescBubble,
                    {
                      backgroundColor: isDarkMode ? fills.dark : fills.light,
                      borderColor: glow || (item.ink === 'black' ? palette.hair : inkHex(item.ink, palette)),
                      borderWidth: on ? 2 : StyleSheet.hairlineWidth,
                    },
                    on && glow
                      ? {
                          shadowColor: glow,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.45,
                          shadowRadius: 6,
                          elevation: isDarkMode ? 6 : 4,
                        }
                      : null,
                  ]}
                >
                  <Text style={[styles.partBody, { color: getBubbleTextColorSafe(item.ink, isDarkMode) }]}>
                    {item.body}
                  </Text>
                  {sample ? (
                    <Text
                      style={[styles.partSample, { color: getBubbleTextColorSafe(item.ink, isDarkMode) }]}
                      numberOfLines={2}
                    >
                      {`“${blockText(sample).replace(/^["“]|["”]$/g, '').slice(0, 70)}”`}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

export function HabitDemo({ active, token, palette, isDarkMode, language, t }: DemoProps) {
  const reduced = useReducedMotion();
  const demo = useMemo(() => getHabitDemo(), []);
  const [storiesDone, setStoriesDone] = useState(reduced ? demo.storiesDone : demo.startStories);
  const [voicesMet, setVoicesMet] = useState(reduced ? demo.voicesMet : demo.startVoices);
  const [streakDays, setStreakDays] = useState(reduced ? demo.streakDays : demo.startStreak);
  const [ringToken, setRingToken] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setStoriesDone(demo.storiesDone);
      setVoicesMet(demo.voicesMet);
      setStreakDays(demo.streakDays);
      setRingToken((n) => n + 1);
      return;
    }
    setStoriesDone(demo.startStories);
    setVoicesMet(demo.startVoices);
    setStreakDays(demo.startStreak);
    setRingToken((n) => n + 1);
    let stories = demo.startStories;
    let voices = demo.startVoices;
    let streak = demo.startStreak;
    const steps = 28;
    const ds = (demo.storiesDone - demo.startStories) / steps;
    const dv = (demo.voicesMet - demo.startVoices) / steps;
    const dst = (demo.streakDays - demo.startStreak) / steps;
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      stories = Math.min(demo.storiesDone, Math.round(demo.startStories + ds * step));
      voices = Math.min(demo.voicesMet, Math.round(demo.startVoices + dv * step));
      streak = Math.min(demo.streakDays, Math.round(demo.startStreak + dst * step));
      setStoriesDone(stories);
      setVoicesMet(voices);
      setStreakDays(streak);
      if (step % 4 === 0) void hapticImpactLight();
      if (step >= steps) {
        clearInterval(timer);
        setStoriesDone(demo.storiesDone);
        setVoicesMet(demo.voicesMet);
        setStreakDays(demo.streakDays);
        setRingToken((n) => n + 1);
      }
    }, HABIT_TICK_MS);
    return () => clearInterval(timer);
  }, [active, demo, reduced, token]);

  const completedIds = useMemo(() => habitCompletedIds(storiesDone), [storiesDone]);

  return (
    <View style={[styles.fillBleed, styles.habitPad]} pointerEvents="none">
      <View style={styles.habitHeat}>
        <StoryHeatmap
          completedIds={completedIds}
          currentId={null}
          isDarkMode={isDarkMode}
          language={language}
        />
      </View>
      <View style={styles.habitRings}>
        <StatRing
          size={72}
          strokeWidth={6}
          progress={storiesDone / 365}
          centerPrimary={String(storiesDone)}
          centerSecondary="/ 365"
          trackColor={palette.hair}
          accentColor={palette.acc}
          centerPrimaryColor={palette.ink}
          centerSecondaryColor={palette.mute}
          label={t('UI.thread.stories')}
          replayToken={active ? token + ringToken : 0}
        />
        <StatRing
          size={72}
          strokeWidth={6}
          progress={voicesMet / 774}
          centerPrimary={String(voicesMet)}
          centerSecondary="/ 774"
          trackColor={palette.hair}
          accentColor={palette.chor}
          centerPrimaryColor={palette.ink}
          centerSecondaryColor={palette.mute}
          label={t('UI.thread.voicesMet')}
          replayToken={active ? token + ringToken + 1 : 0}
        />
        <StatRing
          size={72}
          strokeWidth={6}
          progress={Math.min(streakDays / 30, 1)}
          centerPrimary={String(streakDays)}
          centerSecondary={t('UI.thread.dayStreak')}
          trackColor={palette.hair}
          accentColor={palette.acc}
          centerPrimaryColor={palette.ink}
          centerSecondaryColor={palette.mute}
          label={t('UI.thread.streak')}
          replayToken={active ? token + ringToken + 2 : 0}
        />
      </View>
    </View>
  );
}

function CastCardFace({
  demo,
  language,
  t,
  style,
}: {
  demo: CastDemoData;
  language: string;
  t: DemoProps['t'];
  style?: object;
}) {
  const lang = language.startsWith('fr') ? 'fr' : 'en';
  const field = roleFill(demo.color);
  const rankLabel = `${inkLabel(demo.color as Ink, lang)} · ${String(demo.rank).padStart(3, '0')} ${t('UI.thread.of')} ${demo.total}`;
  const nameSize = demo.name.length > 14 ? 34 : 44;
  const present = demo.timeline.filter((seg) => seg.lit);

  return (
    <View style={[styles.castCard, { backgroundColor: field }, style]}>
      <ScrollView
        pointerEvents="none"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.castPad}
      >
        <Text style={[styles.castRank, { color: CREAM }]} numberOfLines={1}>
          {rankLabel}
        </Text>
        <Text
          style={[
            styles.castName,
            {
              color: CREAM,
              fontSize: nameSize,
              lineHeight: Math.round(nameSize * 1.18),
              paddingTop: Platform.OS === 'ios' ? 2 : 0,
            },
          ]}
          numberOfLines={1}
        >
          {localizeVoiceName(demo.name, language)}
        </Text>
        <Text style={[styles.castSentence, { color: CREAM }]}>
          {t('UI.thread.castSentence', {
            words: formatCount(demo.words),
            turns: formatCount(demo.turns),
            stories: demo.storyCount,
          })}
        </Text>
        {demo.bookIds.length > 0 ? (
          <View style={styles.books}>
            {demo.bookIds.map((id) => (
              <Text key={id} style={[styles.bookChip, { color: CREAM, borderColor: 'rgba(242,234,224,0.35)' }]}>
                {localizeBookName(id, bookNameForId(id), language).toUpperCase()}
              </Text>
            ))}
          </View>
        ) : null}

        <Text style={[styles.castRank, { color: CREAM, marginTop: 14 }]}>{t('UI.thread.castTimeline')}</Text>
        <View style={styles.timeline}>
          {demo.timeline.map((seg) => (
            <View
              key={seg.key}
              style={[
                styles.timelineSeg,
                {
                  flexGrow: seg.weight,
                  backgroundColor: seg.lit ? CREAM : 'rgba(242,234,224,0.22)',
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.ribLabels}>
          <Text style={[styles.ribLab, { color: CREAM }]}>{t('UI.thread.beginning')}</Text>
          <Text style={[styles.ribLab, { color: CREAM }]}>{t('UI.thread.end')}</Text>
        </View>
        {present.length > 0 ? (
          <Text style={[styles.timelineNames, { color: CREAM }]}>
            {present.map((seg) => (lang === 'fr' ? seg.titleFr : seg.titleEn)).join('  ·  ')}
          </Text>
        ) : null}

        <Text style={[styles.castRank, { color: CREAM, marginTop: 14 }]}>{t('UI.thread.spokeWith')}</Text>
        {demo.partners.map((partner) => (
          <View key={partner.name} style={styles.spokeRow}>
            <View
              style={[
                styles.spokeIcon,
                { backgroundColor: roleFill(partner.color), borderColor: CREAM },
              ]}
            >
              <Ionicons name="person" size={12} color={CREAM} />
            </View>
            <Text style={[styles.spokeName, { color: CREAM }]} numberOfLines={1}>
              {localizeVoiceName(partner.name, language)}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.round(partner.bar * 100)}%`, backgroundColor: CREAM }]} />
            </View>
            <Text style={[styles.spokeCount, { color: CREAM }]}>{partner.count}</Text>
          </View>
        ))}

        {demo.longestSpeech ? (
          <View style={styles.pullBlock}>
            <Text style={[styles.spokeKicker, { color: CREAM }]}>{t('UI.thread.longestSpeech')}</Text>
            <Text style={[styles.pullBody, { color: CREAM }]}>
              {formatCount(demo.longestSpeech.words)} {t('UI.thread.words').toLowerCase()}
            </Text>
            <Text style={[styles.pullStory, { color: CREAM }]}>
              {localizeStoryTitle(demo.longestSpeech.storyId, demo.longestSpeech.storyTitle, language)}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

export function CastDemo({ active, token, language, t }: DemoProps) {
  const reduced = useReducedMotion();
  const jesus = useMemo(() => getCastDemo('Jesus'), []);
  const samuel = useMemo(() => getCastDemo('Samuel'), []);
  const david = useMemo(() => getCastDemo('David'), []);
  const fan = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      fan.value = 1;
      return;
    }
    fan.value = 0;
    fan.value = withDelay(80, spring(1));
    const timer = setTimeout(() => void hapticImpactLight(), DUR.base);
    return () => clearTimeout(timer);
  }, [active, fan, reduced, token]);

  const leftStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + fan.value * 0.35,
    transform: [
      { translateX: -36 * fan.value },
      { translateY: 28 * fan.value },
      { rotate: `${-9 * fan.value}deg` },
      { scale: 0.9 + fan.value * 0.02 },
    ],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + fan.value * 0.35,
    transform: [
      { translateX: 36 * fan.value },
      { translateY: 28 * fan.value },
      { rotate: `${9 * fan.value}deg` },
      { scale: 0.9 + fan.value * 0.02 },
    ],
  }));
  const topStyle = useAnimatedStyle(() => ({
    opacity: fan.value,
    transform: [{ translateY: (1 - fan.value) * 20 }, { scale: 0.96 + fan.value * 0.04 }],
  }));

  if (!jesus || !samuel || !david) return null;

  return (
    <View style={[styles.fillBleed, styles.fanStage]} pointerEvents="none">
      <Animated.View style={[styles.fanCard, styles.fanBack, leftStyle]}>
        <CastCardFace demo={jesus} language={language} t={t} />
      </Animated.View>
      <Animated.View style={[styles.fanCard, styles.fanBack, rightStyle]}>
        <CastCardFace demo={samuel} language={language} t={t} />
      </Animated.View>
      <Animated.View style={[styles.fanCard, styles.fanFront, topStyle]}>
        <CastCardFace demo={david} language={language} t={t} />
      </Animated.View>
    </View>
  );
}

export function KeepDemo({ active, token, palette, isDarkMode, language }: DemoProps) {
  const reduced = useReducedMotion();
  const blocks = useMemo(() => getLukeKeepBackdrop(), []);
  const pop = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      pop.value = 1;
      return;
    }
    pop.value = 0;
    pop.value = withDelay(DUR.quick, spring(1));
    const timer = setTimeout(() => void hapticImpactLight(), DUR.base);
    return () => clearTimeout(timer);
  }, [active, pop, reduced, token]);

  const popStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: 0.92 + pop.value * 0.08 }, { translateY: (1 - pop.value) * 12 }],
  }));

  if (!blocks.length) return null;

  return (
    <View style={[styles.fillBleed, styles.keepPad]} pointerEvents="none">
      <View style={styles.keepBackdrop}>
        {blocks.map((block, index) => (
          <DemoBubble
            key={`${token}-keep-${index}`}
            block={block}
            index={0}
            reduced
            isDarkMode={isDarkMode}
            language={language}
            palette={palette}
          />
        ))}
      </View>
      <Animated.View style={[styles.keepModalWrap, popStyle]}>
        <EmojiPicker
          onEmojiSelect={() => {}}
          onNoteSelect={() => {}}
          onShare={() => {}}
          onCopy={() => {}}
          onClose={() => {}}
          position={{ x: 0, y: 0 }}
          existingEmoji="🙏"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fillBleed: { flex: 1, width: '100%' },
  threadClip: { overflow: 'hidden', paddingTop: 8 },
  voicesPad: { paddingHorizontal: 16, paddingTop: 4 },
  exchangeClip: { flex: 1, overflow: 'hidden' },
  exchange: { gap: 8, paddingBottom: 8 },
  partsPad: { paddingHorizontal: 20, justifyContent: 'center', gap: 12 },
  friendsHint: { fontSize: 13, lineHeight: 18, paddingHorizontal: 4 },
  partsStack: { gap: 12 },
  partRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  partBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderTopLeftRadius: 4,
    borderWidth: 1.5,
    marginTop: 2,
  },
  partText: { flex: 1, gap: 4 },
  partLabel: { fontSize: 15, fontWeight: '600' },
  partDescBubble: {
    borderRadius: 14,
    borderTopLeftRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 4,
  },
  partBody: { fontSize: 12, lineHeight: 16 },
  partSample: { fontSize: 12, lineHeight: 16, fontStyle: 'italic', opacity: 0.92 },
  habitPad: { paddingTop: 4, justifyContent: 'flex-end', paddingBottom: 8 },
  habitHeat: { flex: 1, overflow: 'hidden', minHeight: 0 },
  habitRings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  fanStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fanCard: {
    position: 'absolute',
    width: '94%',
    maxWidth: 420,
    top: '4%',
    bottom: '4%',
  },
  fanBack: { zIndex: 1 },
  fanFront: { zIndex: 3 },
  castCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  castPad: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  castRank: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.85 },
  castName: {
    fontWeight: '600',
    letterSpacing: -1,
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    ...Platform.select({ android: { includeFontPadding: false }, default: {} }),
  },
  castSentence: { fontSize: 13, lineHeight: 18, marginTop: 8, opacity: 0.92 },
  books: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  bookChip: {
    fontSize: 9,
    letterSpacing: 0.8,
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  timeline: {
    flexDirection: 'row',
    height: 10,
    gap: 2,
    marginTop: 8,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timelineSeg: { minWidth: 4, borderRadius: 2 },
  ribLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  ribLab: { fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.7 },
  timelineNames: { fontSize: 11, lineHeight: 15, marginTop: 4, opacity: 0.88 },
  spokeBlock: { marginTop: 14, gap: 8 },
  spokeKicker: { fontSize: 8, letterSpacing: 1.6, textTransform: 'uppercase', opacity: 0.75, marginBottom: 2 },
  spokeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  spokeIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spokeName: { flex: 1, fontSize: 13 },
  barTrack: {
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(242,234,224,0.22)',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 2 },
  spokeCount: { fontSize: 10, opacity: 0.85, fontVariant: ['tabular-nums'], minWidth: 18, textAlign: 'right' },
  pullBlock: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(242,234,224,0.28)',
    gap: 2,
  },
  pullBody: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  pullStory: { fontSize: 12, lineHeight: 16, opacity: 0.85 },
  keepPad: { flex: 1, paddingHorizontal: 12, justifyContent: 'center' },
  keepBackdrop: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.42,
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 6,
    overflow: 'hidden',
  },
  keepModalWrap: {
    position: 'relative',
    width: '92%',
    maxWidth: 320,
    alignSelf: 'center',
    height: 160,
    zIndex: 2,
  },
  storyRow: { flexDirection: 'row', alignItems: 'center' },
  bead: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  divisionTitle: { fontSize: 15, fontWeight: '600' },
  storyTitle: { fontSize: 14, fontWeight: '600' },
  storyRef: { fontSize: 10, letterSpacing: 0.6, marginTop: 2, textTransform: 'uppercase' },
  bubbleStack: { maxWidth: '88%' },
  who: {
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  bubble: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({ web: { boxShadow: 'none' }, default: {} }),
  },
});
