import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated, FlatList, Pressable, Platform } from "react-native";
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
  isGlowing: boolean;
}

const GlowingBubble = ({ block, bIndex, hasTail, isGlowing }: BibleBlockProps) => {
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

  const tailAlignment = color !== "black" ? { left: 12 } : { right: 12 };
  const emojiAlignment = color !== "black" ? { right: -8 } : { left: -8 };

  return (
    <View key={bIndex} style={{ alignItems: color !== "black" ? 'flex-start' : 'flex-end', marginVertical: 1 }}>
      {hasTail && <SourceNameComponent sourceName={sourceName} align={color !== "black" ? "left" : "right"} />}
      <Animated.View
        style={[
          styles.bubble,
          {
            backgroundColor: colors.light,
            alignSelf: color !== "black" ? 'flex-start' : 'flex-end',
            ...(isGlowing ? {
              shadowColor: glowColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 10,
            } : {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }),
            borderWidth: 0,
            elevation: isGlowing ? 5 : 4,
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
        {emoji && (
          <View style={[styles.reactionContainer, { top: -20 }, emojiAlignment]}>
            <Pressable
              onPress={async () => {
                await deleteEmoji(segID, bIndex.toString());
                setEmoji(null);
              }}>
              <Text style={styles.reactionText}>{`${emoji}`}</Text>
            </Pressable>
          </View>
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
    </View>
  );
};

// Define styles
const styles = StyleSheet.create({
  bubble: {
    borderRadius: 18,
    padding: 12,
    paddingHorizontal: 16,
    position: "relative",
    marginVertical: 2,
    marginHorizontal: 8,
    maxWidth: '90%',
    alignSelf: 'flex-start',
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
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
  reactionText: {
    fontSize: 28,
    lineHeight: 32,
    textAlign: 'center',
    ...Platform.select({
      web: {
        filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.1))',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
      },
    }),
  },
  reactionPosition: {
    position: "absolute",
    bottom: -8,
    right: -8,
    zIndex: 10,
  },
  reactionContainer: {
    position: "absolute",
    zIndex: 100,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GlowingBubble;
