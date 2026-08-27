import { BibleLeaf } from "@/types";
import logger from '@/utils/logger';
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppSettings } from '@/context/SyncAppSettingsContext';

interface BibleLeafProps {
  leaf: BibleLeaf;
  isIndented: boolean;
  textColor: string
  leafIndex: string
  bubbleColor?: string
  renderAsTextContent?: boolean
}

const TABLE_ROW_TAGS = ['tr'];
const TABLE_HEADER_TAGS = ['th', 'th1', 'th2', 'th3'];
const TABLE_CELL_TAGS = ['tc', 'tc1', 'tc2', 'tc3'];
const TABLE_TAGS = [...TABLE_ROW_TAGS, ...TABLE_HEADER_TAGS, ...TABLE_CELL_TAGS];

const SUPER_DIGITS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '-': '⁻',
};

function tagList(tag: unknown): string[] {
  if (Array.isArray(tag)) return tag.filter((t): t is string => typeof t === 'string');
  if (typeof tag === 'string') return [tag];
  return [];
}

function hasAnyTag(tag: unknown, names: string[]): boolean {
  return tagList(tag).some((t) => names.includes(t));
}

function isVerseTag(tag: unknown): boolean {
  return tagList(tag).some((t) => t.indexOf('v') !== -1);
}

function toSuperscript(text: string): string {
  return text.split('').map((char) => SUPER_DIGITS[char] || char).join('');
}

const BibleLeafComponent: React.FC<BibleLeafProps> = ({ leaf, isIndented, textColor, leafIndex, bubbleColor = 'black', renderAsTextContent = false }) => {
  const { sizes } = useAppSettings();
  const verseRefFontSize = Math.round(sizes.body / 2);
  const verseRefLineHeight = Math.round(sizes.body);
  const bodyLineHeight = Math.round(sizes.body * 1.8);
  
  // Function to get lighter border color based on bubble color
  const getBorderColor = (color: string) => {
    switch (color) {
      case 'red':
        return 'rgba(255, 0, 0, 0.2)';
      case 'green':
        return 'rgba(0, 255, 0, 0.2)';
      case 'blue':
        return 'rgba(0, 0, 255, 0.2)';
      case 'black':
      default:
        return 'rgba(128, 128, 128, 0.2)';
    }
  };

  // Function to get dynamic cell padding based on column count
  const getDynamicCellPadding = (columnCount: number) => {
    if (columnCount <= 2) {
      return { paddingHorizontal: 16 };
    } else if (columnCount === 3) {
      return { paddingHorizontal: 8 };
    } else {
      return { paddingHorizontal: 4 };
    }
  };
  if (!leaf || typeof leaf !== 'object') {
    logger.warn(`Invalid leaf at index ${leafIndex}:`, leaf);
    return null;
  }

  const { note, text, tag, embeddedDoc, SVitalics, children } = leaf;
  
  // Handle table elements that don't have text but have children
  const isTableTag = hasAnyTag(tag, TABLE_TAGS);
  
  if (isTableTag) {
    // For table elements, render children if they exist
    if (children && Array.isArray(children)) {
      const isTableRow = hasAnyTag(tag, TABLE_ROW_TAGS);
      const isTableHeader = hasAnyTag(tag, TABLE_HEADER_TAGS);
      const isTableCell = hasAnyTag(tag, TABLE_CELL_TAGS);
      
      if (isTableRow) {
        // Count columns for dynamic spacing
        const columnCount = children.length;
        const dynamicPadding = getDynamicCellPadding(columnCount);
        
        return (
          <View style={styles.tableRow}>
            {children.map((child, index) => {
              const isHeader = hasAnyTag(child.tag, TABLE_HEADER_TAGS);

              return (
                <View key={`${leafIndex}-cell-${index}`} style={[
                  styles.tableCell,
                  isHeader && styles.tableHeaderCell,
                  { borderBottomColor: getBorderColor(bubbleColor) },
                  dynamicPadding
                ]}>
                  <Text style={[
                    styles.tableCellText,
                    { color: textColor, fontSize: sizes.body, lineHeight: bodyLineHeight },
                    isHeader && styles.tableHeaderText
                  ]}>
                    {child.children?.map((textChild: any, textIndex: number) => {
                      if (isVerseTag(textChild.tag)) {
                        return (
                          <Text
                            key={`text-${textIndex}`}
                            style={{
                              color: textColor,
                              fontSize: verseRefFontSize,
                              lineHeight: bodyLineHeight,
                            }}
                          >
                            {toSuperscript(String(textChild.text || ''))}
                            {"\u00A0"}
                          </Text>
                        );
                      }

                      return textChild.text;
                    })}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      }
      
      if (isTableCell || isTableHeader) {
        // Use default padding for individual cells (will be overridden by row-level styling)
        const defaultPadding = getDynamicCellPadding(3); // Default to 3-column spacing
        
        return (
          <View style={[
            styles.tableCell,
            isTableHeader && styles.tableHeaderCell,
            { borderBottomColor: getBorderColor(bubbleColor) },
            defaultPadding
          ]}>
            {children.map((child, index) => (
              <BibleLeafComponent
                key={`${leafIndex}-child-${index}`}
                leaf={child}
                leafIndex={`${leafIndex}-child-${index}`}
                isIndented={false}
                textColor={textColor}
                bubbleColor={bubbleColor}
              />
            ))}
          </View>
        );
      }
      
      return (
        <View style={styles.tableElement}>
          {children.map((child, index) => (
            <BibleLeafComponent
              key={`${leafIndex}-child-${index}`}
              leaf={child}
              leafIndex={`${leafIndex}-child-${index}`}
              isIndented={false}
              textColor={textColor}
              bubbleColor={bubbleColor}
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
    const isTableElement = hasAnyTag(tag, TABLE_TAGS);
    if (!isTableElement) {
      logger.warn(`Missing or invalid text in leaf at index ${leafIndex}:`, leaf);
    }
    return null;
  }

  const textSplit = text.split(" ");
  const isVerseRef = tag && Array.isArray(tag) && tag.some(t => t.indexOf("v") !== -1);
  const isChapterRef = tag && Array.isArray(tag) && tag.some(t => t.indexOf("c") !== -1);
  const tagStyle = tag && Array.isArray(tag) ? tag.reduce((acc, t) => {
    const style = styles[t as keyof typeof styles] || {};
    // Remove lineHeight from tag styles to prevent inconsistent spacing
    const { lineHeight, ...styleWithoutLineHeight } = style as any;
    return { ...acc, ...styleWithoutLineHeight };
  }, {}) : {};
  const embeddedDocStyle = !!embeddedDoc || {};
  const SVitalicsStyle = !!SVitalics || {};

  if (isVerseRef) {
    if (renderAsTextContent) {
      // Return raw text with superscript styling for inline flow
      const superscriptMap: {[key: string]: string} = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', 
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        '-': '⁻', // Add superscript hyphen/minus
        ',': '︐', // Add superscript comma (if needed)
        '.': '․'  // Add superscript period (if needed)
      };
      
      const superscriptText = text.split('').map(char => superscriptMap[char] || char).join('');
      
      return (isIndented ? "     " : "") + superscriptText + "\u00A0";
    }
    return (
      <View
        style={{
          position: 'relative',
          top: -6,
        }}
      >
        <Text
          style={{
            color: textColor,
            fontSize: verseRefFontSize,
            lineHeight: verseRefLineHeight,
          }}
        >
          {isIndented ? "     " : ""}
          {text}
          {"\u00A0"}
        </Text>
      </View>
    );
  }

  if (renderAsTextContent) {
    // Return raw text content for inline rendering
    return (isIndented ? "     " : "") + text;
  }

  return (
    <Text
      key={leafIndex}
      style={{
        ...{
          color: textColor,
          fontSize: sizes.body,
          lineHeight: bodyLineHeight,
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
  nd: {
    fontVariant: ["small-caps"],
  },
  tableElement: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    minHeight: 40,
  },
  tableCell: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeaderCell: {
    // No background color for header cells
  },
  tableCellText: {
    fontSize: 20,
    lineHeight: 36,
    flexShrink: 1,
  },
  tableHeaderText: {
    fontWeight: '700',
  },
});
