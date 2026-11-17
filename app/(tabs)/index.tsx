import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFirstLaunch } from '@/hooks/useFirstLaunch';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { ThreadColors } from '@/constants/Colors';
import logger from '@/utils/logger';
import { takeAfterReloadRoute } from '@/utils/otaUpdates';
import { safeAfterReloadRoute } from '@/utils/otaPolicy';

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
    let alive = true;
    // After an update reload, land where the reader was heading.
    void takeAfterReloadRoute().then((saved) => {
      if (!alive) return;
      const route = safeAfterReloadRoute(saved) || '/Home';
      logger.info(`🔄 Returning user, redirecting to ${route}`);
      router.replace(route as never);
    });
    return () => {
      alive = false;
    };
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
