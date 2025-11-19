import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Dimensions,
  Pressable,
  Platform,
  RefreshControl,
  Animated
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';
import logger from '@/utils/logger';

// Import the reading plans and challenges data
import readingPlansData from "../../assets/data/ReadingPlansChallenges.json";
import Accordion, { AccordionItem, accordionColor } from "@/components/navigation/NavBook";
import Books from "@/assets/data/BookChapterList.json";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import ChronologicalView from '@/components/navigation/ChronologicalView';
import FRA_UI from '@/assets/data/FRA-UI.json';

import { useSQLiteGlobalContext } from "@/context/SQLiteGlobalContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  markSegmentComplete, 
  getSegmentCompletionStatus, 
  unlockAchievement, 
  getPlanProgress,
  getChallengeProgress,
  getActivePlanFromDB,
  getActiveChallengesFromDB,
  startPlan,
  pausePlan,
  resumePlan,
  endPlan,
  startChallenge,
  pauseChallenge,
  resumeChallenge,
  endChallenge
} from "@/api/sqlite";
import ReadingModeModal from '@/components/GroupReading/ReadingModeModal';
import { useGroupReading } from '@/context/GroupReadingContext';

// Type definitions
interface ReadingPlansData {
  plans: {
    id: string;
    title: string;
    description: string;
    shortDescription?: string;
    longDescription?: string;
    image: string;
    segments: Record<string, { segments: string[] }>;
  }[];
  challenges: {
    id: string;
    title: string;
    description: string;
    shortDescription?: string;
    longDescription: string;
    image: string;
    chronologicalOrder?: boolean;
    chronologicalMapping?: string;
    segments: Record<string, { segments: string[] }>;
  }[];
}

const typedReadingPlansData = readingPlansData as unknown as ReadingPlansData;

interface UnifiedPlan {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  longDescription?: string;
  type: 'plan' | 'challenge';
  segments: Record<string, { segments: string[] }>;
}

// Category definitions (will be translated dynamically)
const PLAN_CATEGORIES = {
  LONG: 'Whole Year Plans',
  MEDIUM: 'Monthly Challenges', 
  SHORT: 'Mini Studies'
};

// Categorization thresholds
const CATEGORY_THRESHOLDS = {
  LONG: 100,
  MEDIUM: 30
};

// Seasonal challenge visibility logic (copied from Reading-Challenges.tsx)
const isSeasonalChallengeVisible = (challengeId: string): boolean => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  
  switch (challengeId) {
    case 'lentenReflectionChronological':
      return currentMonth >= 2 && currentMonth <= 4;
    case 'christmas12':
      return currentMonth === 12 || (currentMonth === 1 && currentDay <= 6);
    case 'adventJourneyChronological':
      return currentMonth >= 11 && currentMonth <= 12;
    case 'jesusFilm':
      return false;
    default:
      return true;
  }
};

const createStyles = (isLargeScreen: boolean, colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
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
  activePlansSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.text,
    letterSpacing: -0.3,
  },
  activePlanItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'transparent',
  },
  activePlanItemLast: {
    borderBottomWidth: 0,
  },
  activePlanItemPressed: {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  },
  activePlanContent: {
    flex: 1,
    marginRight: 10, // 10px padding from dropdown arrow
  },
  activePlanTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  activePlanSubtitle: {
    fontSize: 14,
    color: colors.secondary,
  },
  activePlanControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pauseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF9F0A",
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
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
  availablePlansSection: {
    flex: 1,
  },
  availablePlansHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  scrollIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  scrollDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  scrollDotActive: {
    width: 20,
    height: 8,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  categoriesScrollContainer: {
    // Remove flex: 1 to allow natural height expansion when content is expanded
  },
  categoriesScroll: {
    flexGrow: 1,
  },
  categoryContainer: {
    width: Dimensions.get('window').width,
    paddingHorizontal: 20,
  },
  categoryHeader: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 14,
    color: colors.secondary,
  },
  plansList: {
    // Remove maxHeight to allow full content visibility
  },
  planItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'transparent',
  },
  planItemLast: {
    borderBottomWidth: 0,
  },
  planItemPressed: {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  },
  planContent: {
    flex: 1,
    marginRight: 10, // 10px padding from dropdown arrow
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,                     // Match home page subtitle
    color: colors.secondary,          // Match home page subtitle
    marginBottom: 4,
    lineHeight: 20,                   // Better line height for 14px font
    width: '100%',                    // Align with progress bar width (full content width)
  },
  planSubtitle: {
    fontSize: 14,
    color: colors.secondary,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonExpanded: {
    backgroundColor: colors.primary,
  },
  chevronIcon: {
    transform: [{ rotate: '0deg' }],
  },
  chevronIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  listContainer: {
    paddingBottom: 120, // Increase padding to ensure bottom content is accessible
    flexGrow: 1,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonLoading: {
    opacity: 0.7,
  },
  expandedContent: {
    marginTop: 16,
  },
  description: {
    color: colors.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  booksContainer: {
    backgroundColor: 'transparent',
  },
  accordionContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
});

const ReadingPlansScreen = () => {
  const { updateSegmentId } = useSQLiteGlobalContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { expandedPlan, expandedChallenge, completedSegment, timestamp } = params;
  
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    
    return () => subscription?.remove();
  }, []);
  
  const isLargeScreen = screenWidth >= 768;
  const { colors, isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const { currentSession, stopSession } = useGroupReading();
  const styles = createStyles(isLargeScreen, colors, isDarkMode);

  // State management
  const [activePlansData, setActivePlansData] = useState<Record<string, any>>({});
  const [activeChallengesData, setActiveChallengesData] = useState<Record<string, any>>({});
  const [planProgress, setPlanProgress] = useState<Record<string, any>>({});
  const [challengeProgress, setChallengeProgress] = useState<Record<string, any>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, string | null>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [lastCompletedSegment, setLastCompletedSegment] = useState<string | null>(null);
  
  // Reading Mode Modal State
  const [showReadingModeModal, setShowReadingModeModal] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [selectedSegmentTitle, setSelectedSegmentTitle] = useState<string>('');
  const [selectedSegmentRef, setSelectedSegmentRef] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedPlanType, setSelectedPlanType] = useState<'plan' | 'challenge'>('plan');

  // Order Enforcement Modal State
  const [showOrderEnforcementModal, setShowOrderEnforcementModal] = useState(false);
  const [enforcementData, setEnforcementData] = useState<{
    planId: string;
    planTitle: string;
    planType: 'plan' | 'challenge';
    clickedSegmentId: string;
    nextSegmentId: string;
    nextSegmentTitle: string;
    isStartPlan: boolean;
  } | null>(null);

  // Start Confirmation Modal State
  const [showStartConfirmationModal, setShowStartConfirmationModal] = useState(false);
  const [startConfirmationData, setStartConfirmationData] = useState<{
    planId: string;
    planTitle: string;
    planType: 'plan' | 'challenge';
    firstStory: {
      segmentId: string;
      title: string;
      book: string;
      reference: string;
      fullReference: string;
    } | null;
  } | null>(null);

  // Refs for scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  const progressAnimations = useRef<Record<string, Animated.Value>>({}).current;

  // Books array for indexing
  const booksArray = Object.keys(Books);

  // Calculate story count for a plan/challenge
  const getStoryCount = (item: UnifiedPlan): number => {
    if (!item.segments) return 0;
    
    // Count only story segments (exclude introduction segments that start with 'I')
    const storySegments = Object.values(item.segments).reduce(
      (acc, book) => acc + (book?.segments?.filter((s: string) => !s.startsWith('I')).length ?? 0),
      0
    );
    
    return storySegments;
  };

  // Categorize plans by story count
  const categorizePlan = (storyCount: number): string => {
    if (storyCount >= CATEGORY_THRESHOLDS.LONG) {
      return PLAN_CATEGORIES.LONG;
    } else if (storyCount >= CATEGORY_THRESHOLDS.MEDIUM) {
      return PLAN_CATEGORIES.MEDIUM;
    } else {
      return PLAN_CATEGORIES.SHORT;
    }
  };

  // Combine plans and challenges into unified list
  const unifiedPlans = useMemo(() => {
    const plans: UnifiedPlan[] = typedReadingPlansData.plans
      .filter(plan => !['SchoolYear2', 'SchoolYear3', 'test'].includes(plan.id))
      .map(plan => ({
        id: plan.id,
        title: plan.title,
        description: plan.description,
        shortDescription: plan.shortDescription,
        longDescription: plan.longDescription,
        type: 'plan' as const,
        segments: plan.segments
      }));

    const challenges: UnifiedPlan[] = typedReadingPlansData.challenges
      .filter(challenge => isSeasonalChallengeVisible(challenge.id))
      .map(challenge => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        shortDescription: challenge.shortDescription,
        longDescription: challenge.longDescription,
        type: 'challenge' as const,
        segments: challenge.segments
      }));

    return [...plans, ...challenges];
  }, []);

  // Organize plans by category and status
  const organizedPlans = useMemo(() => {
    const active: UnifiedPlan[] = [];
    const categorized = {
      [PLAN_CATEGORIES.LONG]: [] as UnifiedPlan[],
      [PLAN_CATEGORIES.MEDIUM]: [] as UnifiedPlan[],
      [PLAN_CATEGORIES.SHORT]: [] as UnifiedPlan[],
    };

    unifiedPlans.forEach(plan => {
      let isActive = false;
      
      if (plan.type === 'plan') {
        isActive = !!activePlansData[plan.id] && !activePlansData[plan.id].isCompleted;
      } else {
        isActive = !!activeChallengesData[plan.id] && !activeChallengesData[plan.id].isCompleted;
      }

      if (isActive) {
        active.push(plan);
      } else {
        const storyCount = getStoryCount(plan);
        const category = categorizePlan(storyCount);
        categorized[category].push(plan);
      }
    });

    return { active, categorized };
  }, [unifiedPlans, activePlansData, activeChallengesData]);

  // Categories for scrolling
  const categories = useMemo(() => {
    const storiesWord = language === 'fr' ? 'histoires' : 'stories';
    const plansWord = language === 'fr' ? 'plans' : 'plans';
    
    return [
      {
        title: t('UI.planCategories.wholeYearPlans'),
        subtitle: `100+ ${storiesWord} • ${organizedPlans.categorized[PLAN_CATEGORIES.LONG].length} ${plansWord}`,
        plans: organizedPlans.categorized[PLAN_CATEGORIES.LONG]
      },
      {
        title: t('UI.planCategories.monthlyChallenges'),
        subtitle: `30-100 ${storiesWord} • ${organizedPlans.categorized[PLAN_CATEGORIES.MEDIUM].length} ${plansWord}`,
        plans: organizedPlans.categorized[PLAN_CATEGORIES.MEDIUM]
      },
      {
        title: t('UI.planCategories.miniStudies'),
        subtitle: `${language === 'fr' ? 'Moins de' : 'Under'} 30 ${storiesWord} • ${organizedPlans.categorized[PLAN_CATEGORIES.SHORT].length} ${plansWord}`,
        plans: organizedPlans.categorized[PLAN_CATEGORIES.SHORT]
      }
    ];
  }, [organizedPlans, language, t]);

  // Load data functions
  const loadAllProgress = async () => {
    const planProgressData: Record<string, any> = {};
    const challengeProgressData: Record<string, any> = {};
    
    // Load progress for all plans
    for (const plan of typedReadingPlansData.plans) {
      if (!['SchoolYear2', 'SchoolYear3', 'test'].includes(plan.id)) {
        const progress = await getPlanProgress(plan.id);
        planProgressData[plan.id] = progress;
      }
    }
    
    // Load progress for all challenges
    for (const challenge of typedReadingPlansData.challenges) {
      if (isSeasonalChallengeVisible(challenge.id)) {
        const progress = await getChallengeProgress(challenge.id);
        challengeProgressData[challenge.id] = progress;
      }
    }
    
    setPlanProgress(planProgressData);
    setChallengeProgress(challengeProgressData);
  };

  const loadActiveData = async () => {
    try {
      const activePlan = await getActivePlanFromDB();
      const activeChallenges = await getActiveChallengesFromDB();
      
      setActivePlansData(activePlan ? { [activePlan.planId]: activePlan } : {});
      setActiveChallengesData(activeChallenges);
    } catch (error) {
      logger.error('Error loading active data:', error);
      setActivePlansData({});
      setActiveChallengesData({});
    }
  };

  // Initialize animation values
  useEffect(() => {
    unifiedPlans.forEach(plan => {
      if (!progressAnimations[plan.id]) {
        progressAnimations[plan.id] = new Animated.Value(0);
      }
    });
  }, [unifiedPlans]);

  // Animate progress bars
  useEffect(() => {
    const allProgress = { ...planProgress, ...challengeProgress };
    Object.entries(allProgress).forEach(([planId, progress]) => {
      const animation = progressAnimations[planId];
      if (animation) {
        Animated.timing(animation, {
          toValue: progress.progressPercentage || 0,
          duration: 600,
          useNativeDriver: false,
        }).start();
      }
    });
  }, [planProgress, challengeProgress]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      await loadActiveData();
      await loadAllProgress();
    };
    
    loadData();
  }, []);

  // Refresh when returning from reading
  useFocusEffect(
    React.useCallback(() => {
      const refreshWithDelay = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadActiveData();
        await loadAllProgress();
      };
      refreshWithDelay();
    }, [])
  );

  // Handle navigation parameters for expanding plans/challenges after completion
  useEffect(() => {
    if (expandedPlan && timestamp) {
      logger.info('📍 Expanding plan after completion:', expandedPlan);
      setExpandedPlanId(expandedPlan as string);
      
      if (completedSegment) {
        setLastCompletedSegment(completedSegment as string);
        
        // Scroll to the completed segment after a brief delay
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, 500);
      }
    } else if (expandedChallenge && timestamp) {
      logger.info('📍 Expanding challenge after completion:', expandedChallenge);
      setExpandedPlanId(expandedChallenge as string);
      
      if (completedSegment) {
        setLastCompletedSegment(completedSegment as string);
        
        // Scroll to the completed segment after a brief delay
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, 500);
      }
    }
  }, [expandedPlan, expandedChallenge, completedSegment, timestamp]);

  // Plan management functions
  const startPlanAction = async (planId: string, type: 'plan' | 'challenge') => {
    try {
      if (type === 'plan') {
        await startPlan(planId);
      } else {
        await startChallenge(planId);
      }
      await loadActiveData();
      await loadAllProgress();
    } catch (error) {
      logger.error(`Error starting ${type}:`, error);
    }
  };

  const pausePlanAction = async (planId: string, type: 'plan' | 'challenge') => {
    try {
      if (type === 'plan') {
        await pausePlan(planId);
      } else {
        await pauseChallenge(planId);
      }
      await loadActiveData();
      await loadAllProgress();
    } catch (error) {
      logger.error(`Error pausing ${type}:`, error);
    }
  };

  const resumePlanAction = async (planId: string, type: 'plan' | 'challenge') => {
    try {
      if (type === 'plan') {
        await resumePlan(planId);
      } else {
        await resumeChallenge(planId);
      }
      await loadActiveData();
      await loadAllProgress();
    } catch (error) {
      logger.error(`Error resuming ${type}:`, error);
    }
  };

  const endPlanAction = async (planId: string, type: 'plan' | 'challenge') => {
    try {
      if (type === 'plan') {
        await endPlan(planId);
      } else {
        await endChallenge(planId);
      }
      await loadActiveData();
      await loadAllProgress();
    } catch (error) {
      logger.error(`Error ending ${type}:`, error);
    }
  };

  // Get books data for plan/challenge expansion
  const getPlanBooksData = (planId: string, type: 'plan' | 'challenge') => {
    const item = type === 'plan' 
      ? typedReadingPlansData.plans.find(p => p.id === planId)
      : typedReadingPlansData.challenges.find(c => c.id === planId);
    
    if (!item?.segments) return [];
    
    return Object.keys(item.segments).map((key) => ({
      djhBook: key as keyof typeof Books,
      bookName: Books[key as keyof typeof Books]?.bookName ?? "Unknown Book",
      segments: (item.segments[key as keyof typeof item.segments]?.segments ?? []) as (keyof typeof SegmentTitles)[],
    }));
  };

  // Get plan description
  const getPlanDescription = (planId: string, type: 'plan' | 'challenge') => {
    if (type === 'challenge') {
      const challenge = typedReadingPlansData.challenges.find(c => c.id === planId);
      return challenge?.longDescription || challenge?.description || "";
    }
    
    // For plans, check if they have longDescription first
    const plan = typedReadingPlansData.plans.find(p => p.id === planId);
    if (plan?.longDescription) {
      return plan.longDescription;
    }
    
    // Plan descriptions (keeping existing logic from Plan.tsx)
    switch (planId) {
      case "Bible1Year":
        return "Experience the entire Biblical narrative in one year. This comprehensive plan takes you through the complete story of Scripture, from Creation to Revelation, helping you understand God's grand plan of redemption.";
      case "SchoolYear1":
        return "Perfect for students and educators, this plan follows the academic calendar with carefully selected narrative passages that tell the Bible's key stories and teachings.";
      case "NT100Days":
        return "An intensive journey through the New Testament in 100 days. Perfect for understanding the life of Jesus, the early church, and the foundations of Christian faith.";
      default:
        return "";
    }
  };

  // Handle segment completion
  const handleSegmentComplete = useCallback(async (planId: string, segmentId: string, type: 'plan' | 'challenge') => {
    try {
      await markSegmentComplete(segmentId, type, undefined, planId);
      
      // Update local progress
      if (type === 'plan') {
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
      } else {
        setChallengeProgress(prev => {
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
      }

      // Auto-expand the plan and mark completed segment
      setExpandedPlanId(planId);
      setLastCompletedSegment(segmentId);
      
      // Refresh progress data
      await loadAllProgress();
      
    } catch (error) {
      logger.error('Error completing segment:', error);
    }
  }, []);

  // Handle segment selection (this will trigger reading mode modal)
  const handleSegmentSelect = useCallback((segmentId: string) => {
    if (!segmentId || !expandedPlanId) return;
    
    const translatedInfo = getTranslatedSegmentInfo(segmentId);
    if (!translatedInfo) return;
    
    setSelectedSegmentId(segmentId);
    setSelectedSegmentTitle(translatedInfo.title);
    setSelectedSegmentRef(translatedInfo.fullReference);
    
    // Set plan context based on expanded plan type
    const plan = organizedPlans.active.find(p => p.id === expandedPlanId) || 
                 Object.values(organizedPlans.categorized).flat().find(p => p.id === expandedPlanId);
    
    if (plan) {
      setSelectedPlanId(plan.id);
      setSelectedPlanType(plan.type);
    }
    
    setShowReadingModeModal(true);
  }, [expandedPlanId, organizedPlans, language]);

  // Helper function to get translated segment title and book name
  const getTranslatedSegmentInfo = (segmentId: string) => {
    const segmentData = SegmentTitles[segmentId as keyof typeof SegmentTitles];
    if (!segmentData) return null;

    let title = segmentData.title || 'Unknown Story';
    let bookName = segmentData.book?.[0] || '';
    const reference = (segmentData as any).ref || '';

    // Translate title if in French mode
    if (language === 'fr') {
      const frenchTitle = (FRA_UI.Titles as any)[segmentId];
      if (frenchTitle) {
        title = frenchTitle;
      }

      // Translate book name if in French mode
      if (bookName) {
        const bookCodeUpper = bookName.toUpperCase();
        const frenchBook = (FRA_UI.bookNames as any)[bookCodeUpper];
        if (frenchBook && frenchBook.bookName) {
          bookName = frenchBook.bookName;
        }
      }
    }

    return {
      title,
      bookName,
      reference,
      fullReference: reference ? `${bookName} ${reference}` : bookName
    };
  };

  // Helper function to get first story in plan/challenge
  const getFirstStoryInPlan = (planId: string, type: 'plan' | 'challenge') => {
    const item = type === 'plan' 
      ? typedReadingPlansData.plans.find(p => p.id === planId)
      : typedReadingPlansData.challenges.find(c => c.id === planId);
    
    if (!item?.segments) return null;

    const allSegments: string[] = [];
    Object.values(item.segments).forEach(bookData => {
      if (bookData?.segments) {
        allSegments.push(...bookData.segments);
      }
    });

    const firstStorySegment = allSegments.find(s => !s.startsWith('I'));
    
    if (firstStorySegment) {
      const translatedInfo = getTranslatedSegmentInfo(firstStorySegment);
      if (translatedInfo) {
        return {
          segmentId: firstStorySegment,
          title: translatedInfo.title,
          book: translatedInfo.bookName,
          reference: translatedInfo.reference,
          fullReference: translatedInfo.fullReference
        };
      }
    }
    
    return null;
  };

  // Handle plan item press (for expansion)
  const handlePlanPress = (plan: UnifiedPlan) => {
    setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id);
  };

  // Handle plan start button press  
  const handleStartPlanPress = (plan: UnifiedPlan) => {
    const firstStory = getFirstStoryInPlan(plan.id, plan.type);
    // Get translated plan title
    const translatedPlanTitle = language === 'fr' && t(`UI.plans.${plan.id}.title`) !== `UI.plans.${plan.id}.title`
      ? t(`UI.plans.${plan.id}.title`)
      : plan.title;
    
    setStartConfirmationData({
      planId: plan.id,
      planTitle: translatedPlanTitle,
      planType: plan.type,
      firstStory: firstStory
    });
    setShowStartConfirmationModal(true);
  };

  // Handle scroll for categories
  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const categoryIndex = Math.round(scrollX / screenWidth);
    setCurrentCategoryIndex(categoryIndex);
  };

  // Render active plan item
  const renderActivePlanItem = ({ item, index, isLast }: { item: UnifiedPlan; index: number; isLast: boolean }) => {
    const isActive = item.type === 'plan' ? activePlansData[item.id] : activeChallengesData[item.id];
    if (!isActive) return null;

    const progress = item.type === 'plan' ? planProgress[item.id] : challengeProgress[item.id];
    const storyCount = getStoryCount(item);
    const completedCount = progress?.completedSegments || 0;
    const isPaused = isActive.isPaused;
    const isExpanded = expandedPlanId === item.id;
    const planBooksData = isExpanded ? getPlanBooksData(item.id, item.type) : [];
    const completedSegments = progress?.completedSegmentIds || [];
    const planTitleColor = getPlanTitleColor(item);

    return (
      <View>
        <Pressable
          style={({ pressed }) => [
            styles.activePlanItem,
            isLast && !isExpanded && styles.activePlanItemLast,
            pressed && styles.activePlanItemPressed
          ]}
          onPress={() => handlePlanPress(item)}
        >
          <View style={styles.activePlanContent}>
            <Text style={[styles.activePlanTitle, { color: planTitleColor }]}>
              {language === 'fr' && t(`UI.plans.${item.id}.title`) !== `UI.plans.${item.id}.title`
                ? t(`UI.plans.${item.id}.title`)
                : item.title}
            </Text>
            {item.shortDescription && (
              <Text style={styles.planDescription}>
                {language === 'fr' && t(`UI.plans.${item.id}.description`) !== `UI.plans.${item.id}.description`
                  ? t(`UI.plans.${item.id}.description`)
                  : item.shortDescription}
              </Text>
            )}
            <Text style={styles.activePlanSubtitle}>
              {storyCount} {storyCount === 1 ? t('UI.planCategories.story') : t('UI.planCategories.stories')}
            </Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: progressAnimations[item.id]?.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                        extrapolate: 'clamp',
                      }) || '0%'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {completedCount} of {storyCount} completed
              </Text>
            </View>
          </View>
          <View style={styles.activePlanControls}>
            <TouchableOpacity 
              style={styles.pauseButton}
              onPress={(e) => {
                e.stopPropagation();
                const planTitle = language === 'fr' && t(`UI.plans.${item.id}.title`) !== `UI.plans.${item.id}.title`
                  ? t(`UI.plans.${item.id}.title`)
                  : item.title;
                
                Alert.alert(
                  item.type === 'plan' ? t('UI.alerts.readingPlanOptions') : t('UI.alerts.readingChallengeOptions'),
                  t('UI.alerts.whatWouldYouLikeToDo').replace('{title}', planTitle),
                  [
                    { text: t('UI.alerts.cancel'), style: 'cancel' },
                    { 
                      text: isPaused ? t('UI.alerts.resume') : t('UI.alerts.pause'), 
                      onPress: () => isPaused ? resumePlanAction(item.id, item.type) : pausePlanAction(item.id, item.type)
                    },
                    { 
                      text: t('UI.alerts.end'), 
                      style: 'destructive',
                      onPress: () => {
                        Alert.alert(
                          item.type === 'plan' ? t('UI.alerts.endReadingPlan') : t('UI.alerts.endReadingChallenge'),
                          t('UI.alerts.endConfirmation').replace('{title}', planTitle),
                          [
                            { text: t('UI.alerts.cancel'), style: 'cancel' },
                            { 
                              text: t('UI.alerts.end'), 
                              style: 'destructive',
                              onPress: () => endPlanAction(item.id, item.type)
                            }
                          ]
                        );
                      }
                    }
                  ]
                );
              }}
            >
              <Feather 
                name={isPaused ? "play" : "pause"} 
                size={16} 
                color="white" 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={(e) => {
                e.stopPropagation();
                handlePlanPress(item);
              }}
            >
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={colors.secondary} 
              />
            </TouchableOpacity>
          </View>
        </Pressable>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={[styles.expandedContent, isLast && { borderBottomWidth: 0 }]}>
            <View style={styles.booksContainer}>
              <View style={styles.accordionContainer}>
                {(() => {
                  // Check if this challenge supports chronological view
                  const challengeConfig = item.type === 'challenge' ? typedReadingPlansData.challenges.find(c => c.id === item.id) : null;
                  const supportsChronological = !!(challengeConfig as any)?.chronologicalOrder;
                  const chronologicalMapping = (challengeConfig as any)?.chronologicalMapping;

                  if (supportsChronological && chronologicalMapping) {
                    const completedSegmentsMap = completedSegments.reduce((acc: Record<string, boolean>, id: string) => {
                      acc[id] = true;
                      return acc;
                    }, {} as Record<string, boolean>);

                    return (
                      <ChronologicalView
                        key={`chrono-${item.id}-active`}
                        challengeId={item.id}
                        chronologicalMapping={chronologicalMapping}
                        completedSegments={completedSegmentsMap}
                        onSegmentSelect={handleSegmentSelect}
                        onSegmentComplete={(segmentId) => handleSegmentComplete(item.id, segmentId, item.type)}
                        context={item.type}
                      />
                    );
                  }
                  
                  // Regular accordion view for non-chronological plans
                  return planBooksData.map((bookItem) => {
                    const bookIndex = booksArray.findIndex(
                      (book) => book === bookItem.djhBook
                    );
                    const completedSegmentsMap = completedSegments.reduce((acc: Record<string, boolean>, id: string) => {
                      acc[id] = true;
                      return acc;
                    }, {} as Record<string, boolean>);
                    
                    return (
                      <Accordion 
                        key={bookItem.djhBook}
                        item={bookItem} 
                        bookIndex={bookIndex}
                        onSegmentComplete={(segmentId) => handleSegmentComplete(item.id, segmentId, item.type)}
                        onSegmentSelect={handleSegmentSelect}
                        context={item.type}
                        showGlobalCompletion={false}
                        planId={item.type === 'plan' ? item.id : ''}
                        challengeId={item.type === 'challenge' ? item.id : ''}
                        completedSegments={completedSegmentsMap}
                        highlightedSegment={lastCompletedSegment}
                        style={{ 
                          backgroundColor: colors.card,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border
                        }}
                      />
                    );
                  });
                })()}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Helper function to get plan title color based on category or plan-specific
  const getPlanTitleColor = (item: UnifiedPlan) => {
    // Check for plan-specific color first (for special seasonal plans)
    const specificColor = getPlanSpecificColor(item.id);
    if (specificColor) return specificColor;
    
    // Otherwise use category color
    const storyCount = getStoryCount(item);
    const category = categorizePlan(storyCount);
    return getCategoryColor(category);
  };

  // Render plan item in category
  const renderPlanItem = ({ item, index, isLast }: { item: UnifiedPlan; index: number; isLast: boolean }) => {
    const storyCount = getStoryCount(item);
    const isExpanded = expandedPlanId === item.id;
    const planBooksData = isExpanded ? getPlanBooksData(item.id, item.type) : [];
    const progress = item.type === 'plan' ? planProgress[item.id] : challengeProgress[item.id];
    const completedSegments = progress?.completedSegmentIds || [];
    const planTitleColor = getPlanTitleColor(item);
    
    return (
      <View>
        <Pressable
          style={({ pressed }) => [
            styles.planItem,
            isLast && !isExpanded && styles.planItemLast,
            pressed && styles.planItemPressed
          ]}
          onPress={() => handleStartPlanPress(item)}
        >
          <View style={styles.planContent}>
            <Text style={[styles.planTitle, { color: planTitleColor }]}>
              {language === 'fr' && t(`UI.plans.${item.id}.title`) !== `UI.plans.${item.id}.title`
                ? t(`UI.plans.${item.id}.title`)
                : item.title}
            </Text>
            {(item.shortDescription || (language === 'fr' && t(`UI.plans.${item.id}.description`) !== `UI.plans.${item.id}.description`)) && (
              <Text style={styles.planDescription}>
                {language === 'fr' && t(`UI.plans.${item.id}.description`) !== `UI.plans.${item.id}.description`
                  ? t(`UI.plans.${item.id}.description`)
                  : item.shortDescription || item.description}
              </Text>
            )}
            <Text style={styles.planSubtitle}>
              {storyCount} {storyCount === 1 ? t('UI.planCategories.story') : t('UI.planCategories.stories')}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.playButton, isExpanded && styles.playButtonExpanded]}
            onPress={(e) => {
              e.stopPropagation();
              handlePlanPress(item);
            }}
          >
            <Ionicons 
              name="chevron-down" 
              size={16} 
              color={isExpanded ? colors.background : colors.secondary}
              style={[
                styles.chevronIcon,
                isExpanded && styles.chevronIconRotated
              ]}
            />
          </TouchableOpacity>
        </Pressable>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={[styles.expandedContent, isLast && { borderBottomWidth: 0 }]}>
            <View style={styles.booksContainer}>
              <View style={styles.accordionContainer}>
                {(() => {
                  // Check if this challenge supports chronological view
                  const challengeConfig = item.type === 'challenge' ? typedReadingPlansData.challenges.find(c => c.id === item.id) : null;
                  const supportsChronological = !!(challengeConfig as any)?.chronologicalOrder;
                  const chronologicalMapping = (challengeConfig as any)?.chronologicalMapping;

                  if (supportsChronological && chronologicalMapping) {
                    const completedSegmentsMap = completedSegments.reduce((acc: Record<string, boolean>, id: string) => {
                      acc[id] = true;
                      return acc;
                    }, {} as Record<string, boolean>);

                    return (
                      <ChronologicalView
                        key={`chrono-${item.id}-expanded`}
                        challengeId={item.id}
                        chronologicalMapping={chronologicalMapping}
                        completedSegments={completedSegmentsMap}
                        onSegmentSelect={handleSegmentSelect}
                        onSegmentComplete={(segmentId) => handleSegmentComplete(item.id, segmentId, item.type)}
                        context={item.type}
                      />
                    );
                  }
                  
                  // Regular accordion view for non-chronological plans
                  return planBooksData.map((bookItem) => {
                    const bookIndex = booksArray.findIndex(
                      (book) => book === bookItem.djhBook
                    );
                    const completedSegmentsMap = completedSegments.reduce((acc: Record<string, boolean>, id: string) => {
                      acc[id] = true;
                      return acc;
                    }, {} as Record<string, boolean>);
                    
                    return (
                      <Accordion 
                        key={bookItem.djhBook}
                        item={bookItem} 
                        bookIndex={bookIndex}
                        onSegmentComplete={(segmentId) => handleSegmentComplete(item.id, segmentId, item.type)}
                        onSegmentSelect={handleSegmentSelect}
                        context={item.type}
                        showGlobalCompletion={false}
                        planId={item.type === 'plan' ? item.id : ''}
                        challengeId={item.type === 'challenge' ? item.id : ''}
                        completedSegments={completedSegmentsMap}
                        highlightedSegment={lastCompletedSegment}
                        style={{ 
                          backgroundColor: colors.card,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border
                        }}
                      />
                    );
                  });
                })()}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Category colors matching the app's design
  const getCategoryColor = (title: string) => {
    switch (title) {
      case PLAN_CATEGORIES.LONG:
        return '#007AFF'; // Blue
      case PLAN_CATEGORIES.MEDIUM:
        return '#FF9800'; // Orange  
      case PLAN_CATEGORIES.SHORT:
        return '#E91E63'; // Pink
      default:
        return colors.text;
    }
  };

  // Get plan-specific color (for special plans like Christmas)
  const getPlanSpecificColor = (planId: string) => {
    switch (planId) {
      case 'christmas7':
        return '#C41E3A'; // Christmas red
      case 'christmas12':
        return '#228B22'; // Christmas green
      case 'adventJourneyChronological':
        return '#8B4513'; // Advent brown
      case 'lentenReflectionChronological':
        return '#800080'; // Lenten purple
      default:
        return null; // Use category color
    }
  };

  // Render category
  const renderCategory = ({ item, index }: { item: typeof categories[0]; index: number }) => {
    const categoryColor = getCategoryColor(item.title);
    
    return (
      <View style={styles.categoryContainer}>
        <View style={styles.categoryHeader}>
          <Text style={[styles.categoryTitle, { color: categoryColor }]}>{item.title}</Text>
          <Text style={styles.categorySubtitle}>{item.subtitle}</Text>
        </View>
        <View style={styles.plansList}>
          {item.plans.map((plan, planIndex) => (
            <View key={plan.id}>
              {renderPlanItem({ 
                item: plan, 
                index: planIndex, 
                isLast: planIndex === item.plans.length - 1 
              })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Reading Mode Modal Handlers
  const handleIndividualReading = async () => {
    setShowReadingModeModal(false);
    
    if (currentSession) {
      await stopSession();
    }
    
    await updateSegmentId(`ENG-NLT-${selectedSegmentId}`);
    const segment = SegmentTitles[selectedSegmentId as keyof typeof SegmentTitles];
    
    const routeParams: any = {
      segment: `ENG-NLT-${selectedSegmentId}`,
      book: segment?.book[0] || '',
      context: selectedPlanType,
      freshStart: Date.now().toString()
    };

    if (selectedPlanType === 'plan') {
      routeParams.planId = selectedPlanId;
    } else {
      routeParams.challengeId = selectedPlanId;
    }

    router.push({
      pathname: "/[segment]",
      params: routeParams
    });
  };

  const handleGroupReading = () => {
    setShowReadingModeModal(false);
    
    const routeParams: any = {
      storyId: selectedSegmentId,
      storyTitle: selectedSegmentTitle,
      scriptureReference: selectedSegmentRef,
    };

    if (selectedPlanType === 'plan') {
      routeParams.planId = selectedPlanId;
    } else {
      routeParams.challengeId = selectedPlanId;
    }

    router.push({
      pathname: '/group-setup' as any,
      params: routeParams
    });
  };

  const handleCancelModal = () => {
    setShowReadingModeModal(false);
  };

  // Start Confirmation Modal Handlers
  const handleConfirmStartPlan = async () => {
    if (!startConfirmationData) return;
    
    setShowStartConfirmationModal(false);
    setLoadingStates(prev => ({ ...prev, [startConfirmationData.planId]: 'starting' }));
    
    try {
      await startPlanAction(startConfirmationData.planId, startConfirmationData.planType);
      
      if (startConfirmationData.firstStory) {
        setSelectedSegmentId(startConfirmationData.firstStory.segmentId);
        // Use translated title and reference from firstStory (already translated in getFirstStoryInPlan)
        setSelectedSegmentTitle(startConfirmationData.firstStory.title);
        setSelectedSegmentRef(startConfirmationData.firstStory.fullReference);
        setSelectedPlanId(startConfirmationData.planId);
        setSelectedPlanType(startConfirmationData.planType);
        setShowReadingModeModal(true);
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [startConfirmationData.planId]: null }));
      setStartConfirmationData(null);
    }
  };

  const handleCancelStartPlan = () => {
    setShowStartConfirmationModal(false);
    setStartConfirmationData(null);
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadActiveData();
      await loadAllProgress();
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF9F0A']}
            tintColor="#FF9F0A"
          />
        }
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>{t('UI.planPage.title')}</Text>
          <Text style={styles.welcomeText}>
            {t('UI.planPage.subtitle')}
          </Text>
        </View>

        {/* Active Plans Section */}
        {organizedPlans.active.length > 0 && (
          <View style={styles.activePlansSection}>
            <Text style={styles.sectionTitle}>{t('UI.planPage.activePlans')}</Text>
            {organizedPlans.active.map((plan, index) => (
              <View key={plan.id}>
                {renderActivePlanItem({ 
                  item: plan, 
                  index, 
                  isLast: index === organizedPlans.active.length - 1 
                })}
              </View>
            ))}
          </View>
        )}

        {/* Available Plans Section */}
        <View style={styles.availablePlansSection}>
          <View style={styles.availablePlansHeader}>
            <Text style={styles.sectionTitle}>{t('UI.planPage.availablePlans')}</Text>
            
            {/* Scroll Indicators */}
            <View style={styles.scrollIndicators}>
              {categories.map((_, index) => (
                <View 
                  key={index}
                  style={[
                    currentCategoryIndex === index ? styles.scrollDotActive : styles.scrollDot
                  ]} 
                />
              ))}
            </View>
          </View>

          {/* Categories Horizontal Scroll */}
          <View style={styles.categoriesScrollContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.categoriesScroll}
              contentContainerStyle={{ flexGrow: 1 }}
              snapToInterval={screenWidth}
              snapToAlignment="start"
              decelerationRate="fast"
              nestedScrollEnabled={true}
            >
              {categories.map((category, index) => (
                <View key={category.title}>
                  {renderCategory({ item: category, index })}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Reading Mode Modal */}
      <ReadingModeModal
        visible={showReadingModeModal && !!selectedSegmentId}
        storyTitle={selectedSegmentTitle}
        scriptureReference={selectedSegmentRef}
        storyId={selectedSegmentId || ''}
        onIndividual={handleIndividualReading}
        onGroup={handleGroupReading}
        onCancel={handleCancelModal}
        context={selectedPlanType}
        planId={selectedPlanType === 'plan' ? selectedPlanId : ''}
        challengeId={selectedPlanType === 'challenge' ? selectedPlanId : ''}
      />

      {/* Start Confirmation Modal */}
      {showStartConfirmationModal && startConfirmationData && (
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
              {t(startConfirmationData.planType === 'plan' ? 'UI.startConfirmation.titlePlan' : 'UI.startConfirmation.title')}
            </Text>
            
            <Text style={{
              fontSize: 16,
              color: colors.text,
              marginBottom: 16,
              textAlign: 'center',
              lineHeight: 22,
            }}>
              {t('UI.startConfirmation.youreAboutToStart').replace('{title}', startConfirmationData.planTitle)}
              {startConfirmationData.firstStory ? ` ${t('UI.startConfirmation.yourFirstStoryWillBe')}` : ''}
            </Text>

            {startConfirmationData.firstStory && (
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
                  marginBottom: 4,
                }}>
                  {startConfirmationData.firstStory.title}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: colors.secondary,
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}>
                  {startConfirmationData.firstStory.fullReference}
                </Text>
              </View>
            )}

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
                onPress={handleCancelStartPlan}
              >
                <Text style={{
                  color: colors.text,
                  textAlign: 'center',
                  fontWeight: '500',
                }}>
                  {t('UI.alerts.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                }}
                onPress={handleConfirmStartPlan}
              >
                <Text style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: '600',
                }}>
                  {startConfirmationData.planType === 'plan' ? t('UI.startConfirmation.startPlan') : t('UI.startConfirmation.startChallenge')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ReadingPlansScreen;
