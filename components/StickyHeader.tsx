import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router"; // Import useRouter

// icon = "book" for navigation page
// icon = "home" for home page
const StickyHeader = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <View style={styles.header}>
        <Pressable
          style={styles.iconContainer}
          onPress={() => router.push("/Home")}
        >
          <Ionicons
            name={pathname === "/Home" ? "home" : "home-outline"}
            size={24}
            color="#000000"
          />
        </Pressable>
        <Pressable
          style={styles.iconContainer}
          onPress={() => router.push("/Navigation")}
        >
          <Ionicons
            name={pathname === "/Navigation" ? "book" : "book-outline"}
            size={24}
            color="#000000"
          />
        </Pressable>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    // height: 60,
    backgroundColor: "rgba(0, 0, 0, 0)", // Transparent background
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    zIndex: 1000, // Ensure it stays on top
  },
  iconContainer: {
    backgroundColor: "#FFF",
    padding: 10,
    borderWidth: 1, // Add border width
    borderColor: "#000000", // Set border color
    borderRadius: 25, // Make it circular
    margin:10
  },
});

export default StickyHeader;
