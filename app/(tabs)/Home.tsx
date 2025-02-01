//my first edit
import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
  FlatList,
  ImageBackground,
  useWindowDimensions,
  Platform,
  SafeAreaView
} from "react-native";
import Card from "@/components/Card";
import ReadingPlansChallenges from "../../assets/data/ReadingPlansChallenges.json";
import StickyHeader from "../../components/StickyHeader";
import { useAppContext } from "@/context/GlobalContext";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

type SegmentTitle = {
  Segment: string;
  title: string;
  book: string[];
  ref?: string;  // Making ref optional since not all segments have it
}

const segIDs = Object.keys(SegmentTitles);

// Move styles outside component to avoid the reference error
const createStyles = (isLargeScreen: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  continueReading: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  readingInfo: {
    flex: 1,
  },
  readingTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  readingSubtitle: {
    fontSize: 12,
    color: "#666",
    flexDirection: "row",
    alignItems: "center",
  },
  resumeButton: {
    backgroundColor: "#FF5733",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  resumeText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  gridContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
  },
  gridItemContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  gridItemTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  gridItemSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingVertical: 8,
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: "#666",
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
});

const HomeScreen = () => {
  const { 
    activePlan,      // Get active plan
    activeChallenges // Get active challenges
  } = useAppContext();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const styles = createStyles(isLargeScreen);

  // Calculate available plans (excluding SchoolYear2, SchoolYear3, and test plans)
  const getAvailablePlansCount = () => {
    return ReadingPlansChallenges.plans.filter(plan => 
      !['SchoolYear2', 'SchoolYear3', 'test'].includes(plan.id)
    ).length;
  };

  // Calculate available challenges
  const getAvailableChallengesCount = () => {
    return ReadingPlansChallenges.challenges.length;
  };

  // Calculate total active plans/challenges
  const getActivePlansCount = () => {
    const activePlansCount = activePlan ? 1 : 0; // Can only have one active plan
    const activeChallengesCount = Object.values(activeChallenges).filter(
      challenge => challenge && !challenge.isPaused && !challenge.isCompleted
    ).length;
    
    return activePlansCount + activeChallengesCount;
  };

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
          <Text style={styles.welcomeTitle}>Start Your Journey</Text>
          <Text style={styles.welcomeText}>
            Begin your Bible reading adventure by choosing a reading plan or challenge that fits your goals.
          </Text>
        </View>

        <View style={styles.gridContainer}>
          <Pressable 
            style={styles.gridItem}
            onPress={() => router.push("/Plan")}
          >
            <ImageBackground
              source={require("@/assets/images/button1.png")}
              style={styles.gridItemContent}
            >
              <View style={styles.overlay} />
              <Text style={styles.gridItemTitle}>Reading Plans</Text>
              <Text style={styles.gridItemSubtitle}>
                {getAvailablePlansCount()} plans available
              </Text>
            </ImageBackground>
          </Pressable>

          <Pressable 
            style={styles.gridItem}
            onPress={() => router.push("/Reading-Challenges")}
          >
            <ImageBackground
              source={require("@/assets/images/button2.png")}
              style={styles.gridItemContent}
            >
              <View style={styles.overlay} />
              <Text style={styles.gridItemTitle}>Reading Challenges</Text>
              <Text style={styles.gridItemSubtitle}>
                {getAvailableChallengesCount()} challenges available
              </Text>
            </ImageBackground>
          </Pressable>
        </View>

        <View style={styles.continueReading}>
          <View style={styles.readingInfo}>
            <Text style={styles.readingTitle}>Continue Reading</Text>
            <Text style={styles.readingSubtitle}>
              Leviticus 1:1-4:35
              <Ionicons name="book-outline" size={16} color="#666" />
            </Text>
          </View>
          <Pressable style={styles.resumeButton}>
            <Text style={styles.resumeText}>Resume</Text>
          </Pressable>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Stories Read</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{getActivePlansCount()}</Text>
            <Text style={styles.statLabel}>Active Plans</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Add default export
export default HomeScreen;
