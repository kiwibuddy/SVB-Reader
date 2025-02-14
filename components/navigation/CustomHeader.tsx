import { useRouter } from "expo-router";
import React, { useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import SettingsModal from "./SettingsModal";
import { useFontSize } from '@/context/FontSizeContext';
import { useAppSettings } from '@/context/AppSettingsContext';

const CustomHeader: React.FC = () => {
  const router = useRouter();
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const { sizes } = useFontSize();
  const { colors } = useAppSettings();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderBottomColor: colors.border,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      height: 32,
    },
    iconContainer: {
      padding: 4,
      backgroundColor: colors.background,
    },
    icon: {
      color: colors.text,
    },
    title: {
      color: colors.text,
    },
    subtitle: {
      color: colors.secondary,
    },
  });

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.iconContainer}
          onPress={() => router.push("/About")}
        >
          <Ionicons
            name="information-circle-outline"
            size={24}
            color={styles.icon.color}
          />
        </Pressable>
        
        <Pressable
          style={styles.iconContainer}
          onPress={() => setIsSettingsVisible(true)}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={styles.icon.color}
          />
        </Pressable>
      </View>

      <SettingsModal 
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
      />
    </SafeAreaView>
  );
};

export default CustomHeader;