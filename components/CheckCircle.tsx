import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context/GlobalContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getCheckColor } from '@/scripts/getCheckColors';
import { getSegmentReadCount, getSegmentCompletionStatus } from '@/api/sqlite';

interface CheckCircleProps {
  segmentId: string;
  iconSize?: number;
  context?: 'main' | 'plan' | 'challenge';
  planId?: string;
  challengeId?: string;
  onCelebration?: () => void;
}

export default function CheckCircle({ 
  segmentId, 
  iconSize = 24, 
  context = 'main',
  planId,
  challengeId,
  onCelebration
}: CheckCircleProps) {
  const { 
    completedSegments, 
    markSegmentComplete, 
    selectedReaderColor,
    activePlan,
    activeChallenges
  } = useAppContext();
  
  const [readCount, setReadCount] = useState(0);
  const router = useRouter();
  const params = useLocalSearchParams();

  const [isCompleted, setIsCompleted] = useState(false);
  const [completionColor, setCompletionColor] = useState<string | null>(null);

  useEffect(() => {
    const loadCompletionStatus = async () => {
      try {
        const status = await getSegmentCompletionStatus(
          segmentId,
          context,
          planId,
          challengeId
        );
        setIsCompleted(status.isCompleted);
        setCompletionColor(status.color);
      } catch (error) {
        console.log('Error loading completion status:', error);
        // Set defaults if there's an error
        setIsCompleted(false);
        setCompletionColor(null);
      }
    };
    loadCompletionStatus();
  }, [segmentId, context, planId, challengeId]);

  useEffect(() => {
    // Load total read count for the segment
    const loadReadCount = async () => {
      try {
        const count = await getSegmentReadCount(segmentId);
        setReadCount(count);
      } catch (error) {
        console.log('Error loading read count:', error);
        setReadCount(0);
      }
    };
    loadReadCount();
  }, [segmentId, isCompleted]);

  const handlePress = useCallback(async () => {
    try {
      // Always allow clicking for multiple reads
      const contextId = context === 'plan' ? planId : 
                        context === 'challenge' ? challengeId : 
                        undefined;
                          
      await markSegmentComplete(segmentId, true, null, context, contextId);
      
      // Update local state
      setIsCompleted(true);
      
      // Trigger celebration callback
      if (onCelebration) {
        onCelebration();
      }
      
      // Refresh read count
      const newCount = await getSegmentReadCount(segmentId);
      setReadCount(newCount);
    } catch (error) {
      console.log('Error marking segment complete:', error);
    }
  }, [segmentId, context, planId, challengeId, markSegmentComplete, onCelebration]);

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.pressableArea}
        onPress={handlePress}
        hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
        android_ripple={{ color: 'rgba(0,0,0,0.1)', radius: 50, borderless: false }}
      >
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pressableArea: {
    padding: 20,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    minHeight: 100,
  },
  readCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    textAlign: 'center'
  }
});
