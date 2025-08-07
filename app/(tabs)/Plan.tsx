import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Image,
  useWindowDimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';

import readingPlansData from "../../assets/data/ReadingPlansChallenges.json";


import Accordion, { AccordionItem, accordionColor } from "@/components/navigation/NavBook";
import Books from "@/assets/data/BookChapterList.json";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { useSQLiteGlobalContext } from "@/context/SQLiteGlobalContext";
import { StatusIndicator } from '@/components/StatusIndicator';
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { 
  markSegmentComplete, 
  getSegmentCompletionStatus, 
  unlockAchievement, 
  getPlanProgress,
  getActivePlanFromDB,
  startPlan,
  pausePlan,
  resumePlan,
  endPlan
} from "@/api/sqlite";
import { useAppSettings } from '@/context/AppSettingsContext';
import ReadingModeModal from '@/components/GroupReading/ReadingModeModal';
import BibleData from '@/assets/data/newBibleNLT1.json';

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
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  titleBackground: {
    backgroundColor: isDarkMode ? 'rgba(255, 99, 99, 0.15)' : 'rgba(255, 99, 99, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 15,
    color: colors.secondary,
    lineHeight: 22,
  },
  scrollContainer: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "500",
    marginTop: 24,
    marginBottom: 16,
    color: "#FF9F0A",
  },
  listContainer: {
    paddingTop: 8,
    paddingBottom: 100
  },
  planContainer: {
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
  planHeader: {
    padding: 16,
    backgroundColor: colors.card,
  },
  planInfo: {
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
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  segmentCount: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 4,
  },
  booksContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  titleContainer: {
    flexDirection: 'column',
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    color: colors.text,
  },
  description: {
    color: colors.secondary,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  accordionContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 12,
    marginBottom: 16,
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
});

const PlanScreen = () => {
  const { 
    updateSegmentId
  } = useSQLiteGlobalContext();
  // Removed activePlan, plan management dependencies - now using pure SQLite data loading

  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { colors, isDarkMode } = useAppSettings();
  const styles = createStyles(isLargeScreen, colors, isDarkMode);

  // Initialize selectedPlan with the active plan if it exists, otherwise use first plan
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [lastCompletedSegment, setLastCompletedSegment] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, 'starting' | 'pausing' | 'resuming' | 'ending' | null>>({});
  const [refreshing, setRefreshing] = useState(false);


  const [planProgress, setPlanProgress] = useState<Record<string, {
    totalSegments: number;
    completedSegments: number;
    progressPercentage: number;
    completedSegmentIds: string[];
  }>>({});
  
  // Add state for active plan from SQLite
  const [activePlan, setActivePlan] = useState<any | null>(null);
  
  // Reading Mode Modal State
  const [showReadingModeModal, setShowReadingModeModal] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [selectedSegmentTitle, setSelectedSegmentTitle] = useState<string>('');
  const [selectedSegmentRef, setSelectedSegmentRef] = useState<string>('');


  
  // Plan Order Enforcement Modal State
  const [showOrderEnforcementModal, setShowOrderEnforcementModal] = useState(false);
  const [enforcementData, setEnforcementData] = useState<{
    planId: string;
    planTitle: string;
    clickedSegmentId: string;
    nextSegmentId: string;
    nextSegmentTitle: string;
    isStartPlan: boolean;
  } | null>(null);

  // Load plan progress and active plan when component mounts
  useEffect(() => {
    const loadData = async () => {
      await loadPlanProgress();
      
      // Load active plan from SQLite
      try {
        const planData = await getActivePlanFromDB();
        setActivePlan(planData);
      } catch (error) {
        console.error('Error loading active plan:', error);
        setActivePlan(null);
      }
    };
    
    loadData();
  }, []);

  // Refresh when returning from reading a segment
  useFocusEffect(
    React.useCallback(() => {
      // Add a small delay to ensure database writes are complete
      const refreshWithDelay = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadPlanProgress();
      };
      refreshWithDelay();
    }, [])
  );

  const loadPlanProgress = async () => {
    const progress: Record<string, {
      totalSegments: number;
      completedSegments: number;
      progressPercentage: number;
      completedSegmentIds: string[];
    }> = {};
    
    // Load progress for each plan using the same database function as Home screen
    for (const plan of readingPlansData.plans) {
      const planProgressData = await getPlanProgress(plan.id);
      progress[plan.id] = planProgressData;
    }
    
    setPlanProgress(progress);
  };
  
  // Plan management functions using SQLite
  const pausePlanAction = async (planId: string) => {
    try {
      await pausePlan(planId);
      // Refresh active plan data
      await loadPlanProgress();
    } catch (error) {
      console.error('Error pausing plan:', error);
    }
  };
  
  const resumePlanAction = async (planId: string) => {
    try {
      await resumePlan(planId);
      // Refresh active plan data
      await loadPlanProgress();
    } catch (error) {
      console.error('Error resuming plan:', error);
    }
  };
  
  const endPlanAction = async (planId: string) => {
    try {
      await endPlan(planId);
      // Refresh active plan data
      await loadPlanProgress();
    } catch (error) {
      console.error('Error ending plan:', error);
    }
  };
  
  const switchPlanAction = async (newPlanId: string) => {
    try {
      // Pause current plan if exists
      if (activePlan && activePlan.planId !== newPlanId) {
        await pausePlan(activePlan.planId);
      }
      // Start new plan
      await startPlan(newPlanId);
      // Refresh data
      await loadPlanProgress();
    } catch (error) {
      console.error('Error switching plan:', error);
    }
  };

  const handleSegmentComplete = async (planId: string, segmentId: string) => {
    try {
      // Update local state immediately for UI responsiveness
      setPlanProgress(prev => {
        const currentProgress = prev[planId];
        if (currentProgress && !currentProgress.completedSegmentIds.includes(segmentId)) {
          const newCompletedCount = currentProgress.completedSegments + 1;
          const newProgressPercentage = currentProgress.totalSegments > 0 ? 
            (newCompletedCount / currentProgress.totalSegments) * 100 : 0;
          
          return {
            ...prev,
            [planId]: {
              ...currentProgress,
              completedSegments: newCompletedCount,
              progressPercentage: newProgressPercentage,
              completedSegmentIds: [...currentProgress.completedSegmentIds, segmentId]
            }
          };
        }
        return prev;
      });

      // Check for achievements
      const currentProgress = planProgress[planId];
      const completedCount = currentProgress ? currentProgress.completedSegments + 1 : 1;
      
      // Achievement for starting a plan
      if (completedCount === 1) {
        await unlockAchievement(
          'plan_started',
          'Plan Started!',
          'Started your first reading plan'
        );
      }

      // Achievement for completing 10 segments
      if (completedCount === 10) {
        await unlockAchievement(
          'plan_milestone_10',
          'First Milestone!',
          'Completed 10 segments in a reading plan'
        );
      }

      // Check if plan is completed
      const plan = readingPlansData.plans.find(p => p.id === planId);
      if (plan) {
        const totalSegments = Object.values(plan.segments)
          .reduce((acc, book) => acc + (book?.segments?.length || 0), 0);
        
        if (completedCount === totalSegments) {
          await unlockAchievement(
            `plan_complete_${planId}`,
            'Plan Completed!',
            `Completed the ${plan.title} reading plan`
          );
        }
      }

      // Auto-expand the plan and center on completed segment
      setSelectedPlanId(planId);
      setLastCompletedSegment(segmentId);
      
      // Refresh progress data
      await loadPlanProgress();
      
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

  // Function to get completion status for a segment in a plan
  const getSegmentCompletionForPlan = async (planId: string, segmentId: string) => {
    try {
      const status = await getSegmentCompletionStatus(segmentId, 'plan', planId);
      return status.isCompleted;
    } catch (error) {
      console.error('Error getting segment completion status:', error);
      return false;
    }
  };

  // Move these function definitions up here
  const getPlanBooksData = (planId: string) => {
    const plan = readingPlansData.plans.find(p => p.id === planId);
    if (!plan?.segments) return [];
    
    return Object.keys(plan.segments).map((key) => ({
      djhBook: key as SegmentIds,
      bookName: Books[key as SegmentIds]?.bookName ?? "Unknown Book",
      segments: (plan.segments[key as SegmentIds]?.segments ?? []) as SegmentKey[],
    }));
  };

  // Helper function to get the next uncompleted segment in a plan
  const getNextSegmentInPlan = (planId: string, completedSegmentIds: string[]) => {
    const plan = readingPlansData.plans.find(p => p.id === planId);
    if (!plan?.segments) return null;

    // Get all segments in order
    const allSegments: string[] = [];
    Object.values(plan.segments).forEach(bookData => {
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

  const getPlanSegmentCount = (planId: string) => {
    const plan = readingPlansData.plans.find(p => p.id === planId) as Plan | undefined;
    if (!plan?.segments) return 0;
    
    return Object.values(plan.segments).reduce(
      (acc, book) => acc + (book?.segments?.filter(s => !s.startsWith('I')).length ?? 0),
      0
    );
  };

  // Now use the functions
  const filteredPlans = useMemo(() => {
    return readingPlansData.plans.filter(plan => 
      !['SchoolYear2', 'SchoolYear3', 'test'].includes(plan.id)
    );
  }, []);

  const planBooksData = useMemo(() => {
    if (!selectedPlanId) return [];
    return getPlanBooksData(selectedPlanId);
  }, [selectedPlanId]);

  const booksArray = Object.keys(Books);

  // Add planBooksData to dependencies array
  useEffect(() => {
    if (params.scrollToPlan && scrollViewRef.current && planBooksData) {
      const planIndex = planBooksData.findIndex(item => item.djhBook === params.scrollToPlan);
      if (planIndex !== -1) {
        // Calculate approximate scroll position
        const headerOffset = 200; // Adjust based on your header height
        const itemHeight = 150; // Adjust based on your item height
        const scrollPosition = headerOffset + (planIndex * itemHeight);
        
        // Use setTimeout to ensure the scroll happens after render
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: scrollPosition,
            animated: true
          });
        }, 100);
      }
    }
  }, [params.scrollToPlan, params.timestamp, planBooksData]);

        const currentProgress = planProgress[selectedPlanId || ''];

  const handlePlanSelection = async (planId: string) => {
    if (activePlan && activePlan.planId !== planId) {
      Alert.alert(
        'Switch Reading Plan?',
        `You are currently on "${activePlan.planId}". Would you like to pause it and switch to "${planId}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Switch Plan',
            onPress: async () => {
              await switchPlanAction(planId);
              setSelectedPlanId(planId); // Update selected plan after switching
            }
          }
        ]
      );
    } else {
      setSelectedPlanId(planId); // Update selected plan immediately if no active plan
    }
  };

  const getPlanStatus = (planId: string) => {
    if (!activePlan || activePlan.planId !== planId) return 'not-started';
    if (activePlan.isCompleted) return 'completed';
    return activePlan.isPaused ? 'paused' : 'active';
  };

  // Get the plan description based on the selected plan
  const getPlanDescription = (planId: string) => {
    switch (planId) {
      case "Bible1Year":
        return "Experience the entire Biblical narrative in one year. This comprehensive plan takes you through the complete story of Scripture, from Creation to Revelation, helping you understand God's grand plan of redemption.";
      case "SchoolYear1":
        return "Perfect for students and educators, this plan follows the academic calendar with carefully selected narrative passages that tell the Bible's key stories and teachings.";
      case "SchoolYear2":
        return "Continue your Biblical education with this second academic year plan, diving deeper into historical books, prophecy, and New Testament teachings.";
      case "SchoolYear3":
        return "Complete your Biblical foundation with this third academic year plan, exploring wisdom literature, prophetic books, and the life of Christ.";
      case "NT100Days":
        return "An intensive journey through the New Testament in 100 days. Perfect for understanding the life of Jesus, the early church, and the foundations of Christian faith.";
      default:
        return "";
    }
  };

  // Handle segment selection with plan order enforcement
  const handleSegmentSelect = (segmentId: string) => {
    if (!segmentId || !selectedPlanId) {
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
          planId: selectedPlanId,
          context: 'plan'
        }
      });
      return;
    }

    // For story segments, check plan order enforcement
    const plan = readingPlansData.plans.find(p => p.id === selectedPlanId);
    const isActive = activePlan?.planId === selectedPlanId;
    const completedSegmentIds = planProgress[selectedPlanId]?.completedSegmentIds || [];
    
    if (!isActive) {
      // Plan not started - show popup to start plan
      const nextSegment = getNextSegmentInPlan(selectedPlanId, completedSegmentIds);
      if (nextSegment) {
        setEnforcementData({
          planId: selectedPlanId,
          planTitle: plan?.title || 'Reading Plan',
          clickedSegmentId: segmentId,
          nextSegmentId: nextSegment.segmentId,
          nextSegmentTitle: nextSegment.title,
          isStartPlan: true
        });
        setShowOrderEnforcementModal(true);
        return;
      }
    } else {
      // Plan is active - check if this is the next segment
      const nextSegment = getNextSegmentInPlan(selectedPlanId, completedSegmentIds);
      if (nextSegment && nextSegment.segmentId !== segmentId) {
        // User clicked on a different segment - show enforcement popup
        setEnforcementData({
          planId: selectedPlanId,
          planTitle: plan?.title || 'Reading Plan',
          clickedSegmentId: segmentId,
          nextSegmentId: nextSegment.segmentId,
          nextSegmentTitle: nextSegment.title,
          isStartPlan: false
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
        planId: selectedPlanId || '',
        context: 'plan'
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

  // Order Enforcement Modal Handlers
  const handleStartPlanAndRead = async () => {
    if (!enforcementData) return;
    
    setShowOrderEnforcementModal(false);
    
    // Start the plan
    setLoadingStates(prev => ({ ...prev, [enforcementData.planId]: 'starting' }));
    try {
      await startPlan(enforcementData.planId);
      
      // Navigate to the first story of the plan
      const segmentData = SegmentTitles[enforcementData.nextSegmentId as keyof typeof SegmentTitles];
      if (segmentData) {
        setSelectedSegmentId(enforcementData.nextSegmentId);
        setSelectedSegmentTitle(segmentData.title);
        setSelectedSegmentRef((segmentData as any).ref || '');
        setShowReadingModeModal(true);
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [enforcementData.planId]: null }));
    }
  };

  const handleReadNextStory = () => {
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

  const handleCancelEnforcement = () => {
    setShowOrderEnforcementModal(false);
    setEnforcementData(null);
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPlanProgress();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handlePress = (segmentId: string) => {
    router.push({
      pathname: "/[segment]",
      params: { 
        segment: `ENG-NLT-${segmentId}`,
        planId: selectedPlanId || '',
        context: 'plan'
      }
    });
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'active':
        return {
          backgroundColor: isDarkMode ? '#4CAF5055' : '#4CAF5033',
          color: '#4CAF50'
        };
      case 'paused':
        return {
          backgroundColor: isDarkMode ? '#FFC10755' : '#FFC10733',
          color: '#FFC107'
        };
      case 'completed':
        return {
          backgroundColor: isDarkMode ? '#2196F355' : '#2196F333',
          color: '#2196F3'
        };
      default:
        return {
          backgroundColor: colors.border,
          color: colors.secondary
        };
    }
  };

  const renderPlanItem = ({ item: plan }: { item: Plan }) => {
    const isSelected = selectedPlanId === plan.id;

    const isActive = activePlan?.planId === plan.id;
    const isPaused = activePlan && isActive && activePlan.isPaused;
    const isCompleted = activePlan && isActive && activePlan.isCompleted;
    const segmentCount = getPlanSegmentCount(plan.id);
    const planBooksData = isSelected ? getPlanBooksData(plan.id) : [];
    const progressData = planProgress[plan.id];
    const completedSegments = progressData?.completedSegmentIds || [];
    const completedCount = progressData?.completedSegments || 0;
    const totalCount = progressData?.totalSegments || segmentCount;
    const progressPercentage = progressData?.progressPercentage || 0;
    const planStyle = PLAN_STYLES[plan.id as keyof typeof PLAN_STYLES] || {
      color: "#888888",
      icon: "book"
    };
    const status = getPlanStatus(plan.id);
    const statusStyle = getStatusStyle(status);

    return (
      <View style={styles.planContainer}>
        <TouchableOpacity 
          style={styles.planHeader}
          onPress={() => setSelectedPlanId(isSelected ? null : plan.id)}
          activeOpacity={0.7}
        >
          <View style={styles.planInfo}>
            <View style={styles.leftContent}>
              <View style={styles.titleContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                </View>
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
                    if (activePlan && activePlan.planId !== plan.id) {
                      Alert.alert(
                        'Switch Reading Plan?',
                        `You are currently on "${activePlan.planId}". Would you like to pause it and switch to "${plan.title}"?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Switch Plan', 
                            onPress: async () => {
                              setLoadingStates(prev => ({ ...prev, [plan.id]: 'starting' }));
                              try {
                                await startPlan(plan.id);
                              } finally {
                                setLoadingStates(prev => ({ ...prev, [plan.id]: null }));
                              }
                            }
                          }
                        ]
                      );
                    } else {
                      setLoadingStates(prev => ({ ...prev, [plan.id]: 'starting' }));
                      try {
                        await startPlan(plan.id);
                      } finally {
                        setLoadingStates(prev => ({ ...prev, [plan.id]: null }));
                      }
                    }
                  }}
                  disabled={loadingStates[plan.id] === 'starting'}
                >
                  <Feather 
                    name={loadingStates[plan.id] === 'starting' ? "clock" : "play-circle"} 
                    size={24} 
                    color={loadingStates[plan.id] === 'starting' ? "#FF9800" : "#666666"} 
                  />
                </TouchableOpacity>
              )}
              {isActive && !isPaused && !isCompleted && (
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    Alert.alert(
                      'Reading Plan Options',
                      `What would you like to do with "${plan.title}"?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Pause Plan', 
                          onPress: async () => {
                            setLoadingStates(prev => ({ ...prev, [plan.id]: 'pausing' }));
                            try {
                              await pausePlanAction(plan.id);
                            } finally {
                              setLoadingStates(prev => ({ ...prev, [plan.id]: null }));
                            }
                          }
                        },
                        { 
                          text: 'End Plan', 
                          style: 'destructive',
                          onPress: () => {
                            Alert.alert(
                              'End Reading Plan?',
                              `Are you sure you want to end "${plan.title}"? This will delete all progress and cannot be undone.`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                                        { 
                          text: 'End Plan', 
                          style: 'destructive',
                          onPress: async () => {
                            setLoadingStates(prev => ({ ...prev, [plan.id]: 'ending' }));
                            try {
                              await endPlanAction(plan.id);
                              // Immediately refresh progress data
                              await loadPlanProgress();
                            } finally {
                              setLoadingStates(prev => ({ ...prev, [plan.id]: null }));
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
                    setLoadingStates(prev => ({ ...prev, [plan.id]: 'resuming' }));
                    try {
                      await resumePlanAction(plan.id);
                    } finally {
                      setLoadingStates(prev => ({ ...prev, [plan.id]: null }));
                    }
                  }}
                  disabled={loadingStates[plan.id] === 'resuming'}
                >
                  <Feather 
                    name={loadingStates[plan.id] === 'resuming' ? "clock" : "play-circle"} 
                    size={24} 
                    color={loadingStates[plan.id] === 'resuming' ? "#FF9800" : "#4CAF50"} 
                  />
                </TouchableOpacity>
              )}
              <Ionicons 
                name={isSelected ? "chevron-up" : "chevron-down"} 
                size={24} 
                color={colors.secondary}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Progress text has been commented out as requested */}
        {/* {!isSelected && (
          <Text style={styles.progressText}>
            Progress: {progress.toFixed(1)}%
          </Text>
        )} */}

        {isSelected && (
          <>
            <Text style={styles.description}>
              {getPlanDescription(plan.id)}
            </Text>
            
            {/* Progress text has been commented out as requested */}
            {/* <Text style={styles.progressText}>
              Progress: {progress.toFixed(1)}%
            </Text> */}

            <View style={styles.booksContainer}>
              <View style={styles.accordionContainer}>
                {planBooksData.map((item) => {
                  const bookIndex = booksArray.findIndex(
                    (book) => book === item.djhBook
                  );
                  // Use the plan-specific completion status
                  const completedSegmentsMap = completedSegments.reduce((acc, id) => {
                    acc[id] = true;
                    return acc;
                  }, {} as Record<string, boolean>);
                  return (
                    <Accordion 
                      key={item.djhBook}
                      item={item} 
                      bookIndex={bookIndex}
                      onSegmentComplete={(segmentId) => handleSegmentComplete(plan.id, segmentId)}
                      onSegmentSelect={handleSegmentSelect}
                      context="plan"
                      showGlobalCompletion={false}
                      planId={plan.id}
                      completedSegments={completedSegmentsMap}
                      highlightedSegment={lastCompletedSegment}
                      style={{ 
                        backgroundColor: colors.card,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border
                      }}
                    />
                  );
                })}
              </View>
            </View>
          </>
        )}
      </View>
    );
  };

  // Organize plans by status
  const organizedPlans = useMemo(() => {
    const active: Plan[] = [];
    const inactive: Plan[] = [];
    const completed: Plan[] = [];

    filteredPlans.forEach(plan => {
      const isActive = activePlan?.planId === plan.id && !activePlan.isPaused;
      const isCompleted = activePlan?.planId === plan.id && activePlan.isCompleted;
      
      if (isCompleted) {
        completed.push(plan);
      } else if (isActive) {
        active.push(plan);
      } else {
        inactive.push(plan);
      }
    });

    // Sort inactive plans 
    const sortPlans = (plans: Plan[]) => {
      return plans.sort((a, b) => {
        const aStatus = activePlan?.planId === a.id && activePlan.isPaused ? 1 : 2;
        const bStatus = activePlan?.planId === b.id && activePlan.isPaused ? 1 : 2;
        if (aStatus !== bStatus) return aStatus - bStatus;
        return a.title.localeCompare(b.title);
      });
    };

    return { 
      active, 
      inactive: sortPlans(inactive),
      completed: sortPlans(completed)
    };
  }, [filteredPlans, activePlan]);

  // Add handleScroll function to match Home.tsx
  const handleScroll = (event: any) => {
    // Implementation of handleScroll function
  };

  // Memoize the renderItem function
  const renderItem = useCallback(({ item }: { item: { title: string; data: Plan[] } }) => {
    return renderCategorySection(item.title, item.data);
  }, [selectedPlanId]); // Add selectedPlanId to dependencies

  // Memoize the keyExtractor function
  const keyExtractor = useCallback((item: { title: string; data: Plan[] }) => item.title, []);

  // Memoize the ListHeaderComponent
  const ListHeaderComponent = useCallback(() => (
    <View style={styles.welcomeSection}>
      <View >
        <Text style={styles.welcomeTitle}>Reading Plans</Text>
      </View>
      <Text style={styles.welcomeText}>
        Welcome to the Bible Reading Plans and Challenges screen, where you can find personalized reading plans and spiritual challenges designed to deepen your understanding of Scripture and transform your faith.
      </Text>
    </View>
  ), [styles.welcomeSection, styles.welcomeTitle, styles.welcomeText]);

  // Create sections data for FlatList
  const sections = useMemo(() => {
    const result = [];
    
    if (organizedPlans.active.length > 0) {
      result.push({
        title: 'Active Plans',
        data: organizedPlans.active
      });
    }
    
    if (organizedPlans.inactive.length > 0) {
      result.push({
        title: 'Available Plans',
        data: organizedPlans.inactive
      });
    }
    
    if (organizedPlans.completed.length > 0) {
      result.push({
        title: 'Completed Plans',
        data: organizedPlans.completed
      });
    }
    
    return result;
  }, [organizedPlans]);

  const renderCategorySection = useCallback((title: string, plans: Plan[]) => (
    <View style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{title}</Text>
      {plans.map((plan) => (
        <View key={plan.id}>
          {renderPlanItem({ item: plan })}
        </View>
      ))}
    </View>
  ), [selectedPlanId]); // Add selectedPlanId to dependencies

  return (
    <SafeAreaView style={styles.container}>
      
      <FlatList
        style={styles.content}
        data={sections}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={ListHeaderComponent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
        updateCellsBatchingPeriod={100}
        getItemLayout={(data, index) => ({
          length: 120, // Estimated height per plan item
          offset: 120 * index,
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

      {/* Order Enforcement Modal */}
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
              {enforcementData.isStartPlan ? 'Start Reading Plan' : 'Follow Reading Order'}
            </Text>
            
            <Text style={{
              fontSize: 16,
              color: colors.text,
              marginBottom: 20,
              textAlign: 'center',
              lineHeight: 22,
            }}>
              {enforcementData.isStartPlan 
                ? `To get the most out of "${enforcementData.planTitle}", stories should be read in order. Start with the first story:`
                : `To maintain continuity in "${enforcementData.planTitle}", we recommend reading stories in order. Your next story is:`
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
                onPress={handleCancelEnforcement}
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
                onPress={enforcementData.isStartPlan ? handleStartPlanAndRead : handleReadNextStory}
              >
                <Text style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: '600',
                }}>
                  {enforcementData.isStartPlan ? 'Start Plan' : 'Read Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default PlanScreen;