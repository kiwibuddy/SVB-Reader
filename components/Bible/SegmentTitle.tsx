import React, { useMemo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { ThreadColors } from '@/constants/Colors';
import { localizeStoryTitle, localizeBookName } from '@/utils/localize';
import { formatReadingMinutes, getSegmentReadingTime } from '@/utils/readingTime';
import Books from '@/assets/data/BookChapterList.json';

interface SegmentTitleType {
  title: string;
  book: string[];
  ref?: string;
}

const books = Books as Record<string, { bookName: string }>;

export default function SegmentTitle({ segmentId }: { segmentId: string }) {
  const { isDarkMode, language } = useSyncAppSettings();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const data = SegmentTitles[segmentId as keyof typeof SegmentTitles] as SegmentTitleType | undefined;
  const title = localizeStoryTitle(segmentId, data?.title || segmentId, language);
  const bookId = data?.book?.[0] || '';
  const bookName = localizeBookName(bookId, books[bookId]?.bookName || bookId, language);
  const ref = (data?.ref || '').replace(/-/g, '–');
  const minutes = getSegmentReadingTime(segmentId);
  const num = segmentId.replace(/^S/i, '');
  const isIntroduction = segmentId.startsWith('I');
  const meta = [num, bookId && ref ? `${bookId} ${ref}` : bookName, minutes ? formatReadingMinutes(minutes) : '']
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: palette.ink }]}>{title}</Text>
      {!isIntroduction && <Text style={[styles.meta, { color: palette.mute }]}>{meta}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 6,
  },
});
