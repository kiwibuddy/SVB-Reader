import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import conversations from '@/assets/data/conversations.json';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import Books from '@/assets/data/BookChapterList.json';
import { ConversationsFile } from '@/types/conversations';
import { ThreadColors } from '@/constants/Colors';
import { inkLabel } from '@/utils/ink';
import { localizeVoiceName, localizeStoryTitle, localizeBookName, formatCount } from '@/utils/localize';
import { DIVISIONS, storyNumber } from '@/constants/divisions';
import { NARRATION_VOICES } from '@/utils/voicesMet';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useGrowOnFocus } from '@/hooks/useGrowOnFocus';
import { openSegment } from '@/utils/openSegment';

const conv = conversations as ConversationsFile;
const titles = SegmentTitles as Record<string, { title?: string; book?: string[] }>;
const books = Books as Record<string, { bookName: string }>;

function Bucket({ grow, target, filled, empty }: { grow: SharedValue<number>; target: number; filled: string; empty: string }) {
  const style = useAnimatedStyle(() => ({
    height: interpolate(grow.value, [0, 1], [2, Math.max(target, 3)]),
    backgroundColor: target > 3 ? filled : empty,
  }));
  return <Animated.View style={[styles.ribBar, style]} />;
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

  const rank = useMemo(() => {
    const sorted = Object.values(conv.voices)
      .filter((item) => !NARRATION_VOICES.has(item.name))
      .sort((a, b) => b.words - a.words);
    return sorted.findIndex((item) => item.name === name) + 1;
  }, [name]);

  const buckets = useMemo(() => {
    if (!data) return [];
    return DIVISIONS.map((division) =>
      data.storyIds.filter((id) => {
        const n = storyNumber(id);
        return n != null && n >= division.start && n <= division.end;
      }).length
    );
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

  const field = data.color === 'red' ? '#B4231A' : data.color === 'green' ? '#0E6B4C' : data.color === 'black' ? '#3A4550' : '#1D46A8';
  const cream = '#F2EAE0';
  const maxPartner = data.spokeWith[0]?.count || 1;
  const maxBucket = Math.max(...buckets, 1);
  const spokenCount = Object.values(conv.voices).filter((item) => !NARRATION_VOICES.has(item.name)).length;

  return (
    <View style={[styles.root, { backgroundColor: field }]}>
      <Pressable onPress={() => router.back()} style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, minHeight: 44 }}>
        <Text style={[styles.back, { color: cream }]}>‹ {t('UI.tabs.cast')}</Text>
      </Pressable>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={[styles.rank, { color: cream }]}>
          {inkLabel(data.color, lang)} · {String(rank).padStart(3, '0')} {t('UI.thread.of')} {spokenCount}
        </Text>
        <Text
          style={[
            styles.name,
            { color: cream, fontSize: data.name.length > 14 ? 44 : 64 },
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
        <View style={styles.rib}>
          {buckets.map((hits, index) => (
            <Bucket
              key={DIVISIONS[index].key}
              grow={grow}
              target={3 + Math.round((hits / maxBucket) * 31)}
              filled={cream}
              empty="rgba(242,234,224,0.22)"
            />
          ))}
        </View>
        <View style={styles.ribLabels}>
          <Text style={[styles.ribLab, { color: cream }]}>{t('UI.thread.beginning')}</Text>
          <Text style={[styles.ribLab, { color: cream }]}>{t('UI.thread.end')}</Text>
        </View>
        <Text style={[styles.rank, { color: cream, marginTop: 16 }]}>{t('UI.thread.spokeWith')}</Text>
        {data.spokeWith.slice(0, 8).map((partner) => (
          <Pressable
            key={partner.name}
            onPress={() => router.push(`/cast/${encodeURIComponent(partner.name)}`)}
            style={styles.spoke}
          >
            <Text style={[styles.spokeName, { color: cream }]}>{localizeVoiceName(partner.name, language)}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.round((partner.count / maxPartner) * 100)}%`, backgroundColor: cream }]} />
            </View>
            <Text style={[styles.spokeCount, { color: cream }]}>{partner.count}</Text>
          </Pressable>
        ))}
        {data.longestExchange && (
          <Pressable onPress={() => openSegment(router, data.longestExchange!.storyId, { voice: name })} style={styles.pull}>
            <Text style={[styles.pullLabel, { color: cream }]}>{t('UI.thread.longestExchange')}</Text>
            <Text style={[styles.pullBody, { color: cream }]}>
              {data.longestExchange.turns} {t('UI.thread.turnsWith')} {localizeVoiceName(data.longestExchange.partner, language)} — {localizeStoryTitle(data.longestExchange.storyId, data.longestExchange.storyTitle, language)}
            </Text>
          </Pressable>
        )}
        {data.longestSpeech && (
          <Pressable onPress={() => openSegment(router, data.longestSpeech!.storyId, { voice: name })} style={styles.pull}>
            <Text style={[styles.pullLabel, { color: cream }]}>{t('UI.thread.longestSpeech')}</Text>
            <Text style={[styles.pullBody, { color: cream }]}>
              {formatCount(data.longestSpeech.words)} {t('UI.thread.words').toLowerCase()} — {localizeStoryTitle(data.longestSpeech.storyId, data.longestSpeech.storyTitle, language)}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  back: { fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase' },
  rank: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.85, marginTop: 12 },
  name: {
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    lineHeight: 64,
    letterSpacing: -1,
    marginTop: 6,
  },
  sentence: { fontSize: 14, lineHeight: 20, marginTop: 10, opacity: 0.92 },
  books: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  bookChip: { fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', borderWidth: 1, borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2 },
  rib: { flexDirection: 'row', gap: 2, height: 34, alignItems: 'flex-end', marginTop: 16 },
  ribBar: { flex: 1, borderRadius: 1 },
  ribLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  ribLab: { fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6 },
  spoke: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, minHeight: 44, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(242,234,224,0.2)' },
  spokeName: { flex: 1, fontSize: 13 },
  barTrack: { width: 52, height: 3, backgroundColor: 'rgba(242,234,224,0.25)' },
  barFill: { height: 3 },
  spokeCount: { width: 24, textAlign: 'right', fontSize: 10, opacity: 0.8, fontVariant: ['tabular-nums'] },
  pull: { marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(242,234,224,0.28)' },
  pullLabel: { fontSize: 8, letterSpacing: 1.6, textTransform: 'uppercase', opacity: 0.7, marginBottom: 4 },
  pullBody: { fontSize: 14, lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
});

export default VoiceCard;
