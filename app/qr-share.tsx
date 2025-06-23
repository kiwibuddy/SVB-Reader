import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGroupReading } from '@/context/GroupReadingContext';
import QRCodeShareScreen from '@/components/GroupReading/QRCodeShareScreen';

export default function QRShareRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentSession } = useGroupReading();
  
  const sessionId = params.sessionId as string;
  const storyTitle = params.storyTitle as string;
  const hostUserName = params.hostUserName as string;

  const handleClose = () => {
    router.back();
  };

  return (
    <QRCodeShareScreen
      sessionId={sessionId}
      storyTitle={storyTitle}
      hostUserName={hostUserName}
      onClose={handleClose}
    />
  );
} 