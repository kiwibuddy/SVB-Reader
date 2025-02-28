import React from 'react';
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useAppSettings } from "@/context/AppSettingsContext";
import { MaterialIcons } from '@expo/vector-icons';

import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import BottomNavigation from '@/components/navigation/BottomNavigation';

export default function TabLayout() {
  const { isDarkMode, colors } = useAppSettings();

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
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="Home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="Reading-emoji"
          options={{
            title: "Emojis",
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="Reading-Challenges"
          options={{
            title: "Challenges",
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="Plan"
          options={{
            title: "Plans",
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="[segment]/index"
          options={{
            title: "Bible",
            tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
          }}
        />
        <Tabs.Screen
          name="Achievements"
          options={{
            title: 'Achievements',
            headerTitle: 'Your Achievements',
            tabBarLabel: 'Achievements',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="emoji-events" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <BottomNavigation />
    </View>
  );
}
