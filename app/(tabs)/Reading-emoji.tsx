import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, SectionList } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getEmojis } from '@/api/sqlite';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import { ThreadColors } from '@/constants/Colors';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { localizeStoryTitle } from '@/utils/localize';

type SavedRow = {
  id: number;
  segmentID: string;
  blockID: string;
  emoji?: string | null;
  note?: string | null;
};

const titles = SegmentTitles as Record<string, { title?: string; ref?: string; book?: string[] }>;

const SavedScreen = () => {
  const router = useRouter();
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const [rows, setRows] = useState<SavedRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getEmojis()
        .then((items) => {
          if (alive) setRows((items || []) as SavedRow[]);
        })
        .catch(() => {
          if (alive) setRows([]);
        });
      return () => {
        alive = false;
      };
    }, [])
  );

  const sections = useMemo(() => {
    const byStory = new Map<string, SavedRow[]>();
    for (const row of rows) {
      const id = row.segmentID?.match(/S\d+/i)?.[0] || row.segmentID;
      if (!id) continue;
      const list = byStory.get(id) || [];
      list.push(row);
      byStory.set(id, list);
    }
    return [...byStory.entries()].map(([id, items]) => ({
      id,
      title: localizeStoryTitle(id, titles[id]?.title || id, language),
      ref: titles[id]?.ref || '',
      data: items,
    }));
  }, [language, rows]);

  if (rows.length === 0) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['top']}>
        <Text style={[styles.page, { color: palette.ink }]}>{t('UI.tabs.saved')}</Text>
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: palette.ink }]}>{t('UI.thread.savedEmptyTitle')}</Text>
          <Text style={[styles.emptyBody, { color: palette.mute }]}>{t('UI.thread.savedEmptyBody')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['top']}>
      <Text style={[styles.page, { color: palette.ink }]}>{t('UI.tabs.saved')}</Text>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderSectionHeader={({ section }) => (
          <Pressable onPress={() => router.push(`/${section.id}`)} style={[styles.header, { borderBottomColor: palette.hair }]}>
            <Text style={[styles.story, { color: palette.ink }]}>{section.title}</Text>
            <Text style={[styles.ref, { color: palette.mute }]}>{section.ref}</Text>
          </Pressable>
        )}
        renderItem={({ item, section }) => (
          <Pressable onPress={() => router.push(`/${section.id}`)} style={[styles.row, { borderBottomColor: palette.hair }]}>
            <Text style={styles.emoji}>{item.emoji || '✎'}</Text>
            <Text style={[styles.note, { color: palette.ink }]} numberOfLines={2}>
              {item.note || t('UI.thread.savedReaction')}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: { fontSize: 22, fontWeight: '600', paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8 },
  empty: { paddingHorizontal: 14, paddingTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyBody: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  header: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  story: { fontSize: 16, fontWeight: '600' },
  ref: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, minHeight: 44, borderBottomWidth: StyleSheet.hairlineWidth },
  emoji: { fontSize: 20, width: 28 },
  note: { flex: 1, fontSize: 14 },
});

export default SavedScreen;
