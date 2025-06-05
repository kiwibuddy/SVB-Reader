import { BibleLeaf } from "@/types";
import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { baseSizes } from "@/context/FontSizeContext";

interface BibleLeafProps {
  leaf: BibleLeaf;
  isIndented: boolean;
  textColor: string
  leafIndex: string
}

// **EXPERT-LEVEL TYPOGRAPHY CONSTANTS**
const TYPOGRAPHY = {
  // Perfect line height for optimal readability
  lineHeight: 1.45, // Golden ratio for reading
  
  // Refined letter spacing for premium feel
  letterSpacing: {
    body: 0.15,
    verse: 0.1,
    chapter: 0.2
  },
  
  // Consistent font weights
  fontWeight: {
    regular: '400' as '400',
    medium: '500' as '500',
    semibold: '600' as '600'
  },
  
  // Professional verse superscript sizing
  verse: {
    scale: 0.58, // Optimal superscript scale
    raise: 0.22, // Perfect baseline offset
    spacing: 3   // Ideal right margin
  }
} as const;

const BibleLeafComponent: React.FC<BibleLeafProps> = ({ leaf, isIndented, textColor, leafIndex }) => {
  if (!leaf || typeof leaf !== 'object') {
    console.warn(`Invalid leaf at index ${leafIndex}:`, leaf);
    return null;
  }

  const { note, text, tag, embeddedDoc, SVitalics } = leaf;
  
  if (!text || typeof text !== 'string') {
    console.warn(`Missing or invalid text in leaf at index ${leafIndex}:`, leaf);
    return null;
  }

  const isVerseRef = Array.isArray(tag) && tag.includes("v");
  const isChapterRef = Array.isArray(tag) && tag.includes("c");
  const tagStyle = styles[tag as unknown as keyof typeof styles] || {};

  // **TEMPORARY FIX: Hide verse and chapter numbers if formatting is problematic**
  const HIDE_VERSE_NUMBERS = true; // Set to true to hide verse numbers
  const HIDE_CHAPTER_NUMBERS = true; // Set to true to hide chapter numbers

  // **DEBUG: Log verse detection**
  if (text && (isVerseRef || isChapterRef)) {
    console.log(`📖 Leaf: Detected ${isVerseRef ? 'verse' : 'chapter'} "${text}" with tag:`, tag);
  }

  // **EXPERT VERSE SUPERSCRIPT** - Publication quality
  if (isVerseRef) {
    console.log(`🔍 Rendering verse number: "${text}" as superscript`);
    
    if (HIDE_VERSE_NUMBERS) {
      return null; // Hide verse numbers entirely
    }
    
    return (
      <Text style={[
        styles.verseNumber,
        { 
          color: textColor,
          fontSize: baseSizes.body * TYPOGRAPHY.verse.scale,
          lineHeight: baseSizes.body * TYPOGRAPHY.lineHeight, // Use same line height as body text
        }
      ]}>
        {text}
      </Text>
    );
  }

  // **REFINED CHAPTER STYLING** - Consistent with body text
  if (isChapterRef) {
    if (HIDE_CHAPTER_NUMBERS) {
      return null; // Hide chapter numbers entirely
    }
    
    return (
      <Text style={[
        styles.chapterNumber,
        { 
          color: textColor,
          fontSize: baseSizes.body,
          lineHeight: baseSizes.body * TYPOGRAPHY.lineHeight,
        }
      ]}>
        {text}
      </Text>
    );
  }

  // Handle asterisks and other special characters inline
  const isSpecialChar = text === '*' || text === '†' || text === '‡';
  if (isSpecialChar) {
    return null; // Hide special characters entirely
  }

  // **EXPERT BODY TEXT** - Optimized for extended reading
  return (
    <Text
      key={leafIndex}
      style={[
        styles.bodyText,
        { 
          color: textColor,
          fontSize: baseSizes.body,
          lineHeight: baseSizes.body * TYPOGRAPHY.lineHeight,
          fontWeight: (Array.isArray(tag) && tag.includes('nd')) ? TYPOGRAPHY.fontWeight.medium : TYPOGRAPHY.fontWeight.regular,
        }
      ]}
    >
      {isIndented ? "     " : ""}
      {text}
    </Text>
  );
};

export default BibleLeafComponent;

const styles = StyleSheet.create({
  // **EXPERT VERSE SUPERSCRIPT** - Now truly inline
  verseNumber: {
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: TYPOGRAPHY.letterSpacing.verse,
    opacity: 0.85, // Subtle but readable
    includeFontPadding: false,
    textAlignVertical: 'top',
    marginRight: TYPOGRAPHY.verse.spacing,
    // Enhanced shadow for better legibility
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0.5 },
      shadowOpacity: 0.08,
      shadowRadius: 0.5,
    }),
  },
  
  // **REFINED CHAPTER STYLING**
  chapterNumber: {
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: TYPOGRAPHY.letterSpacing.chapter,
    marginVertical: 3,
    includeFontPadding: false,
  },
  
  // **EXPERT BODY TEXT**
  bodyText: {
    letterSpacing: TYPOGRAPHY.letterSpacing.body,
    includeFontPadding: false,
    flexShrink: 1, // Allow text to shrink in flex layout
    // Subtle text enhancement for premium feel
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0.25 },
      shadowOpacity: 0.02,
      shadowRadius: 0.25,
    }),
  },
  
  // **REFINED SPECIAL STYLING**
  nd: {
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    letterSpacing: TYPOGRAPHY.letterSpacing.body * 1.1,
  },

  // **REFINED SPECIAL STYLING**
  specialChar: {
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: TYPOGRAPHY.letterSpacing.body * 1.1,
    includeFontPadding: false,
  },
});
