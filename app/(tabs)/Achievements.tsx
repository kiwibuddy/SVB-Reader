import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
  Platform,
  Image,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '@/context/GlobalContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { 
  getCurrentStreak, 
  getBestStreak,
  getEmojis,
  getEmojiStats,
  getCompletedSegmentsCount,
  getTotalSegmentsCount,
  getSourceStats,
  getOldTestamentProgress,
  getNewTestamentProgress,
  getLongestSession,
  getCompletedBooks,
  checkEmojiCollection,
  getReadingStreak,
  getBookProgress
} from '@/api/sqlite';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import { imageMap } from '@/components/navigation/NavBook';

// Enhanced Types
interface AchievementStats {
  totalStories: number;
  completedStories: number;
  completionPercentage: number;
  currentStreak: number;
  bestStreak: number;
  oldTestament: { completed: number; total: number };
  newTestament: { completed: number; total: number };
  emojiCount: { total: number; heart: number; prayer: number; question: number; thumbsUp: number };
  sourceReading: { red: number; green: number; blue: number; black: number };
  longestSession: number;
  booksCompleted: string[];
  emojiCollection: { complete: boolean; used: string[] };
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  progress: number;
  total: number;
  category: 'milestones' | 'streaks' | 'testament' | 'engagement' | 'books' | 'sessions';
  achieved: boolean;
  achievedDate?: string;
}

interface BookCompletion {
  bookCode: string;
  bookName: string;
  isCompleted: boolean;
}

const Achievements = () => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { colors } = useAppSettings();
  const { completedSegments } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [bookProgress, setBookProgress] = useState<Record<string, {completed: number; total: number; percentage: number}>>({});
  
  // Enhanced stats state with all database-driven properties
  const [stats, setStats] = useState<AchievementStats>({
    totalStories: 0,
    completedStories: 0,
    completionPercentage: 0,
    currentStreak: 0,
    bestStreak: 0,
    oldTestament: { completed: 0, total: 219 },
    newTestament: { completed: 0, total: 146 },
    emojiCount: { total: 0, heart: 0, prayer: 0, question: 0, thumbsUp: 0 },
    sourceReading: { red: 0, green: 0, blue: 0, black: 0 },
    longestSession: 0,
    booksCompleted: [],
    emojiCollection: { complete: false, used: [] }
  });

  const styles = createStyles(isLargeScreen, colors);

  // Bible books data
  const oldTestamentBooks: BookCompletion[] = [
    { bookCode: 'Gen', bookName: 'Genesis', isCompleted: false },
    { bookCode: 'Exo', bookName: 'Exodus', isCompleted: false },
    { bookCode: 'Lev', bookName: 'Leviticus', isCompleted: false },
    { bookCode: 'Num', bookName: 'Numbers', isCompleted: false },
    { bookCode: 'Deu', bookName: 'Deuteronomy', isCompleted: false },
    { bookCode: 'Jos', bookName: 'Joshua', isCompleted: false },
    { bookCode: 'Jdg', bookName: 'Judges', isCompleted: false },
    { bookCode: 'Rut', bookName: 'Ruth', isCompleted: false },
    { bookCode: '1Sa', bookName: '1 Samuel', isCompleted: false },
    { bookCode: '2Sa', bookName: '2 Samuel', isCompleted: false },
    { bookCode: '1Ki', bookName: '1 Kings', isCompleted: false },
    { bookCode: '2Ki', bookName: '2 Kings', isCompleted: false },
    { bookCode: '1Ch', bookName: '1 Chronicles', isCompleted: false },
    { bookCode: '2Ch', bookName: '2 Chronicles', isCompleted: false },
    { bookCode: 'Ezr', bookName: 'Ezra', isCompleted: false },
    { bookCode: 'Neh', bookName: 'Nehemiah', isCompleted: false },
    { bookCode: 'Est', bookName: 'Esther', isCompleted: false },
    { bookCode: 'Job', bookName: 'Job', isCompleted: false },
    { bookCode: 'Psa', bookName: 'Psalms', isCompleted: false },
    { bookCode: 'Pro', bookName: 'Proverbs', isCompleted: false },
    { bookCode: 'Ecc', bookName: 'Ecclesiastes', isCompleted: false },
    { bookCode: 'SoS', bookName: 'Song of Solomon', isCompleted: false },
    { bookCode: 'Isa', bookName: 'Isaiah', isCompleted: false },
    { bookCode: 'Jer', bookName: 'Jeremiah', isCompleted: false },
    { bookCode: 'Lam', bookName: 'Lamentations', isCompleted: false },
    { bookCode: 'Eze', bookName: 'Ezekiel', isCompleted: false },
    { bookCode: 'Dan', bookName: 'Daniel', isCompleted: false },
    { bookCode: 'Hos', bookName: 'Hosea', isCompleted: false },
    { bookCode: 'Joe', bookName: 'Joel', isCompleted: false },
    { bookCode: 'Amo', bookName: 'Amos', isCompleted: false },
    { bookCode: 'Oba', bookName: 'Obadiah', isCompleted: false },
    { bookCode: 'Jon', bookName: 'Jonah', isCompleted: false },
    { bookCode: 'Mic', bookName: 'Micah', isCompleted: false },
    { bookCode: 'Nah', bookName: 'Nahum', isCompleted: false },
    { bookCode: 'Hab', bookName: 'Habakkuk', isCompleted: false },
    { bookCode: 'Zep', bookName: 'Zephaniah', isCompleted: false },
    { bookCode: 'Hag', bookName: 'Haggai', isCompleted: false },
    { bookCode: 'Zec', bookName: 'Zechariah', isCompleted: false },
    { bookCode: 'Mal', bookName: 'Malachi', isCompleted: false },
  ];

  const newTestamentBooks: BookCompletion[] = [
    { bookCode: 'Mat', bookName: 'Matthew', isCompleted: false },
    { bookCode: 'Mar', bookName: 'Mark', isCompleted: false },
    { bookCode: 'Luk', bookName: 'Luke', isCompleted: false },
    { bookCode: 'Joh', bookName: 'John', isCompleted: false },
    { bookCode: 'Act', bookName: 'Acts', isCompleted: false },
    { bookCode: 'Rom', bookName: 'Romans', isCompleted: false },
    { bookCode: '1Co', bookName: '1 Corinthians', isCompleted: false },
    { bookCode: '2Co', bookName: '2 Corinthians', isCompleted: false },
    { bookCode: 'Gal', bookName: 'Galatians', isCompleted: false },
    { bookCode: 'Eph', bookName: 'Ephesians', isCompleted: false },
    { bookCode: 'Php', bookName: 'Philippians', isCompleted: false },
    { bookCode: 'Col', bookName: 'Colossians', isCompleted: false },
    { bookCode: '1Th', bookName: '1 Thessalonians', isCompleted: false },
    { bookCode: '2Th', bookName: '2 Thessalonians', isCompleted: false },
    { bookCode: '1Ti', bookName: '1 Timothy', isCompleted: false },
    { bookCode: '2Ti', bookName: '2 Timothy', isCompleted: false },
    { bookCode: 'Tit', bookName: 'Titus', isCompleted: false },
    { bookCode: 'Phm', bookName: 'Philemon', isCompleted: false },
    { bookCode: 'Heb', bookName: 'Hebrews', isCompleted: false },
    { bookCode: 'Jam', bookName: 'James', isCompleted: false },
    { bookCode: '1Pe', bookName: '1 Peter', isCompleted: false },
    { bookCode: '2Pe', bookName: '2 Peter', isCompleted: false },
    { bookCode: '1Jn', bookName: '1 John', isCompleted: false },
    { bookCode: '2Jn', bookName: '2 John', isCompleted: false },
    { bookCode: '3Jn', bookName: '3 John', isCompleted: false },
    { bookCode: 'Jud', bookName: 'Jude', isCompleted: false },
    { bookCode: 'Rev', bookName: 'Revelation', isCompleted: false },
  ];

  // Comprehensive database-driven stats loading
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load all statistics in parallel for better performance
        const [
          completedCount,
          totalCount,
          streakData,
          emojiData,
          sourceData,
          otProgress,
          ntProgress,
          longestSession,
          booksCompleted,
          emojiCollection
        ] = await Promise.all([
          getCompletedSegmentsCount(),
          getTotalSegmentsCount(),
          getReadingStreak(),
          getEmojiStats(),
          getSourceStats(),
          getOldTestamentProgress(),
          getNewTestamentProgress(),
          getLongestSession(),
          getCompletedBooks(),
          checkEmojiCollection()
        ]);

        const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        setStats({
          totalStories: totalCount,
          completedStories: completedCount,
          completionPercentage,
          currentStreak: streakData.current || 0,
          bestStreak: streakData.longest || 0,
          oldTestament: otProgress,
          newTestament: ntProgress,
          emojiCount: emojiData,
          sourceReading: {
            red: sourceData.god || 0,
            green: sourceData.mainCharacter || 0,
            blue: sourceData.otherVoices || 0,
            black: sourceData.narrator || 0
          },
          longestSession,
          booksCompleted: Array.isArray(booksCompleted) ? booksCompleted : [],
          emojiCollection
        });

        // Load individual book progress for all books
        const allBooks = [...oldTestamentBooks, ...newTestamentBooks];
        const progressData: Record<string, {completed: number; total: number; percentage: number}> = {};
        
        for (const book of allBooks) {
          const progress = await getBookProgress(book.bookCode);
          progressData[book.bookCode] = progress;
        }
        
        setBookProgress(progressData);

      } catch (error) {
        console.error('Error loading achievement stats:', error);
        setError('Failed to load achievements. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [completedSegments, refreshTrigger]);

  // Check if a book is completed based on segments (excluding intro segments)
  const isBookCompleted = (bookCode: string): boolean => {
    return stats.booksCompleted.includes(bookCode);
  };

  // Calculate total stories and completed stories for each testament
  const getTestamentStoryProgress = (books: BookCompletion[]) => {
    let completed = 0;
    let total = 0;
    books.forEach(book => {
      const progress = bookProgress[book.bookCode] || { completed: 0, total: 0, percentage: 0 };
      completed += progress.completed;
      total += progress.total;
    });
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const otStoryProgress = getTestamentStoryProgress(oldTestamentBooks);
  const ntStoryProgress = getTestamentStoryProgress(newTestamentBooks);

  // Database-driven achievement definitions
  const generateAchievements = (): Achievement[] => [
    // Reading Milestones
    {
      id: 'first_steps',
      title: 'First Steps',
      description: 'Read your first Bible story',
      icon: 'book-outline',
      color: '#4CAF50',
      progress: Math.min(stats.completedStories, 1),
      total: 1,
      category: 'milestones',
      achieved: stats.completedStories >= 1
    },
    {
      id: 'bible_explorer',
      title: 'Bible Explorer',
      description: 'Read 10 Bible stories',
      icon: 'compass-outline',
      color: '#2196F3',
      progress: Math.min(stats.completedStories, 10),
      total: 10,
      category: 'milestones',
      achieved: stats.completedStories >= 10
    },
    {
      id: 'scripture_enthusiast',
      title: 'Scripture Enthusiast',
      description: 'Read 25 Bible stories',
      icon: 'library-outline',
      color: '#9C27B0',
      progress: Math.min(stats.completedStories, 25),
      total: 25,
      category: 'milestones',
      achieved: stats.completedStories >= 25
    },
    {
      id: 'bible_scholar',
      title: 'Bible Scholar',
      description: 'Read 50 Bible stories',
      icon: 'school-outline',
      color: '#FF9800',
      progress: Math.min(stats.completedStories, 50),
      total: 50,
      category: 'milestones',
      achieved: stats.completedStories >= 50
    },
    {
      id: 'word_warrior',
      title: 'Word Warrior',
      description: 'Read 100 Bible stories',
      icon: 'shield-outline',
      color: '#F44336',
      progress: Math.min(stats.completedStories, 100),
      total: 100,
      category: 'milestones',
      achieved: stats.completedStories >= 100
    },
    {
      id: 'bible_master',
      title: 'Bible Master',
      description: 'Read 200 Bible stories',
      icon: 'ribbon-outline',
      color: '#9C27B0',
      progress: Math.min(stats.completedStories, 200),
      total: 200,
      category: 'milestones',
      achieved: stats.completedStories >= 200
    },
    {
      id: 'complete_collection',
      title: 'Complete Collection',
      description: 'Read all 365 Bible stories',
      icon: 'trophy-outline',
      color: '#FFD700',
      progress: Math.min(stats.completedStories, 365),
      total: 365,
      category: 'milestones',
      achieved: stats.completedStories >= 365
    },

    // Reading Streaks
    {
      id: 'getting_started',
      title: 'Getting Started',
      description: 'Maintain a 3-day reading streak',
      icon: 'flame-outline',
      color: '#FF5722',
      progress: Math.min(stats.bestStreak, 3),
      total: 3,
      category: 'streaks',
      achieved: stats.bestStreak >= 3
    },
    {
      id: 'consistent_reader',
      title: 'Consistent Reader',
      description: 'Maintain a 7-day reading streak',
      icon: 'flame-outline',
      color: '#FF5722',
      progress: Math.min(stats.bestStreak, 7),
      total: 7,
      category: 'streaks',
      achieved: stats.bestStreak >= 7
    },
    {
      id: 'dedicated_disciple',
      title: 'Dedicated Disciple',
      description: 'Maintain a 14-day reading streak',
      icon: 'flame',
      color: '#FF5722',
      progress: Math.min(stats.bestStreak, 14),
      total: 14,
      category: 'streaks',
      achieved: stats.bestStreak >= 14
    },
    {
      id: 'scripture_habit',
      title: 'Scripture Habit',
      description: 'Maintain a 30-day reading streak',
      icon: 'flame',
      color: '#FF5722',
      progress: Math.min(stats.bestStreak, 30),
      total: 30,
      category: 'streaks',
      achieved: stats.bestStreak >= 30
    },
    {
      id: 'bible_devotee',
      title: 'Bible Devotee',
      description: 'Maintain a 60-day reading streak',
      icon: 'flame',
      color: '#E91E63',
      progress: Math.min(stats.bestStreak, 60),
      total: 60,
      category: 'streaks',
      achieved: stats.bestStreak >= 60
    },
    {
      id: 'faithful_follower',
      title: 'Faithful Follower',
      description: 'Maintain a 100-day reading streak',
      icon: 'flame',
      color: '#E91E63',
      progress: Math.min(stats.bestStreak, 100),
      total: 100,
      category: 'streaks',
      achieved: stats.bestStreak >= 100
    },
    {
      id: 'scripture_champion',
      title: 'Scripture Champion',
      description: 'Maintain a 365-day reading streak',
      icon: 'flame',
      color: '#FFD700',
      progress: Math.min(stats.bestStreak, 365),
      total: 365,
      category: 'streaks',
      achieved: stats.bestStreak >= 365
    },

    // Testament Progress
    {
      id: 'old_testament',
      title: 'Old Testament Master',
      description: 'Complete the Old Testament',
      icon: 'library-outline',
      color: '#8D6E63',
      progress: otStoryProgress.completed,
      total: otStoryProgress.total,
      category: 'testament',
      achieved: otStoryProgress.completed >= otStoryProgress.total
    },
    {
      id: 'new_testament',
      title: 'New Testament Master',
      description: 'Complete the New Testament',
      icon: 'star-outline',
      color: '#607D8B',
      progress: ntStoryProgress.completed,
      total: ntStoryProgress.total,
      category: 'testament',
      achieved: ntStoryProgress.completed >= ntStoryProgress.total
    },

    // Engagement Achievements
    {
      id: 'first_reaction',
      title: 'First Reaction',
      description: 'Add your first emoji reaction',
      icon: 'happy-outline',
      color: '#FFC107',
      progress: Math.min(stats.emojiCount.total, 1),
      total: 1,
      category: 'engagement',
      achieved: stats.emojiCount.total >= 1
    },
    {
      id: 'heart_collector',
      title: 'Heart Collector',
      description: 'Use the ❤️ emoji 10 times',
      icon: 'heart-outline',
      color: '#E91E63',
      progress: Math.min(stats.emojiCount.heart, 10),
      total: 10,
      category: 'engagement',
      achieved: stats.emojiCount.heart >= 10
    },
    {
      id: 'prayer_warrior',
      title: 'Prayer Warrior',
      description: 'Use the 🙏 emoji 10 times',
      icon: 'hand-right-outline',
      color: '#9C27B0',
      progress: Math.min(stats.emojiCount.prayer, 10),
      total: 10,
      category: 'engagement',
      achieved: stats.emojiCount.prayer >= 10
    },
    {
      id: 'encourager',
      title: 'Encourager',
      description: 'Use the 👍 emoji 10 times',
      icon: 'thumbs-up-outline',
      color: '#4CAF50',
      progress: Math.min(stats.emojiCount.thumbsUp, 10),
      total: 10,
      category: 'engagement',
      achieved: stats.emojiCount.thumbsUp >= 10
    },
    {
      id: 'deep_thinker',
      title: 'Deep Thinker',
      description: 'Use the 🤔 emoji 10 times',
      icon: 'bulb-outline',
      color: '#607D8B',
      progress: Math.min(stats.emojiCount.question, 10),
      total: 10,
      category: 'engagement',
      achieved: stats.emojiCount.question >= 10
    },
    {
      id: 'emoji_enthusiast',
      title: 'Emoji Enthusiast',
      description: 'Use 50 emoji reactions',
      icon: 'chatbubble-outline',
      color: '#FF9800',
      progress: Math.min(stats.emojiCount.total, 50),
      total: 50,
      category: 'engagement',
      achieved: stats.emojiCount.total >= 50
    },
    {
      id: 'emoji_master',
      title: 'Emoji Master',
      description: 'Use 100 emoji reactions',
      icon: 'chatbubble-ellipses-outline',
      color: '#9C27B0',
      progress: Math.min(stats.emojiCount.total, 100),
      total: 100,
      category: 'engagement',
      achieved: stats.emojiCount.total >= 100
    },
    {
      id: 'emoji_champion',
      title: 'Emoji Champion',
      description: 'Use 200 emoji reactions',
      icon: 'medal-outline',
      color: '#E91E63',
      progress: Math.min(stats.emojiCount.total, 200),
      total: 200,
      category: 'engagement',
      achieved: stats.emojiCount.total >= 200
    },
    {
      id: 'emoji_collection_master',
      title: 'Collection Master',
      description: 'Use all emoji types multiple times',
      icon: 'apps-outline',
      color: '#9C27B0',
      progress: stats.emojiCollection.complete ? 1 : 0,
      total: 1,
      category: 'engagement',
      achieved: stats.emojiCollection.complete
    },

    // Reading Sessions
    {
      id: 'marathon_reader',
      title: 'Marathon Reader',
      description: 'Read 5 stories in one session',
      icon: 'timer-outline',
      color: '#FF9800',
      progress: Math.min(stats.longestSession, 5),
      total: 5,
      category: 'sessions',
      achieved: stats.longestSession >= 5
    },
    {
      id: 'super_session',
      title: 'Super Session',
      description: 'Read 10 stories in one session',
      icon: 'flash-outline',
      color: '#9C27B0',
      progress: Math.min(stats.longestSession, 10),
      total: 10,
      category: 'sessions',
      achieved: stats.longestSession >= 10
    }
  ];

  const achievements = generateAchievements();

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.secondary }]}>
          Loading your achievements...
        </Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color='#F44336'
          style={{ marginBottom: 16 }}
        />
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => setRefreshTrigger(prev => prev + 1)}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const ProgressBar = ({ progress, total, color }: { progress: number; total: number; color: string }) => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { backgroundColor: color + '20' }]}>
        <View 
          style={[
            styles.progressFill, 
            { 
              backgroundColor: color,
              width: `${Math.min((progress / total) * 100, 100)}%`
            }
          ]} 
        />
      </View>
    </View>
  );

  const StatCard = ({ icon, title, value, backgroundColor }: { 
    icon: keyof typeof Ionicons.glyphMap; 
    title: string; 
    value: string; 
    backgroundColor: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor }]}>
      <View style={styles.statCardContent}>
        <View style={styles.statCardIconContainer}>
          <Ionicons name={icon} size={32} color="white" />
        </View>
        <Text style={styles.statCardTitle}>{title}</Text>
        <Text style={styles.statCardValue}>{value}</Text>
      </View>
      </View>
  );

  const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
    const isCompleted = achievement.achieved;
    let progress = achievement.progress;
    let total = achievement.total;
    let percent = Math.round((progress / total) * 100);
    let showStoryProgress = false;

    // If this is a testament progress card, use story progress
    if (achievement.id === 'old_testament') {
      progress = otStoryProgress.completed;
      total = otStoryProgress.total;
      percent = otStoryProgress.percentage;
      showStoryProgress = true;
    } else if (achievement.id === 'new_testament') {
      progress = ntStoryProgress.completed;
      total = ntStoryProgress.total;
      percent = ntStoryProgress.percentage;
      showStoryProgress = true;
    }

    return (
      <View style={[styles.achievementCard, isCompleted && styles.completedCard]}>
        <View style={styles.achievementHeader}>
          <View style={[styles.achievementIcon, { backgroundColor: achievement.color + '20' }]}> 
            <Ionicons 
              name={achievement.icon} 
              size={24} 
              color={isCompleted ? achievement.color : colors.secondary} 
            />
          </View>
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementTitle, isCompleted && { color: colors.text }]}> 
              {achievement.title}
            </Text>
            <Text style={[styles.achievementProgress, { color: isCompleted ? achievement.color : colors.secondary }]}> 
              {showStoryProgress ? `${progress} of ${total}` : `${achievement.progress} of ${achievement.total}`}
            </Text>
          </View>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={achievement.color} />
            </View>
          )}
        </View>
        <Text style={[styles.achievementDescription, { color: isCompleted ? colors.secondary : colors.secondary }]}> 
          {achievement.description}
        </Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { backgroundColor: achievement.color + '20' }]}> 
            <View 
              style={[styles.progressFill, { backgroundColor: achievement.color, width: `${showStoryProgress ? percent : Math.min((achievement.progress / achievement.total) * 100, 100)}%` }]} 
            />
          </View>
        </View>
      </View>
    );
  };

  const BookCard = ({ book }: { book: BookCompletion }) => {
    const isCompleted = isBookCompleted(book.bookCode);
    const imageSource = imageMap[book.bookCode];
    const progressData = bookProgress[book.bookCode] || { completed: 0, total: 0, percentage: 0 };
    
    // Debug logging
    console.log(`Book: ${book.bookCode}, Image exists: ${!!imageSource}, Progress: ${progressData.percentage}%, Completed segments: ${progressData.completed}/${progressData.total}`);
    
    // Use real progress data
    const progress = progressData.percentage;
    const progressColor = progress === 100 ? '#4CAF50' : progress > 0 ? '#FF9800' : colors.secondary;
    
    // Determine status text
    const getStatusText = () => {
      if (progress === 100) return 'Completed';
      if (progress > 0) return `${progressData.completed}/${progressData.total} stories`;
      return 'Not Started';
    };
    
          return (
        <View style={[styles.bookCard, progress === 100 && styles.completedBookCard]}>
          <View style={styles.bookHeader}>
            <View style={[styles.bookImageContainer, progress === 100 && styles.completedImageContainer]}>
              {imageSource ? (
                <Image 
                  source={imageSource} 
                  style={[
                    styles.bookImage,
                    progress === 0 && styles.uncompletedImage
                  ]} 
                  resizeMode="contain"
                  onError={(error) => console.log('Image load error:', error)}
                />
              ) : (
                <View style={[styles.bookImage, styles.fallbackBookImage]}>
                  <Text style={styles.fallbackBookText}>
                    {book.bookCode.substring(0, 3)}
                  </Text>
                </View>
              )}
              {progress === 100 && (
                <View style={styles.completedBadgeBook}>
                  <Ionicons name="checkmark-circle" size={18} color="white" />
                </View>
              )}
            </View>
          
          <View style={styles.bookInfo}>
            <Text style={[styles.bookTitle, progress === 100 && styles.completedBookTitle]}>
              {book.bookName}
            </Text>
            <Text style={[styles.bookStatus, { color: progressColor }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>
        
        <View style={styles.bookProgressSection}>
          <View style={styles.bookProgressBarContainer}>
            <View style={[styles.progressBarBackground, { backgroundColor: progressColor + '20' }]}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    backgroundColor: progressColor,
                    width: `${progress}%`
                  }
                ]} 
              />
            </View>
          </View>
          <Text style={[styles.progressPercentage, { color: progressColor }]}>
            {progress}%
          </Text>
        </View>
      </View>
    );
  };

  const renderSection = (title: string, achievements: Achievement[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.achievementGrid}>
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </View>
              </View>
  );

  const renderBooksSection = (title: string, books: BookCompletion[], testament: 'OT' | 'NT') => {
    // Calculate book completion
    let completedBooks = 0;
    books.forEach(book => {
      const progress = bookProgress[book.bookCode] || { completed: 0, total: 0, percentage: 0 };
      if (progress.percentage === 100) completedBooks++;
    });
    const totalBooks = books.length;
    const progressPercentage = totalBooks > 0 ? Math.round((completedBooks / totalBooks) * 100) : 0;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { marginBottom: 0, paddingHorizontal: 0 }]}>{title}</Text>
          <View style={styles.progressIndicator}>
            <Text style={[styles.progressText, { color: colors.secondary }]}> 
              {completedBooks}/{totalBooks} books complete
            </Text>
          </View>
        </View>
        <View style={styles.progressBarSection}>
          <ProgressBar 
            progress={completedBooks} 
            total={totalBooks} 
            color={testament === 'OT' ? '#8D6E63' : '#607D8B'} 
          />
        </View>
        <View style={styles.booksGrid}>
          {books.map((book) => (
            <BookCard key={book.bookCode} book={book} />
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Achievements</Text>
          <Text style={styles.welcomeText}>
            Track your Bible reading progress and celebrate your milestones
          </Text>
        </View>

        {/* Top Statistics */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="book-outline"
            title="Stories Read"
            value={stats.completedStories.toString()}
            backgroundColor="#4CAF50"
          />
          <StatCard
            icon="flame-outline"
            title="Current Streak"
            value={stats.currentStreak.toString()}
            backgroundColor="#7B68EE"
          />
          <StatCard
            icon="trending-up-outline"
            title="Complete Bible"
            value={`${stats.completionPercentage}%`}
            backgroundColor="#FF8C00"
          />
        </View>

        {/* Reading Milestones */}
        {renderSection(
          'Reading Milestones',
          achievements.filter(a => a.category === 'milestones')
        )}

        {/* Reading Streaks */}
        {renderSection(
          'Reading Streaks',
          achievements.filter(a => a.category === 'streaks')
        )}

        {/* Testament Progress */}
        {renderSection(
          'Testament Progress',
          achievements.filter(a => a.category === 'testament')
        )}

        {/* Reading Sessions */}
        {achievements.filter(a => a.category === 'sessions').length > 0 && renderSection(
          'Reading Sessions',
          achievements.filter(a => a.category === 'sessions')
        )}

        {/* Engagement */}
        {renderSection(
          'Engagement',
          achievements.filter(a => a.category === 'engagement')
        )}

        {/* Old Testament Books */}
        {renderBooksSection('Old Testament Books', oldTestamentBooks, 'OT')}

        {/* New Testament Books */}
        {renderBooksSection('New Testament Books', newTestamentBooks, 'NT')}
    </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (isLargeScreen: boolean, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  welcomeSection: {
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.secondary,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 140,
  },
  statCardContent: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    paddingHorizontal: 16,
    letterSpacing: -0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  progressIndicator: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  achievementGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    width: isLargeScreen ? '48%' : '48%',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
  },
  completedCard: {
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  completedBadge: {
    marginLeft: 8,
  },
  completedBadgeSmall: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  achievementProgress: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
  },
  achievementDescription: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  progressBarContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Bible Books Section Styles
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  
  // Enhanced Book Card Styles
  bookCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
  },
  completedBookCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: colors.card,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
  },
  bookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: colors.background,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  completedImageContainer: {
    backgroundColor: '#4CAF5015',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  bookImage: {
    width: 32,
    height: 32,
  },
  uncompletedImage: {
    opacity: 0.4,
  },
  fallbackBookImage: {
    width: 32,
    height: 32,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackBookText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  completedBadgeBook: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: colors.card,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  completedBookTitle: {
    color: colors.text,
  },
  bookStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  bookProgressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookProgressBarContainer: {
    flex: 1,
    marginRight: 8,
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  
  // Loading and error states
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Achievements;