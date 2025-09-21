import React, { useState, useEffect } from 'react';
// Removed duplicate logger import - using the one from @/utils/logger
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  Platform,
  TouchableOpacity,
  RefreshControl,
  Alert
} from "react-native";
// import { BarCodeScanner } from 'expo-barcode-scanner';
import ReadingPlansChallenges from "../../assets/data/ReadingPlansChallenges.json";
import DailyStoryMap from '../../assets/data/DailyStoryMap.json';
import { getDayOfYear } from 'date-fns';
import { useSQLiteGlobalContext } from "@/context/SQLiteGlobalContext";
import { getActivePlanFromDB, getActiveChallengesFromDB } from "@/api/sqlite";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { getEmojis, getCurrentStreak, getPlanProgress, getChallengeProgress, getSegmentCompletionStatus, getBestStreak, hasDailyCompletionToday, getContextualStreaks } from "@/api/sqlite";
import CustomHeader from "@/components/navigation/CustomHeader";
import { useFontSize } from '@/context/FontSizeContext';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { type ColorScheme } from '@/context/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useGroupReading } from '@/context/GroupReadingContext';
import { getFullBookName } from '@/utils/bookNameMapping';
import { 
  getStoryInsights, 
  getBookInsights, 
  getLastReactionData, 
  getUserActivityInsights,
  hasUserData,
  initializeInsights,
  addSimplifiedStoryRead,
  type BookInsights,
  type StoryInsights,
  type LastReactionData,
  type UserActivityInsights
} from '@/api/insightQueries';
import logger from '@/utils/logger';
import { databaseManager } from '@/api/database-manager';
import { getColors, getBubbleTextColorSafe } from '@/scripts/getColors';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import SegmentTitlesData from '../../assets/data/SegmentTitles.json';
import ReadingModeModal from '@/components/GroupReading/ReadingModeModal';
import BibleData from '@/assets/data/newBibleNLT1.json';
import { qrCodeDiscoveryManager } from '@/services/QRCodeDiscoveryManager';
import QRCodeScanner from '@/components/QRCodeScanner';

import SegmentTitles from '@/assets/data/SegmentTitles.json';

type SegmentTitle = {
  Segment: string;
  title: string;
  book: string[];
  ref?: string;  // Making ref optional since not all segments have it
}


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
  qrScanButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scannerCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scannerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  scannerFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 250,
    height: 250,
    marginLeft: -125,
    marginTop: -125,
  },
  scannerFrameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  scannerInstructions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
  },
  scanningIndicator: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scanningText: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
  },
  noGroupsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  noGroupsText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  noGroupsSubtext: {
    fontSize: 14,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  scannerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  testQRButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  testQRButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Improved type definition with better typing
// Improved type definition with better typing
type ContinueReadingProps = {
  lastReadSegment: string | null;
  onPress: (segmentId?: string) => void;
  styles: Record<string, any>;
  colors: ColorScheme;
  refreshTrigger?: number;
};

const ContinueReadingSection = ({ lastReadSegment, onPress, styles, colors, refreshTrigger }: ContinueReadingProps) => {
  const { state, markAsRead, updateSegmentId } = useSQLiteGlobalContext();
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
    
    const isCompleted = state.completedSegments[lastReadSegment] || false;
    return isCompleted ? "arrow-forward-circle-outline" : "bookmark-outline";
  };
  
  // Get accent color based on reading state
  const getAccentColor = () => {
    if (!lastReadSegment) {
      return "#FF5733"; // Orange for new readers
    }
    
    const isCompleted = state.completedSegments[lastReadSegment] || false;
    return isCompleted ? "#2196F3" : "#4CAF50"; // Blue for continue, Green for resume
  };
  
  // --- TODAY'S READING: Daily Suggestion ---
  const today = new Date();
  const dayOfYear = getDayOfYear(today);
  const dailySegmentId = (DailyStoryMap as string[])[(dayOfYear - 1) % (DailyStoryMap as string[]).length];
  const dailySegment = dailySegmentId ? SegmentTitles[dailySegmentId as keyof typeof SegmentTitles] : null;

  const handleDailyStart = () => {
    if (!dailySegmentId) return;
    onPress && onPress(dailySegmentId);
  };

  // Check if today's reading is completed
  const [isDailyCompleted, setIsDailyCompleted] = useState(false);
  
  useEffect(() => {
    const checkCompletion = async () => {
      if (dailySegmentId) {
        try {
          const status = await getSegmentCompletionStatus(dailySegmentId, 'today');
          setIsDailyCompleted(status.isCompleted);
        } catch (error) {
          logger.error('Error checking daily completion:', error);
          setIsDailyCompleted(false);
        }
      }
    };
    
    checkCompletion();
  }, [dailySegmentId, refreshTrigger]);

  // Hide the entire section if today's reading is completed or segment doesn't exist
  if (!dailySegment || isDailyCompleted) return null;
  const dailyBookName = dailySegment.book && dailySegment.book[0] ? ((SegmentTitles as any)[dailySegmentId]?.book[0] || '') : '';
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
            {(dailySegment as any).ref ? ` (${(dailySegment as any).ref})` : ''}
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

// Function to get plan category color based on story count (matching ReadingPlans page)
const getPlanCategoryColor = (planData: any) => {
  if (!planData || !planData.segments) return '#7B68EE'; // Default color
  
  // Count total segments across all books
  let totalSegments = 0;
  Object.values(planData.segments).forEach((book: any) => {
    if (book && book.segments) {
      totalSegments += book.segments.length;
    }
  });
  
  // Categorize based on story count (matching ReadingPlans logic)
  if (totalSegments >= 100) {
    return '#00C853'; // Green for Long (100+ stories)
  } else if (totalSegments >= 30) {
    return '#FF9800'; // Orange for Medium (30-100 stories)
  } else {
    return '#E91E63'; // Pink for Short (under 30 stories)
  }
};

// Function to get challenge category color based on story count (matching ReadingPlans page)
const getChallengeCategoryColor = (challengeData: any) => {
  if (!challengeData || !challengeData.segments) return '#E91E63'; // Default pink for challenges
  
  // Count total segments across all books
  let totalSegments = 0;
  Object.values(challengeData.segments).forEach((book: any) => {
    if (book && book.segments) {
      totalSegments += book.segments.length;
    }
  });
  
  // Categorize based on story count (matching ReadingPlans logic)
  if (totalSegments >= 100) {
    return '#00C853'; // Green for Long (100+ stories)
  } else if (totalSegments >= 30) {
    return '#FF9800'; // Orange for Medium (30-100 stories)
  } else {
    return '#E91E63'; // Pink for Short (under 30 stories)
  }
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

// Enhanced StreakCard with contextual streak display
const StreakCard = ({ 
  currentStreak, 
  isTodayComplete, 
  colors, 
  item, 
  localStyles,
  contextualStreaks 
}: {
  currentStreak: number;
  isTodayComplete: boolean;
  colors: any;
  item: any;
  localStyles: any;
  contextualStreaks: {
    overall: number;
    today: number;
    plan: number;
    challenge: number;
    main: number;
  };
}) => {
  // Animation values for streak updates
  const streakScale = useSharedValue(1);
  const statusOpacity = useSharedValue(isTodayComplete ? 1 : 0.3);
  const numberOpacity = useSharedValue(1);
  
  // Animate when streak changes
  React.useEffect(() => {
    logger.info('🎯 [StreakCard] Animation trigger - currentStreak:', currentStreak);
    if (currentStreak > 0) {
      logger.info('🎯 [StreakCard] Starting bounce animation for streak:', currentStreak);
      // Spring bounce animation for streak number
      streakScale.value = withSpring(1.1, { 
        damping: 10, 
        stiffness: 100 
      }, () => {
        streakScale.value = withSpring(1, { damping: 15, stiffness: 200 });
      });
      
      // Number count-up effect
      numberOpacity.value = withTiming(0, { duration: 100 }, () => {
        numberOpacity.value = withTiming(1, { duration: 200 });
      });
    }
  }, [currentStreak]);
  
  // Animate status dot opacity
  React.useEffect(() => {
    statusOpacity.value = withTiming(isTodayComplete ? 1 : 0.3, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  }, [isTodayComplete]);
  
  const animatedStreakStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
    opacity: numberOpacity.value,
  }));
  
  const animatedStatusStyle = useAnimatedStyle(() => ({
    backgroundColor: colors.text,
    opacity: statusOpacity.value,
  }));

  // DonutRing component for individual streak circles
  const DonutRing = ({ 
    value, 
    maxValue = 30, 
    size = 32, 
    strokeWidth = 3, 
    color, 
    backgroundColor = '#E0E0E0',
    label,
    labelColor 
  }: {
    value: number;
    maxValue?: number;
    size?: number;
    strokeWidth?: number;
    color: string;
    backgroundColor?: string;
    label: string;
    labelColor: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (Math.min(value, maxValue) / maxValue) * circumference;
    
    return (
      <View style={{ alignItems: 'center', marginHorizontal: 4 }}>
        <View style={{ width: size, height: size, position: 'relative' }}>
          {/* Background circle */}
          <View 
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: backgroundColor,
              position: 'absolute',
            }}
          />
          {/* Progress circle */}
          <View 
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              borderTopColor: value > 0 ? color : backgroundColor,
              borderRightColor: value > maxValue * 0.25 ? color : backgroundColor,
              borderBottomColor: value > maxValue * 0.5 ? color : backgroundColor,
              borderLeftColor: value > maxValue * 0.75 ? color : backgroundColor,
              position: 'absolute',
              transform: [{ rotate: '-90deg' }],
            }}
          />
          {/* Center text */}
          <View style={{
            position: 'absolute',
            width: size,
            height: size,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.text,
            }}>
              {value}
            </Text>
          </View>
        </View>
        <Text style={{
          fontSize: 8,
          color: labelColor,
          marginTop: 2,
          fontWeight: '500',
          textAlign: 'center',
        }}>
          {label}
        </Text>
      </View>
    );
  };

  return (
    <View style={[localStyles.insightCard, { backgroundColor: item.backgroundColor }]}>
      <View style={localStyles.cardHeader}>
        <Text style={localStyles.cardIcon}>{item.icon}</Text>
        <Text style={localStyles.cardTitle}>{item.title}</Text>
      </View>

      <View style={localStyles.streakMainContent}>
        <View style={localStyles.streakCircleContainer}>
          <View style={localStyles.streakCircle}>
            <Reanimated.Text style={[localStyles.streakNumber, animatedStreakStyle]}>
              {contextualStreaks.overall || currentStreak}
            </Reanimated.Text>
            <Text style={localStyles.streakDaysText}>days</Text>
          </View>
          <View style={localStyles.streakProgress} />
        </View>
        
        <View style={localStyles.streakTextContainer}>
          <Text style={localStyles.streakMessage}>
            {(contextualStreaks.overall || currentStreak) === 0 ? 'Start your reading journey!' :
             (contextualStreaks.overall || currentStreak) === 1 ? 'Great start! Keep it going!' : 
             (contextualStreaks.overall || currentStreak) < 7 ? `Keep building your streak!` :
             'Amazing streak! Keep it up!'}
          </Text>
          <Text style={localStyles.streakGoal}>
            {(contextualStreaks.overall || currentStreak) < 7 ? 
              `${7 - (contextualStreaks.overall || currentStreak)} more days to 7!` : 
              'Keep building your streak!'}
          </Text>
        </View>
      </View>
      
      {/* Contextual Streak Breakdown */}
      <View style={{ marginTop: 12, marginBottom: 8 }}>
        <Text style={[localStyles.cardSubtitle, { marginBottom: 8, fontWeight: '600', fontSize: 11 }]}>
          Reading Breakdown:
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' }}>
          <DonutRing 
            value={contextualStreaks.today} 
            color="#4CAF50" 
            label="Today's" 
            labelColor="#4CAF50"
          />
          <DonutRing 
            value={contextualStreaks.plan} 
            color="#7B68EE" 
            label="Plans" 
            labelColor="#7B68EE"
          />
          <DonutRing 
            value={contextualStreaks.challenge} 
            color="#FF69B4" 
            label="Challenges" 
            labelColor="#FF69B4"
          />
          <DonutRing 
            value={contextualStreaks.main} 
            color="#E6E6E6" 
            label="General" 
            labelColor="#888888"
          />
        </View>
      </View>
      
      <View style={localStyles.streakStatus}>
        <Reanimated.View style={[localStyles.streakStatusDot, animatedStatusStyle]} />
        <Text style={localStyles.streakStatusText}>
          {isTodayComplete ? "Today's reading complete" : "Start reading to build your streak!"}
        </Text>
      </View>
    </View>
  );
};

// 2. Reading Insights Carousel with real data
const ReadingInsightsCarousel = ({ 
  styles, 
  currentStreak, 
  bestStreak, 
  isTodayComplete,
  refreshTrigger 
}: { 
  styles: SectionStyles; 
  currentStreak: number; 
  bestStreak: number; 
  isTodayComplete: boolean;
  refreshTrigger?: number; 
}) => {
  const { state } = useSQLiteGlobalContext();
  const router = useRouter();
  const { sizes } = useFontSize();
  const { colors } = styles;
  const { isDarkMode } = useSyncAppSettings();
  const { t } = useTranslation();
  
  // Helper function to get segment reference
  const getSegmentReference = (segmentID: string) => {
    const segment = SegmentTitlesData[segmentID as keyof typeof SegmentTitlesData] as any;
    if (!segment) return "";
    return `${segment.book[0]}${segment.ref ? " " + segment.ref : ""}`;
  };
  
  // Helper functions for speaker styling (using consistent vibrant colors)
  const getSpeakerBackgroundColor = (color?: string) => {
    // Use the same vibrant colors as BibleBlockComponent from getColors script
    return isDarkMode ? getColors(color || 'black').dark : getColors(color || 'black').light;
  };
  
  const getSpeakerTextColor = (color?: string) => {
    // Use context text color for consistency with theme
    return colors.text;
  };
  
  // Helper function to extract text from block data
  const getBlockText = (blockData: any) => {
    if (!blockData) return 'Block text not available';
    
    // Extract text from the nested structure
    if (blockData.children) {
      return blockData.children
        .flatMap((inline: any) => inline.children || [])
        .map((leaf: any) => leaf.text || "")
        .join(" ");
    }
    
    return blockData.text || 'Block text not available';
  };
  
  const localStyles = StyleSheet.create({
    sectionTitle: {
      fontSize: sizes.title,
      fontWeight: '800',
      marginBottom: 18,
      color: colors.text,
      letterSpacing: -0.5,
    },
    carouselContainer: {
      paddingHorizontal: 16,
      paddingBottom: 20, // Reduced padding
    },
    insightCard: {
      width: 280,
      marginRight: 16,
      backgroundColor: colors.card, // White background like active reading cards
      borderRadius: 16,
      padding: 20,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
    },
    streakCard: {
      backgroundColor: '#FFF4E6',
    },
    favoriteBookCard: {
      backgroundColor: '#E8F5E8',
    },
    favoriteStoryCard: {
      backgroundColor: '#FFF0F5',
    },
    emojiCard: {
      backgroundColor: '#F0F8FF',
    },
    completionCard: {
      backgroundColor: '#F5F0FF',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardIcon: {
      fontSize: 20,
      marginRight: 8,
    },
    cardTitle: {
      fontSize: sizes.body,
      fontWeight: '700',
      color: colors.text,
    },
    cardValue: {
      fontSize: sizes.title,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 8,
    },
    cardSubtitle: {
      fontSize: sizes.caption,
      color: colors.secondary,
      fontWeight: '500',
    },
    streakMainContent: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    streakCircleContainer: {
      position: 'relative',
      marginRight: 16,
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
  });

  const [insights, setInsights] = useState({
    favoriteBook: '',
    favoriteBookFullName: '',
    favoriteSegmentId: '',
    favoriteSegment: '',
    readingStreak: 0,
    lastUsedEmoji: '',
    completionRate: 0
  });

  const [contextualStreaks, setContextualStreaks] = useState({
    overall: 0,
    today: 0,
    plan: 0,
    challenge: 0,
    main: 0
  });

  const [enhancedInsights, setEnhancedInsights] = useState({
    bookInsights: null as BookInsights | null,
    storyInsights: null as StoryInsights | null,
    lastReaction: null as LastReactionData | null,
    activityInsights: null as UserActivityInsights | null,
    dataAvailability: {
      hasEmojis: false,
      hasReadBooks: false,
      hasReadStories: false,
      hasActivity: false,
    }
  });

  useEffect(() => {
    const calculateInsights = async () => {
      try {
        // Check data availability first
        const dataCheck = await hasUserData();
        
        // Get basic insights
        const emojiData = await getEmojis();
        
        // Get last used emoji instead of most used
        const lastUsedEmoji = emojiData.length > 0 ? (emojiData[emojiData.length - 1] as any)?.emoji || '👍' : '👍';

        // Get comprehensive segment and book read counts from SQLite
        if (!databaseManager.isReady()) {
          logger.info('⏳ Database not ready, skipping SQLite queries');
          return;
        }
        
        const db = databaseManager.getDatabase();
        
        // Get all segment read counts from SQLite (across all contexts)
        const segmentReads = await db.getAllAsync<{segmentID: string, totalReads: number}>(`
          SELECT segmentID, totalReads FROM segment_read_count WHERE totalReads > 0
        `);
        
        const segmentCounts: {[key: string]: number} = {};
        const bookCounts: {[key: string]: number} = {};
        
        segmentReads.forEach(({segmentID, totalReads}) => {
          segmentCounts[segmentID] = totalReads;
          const book = (SegmentTitlesData as any)[segmentID]?.book[0] || 'Unknown';
          bookCounts[book] = (bookCounts[book] || 0) + totalReads;
        });
        
        // If no SQLite data, fall back to legacy state data
        if (Object.keys(segmentCounts).length === 0) {
          Object.entries(state.completedSegments).forEach(([segmentId, seg]) => {
            if (seg) {
              segmentCounts[segmentId] = 1;
              const book = (SegmentTitlesData as any)[segmentId]?.book[0] || 'Unknown';
              bookCounts[book] = (bookCounts[book] || 0) + 1;
            }
          });
        }

        const favoriteBookKey = Object.entries(bookCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Gen';
        
        const favoriteSegmentId = Object.entries(segmentCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0];

        // Set basic insights
        // Get actual completion rate from SQLite
        const completedCount = await db.getFirstAsync<{count: number}>(`
          SELECT COUNT(DISTINCT segmentID) as count FROM segment_read_count WHERE totalReads > 0
        `);
        
        setInsights({
          favoriteBook: favoriteBookKey,
          favoriteBookFullName: getFullBookName(favoriteBookKey),
          favoriteSegmentId,
          favoriteSegment: favoriteSegmentId 
            ? (SegmentTitlesData as any)[favoriteSegmentId]?.title || 'Unknown'
            : 'Not enough data',
          readingStreak: currentStreak, // Use actual streak data
          lastUsedEmoji,
          completionRate: Math.round(((completedCount?.count || 0) / Object.keys(SegmentTitlesData).length) * 100)
        });

        // Get enhanced insights
        const [bookInsights, storyInsights, lastReaction, activityInsights] = await Promise.all([
          dataCheck.hasReadBooks ? getBookInsights(favoriteBookKey).catch(() => null) : null,
          favoriteSegmentId && dataCheck.hasReadStories ? getStoryInsights(favoriteSegmentId).catch(() => null) : null,
          dataCheck.hasEmojis ? getLastReactionData().catch(() => null) : null,
          dataCheck.hasActivity ? getUserActivityInsights().catch(() => null) : null,
        ]);

        setEnhancedInsights({
          bookInsights,
          storyInsights,
          lastReaction,
          activityInsights,
          dataAvailability: dataCheck,
        });

        // Load contextual streaks
        const streaks = await getContextualStreaks();
        setContextualStreaks(streaks);
      } catch (error) {
        logger.error('Error calculating insights:', error);
      }
    };

    calculateInsights();
  }, [refreshTrigger]); // Update when refreshTrigger changes

  // Refresh insights when returning to Home screen
  useFocusEffect(
    React.useCallback(() => {
      const calculateInsights = async () => {
        try {
          // Check data availability first
          const dataCheck = await hasUserData();
          
          // Get basic insights
          const emojiData = await getEmojis();
          
          // Get last used emoji instead of most used
          const lastUsedEmoji = emojiData.length > 0 ? (emojiData[emojiData.length - 1] as any)?.emoji || '👍' : '👍';

          // Get comprehensive segment and book read counts from SQLite
          if (!databaseManager.isReady()) {
            logger.info('⏳ Database not ready, skipping SQLite queries');
            return;
          }
          
          const db = databaseManager.getDatabase();
          
          // Get all segment read counts from SQLite (across all contexts)
          const segmentReads = await db.getAllAsync<{segmentID: string, totalReads: number}>(`
            SELECT segmentID, totalReads FROM segment_read_count WHERE totalReads > 0
          `);
          
          const segmentCounts: {[key: string]: number} = {};
          const bookCounts: {[key: string]: number} = {};
          
          segmentReads.forEach(({segmentID, totalReads}) => {
            segmentCounts[segmentID] = totalReads;
            const book = (SegmentTitlesData as any)[segmentID]?.book[0] || 'Unknown';
            bookCounts[book] = (bookCounts[book] || 0) + totalReads;
          });
          
          // If no SQLite data, fall back to legacy state data
          if (Object.keys(segmentCounts).length === 0) {
            Object.entries(state.completedSegments).forEach(([segmentId, seg]) => {
              if (seg) {
                segmentCounts[segmentId] = 1;
                const book = (SegmentTitlesData as any)[segmentId]?.book[0] || 'Unknown';
                bookCounts[book] = (bookCounts[book] || 0) + 1;
              }
            });
          }

          const favoriteBookKey = Object.entries(bookCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Gen';
          
          const favoriteSegmentId = Object.entries(segmentCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0];

          // Get actual completion rate from SQLite
          const completedCount = await db.getFirstAsync<{count: number}>(`
            SELECT COUNT(DISTINCT segmentID) as count FROM segment_read_count WHERE totalReads > 0
          `);
          
          setInsights({
            favoriteBook: favoriteBookKey,
            favoriteBookFullName: getFullBookName(favoriteBookKey),
            favoriteSegmentId,
            favoriteSegment: favoriteSegmentId 
              ? (SegmentTitlesData as any)[favoriteSegmentId]?.title || 'Unknown'
              : 'Not enough data',
            readingStreak: currentStreak, // Use actual streak data
            lastUsedEmoji,
            completionRate: Math.round(((completedCount?.count || 0) / Object.keys(SegmentTitlesData).length) * 100)
          });

          // Get enhanced insights
          const [bookInsights, storyInsights, lastReaction, activityInsights] = await Promise.all([
            dataCheck.hasReadBooks ? getBookInsights(favoriteBookKey).catch(() => null) : null,
            favoriteSegmentId && dataCheck.hasReadStories ? getStoryInsights(favoriteSegmentId).catch(() => null) : null,
            dataCheck.hasEmojis ? getLastReactionData().catch(() => null) : null,
            dataCheck.hasActivity ? getUserActivityInsights().catch(() => null) : null,
          ]);

          setEnhancedInsights({
            bookInsights,
            storyInsights,
            lastReaction,
            activityInsights,
            dataAvailability: dataCheck,
          });

          // Load contextual streaks
          const streaks = await getContextualStreaks();
          setContextualStreaks(streaks);
        } catch (error) {
          logger.error('Error refreshing insights:', error);
        }
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
    if (enhancedInsights.lastReaction) {
      router.push({
        pathname: "/[segment]",
        params: {
          segment: `ENG-NLT-${enhancedInsights.lastReaction.segmentId}`,
          book: enhancedInsights.lastReaction.segmentId.substring(1, 4),
        }
      });
    } else {
      router.push({
        pathname: "/Reading-emoji",
        params: { selectedEmoji: insights.lastUsedEmoji }
      });
    }
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

  // Create card data array with conditional inclusion based on available data
  const cardsData = [
    // Removed streak card - no longer showing it
    // Show favorite book if user has read books
    ...(enhancedInsights.dataAvailability.hasReadBooks ? [{
      id: 'favorite-book',
      type: 'favorite-book',
      icon: '📚',
      title: 'Favorite Book',
      value: insights.favoriteBookFullName,
      backgroundColor: colors.card,
      onPress: handleBookPress,
      insights: enhancedInsights.bookInsights,
    }] : []),
    // Show favorite story if user has read stories
    ...(enhancedInsights.dataAvailability.hasReadStories && insights.favoriteSegmentId ? [{
      id: 'favorite-story',
      type: 'favorite-story',
      icon: '📖',
      title: 'Favorite Story',
      value: insights.favoriteSegment,
      backgroundColor: colors.card,
      onPress: handleStoryPress,
      insights: enhancedInsights.storyInsights,
    }] : []),
    // Show last reaction if user has emojis
    ...(enhancedInsights.dataAvailability.hasEmojis ? [{
      id: 'emoji',
      type: 'emoji',
      icon: '💬',
      title: 'Reactions',
      value: enhancedInsights.lastReaction?.emoji || insights.lastUsedEmoji,
      backgroundColor: colors.card,
      onPress: handleEmojiPress,
      lastReaction: enhancedInsights.lastReaction,
    }] : []),

    // Show activity insights if user has activity data
    ...(enhancedInsights.dataAvailability.hasActivity ? [{
      id: 'activity',
      type: 'activity',
      icon: '⚡',
      title: 'Reading Habits',
      backgroundColor: colors.card,
      insights: enhancedInsights.activityInsights,
    }] : []),
  ];

  const renderCard = ({ item }: { item: any }) => {
    // Helper function to format date
    const formatDate = (dateString: string | null) => {
      if (!dateString) return 'Never';
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    };

    // Helper function to render insight bullets
    const renderInsights = (insights: any[], maxShow: number = 4) => {
      return insights.slice(0, maxShow).map((insight, index) => (
        <Text key={index} style={[localStyles.cardSubtitle, { 
          fontSize: sizes.caption * 0.9, 
          marginBottom: 2,
          fontWeight: '500' 
        }]}>
          • {insight}
        </Text>
      ));
    };

    // Streak card removed - no longer used

    if (item.type === 'favorite-book') {
      const bookInsights = item.insights;
      const insights = [];
      
      if (bookInsights) {
        // Show book completion count (how many times the entire book was read)
        if (bookInsights.totalReads > 0) {
          insights.push(`Book completed ${bookInsights.totalReads} time${bookInsights.totalReads !== 1 ? 's' : ''}`);
        }
        // Show how many stories read from this book
        if (bookInsights.storiesRead > 0) {
          insights.push(`${bookInsights.storiesRead}/${bookInsights.totalStories} stories read`);
        }
        // Show most read story from this book
        if (bookInsights.favoriteStory) {
          const storyTitle = SegmentTitlesData[bookInsights.favoriteStory as keyof typeof SegmentTitlesData] as any;
          const shortTitle = storyTitle?.title ? 
            (storyTitle.title.length > 25 ? storyTitle.title.substring(0, 25) + '...' : storyTitle.title) :
            'Unknown Story';
          insights.push(`Most read: "${shortTitle}"`);
        }
        if (bookInsights.lastReadDate) {
          insights.push(`Last read ${formatDate(bookInsights.lastReadDate)}`);
        }
      }

      return (
        <Pressable 
          style={({ pressed }) => [
            localStyles.insightCard,
            { backgroundColor: item.backgroundColor },
            pressed && { opacity: 0.8 }
          ]}
          onPress={item.onPress}
        >
          <View style={localStyles.cardHeader}>
            <Text style={localStyles.cardIcon}>{item.icon}</Text>
            <Text style={[localStyles.cardTitle, { fontSize: sizes.body, fontWeight: '600' }]}>{item.title}</Text>
          </View>
          <Text style={[localStyles.cardValue, { fontSize: sizes.subtitle, fontWeight: '700' }]} numberOfLines={1}>
            {item.value}
          </Text>
          {insights.length > 0 && (
            <View style={{ marginTop: 8 }}>
              {renderInsights(insights)}
            </View>
          )}
        </Pressable>
      );
    }

    if (item.type === 'favorite-story') {
      const storyInsights = item.insights;
      const insights = [];
      
      if (storyInsights) {
        if (storyInsights.totalReads > 0) {
          insights.push(`Read ${storyInsights.totalReads} time${storyInsights.totalReads !== 1 ? 's' : ''}`);
        }
        if (storyInsights.lastReadDate) {
          insights.push(`Last read ${formatDate(storyInsights.lastReadDate)}`);
        }
        if (storyInsights.firstReadDate) {
          insights.push(`First read ${formatDate(storyInsights.firstReadDate)}`);
        }
        if (storyInsights.groupReads > 0) {
          insights.push(`${storyInsights.groupReads} group session${storyInsights.groupReads !== 1 ? 's' : ''}`);
        }
        if (storyInsights.readInPlans > 0 || storyInsights.readInChallenges > 0) {
          const contexts = [];
          if (storyInsights.readInPlans > 0) contexts.push(`${storyInsights.readInPlans} plan${storyInsights.readInPlans !== 1 ? 's' : ''}`);
          if (storyInsights.readInChallenges > 0) contexts.push(`${storyInsights.readInChallenges} challenge${storyInsights.readInChallenges !== 1 ? 's' : ''}`);
          insights.push(`Read in ${contexts.join(', ')}`);
        }
      }

      return (
        <Pressable 
          style={({ pressed }) => [
            localStyles.insightCard,
            { backgroundColor: item.backgroundColor },
            pressed && { opacity: 0.8 }
          ]}
          onPress={item.onPress}
        >
          <View style={localStyles.cardHeader}>
            <Text style={localStyles.cardIcon}>{item.icon}</Text>
            <Text style={[localStyles.cardTitle, { fontSize: sizes.body, fontWeight: '600' }]}>{item.title}</Text>
          </View>
          <Text style={[localStyles.cardValue, { fontSize: sizes.subtitle, fontWeight: '700' }]} numberOfLines={2}>
            {item.value}
          </Text>
          {insights.length > 0 && (
            <View style={{ marginTop: 8 }}>
              {renderInsights(insights)}
            </View>
          )}
        </Pressable>
      );
    }

    if (item.type === 'emoji') {
      const lastReaction = item.lastReaction;
      
      return (
        <Pressable 
          style={({ pressed }) => [
            localStyles.insightCard,
            { backgroundColor: item.backgroundColor },
            pressed && { opacity: 0.8 }
          ]}
          onPress={item.onPress}
        >
          <View style={localStyles.cardHeader}>
            <Text style={localStyles.cardIcon}>{item.icon}</Text>
            <Text style={[localStyles.cardTitle, { fontSize: sizes.body, fontWeight: '600' }]}>{item.title}</Text>
          </View>
          
          {lastReaction && (
            <View style={{ marginTop: 8, flex: 1 }}>
              {/* Speech bubble with proper styling matching BibleBlockComponent */}
              <View style={{ position: 'relative', marginBottom: 8 }}>
                {/* Speaker name above bubble (matching BibleBlockComponent) */}
                {lastReaction.blockData?.source?.sourceName && (
                  <Text style={{
                    fontSize: sizes.caption * 0.75,
                    fontWeight: '600',
                    color: colors.secondary,
                    marginBottom: 4,
                    textAlign: lastReaction.blockData.source.color !== "black" ? "left" : "right",
                  }}>
                    {lastReaction.blockData.source.sourceName.toUpperCase()}
                  </Text>
                )}
                
                {/* Speech bubble container */}
                <View style={{
                  backgroundColor: getSpeakerBackgroundColor(lastReaction.blockData?.source?.color),
                  borderRadius: 16,
                  padding: 16,
                  position: 'relative',
                  minHeight: 60,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                }}>
                  {/* Speech bubble tail (matching BibleBlockComponent) */}
                  <View style={{
                    position: "absolute",
                    top: -9,
                    [lastReaction.blockData?.source?.color !== "black" ? "left" : "right"]: 15,
                    width: 0,
                    height: 0,
                    borderLeftWidth: 10,
                    borderRightWidth: 10,
                    borderBottomWidth: 10,
                    borderLeftColor: "transparent",
                    borderRightColor: "transparent",
                    borderBottomColor: getSpeakerBackgroundColor(lastReaction.blockData?.source?.color),
                    zIndex: 2,
                  }} />
                  
                  {/* Block text preview */}
                  <Text style={{
                    fontSize: sizes.caption,
                    color: getBubbleTextColorSafe(lastReaction.blockData?.source?.color || 'black', isDarkMode),
                    lineHeight: 18,
                  }} numberOfLines={2}>
                    {getBlockText(lastReaction.blockData)}
                  </Text>
                  
                  {/* Emoji overlay positioned like in Reading-emoji */}
                  <Text style={{
                    position: 'absolute',
                    top: 25,
                    [lastReaction.blockData?.source?.color === "black" ? "left" : "right"]: 10,
                    fontSize: 20,
                    zIndex: 1,
                  }}>
                    {item.value}
                  </Text>
                </View>
              </View>
              
              {/* Reference */}
              <Text style={[localStyles.cardSubtitle, { 
                fontSize: sizes.caption * 0.9, 
                fontWeight: '500',
                textAlign: 'center',
                marginBottom: 2,
                color: colors.secondary,
              }]}>
                {getSegmentReference(lastReaction.segmentId)}
              </Text>
              
              {/* Story title */}
              <Text style={[localStyles.cardSubtitle, { 
                fontSize: sizes.caption * 0.8,
                textAlign: 'center',
                fontStyle: 'italic',
                color: colors.secondary,
                opacity: 0.7,
              }]}>
                "{lastReaction.storyTitle}"
              </Text>
            </View>
          )}
        </Pressable>
      );
    }

    if (item.type === 'activity') {
      const activityInsights = item.insights;
      const insights = [];
      
      if (activityInsights) {
        if (activityInsights.favoriteTimeOfDay) {
          insights.push(`Prefers ${activityInsights.favoriteTimeOfDay} reading`);
        }
        if (activityInsights.preferredReadingMode) {
          insights.push(`${activityInsights.preferredReadingMode === 'mixed' ? 'Mixed' : activityInsights.preferredReadingMode} reader`);
        }
        if (activityInsights.longestSession > 1) {
          insights.push(`Longest: ${activityInsights.longestSession} stories`);
        }
        if (activityInsights.averageSessionLength > 0) {
          insights.push(`Avg: ${activityInsights.averageSessionLength} stories/session`);
        }
        if (activityInsights.mostActiveDay) {
          insights.push(`Most active: ${activityInsights.mostActiveDay}s`);
        }
        if (activityInsights.readingPattern) {
          const pattern = activityInsights.readingPattern === 'single' ? 'one story' : 
                         activityInsights.readingPattern === 'multiple' ? 'multiple stories' : 'mixed sessions';
          insights.push(`Usually reads ${pattern}`);
        }
      }

      return (
        <View style={[localStyles.insightCard, { backgroundColor: item.backgroundColor }]}>
          <View style={localStyles.cardHeader}>
            <Text style={localStyles.cardIcon}>{item.icon}</Text>
            <Text style={[localStyles.cardTitle, { fontSize: sizes.body, fontWeight: '600' }]}>{item.title}</Text>
          </View>
          {activityInsights?.totalDaysActive && (
            <Text style={[localStyles.cardValue, { fontSize: sizes.subtitle, fontWeight: '700' }]}>
              {activityInsights.totalDaysActive} active day{activityInsights.totalDaysActive !== 1 ? 's' : ''}
            </Text>
          )}
          {insights.length > 0 && (
            <View style={{ marginTop: 8 }}>
              {renderInsights(insights)}
            </View>
          )}
        </View>
      );
    }

    // Default card rendering for completion and other types
    return (
      <Pressable 
        style={({ pressed }) => [
          localStyles.insightCard,
          { backgroundColor: item.backgroundColor },
          pressed && { opacity: 0.8 }
        ]}
        onPress={item.onPress}
      >
        <View style={localStyles.cardHeader}>
          <Text style={localStyles.cardIcon}>{item.icon}</Text>
          <Text style={[localStyles.cardTitle, { fontSize: sizes.body, fontWeight: '600' }]}>{item.title}</Text>
        </View>
        <Text style={[localStyles.cardValue, { fontSize: sizes.subtitle, fontWeight: '700' }]}>
          {item.value}
        </Text>
      </Pressable>
    );
  };

  // Only render the section if there are cards to show
  if (cardsData.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Reading Insights</Text>
      <FlatList
        data={cardsData}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={localStyles.carouselContainer}
        snapToInterval={296} // Card width (280) + margin (16)
        snapToAlignment="start"
        decelerationRate="fast"
      />
    </View>
  );
};

const Home = () => {
  const { colors, isDarkMode } = useSyncAppSettings();
  const { state, refreshProgressData, refreshStatistics } = useSQLiteGlobalContext();
  const [refreshing, setRefreshing] = useState(false);

  // Initialize insights system
  useEffect(() => {
    const initInsights = async () => {
      try {
        await initializeInsights();
      } catch (error) {
        logger.error('Failed to initialize insights:', error);
        // Continue without insights rather than crashing
      }
    };
    
    initInsights();
  }, []);

  // Handle refresh with error handling
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshProgressData(),
        refreshStatistics()
      ]);
    } catch (error) {
      logger.error('Error during refresh:', error);
      // Continue without crashing
    } finally {
      setRefreshing(false);
    }
  };

  const { 
    updateLastReadSegment,
    updateSegmentId,
  } = useSQLiteGlobalContext();
  // Removed activePlan, activeChallenges dependencies - now using pure SQLite data loading
  const router = useRouter();
  
  // Option 2: Memoize with useEffect
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    
    return () => subscription?.remove();
  }, []);
  
  const isLargeScreen = screenWidth >= 768;
  const { sizes } = useFontSize();
  const { t } = useTranslation();
  const styles = createStyles(isLargeScreen, colors);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isTodayComplete, setIsTodayComplete] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [homeContextualStreaks, setHomeContextualStreaks] = useState({
    overall: 0,
    today: 0,
    plan: 0,
    challenge: 0,
    main: 0
  });
  
  // State for tracking completion of daily items
  const [isDailySegmentCompleted, setIsDailySegmentCompleted] = useState(false);
  const [activePlanDailyCompleted, setActivePlanDailyCompleted] = useState(false);
  const [activeChallengesDailyCompleted, setActiveChallengesDailyCompleted] = useState<Record<string, boolean>>({});
  
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
  
  // Add state for active plan and challenges from SQLite
  const [activePlan, setActivePlan] = useState<any | null>(null);
  const [activeChallenges, setActiveChallenges] = useState<Record<string, any>>({});
  
  // Group Reading Context
  const { 
    currentSession, 
    joinSession,
    setUserName,
    currentUserName,
    stopSession,
  } = useGroupReading();


  
  const [dismissedGroups, setDismissedGroups] = useState<Set<string>>(new Set());
  
  // Reading Mode Modal State
  const [showReadingModeModal, setShowReadingModeModal] = useState(false);
  
  // QR Code Scanner State
  const [scanned, setScanned] = useState(false);
  const [showScanner, setShowScanner] = useState(false);


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
      
      // Load contextual streaks
      const contextualStreaksData = await getContextualStreaks();
      setHomeContextualStreaks(contextualStreaksData);
      
      // Check if today is complete based on today's completions
      if (!databaseManager.isReady()) {
        logger.info('⏳ Database not ready, skipping today completion check');
        return;
      }
      
      const db = databaseManager.getDatabase();
      const today = new Date().toISOString().split('T')[0];
      const todayCompletion = await db.getFirstAsync<{count: number}>(`
        SELECT COUNT(*) as count FROM segment_completion 
        WHERE DATE(completionDate) = ? AND completionType = 'main'
      `, today);
      
      setIsTodayComplete((todayCompletion?.count || 0) > 0);
    };
    
    loadStreakData();
  }, [refreshTrigger]); // Update when refreshTrigger changes (when segments completed)
  
  // Debug refresh trigger changes
  useEffect(() => {
    
  }, [refreshTrigger]);

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
        
        // Load contextual streaks
        const contextualStreaksData = await getContextualStreaks();
        setHomeContextualStreaks(contextualStreaksData);
        
        // Check if today is complete based on today's completions
        if (!databaseManager.isReady()) {
          logger.info('⏳ Database not ready, skipping today completion check');
          return;
        }
        
        const db = databaseManager.getDatabase();
        const today = new Date().toISOString().split('T')[0];
        const todayCompletion = await db.getFirstAsync<{count: number}>(`
          SELECT COUNT(*) as count FROM segment_completion 
          WHERE DATE(completionDate) = ? AND completionType = 'main'
        `, today);
        
        setIsTodayComplete((todayCompletion?.count || 0) > 0);
      };
      
      loadStreakData();
      // Also trigger insights refresh
      
      setRefreshTrigger(prev => prev + 1);
    }, [])
  );

  // Load progress data including active plans and challenges
  const loadProgressData = async () => {
    try {
      // Load active plan and challenges from SQLite
      const activePlan = await getActivePlanFromDB();
      const activeChallenges = await getActiveChallengesFromDB();
      
      setActivePlan(activePlan);
      setActiveChallenges(activeChallenges);
      
      // Load plan progress if there's an active plan
      if (activePlan) {
        const progress = await getPlanProgress(activePlan.planId);
        const nextSegment = await getNextSegmentForPlan(activePlan.planId);
        setPlanProgress({
          ...progress,
          nextSegmentId: nextSegment?.segmentId || null,
          nextSegmentTitle: nextSegment?.title || null,
        });
      }
      
      // Load challenge progress for each active challenge
      const challengeProgresses: Record<string, any> = {};
      for (const [challengeId, challenge] of Object.entries(activeChallenges)) {
        const progress = await getChallengeProgress(challengeId);
        const nextSegment = await getNextSegmentForChallenge(challengeId);
        challengeProgresses[challengeId] = {
          ...progress,
          nextSegmentId: nextSegment?.segmentId || null,
          nextSegmentTitle: nextSegment?.title || null,
        };
      }
      setChallengeProgresses(challengeProgresses);
      
    } catch (error) {
      logger.error('Error loading progress data:', error);
    }
  };

  // Load progress data when component mounts
  useEffect(() => {
    loadProgressData();
  }, []);

  // Check if today's reading is completed
  useEffect(() => {
    const checkDailyCompletion = async () => {
      const today = new Date();
      const dayOfYear = getDayOfYear(today);
      const dailySegmentId = (DailyStoryMap as string[])[(dayOfYear - 1) % DailyStoryMap.length];
      
      if (dailySegmentId) {
        try {
          const status = await getSegmentCompletionStatus(dailySegmentId, 'today');
          setIsDailySegmentCompleted(status.isCompleted);
        } catch (error) {
          logger.error('Error checking daily completion:', error);
          setIsDailySegmentCompleted(false);
        }
      }
    };
    
    checkDailyCompletion();
  }, [refreshTrigger]); // Re-check when refreshTrigger changes

  // Check if active plan's daily portion is completed
  useEffect(() => {
    const checkPlanDailyCompletion = async () => {
      if (!activePlan) {
        setActivePlanDailyCompleted(false);
        return;
      }

      try {
        // Check if any segment was completed today for this plan
        const hasCompletedToday = await hasDailyCompletionToday('plan', activePlan.planId);
        setActivePlanDailyCompleted(hasCompletedToday);
      } catch (error) {
        logger.error('Error checking plan daily completion:', error);
        setActivePlanDailyCompleted(false);
      }
    };

    checkPlanDailyCompletion();
  }, [activePlan, refreshTrigger]);

  // Check if active challenges' daily portions are completed
  useEffect(() => {
    const checkChallengesDailyCompletion = async () => {
      const completionStates: Record<string, boolean> = {};

      for (const [challengeId, challenge] of Object.entries(activeChallenges)) {
        if (!challenge || challenge.isPaused || challenge.isCompleted) {
          completionStates[challengeId] = false;
          continue;
        }

        try {
          // Check if any segment was completed today for this challenge
          const hasCompletedToday = await hasDailyCompletionToday('challenge', undefined, challengeId);
          completionStates[challengeId] = hasCompletedToday;
        } catch (error) {
          logger.error(`Error checking challenge ${challengeId} daily completion:`, error);
          completionStates[challengeId] = false;
        }
      }

      setActiveChallengesDailyCompleted(completionStates);
    };

    checkChallengesDailyCompletion();
  }, [activeChallenges, refreshTrigger]);

  // Refresh progress data when returning to Home screen
  useFocusEffect(
    React.useCallback(() => {
      const refreshProgressData = async () => {
        try {
          await loadProgressData();
          // Force refresh completion checks when returning to home
          setRefreshTrigger(prev => prev + 1);
        } catch (error) {
          logger.error('Error refreshing progress data:', error);
        }
      };
      
      refreshProgressData();
    }, [])
  );

  // Add refresh trigger for real-time updates
  useEffect(() => {
    const refreshData = async () => {
      await loadProgressData();
    };
    refreshData();
  }, [refreshTrigger]);

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

  // Calculate total available plans and challenges
  const getTotalAvailablePlansCount = () => {
    const availablePlans = ReadingPlansChallenges.plans.filter(plan => 
      !['SchoolYear2', 'SchoolYear3', 'test'].includes(plan.id)
    ).length;
    const availableChallenges = ReadingPlansChallenges.challenges.length;
    return availablePlans + availableChallenges;
  };

  // Calculate total active plans/challenges
  const getActivePlansCount = () => {
    const activePlansCount = activePlan ? 1 : 0; // Can only have one active plan
    const activeChallengesCount = Object.values(activeChallenges).filter(
      (challenge: any) => challenge && !challenge.isPaused && !challenge.isCompleted
    ).length;
    
    return activePlansCount + activeChallengesCount;
  };

  // Calculate total completed segments from SQLite
  const getCompletedStoriesCount = () => {
    // This will be updated to use SQLite data when we implement proper querying
    return 0; // Placeholder - will be replaced with SQLite query
  };

  const handleScroll = (event: any) => {
    // Implementation of handleScroll function
  };

  const handleContinueReading = async (segmentId?: string) => {
    let segmentToRead = segmentId || state.lastReadSegment;
    if (!segmentToRead) {
      segmentToRead = 'S001';
      await updateLastReadSegment('S001');
    }
    const segmentData = SegmentTitles[segmentToRead as keyof typeof SegmentTitles];
    if (segmentData && segmentToRead) {
      setSelectedSegmentId(segmentToRead);
      setSelectedSegmentTitle(segmentData.title);
      setSelectedSegmentRef((segmentData as any).ref || '');
      setShowReadingModeModal(true);
    }
  };

  const handleComplete = async () => {
    // Show reading mode modal for the current segment
    if (state.lastReadSegment) {
      const segment = SegmentTitles[state.lastReadSegment as keyof typeof SegmentTitles];
      if (segment) {
        setSelectedSegmentId(state.lastReadSegment);
        setSelectedSegmentTitle(segment.title);
        setSelectedSegmentRef((segment as any).ref || '');
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
      setSelectedSegmentRef((segmentData as any).ref || '');
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
      setSelectedSegmentRef((segmentData as any).ref || '');
      setShowReadingModeModal(true);
    }
  };

  // Group Reading Handlers
  const handleJoinGroup = async (sessionId: string) => {
    // TODO: Parse session from QR code data
    logger.info('🔍 Joining session via QR code:', sessionId);
    
    router.push({
      pathname: '/join-group' as any,
      params: { 
        sessionId: sessionId,
        storyId: 'S001',
        storyTitle: 'God Creates',
        scriptureReference: 'Genesis 1:1-2:25',
        hostUserName: 'QR Host'
      }
    });
  };

  const handleDismissGroup = (sessionId: string) => {
    setDismissedGroups(prev => new Set(Array.from(prev).concat(sessionId)));
  };

  // Reading Mode Modal Handlers
  const handleIndividualReading = async () => {
    setShowReadingModeModal(false);
    
    // Clear any existing group session when starting individual reading
    if (currentSession) {
      await stopSession();
    }
    
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
    const dailyStoryMap = DailyStoryMap as string[];
    const dailySegmentId = dailyStoryMap && dailyStoryMap.length > 0 ? dailyStoryMap[(dayOfYear - 1) % dailyStoryMap.length] : null;
    
    if (selectedSegmentId === dailySegmentId && dailySegmentId) {
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
      params: {
        ...contextParams,
        freshStart: Date.now().toString() // Force fresh start from reading mode modal
      }
    });
    
    // Add listener for when user returns from reading to refresh streak
    setTimeout(() => {
      
      setRefreshTrigger(prev => prev + 1);
    }, 2000);
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

  // QR Code Scanner Functions
  const requestCameraPermission = async () => {
    try {
      logger.info('🔍 Requesting camera permission for QR scanning...');
      // For now, just show the scanner - it will handle permissions internally
      setShowScanner(true);
      setScanned(false);
      return true;
    } catch (error) {
      logger.error('🔴 Error requesting camera permission:', error);
      return false;
    }
  };

  const handleScanQRCode = async () => {
    try {
      setShowScanner(true);
      setScanned(false);
    } catch (error) {
      logger.error('🔴 Error with QR scanner:', error);
      Alert.alert('Error', 'QR scanner is currently unavailable');
    }
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    try {
      logger.info('🔍 QR Code scanned:', { type, data: data.substring(0, 50) + '...' });
      setScanned(true);
      
      // Parse QR code data
      const session = qrCodeDiscoveryManager.parseSessionFromQRCode(data);
      
      if (session) {
        logger.info('✅ Valid session QR code detected');
        // Navigate to role selection screen with session data
        router.push({
          pathname: '/role-selection' as any,
          params: {
            qrCodeData: data,
            sessionId: session.id,
            storyId: session.storyId,
            storyTitle: session.storyTitle,
            scriptureReference: session.scriptureReference,
            hostUserName: session.hostUserName,
            hostRole: session.participants[0].role
          }
        });
      } else {
        // Check if it's a completion QR code
        const completionData = qrCodeDiscoveryManager.parseCompletionFromQRCode(data);
        
        if (completionData) {
          logger.info('✅ Valid completion QR code detected');
          // Handle completion QR code
          Alert.alert(
            'Story Completion',
            'This QR code is for marking a story as complete in group reading mode.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Mark Complete', 
                onPress: () => handleCompletionQRCode(completionData)
              }
            ]
          );
        } else {
          logger.info('🔴 Invalid QR code format');
          Alert.alert(
            'Invalid QR Code',
            'This QR code is not recognized. Please scan a valid SourceView Together group reading QR code.',
            [{ text: 'OK' }]
          );
        }
      }
      
      setShowScanner(false);
    } catch (error) {
      logger.error('🔴 Error processing scanned QR code:', error);
      Alert.alert('Error', 'Failed to process QR code');
      setShowScanner(false);
    }
  };

  const handleCompletionQRCode = async (completionData: any) => {
    try {
      logger.info('✅ Processing completion QR code:', completionData);
      
      // TODO: Implement completion tracking
      // This will be implemented in Phase 5
      Alert.alert(
        'Completion Tracking',
        'Story completion tracking will be available in the next phase.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      logger.error('🔴 Error processing completion QR code:', error);
      Alert.alert('Error', 'Failed to process completion QR code');
    }
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
    setScanned(false);
  };

  // TODO: Replace with QR code-based group discovery
  const visibleNearbyGroups: any[] = [];

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
        setSelectedSegmentRef((segmentData as any).ref || '');
        setShowReadingModeModal(true);
      }
    }
  };

  // Helper to get full book name from code
  const getBookFullName = (bookCode: string) => {
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
    return bookNameMapping[bookCode] || bookCode;
  };

  // Helper to format book reference from segment
  const formatBookReference = (segment: any) => {
    if (!segment) return '';
    const bookName = segment.book && segment.book[0] ? segment.book[0] : '';
    const bookFullName = getBookFullName(bookName);
    return `${bookFullName}${segment.ref ? ` (${segment.ref})` : ''}`;
  };

  // Helper to format today's date (e.g., "Tuesday 8th Aug")
  const formatTodaysDate = () => {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const day = today.getDate();
    const month = today.toLocaleDateString('en-US', { month: 'short' });
    
    // Add ordinal suffix
    const getOrdinalSuffix = (num: number) => {
      if (num >= 11 && num <= 13) return 'th';
      switch (num % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return `${dayName} ${day}${getOrdinalSuffix(day)} ${month}`;
  };

  // Helper to check if there is at least one valid active plan or challenge
  const hasActivePlan = !!(activePlan && activePlan.planId && ReadingPlansChallenges.plans.find((plan: any) => plan.id === activePlan.planId && !activePlan.isCompleted && !activePlan.isPaused) && !activePlanDailyCompleted);
  const hasActiveChallenge = Object.values(activeChallenges).some((challenge: any) => {
    if (!challenge || challenge.isPaused || challenge.isCompleted) return false;
    // Check if the daily portion is completed
    if (activeChallengesDailyCompleted[challenge.challengeId]) return false;
    return ReadingPlansChallenges.challenges.some((c: any) => c.id === challenge.challengeId);
  });
  
  // Today's reading info
  const today = new Date();
  const dayOfYear = getDayOfYear(today);
  const dailySegmentId = (DailyStoryMap as string[])[(dayOfYear - 1) % DailyStoryMap.length];
  const dailySegment = SegmentTitles[dailySegmentId as keyof typeof SegmentTitles];
  const hasTodaysReading = !!(dailySegment && !isDailySegmentCompleted);
  
  // Show the section if there's Today's Reading, active plans, or active challenges
  const showTodaysStoriesSection = hasTodaysReading || hasActivePlan || hasActiveChallenge;

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
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
          
          {/* Single Reading Plans Card */}
          <Pressable 
            style={[styles.continueReading, { backgroundColor: '#00C853' }]}
            onPress={() => router.push("/ReadingPlans")}
          >
            <View style={styles.readingInfo}>
              <Text style={[styles.readingTitle, { color: '#FFFFFF' }]}>Reading Plans</Text>
              <Text style={[styles.readingSubtitle, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                Choose your Bible reading plans
              </Text>
            </View>
            <View style={styles.qrScanButton}>
              <Ionicons name="calendar-outline" size={32} color="#FFFFFF" />
            </View>
          </Pressable>
          
          {/* QR Code Group Reading Card */}
          <View style={[styles.continueReading, { backgroundColor: '#42A5F5' }]}>
            <View style={styles.readingInfo}>
              <Text style={[styles.readingTitle, { color: '#FFFFFF' }]}>Join Group Reading</Text>
              <Text style={[styles.readingSubtitle, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                Scan QR code to join a story group
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.qrScanButton}
              onPress={handleScanQRCode}
            >
              <Ionicons name="qr-code-outline" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Stories Section */}
        {showTodaysStoriesSection && (
          <View style={styles.activeReadingSection}>
            <Text style={styles.sectionTitle}>Today's Stories</Text>
            
            {/* Today's Reading - Always first */}
            {hasTodaysReading && dailySegment && (
              <View style={styles.activeReadingCard}>
                <View style={styles.activeReadingContent}>
                  <View style={[styles.activeReadingIcon, { backgroundColor: '#666666' }]}> 
                    <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.activeReadingInfo}>
                    <Text style={styles.activeReadingTitle}>{formatTodaysDate()}</Text>
                    <Text style={styles.activeReadingSubtitle}>{dailySegment.title}</Text>
                    <Text style={styles.activeReadingSubtitle}>
                      {formatBookReference(dailySegment)}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.continueButtonIcon} onPress={() => handleContinueReading(dailySegmentId)}>
                    <Ionicons name="play-circle-outline" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {hasActivePlan && activePlan && (
              (() => {
                const planData = ReadingPlansChallenges.plans.find((plan: any) => plan.id === activePlan.planId);
                if (!planData) return null;
                const planColor = getPlanCategoryColor(planData);
                return (
                  <View style={styles.activeReadingCard}>
                    <View style={styles.activeReadingContent}>
                      <View style={[styles.activeReadingIcon, { backgroundColor: planColor }]}> 
                        <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
                      </View>
                      <View style={styles.activeReadingInfo}>
                        <Text style={styles.activeReadingTitle}>{planData.title}</Text>
                        <Text style={styles.activeReadingSubtitle}>
                          {planProgress?.nextSegmentTitle || 'Plan Completed!'}
                        </Text>
                        <Text style={styles.activeReadingSubtitle}>
                          {(() => {
                            if (!planProgress?.nextSegmentId) return '';
                            const segment = SegmentTitles[planProgress.nextSegmentId as keyof typeof SegmentTitles];
                            return formatBookReference(segment);
                          })()}
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
              const challengeColor = getChallengeCategoryColor(challengeData);
              return (
                <View key={id} style={styles.activeReadingCard}>
                  <View style={styles.activeReadingContent}>
                    <View style={[styles.activeReadingIcon, { backgroundColor: challengeColor }]}> 
                      <Ionicons name="flag-outline" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.activeReadingInfo}>
                      <Text style={styles.activeReadingTitle}>{challengeData.title}</Text>
                      <Text style={styles.activeReadingSubtitle}>
                        {progressData?.nextSegmentTitle || 'Challenge Completed!'}
                      </Text>
                      <Text style={styles.activeReadingSubtitle}>
                        {(() => {
                          if (!progressData?.nextSegmentId) return '';
                          const segment = SegmentTitles[progressData.nextSegmentId as keyof typeof SegmentTitles];
                          return formatBookReference(segment);
                        })()}
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

        <ReadingInsightsCarousel 
          styles={combinedStyles} 
          currentStreak={currentStreak}
          bestStreak={bestStreak}
          isTodayComplete={isTodayComplete}
          refreshTrigger={refreshTrigger}
        />
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
        // Add context information for context-aware navigation
        context={(() => {
          // Check if this is today's reading
          const today = new Date();
          const dayOfYear = getDayOfYear(today);
          const dailyStoryMap = DailyStoryMap as string[];
          const dailySegmentId = dailyStoryMap && dailyStoryMap.length > 0 ? dailyStoryMap[(dayOfYear - 1) % dailyStoryMap.length] : null;
          
          if (selectedSegmentId === dailySegmentId && dailySegmentId) {
            return 'today';
          }
          // If we have an active plan and this segment is part of that plan, pass plan context
          else if (activePlan && planProgress?.nextSegmentId === selectedSegmentId) {
            return 'plan';
          }
          // If we have active challenges and this segment is part of any challenge, pass challenge context
          else if (Object.keys(activeChallenges).length > 0) {
            for (const [challengeId] of Object.entries(activeChallenges)) {
              const challengeProgress = challengeProgresses[challengeId];
              if (challengeProgress?.nextSegmentId === selectedSegmentId) {
                return 'challenge';
              }
            }
          }
          return 'main';
        })()}
        planId={(() => {
          if (activePlan && planProgress?.nextSegmentId === selectedSegmentId) {
            return activePlan.planId;
          }
          return undefined;
        })()}
        challengeId={(() => {
          if (Object.keys(activeChallenges).length > 0) {
            for (const [challengeId] of Object.entries(activeChallenges)) {
              const challengeProgress = challengeProgresses[challengeId];
              if (challengeProgress?.nextSegmentId === selectedSegmentId) {
                return challengeId;
              }
            }
          }
          return undefined;
        })()}
      />

      {/* QR Code Scanner Modal - migrated to expo-camera via `components/QRCodeScanner.tsx` */}
      {showScanner && (
        <View style={styles.scannerContainer}>
          <QRCodeScanner
            title="Scan QR Code"
            onClose={handleCloseScanner}
            onQRCodeScanned={(data: string) => {
              handleBarCodeScanned({ type: 'qr', data });
            }}
          />
        </View>
      )}
    </View>
  );
};

// Add default export
export default Home;