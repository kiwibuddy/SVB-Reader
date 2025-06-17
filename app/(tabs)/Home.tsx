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
    position: 'relative',
  },
  gridItemWrapper: {
  flex: 1,
},
gridItemLabel: {
  textAlign: 'center',
  marginTop: 12,
  fontSize: 16,
  fontWeight: '900',
  color: colors.text,
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
    fontSize: 16,
    color: colors.secondary,
    lineHeight: 24,
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
    borderRadius: 16,
    backgroundColor: colors.card,
    padding: 16,
    marginVertical: 8,
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
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    borderRadius: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF5733', // App's orange
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 20,
    left: 20,
    opacity: 0.9,
    zIndex: 2,
  },
  badge: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
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
      marginBottom: 18,
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

  // Add useEffect to fetch streak data
  useEffect(() => {
    const loadStreak = async () => {
      const streak = await getCurrentStreak();
      setCurrentStreak(streak);
    };
    
    loadStreak();
  }, [completedSegments]); // Reload when completedSegments changes

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
    if (!lastReadSegment) {
      // For new users, start with the first story segment (S001) in Genesis
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
    },
    welcomeText: {
      color: colors.secondary,
      fontSize: sizes.body,
      lineHeight: 24,
      fontWeight: "400",
    },
    statItem: {
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
      color: colors.text,
      fontSize: 24,
      fontWeight: "800",
      marginBottom: 4,
    },
    statLabel: {
      color: colors.secondary,
      fontSize: 13,
      fontWeight: "500",
    },
    statIcon: {
      marginBottom: 8,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    }
  });

  // Define gradient colors based on theme
 /*  const getGradientColors = () => {
    return colors.isDark 
      ? ['transparent', 'rgba(0,0,0,0.8)']
      : ['transparent', 'rgba(0,0,0,0.7)'];
  }; */

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
        <View style={styles.welcomeSection}>
          <Text style={localStyles.welcomeTitle}>{t('UI.home.heading')}</Text>
          <Text style={localStyles.welcomeText}>{t('UI.home.subheading')}</Text>
        </View>

<View style={styles.gridContainer}>
  <View style={styles.gridItemWrapper}>
    <Pressable 
      style={styles.gridItem}
      onPress={() => router.push("/Plan")}
    >
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.gridItemContent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="calendar-outline" size={32} color="#fff" />
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>3 Plans</Text>
        </View>
      </LinearGradient>
    </Pressable>
    <Text style={styles.gridItemLabel}>Reading Plans</Text>
  </View>

  <View style={styles.gridItemWrapper}>
    <Pressable 
      style={styles.gridItem}
      onPress={() => router.push("/Reading-Challenges")}
    >
      <LinearGradient
        colors={[colors.secondary, colors.primary]}
        style={styles.gridItemContent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="flag-outline" size={32} color="#fff" />
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>New</Text>
        </View>
      </LinearGradient>
    </Pressable>
    <Text style={styles.gridItemLabel}>Reading Challenges</Text>
  </View>
</View>

      <ContinueReadingSection 
        lastReadSegment={lastReadSegment}
        onPress={handleContinueReading}
        styles={combinedStyles}
        colors={colors}
      />

        <View style={styles.statsContainer}>
          <View style={localStyles.statItem}>
            <View style={[localStyles.statIcon, { backgroundColor: 'rgba(255, 193, 7, 0.15)' }]}>
              <Ionicons name="flame-outline" size={20} color="#FF9800" />
            </View>
            <Text style={localStyles.statNumber}>{currentStreak}</Text>
            <Text style={localStyles.statLabel}>{t('UI.home.dayStreak')}</Text>
          </View>
          <View style={localStyles.statItem}>
            <View style={[localStyles.statIcon, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
              <Ionicons name="book-outline" size={20} color="#4CAF50" />
            </View>
            <Text style={localStyles.statNumber}>{getCompletedStoriesCount()}</Text>
            <Text style={localStyles.statLabel}>{t('UI.home.storiesRead')}</Text>
          </View>
          <View style={localStyles.statItem}>
            <View style={[localStyles.statIcon, { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}>
              <Ionicons name="list-outline" size={20} color="#2196F3" />
            </View>
            <Text style={localStyles.statNumber}>{getActivePlansCount()}</Text>
            <Text style={localStyles.statLabel}>{t('UI.home.activePlans')}</Text>
          </View>
        </View>

        <InsightsSection styles={combinedStyles} />
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

// Add default export
export default HomeScreen;