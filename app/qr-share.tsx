import React from 'react';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useGroupReading } from '@/context/GroupReadingContext';
import QRCodeShareScreen from '@/components/GroupReading/QRCodeShareScreen';
import { analytics } from '@/services/analytics';

export default function QRShareRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentSession, startReading } = useGroupReading();
  
  const sessionId = (params.sessionId as string) || currentSession?.id || '';
  const storyTitle = params.storyTitle as string;
  const hostUserName = params.hostUserName as string;
  const hostRole = params.hostRole as string | undefined;
  const qrCodeData = params.qrCodeData as string;

  // Track screen view when focused
  useFocusEffect(
    React.useCallback(() => {
      analytics.trackScreen('QR Share', { session_id: sessionId });
    }, [sessionId])
  );

  const handleClose = () => {
    router.back();
  };

  const handleStartStory = async () => {
    try {
      await startReading();
    } catch {}
    const segId = (params.storyId as string) || currentSession?.storyId;
    if (segId) {
      router.replace({ pathname: '/[segment]' as any, params: { segment: segId, showCourtesy: '1' } });
    } else {
      router.replace('/');
    }
  };

  return (
    <QRCodeShareScreen
      sessionId={sessionId}
      storyTitle={storyTitle}
      hostUserName={hostUserName}
      hostRole={hostRole as any}
      qrCodeData={qrCodeData}
      onClose={handleClose}
      onStartStory={handleStartStory}
    />
  );
} 