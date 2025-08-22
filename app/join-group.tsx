import React from 'react';
import logger from '@/utils/logger';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGroupReading } from '@/context/GroupReadingContext';
import JoinGroupScreen from '@/components/GroupReading/JoinGroupScreen';

export default function JoinGroupRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { joinSession } = useGroupReading();
  
  const sessionId = params.sessionId as string;
  const storyId = params.storyId as string;
  const storyTitle = params.storyTitle as string;
  const scriptureReference = params.scriptureReference as string;
  const hostUserName = params.hostUserName as string;

  const handleJoinGroup = async (role: any, userName: string) => {
    try {
      logger.info('🔍 Attempting to join session:', { sessionId, role, userName });
      const success = await joinSession(sessionId, role, userName);
      if (success) {
        logger.info('🔍 Successfully joined session');
        router.back();
      } else {
        logger.error('🔍 Failed to join session');
      }
    } catch (error) {
      logger.error('🔍 Error joining session:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <JoinGroupScreen
      sessionId={sessionId}
      storyId={storyId}
      storyTitle={storyTitle}
      scriptureReference={scriptureReference}
      hostUserName={hostUserName}
      onJoinGroup={handleJoinGroup}
      onBack={handleBack}
    />
  );
} 