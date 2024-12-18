import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import readingPlansData from "../../assets/data/ReadingPlansChallenges.json";
import Accordion, { accordionColor } from "@/components/navigation/NavBook";
import Books from "@/assets/data/BookChapterList.json";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { useAppContext } from "@/context/GlobalContext";

// Add categories for challenges
const CHALLENGE_CATEGORIES = {
  SEASONAL: 'Seasonal',
  TOPICAL: 'Topical'
};

// Helper function to categorize challenges
const categorizeChallenge = (challenge: any) => {
    const seasonalTitles = ['Advent Journey', 'Lenten Reflection', '12 Days of Christmas'];
    const topicalTitles = ["Paul's Letters", "David's Life", "The Gospels", "The Torah", "In The Beginning"];
    return seasonalTitles.includes(challenge.title) ? CHALLENGE_CATEGORIES.SEASONAL : CHALLENGE_CATEGORIES.TOPICAL;
  };

// Add at the top of the file
const CHALLENGE_STYLES = {
  "Paul's Letters": {
    color: "#4df469", // Complementary green
    icon: "✉️"
  },
  "David's Life": {
    color: "#f44d69", // Original red-pink
    icon: "👑"
  },
  "Advent Journey": {
    color: "#694df4", // Complementary purple
    icon: "⭐"
  },
  "Lenten Reflection": {
    color: "#4d9ff4", // Complementary blue
    icon: "✝️"
  },
  "12 Days of Christmas": {
    color: "#f4b64d", // Complementary orange
    icon: "🎄"
  },
  "The Gospels": {
    color: "#4dcaf4", // Light blue
    icon: "📖"
  },
  "The Torah": {
    color: "#9f4df4", // Purple
    icon: "📜"
  },
  "In The Beginning": {
    color: "#f4944d", // Orange
    icon: "🌟"
  },
  "4 Gospels and Acts": {
    color: "#4dcaf4",
    icon: "📖"
  },
  "DTS Outreach": {
    color: "#f4944d",
    icon: "🌟"
  }
};

// Add type for challenge titles
type ChallengeTitle = keyof typeof CHALLENGE_STYLES;

// Update the type definition
type Challenge = {
  id: string;
  title: ChallengeTitle;
  description: string;
  image: string;
  longDescription: string;
  highlightText?: string;
  segments: {
    [key: string]: {
      segments: string[];
    };
  };
};

const booksArray = Object.keys(Books);

export type SegmentKey = keyof typeof SegmentTitles;
export type SegmentIds = keyof typeof Books;

interface AppContextType {
  readingPlanProgress: {
    [key: string]: {
      completedSegments: string[];
      isCompleted: boolean;
    };
  };
  updateReadingPlanProgress: (planId: string, segmentId: string) => void;
  startReadingPlan: (planId: string) => void;
}

const ChallengesScreen = () => {
  const { readingPlanProgress, updateReadingPlanProgress, startReadingPlan } = useAppContext();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge>(() => {
    const challenges = readingPlansData.challenges;
    const validChallenge = challenges.find(challenge => 
      challenge.segments && Object.keys(challenge.segments).length > 0
    ) as unknown as Challenge;
    return validChallenge || challenges[0] as unknown as Challenge;
  });

  const currentProgress = selectedChallenge.id ? readingPlanProgress[selectedChallenge.id] : undefined;

  const handleChallengeSelection = (challenge: any) => {
    setSelectedChallenge(challenge as Challenge);
    if (challenge.id && !readingPlanProgress[challenge.id]) {
      startReadingPlan(challenge.id);
    }
  };

  const handleSegmentComplete = (segmentId: string) => {
    if (selectedChallenge.id) {
      updateReadingPlanProgress(selectedChallenge.id, segmentId);
    }
  };

  const challengeBooksData = useMemo(() => {
    console.log('Selected Challenge in useMemo:', selectedChallenge);
    console.log('Selected Challenge segments:', selectedChallenge?.segments);
    
    if (!selectedChallenge?.segments) {
      console.log('No segments for challenge:', selectedChallenge?.title);
      return [];
    }

    console.log('Selected Challenge:', selectedChallenge.title);
    const data = Object.keys(selectedChallenge.segments).map((key) => ({
      djhBook: key as keyof typeof accordionColor,
      bookName: Books[key as SegmentIds]?.bookName ?? "Unknown Book",
      segments: (selectedChallenge.segments[key as SegmentIds]?.segments ?? []) as SegmentKey[],
    }));
    console.log('Processed Books Data:', data);
    return data;
  }, [selectedChallenge]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.screenTitle}>Reading Challenges</Text>
          <Text style={styles.welcomeText}>
            Welcome to Bible Reading Challenges, where you can find focused reading challenges to help you dive deep into specific themes and books of the Bible.
          </Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.challengesScrollView}
        >
          {readingPlansData.challenges.map((challenge, index) => (
            <TouchableOpacity
              key={challenge.id || index}
              style={[
                styles.challengeButton,
                {
                  backgroundColor: CHALLENGE_STYLES[challenge.title as ChallengeTitle]?.color || "#f4694d",
                },
                selectedChallenge.id === challenge.id && {
                  transform: [{ scale: 1.02 }],
                  elevation: 5,
                }
              ]}
              onPress={() => handleChallengeSelection(challenge)}
            >
              <View style={styles.challengeContent}>
                <Text style={styles.challengeIcon}>
                  {CHALLENGE_STYLES[challenge.title as ChallengeTitle]?.icon}
                </Text>
                <Text style={styles.challengeButtonText}>
                  {challenge.title}
                </Text>
                <Text style={styles.challengeDescription}>
                  {challenge.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.divider} />

        <View style={styles.selectedChallengeContainer}>
          <Text style={styles.selectedChallengeTitle}>{selectedChallenge.title}</Text>
          <Text style={styles.challengeContext}>
            {selectedChallenge.longDescription}
          </Text>

          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Progress: {currentProgress?.completedSegments?.length || 0} / 
              {selectedChallenge.segments ? 
                Object.values(selectedChallenge.segments).reduce(
                  (acc, book) => acc + (book.segments?.length || 0), 
                  0
                ) : 0} segments
            </Text>
            {currentProgress?.isCompleted && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>Completed!</Text>
              </View>
            )}
          </View>
        </View>

        {challengeBooksData.length > 0 ? (
          <View style={styles.booksContainer}>
            {challengeBooksData.map((item) => {
              const bookIndex = booksArray.findIndex(
                (book) => book === item.djhBook
              );
              return (
                <Accordion 
                  key={item.djhBook} 
                  item={item} 
                  bookIndex={bookIndex}
                  completedSegments={currentProgress?.completedSegments || []}
                  onSegmentComplete={handleSegmentComplete}
                />
              );
            })}
          </View>
        ) : (
          <Text style={styles.noSegmentsText}>
            This challenge is coming soon! Check back later for reading segments.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const additionalStyles = StyleSheet.create({
  progressContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 16,
    color: '#666666',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  booksContainer: {
    paddingBottom: 16,
  },
  noSegmentsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    padding: 20,
    fontStyle: 'italic'
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flex: 1,
  },
  headerContainer: {
    padding: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 12,
  },
  challengesScrollView: {
    paddingHorizontal: 16,
  },
  challengeButton: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 200,
    height: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedChallengeButton: {
    backgroundColor: "#8A4FFF",
  },
  challengeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  selectedChallengeText: {
    color: "#FFFFFF",
  },
  challengeDescription: {
    fontSize: 13,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 16,
  },
  highlightText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
    opacity: 0.95,
    position: 'absolute',
    bottom: 12,
    left: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 16,
  },
  selectedChallengeContainer: {
    padding: 16,
  },
  selectedChallengeTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  selectedChallengeDescription: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
    marginBottom: 12,
    color: "#333333",
  },
  challengeInfo: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
    lineHeight: 20,
  },
  challengeIcon: {
    fontSize: 40,
    height: 60,
    width: 60,
    textAlign: 'center',
    lineHeight: 60,
    marginBottom: 12,
  },
  challengeContent: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  challengeContext: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
  },
  ...additionalStyles,
});

export default ChallengesScreen;
