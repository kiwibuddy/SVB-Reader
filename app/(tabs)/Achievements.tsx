import React, { useEffect, useState, useMemo } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  Platform,
  SafeAreaView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAppSettings } from "@/context/AppSettingsContext"
import { useAppContext } from "@/context/GlobalContext"
import {
  getCompletedSegmentsCount,
  getEmojiStats,
  getSourceStats,
  getOldTestamentProgress,
  getNewTestamentProgress,
  getCompletedBooks,
  checkEmojiCollection,
  getTotalSegmentsCount,
  getReadingStreak,
} from "@/api/sqlite"
import { imageMap } from "@/components/navigation/NavBook"
import { LinearGradient } from "expo-linear-gradient"
import { createAppStyles } from "@/utils/styleHelpers"
import * as Haptics from 'expo-haptics'

// Create a mapping from trophy book IDs to imageMap keys for better performance
const BOOK_ID_TO_IMAGE_MAP: { [key: string]: string } = {
  "book_gen": "Gen", "book_exo": "Exo", "book_lev": "Lev", "book_num": "Num", "book_deu": "Deu",
  "book_jos": "Jos", "book_jdg": "Jdg", "book_rut": "Rut", "book_1sa": "1Sa", "book_2sa": "2Sa",
  "book_1ki": "1Ki", "book_2ki": "2Ki", "book_1ch": "1Ch", "book_2ch": "2Ch", "book_ezr": "Ezr",
  "book_neh": "Neh", "book_est": "Est", "book_job": "Job", "book_psa": "Psa", "book_pro": "Pro",
  "book_ecc": "Ecc", "book_sos": "SoS", "book_isa": "Isa", "book_jer": "Jer", "book_lam": "Lam",
  "book_ezk": "Eze", "book_dan": "Dan", "book_hos": "Hos", "book_joe": "Joe", "book_amo": "Amo",
  "book_oba": "Oba", "book_jon": "Jon", "book_mic": "Mic", "book_nam": "Nah", "book_hab": "Hab",
  "book_zep": "Zep", "book_hag": "Hag", "book_zec": "Zec", "book_mal": "Mal", "book_mat": "Mat",
  "book_mar": "Mar", "book_luk": "Luk", "book_joh": "Joh", "book_act": "Act", "book_rom": "Rom",
  "book_1co": "1Co", "book_2co": "2Co", "book_gal": "Gal", "book_eph": "Eph", "book_php": "Php",
  "book_col": "Col", "book_1th": "1Th", "book_2th": "2Th", "book_1ti": "1Ti", "book_2ti": "2Ti",
  "book_tit": "Tit", "book_phm": "Phm", "book_heb": "Heb", "book_jas": "Jam", "book_1pe": "1Pe",
  "book_2pe": "2Pe", "book_1jn": "1Jn", "book_2jn": "2Jn", "book_3jn": "3Jn", "book_jud": "Jud",
  "book_rev": "Rev"
}

// Update the AchievementStats interface to include all properties used in the component
interface AchievementStats {
  totalStories: number
  completedStories: number
  completionPercentage: number
  currentStreak: number
  bestStreak: number
  oldTestament: { completed: number; total: number }
  newTestament: { completed: number; total: number }
  emojiCount: { total: number; heart: number; prayer: number; question: number; thumbsUp: number }
  sourceReading: { red: number; green: number; blue: number; black: number }
  plans?: { completed: number; total: number }
  challenges?: { completed: number; total: number }
  longestSession?: number
  booksCompleted?: string[]
  emojiCollection?: { complete: boolean }
  firstStoryDate?: string
}

// Add these interfaces for component props
interface AchievementBadgeProps {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  value: string | number
  color: string
  max?: number | null
}

// Achievement rarity system - simplified
type AchievementRarity = 'milestone' | 'achievement' | 'special'

interface Trophy {
  id: string
  title: string
  description: string
  icon: string
  achieved: boolean
  achievedDate?: string
  rarity: AchievementRarity
  category: string
}

// Enhanced ProgressBar component with animations
const ProgressBar = ({ progress, total, color }: { progress: number; total: number; color: string }) => {
  const percentage = total > 0 ? (progress / total) * 100 : 0
  const { colors } = useAppSettings()
  const progressAnim = useState(new Animated.Value(0))[0]

  React.useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: percentage,
      tension: 50,
      friction: 8,
      useNativeDriver: false,
    }).start()
  }, [percentage, progressAnim])

  return (
    <View style={[styles.progressBarOuter, { backgroundColor: colors.border + "30" }]}>
      <Animated.View 
        style={[
          styles.progressBarInner, 
          { 
            width: progressAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
              extrapolate: 'clamp',
            }), 
            backgroundColor: color 
          }
        ]} 
      />
    </View>
  )
}

// New AnimatedProgressBar for large progress displays
const AnimatedProgressBar = ({ 
  progress, 
  total, 
  color, 
  height = 12,
  showGlow = true 
}: { 
  progress: number; 
  total: number; 
  color: string; 
  height?: number;
  showGlow?: boolean;
}) => {
  const percentage = total > 0 ? (progress / total) * 100 : 0
  const { colors } = useAppSettings()
  const progressAnim = useState(new Animated.Value(0))[0]

  React.useEffect(() => {
    // Animate progress bar
    Animated.spring(progressAnim, {
      toValue: percentage,
      tension: 60,
      friction: 10,
      useNativeDriver: false,
    }).start()
  }, [percentage, progressAnim])

      return (
    <View style={[{ height, borderRadius: height / 2, backgroundColor: colors.border + "20", overflow: 'hidden' }]}>
      <Animated.View style={[{ 
        height: '100%', 
        borderRadius: height / 2,
        backgroundColor: color,
        width: progressAnim.interpolate({
          inputRange: [0, 100],
          outputRange: ['0%', '100%'],
          extrapolate: 'clamp',
        }),
      }]} />
    </View>
  )
}

// Modern Achievement Card Component - Compact Grid Style
const AchievementCard = ({ 
  icon, 
  title, 
  description, 
  value, 
  maxValue,
  achieved, 
  color,
  onPress 
}: {
  icon: string
  title: string
  description: string
  value: number
  maxValue?: number
  achieved: boolean
  color: string
  onPress?: () => void
}) => {
  const { colors } = useAppSettings()

  return (
              <TouchableOpacity
                style={[
        styles.compactCard,
                  {
                    backgroundColor: colors.card,
          borderColor: achieved ? color + "30" : 'transparent',
          borderWidth: achieved ? 2 : 1,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {achieved && (
        <View style={[styles.achievedBadge, { backgroundColor: color }]}>
          <Ionicons name="checkmark" size={10} color="white" />
        </View>
      )}
      
      {/* Icon and Title Row */}
      <View style={styles.cardRow}>
        <View style={[styles.cardIcon, { backgroundColor: color + "15" }]}>
          <Ionicons name={icon as any} size={20} color={achieved ? color : colors.textSecondary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
            {title}
                </Text>
          {maxValue ? (
            <Text style={[styles.cardProgress, { color: colors.textSecondary }]} numberOfLines={1}>
              {value} of {maxValue}
            </Text>
          ) : (
            <Text style={[styles.cardProgress, { color: color }]} numberOfLines={1}>
              {value}
            </Text>
          )}
          </View>
      </View>
      
      {/* Description */}
      <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
        {description}
      </Text>
      
      {/* Progress Bar for tracked achievements */}
      {maxValue && (
        <View style={styles.progressContainer}>
          <AnimatedProgressBar
            progress={value}
            total={maxValue}
            color={color}
            height={6}
            showGlow={false}
          />
        </View>
      )}
    </TouchableOpacity>
  )
}

// Book Achievement Component - matches the book chips from Plan page
const BookAchievement = ({ 
  bookCode, 
  bookTitle, 
  completed 
}: { 
  bookCode: string
  bookTitle: string
  completed: boolean 
}) => {
  const { colors } = useAppSettings()
  const imageSource = imageMap[bookCode]
  
  return (
                  <View
                    style={[
        styles.bookChip,
        {
          backgroundColor: completed ? '#4CAF5015' : colors.surfaceVariant,
          borderColor: completed ? '#4CAF50' : 'transparent',
          borderWidth: completed ? 1 : 0,
        }
      ]}
    >
      {imageSource && (
        <Image
          source={imageSource}
          style={[styles.bookChipImage, { opacity: completed ? 1 : 0.6 }]}
          resizeMode="contain"
        />
      )}
                  <Text
                    style={[
          styles.bookChipText,
          { color: completed ? '#4CAF50' : colors.textSecondary }
        ]}
        numberOfLines={2}
      >
        {bookTitle}
                  </Text>
            </View>
  )
}

function Achievements() {
  const { colors, theme } = useAppSettings()
  const { completedSegments } = useAppContext()
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fadeAnim = useState(new Animated.Value(0))[0]
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Create app styles using the design system
  const appStyles = createAppStyles(theme)

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
    sourceReading: { red: 0, green: 0, blue: 0, black: 0 },
  })

  // Load achievement data
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const completed = await getCompletedSegmentsCount()
        const total = await getTotalSegmentsCount()
        const streakData = await getReadingStreak()
        const emojiData = await getEmojiStats()
        const sourceData = await getSourceStats()
        const otProgress = await getOldTestamentProgress()
        const ntProgress = await getNewTestamentProgress()
        const booksCompleted = await getCompletedBooks()
        const emojiCollection = await checkEmojiCollection()

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
          emojiCollection,
        })

        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start()
      } catch (error) {
        console.error("Error loading achievement stats:", error)
        setError("Failed to load achievements")
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [completedSegments, fadeAnim, refreshTrigger])

  // Define achievements - simplified and cleaner
  const achievements = useMemo(() => {
    const baseAchievements = [
      // Reading Milestones
      {
        id: "first_story",
        title: "First Steps",
        description: "Read your first Bible story",
        icon: "book-outline",
        achieved: stats.completedStories > 0,
        color: "#4CAF50",
        category: "Reading Milestones",
        value: Math.min(stats.completedStories, 1),
        maxValue: 1,
      },
      {
        id: "bible_explorer",
        title: "Bible Explorer",
        description: "Read 10 Bible stories",
        icon: "compass-outline",
        achieved: stats.completedStories >= 10,
        color: "#2196F3",
        category: "Reading Milestones",
        value: Math.min(stats.completedStories, 10),
        maxValue: 10,
      },
      {
        id: "scripture_enthusiast",
        title: "Scripture Enthusiast",
        description: "Read 25 Bible stories",
        icon: "library-outline",
        achieved: stats.completedStories >= 25,
        color: "#9C27B0",
        category: "Reading Milestones",
        value: Math.min(stats.completedStories, 25),
        maxValue: 25,
      },
      {
        id: "bible_scholar",
        title: "Bible Scholar",
        description: "Read 50 Bible stories",
        icon: "school-outline",
        achieved: stats.completedStories >= 50,
        color: "#FF9800",
        category: "Reading Milestones",
        value: Math.min(stats.completedStories, 50),
        maxValue: 50,
      },
      {
        id: "word_warrior",
        title: "Word Warrior",
        description: "Read 100 Bible stories",
        icon: "shield-outline",
        achieved: stats.completedStories >= 100,
        color: "#F44336",
        category: "Reading Milestones",
        value: Math.min(stats.completedStories, 100),
        maxValue: 100,
      },
      {
        id: "complete_collection",
        title: "Complete Collection",
        description: "Read all 365 Bible stories",
        icon: "trophy-outline",
        achieved: stats.completedStories >= 365,
        color: "#FFD700",
        category: "Reading Milestones",
        value: stats.completedStories,
        maxValue: 365,
      },

      // Streak Achievements
      {
        id: "streak_7",
        title: "Consistent Reader",
        description: "Maintain a 7-day reading streak",
        icon: "flame-outline",
        achieved: stats.bestStreak >= 7,
        color: "#FF5722",
        category: "Reading Streaks",
        value: Math.min(stats.bestStreak, 7),
        maxValue: 7,
      },
      {
        id: "streak_30",
        title: "Scripture Habit",
        description: "Maintain a 30-day reading streak",
        icon: "flame",
        achieved: stats.bestStreak >= 30,
        color: "#FF5722",
        category: "Reading Streaks",
        value: Math.min(stats.bestStreak, 30),
        maxValue: 30,
      },
      {
        id: "streak_100",
        title: "Faithful Follower",
        description: "Maintain a 100-day reading streak",
        icon: "flame",
        achieved: stats.bestStreak >= 100,
        color: "#E91E63",
        category: "Reading Streaks",
        value: Math.min(stats.bestStreak, 100),
        maxValue: 100,
      },

      // Testament Achievements
      {
        id: "ot_master",
        title: "Old Testament Master",
        description: "Complete the Old Testament",
        icon: "bookmarks-outline",
        achieved: stats.oldTestament.completed >= stats.oldTestament.total,
        color: "#795548",
        category: "Testament Progress",
        value: stats.oldTestament.completed,
        maxValue: stats.oldTestament.total,
      },
      {
        id: "nt_master",
        title: "New Testament Master",
        description: "Complete the New Testament",
        icon: "bookmarks",
        achieved: stats.newTestament.completed >= stats.newTestament.total,
        color: "#607D8B",
        category: "Testament Progress",
        value: stats.newTestament.completed,
        maxValue: stats.newTestament.total,
      },

      // Emoji Achievements
      {
        id: "first_reaction",
        title: "First Reaction",
        description: "Add your first emoji reaction",
        icon: "happy-outline",
        achieved: stats.emojiCount.total > 0,
        color: "#FFC107",
        category: "Engagement",
        value: Math.min(stats.emojiCount.total, 1),
        maxValue: 1,
      },
      {
        id: "heart_collector",
        title: "Heart Collector",
        description: "Use the ❤️ emoji 10 times",
        icon: "heart-outline",
        achieved: stats.emojiCount.heart >= 10,
        color: "#E91E63",
        category: "Engagement",
        value: Math.min(stats.emojiCount.heart, 10),
        maxValue: 10,
      },
      {
        id: "prayer_warrior",
        title: "Prayer Warrior",
        description: "Use the 🙏 emoji 10 times",
        icon: "hand-left-outline",
        achieved: stats.emojiCount.prayer >= 10,
        color: "#9C27B0",
        category: "Engagement",
        value: Math.min(stats.emojiCount.prayer, 10),
        maxValue: 10,
      },
      {
        id: "thumbs_up_fan",
        title: "Encourager",
        description: "Use the 👍 emoji 10 times",
        icon: "thumbs-up-outline",
        achieved: stats.emojiCount.thumbsUp >= 10,
        color: "#4CAF50",
        category: "Engagement",
        value: Math.min(stats.emojiCount.thumbsUp, 10),
        maxValue: 10,
      },
      {
        id: "deep_thinker",
        title: "Deep Thinker",
        description: "Use the 🤔 emoji 10 times",
        icon: "help-circle-outline",
        achieved: stats.emojiCount.question >= 10,
        color: "#607D8B",
        category: "Engagement",
        value: Math.min(stats.emojiCount.question, 10),
        maxValue: 10,
      },
      {
        id: "emoji_enthusiast",
        title: "Emoji Enthusiast",
        description: "Use 50 emoji reactions",
        icon: "chatbubble-ellipses-outline",
        achieved: stats.emojiCount.total >= 50,
        color: "#FF9800",
        category: "Engagement",
        value: Math.min(stats.emojiCount.total, 50),
        maxValue: 50,
      },
      {
        id: "emoji_master",
        title: "Emoji Master",
        description: "Use 100 emoji reactions",
        icon: "chatbubbles-outline",
        achieved: stats.emojiCount.total >= 100,
        color: "#9C27B0",
        category: "Engagement",
        value: Math.min(stats.emojiCount.total, 100),
        maxValue: 100,
      },
      {
        id: "emoji_champion",
        title: "Emoji Champion",
        description: "Use 200 emoji reactions",
        icon: "apps-outline",
        achieved: stats.emojiCount.total >= 200,
        color: "#E91E63",
        category: "Engagement",
        value: Math.min(stats.emojiCount.total, 200),
        maxValue: 200,
      },
    ]

    return baseAchievements
  }, [stats])

  // Organize achievements by category
  const achievementCategories = useMemo(() => {
    const categories: { [key: string]: typeof achievements } = {}
    achievements.forEach(achievement => {
      if (!categories[achievement.category]) {
        categories[achievement.category] = []
      }
      categories[achievement.category].push(achievement)
    })
    return categories
  }, [achievements])

  // Old Testament books
  const oldTestamentBooks = [
    { code: "Gen", title: "Genesis" },
    { code: "Exo", title: "Exodus" },
    { code: "Lev", title: "Leviticus" },
    { code: "Num", title: "Numbers" },
    { code: "Deu", title: "Deuteronomy" },
    { code: "Jos", title: "Joshua" },
    { code: "Jdg", title: "Judges" },
    { code: "Rut", title: "Ruth" },
    { code: "1Sa", title: "1 Samuel" },
    { code: "2Sa", title: "2 Samuel" },
    { code: "1Ki", title: "1 Kings" },
    { code: "2Ki", title: "2 Kings" },
    { code: "1Ch", title: "1 Chronicles" },
    { code: "2Ch", title: "2 Chronicles" },
    { code: "Ezr", title: "Ezra" },
    { code: "Neh", title: "Nehemiah" },
    { code: "Est", title: "Esther" },
    { code: "Job", title: "Job" },
    { code: "Psa", title: "Psalms" },
    { code: "Pro", title: "Proverbs" },
    { code: "Ecc", title: "Ecclesiastes" },
    { code: "SoS", title: "Song of Solomon" },
    { code: "Isa", title: "Isaiah" },
    { code: "Jer", title: "Jeremiah" },
    { code: "Lam", title: "Lamentations" },
    { code: "Eze", title: "Ezekiel" },
    { code: "Dan", title: "Daniel" },
    { code: "Hos", title: "Hosea" },
    { code: "Joe", title: "Joel" },
    { code: "Amo", title: "Amos" },
    { code: "Oba", title: "Obadiah" },
    { code: "Jon", title: "Jonah" },
    { code: "Mic", title: "Micah" },
    { code: "Nah", title: "Nahum" },
    { code: "Hab", title: "Habakkuk" },
    { code: "Zep", title: "Zephaniah" },
    { code: "Hag", title: "Haggai" },
    { code: "Zec", title: "Zechariah" },
    { code: "Mal", title: "Malachi" },
  ]

  // New Testament books
  const newTestamentBooks = [
    { code: "Mat", title: "Matthew" },
    { code: "Mar", title: "Mark" },
    { code: "Luk", title: "Luke" },
    { code: "Joh", title: "John" },
    { code: "Act", title: "Acts" },
    { code: "Rom", title: "Romans" },
    { code: "1Co", title: "1 Corinthians" },
    { code: "2Co", title: "2 Corinthians" },
    { code: "Gal", title: "Galatians" },
    { code: "Eph", title: "Ephesians" },
    { code: "Php", title: "Philippians" },
    { code: "Col", title: "Colossians" },
    { code: "1Th", title: "1 Thessalonians" },
    { code: "2Th", title: "2 Thessalonians" },
    { code: "1Ti", title: "1 Timothy" },
    { code: "2Ti", title: "2 Timothy" },
    { code: "Tit", title: "Titus" },
    { code: "Phm", title: "Philemon" },
    { code: "Heb", title: "Hebrews" },
    { code: "Jam", title: "James" },
    { code: "1Pe", title: "1 Peter" },
    { code: "2Pe", title: "2 Peter" },
    { code: "1Jn", title: "1 John" },
    { code: "2Jn", title: "2 John" },
    { code: "3Jn", title: "3 John" },
    { code: "Jud", title: "Jude" },
    { code: "Rev", title: "Revelation" },
  ]

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 16 }]}>
          Loading your achievements...
        </Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.error}
          style={{ marginBottom: 16 }}
        />
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => setRefreshTrigger((prev) => prev + 1)}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section - Clean and simple */}
        <Animated.View style={[styles.welcomeSection, { opacity: fadeAnim }]}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>Achievements</Text>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
            Track your Bible reading progress and celebrate your milestones
          </Text>
      </Animated.View>

      {/* Main Content */}
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          {/* Reading Progress Overview - Enhanced Hero Stats */}
          <View style={styles.heroStatsContainer}>
            <View style={[styles.heroStatCard, styles.storiesCard]}>
              <LinearGradient
                colors={['#4CAF50', '#45A049']}
                style={styles.heroCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.heroCardIcon}>
                  <Ionicons name="book" size={28} color="white" />
                </View>
                <View style={styles.heroCardContent}>
                  <Text style={styles.heroCardNumber}>{stats.completedStories}</Text>
                  <Text style={styles.heroCardLabel}>Stories Read</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={[styles.heroStatCard, styles.streakCard]}>
              <LinearGradient
                colors={['#FF5722', '#F4511E']}
                style={styles.heroCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.heroCardIcon}>
                  <Ionicons name="flame" size={28} color="white" />
                </View>
                <View style={styles.heroCardContent}>
                  <Text style={styles.heroCardNumber}>{stats.currentStreak}</Text>
                  <Text style={styles.heroCardLabel}>Current Streak</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={[styles.heroStatCard, styles.progressCard]}>
              <LinearGradient
                colors={['#2196F3', '#1976D2']}
                style={styles.heroCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.heroCardIcon}>
                  <Ionicons name="trending-up" size={28} color="white" />
                </View>
                <View style={styles.heroCardContent}>
                  <Text style={styles.heroCardNumber}>{stats.completionPercentage}%</Text>
                  <Text style={styles.heroCardLabel}>Complete</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Achievement Categories */}
          {Object.entries(achievementCategories).map(([category, categoryAchievements]) => (
            <View key={category} style={styles.categorySection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{category}</Text>
              <View style={styles.achievementGrid}>
                {categoryAchievements.map((achievement, index) => (
                  <View key={achievement.id} style={styles.gridItem}>
                    <AchievementCard
                      icon={achievement.icon}
                      title={achievement.title}
                      description={achievement.description}
                      value={achievement.value}
                      maxValue={achievement.maxValue}
                      achieved={achievement.achieved}
                      color={achievement.color}
                      onPress={() => {
                        if (achievement.achieved) {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        }
                      }}
                />
              </View>
                ))}
            </View>
          </View>
          ))}

          {/* Bible Books Progress */}
          <View style={styles.categorySection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Old Testament Books</Text>
            <View style={styles.booksGrid}>
              {oldTestamentBooks.map((book) => (
                <BookAchievement
                  key={book.code}
                  bookCode={book.code}
                  bookTitle={book.title}
                  completed={stats.booksCompleted?.includes(book.code) || false}
                />
              ))}
          </View>
        </View>

          <View style={styles.categorySection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>New Testament Books</Text>
            <View style={styles.booksGrid}>
              {newTestamentBooks.map((book) => (
                <BookAchievement
                  key={book.code}
                  bookCode={book.code}
                  bookTitle={book.title}
                  completed={stats.booksCompleted?.includes(book.code) || false}
                />
              ))}
          </View>
          </View>
      </Animated.View>
        
      <View style={{ height: 50 }} />
    </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    paddingTop: 24,
    paddingBottom: 0,
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  
  // Stats overview - matches Home page
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: Platform.OS === 'ios' ? 1 : 0,
    borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  
  // Category sections
  categorySection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  
  // Achievement grid
  achievementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: "48%", // 2 columns with gap
  },
  
  // Modern achievement cards
  compactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
    borderWidth: 1,
    borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
    minHeight: 120,
  },
  achievedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  cardProgress: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardDescription: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 16,
  },
  progressContainer: {
    marginTop: 4,
  },
  
  // Books grid - matches Plan page style
  booksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  bookChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    minWidth: 140,
    maxWidth: "48%",
    flex: 1,
  },
  bookChipImage: {
    width: 24,
    height: 24,
    flexShrink: 0,
  },
  bookChipText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    lineHeight: 16,
  },
  
  // Progress bars
  progressBarOuter: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarInner: {
    height: "100%",
    borderRadius: 4,
  },
  
  // Loading and error states
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  heroStatsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  storiesCard: {
    // No additional styling needed
  },
  streakCard: {
    // No additional styling needed  
  },
  progressCard: {
    // No additional styling needed
  },
  heroCardGradient: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    minHeight: 100,
  },
  heroCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  heroCardContent: {
    alignItems: "center",
  },
  heroCardNumber: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 2,
    color: "white",
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroCardLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    color: "white",
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
})

export default Achievements
