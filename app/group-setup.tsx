import React from 'react';
import logger from '@/utils/logger';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import GroupSetupScreen from '@/components/GroupReading/GroupSetupScreen';
import { useGroupReading } from '@/context/GroupReadingContext';
import { Role } from '@/types';

export default function GroupSetupPage() {
  const { storyId, storyTitle, scriptureReference, planId, challengeId } = useLocalSearchParams();
  const { startHostSession } = useGroupReading();
  const router = useRouter();

  const handleStartBroadcasting = async (role: Role, userName: string) => {
    try {
      const session = await startHostSession(
        storyId as string,
        storyTitle as string,
        scriptureReference as string,
        role,
        userName,
        planId as string | undefined,
        challengeId as string | undefined
      );

      // Navigate to host waiting screen
      router.replace({
        pathname: '/host-waiting' as any,
        params: {
          sessionId: session.id,
          storyTitle,
          scriptureReference,
          storyColorData: JSON.stringify({
            total: 0, // Will be calculated in the component
            black: 0,
            red: 0,
            green: 0,
            blue: 0,
          })
        }
      });
    } catch (error) {
      logger.error('Error starting broadcast:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <GroupSetupScreen
        storyId={storyId as string}
        storyTitle={storyTitle as string}
        scriptureReference={scriptureReference as string}
        onStartBroadcasting={handleStartBroadcasting}
        onBack={handleBack}
        planId={planId as string | undefined}
        challengeId={challengeId as string | undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 