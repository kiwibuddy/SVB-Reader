import React, { useState, useMemo, useEffect, useRef } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';
import readingPlansData from "../../assets/data/ReadingPlansChallenges.json";
import Accordion, { AccordionItem, accordionColor } from "@/components/navigation/NavBook";
import Books from "@/assets/data/BookChapterList.json";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { useAppContext } from "@/context/GlobalContext";
import { StatusIndicator } from '@/components/StatusIndicator';
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { markSegmentComplete, getSegmentCompletionStatus, unlockAchievement } from "@/api/sqlite";
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
    marginBottom: 12,
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
});

const PlanScreen = () => {
  const { 
    readingPlan, 
    updateReadingPlan, 
    activePlan,
    startPlan,
    pausePlan,
    resumePlan,
    switchPlan,
    readingPlanProgress,
    updateReadingPlanProgress,
    updateEmojiActions,
    updateSegmentId
  } = useAppContext();

  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { colors, isDarkMode } = useAppSettings();
  const styles = createStyles(isLargeScreen, colors, isDarkMode);

  // Initialize selectedPlan with the active plan if it exists, otherwise use first plan
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planProgress, setPlanProgress] = useState<Record<string, string[]>>({});
  
  // Reading Mode Modal State
  const [showReadingModeModal, setShowReadingModeModal] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [selectedSegmentTitle, setSelectedSegmentTitle] = useState<string>('');
  const [selectedSegmentRef, setSelectedSegmentRef] = useState<string>('');

  // Load plan progress when component mounts
  useEffect(() => {
    loadPlanProgress();
  }, []);

  // Refresh when returning from reading a segment
  useFocusEffect(
    React.useCallback(() => {
      loadPlanProgress();
    }, [])
  );

  const loadPlanProgress = async () => {
    const progress: Record<string, string[]> = {};
    
    // Load progress for each plan
    for (const plan of readingPlansData.plans) {
      const completedSegments: string[] = [];
      
      // Check completion status for each segment
      for (const [bookKey, bookData] of Object.entries(plan.segments)) {
        if (bookData?.segments) {
          for (const segmentId of bookData.segments) {
            const status = await getSegmentCompletionStatus(
              segmentId,
              'plan',
              plan.id
            );
            if (status.isCompleted) {
              completedSegments.push(segmentId);
            }
          }
        }
      }
      
      progress[plan.id] = completedSegments;
    }
    
    setPlanProgress(progress);
  };

  const handleSegmentComplete = async (planId: string, segmentId: string) => {
    try {
      // The actual completion is handled by CheckCircle component
      // This function is called by the Accordion when a segment is completed
      // We just need to refresh the local progress state
      
      // Update local state immediately for UI responsiveness
      setPlanProgress(prev => ({
        ...prev,
        [planId]: [...(prev[planId] || []), segmentId]
      }));

      // Check for achievements
      const completedCount = (planProgress[planId] || []).length + 1;
      
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

  const currentProgress = readingPlanProgress[selectedPlanId || ''];

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
              await switchPlan(planId);
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
      pathname: "/[segment]",
      params: {
        segment: `ENG-NLT-${selectedSegmentId}`,
        book: segment?.book[0] || '',
        ...(selectedPlanId ? { planId: selectedPlanId } : {})
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

  const handlePress = (segmentId: string) => {
    router.push({
      pathname: "/[segment]",
      params: { 
        segment: segmentId,
        planId: selectedPlanId
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
    const completedSegments = planProgress[plan.id] || [];
    const totalSegments = Object.values(plan.segments)
      .reduce((acc, book) => acc + (book?.segments?.length || 0), 0);
    
    const progress = (completedSegments.length / totalSegments) * 100;
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
              </View>
            </View>
            <View style={styles.rightContent}>
              {!isActive && (
                <TouchableOpacity 
                  onPress={() => startPlan(plan.id)}
                >
                  <Feather name="play-circle" size={24} color="#666666" />
                </TouchableOpacity>
              )}
              {isPaused && (
                <TouchableOpacity 
                  onPress={() => resumePlan()}
                >
                  <Feather name="play-circle" size={24} color="#666666" />
                </TouchableOpacity>
              )}
              {isActive && !isPaused && !isCompleted && (
                <TouchableOpacity 
                  onPress={() => pausePlan()}
                >
                  <Feather name="pause-circle" size={24} color="#666666" />
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
                      key={completedSegments.join(',') + '-' + item.djhBook}
                      item={item} 
                      bookIndex={bookIndex}
                      onSegmentComplete={(segmentId) => handleSegmentComplete(plan.id, segmentId)}
                      onSegmentSelect={handleSegmentSelect}
                      context="plan"
                      showGlobalCompletion={false}
                      planId={plan.id}
                      completedSegments={completedSegmentsMap}
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

    filteredPlans.forEach(plan => {
      const isActive = activePlan?.planId === plan.id && !activePlan.isPaused;
      
      if (isActive) {
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

    return { active, inactive: sortPlans(inactive) };
  }, [filteredPlans, activePlan]);

  // Add handleScroll function to match Home.tsx
  const handleScroll = (event: any) => {
    // Implementation of handleScroll function
  };

  const ListHeaderComponent = () => (
    <View style={styles.welcomeSection}>
      <View >
        <Text style={styles.welcomeTitle}>Reading Plans</Text>
      </View>
      <Text style={styles.welcomeText}>
        Welcome to the Bible Reading Plans and Challenges screen, where you can find personalized reading plans and spiritual challenges designed to deepen your understanding of Scripture and transform your faith.
      </Text>
    </View>
  );

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
    
    return result;
  }, [organizedPlans]);

  const renderCategorySection = (title: string, plans: Plan[]) => (
    <View style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{title}</Text>
      {plans.map((plan) => (
        <View key={plan.id}>
          {renderPlanItem({ item: plan })}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        style={styles.content}
        data={sections}
        renderItem={({ item }) => (
          <>
            {renderCategorySection(item.title, item.data)}
          </>
        )}
        keyExtractor={(item) => item.title}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={ListHeaderComponent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
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

export default PlanScreen;