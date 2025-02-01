import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, SafeAreaView, useWindowDimensions } from "react-native";
import { router, useRouter } from "expo-router";

const createStyles = (isLargeScreen: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    lineHeight: 24,
  },
  stickyButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 5,
    backgroundColor: "transparent",
    marginHorizontal: 10,
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#FF5733",
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
  },
  sectionImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginVertical: 15,
  },
});

const ReadingPlan = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const styles = createStyles(isLargeScreen);

  const handleScroll = (event: any) => {
    // Implementation of handleScroll function
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>How to Start Your Bible Reading Group</Text>
          <Text style={styles.welcomeText}>
            Start a Bible Movement - Find 3 Friends • Pick Your Role • Read Together
          </Text>
        </View>

        <Image
          source={require("../../assets/images/Movement-1.png")}
          style={styles.sectionImage}
          resizeMode="cover"
        />

        <Text style={styles.sectionTitle}>1. Gather Your Friends 👥</Text>
        <Text style={styles.sectionText}>
          Invite 3 other friends or classmates. Each pick one of the 4 voices/roles for the story each day: narrator, main character, God/Jesus, or other speaking parts.
        </Text>
        <Image
          source={require("../../assets/images/Movement-2.webp")}
          style={styles.sectionImage}
          resizeMode="cover"
        />

        <Text style={styles.sectionTitle}>2. Plan When ⏰</Text>
        <Text style={styles.sectionText}>
          Pick a time in your day that you can meet each day. 15 min plus discussion is all you need to keep up with the reading plan.
        </Text>
        <Image
          source={require("../../assets/images/Movement-3.webp")}
          style={styles.sectionImage}
          resizeMode="cover"
        />

        <Text style={styles.sectionTitle}>3. Pick Where 📍</Text>
        <Text style={styles.sectionText}>
          Consider school, cafes, parks, or homes. Look for comfortable seating and minimal noise. Remember - snacks are always a good idea!
        </Text>
        <Image
          source={require("../../assets/images/Movement-4.webp")}
          style={styles.sectionImage}
          resizeMode="cover"
        />

        <Text style={styles.sectionTitle}>4. Start Reading 📖</Text>
        <Text style={styles.sectionText}>
          Open the app and select a passage. Assign roles by tapping to choose your character. Take turns reading your highlighted parts.
        </Text>
        <Image
          source={require("../../assets/images/Movement-5.webp")}
          style={styles.sectionImage}
          resizeMode="cover"
        />

        <Text style={styles.sectionTitle}>5. Discuss and React 💭</Text>
        <Text style={styles.sectionText}>
          Use emoji reactions for memorable verses. Share what stands out to you. Create a judgment-free zone for open discussion.
        </Text>
        <Image
          source={require("@/assets/images/button1.png")}
          style={styles.sectionImage}
          resizeMode="cover"
        />

        <Text style={styles.sectionTitle}>6. Keep the Momentum 🔄</Text>
        <Text style={styles.sectionText}>
          Plan your next meeting before leaving. Invite interested friends to join. Share meaningful moments with group consent.
        </Text>
        <Image
          source={require("@/assets/images/button1.png")}
          style={styles.sectionImage}
          resizeMode="cover"
        />

        <Text style={styles.sectionTitle}>Ready to Begin? 🙏</Text>
        <Text style={styles.sectionText}>
          Remember: It's about connecting with each other and exploring God's Word together. Keep it authentic and enjoyable!
        </Text>
        <Image
          source={require("@/assets/images/button1.png")}
          style={styles.sectionImage}
          resizeMode="cover"
        />
      </ScrollView>

      <View style={styles.stickyButtonContainer}>
        <Pressable
          style={styles.button}
          onPress={() => router.push("/Plan")}
        >
          <Text style={styles.buttonText}>Start Reading Plan</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default ReadingPlan;
