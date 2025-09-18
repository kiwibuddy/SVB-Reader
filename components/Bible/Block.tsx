import React, { memo } from "react";
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from "react-native";
import { LongPressGestureHandler, State, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import BibleInlineComponent from "./Inline";
import { BibleBlock } from "@/types";
import SourceNameComponent from "./SourceName";
import { getColors, getBubbleTextColorSafe } from "@/scripts/getColors";
import GlowBubble from "./GlowBubble";
import { useAppSettings } from "@/context/AppSettingsContext";
import { baseSizes as sizes } from "@/context/FontSizeContext";
import EmojiHandler from "@/components/EmojiHandler";

interface BibleBlockProps {
  block: BibleBlock;
  bIndex: number;
  toRead?: boolean;
  isGlowing?: boolean;
  hasTail: boolean;
  onLongPress?: (block: BibleBlock, index: number, touchPosition?: { x: number; y: number }) => void;
  disableEmojiHandler?: boolean;
}

const BibleBlockComponent: React.FC<BibleBlockProps> = memo(({ 
  block, 
  bIndex, 
  toRead, 
  isGlowing,
  hasTail, 
  onLongPress,
  disableEmojiHandler = false
}) => {
  const { colors, isDarkMode } = useAppSettings();
  const { source, children } = block;
  const { color = 'black', sourceName = 'Unknown' } = source || {};



  const shouldGlow = toRead || isGlowing;

  if (shouldGlow) {
    return (
      <GlowBubble 
        block={block} 
        bIndex={bIndex} 
        hasTail={hasTail}
        isGlowing={shouldGlow}
        onLongPress={onLongPress}
      />
    );
  }

  const tailAlignment = color !== "black" ? { left: 15 } : { right: 15 };

  const styles = StyleSheet.create({
    outerContainer: {
      marginBottom: 8,
      position: 'relative', // CRITICAL: Supports absolute positioning of emojis
      zIndex: 1,
    },
    container: {
      borderRadius: 16,
      padding: 16,
      zIndex: 1,
      position: 'relative',
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
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
  });

  if (disableEmojiHandler) {
    // Render without EmojiHandler for Reading-emoji page
    return (
      <View style={styles.outerContainer}>
        <GestureDetector gesture={Gesture.Race(
          Gesture.Tap()
            .numberOfTaps(2)
            .onStart((event) => {
              'worklet';
              if (onLongPress) {
                // Pass touch position to onLongPress callback
                const touchPosition = { x: event.absoluteX, y: event.absoluteY };
                runOnJS(onLongPress)(block, bIndex, touchPosition);
              }
            }),
          Gesture.LongPress()
            .minDuration(500)
            .onStart((event) => {
              'worklet';
              if (onLongPress) {
                // Pass touch position to onLongPress callback
                const touchPosition = { x: event.absoluteX, y: event.absoluteY };
                runOnJS(onLongPress)(block, bIndex, touchPosition);
              }
            })
        )}>
          <TouchableOpacity
            activeOpacity={0.8}
          >
            {hasTail && (
              <SourceNameComponent
                sourceName={sourceName}
                align={color !== "black" ? "left" : "right"}
              />
            )}
            <View
              style={[
                styles.container,
                { backgroundColor: isDarkMode ? getColors(color).dark : getColors(color).light }
              ]}
            >
              {hasTail && (
                <View
                  style={[
                    styles.tail,
                    {
                      borderBottomColor: isDarkMode ? getColors(color).dark : getColors(color).light,
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
                        textColor={getBubbleTextColorSafe(color, isDarkMode)}
                        bubbleColor={color}
                      />
                    );
                  })}
              </View>
            </View>
          </TouchableOpacity>
        </GestureDetector>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <EmojiHandler
        block={block}
        blockIndex={bIndex}
        hasTail={hasTail}
        onLongPress={onLongPress}
      >
        {hasTail && (
          <SourceNameComponent
            sourceName={sourceName}
            align={color !== "black" ? "left" : "right"}
          />
        )}
        <View
          style={[
            styles.container,
            { backgroundColor: isDarkMode ? getColors(color).dark : getColors(color).light }
          ]}
        >
          {hasTail && (
            <View
              style={[
                styles.tail,
                {
                  borderBottomColor: isDarkMode ? getColors(color).dark : getColors(color).light,
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
                    textColor={getBubbleTextColorSafe(color, isDarkMode)}
                    bubbleColor={color}
                  />
                );
              })}
          </View>
        </View>
      </EmojiHandler>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.bIndex === nextProps.bIndex &&
    prevProps.toRead === nextProps.toRead &&
    prevProps.isGlowing === nextProps.isGlowing &&
    prevProps.hasTail === nextProps.hasTail &&
    prevProps.block === nextProps.block &&
    prevProps.onLongPress === nextProps.onLongPress
  );
});

BibleBlockComponent.displayName = 'BibleBlockComponent';

export default BibleBlockComponent;
