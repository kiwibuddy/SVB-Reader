import React, { useState } from "react";
import { View, Text, TouchableOpacity, useWindowDimensions, Platform } from "react-native";
import { IntroType } from "@/types";
import SegmentTitle from "./SegmentTitle";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';
import Markdown from 'react-native-markdown-display';
import { createStyles } from './Intro.styles';
import { parseReference } from '@/utils/parseReference';
import ReadingModeModal from '@/components/GroupReading/ReadingModeModal';
import BookChapterList from '@/assets/data/BookChapterList.json';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import readingPlansData from '@/assets/data/ReadingPlansChallenges.json';

// Define the props for Intro component
interface IntroProps {
    segmentData: IntroType & {
        id: string;
    };
    context?: 'main' | 'plan' | 'challenge';
    planId?: string;
    challengeId?: string;
}

const IntroContentChildComponent: React.FC<any> = ({
  text,
  type,
  link,
  smallcaps,
  bibleText,
  children,
  isTablet,
}) => {
  const { colors } = useAppSettings();
  const styles = createStyles(colors, isTablet);
  
  // Handle rendering children properly - some blocks have multiple text segments
  const renderChildren = () => {
    if (text) {
      // If text prop is provided directly, use it
      return text;
    }
    
    if (children && Array.isArray(children)) {
      // Map through all children and render each text segment
      return children.map((child: any, index: number) => {
        if (!child || !child.text) return null;
        
        // Apply different styling based on child properties
        const childStyle = [
          styles.text,
          child.bibleText && styles.bibleText,
          child.smallcaps && styles.smallCaps,
        ].filter(Boolean);
        
        return (
          <Text key={index} style={childStyle}>
            {child.text}
          </Text>
        );
      });
    }
    
    return null;
  };
  
  const content = renderChildren();
  
  // Add safety check for content
  if (!content) {
    return null;
  }
  
  // For markdown content, use the markdown renderer
  const firstChildText = text || (children && children[0] && children[0].text) || '';
  if (type === 'markdown' || (firstChildText && typeof firstChildText === 'string' && (firstChildText.includes('**') || firstChildText.includes('#')))) {
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
          {firstChildText}
        </Markdown>
      </View>
    );
  }

  // For title types, render as a single text element with the appropriate styling
  if (type === 'ht' || type === 'hs' || type?.startsWith('s') || type === 'heading' || type === 'subheading' || type === 'header' || type === 'subheader' || type === 'title' || type === 'subtitle') {
    const titleStyle = {
      ...(type === 'ht' && styles.title), // Main heading
      ...(type === 'hs' && styles.subtitle), // Subheading  
      ...(type?.startsWith('s') && styles.heading), // Section headings (s1, s2, etc.)
      ...(type === 'heading' && styles.heading),
      ...(type === 'subheading' && styles.subheading),
      ...(type === 'header' && styles.header),
      ...(type === 'subheader' && styles.subheader),
      ...(type === 'title' && styles.title),
      ...(type === 'subtitle' && styles.subtitle),
    };
    
    return (
      <View style={styles.childContainer}>
        <Text style={titleStyle}>{firstChildText}</Text>
      </View>
    );
  }

  // For paragraph content, render all children with proper text styling
  return (
    <View style={styles.childContainer}>
      <Text style={styles.text}>
        {content}
      </Text>
    </View>
  );
};

const IntroList: React.FC<{ items: any[]; ordered?: boolean; isTablet?: boolean }> = ({ items, ordered, isTablet }) => {
  const { colors } = useAppSettings();
  const styles = createStyles(colors, isTablet);
  
  return (
    <View style={styles.listContainer}>
      {items.map((li, index) => (
        <View key={`li-${index}`} style={styles.listItemRow}>
          <Text style={styles.bullet}>{ordered ? `${index + 1}.` : '•'}</Text>
          <Text style={styles.listItemText}>
            {li.children?.map((leaf: any, leafIndex: number) => leaf.text).join(' ')}
          </Text>
        </View>
      ))}
    </View>
  );
};

const IntroTable: React.FC<{ rows: any[]; bookCode?: string; isTablet?: boolean }> = ({ rows, bookCode, isTablet }) => {
  const { colors } = useAppSettings();
  const styles = createStyles(colors, isTablet);
  
  return (
    <View style={styles.tableWrapper}>
      {rows.map((row, rIndex) => (
        <View key={`row-${rIndex}`} style={[styles.tableRow, rIndex === rows.length - 1 && { borderBottomWidth: 0 }]}>
          {row.children?.map((cell: any, cIndex: number) => (
            <View
              key={`cell-${rIndex}-${cIndex}`}
              style={[rIndex === 0 ? styles.tableHeaderCell : styles.tableCell, { flex: 1 }]}
            >
              <Text style={rIndex === 0 ? styles.tableHeaderText : styles.tableText}>
                {cell.text}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const SourceComparison: React.FC<{ sources: any; isTablet?: boolean }> = ({ sources, isTablet }) => {
  const { colors } = useAppSettings();
  const styles = createStyles(colors, isTablet);
  
  if (!sources || Object.keys(sources).length === 0) {
    return null;
  }

  // Sort sources by word count (descending)
  const sortedSources = Object.entries(sources)
    .map(([name, data]: [string, any]) => ({
      name,
      words: data.words || 0,
      color: data.color
    }))
    .sort((a, b) => b.words - a.words)
    .slice(0, 5); // Show top 5 speakers

  const totalWords = sortedSources.reduce((sum, source) => sum + source.words, 0);

  return (
    <View style={styles.childContainer}>
      <Text style={[styles.heading, { textAlign: 'left' }]}>Speaker Analysis</Text>
      <Text style={[styles.text, { marginBottom: 12, color: colors.secondary }]}>
        Top speakers in this book by word count
      </Text>
      
      {sortedSources.map((source, index) => {
        const percentage = totalWords > 0 ? Math.round((source.words / totalWords) * 100) : 0;
        const barColor = source.color === 'red' ? colors.primary : 
                        source.color === 'green' ? '#4CAF50' :
                        source.color === 'blue' ? '#2196F3' : colors.secondary;
        
        return (
          <View key={source.name} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={[styles.text, { flex: 1, fontSize: 14, fontWeight: '500' }]}>
                {source.name}
              </Text>
              <Text style={[styles.text, { fontSize: 12, color: colors.secondary }]}>
                {source.words} words ({percentage}%)
              </Text>
            </View>
            <View style={{
              height: 6,
              backgroundColor: colors.border,
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <View style={{
                height: '100%',
                width: `${percentage}%`,
                backgroundColor: barColor,
                borderRadius: 3
              }} />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const IntroComponent: React.FC<IntroProps> = ({ segmentData, context = 'main', planId, challengeId }) => {
  const { width: screenWidth } = useWindowDimensions();
  const isIPad = Platform.OS === 'ios' && Platform.isPad || screenWidth > 768;
  const { content, id, sources } = segmentData;
  const router = useRouter();
  const { colors } = useAppSettings();
  const styles = createStyles(colors, isIPad);

  // Debug logging removed for production

  // Reading Mode Modal State
  const [showReadingModeModal, setShowReadingModeModal] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [selectedSegmentTitle, setSelectedSegmentTitle] = useState<string>('');
  const [selectedSegmentRef, setSelectedSegmentRef] = useState<string>('');

  // Get the book code from the introduction ID (e.g., "I001" -> "001" -> get corresponding book)
  const getBookFromIntroId = (introId: string): string | null => {
    // Find the book that contains this intro segment
    for (const [bookCode, bookData] of Object.entries(BookChapterList)) {
      if (bookData.segments && bookData.segments.includes(introId)) {
        return bookCode;
      }
    }
    return null;
  };

  // Get the next segment based on context (plan, challenge, or first story)
  const getNextSegment = (bookCode: string): string | null => {
    // If we're in a reading plan context, get the next segment from the plan
    if (context === 'plan' && planId) {
      const plan = readingPlansData.plans.find(p => p.id === planId);
      if (plan) {
        const allPlanSegments = Object.values(plan.segments)
          .flatMap(book => book?.segments || [])
          .filter(seg => seg.startsWith('S')); // Only story segments
        
        // Find the first story segment for this book in the plan
        const bookData = BookChapterList[bookCode as keyof typeof BookChapterList];
        if (bookData && bookData.segments) {
          const bookStorySegments = bookData.segments.filter(seg => seg.startsWith('S'));
          // Return the first story segment from this book that's in the plan
          for (const segment of bookStorySegments) {
            if (allPlanSegments.includes(segment)) {
              return segment;
            }
          }
        }
      }
    }
    
    // If we're in a reading challenge context, get the next segment from the challenge
    if (context === 'challenge' && challengeId) {
      const challenge = readingPlansData.challenges.find(c => c.id === challengeId);
      if (challenge) {
        const allChallengeSegments = Object.values(challenge.segments)
          .flatMap(book => book?.segments || [])
          .filter(seg => seg.startsWith('S')); // Only story segments
        
        // Find the first story segment for this book in the challenge
        const bookData = BookChapterList[bookCode as keyof typeof BookChapterList];
        if (bookData && bookData.segments) {
          const bookStorySegments = bookData.segments.filter(seg => seg.startsWith('S'));
          // Return the first story segment from this book that's in the challenge
          for (const segment of bookStorySegments) {
            if (allChallengeSegments.includes(segment)) {
              return segment;
            }
          }
        }
      }
    }
    
    // Default: get the first story segment for this book
    const bookData = BookChapterList[bookCode as keyof typeof BookChapterList];
    if (bookData && bookData.segments) {
      return bookData.segments.find(seg => seg.startsWith('S')) || null;
    }
    return null;
  };

  // Handle Start Reading button press
  const handleStartReading = () => {

    const bookCode = getBookFromIntroId(id);

    
    if (bookCode) {
      const nextSegment = getNextSegment(bookCode);

      
      if (nextSegment) {
        const segmentData = SegmentTitles[nextSegment as keyof typeof SegmentTitles];

        
        if (segmentData) {
          // Setting modal state
          
          setSelectedSegmentId(nextSegment);
          setSelectedSegmentTitle(segmentData.title);
          setSelectedSegmentRef((segmentData as any).ref || '');
          setShowReadingModeModal(true);
          

        } else {
          console.error('❌ No segment data found for:', nextSegment);
        }
      } else {
        console.error('❌ No next segment found for book:', bookCode);
      }
    } else {
      console.error('❌ No book code found for intro:', id);
    }
  };

  // Reading Mode Modal Handlers
  const handleIndividualReading = async () => {
    setShowReadingModeModal(false);
    
    const params: any = {
      segment: `ENG-NLT-${selectedSegmentId}`,
      book: getBookFromIntroId(id) || '',
      context: context,
      freshStart: Date.now().toString()
    };
    
    // Add context-specific parameters
    if (context === 'plan' && planId) {
      params.planId = planId;
    }
    if (context === 'challenge' && challengeId) {
      params.challengeId = challengeId;
    }
    
    router.push({
      pathname: "/[segment]",
      params
    });
  };

  const handleGroupReading = () => {
    setShowReadingModeModal(false);
    router.push({
      pathname: '/group-setup' as any,
      params: {
        storyId: selectedSegmentId,
        storyTitle: selectedSegmentTitle,
        scriptureReference: selectedSegmentRef,
      }
    });
  };

  const handleCancelModal = () => {
    setShowReadingModeModal(false);
  };

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
          if (!block) {
            return null;
          }
          
          // Handle different types of intro content blocks
          if (block.type === 'bulleted-list') {
            return <IntroList key={`bl-${index}`} items={block.children || []} isTablet={isIPad} />;
          }
          if (block.type === 'numbered-list') {
            return <IntroList key={`ol-${index}`} ordered items={block.children || []} isTablet={isIPad} />;
          }
          if (block.type === 'table') {
            return <IntroTable key={`tbl-${index}`} rows={block.children || []} isTablet={isIPad} />;
          }
          
          // For all other content types (ht, hs, s1, s2, paragraph, etc.)
          return (
            <IntroContentChildComponent
              key={`${(block as any).id || index}-${index}`}
              type={block.type}
              children={block.children}
              text={block.children?.[0]?.text}
              isTablet={isIPad}
            />
          );
        })}
      </View>
      
      {/* Source Comparison Section */}
      <SourceComparison sources={sources} isTablet={isIPad} />
      
      {/* Start Reading Button */}
      <View style={styles.nextStoryContainer}>
        <TouchableOpacity 
          style={styles.startReadingButton}
          onPress={handleStartReading}
        >
          <Ionicons name="play" size={isIPad ? 20 : 18} color="white" />
          <Text style={styles.startReadingText}>Start Reading</Text>
        </TouchableOpacity>
      </View>

      {/* Reading Mode Modal */}
      <ReadingModeModal
        visible={showReadingModeModal && !!selectedSegmentId}
        storyTitle={selectedSegmentTitle}
        scriptureReference={selectedSegmentRef}
        storyId={selectedSegmentId || ''}
        onIndividual={handleIndividualReading}
        onGroup={handleGroupReading}
        onCancel={handleCancelModal}
        // Add context information for context-aware navigation
        context="main"
      />
    </View>
  );
};

export default IntroComponent;
