import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import conversations from '@/assets/data/conversations.json';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import Books from '@/assets/data/BookChapterList.json';
import { ConversationsFile } from '@/types/conversations';
import { inkLabel, roleFill, type Ink } from '@/utils/ink';
import { localizeVoiceName, localizeStoryTitle, localizeBookName, formatCount } from '@/utils/localize';
import { DIVISIONS, storyNumber } from '@/constants/divisions';
import { NARRATION_VOICES } from '@/utils/voicesMet';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useGrowOnFocus } from '@/hooks/useGrowOnFocus';
import { openSegment } from '@/utils/openSegment';
import { hapticImpactLight, hapticSelection } from '@/utils/haptics';

const conv = conversations as ConversationsFile;
const titles = SegmentTitles as Record<string, { title?: string; book?: string[]; ref?: string }>;
const books = Books as Record<string, { bookName: string }>;

function TimelineSeg({
  grow,
  weight,
  lit,
  filled,
  empty,
}: {
  grow: SharedValue<number>;
  weight: number;
  lit: boolean;
  filled: string;
  empty: string;
}) {
  const fade = useAnimatedStyle(() => ({
    opacity: lit ? interpolate(grow.value, [0, 1], [0.2, 1]) : 1,
  }));
  return (
    <Animated.View
      style={[
        styles.seg,
        {
          flexGrow: weight,
          backgroundColor: lit ? filled : empty,
        },
        fade,
      ]}
    />
  );
}

const VoiceCard = () => {
  const { voice } = useLocalSearchParams<{ voice: string }>();
  const name = decodeURIComponent(voice || '');
  const data = conv.voices[name];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useSyncAppSettings();
  const { t } = useTranslation();
  const lang = language.startsWith('fr') ? 'fr' : 'en';
  const grow = useGrowOnFocus();
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);

  const rank = useMemo(() => {
    const sorted = Object.values(conv.voices)
      .filter((item) => !NARRATION_VOICES.has(item.name))
      .sort((a, b) => b.words - a.words);
    return sorted.findIndex((item) => item.name === name) + 1;
  }, [name]);

  const timeline = useMemo(() => {
    if (!data) return [];
    return DIVISIONS.map((division) => {
      const weight = division.end - division.start + 1;
      const hits = data.storyIds.filter((id) => {
        const n = storyNumber(id);
        return n != null && n >= division.start && n <= division.end;
      }).length;
      return { division, weight, lit: hits > 0 };
    });
  }, [data]);

  const partners = useMemo(() => {
    if (!data) return [];
    return data.spokeWith.slice(0, 8).map((partner) => {
      const other = conv.voices[partner.name];
      const shared = other
        ? data.storyIds.filter((id) => other.storyIds.includes(id))
        : [];
      return {
        name: partner.name,
        count: partner.count,
        color: (other?.color || 'blue') as Ink,
        shared,
      };
    });
  }, [data]);

  const bookNames = useMemo(() => {
    if (!data) return [];
    const ids = new Set<string>();
    for (const id of data.storyIds) {
      const bookId = titles[id]?.book?.[0];
      if (bookId) ids.add(bookId);
    }
    return [...ids].map((id) => localizeBookName(id, books[id]?.bookName || id, language));
  }, [data, language]);

  if (!data) {
    return (
      <View style={[styles.missing, { paddingTop: insets.top }]}>
        <Text>Voice not found</Text>
      </View>
    );
  }

  const field = roleFill(data.color);
  const cream = '#F2EAE0';
  const maxPartner = Math.max(...partners.map((partner) => partner.shared.length || partner.count), 1);
  const spokenCount = Object.values(conv.voices).filter((item) => !NARRATION_VOICES.has(item.name)).length;
  const presentDivisions = timeline.filter((item) => item.lit);
  const nameSize = data.name.length > 14 ? 44 : 64;
  const nameLineHeight = Math.round(nameSize * 1.22);

  return (
    <View style={[styles.root, { backgroundColor: field }]}>
      <Pressable
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/cast');
        }}
        accessibilityRole="button"
        accessibilityLabel={t('UI.thread.back')}
        hitSlop={12}
        style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center' }}
      >
        <Ionicons name="chevron-back" size={24} color={cream} />
      </Pressable>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={[styles.rank, { color: cream }]}>
          {inkLabel(data.color, lang)} · {String(rank).padStart(3, '0')} {t('UI.thread.of')} {spokenCount}
        </Text>
        <Text
          style={[
            styles.name,
            {
              color: cream,
              fontSize: nameSize,
              lineHeight: nameLineHeight,
              paddingTop: Platform.OS === 'ios' ? 4 : 0,
            },
          ]}
        >
          {localizeVoiceName(data.name, language)}
        </Text>
        <Text style={[styles.sentence, { color: cream }]}>
          {t('UI.thread.castSentence', {
            words: formatCount(data.words),
            turns: formatCount(data.turns),
            stories: data.storyIds.length,
          })}
        </Text>
        {bookNames.length > 0 && (
          <View style={styles.books}>
            {bookNames.map((book) => (
              <Text key={book} style={[styles.bookChip, { color: cream, borderColor: 'rgba(242,234,224,0.35)' }]}>
                {book}
              </Text>
            ))}
          </View>
        )}
        <Text style={[styles.rank, { color: cream, marginTop: 16 }]}>{t('UI.thread.castTimeline')}</Text>
        <View style={styles.timeline}>
          {timeline.map((item) => (
            <TimelineSeg
              key={item.division.key}
              grow={grow}
              weight={item.weight}
              lit={item.lit}
              filled={cream}
              empty="rgba(242,234,224,0.22)"
            />
          ))}
        </View>
        <View style={styles.ribLabels}>
          <Text style={[styles.ribLab, { color: cream }]}>{t('UI.thread.beginning')}</Text>
          <Text style={[styles.ribLab, { color: cream }]}>{t('UI.thread.end')}</Text>
        </View>
        {presentDivisions.length > 0 && (
          <Text style={[styles.timelineNames, { color: cream }]}>
            {presentDivisions
              .map((item) => (lang === 'fr' ? item.division.titleFr : item.division.titleEn))
              .join('  ·  ')}
          </Text>
        )}
        <Text style={[styles.rank, { color: cream, marginTop: 16 }]}>{t('UI.thread.spokeWith')}</Text>
        {partners.map((partner) => {
          const open = expandedPartner === partner.name;
          const partnerInk = roleFill(partner.color);
          return (
            <View key={partner.name}>
              <Pressable
                onPress={() => {
                  void hapticSelection();
                  setExpandedPartner(open ? null : partner.name);
                }}
                style={styles.spoke}
              >
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/cast/[voice]', params: { voice: partner.name } })
                  }
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('UI.thread.openCastPage')}: ${localizeVoiceName(partner.name, language)}`}
                  style={[styles.castIcon, { backgroundColor: partnerInk, borderColor: cream }]}
                >
                  <Ionicons name="person" size={13} color={cream} />
                </Pressable>
                <Text style={[styles.spokeName, { color: cream }]}>
                  {localizeVoiceName(partner.name, language)}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.round(((partner.shared.length || partner.count) / maxPartner) * 100)}%`, backgroundColor: cream },
                    ]}
                  />
                </View>
                <Text style={[styles.spokeCount, { color: cream }]}>{partner.shared.length || partner.count}</Text>
              </Pressable>
              {open &&
                partner.shared.map((id) => {
                  const info = titles[id];
                  return (
                    <Pressable
                      key={id}
                      onPress={() => {
                        void hapticImpactLight();
                        openSegment(router, id, { voice: name });
                      }}
                      style={styles.spokeStory}
                    >
                      <Text style={[styles.spokeStoryTitle, { color: cream }]}>
                        {localizeStoryTitle(id, info?.title || id, language)}
                      </Text>
                      <Text style={[styles.spokeStoryRef, { color: cream }]}>
                        {[info?.book?.[0], info?.ref].filter(Boolean).join(' ')}
                      </Text>
                    </Pressable>
                  );
                })}
            </View>
          );
        })}
        {data.longestExchange && (
          <Pressable
            onPress={() => {
              void hapticImpactLight();
              openSegment(router, data.longestExchange!.storyId, {
                voice: name,
                partner: data.longestExchange!.partner,
                locate: 'exchange',
              });
            }}
            accessibilityRole="button"
            accessibilityLabel={`${t('UI.thread.longestExchange')}. ${localizeVoiceName(data.longestExchange.partner, language)}. ${localizeStoryTitle(data.longestExchange.storyId, data.longestExchange.storyTitle, language)}`}
            style={styles.pull}
          >
            <Text style={[styles.pullLabel, { color: cream }]}>{t('UI.thread.longestExchange')}</Text>
            <View style={styles.pullRow}>
              <View style={styles.pullCopy}>
                <Text style={[styles.pullBody, { color: cream }]}>
                  {data.longestExchange.turns} {t('UI.thread.turnsWith')} {localizeVoiceName(data.longestExchange.partner, language)}
                </Text>
                <Text style={[styles.pullStory, { color: cream }]}>
                  {localizeStoryTitle(data.longestExchange.storyId, data.longestExchange.storyTitle, language)}
                </Text>
              </View>
              <Ionicons name="arrow-forward-circle-outline" size={22} color={cream} />
            </View>
          </Pressable>
        )}
        {data.longestSpeech && (
          <Pressable
            onPress={() => {
              void hapticImpactLight();
              openSegment(router, data.longestSpeech!.storyId, {
                voice: name,
                locate: 'speech',
              });
            }}
            accessibilityRole="button"
            accessibilityLabel={`${t('UI.thread.longestSpeech')}. ${localizeStoryTitle(data.longestSpeech.storyId, data.longestSpeech.storyTitle, language)}`}
            style={styles.pull}
          >
            <Text style={[styles.pullLabel, { color: cream }]}>{t('UI.thread.longestSpeech')}</Text>
            <View style={styles.pullRow}>
              <View style={styles.pullCopy}>
                <Text style={[styles.pullBody, { color: cream }]}>
                  {formatCount(data.longestSpeech.words)} {t('UI.thread.words').toLowerCase()}
                </Text>
                <Text style={[styles.pullStory, { color: cream }]}>
                  {localizeStoryTitle(data.longestSpeech.storyId, data.longestSpeech.storyTitle, language)}
                </Text>
              </View>
              <Ionicons name="arrow-forward-circle-outline" size={22} color={cream} />
            </View>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rank: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.85, marginTop: 12 },
  name: {
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    letterSpacing: -1,
    marginTop: 8,
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },
  sentence: { fontSize: 14, lineHeight: 20, marginTop: 10, opacity: 0.92 },
  books: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  bookChip: { fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', borderWidth: 1, borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2 },
  timeline: {
    flexDirection: 'row',
    height: 10,
    gap: 2,
    marginTop: 10,
    alignItems: 'stretch',
  },
  seg: {
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 2,
    borderRadius: 2,
  },
  ribLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  ribLab: { fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6 },
  timelineNames: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
    opacity: 0.9,
  },
  spoke: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, minHeight: 44, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(242,234,224,0.2)' },
  castIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spokeName: { flex: 1, fontSize: 13 },
  barTrack: { width: 52, height: 3, backgroundColor: 'rgba(242,234,224,0.25)' },
  barFill: { height: 3 },
  spokeCount: { width: 24, textAlign: 'right', fontSize: 10, opacity: 0.8, fontVariant: ['tabular-nums'] },
  spokeStory: {
    paddingLeft: 44,
    paddingRight: 8,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  spokeStoryTitle: { fontSize: 14, lineHeight: 18 },
  spokeStoryRef: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.7, marginTop: 2 },
  pull: { marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(242,234,224,0.28)' },
  pullLabel: { fontSize: 8, letterSpacing: 1.6, textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 },
  pullRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  pullCopy: { flex: 1 },
  pullBody: { fontSize: 14, lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  pullStory: { fontSize: 12, lineHeight: 16, opacity: 0.8, marginTop: 2 },
});

export default VoiceCard;
