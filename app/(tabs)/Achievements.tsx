import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useAppContext } from '@/context/GlobalContext';
import { getCompletedSegmentsCount, getCurrentStreak, getBestStreak, getEmojiStats, getSourceStats, getOldTestamentProgress, getNewTestamentProgress, getLongestSession, getCompletedBooks, checkEmojiCollection, getTotalSegmentsCount, getReadingStreak } from '@/api/sqlite';
import DonutChart from '@/components/DonutChart';
import ProgressDonut from '@/components/ProgressDonut';
import NavBook from '@/components/navigation/NavBook';
import { imageMap } from '@/components/navigation/NavBook';

// Update the AchievementStats interface to include all properties used in the component
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
  plans?: { completed: number; total: number };
  challenges?: { completed: number; total: number };
  longestSession?: number;
  booksCompleted?: string[];
  emojiCollection?: { complete: boolean };
  firstStoryDate?: string;
}

// Add these interfaces for component props
interface AchievementBadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string | number;
  color: string;
  max?: number | null;
}

// Update the TrophyProps interface
interface TrophyProps {
  id: string;
  title: string;
  description: string;
  icon: string; // Change from keyof typeof Ionicons.glyphMap to string
  achieved: boolean;
}

// Add a new interface for trophies with achievement date
interface Trophy {
  id: string;
  title: string;
  description: string;
  icon: string; // Change from keyof typeof Ionicons.glyphMap to string
  achieved: boolean;
  achievedDate?: string; // Date when trophy was achieved
}

// First, create a ProgressBar component at the top of the file
const ProgressBar = ({ progress, total, color }: { progress: number; total: number; color: string }) => {
  const percentage = total > 0 ? (progress / total) * 100 : 0;
  return (
    <View style={styles.progressBarOuter}>
      <View 
        style={[
          styles.progressBarInner, 
          { width: `${percentage}%`, backgroundColor: color }
        ]} 
      />
    </View>
  );
};

// Add this component after your existing components
const TrophyGrid = ({ trophies, colors }: { trophies: Trophy[], colors: any }) => {
  // Split trophies into completed and locked
  const completedTrophies = trophies.filter(t => t.achieved);
  const lockedTrophies = trophies.filter(t => !t.achieved);
  
  // Helper function to render the trophy icon
  const renderTrophyIcon = (trophy: Trophy, isAchieved: boolean) => {
    // Check if it's a book trophy and has an image
    if (trophy.id.startsWith('book_')) {
      const bookCode = trophy.id.replace('book_', '').substring(0, 3);
      const bookCodeUpper = bookCode.charAt(0).toUpperCase() + bookCode.slice(1);
      const imageSource = imageMap[bookCodeUpper];
      
      if (imageSource) {
        return (
          <Image 
            source={imageSource}
            style={[
              { width: 28, height: 28 },
              isAchieved ? styles.achievedIcon : styles.lockedIcon
            ]} 
            resizeMode="contain"
          />
        );
      }
    }
    
    // Default to Ionicons for non-book trophies or if image not found
    return (
      <Ionicons 
        name={trophy.icon as any} 
        size={28} 
        color={isAchieved ? colors.primary : colors.border} 
        style={isAchieved ? styles.achievedIcon : styles.lockedIcon}
      />
    );
  };
  
  // Group remaining trophies by category
  const categories = {
    "Reading Progress": lockedTrophies.filter(t => 
      t.id.includes('story') || 
      t.id.includes('bible') || 
      t.id.includes('collection') || 
      t.id === 'ot_master' || 
      t.id === 'nt_master'
    ),
    "Streaks": lockedTrophies.filter(t => t.id.includes('streak')),
    "Old Testament Books": lockedTrophies.filter(t => t.id.startsWith('book_') && 
      !['mat', 'mrk', 'luk', 'jhn', 'act', 'rom', 'co', 'gal', 'eph', 'php', 'col', 'th', 'ti', 'tit', 'phm', 'heb', 'jas', 'pe', 'jn', 'jud', 'rev']
        .some(code => t.id.includes(code))
    ),
    "New Testament Books": lockedTrophies.filter(t => t.id.startsWith('book_') && 
      ['mat', 'mrk', 'luk', 'jhn', 'act', 'rom', 'co', 'gal', 'eph', 'php', 'col', 'th', 'ti', 'tit', 'phm', 'heb', 'jas', 'pe', 'jn', 'jud', 'rev']
        .some(code => t.id.includes(code))
    ),
    "Emoji Reactions": lockedTrophies.filter(t => 
      t.id.includes('emoji') || 
      t.id.includes('reaction') || 
      t.id.includes('heart') || 
      t.id.includes('prayer') ||
      t.id.includes('thinker') ||
      t.id.includes('encourager')
    )
  };

  return (
    <>
      {/* Completed Trophies Section */}
      {completedTrophies.length > 0 && (
        <View style={styles.trophyCategory}>
          <Text style={[styles.trophyCategoryTitle, { color: colors.text }]}>Completed Achievements</Text>
          <View style={styles.trophyGrid}>
            {completedTrophies.map(trophy => (
              <TouchableOpacity 
                key={trophy.id} 
                style={[
                  styles.trophyGridItem, 
                  { 
                    backgroundColor: colors.card,
                    borderColor: colors.primary + '40'
                  }
                ]}
              >
                <View style={[
                  styles.trophyIconContainer, 
                  { 
                    backgroundColor: colors.primary + '20',
                    borderColor: colors.primary
                  }
                ]}>
                  {renderTrophyIcon(trophy, true)}
                </View>
                <Text 
                  style={[
                    styles.trophyGridTitle, 
                    { 
                      color: colors.text,
                      fontWeight: '600'
                    }
                  ]}
                  numberOfLines={2}
                >
                  {trophy.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Remaining Categories */}
      {Object.entries(categories).map(([category, categoryTrophies]) => (
        categoryTrophies.length > 0 ? (
          <View key={category} style={styles.trophyCategory}>
            <Text style={[styles.trophyCategoryTitle, { color: colors.text }]}>{category}</Text>
            <View style={styles.trophyGrid}>
              {categoryTrophies.map(trophy => (
                <TouchableOpacity 
                  key={trophy.id} 
                  style={[
                    styles.trophyGridItem, 
                    { 
                      backgroundColor: colors.card,
                      borderColor: colors.border + '30'
                    }
                  ]}
                >
                  <View style={[
                    styles.trophyIconContainer, 
                    { 
                      backgroundColor: colors.border + '10',
                      borderColor: 'transparent'
                    }
                  ]}>
                    {renderTrophyIcon(trophy, false)}
                    <Ionicons 
                      name="lock-closed" 
                      size={12} 
                      color={colors.border}
                      style={styles.lockIcon} 
                    />
                  </View>
                  <Text 
                    style={[
                      styles.trophyGridTitle, 
                      { 
                        color: colors.secondary,
                        fontWeight: '400'
                      }
                    ]}
                    numberOfLines={2}
                  >
                    {trophy.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null
      ))}
    </>
  );
};

function Achievements() {
  const { colors } = useAppSettings();
  const { completedSegments } = useAppContext();
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Update the initial state to match the interface
  const [stats, setStats] = useState<AchievementStats>({
    totalStories: 0,
    completedStories: 0,
    completionPercentage: 0,
    currentStreak: 0,
    bestStreak: 0,
    oldTestament: { completed: 0, total: 219 },
    newTestament: { completed: 0, total: 146 },
    emojiCount: { total: 0, heart: 0, prayer: 0, question: 0, thumbsUp: 0 },
    sourceReading: { red: 0, green: 0, blue: 0, black: 0 }
  });
  
  // Load achievement data
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const completed = await getCompletedSegmentsCount();
        const total = await getTotalSegmentsCount();
        const streakData = await getReadingStreak();
        const emojiData = await getEmojiStats();
        const sourceData = await getSourceStats();
        const otProgress = await getOldTestamentProgress();
        const ntProgress = await getNewTestamentProgress();
        const booksCompleted = await getCompletedBooks();
        const emojiCollection = await checkEmojiCollection();
        
        setStats({
          totalStories: total,
          completedStories: completed,
          completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          currentStreak: streakData.currentStreak,
          bestStreak: streakData.longestStreak,
          oldTestament: otProgress,
          newTestament: ntProgress,
          emojiCount: emojiData,
          sourceReading: sourceData,
          booksCompleted,
          emojiCollection
        });
      } catch (error) {
        console.error('Error loading achievement stats:', error);
        setError('Failed to load achievements');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStats();
  }, [completedSegments]);

  // Update the trophies array with proper null checks for booksCompleted
  const trophies = useMemo(() => {
    // Create arrays for all Bible books
    const oldTestamentBooks = [
      { id: 'book_gen', code: 'Gen', title: 'Genesis' },
      { id: 'book_exo', code: 'Exo', title: 'Exodus' },
      { id: 'book_lev', code: 'Lev', title: 'Leviticus' },
      { id: 'book_num', code: 'Num', title: 'Numbers' },
      { id: 'book_deu', code: 'Deu', title: 'Deuteronomy' },
      { id: 'book_jos', code: 'Jos', title: 'Joshua' },
      { id: 'book_jdg', code: 'Jdg', title: 'Judges' },
      { id: 'book_rut', code: 'Rut', title: 'Ruth' },
      { id: 'book_1sa', code: '1Sa', title: '1 Samuel' },
      { id: 'book_2sa', code: '2Sa', title: '2 Samuel' },
      { id: 'book_1ki', code: '1Ki', title: '1 Kings' },
      { id: 'book_2ki', code: '2Ki', title: '2 Kings' },
      { id: 'book_1ch', code: '1Ch', title: '1 Chronicles' },
      { id: 'book_2ch', code: '2Ch', title: '2 Chronicles' },
      { id: 'book_ezr', code: 'Ezr', title: 'Ezra' },
      { id: 'book_neh', code: 'Neh', title: 'Nehemiah' },
      { id: 'book_est', code: 'Est', title: 'Esther' },
      { id: 'book_job', code: 'Job', title: 'Job' },
      { id: 'book_psa', code: 'Psa', title: 'Psalms' },
      { id: 'book_pro', code: 'Pro', title: 'Proverbs' },
      { id: 'book_ecc', code: 'Ecc', title: 'Ecclesiastes' },
      { id: 'book_sng', code: 'Sng', title: 'Song of Solomon' },
      { id: 'book_isa', code: 'Isa', title: 'Isaiah' },
      { id: 'book_jer', code: 'Jer', title: 'Jeremiah' },
      { id: 'book_lam', code: 'Lam', title: 'Lamentations' },
      { id: 'book_ezk', code: 'Ezk', title: 'Ezekiel' },
      { id: 'book_dan', code: 'Dan', title: 'Daniel' },
      { id: 'book_hos', code: 'Hos', title: 'Hosea' },
      { id: 'book_jol', code: 'Jol', title: 'Joel' },
      { id: 'book_amo', code: 'Amo', title: 'Amos' },
      { id: 'book_oba', code: 'Oba', title: 'Obadiah' },
      { id: 'book_jon', code: 'Jon', title: 'Jonah' },
      { id: 'book_mic', code: 'Mic', title: 'Micah' },
      { id: 'book_nam', code: 'Nam', title: 'Nahum' },
      { id: 'book_hab', code: 'Hab', title: 'Habakkuk' },
      { id: 'book_zep', code: 'Zep', title: 'Zephaniah' },
      { id: 'book_hag', code: 'Hag', title: 'Haggai' },
      { id: 'book_zec', code: 'Zec', title: 'Zechariah' },
      { id: 'book_mal', code: 'Mal', title: 'Malachi' }
    ];

    const newTestamentBooks = [
      { id: 'book_mat', code: 'Mat', title: 'Matthew' },
      { id: 'book_mrk', code: 'Mrk', title: 'Mark' },
      { id: 'book_luk', code: 'Luk', title: 'Luke' },
      { id: 'book_jhn', code: 'Jhn', title: 'John' },
      { id: 'book_act', code: 'Act', title: 'Acts' },
      { id: 'book_rom', code: 'Rom', title: 'Romans' },
      { id: 'book_1co', code: '1Co', title: '1 Corinthians' },
      { id: 'book_2co', code: '2Co', title: '2 Corinthians' },
      { id: 'book_gal', code: 'Gal', title: 'Galatians' },
      { id: 'book_eph', code: 'Eph', title: 'Ephesians' },
      { id: 'book_php', code: 'Php', title: 'Philippians' },
      { id: 'book_col', code: 'Col', title: 'Colossians' },
      { id: 'book_1th', code: '1Th', title: '1 Thessalonians' },
      { id: 'book_2th', code: '2Th', title: '2 Thessalonians' },
      { id: 'book_1ti', code: '1Ti', title: '1 Timothy' },
      { id: 'book_2ti', code: '2Ti', title: '2 Timothy' },
      { id: 'book_tit', code: 'Tit', title: 'Titus' },
      { id: 'book_phm', code: 'Phm', title: 'Philemon' },
      { id: 'book_heb', code: 'Heb', title: 'Hebrews' },
      { id: 'book_jas', code: 'Jas', title: 'James' },
      { id: 'book_1pe', code: '1Pe', title: '1 Peter' },
      { id: 'book_2pe', code: '2Pe', title: '2 Peter' },
      { id: 'book_1jn', code: '1Jn', title: '1 John' },
      { id: 'book_2jn', code: '2Jn', title: '2 John' },
      { id: 'book_3jn', code: '3Jn', title: '3 John' },
      { id: 'book_jud', code: 'Jud', title: 'Jude' },
      { id: 'book_rev', code: 'Rev', title: 'Revelation' }
    ];

    // Create the base trophies array
    const baseTrophies: Trophy[] = [
      // Reading Progress Trophies
      {
        id: 'first_story',
        title: "First Story",
        description: "Read your first Bible story",
        icon: "book-outline",
        achieved: stats.completedStories > 0
      },
      {
        id: 'bible_explorer',
        title: "Bible Explorer",
        description: "Read 10 Bible stories",
        icon: "compass-outline",
        achieved: stats.completedStories >= 10
      },
      {
        id: 'scripture_enthusiast',
        title: "Scripture Enthusiast",
        description: "Read 25 Bible stories",
        icon: "library-outline",
        achieved: stats.completedStories >= 25
      },
      {
        id: 'bible_scholar',
        title: "Bible Scholar",
        description: "Read 50 Bible stories",
        icon: "school-outline",
        achieved: stats.completedStories >= 50
      },
      {
        id: 'word_warrior',
        title: "Word Warrior",
        description: "Read 100 Bible stories",
        icon: "shield-outline",
        achieved: stats.completedStories >= 100
      },
      {
        id: 'bible_master',
        title: "Bible Master",
        description: "Read 200 Bible stories",
        icon: "ribbon-outline",
        achieved: stats.completedStories >= 200
      },
      {
        id: 'complete_collection',
        title: "Complete Collection",
        description: "Read all 365 Bible stories",
        icon: "trophy-outline",
        achieved: stats.completedStories >= 365
      },
      {
        id: 'ot_master',
        title: "Old Testament Master",
        description: "Complete the Old Testament",
        icon: "bookmarks-outline",
        achieved: stats.oldTestament.completed >= stats.oldTestament.total
      },
      {
        id: 'nt_master',
        title: "New Testament Master",
        description: "Complete the New Testament",
        icon: "bookmarks-outline",
        achieved: stats.newTestament.completed >= stats.newTestament.total
      },
      
      // Streak Trophies
      {
        id: 'streak_3',
        title: "Getting Started",
        description: "Maintain a 3-day reading streak",
        icon: "flame-outline",
        achieved: stats.currentStreak >= 3
      },
      {
        id: 'streak_7',
        title: "Consistent Reader",
        description: "Maintain a 7-day reading streak",
        icon: "flame-outline",
        achieved: stats.currentStreak >= 7
      },
      {
        id: 'streak_14',
        title: "Dedicated Disciple",
        description: "Maintain a 14-day reading streak",
        icon: "flame-outline",
        achieved: stats.currentStreak >= 14
      },
      {
        id: 'streak_30',
        title: "Scripture Habit",
        description: "Maintain a 30-day reading streak",
        icon: "flame-outline",
        achieved: stats.currentStreak >= 30
      },
      {
        id: 'streak_60',
        title: "Bible Devotee",
        description: "Maintain a 60-day reading streak",
        icon: "flame-outline",
        achieved: stats.currentStreak >= 60
      },
      {
        id: 'streak_100',
        title: "Faithful Follower",
        description: "Maintain a 100-day reading streak",
        icon: "flame-outline",
        achieved: stats.currentStreak >= 100
      },
      {
        id: 'streak_365',
        title: "Scripture Champion",
        description: "Maintain a 365-day reading streak",
        icon: "flame-outline",
        achieved: stats.currentStreak >= 365
      },
      
      // Emoji Reaction Trophies
      {
        id: 'first_reaction',
        title: "First Reaction",
        description: "Add your first emoji reaction",
        icon: "happy-outline",
        achieved: stats.emojiCount.total > 0
      },
      {
        id: 'heart_collector',
        title: "Heart Collector",
        description: "Use the ❤️ emoji 10 times",
        icon: "heart-outline",
        achieved: stats.emojiCount.heart >= 10
      },
      {
        id: 'prayer_warrior',
        title: "Prayer Warrior",
        description: "Use the 🙏 emoji 10 times",
        icon: "hand-left-outline",
        achieved: stats.emojiCount.prayer >= 10
      },
      {
        id: 'deep_thinker',
        title: "Deep Thinker",
        description: "Use the 🤔 emoji 10 times",
        icon: "help-circle-outline",
        achieved: stats.emojiCount.question >= 10
      },
      {
        id: 'encourager',
        title: "Encourager",
        description: "Use the 👍 emoji 10 times",
        icon: "thumbs-up-outline",
        achieved: stats.emojiCount.thumbsUp >= 10
      },
      {
        id: 'emoji_master',
        title: "Emoji Master",
        description: "Use all emoji types at least 5 times each",
        icon: "apps-outline",
        achieved: stats.emojiCollection?.complete || false
      }
    ];

    // Only add book trophies if we have book completion data
    if (stats.booksCompleted && Array.isArray(stats.booksCompleted)) {
      // Add Old Testament book trophies
      const otBookTrophies = oldTestamentBooks.map(book => ({
        id: book.id,
        title: book.title,
        description: `Complete all stories in ${book.title}`,
        icon: "book-outline",
        achieved: stats.booksCompleted?.includes(book.code) || false
      }));
      
      // Add New Testament book trophies
      const ntBookTrophies = newTestamentBooks.map(book => ({
        id: book.id,
        title: book.title,
        description: `Complete all stories in ${book.title}`,
        icon: "book-outline",
        achieved: stats.booksCompleted?.includes(book.code) || false
      }));
      
      // Return combined trophies
      return [...baseTrophies, ...otBookTrophies, ...ntBookTrophies];
    }
    
    // Return just the base trophies if no book data
    return baseTrophies;
  }, [stats]);

  // Fix the sort function that uses achievedDate
  const sortedTrophies = useMemo(() => {
    return [...trophies].sort((a, b) => {
      if (a.achieved && !b.achieved) return -1;
      if (!a.achieved && b.achieved) return 1;
      return 0;
    });
  }, [trophies]);

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

  // Add the Trophy component implementation with a type assertion
  const Trophy = ({ id, title, description, icon, achieved }: TrophyProps) => {
    const { colors } = useAppSettings();
    return (
      <View 
        style={[
          styles.trophyItem, 
          { 
            backgroundColor: colors.card,
            borderColor: achieved ? colors.primary + '30' : colors.border
          }
        ]}
      >
        <View style={[styles.trophyIcon, { backgroundColor: achieved ? colors.primary + '30' : colors.border + '20' }]}>
          <Ionicons 
            name={icon as any} // Add type assertion here
            size={24} 
            color={achieved ? colors.primary : colors.border} 
          />
        </View>
        <View style={styles.trophyContent}>
          <Text style={[styles.trophyTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.trophyDesc, { color: colors.secondary }]}>{description}</Text>
        </View>
        {achieved && (
          <View style={styles.achievedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Section */}
        <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="trophy-outline" size={28} color="#FF6B00" style={styles.titleIcon} />
          <Text style={[styles.title, { color: colors.text }]}>Achievements</Text>
        </View>
        </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Reading Progress Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Reading Progress</Text>
        <View style={[styles.achievementItem, { backgroundColor: colors.card }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#FF6B0020' }]}>
            <Ionicons name="book-outline" size={24} color="#FF6B00" />
          </View>
          <View style={styles.achievementContent}>
            <Text style={[styles.achievementTitle, { color: colors.text }]}>Total Stories Read</Text>
            <View style={styles.largeProgressBarOuter}>
              <View 
                style={[
                  styles.largeProgressBarInner, 
                  { width: `${(stats.completedStories / stats.totalStories) * 100}%`, backgroundColor: '#FF6B00' }
                ]} 
              />
            </View>
            <Text style={[styles.achievementValue, { color: '#FF6B00' }]}>
              {stats.completedStories} of {stats.totalStories} stories
            </Text>
          </View>
        </View>

        {/* Testament Progress */}
        <View style={styles.testamentContainer}>
          <View style={[styles.achievementItem, { backgroundColor: colors.card }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#8B5CF620' }]}>
              <Ionicons name="book-outline" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.achievementContent}>
              <Text style={[styles.achievementTitle, { color: colors.text }]}>Old Testament</Text>
              <ProgressBar progress={stats.oldTestament.completed} total={stats.oldTestament.total} color="#8B5CF6" />
              <Text style={[styles.progressText, { color: colors.secondary }]}>
                {stats.oldTestament.completed} of {stats.oldTestament.total}
              </Text>
            </View>
          </View>

          <View style={[styles.achievementItem, { backgroundColor: colors.card }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#3B82F620' }]}>
              <Ionicons name="book-outline" size={24} color="#3B82F6" />
            </View>
            <View style={styles.achievementContent}>
              <Text style={[styles.achievementTitle, { color: colors.text }]}>New Testament</Text>
              <ProgressBar progress={stats.newTestament.completed} total={stats.newTestament.total} color="#3B82F6" />
              <Text style={[styles.progressText, { color: colors.secondary }]}>
                {stats.newTestament.completed} of {stats.newTestament.total}
              </Text>
            </View>
          </View>
        </View>

        {/* Streaks Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Streaks</Text>
          
        <View style={[styles.achievementItem, { backgroundColor: colors.card }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#FF6B0020' }]}>
            <Ionicons name="flame-outline" size={24} color="#FF6B00" />
          </View>
          <View style={styles.achievementContent}>
            <Text style={[styles.achievementTitle, { color: colors.text }]}>Current Streak</Text>
            <Text style={[styles.achievementValue, { color: '#FF6B00' }]}>
              {stats.currentStreak} days
            </Text>
          </View>
        </View>

        <View style={[styles.achievementItem, { backgroundColor: colors.card }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="trending-up-outline" size={24} color="#F59E0B" />
          </View>
          <View style={styles.achievementContent}>
            <Text style={[styles.achievementTitle, { color: colors.text }]}>Best Streak</Text>
            <Text style={[styles.achievementValue, { color: '#F59E0B' }]}>
              {stats.bestStreak} days
            </Text>
          </View>
        </View>

        <View style={[styles.achievementItem, { backgroundColor: colors.card }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#6366F120' }]}>
            <Ionicons name="time-outline" size={24} color="#6366F1" />
          </View>
          <View style={styles.achievementContent}>
            <Text style={[styles.achievementTitle, { color: colors.text }]}>Longest Session</Text>
            <Text style={[styles.achievementValue, { color: '#6366F1' }]}>
              {stats.longestSession || 0} segments
            </Text>
          </View>
        </View>

        {/* Trophies Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Trophies</Text>
        <TrophyGrid trophies={sortedTrophies} colors={colors} />
        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  testamentContainer: {
    marginTop: 4,
  },
  streaksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  streakItem: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  streakLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressTextContainer: {
    marginLeft: 16,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 14,
  },
  progressBarOuter: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginVertical: 6,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    marginTop: 4,
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
    padding: 12,
    marginBottom: 8,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  },
  largeProgressBarOuter: {
    height: 12, // Larger than regular progress bars
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginVertical: 8,
    overflow: 'hidden',
  },
  largeProgressBarInner: {
    height: '100%',
    borderRadius: 6,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  trophyCategory: {
    marginBottom: 24,
  },
  trophyCategoryTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  trophyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trophyGridItem: {
    width: '31%',
    aspectRatio: 0.8,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  trophyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    position: 'relative',
  },
  trophyGridTitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  achievedIcon: {
    opacity: 1,
  },
  lockedIcon: {
    opacity: 0.5,
  },
  lockIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    padding: 2,
  },
});

export default Achievements;
