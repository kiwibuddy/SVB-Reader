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

const PLAN_STYLES = {
  "NT100Days": {
    color: "#4df469", // Complementary green
    icon: "⚡"
  },
  "SchoolYear2": {
    color: "#694df4", // Complementary purple
    icon: "🎓"
  },
  "Bible1Year": {
    color: "#f44d69", // Original red-pink
    icon: "📖"
  },
  "SchoolYear3": {
    color: "#4d9ff4", // Complementary blue
    icon: "✏️"
  },
  "SchoolYear1": {
    color: "#f4b64d", // Complementary orange
    icon: "📚"
  }
};

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
                {
                  backgroundColor: PLAN_STYLES[plan.id as keyof typeof PLAN_STYLES]?.color || "#f4694d",
                },
                selectedPlan.id === plan.id && {
                  transform: [{ scale: 1.02 }],
                  elevation: 5,
                }
              ]}
              onPress={() => handlePlanSelection(plan)}
            >
              <View style={styles.planContent}>
                <Text style={styles.planIcon}>
                  {PLAN_STYLES[plan.id as keyof typeof PLAN_STYLES]?.icon}
                </Text>
                <Text style={styles.planButtonText}>
                  {plan.title}
                </Text>
                <Text style={styles.planDescription}>
                  {plan.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.divider} />

        <View style={styles.selectedPlanContainer}>
          <Text style={styles.selectedPlanTitle}>{selectedPlan.title}</Text>
          
          <Text style={styles.planContext}>
            {selectedPlan.id === "Bible1Year" && 
              "Experience the entire Biblical narrative in one year. This comprehensive plan takes you through the complete story of Scripture, from Creation to Revelation, helping you understand God's grand plan of redemption."}
            {selectedPlan.id === "SchoolYear1" && 
              "Perfect for students and educators, this plan follows the academic calendar with carefully selected narrative passages that tell the Bible's key stories and teachings."}
            {selectedPlan.id === "SchoolYear2" && 
              "Continue your Biblical education with this second academic year plan, diving deeper into historical books, prophecy, and New Testament teachings."}
            {selectedPlan.id === "SchoolYear3" && 
              "Complete your Biblical foundation with this third academic year plan, exploring wisdom literature, prophetic books, and the life of Christ."}
            {selectedPlan.id === "NT100Days" && 
              "An intensive journey through the New Testament in 100 days. Perfect for understanding the life of Jesus, the early church, and the foundations of Christian faith."}
          </Text>

          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Progress: {currentProgress?.completedSegments.length || 0} / 
              {Object.values(selectedPlan.segments).reduce(
                (acc, book) => acc + book.segments.filter(s => !s.startsWith('I')).length, 
                0
              )} segments
            </Text>
            {currentProgress?.isCompleted && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>Completed!</Text>
              </View>
            )}
          </View>
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
    width: 200,
    height: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedPlanButton: {
    backgroundColor: "#8A4FFF",
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  selectedPlanText: {
    color: "#FFFFFF",
  },
  planDescription: {
    fontSize: 13,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 16,
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
  selectedPlanContainer: {
    padding: 16,
  },
  planContext: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  planIcon: {
    fontSize: 40,
    height: 60,
    width: 60,
    textAlign: 'center',
    lineHeight: 60,
    marginBottom: 12,
  },
  planContent: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
});

export default PlanScreen;
