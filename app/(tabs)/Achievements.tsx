import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import logger from '@/utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
  Platform,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressIndicator } from '@/components/loading/ProgressIndicator';
import { Collapsible } from '@/components/Collapsible';
// Removed useAppContext import - now using pure SQLite data loading
import { useAppSettings } from '@/context/AppSettingsContext';
import { 
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
  getBookProgress,
  getContextualStreaks
} from '@/api/sqlite';
import { imageMap } from '@/components/navigation/NavBook';
import { databaseManager } from '@/api/database-manager';


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
  planStreak: number;
  challengeStreak: number;
  planCompletions: number;
  challengeCompletions: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  progress: number;
  total: number;
  category: 'milestones' | 'streaks' | 'testament' | 'engagement' | 'books';
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
  // Removed completedSegments dependency - now using pure SQLite data loading
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [bookProgress, setBookProgress] = useState<Record<string, {completed: number; total: number; percentage: number}>>({});
  const [preloadedImages, setPreloadedImages] = useState<Record<string, any>>({});
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});


  
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
    emojiCollection: { complete: false, used: [] },
    planStreak: 0,
    challengeStreak: 0,
    planCompletions: 0,
    challengeCompletions: 0,
  });
  const [groupCompletions, setGroupCompletions] = useState(0);
  const [info, setInfo] = useState<{ title: string; description: string } | null>(null);

  const styles = createStyles(isLargeScreen, colors);
  const [showOTAll, setShowOTAll] = useState(false);
  const [showNTAll, setShowNTAll] = useState(false);
  const [showMoreRewards, setShowMoreRewards] = useState(false);
  const [showMorePlans, setShowMorePlans] = useState(false);
  const [showMoreEngagement, setShowMoreEngagement] = useState(false);

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

  // Preload all book icons for better performance
  const preloadBookIcons = async () => {
    const allBookCodes = [...oldTestamentBooks, ...newTestamentBooks].map(book => book.bookCode);
    const preloaded: Record<string, any> = {};
    const loadingStates: Record<string, boolean> = {};
    
    // Set all to loading initially
    allBookCodes.forEach(code => {
      loadingStates[code] = true;
    });
    setImageLoadingStates(loadingStates);
    
    // Preload images in parallel
    const preloadPromises = allBookCodes.map(async (bookCode) => {
      try {
        if (imageMap[bookCode]) {
          const imageSource = imageMap[bookCode]();
          preloaded[bookCode] = imageSource;
          loadingStates[bookCode] = false;
        }
      } catch (error) {
        logger.error(`Failed to preload image for ${bookCode}:`, error);
        loadingStates[bookCode] = false;
      }
    });
    
    await Promise.all(preloadPromises);
    setPreloadedImages(preloaded);
    setImageLoadingStates(loadingStates);
  };

  // Comprehensive database-driven stats loading
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Preload book icons in parallel with stats loading
        const preloadPromise = preloadBookIcons();
        
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

        // Wait for both stats and image preloading to complete
        await preloadPromise;

        // Holder for derived extras used below
        let derivedExtras: { planStreak: number; challengeStreak: number; planCompletions: number; challengeCompletions: number } = {
          planStreak: 0,
          challengeStreak: 0,
          planCompletions: 0,
          challengeCompletions: 0,
        };

        try {
          const db = databaseManager.getDatabase();
          const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM group_segment_completion');
          setGroupCompletions(row?.count || 0);
          // Plan / Challenge completions
          const planRow = await db.getFirstAsync<{ count: number }>(
            "SELECT COUNT(*) as count FROM segment_completion WHERE completionType = 'plan'"
          );
          const challengeRow = await db.getFirstAsync<{ count: number }>(
            "SELECT COUNT(*) as count FROM segment_completion WHERE completionType = 'challenge'"
          );
          // Contextual streaks (continuous days per context)
          const contextual = await getContextualStreaks();
          const planStreakVal = contextual.plan || 0;
          const challengeStreakVal = contextual.challenge || 0;
          const planCompletionsVal = planRow?.count || 0;
          const challengeCompletionsVal = challengeRow?.count || 0;

          // Overwrite with new object (immutably)
          derivedExtras = {
            planStreak: planStreakVal,
            challengeStreak: challengeStreakVal,
            planCompletions: planCompletionsVal,
            challengeCompletions: challengeCompletionsVal,
          };
        } catch {}

        const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        const derived = derivedExtras;

        setStats({
          totalStories: totalCount,
          completedStories: completedCount,
          completionPercentage,
          currentStreak: streakData.currentStreak || 0,
          bestStreak: streakData.longestStreak || 0,
          oldTestament: otProgress,
          newTestament: ntProgress,
          emojiCount: emojiData,
          sourceReading: {
            red: sourceData.red || 0,
            green: sourceData.green || 0,
            blue: sourceData.blue || 0,
            black: sourceData.black || 0
          },
          longestSession,
          booksCompleted: Array.isArray(booksCompleted) ? booksCompleted : [],
          emojiCollection,
          planStreak: derived.planStreak,
          challengeStreak: derived.challengeStreak,
          planCompletions: derived.planCompletions,
          challengeCompletions: derived.challengeCompletions,
        });

        // Load individual book progress for all books
        const allBooks = [...oldTestamentBooks, ...newTestamentBooks];
        // Fetch all book progresses in parallel
        const progressResults = await Promise.all(
          allBooks.map(book => getBookProgress(book.bookCode))
        );
        const progressData: Record<string, {completed: number; total: number; percentage: number}> = {};
        allBooks.forEach((book, i) => {
          progressData[book.bookCode] = progressResults[i];
        });
        setBookProgress(progressData);

      } catch (error) {
        logger.error('Error loading achievement stats:', error);
        setError('Failed to load achievements. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [refreshTrigger]); // Removed completedSegments dependency - now pure SQLite

  // Auto-refresh when returning to Achievements screen
  useFocusEffect(
    React.useCallback(() => {
      const refreshStats = async () => {
        // Add a small delay to ensure database writes are complete
        await new Promise(resolve => setTimeout(resolve, 100));
        setRefreshTrigger(prev => prev + 1);
      };
      refreshStats();
    }, [])
  );

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
    {
      id: 'group_reader_1',
      title: 'Group Reader',
      description: 'Complete 1 story in group mode',
      icon: 'people-circle-outline',
      color: '#42A5F5',
      progress: Math.min(groupCompletions, 1),
      total: 1,
      category: 'engagement',
      achieved: groupCompletions >= 1
    },
    {
      id: 'group_reader_10',
      title: 'Group Enthusiast',
      description: 'Complete 10 stories in group mode',
      icon: 'people-outline',
      color: '#42A5F5',
      progress: Math.min(groupCompletions, 10),
      total: 10,
      category: 'engagement',
      achieved: groupCompletions >= 10
    },
    // Reading Milestones
    {
      id: 'first_story',
      title: 'First Story',
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
      title: 'Bible Enthusiast',
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
      title: 'Bible Champion',
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
      title: 'Bible Master',
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
      title: 'Dedicated Reader',
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
      title: 'Bible Habit',
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
      title: 'Faithful Reader',
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
      title: 'Bible Champion',
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
      title: 'Emoji Master',
      description: 'Use all emoji types multiple times',
      icon: 'apps-outline',
      color: '#9C27B0',
      progress: stats.emojiCollection.complete ? 1 : 0,
      total: 1,
      category: 'engagement',
      achieved: stats.emojiCollection.complete
    }
  ];

  const achievements = generateAchievements();

  // Compute effective progress for achievements (handles testament story progress)
  const getEffectiveProgress = (achievement: Achievement) => {
    let progress = achievement.progress;
    let total = achievement.total;
    if (achievement.id === 'old_testament') {
      progress = otStoryProgress.completed;
      total = otStoryProgress.total;
    } else if (achievement.id === 'new_testament') {
      progress = ntStoryProgress.completed;
      total = ntStoryProgress.total;
    }
    const percent = total > 0 ? Math.round((progress / total) * 100) : 0;
    return { progress, total, percent };
  };

  // Pick featured and next achievements
  const getFeaturedAchievement = () => {
    const candidates = achievements
      .filter(a => !a.achieved && a.total > 0)
      .map(a => ({ a, meta: getEffectiveProgress(a) }))
      .sort((x, y) => y.meta.percent - x.meta.percent);
    return candidates.length > 0 ? candidates[0] : null;
  };

  const featured = getFeaturedAchievement();
  const featuredMeta = featured ? featured.meta : null;

  // First-run vs ongoing next achievements (always 6 tiles)
  const FIRST_RUN_ACHIEVEMENTS: { id: string; title: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'first_story', title: 'First Story', description: 'Read your first Bible story', icon: 'book-outline' },
    { id: 'first_group_story', title: 'First Group Story', description: 'Complete a story in group mode', icon: 'people-outline' },
    { id: 'first_emoji', title: 'First Emoji', description: 'React with your first emoji', icon: 'happy-outline' },
    { id: 'first_plan_story', title: 'First Plan Story', description: 'Complete your first plan story', icon: 'calendar-outline' },
    { id: 'first_challenge_story', title: 'First Challenge Story', description: 'Complete your first challenge story', icon: 'flag-outline' },
    { id: 'first_books', title: 'First Books', description: 'Finish an OT and an NT book', icon: 'library-outline' },
  ];

  const [isFirstRun, setIsFirstRun] = useState<boolean>(false);
  useEffect(() => {
    (async () => {
      try {
        const db = databaseManager.getDatabase();
        const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_state WHERE key = 'achievements.firstRunDone'");
        setIsFirstRun(!(row?.value === '1'));
      } catch {
        setIsFirstRun(true);
      }
    })();
  }, []);

  const nextAchievements = () => {
    if (isFirstRun) return FIRST_RUN_ACHIEVEMENTS.slice(0, 6);
    // Ongoing: pick up to 6 closest-to-completion across categories
    return achievements
      .filter(a => !a.achieved && a.total > 0)
      .map(a => ({ a, meta: getEffectiveProgress(a) }))
      .sort((x, y) => y.meta.percent - x.meta.percent)
      .slice(0, 6)
      .map(x => x.a);
  };

  // Loading state
  if (isLoading || Object.values(imageLoadingStates).some(loading => loading)) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.secondary }]}>
          {isLoading ? 'Loading your achievements...' : 'Preparing book icons...'}
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

    // Determine if title is likely to be one line or two lines
    const titleLength = achievement.title.length;
    const isLikelyOneLine = titleLength <= 12; // Titles with 12 or fewer characters are likely one line

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setInfo({ title: achievement.title, description: achievement.description })}
        style={[styles.achievementCard, isCompleted && styles.completedCard]}
      >
        <View style={styles.achievementHeader}>
          <View style={[
            styles.achievementIcon, 
            isCompleted ? styles.completedAchievementIcon : { backgroundColor: achievement.color + '20' }
          ]}> 
            <Ionicons 
              name={achievement.icon} 
              size={18} 
              color={achievement.color} 
            />
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              </View>
            )}
          </View>
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementTitle, isCompleted && { color: colors.text }]} numberOfLines={2}> 
              {achievement.title}
            </Text>
            <Text style={[
              styles.achievementProgress, 
              { 
                color: isCompleted ? '#4CAF50' : colors.secondary,
                marginBottom: isLikelyOneLine ? 16 : 8 // Add extra space for one-line titles
              }
            ]} numberOfLines={1}> 
              {isCompleted ? 'Completed' : (() => {
                const p = showStoryProgress ? progress : achievement.progress;
                const t = showStoryProgress ? total : achievement.total;
                return p && p > 0 ? `${p} of ${t}` : 'Not started';
              })()}
            </Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { backgroundColor: isCompleted ? '#4CAF5020' : achievement.color + '20' }]}> 
            <View 
              style={[styles.progressFill, { backgroundColor: isCompleted ? '#4CAF50' : achievement.color, width: `${showStoryProgress ? percent : Math.min((achievement.progress / achievement.total) * 100, 100)}%` }]} 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const BookCard = ({ book }: { book: BookCompletion }) => {
    const isCompleted = isBookCompleted(book.bookCode);
    const imageSource = preloadedImages[book.bookCode];
    const isImageLoading = imageLoadingStates[book.bookCode];
    const progressData = bookProgress[book.bookCode] || { completed: 0, total: 0, percentage: 0 };
    
    
    
    
    // Use real progress data
    const progress = Math.round(progressData.percentage);
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
              {isImageLoading ? (
                <ActivityIndicator size="small" color={colors.secondary} />
              ) : imageSource ? (
                <Image 
                  source={imageSource} 
                  style={[
                    styles.bookImage,
                    progress === 0 && styles.uncompletedImage
                  ]} 
                  resizeMode="contain"
                  onError={() => {}}
                  fadeDuration={0}
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
            <Text style={[styles.bookTitle, styles.completedBookTitle]} numberOfLines={2}>
              {book.bookName}
            </Text>
            <Text style={[styles.bookStatus, { color: progressColor }]} numberOfLines={1}>
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
    const getPct = (code: string) => Math.round((bookProgress[code]?.percentage || 0));
    const completed = books.filter(b => getPct(b.bookCode) === 100);
    const inProgress = books.filter(b => {
      const pct = getPct(b.bookCode);
      return pct > 0 && pct < 100;
    });
    const notStarted = books.filter(b => getPct(b.bookCode) === 0);

    const completedCount = completed.length;
    const totalBooks = books.length;

    const expanded = testament === 'OT' ? showOTAll : showNTAll;
    const toggle = () => testament === 'OT' ? setShowOTAll(!showOTAll) : setShowNTAll(!showNTAll);

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { marginBottom: 0, paddingHorizontal: 0 }]}>{title}</Text>
          <TouchableOpacity onPress={toggle} activeOpacity={0.7} style={styles.moreIconOnly}>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.secondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.progressBarSection}>
          <ProgressBar 
            progress={completedCount} 
            total={totalBooks} 
            color={testament === 'OT' ? '#8D6E63' : '#607D8B'} 
          />
        </View>
        <View style={styles.booksGrid}>
          {completed.map(b => (<BookCard key={`c_${b.bookCode}`} book={b} />))}
          {inProgress.map(b => (<BookCard key={`p_${b.bookCode}`} book={b} />))}
          {expanded && notStarted.map(b => (<BookCard key={`n_${b.bookCode}`} book={b} />))}
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
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => setRefreshTrigger(prev => prev + 1)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
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

        {/* Next Achievements (First Achievements on first run) */}
        <View style={[styles.section, { marginTop: 4 }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { marginBottom: 0, paddingHorizontal: 0 }]}>Next Milestones</Text>
          </View>
          <View style={styles.achievementGrid}>
            {(isFirstRun ? [] : nextAchievements()).map((a: any, idx: number) => (
              <AchievementCard key={(a.id || 'next') + '_' + idx} achievement={a} />
            ))}
            {isFirstRun && FIRST_RUN_ACHIEVEMENTS.slice(0, 4).map((n, idx) => (
              <AchievementCard
                key={'first_' + idx}
                achievement={{
                  id: `first_${idx}`,
                  title: n.title,
                  description: n.description,
                  icon: n.icon,
                  color: colors.primary,
                  progress: 0,
                  total: 1,
                  category: 'milestones',
                  achieved: false,
                } as any}
              />
            ))}
          </View>
        </View>

        {/* Story Rewards (hide duplicates already shown above) */}
        {(() => {
          const list = achievements.filter(a => a.category === 'milestones');
          // Collapsible: first two visible, rest in drop list
          const firstTwo = list.slice(0, 2);
          const rest = list.slice(2);
          return (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { marginBottom: 0, paddingHorizontal: 0 }]}>Story Rewards</Text>
                {rest.length > 0 && (
                  <TouchableOpacity onPress={() => setShowMoreRewards(!showMoreRewards)} activeOpacity={0.7} style={styles.moreIconOnly}>
                    <Ionicons name={showMoreRewards ? 'chevron-up' : 'chevron-down'} size={20} color={colors.secondary} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.achievementGrid}>
                {firstTwo.map(a => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
                {showMoreRewards && rest.map(a => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
              </View>
            </View>
          );
        })()}

        {/* Plans & Challenges (replaces streaks) */}
        {(() => {
          const items = [
            {
              id: 'plan_first_story',
              title: 'Plan Starter',
              description: 'Complete 1 plan story',
              icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
              color: '#7B68EE',
              progress: Math.min(stats.planCompletions, 1),
              total: 1,
              category: 'plan' as any,
              achieved: stats.planCompletions >= 1
            },
            {
              id: 'plan_week',
              title: 'Plan Week',
              description: 'Read plans 7 days in a row',
              icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
              color: '#7B68EE',
              progress: Math.min(stats.planStreak, 7),
              total: 7,
              category: 'plan' as any,
              achieved: stats.planStreak >= 7
            },
            {
              id: 'plan_two_weeks',
              title: 'Plan 2 Weeks',
              description: 'Read plans 14 days in a row',
              icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
              color: '#7B68EE',
              progress: Math.min(stats.planStreak, 14),
              total: 14,
              category: 'plan' as any,
              achieved: stats.planStreak >= 14
            },
            {
              id: 'plan_month',
              title: 'Plan Month',
              description: 'Read plans 30 days in a row',
              icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
              color: '#7B68EE',
              progress: Math.min(stats.planStreak, 30),
              total: 30,
              category: 'plan' as any,
              achieved: stats.planStreak >= 30
            },
            {
              id: 'challenge_first_story',
              title: 'Challenge Starter',
              description: 'Complete 1 challenge story',
              icon: 'flag-outline' as keyof typeof Ionicons.glyphMap,
              color: '#FF8C00',
              progress: Math.min(stats.challengeCompletions, 1),
              total: 1,
              category: 'challenge' as any,
              achieved: stats.challengeCompletions >= 1
            },
            {
              id: 'challenge_week',
              title: 'Challenge Week',
              description: 'Read challenges 7 days in a row',
              icon: 'flag-outline' as keyof typeof Ionicons.glyphMap,
              color: '#FF8C00',
              progress: Math.min(stats.challengeStreak, 7),
              total: 7,
              category: 'challenge' as any,
              achieved: stats.challengeStreak >= 7
            },
            {
              id: 'challenge_two_weeks',
              title: 'Challenge 2 Weeks',
              description: 'Read challenges 14 days in a row',
              icon: 'flag-outline' as keyof typeof Ionicons.glyphMap,
              color: '#FF8C00',
              progress: Math.min(stats.challengeStreak, 14),
              total: 14,
              category: 'challenge' as any,
              achieved: stats.challengeStreak >= 14
            },
            {
              id: 'challenge_month',
              title: 'Challenge Month',
              description: 'Read challenges 30 days in a row',
              icon: 'flag-outline' as keyof typeof Ionicons.glyphMap,
              color: '#FF8C00',
              progress: Math.min(stats.challengeStreak, 30),
              total: 30,
              category: 'challenge' as any,
              achieved: stats.challengeStreak >= 30
            },
          ];
          const firstTwo = items.slice(0, 2);
          const rest = items.slice(2);
          return (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { marginBottom: 0, paddingHorizontal: 0 }]}>Plans & Challenges</Text>
                {rest.length > 0 && (
                  <TouchableOpacity onPress={() => setShowMorePlans(!showMorePlans)} activeOpacity={0.7} style={styles.moreIconOnly}>
                    <Ionicons name={showMorePlans ? 'chevron-up' : 'chevron-down'} size={20} color={colors.secondary} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.achievementGrid}>
                {firstTwo.map((a) => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
                {showMorePlans && rest.map((a) => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
              </View>
            </View>
          );
        })()}

        {/* Testament Progress removed for MVP */}

        {/* Engagement */}
        {(() => {
          const list = achievements.filter(a => a.category === 'engagement');
          const firstTwo = list.slice(0,2);
          const rest = list.slice(2);
          return (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { marginBottom: 0, paddingHorizontal: 0 }]}>Engagement</Text>
                {rest.length > 0 && (
                  <TouchableOpacity onPress={() => setShowMoreEngagement(!showMoreEngagement)} activeOpacity={0.7} style={styles.moreIconOnly}>
                    <Ionicons name={showMoreEngagement ? 'chevron-up' : 'chevron-down'} size={20} color={colors.secondary} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.achievementGrid}>
                {firstTwo.map(a => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
                {showMoreEngagement && rest.map(a => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
              </View>
            </View>
          );
        })()}

        {/* Old Testament Books */}
        {renderBooksSection('Old Testament Books', oldTestamentBooks, 'OT')}

        {/* New Testament Books */}
        {renderBooksSection('New Testament Books', newTestamentBooks, 'NT')}
        
        {/* Bottom spacing for better visual balance */}
        <View style={styles.bottomSpacing} />
    </ScrollView>
    {/* Info modal */}
    <Modal visible={!!info} transparent animationType="fade" onRequestClose={() => setInfo(null)}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{info?.title}</Text>
          <Text style={styles.modalBody}>{info?.description}</Text>
          <Pressable onPress={() => setInfo(null)} style={[styles.modalButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.modalButtonText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
    width: '100%',
  },
  contentContainer: {
    paddingBottom: 24,
    width: '100%',
  },
  welcomeSection: {
    marginTop: 20,
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
    marginBottom: 20,
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
    marginBottom: 16,
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
    marginBottom: 16,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  moreLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moreIconOnly: {
    padding: 8,
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 0,
  },
  // Minimal next-achievements cards
  nextCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    width: isLargeScreen ? '48%' : '48%',
    borderWidth: 1,
    borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
  },
  nextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  nextIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  nextDescription: {
    fontSize: 14,
    color: colors.secondary,
  },
  // Hero card styles
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroTextBlock: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroAchievementTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.secondary,
  },
  achievementCard: {
    width: 160,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginRight: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
    backgroundColor: colors.card,
    minHeight: 82,
    flexShrink: 0,
  },
  completedCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: colors.card,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
  },
  completedCentered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  completedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 1,
    borderWidth: 1,
    borderColor: '#4CAF50',
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
    alignItems: 'flex-start',
    marginBottom: 8,
    width: '100%',
  },
  achievementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    flexShrink: 0,
    position: 'relative',
  },
  completedAchievementIcon: {
    backgroundColor: '#4CAF5015',
    borderColor: '#4CAF50',
    borderWidth: 2,
    borderRadius: 16,
  },
  achievementInfo: {
    justifyContent: 'space-between',
    flex: 1,
    minWidth: 0,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  achievementProgress: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '500',
    lineHeight: 16,
  },
  progressBarContainer: {
    marginTop: 'auto',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.1)',
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
    gap: 16,
  },
  
  // Enhanced Book Card Styles
  bookCard: {
    width: '47%',
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
    backgroundColor: colors.card,
    minHeight: 82,
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
    marginBottom: 8,
  },
  bookImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '80%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalBody: {
    fontSize: 14,
    color: colors.secondary,
  },
  modalButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 32,
  },
});

export default Achievements;