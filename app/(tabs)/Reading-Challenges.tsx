import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  useWindowDimensions,
  Pressable,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';
import readingPlansData from "../../assets/data/ReadingPlansChallenges.json";
import Accordion, { accordionColor } from "@/components/navigation/NavBook";
import Books from "@/assets/data/BookChapterList.json";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { useAppContext } from "@/context/GlobalContext";
import { StatusIndicator } from '@/components/StatusIndicator';
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';
import { getSegmentCompletionStatus, unlockAchievement } from '@/api/sqlite';
import ReadingModeModal from '@/components/GroupReading/ReadingModeModal';
import BibleData from '@/assets/data/newBibleNLT1.json';

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
  updateChallengeProgress: (challengeId: string, segmentId: string) => void;
}

interface BookSegments {
  segments: string[];
}

interface ChallengesByCategory {
  'Seasonal': Challenge[];
  'Topical': Challenge[];
}

const createStyles = (isLargeScreen: boolean, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.secondary,
    lineHeight: 22,
  },
  scrollContainer: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
    color: colors.text,
  },
  categorySection: {
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
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
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
    color: colors.text,
    marginBottom: 4,
  },
  segmentCount: {
    color: colors.secondary,
    fontSize: 14,
  },
  booksContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
});

const ChallengesScreen = () => {
  const { 
    activeChallenges, 
    startChallenge, 
    pauseChallenge, 
    resumeChallenge, 
    restartChallenge,
    updateChallengeProgress,
    updateSegmentId
  } = useAppContext();

  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { colors } = useAppSettings();
  const styles = createStyles(isLargeScreen, colors);

  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [challengeProgress, setChallengeProgress] = useState<Record<string, string[]>>({});
  
  // Reading Mode Modal State
  const [showReadingModeModal, setShowReadingModeModal] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [selectedSegmentTitle, setSelectedSegmentTitle] = useState<string>('');
  const [selectedSegmentRef, setSelectedSegmentRef] = useState<string>('');

  // Load challenge progress when component mounts
  useEffect(() => {
    loadChallengeProgress();
  }, []);

  // Refresh when returning from reading a segment
  useFocusEffect(
    React.useCallback(() => {
      loadChallengeProgress();
    }, [])
  );

  const loadChallengeProgress = async () => {
    const progress: Record<string, string[]> = {};
    
    // Load progress for each challenge
    for (const challenge of readingPlansData.challenges) {
      const completedSegments: string[] = [];
      
      // Check completion status for each segment
      for (const [bookKey, bookData] of Object.entries(challenge.segments)) {
        if (bookData?.segments) {
          for (const segmentId of bookData.segments) {
            const status = await getSegmentCompletionStatus(
              segmentId,
              'challenge',
              undefined,
              challenge.id
            );
            if (status.isCompleted) {
              completedSegments.push(segmentId);
            }
          }
        }
      }
      
      progress[challenge.id] = completedSegments;
    }
    
    setChallengeProgress(progress);
  };

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
    const completedSegments = challengeProgress[challenge.id] || [];

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
            {challengeBooksData.map((item) => {
              const bookIndex = booksArray.findIndex(
                (book) => book === item.djhBook
              );
              // Use the challenge-specific completion status
              const completedSegmentsMap = completedSegments.reduce((acc, id) => {
                acc[id] = true;
                return acc;
              }, {} as Record<string, boolean>);
              return (
                <Accordion 
                  key={completedSegments.join(',') + '-' + item.djhBook}
                  item={item} 
                  bookIndex={bookIndex}
                  onSegmentComplete={(segmentId) => handleSegmentComplete(challenge.id, segmentId)}
                  onSegmentSelect={handleSegmentSelect}
                  context="challenge"
                  showGlobalCompletion={false}
                  challengeId={challenge.id}
                  completedSegments={completedSegmentsMap}
                  style={{ backgroundColor: '#FFF' }}
                />
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderCategorySection = (title: string, challenges: Challenge[]) => (
    <View style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{title}</Text>
      {challenges.map((challenge) => (
        <View key={challenge.id}>
          {renderChallengeItem({ item: challenge })}
        </View>
      ))}
    </View>
  );

  const handleSegmentComplete = async (challengeId: string, segmentId: string) => {
    try {
      // The actual completion is handled by CheckCircle component
      // This function is called by the Accordion when a segment is completed
      // We just need to refresh the local progress state
      
      // Update local state immediately for UI responsiveness
      setChallengeProgress(prev => ({
        ...prev,
        [challengeId]: [...(prev[challengeId] || []), segmentId]
      }));

      // Check for achievements (you can add challenge-specific achievements here)
      const completedCount = (challengeProgress[challengeId] || []).length + 1;
      
      // Check if challenge is completed
      const challenge = readingPlansData.challenges.find(c => c.id === challengeId);
      if (challenge) {
        const totalSegments = Object.values(challenge.segments)
          .reduce((acc, book) => acc + (book?.segments?.length || 0), 0);
        
        if (completedCount === totalSegments) {
          await unlockAchievement(
            `challenge_complete_${challengeId}`,
            'Challenge Completed!',
            `Completed the ${challenge.title} reading challenge`
          );
        }
      }

    } catch (error) {
      console.error('Error completing segment:', error);
    }
  };

  // Handle segment selection - show ReadingModeModal instead of direct navigation
  const handleSegmentSelect = (segmentId: string) => {
    if (!segmentId) {
      return;
    }
    const segmentData = SegmentTitles[segmentId as keyof typeof SegmentTitles];
    if (segmentData) {
      setSelectedSegmentId(segmentId);
      setSelectedSegmentTitle(segmentData.title);
      setSelectedSegmentRef((segmentData as any).ref || '');
      setShowReadingModeModal(true);
    }
  };

  // Reading Mode Modal Handlers
  const handleIndividualReading = async () => {
    setShowReadingModeModal(false);
    await updateSegmentId(`ENG-NLT-${selectedSegmentId}`);
    const segment = SegmentTitles[selectedSegmentId as keyof typeof SegmentTitles];
    router.push({
      pathname: "/(tabs)/[segment]",
      params: {
        segment: `ENG-NLT-${selectedSegmentId}`,
        book: segment?.book[0] || '',
        ...(selectedChallengeId ? { challengeId: selectedChallengeId } : {})
      }
    });
  };

  const handleGroupReading = () => {
    setShowReadingModeModal(false);
    router.push({
      pathname: '/group-setup' as any,
      params: {
        storyId: selectedSegmentId,
        storyTitle: selectedSegmentTitle,
        scriptureReference: selectedSegmentRef,
      }
    });
  };

  const handleCancelModal = () => {
    setShowReadingModeModal(false);
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
      
      <ReadingModeModal
        visible={showReadingModeModal && !!selectedSegmentId}
        storyTitle={selectedSegmentTitle}
        scriptureReference={selectedSegmentRef}
        storyId={selectedSegmentId || ''}
        onIndividual={handleIndividualReading}
        onGroup={handleGroupReading}
        onCancel={handleCancelModal}
      />
    </SafeAreaView>
  );
};

export default ChallengesScreen;
