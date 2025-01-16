import React, { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '@/context/GlobalContext';
import { useRouter } from 'expo-router';
import CelebrationPopup from './CelebrationPopup';
import { getCheckColor } from '@/scripts/getCheckColors';
import { getSegmentProgress, markSegmentProgress } from '@/api/sqlite';

interface CheckCircleProps {
  segmentId: string;
  iconSize?: number;
}

export default function CheckCircle({ segmentId, iconSize = 24 }: CheckCircleProps) {
  const {
    completedSegments,
    markSegmentComplete,
    selectedReaderColor,
    readingPlan,
  } = useAppContext();
  const [progress, setProgress] = useState<any>(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const router = useRouter();
  // const isCompleted = completedSegments[segmentId]?.isCompleted || false;
  const completionColor = completedSegments[segmentId]?.color || null;

  useEffect(() => {
    getSegmentProgress(readingPlan, segmentId).then((progress) => {
      setProgress(progress?.isCompleted);
    });
  }, [readingPlan, segmentId]);

  const handlePress = async () => {
    const color = progress.isCompleted ? null : selectedReaderColor;
    try {
      await markSegmentProgress(readingPlan, segmentId, !progress.isCompleted, color);
    } catch (error) {
      console.error("Error marking segment progress:", error);
    } finally {
      setProgress(!progress?.isCompleted);
      if (!progress.isCompleted) {
        setShowCelebration(true);
      }
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
          name={
            progress.isCompleted
              ? "checkmark-circle"
              : "checkmark-circle-outline"
          }
          size={iconSize}
          color={
            progress.isCompleted
              ? getCheckColor(completionColor)
              : "#CCCCCC"
          }
        />
      </Pressable>
      <CelebrationPopup
        visible={showCelebration}
        onComplete={handleCelebrationComplete}
      />
    </>
  );
}
