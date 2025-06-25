import React, { useEffect } from "react";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";
import { getColors } from "@/scripts/getColors";
import { BibleBlock } from "@/types";
import SourceNameComponent from "./SourceName";
import BibleInlineComponent from "./Inline";
import EmojiHandler from "@/components/EmojiHandler";

interface BibleBlockProps {
  block: BibleBlock;
  bIndex: number;
  hasTail: boolean;
  isGlowing: boolean;
  onLongPress?: (block: BibleBlock, index: number) => void;
}

const GlowingBubble = ({ block, bIndex, hasTail, isGlowing, onLongPress }: BibleBlockProps) => {
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

  return (
    <View key={bIndex}>
      <EmojiHandler
        block={block}
        blockIndex={bIndex}
        onLongPress={onLongPress}
      >
        {hasTail && <SourceNameComponent sourceName={sourceName} align={color !== "black" ? "left" : "right"} />}
        <Animated.View
          style={[
            styles.bubble,
            {
              backgroundColor: colors.light,
              ...(isGlowing ? {
                shadowColor: glowColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 10,
              } : {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
              }),
              borderWidth: 0,
              elevation: isGlowing ? 5 : 3,
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
          <View>
            {children.map((item, index) => {
              if (item.type === "break" || item.tag === "b") return null;
              return (
                <BibleInlineComponent
                  key={`${bIndex}-${index}`}
                  iIndex={`${bIndex}-${index}`}
                  inline={item}
                  textColor={colors.dark}
                />
              );
            })}
          </View>
        </Animated.View>
      </EmojiHandler>
    </View>
  );
};

// Define styles
const styles = StyleSheet.create({
  bubble: {
    borderRadius: 10,
    padding: 10,
    position: "relative",
    margin: 10,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
      },
    }),
  },
  tail: {
    position: "absolute",
    top: -9, // Position above the bubble
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});

export default GlowingBubble;
