import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '@/context/GlobalContext';
import { useRouter } from 'expo-router';
import CelebrationPopup from './CelebrationPopup';

interface CheckCircleProps {
  segmentId: string;
  iconSize?: number;
}

export default function CheckCircle({ segmentId, iconSize = 24 }: CheckCircleProps) {
  const { completedSegments, markSegmentComplete } = useAppContext();
  const [showCelebration, setShowCelebration] = useState(false);
  const router = useRouter();
  const isCompleted = completedSegments.includes(segmentId);

  const handlePress = async () => {
    await markSegmentComplete(segmentId, !isCompleted);
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
          color={isCompleted ? '#4CAF50' : '#CCCCCC'}
        />
      </Pressable>
      <CelebrationPopup 
        visible={showCelebration} 
        onComplete={handleCelebrationComplete}
      />
    </>
  );
}
