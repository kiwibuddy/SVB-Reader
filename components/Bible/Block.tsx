import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import BibleInlineComponent from "./Inline";
import { BibleBlock } from "@/types";
import SourceNameComponent from "./SourceName";
import { StyleSheet } from 'react-native'; // Ensure you import StyleSheet
import { getColors } from "@/scripts/getColors";
import GlowBubble from "./GlowBubble";
import { useSQLiteContext } from "expo-sqlite";
import { useAppContext } from "@/context/GlobalContext";
import { deleteEmoji, getEmoji } from "@/api/sqlite";

interface BibleBlockProps {
  block: BibleBlock;
  bIndex: number;
  toRead: boolean;
  hasTail: boolean;
}

const BibleBlockComponent: React.FC<BibleBlockProps> = ({ block, bIndex, toRead, hasTail }) => {
  const { segmentId, emojiActions } = useAppContext();
  const idSplit = segmentId.split("-");
  const language = idSplit[0];
  const version = idSplit[1];
  const segID = idSplit[idSplit.length - 1];
  const { source, children } = block;
  const { color, sourceName } = source;
  const colors = getColors(color);
  const [emoji, setEmoji] = useState<string | null>(null);

  useEffect(() => {
    async function checkForEmoji() {
      const result = await getEmoji(segID, bIndex.toString());
      setEmoji(result);
    }

    checkForEmoji(); // Initial check
  }, [segID, bIndex, emoji, emojiActions]);

  if (toRead) {
    return (
      <GlowBubble block={block} bIndex={bIndex} hasTail={hasTail} />
    )
  }
    const tailAlignment = color !== "black" ? {left: 15} : {right:15};
  const emojiAlignment = color !== "black" ? { right: 10 } : { left: 10 };
  // if (color !== 'black') {
    return (
      <View key={bIndex}>
        {hasTail && (
          <SourceNameComponent
            sourceName={sourceName}
            align={color !== "black" ? "left" : "right"}
          />
        )}
        <View
          style={{
            ...styles.bubble,
            ...{
              backgroundColor: colors.light,
            },
          }}
        >
          {hasTail && (
            <View
              style={[
                styles.tail,
                {
                  borderBottomColor: colors.light,
                },
                tailAlignment,
              ]}
            />
          )}
          <FlatList
            data={children}
            renderItem={({ item, index }) => {
              if (item.type === "break") return null;
              return (
                <BibleInlineComponent
                  key={`${bIndex}-${index}`}
                  iIndex={`${bIndex}-${index}`}
                  inline={item}
                  textColor={colors.dark}
                />
              );
            }}
          />
        </View>
        {emoji && (
          <View style={[styles.reactionContainer, { top: 35 }, emojiAlignment]}>
            <Pressable
              onPress={async () => {
                await deleteEmoji(segID, bIndex.toString());
                setEmoji(null);
              }}
            >
              <Text style={styles.reactionText}>{`${emoji}`}</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
};

// Define styles
const styles = StyleSheet.create({
  bubble: {
    borderRadius: 10, // Rounded corners
    padding: 10, // Padding inside the bubble
    position: "relative", // Position for the tail
    margin: 10, // Margin around the bubble
  },
  tail: {
    position: "absolute",
    top: -9, // Position above the bubble
    // left: 15, // Adjust as needed for positioning
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    // borderBottomColor: "#FF6347", // Same as bubble background
  },
  text: {
    color: "#8B0000", // Dark red text color
    fontSize: 16, // Adjust font size as needed
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
    elevation: 3, // Optional: add shadow on Android
    shadowColor: "#000", // Optional: shadow color for iOS
    shadowOffset: { width: 0, height: 2 }, // Optional: shadow offset for iOS
    shadowOpacity: 0.2, // Optional: shadow opacity for iOS
    shadowRadius: 2, // Optional: shadow radius for iOS
    zIndex: 100,
  },
});

export default BibleBlockComponent;
