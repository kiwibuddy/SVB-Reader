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
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  completeButton: {
    backgroundColor: '#4CAF50', // Green color for complete button
  },
  nextButton: {
    backgroundColor: '#2196F3', // Blue color for next button
  },
});

// Add this near other type definitions
type ContinueReadingProps = {
  lastReadSegment: string | null;
  onPress: () => void;
};

const ContinueReadingSection = ({ lastReadSegment, onPress }: ContinueReadingProps) => {
  const { completedSegments, markSegmentComplete, updateSegmentId } = useAppContext();
  const router = useRouter();
  const styles = createStyles(false);
  
  if (!lastReadSegment) {
    return (
      <View style={styles.continueReading}>
        <View style={styles.readingInfo}>
          <Text style={styles.readingTitle}>Jump Right In</Text>
          <Text style={styles.readingSubtitle}>
            Begin your reading journey with Genesis
          </Text>
        </View>
        <Pressable style={styles.resumeButton} onPress={onPress}>
          <Text style={styles.resumeText}>Start</Text>
        </Pressable>
      </View>
    );
  }

  const isLastSegmentCompleted = completedSegments[lastReadSegment]?.isCompleted;
  const currentIndex = segIDs.indexOf(lastReadSegment);
  let nextSegment = segIDs[currentIndex + 1];
  
  // Skip any introduction segments
  while (nextSegment && nextSegment.startsWith('I')) {
    const skipIndex = segIDs.indexOf(nextSegment);
    nextSegment = segIDs[skipIndex + 1];
  }

  const currentSegmentData = SegmentTitles[lastReadSegment as keyof typeof SegmentTitles];
  const nextSegmentData = nextSegment ? SegmentTitles[nextSegment as keyof typeof SegmentTitles] : null;

  const handleComplete = async () => {
    // Navigate back to the last segment
    await updateSegmentId(`ENG-NLT-${lastReadSegment}`);
    const segment = SegmentTitles[lastReadSegment as keyof typeof SegmentTitles];
    router.push({
      pathname: "/[segment]",
      params: {
        segment: `ENG-NLT-${lastReadSegment}`,
        book: segment?.book[0] || ''
      }
    });
  };

  return (
    <View style={styles.continueReading}>
      <View style={styles.readingInfo}>
        <Text style={styles.readingTitle}>
          {isLastSegmentCompleted ? 'Continue Reading' : 'Resume Reading'}
        </Text>
        <Text style={styles.readingSubtitle}>
          {isLastSegmentCompleted 
            ? `Next: ${nextSegmentData?.title}`
            : `Complete: ${currentSegmentData?.title}`}
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        {!isLastSegmentCompleted && (
          <Pressable 
            style={[styles.resumeButton, styles.completeButton]}
            onPress={handleComplete}
          >
            <Text style={styles.resumeText}>Complete</Text>
          </Pressable>
        )}
        <Pressable 
          style={[styles.resumeButton, isLastSegmentCompleted ? {} : styles.nextButton]}
          onPress={onPress}
        >
          <Text style={styles.resumeText}>
            {isLastSegmentCompleted ? 'Next' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const HomeScreen = () => {
  const { 
    activePlan,
    activeChallenges,
    lastReadSegment,
    setLastReadSegment,
    completedSegments,
    updateSegmentId,
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

  // Calculate total completed segments
  const getCompletedStoriesCount = () => {
    return Object.values(completedSegments).filter(segment => segment.isCompleted).length;
  };

  const handleScroll = (event: any) => {
    // Implementation of handleScroll function
  };

  const handleContinueReading = async () => {
    if (!lastReadSegment) {
      // For new users, start with the first story segment (S001) in Genesis
      await setLastReadSegment('S001');
      await updateSegmentId(`ENG-NLT-S001`);
      router.push({
        pathname: "/[segment]",
        params: {
          segment: `ENG-NLT-S001`,
          book: 'Gen'
        }
      });
      return;
    }

    const currentIndex = segIDs.indexOf(lastReadSegment);
    let nextSegment = segIDs[currentIndex + 1];
    
    // Skip any introduction segments
    while (nextSegment && nextSegment.startsWith('I')) {
      const skipIndex = segIDs.indexOf(nextSegment);
      nextSegment = segIDs[skipIndex + 1];
    }

    if (nextSegment) {
      // If there's a next segment, go to it
      await setLastReadSegment(nextSegment);
      await updateSegmentId(`ENG-NLT-${nextSegment}`);
      const segment = SegmentTitles[nextSegment as keyof typeof SegmentTitles];
      router.push({
        pathname: "/[segment]",
        params: {
          segment: `ENG-NLT-${nextSegment}`,
          book: segment?.book[0] || ''
        }
      });
    } else {
      // If no next segment (or at the end), resume the last segment
      await updateSegmentId(`ENG-NLT-${lastReadSegment}`);
      const segment = SegmentTitles[lastReadSegment as keyof typeof SegmentTitles];
      router.push({
        pathname: "/[segment]",
        params: {
          segment: `ENG-NLT-${lastReadSegment}`,
          book: segment?.book[0] || ''
        }
      });
    }
  };

  const handleComplete = async () => {
    await updateSegmentId(`ENG-NLT-${lastReadSegment}`);
    const segment = SegmentTitles[lastReadSegment as keyof typeof SegmentTitles];
    router.push({
      pathname: "/[segment]",
      params: {
        segment: `ENG-NLT-${lastReadSegment}`,
        book: segment?.book[0] || ''
      }
    });
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

        <ContinueReadingSection 
          lastReadSegment={lastReadSegment}
          onPress={handleContinueReading}
        />

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{getCompletedStoriesCount()}</Text>
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
