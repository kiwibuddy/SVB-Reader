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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import readingPlansData from "../../assets/data/ReadingPlansChallenges.json";
import Accordion, { AccordionItem, accordionColor } from "@/components/navigation/NavBook";
import Books from "@/assets/data/BookChapterList.json";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { useAppContext } from "@/context/GlobalContext";
import { StatusIndicator } from '@/components/StatusIndicator';
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';

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
    color: "#4df469"
  },
  "SchoolYear2": {
    color: "#694df4"
  },
  "Bible1Year": {
    color: "#f44d69"
  },
  "SchoolYear3": {
    color: "#4d9ff4"
  },
  "SchoolYear1": {
    color: "#f4b64d"
  }
};

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
    updateEmojiActions
  } = useAppContext();

  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Initialize selectedPlan with the active plan if it exists, otherwise use first plan
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

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

  const handleSegmentComplete = (segmentId: string) => {
    updateReadingPlanProgress(selectedPlanId || '', segmentId);
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

  const handlePress = (segmentId: string) => {
    router.push({
      pathname: `/${segmentId}`,
      query: { 
        showGlobalCompletion: 'false',
        planId: selectedPlanId
      }
    } as any);
  };

  const renderPlanItem = ({ item: plan }: { item: Plan }) => {
    const isSelected = selectedPlanId === plan.id;
    const isActive = activePlan?.planId === plan.id;
    const isPaused = activePlan && isActive && activePlan.isPaused;
    const segmentCount = getPlanSegmentCount(plan.id);
    const planBooksData = isSelected ? getPlanBooksData(plan.id) : [];

    return (
      <View style={styles.planContainer}>
        <TouchableOpacity 
          style={styles.planHeader}
          onPress={() => setSelectedPlanId(isSelected ? null : plan.id)}
        >
          <View style={styles.planInfo}>
            <View style={styles.leftContent}>
              <View style={styles.titleContainer}>
                <Text style={styles.planTitle}>{plan.title}</Text>
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
              {isActive && !isPaused && (
                <TouchableOpacity 
                  onPress={() => pausePlan()}
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
              data={planBooksData}
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
                        (activePlan?.completedSegments || []).map(id => [
                          id, 
                          { isCompleted: true, color: null }
                        ])
                      )
                    }
                    onSegmentComplete={handleSegmentComplete}
                    context="plan"
                    showGlobalCompletion={false}
                    planId={plan.id}
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

  // Organize plans by status
  const organizedPlans = useMemo(() => {
    const plans = [...filteredPlans];
    return plans.sort((a, b) => {
      const aStatus = activePlan?.planId === a.id 
        ? (activePlan.isPaused ? 1 : 0)
        : 2;
      const bStatus = activePlan?.planId === b.id
        ? (activePlan.isPaused ? 1 : 0)
        : 2;
      if (aStatus !== bStatus) return aStatus - bStatus;
      return a.title.localeCompare(b.title);
    });
  }, [filteredPlans, activePlan]);

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
          <Text style={styles.screenTitle}>Reading Plans</Text>
          <Text style={styles.welcomeText}>
            Welcome to the Bible Reading Plans and Challenges screen, where you can find personalized reading plans and spiritual challenges designed to deepen your understanding of Scripture and transform your faith.
          </Text>
          <Text style={styles.sectionTitle}>Plans</Text>
        </View>

        <FlatList
          data={organizedPlans}
          renderItem={renderPlanItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
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
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 12,
  },
  listContainer: {
    paddingTop: 8,
  },
  planContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
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
    gap: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  segmentCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  booksContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  titleContainer: {
    flexDirection: 'column',
  },
});

export default PlanScreen;
