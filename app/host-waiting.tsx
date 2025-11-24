import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import HostWaitingScreen from '@/components/GroupReading/HostWaitingScreen';
import { useGroupReading } from '@/context/GroupReadingContext';
import { useRouter } from 'expo-router';
import { analytics, trackGroupReading } from '@/services/analytics';

export default function HostWaitingPage() {
  const { sessionId, storyTitle, scriptureReference, storyColorData } = useLocalSearchParams();
  const { stopSession, startReading, currentSession } = useGroupReading();
  const router = useRouter();

  const parsedColorData = storyColorData ? JSON.parse(storyColorData as string) : {
    total: 0,
    black: 0,
    red: 0,
    green: 0,
    blue: 0,
  };

  // Track screen view when focused
  useFocusEffect(
    React.useCallback(() => {
      analytics.trackScreen('Host Waiting', { session_id: sessionId });
    }, [sessionId])
  );

  const handleStartReading = () => {
    // Mark session as reading and navigate to the story screen
    startReading();
    
    // Track analytics
    const participantCount = currentSession?.participants ? Object.keys(currentSession.participants).length : 1;
    trackGroupReading('started', {
      participant_count: participantCount,
      story_id: currentSession?.storyId,
    });
    
    const segId = currentSession?.storyId;
    if (segId) {
      router.push({
        pathname: '/[segment]' as any,
        params: { segment: segId }
      });
    } else {
      router.back();
    }
  };

  const handleEndSession = async () => {
    await stopSession();
    router.back();
  };

  const handleShowQR = () => {
    router.push({
      pathname: '/qr-share' as any,
      params: { sessionId }
    });
  };

  return (
    <View style={styles.container}>
      <HostWaitingScreen
        sessionId={sessionId as string}
        storyTitle={storyTitle as string}
        scriptureReference={scriptureReference as string}
        storyColorData={parsedColorData}
        onStartReading={handleStartReading}
        onEndSession={handleEndSession}
        onShowQR={handleShowQR}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 