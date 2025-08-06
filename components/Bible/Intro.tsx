import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from "react-native";
import { IntroType } from "@/types";
import SegmentTitle from "./SegmentTitle";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';
import Markdown from 'react-native-markdown-display';

// Define the props for Intro component
interface IntroProps {
    segmentData: IntroType & {
        id: string;
    };
}

const IntroContentChildComponent: React.FC<any> = ({
  text,
  type,
  link,
  smallcaps,
  bibleText,
}) => {
  const { colors } = useAppSettings();
  
  // Add safety check for undefined text
  if (!text) {
    return null;
  }
  
  // For markdown content, use the markdown renderer
  if (type === 'markdown' || (text && typeof text === 'string' && (text.includes('**') || text.includes('#')))) {
    return (
      <View style={styles.childContainer}>
        <Markdown style={{
          body: { color: colors.text, fontSize: 16, lineHeight: 24, fontStyle: 'italic' },
          heading1: { color: colors.text, fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
          heading2: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginVertical: 6 },
          heading3: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginVertical: 4 },
          paragraph: { color: colors.text, fontSize: 16, lineHeight: 24, marginVertical: 4, fontStyle: 'italic' },
          list_item: { color: colors.text, fontSize: 16, lineHeight: 24, fontStyle: 'italic' },
          bullet_list: { marginVertical: 4 },
          ordered_list: { marginVertical: 4 },
          table: { borderWidth: 1, borderColor: colors.border },
          table_row: { borderBottomWidth: 1, borderBottomColor: colors.border },
          table_cell: { padding: 8, color: colors.text, fontSize: 16, fontStyle: 'italic' },
          strong: { fontWeight: 'bold', color: colors.text },
          em: { fontStyle: 'italic', color: colors.text },
          link: { color: colors.primary, textDecorationLine: 'underline' },
        }}>
          {text}
        </Markdown>
      </View>
    );
  }

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

const IntroBlockComponent: React.FC<any> = ({ children, type }) => {
  // Add safety check for children
  if (!children || !Array.isArray(children)) {
    return null;
  }

  return (
    <View
      style={[
        styles.blockContainer,
        type === "highlight" && styles.highlightBlock
      ]}
    >
      {children.map((child: any, index: number) => {
        // Add safety check for child
        if (!child) {
          return null;
        }
        return (
          <IntroContentChildComponent 
            key={`${child.id || index}-${index}`} 
            {...child} 
          />
        );
      })}
    </View>
  );
};

const IntroComponent: React.FC<IntroProps> = ({ segmentData }) => {
  const { width: screenWidth } = useWindowDimensions();
  const isIPad = Platform.OS === 'ios' && Platform.isPad || screenWidth > 768;
  const { content, id } = segmentData;
  const router = useRouter();
  const { colors } = useAppSettings();

  // Add safety check for content
  if (!content || !Array.isArray(content)) {
    return (
      <View style={styles.container}>
        <SegmentTitle segmentId={id} />
        <View style={styles.contentContainer}>
          <Text style={styles.text}>Content not available</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Use the same SegmentTitle component as other segments */}
      <SegmentTitle segmentId={id} />
      
      <View style={[
        styles.contentContainer,
        isIPad && styles.contentContainerIPad
      ]}>
        {content.map((block: any, index: number) => {
          // Add safety check for block
          if (!block || !block.children) {
            return null;
          }
          return (
            <IntroBlockComponent 
              key={`${(block as any).id || index}-${index}`} 
              {...block} 
            />
          );
        })}
      </View>
      
      {/* Next Story Button */}
      <View style={styles.nextStoryContainer}>
        <TouchableOpacity 
          style={[styles.nextStoryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            // Find the first story segment for this book
            // Extract the book number from the introduction ID (e.g., "I001" -> "001")
            const bookNumber = id.substring(1).padStart(3, '0');
            const firstStoryId = `S${bookNumber}`;
            router.push({
              pathname: "/[segment]",
              params: {
                segment: `ENG-NLT-${firstStoryId}`,
                book: ''
              }
            });
          }}
        >
          <Ionicons name="arrow-forward" size={20} color="white" />
          <Text style={styles.nextStoryText}>Start Reading</Text>
        </TouchableOpacity>
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
    fontStyle: 'italic',
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
  nextStoryContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 100, // Add extra padding to avoid bottom navigation
  },
  nextStoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  nextStoryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default IntroComponent;
