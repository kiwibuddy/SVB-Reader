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

type ReadingPlan = {
  id: string;
  title: string;
  description: string;
  image: string;
  segments: any;
};

type Challenge = {
  id: string;
  title: string;
  description: string;
  segments: string[];
};
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
import { useGroupReading } from '@/context/GroupReadingContext';
import NearbyGroupCard from '@/components/GroupReading/NearbyGroupCard';
import ReadingModeModal from '@/components/GroupReading/ReadingModeModal';
import BibleData from '@/assets/data/newBibleNLT1.json';
import { SegmentType } from '@/types';

const SegmentTitles = require("@/assets/data/SegmentTitles.json") as { [key: string]: SegmentTitle };
const Bible: { [key: string]: SegmentType } = BibleData as { [key: string]: SegmentType };

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
    paddingHorizontal: 16,
  },
  continueReading: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    paddingVertical: 8,
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
  getStartedSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.text,
    letterSpacing: -0.3,
  },
  gridContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  onboardingCard: {
    flex: 1,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onboardingCardContent: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  onboardingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  onboardingIconText: {
    fontSize: 24,
  },
  onboardingCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  onboardingCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gridItem: {
    flex: 1,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
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
  marginTop: 8,
  fontSize: 14,
  fontWeight: '700',
  color: colors.text,
},
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  gridItemTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  gridItemSubtitle: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 12,
    flexDirection: "row",
    alignItems: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  activeReadingSection: {
    marginBottom: 16,
  },
  activeReadingCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
  },
  activeReadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeReadingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activeReadingInfo: {
    flex: 1,
  },
  activeReadingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  activeReadingSubtitle: {
    fontSize: 13,
    color: colors.secondary,
    marginBottom: 2,
  },
  activeReadingProgress: {
    fontSize: 11,
    color: colors.secondary,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginLeft: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  streakCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  streakIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  streakBest: {
    fontSize: 13,
    color: colors.secondary,
    marginBottom: 12,
  },
  streakMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakCircleContainer: {
    position: 'relative',
    marginRight: 12,
  },
  streakCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  streakProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FF9800',
    borderTopColor: '#FF9800',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '-90deg' }],
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  streakDaysText: {
    fontSize: 10,
    color: colors.secondary,
    marginTop: 2,
  },
  streakTextContainer: {
    flex: 1,
  },
  streakMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  streakGoal: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  streakStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  streakStatusText: {
    fontSize: 12,
    color: colors.secondary,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.secondary,
    marginTop: 2,
    fontWeight: "500",
    textAlign: 'center',
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
    marginTop: 16,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.secondary,
    lineHeight: 22,
    fontWeight: "400",
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  nextButton: {
    backgroundColor: '#2196F3',
  },
  section: {
    marginVertical: 8,
    padding: 0,
  },
  insightCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featuredCard: {
    borderRadius: 12,
    backgroundColor: colors.card,
    padding: 16,
    marginVertical: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 160,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: colors.text,
  },
  emojiContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  emoji: {
    fontSize: 18,
    marginRight: 4,
  },
  timestamp: {
    fontSize: 11,
    color: colors.secondary,
  },
  insightCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: isLargeScreen ? '23%' : '48%',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    opacity: 1,
    borderWidth: 1,
    borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
  },
  insightCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  insightTitle: {
    fontSize: 12,
    color: colors.secondary,
    marginBottom: 6,
    fontWeight: "500",
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  gridItemImage: {
    borderRadius: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: colors.card,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    borderRadius: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF5733', // App's orange
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 16,
    left: 16,
    opacity: 0.9,
    zIndex: 2,
  },
  badge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
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
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
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
    // Show reading mode modal for the current segment
    if (lastReadSegment) {
      const segment = SegmentTitles[lastReadSegment as keyof typeof SegmentTitles];
      if (segment) {
        // Call parent's onPress to handle modal display
        onPress();
      }
    }
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
    // Navigate to Plan or Navigation to find the book instead of direct navigation
    router.push({
      pathname: "/Navigation",
    });
  };

  const handleStoryPress = () => {
    // Navigate to Navigation to find the story instead of direct navigation
    router.push({
      pathname: "/Navigation",
    });
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
  
  // Group Reading Context
  const { 
    nearbyGroups, 
    currentSession, 
    joinSession,
    setUserName,
    currentUserName,
  } = useGroupReading();
  
  const [dismissedGroups, setDismissedGroups] = useState<Set<string>>(new Set());
  
  // Reading Mode Modal State
  const [showReadingModeModal, setShowReadingModeModal] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [selectedSegmentTitle, setSelectedSegmentTitle] = useState<string>('');
  const [selectedSegmentRef, setSelectedSegmentRef] = useState<string>('');

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
    let segmentToRead = lastReadSegment;
    
    if (!lastReadSegment) {
      // For new users, start with the first story segment (S001) in Genesis
      segmentToRead = 'S001';
      await setLastReadSegment('S001');
    }

    const segmentData = SegmentTitles[segmentToRead as keyof typeof SegmentTitles];
    if (segmentData && segmentToRead) {
      setSelectedSegmentId(segmentToRead);
      setSelectedSegmentTitle(segmentData.title);
      setSelectedSegmentRef(segmentData.ref || '');
      setShowReadingModeModal(true);
    }
  };

  const handleComplete = async () => {
    // Show reading mode modal for the current segment
    if (lastReadSegment) {
      const segment = SegmentTitles[lastReadSegment as keyof typeof SegmentTitles];
      if (segment) {
        setSelectedSegmentId(lastReadSegment);
        setSelectedSegmentTitle(segment.title);
        setSelectedSegmentRef(segment.ref || '');
        setShowReadingModeModal(true);
      }
    }
  };

  const handleActivePlanContinue = async () => {
    if (!activePlan) return;
    
    // Find the next uncompleted segment in the active plan
    const plan = ReadingPlansChallenges.plans.find((p: any) => p.id === activePlan.planId);
    if (!plan?.segments) return;
    
    // Get all segments from the plan
    const allSegments = Object.values(plan.segments)
      .flatMap((book: any) => book?.segments || [])
      .filter((seg: string) => !seg.startsWith('I')); // Filter out introductions
    
    // Find the first uncompleted segment
    let nextSegmentId = null;
    for (const segmentId of allSegments) {
      if (!completedSegments[segmentId]?.isCompleted) {
        nextSegmentId = segmentId;
        break;
      }
    }
    
    // If we found a next segment, show the reading mode modal
    if (nextSegmentId) {
      const segmentData = SegmentTitles[nextSegmentId as keyof typeof SegmentTitles];
      if (segmentData) {
        setSelectedSegmentId(nextSegmentId);
        setSelectedSegmentTitle(segmentData.title);
        setSelectedSegmentRef(segmentData.ref || '');
        setShowReadingModeModal(true);
      }
    } else {
      // If no uncompleted segments, go to the plan page
      router.push("/Plan");
    }
  };

  const handleActiveChallengesContinue = async (challengeId: string) => {
    if (!activeChallenges[challengeId]) return;
    
    // Find the next uncompleted segment in the active challenge
    const challenge = ReadingPlansChallenges.challenges.find((c: any) => c.id === challengeId);
    if (!challenge?.segments) return;
    
    // Get all segments from the challenge
    const allSegments = Object.values(challenge.segments)
      .flatMap((book: any) => book?.segments || [])
      .filter((seg: string) => !seg.startsWith('I')); // Filter out introductions
    
    // Find the first uncompleted segment
    let nextSegmentId = null;
    for (const segmentId of allSegments) {
      if (!completedSegments[segmentId]?.isCompleted) {
        nextSegmentId = segmentId;
        break;
      }
    }
    
    // If we found a next segment, show the reading mode modal
    if (nextSegmentId) {
      const segmentData = SegmentTitles[nextSegmentId as keyof typeof SegmentTitles];
      if (segmentData) {
        setSelectedSegmentId(nextSegmentId);
        setSelectedSegmentTitle(segmentData.title);
        setSelectedSegmentRef(segmentData.ref || '');
        setShowReadingModeModal(true);
      }
    } else {
      // If no uncompleted segments, go to the challenges page
      router.push("/Reading-Challenges");
    }
  };

  // Group Reading Handlers
  const handleJoinGroup = async (sessionId: string) => {
    console.log('Join group:', sessionId);
    router.push({
      pathname: '/join-group' as any,
      params: { sessionId }
    });
  };

  const handleDismissGroup = (sessionId: string) => {
    setDismissedGroups(prev => new Set([...prev, sessionId]));
  };

  // Reading Mode Modal Handlers
  const handleIndividualReading = async () => {
    setShowReadingModeModal(false);
    await updateSegmentId(`ENG-NLT-${selectedSegmentId}`);
    const segment = SegmentTitles[selectedSegmentId as keyof typeof SegmentTitles];
    router.push({
      pathname: "/(tabs)/[segment]",
      params: {
        segment: `ENG-NLT-${selectedSegmentId}`,
        book: segment?.book[0] || ''
      }
    });
  };

  const handleGroupReading = () => {
    setShowReadingModeModal(false);
    router.push({
      pathname: '/group-setup' as any,
      params: {
        storyId: selectedSegmentId,
        storyTitle: selectedSegmentTitle,
        scriptureReference: selectedSegmentRef,
      }
    });
  };

  const handleCancelModal = () => {
    setShowReadingModeModal(false);
  };

  // Get story data for the modal
  const getStoryData = () => {
    if (!selectedSegmentId) {
      console.log('ReadingModeModal: No segment ID selected');
      // Return a fallback object with required properties
      return {
        id: '',
        content: [],
        colors: { total: 0, black: 0, red: 0, green: 0, blue: 0 },
        sources: {}
      };
    }
    
    const storyData = BibleData[selectedSegmentId as keyof typeof BibleData];
    const segmentData = SegmentTitles[selectedSegmentId as keyof typeof SegmentTitles];
    
    if (!storyData && !segmentData) {
      console.log('ReadingModeModal: Could not find story data for segment:', selectedSegmentId);
      // Return a fallback object with required properties
      return {
        id: selectedSegmentId,
        content: [],
        colors: { total: 0, black: 0, red: 0, green: 0, blue: 0 },
        sources: {}
      };
    }
    
    return storyData || segmentData;
  };

  // Filter nearby groups to show only non-dismissed ones
  const visibleNearbyGroups = nearbyGroups.filter(group => 
    !dismissedGroups.has(group.id) && !currentSession
  );

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
      fontSize: 24,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
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

        <View style={styles.getStartedSection}>
          <Text style={styles.sectionTitle}>Get Started</Text>
          <View style={styles.gridContainer}>
            <Pressable 
              style={[styles.onboardingCard, { backgroundColor: '#7B68EE' }]}
              onPress={() => router.push("/Plan")}
            >
              <View style={styles.onboardingCardContent}>
                <View style={styles.onboardingIconContainer}>
                  <Ionicons name="calendar-outline" size={32} color="#FFFFFF" />
                </View>
                <Text style={styles.onboardingCardTitle}>Reading Plans</Text>
                <Text style={styles.onboardingCardSubtitle}>{getAvailablePlansCount()} Plans</Text>
              </View>
            </Pressable>

            <Pressable 
              style={[styles.onboardingCard, { backgroundColor: '#FF69B4' }]}
              onPress={() => router.push("/Reading-Challenges")}
            >
              <View style={styles.onboardingCardContent}>
                <View style={styles.onboardingIconContainer}>
                  <Ionicons name="flag-outline" size={32} color="#FFFFFF" />
                </View>
                <Text style={styles.onboardingCardTitle}>Challenges</Text>
                <Text style={styles.onboardingCardSubtitle}>New</Text>
              </View>
            </Pressable>
          </View>
        </View>

      <ContinueReadingSection 
        lastReadSegment={lastReadSegment}
        onPress={handleContinueReading}
        styles={combinedStyles}
        colors={colors}
      />

        {/* Active Reading Plans */}
        {(activePlan || Object.values(activeChallenges).some(challenge => challenge && !challenge.isPaused && !challenge.isCompleted)) && (
          <View style={styles.activeReadingSection}>
            <Text style={styles.sectionTitle}>Your Active Reading</Text>
            {activePlan && (
              <View style={styles.activeReadingCard}>
                <View style={styles.activeReadingContent}>
                  <View style={[styles.activeReadingIcon, { backgroundColor: '#7B68EE' }]}>
                    <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.activeReadingInfo}>
                    <Text style={styles.activeReadingTitle}>
                      {ReadingPlansChallenges.plans.find((plan: any) => plan.id === activePlan.planId)?.title || 'Bible in 1 year'}
                    </Text>
                    <Text style={styles.activeReadingSubtitle}>
                      Next: God Creates
                    </Text>
                    <Text style={styles.activeReadingProgress}>0% complete</Text>
                  </View>
                  <Pressable style={styles.continueButton} onPress={() => handleActivePlanContinue()}>
                    <Text style={styles.continueButtonText}>→ Continue</Text>
                  </Pressable>
                </View>
              </View>
            )}
            {Object.entries(activeChallenges).map(([id, challenge]) => {
              if (!challenge || challenge.isPaused || challenge.isCompleted) return null;
              const challengeData = ReadingPlansChallenges.challenges.find((c: any) => c.id === challenge.challengeId);
              const progress = challengeData ? Math.round((challenge.completedSegments.length / 10) * 100) : 0;
              return (
                <View key={id} style={styles.activeReadingCard}>
                  <View style={styles.activeReadingContent}>
                    <View style={[styles.activeReadingIcon, { backgroundColor: '#FF69B4' }]}>
                      <Ionicons name="flag-outline" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.activeReadingInfo}>
                      <Text style={styles.activeReadingTitle}>{challengeData?.title || '12 Days of Christmas'}</Text>
                      <Text style={styles.activeReadingSubtitle}>Next: Completed!</Text>
                      <Text style={styles.activeReadingProgress}>NaN% complete</Text>
                    </View>
                    <Pressable style={styles.continueButton} onPress={() => handleActiveChallengesContinue(challenge.challengeId)}>
                      <Text style={styles.continueButtonText}>→ Continue</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Reading Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakTitle}>Reading Streak</Text>
          </View>
          <Text style={styles.streakBest}>Best: 15 days</Text>
          
          <View style={styles.streakMainContent}>
            <View style={styles.streakCircleContainer}>
              <View style={styles.streakCircle}>
                <Text style={styles.streakNumber}>{currentStreak}</Text>
                <Text style={styles.streakDaysText}>days</Text>
              </View>
              <View style={styles.streakProgress} />
            </View>
            
            <View style={styles.streakTextContainer}>
              <Text style={styles.streakMessage}>
                {currentStreak === 1 ? 'Great start! Keep it going!' : 
                 currentStreak < 7 ? `Great start! Keep it going!` :
                 'Amazing streak! Keep it up!'}
              </Text>
              <Text style={styles.streakGoal}>
                {currentStreak < 7 ? `${7 - currentStreak} more days to 7!` : 'Keep building your streak!'}
              </Text>
            </View>
          </View>
          
          <View style={styles.streakStatus}>
            <View style={styles.streakStatusDot} />
            <Text style={styles.streakStatusText}>Today's reading complete</Text>
          </View>
        </View>

        {/* Nearby Group Cards */}
        {visibleNearbyGroups.map((group) => (
          <NearbyGroupCard
            key={group.id}
            session={group}
            onJoin={() => handleJoinGroup(group.id)}
            onDismiss={() => handleDismissGroup(group.id)}
          />
        ))}

        <View style={styles.statsContainer}>
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

      <ReadingModeModal
        visible={showReadingModeModal}
        story={getStoryData()}
        storyTitle={selectedSegmentTitle}
        scriptureReference={selectedSegmentRef}
        storyId={selectedSegmentId}
        onIndividual={handleIndividualReading}
        onGroup={handleGroupReading}
        onCancel={handleCancelModal}
      />
    </View>
  );
};

// Add default export
export default HomeScreen;