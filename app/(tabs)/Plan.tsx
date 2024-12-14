import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import readingPlansData from "../../assets/data/ReadingPlansChallenges.json";
import Accordion, { AccordionItem, accordionColor } from "@/components/navigation/NavBook";
import Books from "@/assets/data/BookChapterList.json";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { useAppContext } from "@/context/GlobalContext";

export type SegmentKey = keyof typeof SegmentTitles;
export type SegmentIds = keyof typeof Books;

const booksArray = Object.keys(Books);

const PlanScreen = () => {
  const { readingPlanProgress, updateReadingPlanProgress, startReadingPlan } = useAppContext();
  const [selectedPlan, setSelectedPlan] = useState(readingPlansData.plans[0]);

  const currentProgress = readingPlanProgress[selectedPlan.id];

  const handlePlanSelection = (plan: typeof selectedPlan) => {
    setSelectedPlan(plan);
    if (!readingPlanProgress[plan.id]) {
      startReadingPlan(plan.id);
    }
  };

  const handleSegmentComplete = (segmentId: string) => {
    updateReadingPlanProgress(selectedPlan.id, segmentId);
  };

  const planBooksData = useMemo(() => {
    console.log('Selected Plan:', selectedPlan.id);
    const data = selectedPlan.segments ? Object.keys(selectedPlan.segments).map((key) => ({
      djhBook: key as keyof typeof accordionColor,
      bookName: Books[key as SegmentIds]?.bookName ?? "Unknown Book",
      segments: (selectedPlan.segments[key as SegmentIds]?.segments ?? []) as SegmentKey[],
    })) : [];
    console.log('Processed Books Data:', data.length, 'books');
    return data;
  }, [selectedPlan]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.screenTitle}>Reading Plans</Text>
          <Text style={styles.welcomeText}>
            Welcome to the Bible Reading Plans and Challenges screen, where you can find personalized reading plans and spiritual challenges designed to deepen your understanding of Scripture and transform your faith.
          </Text>
          <Text style={styles.sectionTitle}>Plans</Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.plansScrollView}
        >
          {readingPlansData.plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planButton,
                selectedPlan.id === plan.id && styles.selectedPlanButton
              ]}
              onPress={() => handlePlanSelection(plan)}
            >
              <Text style={[
                styles.planButtonText,
                selectedPlan.id === plan.id && styles.selectedPlanText
              ]}>
                {plan.title}
              </Text>
              <Text style={[
                styles.planDescription,
                selectedPlan.id === plan.id && styles.selectedPlanText
              ]}>
                {plan.description}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.divider} />

        <Text style={styles.selectedPlanTitle}>{selectedPlan.title}</Text>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Progress: {currentProgress?.completedSegments.length || 0} / 
            {Object.values(selectedPlan.segments).reduce(
              (acc, book) => acc + book.segments.length, 
              0
            )} segments
          </Text>
          {currentProgress?.isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>Completed!</Text>
            </View>
          )}
        </View>

        <View style={styles.booksContainer}>
          {planBooksData.map((item) => {
            const bookIndex = booksArray.findIndex(
              (book) => book === item.djhBook
            );
            return (
              <Accordion 
                key={item.djhBook} 
                item={item} 
                bookIndex={bookIndex}
                completedSegments={currentProgress?.completedSegments || []}
                onSegmentComplete={handleSegmentComplete}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flex: 1,
  },
  headerContainer: {
    padding: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 12,
  },
  plansScrollView: {
    paddingHorizontal: 16,
  },
  planButton: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 200,
  },
  selectedPlanButton: {
    backgroundColor: "#8A4FFF",
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
  },
  selectedPlanText: {
    color: "#FFFFFF",
  },
  planDescription: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 16,
  },
  selectedPlanTitle: {
    fontSize: 20,
    fontWeight: "600",
    padding: 16,
  },
  booksContainer: {
    paddingBottom: 16,
  },
  progressContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 16,
    color: '#666666',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default PlanScreen;
