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
  Pressable,
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
import { useAppSettings } from '@/context/AppSettingsContext';

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
  completedSegments: {
    [key: string]: {
      isCompleted: boolean;
    };
  };
  updateSegmentId: (segmentId: string) => void;
}

interface BookSegments {
  segments: string[];
}

interface ChallengesByCategory {
  'Seasonal': Challenge[];
  'Topical': Challenge[];
}

const createStyles = (isLargeScreen: boolean, colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 8,
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
  },
  challengeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  },
  challengeHeader: {
    marginBottom: 16,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  challengeMeta: {
    fontSize: 14,
    color: colors.secondary,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.secondary,
  },
  challengeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#FF9800',
  },
  secondaryButton: {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: colors.text,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  },
  description: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  booksSection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  bookChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  bookChipActive: {
    backgroundColor: '#FF980020',
    borderColor: '#FF9800',
  },
  bookChipCompleted: {
    backgroundColor: '#4CAF5020',
    borderColor: '#4CAF50',
  },
  bookChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.secondary,
  },
  bookChipTextActive: {
    color: '#FF9800',
  },
  bookChipTextCompleted: {
    color: '#4CAF50',
  },
  storiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingLeft: 16,
  },
  storyChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  },
  storyChipCompleted: {
    backgroundColor: '#4CAF5015',
    borderColor: '#4CAF50',
  },
  storyChipText: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: "500",
  },
  storyChipTextCompleted: {
    color: '#4CAF50',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 20,
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
    restartChallenge,
    completedSegments,
    updateSegmentId,
  } = useAppContext();

  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { colors, isDarkMode } = useAppSettings();
  const styles = createStyles(isLargeScreen, colors, isDarkMode);

  // Helper functions
  const getChallengeSegmentCount = (challengeId: string) => {
    const challenge = readingPlansData.challenges.find(c => c.id === challengeId);
    if (!challenge?.segments) return 0;
    
    return Object.values(challenge.segments).reduce(
      (acc, book) => acc + (book?.segments?.filter((s: string) => !s.startsWith('I')).length ?? 0),
      0
    );
  };

  const getChallengeBooksWithProgress = (challengeId: string) => {
    const challenge = readingPlansData.challenges.find(c => c.id === challengeId);
    if (!challenge?.segments) return [];
    
    return Object.entries(challenge.segments)
      .filter(([_, bookData]) => bookData?.segments?.length > 0)
      .map(([key, bookData]) => {
        const segments = bookData?.segments?.filter((s: string) => !s.startsWith('I')) || [];
        const completedCount = segments.filter((segId: string) => completedSegments[segId]?.isCompleted).length;
        const isCompleted = completedCount === segments.length && segments.length > 0;
        
        return {
          key,
          name: Books[key as keyof typeof Books]?.bookName || key,
          segments,
          completedCount,
          totalCount: segments.length,
          isCompleted
        };
      });
  };

  const calculateProgress = (challenge: any) => {
    if (!challenge.completedSegments) return 0;
    const totalSegments = getChallengeSegmentCount(challenge.challengeId);
    return Math.round((challenge.completedSegments.length / totalSegments) * 100);
  };

  const getEstimatedDuration = (segmentCount: number) => {
    const weeks = Math.ceil(segmentCount / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  };

  const handleStoryPress = async (segmentId: string, challengeId: string) => {
    await updateSegmentId(`ENG-NLT-${segmentId}`);
    const segmentData = SegmentTitles[segmentId as keyof typeof SegmentTitles];
    router.push({
      pathname: "/[segment]",
      params: {
        segment: `ENG-NLT-${segmentId}`,
        book: segmentData?.book[0] || '',
        challengeId: challengeId
      }
    });
  };

  // Organize challenges
  const organizedChallenges = useMemo(() => {
    const active: Challenge[] = [];
    const seasonal: Challenge[] = [];
    const topical: Challenge[] = [];

    readingPlansData.challenges.forEach(challenge => {
      const isActive = activeChallenges[challenge.id] && !activeChallenges[challenge.id].isPaused;
      
      if (isActive) {
        active.push(challenge as Challenge);
      } else {
        // Simple categorization based on title
        const seasonalKeywords = ['Christmas', 'Advent', 'Lenten'];
        const isSeasonalChallenge = seasonalKeywords.some(keyword => 
          challenge.title.includes(keyword)
        );
        
        if (isSeasonalChallenge) {
          seasonal.push(challenge as Challenge);
        } else {
          topical.push(challenge as Challenge);
        }
      }
    });

    return { active, seasonal, topical };
  }, [activeChallenges]);

  const handleChallengeAction = async (challengeId: string, action: 'start' | 'continue' | 'pause' | 'resume') => {
    try {
      switch (action) {
        case 'start':
          await startChallenge(challengeId);
          break;
        case 'continue':
          // Navigate to next reading
          break;
        case 'pause':
          await pauseChallenge(challengeId);
          break;
        case 'resume':
          await resumeChallenge(challengeId);
          break;
      }
    } catch (error) {
      console.error('Challenge action error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const renderChallengeCard = (challenge: Challenge, isActive: boolean = false) => {
    const activeData = isActive ? activeChallenges[challenge.id] : null;
    const segmentCount = getChallengeSegmentCount(challenge.id);
    const progress = isActive && activeData ? calculateProgress(activeData) : 0;
    const duration = getEstimatedDuration(segmentCount);
    const isExpanded = selectedChallengeId === challenge.id;
    const books = getChallengeBooksWithProgress(challenge.id);
    const isPaused = activeData?.isPaused || false;

    return (
      <View key={challenge.id} style={styles.challengeCard}>
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeMeta}>
            {segmentCount} stories · {duration}
          </Text>
        </View>

        {isActive && activeData && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${progress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress}% complete · {activeData.completedSegments?.length || 0}/{segmentCount} stories
            </Text>
          </View>
        )}

        <View style={styles.challengeActions}>
          {!isActive && (
            <Pressable
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => handleChallengeAction(challenge.id, 'start')}
            >
              <Ionicons name="play" size={16} color="#FFFFFF" />
              <Text style={[styles.buttonText, styles.primaryButtonText]}>Start</Text>
            </Pressable>
          )}

          {isActive && (
            <>
              {isPaused ? (
                <Pressable
                  style={[styles.actionButton, styles.successButton]}
                  onPress={() => handleChallengeAction(challenge.id, 'resume')}
                >
                  <Ionicons name="play" size={16} color="#FFFFFF" />
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>Resume</Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={() => handleChallengeAction(challenge.id, 'pause')}
                  >
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>Pause</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={() => handleChallengeAction(challenge.id, 'continue')}
                  >
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    <Text style={[styles.buttonText, styles.primaryButtonText]}>Continue</Text>
                  </Pressable>
                </>
              )}
            </>
          )}

          <Pressable
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => setSelectedChallengeId(isExpanded ? null : challenge.id)}
          >
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={colors.text} 
            />
          </Pressable>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.description}>
              {challenge.longDescription || challenge.description}
            </Text>
            
            <View style={styles.booksSection}>
              <Text style={styles.subsectionTitle}>Books & Stories</Text>
              
              <View style={styles.booksGrid}>
                {books.map((book) => (
                  <Pressable
                    key={book.key}
                    style={[
                      styles.bookChip,
                      expandedBookId === `${challenge.id}-${book.key}` && styles.bookChipActive,
                      book.isCompleted && styles.bookChipCompleted,
                    ]}
                    onPress={() => {
                      const bookId = `${challenge.id}-${book.key}`;
                      setExpandedBookId(expandedBookId === bookId ? null : bookId);
                    }}
                  >
                    <Text style={[
                      styles.bookChipText,
                      expandedBookId === `${challenge.id}-${book.key}` && styles.bookChipTextActive,
                      book.isCompleted && styles.bookChipTextCompleted,
                    ]}>
                      {book.name} ({book.completedCount}/{book.totalCount})
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Show stories for expanded book */}
              {expandedBookId && (
                (() => {
                  const [expandedChallengeId, expandedBookKey] = expandedBookId.split('-');
                  if (expandedChallengeId !== challenge.id) return null;
                  
                  const expandedBook = books.find(b => b.key === expandedBookKey);
                  if (!expandedBook) return null;

                  return (
                    <View style={styles.storiesGrid}>
                      {expandedBook.segments.map((segmentId: string) => {
                        const isCompleted = completedSegments[segmentId]?.isCompleted;
                        const segmentData = SegmentTitles[segmentId as keyof typeof SegmentTitles];
                        
                        return (
                          <Pressable
                            key={segmentId}
                            style={[
                              styles.storyChip,
                              isCompleted && styles.storyChipCompleted,
                            ]}
                            onPress={() => handleStoryPress(segmentId, challenge.id)}
                          >
                            <Text style={[
                              styles.storyChipText,
                              isCompleted && styles.storyChipTextCompleted,
                            ]}>
                              {segmentData?.title || segmentId}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  );
                })()
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Reading Challenges</Text>
          <Text style={styles.subtitle}>
            Take on focused reading challenges designed for spiritual growth and deeper Bible study.
          </Text>
        </View>

        {organizedChallenges.active.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📖</Text>
              <Text style={styles.sectionTitle}>Your Active Challenges</Text>
            </View>
            {organizedChallenges.active.map(challenge => renderChallengeCard(challenge, true))}
          </View>
        )}

        {organizedChallenges.seasonal.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🎄</Text>
              <Text style={styles.sectionTitle}>Seasonal Challenges</Text>
            </View>
            {organizedChallenges.seasonal.map(challenge => renderChallengeCard(challenge, false))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📚</Text>
            <Text style={styles.sectionTitle}>Topical Challenges</Text>
          </View>
          {organizedChallenges.topical.length > 0 ? (
            organizedChallenges.topical.map(challenge => renderChallengeCard(challenge, false))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons 
                name="flag-outline" 
                size={48} 
                color={colors.secondary} 
                style={styles.emptyStateIcon}
              />
              <Text style={styles.emptyStateTitle}>No Challenges Available</Text>
              <Text style={styles.emptyStateText}>
                Check back later for new reading challenges to enhance your Bible study journey.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChallengesScreen;
