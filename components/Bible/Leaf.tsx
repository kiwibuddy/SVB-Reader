import { BibleLeaf } from "@/types";
import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface BibleLeafProps {
  leaf: BibleLeaf;
  isIndented: boolean;
  textColor: string
  leafIndex: string
}

const BibleLeafComponent: React.FC<BibleLeafProps> = ({ leaf, isIndented, textColor, leafIndex }) => {
  const { note, text, tag, embeddedDoc, SVitalics } = leaf;
  const textSplit = text.split(" ");
  const isVerseRef = tag && tag.indexOf("v") !== -1;
  const isChapterRef = tag && tag.indexOf("c") !== -1;
  const tagStyle = styles[
    tag as unknown as keyof typeof styles
  ] || {}
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
          // ...tagStyle,
        }}
      >
        {isIndented ? "     " : ""}
        {text}
        {"\u00A0"}
      </Text>
    );
  }
  return <Text
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
      </Text>;
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
});
