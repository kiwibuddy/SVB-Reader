import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context/GlobalContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getCheckColor } from '@/scripts/getCheckColors';
import { 
  getSegmentReadCount, 
  getSegmentCompletionStatus, 
  markSegmentComplete,
  resetSegmentCompletion 
} from '@/api/sqlite';
import { useAppSettings } from '@/context/AppSettingsContext';

interface CheckCircleProps {
  segmentId: string;
  iconSize?: number;
  context?: 'main' | 'plan' | 'challenge' | 'today';
  planId?: string;
  challengeId?: string;
}

export default function CheckCircle({ 
  segmentId, 
  iconSize = 24, 
  context = 'main',
  planId,
  challengeId
}: CheckCircleProps) {
  const { 
    completedSegments, 
    markSegmentComplete: globalMarkComplete, 
    selectedReaderColor,
    activePlan,
    activeChallenges,
    setLastReadSegment,
    updateReadingPlanProgress,
    updateChallengeProgress
  } = useAppContext();
  
  const [readCount, setReadCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionColor, setCompletionColor] = useState<string | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppSettings();

  // Load completion status when component mounts
  useEffect(() => {
    const initializeSegment = async () => {
      // Load current completion status for this context
      const status = await getSegmentCompletionStatus(segmentId, context, planId, challengeId);
      setIsCompleted(status.isCompleted);
      setCompletionColor(status.color);
      
      // Load read count
      const count = await getSegmentReadCount(segmentId);
      setReadCount(count);
    };
    
    initializeSegment();
  }, [segmentId, context, planId, challengeId]);

  const handlePress = async () => {
    if (!isCompleted) {
      try {
        // Only use global context function - it handles database calls internally
        if (context === 'main') {
          await globalMarkComplete(segmentId, true, selectedReaderColor, context);
          await setLastReadSegment(segmentId);
        } else if (context === 'plan' && planId) {
          await globalMarkComplete(segmentId, true, selectedReaderColor, context, planId);
          await updateReadingPlanProgress(planId, segmentId);
        } else if (context === 'challenge' && challengeId) {
          await globalMarkComplete(segmentId, true, selectedReaderColor, context, undefined, challengeId);
          await updateChallengeProgress(challengeId, segmentId);
        } else if (context === 'today') {
          await globalMarkComplete(segmentId, true, selectedReaderColor, context);
          await setLastReadSegment(segmentId);
        }
        
        // Update local state
        setIsCompleted(true);
        
        // Update read count
        const newCount = await getSegmentReadCount(segmentId);
        setReadCount(newCount);
        
        // Navigate back to the source screen immediately
        if (params.planId || planId) {
          // Return to Plan screen with bottom navigation
          router.replace('/(tabs)/Plan');
        } else if (params.challengeId || challengeId) {
          // Return to Reading-Challenges screen with bottom navigation
          router.replace('/(tabs)/Reading-Challenges');
        } else {
          // Return to Navigation screen with bottom navigation
          router.replace('/(tabs)/Navigation');
        }
        
      } catch (error) {
        console.error('Error marking segment complete:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} style={styles.checkButton}>
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={iconSize}
          color={isCompleted ? getCheckColor(completionColor) : colors.secondary}
        />
      </Pressable>
      {readCount > 0 && (
        <Text style={[styles.readCount, { color: colors.secondary }]}>
          Read {readCount} time{readCount !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 0, // Remove extra padding since parent container handles spacing
  },
  checkButton: {
    padding: 8, // Add padding to make it easier to tap
  },
  readCount: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  }
});
