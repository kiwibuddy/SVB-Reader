import { BibleLeaf } from "@/types";
import logger from '@/utils/logger';
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppSettings } from '@/context/AppSettingsContext';

interface BibleLeafProps {
  leaf: BibleLeaf;
  isIndented: boolean;
  textColor: string
  leafIndex: string
}

const BibleLeafComponent: React.FC<BibleLeafProps> = ({ leaf, isIndented, textColor, leafIndex }) => {
  const { isDarkMode } = useAppSettings();
  if (!leaf || typeof leaf !== 'object') {
    logger.warn(`Invalid leaf at index ${leafIndex}:`, leaf);
    return null;
  }

  const { note, text, tag, embeddedDoc, SVitalics, children } = leaf;
  
  // Handle table elements that don't have text but have children
  if (tag && Array.isArray(tag) && tag.some(t => ['tr', 'th', 'tc', 'th1', 'th2', 'th3', 'tc1', 'tc2', 'tc3'].includes(t))) {
    // For table elements, render children if they exist
    if (children && Array.isArray(children)) {
      return (
        <View style={styles.tableElement}>
          {children.map((child, index) => (
            <BibleLeafComponent
              key={`${leafIndex}-child-${index}`}
              leaf={child}
              leafIndex={`${leafIndex}-child-${index}`}
              isIndented={false}
              textColor={textColor}
            />
          ))}
        </View>
      );
    }
    // If no children, return null for table elements without content
    return null;
  }
  
  if (!text || typeof text !== 'string') {
    // Only warn if this is not a table element (which is expected to not have text)
    const isTableElement = tag && Array.isArray(tag) && tag.some(t => ['tr', 'th', 'tc', 'th1', 'th2', 'th3', 'tc1', 'tc2', 'tc3'].includes(t));
    if (!isTableElement) {
      logger.warn(`Missing or invalid text in leaf at index ${leafIndex}:`, leaf);
    }
    return null;
  }

  const textSplit = text.split(" ");
  const isVerseRef = tag && Array.isArray(tag) && tag.some(t => t.indexOf("v") !== -1);
  const isChapterRef = tag && Array.isArray(tag) && tag.some(t => t.indexOf("c") !== -1);
  const tagStyle = tag && Array.isArray(tag) ? tag.reduce((acc, t) => ({ ...acc, ...styles[t as keyof typeof styles] }), {}) : {};
  const embeddedDocStyle = !!embeddedDoc || {};
  const SVitalicsStyle = !!SVitalics || {};

  if (isVerseRef) {
    return (
      <Text
        style={{
          ...{
            color: textColor,
            fontSize: 12,
          },
        }}
      >
        {isIndented ? "     " : ""}
        {text}
        {"\u00A0"}
      </Text>
    );
  }

  return (
    <Text
      key={leafIndex}
      style={{
        ...{
          color: textColor,
          fontSize: 20,
          lineHeight: 36,
        },
        ...tagStyle,
      }}
    >
      {isIndented ? "     " : ""}
      {text}
    </Text>
  );
};

export default BibleLeafComponent;

const styles = StyleSheet.create({
  // embeddedDoc: {
  //   fontFamily: "Kalam",
  // },
  // partial: {
  //   backgroundColor: "lightgrey",
  // },
  // SVitalics: {
  //   fontStyle: "italic",
  // },
  // c: {
  //   textAlign: "center",
  //   fontWeight: "bold",
  //   fontSize: 20, // 1.3em is approximately 18px
  // },
  // cl: {
  //   textAlign: "center",
  //   fontWeight: "bold",
  // },
  // cd: {
  //   marginLeft: 16, // 1em is approximately 16px
  //   marginRight: 16,
  //   fontStyle: "italic",
  // },
  // v: {
  //   color: "inherit",
  //   fontSize: 16, // Smaller font size for superscript
  //   verticalAlign: "top",
  //   lineHeight: 36, // Adjust line height for better spacing
  // },
  nd: {
    fontVariant: ["small-caps"],
  },
  // x: {
  //   fontSize: 16,
  //   position: "relative",
  //   paddingHorizontal: 8, // 0.4em is approximately 8px
  //   marginHorizontal: 2, // 0.1em is approximately 2px
  //   textAlign: "left",
  //   borderRadius: 4,
  //   borderColor: "#dcdcdc",
  //   borderWidth: 1,
  // },
  // xo: {
  //   fontWeight: "bold",
  // },
  // xk: {
  //   fontStyle: "italic",
  // },
  // xq: {
  //   fontStyle: "italic",
  // },
  // notelink: {
  //   textDecorationLine: "underline",
  //   padding: 2, // 0.1em is approximately 2px
  //   color: "#6a6a6a",
  // },
  // notelinkSup: {
  //   fontSize: 10, // 0.7em is approximately 10px
  //   letterSpacing: -0.03,
  //   lineHeight: 0,
  //   fontFamily: "sans-serif",
  //   fontWeight: "bold",
  // },
  // f: {
  //   fontSize: 16,
  //   paddingHorizontal: 8, // 0.4em is approximately 8px
  //   marginHorizontal: 2, // 0.1em is approximately 2px
  //   textAlign: "left",
  //   borderRadius: 4,
  //   borderColor: "#dcdcdc",
  //   borderWidth: 1,
  // },
  // fr: {
  //   fontWeight: "bold",
  // },
  // fk: {
  //   fontStyle: "italic",
  //   fontVariant: ["small-caps"],
  // },
  // fq: {
  //   fontStyle: "italic",
  // },
  // fl: {
  //   fontStyle: "italic",
  //   fontWeight: "bold",
  // },
  // fv: {
  //   color: "#515151",
  //   fontSize: 12, // 0.75em is approximately 12px
  //   letterSpacing: -0.03,
  //   lineHeight: 0,
  //   fontFamily: "sans-serif",
  //   fontWeight: "bold",
  // },
  tableElement: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
