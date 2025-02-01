import React from 'react';
import { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import readingPlansData from "../../assets/data/ReadingPlansChallenges.json";
import Accordion, { accordionColor } from "@/components/navigation/NavBook";
import Books from "@/assets/data/BookChapterList.json";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { useAppContext } from "@/context/GlobalContext";
import { StatusIndicator } from '@/components/StatusIndicator';
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';

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
    color: "#4df469"
  },
  "David's Life": {
    color: "#f44d69"
  },
  "Advent Journey": {
    color: "#694df4"
  },
  "Lenten Reflection": {
    color: "#4d9ff4"
  },
  "12 Days of Christmas": {
    color: "#f4b64d"
  },
  "The Gospels": {
    color: "#4dcaf4"
  },
  "The Torah": {
    color: "#9f4df4"
  },
  "In The Beginning": {
    color: "#f4944d"
  },
  "4 Gospels and Acts": {
    color: "#4dcaf4"
  },
  "DTS Outreach": {
    color: "#f4944d"
  }
};

// Add type for challenge titles
type ChallengeTitle = keyof typeof CHALLENGE_STYLES;

// Update the type definition
interface Challenge {
  id: string;
  title: ChallengeTitle;
  description: string;
  longDescription: string;
  image: string;
  highlightText?: string;
  segments: Partial<Record<keyof typeof Books, { segments: string[] }>>;
}

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

interface ChallengesByCategory {
  'Seasonal': Challenge[];
  'Topical': Challenge[];
}

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
  scrollContainer: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    color: '#000000',
  },
  categorySection: {
    marginTop: 16,
    paddingHorizontal: 0,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 16,
    marginBottom: 12,
    color: "#FF9F0A",
  },
  challengeContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFF',
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 0,
    shadowColor: "none",
    shadowOffset: undefined,
    shadowOpacity: 0,
    shadowRadius: 0,
    borderWidth: 0,
  },
  challengeHeader: {
    padding: 16,
  },
  challengeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleContainer: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: '#000000',
    marginBottom: 4,
  },
  segmentCount: {
    color: '#666666',
    fontSize: 14,
  },
  booksContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
});

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

  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const styles = createStyles(isLargeScreen);

  // Move function definitions up
  const getChallengeSegmentCount = (challengeId: string) => {
    const challenge = readingPlansData.challenges.find(c => c.id === challengeId);
    if (!challenge?.segments) return 0;
    
    return Object.values(challenge.segments).reduce(
      (acc, book) => acc + (book?.segments?.filter((s: string) => !s.startsWith('I')).length ?? 0),
      0
    );
  };

  const getChallengeBooksData = (challengeId: string) => {
    const challenge = readingPlansData.challenges.find(c => c.id === challengeId);
    if (!challenge?.segments) return [];
    
    const segments = challenge.segments;
    return Object.entries(segments)
      .filter(([_, bookData]) => bookData?.segments?.length > 0)
      .map(([key, bookData]) => ({
        djhBook: key as keyof typeof Books,
        bookName: Books[key as keyof typeof Books]?.bookName ?? "Unknown Book",
        segments: bookData?.segments || []
      }));
  };

  // Group challenges by status and category
  const organizedChallenges = useMemo(() => {
    const active: Challenge[] = [];
    const categorized = {
      [CHALLENGE_CATEGORIES.SEASONAL]: [] as Challenge[],
      [CHALLENGE_CATEGORIES.TOPICAL]: [] as Challenge[],
    };

    readingPlansData.challenges.forEach(challenge => {
      const isActive = activeChallenges[challenge.id] && !activeChallenges[challenge.id].isPaused;
      
      if (isActive) {
        active.push(challenge as Challenge);
      } else {
        const category = categorizeChallenge(challenge);
        categorized[category].push(challenge as Challenge);
      }
    });

    // Sort non-active challenges within each category
    const sortChallenges = (challenges: Challenge[]) => {
      return challenges.sort((a, b) => {
        const aStatus = activeChallenges[a.id]?.isPaused ? 1 : 2;
        const bStatus = activeChallenges[b.id]?.isPaused ? 1 : 2;
        if (aStatus !== bStatus) return aStatus - bStatus;
        return a.title.localeCompare(b.title);
      });
    };

    categorized[CHALLENGE_CATEGORIES.SEASONAL] = sortChallenges(categorized[CHALLENGE_CATEGORIES.SEASONAL]);
    categorized[CHALLENGE_CATEGORIES.TOPICAL] = sortChallenges(categorized[CHALLENGE_CATEGORIES.TOPICAL]);

    return { active, categorized };
  }, [activeChallenges]);

  const renderChallengeItem = ({ item: challenge }: { item: Challenge }) => {
    const isSelected = selectedChallengeId === challenge.id;
    const isActive = activeChallenges[challenge.id];
    const isPaused = isActive?.isPaused;
    const segmentCount = getChallengeSegmentCount(challenge.id);
    const challengeBooksData = isSelected ? getChallengeBooksData(challenge.id) : [];

    return (
      <View style={styles.challengeContainer}>
        <TouchableOpacity 
          style={styles.challengeHeader}
          onPress={() => setSelectedChallengeId(isSelected ? null : challenge.id)}
        >
          <View style={styles.challengeInfo}>
            <View style={styles.leftContent}>
              <View style={styles.titleContainer}>
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                <Text style={styles.segmentCount}>
                  {segmentCount} {segmentCount === 1 ? 'story' : 'stories'}
                </Text>
              </View>
            </View>
            <View style={styles.rightContent}>
              {!isActive && (
                <TouchableOpacity 
                  onPress={() => startChallenge(challenge.id)}
                >
                  <Feather name="play-circle" size={24} color="#666666" />
                </TouchableOpacity>
              )}
              {isPaused && (
                <TouchableOpacity 
                  onPress={() => resumeChallenge(challenge.id)}
                >
                  <Feather name="play-circle" size={24} color="#666666" />
                </TouchableOpacity>
              )}
              {isActive && !isPaused && (
                <TouchableOpacity 
                  onPress={() => pauseChallenge(challenge.id)}
                >
                  <Feather name="pause-circle" size={24} color="#666666" />
                </TouchableOpacity>
              )}
              <Ionicons 
                name={isSelected ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#666"
              />
            </View>
          </View>
        </TouchableOpacity>

        {isSelected && (
          <View style={styles.booksContainer}>
            <FlatList
              data={challengeBooksData}
              renderItem={({ item }) => {
                const bookIndex = booksArray.findIndex(
                  (book) => book === item.djhBook
                );
                return (
                  <Accordion 
                    item={item} 
                    bookIndex={bookIndex}
                    completedSegments={
                      Object.fromEntries(
                        (activeChallenges[challenge.id]?.completedSegments || []).map(id => [
                          id, 
                          { isCompleted: true, color: null }
                        ])
                      )
                    }
                    onSegmentComplete={handleSegmentComplete}
                    context="challenge"
                    showGlobalCompletion={false}
                    challengeId={challenge.id}
                    style={{ backgroundColor: '#FFF' }}
                  />
                );
              }}
              keyExtractor={(item) => item.djhBook}
            />
          </View>
        )}
      </View>
    );
  };

  const renderCategorySection = (title: string, challenges: Challenge[]) => (
    <View style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{title}</Text>
      <FlatList
        data={challenges}
        renderItem={renderChallengeItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );

  const handleSegmentComplete = (segmentId: string) => {
    // This will be handled by the context's markSegmentComplete function
    // which now handles both global and challenge-specific completions
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (params.scrollToChallenge && scrollViewRef.current && organizedChallenges) {
      const challengeIndex = organizedChallenges.categorized[CHALLENGE_CATEGORIES.SEASONAL].findIndex(
        item => item.id === params.scrollToChallenge
      );
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
  }, [params.scrollToChallenge, params.timestamp, organizedChallenges]);

  // Create sections data for FlatList
  const sections = useMemo(() => {
    const result = [];
    
    if (organizedChallenges.active.length > 0) {
      result.push({
        title: 'Active Challenges',
        data: organizedChallenges.active
      });
    }
    
    result.push({
      title: 'Seasonal Challenges',
      data: organizedChallenges.categorized[CHALLENGE_CATEGORIES.SEASONAL]
    });
    
    result.push({
      title: 'Topical Challenges',
      data: organizedChallenges.categorized[CHALLENGE_CATEGORIES.TOPICAL]
    });
    
    return result;
  }, [organizedChallenges]);

  // Add handleScroll function to match Home.tsx
  const handleScroll = (event: any) => {
    // Implementation of handleScroll function
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={() => (
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Reading Challenges</Text>
            <Text style={styles.welcomeText}>
              Welcome to Bible Reading Challenges, where you can find focused reading challenges to help you dive deep into specific themes and books of the Bible.
            </Text>
          </View>
        )}
        style={styles.content}
        data={sections}
        renderItem={({ item }) => renderCategorySection(item.title, item.data)}
        keyExtractor={(item) => item.title}
        contentContainerStyle={{ paddingTop: 8 }}
      />
    </SafeAreaView>
  );
};

export default ChallengesScreen;
