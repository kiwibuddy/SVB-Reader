import React from 'react';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import QRInfoScreen from '@/components/GroupReading/QRInfoScreen';
import { analytics } from '@/services/analytics';

export default function QRInfoRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const storyTitle = params.storyTitle as string;

  // Track screen view when focused
  useFocusEffect(
    React.useCallback(() => {
      analytics.trackScreen('QR Info');
    }, [])
  );

  const handleClose = () => {
    router.back();
  };

  return (
    <QRInfoScreen
      storyTitle={storyTitle}
      onClose={handleClose}
    />
  );
} 