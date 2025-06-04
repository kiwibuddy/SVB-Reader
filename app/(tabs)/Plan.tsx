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
import { useAppSettings } from '@/context/AppSettingsContext';

interface BookSegments {
  segments: string[];
}

export type SegmentKey = keyof typeof SegmentTitles;
export type SegmentIds = keyof typeof Books;

// Add interface for Plan type
interface Plan {
  id: string;
  title: string;
  description: string;
  image: string;
  segments: {
    [key: string]: {
      segments: string[];
    } | undefined;  // Add undefined as possible type
  };
}

// Fix the interface for plan progress to match the actual data structure
interface PlanProgressData {
  completedSegments: string[];
  isCompleted: boolean;
  isPaused: boolean;
}

const PLAN_STYLES = {
  "NT100Days": {
    color: "#4df469",
    icon: "book-reader"
  },
  "SchoolYear2": {
    color: "#694df4",
    icon: "graduation-cap"
  },
  "Bible1Year": {
    color: "#f44d69",
    icon: "calendar-alt"
  },
  "SchoolYear3": {
    color: "#4d9ff4",
    icon: "school"
  },
  "SchoolYear1": {
    color: "#f4b64d",
    icon: "book"
  }
};

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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  planCard: {
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
  planHeader: {
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  planMeta: {
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
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.secondary,
  },
  planActions: {
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
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
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
    backgroundColor: '#007AFF20',
    borderColor: '#007AFF',
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
    color: '#007AFF',
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

const PlanScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    activePlan,
    startPlan,
    pausePlan,
    resumePlan,
    switchPlan,
    completedSegments,
    updateSegmentId,
  } = useAppContext();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { colors, isDarkMode } = useAppSettings();
  const styles = createStyles(isLargeScreen, colors, isDarkMode);

  // Filter and organize plans
  const availablePlans = useMemo(() => {
    return readingPlansData.plans.filter(plan => 
      !['SchoolYear2', 'SchoolYear3', 'test'].includes(plan.id)
    );
  }, []);

  const activePlans = useMemo(() => {
    return activePlan ? [activePlan] : [];
  }, [activePlan]);

  // Helper functions
  const getPlanSegmentCount = (planId: string) => {
    const plan = readingPlansData.plans.find(p => p.id === planId);
    if (!plan?.segments) return 0;
    
    return Object.values(plan.segments).reduce(
      (acc, book) => acc + (book?.segments?.filter((s: string) => !s.startsWith('I')).length ?? 0),
      0
    );
  };

  const calculateProgress = (plan: any) => {
    if (!plan.completedSegments) return 0;
    const totalSegments = getPlanSegmentCount(plan.planId);
    return Math.round((plan.completedSegments.length / totalSegments) * 100);
  };

  const getEstimatedDuration = (segmentCount: number) => {
    const weeks = Math.ceil(segmentCount / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  };

  const handlePlanAction = async (planId: string, action: 'start' | 'continue' | 'pause' | 'resume' | 'switch') => {
    try {
      switch (action) {
        case 'start':
          await startPlan(planId);
          router.push('/Plan');
          break;
        case 'continue':
          // Navigate to next reading
          break;
        case 'pause':
          await pausePlan();
          break;
        case 'resume':
          await resumePlan();
          break;
        case 'switch':
          Alert.alert(
            'Switch Reading Plan',
            'Are you sure you want to switch to this plan? Your current progress will be saved.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Switch', onPress: () => switchPlan(planId) }
            ]
          );
          break;
      }
    } catch (error) {
      console.error('Plan action error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const getPlanBooksWithProgress = (planId: string) => {
    const plan = readingPlansData.plans.find(p => p.id === planId);
    if (!plan?.segments) return [];
    
    return Object.entries(plan.segments)
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

  const handleStoryPress = async (segmentId: string, planId: string) => {
    await updateSegmentId(`ENG-NLT-${segmentId}`);
    const segmentData = SegmentTitles[segmentId as keyof typeof SegmentTitles];
    router.push({
      pathname: "/[segment]",
      params: {
        segment: `ENG-NLT-${segmentId}`,
        book: segmentData?.book[0] || '',
        planId: planId
      }
    });
  };

  const renderPlanCard = (plan: any, isActive: boolean = false) => {
    const planData = readingPlansData.plans.find(p => p.id === (isActive ? plan.planId : plan.id));
    if (!planData) return null;

    const planId = isActive ? plan.planId : plan.id;
    const segmentCount = getPlanSegmentCount(planId);
    const progress = isActive ? calculateProgress(plan) : 0;
    const duration = getEstimatedDuration(segmentCount);
    const isExpanded = selectedPlanId === planId;
    const books = getPlanBooksWithProgress(planId);
    const isPaused = plan?.isPaused || false;

    return (
      <View key={planId} style={styles.planCard}>
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>{planData.title}</Text>
          <Text style={styles.planMeta}>
            {segmentCount} stories · {duration}
          </Text>
        </View>

        {isActive && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${progress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress}% complete · {plan.completedSegments?.length || 0}/{segmentCount} stories
            </Text>
          </View>
        )}

        <View style={styles.planActions}>
          {!isActive && (
            <>
              {activePlan && (
                <Pressable
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={() => handlePlanAction(plan.id, 'switch')}
                >
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>Switch</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => handlePlanAction(plan.id, 'start')}
              >
                <Ionicons name="play" size={16} color="#FFFFFF" />
                <Text style={[styles.buttonText, styles.primaryButtonText]}>Start</Text>
              </Pressable>
            </>
          )}

          {isActive && (
            <>
              {isPaused ? (
                <Pressable
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={() => handlePlanAction(plan.planId, 'resume')}
                >
                  <Ionicons name="play" size={16} color="#FFFFFF" />
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>Resume</Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={() => handlePlanAction(plan.planId, 'pause')}
                  >
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>Pause</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={() => handlePlanAction(plan.planId, 'continue')}
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
            onPress={() => setSelectedPlanId(isExpanded ? null : planId)}
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
            <View style={styles.booksSection}>
              <Text style={styles.subsectionTitle}>Books & Stories</Text>
              
              <View style={styles.booksGrid}>
                {books.map((book) => (
                  <Pressable
                    key={book.key}
                    style={[
                      styles.bookChip,
                      expandedBookId === `${planId}-${book.key}` && styles.bookChipActive,
                      book.isCompleted && styles.bookChipCompleted,
                    ]}
                    onPress={() => {
                      const bookId = `${planId}-${book.key}`;
                      setExpandedBookId(expandedBookId === bookId ? null : bookId);
                    }}
                  >
                    <Text style={[
                      styles.bookChipText,
                      expandedBookId === `${planId}-${book.key}` && styles.bookChipTextActive,
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
                  const [expandedPlanId, expandedBookKey] = expandedBookId.split('-');
                  if (expandedPlanId !== planId) return null;
                  
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
                            onPress={() => handleStoryPress(segmentId, planId)}
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
          <Text style={styles.title}>Reading Plans</Text>
          <Text style={styles.subtitle}>
            Choose a structured path through Scripture designed to deepen your understanding and build consistent reading habits.
          </Text>
        </View>

        {activePlans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Active Plan</Text>
            {activePlans.map(plan => renderPlanCard(plan, true))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          {availablePlans.length > 0 ? (
            availablePlans.map(plan => renderPlanCard(plan, false))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons 
                name="book-outline" 
                size={48} 
                color={colors.secondary} 
                style={styles.emptyStateIcon}
              />
              <Text style={styles.emptyStateTitle}>No Plans Available</Text>
              <Text style={styles.emptyStateText}>
                Check back later for new reading plans to enhance your Bible study journey.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PlanScreen;