import React from 'react';
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useSyncAppSettings } from "@/context/SyncAppSettingsContext";
import BottomNavigation from '@/components/navigation/BottomNavigation';

export default function TabLayout() {
  const { colors } = useSyncAppSettings();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            display: 'none'
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.secondary,
        }}
      >
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="Home" options={{ title: "Read" }} />
        <Tabs.Screen name="cast" options={{ title: "Cast" }} />
        <Tabs.Screen name="plan" options={{ title: "Plan" }} />
        <Tabs.Screen name="Reading-emoji" options={{ title: "Saved" }} />
        <Tabs.Screen name="you" options={{ title: "You" }} />
        <Tabs.Screen name="[segment]" options={{ href: null }} />
        <Tabs.Screen name="Navigation" options={{ href: null }} />
        <Tabs.Screen name="ReadingPlans" options={{ href: null }} />
        <Tabs.Screen name="Achievements" options={{ href: null }} />
      </Tabs>
      <BottomNavigation />
    </View>
  );
}
