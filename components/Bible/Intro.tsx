import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from "react-native";
import { IntroType, IntroBlock, IntroContentChild } from "@/types";
import SegmentTitle from "./SegmentTitle";

// Define the props for Intro component
interface IntroProps {
    segmentData: IntroType & {
        id: string;
    };
}

const IntroContentChildComponent: React.FC<IntroContentChild> = ({
  text,
  type,
  link,
  smallcaps,
  bibleText,
}) => {
  // Match text styling with the rest of the app
  const textStyle = {
    ...styles.text,
    ...(type === 'title' && styles.title),
    ...(type === 'subtitle' && styles.subtitle),
    ...(type === 'header' && styles.header),
    ...(type === 'subheader' && styles.subheader),
    ...(type === 'heading' && styles.heading),
    ...(type === 'subheading' && styles.subheading),
    ...(type === 'paragraph' && styles.paragraph),
    ...(smallcaps && styles.smallCaps),
    ...(bibleText && styles.bibleText),
  };

  return (
    <View style={styles.childContainer}>
      {link ? (
        <TouchableOpacity
          onPress={() => {
            /* Navigate to link */
          }}
          style={styles.linkContainer}
        >
          <Text style={[textStyle, styles.link]}>{text}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={textStyle}>{text}</Text>
      )}
    </View>
  );
};

const IntroBlockComponent: React.FC<IntroBlock> = ({ children, type }) => {
  return (
    <View
      style={[
        styles.blockContainer,
        type === "highlight" && styles.highlightBlock
      ]}
    >
      {children.map((child, index) => (
        <IntroContentChildComponent 
          key={`${child.id}-${index}`} 
          {...child} 
        />
      ))}
    </View>
  );
};

const IntroComponent: React.FC<IntroProps> = ({ segmentData }) => {
  const { width: screenWidth } = useWindowDimensions();
  const isIPad = Platform.OS === 'ios' && Platform.isPad || screenWidth > 768;
  const { content, id } = segmentData;
  
  return (
    <View style={styles.container}>
      {/* Use the same SegmentTitle component as other segments */}
      <SegmentTitle segmentId={id} />
      
      <View style={[
        styles.contentContainer,
        isIPad && styles.contentContainerIPad
      ]}>
        {content.map((block, index) => (
          <IntroBlockComponent 
            key={`${block.id}-${index}`} 
            {...block} 
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    maxWidth: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  contentContainerIPad: {
    maxWidth: 800,
  },
  blockContainer: {
    marginVertical: 4,
  },
  highlightBlock: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  childContainer: {
    marginVertical: 2,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000000',
    marginTop: 24,
    marginBottom: 8,
  },
  subheader: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 12,
    marginBottom: 4,
  },
  paragraph: {
    marginBottom: 8,
  },
  smallCaps: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bibleText: {
    fontStyle: 'italic',
    color: '#666666',
  },
  linkContainer: {
    marginVertical: 2,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

export default IntroComponent;
