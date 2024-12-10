import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { IntroType, IntroBlock, IntroContentChild } from "@/types";

// Define the props for Intro component
interface IntroProps {
    segmentData: IntroType; // Ensure this matches the expected type
}

const IntroContentChildComponent: React.FC<IntroContentChild> = ({
  text,
  type,
  link,
  smallcaps,
  bibleText,
}) => {
  return (
    <View style={styles.childContainer}>
      {link ? (
        <TouchableOpacity
          onPress={() => {
            /* Navigate to link */
          }}
        >
          <Text style={smallcaps ? styles.smallCaps : {}}>{text}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={smallcaps ? styles.smallCaps : {}}>{text}</Text>
      )}
      {bibleText && <Text>(Bible Text)</Text>}
    </View>
  );
};

const IntroBlockComponent: React.FC<IntroBlock> = ({ children, type }) => {
  return (
    <View
      style={[
        styles.blockContainer,
        { borderColor: type === "highlight" ? "blue" : "gray" },
      ]}
    >
      {children.map((child) => (
        <IntroContentChildComponent key={child.id} {...child} />
      ))}
    </View>
  );
};

const IntroComponent: React.FC<IntroProps> = ({ segmentData }) => {
  const { content, colors, sources } = segmentData;
  return (
    <View
      style={{
        ...styles.container,
        backgroundColor: `rgba(${colors.red}, ${colors.green}, ${colors.blue}, 1)`,
      }}
    >
      {content.map((block) => (
        <IntroBlockComponent key={block.id} {...block} />
      ))}
      {/* Render sources if needed */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  blockContainer: {
    marginVertical: 8,
    padding: 8,
    borderWidth: 1,
  },
  childContainer: {
    marginVertical: 4,
  },
  smallCaps: {
    textTransform: "uppercase",
  },
});

export default IntroComponent;
