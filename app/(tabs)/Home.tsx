import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
  FlatList,
  ImageBackground,
  useWindowDimensions,
  Platform,
  SafeAreaView,
  TouchableOpacity
} from "react-native";
import Card from "@/components/Card";
import ReadingPlansChallenges from "../../assets/data/ReadingPlansChallenges.json";
import StickyHeader from "../../components/StickyHeader";
import { useAppContext } from "@/context/GlobalContext";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { getEmojis, getCurrentStreak } from "@/api/sqlite";
import { format } from 'date-fns';
import CustomHeader from "@/components/navigation/CustomHeader";
import { useFontSize } from '@/context/FontSizeContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { type ColorScheme } from '@/context/types';
import { useTranslation } from '@/hooks/useTranslation';
import { LinearGradient } from 'expo-linear-gradient';
import StreakCounter from '@/components/gamification/StreakCounter';
import CelebrationModal from '@/components/gamification/CelebrationModal';

const SegmentTitles = require("@/assets/data/SegmentTitles.json") as { [key: string]: SegmentTitle };

type SegmentTitle = {
  Segment: string;
  title: string;
  book: string[];
  ref?: string;  // Making ref optional since not all segments have it
}

const segIDs = Object.keys(SegmentTitles);

// Move styles outside component to avoid the reference error
const createStyles = (isLargeScreen: boolean, colors: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  continueReading: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
  },
  readingInfo: {
    flex: 1,
  },
  readingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  readingSubtitle: {
    fontSize: 14,
    color: colors.secondary,
  },
  resumeButton: {
    backgroundColor: "#FF5733",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  resumeText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  gridContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  gridItem: {
    flex: 1,
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  gridItemContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  gridItemTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  gridItemSubtitle: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 14,
    flexDirection: "row",
    alignItems: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.secondary,
    marginTop: 2,
    fontWeight: "500",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: colors.secondary,
  },
  welcomeSection: {
    marginTop: 20,
    marginBottom: 28,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  welcomeText: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  nextButton: {
    backgroundColor: '#2196F3',
  },
  section: {
    marginVertical: 12,
    padding: 0,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 18,
    color: colors.text,
    letterSpacing: -0.5,
  },
  insightCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  featuredCard: {
    flex: 1,
    height: 200, // Increased height to accommodate text
    borderRadius: 20, // Slightly less rounded for cleaner look
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientContainer: {
    flex: 1,
    padding: 20, // Reduced padding for better proportion
    borderRadius: 20,
    position: 'relative',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  cardIcon: {
    width: 48, // Slightly smaller for better proportion
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16, // More space below icon
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  cardTextSection: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 18, // Slightly smaller for better fit
    fontWeight: '800', // Less bold for cleaner look
    color: '#FFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13, // Smaller subtitle
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginTop: 12, // Add space above badge
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60, // Smaller accent for cleaner look
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomLeftRadius: 30,
  },
  // Remove the glow effect for cleaner look
  cardGlow: {
    display: 'none',
  },
  featuredSection: {
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 180,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: colors.text,
  },
  emojiContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 20,
    marginRight: 4,
  },
  timestamp: {
    fontSize: 12,
    color: colors.secondary,
  },
  insightCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    flex: 1,
    minWidth: isLargeScreen ? '23%' : '48%',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    opacity: 1,
    borderWidth: 1,
    borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
  },
  insightCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  insightTitle: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 8,
    fontWeight: "500",
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  gridItemImage: {
    borderRadius: 20,
  },
  headerIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: colors.card,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

// Improved type definition with better typing
// Improved type definition with better typing
type ContinueReadingProps = {
  lastReadSegment: string | null;
  onPress: () => void;
  styles: Record<string, any>;
  colors: ColorScheme;
};

const ContinueReadingSection = ({ lastReadSegment, onPress, styles, colors }: ContinueReadingProps) => {
  const { completedSegments, markSegmentComplete, updateSegmentId } = useAppContext();
  const router = useRouter();
  const { sizes } = useFontSize();
  const { t } = useTranslation();
  
  // Custom styles specific to this component for better aesthetics
  const localStyles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 10,
      marginBottom: 20,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
      borderWidth: 1,
      borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
      position: 'relative',
    },
    contentWrapper: {
      flexDirection: "column",
      justifyContent: "flex-start",
    },
    textSection: {
      marginBottom: 14,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    icon: {
      marginRight: 8,
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.secondary,
      marginLeft: 28, // Align with title text after icon
      marginTop: 2,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    button: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    startButton: {
      backgroundColor: "#FF5733",
    },
    completeButton: {
      backgroundColor: '#4CAF50',
    },
    nextButton: {
      backgroundColor: '#2196F3',
    },
    buttonText: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "600",
      textAlign: 'center',
    },
    accentBorder: {
      position: 'absolute',
      left: 0,
      top: 16,
      bottom: 16,
      width: 4,
      borderRadius: 2,
    }
  });
  
  // Get appropriate icon based on reading state
  const getIcon = () => {
    if (!lastReadSegment) {
      return "play-circle-outline";
    }
    
    const isCompleted = completedSegments[lastReadSegment]?.isCompleted;
    return isCompleted ? "arrow-forward-circle-outline" : "bookmark-outline";
  };
  
  // Get accent color based on reading state
  const getAccentColor = () => {
    if (!lastReadSegment) {
      return "#FF5733"; // Orange for new readers
    }
    
    const isCompleted = completedSegments[lastReadSegment]?.isCompleted;
    return isCompleted ? "#2196F3" : "#4CAF50"; // Blue for continue, Green for resume
  };
  
  if (!lastReadSegment) {
    return (
      <View style={localStyles.container}>
        <View style={[localStyles.accentBorder, { backgroundColor: getAccentColor() }]} />
        <View style={localStyles.contentWrapper}>
          <View style={localStyles.textSection}>
            <View style={localStyles.titleRow}>
              <Ionicons 
                name={getIcon() as any} 
                size={18} 
                color={getAccentColor()} 
                style={localStyles.icon} 
              />
              <Text style={localStyles.title}>{t('UI.home.jumpRightIn')}</Text>
            </View>
            <Text style={localStyles.subtitle}>
              {t('UI.home.beginReadingJourney')}
            </Text>
          </View>
          <View style={localStyles.buttonContainer}>
            <Pressable 
              style={({ pressed }) => [
                localStyles.button,
                localStyles.startButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
              ]} 
              onPress={onPress}
            >
              <Text style={localStyles.buttonText}>{t('UI.home.start')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const isLastSegmentCompleted = completedSegments[lastReadSegment]?.isCompleted;
  const currentIndex = segIDs.indexOf(lastReadSegment);
  let nextSegment = segIDs[currentIndex + 1];
  
  // Skip any introduction segments
  while (nextSegment && nextSegment.startsWith('I')) {
    const skipIndex = segIDs.indexOf(nextSegment);
    nextSegment = segIDs[skipIndex + 1];
  }

  const currentSegmentData = SegmentTitles[lastReadSegment as keyof typeof SegmentTitles];
  const nextSegmentData = nextSegment ? SegmentTitles[nextSegment as keyof typeof SegmentTitles] : null;

  const handleComplete = async () => {
    // Navigate back to the last segment
    await updateSegmentId(`ENG-NLT-${lastReadSegment}`);
    const segment = SegmentTitles[lastReadSegment as keyof typeof SegmentTitles];
    router.push({
      pathname: "/[segment]",
      params: {
        segment: `ENG-NLT-${lastReadSegment}`,
        book: segment?.book[0] || ''
      }
    });
  };

  return (
    <View style={localStyles.container}>
      <View style={[localStyles.accentBorder, { backgroundColor: getAccentColor() }]} />
      <View style={localStyles.contentWrapper}>
        <View style={localStyles.textSection}>
          <View style={localStyles.titleRow}>
            <Ionicons 
              name={getIcon() as any} 
              size={18} 
              color={getAccentColor()} 
              style={localStyles.icon} 
            />
            <Text style={localStyles.title}>
              {isLastSegmentCompleted ? t('UI.home.continueReading') : t('UI.home.resumeReading')}
            </Text>
          </View>
          <Text style={localStyles.subtitle}>
            {isLastSegmentCompleted 
              ? `Next: ${nextSegmentData?.title}`
              : `Complete: ${currentSegmentData?.title}`}
          </Text>
        </View>
        <View style={localStyles.buttonContainer}>
          {!isLastSegmentCompleted && (
            <Pressable 
              style={({ pressed }) => [
                localStyles.button, 
                localStyles.completeButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
              ]}
              onPress={handleComplete}
            >
              <Text style={localStyles.buttonText}>{t('UI.home.complete')}</Text>
            </Pressable>
          )}
          <Pressable 
            style={({ pressed }) => [
              localStyles.button, 
              isLastSegmentCompleted ? localStyles.nextButton : localStyles.nextButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
            ]}
            onPress={onPress}
          >
            <Text style={localStyles.buttonText}>
              {isLastSegmentCompleted ? t('UI.home.next') : t('UI.home.next')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

// Add types for our data
// interface RecentActivity {
//   segmentId: string;
//   title: string;
//   timestamp: string;
//   emojis: string[];
// }

// Add near other type definitions
type CompletionData = {
  id: string;
  isCompleted: boolean;
};

interface SectionStyles {
  section: any;
  sectionTitle: any;
  insightCards: any;
  insightCard: any;
  insightCardPressed: any;
  insightTitle: any;
  insightValue: any;
  activityCard: any;
  emojiContainer: any;
  text: {
    title: number;
    subtitle: number;
    body: number;
    caption: number;
    button: number;
  };
  colors: ColorScheme;
}

// 2. Reading Insights with real data
const InsightsSection = ({ styles }: { styles: SectionStyles }) => {
  const { completedSegments } = useAppContext();
  const router = useRouter();
  const { sizes } = useFontSize();
  const { colors } = styles;
  const { t } = useTranslation();
  
  const localStyles = StyleSheet.create({
    sectionTitle: {
      fontSize: sizes.title,
      fontWeight: '800',
      marginBottom: 12,
      color: colors.text,
      letterSpacing: -0.5,
    },
    insightTitle: {
      fontSize: sizes.caption,
      color: colors.secondary,
      marginBottom: 8,
      fontWeight: "500",
    },
    insightValue: {
      fontSize: sizes.subtitle,
      fontWeight: '800',
      color: colors.text,
    },
    insightIcon: {
      marginBottom: 12,
      width: 42,
      height: 42,
      borderRadius: 21,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    }
  });

  const [insights, setInsights] = useState({
    favoriteBook: '',
    favoriteBookFullName: '',
    favoriteSegmentId: '',
    favoriteSegment: '',
    readingStreak: 0,
    mostUsedEmoji: '',
    completionRate: 0
  });

  useEffect(() => {
    const calculateInsights = async () => {
      const emojiData = await getEmojis();
      
      // Calculate most used emoji
      const emojiCounts = emojiData.reduce((acc: {[key: string]: number}, curr) => {
        acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
        return acc;
      }, {});
      const mostUsedEmoji = Object.entries(emojiCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '👍';

      // Calculate segment read counts and book counts
      const segmentCounts: {[key: string]: number} = {};
      const bookCounts: {[key: string]: number} = {};

      Object.entries(completedSegments).forEach(([segmentId, seg]) => {
        if (seg.isCompleted) {
          // Count segment reads using the key as the ID
          segmentCounts[segmentId] = (segmentCounts[segmentId] || 0) + 1;
          
          // Count book reads
          const book = SegmentTitles[segmentId]?.book[0] || 'Unknown';
          bookCounts[book] = (bookCounts[book] || 0) + 1;
        }
      });

      // Find favorite book and segment
      const favoriteBookKey = Object.entries(bookCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Gen';
      
      // Map short book name to full name (you'll need to create this mapping)
      const bookNameMapping: { [key: string]: string } = {
        'Gen': 'Genesis',
        'Exo': 'Exodus',
        // ... add other book mappings
      };

      const favoriteSegmentId = Object.entries(segmentCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0];

      setInsights({
        favoriteBook: favoriteBookKey,
        favoriteBookFullName: bookNameMapping[favoriteBookKey] || favoriteBookKey,
        favoriteSegmentId,
        favoriteSegment: favoriteSegmentId 
          ? SegmentTitles[favoriteSegmentId]?.title || 'Unknown'
          : 'Not enough data',
        readingStreak: 12,
        mostUsedEmoji,
        completionRate: Math.round((Object.keys(completedSegments).length / Object.keys(SegmentTitles).length) * 100)
      });
    };

    calculateInsights();
  }, [completedSegments]);

  const handleBookPress = () => {
    // Find first segment of favorite book
    const firstSegment = Object.entries(SegmentTitles).find(([_, data]) => 
      data.book[0] === insights.favoriteBook
    );
    if (firstSegment) {
      router.push({
        pathname: "/[segment]",
        params: {
          segment: `ENG-NLT-${firstSegment[0]}`,
          book: insights.favoriteBook
        }
      });
    }
  };

  const handleStoryPress = () => {
    if (insights.favoriteSegmentId) {
      router.push({
        pathname: "/[segment]",
        params: {
          segment: `ENG-NLT-${insights.favoriteSegmentId}`,
          book: SegmentTitles[insights.favoriteSegmentId]?.book[0] || ''
        }
      });
    }
  };

  const handleEmojiPress = () => {
    router.push({
      pathname: "/Reading-emoji",
      params: { selectedEmoji: insights.mostUsedEmoji }
    });
  };

  // Define icon colors that work well in both light and dark modes
  const getIconColor = (index: number) => {
    const colors = [
      'rgba(33, 150, 243, 0.15)', // Blue with higher opacity
      'rgba(76, 175, 80, 0.15)', // Green with higher opacity
      'rgba(255, 87, 51, 0.15)', // Orange with higher opacity
      'rgba(156, 39, 176, 0.15)', // Purple with higher opacity
    ];
    return colors[index % colors.length];
  };

  const getIconTextColor = (index: number) => {
    const colors = ['#1976D2', '#388E3C', '#E64A19', '#7B1FA2'];
    return colors[index % colors.length];
  };

  const getIconName = (index: number) => {
    const icons = ['book-outline', 'bookmark-outline', 'heart-outline', 'stats-chart-outline'];
    return icons[index % icons.length];
  };

  return (
    <View style={styles.section}>
      <Text style={localStyles.sectionTitle}>{t('UI.home.readingJourney')}</Text>
      <View style={styles.insightCards}>
        <Pressable 
          style={({pressed}) => [
            styles.insightCard,
            pressed && styles.insightCardPressed
          ]}
          onPress={handleBookPress}
        >
          <View style={[localStyles.insightIcon, { backgroundColor: getIconColor(0) }]}>
            <Ionicons name={getIconName(0) as any} size={22} color={getIconTextColor(0)} />
          </View>
          <Text style={styles.insightTitle}>{t('UI.home.favoriteBook')}</Text>
          <Text style={styles.insightValue}>{insights.favoriteBookFullName}</Text>
        </Pressable>

        <Pressable 
          style={({pressed}) => [
            styles.insightCard,
            pressed && styles.insightCardPressed
          ]}
          onPress={handleStoryPress}
        >
          <View style={[localStyles.insightIcon, { backgroundColor: getIconColor(1) }]}>
            <Ionicons name={getIconName(1) as any} size={22} color={getIconTextColor(1)} />
          </View>
          <Text style={styles.insightTitle}>{t('UI.home.favoriteStory')}</Text>
          <Text style={styles.insightValue} numberOfLines={2}>{insights.favoriteSegment}</Text>
        </Pressable>

        <Pressable 
          style={({pressed}) => [
            styles.insightCard,
            pressed && styles.insightCardPressed
          ]}
          onPress={handleEmojiPress}
        >
          <View style={[localStyles.insightIcon, { backgroundColor: getIconColor(2) }]}>
            <Ionicons name={getIconName(2) as any} size={22} color={getIconTextColor(2)} />
          </View>
          <Text style={styles.insightTitle}>{t('UI.home.mostUsedReaction')}</Text>
          <Text style={styles.insightValue}>{insights.mostUsedEmoji}</Text>
        </Pressable>

        <View style={styles.insightCard}>
          <View style={[localStyles.insightIcon, { backgroundColor: getIconColor(3) }]}>
            <Ionicons name={getIconName(3) as any} size={22} color={getIconTextColor(3)} />
          </View>
          <Text style={styles.insightTitle}>{t('UI.home.completion')}</Text>
          <Text style={styles.insightValue}>{insights.completionRate}%</Text>
        </View>
      </View>
    </View>
  );
};

// Add this helper function to get the story for current day of year
const getStoryForDayOfYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Get all story segments (exclude introductions)
  const allStories = Object.keys(SegmentTitles).filter(seg => seg.startsWith('S'));
  
  // Map day of year to story (365 stories cycle)
  const storyIndex = (dayOfYear - 1) % allStories.length;
  return allStories[storyIndex];
};

// Add this type definition before the ReadingDashboard component
type ReadingDashboardProps = {
  activePlan: any;
  activeChallenges: Record<string, any>;
  lastReadSegment: string | null;
  styles: Record<string, any>;
  colors: ColorScheme;
  onPlanPress: (planId: string) => void;
  onChallengePress: (challengeId: string) => void;
  onContinueReading: () => void;
};

// Update the ReadingDashboard component with ultra-compact design
const ReadingDashboard = ({ 
  activePlan, 
  activeChallenges, 
  lastReadSegment,
  styles, 
  colors, 
  onPlanPress, 
  onChallengePress,
  onContinueReading 
}: ReadingDashboardProps) => {
  const { sizes } = useFontSize();
  const { completedSegments } = useAppContext();
  
  // Get active challenges (not paused or completed)
  const activeActiveChallenges = Object.entries(activeChallenges).filter(
    ([_, challenge]) => challenge && !challenge.isPaused && !challenge.isCompleted
  );
  
  // Check if user has any active content (plan OR active challenges)
  const hasActiveContent = activePlan || activeActiveChallenges.length > 0;
  const hasReadStories = Object.values(completedSegments).some(segment => segment.isCompleted);
  
  const localStyles = StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: sizes.title,
      fontWeight: '800',
      marginBottom: 12,
      color: colors.text,
      letterSpacing: -0.5,
    },
    // Ultra-compact card design - 3 lines max
    compactCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
    },
    // Line 1: Icon + Title + Button
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    cardIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12, // Changed from marginBottom to marginRight for horizontal layout
    },
    cardInfo: {
      flex: 1,
    },
    cardTitle: {
      fontSize: sizes.caption + 1,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 1,
    },
    // Line 2: Next story preview
    cardPreview: {
      fontSize: 11,
      color: colors.secondary,
      marginBottom: 1,
    },
    // Line 3: Progress + Button
    cardBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    progressInfo: {
      fontSize: 10,
      color: colors.secondary,
      fontWeight: '500',
    },
    miniButton: {
      backgroundColor: '#2196F3',
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    miniButtonText: {
      color: '#FFF',
      fontSize: 11,
      fontWeight: '600',
      marginLeft: 3,
    },
    gridContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    gridItem: {
      flex: 1,
    },
    // Fallback card for when no active content
    fallbackCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
    },
    fallbackIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(33, 150, 243, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    fallbackTitle: {
      fontSize: sizes.subtitle,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
      textAlign: 'center',
    },
    fallbackSubtitle: {
      fontSize: sizes.caption,
      color: colors.secondary,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 18,
    },
    previewSection: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 8,
      marginBottom: 16,
    },
    previewLabel: {
      fontSize: 11,
      color: colors.secondary,
      fontWeight: '500',
      marginBottom: 2,
    },
    previewTitle: {
      fontSize: sizes.caption,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 1,
    },
    previewReference: {
      fontSize: 11,
      color: colors.secondary,
    },
    actionButton: {
      backgroundColor: '#FF5733',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
  });

  // Helper function to calculate progress percentage
  const calculateProgress = (completed: string[], planData: any) => {
    if (!planData?.segments) return 0;
    const totalSegments = Object.values(planData.segments)
      .flatMap((book: any) => book?.segments || [])
      .filter(seg => !seg.startsWith('I')).length;
    return Math.round((completed.length / totalSegments) * 100);
  };

  // Helper function to get next segment info
  const getNextSegmentInfo = (segments: string[], completedSegments: string[]) => {
    const nextSegment = segments.find(segId => !completedSegments.includes(segId));
    if (!nextSegment) return null;
    
    const segmentData = SegmentTitles[nextSegment as keyof typeof SegmentTitles];
    return {
      segmentId: nextSegment,
      title: segmentData?.title || 'Unknown',
      reference: segmentData?.ref || ''
    };
  };

  // Get plan data and next segment
  const getPlanData = () => {
    if (!activePlan) return null;
    const planData = ReadingPlansChallenges.plans.find(p => p.id === activePlan.planId);
    if (!planData) return null;
    
    const allSegments = Object.values(planData.segments)
      .flatMap(book => book?.segments || [])
      .filter(seg => !seg.startsWith('I'));
    
    const nextSegmentInfo = getNextSegmentInfo(allSegments, activePlan.completedSegments);
    
    return {
      ...planData,
      nextSegment: nextSegmentInfo,
      progress: calculateProgress(activePlan.completedSegments, planData)
    };
  };

  // Get challenge data and next segment
  const getChallengeData = (challengeId: string, challenge: any) => {
    const challengeData = ReadingPlansChallenges.challenges.find(c => c.id === challengeId);
    if (!challengeData) return null;
    
    const allSegments = Object.values(challengeData.segments)
      .flatMap(book => book?.segments || [])
      .filter(seg => !seg.startsWith('I'));
    
    const nextSegmentInfo = getNextSegmentInfo(allSegments, challenge.completedSegments);
    
    return {
      ...challengeData,
      nextSegment: nextSegmentInfo,
      progress: calculateProgress(challenge.completedSegments, challengeData)
    };
  };

  // Get adaptive free reading info based on day of year
  const getFreeReadingInfo = () => {
    if (!hasReadStories) {
      // First time user - go to "God Creates" (S001)
      const firstStory = SegmentTitles['S001'];
      return {
        title: 'Jump Straight In',
        subtitle: 'Start with the very beginning of the Bible',
        nextSegment: {
          segmentId: 'S001',
          title: firstStory?.title || 'God Creates',
          reference: firstStory?.ref || 'Genesis 1-2'
        }
      };
    } else {
      // User has read stories - show day of year story
      const dayStory = getStoryForDayOfYear();
      const storyData = SegmentTitles[dayStory as keyof typeof SegmentTitles];
      return {
        title: 'Jump Straight In',
        subtitle: 'Continue with today\'s suggested reading',
        nextSegment: {
          segmentId: dayStory,
          title: storyData?.title || 'Bible Story',
          reference: storyData?.ref || ''
        }
      };
    }
  };

  const planData = getPlanData();
  const freeReadingInfo = getFreeReadingInfo();

  // Show fallback card when no active content OR all challenges are paused
  if (!hasActiveContent) {
    return (
      <View style={localStyles.container}>
        <Text style={localStyles.sectionTitle}>Continue Your Journey</Text>
        <View style={localStyles.fallbackCard}>
          <View style={localStyles.fallbackIcon}>
            <Ionicons name="book-outline" size={24} color="#2196F3" />
          </View>
          <Text style={localStyles.fallbackTitle}>{freeReadingInfo.title}</Text>
          <Text style={localStyles.fallbackSubtitle}>{freeReadingInfo.subtitle}</Text>
          
          {freeReadingInfo.nextSegment && (
            <View style={localStyles.previewSection}>
              <Text style={localStyles.previewLabel}>NEXT STORY</Text>
              <Text style={localStyles.previewTitle}>{freeReadingInfo.nextSegment.title}</Text>
              {freeReadingInfo.nextSegment.reference && (
                <Text style={localStyles.previewReference}>{freeReadingInfo.nextSegment.reference}</Text>
              )}
            </View>
          )}
          
          <Pressable 
            style={({ pressed }) => [
              localStyles.actionButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
            ]}
            onPress={onContinueReading}
          >
            <Ionicons name="play" size={18} color="#FFF" />
            <Text style={localStyles.buttonText}>Start Reading</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={localStyles.container}>
      <Text style={localStyles.sectionTitle}>Your Active Reading</Text>
      
      {/* Ultra-Compact Active Plan - 3 lines only */}
      {activePlan && planData && (
        <View style={localStyles.compactCard}>
          {/* Line 1: Icon + Title + Progress */}
          <View style={localStyles.cardRow}>
            <View style={localStyles.cardLeft}>
              <View style={[localStyles.cardIcon, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                <Ionicons name="calendar" size={20} color="#4CAF50" />
              </View>
              <View style={localStyles.cardInfo}>
                <Text style={localStyles.cardTitle}>{planData.title}</Text>
                {/* Line 2: Next story preview */}
                <Text style={localStyles.cardPreview} numberOfLines={1}>
                  Next: {planData.nextSegment?.title || 'Completed!'}
                </Text>
              </View>
            </View>
            <Pressable 
              style={({ pressed }) => [
                localStyles.miniButton,
                { backgroundColor: '#4CAF50' },
                pressed && { opacity: 0.9 }
              ]}
              onPress={() => onPlanPress(activePlan.planId)}
            >
              <Ionicons name="arrow-forward" size={10} color="#FFF" />
              <Text style={localStyles.miniButtonText}>Continue</Text>
            </Pressable>
          </View>
          {/* Line 3: Progress info */}
          <View style={localStyles.cardBottom}>
            <Text style={localStyles.progressInfo}>{planData.progress}% complete</Text>
          </View>
        </View>
      )}

      {/* Ultra-Compact Active Challenges - 3 lines only */}
      {activeActiveChallenges.length > 0 && (
        <>
          {activeActiveChallenges.slice(0, 2).map(([challengeId, challenge]) => {
            const challengeDataWithNext = getChallengeData(challengeId, challenge);
            if (!challengeDataWithNext) return null;

            return (
              <View key={challengeId} style={localStyles.compactCard}>
                {/* Line 1: Icon + Title + Button */}
                <View style={localStyles.cardRow}>
                  <View style={localStyles.cardLeft}>
                    <View style={[localStyles.cardIcon, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
                      <Ionicons name="flag-outline" size={20} color="#FF9800" />
                    </View>
                    <View style={localStyles.cardInfo}>
                      <Text style={localStyles.cardTitle} numberOfLines={1}>
                        {challengeDataWithNext.title}
                      </Text>
                      {/* Line 2: Next story preview */}
                      <Text style={localStyles.cardPreview} numberOfLines={1}>
                        Next: {challengeDataWithNext.nextSegment?.title || 'Completed!'}
                      </Text>
                    </View>
                  </View>
                  <Pressable 
                    style={({ pressed }) => [
                      localStyles.miniButton,
                      { backgroundColor: '#FF9800' },
                      pressed && { opacity: 0.9 }
                    ]}
                    onPress={() => onChallengePress(challengeId)}
                  >
                    <Ionicons name="arrow-forward" size={10} color="#FFF" />
                    <Text style={localStyles.miniButtonText}>Continue</Text>
                  </Pressable>
                </View>
                {/* Line 3: Progress info */}
                <View style={localStyles.cardBottom}>
                  <Text style={localStyles.progressInfo}>
                    {challengeDataWithNext.progress}% complete
                  </Text>
                </View>
              </View>
            );
          })}
        </>
      )}
    </View>
  );
};

const HomeScreen = () => {
  const { 
    activePlan,
    activeChallenges,
    lastReadSegment,
    setLastReadSegment,
    completedSegments,
    updateSegmentId,
  } = useAppContext();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { sizes } = useFontSize();
  const { colors } = useAppSettings();
  const { t } = useTranslation();
  const styles = createStyles(width >= 768, colors);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [celebrationModal, setCelebrationModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'plan' | 'challenge' | 'streak' | 'milestone' | 'book' | 'story';
    stats?: any;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'streak',
  });

  // Move localStyles creation AFTER the hooks are called
  const localStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    welcomeTitle: {
      color: colors.text,
      fontSize: sizes.title,
      fontWeight: '800',
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    welcomeText: {
      color: colors.textSecondary,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "400",
    },
    welcomeSection: {
      marginTop: 20,
      marginBottom: 20, // Reduced from 28
    },
    sectionTitle: {
      fontSize: sizes.title,
      fontWeight: '800',
      marginBottom: 12, // Reduced from 16
      color: colors.text,
      letterSpacing: -0.5,
    },
    featuredGrid: {
      flexDirection: 'row',
      gap: 12, // Reduced from 16
      marginBottom: 20, // Reduced from 24
    },
    featuredCard: {
      flex: 1,
      height: 140, // Reduced from 200 for more compact design
      borderRadius: 16, // Slightly reduced for consistency
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 }, // Reduced shadow
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    gradientContainer: {
      flex: 1,
      padding: 16, // Reduced padding for more compact design
      borderRadius: 16,
      position: 'relative',
    },
    cardContent: {
      flex: 1,
      justifyContent: 'space-between',
      zIndex: 2,
    },
    cardIcon: {
      width: 40, // Smaller icon for compact design
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8, // Reduced spacing
      backgroundColor: 'rgba(255,255,255,0.25)',
    },
    cardTextSection: {
      flex: 1,
      justifyContent: 'center',
      marginVertical: 4,
    },
    cardTitle: {
      fontSize: 16, // Reduced for compact design
      fontWeight: '700', // Slightly less bold
      color: '#FFF',
      marginBottom: 2,
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      letterSpacing: -0.2,
    },
    cardBadge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.25)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      marginTop: 6, // Reduced spacing
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#FFF',
      textShadowColor: 'rgba(0,0,0,0.25)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    cardAccent: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 40, // Smaller accent for compact design
      height: 40,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderBottomLeftRadius: 20,
    },
    cardGlow: {
      display: 'none',
    },
    // Consistent stats section styling
    statsContainer: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 20, // Reduced and consistent
    },
    statItem: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12, // Consistent with other cards
      padding: 12, // Reduced padding
      alignItems: "center",
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 }, // Consistent shadow
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
    },
    statNumber: {
      color: colors.text,
      fontSize: 20, // Slightly reduced
      fontWeight: "800",
      marginBottom: 2,
    },
    statLabel: {
      color: colors.secondary,
      fontSize: 11, // Slightly reduced
      fontWeight: "500",
    },
    statIcon: {
      marginBottom: 6, // Reduced spacing
      width: 32, // Smaller icon
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Improved section spacing
    insightsSection: {
      marginBottom: 20, // Consistent spacing
    },
    activeReadingSection: {
      marginBottom: 20, // Consistent spacing
    },
    streakSection: {
      marginBottom: 20,
    },
  });

  // Add useEffect to fetch streak data
  useEffect(() => {
    const loadStreak = async () => {
      const streak = await getCurrentStreak();
      setCurrentStreak(streak);
    };
    
    loadStreak();
  }, [completedSegments]);

  // Calculate available plans (excluding SchoolYear2, SchoolYear3, and test plans)
  const getAvailablePlansCount = () => {
    return ReadingPlansChallenges.plans.filter(plan => 
      !['SchoolYear2', 'SchoolYear3', 'test'].includes(plan.id)
    ).length;
  };

  // Calculate available challenges
  const getAvailableChallengesCount = () => {
    return ReadingPlansChallenges.challenges.length;
  };

  // Calculate total active plans/challenges
  const getActivePlansCount = () => {
    const activePlansCount = activePlan ? 1 : 0; // Can only have one active plan
    const activeChallengesCount = Object.values(activeChallenges).filter(
      challenge => challenge && !challenge.isPaused && !challenge.isCompleted
    ).length;
    
    return activePlansCount + activeChallengesCount;
  };

  // Calculate total completed segments
  const getCompletedStoriesCount = () => {
    return Object.values(completedSegments).filter(segment => segment.isCompleted).length;
  };

  const handleScroll = (event: any) => {
    // Implementation of handleScroll function
  };

  const handleContinueReading = async () => {
    const hasReadStories = Object.values(completedSegments).some(segment => segment.isCompleted);
    
    if (!hasReadStories) {
      // First time user - go to "God Creates" (S001)
      await setLastReadSegment('S001');
      await updateSegmentId(`ENG-NLT-S001`);
      router.push({
        pathname: "/[segment]",
        params: {
          segment: `ENG-NLT-S001`,
          book: 'Gen'
        }
      });
      return;
    }

    // Check if user has active plans/challenges (not paused)
    const activeActiveChallenges = Object.values(activeChallenges).filter(
      challenge => challenge && !challenge.isPaused && !challenge.isCompleted
    );
    const hasActiveContent = activePlan || activeActiveChallenges.length > 0;

    if (!hasActiveContent) {
      // No active content - use day of year story
      const dayStory = getStoryForDayOfYear();
      await setLastReadSegment(dayStory);
      await updateSegmentId(`ENG-NLT-${dayStory}`);
      const segmentData = SegmentTitles[dayStory as keyof typeof SegmentTitles];
      router.push({
        pathname: "/[segment]",
        params: {
          segment: `ENG-NLT-${dayStory}`,
          book: segmentData?.book[0] || ''
        }
      });
      return;
    }

    // Existing logic for free reading when user has active content
    if (!lastReadSegment) {
      await setLastReadSegment('S001');
      await updateSegmentId(`ENG-NLT-S001`);
      router.push({
        pathname: "/[segment]",
        params: {
          segment: `ENG-NLT-S001`,
          book: 'Gen'
        }
      });
      return;
    }

    const currentIndex = segIDs.indexOf(lastReadSegment);
    let nextSegment = segIDs[currentIndex + 1];
    
    // Skip any introduction segments
    while (nextSegment && nextSegment.startsWith('I')) {
      const skipIndex = segIDs.indexOf(nextSegment);
      nextSegment = segIDs[skipIndex + 1];
    }

    if (nextSegment) {
      // If there's a next segment, go to it
      await setLastReadSegment(nextSegment);
      await updateSegmentId(`ENG-NLT-${nextSegment}`);
      const segment = SegmentTitles[nextSegment as keyof typeof SegmentTitles];
      router.push({
        pathname: "/[segment]",
        params: {
          segment: `ENG-NLT-${nextSegment}`,
          book: segment?.book[0] || ''
        }
      });
    } else {
      // If no next segment (or at the end), resume the last segment
      await updateSegmentId(`ENG-NLT-${lastReadSegment}`);
      const segment = SegmentTitles[lastReadSegment as keyof typeof SegmentTitles];
      router.push({
        pathname: "/[segment]",
        params: {
          segment: `ENG-NLT-${lastReadSegment}`,
          book: segment?.book[0] || ''
        }
      });
    }
  };

  const handleComplete = async () => {
    await updateSegmentId(`ENG-NLT-${lastReadSegment}`);
    const segment = SegmentTitles[lastReadSegment as keyof typeof SegmentTitles];
    router.push({
      pathname: "/[segment]",
      params: {
        segment: `ENG-NLT-${lastReadSegment}`,
        book: segment?.book[0] || ''
      }
    });
  };

  const combinedStyles: SectionStyles = {
    ...styles,
    colors,
    text: {
      title: sizes.title,
      subtitle: sizes.subtitle,
      body: sizes.body,
      caption: sizes.caption,
      button: sizes.button,
    }
  };

  // Add these handler functions
  const handlePlanPress = async (planId: string) => {
    const planData = ReadingPlansChallenges.plans.find(p => p.id === planId);
    if (!planData || !activePlan) return;

    const allSegments = Object.values(planData.segments)
      .flatMap(book => book?.segments || [])
      .filter(seg => !seg.startsWith('I'));
    
    const nextSegment = allSegments.find(segId => !activePlan.completedSegments.includes(segId));
    
    if (nextSegment) {
      await updateSegmentId(`ENG-NLT-${nextSegment}`);
      const segmentData = SegmentTitles[nextSegment as keyof typeof SegmentTitles];
      router.push({
        pathname: "/[segment]",
        params: {
          segment: `ENG-NLT-${nextSegment}`,
          book: segmentData?.book[0] || '',
          planId: planId
        }
      });
    }
  };

  const handleChallengePress = async (challengeId: string) => {
    const challengeData = ReadingPlansChallenges.challenges.find(c => c.id === challengeId);
    const challenge = activeChallenges[challengeId];
    if (!challengeData || !challenge) return;

    const allSegments = Object.values(challengeData.segments)
      .flatMap(book => book?.segments || [])
      .filter(seg => !seg.startsWith('I'));
    
    const nextSegment = allSegments.find(segId => !challenge.completedSegments.includes(segId));
    
    if (nextSegment) {
      await updateSegmentId(`ENG-NLT-${nextSegment}`);
      const segmentData = SegmentTitles[nextSegment as keyof typeof SegmentTitles];
      router.push({
        pathname: "/[segment]",
        params: {
          segment: `ENG-NLT-${nextSegment}`,
          book: segmentData?.book[0] || '',
          challengeId: challengeId
        }
      });
    }
  };

  return (
    <View style={localStyles.container}>
      <CustomHeader 
        leftComponent={
          <Pressable 
            style={({ pressed }) => [
              styles.headerIcon,
              pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }
            ]}
            onPress={() => router.push("/about")}
          >
            <Ionicons name="information-circle-outline" size={24} color={colors.text} />
          </Pressable>
        }
        rightComponent={
          <Pressable 
            style={({ pressed }) => [
              styles.headerIcon,
              pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }
            ]}
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </Pressable>
        }
      />
      <ScrollView 
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={localStyles.welcomeSection}>
          <Text style={localStyles.welcomeTitle}>Start your Journey</Text>
          <Text style={localStyles.welcomeText}>
            Begin your Bible reading adventure by choosing a reading plan or challenge that fits your goals.
          </Text>
        </View>

        <View style={styles.featuredSection}>
          <Text style={localStyles.sectionTitle}>Get Started</Text>
          <View style={localStyles.featuredGrid}>
            {/* Reading Plans Card with Enhanced Gradient */}
            <Pressable 
              style={({ pressed }) => [
                localStyles.featuredCard,
                pressed && { 
                  transform: [{ scale: 0.98 }], 
                  opacity: 0.95 
                }
              ]}
              onPress={() => router.push("/Plan")}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={localStyles.gradientContainer}
              >
                <View style={localStyles.cardContent}>
                  <View style={localStyles.cardIcon}>
                    <Ionicons name="calendar-outline" size={22} color="#FFF" />
                  </View>
                  <View style={localStyles.cardTextSection}>
                    <Text style={localStyles.cardTitle}>Reading Plans</Text>
                  </View>
                  <View style={localStyles.cardBadge}>
                    <Text style={localStyles.badgeText}>{getAvailablePlansCount()} Plans</Text>
                  </View>
                </View>
                <View style={localStyles.cardAccent} />
              </LinearGradient>
            </Pressable>

            {/* Reading Challenges Card with Enhanced Gradient */}
            <Pressable 
              style={({ pressed }) => [
                localStyles.featuredCard,
                pressed && { 
                  transform: [{ scale: 0.98 }], 
                  opacity: 0.95 
                }
              ]}
              onPress={() => router.push("/Reading-Challenges")}
            >
              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={localStyles.gradientContainer}
              >
                <View style={localStyles.cardContent}>
                  <View style={localStyles.cardIcon}>
                    <Ionicons name="flag-outline" size={22} color="#FFF" />
                  </View>
                  <View style={localStyles.cardTextSection}>
                    <Text style={localStyles.cardTitle}>Challenges</Text>
                  </View>
                  <View style={localStyles.cardBadge}>
                    <Text style={localStyles.badgeText}>New</Text>
                  </View>
                </View>
                <View style={localStyles.cardAccent} />
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        {/* Replace both ActivePlansAndChallengesSection and ContinueReadingSection with the unified dashboard */}
        <View style={localStyles.activeReadingSection}>
          <ReadingDashboard
            activePlan={activePlan}
            activeChallenges={activeChallenges}
            lastReadSegment={lastReadSegment}
            styles={combinedStyles}
            colors={colors}
            onPlanPress={handlePlanPress}
            onChallengePress={handleChallengePress}
            onContinueReading={handleContinueReading}
          />
        </View>

        <View style={localStyles.streakSection}>
          <StreakCounter
            currentStreak={currentStreak}
            bestStreak={15} // You can get this from context or API
            lastReadDate={new Date().toISOString().split('T')[0]} // Today for demo
            onPress={() => router.push('/Achievements')}
            compact={false}
          />
        </View>

        <View style={localStyles.statsContainer}>
          <View style={localStyles.statItem}>
            <View style={[localStyles.statIcon, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
              <Ionicons name="book-outline" size={18} color="#4CAF50" />
            </View>
            <Text style={localStyles.statNumber}>{getCompletedStoriesCount()}</Text>
            <Text style={localStyles.statLabel}>Stories Read</Text>
          </View>
          <View style={localStyles.statItem}>
            <View style={[localStyles.statIcon, { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}>
              <Ionicons name="list-outline" size={18} color="#2196F3" />
            </View>
            <Text style={localStyles.statNumber}>{getActivePlansCount()}</Text>
            <Text style={localStyles.statLabel}>Active Plans</Text>
          </View>
        </View>

        <View style={localStyles.insightsSection}>
          <InsightsSection styles={combinedStyles} />
        </View>
        
        {/* Bottom spacing for tab bar */}
        <View style={{ height: 60 }} />
      </ScrollView>
      <CelebrationModal
        visible={celebrationModal.visible}
        onClose={() => setCelebrationModal(prev => ({ ...prev, visible: false }))}
        title={celebrationModal.title}
        message={celebrationModal.message}
        type={celebrationModal.type}
        stats={celebrationModal.stats}
      />
    </View>
  );
};

// Add default export
export default HomeScreen;