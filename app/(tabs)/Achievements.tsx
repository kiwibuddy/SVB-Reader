"use client"

import { useEffect, useState, useMemo } from "react"
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

// Update the TrophyProps interface
interface TrophyProps {
  id: string
  title: string
  description: string
  icon: string // Change from keyof typeof Ionicons.glyphMap to string
  achieved: boolean
}

// Add a new interface for trophies with achievement date
interface Trophy {
  id: string
  title: string
  description: string
  icon: string // Change from keyof typeof Ionicons.glyphMap to string
  achieved: boolean
  achievedDate?: string // Date when trophy was achieved
}

// First, create a ProgressBar component at the top of the file
const ProgressBar = ({ progress, total, color }: { progress: number; total: number; color: string }) => {
  const percentage = total > 0 ? (progress / total) * 100 : 0
  const { colors } = useAppSettings()

  return (
    <View style={[styles.progressBarOuter, { backgroundColor: colors.border + "30" }]}>
      <View style={[styles.progressBarInner, { width: `${percentage}%`, backgroundColor: color }]} />
    </View>
  )
}

// Add this component after your existing components
const TrophyGrid = ({ trophies, colors }: { trophies: Trophy[]; colors: any }) => {
  // Split trophies into completed and locked
  const completedTrophies = trophies.filter((t) => t.achieved)
  const lockedTrophies = trophies.filter((t) => !t.achieved)

  // Helper function to render the trophy icon
  const renderTrophyIcon = (trophy: Trophy, isAchieved: boolean) => {
    // Check if it's a book trophy
    if (trophy.id.startsWith("book_")) {
      const bookCode = trophy.id.replace("book_", "").substring(0, 3)
      // Convert to proper case to match imageMap keys
      const bookCodeUpper = bookCode.charAt(0).toUpperCase() + bookCode.slice(1).toLowerCase()
      const imageSource = imageMap[bookCodeUpper]

      return (
        <Image
          source={imageSource}
          style={[{ width: 56, height: 56 }, isAchieved ? styles.achievedIcon : styles.lockedIcon]}
          resizeMode="contain"
        />
      )
    }

    // Non-book trophies - now same size as book icons
    return (
      <Ionicons
        name={trophy.icon as any}
        size={56} // Increased from 28 to 56
        color={isAchieved ? colors.primary : colors.border}
        style={isAchieved ? styles.achievedIcon : styles.lockedIcon}
      />
    )
  }

  // Group remaining trophies by category
  const categories = {
    "Reading Progress": lockedTrophies.filter(
      (t) =>
        t.id.includes("story") ||
        t.id.includes("bible") ||
        t.id.includes("collection") ||
        t.id === "ot_master" ||
        t.id === "nt_master",
    ),
    Streaks: lockedTrophies.filter((t) => t.id.includes("streak")),
    "Old Testament Books": lockedTrophies.filter(
      (t) =>
        t.id.startsWith("book_") &&
        ![
          "mat",
          "mrk",
          "luk",
          "jhn",
          "act",
          "rom",
          "co",
          "gal",
          "eph",
          "php",
          "col",
          "th",
          "ti",
          "tit",
          "phm",
          "heb",
          "jas",
          "pe",
          "jn",
          "jud",
          "rev",
        ].some((code) => t.id.includes(code)),
    ),
    "New Testament Books": lockedTrophies.filter(
      (t) =>
        t.id.startsWith("book_") &&
        [
          "mat",
          "mrk",
          "luk",
          "jhn",
          "act",
          "rom",
          "co",
          "gal",
          "eph",
          "php",
          "col",
          "th",
          "ti",
          "tit",
          "phm",
          "heb",
          "jas",
          "pe",
          "jn",
          "jud",
          "rev",
        ].some((code) => t.id.includes(code)),
    ),
    "Emoji Reactions": lockedTrophies.filter(
      (t) =>
        t.id.includes("emoji") ||
        t.id.includes("reaction") ||
        t.id.includes("heart") ||
        t.id.includes("prayer") ||
        t.id.includes("thinker") ||
        t.id.includes("encourager"),
    ),
  }

  return (
    <>
      {/* Completed Trophies Section */}
      {completedTrophies.length > 0 && (
        <View style={styles.trophyCategory}>
          <Text style={[styles.trophyCategoryTitle, { color: colors.text }]}>Completed Achievements</Text>
          <View style={styles.trophyGrid}>
            {completedTrophies.map((trophy) => (
              <TouchableOpacity
                key={trophy.id}
                style={[
                  styles.trophyGridItem,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.primary + "40",
                  },
                ]}
              >
                <LinearGradient
                  colors={[colors.primary + "10", colors.primary + "30"]}
                  style={[styles.trophyIconContainer, { borderColor: colors.primary }]}
                >
                  {renderTrophyIcon(trophy, true)}
                </LinearGradient>
                <Text
                  style={[
                    styles.trophyGridTitle,
                    {
                      color: colors.text,
                      fontWeight: "600",
                    },
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
      {Object.entries(categories).map(([category, categoryTrophies]) =>
        categoryTrophies.length > 0 ? (
          <View key={category} style={styles.trophyCategory}>
            <Text style={[styles.trophyCategoryTitle, { color: colors.text }]}>{category}</Text>
            <View style={styles.trophyGrid}>
              {categoryTrophies.map((trophy) => (
                <TouchableOpacity
                  key={trophy.id}
                  style={[
                    styles.trophyGridItem,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border + "30",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.trophyIconContainer,
                      {
                        backgroundColor: colors.border + "10",
                        borderColor: "transparent",
                      },
                    ]}
                  >
                    {renderTrophyIcon(trophy, false)}
                    <Ionicons name="lock-closed" size={12} color={colors.border} style={styles.lockIcon} />
                  </View>
                  <Text
                    style={[
                      styles.trophyGridTitle,
                      {
                        color: colors.secondary,
                        fontWeight: "400",
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {trophy.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null,
      )}
    </>
  )
}

function Achievements() {
  const { colors } = useAppSettings()
  const { completedSegments } = useAppContext()
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fadeAnim = useState(new Animated.Value(0))[0]
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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

  // Update the trophies array with proper null checks for booksCompleted
  const trophies = useMemo(() => {
    // Create arrays for all Bible books
    const oldTestamentBooks = [
      { id: "book_gen", code: "Gen", title: "Genesis" },
      { id: "book_exo", code: "Exo", title: "Exodus" },
      { id: "book_lev", code: "Lev", title: "Leviticus" },
      { id: "book_num", code: "Num", title: "Numbers" },
      { id: "book_deu", code: "Deu", title: "Deuteronomy" },
      { id: "book_jos", code: "Jos", title: "Joshua" },
      { id: "book_jdg", code: "Jdg", title: "Judges" },
      { id: "book_rut", code: "Rut", title: "Ruth" },
      { id: "book_1sa", code: "1Sa", title: "1 Samuel" },
      { id: "book_2sa", code: "2Sa", title: "2 Samuel" },
      { id: "book_1ki", code: "1Ki", title: "1 Kings" },
      { id: "book_2ki", code: "2Ki", title: "2 Kings" },
      { id: "book_1ch", code: "1Ch", title: "1 Chronicles" },
      { id: "book_2ch", code: "2Ch", title: "2 Chronicles" },
      { id: "book_ezr", code: "Ezr", title: "Ezra" },
      { id: "book_neh", code: "Neh", title: "Nehemiah" },
      { id: "book_est", code: "Est", title: "Esther" },
      { id: "book_job", code: "Job", title: "Job" },
      { id: "book_psa", code: "Psa", title: "Psalms" },
      { id: "book_pro", code: "Pro", title: "Proverbs" },
      { id: "book_ecc", code: "Ecc", title: "Ecclesiastes" },
      { id: "book_sos", code: "SoS", title: "Song of Solomon" },
      { id: "book_isa", code: "Isa", title: "Isaiah" },
      { id: "book_jer", code: "Jer", title: "Jeremiah" },
      { id: "book_lam", code: "Lam", title: "Lamentations" },
      { id: "book_ezk", code: "Eze", title: "Ezekiel" },
      { id: "book_dan", code: "Dan", title: "Daniel" },
      { id: "book_hos", code: "Hos", title: "Hosea" },
      { id: "book_jol", code: "Joe", title: "Joel" },
      { id: "book_amo", code: "Amo", title: "Amos" },
      { id: "book_oba", code: "Oba", title: "Obadiah" },
      { id: "book_jon", code: "Jon", title: "Jonah" },
      { id: "book_mic", code: "Mic", title: "Micah" },
      { id: "book_nam", code: "Nah", title: "Nahum" },
      { id: "book_hab", code: "Hab", title: "Habakkuk" },
      { id: "book_zep", code: "Zep", title: "Zephaniah" },
      { id: "book_hag", code: "Hag", title: "Haggai" },
      { id: "book_zec", code: "Zec", title: "Zechariah" },
      { id: "book_mal", code: "Mal", title: "Malachi" },
    ]

    const newTestamentBooks = [
      { id: "book_mat", code: "Mat", title: "Matthew" },
      { id: "book_mrk", code: "Mrk", title: "Mark" },
      { id: "book_luk", code: "Luk", title: "Luke" },
      { id: "book_jhn", code: "Jhn", title: "John" },
      { id: "book_act", code: "Act", title: "Acts" },
      { id: "book_rom", code: "Rom", title: "Romans" },
      { id: "book_1co", code: "1Co", title: "1 Corinthians" },
      { id: "book_2co", code: "2Co", title: "2 Corinthians" },
      { id: "book_gal", code: "Gal", title: "Galatians" },
      { id: "book_eph", code: "Eph", title: "Ephesians" },
      { id: "book_php", code: "Php", title: "Philippians" },
      { id: "book_col", code: "Col", title: "Colossians" },
      { id: "book_1th", code: "1Th", title: "1 Thessalonians" },
      { id: "book_2th", code: "2Th", title: "2 Thessalonians" },
      { id: "book_1ti", code: "1Ti", title: "1 Timothy" },
      { id: "book_2ti", code: "2Ti", title: "2 Timothy" },
      { id: "book_tit", code: "Tit", title: "Titus" },
      { id: "book_phm", code: "Phm", title: "Philemon" },
      { id: "book_heb", code: "Heb", title: "Hebrews" },
      { id: "book_jas", code: "Jas", title: "James" },
      { id: "book_1pe", code: "1Pe", title: "1 Peter" },
      { id: "book_2pe", code: "2Pe", title: "2 Peter" },
      { id: "book_1jn", code: "1Jn", title: "1 John" },
      { id: "book_2jn", code: "2Jn", title: "2 John" },
      { id: "book_3jn", code: "3Jn", title: "3 John" },
      { id: "book_jud", code: "Jud", title: "Jude" },
      { id: "book_rev", code: "Rev", title: "Revelation" },
    ]

    // Create the base trophies array
    const baseTrophies: Trophy[] = [
      // Reading Progress Trophies
      {
        id: "first_story",
        title: "First Story",
        description: "Read your first Bible story",
        icon: "book-outline",
        achieved: stats.completedStories > 0,
      },
      {
        id: "bible_explorer",
        title: "Bible Explorer",
        description: "Read 10 Bible stories",
        icon: "compass-outline",
        achieved: stats.completedStories >= 10,
      },
      {
        id: "scripture_enthusiast",
        title: "Scripture Enthusiast",
        description: "Read 25 Bible stories",
        icon: "library-outline",
        achieved: stats.completedStories >= 25,
      },
      {
        id: "bible_scholar",
        title: "Bible Scholar",
        description: "Read 50 Bible stories",
        icon: "school-outline",
        achieved: stats.completedStories >= 50,
      },
      {
        id: "word_warrior",
        title: "Word Warrior",
        description: "Read 100 Bible stories",
        icon: "shield-outline",
        achieved: stats.completedStories >= 100,
      },
      {
        id: "bible_master",
        title: "Bible Master",
        description: "Read 200 Bible stories",
        icon: "ribbon-outline",
        achieved: stats.completedStories >= 200,
      },
      {
        id: "complete_collection",
        title: "Complete Collection",
        description: "Read all 365 Bible stories",
        icon: "trophy-outline",
        achieved: stats.completedStories >= 365,
      },
      {
        id: "ot_master",
        title: "Old Testament Master",
        description: "Complete the Old Testament",
        icon: "bookmarks-outline",
        achieved: stats.oldTestament.completed >= stats.oldTestament.total,
      },
      {
        id: "nt_master",
        title: "New Testament Master",
        description: "Complete the New Testament",
        icon: "bookmarks-outline",
        achieved: stats.newTestament.completed >= stats.newTestament.total,
      },

      // Streak Trophies
      {
        id: "streak_3",
        title: "Getting Started",
        description: "Maintain a 3-day reading streak",
        icon: "flame-outline",
        achieved: stats.currentStreak >= 3,
      },
      {
        id: "streak_7",
        title: "Consistent Reader",
        description: "Maintain a 7-day reading streak",
        icon: "flame-outline",
        achieved: stats.currentStreak >= 7,
      },
      {
        id: "streak_14",
        title: "Dedicated Disciple",
        description: "Maintain a 14-day reading streak",
        icon: "flame-outline",
        achieved: stats.currentStreak >= 14,
      },
      {
        id: "streak_30",
        title: "Scripture Habit",
        description: "Maintain a 30-day reading streak",
        icon: "flame-outline",
        achieved: stats.currentStreak >= 30,
      },
      {
        id: "streak_60",
        title: "Bible Devotee",
        description: "Maintain a 60-day reading streak",
        icon: "flame-outline",
        achieved: stats.currentStreak >= 60,
      },
      {
        id: "streak_100",
        title: "Faithful Follower",
        description: "Maintain a 100-day reading streak",
        icon: "flame-outline",
        achieved: stats.currentStreak >= 100,
      },
      {
        id: "streak_365",
        title: "Scripture Champion",
        description: "Maintain a 365-day reading streak",
        icon: "flame-outline",
        achieved: stats.currentStreak >= 365,
      },

      // Emoji Reaction Trophies
      {
        id: "first_reaction",
        title: "First Reaction",
        description: "Add your first emoji reaction",
        icon: "happy-outline",
        achieved: stats.emojiCount.total > 0,
      },
      {
        id: "heart_collector",
        title: "Heart Collector",
        description: "Use the ❤️ emoji 10 times",
        icon: "heart-outline",
        achieved: stats.emojiCount.heart >= 10,
      },
      {
        id: "prayer_warrior",
        title: "Prayer Warrior",
        description: "Use the 🙏 emoji 10 times",
        icon: "hand-left-outline",
        achieved: stats.emojiCount.prayer >= 10,
      },
      {
        id: "deep_thinker",
        title: "Deep Thinker",
        description: "Use the 🤔 emoji 10 times",
        icon: "help-circle-outline",
        achieved: stats.emojiCount.question >= 10,
      },
      {
        id: "encourager",
        title: "Encourager",
        description: "Use the 👍 emoji 10 times",
        icon: "thumbs-up-outline",
        achieved: stats.emojiCount.thumbsUp >= 10,
      },
      {
        id: "emoji_master",
        title: "Emoji Master",
        description: "Use all emoji types at least 5 times each",
        icon: "apps-outline",
        achieved: stats.emojiCollection?.complete || false,
      },
    ]

    // Only add book trophies if we have book completion data
    if (stats.booksCompleted && Array.isArray(stats.booksCompleted)) {
      // Add Old Testament book trophies
      const otBookTrophies = oldTestamentBooks.map((book) => ({
        id: book.id,
        title: book.title,
        description: `Complete all stories in ${book.title}`,
        icon: "book-outline",
        achieved: stats.booksCompleted?.includes(book.code) || false,
      }))

      // Add New Testament book trophies
      const ntBookTrophies = newTestamentBooks.map((book) => ({
        id: book.id,
        title: book.title,
        description: `Complete all stories in ${book.title}`,
        icon: "book-outline",
        achieved: stats.booksCompleted?.includes(book.code) || false,
      }))

      // Return combined trophies
      return [...baseTrophies, ...otBookTrophies, ...ntBookTrophies]
    }

    // Return just the base trophies if no book data
    return baseTrophies
  }, [stats])

  // Fix the sort function that uses achievedDate
  const sortedTrophies = useMemo(() => {
    return [...trophies].sort((a, b) => {
      if (a.achieved && !b.achieved) return -1
      if (!a.achieved && b.achieved) return 1
      return 0
    })
  }, [trophies])

  // Achievement badge component
  const AchievementBadge = ({ icon, title, value, color, max = null }: AchievementBadgeProps) => (
    <View
      style={[
        styles.achievementItem,
        {
          backgroundColor: colors.card,
          shadowColor: color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        },
      ]}
    >
      <LinearGradient
        colors={[color + "20", color + "40"]}
        style={[styles.iconContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon} size={28} color={color} />
      </LinearGradient>
      <View style={styles.achievementContent}>
        <Text style={[styles.achievementTitle, { color: colors.text }]}>{title}</Text>
        {max ? (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarOuter, { backgroundColor: colors.border + "30" }]}>
              <View
                style={[
                  styles.progressBarInner,
                  { width: `${(Number(value) / Number(max)) * 100}%`, backgroundColor: color },
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
  )

  // Add the Trophy component implementation with a type assertion
  const Trophy = ({ id, title, description, icon, achieved }: TrophyProps) => {
    const { colors } = useAppSettings()
    return (
      <View
        style={[
          styles.trophyItem,
          {
            backgroundColor: colors.card,
            borderColor: achieved ? colors.primary + "30" : colors.border,
          },
        ]}
      >
        <LinearGradient
          colors={
            achieved ? [colors.primary + "20", colors.primary + "40"] : [colors.border + "10", colors.border + "20"]
          }
          style={[styles.trophyIcon]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons
            name={icon as any} // Add type assertion here
            size={24}
            color={achieved ? colors.primary : colors.border}
          />
        </LinearGradient>
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
    )
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.secondary, marginTop: 16 }]}>
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
          color={ "#FF3B30"}
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={[colors.primary + "20", "transparent"]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.titleContainer}>
            <Ionicons name="trophy" size={32} color={colors.primary} style={styles.titleIcon} />
            <Text style={[styles.title, { color: colors.text }]}>Achievements</Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>Track your Bible reading journey</Text>
        </LinearGradient>
      </Animated.View>

      {/* Main Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Reading Progress Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Reading Progress</Text>
        <View
          style={[
            styles.achievementItem,
            {
              backgroundColor: colors.card,
              shadowColor: "#FF6B00",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            },
          ]}
        >
          <LinearGradient
            colors={["#FF6B0020", "#FF6B0040"]}
            style={styles.iconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="book" size={24} color="#FF6B00" />
          </LinearGradient>
          <View style={styles.achievementContent}>
            <Text style={[styles.achievementTitle, { color: colors.text }]}>Total Stories Read</Text>
            <View style={[styles.largeProgressBarOuter, { backgroundColor: colors.border + "30" }]}>
              <LinearGradient
                colors={["#FF6B00", "#FF8C40"]}
                style={[
                  styles.largeProgressBarInner,
                  { width: `${(stats.completedStories / stats.totalStories) * 100}%` },
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={[styles.achievementValue, { color: "#FF6B00" }]}>
              {stats.completedStories} of {stats.totalStories} stories
            </Text>
          </View>
        </View>

        {/* Testament Progress */}
        <View style={styles.testamentContainer}>
          <View
            style={[
              styles.achievementItem,
              {
                backgroundColor: colors.card,
                shadowColor: "#8B5CF6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              },
            ]}
          >
            <LinearGradient
              colors={["#8B5CF620", "#8B5CF640"]}
              style={styles.iconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="book" size={24} color="#8B5CF6" />
            </LinearGradient>
            <View style={styles.achievementContent}>
              <Text style={[styles.achievementTitle, { color: colors.text }]}>Old Testament</Text>
              <View style={[styles.progressBarOuter, { backgroundColor: colors.border + "30" }]}>
                <LinearGradient
                  colors={["#8B5CF6", "#A78BFA"]}
                  style={[
                    styles.progressBarInner,
                    { width: `${(stats.oldTestament.completed / stats.oldTestament.total) * 100}%` },
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.secondary }]}>
                {stats.oldTestament.completed} of {stats.oldTestament.total}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.achievementItem,
              {
                backgroundColor: colors.card,
                shadowColor: "#3B82F6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              },
            ]}
          >
            <LinearGradient
              colors={["#3B82F620", "#3B82F640"]}
              style={styles.iconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="book" size={24} color="#3B82F6" />
            </LinearGradient>
            <View style={styles.achievementContent}>
              <Text style={[styles.achievementTitle, { color: colors.text }]}>New Testament</Text>
              <View style={[styles.progressBarOuter, { backgroundColor: colors.border + "30" }]}>
                <LinearGradient
                  colors={["#3B82F6", "#60A5FA"]}
                  style={[
                    styles.progressBarInner,
                    { width: `${(stats.newTestament.completed / stats.newTestament.total) * 100}%` },
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.secondary }]}>
                {stats.newTestament.completed} of {stats.newTestament.total}
              </Text>
            </View>
          </View>
        </View>

        {/* Streaks Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Streaks</Text>

        <View style={styles.streaksRow}>
          <View
            style={[
              styles.streakCard,
              {
                backgroundColor: colors.card,
                shadowColor: "#FF6B00",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              },
            ]}
          >
            <LinearGradient
              colors={["#FF6B0020", "#FF6B0040"]}
              style={styles.streakIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="flame" size={28} color="#FF6B00" />
            </LinearGradient>
            <Text style={[styles.streakValue, { color: "#FF6B00" }]}>{stats.currentStreak}</Text>
            <Text style={[styles.streakLabel, { color: colors.text }]}>Current Streak</Text>
          </View>

          <View
            style={[
              styles.streakCard,
              {
                backgroundColor: colors.card,
                shadowColor: "#F59E0B",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              },
            ]}
          >
            <LinearGradient
              colors={["#F59E0B20", "#F59E0B40"]}
              style={styles.streakIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="trending-up" size={28} color="#F59E0B" />
            </LinearGradient>
            <Text style={[styles.streakValue, { color: "#F59E0B" }]}>{stats.bestStreak}</Text>
            <Text style={[styles.streakLabel, { color: colors.text }]}>Best Streak</Text>
          </View>

          <View
            style={[
              styles.streakCard,
              {
                backgroundColor: colors.card,
                shadowColor: "#6366F1",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              },
            ]}
          >
            <LinearGradient
              colors={["#6366F120", "#6366F140"]}
              style={styles.streakIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="time" size={28} color="#6366F1" />
            </LinearGradient>
            <Text style={[styles.streakValue, { color: "#6366F1" }]}>{stats.longestSession || 0}</Text>
            <Text style={[styles.streakLabel, { color: colors.text }]}>Longest Session</Text>
          </View>
        </View>

        {/* Trophies Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Trophies</Text>
        <TrophyGrid trophies={sortedTrophies} colors={colors} />
      </Animated.View>
      <View style={{ height: 50 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 16,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    marginLeft: 44,
    opacity: 0.8,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  achievementItem: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  testamentContainer: {
    marginTop: 4,
  },
  streaksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  streakCard: {
    width: "31%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  streakIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  streakValue: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 14,
    textAlign: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  achievementValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBarOuter: {
    height: 8,
    borderRadius: 4,
    marginVertical: 6,
    overflow: "hidden",
  },
  progressBarInner: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    marginTop: 4,
  },
  largeProgressBarOuter: {
    height: 12,
    borderRadius: 6,
    marginVertical: 8,
    overflow: "hidden",
  },
  largeProgressBarInner: {
    height: "100%",
    borderRadius: 6,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  trophyCategory: {
    marginBottom: 24,
  },
  trophyCategoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 4,
  },
  trophyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  trophyGridItem: {
    width: "31%",
    aspectRatio: 0.8,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
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
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    position: "relative",
    overflow: "hidden",
  },
  trophyGridTitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  achievedIcon: {
    opacity: 1,
  },
  lockedIcon: {
    opacity: 0.5,
  },
  lockIcon: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    padding: 2,
  },
  trophyItem: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trophyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    overflow: "hidden",
  },
  trophyContent: {
    flex: 1,
  },
  trophyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  trophyDesc: {
    fontSize: 14,
    opacity: 0.8,
  },
  achievedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
  },
})

export default Achievements
