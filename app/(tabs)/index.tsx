import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native"; // Import useNavigation
import { Link, useRouter } from "expo-router";

const IndexScreen = () => {
  const router = useRouter(); // Initialize the router

  return (
    <View style={styles.container}>
      {/* Placeholder for the background image */}
      <Image
        source={require("../../assets/images/island.jpg")} // Use require for local images
        style={styles.backgroundImage}
      />

      {/* Logo and Text Section */}
      <View style={styles.overlayContent}>
        {/* Placeholder for the logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/icon.png")} // Use require for local images
            style={styles.logo}
          />

          <Text style={styles.title}>SOURCEVIEW</Text>
          <Text style={styles.subtitle}>YOUTH</Text>
        </View>
        {/* Heading */}
        <View style={styles.titleContainer}>
          <Text style={styles.heading}>
            Get ready for a new Bible reading journey!
          </Text>

          {/* Subheading */}
          <Text style={styles.subheading}>
            A Digital Bible Designed For A Digital Generation.
          </Text>

          {/* Button */}
          <Pressable style={styles.button} onPress={() => router.push("/Home")}>
              <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlayContent: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  logoContainer: {
    marginTop: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "#000000", // Add black shadow
    textShadowOffset: { width: 1, height: 1 }, // Offset for the shadow
    textShadowRadius: 1, // Radius of the shadow
  },
  subtitle: {
    fontSize: 28,
    color: "#A7FF00",
    marginBottom: 20,
    textShadowColor: "#000000", // Add black shadow
    textShadowOffset: { width: 1, height: 1 }, // Offset for the shadow
    textShadowRadius: 1, // Radius of the shadow
  },
  titleContainer: {
    marginBottom: 100,
  },
  heading: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "#000000", // Add black shadow
    textShadowOffset: { width: 1, height: 1 }, // Offset for the shadow
    textShadowRadius: 1, // Radius of the shadow
  },
  subheading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#CCCCCC",
    textAlign: "center",
    marginBottom: 30,
    textShadowColor: "#000000", // Add black shadow
    textShadowOffset: { width: 1, height: 1 }, // Offset for the shadow
    textShadowRadius: 1, // Radius of the shadow
  },
  button: {
    backgroundColor: "#FF5733",
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginTop: 50
  },
  buttonText: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default IndexScreen;
