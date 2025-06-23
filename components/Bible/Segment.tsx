import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"; // Ensure useEffect is imported
import { View, Text, FlatList, Pressable, TouchableOpacity, Modal, StyleSheet, useWindowDimensions, Platform, ScrollView } from "react-native";
import { BlurView } from "expo-blur";
import BibleBlockComponent from './BibleBlock';
import { BibleBlock, SegmentType } from "@/types";
import RoleProgressBar from "../RoleProgressBar";
import ChartLegend from "../ChartLegend";
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; // Example icon library
import { splitContentIntoReaderParts } from "@/scripts/splitContentIntoReaderParts";
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
  challengeId
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const isIPad = Platform.OS === 'ios' && Platform.isPad || (Platform.OS === 'ios' && screenWidth > 768);

  const router = useRouter();
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

  const { colors } = useAppSettings();

  const { scrollReset } = useLocalSearchParams();

  // Add null checks for segmentData
  if (!segmentData || !segmentData.id) {
    console.error('Invalid segment data:', segmentData);
    return null; // Or return an error state component
  }

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<{
    block: BibleBlock;
    index: number;
  } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const { content, readers = [], id } = segmentData;
  const segID = id.split("-")[id.split("-").length - 1];

  // Track which reader role is currently selected
  const [selectedReaderPosition, setSelectedReaderPosition] = useState<{
    color: string;
    position: number;
  } | null>(null);

  // Use pre-calculated color data from segmentData instead of recalculating from split content
  const colorData = useMemo(() => {
    // Use the original pre-calculated color data that's based on word counts
    return segmentData.colors || {
      black: 0,
      red: 0,
      green: 0,
      blue: 0,
      total: 0
    };
  }, [segmentData.colors]);

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

  const handleLongPress = (block: BibleBlock, index: number) => {
    setSelectedBlock({ block, index });
    setIsModalVisible(true);
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
    setIsModalVisible(false);
  };

  // Memoize the content to prevent unnecessary re-renders
  const memoizedContent = useMemo(() => {
    // ALWAYS split content into paragraphs first (breaks long speeches into smaller bubbles)
    // This ensures Moses' long speeches get broken up into multiple bubbles as shown in the example
    const splitContent = splitIntoParagraphs(segmentData.content);
    
    // Check if there are duplicate colors in readers array
    const uniqueColors = new Set(readers);
    const hasDuplicateColors = uniqueColors.size !== readers.length;
    
    if (hasDuplicateColors) {
      // If multiple readers have same color, apply additional splitting logic
      // This further splits content for turn-taking among readers of the same color
      return splitContentIntoReaderParts(splitContent, readers);
    } else {
      // If all readers have unique colors, just return the paragraph-split content
      return splitContent;
    }
  }, [segmentData.content, readers]);

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

  // Calculate reader roles based on actual speech bubble distribution
  const readersByColor = useMemo(() => {
    const maxRoles = 4;
    const result: { [color: string]: number[] } = {};
    
    // Count actual speech bubbles by color from memoized content
    const bubblesByColor = memoizedContent.reduce((acc, block) => {
      const color = block.source.color;
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
    const blocksOfThisColor = memoizedContent.filter(item => item.source.color === blockColor);
    const positionInSequence = blocksOfThisColor.findIndex(item => 
      memoizedContent.indexOf(item) === blockIndex
    );
    return positionInSequence % colorPositions.length === position;
  }, [memoizedContent, readersByColor, selectedReaderPosition]);

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
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Add semi-transparent overlay
  },
modalContainer: {
  width: '85%',
  maxHeight: '75%', // Restore maxHeight to prevent always expanding
  maxWidth: 350,
  backgroundColor: colors.background || 'white',
  borderRadius: 20,
  padding: 0,
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 10,
  },
  shadowOpacity: 0.25,
  shadowRadius: 20,
  elevation: 15,
  // Remove marginTop and flex - let it size naturally based on content
},
  emojiPickerContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#E5E5EA',
  },
  blockContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card || '#F8F9FA',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  // Add new styles for enhanced messaging look
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text || '#000',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
   // backgroundColor: colors.secondary || '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
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

  // Update renderItem to use new glow logic
  const renderItem = useCallback(({ item, index }: { item: BibleBlock; index: number }) => {
    const { sourceName } = item.source;
    const showSourceName = index === 0 || 
      memoizedContent[index - 1].source.sourceName !== sourceName;

    const isGlowing = shouldBlockGlow(item.source.color, index);

    return (
      <BibleBlockComponent
        block={item}
        bIndex={index}
        hasTail={showSourceName}
        isGlowing={isGlowing}
        onLongPress={handleLongPress}
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
  }, [segmentData.id]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={memoizedContent}
        ListHeaderComponent={() => (
          <>
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
                  Select your reading role:
                </Text>
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
          </>
        )}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.source.sourceName}-${index}`}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        onLayout={() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        }}
        contentContainerStyle={{ flexGrow: 1 }}
        automaticallyAdjustKeyboardInsets={true}
      />
<Modal
  visible={isModalVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setIsModalVisible(false)}
>
  <BlurView intensity={60} tint="dark" style={styles.blurContainer}>
    <Pressable
      style={styles.blurContainer}
      onPress={() => setIsModalVisible(false)}
    >
      {selectedBlock && (
        <View style={styles.modalContainer}>
          {/* Add modern header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Reaction</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Ionicons name="close" size={25} color={"red"} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.emojiPickerContainer}>
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setIsModalVisible(false)}
            />
          </View>
          
          <ScrollView 
            style={styles.blockContainer}
            showsVerticalScrollIndicator={true}
            bounces={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <BibleBlockComponent
              block={selectedBlock.block}
              bIndex={selectedBlock.index}
              hasTail={true}
              isGlowing={false}
              onLongPress={handleLongPress}
            />
          </ScrollView>
        </View>
      )}
    </Pressable>
  </BlurView>
</Modal>
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
