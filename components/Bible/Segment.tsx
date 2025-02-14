import React, { useState, useEffect } from "react"; // Ensure useEffect is imported
import { View, Text, FlatList, Pressable, TouchableOpacity, Modal, StyleSheet, useWindowDimensions, Platform } from "react-native";
import { BlurView } from "expo-blur";
import BibleBlockComponent from "./Block";
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
import CelebrationPopup from "../CelebrationPopup";
import { useRouter } from "expo-router";
import CheckCircle from "@/components/CheckCircle";
import { useAppSettings } from '@/context/AppSettingsContext';

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
    updateSelectedReaderColor
  } = useAppContext();

  const { colors } = useAppSettings();

  // Add null checks for segmentData
  if (!segmentData || !segmentData.id) {
    console.error('Invalid segment data:', segmentData);
    return null; // Or return an error state component
  }

  const [isModalVisible, setIsModalVisible] = useState(false); // State for modal visibility
  const [readerNumber, setReaderNumber] = useState<number | null>(null); // Update state type
  const [blockData, setBlockData] = useState<BibleBlock | null>(null); // State for block data
  const [blockID, setBlockID] = useState<string | null>(null); // State for block ID
  const [showCelebration, setShowCelebration] = useState(false);
  const { content, readers, id } = segmentData;
  const segID = id.split("-")[id.split("-").length - 1];

  const [colorData, setColorData] = useState({
    black: 0,
    red: 0,
    green: 0,
    blue: 0,
    total: 0
  });

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

  // Reset readerNumber to null when id changes
  useEffect(() => {
    setReaderNumber(null);
  }, [id]);

  const handleIconPress = (index: number) => {
    const readerColor = readers[index];
    setReaderNumber((prev) => {
      const newValue = prev === index ? null : index;
      updateSelectedReaderColor(newValue === null ? null : readerColor);
      return newValue;
    });
  };

  const handleLongPress = (blockData: BibleBlock, blockID: string) => {
    setIsModalVisible(true);
    setBlockData(blockData);
    setBlockID(blockID);
  };

  const handleReactionSelect = async (blockData: BibleBlock, blockID: string, emoji: string) => {
    try {
      await addEmoji(segID, blockID, JSON.stringify(blockData), emoji);
      if (typeof emojiActions === 'number') {
        await updateEmojiActions(emojiActions + 1);
      }
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error setting emoji:', error);
    }
  };

  const newContent = splitIntoParagraphs(content);

  const colorRenderCount = new Map<string, number>(); // Track render counts

  useEffect(() => {
    // Calculate color counts from content
    const counts = newContent.reduce((acc, block) => {
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
  }, [newContent]);

  // Add handler for completion toggle
  const handleCompletion = async () => {
    if (context === 'main') {
      await markSegmentComplete(segID, !isCompleted);
      if (!isCompleted) {
        setShowCelebration(true);
      }
    } else if (planId && activePlan) {
      // Handle plan completion
      await updateReadingPlanProgress(planId, segID);
      setShowCelebration(true);
    } else if (challengeId && activeChallenges[challengeId]) {
      // Handle challenge completion
      await updateChallengeProgress(challengeId, segID);
      setShowCelebration(true);
    }
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    // Navigate back based on context
    if (planId) {
      router.replace({
        pathname: '/Plan',
        params: { 
          scrollToPlan: planId,
          timestamp: Date.now() // Force refresh
        }
      });
    } else if (challengeId) {
      router.replace({
        pathname: '/Reading-Challenges',
        params: { 
          scrollToChallenge: challengeId,
          timestamp: Date.now() // Force refresh
        }
      });
    }
  };

  const handleComplete = async () => {
    if (readerNumber !== null) {
      await markSegmentComplete(
        segmentData.id,
        true,
        readers[readerNumber],
        context,
        context === 'plan' ? planId : challengeId
      );
      setShowCelebration(true);
    }
  };

  // Add speech bubble colors based on theme
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
    blurContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      alignContent: "flex-start",
    },
    emojiPickerContainer: {
      flex: 0,
      flexDirection: "column", // Ensure elements stack vertically
      alignItems: "center", // Center items horizontally
      marginBottom: 10, // Add some space between the emoji picker and the block
    },
    modalContainer: {
      // marginTop: 100,
      flex: 0, // Allow the modal container to take available space
      justifyContent: "flex-start",
      backgroundColor: "transparent",
      // Remove any fixed height settings
    },
    blockContainer: {
      flex: 0, // Set flex to 0 to prevent it from growing
      flexDirection: "row", // Ensure elements stack vertically
      alignContent: "flex-start",
      backgroundColor: "white",
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      maxWidth: "80%",
      maxHeight: "80%", // Keep the maxHeight to limit the size
      overflow: "hidden",
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
      // backgroundColor: "white", // White background
      // borderRadius: 20, // Half of the width/height for a circle
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
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            height: "100%",
          }}
        >
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
                {icons.map((icon, index) => {
                  const colors = getColors(readers[index]);
                  const color = readerNumber === index ? colors.dark : colors.light;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleIconPress(index)}
                    >
                      <MaterialIcons
                        name={readerNumber === index ? "mark-chat-read" : "chat-bubble"}
                        size={30}
                        color={readers[index] === "black" ? "grey" : color}
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

      <FlatList
        data={newContent}
        renderItem={({ item, index }) => {
          const { color, sourceName } = item.source;
          const isFirstOfNewSource =
            index === 0 ||
            newContent[index - 1].source.sourceName !== sourceName;
          const readerColor = readers[readerNumber!]; // Ensure readerNumber is not null
          if (readerColor !== color) {
            return (
              <Pressable
                onLongPress={() => handleLongPress(item, `${segID}-${index}`)}
              >
                <BibleBlockComponent
                  key={index}
                  block={item}
                  bIndex={index}
                  toRead={false} // Set toRead based on the reading logic
                  hasTail={isFirstOfNewSource}
                />
              </Pressable>
            );
          }
          const colorReaders = readers.filter((reader) => reader === color); // Get all readers for the current color
          const numberOfColorReaders = colorReaders.length; // Count of readers for this color

          // Initialize the render count for the current color if not already done
          if (!colorRenderCount.has(color)) {
            colorRenderCount.set(color, 0);
          }

          // Get the current render count for this color
          const currentRenderCount = colorRenderCount.get(color)!;

          // Determine if the current reader should read this block
          let shouldRead = false;

          if (numberOfColorReaders === 1) {
            // Single color reader logic
            shouldRead = color === readerColor; // Only set to true if the block color matches the readerColor
          } else {
            // Multiple color readers logic
            const indices = readers.reduce<number[]>((acc, reader, index) => {
              if (reader === readerColor) {
                acc.push(index);
              }
              return acc;
            }, []);
            const position = indices.indexOf(readerNumber!);
            // Determine the total number of blocks rendered for this color
            const totalRendered = currentRenderCount; // This is the count of how many times this color has been rendered

            // Calculate the turn for the current reader based on their position
            shouldRead = totalRendered % numberOfColorReaders === position; // Assign reading based on turn
          }

          // Increment the render count for this color after determining shouldRead
          colorRenderCount.set(color, currentRenderCount + 1);

          return (
            <>
              <Pressable
                onLongPress={() => handleLongPress(item, `${segID}-${index}`)}
              >
                <BibleBlockComponent
                  key={index}
                  block={item}
                  bIndex={index}
                  toRead={shouldRead} // Set toRead based on the reading logic
                  hasTail={isFirstOfNewSource}
                />
              </Pressable>
            </>
          );
        }}
        keyExtractor={(item, index) => index.toString()}
      />
      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <BlurView intensity={60} tint="dark" style={styles.blurContainer}>
          <Pressable
            style={styles.blurContainer}
            onPress={() => setIsModalVisible(false)}
          >
            {blockData && blockID && (
              <View style={styles.modalContainer}>
                <View style={styles.emojiPickerContainer}>
                  <EmojiPicker
                    onEmojiSelect={(emoji) => handleReactionSelect(blockData, blockID, emoji)}
                    onClose={() => setIsModalVisible(false)}
                  />
                </View>
                <View style={styles.blockContainer}>
                  <BibleBlockComponent
                    key={`reaction-block`}
                    block={blockData}
                    bIndex={0}
                    toRead={false} // Set toRead based on the reading logic
                    hasTail={true}
                  />
                </View>
              </View>
            )}
          </Pressable>
        </BlurView>
      </Modal>
      <View style={styles.divider} />

      <CelebrationPopup 
        visible={showCelebration} 
        onComplete={handleCelebrationComplete}
      />
    </View>
  );
};

export default SegmentComponent;
