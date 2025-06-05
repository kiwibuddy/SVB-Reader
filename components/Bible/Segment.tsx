import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"; // Ensure useEffect is imported
import { View, Text, FlatList, Pressable, TouchableOpacity, Modal, StyleSheet, useWindowDimensions, Platform, ScrollView } from "react-native";
import { BlurView } from "expo-blur";
import BibleBlockComponent from './Block';
import { BibleBlock, SegmentType } from "@/types";
import PieChart from "../PieChart";
import ChartLegend from "../ChartLegend";
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; // Example icon library
// import { splitContentIntoReaderParts } from "@/scripts/splitContentIntoReaderParts";
import { splitIntoParagraphs } from "@/scripts/splitIntoParagraphs";
import { getColors } from "@/scripts/getColors";
import SegmentTitle from "./SegmentTitle";
import EmojiPicker from "../EmojiPicker";
import { addEmoji } from "@/api/sqlite";
import { useAppContext } from "@/context/GlobalContext";
import CelebrationPopup from "./CelebrationPopup";
import { useRouter, useLocalSearchParams } from "expo-router";
import CheckCircle from "@/components/CheckCircle";
import { useAppSettings } from '@/context/AppSettingsContext';
import { memo } from "react";

interface SegmentProps {
  segmentData: SegmentType;
  context?: 'main' | 'plan' | 'challenge';
  planId?: string;
  challengeId?: string;
  verse?: string | string[];
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
  verse: verseProp
}) => {
  // Move ALL hooks to the very top - consolidate useLocalSearchParams calls
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const { colors } = useAppSettings();
  const { 
    completedSegments, 
    markSegmentComplete,
    activePlan,
    activeChallenges,
    emojiActions,
    updateEmojiActions,
    updateReadingPlanProgress,
    updateChallengeProgress,
  } = useAppContext();
  
  // Consolidate ALL useLocalSearchParams calls here
  const allParams = useLocalSearchParams();
  const { scrollReset, verse: urlVerse, chapter: urlChapter } = allParams;
  
  // Use verse from props, fallback to URL params for backward compatibility
  const verseParam = verseProp || urlVerse;
  const verse = Array.isArray(verseParam) ? verseParam[0] : verseParam;

  const isIPad = Platform.OS === 'ios' && Platform.isPad || (Platform.OS === 'ios' && screenWidth > 768);

  // Add debugging for verse parameter
  useEffect(() => {
    console.log('🎯 Verse parameter received:', verse, typeof verse);
    console.log('🔧 verseProp:', verseProp);
    console.log('🔧 urlVerse:', urlVerse);
    console.log('🔧 Final verse value:', verse);
  }, [verse, verseProp, urlVerse]);

  // Simplified debugging for all search params
  useEffect(() => {
    console.log('🔧 ALL useLocalSearchParams():', allParams);
  }, [allParams]);

  // Add null checks for segmentData
  if (!segmentData || !segmentData.id) {
    console.error('Invalid segment data:', segmentData);
    return null; // Or return an error state component
  }

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<{
    block: BibleBlock;
    index: number;
    position: { x: number; y: number };
  } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const { content, readers = [], id } = segmentData;
  const segID = id.split("-")[id.split("-").length - 1];

  const [colorData, setColorData] = useState({
    black: 0,
    red: 0,
    green: 0,
    blue: 0,
    total: 0
  });

  // Updated reader selection state - store selected reader number (0-3)
  const [readerNumber, setReaderNumber] = useState<number | null>(null);
  const [selectedReaderColor, setSelectedReaderColor] = useState<string | null>(null);

  // Determine which completion state to use
  const getIsCompleted = () => {
    if (context === 'main') {
      return completedSegments[segID]?.isCompleted || false;
    }
    if (planId && activePlan?.planId === planId) {
      return activePlan.completedSegments.includes(segID);
    }
    if (challengeId && activeChallenges[challengeId]) {
      return activeChallenges[challengeId].completedSegments.includes(segID);
    }
    return false;
  };

  const isCompleted = getIsCompleted();

  const handleLongPress = (block: BibleBlock, index: number, position?: { x: number; y: number }) => {
    // Use the bubble position if provided, otherwise use screen center as fallback
    const finalPosition = position || { 
      x: screenWidth / 2, 
      y: 300 
    };

    setSelectedBlock({ block, index, position: finalPosition });
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = async (emoji: string) => {
    if (selectedBlock) {
      const { block, index } = selectedBlock;
      try {
        await addEmoji(segID, index.toString(), block, emoji);
        if (emojiActions !== undefined) {
          updateEmojiActions(emojiActions + 1);
        }
      } catch (error) {
        console.error("Error setting emoji:", error);
      }
    }
    setShowEmojiPicker(false);
    setSelectedBlock(null);
  };

  const handleEmojiPickerClose = () => {
    setShowEmojiPicker(false);
    setSelectedBlock(null);
  };

  // Memoize the content to prevent unnecessary re-renders
  const memoizedContent = useMemo(() => {
    return splitIntoParagraphs(segmentData.content);
  }, [segmentData.content]);

  // **IMPROVED TURN-BASED READING ALGORITHM**
  const colorRenderCount = useRef(new Map<string, number>()).current; // Persistent render count

  // Reset render counts when reader selection changes
  useEffect(() => {
    colorRenderCount.clear();
  }, [readerNumber, selectedReaderColor]);

  useEffect(() => {
    // Calculate color counts from content
    const counts = memoizedContent.reduce((acc, block) => {
      const color = block.source.color as keyof typeof acc;
      acc[color] = (acc[color] || 0) + 1;
      acc.total += 1;
      return acc;
    }, {
      black: 0,
      red: 0,
      green: 0,
      blue: 0,
      total: 0
    } as ColorData);
    
    setColorData(counts);
  }, [memoizedContent]);

  // Add debugging for content structure
  useEffect(() => {
    if (memoizedContent && memoizedContent.length > 0) {
      console.log('📚 Content loaded, total blocks:', memoizedContent.length);
      console.log('📝 First block structure:', JSON.stringify(memoizedContent[0], null, 2));
    }
  }, [memoizedContent]);

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
  }, [segmentData.id]);

  // REAL VERSE SCROLLING: Enhanced verse detection logic  
  useEffect(() => {
    console.log('🔄 Verse scrolling effect triggered with verse:', verse, 'content length:', memoizedContent.length);
    
    if (verse && flatListRef.current && memoizedContent.length > 0) {
      const targetVerse = parseInt(verse as string);
      console.log('🎯 Attempting to scroll to verse:', targetVerse);
      console.log('📊 Total blocks in content:', memoizedContent.length);
      
      // Parse the URL params to get the chapter information
      const segmentParam = allParams.segment as string;
      console.log('🔍 Segment param:', segmentParam);
      
      // Extract chapter from the navigation context - we need to determine which chapter we're looking for
      // For now, let's find ALL chapters and verses in this segment
      console.log('🔍 DEBUGGING: Available chapters and verses in this segment:');
      const chaptersAndVerses: {[chapter: number]: number[]} = {};
      let currentChapter = 0;
      
      memoizedContent.forEach((block, index) => {
        if (block.children && Array.isArray(block.children)) {
          // Search in the inline children (BibleInline[])
          block.children.forEach((inline: any) => {
            if (inline.children && Array.isArray(inline.children)) {
              // Search in the leaf children (BibleLeaf[])
              inline.children.forEach((leaf: any) => {
                if (leaf && typeof leaf === 'object') {
                  // Look for chapter markers: tag array containing "c"
                  if (Array.isArray(leaf.tag) && leaf.tag.includes('c') && leaf.text) {
                    const chapterNum = parseInt(leaf.text);
                    if (!isNaN(chapterNum)) {
                      currentChapter = chapterNum;
                      if (!chaptersAndVerses[currentChapter]) {
                        chaptersAndVerses[currentChapter] = [];
                      }
                      console.log(`📖 Found chapter ${chapterNum} in block ${index}`);
                    }
                  }
                  
                  // Look for verse tags: tag array containing "v" and text with verse number
                  if (Array.isArray(leaf.tag) && leaf.tag.includes('v') && leaf.text && currentChapter > 0) {
                    const verseNum = parseInt(leaf.text);
                    if (!isNaN(verseNum)) {
                      if (!chaptersAndVerses[currentChapter]) {
                        chaptersAndVerses[currentChapter] = [];
                      }
                      chaptersAndVerses[currentChapter].push(verseNum);
                      console.log(`✅ Found chapter ${currentChapter}, verse ${verseNum} in block ${index}`);
                    }
                  }
                }
              });
            }
          });
        }
      });
      
      console.log('📋 Chapters and verses in this segment:', chaptersAndVerses);
      
      // Get target chapter from URL params, fallback to 3 for backward compatibility
      const targetChapter = urlChapter ? parseInt(Array.isArray(urlChapter) ? urlChapter[0] : urlChapter) : 3;
      console.log(`🎯 Looking for chapter ${targetChapter}, verse ${targetVerse}`);
      
      if (!chaptersAndVerses[targetChapter]) {
        console.log(`⚠️ WARNING: Chapter ${targetChapter} not found in this segment!`);
        console.log('📖 Available chapters:', Object.keys(chaptersAndVerses).map(Number).sort((a, b) => a - b));
        return;
      }
      
      if (!chaptersAndVerses[targetChapter].includes(targetVerse)) {
        console.log(`⚠️ WARNING: Verse ${targetVerse} not found in chapter ${targetChapter}!`);
        console.log(`📖 Available verses in chapter ${targetChapter}:`, chaptersAndVerses[targetChapter].sort((a, b) => a - b));
        return;
      }

      // Find the block that contains the target chapter and verse
      currentChapter = 0;
      const targetBlockIndex = memoizedContent.findIndex((block, index) => {
        if (block.children && Array.isArray(block.children)) {
          return block.children.some((inline: any) => {
            if (inline.children && Array.isArray(inline.children)) {
              return inline.children.some((leaf: any) => {
                if (leaf && typeof leaf === 'object') {
                  // Update current chapter when we find a chapter marker
                  if (Array.isArray(leaf.tag) && leaf.tag.includes('c') && leaf.text) {
                    const chapterNum = parseInt(leaf.text);
                    if (!isNaN(chapterNum)) {
                      currentChapter = chapterNum;
                    }
                  }
                  
                  // Look for the target verse in the target chapter
                  if (Array.isArray(leaf.tag) && leaf.tag.includes('v') && 
                      leaf.text && currentChapter === targetChapter) {
                    const verseNum = parseInt(leaf.text);
                    if (verseNum === targetVerse) {
                      console.log(`✅ Found target chapter ${targetChapter}, verse ${targetVerse} in block ${index}`);
                      return true;
                    }
                  }
                }
                return false;
              });
            }
            return false;
          });
        }
        return false;
      });

      console.log('🎯 Final target block index:', targetBlockIndex);

      if (targetBlockIndex !== -1) {
        console.log('🚀 Attempting to scroll to verse block:', targetBlockIndex);
        
        const scrollTimer = setTimeout(() => {
          console.log('⏰ Timer fired, executing scroll...');
          
          // Step 1: Scroll to approximate position (conservative estimate)
          const conservativeOffset = targetBlockIndex * 60; // Conservative estimate
          console.log(`📍 First scroll to conservative offset: ${conservativeOffset}`);
          
          flatListRef.current?.scrollToOffset({
            offset: conservativeOffset,
            animated: false, // Non-animated for first position
          });
          
          // Step 2: After a brief moment, try scrollToIndex for precise positioning
          setTimeout(() => {
            console.log('🎯 Attempting precise scrollToIndex...');
            try {
              flatListRef.current?.scrollToIndex({
                index: targetBlockIndex,
                animated: true,
                viewPosition: 0.0,
              });
              console.log('✅ Final scrollToIndex executed successfully');
            } catch (error) {
              console.log('❌ Final scrollToIndex failed, staying at conservative position');
            }
          }, 500); // Short delay for the second scroll
          
          console.log('✅ Two-stage scroll initiated for chapter', targetChapter, 'verse', targetVerse);
        }, 3000);

        return () => clearTimeout(scrollTimer);
      } else {
        console.log('❌ Verse not found with any search method');
        console.log(`💡 Suggestion: Check if chapter ${targetChapter}, verse ${targetVerse} exists in this segment`);
      }
    }
  }, [verse, memoizedContent, allParams]);

  const handleCompletion = async () => {
    if (context === 'main') {
      await markSegmentComplete(segID, true);
    } else if (planId) {
      await updateReadingPlanProgress(planId, segID);
    } else if (challengeId) {
      await updateChallengeProgress(challengeId, segID);
    }
    setShowCelebration(true);
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    
    // Check if this is part of a plan or challenge
    if (planId && activePlan) {
      const remainingSegments = activePlan.completedSegments;
      // Note: We don't have access to the full segment list here
      // You may need to adjust this logic based on your data structure
    }
    
    if (challengeId && activeChallenges[challengeId]) {
      const challenge = activeChallenges[challengeId];
      const remainingSegments = challenge.completedSegments;
      // Note: We don't have access to the full segment list here
      // You may need to adjust this logic based on your data structure
    }
  };

  const handleComplete = async () => {
    await handleCompletion();
  };

  const getSpeakerStyle = (speaker: string) => {
    const baseStyle = {
      ...styles.verseContainer,
      marginVertical: 4,
      padding: 12,
      borderRadius: 8,
    };

    switch (speaker) {
      case 'red':
        return {
          ...baseStyle,
          backgroundColor: colors.bubbles.red,
          borderColor: colors.border,
        };
      case 'green':
        return {
          ...baseStyle,
          backgroundColor: colors.bubbles.green,
          borderColor: colors.border,
        };
      case 'blue':
        return {
          ...baseStyle,
          backgroundColor: colors.bubbles.blue,
          borderColor: colors.border,
        };
      case 'black':
        return {
          ...baseStyle,
          backgroundColor: colors.bubbles.black,
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

  // **IMPROVED READER ROLE SELECTION**
  const handleIconPress = (index: number) => {
    const readerColor = readers[index];
    setReaderNumber((prev) => {
      const newValue = prev === index ? null : index;
      setSelectedReaderColor(newValue === null ? null : readerColor);
      return newValue;
    });
  };

  // Group readers by color to know position within that color
  const readersByColor = useMemo(() => {
    return readers.reduce((acc, color, index) => {
      if (!acc[color]) {
        acc[color] = [];
      }
      acc[color].push(index);
      return acc;
    }, {} as { [color: string]: number[] });
  }, [readers]);

  // **FIXED TURN-BASED ALGORITHM** - This is the core logic from the documentation
  const shouldBlockGlow = useCallback((blockColor: string, blockIndex: number) => {
    if (!selectedReaderColor || readerNumber === null) return false;
    if (blockColor !== selectedReaderColor) return false;

    // Count how many readers selected this color
    const colorReaders = readers.filter((reader) => reader === blockColor);
    const numberOfColorReaders = colorReaders.length;

    // Initialize render count tracking for this color
    if (!colorRenderCount.has(blockColor)) {
      colorRenderCount.set(blockColor, 0);
    }

    const currentRenderCount = colorRenderCount.get(blockColor)!;
    let shouldRead = false;

    if (numberOfColorReaders === 1) {
      // Single color reader logic - they read all bubbles of their color
      shouldRead = blockColor === selectedReaderColor;
    } else {
      // Multiple color readers logic - take turns
      const indices = readers.reduce<number[]>((acc, reader, index) => {
        if (reader === selectedReaderColor) acc.push(index);
        return acc;
      }, []);
      const position = indices.indexOf(readerNumber!);
      shouldRead = currentRenderCount % numberOfColorReaders === position;
    }

    // Increment render count after determining shouldRead
    colorRenderCount.set(blockColor, currentRenderCount + 1);

    return shouldRead;
  }, [readers, selectedReaderColor, readerNumber, colorRenderCount]);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 16,
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
  chartSection: {
    flex: 1,
    maxWidth: '40%',
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  readerSection: {
    flex: 3, 
    justifyContent: "center", 
    alignItems: "center", 
    height: "100%",
    paddingLeft: 10,
  },
  readerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 20
  },
  readerText: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
    color: colors.text, // Add theme color
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
  emojiPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  emojiPickerWrapper: {
    position: 'absolute',
    zIndex: 1001,
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

  // **IMPROVED RENDER ITEM** - Uses advanced conversation flow analysis
  const renderItem = useCallback(({ item, index }: { item: BibleBlock; index: number }) => {
    const { sourceName } = item.source;
    const showSourceName = index === 0 || 
      memoizedContent[index - 1].source.sourceName !== sourceName;

    const isGlowing = shouldBlockGlow(item.source.color, index);

    // Advanced conversation context analysis
    const previousSpeaker = index > 0 ? memoizedContent[index - 1].source.sourceName : undefined;
    const nextSpeaker = index < memoizedContent.length - 1 ? memoizedContent[index + 1].source.sourceName : undefined;
    
    // Detect speaker sequences for advanced spacing
    const isFirstInSequence = previousSpeaker !== sourceName;
    const isLastInSequence = nextSpeaker !== sourceName;

    return (
      <BibleBlockComponent
        block={item}
        bIndex={index}
        hasTail={showSourceName}
        toRead={isGlowing}
        onLongPress={handleLongPress}
        isFirstInSequence={isFirstInSequence}
        isLastInSequence={isLastInSequence}
        previousSpeaker={previousSpeaker}
        nextSpeaker={nextSpeaker}
      />
    );
  }, [memoizedContent, shouldBlockGlow]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={memoizedContent}
        ListHeaderComponent={() => (
          <>
            <SegmentTitle segmentId={segID} />
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 10,
              paddingVertical: isIPad ? 5 : 5,
              width: '100%',
              height: isIPad ? 120 : 100,
            }}>
              {/* Chart Section */}
              <View style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                height: "100%",
              }}>
                <View style={styles.chartSection}>
                  <PieChart 
                    colorData={colorData}
                    size={isIPad ? Math.min(screenWidth * 0.15, 120) : 80}
                  />
                </View>
                <View style={styles.readerSection}>
                  <View style={styles.readerContainer}>
                    <Text style={styles.readerText}>
                      Select your reading role:
                    </Text>
                    <View style={styles.iconContainer}>
                      {readers.map((readerColor, index) => {
                        const colors = getColors(readerColor);
                        const isActive = readerNumber === index;
                        
                        // Get proper icon color that's always visible
                        const getIconColor = () => {
                          if (readerColor === "black") {
                            return isActive ? "#1A202C" : "#A0AEC0";
                          }
                          
                          if (isActive) {
                            // Use bright, vibrant versions that match the app's energetic style
                            switch (readerColor) {
                              case "red": return "#BE185D"; // Vibrant deep pink, matches text color
                              case "green": return "#0D9488"; // Vibrant teal, matches text color
                              case "blue": return "#1E40AF"; // Vibrant blue, matches text color
                              default: return colors.light;
                            }
                          } else {
                            // Use bright, lighter versions when not selected for energy
                            switch (readerColor) {
                              case "red": return "#F687B3"; // Bright light pink
                              case "green": return "#4FD1C7"; // Bright light teal
                              case "blue": return "#60A5FA"; // Bright light blue
                              default: return colors.light;
                            }
                          }
                        };
                        
                        return (
                          <TouchableOpacity
                            key={index}
                            onPress={() => handleIconPress(index)}
                          >
                            <MaterialIcons
                              name={isActive ? "mark-chat-read" : "chat-bubble"}
                              size={30}
                              color={getIconColor()}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
          </>
        )}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.source.sourceName}-${index}`}
        ListFooterComponent={() => (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <CheckCircle
              segmentId={segID}
              context={context}
              planId={planId}
              challengeId={challengeId}
              onCelebration={() => setShowCelebration(true)}
            />
          </View>
        )}
        // Expert-level performance and UX optimizations
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={4}
        updateCellsBatchingPeriod={100}
        removeClippedSubviews={true}
        onLayout={() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        }}
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingBottom: 24,
        }}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets={true}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
        onScrollToIndexFailed={(error) => {
          // Handle scroll failure gracefully with improved logging
          console.log('❌ onScrollToIndexFailed called:', error);
          console.log(`📊 Error details: index=${error.index}, highestMeasuredFrameIndex=${error.highestMeasuredFrameIndex}, averageItemLength=${error.averageItemLength}`);
          
          // Use a more conservative offset calculation
          const conservativeOffset = Math.min(
            error.averageItemLength * error.index,
            error.averageItemLength * error.highestMeasuredFrameIndex + (error.index - error.highestMeasuredFrameIndex) * 60
          );
          
          console.log(`📍 Fallback scroll offset: ${conservativeOffset}`);
          flatListRef.current?.scrollToOffset({ offset: conservativeOffset, animated: true });
        }}
      />

      {/* Simple positioned emoji picker - no modal or overlay */}
      {showEmojiPicker && selectedBlock && (
        <>
          <Pressable
            style={styles.emojiPickerOverlay}
            onPress={handleEmojiPickerClose}
          />
          <View
            style={[
              styles.emojiPickerWrapper,
              {
                left: Math.max(10, Math.min(selectedBlock.position.x - 100, screenWidth - 210)),
                top: Math.max(100, selectedBlock.position.y - 60),
              }
            ]}
          >
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              onClose={handleEmojiPickerClose}
            />
          </View>
        </>
      )}

      <View style={styles.divider} />

      <CelebrationPopup 
        visible={showCelebration} 
        onComplete={handleCelebrationComplete}
      />
    </View>
  );
};

// Wrap the entire component in memo to prevent parent re-renders
export default memo(SegmentComponent);
