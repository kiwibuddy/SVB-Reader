import React from 'react';
import { Text, View, StyleSheet } from "react-native";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { useAppSettings } from '@/context/AppSettingsContext';

interface SegmentTitleType {
  title: string;
  book: string[];
  ref?: string;
}

const dualBookSegments = ["S115", "S096"];

export default function SegmentTitle({segmentId}: {segmentId: string}) {
  const { colors } = useAppSettings();
  const { title, book, ref } = SegmentTitles[segmentId as keyof typeof SegmentTitles] as SegmentTitleType;
  const isDualBook = dualBookSegments.includes(segmentId);
  
  const reference = isDualBook ? `${book[0]} & ${book[1]}` : ref;

  const styles = StyleSheet.create({
    container: {
      paddingTop: 32,
      paddingHorizontal: 16,
      paddingBottom: 8,
      justifyContent: "center",
      alignItems: "center"
    },
    title: {
      fontSize: 24,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8
    },
    subtitle: {
      fontSize: 16,
      color: colors.secondary,
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{ref ? reference : book[0]}</Text>
    </View>
  );
}
