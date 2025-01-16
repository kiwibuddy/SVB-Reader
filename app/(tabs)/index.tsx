import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Pressable, useWindowDimensions, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native"; // Import useNavigation
import { Link, useRouter } from "expo-router";
import { Video, ResizeMode } from 'expo-av';

const IndexScreen = () => {
  const router = useRouter(); // Initialize the router
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Replace Platform.isPad checks with this condition
  const isIPad = Platform.OS === 'ios' && Platform.isPad || (Platform.OS === 'ios' && screenHeight / screenWidth < 1.6);

  // Calculate responsive font sizes with a max width cap
  const maxWidth = 550; // Cap the scaling at this width
  const baseFontScale = Math.min(screenWidth / 390, maxWidth / 390); // Limit the scale factor
  const titleSize = Math.round(40 * baseFontScale);
  const subtitleSize = Math.round(38 * baseFontScale);
  
  const textStyles = {
    title: {
      ...styles.title,
      fontSize: titleSize,
    },
    subtitle: {
      ...styles.subtitle,
      fontSize: subtitleSize,
    }
  };

  // Calculate video dimensions to maintain aspect ratio and fill screen
  const videoStyle = {
    width: screenWidth,
    height: screenHeight,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  return (
    <View style={styles.container}>
      {/* Placeholder for the background image */}
      <Video
        source={require("../../assets/images/Welcome-Screen.mp4")}
        style={videoStyle}
        isLooping
        shouldPlay
        resizeMode={ResizeMode.COVER}
        isMuted={true}
      />

      {/* Logo and Text Section */}
      <View style={styles.overlayContent}>
        {/* Placeholder for the logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/icon.png")} // Use require for local images
            style={styles.logo}
          />

          <Text style={textStyles.title}>SOURCEVIEW</Text>
          <Text style={textStyles.subtitle}>YOUTH</Text>
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
    backgroundColor: '#000', // Add black background to prevent white edges
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
    fontSize: 40,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 38,
    fontFamily: "Mistrully",
    color: "#A7FF00",
    marginBottom: 20,
  },
  titleContainer: {
    marginBottom: 50,
  },
  heading: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "left",
    marginBottom: 10,
  },
  subheading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#CCCCCC",
    textAlign: "left",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#FF5733",
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginTop: 10
  },
  buttonText: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default IndexScreen;
