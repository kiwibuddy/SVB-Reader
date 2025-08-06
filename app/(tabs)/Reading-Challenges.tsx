import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
  RefreshControl,
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
import { getSegmentCompletionStatus, unlockAchievement, getChallengeProgress } from '@/api/sqlite';
import ReadingModeModal from '@/components/GroupReading/ReadingModeModal';
import BibleData from '@/assets/data/newBibleNLT1.json';
import ChronologicalView from '@/components/navigation/ChronologicalView';

// Add categories for challenges
const CHALLENGE_CATEGORIES = {
  SEASONAL: 'Seasonal',
  TOPICAL: 'Topical'
};

// Helper function to categorize challenges
const categorizeChallenge = (challenge: any) => {
    const seasonalTitles = ['Advent Journey', 'Advent Journey (Chronological)', 'Lenten Reflection', 'Lenten Reflection (Chronological)', '12 Days of Christmas'];
    const topicalTitles = ["Paul's Letters", "The Gospels", "The Gospels (Chronological)", "In The Beginning", "David's Life", "Women of the Bible"];
    return seasonalTitles.includes(challenge.title) ? CHALLENGE_CATEGORIES.SEASONAL : CHALLENGE_CATEGORIES.TOPICAL;
  };

// Seasonal challenge visibility logic
const isSeasonalChallengeVisible = (challengeId: string): boolean => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11, we want 1-12
  const currentDay = now.getDate();
  
  switch (challengeId) {
    case 'lentenReflectionChronological':
      // Lenten season: February through April (roughly Ash Wednesday to Easter)
      return currentMonth >= 2 && currentMonth <= 4;
      
    case 'christmas12':
      // Christmas season: December and early January (12 days of Christmas)
      return currentMonth === 12 || (currentMonth === 1 && currentDay <= 6);
      
    case 'adventJourneyChronological':
      // Advent season: November and December (Advent leading to Christmas)
      return currentMonth >= 11 && currentMonth <= 12;
      
    default:
      return true; // All other challenges are always visible
  }
};

// Add at the top of the file
const CHALLENGE_STYLES = {
  "Paul's Letters": {
    color: "#4df469"
  },

  "Advent Journey": {
    color: "#694df4"
  },
  "Advent Journey (Chronological)": {
    color: "#694df4"
  },
  "Lenten Reflection": {
    color: "#4d9ff4"
  },
  "Lenten Reflection (Chronological)": {
    color: "#4d9ff4"
  },
  "12 Days of Christmas": {
    color: "#f4b64d"
  },
  "The Gospels": {
    color: "#4dcaf4"
  },
  "The Gospels (Chronological)": {
    color: "#4dcaf4"
  },

  "In The Beginning": {
    color: "#f4944d"
  },
  "David's Life": {
    color: "#f44d69"
  },
  "Women of the Bible": {
    color: "#9f4df4"
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
    marginBottom: 16,
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
    marginTop: 16,
    marginBottom: 16,
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
    backgroundColor: colors.card,
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
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 4,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    lineHeight: 22,
  },
});

const ChallengesScreen = () => {
  const { 
    activeChallenges,
    startChallenge,
    pauseChallenge,
    resumeChallenge,
    endChallenge,
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
  const [lastCompletedSegment, setLastCompletedSegment] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, 'starting' | 'pausing' | 'resuming' | 'ending' | null>>({});
  const [refreshing, setRefreshing] = useState(false);


  const [challengeProgress, setChallengeProgress] = useState<Record<string, {
    totalSegments: number;
    completedSegments: number;
    progressPercentage: number;
    completedSegmentIds: string[];
  }>>({});
  
  // Reading Mode Modal State
  const [showReadingModeModal, setShowReadingModeModal] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [selectedSegmentTitle, setSelectedSegmentTitle] = useState<string>('');
  const [selectedSegmentRef, setSelectedSegmentRef] = useState<string>('');
  
  // Challenge Order Enforcement Modal State
  const [showOrderEnforcementModal, setShowOrderEnforcementModal] = useState(false);
  const [enforcementData, setEnforcementData] = useState<{
    challengeId: string;
    challengeTitle: string;
    clickedSegmentId: string;
    nextSegmentId: string;
    nextSegmentTitle: string;
    isStartChallenge: boolean;
  } | null>(null);

  // Load challenge progress when component mounts
  useEffect(() => {
    loadChallengeProgress();
  }, []);

  // Refresh when returning from reading a segment
  useFocusEffect(
    React.useCallback(() => {
      // Add a small delay to ensure database writes are complete
      const refreshWithDelay = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadChallengeProgress();
      };
      refreshWithDelay();
    }, [])
  );

  const loadChallengeProgress = async () => {
    const progress: Record<string, {
      totalSegments: number;
      completedSegments: number;
      progressPercentage: number;
      completedSegmentIds: string[];
    }> = {};
    
    // Load progress for each challenge using the same database function as Home screen
    for (const challenge of readingPlansData.challenges) {
      const challengeProgressData = await getChallengeProgress(challenge.id);
      progress[challenge.id] = challengeProgressData;
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

  // Helper function to get the next uncompleted segment in a challenge
  const getNextSegmentInChallenge = (challengeId: string, completedSegmentIds: string[]) => {
    const challenge = readingPlansData.challenges.find(c => c.id === challengeId);
    if (!challenge?.segments) return null;

    // Get all segments in order
    const allSegments: string[] = [];
    Object.values(challenge.segments).forEach(bookData => {
      if (bookData?.segments) {
        allSegments.push(...bookData.segments);
      }
    });

    // Filter out introduction segments and find first uncompleted
    const storySegments = allSegments.filter(s => !s.startsWith('I'));
    const nextSegment = storySegments.find(segmentId => !completedSegmentIds.includes(segmentId));
    
    if (nextSegment) {
      const segmentData = SegmentTitles[nextSegment as keyof typeof SegmentTitles];
      return {
        segmentId: nextSegment,
        title: segmentData?.title || 'Unknown Story'
      };
    }
    
    return null;
  };

  // Group challenges by status and category
  const organizedChallenges = useMemo(() => {
    const active: Challenge[] = [];
    const completed: Challenge[] = [];
    const categorized = {
      [CHALLENGE_CATEGORIES.SEASONAL]: [] as Challenge[],
      [CHALLENGE_CATEGORIES.TOPICAL]: [] as Challenge[],
    };

    readingPlansData.challenges.forEach(challenge => {
      // Apply seasonal visibility filter
      if (!isSeasonalChallengeVisible(challenge.id)) {
        return; // Skip seasonal challenges that are out of season
      }
      
      const isActive = activeChallenges[challenge.id] && !activeChallenges[challenge.id].isPaused;
      const isCompleted = activeChallenges[challenge.id] && activeChallenges[challenge.id].isCompleted;
      
      if (isCompleted) {
        completed.push(challenge as Challenge);
      } else if (isActive) {
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

    return { active, completed, categorized };
  }, [activeChallenges]);

  // Get the challenge description based on the selected challenge
  const getChallengeDescription = (challengeId: string) => {
    const challenge = readingPlansData.challenges.find(c => c.id === challengeId);
    return challenge?.longDescription || "";
  };

  const renderChallengeItem = ({ item: challenge }: { item: Challenge }) => {
    const isSelected = selectedChallengeId === challenge.id;
    const isActive = activeChallenges[challenge.id];
    const isPaused = isActive?.isPaused;
    const segmentCount = getChallengeSegmentCount(challenge.id);
    const challengeBooksData = isSelected ? getChallengeBooksData(challenge.id) : [];
    const progressData = challengeProgress[challenge.id];
    const completedSegments = progressData?.completedSegmentIds || [];
    const completedCount = progressData?.completedSegments || 0;
    const totalCount = progressData?.totalSegments || segmentCount;
    const progressPercentage = progressData?.progressPercentage || 0;
    
    // Check if this challenge supports chronological view
    const challengeData = readingPlansData.challenges.find(c => c.id === challenge.id);
    const supportsChronological = !!(challengeData as any)?.chronologicalOrder;
    const chronologicalMapping = (challengeData as any)?.chronologicalMapping;

    return (
      <View style={styles.challengeContainer}>
        <TouchableOpacity 
          style={styles.challengeHeader}
          onPress={() => setSelectedChallengeId(isSelected ? null : challenge.id)}
          activeOpacity={0.7}
        >
          <View style={styles.challengeInfo}>
            <View style={styles.leftContent}>
              <View style={styles.titleContainer}>
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                <Text style={styles.segmentCount}>
                  {segmentCount} {segmentCount === 1 ? 'story' : 'stories'}
                </Text>
                {isActive && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${progressPercentage}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {completedCount} of {totalCount} completed
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.rightContent}>
              {!isActive && (
                <TouchableOpacity 
                  onPress={async (e) => {
                    e.stopPropagation();
                    setLoadingStates(prev => ({ ...prev, [challenge.id]: 'starting' }));
                    try {
                      await startChallenge(challenge.id);
                    } finally {
                      setLoadingStates(prev => ({ ...prev, [challenge.id]: null }));
                    }
                  }}
                  disabled={loadingStates[challenge.id] === 'starting'}
                >
                  <Feather 
                    name={loadingStates[challenge.id] === 'starting' ? "clock" : "play-circle"} 
                    size={24} 
                    color={loadingStates[challenge.id] === 'starting' ? "#FF9800" : "#666666"} 
                  />
                </TouchableOpacity>
              )}
              {isActive && !isPaused && (
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    Alert.alert(
                      'Reading Challenge Options',
                      `What would you like to do with "${challenge.title}"?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Pause Challenge', 
                          onPress: async () => {
                            setLoadingStates(prev => ({ ...prev, [challenge.id]: 'pausing' }));
                            try {
                              await pauseChallenge(challenge.id);
                            } finally {
                              setLoadingStates(prev => ({ ...prev, [challenge.id]: null }));
                            }
                          }
                        },
                        { 
                          text: 'End Challenge', 
                          style: 'destructive',
                          onPress: () => {
                            Alert.alert(
                              'End Reading Challenge?',
                              `Are you sure you want to end "${challenge.title}"? This will delete all progress and cannot be undone.`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { 
                                  text: 'End Challenge', 
                                  style: 'destructive',
                                  onPress: async () => {
                                    setLoadingStates(prev => ({ ...prev, [challenge.id]: 'ending' }));
                                    try {
                                      await endChallenge(challenge.id);
                                      // Immediately refresh progress data
                                      await loadChallengeProgress();
                                    } finally {
                                      setLoadingStates(prev => ({ ...prev, [challenge.id]: null }));
                                    }
                                  }
                                }
                              ]
                            );
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Feather name="pause-circle" size={24} color="#FF9800" />
                </TouchableOpacity>
              )}
              {isPaused && (
                <TouchableOpacity 
                  onPress={async (e) => {
                    e.stopPropagation();
                    setLoadingStates(prev => ({ ...prev, [challenge.id]: 'resuming' }));
                    try {
                      await resumeChallenge(challenge.id);
                    } finally {
                      setLoadingStates(prev => ({ ...prev, [challenge.id]: null }));
                    }
                  }}
                  disabled={loadingStates[challenge.id] === 'resuming'}
                >
                  <Feather 
                    name={loadingStates[challenge.id] === 'resuming' ? "clock" : "play-circle"} 
                    size={24} 
                    color={loadingStates[challenge.id] === 'resuming' ? "#FF9800" : "#4CAF50"} 
                  />
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
          <>
            <Text style={styles.description}>
              {getChallengeDescription(challenge.id)}
            </Text>
            
            <View style={styles.booksContainer}>
              {/* Always show chronological view for supported challenges */}
              {supportsChronological && chronologicalMapping ? (
                <ChronologicalView
                  challengeId={challenge.id}
                  chronologicalMapping={chronologicalMapping}
                  completedSegments={completedSegments.reduce((acc, id) => {
                    acc[id] = true;
                    return acc;
                  }, {} as Record<string, boolean>)}
                  onSegmentSelect={handleSegmentSelect}
                  onSegmentComplete={(segmentId) => handleSegmentComplete(challenge.id, segmentId)}
                  context="challenge"
                />
              ) : (
                challengeBooksData.map((item) => {
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
                      key={item.djhBook}
                      item={item} 
                      bookIndex={bookIndex}
                      onSegmentComplete={(segmentId) => handleSegmentComplete(challenge.id, segmentId)}
                      onSegmentSelect={handleSegmentSelect}
                      context="challenge"
                      showGlobalCompletion={false}
                      challengeId={challenge.id}
                      completedSegments={completedSegmentsMap}
                      highlightedSegment={lastCompletedSegment}
                      style={{ backgroundColor: '#FFF' }}
                    />
                  );
                })
              )}
            </View>
          </>
        )}
      </View>
    );
  };

  const renderCategorySection = useCallback((title: string, challenges: Challenge[]) => (
    <View style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{title}</Text>
      {challenges.map((challenge) => (
        <View key={challenge.id}>
          {renderChallengeItem({ item: challenge })}
        </View>
      ))}
    </View>
  ), [selectedChallengeId]); // Add selectedChallengeId to dependencies

  const handleSegmentComplete = async (challengeId: string, segmentId: string) => {
    try {
      // Update local state immediately for UI responsiveness
      setChallengeProgress(prev => {
        const currentProgress = prev[challengeId];
        if (currentProgress && !currentProgress.completedSegmentIds.includes(segmentId)) {
          const newCompletedCount = currentProgress.completedSegments + 1;
          const newProgressPercentage = currentProgress.totalSegments > 0 ? 
            (newCompletedCount / currentProgress.totalSegments) * 100 : 0;
          
          return {
            ...prev,
            [challengeId]: {
              ...currentProgress,
              completedSegments: newCompletedCount,
              progressPercentage: newProgressPercentage,
              completedSegmentIds: [...currentProgress.completedSegmentIds, segmentId]
            }
          };
        }
        return prev;
      });

      // Check for achievements (you can add challenge-specific achievements here)
      const currentProgress = challengeProgress[challengeId];
      const completedCount = currentProgress ? currentProgress.completedSegments + 1 : 1;
      
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

      // Auto-expand the challenge and center on completed segment
      setSelectedChallengeId(challengeId);
      setLastCompletedSegment(segmentId);
      
      // Refresh progress data
      await loadChallengeProgress();
      
      // Scroll to the completed segment after a brief delay
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 500);

    } catch (error) {
      console.error('Error completing segment:', error);
    }
  };

  // Handle segment selection with challenge order enforcement
  const handleSegmentSelect = (segmentId: string) => {
    if (!segmentId || !selectedChallengeId) {
      return;
    }
    
    const segmentData = SegmentTitles[segmentId as keyof typeof SegmentTitles];
    if (!segmentData) return;
    
    // Check if this is an introduction segment - always allow
    if (segmentId.startsWith('I')) {
      router.push({
        pathname: "/[segment]",
        params: {
          segment: `ENG-NLT-${segmentId}`,
          book: segmentData.book[0] || '',
          challengeId: selectedChallengeId,
          context: 'challenge'
        }
      });
      return;
    }

    // For story segments, check challenge order enforcement
    const challenge = readingPlansData.challenges.find(c => c.id === selectedChallengeId);
    const isActive = activeChallenges[selectedChallengeId] && !activeChallenges[selectedChallengeId].isPaused;
    const completedSegmentIds = challengeProgress[selectedChallengeId]?.completedSegmentIds || [];
    
    if (!isActive) {
      // Challenge not started - show popup to start challenge
      const nextSegment = getNextSegmentInChallenge(selectedChallengeId, completedSegmentIds);
      if (nextSegment) {
        setEnforcementData({
          challengeId: selectedChallengeId,
          challengeTitle: challenge?.title || 'Reading Challenge',
          clickedSegmentId: segmentId,
          nextSegmentId: nextSegment.segmentId,
          nextSegmentTitle: nextSegment.title,
          isStartChallenge: true
        });
        setShowOrderEnforcementModal(true);
        return;
      }
    } else {
      // Challenge is active - check if this is the next segment
      const nextSegment = getNextSegmentInChallenge(selectedChallengeId, completedSegmentIds);
      if (nextSegment && nextSegment.segmentId !== segmentId) {
        // User clicked on a different segment - show enforcement popup
        setEnforcementData({
          challengeId: selectedChallengeId,
          challengeTitle: challenge?.title || 'Reading Challenge',
          clickedSegmentId: segmentId,
          nextSegmentId: nextSegment.segmentId,
          nextSegmentTitle: nextSegment.title,
          isStartChallenge: false
        });
        setShowOrderEnforcementModal(true);
        return;
      }
    }

    // All checks passed - show reading mode modal
    setSelectedSegmentId(segmentId);
    setSelectedSegmentTitle(segmentData.title);
    setSelectedSegmentRef((segmentData as any).ref || '');
    setShowReadingModeModal(true);
  };

  // Reading Mode Modal Handlers
    const handleIndividualReading = async () => {
    setShowReadingModeModal(false);
    await updateSegmentId(`ENG-NLT-${selectedSegmentId}`);
    const segment = SegmentTitles[selectedSegmentId as keyof typeof SegmentTitles];
    router.push({
      pathname: "/[segment]",
      params: {
        segment: `ENG-NLT-${selectedSegmentId}`,
        book: segment?.book[0] || '',
        challengeId: selectedChallengeId || '',
        context: 'challenge'
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

  // Challenge Order Enforcement Modal Handlers
  const handleStartChallengeAndRead = async () => {
    if (!enforcementData) return;
    
    setShowOrderEnforcementModal(false);
    
    // Start the challenge
    setLoadingStates(prev => ({ ...prev, [enforcementData.challengeId]: 'starting' }));
    try {
      await startChallenge(enforcementData.challengeId);
      
      // Navigate to the first story of the challenge
      const segmentData = SegmentTitles[enforcementData.nextSegmentId as keyof typeof SegmentTitles];
      if (segmentData) {
        setSelectedSegmentId(enforcementData.nextSegmentId);
        setSelectedSegmentTitle(segmentData.title);
        setSelectedSegmentRef((segmentData as any).ref || '');
        setShowReadingModeModal(true);
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [enforcementData.challengeId]: null }));
    }
  };

  const handleReadNextStoryChallenge = () => {
    if (!enforcementData) return;
    
    setShowOrderEnforcementModal(false);
    
    // Navigate to the next story in order
    const segmentData = SegmentTitles[enforcementData.nextSegmentId as keyof typeof SegmentTitles];
    if (segmentData) {
      setSelectedSegmentId(enforcementData.nextSegmentId);
      setSelectedSegmentTitle(segmentData.title);
      setSelectedSegmentRef((segmentData as any).ref || '');
      setShowReadingModeModal(true);
    }
  };

  const handleCancelChallengeEnforcement = () => {
    setShowOrderEnforcementModal(false);
    setEnforcementData(null);
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadChallengeProgress();
    } finally {
      setRefreshing(false);
    }
  }, []);

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
    
    // Combine all non-active challenges into a single section without category titles
    const allAvailableChallenges = [
      ...organizedChallenges.categorized[CHALLENGE_CATEGORIES.SEASONAL],
      ...organizedChallenges.categorized[CHALLENGE_CATEGORIES.TOPICAL]
    ];
    
    if (allAvailableChallenges.length > 0) {
      result.push({
        title: 'Available Challenges',
        data: allAvailableChallenges
      });
    }
    
    if (organizedChallenges.completed.length > 0) {
      result.push({
        title: 'Completed Challenges',
        data: organizedChallenges.completed
      });
    }
    
    return result;
  }, [organizedChallenges]);

  // Add handleScroll function to match Home.tsx
  const handleScroll = (event: any) => {
    // Implementation of handleScroll function
  };

  // Memoize the renderItem function
  const renderItem = useCallback(({ item }: { item: { title: string; data: Challenge[] } }) => {
    return renderCategorySection(item.title, item.data);
  }, [selectedChallengeId]); // Add selectedChallengeId to dependencies

  // Memoize the keyExtractor function
  const keyExtractor = useCallback((item: { title: string; data: Challenge[] }) => item.title, []);

  // Memoize the ListHeaderComponent
  const ListHeaderComponent = useCallback(() => (
    <View style={styles.welcomeSection}>
      <Text style={styles.welcomeTitle}>Reading Challenges</Text>
      <Text style={styles.welcomeText}>
        Welcome to Bible Reading Challenges, where you can find focused reading challenges to help you dive deep into specific themes and books of the Bible.
      </Text>
    </View>
  ), [styles.welcomeSection, styles.welcomeTitle, styles.welcomeText]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={ListHeaderComponent}
        style={styles.content}
        data={sections}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
        updateCellsBatchingPeriod={100}
        getItemLayout={(data, index) => ({
          length: 140, // Estimated height per challenge item
          offset: 140 * index,
          index,
        })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF9F0A']} // Android
            tintColor="#FF9F0A" // iOS
          />
        }
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

      {/* Challenge Order Enforcement Modal */}
      {showOrderEnforcementModal && enforcementData && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 24,
            margin: 20,
            maxWidth: 400,
            width: '90%',
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 12,
              textAlign: 'center'
            }}>
              {enforcementData.isStartChallenge ? 'Start Reading Challenge' : 'Follow Reading Order'}
            </Text>
            
            <Text style={{
              fontSize: 16,
              color: colors.text,
              marginBottom: 20,
              textAlign: 'center',
              lineHeight: 22,
            }}>
              {enforcementData.isStartChallenge 
                ? `To get the most out of "${enforcementData.challengeTitle}", stories should be read in order. Start with the first story:`
                : `To maintain continuity in "${enforcementData.challengeTitle}", we recommend reading stories in order. Your next story is:`
              }
            </Text>

            <View style={{
              backgroundColor: colors.background,
              padding: 16,
              borderRadius: 8,
              marginBottom: 20,
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.primary,
                textAlign: 'center',
              }}>
                {enforcementData.nextSegmentTitle}
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                }}
                onPress={handleCancelChallengeEnforcement}
              >
                <Text style={{
                  color: colors.text,
                  textAlign: 'center',
                  fontWeight: '500',
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                }}
                onPress={enforcementData.isStartChallenge ? handleStartChallengeAndRead : handleReadNextStoryChallenge}
              >
                <Text style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: '600',
                }}>
                  {enforcementData.isStartChallenge ? 'Start Challenge' : 'Read Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ChallengesScreen;
