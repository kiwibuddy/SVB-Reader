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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '@/context/GlobalContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { getCurrentStreak, getEmojis } from '@/api/sqlite';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import { imageMap } from '@/components/navigation/NavBook';

// Types
interface AchievementStats {
  totalStories: number;
  completedStories: number;
  completionPercentage: number;
  currentStreak: number;
  bestStreak: number;
  oldTestament: { completed: number; total: number };
  newTestament: { completed: number; total: number };
  emojiCount: { total: number; heart: number; prayer: number; question: number; thumbsUp: number };
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  progress: number;
  total: number;
  category: 'milestones' | 'streaks' | 'testament' | 'engagement';
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
  const [stats, setStats] = useState<AchievementStats>({
    totalStories: 0,
    completedStories: 0,
    completionPercentage: 0,
    currentStreak: 0,
    bestStreak: 0,
    oldTestament: { completed: 0, total: 219 },
    newTestament: { completed: 0, total: 146 },
    emojiCount: { total: 0, heart: 0, prayer: 0, question: 0, thumbsUp: 0 }
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

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Calculate completion statistics
        const totalSegments = Object.keys(SegmentTitles).length;
        const completedCount = Object.values(completedSegments).filter(
          segment => segment.isCompleted
        ).length;
        const completionPercentage = Math.round((completedCount / totalSegments) * 100);

        // Get current streak
        const currentStreak = await getCurrentStreak();

        // Calculate Old Testament vs New Testament completion
        const oldTestamentBookCodes = oldTestamentBooks.map(book => book.bookCode);
        const newTestamentBookCodes = newTestamentBooks.map(book => book.bookCode);

        let otCompleted = 0;
        let ntCompleted = 0;

        Object.entries(SegmentTitles).forEach(([segmentId, segment]) => {
          if (completedSegments[segmentId]?.isCompleted) {
            const bookCode = segment.book[0];
            if (oldTestamentBookCodes.includes(bookCode)) {
              otCompleted++;
            } else if (newTestamentBookCodes.includes(bookCode)) {
              ntCompleted++;
            }
          }
        });

        // Get emoji statistics
        const emojiData = await getEmojis();
        const emojiStats = {
          total: emojiData.length,
          heart: emojiData.filter(e => e.emoji === '❤️').length,
          prayer: emojiData.filter(e => e.emoji === '🙏').length,
          question: emojiData.filter(e => e.emoji === '🤔').length,
          thumbsUp: emojiData.filter(e => e.emoji === '👍').length
        };

        setStats({
          totalStories: totalSegments,
          completedStories: completedCount,
          completionPercentage,
          currentStreak,
          bestStreak: Math.max(currentStreak, 15), // Placeholder for best streak
          oldTestament: { completed: otCompleted, total: 219 },
          newTestament: { completed: ntCompleted, total: 146 },
          emojiCount: emojiStats
        });
      } catch (error) {
        console.error('Error loading achievement stats:', error);
      }
    };

    loadStats();
  }, [completedSegments]);

  // Check if a book is completed based on segments (excluding intro segments)
  const isBookCompleted = (bookCode: string): boolean => {
    const bookSegments = Object.entries(SegmentTitles).filter(
      ([segmentId, segment]) => segment.book[0] === bookCode && !segmentId.startsWith('I')
    );
    return bookSegments.length > 0 && bookSegments.every(
      ([segmentId, _]) => completedSegments[segmentId]?.isCompleted
    );
  };

  // Achievement definitions
  const achievements: Achievement[] = [
    // Reading Milestones
    {
      id: 'first_steps',
      title: 'First Steps',
      description: 'Read your first Bible story',
      icon: 'book-outline',
      color: '#4CAF50',
      progress: Math.min(stats.completedStories, 1),
      total: 1,
      category: 'milestones'
    },
    {
      id: 'bible_explorer',
      title: 'Bible Explorer',
      description: 'Read 10 Bible stories',
      icon: 'compass-outline',
      color: '#2196F3',
      progress: Math.min(stats.completedStories, 10),
      total: 10,
      category: 'milestones'
    },
    {
      id: 'scripture_enthusiast',
      title: 'Scripture Enthusiast',
      description: 'Read 25 Bible stories',
      icon: 'library-outline',
      color: '#9C27B0',
      progress: Math.min(stats.completedStories, 25),
      total: 25,
      category: 'milestones'
    },
    {
      id: 'bible_scholar',
      title: 'Bible Scholar',
      description: 'Read 50 Bible stories',
      icon: 'school-outline',
      color: '#FF9800',
      progress: Math.min(stats.completedStories, 50),
      total: 50,
      category: 'milestones'
    },
    {
      id: 'word_warrior',
      title: 'Word Warrior',
      description: 'Read 100 Bible stories',
      icon: 'shield-outline',
      color: '#F44336',
      progress: Math.min(stats.completedStories, 100),
      total: 100,
      category: 'milestones'
    },
    {
      id: 'complete_collection',
      title: 'Complete Collection',
      description: 'Read all 365 Bible stories',
      icon: 'trophy-outline',
      color: '#FFD700',
      progress: Math.min(stats.completedStories, 365),
      total: 365,
      category: 'milestones'
    },
    // Reading Streaks
    {
      id: 'consistent_reader',
      title: 'Consistent Reader',
      description: 'Maintain a 7-day reading streak',
      icon: 'flame-outline',
      color: '#FF5722',
      progress: Math.min(stats.currentStreak, 7),
      total: 7,
      category: 'streaks'
    },
    {
      id: 'scripture_habit',
      title: 'Scripture Habit',
      description: 'Maintain a 30-day reading streak',
      icon: 'flame-outline',
      color: '#FF5722',
      progress: Math.min(stats.currentStreak, 30),
      total: 30,
      category: 'streaks'
    },
    {
      id: 'faithful_follower',
      title: 'Faithful Follower',
      description: 'Maintain a 100-day reading streak',
      icon: 'flame-outline',
      color: '#FF5722',
      progress: Math.min(stats.currentStreak, 100),
      total: 100,
      category: 'streaks'
    },
    // Testament Progress
    {
      id: 'old_testament',
      title: 'Old Testament',
      description: 'Complete the Old Testament',
      icon: 'bookmark-outline',
      color: '#8D6E63',
      progress: stats.oldTestament.completed,
      total: stats.oldTestament.total,
      category: 'testament'
    },
    {
      id: 'new_testament',
      title: 'New Testament',
      description: 'Complete the New Testament',
      icon: 'bookmark-outline',
      color: '#607D8B',
      progress: stats.newTestament.completed,
      total: stats.newTestament.total,
      category: 'testament'
    },
    // Engagement
    {
      id: 'first_reaction',
      title: 'First Reaction',
      description: 'Add your first emoji reaction',
      icon: 'happy-outline',
      color: '#FFC107',
      progress: Math.min(stats.emojiCount.total, 1),
      total: 1,
      category: 'engagement'
    },
    {
      id: 'heart_collector',
      title: 'Heart Collector',
      description: 'Use the ❤️ emoji 10 times',
      icon: 'heart-outline',
      color: '#E91E63',
      progress: Math.min(stats.emojiCount.heart, 10),
      total: 10,
      category: 'engagement'
    },
    {
      id: 'prayer_warrior',
      title: 'Prayer Warrior',
      description: 'Use the 🙏 emoji 10 times',
      icon: 'hand-right-outline',
      color: '#9C27B0',
      progress: Math.min(stats.emojiCount.prayer, 10),
      total: 10,
      category: 'engagement'
    },
    {
      id: 'encourager',
      title: 'Encourager',
      description: 'Use the 👍 emoji 10 times',
      icon: 'thumbs-up-outline',
      color: '#4CAF50',
      progress: Math.min(stats.emojiCount.thumbsUp, 10),
      total: 10,
      category: 'engagement'
    },
    {
      id: 'deep_thinker',
      title: 'Deep Thinker',
      description: 'Use the 🤔 emoji 10 times',
      icon: 'bulb-outline',
      color: '#607D8B',
      progress: Math.min(stats.emojiCount.question, 10),
      total: 10,
      category: 'engagement'
    },
    {
      id: 'emoji_enthusiast',
      title: 'Emoji Enthusiast',
      description: 'Use 50 emoji reactions',
      icon: 'chatbubble-outline',
      color: '#FF9800',
      progress: Math.min(stats.emojiCount.total, 50),
      total: 50,
      category: 'engagement'
    },
    {
      id: 'emoji_master',
      title: 'Emoji Master',
      description: 'Use 100 emoji reactions',
      icon: 'chatbubble-ellipses-outline',
      color: '#9C27B0',
      progress: Math.min(stats.emojiCount.total, 100),
      total: 100,
      category: 'engagement'
    },
    {
      id: 'emoji_champion',
      title: 'Emoji Champion',
      description: 'Use 200 emoji reactions',
      icon: 'medal-outline',
      color: '#E91E63',
      progress: Math.min(stats.emojiCount.total, 200),
      total: 200,
      category: 'engagement'
    }
  ];

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
    const isCompleted = achievement.progress >= achievement.total;
    
    return (
      <View style={[styles.achievementCard, isCompleted && styles.completedCard]}>
        <View style={styles.achievementHeader}>
          <View style={[styles.achievementIcon, { backgroundColor: achievement.color + '20' }]}>
            <Ionicons 
              name={achievement.icon} 
              size={24} 
              color={achievement.color} 
            />
          </View>
          <View style={styles.achievementInfo}>
            <Text style={styles.achievementTitle}>
              {achievement.title}
            </Text>
            <Text style={styles.achievementProgress}>
              {achievement.progress} of {achievement.total}
            </Text>
          </View>
        </View>
        <Text style={styles.achievementDescription}>{achievement.description}</Text>
        <ProgressBar 
          progress={achievement.progress} 
          total={achievement.total} 
          color={achievement.color} 
        />
      </View>
    );
  };

    const BookIcon = ({ book }: { book: BookCompletion }) => {
    const isCompleted = isBookCompleted(book.bookCode);
    const imageSource = imageMap[book.bookCode];
    
    return (
      <View style={styles.bookIconContainer}>
        <View style={[styles.bookIconWrapper, isCompleted && styles.completedBookIcon]}>
          {imageSource ? (
            <Image 
              source={imageSource} 
              style={[styles.bookIcon, !isCompleted && styles.uncompletedBookIcon]} 
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.bookIcon, styles.fallbackIcon, !isCompleted && styles.uncompletedBookIcon]}>
              <Text style={[styles.fallbackIconText, !isCompleted && styles.uncompletedBookText]}>{book.bookCode}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.bookName, !isCompleted && styles.uncompletedBookName]}>{book.bookName}</Text>
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

  const renderBooksSection = (title: string, books: BookCompletion[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.booksGrid}>
        {books.map((book) => (
          <BookIcon key={book.bookCode} book={book} />
        ))}
            </View>
          </View>
  );

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

        {/* Engagement */}
        {renderSection(
          'Engagement',
          achievements.filter(a => a.category === 'engagement')
        )}

        {/* Old Testament Books */}
        {renderBooksSection('Old Testament Books', oldTestamentBooks)}

        {/* New Testament Books */}
        {renderBooksSection('New Testament Books', newTestamentBooks)}
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
    gap: 16,
  },
  bookIconContainer: {
    width: '47%',
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  bookIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: colors.card,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  completedBookIcon: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
  },
  bookIcon: {
    width: 32,
    height: 32,
  },
  uncompletedBookIcon: {
    opacity: 0.3,
  },
  fallbackIcon: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackIconText: {
    color: colors.background,
    fontSize: 8,
    fontWeight: '600',
  },
  uncompletedBookText: {
    opacity: 0.3,
  },
  bookName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  uncompletedBookName: {
    color: colors.secondary,
    opacity: 0.5,
  },
});

export default Achievements;