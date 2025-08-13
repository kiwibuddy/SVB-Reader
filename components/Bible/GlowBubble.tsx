import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";
import { getColors } from "@/scripts/getColors";
import { BibleBlock } from "@/types";
import SourceNameComponent from "./SourceName";
import BibleInlineComponent from "./Inline";
import EmojiHandler from "@/components/EmojiHandler";
import { useAppSettings } from "@/context/AppSettingsContext";

interface BibleBlockProps {
  block: BibleBlock;
  bIndex: number;
  hasTail: boolean;
  isGlowing: boolean;
  onLongPress?: (block: BibleBlock, index: number) => void;
}

const GlowingBubble = ({ block, bIndex, hasTail, isGlowing, onLongPress }: BibleBlockProps) => {
  const { source, children } = block;
  const { color = 'black', sourceName = 'Unknown' } = source || {};
  const { isDarkMode } = useAppSettings();
  const colors = getColors(color);
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 12000, // Doubled from 6000ms to 12000ms (12 seconds)
        useNativeDriver: false,
      })
    ).start();
  }, [isDarkMode]); // Re-run animation when dark mode changes

  // Create adaptive glow colors based on dark mode
  const glowColor = glowAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: isDarkMode ? [
      // Dark mode: very light, almost white pastel colors for maximum visibility
      "rgba(255, 230, 230, 0.95)", // Very light pink/white
      "rgba(230, 255, 230, 0.95)", // Very light green/white
      "rgba(230, 240, 255, 0.95)", // Very light blue/white
      "rgba(255, 230, 230, 0.95)", // Very light pink/white (loop back)
    ] : [
      // Light mode: original vibrant colors
      "rgba(255, 0, 0, 0.8)",
      "rgba(0, 255, 0, 0.8)",
      "rgba(0, 0, 255, 0.8)",
      "rgba(255, 0, 0, 0.8)",
    ],
  });

  const tailAlignment = color !== "black" ? { left: 15 } : { right: 15 };

  return (
    <View key={bIndex} style={{ position: 'relative' }}>
      <EmojiHandler
        block={block}
        blockIndex={bIndex}
        hasTail={hasTail}
        onLongPress={onLongPress}
      >
        {hasTail && <SourceNameComponent sourceName={sourceName} align={color !== "black" ? "left" : "right"} />}
        <Animated.View
          style={[
            styles.bubble,
            {
              backgroundColor: isDarkMode ? colors.dark : colors.light,
              ...(isGlowing ? {
                shadowColor: glowColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: isDarkMode ? 10 : 10, // Larger glow radius in dark mode for better visibility
              } : {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
              }),
              borderWidth: 0,
              elevation: isGlowing ? (isDarkMode ? 8 : 5) : 3, // Higher elevation in dark mode for better glow visibility
            },
          ]}
        >
          {hasTail && (
            <View
              style={[
                styles.tail,
                {
                  borderBottomColor: isDarkMode ? colors.dark : colors.light,
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
                  textColor={isDarkMode ? colors.light : colors.dark}
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
    position: "relative", // CRITICAL: Supports absolute positioning of emojis
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
