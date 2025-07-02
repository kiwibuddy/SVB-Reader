import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import ChronologicalSegmentItem from './ChronologicalSegmentItem';
import { useAppSettings } from '@/context/AppSettingsContext';
import ChronologicalMappings from '@/assets/data/ChronologicalMappings.json';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import Books from '@/assets/data/BookChapterList.json';

interface ChronologicalViewProps {
  challengeId: string;
  chronologicalMapping: string;
  completedSegments: Record<string, boolean>;
  onSegmentSelect: (segmentId: string) => void;
  onSegmentComplete: (segmentId: string) => void;
  context: 'plan' | 'challenge';
  planId?: string;
}

const ChronologicalView: React.FC<ChronologicalViewProps> = ({
  challengeId,
  chronologicalMapping,
  completedSegments,
  onSegmentSelect,
  onSegmentComplete,
  context,
  planId
}) => {
  const { colors } = useAppSettings();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    phaseHeader: {
      backgroundColor: colors.background,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    phaseTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    phaseDescription: {
      fontSize: 13,
      color: colors.secondary,
      lineHeight: 18,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      textAlign: 'center',
    },
  });

  const mappingData = (ChronologicalMappings as any)[chronologicalMapping];
  
  if (!mappingData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.secondary }]}>
          Chronological mapping not found
        </Text>
      </View>
    );
  }

  // Group segments by phase
  const segmentsByPhase = mappingData.segments.reduce((acc: any, segment: any) => {
    if (!acc[segment.phase]) {
      acc[segment.phase] = [];
    }
    acc[segment.phase].push(segment);
    return acc;
  }, {});

  const phases = Object.keys(mappingData.phases);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {phases.map((phaseName) => {
        const phase = mappingData.phases[phaseName];
        const phaseSegments = segmentsByPhase[phaseName] || [];
        
        return (
          <View key={phaseName}>
            <View style={[styles.phaseHeader, { backgroundColor: phase.color + '15' }]}>
              <Text style={[styles.phaseTitle, { color: phase.color }]}>
                {phaseName}
              </Text>
              <Text style={styles.phaseDescription}>
                {phase.description}
              </Text>
            </View>
            
            {phaseSegments.map((segment: any) => {
              const segmentData = SegmentTitles[segment.segmentId as keyof typeof SegmentTitles];
              const bookData = Books[segment.book as keyof typeof Books];
              
              if (!segmentData || !bookData) return null;
              
              return (
                <ChronologicalSegmentItem
                  key={segment.segmentId}
                  segmentId={segment.segmentId}
                  title={segmentData.title}
                  book={segment.book}
                  bookName={bookData.bookName}
                  ref={segment.ref}
                  phase={phaseName}
                  phaseColor={phase.color}
                  isCompleted={!!completedSegments[segment.segmentId]}
                  onPress={onSegmentSelect}
                  context={context}
                  planId={planId}
                  challengeId={challengeId}
                />
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
};

export default ChronologicalView; 