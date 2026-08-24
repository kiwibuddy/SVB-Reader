import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { DEPTH_X, ROW_HEIGHT, buildThread } from '@/components/thread/buildThread';
import { DUR, RM, SPRING, STAGGER, timing } from '@/constants/Motion';
import { fillHex, inkHex } from '@/constants/Colors';
import { getColors, getBubbleTextColorSafe } from '@/scripts/getColors';
import BibleInlineComponent from '@/components/Bible/Inline';
import SavedBubble from '@/components/thread/SavedBubble';
import StoryColorMix from '@/components/thread/StoryColorMix';
import StatRing from '@/components/thread/StatRing';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import { localizeStoryTitle, localizeVoiceName, formatCount } from '@/utils/localize';
import { formatReadingMinutes, getSegmentReadingTime } from '@/utils/readingTime';
import { inkLabel, isLeftVoice, roleFill, type Ink } from '@/utils/ink';
import { hapticImpactLight } from '@/utils/haptics';
import { readerSlots } from '@/utils/readerParts';
import type { BibleBlock } from '@/types';
import type { ThreadPalette } from '@/constants/Colors';
import {
  ONBOARDING_STORY_IDS,
  getAbrahamExchange,
  getCallSheetDemo,
  getCastDemo,
  getHabitDemo,
  getKeepDemoItems,
} from '@/utils/onboardingDemo';

const spring = (value: number) => withSpring(value, { ...SPRING, ...RM });

const AnimatedPath = Animated.createAnimatedComponent(Path);
const titles = SegmentTitles as Record<string, { title?: string; ref?: string; book?: string[] }>;
const BUBBLE_GAP = 280;
const CREAM = '#F2EAE0';

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
      </View>
    </Animated.View>
  );
}

export function ShapeDemo({ active, token, palette, language }: DemoProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  const rows = ONBOARDING_STORY_IDS.map((id) => ({
    key: id,
    depth: 0 as const,
    height: ROW_HEIGHT.story,
  }));
  const thread = useMemo(() => buildThread(rows, { width: 280 }), []);
  const beadX = DEPTH_X[0];

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = spring(1);
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
                    left: (mark?.x || beadX) - 4,
                    borderColor: palette.thread,
                    backgroundColor: palette.bg,
                  },
                ]}
              />
              <View style={{ paddingLeft: beadX + 16, flex: 1 }}>
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

  useEffect(() => {
    if (!active || reduced) return;
    const timers = blocks.map((_, index) => setTimeout(() => void hapticImpactLight(), index * BUBBLE_GAP));
    return () => timers.forEach(clearTimeout);
  }, [active, blocks, reduced, token]);

  return (
    <View style={styles.demoStack}>
      <View style={{ gap: 8 }}>
        {legend.map((item, index) => (
          <Animated.View
            key={`${token}-leg-${item.ink}`}
            entering={entering(reduced || !active, reduced ? 0 : STAGGER.bar * 3 * index)}
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
      <View style={[styles.sectionRule, { backgroundColor: palette.hair }]} />
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
    </View>
  );
}

export function FriendsDemo({ active, token, palette, language, t }: DemoProps) {
  const reduced = useReducedMotion();
  const demo = useMemo(() => getCallSheetDemo(), []);
  const grow = useSharedValue(reduced ? 1 : 0);
  const names = useSharedValue(reduced ? 1 : 0);
  const title = localizeStoryTitle(demo.storyId, titles[demo.storyId]?.title || demo.storyId, language);
  const info = titles[demo.storyId];
  const minutes = getSegmentReadingTime(demo.storyId);
  const num = demo.storyId.replace(/^S/i, '');
  const meta = [num, info?.book?.[0] && info?.ref ? `${info.book[0]} ${info.ref}` : '', minutes ? formatReadingMinutes(minutes) : '']
    .filter(Boolean)
    .join(' · ');
  const slots = useMemo(() => readerSlots(demo.readers, demo.colors), [demo.readers, demo.colors]);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      grow.value = 1;
      names.value = 1;
      return;
    }
    grow.value = 0;
    names.value = 0;
    grow.value = spring(1);
    names.value = withDelay(DUR.base, withTiming(1, timing(DUR.quick)));
  }, [active, grow, names, reduced, token]);

  const barStyle = useAnimatedStyle(() => ({
    opacity: grow.value,
    transform: [{ scaleX: grow.value }],
  }));
  const namesStyle = useAnimatedStyle(() => ({ opacity: names.value }));

  return (
    <View style={styles.demoStack}>
      <Text style={[styles.segmentTitle, { color: palette.ink }]}>{title}</Text>
      <Text style={[styles.segmentMeta, { color: palette.mute }]}>{meta}</Text>
      <Animated.View style={[{ transformOrigin: 'left' as const }, barStyle]}>
        <StoryColorMix colors={demo.colors} palette={palette} style={{ marginTop: 10 }} />
      </Animated.View>
      <Text style={[styles.pickPrompt, { color: palette.mute }]}>{t('UI.thread.pickCastPrompt')}</Text>
      <View style={[styles.callWrap, { backgroundColor: palette.surf, borderColor: palette.hair }]}>
        <View style={styles.callTop}>
          <View style={styles.boxes}>
            {slots.map((slot) => (
              <View
                key={slot.index}
                style={[
                  styles.box,
                  {
                    backgroundColor: fillHex(slot.ink, palette),
                    borderColor: inkHex(slot.ink, palette),
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.voiceCount, { color: palette.ink }]}>
            {demo.voices.length} {t('UI.thread.scopeVoices').toUpperCase()}
          </Text>
        </View>
        <Animated.View style={namesStyle}>
          <Text style={[styles.callLine, { color: palette.mute }]}>
            {demo.voices.map((voice) => `${localizeVoiceName(voice.name, language)} ${voice.words}`).join(' · ')}
          </Text>
          <Text style={[styles.four, { color: palette.mute }]}>{t('UI.onboarding.fourReaders')}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

export function HabitDemo({ active, token, palette, t }: DemoProps) {
  const reduced = useReducedMotion();
  const demo = useMemo(() => getHabitDemo(), []);
  const pct = demo.plan.total > 0 ? demo.plan.done / demo.plan.total : 0;

  useEffect(() => {
    if (!active || reduced) return;
    const timer = setTimeout(() => void hapticImpactLight(), DUR.slow);
    return () => clearTimeout(timer);
  }, [active, reduced, token]);

  return (
    <View style={styles.demoStack}>
      <View style={styles.habitRings}>
        <StatRing
          size={72}
          strokeWidth={6}
          progress={demo.storiesDone / 365}
          centerPrimary={String(demo.storiesDone)}
          centerSecondary="/ 365"
          trackColor={palette.hair}
          accentColor={palette.acc}
          centerPrimaryColor={palette.ink}
          centerSecondaryColor={palette.mute}
          label={t('UI.thread.stories')}
          replayToken={active ? token : 0}
        />
        <StatRing
          size={72}
          strokeWidth={6}
          progress={demo.voicesMet / 774}
          centerPrimary={String(demo.voicesMet)}
          centerSecondary="/ 774"
          trackColor={palette.hair}
          accentColor={palette.chor}
          centerPrimaryColor={palette.ink}
          centerSecondaryColor={palette.mute}
          label={t('UI.thread.voicesMet')}
          replayToken={active ? token + 1 : 0}
        />
        <StatRing
          size={72}
          strokeWidth={6}
          progress={Math.min(demo.streakDays / 30, 1)}
          centerPrimary={String(demo.streakDays)}
          centerSecondary={t('UI.thread.dayStreak')}
          trackColor={palette.hair}
          accentColor={palette.acc}
          centerPrimaryColor={palette.ink}
          centerSecondaryColor={palette.mute}
          label={t('UI.thread.streak')}
          replayToken={active ? token + 2 : 0}
        />
      </View>
      <View style={[styles.planCard, { backgroundColor: palette.surf, borderColor: palette.hair }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.callMeta, { color: palette.mute }]}>{t('UI.thread.yourPlan')}</Text>
          <Text style={[styles.callTitle, { color: palette.ink }]}>{demo.plan.title}</Text>
          <Text style={[styles.callMeta, { color: palette.mute }]}>
            {demo.plan.done}/{demo.plan.total} {t('UI.thread.stories').toLowerCase()}
          </Text>
        </View>
        <StatRing
          size={64}
          strokeWidth={5}
          progress={pct}
          centerPrimary={`${Math.round(pct * 100)}%`}
          centerSecondary={`${demo.plan.done}/${demo.plan.total}`}
          trackColor={palette.hair}
          accentColor={palette.acc}
          centerPrimaryColor={palette.ink}
          centerSecondaryColor={palette.mute}
          label=""
          replayToken={active ? token + 3 : 0}
        />
      </View>
      <Animated.View entering={entering(reduced || !active, reduced ? 0 : STAGGER.bar * 4)} style={styles.habitQuestion}>
        <Text style={[styles.kicker, { color: palette.mute }]}>{t('UI.thread.talkAboutIt')}</Text>
        <Text style={[styles.habitQuestionText, { color: palette.ink }]}>{t('UI.onboarding.sampleQuestion')}</Text>
      </Animated.View>
    </View>
  );
}

export function CastDemo({ active, token, palette, language, t }: DemoProps) {
  const reduced = useReducedMotion();
  const demo = useMemo(() => getCastDemo(), []);

  useEffect(() => {
    if (!active || reduced || !demo?.longestSpeech) return;
    const timer = setTimeout(() => void hapticImpactLight(), STAGGER.bar * 4);
    return () => clearTimeout(timer);
  }, [active, demo, reduced, token]);

  if (!demo) return null;
  const field = roleFill(demo.color);
  const lang = language.startsWith('fr') ? 'fr' : 'en';
  const rankLabel = `${inkLabel(demo.color as Ink, lang)} · ${String(demo.rank).padStart(3, '0')} ${t('UI.thread.of')} ${demo.total}`;
  const partnerFill = roleFill(demo.topPartner?.color || 'blue');

  return (
    <View style={[styles.castField, { backgroundColor: field }]}>
      <ScrollView
        pointerEvents="none"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.castPad}
      >
        <Text style={[styles.castRank, { color: CREAM }]}>{rankLabel}</Text>
        <Text style={[styles.castName, { color: CREAM }]}>{localizeVoiceName(demo.name, language)}</Text>
        <Text style={[styles.castSentence, { color: CREAM }]}>
          {t('UI.thread.castSentence', {
            words: formatCount(demo.words),
            turns: formatCount(demo.turns),
            stories: demo.storyCount,
          })}
        </Text>
        {demo.topPartner && (
          <Animated.View
            key={`${token}-partner`}
            entering={entering(reduced || !active, reduced ? 0 : STAGGER.bar * 2)}
            style={styles.castSpoke}
          >
            <Text style={[styles.castKicker, { color: CREAM }]}>{t('UI.thread.spokeWith')}</Text>
            <View style={styles.castSpokeRow}>
              <View style={[styles.castIcon, { backgroundColor: partnerFill, borderColor: CREAM }]}>
                <Ionicons name="person" size={12} color={CREAM} />
              </View>
              <Text style={[styles.castSpokeName, { color: CREAM }]}>
                {localizeVoiceName(demo.topPartner.name, language)}
              </Text>
              <Text style={[styles.castSpokeCount, { color: CREAM }]}>{demo.topPartner.count}</Text>
            </View>
          </Animated.View>
        )}
        {demo.longestSpeech && (
          <Animated.View
            key={`${token}-speech`}
            entering={entering(reduced || !active, reduced ? 0 : STAGGER.bar * 4)}
            style={styles.castPull}
          >
            <Text style={[styles.castKicker, { color: CREAM }]}>{t('UI.thread.longestSpeech')}</Text>
            <Text style={[styles.castPullBody, { color: CREAM }]}>
              {formatCount(demo.longestSpeech.words)} {t('UI.thread.words').toLowerCase()}
            </Text>
            <Text style={[styles.castPullStory, { color: CREAM }]}>
              {localizeStoryTitle(demo.longestSpeech.storyId, demo.longestSpeech.storyTitle, language)}
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

export function KeepDemo({ active, token, palette, t }: DemoProps) {
  const reduced = useReducedMotion();
  const items = useMemo(() => getKeepDemoItems(), []);
  if (!items.length) return null;
  const info = titles[items[0].storyId];

  return (
    <ScrollView
      style={styles.demoStack}
      contentContainerStyle={{ gap: 4, paddingBottom: 8 }}
      showsVerticalScrollIndicator={false}
      pointerEvents="none"
    >
      {items.map((item, index) => (
        <Animated.View
          key={`${token}-keep-${index}`}
          entering={entering(reduced || !active, reduced ? 0 : 80 * index)}
          style={styles.savedCard}
        >
          <SavedBubble
            block={item.block}
            index={index}
            segmentId={item.storyId}
            citationBook={info?.book?.[0]}
            storyTitle={info?.title}
            emoji={item.emoji}
          />
          {item.noteKey ? (
            <Text style={[styles.savedNote, { color: palette.mute, borderTopColor: palette.hair }]}>
              {t(`UI.onboarding.${item.noteKey}`)}
            </Text>
          ) : null}
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 12, overflow: 'hidden' },
  demoStack: { width: '100%' },
  sectionRule: { height: StyleSheet.hairlineWidth, marginVertical: 14, opacity: 0.9 },
  kicker: { fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '600' },
  habitRings: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planCard: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  habitQuestion: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    gap: 4,
  },
  habitQuestionText: { fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
  castField: { flex: 1, borderRadius: 16, overflow: 'hidden', minHeight: 280 },
  castPad: { padding: 16, paddingBottom: 20 },
  castRank: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.85 },
  castName: {
    fontSize: 40,
    fontWeight: '600',
    letterSpacing: -1,
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    ...Platform.select({ android: { includeFontPadding: false }, default: {} }),
  },
  castSentence: { fontSize: 13, lineHeight: 18, marginTop: 8, opacity: 0.92 },
  castKicker: { fontSize: 8, letterSpacing: 1.6, textTransform: 'uppercase', opacity: 0.75, marginBottom: 6 },
  castSpoke: { marginTop: 16 },
  castSpokeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  castIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  castSpokeName: { flex: 1, fontSize: 13 },
  castSpokeCount: { fontSize: 10, opacity: 0.85, fontVariant: ['tabular-nums'] },
  castPull: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(242,234,224,0.28)',
  },
  castPullBody: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  castPullStory: { fontSize: 12, lineHeight: 16, opacity: 0.85, marginTop: 2 },
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
  segmentTitle: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3 },
  segmentMeta: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginTop: 6 },
  pickPrompt: { fontSize: 14, lineHeight: 20, marginTop: 12, marginBottom: 2 },
  callWrap: { borderWidth: 1, borderRadius: 12, marginTop: 8, paddingBottom: 12 },
  callTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  boxes: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  box: {
    width: 42,
    height: 42,
    borderRadius: 11,
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  voiceCount: { fontSize: 12, letterSpacing: 1.1, fontWeight: '700' },
  exchange: { gap: 8 },
  bubbleStack: { maxWidth: '84%' },
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
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 13, height: 13, borderRadius: 5, borderTopLeftRadius: 2, borderWidth: 1 },
  legendLabel: { fontSize: 13, fontWeight: '600', minWidth: 108 },
  legendBody: { flex: 1, fontSize: 12 },
  callTitle: { fontSize: 15, fontWeight: '600' },
  callMeta: { fontSize: 11, marginTop: 4 },
  callLine: { fontSize: 11, marginTop: 4, lineHeight: 16, paddingHorizontal: 14 },
  four: { fontSize: 10, textAlign: 'center', marginTop: 8 },
  savedCard: { paddingBottom: 6 },
  savedNote: {
    marginTop: 8,
    marginHorizontal: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    fontSize: 14,
    lineHeight: 20,
  },
});
