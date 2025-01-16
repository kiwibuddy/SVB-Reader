import { useSegments, useRouter, usePathname } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useAppContext } from "@/context/GlobalContext";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { SegmentTitleData } from "@/types";
import BookData from "@/assets/data/BookChapterList.json";
import { Ionicons } from "@expo/vector-icons";

// Define a type for the keys of BookData
type BookKeys = keyof typeof BookData;

const CustomHeader: React.FC = () => {

  const router = useRouter();
  const pathname = usePathname();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{
        paddingBottom: 10,
        backgroundColor: "#FFF",
      }}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.iconContainer}
          onPress={() => router.push("/(tabs)/about")}
        >
          {pathname === "/Home" ? (
            <Ionicons
              name="help-outline"
              size={24}
              color="#000000"
            />
          ) : (
            <Ionicons
              name="home-outline"
              size={24}
              color="#000000"
            />
          )}
        </Pressable>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
        />
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
    </SafeAreaView>
  );
};

export default CustomHeader;



const styles = StyleSheet.create({
  header: {
    // position: "absolute",
    // top: 50,
    // left: 0,
    // right: 0,
    // height: 60,
    // backgroundColor: "rgba(0, 0, 0, 0)", // Transparent background
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    // zIndex: 1000, // Ensure it stays on top
  },
  iconContainer: {
    backgroundColor: "#FFF",
    padding: 10,
    borderWidth: 1, // Add border width
    borderColor: "#000000", // Set border color
    borderRadius: 25, // Make it circular
    margin: 5,
  },
  logo: {
    width: 40,
    height: 40,
    alignSelf: "center",
    // marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});