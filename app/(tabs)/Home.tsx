import React, { useEffect, useState } from "react";
import { useFocusEffect } from '@react-navigation/native';
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
import DailyStoryMap from '../../assets/data/DailyStoryMap.json';
import { getDayOfYear } from 'date-fns';
import StickyHeader from "../../components/StickyHeader";
import { useAppContext } from "@/context/GlobalContext";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { getEmojis, getCurrentStreak, getPlanProgress, getChallengeProgress, getSegmentCompletionStatus, getBestStreak } from "@/api/sqlite";
import { format, isToday, parseISO } from 'date-fns';
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
import { SegmentType, BibleType } from '@/types';

const SegmentTitles = require("@/assets/data/SegmentTitles.json") as { [key: string]: SegmentTitle };
const Bible: any = BibleData;

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
  continueButtonIcon: {
    marginLeft: 8,
    padding: 4,
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
  onPress: (segmentId?: string) => void;
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
  
  // --- TODAY'S READING: Daily Suggestion ---
  const today = new Date();
  const dayOfYear = getDayOfYear(today); // 1-based
  const dailySegmentId = (DailyStoryMap as string[])[(dayOfYear - 1) % DailyStoryMap.length];
  const dailySegment = SegmentTitles[dailySegmentId as keyof typeof SegmentTitles];

  const handleDailyStart = () => {
    if (!dailySegmentId) return;
    onPress && onPress(dailySegmentId);
  };

  // New layout: title, reference, and button in a row, styled like active reading
  if (!dailySegment) return null;
  const dailyBookName = dailySegment.book && dailySegment.book[0] ? (SegmentTitles[dailySegmentId]?.book[0] || '') : '';
  const bookNameMapping: { [key: string]: string } = {
    'Gen': 'Genesis', 'Exo': 'Exodus', 'Lev': 'Leviticus', 'Num': 'Numbers', 'Deu': 'Deuteronomy',
    'Jos': 'Joshua', 'Jdg': 'Judges', 'Rut': 'Ruth', '1Sa': '1 Samuel', '2Sa': '2 Samuel',
    '1Ki': '1 Kings', '2Ki': '2 Kings', '1Ch': '1 Chronicles', '2Ch': '2 Chronicles', 'Ezr': 'Ezra',
    'Neh': 'Nehemiah', 'Est': 'Esther', 'Job': 'Job', 'Psa': 'Psalms', 'Pro': 'Proverbs',
    'Ecc': 'Ecclesiastes', 'SoS': 'Song of Solomon', 'Isa': 'Isaiah', 'Jer': 'Jeremiah', 'Lam': 'Lamentations',
    'Eze': 'Ezekiel', 'Dan': 'Daniel', 'Hos': 'Hosea', 'Joe': 'Joel', 'Amo': 'Amos', 'Oba': 'Obadiah',
    'Jon': 'Jonah', 'Mic': 'Micah', 'Nah': 'Nahum', 'Hab': 'Habakkuk', 'Zep': 'Zephaniah', 'Hag': 'Haggai',
    'Zec': 'Zechariah', 'Mal': 'Malachi', 'Mat': 'Matthew', 'Mar': 'Mark', 'Luk': 'Luke', 'Joh': 'John',
    'Act': 'Acts', 'Rom': 'Romans', '1Co': '1 Corinthians', '2Co': '2 Corinthians', 'Gal': 'Galatians',
    'Eph': 'Ephesians', 'Php': 'Philippians', 'Col': 'Colossians', '1Th': '1 Thessalonians', '2Th': '2 Thessalonians',
    '1Ti': '1 Timothy', '2Ti': '2 Timothy', 'Tit': 'Titus', 'Phm': 'Philemon', 'Heb': 'Hebrews', 'Jam': 'James',
    '1Pe': '1 Peter', '2Pe': '2 Peter', '1Jn': '1 John', '2Jn': '2 John', '3Jn': '3 John', 'Jud': 'Jude', 'Rev': 'Revelation'
  };
  const dailyBookFullName = bookNameMapping[dailyBookName] || dailyBookName;
  return (
    <View style={styles.activeReadingCard}>
      <View style={styles.activeReadingContent}>
        <View style={[styles.activeReadingIcon, { backgroundColor: '#4CAF50' }]}> 
          <Ionicons name="book-outline" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.activeReadingInfo}>
          <Text style={styles.activeReadingTitle}>Today's Reading</Text>
          <Text style={styles.activeReadingSubtitle}>
            {dailySegment.title}
          </Text>
          <Text style={styles.activeReadingSubtitle}>
            {dailyBookFullName}
            {dailySegment.ref ? ` (${dailySegment.ref})` : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.continueButtonIcon} onPress={handleDailyStart}>
          <Ionicons name="play-circle-outline" size={24} color="#666666" />
        </TouchableOpacity>
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

// Challenge color definitions
const CHALLENGE_STYLES = {
  "Paul's Letters": { color: "#4df469" },
  "David's Life": { color: "#f44d69" },
  "Advent Journey": { color: "#694df4" },
  "Lenten Reflection": { color: "#4d9ff4" },
  "12 Days of Christmas": { color: "#f4b64d" },
  "The Gospels": { color: "#4dcaf4" },
  "The Torah": { color: "#9f4df4" },
  "In The Beginning": { color: "#f4944d" },
  "New Testament Journey": { color: "#FF69B4" },
  "Old Testament Journey": { color: "#8B4513" }
};

// Plan color definitions
const PLAN_STYLES = {
  "Bible1Year": { color: "#7B68EE" },
  "NT100Days": { color: "#32CD32" },
  "SchoolYear1": { color: "#FF6347" }
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
      const emojiCounts = emojiData.reduce((acc: {[key: string]: number}, curr: any) => {
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
  }, []); // Only run once on mount to avoid infinite re-renders

  // Refresh insights when returning to Home screen
  useFocusEffect(
    React.useCallback(() => {
      const calculateInsights = async () => {
        const emojiData = await getEmojis();
        
        // Calculate most used emoji
        const emojiCounts = emojiData.reduce((acc: {[key: string]: number}, curr: any) => {
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
        
        // Map short book name to full name
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
    }, [])
  );

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
  const [bestStreak, setBestStreak] = useState(0);
  const [isTodayComplete, setIsTodayComplete] = useState(false);
  
  // Add state for real progress data
  const [planProgress, setPlanProgress] = useState<{
    totalSegments: number;
    completedSegments: number;
    progressPercentage: number;
    nextSegmentId: string | null;
    nextSegmentTitle: string | null;
  } | null>(null);
  
  const [challengeProgresses, setChallengeProgresses] = useState<{
    [challengeId: string]: {
      totalSegments: number;
      completedSegments: number;
      progressPercentage: number;
      nextSegmentId: string | null;
      nextSegmentTitle: string | null;
    }
  }>({});
  
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
    const loadStreakData = async () => {
      const [currentStreakValue, bestStreakValue] = await Promise.all([
        getCurrentStreak(),
        getBestStreak()
      ]);
      
      setCurrentStreak(currentStreakValue);
      setBestStreak(bestStreakValue);
      
      // Find the most recent completed segment date
      let latestDate: string | null = null;
      Object.values(completedSegments).forEach((seg: any) => {
        if (seg.isCompleted && seg.completionDate) {
          if (!latestDate || seg.completionDate > latestDate) {
            latestDate = seg.completionDate;
          }
        }
      });
      setIsTodayComplete(latestDate ? isToday(parseISO(latestDate)) : false);
    };
    
    loadStreakData();
  }, []); // Only run once on mount to avoid infinite re-renders

  // Refresh streak data when returning to Home screen
  useFocusEffect(
    React.useCallback(() => {
      const loadStreakData = async () => {
        const [currentStreakValue, bestStreakValue] = await Promise.all([
          getCurrentStreak(),
          getBestStreak()
        ]);
        
        setCurrentStreak(currentStreakValue);
        setBestStreak(bestStreakValue);
        
        // Find the most recent completed segment date
        let latestDate: string | null = null;
        Object.values(completedSegments).forEach((seg: any) => {
          if (seg.isCompleted && seg.completionDate) {
            if (!latestDate || seg.completionDate > latestDate) {
              latestDate = seg.completionDate;
            }
          }
        });
        setIsTodayComplete(latestDate ? isToday(parseISO(latestDate)) : false);
      };
      
      loadStreakData();
    }, [])
  );

  // Add useEffect to load real progress data
  // Initial load for progress data (runs once)
  useEffect(() => {
    const loadProgressData = async () => {
      // Load plan progress
      if (activePlan) {
        const progress = await getPlanProgress(activePlan.planId);
        const nextSegment = await getNextSegmentForPlan(activePlan.planId);
        setPlanProgress({
          totalSegments: progress.totalSegments,
          completedSegments: progress.completedSegments,
          progressPercentage: progress.progressPercentage,
          nextSegmentId: nextSegment?.segmentId || null,
          nextSegmentTitle: nextSegment?.title || null
        });
      }

      // Load challenge progresses
      const challengeProgressData: typeof challengeProgresses = {};
      for (const [id, challenge] of Object.entries(activeChallenges)) {
        if (challenge && !challenge.isPaused && !challenge.isCompleted) {
          const progress = await getChallengeProgress(challenge.challengeId);
          const nextSegment = await getNextSegmentForChallenge(challenge.challengeId);
          challengeProgressData[id] = {
            totalSegments: progress.totalSegments,
            completedSegments: progress.completedSegments,
            progressPercentage: progress.progressPercentage,
            nextSegmentId: nextSegment?.segmentId || null,
            nextSegmentTitle: nextSegment?.title || null
          };
        }
      }
      setChallengeProgresses(challengeProgressData);
    };

    loadProgressData();
  }, [activePlan, activeChallenges]); // Removed completedSegments to avoid infinite re-renders

  // Refresh progress data when returning to Home screen
  useFocusEffect(
    React.useCallback(() => {
      const refreshProgressData = async () => {
        // Load plan progress
        if (activePlan) {
          const progress = await getPlanProgress(activePlan.planId);
          const nextSegment = await getNextSegmentForPlan(activePlan.planId);
          setPlanProgress({
            totalSegments: progress.totalSegments,
            completedSegments: progress.completedSegments,
            progressPercentage: progress.progressPercentage,
            nextSegmentId: nextSegment?.segmentId || null,
            nextSegmentTitle: nextSegment?.title || null
          });
        }

        // Load challenge progresses
        const challengeProgressData: typeof challengeProgresses = {};
        for (const [id, challenge] of Object.entries(activeChallenges)) {
          if (challenge && !challenge.isPaused && !challenge.isCompleted) {
            const progress = await getChallengeProgress(challenge.challengeId);
            const nextSegment = await getNextSegmentForChallenge(challenge.challengeId);
            challengeProgressData[id] = {
              totalSegments: progress.totalSegments,
              completedSegments: progress.completedSegments,
              progressPercentage: progress.progressPercentage,
              nextSegmentId: nextSegment?.segmentId || null,
              nextSegmentTitle: nextSegment?.title || null
            };
          }
        }
        setChallengeProgresses(challengeProgressData);
      };

      refreshProgressData();
    }, [activePlan, activeChallenges])
  );

  // Function to get next uncompleted segment for a plan
  const getNextSegmentForPlan = async (planId: string): Promise<{ segmentId: string; title: string } | null> => {
    const plan = ReadingPlansChallenges.plans.find((p: any) => p.id === planId);
    if (!plan?.segments) return null;
    
    // Get all segments from the plan
    const allSegments = Object.values(plan.segments)
      .flatMap((book: any) => book?.segments || [])
      .filter((seg: string) => !seg.startsWith('I')); // Filter out introductions
    
    // Find the first uncompleted segment
    for (const segmentId of allSegments) {
      const status = await getSegmentCompletionStatus(segmentId, 'plan', planId);
      if (!status.isCompleted) {
        const segmentData = SegmentTitles[segmentId as keyof typeof SegmentTitles];
        return {
          segmentId,
          title: segmentData?.title || 'Unknown Story'
        };
      }
    }
    
    return null; // All segments completed
  };

  // Function to get next uncompleted segment for a challenge
  const getNextSegmentForChallenge = async (challengeId: string): Promise<{ segmentId: string; title: string } | null> => {
    const challenge = ReadingPlansChallenges.challenges.find((c: any) => c.id === challengeId);
    if (!challenge?.segments) return null;
    
    // Get all segments from the challenge
    const allSegments = Object.values(challenge.segments)
      .flatMap((book: any) => book?.segments || [])
      .filter((seg: string) => !seg.startsWith('I')); // Filter out introductions
    
    // Find the first uncompleted segment
    for (const segmentId of allSegments) {
      const status = await getSegmentCompletionStatus(segmentId, 'challenge', undefined, challengeId);
      if (!status.isCompleted) {
        const segmentData = SegmentTitles[segmentId as keyof typeof SegmentTitles];
        return {
          segmentId,
          title: segmentData?.title || 'Unknown Story'
        };
      }
    }
    
    return null; // All segments completed
  };

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
      (challenge: any) => challenge && !challenge.isPaused && !challenge.isCompleted
    ).length;
    
    return activePlansCount + activeChallengesCount;
  };

  // Calculate total completed segments
  const getCompletedStoriesCount = () => {
    return Object.values(completedSegments).filter((segment: any) => segment.isCompleted).length;
  };

  const handleScroll = (event: any) => {
    // Implementation of handleScroll function
  };

  const handleContinueReading = async (segmentId?: string) => {
    let segmentToRead = segmentId || lastReadSegment;
    if (!segmentToRead) {
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
    if (!activePlan || !planProgress?.nextSegmentId) return;
    
    const segmentData = SegmentTitles[planProgress.nextSegmentId as keyof typeof SegmentTitles];
    if (segmentData) {
      setSelectedSegmentId(planProgress.nextSegmentId);
      setSelectedSegmentTitle(segmentData.title);
      setSelectedSegmentRef(segmentData.ref || '');
      setShowReadingModeModal(true);
    } else {
      // If no next segment, go to the plan page
      router.push("/Plan");
    }
  };

  const handleActiveChallengesContinue = async (challengeId: string) => {
    const challengeProgress = challengeProgresses[challengeId];
    if (!challengeProgress?.nextSegmentId) {
      // If no next segment, go to the challenges page
      router.push("/Reading-Challenges");
      return;
    }
    
    const segmentData = SegmentTitles[challengeProgress.nextSegmentId as keyof typeof SegmentTitles];
    if (segmentData) {
      setSelectedSegmentId(challengeProgress.nextSegmentId);
      setSelectedSegmentTitle(segmentData.title);
      setSelectedSegmentRef(segmentData.ref || '');
      setShowReadingModeModal(true);
    }
  };

  // Group Reading Handlers
  const handleJoinGroup = async (sessionId: string) => {

      router.push({
      pathname: '/join-group' as any,
      params: { sessionId }
    });
  };

  const handleDismissGroup = (sessionId: string) => {
    setDismissedGroups(prev => new Set(Array.from(prev).concat(sessionId)));
  };

  // Reading Mode Modal Handlers
  const handleIndividualReading = async () => {
    setShowReadingModeModal(false);
    await updateSegmentId(`ENG-NLT-${selectedSegmentId}`);
    const segment = SegmentTitles[selectedSegmentId as keyof typeof SegmentTitles];
    
    // Determine context based on how we got here
    let contextParams: any = {
      segment: `ENG-NLT-${selectedSegmentId}`,
      book: segment?.book[0] || ''
    };
    
    // Check if this is today's reading
    const today = new Date();
    const dayOfYear = getDayOfYear(today);
    const dailySegmentId = (DailyStoryMap as string[])[(dayOfYear - 1) % DailyStoryMap.length];
    
    if (selectedSegmentId === dailySegmentId) {
      contextParams.context = 'today';
    }
    // If we have an active plan and this segment is part of that plan, pass plan context
    else if (activePlan && planProgress?.nextSegmentId === selectedSegmentId) {
      contextParams.planId = activePlan.planId;
      contextParams.context = 'plan';
    }
    // If we have active challenges and this segment is part of any challenge, pass challenge context
    else if (Object.keys(activeChallenges).length > 0) {
      for (const [challengeId] of Object.entries(activeChallenges)) {
        const challengeProgress = challengeProgresses[challengeId];
        if (challengeProgress?.nextSegmentId === selectedSegmentId) {
          contextParams.challengeId = challengeId;
          contextParams.context = 'challenge';
          break;
        }
      }
    }
    
    router.push({
      pathname: "/[segment]",
      params: contextParams
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

  // Handle segment selection - show ReadingModeModal for stories, direct navigation for introductions
  const handleSegmentSelect = (segmentId: string) => {
    if (!segmentId) {
      return;
    }
    const segmentData = SegmentTitles[segmentId as keyof typeof SegmentTitles];
    if (segmentData) {
      // Check if this is an introduction segment
      if (segmentId.startsWith('I')) {
        // For introduction segments, navigate directly without showing modal
        router.push({
          pathname: "/[segment]",
          params: {
            segment: `ENG-NLT-${segmentId}`,
            book: segmentData.book[0] || ''
          }
        });
      } else {
        // For story segments, show the reading mode modal
        setSelectedSegmentId(segmentId);
        setSelectedSegmentTitle(segmentData.title);
        setSelectedSegmentRef(segmentData.ref || '');
        setShowReadingModeModal(true);
      }
    }
  };

  // Helper to check if there is at least one valid active plan or challenge
  const hasActivePlan = !!(activePlan && activePlan.planId && ReadingPlansChallenges.plans.find((plan: any) => plan.id === activePlan.planId && !activePlan.isCompleted && !activePlan.isPaused));
  const hasActiveChallenge = Object.values(activeChallenges).some((challenge: any) => {
    if (!challenge || challenge.isPaused || challenge.isCompleted) return false;
    return ReadingPlansChallenges.challenges.some((c: any) => c.id === challenge.challengeId);
  });
  const showActiveReadingSection = hasActivePlan || hasActiveChallenge;

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
          // Commented out for MVP - will re-enable in v2 with full settings
          // <Pressable 
          //   style={({ pressed }) => [
          //     styles.headerIcon,
          //     pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }
          //   ]}
          //   onPress={() => router.push("/settings")}
          // >
          //   <Ionicons name="settings-outline" size={24} color={colors.text} />
          // </Pressable>
          null
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
          {/* <Text style={[localStyles.welcomeText, { color: '#FF6B6B', fontWeight: 'bold', marginTop: 8 }]}>
            MVP Version: Context-Aware Navigation & Progress Tracking Fixed - Launch Ready
          </Text> */}
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
                <Text style={styles.onboardingCardSubtitle}>{getAvailableChallengesCount()} Challenges</Text>
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
        {showActiveReadingSection && (
          <View style={styles.activeReadingSection}>
            <Text style={styles.sectionTitle}>Your Active Reading</Text>
            {hasActivePlan && activePlan && (
              (() => {
                const planData = ReadingPlansChallenges.plans.find((plan: any) => plan.id === activePlan.planId);
                if (!planData) return null;
                const planColor = (PLAN_STYLES as any)[planData.title]?.color || '#7B68EE';
                return (
                  <View style={styles.activeReadingCard}>
                    <View style={styles.activeReadingContent}>
                      <View style={[styles.activeReadingIcon, { backgroundColor: planColor }]}> 
                        <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
                      </View>
                      <View style={styles.activeReadingInfo}>
                        <Text style={styles.activeReadingTitle}>{planData.title}</Text>
                        <Text style={styles.activeReadingSubtitle}>
                          {planProgress?.nextSegmentTitle 
                            ? `Next: ${planProgress.nextSegmentTitle}` 
                            : 'Plan Completed!'}
                        </Text>
                        <Text style={styles.activeReadingProgress}>
                          {planProgress ? `${Math.round(planProgress.progressPercentage)}% complete` : 'Loading...'}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.continueButtonIcon} onPress={() => handleActivePlanContinue()}>
                        <Ionicons name="play-circle-outline" size={24} color="#666666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })()
            )}
            {Object.entries(activeChallenges).map(([id, challenge]: [string, any]) => {
              if (!challenge || challenge.isPaused || challenge.isCompleted) return null;
              const challengeData = ReadingPlansChallenges.challenges.find((c: any) => c.id === challenge.challengeId);
              if (!challengeData) return null;
              const progressData = challengeProgresses[id];
              const challengeColor = '#FF69B4'; // Use consistent pink color for all challenges
              return (
                <View key={id} style={styles.activeReadingCard}>
                  <View style={styles.activeReadingContent}>
                    <View style={[styles.activeReadingIcon, { backgroundColor: challengeColor }]}> 
                      <Ionicons name="flag-outline" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.activeReadingInfo}>
                      <Text style={styles.activeReadingTitle}>{challengeData.title}</Text>
                      <Text style={styles.activeReadingSubtitle}>
                        {progressData?.nextSegmentTitle 
                          ? `Next: ${progressData.nextSegmentTitle}` 
                          : 'Challenge Completed!'}
                      </Text>
                      <Text style={styles.activeReadingProgress}>
                        {progressData ? `${Math.round(progressData.progressPercentage)}% complete` : 'Loading...'}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.continueButtonIcon} onPress={() => handleActiveChallengesContinue(id)}>
                      <Ionicons name="play-circle-outline" size={24} color="#666666" />
                    </TouchableOpacity>
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
          <Text style={styles.streakBest}>Best: {bestStreak} days</Text>
          
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
            <View style={[styles.streakStatusDot, { backgroundColor: isTodayComplete ? '#4CAF50' : '#FF9800' }]} />
            <Text style={styles.streakStatusText}>
              {isTodayComplete ? "Today's reading complete" : "Keep building your streak!"}
            </Text>
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

        <InsightsSection styles={combinedStyles} />
        <View style={{ height: 80 }} />
      </ScrollView>

      <ReadingModeModal
        visible={showReadingModeModal && !!selectedSegmentId}
        storyTitle={selectedSegmentTitle}
        scriptureReference={selectedSegmentRef}
        storyId={selectedSegmentId || ''}
        onIndividual={handleIndividualReading}
        onGroup={handleGroupReading}
        onCancel={handleCancelModal}
      />
    </View>
  );
};

// Add default export
export default HomeScreen;