import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import readingPlansData from "../../assets/data/ReadingPlansChallenges.json";
import Accordion, { accordionColor } from "@/components/navigation/NavBook";
import Books from "@/assets/data/BookChapterList.json";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { useAppContext } from "@/context/GlobalContext";
import { StatusIndicator } from '@/components/StatusIndicator';
import { useRouter, useLocalSearchParams } from "expo-router";

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
  activeChallenges: {
    [key: string]: {
      completedSegments: string[];
      isCompleted: boolean;
      isPaused: boolean;
    };
  };
  startChallenge: (challengeId: string) => void;
  pauseChallenge: (challengeId: string) => void;
  resumeChallenge: (challengeId: string) => void;
  restartChallenge: (challengeId: string) => void;
}

interface BookSegments {
  segments: string[];
}

const ChallengesScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { 
    activeChallenges,
    startChallenge,
    pauseChallenge,
    resumeChallenge,
    restartChallenge
  } = useAppContext();

  const [selectedChallenge, setSelectedChallenge] = useState<Challenge>(() => {
    const challenges = readingPlansData.challenges;
    const validChallenge = challenges.find(challenge => 
      challenge.segments && Object.keys(challenge.segments).length > 0
    ) as unknown as Challenge;
    return validChallenge || challenges[0] as unknown as Challenge;
  });

  const getChallengeStatus = (challengeId: string) => {
    const challenge = activeChallenges[challengeId];
    if (!challenge) return 'not-started';
    if (challenge.isCompleted) return 'completed';
    return challenge.isPaused ? 'paused' : 'active';
  };

  const handleChallengeSelection = (challenge: any) => {
    setSelectedChallenge(challenge as Challenge);
  };

  const handleSegmentComplete = (segmentId: string) => {
    // This will be handled by the context's markSegmentComplete function
    // which now handles both global and challenge-specific completions
  };

  const renderChallengeControls = () => {
    const challenge = activeChallenges[selectedChallenge.id];
    
    if (!challenge) {
      return (
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => startChallenge(selectedChallenge.id)}
        >
          <Text style={styles.controlButtonText}>Start Challenge</Text>
        </TouchableOpacity>
      );
    }

    if (challenge.isPaused) {
      return (
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => resumeChallenge(selectedChallenge.id)}
          >
            <Text style={styles.controlButtonText}>Resume Challenge</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, styles.restartButton]}
            onPress={() => {
              Alert.alert(
                'Restart Challenge?',
                'Are you sure you want to restart this challenge? Your progress will be reset.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Restart',
                    onPress: () => restartChallenge(selectedChallenge.id)
                  }
                ]
              );
            }}
          >
            <Text style={styles.controlButtonText}>Restart Challenge</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.controlButton, styles.pauseButton]}
        onPress={() => pauseChallenge(selectedChallenge.id)}
      >
        <Text style={styles.controlButtonText}>Pause Challenge</Text>
      </TouchableOpacity>
    );
  };

  const challengeBooksData = useMemo(() => {
    if (!selectedChallenge?.segments) {
      return [];
    }

    return Object.keys(selectedChallenge.segments).map((key) => ({
      djhBook: key as keyof typeof accordionColor,
      bookName: Books[key as SegmentIds]?.bookName ?? "Unknown Book",
      segments: (selectedChallenge.segments[key as SegmentIds]?.segments ?? []) as SegmentKey[],
    }));
  }, [selectedChallenge]);

  const handlePress = (segmentId: string) => {
    router.push({
      pathname: `/${segmentId}`,
      query: {
        showGlobalCompletion: 'false',
        challengeId: selectedChallenge.id
      }
    } as any);
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (params.scrollToChallenge && scrollViewRef.current && challengeBooksData) {
      const challengeIndex = challengeBooksData.findIndex(item => item.djhBook === params.scrollToChallenge);
      if (challengeIndex !== -1) {
        const headerOffset = 200;
        const itemHeight = 150;
        const scrollPosition = headerOffset + (challengeIndex * itemHeight);
        
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: scrollPosition,
            animated: true
          });
        }, 100);
      }
    }
  }, [params.scrollToChallenge, params.timestamp, challengeBooksData]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingTop: 8 }}
        onContentSizeChange={(w, h) => setContentHeight(h)}
        onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.screenTitle}>Reading Challenges</Text>
          <Text style={styles.welcomeText}>
            Welcome to Bible Reading Challenges, where you can find focused reading challenges to help you dive deep into specific themes and books of the Bible.
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.challengesScrollView}>
          {readingPlansData.challenges.map((challenge) => (
            <TouchableOpacity
              key={challenge.id}
              style={[
                styles.challengeButton,
                {
                  backgroundColor: CHALLENGE_STYLES[challenge.title as ChallengeTitle]?.color || "#f4694d",
                },
                selectedChallenge.id === challenge.id && styles.selectedChallengeButton
              ]}
              onPress={() => handleChallengeSelection(challenge)}
            >
              <StatusIndicator status={getChallengeStatus(challenge.id)} />
              <View style={styles.challengeContent}>
                <Text style={styles.challengeIcon}>
                  {CHALLENGE_STYLES[challenge.title as ChallengeTitle]?.icon}
                </Text>
                <Text style={styles.challengeButtonText}>{challenge.title}</Text>
                <Text style={styles.challengeDescription}>{challenge.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.divider} />

        <View style={styles.selectedChallengeContainer}>
          <Text style={styles.selectedChallengeTitle}>{selectedChallenge.title}</Text>
          <Text style={styles.challengeContext}>{selectedChallenge.longDescription}</Text>

          {renderChallengeControls()}

          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Progress: {
                activeChallenges[selectedChallenge.id]?.completedSegments.length || 0
              } / {
                Object.values(selectedChallenge.segments).reduce(
                  (acc: number, book: BookSegments) => 
                    acc + book.segments.filter((s: string) => !s.startsWith('I')).length,
                  0
                )
              } segments
            </Text>
            {activeChallenges[selectedChallenge.id]?.isCompleted && (
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
                  completedSegments={
                    activeChallenges[selectedChallenge.id]?.completedSegments.reduce((acc, segmentId) => ({
                      ...acc,
                      [segmentId]: { isCompleted: true, color: null }
                    }), {}) || {}
                  }
                  onSegmentComplete={handleSegmentComplete}
                  context="challenge"
                  showGlobalCompletion={false}
                  challengeId={selectedChallenge.id}
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
  controlButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 16,
    alignSelf: 'center',
  },
  pauseButton: {
    backgroundColor: '#FFA000',
  },
  restartButton: {
    backgroundColor: '#F44336',
    marginLeft: 8,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
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
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8, // Reduced from 12
  },
  welcomeText: {
    fontSize: 14, // Reduced from 16
    color: "#666666",
    lineHeight: 20, // Reduced from 24
    marginBottom: 16, // Reduced from 24
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 12,
  },
  challengesScrollView: {
    paddingHorizontal: 16,
    marginBottom: 8, // Added to reduce space before divider
  },
  challengeButton: {
    padding: 12, // Reduced from 16
    borderRadius: 12,
    marginRight: 12,
    width: 180, // Reduced from 200
    height: 140, // Reduced from 160
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedChallengeButton: {
    transform: [{ scale: 1.02 }],
    elevation: 5,
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
    marginVertical: 8, // Reduced from 16
  },
  selectedChallengeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8, // Reduced from 16
  },
  selectedChallengeTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4, // Reduced spacing
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
    fontSize: 32, // Reduced from 40
    height: 40, // Reduced from 60
    width: 40, // Reduced from 60
    textAlign: 'center',
    lineHeight: 40, // Reduced from 60
    marginBottom: 8, // Reduced from 12
  },
  challengeContent: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    paddingVertical: 4, // Added to reduce internal spacing
  },
  challengeContext: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
  },
  ...additionalStyles,
});

export default ChallengesScreen;
