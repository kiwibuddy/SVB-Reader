import React from "react";
import { View, Text, StyleSheet } from "react-native";
import BibleLeafComponent from "./Leaf";
import { BibleInline } from "@/types";

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
    <View style={inlineStyle}>
      <Text style={{lineHeight: 36, fontSize: 20}}>
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
      </Text>
    </View>
  );
};

export default BibleInlineComponent;

const styles = StyleSheet.create({
  h: {
    textAlign: "center",
    fontStyle: "italic",
  },
  imt: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 27,
    lineHeight: 50,
    marginTop: 25,
    marginBottom: 25,
  },
  is: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 27,
    lineHeight: 50,
    marginTop: 25,
    marginBottom: 25,
  },
  ipi: {
    paddingLeft: 10,
    paddingRight: 10,
  },
  imi: {
    marginLeft: 10,
    marginRight: 10,
  },
  ipq: {
    fontStyle: "italic",
    marginLeft: 10,
    marginRight: 10,
  },
  imq: {
    marginLeft: 10,
    marginRight: 10,
  },
  ipr: {
    textAlign: "right",
  },
  iq: {
    marginLeft: 10,
    marginRight: 10,
  },
  ili1: {
    marginLeft: 10,
    marginRight: 10,
  },
  ili2: {
    marginLeft: 20,
    marginRight: 10,
  },
  iot: {
    fontWeight: "bold",
    fontSize: 18,
    lineHeight: 25,
    marginTop: 25,
    marginBottom: 0,
  },
  io: {
    marginLeft: 10,
    marginRight: 0,
  },
  io1: {
    marginLeft: 10,
    marginRight: 0,
  },
  io2: {
    marginLeft: 20,
    marginRight: 0,
  },
  io3: {
    marginLeft: 30,
    marginRight: 0,
  },
  io4: {
    marginLeft: 40,
    marginRight: 0,
  },
  ior: {
    fontStyle: "italic",
  },
  iex: {
    marginTop: 5,
  },
  iqt: {
    fontStyle: "italic",
  },
  mi: {
    marginLeft: 10,
    marginRight: 0,
  },
  pc: {
    textAlign: "center",
  },
  cls: {
    textAlign: "right",
  },
  li1: {
    marginLeft: 10,
    marginRight: 0,
  },
  li2: {
    marginLeft: 10,
    marginRight: 0,
  },
  li3: {
    marginLeft: 10,
    marginRight: 0,
  },
  li4: {
    marginLeft: 10,
    marginRight: 0,
  },
  b: {
    height: 25,
  },
  q: {
    marginLeft: 10,
    marginRight: 0,
  },
  q1: {
    marginLeft: 10,
    marginRight: 0,
  },
  q2: {
    marginLeft: 10,
    marginRight: 0,
  },
  q3: {
    marginLeft: 10,
    marginRight: 0,
  },
  q4: {
    marginLeft: 10,
    marginRight: 0,
  },
  qr: {
    textAlign: "right",
    marginLeft: 10,
    marginRight: 0,
  },
  qc: {
    textAlign: "center",
  },
  qs: {
    textAlign: "right",
    marginLeft: 10,
    marginRight: 0,
  },
  qa: {
    textAlign: "center",
  },
  qac: {
    marginLeft: 10,
    marginRight: 0,
  },
  qm2: {
    marginLeft: 10,
    marginRight: 0,
  },
  qm3: {
    marginLeft: 10,
    marginRight: 0,
  },
  qt: {
    marginLeft: 10,
    marginRight: 0,
  },
  bk: {
    // Empty styles if no specific styles needed
  },
  nd: {
    fontVariant: ["small-caps"],
  },
  add: {
    // Empty styles if no specific styles needed
  },
  dc: {
    fontStyle: "italic",
  },
  k: {
    fontWeight: "bold",
  },
  lit: {
    textAlign: "right",
    fontWeight: "bold",
  },
  pn: {
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  no: {
    fontWeight: "normal",
    fontStyle: "normal",
  },
  sc: {
    fontVariant: ["small-caps"],
  },
  table: {
    width: "100%",
    display: "flex", // Use flex instead of 'display: table'
    flexDirection: "column", // Flex direction for table-like layout
  },
  tr: {
    display: "flex", // Each row is a flex container
    flexDirection: "row", // Rows flow horizontally
  },
  th: {
    fontStyle: "italic",
    display: "flex", // Table cell display
  },
  thr: {
    textAlign: "right",
    paddingHorizontal: 25,
  },
  tc: {
    display: "flex", // Table cell display
  },
  tcr: {
    textAlign: "right",
    paddingHorizontal: 25,
  },
  mt: {
    textAlign: "center",
    fontWeight: "bold",
    letterSpacing: 0, // Normal letter spacing
    fontSize: 40,
    lineHeight: 50,
    marginTop: 25,
    marginBottom: 25,
  },
  mt1: {
    fontSize: 40,
    lineHeight: 50,
    marginTop: 25,
    marginBottom: 25,
  },
  mt2: {
    fontSize: 34,
    marginTop: -25,
    fontStyle: "italic",
    fontWeight: "normal",
  },
  ms: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 27,
    lineHeight: 50,
    marginTop: 25,
    marginBottom: 0,
  },
  mr: {
    fontSize: 0.9 * 16, // 0.9em to approximate em size
    marginBottom: 25,
    textAlign: "center",
    fontWeight: "normal",
    fontStyle: "italic",
  },
  s: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 27,
    lineHeight: 50,
    marginBottom: 25,
    marginTop: 0,
  },
  sr: {
    fontWeight: "normal",
    fontStyle: "italic",
    textAlign: "center",
    letterSpacing: 0, // Normal letter spacing
  },
  r: {
    fontSize: 18,
    fontWeight: "normal",
    fontStyle: "italic",
    textAlign: "center",
    letterSpacing: 0, // Normal letter spacing
  },
  rq: {
    lineHeight: 25,
    fontStyle: "italic",
    textAlign: "right",
    letterSpacing: 0, // Normal letter spacing
  },
  d: {
    fontStyle: "italic",
    textAlign: "center",
    letterSpacing: 0, // Normal letter spacing
  },
  sp: {
    textAlign: "left",
    fontWeight: "normal",
    fontStyle: "italic",
    letterSpacing: 0, // Normal letter spacing
  },
  djh0: {
    backgroundColor: "#ffdf65",
  },
  djh1: {
    backgroundColor: "#f4a97b",
  },
  djh2: {
    backgroundColor: "#af94d7",
  },
  djh3: {
    backgroundColor: "#f091ba",
  },
  ord: {
    // fontSize: 0.7 * 16, // 0.7em to approximate size
    // letterSpacing: -0.03 * 16, // Negative letter spacing
    // lineHeight: 0, // Line height for positioning
    // fontFamily: "sans-serif",
    // fontWeight: "100",
  },
});