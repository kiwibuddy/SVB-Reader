import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFirstLaunch } from '@/hooks/useFirstLaunch';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { ThreadColors } from '@/constants/Colors';
import logger from '@/utils/logger';

const IndexScreen = () => {
  const router = useRouter();
  const { needsOnboarding, isLoading, error } = useFirstLaunch();
  const { isDarkMode } = useSyncAppSettings();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;

  useEffect(() => {
    if (isLoading) return;
    if (needsOnboarding && !error) {
      logger.info('🎯 Routing to onboarding');
      router.replace('/onboarding');
      return;
    }
    logger.info('🔄 Returning user, redirecting to Home');
    router.replace('/Home');
  }, [error, isLoading, needsOnboarding, router]);

  return (
    <View style={[styles.boot, { backgroundColor: palette.bg }]}>
      <ActivityIndicator color={palette.acc} />
    </View>
  );
};

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default IndexScreen;
