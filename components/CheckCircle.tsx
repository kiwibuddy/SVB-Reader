import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context/GlobalContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CelebrationPopup from './CelebrationPopup';
import { getCheckColor } from '@/scripts/getCheckColors';
import { getSegmentReadCount, getSegmentCompletionStatus } from '@/api/sqlite';

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
    markSegmentComplete, 
    selectedReaderColor,
    activePlan,
    activeChallenges
  } = useAppContext();
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [readCount, setReadCount] = useState(0);
  const router = useRouter();
  const params = useLocalSearchParams();

  const [isCompleted, setIsCompleted] = useState(false);
  const [completionColor, setCompletionColor] = useState<string | null>(null);

  useEffect(() => {
    const loadCompletionStatus = async () => {
      const status = await getSegmentCompletionStatus(
        segmentId,
        context,
        planId,
        challengeId
      );
      setIsCompleted(status.isCompleted);
      setCompletionColor(status.color);
    };
    loadCompletionStatus();
  }, [segmentId, context, planId, challengeId]);

  useEffect(() => {
    // Load total read count for the segment
    const loadReadCount = async () => {
      const count = await getSegmentReadCount(segmentId);
      setReadCount(count);
    };
    loadReadCount();
  }, [segmentId, isCompleted]);

  const handlePress = async () => {
    if (!isCompleted) {
      // Get the currently active reader color from the context
      // If no color is selected, pass null
      const contextId = context === 'plan' ? planId : 
                        context === 'challenge' ? challengeId : 
                        undefined;
                        
      // Use null instead of selectedReaderColor until it's properly implemented
      await markSegmentComplete(segmentId, true, null, context, contextId);
      setShowCelebration(true);
    }
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    // Navigate based on context
    if (params.planId) {
      router.push('/Plan');
    } else if (params.challengeId) {
      router.push('/Reading-Challenges');
    } else {
      router.push('/Navigation');
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress}>
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={iconSize}
          color={isCompleted ? getCheckColor(completionColor) : '#CCCCCC'}
        />
      </Pressable>
      {readCount > 0 && (
        <Text style={styles.readCount}>
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
  },
  readCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center'
  }
});
