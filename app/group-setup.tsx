import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGroupReading } from '@/context/GroupReadingContext';
import GroupSetupScreen from '@/components/GroupReading/GroupSetupScreen';

export default function GroupSetupRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { startHostSession } = useGroupReading();
  
  const storyId = params.storyId as string;
  const storyTitle = params.storyTitle as string;
  const scriptureReference = params.scriptureReference as string;
  const planId = params.planId as string;
  const challengeId = params.challengeId as string;

  const handleStartBroadcasting = async (role: any, userName: string) => {
    try {
      const sessionId = await startHostSession(
        storyId,
        storyTitle,
        scriptureReference,
        role,
        userName,
        planId,
        challengeId
      );
      
      // Navigate to the host waiting screen where others can join
      router.replace({
        pathname: '/host-waiting' as any,
        params: {
          sessionId: sessionId,
          storyId: storyId,
          storyTitle: storyTitle,
          scriptureReference: scriptureReference
        }
      });
    } catch (error) {
      console.error('Error starting group session:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <GroupSetupScreen
      storyId={storyId}
      storyTitle={storyTitle}
      scriptureReference={scriptureReference}
      onStartBroadcasting={handleStartBroadcasting}
      onBack={handleBack}
      planId={planId}
      challengeId={challengeId}
    />
  );
} 