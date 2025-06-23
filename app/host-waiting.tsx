import React, { useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGroupReading } from '@/context/GroupReadingContext';
import HostWaitingScreen from '@/components/GroupReading/HostWaitingScreen';
import BibleData from "@/assets/data/newBibleNLT1.json";
import { SegmentType } from '@/types';

// Type assertion for Bible data
const Bible: { [key: string]: SegmentType } = BibleData as { [key: string]: SegmentType };

export default function HostWaitingRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { stopSession, startReading, currentSession } = useGroupReading();
  
  const sessionId = params.sessionId as string;
  const storyId = params.storyId as string;
  const storyTitle = params.storyTitle as string;
  const scriptureReference = params.scriptureReference as string;

  // Use pre-calculated color data from segmentData (same as updated components)
  const storyColorData = useMemo(() => {
    if (!storyId) {
      return { total: 0, black: 0, red: 0, green: 0, blue: 0 };
    }

    const segmentData = Bible[storyId];
    if (!segmentData) {
      return { total: 0, black: 0, red: 0, green: 0, blue: 0 };
    }

    // Use the pre-calculated color data that's based on word counts
    return segmentData.colors || {
      black: 0,
      red: 0,
      green: 0,
      blue: 0,
      total: 0
    };
  }, [storyId]);

  const handleStartReading = async () => {
    try {
      // Start the reading for all participants
      startReading();
      
      // Navigate to the reading screen with group session
      router.replace({
        pathname: '/(tabs)/[segment]' as any,
        params: {
          segment: `en-NLT-${storyId}`,
          groupSession: 'true',
          sessionId: sessionId
        }
      });
    } catch (error) {
      console.error('Error starting group reading:', error);
    }
  };

  const handleEndSession = async () => {
    try {
      await stopSession();
      router.back();
    } catch (error) {
      console.error('Error ending session:', error);
      router.back();
    }
  };

  const handleShowQR = () => {
    router.push({
      pathname: '/qr-share' as any,
      params: {
        sessionId: sessionId,
        storyTitle: storyTitle,
        hostUserName: currentSession?.hostUserName || 'Host'
      }
    });
  };

  return (
    <HostWaitingScreen
      sessionId={sessionId}
      storyTitle={storyTitle}
      scriptureReference={scriptureReference}
      storyColorData={storyColorData}
      onStartReading={handleStartReading}
      onEndSession={handleEndSession}
      onShowQR={handleShowQR}
    />
  );
} 