import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import HostWaitingScreen from '@/components/GroupReading/HostWaitingScreen';
import { useGroupReading } from '@/context/GroupReadingContext';
import { useRouter } from 'expo-router';

export default function HostWaitingPage() {
  const { sessionId, storyTitle, scriptureReference, storyColorData } = useLocalSearchParams();
  const { stopSession } = useGroupReading();
  const router = useRouter();

  const parsedColorData = storyColorData ? JSON.parse(storyColorData as string) : {
    total: 0,
    black: 0,
    red: 0,
    green: 0,
    blue: 0,
  };

  const handleStartReading = () => {
    // Navigate to group reading session
  
    router.back();
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