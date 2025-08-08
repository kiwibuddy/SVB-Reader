import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGroupReading } from '@/context/GroupReadingContext';
import QRCodeShareScreen from '@/components/GroupReading/QRCodeShareScreen';

export default function QRShareRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentSession, startReading } = useGroupReading();
  
  const sessionId = params.sessionId as string;
  const storyTitle = params.storyTitle as string;
  const hostUserName = params.hostUserName as string;
  const qrCodeData = params.qrCodeData as string;

  const handleClose = () => {
    router.back();
  };

  const handleStartStory = () => {
    startReading();
    const segId = currentSession?.storyId || (params.storyId as string);
    if (segId) {
      router.push({ pathname: '/[segment]' as any, params: { segment: segId } });
    } else {
      router.back();
    }
  };

  return (
    <QRCodeShareScreen
      sessionId={sessionId}
      storyTitle={storyTitle}
      hostUserName={hostUserName}
      qrCodeData={qrCodeData}
      onClose={handleClose}
      onStartStory={handleStartStory}
    />
  );
} 