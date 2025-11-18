import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"; // Ensure useEffect is imported
import logger from '@/utils/logger';
import { View, Text, FlatList, ScrollView, Pressable, TouchableOpacity, StyleSheet, useWindowDimensions, Platform, Animated } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BibleBlockComponent from './BibleBlock';
import { BibleBlock, SegmentType } from "@/types";
import RoleProgressBar from "../RoleProgressBar";
import ChartLegend from "../ChartLegend";
import { MaterialIcons } from '@expo/vector-icons'; // Example icon library
import { splitContentIntoReaderParts } from "@/scripts/splitContentIntoReaderParts";
import { splitIntoParagraphs } from "@/scripts/splitIntoParagraphs";
import { getColors } from "@/scripts/getColors";
import SegmentTitle from "./SegmentTitle";
import { useSQLiteGlobalContext } from "@/context/SQLiteGlobalContext";
import CelebrationPopup from "./CelebrationPopup";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useGroupReading } from '@/context/GroupReadingContext';
import CheckCircle from "@/components/CheckCircle";
import { useAppSettings } from '@/context/AppSettingsContext';
import { memo } from "react";
import { getSegmentCompletionStatus } from "@/api/sqlite";
import { ANIMATION } from '@/services/animation';
import * as Haptics from 'expo-haptics';

interface SegmentProps {
  segmentData: SegmentType;
  context?: 'main' | 'plan' | 'challenge';
  planId?: string;
  challengeId?: string;
  targetVerse?: number;
  targetChapter?: number;
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
  targetChapter
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const isIPad = Platform.OS === 'ios' && Platform.isPad || (Platform.OS === 'ios' && screenWidth > 768);
  const insets = useSafeAreaInsets();

  const router = useRouter();
  const { 
    state,
    updateSegmentId,
  } = useSQLiteGlobalContext();
  const { currentRole, currentSession } = useGroupReading();
  // Removed completedSegments, activePlan, activeChallenges dependencies - now using pure SQLite

  const { colors } = useAppSettings();

  const { scrollReset, showCourtesy } = useLocalSearchParams();

  // All hooks must be called before any early returns
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedReaderPosition, setSelectedReaderPosition] = useState<{
    color: string;
    position: number;
  } | null>(null);
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
      setSelectedReaderPosition(null);
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
      setSelectedReaderPosition(null);
    }
  }, [segID, currentSession]);

  const dismissCourtesy = useCallback(() => {
    courtesyDismissedRef.current = true;
    courtesyAnim.current.setValue(0);
    setShowCourtesyPopup(false);
  }, []);

  // Use pre-calculated color data from segmentData (with safe fallback)
  const colorData = useMemo(() => {
    // Use the original pre-calculated color data that's based on word counts
    return segmentData?.colors || {
      black: 0,
      red: 0,
      green: 0,
      blue: 0,
      total: 0
    };
  }, [segmentData?.colors]);

  // Memoize the content to prevent unnecessary re-renders (with safe fallback)
  const memoizedContent = useMemo(() => {
    if (!segmentData?.content) return [];
    
    // ALWAYS split content into paragraphs first (breaks long speeches into smaller bubbles)
    // This ensures Moses' long speeches get broken up into multiple bubbles as shown in the example
    const splitContent = splitIntoParagraphs(segmentData.content);
    
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

  // Calculate reader roles based on actual speech bubble distribution
  const readersByColor = useMemo(() => {
    const maxRoles = 4;
    const result: { [color: string]: number[] } = {};
    
    // Count actual speech bubbles by color from memoized content
    const bubblesByColor = memoizedContent.reduce((acc, block) => {
      const color = block.source?.color || 'black';
      acc[color] = (acc[color] || 0) + 1;
      return acc;
    }, {} as { [color: string]: number });
    
    // Sort colors by bubble count (descending) to prioritize speakers with more bubbles
    const colorsByBubbleCount = Object.entries(bubblesByColor)
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count);
    
    let rolesAssigned = 0;
    
    // First pass: Ensure every speaker gets at least 1 role
    colorsByBubbleCount.forEach(({ color }) => {
      if (rolesAssigned < maxRoles) {
        result[color] = [0];
        rolesAssigned++;
      }
    });
    
    // Second pass: Distribute remaining roles proportionally to dominant speakers
    if (rolesAssigned < maxRoles) {
      const totalBubbles = Object.values(bubblesByColor).reduce((sum, c) => sum + c, 0);
      
      colorsByBubbleCount.forEach(({ color, count }) => {
        if (rolesAssigned >= maxRoles) return;
        
        const proportion = count / totalBubbles;
        const currentRoles = result[color]?.length || 0;
        
        // Calculate additional roles this color should get based on proportion
        const targetRoles = Math.round(proportion * maxRoles);
        const additionalRoles = Math.max(0, targetRoles - currentRoles);
        
        // Add additional roles up to remaining capacity
        const rolesToAdd = Math.min(additionalRoles, maxRoles - rolesAssigned);
        
        if (rolesToAdd > 0) {
          const currentPositions = result[color] || [];
          for (let i = 0; i < rolesToAdd; i++) {
            currentPositions.push(currentPositions.length);
            rolesAssigned++;
          }
          result[color] = currentPositions;
        }
      });
    }
    
    // Final pass: If still under 4 roles, give remaining to most dominant speaker
    if (rolesAssigned < maxRoles && colorsByBubbleCount.length > 0) {
      const dominantColor = colorsByBubbleCount[0].color;
      const currentPositions = result[dominantColor] || [];
      const additionalRoles = maxRoles - rolesAssigned;
      
      for (let i = 0; i < additionalRoles; i++) {
        currentPositions.push(currentPositions.length);
      }
      result[dominantColor] = currentPositions;
    }
   
    return result;
  }, [memoizedContent]);

  // Preselect reader role from GroupReadingContext when available
  useEffect(() => {
    if (!currentRole) return;
    const roleToColor: Record<string, string> = {
      narrator: 'black',
      god: 'red',
      main_character: 'green',
      other_voices: 'blue',
    };
    const color = roleToColor[currentRole];
    const positions = readersByColor[color] || [0];
    setSelectedReaderPosition({ color, position: 0 });
  }, [currentRole, readersByColor]);

  const currentRoleLabel = useMemo(() => {
    if (!currentRole) return null;
    const roleLabels: Record<string, string> = {
      narrator: 'Narrator',
      god: 'God',
      main_character: 'Main Character',
      other_voices: 'Other Voices',
    };
    return roleLabels[currentRole] || null;
  }, [currentRole]);

  // Determine which role starts based on first speaking block
  const firstSpeakerInfo = useMemo(() => {
    const firstBlock = memoizedContent.find(b => !!b.source?.color);
    if (!firstBlock) return null;
    const color = firstBlock.source?.color || 'black';
    const map: Record<string, string> = { black: 'Narrator', red: 'God', green: 'Main Character', blue: 'Other Voices' };
    return { color, label: map[color] || 'Reader' };
  }, [memoizedContent]);

  // Update shouldBlockGlow to use the new state
  const shouldBlockGlow = useCallback((blockColor: string, blockIndex: number) => {
    if (!selectedReaderPosition) return false;
    
    const { color, position } = selectedReaderPosition;
    if (blockColor !== color) return false;

    const colorPositions = readersByColor[blockColor] || [];
    if (colorPositions.length <= 1) {
      return position === 0;
    }

    // For multiple readers of same color - USE MEMOIZED CONTENT (the split content)
    const blocksOfThisColor = memoizedContent.filter(item => item.source?.color === blockColor);
    const positionInSequence = blocksOfThisColor.findIndex(item => 
      memoizedContent.indexOf(item) === blockIndex
    );
    return positionInSequence % colorPositions.length === position;
  }, [memoizedContent, readersByColor, selectedReaderPosition]);

  // Update renderItem to use new glow logic
  const renderItem = useCallback(({ item, index }: { item: BibleBlock; index: number }) => {
    const { sourceName } = item.source || {};
    const showSourceName = index === 0 || 
      memoizedContent[index - 1].source?.sourceName !== sourceName;

    const isGlowing = shouldBlockGlow(item.source?.color || 'black', index);

    return (
      <BibleBlockComponent
        block={item}
        bIndex={index}
        hasTail={showSourceName}
        isGlowing={isGlowing}
        onLongPress={(block: BibleBlock, index: number) => {
          // This is now handled by the Block component itself
        }}
      />
    );
  }, [memoizedContent, shouldBlockGlow]);

  const flatListRef = useRef<FlatList>(null);

  // Force scroll to top whenever the segment changes
  useEffect(() => {
    // Immediate scroll
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    
    // Double-check after a brief moment to ensure content is rendered
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      if (Platform.OS === 'web') {
        window.scrollTo(0, 0);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [segmentData?.id]);

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

  const handleReaderRoleSelect = (color: string, position: number) => {
    setSelectedReaderPosition(prev => {
      // If clicking the already selected role, deselect it
      if (prev?.color === color && prev?.position === position) {
        return null;
      }
      // Otherwise select this new role (deselecting any previous role)
      return { color, position };
    });
  };



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        automaticallyAdjustKeyboardInsets={true}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        // Add gesture handling to prevent conflicts with long press
        onScrollBeginDrag={() => {
          // ScrollView drag started - no logging needed in production
        }}
        // Disable scroll when long press is detected
        scrollEnabled={true}
      >
        <SegmentTitle segmentId={segID} />
        <View style={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 0,
          width: '100%',
        }}>
          {/* Role Selection Section - Full Width */}
          <View style={styles.readerSection}>
            <Text style={styles.readerText}>
              {currentSession ? 'Your reading role' : 'Select your reading role:'}
            </Text>
            {/* Remove separate badge; title above communicates selection */}
            <View style={styles.iconContainer}>
              {/* Create reader role icons based on actual speech bubble distribution */}
              {(() => {
                const roleIcons: React.ReactElement[] = [];
                
                // Use the same logic as readersByColor to create icons
                Object.entries(readersByColor).forEach(([color, positions]) => {
                  positions.forEach((position) => {
                    const isActive = selectedReaderPosition?.color === color && 
                                    selectedReaderPosition?.position === position;
                    const colors = getColors(color);
                    
                    roleIcons.push(
                      <TouchableOpacity
                        key={`${color}-${position}`}
                        onPress={() => handleReaderRoleSelect(color, position)}
                      >
                        <MaterialIcons
                          name={isActive ? "mark-chat-read" : "chat-bubble"}
                          size={30}
                          color={color === "black" ? "grey" : isActive ? colors.dark : colors.light}
                        />
                      </TouchableOpacity>
                    );
                  });
                });
                
                return roleIcons;
              })()}
            </View>
          </View>
          
          {/* Progress Bar Section - As Divider */}
          <View style={{ marginTop: 24, marginBottom: 20, marginHorizontal: -16 }}>
            <RoleProgressBar 
              colorData={colorData}
              height={4}
            />
          </View>
        </View>

        {/* Audio Controls removed - now in navigation bar */}

        {/* Render blocks directly */}
        {memoizedContent.map((item, index) => {
          const { sourceName } = item.source || {};
          const showSourceName = index === 0 || 
            memoizedContent[index - 1].source?.sourceName !== sourceName;

          const isGlowing = shouldBlockGlow(item.source?.color || 'black', index);

          return (
            <BibleBlockComponent
              key={`${item.source?.sourceName || 'unknown'}-${index}`}
              block={item}
              bIndex={index}
              hasTail={showSourceName}
              isGlowing={isGlowing}
              onLongPress={handleLongPress}
              targetVerse={targetVerse}
              targetChapter={targetChapter}
            />
          );
        })}
      </ScrollView>
      {/* Courtesy popup overlay - COMMENTED OUT FOR NOW
      {showCourtesyPopup && currentSession && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={dismissCourtesy}
          onLongPress={dismissCourtesy}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, alignItems: 'center', justifyContent: 'flex-start', paddingTop: Math.max(insets.top + 100, (isIPad ? 140 : 100)) }}
        >
          <Animated.View style={{
            backgroundColor: '#42A5F5',
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 18,
            maxWidth: 460,
            marginHorizontal: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 5,
            opacity: courtesyAnim.current,
            transform: [{ translateY: courtesyAnim.current.interpolate({ inputRange: [0,1], outputRange: [-12, 0] }) }]
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 6 }}>
              Get Ready
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 14, textAlign: 'center', marginBottom: 6 }}>
              Please wait for the other 3 readers to be ready.
            </Text>
            {firstSpeakerInfo && (
              <Text style={{ color: '#FFFFFF', fontSize: 13, textAlign: 'center', opacity: 0.95 }}>
                {currentRole && selectedReaderPosition && firstSpeakerInfo.color === selectedReaderPosition.color
                  ? 'You are the first reader.'
                  : `${firstSpeakerInfo.label} starts first.`}
              </Text>
            )}
          </Animated.View>
        </TouchableOpacity>
      )}
      */}
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
