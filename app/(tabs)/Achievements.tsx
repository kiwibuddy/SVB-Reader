import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useAppContext } from '@/context/GlobalContext';
import { getCompletedSegmentsCount, getCurrentStreak, getBestStreak, getEmojiStats, getSourceStats, getOldTestamentProgress, getNewTestamentProgress, getLongestSession, getCompletedBooks, checkEmojiCollection } from '@/api/sqlite';

// Add these types at the top of the file
interface AchievementStats {
  totalStories: number;
  currentStreak: number;
  bestStreak: number;
  oldTestament: { completed: number; total: number };
  newTestament: { completed: number; total: number };
  emojiCount: { total: number; heart: number; prayer: number; question: number; thumbsUp: number };
  sourceReading: { red: number; green: number; blue: number; black: number };
  plans: { completed: number; total: number };
  challenges: { completed: number; total: number };
  longestSession: number;
  booksCompleted: string[];  // Define as string array
  emojiCollection: { complete: boolean };
  firstStoryDate?: string; // Date when the first story was completed
}

// Add these interfaces for component props
interface AchievementBadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string | number;
  color: string;
  max?: number | null;
}

interface TrophyProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  achieved: boolean;
}

// Add a new interface for trophies with achievement date
interface Trophy {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  achieved: boolean;
  achievedDate?: string; // Date when trophy was achieved
}

function Achievements() {
  const { colors } = useAppSettings();
  const { completedSegments } = useAppContext();
  
  // State for achievement data
  const [stats, setStats] = useState<AchievementStats>({
    totalStories: 0,
    currentStreak: 0,
    bestStreak: 0,
    oldTestament: { completed: 0, total: 219 },
    newTestament: { completed: 0, total: 146 },
    emojiCount: { total: 0, heart: 0, prayer: 0, question: 0, thumbsUp: 0 },
    sourceReading: { red: 0, green: 0, blue: 0, black: 0 },
    plans: { completed: 0, total: 0 },
    challenges: { completed: 0, total: 0 },
    longestSession: 0,
    booksCompleted: [],  // Initialize as empty array
    emojiCollection: { complete: false },
    firstStoryDate: undefined
  });
  
  // Load achievement data
  useEffect(() => {
    const loadStats = async () => {
      try {
        const totalStories = await getCompletedSegmentsCount();
        const currentStreak = await getCurrentStreak();
        const bestStreak = await getBestStreak();
        const emojiStats = await getEmojiStats();
        const sourceStats = await getSourceStats();
        const longestSession = await getLongestSession();
        const completedBooks = await getCompletedBooks();
        const emojiCollection = await checkEmojiCollection();
        
        // Get testament-specific progress
        const oldTestamentStats = await getOldTestamentProgress();
        const newTestamentStats = await getNewTestamentProgress();
        
        setStats({
          totalStories,
          currentStreak,
          bestStreak,
          oldTestament: oldTestamentStats,
          newTestament: newTestamentStats,
          emojiCount: emojiStats,
          sourceReading: sourceStats,
          plans: { completed: 2, total: 5 }, // Replace with actual data
          challenges: { completed: 1, total: 8 }, // Replace with actual data
          longestSession,
          booksCompleted: completedBooks,
          emojiCollection,
          firstStoryDate: totalStories >= 1 ? new Date().toISOString() : undefined
        });
      } catch (error) {
        console.error("Error loading achievements:", error);
      }
    };
    
    loadStats();
  }, [completedSegments]);

  // Create an array of all trophies with their data
  const trophies: Trophy[] = useMemo(() => [
    {
      id: 'first-steps',
      title: "First Steps",
      description: "Complete your first story",
      icon: "footsteps-outline",
      achieved: stats.totalStories >= 1,
      achievedDate: stats.totalStories >= 1 ? stats.firstStoryDate : undefined
    },
    {
      id: 'bible-explorer',
      title: "Bible Explorer",
      description: "Complete 50 stories",
      icon: "telescope-outline",
      achieved: stats.totalStories >= 50,
      achievedDate: stats.totalStories >= 50 ? stats.firstStoryDate : undefined
    },
    {
      id: 'bible-scholar',
      title: "Bible Scholar",
      description: "Complete 100 stories",
      icon: "school-outline",
      achieved: stats.totalStories >= 100,
      achievedDate: stats.totalStories >= 100 ? stats.firstStoryDate : undefined
    },
    {
      id: 'steady-reader',
      title: "Steady Reader",
      description: "Maintain a 7-day streak",
      icon: "calendar-outline",
      achieved: stats.bestStreak >= 7,
      achievedDate: stats.bestStreak >= 7 ? stats.firstStoryDate : undefined
    },
    {
      id: 'devoted-reader',
      title: "Devoted Reader",
      description: "Maintain a 30-day streak",
      icon: "flame-outline",
      achieved: stats.bestStreak >= 30,
      achievedDate: stats.bestStreak >= 30 ? stats.firstStoryDate : undefined
    },
    {
      id: 'bible-enthusiast',
      title: "Bible Enthusiast",
      description: "Maintain a 100-day streak",
      icon: "star-outline",
      achieved: stats.bestStreak >= 100,
      achievedDate: stats.bestStreak >= 100 ? stats.firstStoryDate : undefined
    },
    {
      id: 'new-testament-scholar',
      title: "New Testament Scholar",
      description: "Complete all New Testament readings",
      icon: "book-outline",
      achieved: stats.newTestament.completed >= stats.newTestament.total,
      achievedDate: stats.newTestament.completed >= stats.newTestament.total ? stats.firstStoryDate : undefined
    },
    {
      id: 'old-testament-scholar',
      title: "Old Testament Scholar",
      description: "Complete all Old Testament readings",
      icon: "library-outline",
      achieved: stats.oldTestament.completed >= stats.oldTestament.total,
      achievedDate: stats.oldTestament.completed >= stats.oldTestament.total ? stats.firstStoryDate : undefined
    },
    {
      id: 'role-player',
      title: "Role Player",
      description: "Read Bible stories using all 4 different reader roles",
      icon: "people-outline",
      achieved: stats.sourceReading.red > 0 && 
               stats.sourceReading.green > 0 && 
               stats.sourceReading.blue > 0 && 
               stats.sourceReading.black > 0,
      achievedDate: stats.sourceReading.red > 0 && 
                    stats.sourceReading.green > 0 && 
                    stats.sourceReading.blue > 0 && 
                    stats.sourceReading.black > 0 ? stats.firstStoryDate : undefined
    },
    {
      id: 'bible-in-one-year',
      title: "Bible in One Year",
      description: "Complete the Bible in One Year reading plan",
      icon: "calendar-number-outline",
      achieved: false, // This would be determined by your app's logic
      achievedDate: false ? stats.firstStoryDate : undefined
    },
    {
      id: 'new-testament-in-90-days',
      title: "New Testament in 90 Days",
      description: "Complete the NT in 90 Days reading plan",
      icon: "timer-outline",
      achieved: false, // This would be determined by your app's logic
      achievedDate: false ? stats.firstStoryDate : undefined
    },
    {
      id: 'gospels-deep-dive',
      title: "Gospels Deep Dive",
      description: "Complete the Gospels Deep Dive reading plan",
      icon: "search-outline",
      achieved: false, // This would be determined by your app's logic
      achievedDate: false ? stats.firstStoryDate : undefined
    },
    {
      id: 'dts-outreach',
      title: "DTS Outreach",
      description: "Complete the DTS Outreach challenge",
      icon: "airplane-outline",
      achieved: false, // This would be determined by your app's logic
      achievedDate: false ? stats.firstStoryDate : undefined
    },
    {
      id: '21-day-prayer-challenge',
      title: "21 Day Prayer Challenge",
      description: "Complete the 21 Day Prayer challenge",
      icon: "hand-right-outline",
      achieved: false, // This would be determined by your app's logic
      achievedDate: false ? stats.firstStoryDate : undefined
    },
    {
      id: 'wisdom-literature',
      title: "Wisdom Literature",
      description: "Complete the Wisdom Literature challenge",
      icon: "bulb-outline",
      achieved: false, // This would be determined by your app's logic
      achievedDate: false ? stats.firstStoryDate : undefined
    },
    {
      id: 'prophetic-books',
      title: "Prophetic Books",
      description: "Complete the Prophetic Books challenge",
      icon: "megaphone-outline",
      achieved: false, // This would be determined by your app's logic
      achievedDate: false ? stats.firstStoryDate : undefined
    },
    {
      id: 'genesis-complete',
      title: "Genesis Complete",
      description: "Read all segments in the book of Genesis",
      icon: "bookmark-outline",
      achieved: stats.booksCompleted.includes('Gen'),
      achievedDate: stats.booksCompleted.includes('Gen') ? stats.firstStoryDate : undefined
    },
    {
      id: 'complete-collection',
      title: "Complete Collection",
      description: "Use every emoji reaction type at least once",
      icon: "happy-outline", 
      achieved: stats.emojiCollection.complete,
      achievedDate: stats.emojiCollection.complete ? stats.firstStoryDate : undefined
    }
  ], [stats]);

  // Sort trophies: completed first (by date), then incomplete
  const sortedTrophies = useMemo(() => {
    return [...trophies].sort((a, b) => {
      if (a.achieved && !b.achieved) return -1;
      if (!a.achieved && b.achieved) return 1;
      if (a.achieved && b.achieved && a.achievedDate && b.achievedDate) {
        return new Date(b.achievedDate).getTime() - new Date(a.achievedDate).getTime();
      }
      return 0;
    });
  }, [trophies]);

  // Add state for tooltip visibility
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);

  // Achievement badge component
  const AchievementBadge = ({ icon, title, value, color, max = null }: AchievementBadgeProps) => (
    <View style={[styles.achievementItem, { backgroundColor: colors.card }]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={styles.achievementContent}>
        <Text style={[styles.achievementTitle, { color: colors.text }]}>{title}</Text>
        {max ? (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarOuter}>
              <View 
                style={[
                  styles.progressBarInner, 
                  { width: `${(Number(value)/Number(max)) * 100}%`, backgroundColor: color }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colors.secondary }]}>
              {value} of {max}
            </Text>
          </View>
        ) : (
          <Text style={[styles.achievementValue, { color: color }]}>{value}</Text>
        )}
      </View>
    </View>
  );

  // Modify the Trophy component to handle long press
  const Trophy = ({ title, description, icon, achieved, id }: TrophyProps & { id: string }) => {
    const handleLongPress = () => {
      if (!achieved) {
        setTooltipVisible(id);
        // Hide tooltip after 2 seconds
        setTimeout(() => {
          setTooltipVisible(null);
        }, 2000);
      }
    };

    return (
      <TouchableOpacity 
        style={[
          styles.trophyItem, 
          { 
            backgroundColor: achieved ? colors.card : colors.border + '30',
            borderColor: achieved ? colors.primary : colors.border
          }
        ]}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        <View style={[styles.trophyIcon, { backgroundColor: achieved ? colors.primary + '30' : colors.border + '20' }]}>
          <Ionicons 
            name={icon} 
            size={24} 
            color={achieved ? colors.primary : colors.border} 
          />
        </View>
        <View style={styles.trophyContent}>
          <Text style={[styles.trophyTitle, { color: achieved ? colors.text : colors.border }]}>
            {title}
          </Text>
          <Text style={[styles.trophyDesc, { color: achieved ? colors.secondary : colors.border + '80' }]}>
            {tooltipVisible === id ? description : achieved ? description : '???'}
          </Text>
        </View>
        {achieved && (
          <View style={styles.achievedBadge}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="trophy" size={32} color={colors.primary} style={styles.headerIcon} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Achievements</Text>
        </View>

        {/* Reading Progress Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Reading Progress</Text>
          
          <AchievementBadge 
            icon="book-outline"
            title="Total Stories Read"
            value={`${stats.totalStories} of 365 stories`}
            color={colors.primary}
          />
          
          <AchievementBadge 
            icon="book-outline"
            title="Old Testament"
            value={stats.oldTestament.completed}
            max={stats.oldTestament.total}
            color="#8A2BE2"
          />

          <AchievementBadge 
            icon="book-outline"
            title="New Testament"
            value={stats.newTestament.completed}
            max={stats.newTestament.total}
            color="#4169E1"
          />
        </View>

        {/* Streaks Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Streaks</Text>
          
          <AchievementBadge 
            icon="flame-outline"
            title="Current Streak"
            value={`${stats.currentStreak} days`}
            color="#FF3B30"
          />
          
          <AchievementBadge 
            icon="trending-up-outline"
            title="Best Streak"
            value={`${stats.bestStreak} days`}
            color="#FF9500"
          />
          
          <AchievementBadge 
            icon="time-outline"
            title="Longest Session"
            value={`${stats.longestSession} segments`}
            color="#5856D6"
          />
        </View>

        {/* Trophies Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Trophies</Text>
          
          {/* Render sorted trophies */}
          {sortedTrophies.map(trophy => (
            <Trophy 
              key={trophy.id}
              id={trophy.id}
              title={trophy.title}
              description={trophy.description}
              icon={trophy.icon}
              achieved={trophy.achieved}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBarOuter: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarInner: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
  },
  emojiGridContainer: {
    marginTop: 8,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emojiItem: {
    width: '23%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  emojiCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sourceGridContainer: {
    marginTop: 8,
  },
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sourceItem: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  sourceLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sourceCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  trophyItem: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  trophyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  trophyContent: {
    flex: 1,
  },
  trophyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  trophyDesc: {
    fontSize: 14,
    opacity: 1,
  },
  achievedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  completedTrophiesSection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10
  }
});

export default Achievements;
