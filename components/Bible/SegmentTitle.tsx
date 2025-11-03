import React, { useMemo } from 'react';
import { Text, View, StyleSheet } from "react-native";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { useAppSettings } from '@/context/AppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';

interface SegmentTitleType {
  title: string;
  book: string[];
  ref?: string;
}

const dualBookSegments = ["S115", "S096"];

export default function SegmentTitle({segmentId}: {segmentId: string}) {
  const { colors, language } = useAppSettings();
  const { t } = useTranslation();
  
  // Get localized segment title based on current language
  const localizedData = useMemo(() => {
    if (language === 'fr') {
      // Try to get French title and book names from FRA-UI.json
      try {
        const fraUI = require('@/assets/data/FRA-UI.json');
        const frenchTitle = fraUI.Titles?.[segmentId];
        if (frenchTitle) {
          // Get English data for structure
          const englishData = SegmentTitles[segmentId as keyof typeof SegmentTitles] as SegmentTitleType;
          
          // Translate book names if available
          let localizedBooks = englishData.book;
          if (fraUI.bookNames) {
            localizedBooks = englishData.book.map((bookName: string) => {
              // bookNames structure: { "GEN": { "bookName": "Genèse", "Abbreviation Translation": "Gn" } }
              const frenchBook = fraUI.bookNames[bookName];
              return frenchBook?.bookName || bookName;
            });
          }
          
          return {
            title: frenchTitle,
            book: localizedBooks,
            ref: englishData.ref // Keep reference as is (it's mostly numbers/abbreviations)
          };
        }
      } catch (error) {
        // Fall back to English if French not available
      }
    }
    // Default to English
    return SegmentTitles[segmentId as keyof typeof SegmentTitles] as SegmentTitleType;
  }, [segmentId, language]);
  
  const { title, book, ref } = localizedData;
  const isDualBook = dualBookSegments.includes(segmentId);
  const isIntroduction = segmentId.startsWith('I');
  
  const reference = isDualBook ? `${book[0]} & ${book[1]}` : ref;

  const styles = StyleSheet.create({
    container: {
      paddingTop: isIntroduction ? 32 : 32,
      paddingHorizontal: 16,
      paddingBottom: isIntroduction ? 4 : 8,
      justifyContent: "center",
      alignItems: "center"
    },
    title: {
      fontSize: 24,
      fontWeight: "600",
      color: colors.text,
      marginBottom: isIntroduction ? 0 : 8
    },
    subtitle: {
      fontSize: 16,
      color: colors.secondary,
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {!isIntroduction && (
        <Text style={styles.subtitle}>{ref ? reference : book[0]}</Text>
      )}
    </View>
  );
}
