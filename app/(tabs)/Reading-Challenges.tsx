import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import readingPlansData from "../../assets/data/ReadingPlansChallenges.json";
import { useAppContext } from "@/context/GlobalContext";

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
    color: "#4df469", // Complementary green
    icon: "✉️"
  },
  "David's Life": {
    color: "#f44d69", // Original red-pink
    icon: "👑"
  },
  "Advent Journey": {
    color: "#694df4", // Complementary purple
    icon: "⭐"
  },
  "Lenten Reflection": {
    color: "#4d9ff4", // Complementary blue
    icon: "✝️"
  },
  "12 Days of Christmas": {
    color: "#f4b64d", // Complementary orange
    icon: "🎄"
  },
  "The Gospels": {
    color: "#4dcaf4", // Light blue
    icon: "📖"
  },
  "The Torah": {
    color: "#9f4df4", // Purple
    icon: "📜"
  },
  "In The Beginning": {
    color: "#f4944d", // Orange
    icon: "🌟"
  }
};

// Add type for challenge titles
type ChallengeTitle = keyof typeof CHALLENGE_STYLES;

// Update the type definition
type Challenge = {
  title: ChallengeTitle;
  description: string;
  image: string;
  highlightText: string;
  longDescription: string;
};

const ChallengesScreen = () => {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge>(readingPlansData.challenges[0] as Challenge);

  const handleChallengeSelection = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
  };

  // Group challenges by category
  const groupedChallenges = readingPlansData.challenges.reduce((acc: any, challenge) => {
    const category = categorizeChallenge(challenge);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(challenge);
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.screenTitle}>Reading Challenges</Text>
          <Text style={styles.welcomeText}>
            Welcome to Bible Reading Challenges, where you can find focused reading challenges to help you dive deep into specific themes and books of the Bible.
          </Text>
        </View>

        {Object.entries(groupedChallenges).map(([category, challenges]) => (
          <View key={category} style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.challengesScrollView}
            >
              {(challenges as Challenge[]).map((challenge, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.challengeButton,
                    {
                      backgroundColor: CHALLENGE_STYLES[challenge.title]?.color || "#f4694d",
                    },
                    selectedChallenge.title === challenge.title && {
                      transform: [{ scale: 1.02 }],
                      elevation: 5,
                    }
                  ]}
                  onPress={() => handleChallengeSelection(challenge)}
                >
                  <View style={styles.challengeContent}>
                    <Text style={styles.challengeIcon}>
                      {CHALLENGE_STYLES[challenge.title]?.icon}
                    </Text>
                    <Text style={styles.challengeButtonText}>
                      {challenge.title}
                    </Text>
                    <Text style={styles.challengeDescription}>
                      {challenge.description}
                    </Text>
                    <Text style={styles.highlightText}>
                      {challenge.highlightText}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.selectedChallengeContainer}>
          <Text style={styles.selectedChallengeTitle}>{selectedChallenge.title}</Text>
          <Text style={styles.selectedChallengeDescription}>{selectedChallenge.description}</Text>
          <Text style={styles.challengeInfo}>
            {selectedChallenge.longDescription || 
              (selectedChallenge.title === "Paul's Letters" && 
                "Journey through the epistles of Paul, exploring his teachings on faith, grace, and Christian living. Perfect for understanding early church doctrine and practical Christian wisdom.") ||
              (selectedChallenge.title === "David's Life" && 
                "Follow the journey of David from shepherd to king, through his trials and triumphs. Learn about leadership, faith, and redemption through his powerful story.") ||
              (selectedChallenge.title === "Advent Journey" && 
                "Prepare your heart for Christmas with daily readings about the prophecies and birth of Jesus. Experience the anticipation and joy of the coming Messiah.") ||
              (selectedChallenge.title === "Lenten Reflection" && 
                "Journey through Jesus' ministry, passion, and resurrection during the 40 days of Lent. Deepen your understanding of Christ's sacrifice and victory.") ||
              (selectedChallenge.title === "12 Days of Christmas" && 
                "Celebrate the Christmas season with readings about Jesus' birth and early life. Explore the miraculous events and profound meaning of the incarnation.")}
          </Text>
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
  challengesScrollView: {
    paddingHorizontal: 16,
  },
  challengeButton: {
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
  selectedChallengeButton: {
    backgroundColor: "#8A4FFF",
  },
  challengeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  selectedChallengeText: {
    color: "#FFFFFF",
  },
  challengeDescription: {
    fontSize: 13,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 16,
  },
  highlightText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
    opacity: 0.95,
    position: 'absolute',
    bottom: 12,
    left: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 16,
  },
  selectedChallengeContainer: {
    padding: 16,
  },
  selectedChallengeTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  selectedChallengeDescription: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
    marginBottom: 12,
    color: "#333333",
  },
  challengeInfo: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
    lineHeight: 20,
  },
  challengeIcon: {
    fontSize: 40,
    height: 60,
    width: 60,
    textAlign: 'center',
    lineHeight: 60,
    marginBottom: 12,
  },
  challengeContent: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
});

export default ChallengesScreen;
