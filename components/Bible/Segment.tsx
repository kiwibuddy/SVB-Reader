import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"; // Ensure useEffect is imported
import logger from '@/utils/logger';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform, Animated, FlatList } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BibleBlockComponent from './BibleBlock';
import { BibleBlock, SegmentType } from "@/types";
import CallSheet from "@/components/thread/CallSheet";
import { splitContentIntoReaderParts } from "@/scripts/splitContentIntoReaderParts";
import { splitIntoParagraphs } from "@/scripts/splitIntoParagraphs";
import SegmentTitle from "./SegmentTitle";
import { useSQLiteGlobalContext } from "@/context/SQLiteGlobalContext";
import CelebrationPopup from "./CelebrationPopup";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAppSettings } from '@/context/SyncAppSettingsContext';
import { memo } from "react";
import { getSegmentCompletionStatus } from "@/api/sqlite";
import { ANIMATION } from '@/services/animation';
import * as Haptics from 'expo-haptics';
import { bookCodesForSegment, findVerseBlockIndex } from '@/utils/verseLocator';
import { findExchangeStart, findLongestSpeechStart } from '@/utils/castLocator';
import { normalizeBibleContent } from '@/utils/normalizeBibleContent';
import { assignReaders, readerSlots } from '@/utils/readerParts';

interface SegmentProps {
  segmentData: SegmentType;
  context?: 'main' | 'plan' | 'challenge';
  planId?: string;
  challengeId?: string;
  targetVerse?: number;
  targetChapter?: number;
  targetVoice?: string;
  targetPartner?: string;
  locate?: 'speech' | 'exchange';
  onVerseLocated?: (y: number) => void;
}

const icons = [
  { name: "star", label: "1" },
  { name: "star", label: "2" },
  { name: "star", label: "3" },
  { name: "star", label: "4" },
];

// OR define it directly if you prefer
interface ColorData {
  total: number;
  black: number;
  red: number;
  green: number;
  blue: number;
}

const SegmentComponent: React.FC<SegmentProps> = ({ 
  segmentData, 
  context = 'main',
  planId,
  challengeId,
  targetVerse,
  targetChapter,
  targetVoice,
  targetPartner,
  locate,
  onVerseLocated
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const isIPad = Platform.OS === 'ios' && Platform.isPad || (Platform.OS === 'ios' && screenWidth > 768);
  const insets = useSafeAreaInsets();

  const router = useRouter();
  const { 
    state,
    updateSegmentId,
  } = useSQLiteGlobalContext();
  const currentRole = null;
  const currentSession = null;

  const { colors } = useAppSettings();

  const { scrollReset, showCourtesy } = useLocalSearchParams();

  // All hooks must be called before any early returns
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedReader, setSelectedReader] = useState<number | null>(null);
  const [showCourtesyPopup, setShowCourtesyPopup] = useState(!!currentSession);
  const [isCompleted, setIsCompleted] = useState(false);
  const courtesyAnim = useRef(new Animated.Value(0));
  const courtesyDismissedRef = useRef(false);

  // Compute segID safely for use in hooks below
  const segID = useMemo(() => {
    const idValue = segmentData?.id;
    if (!idValue) return '';
    const parts = idValue.split('-');
    return parts[parts.length - 1] || '';
  }, [segmentData?.id]);

  // Courtesy popup slide-in animation from top
  useEffect(() => {
    const shouldShow = !!currentSession && showCourtesyPopup;
    if (shouldShow) {
      courtesyAnim.current.setValue(0);
      Animated.timing(courtesyAnim.current, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [currentSession, showCourtesyPopup]);

  // Reset selection in individual mode and auto-show when session becomes available
  useEffect(() => {
    if (!currentSession) {
      // ensure individual mode starts with no pre-selected role
      setSelectedReader(null);
    }
    const force = showCourtesy === '1';
    // Only show courtesy if not dismissed during this visit
    if (force && !courtesyDismissedRef.current) {
      setShowCourtesyPopup(true);
      return;
    }
    if (currentSession && !courtesyDismissedRef.current && !showCourtesyPopup) {
      setShowCourtesyPopup(true);
    }
  }, [currentSession, showCourtesyPopup, showCourtesy]);

  // Reset reading role when segment changes in individual mode
  useEffect(() => {
    if (!currentSession) {
      // Reset reading role selection when navigating to a new story in individual mode
      setSelectedReader(null);
    }
  }, [segID, currentSession]);

  const dismissCourtesy = useCallback(() => {
    courtesyDismissedRef.current = true;
    courtesyAnim.current.setValue(0);
    setShowCourtesyPopup(false);
  }, []);

  // Memoize the content to prevent unnecessary re-renders (with safe fallback)
  const memoizedContent = useMemo(() => {
    if (!segmentData?.content) return [];

    // ALWAYS split content into paragraphs first (breaks long speeches into smaller bubbles)
    // This ensures Moses' long speeches get broken up into multiple bubbles as shown in the example
    const splitContent = normalizeBibleContent(splitIntoParagraphs(segmentData.content));

    // Get readers array safely
    const safeReaders = segmentData.readers || [];

    // Check if there are duplicate colors in readers array
    const uniqueColors = new Set(safeReaders);
    const hasDuplicateColors = uniqueColors.size !== safeReaders.length;

    if (hasDuplicateColors) {
      // If multiple readers have same color, apply additional splitting logic
      // This further splits content for turn-taking among readers of the same color
      return splitContentIntoReaderParts(splitContent, safeReaders);
    } else {
      // If all readers have unique colors, just return the paragraph-split content
      return splitContent;
    }
  }, [segmentData?.content, segmentData?.readers]);

  const colorData = useMemo(() => {
    const precalculated = segmentData?.colors;
    if (precalculated && (precalculated.total || 0) > 0) return precalculated;
    const derived: ColorData = { black: 0, red: 0, green: 0, blue: 0, total: 0 };
    for (const block of memoizedContent) {
      const color = (block.source?.color || 'black') as keyof Omit<ColorData, 'total'>;
      const text = (block.children || [])
        .map((c: any) => (typeof c === 'string' ? c : c.text || '')).join(' ');
      const words = text.split(/\s+/).filter(Boolean).length;
      derived[color] = (derived[color] || 0) + words;
      derived.total += words;
    }
    return derived;
  }, [segmentData?.colors, memoizedContent]);

  const targetIndex = useMemo(() => {
    if (targetChapter != null && targetVerse != null) {
      return findVerseBlockIndex(
        memoizedContent,
        bookCodesForSegment(segID),
        targetChapter,
        targetVerse
      );
    }
    if (locate === 'speech' && targetVoice) {
      return findLongestSpeechStart(memoizedContent, targetVoice);
    }
    if (locate === 'exchange' && targetVoice && targetPartner) {
      return findExchangeStart(memoizedContent, targetVoice, targetPartner);
    }
    return -1;
  }, [memoizedContent, segID, targetChapter, targetVerse, targetVoice, targetPartner, locate]);

  const segmentTopRef = useRef<number | null>(null);
  const targetTopRef = useRef<number | null>(null);
  const reportedRef = useRef(false);

  useEffect(() => {
    reportedRef.current = false;
    targetTopRef.current = null;
  }, [targetIndex, segID]);

  const reportIfLocated = useCallback(() => {
    if (reportedRef.current || targetIndex < 0) return;
    const segmentTop = segmentTopRef.current;
    const targetTop = targetTopRef.current;
    if (segmentTop == null || targetTop == null) return;
    reportedRef.current = true;
    onVerseLocated?.(segmentTop + targetTop);
  }, [onVerseLocated, targetIndex]);

  const computedSources = useMemo(() => {
    const inkLabels: Record<string, string> = {
      black: 'The Narrator',
      red: 'God',
      green: 'Main Character',
      blue: 'Other Voices',
    };
    const acc: Record<string, { words: number; color: string }> = {};
    for (const block of memoizedContent) {
      const color = block.source?.color || 'black';
      const name = block.source?.sourceName || inkLabels[color] || 'Unknown';
      if (!acc[name]) acc[name] = { words: 0, color };
      const text = (block.children || [])
        .map((c: any) => (typeof c === 'string' ? c : c.text || '')).join(' ');
      acc[name].words += text.split(/\s+/).filter(Boolean).length;
    }
    const explicit = segmentData?.sources;
    if (explicit && typeof explicit === 'object') {
      for (const [name, info] of Object.entries(explicit)) {
        if (!name || name === 'undefined') continue;
        const words = typeof info === 'number' ? info : Number((info as { words?: number })?.words) || 0;
        const color = typeof info === 'object' ? (info as { color?: string })?.color || acc[name]?.color || 'black' : acc[name]?.color || 'black';
        if (!acc[name]) acc[name] = { words, color };
        else if (words > acc[name].words) acc[name].words = words;
      }
    }
    return acc;
  }, [segmentData?.sources, memoizedContent]);

  // The story's four reading parts, and which part reads each turn.
  const readerSlotsForStory = useMemo(
    () => readerSlots(segmentData?.readers, colorData),
    [segmentData?.readers, colorData]
  );

  const bubbleReaders = useMemo(
    () => assignReaders(memoizedContent, readerSlotsForStory),
    [memoizedContent, readerSlotsForStory]
  );

  // Load completion status from SQLite (hook must not be conditional)
  useEffect(() => {
    if (!segID) {
      setIsCompleted(false);
      return;
    }
    const loadCompletionStatus = async () => {
      try {
        const status = await getSegmentCompletionStatus(segID, context, planId, challengeId);
        setIsCompleted(status.isCompleted);
      } catch (error) {
        logger.error('Error loading completion status:', error);
        setIsCompleted(false);
      }
    };
    loadCompletionStatus();
  }, [segID, context, planId, challengeId]);

  // Emoji handling is now done directly in the Block component
  const handleLongPress = useCallback((block: BibleBlock, index: number) => {
    // The actual emoji picker logic is handled by EmojiHandler component
    // This function is called by the Block component when long press is detected
    // We can add any segment-level logic here if needed
    
    // Add haptic feedback to confirm the long press was detected
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        // Haptics not available - fail silently
      }
    }
  }, []);

  // Add null checks for segmentData AFTER all hooks declared above
  if (!segmentData || !segmentData.id) {
    logger.error('Invalid segment data:', segmentData);
    return null; // Or return an error state component
  }

  // Safe to access segmentData after null check
  const { content, readers = [], id } = segmentData;

  // Determine which completion state to use handled by effect above

  const colorRenderCount = new Map<string, number>(); // Track render counts

  // Note: We now use pre-calculated colorData from segmentData.colors instead of recalculating

  const getSpeakerStyle = (speaker: string) => {
    const baseStyle = {
      padding: 16,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
    };

    switch (speaker.toLowerCase()) {
      case 'narrator':
        return {
          ...baseStyle,
          backgroundColor: colors.bubbles.default,
          borderColor: colors.border,
        };
      case 'god':
        return {
          ...baseStyle,
          backgroundColor: colors.bubbles.red,
          borderColor: colors.border,
        };
      case 'jesus':
        return {
          ...baseStyle,
          backgroundColor: colors.bubbles.red,
          borderColor: colors.border,
        };
      case 'people':
        return {
          ...baseStyle,
          backgroundColor: colors.bubbles.blue,
          borderColor: colors.border,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.bubbles.default,
          borderColor: colors.border,
        };
    }
  };

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: 0,
  },
  roleContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderColor: colors.border,
    borderWidth: 1,
  },
  roleText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  verseContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderColor: colors.border,
    borderWidth: 1,
  },
  verseText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  verseNumber: {
    color: colors.secondary,
    fontSize: 12,
    marginRight: 4,
  },
  speakerText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  speakerLabel: {
    color: colors.secondary,
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  readerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  readerText: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
    color: colors.text,
    fontWeight: '500',
  },
  currentRoleBadge: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%'
  },
  divider: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    margin: 10,
  },
  reactionText: {
    fontSize: 30, // Adjust size as needed
    elevation: 3, // Optional: add shadow on Android
    shadowColor: "#000", // Optional: shadow color for iOS
    shadowOffset: { width: 0, height: 2 }, // Optional: shadow offset for iOS
    shadowOpacity: 0.2, // Optional: shadow opacity for iOS
    shadowRadius: 2, // Optional: shadow radius for iOS
  },
  reactionPosition: {
    position: "absolute",
    bottom: 0,
    right: 0,
    zIndex: 1,
  },
  reactionContainer: {
    flexDirection: "row",
    padding: 5, // Padding for the circle
    position: "absolute",
    top: -25, // Adjust as needed for overlap
    right: 0, // Adjust as needed for spacing from the right
    elevation: 3, // Optional: add shadow on Android
    shadowColor: "#000", // Optional: shadow color for iOS
    shadowOffset: { width: 0, height: 2 }, // Optional: shadow offset for iOS
    shadowOpacity: 0.2, // Optional: shadow opacity for iOS
    shadowRadius: 2, // Optional: shadow radius for iOS
  },
  readerRoleSelector: {
    marginVertical: 10,
    padding: 10,
  },
  readerRoleTitle: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  readerRoleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  roleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  activeRoleButton: {
    borderWidth: 3,
    borderColor: '#000',
  }
});

  // Update the render method where speech bubbles are rendered
  const renderSpeechBubble = (content: string, speaker: string) => (
    <View style={getSpeakerStyle(speaker)}>
      <Text style={styles.speakerLabel}>{speaker}</Text>
      <Text style={styles.speakerText}>{content}</Text>
    </View>
  );



  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        segmentTopRef.current = event.nativeEvent.layout.y;
        reportIfLocated();
      }}
    >
      <SegmentTitle segmentId={segID} />
      <CallSheet
        sources={computedSources}
        colorData={colorData}
        slots={readerSlotsForStory}
        selectedReader={selectedReader}
        onSelectReader={setSelectedReader}
      />

      {memoizedContent.map((item, index) => {
        const { sourceName, kind } = item.source || {};
        const isEditorial = kind === 'editorial';
        const showSourceName =
          !isEditorial &&
          (index === 0 ||
            memoizedContent[index - 1].source?.kind === 'editorial' ||
            memoizedContent[index - 1].source?.sourceName !== sourceName);
        // A turn belongs to the selected reader, not merely to their colour, so
        // four readers sharing an ink still light up one bubble each.
        const mine = selectedReader !== null && bubbleReaders[index] === selectedReader;

        return (
          <BibleBlockComponent
            key={`${item.source?.sourceName || item.source?.kind || 'block'}-${index}`}
            block={item}
            bIndex={index}
            hasTail={showSourceName}
            isGlowing={!isEditorial && mine}
            onLongPress={handleLongPress}
            isTarget={index === targetIndex}
            dimmed={!isEditorial && selectedReader !== null && !mine}
            onLayout={
              index === targetIndex
                ? (event) => {
                    targetTopRef.current = event.nativeEvent.layout.y;
                    reportIfLocated();
                  }
                : undefined
            }
          />
        );
      })}
      {/* Modal removed - emoji picker is now floating and handled by Block component */}
      <View style={styles.divider} />

      <CelebrationPopup 
        visible={showCelebration} 
        onComplete={() => setShowCelebration(false)}
      />
    </View>
  );
};

// Wrap the entire component in memo to prevent parent re-renders
export default memo(SegmentComponent);
