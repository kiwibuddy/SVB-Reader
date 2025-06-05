import React, { useEffect, useState, memo, useRef } from "react";
import { View, Text, FlatList, Pressable, GestureResponderEvent, TouchableOpacity } from "react-native";
import BibleInlineComponent from "./Inline";
import { BibleBlock } from "@/types";
import SourceNameComponent from "./SourceName";
import { StyleSheet } from 'react-native';
import { getColors } from "@/scripts/getColors";
import GlowBubble from "./GlowBubble";
import { useSQLiteContext } from "expo-sqlite";
import { useAppContext } from "@/context/GlobalContext";
import { deleteEmoji, getEmoji, addEmoji } from "@/api/sqlite";
import EmojiPicker from "@/components/EmojiPicker";
import { useAppSettings } from "@/context/AppSettingsContext";
import { baseSizes as sizes } from "@/context/FontSizeContext";
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

interface BibleBlockProps {
  block: BibleBlock;
  bIndex: number;
  toRead: boolean;
  hasTail: boolean;
  onLongPress?: (block: BibleBlock, index: number, position?: { x: number; y: number }) => void;
  hideEmoji?: boolean;
  renderBubbleExtra?: React.ReactNode;
  isFirstInSequence?: boolean;
  isLastInSequence?: boolean;
  previousSpeaker?: string;
  nextSpeaker?: string;
}

const BibleBlockComponent: React.FC<BibleBlockProps> = memo(({ 
  block, 
  bIndex, 
  toRead, 
  hasTail, 
  onLongPress, 
  hideEmoji, 
  renderBubbleExtra,
  isFirstInSequence,
  isLastInSequence,
  previousSpeaker,
  nextSpeaker
}) => {
  const { segmentId, emojiActions, updateEmojiActions } = useAppContext();
  const { colors } = useAppSettings();
  const idSplit = segmentId.split("-");
  const segID = idSplit[idSplit.length - 1];
  const [existingEmoji, setExistingEmoji] = useState<string | null>(null);
  const { source, children } = block;
  const { color, sourceName } = source;
  const [bubbleLayout, setBubbleLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const touchableRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

  // **ULTIMATE SPEECH BUBBLE SPACING SYSTEM** - Final refinement
  const getAdvancedSpacing = () => {
    const isSpeakerChange = previousSpeaker && previousSpeaker !== sourceName;
    const isNarrator = color === 'black';
    const wasNarrator = previousSpeaker === 'THE NARRATOR';
    const willBeNarrator = nextSpeaker === 'THE NARRATOR';
    
    // **EXPERT CONVERSATION FLOW SPACING** - Publication quality
    let topMargin = 8; // Refined base spacing for optimal reading flow
    
    if (isSpeakerChange) {
      // **REFINED SPEAKER TRANSITION LOGIC**
      if (isNarrator && wasNarrator) {
        // Narrator to narrator continuation (different narrator sections)
        topMargin = 12;
      } else if (isNarrator || wasNarrator) {
        // Narrator transitions (to/from speech)
        topMargin = 16;
      } else {
        // Character to character transitions  
        topMargin = 14;
      }
    } else {
      // **SAME SPEAKER CONTINUATION**
      if (isNarrator) {
        // Narrator continuation paragraphs
        topMargin = 10;
      } else {
        // Character speech continuation
        topMargin = 8;
      }
    }
    
    // **SEQUENCE POSITION ADJUSTMENTS**
    if (isFirstInSequence) {
      // First bubble in a sequence gets extra breathing room
      topMargin += 3;
    }
    
    // **CONTENT TYPE ADJUSTMENTS**
    const hasLongContent = block.children && block.children.length > 1;
    if (hasLongContent && isNarrator) {
      // Long narrator blocks get slight reduction for better density
      topMargin = Math.max(topMargin - 1, 8);
    }
    
    return {
      marginTop: topMargin,
      marginBottom: isLastInSequence ? 8 : 4, // Consistent bottom spacing
      // **HORIZONTAL BREATHING ROOM**
      paddingHorizontal: 2, // Subtle horizontal padding for better flow
    };
  };

  useEffect(() => {
    const fetchEmoji = async () => {
      if (segID && bIndex !== undefined && !hideEmoji) {
        const emoji = await getEmoji(segID, bIndex.toString());
        setExistingEmoji(emoji);
      }
    };
    fetchEmoji();
  }, [segID, bIndex, emojiActions, hideEmoji]);

  const handleLongPress = (event: any) => {
    if (onLongPress && touchableRef.current) {
      const { locationX, locationY } = event.nativeEvent;
      
      touchableRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
        const screenX = x + locationX;
        const screenY = y + locationY;
        
        onLongPress(block, bIndex, { x: screenX, y: screenY });
      });
    } else if (onLongPress) {
      onLongPress(block, bIndex);
    }
  };

  const handleEmojiDelete = async () => {
    try {
      await deleteEmoji(segID, bIndex.toString());
      setExistingEmoji(null);
      if (emojiActions !== undefined) {
        updateEmojiActions(emojiActions + 1);
      }
    } catch (error) {
      console.error("Error deleting emoji:", error);
    }
  };

  // Enhanced bubble color with subtle variations
  const getBubbleColor = (color: string | undefined) => {
    const bubbleKey = color === 'black' ? 'black' : (color || 'default');
    return colors.bubbles[bubbleKey as keyof typeof colors.bubbles] || colors.bubbles.default;
  };

  // Advanced shadow and depth based on speaker type
  const getBubbleElevation = () => {
    const isNarrator = color === 'black';
    return {
      shadowColor: isNarrator ? '#000' : '#000',
      shadowOffset: {
        width: 0,
        height: isNarrator ? 1.5 : 3, // Refined shadow depth
      },
      shadowOpacity: isNarrator ? 0.08 : 0.15, // Enhanced contrast
      shadowRadius: isNarrator ? 3 : 8, // Softer shadows
      elevation: isNarrator ? 2 : 4, // Better Android elevation
      // **EXPERT VISUAL ENHANCEMENTS**
      ...(Platform.OS === 'ios' && {
        shadowPath: undefined, // Let iOS calculate optimal shadow
      }),
    };
  };

  if (toRead) {
    return (
      <GlowBubble 
        block={block} 
        bIndex={bIndex} 
        hasTail={hasTail}
        isGlowing={toRead}
      />
    );
  }

  const tailAlignment = color !== "black" ? {left: 12} : {right: 12};
  const emojiAlignment = color !== "black" ? { right: -8 } : { left: -8 };
  const emojiTopPosition = hasTail ? { top: -20 } : { top: -20 };
  const isNarrator = color === 'black';
  const advancedSpacing = getAdvancedSpacing();

  const styles = StyleSheet.create({
    outerContainer: {
      ...advancedSpacing,
      position: 'relative',
      zIndex: 1,
    },
    container: {
      // **EXPERT BUBBLE STYLING** - Publication quality
      borderRadius: isNarrator ? 18 : 22, // Refined corner radius
      padding: isNarrator ? 15 : 17, // Optimized internal padding
      paddingHorizontal: isNarrator ? 17 : 19, // Perfect horizontal spacing
      zIndex: 1,
      position: 'relative',
      maxWidth: isNarrator ? '94%' : '86%', // Better width constraints
      alignSelf: color !== "black" ? 'flex-start' : 'flex-end',
      marginHorizontal: isNarrator ? 10 : 18, // Refined margins
      ...getBubbleElevation(),
      width: 'auto',
      flexShrink: 1,
      // **ENHANCED VISUAL REFINEMENTS**
      minHeight: 44, // Ensure minimum bubble height
      justifyContent: 'center', // Center content vertically
    },
    text: {
      color: colors.text,
      fontSize: sizes.body,
      lineHeight: sizes.body * 1.45, // Match expert typography
      letterSpacing: 0.15, // Consistent with expert system
    },
    sourceName: {
      color: colors.secondary,
      fontSize: sizes.caption,
    },
    tail: {
      position: "absolute",
      top: isNarrator ? -5 : -7, // Refined tail positioning
      width: 0,
      height: 0,
      borderLeftWidth: isNarrator ? 7 : 9, // Proportional tail sizing
      borderRightWidth: isNarrator ? 7 : 9,
      borderBottomWidth: isNarrator ? 7 : 9,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      zIndex: 2,
    },
    reactionContainer: {
      position: "absolute",
      zIndex: 100,
      width: 34, // Slightly larger emoji container
      height: 34,
      justifyContent: 'center',
      alignItems: 'center',
    },
    reactionText: {
      fontSize: 30, // Slightly larger emoji
      lineHeight: 34,
      textAlign: 'center',
    },
    bubbleExtra: {
      position: 'absolute',
      top: -14, // Refined positioning
      zIndex: 10,
    },
  });

  return (
    <View style={styles.outerContainer}>
      <TouchableOpacity
        onLongPress={handleLongPress}
        delayLongPress={500}
        activeOpacity={0.95}
        onLayout={handleEmojiDelete}
        ref={touchableRef}
      >
        <View key={bIndex}>
          {hasTail && (
            <SourceNameComponent
              sourceName={sourceName}
              align={color !== "black" ? "left" : "right"}
            />
          )}
          <View
            style={[
              styles.container,
              { backgroundColor: getBubbleColor(color) }
            ]}
          >
            {hasTail && (
              <View
                style={[
                  styles.tail,
                  {
                    borderBottomColor: getBubbleColor(color),
                  },
                  tailAlignment,
                ]}
              />
            )}
            {renderBubbleExtra && (
              <View style={[styles.bubbleExtra, color !== "black" ? { right: -8 } : { left: -8 }]}> 
                {renderBubbleExtra}
              </View>
            )}
            {existingEmoji && !hideEmoji && (
              <View style={[styles.reactionContainer, emojiAlignment, emojiTopPosition]}>
                <Pressable onPress={handleEmojiDelete}>
                  <Text style={styles.reactionText}>{existingEmoji}</Text>
                </Pressable>
              </View>
            )}
            <View>
              {children.map((item: any, index: number) => {
                if (item.type === "break") return null;
                return (
                  <BibleInlineComponent
                    key={`${bIndex}-${index}`}
                    iIndex={`${bIndex}-${index}`}
                    inline={item}
                    textColor={colors.text}
                  />
                );
              })}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.bIndex === nextProps.bIndex &&
    prevProps.toRead === nextProps.toRead &&
    prevProps.hasTail === nextProps.hasTail &&
    prevProps.block === nextProps.block &&
    prevProps.previousSpeaker === nextProps.previousSpeaker &&
    prevProps.nextSpeaker === nextProps.nextSpeaker
  );
});

export default BibleBlockComponent;
