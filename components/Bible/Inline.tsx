import React from "react";
import { View, Text, StyleSheet } from "react-native";
import BibleLeafComponent from "./Leaf";
import { BibleInline } from "@/types";
import { baseSizes } from "@/context/FontSizeContext";

interface BibleInlineProps {
  inline: BibleInline;
  textColor: string;
  iIndex: string;
}

const BibleInlineComponent: React.FC<BibleInlineProps> = ({
  inline,
  textColor,
  iIndex
}) => {
  const { children, type, tag = 'defaultTag', pIndex, start } = inline;

  if (!children || !Array.isArray(children)) {
    console.warn(`Invalid children in inline at index ${iIndex}:`, inline);
    return null;
  }

  const inlineStyle = styles[tag as keyof typeof styles] || {};
  
  return (
    <View style={[styles.container, inlineStyle]}>
      {children.map((leaf, index) => {
        if (!leaf || typeof leaf !== 'object') {
          console.warn(`Invalid leaf at index ${index}:`, leaf);
          return null;
        }

        return (
          <BibleLeafComponent
            key={`${iIndex}-${index}`}
            leaf={leaf}
            leafIndex={`${iIndex}-${index}`}
            isIndented={index === 0 && !!start}
            textColor={textColor}
          />
        );
      })}
    </View>
  );
};

export default BibleInlineComponent;

// **EXPERT-LEVEL UNIFIED TYPOGRAPHY SYSTEM**
const styles = StyleSheet.create({
  container: {
    pointerEvents: 'none',
    flexDirection: 'row', // Enable proper text flow
    flexWrap: 'wrap', // Allow text to wrap naturally
    alignItems: 'baseline', // Align text to baseline for consistent typography
  },
  
  // **REFINED QUOTE STYLING** - Subtle visual hierarchy
  q: {
    marginLeft: 10,
    opacity: 0.95,
  },
  q1: {
    marginLeft: 10,
    opacity: 0.95,
  },
  q2: {
    marginLeft: 16,
    opacity: 0.9,
  },
  
  // **ELEGANT LIST INDENTATION**
  li1: {
    marginLeft: 12,
  },
  li2: {
    marginLeft: 20,
  },
  
  // **PROFESSIONAL TABLE STRUCTURE**
  table: {
    width: "100%",
    flexDirection: "column",
  },
  tr: {
    flexDirection: "row",
    minHeight: baseSizes.body * 1.6, // Comfortable row height
  },
  th: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tc: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  
  // **OPTIMIZED SPACING**
  b: {
    height: 8, // Refined break spacing
    width: '100%', // Ensure breaks span full width
  },
});