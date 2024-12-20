import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '@/context/GlobalContext';
import { useRouter } from 'expo-router';
import CelebrationPopup from './CelebrationPopup';
import { getCheckColor } from '@/scripts/getCheckColors';

interface CheckCircleProps {
  segmentId: string;
  iconSize?: number;
}

export default function CheckCircle({ segmentId, iconSize = 24 }: CheckCircleProps) {
  const { completedSegments, markSegmentComplete, selectedReaderColor } = useAppContext();
  const [showCelebration, setShowCelebration] = useState(false);
  const router = useRouter();
  const isCompleted = completedSegments[segmentId]?.isCompleted || false;
  const completionColor = completedSegments[segmentId]?.color || null;

  const handlePress = async () => {
    const color = isCompleted ? null : selectedReaderColor;
    await markSegmentComplete(segmentId, !isCompleted, color);
    if (!isCompleted) {
      setShowCelebration(true);
    }
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    router.push('/Navigation'); // Navigate back to Navigation tab
  };

  return (
    <>
      <Pressable onPress={handlePress}>
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={iconSize}
          color={isCompleted ? getCheckColor(completionColor) : '#CCCCCC'}
        />
      </Pressable>
      <CelebrationPopup 
        visible={showCelebration} 
        onComplete={handleCelebrationComplete}
      />
    </>
  );
}
