import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context/GlobalContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CelebrationPopup from '@/components/Bible/CelebrationPopup';
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
  context?: 'main' | 'plan' | 'challenge';
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
  
  const [showCelebration, setShowCelebration] = useState(false);
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
        }
        
        // Update local state
        setIsCompleted(true);
        setShowCelebration(true);
        
        // Update read count
        const newCount = await getSegmentReadCount(segmentId);
        setReadCount(newCount);
        
      } catch (error) {
        console.error('Error marking segment complete:', error);
      }
    }
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    
    // Navigate back to the source screen with proper tab navigation
    if (params.planId || planId) {
      // Return to Plan screen with bottom navigation
      router.push('/(tabs)/Plan');
    } else if (params.challengeId || challengeId) {
      // Return to Reading-Challenges screen with bottom navigation
      router.push('/(tabs)/Reading-Challenges');
    } else {
      // Return to Navigation screen with bottom navigation
      router.push('/(tabs)/Navigation');
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
      <CelebrationPopup 
        visible={showCelebration} 
        onComplete={handleCelebrationComplete}
      />
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
