import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRInfoScreen from '@/components/GroupReading/QRInfoScreen';

export default function QRInfoRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const storyTitle = params.storyTitle as string;

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