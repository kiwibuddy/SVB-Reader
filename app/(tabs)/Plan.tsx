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
import CelebrationModal from '@/components/gamification/CelebrationModal';
import { LinearGradient } from 'expo-linear-gradient';

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
    overflow: 'hidden',
  },
  completedPlanCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#4CAF5040',
    overflow: 'hidden',
  },
  completedPlanGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  planHeader: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  planHeaderContent: {
    flex: 1,
    marginRight: 12,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF5020',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 4,
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
  restartButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  completedPlanCardCompact: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#4CAF50',
    opacity: 0.95,
  },
  completedPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completedPlanLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  completedPlanTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  restartButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.secondary,
  },
  // Horizontal slider styles
  sliderContainer: {
    marginBottom: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.card,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
  activeTabText: {
    color: colors.text,
  },
  sliderContent: {
    minHeight: 200,
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
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { colors, isDarkMode } = useAppSettings();
  const styles = createStyles(isLargeScreen, colors, isDarkMode);
  const scrollViewRef = useRef<ScrollView>(null);
  const [celebrationModal, setCelebrationModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'plan' | 'challenge' | 'streak' | 'milestone' | 'book' | 'story';
    stats?: any;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'plan',
  });

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

  const isPlanCompleted = (planId: string) => {
    // For now, return false since we don't have completed plans tracking
    return false;
  };

  const getPlanBooksWithProgress = (planId: string) => {
    const plan = readingPlansData.plans.find(p => p.id === planId);
    if (!plan?.segments) return [];
    
    // Get plan-specific completion data
    const planCompletion = (activePlan?.planId === planId ? activePlan.completedSegments : []) || [];
    
    return Object.entries(plan.segments)
      .filter(([_, bookData]) => bookData?.segments?.length > 0)
      .map(([key, bookData]) => {
        const segments = bookData?.segments?.filter((s: string) => !s.startsWith('I')) || [];
        const completedCount = segments.filter((segId: string) => planCompletion.includes(segId)).length;
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

  const handlePlanAction = async (planId: string, action: 'start' | 'continue' | 'pause' | 'resume' | 'switch' | 'restart') => {
    try {
      switch (action) {
        case 'start':
          await startPlan(planId);
          setCelebrationModal({
            visible: true,
            title: 'Plan Started!',
            message: 'Your reading journey begins now. Stay consistent and enjoy discovering God\'s word!',
            type: 'plan',
            stats: {
              storiesRead: 0,
              totalProgress: 0,
            }
          });
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
        case 'restart':
          Alert.alert(
            'Restart Reading Plan',
            'Are you sure you want to restart this plan? Your current progress will be reset.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Restart', 
                style: 'destructive',
                onPress: async () => {
                  // TODO: Implement restart functionality when available
                  setCelebrationModal({
                    visible: true,
                    title: 'Plan Restarted!',
                    message: 'Fresh start! Ready to dive back into God\'s word with renewed energy.',
                    type: 'plan',
                  });
                }
              }
            ]
          );
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
    const isCompleted = isPlanCompleted(planId);

    // Check if plan was just completed
    useEffect(() => {
      if (isActive && progress === 100 && !isCompleted) {
        setCelebrationModal({
          visible: true,
          title: 'Plan Completed! 🎉',
          message: 'Congratulations! You\'ve completed your reading plan. What an amazing achievement!',
          type: 'plan',
          stats: {
            storiesRead: plan.completedSegments?.length || 0,
            totalProgress: 100,
          }
        });
      }
    }, [progress, isCompleted]);

    // Compact design for completed plans
    if (isCompleted) {
      return (
        <View key={planId} style={styles.completedPlanCardCompact}>
          <View style={styles.completedPlanRow}>
            <View style={styles.completedPlanLeft}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.completedPlanTitle}>{planData.title}</Text>
            </View>
            <Pressable
              style={styles.restartButton}
              onPress={() => handlePlanAction(planId, 'restart')}
            >
              <Ionicons name="refresh" size={14} color={colors.secondary} />
              <Text style={styles.restartButtonText}>Again</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    const cardStyle = styles.planCard;

    return (
      <View key={planId} style={cardStyle}>
        <View style={styles.planHeader}>
          <View style={styles.planHeaderContent}>
            <Text style={styles.planTitle}>{planData.title}</Text>
            <Text style={styles.planMeta}>
              {segmentCount} stories · {duration}
            </Text>
          </View>
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
                  <View key={book.key}>
                    <Pressable
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

                    {/* Show stories immediately under this book when expanded */}
                    {expandedBookId === `${planId}-${book.key}` && (
                      <View style={[styles.storiesGrid, { width: '100%', marginTop: 8 }]}>
                        {book.segments.map((segmentId: string) => {
                          // Get plan-specific completion data with null safety
                          const planCompletion = (activePlan && activePlan.planId === planId ? activePlan.completedSegments : []) || [];
                          const isCompleted = planCompletion.includes(segmentId);
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
                    )}
                  </View>
                ))}
              </View>
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

        {/* Horizontal Slider for Available/Completed */}
        <View style={styles.sliderContainer}>
          <View style={styles.tabsContainer}>
            <Pressable
              style={[styles.tab, activeTab === 'active' && styles.activeTab]}
              onPress={() => setActiveTab('active')}
            >
              <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
                Available ({activePlans.length + availablePlans.filter(plan => !isPlanCompleted(plan.id) && (!activePlan || activePlan.planId !== plan.id)).length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
              onPress={() => setActiveTab('completed')}
            >
              <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
                Completed (0)
              </Text>
            </Pressable>
          </View>

          <View style={styles.sliderContent}>
            {activeTab === 'active' ? (
              <>
                {activePlans.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Active Plan</Text>
                    {activePlans.map(plan => renderPlanCard(plan, true))}
                  </View>
                )}

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Available Plans</Text>
                  {availablePlans
                    .filter(plan => !isPlanCompleted(plan.id) && (!activePlan || activePlan.planId !== plan.id))
                    .length > 0 ? (
                    availablePlans
                      .filter(plan => !isPlanCompleted(plan.id) && (!activePlan || activePlan.planId !== plan.id))
                      .map(plan => renderPlanCard(plan, false))
                  ) : (
                    <View style={styles.emptyState}>
                      <Ionicons 
                        name="book-outline" 
                        size={48} 
                        color={colors.secondary} 
                        style={styles.emptyStateIcon}
                      />
                      <Text style={styles.emptyStateTitle}>All Plans Active!</Text>
                      <Text style={styles.emptyStateText}>
                        You have an active plan running. Complete or pause it to start a new one.
                      </Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.section}>
                <View style={styles.emptyState}>
                  <Ionicons 
                    name="checkmark-circle-outline" 
                    size={48} 
                    color={colors.secondary} 
                    style={styles.emptyStateIcon}
                  />
                  <Text style={styles.emptyStateTitle}>No Completed Plans</Text>
                  <Text style={styles.emptyStateText}>
                    Complete a reading plan to see it here! Start with one of the available plans in the Available tab.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <CelebrationModal
        visible={celebrationModal.visible}
        onClose={() => setCelebrationModal(prev => ({ ...prev, visible: false }))}
        title={celebrationModal.title}
        message={celebrationModal.message}
        type={celebrationModal.type}
        stats={celebrationModal.stats}
      />
    </SafeAreaView>
  );
};

export default PlanScreen;