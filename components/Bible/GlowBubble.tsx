import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated, FlatList, Pressable } from "react-native";
import { getColors } from "@/scripts/getColors";
import { BibleBlock } from "@/types";
import SourceNameComponent from "./SourceName";
import BibleInlineComponent from "./Inline";
import { useAppContext } from "@/context/GlobalContext";
import { deleteEmoji, getEmoji } from "@/api/sqlite";

interface BibleBlockProps {
  block: BibleBlock;
  bIndex: number;
  hasTail: boolean;
}

const GlowingBubble = ({ block, bIndex, hasTail }: BibleBlockProps) => {
  const { segmentId, emojiActions } = useAppContext();
   const idSplit = segmentId.split("-");
   const language = idSplit[0];
   const version = idSplit[1];
   const segID = idSplit[idSplit.length - 1];
  const [emoji, setEmoji] = useState<string | null>(null);
  const { source, children } = block;
  const { color, sourceName } = source;
  const colors = getColors(color);
  const glowAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  useEffect(() => {
    const checkForEmoji = async () => {
      if (segID && bIndex !== undefined) {
        const result = await getEmoji(segID, bIndex.toString());
        setEmoji(result);
      }
    };
    checkForEmoji();
  }, [segID, bIndex, emojiActions]);

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [
      "rgba(255, 0, 0, 0.8)",
      "rgba(0, 255, 0, 0.8)",
      "rgba(0, 0, 255, 0.8)",
      "rgba(255, 0, 0, 0.8)",
    ],
  });

  const tailAlignment = color !== "black" ? { left: 15 } : { right: 15 };
  const emojiAlignment = color !== "black" ? { right: 10 } : { left: 10 };

  // if (color !== "black") {
    return (
      <View key={bIndex}>
        {hasTail && <SourceNameComponent sourceName={sourceName} align={color !== "black" ? "left" : "right"} />}
        <Animated.View
          style={[
            styles.bubble,
            {
              backgroundColor: colors.light,
              shadowColor: glowColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              borderWidth: 0, // Removed black border
              elevation: 5,
              shadowRadius: 10, // Added to increase glow radius
            },
          ]}
        >
          {hasTail && (
            <View
              style={[
                styles.tail,
                {
                  borderBottomColor: colors.light,
                },
                tailAlignment
              ]}
            />
          )}
          <FlatList
            data={children}
            renderItem={({ item, index }) => {
              if (item.type === "break" || item.tag === "b") return null;
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
        </Animated.View>
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
  // }
  // return (
  //   <Animated.View
  //     style={[
  //       {
  //         backgroundColor: colors.light,
  //         shadowColor: glowColor,
  //         shadowOpacity: 1,
  //         shadowOffset: { width: 0, height: 0 },
  //         borderWidth: 0, // Removed black border
  //         elevation: 5,
  //         shadowRadius: 10, // Added to increase glow radius
  //         borderRadius: 10,
  //         margin: 10,
  //         padding: 10,
  //       },
  //     ]}
  //   >
  //     <FlatList
  //       data={children}
  //       renderItem={({ item, index }) => {
  //         if (item.type === "break" || item.tag === "b") return null;
  //         return (
  //           <BibleInlineComponent
  //             key={`${bIndex}-${index}`}
  //             iIndex={`${bIndex}-${index}`}
  //             inline={item}
  //             textColor={colors.dark}
  //           />
  //         );
  //       }}
  //     />
  //     {emoji && (
  //       <View style={[styles.reactionContainer, { top: -25, right: 0 }]}>
  //         <Pressable
  //           onPress={async () => {
  //             await deleteEmoji(segID, bIndex.toString());
  //             setEmoji(null);
  //           }}
  //         >
  //           <Text style={styles.reactionText}>{`${emoji}`}</Text>
  //         </Pressable>
  //       </View>
  //     )}
  //   </Animated.View>
  // );
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

export default GlowingBubble;
