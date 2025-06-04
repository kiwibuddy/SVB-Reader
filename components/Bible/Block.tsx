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

interface BibleBlockProps {
  block: BibleBlock;
  bIndex: number;
  toRead: boolean;
  hasTail: boolean;
  onLongPress?: (block: BibleBlock, index: number, position?: { x: number; y: number }) => void;
  hideEmoji?: boolean;
  renderBubbleExtra?: React.ReactNode;
}

const BibleBlockComponent: React.FC<BibleBlockProps> = memo(({ block, bIndex, toRead, hasTail, onLongPress, hideEmoji, renderBubbleExtra }) => {
  const { segmentId, emojiActions, updateEmojiActions } = useAppContext();
  const { colors } = useAppSettings();
  const idSplit = segmentId.split("-");
  const segID = idSplit[idSplit.length - 1];
  const [existingEmoji, setExistingEmoji] = useState<string | null>(null);
  const { source, children } = block;
  const { color, sourceName } = source;
  const [bubbleLayout, setBubbleLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const touchableRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

  console.log('Block rendered:', { bIndex, toRead, hasTail });

  useEffect(() => {
    const fetchEmoji = async () => {
      if (segID && bIndex !== undefined && !hideEmoji) {
        const emoji = await getEmoji(segID, bIndex.toString());
        setExistingEmoji(emoji);
      }
    };
    fetchEmoji();
  }, [segID, bIndex, emojiActions, hideEmoji]);

  useEffect(() => {
    console.log(`Block ${bIndex} re-rendered. Reason:`, {
      segmentId,
      emojiActions,
    });
  }, [segmentId, emojiActions]);

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

  const handleBubbleLayout = (event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setBubbleLayout({ x, y, width, height });
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

  // Helper function to safely get bubble color
  const getBubbleColor = (color: string | undefined) => {
    const bubbleKey = color === 'black' ? 'black' : (color || 'default');
    return colors.bubbles[bubbleKey as keyof typeof colors.bubbles] || colors.bubbles.default;
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

  const styles = StyleSheet.create({
    outerContainer: {
      marginBottom: 2,
      position: 'relative',
      zIndex: 1,
    },
    container: {
      borderRadius: 18,
      padding: 12,
      paddingHorizontal: 16,
      zIndex: 1,
      position: 'relative',
      maxWidth: '90%',
      alignSelf: color !== "black" ? 'flex-start' : 'flex-end',
      marginHorizontal: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
      width: 'auto',
      flexShrink: 1,
    },
    text: {
      color: colors.text,
      fontSize: sizes.body,
      lineHeight: 20,
    },
    sourceName: {
      color: colors.secondary,
      fontSize: sizes.caption,
    },
    tail: {
      position: "absolute",
      top: -6,
      width: 0,
      height: 0,
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderBottomWidth: 8,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      zIndex: 2,
    },
    reactionContainer: {
      position: "absolute",
      zIndex: 100,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    reactionText: {
      fontSize: 28,
      lineHeight: 32,
      textAlign: 'center',
    },
    bubbleExtra: {
      position: 'absolute',
      top: -12,
      zIndex: 10,
    },
  });

  return (
    <View style={styles.outerContainer}>
      <TouchableOpacity
        onLongPress={handleLongPress}
        delayLongPress={500}
        activeOpacity={1.0}
        onLayout={handleBubbleLayout}
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
    prevProps.block === nextProps.block
  );
});

export default BibleBlockComponent;
