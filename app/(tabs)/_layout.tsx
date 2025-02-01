import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import BottomNavigation from '@/components/navigation/BottomNavigation';

export default function TabLayout() {
  const colorScheme = "light"

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          tabBarStyle: {
            display: 'none'
          }
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
      </Tabs>
      <BottomNavigation />
    </View>
  );
}
