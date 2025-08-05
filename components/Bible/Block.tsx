import React, { memo } from "react";
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from "react-native";
import BibleInlineComponent from "./Inline";
import { BibleBlock } from "@/types";
import SourceNameComponent from "./SourceName";
import { getColors } from "@/scripts/getColors";
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
  onLongPress?: (block: BibleBlock, index: number) => void;
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
  const { colors } = useAppSettings();
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
        <TouchableOpacity
          onLongPress={() => {
            console.log('🔍 [BibleBlock] onLongPress triggered (disableEmojiHandler mode):', { 
              bIndex, 
              sourceName: block.source?.sourceName,
              color: block.source?.color 
            });
            onLongPress?.(block, bIndex);
          }}
          onPress={() => {
            console.log('🔍 [BibleBlock] Press detected (not long press)');
          }}
          delayLongPress={1000}
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
        </TouchableOpacity>
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
      </EmojiHandler>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.bIndex === nextProps.bIndex &&
    prevProps.toRead === nextProps.toRead &&
    prevProps.isGlowing === nextProps.isGlowing &&
    prevProps.hasTail === nextProps.hasTail &&
    prevProps.block === nextProps.block
  );
});

export default BibleBlockComponent;
