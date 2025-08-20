import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";
import { getColors, getBubbleTextColorSafe } from "@/scripts/getColors";
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
  targetVerse?: number;
  targetChapter?: number;
}

const GlowingBubble = ({ block, bIndex, hasTail, isGlowing, onLongPress, targetVerse, targetChapter }: BibleBlockProps) => {
  const { source, children } = block;
  const { color = 'black', sourceName = 'Unknown' } = source || {};
  const { isDarkMode } = useAppSettings();
  const colors = getColors(color);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const targetVerseAnim = useRef(new Animated.Value(0)).current;
  
  // Check if this block contains the target verse
  const isTargetVerse = React.useMemo(() => {
    if (!targetVerse || !targetChapter) return false;
    
    // Search through children to find verse references
    for (const child of children) {
      // Search through BibleLeaf children for verse references
      if (child.children && Array.isArray(child.children)) {
        for (const leaf of child.children) {
          if (leaf.link && leaf.link.chapter && leaf.link.verse) {
            const chapter = parseInt(leaf.link.chapter);
            const verse = parseInt(leaf.link.verse);
            if (chapter === targetChapter && verse === targetVerse) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }, [children, targetVerse, targetChapter]);
  
  // Animate target verse highlight
  useEffect(() => {
    if (isTargetVerse) {
      // Start with a bright highlight
      targetVerseAnim.setValue(1);
      
      // Animate to a subtle highlight
      Animated.timing(targetVerseAnim, {
        toValue: 0.3,
        duration: 2000,
        useNativeDriver: false,
      }).start();
    } else {
      targetVerseAnim.setValue(0);
    }
  }, [isTargetVerse, targetVerseAnim]);
  
  // Track animation for cleanup
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Only run animation if glowing is enabled
    if (!isGlowing) {
      glowAnim.setValue(0);
      return;
    }

    // Create optimized animation configuration
    const animationConfig = {
      toValue: 1,
      duration: 4000, // Reduced from 12000ms to 4000ms for better performance
      useNativeDriver: false, // Fixed: Use false for both platforms to support shadow properties
    };

    // Start the animation loop
    animationRef.current = Animated.loop(
      Animated.timing(glowAnim, animationConfig)
    );
    
    animationRef.current.start();

    // Cleanup function to stop animation when component unmounts or isGlowing changes
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [isGlowing, isDarkMode]); // Only re-run when isGlowing or isDarkMode changes

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
              borderWidth: isTargetVerse ? 3 : 0,
              borderColor: isTargetVerse ? 
                targetVerseAnim.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: ['transparent', '#FFD700', '#FFA500'] // Orange to gold to transparent
                }) : 'transparent',
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
                  textColor={getBubbleTextColorSafe(color, isDarkMode)}
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
