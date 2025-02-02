import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context/GlobalContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CelebrationPopup from './CelebrationPopup';
import { getCheckColor } from '@/scripts/getCheckColors';
import { getSegmentReadCount } from '@/api/sqlite';

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

  // Get completion status based on context
  const getIsCompleted = () => {
    if (context === 'main') {
      return completedSegments[segmentId]?.isCompleted || false;
    }
    if (context === 'plan' && planId && activePlan?.planId === planId) {
      return activePlan.completedSegments.includes(segmentId);
    }
    if (context === 'challenge' && challengeId && activeChallenges[challengeId]) {
      return activeChallenges[challengeId].completedSegments.includes(segmentId);
    }
    return false;
  };

  const isCompleted = getIsCompleted();
  const completionColor = completedSegments[segmentId]?.color || null;

  useEffect(() => {
    // Load total read count for the segment
    const loadReadCount = async () => {
      const count = await getSegmentReadCount(segmentId);
      setReadCount(count);
    };
    loadReadCount();
  }, [segmentId, isCompleted]);

  const handlePress = async () => {
    const color = isCompleted ? null : selectedReaderColor;
    
    // Mark complete based on context
    if (context === 'main') {
      await markSegmentComplete(segmentId, !isCompleted, color);
    } else if (context === 'plan' && planId) {
      await markSegmentComplete(segmentId, !isCompleted, color, 'plan', planId);
    } else if (context === 'challenge' && challengeId) {
      await markSegmentComplete(segmentId, !isCompleted, color, 'challenge', challengeId);
    }

    if (!isCompleted) {
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
