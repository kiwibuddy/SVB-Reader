import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import conversations from '@/assets/data/conversations.json';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import { ConversationsFile } from '@/types/conversations';
import { ThreadColors } from '@/constants/Colors';
import { inkLabel } from '@/utils/ink';
import { localizeVoiceName, localizeStoryTitle, formatCount } from '@/utils/localize';
import { DIVISIONS, storyNumber } from '@/constants/divisions';
import { TOTAL_VOICES } from '@/utils/voicesMet';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';

const conv = conversations as ConversationsFile;
const titles = SegmentTitles as Record<string, { title?: string }>;

const VoiceCard = () => {
  const { voice } = useLocalSearchParams<{ voice: string }>();
  const name = decodeURIComponent(voice || '');
  const data = conv.voices[name];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useSyncAppSettings();
  const { t } = useTranslation();
  const lang = language.startsWith('fr') ? 'fr' : 'en';

  const rank = useMemo(() => {
    const sorted = Object.values(conv.voices).sort((a, b) => b.words - a.words);
    return sorted.findIndex((item) => item.name === name) + 1;
  }, [name]);

  const ribbon = useMemo(() => {
    if (!data) return [];
    return DIVISIONS.map((division) => {
      const hits = data.storyIds.filter((id) => {
        const n = storyNumber(id);
        return n != null && n >= division.start && n <= division.end;
      }).length;
      return hits;
    });
  }, [data]);

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
  const firstTitle = data.firstStoryId ? localizeStoryTitle(data.firstStoryId, titles[data.firstStoryId]?.title || '', language) : '';
  const lastTitle = data.lastStoryId ? localizeStoryTitle(data.lastStoryId, titles[data.lastStoryId]?.title || '', language) : '';

  return (
    <View style={[styles.root, { backgroundColor: field }]}>
      <Pressable onPress={() => router.back()} style={{ paddingTop: insets.top + 8, paddingHorizontal: 16 }}>
        <Text style={[styles.back, { color: cream }]}>‹ {t('UI.tabs.cast')}</Text>
      </Pressable>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={[styles.rank, { color: cream }]}>
          {inkLabel(data.color, lang)} · {String(rank).padStart(3, '0')} {t('UI.thread.of')} {TOTAL_VOICES}
        </Text>
        <Text
          style={[
            styles.name,
            { color: cream, fontSize: data.name.length > 14 ? 44 : 64 },
          ]}
        >
          {localizeVoiceName(data.name, language)}
        </Text>
        <View style={styles.rib}>
          {ribbon.map((hits, index) => (
            <View
              key={index}
              style={[
                styles.ribBar,
                {
                  height: hits > 8 ? 20 : hits > 2 ? 11 : 3,
                  backgroundColor: hits > 0 ? cream : 'rgba(242,234,224,0.2)',
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.rank, { color: cream, marginTop: 8 }]}>
          {data.storyIds.length} {t('UI.thread.of')} 365 {t('UI.thread.stories')}
        </Text>
        <View style={styles.stats}>
          <View style={[styles.stat, { borderTopColor: 'rgba(242,234,224,0.28)' }]}>
            <Text style={[styles.statLabel, { color: cream }]}>{t('UI.thread.words')}</Text>
            <Text style={[styles.statValue, { color: cream }]}>{formatCount(data.words)}</Text>
          </View>
          <View style={[styles.stat, { borderTopColor: 'rgba(242,234,224,0.28)' }]}>
            <Text style={[styles.statLabel, { color: cream }]}>{t('UI.thread.turns')}</Text>
            <Text style={[styles.statValue, { color: cream }]}>{formatCount(data.turns)}</Text>
          </View>
        </View>
        <Text style={[styles.rank, { color: cream, marginTop: 16 }]}>{t('UI.thread.spokeWith')}</Text>
        {data.spokeWith.slice(0, 4).map((partner) => (
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
          <Pressable onPress={() => router.push(`/${data.longestExchange!.storyId}`)} style={styles.pull}>
            <Text style={[styles.pullLabel, { color: cream }]}>{t('UI.thread.longestExchange')}</Text>
            <Text style={[styles.pullBody, { color: cream }]}>
              {data.longestExchange.turns} {t('UI.thread.turnsWith')} {localizeVoiceName(data.longestExchange.partner, language)} — {localizeStoryTitle(data.longestExchange.storyId, data.longestExchange.storyTitle, language)}
            </Text>
          </Pressable>
        )}
        {data.longestSpeech && (
          <Pressable onPress={() => router.push(`/${data.longestSpeech!.storyId}`)} style={styles.pull}>
            <Text style={[styles.pullLabel, { color: cream }]}>{t('UI.thread.longestSpeech')}</Text>
            <Text style={[styles.pullBody, { color: cream }]}>
              {formatCount(data.longestSpeech.words)} {t('UI.thread.words').toLowerCase()} — {localizeStoryTitle(data.longestSpeech.storyId, data.longestSpeech.storyTitle, language)}
            </Text>
          </Pressable>
        )}
        <Text style={[styles.rank, { color: cream, marginTop: 16 }]}>
          {firstTitle} → {lastTitle}
        </Text>
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
  rib: { flexDirection: 'row', gap: 1, height: 20, alignItems: 'flex-end', marginTop: 16 },
  ribBar: { flex: 1, borderRadius: 1 },
  stats: { flexDirection: 'row', marginTop: 12 },
  stat: { flex: 1, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  statLabel: { fontSize: 8, letterSpacing: 1.6, textTransform: 'uppercase', opacity: 0.7 },
  statValue: { fontSize: 22, fontVariant: ['tabular-nums'], marginTop: 2 },
  spoke: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(242,234,224,0.2)' },
  spokeName: { flex: 1, fontSize: 13 },
  barTrack: { width: 52, height: 3, backgroundColor: 'rgba(242,234,224,0.25)' },
  barFill: { height: 3 },
  spokeCount: { width: 24, textAlign: 'right', fontSize: 10, opacity: 0.8, fontVariant: ['tabular-nums'] },
  pull: { marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(242,234,224,0.28)' },
  pullLabel: { fontSize: 8, letterSpacing: 1.6, textTransform: 'uppercase', opacity: 0.7, marginBottom: 4 },
  pullBody: { fontSize: 14, lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
});

export default VoiceCard;
