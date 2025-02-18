import React, { useEffect, useState, memo } from "react";
import { View, Text, FlatList, Pressable, GestureResponderEvent } from "react-native";
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

interface BibleBlockProps {
  block: BibleBlock;
  bIndex: number;
  toRead: boolean;
  hasTail: boolean;
}

const BibleBlockComponent: React.FC<BibleBlockProps> = memo(({ block, bIndex, toRead, hasTail }) => {
  const { segmentId, emojiActions, updateEmojiActions } = useAppContext();
  const { colors } = useAppSettings();
  const idSplit = segmentId.split("-");
  const segID = idSplit[idSplit.length - 1];
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [existingEmoji, setExistingEmoji] = useState<string | null>(null);
  const { source, children } = block;
  const { color, sourceName } = source;
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });

  console.log('Block rendered:', { bIndex, toRead, hasTail });

  useEffect(() => {
    const fetchEmoji = async () => {
      if (segID && bIndex !== undefined) {
        const emoji = await getEmoji(segID, bIndex.toString());
        setExistingEmoji(emoji);
      }
    };
    fetchEmoji();
  }, [segID, bIndex, emojiActions]);

  useEffect(() => {
    console.log(`Block ${bIndex} re-rendered. Reason:`, {
      segmentId,
      emojiActions,
      showEmojiPicker
    });
  }, [segmentId, emojiActions, showEmojiPicker]);

  const handleLongPress = (event: GestureResponderEvent) => {
    console.log('Long press detected on block:', bIndex);
    const { pageX, pageY } = event.nativeEvent;
    setTouchPosition({ x: pageX, y: pageY });
    setShowEmojiPicker(true);
  };

  useEffect(() => {
    console.log('Emoji picker visibility changed:', showEmojiPicker);
  }, [showEmojiPicker]);

  const handleEmojiSelect = async (emoji: string) => {
    try {
      await addEmoji(segID, bIndex.toString(), block, emoji);
      setExistingEmoji(emoji);
      setShowEmojiPicker(false);
      if (emojiActions !== undefined) {
        updateEmojiActions(emojiActions + 1);
      }
    } catch (error) {
      console.error("Error setting emoji:", error);
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

  if (toRead) {
    return (
      <GlowBubble block={block} bIndex={bIndex} hasTail={hasTail} />
    );
  }

  const tailAlignment = color !== "black" ? {left: 15} : {right: 15};
  const emojiAlignment = color !== "black" ? { right: 10 } : { left: 10 };
  const emojiTopPosition = hasTail ? { top: 35 } : { top: 15 };

  const styles = StyleSheet.create({
    outerContainer: {
      marginBottom: 8,
      position: 'relative',
      zIndex: 1,
    },
    container: {
      borderRadius: 12,
      padding: 16,
      zIndex: 1,
      position: 'relative',
    },
    text: {
      color: colors.text,
      fontSize: sizes.body,
      lineHeight: 24,
    },
    sourceName: {
      color: colors.secondary,
      fontSize: sizes.caption,
    },
    tail: {
      position: "absolute",
      top: -9,
      width: 0,
      height: 0,
      borderLeftWidth: 10,
      borderRightWidth: 10,
      borderBottomWidth: 10,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      zIndex: 2,
    },
    reactionContainer: {
      flexDirection: "row",
      padding: 5,
      position: "absolute",
      zIndex: 100,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    reactionText: {
      fontSize: 30,
    },
    emojiPickerWrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: -80,
      zIndex: 1000,
      elevation: 5,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
  });

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={300}
      style={[
        styles.outerContainer,
        { backgroundColor: 'rgba(0,0,0,0.01)' }
      ]}
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
            { backgroundColor: colors.bubbles[color === 'black' ? 'black' : (color || 'default')] }
          ]}
        >
          {hasTail && (
            <View
              style={[
                styles.tail,
                {
                  borderBottomColor: colors.bubbles[color === 'black' ? 'black' : (color || 'default')],
                },
                tailAlignment,
              ]}
            />
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
        
        {existingEmoji && (
          <View style={[styles.reactionContainer, emojiAlignment, emojiTopPosition]}>
            <Pressable onPress={handleEmojiDelete}>
              <Text style={styles.reactionText}>{existingEmoji}</Text>
            </Pressable>
          </View>
        )}

        {showEmojiPicker && (
          <View 
            style={[
              styles.emojiPickerWrapper,
              {
                position: 'absolute',
                left: touchPosition.x - 100,
                top: touchPosition.y - 50,
                backgroundColor: 'white',
                padding: 16,
                borderRadius: 8,
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
                zIndex: 1000,
              }
            ]}
          >
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          </View>
        )}
      </View>
    </Pressable>
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
