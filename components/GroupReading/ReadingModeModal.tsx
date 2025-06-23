import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';
import { SegmentType, IntroType } from '@/types';
import BibleData from "@/assets/data/newBibleNLT1.json";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import Books from "@/assets/data/BookChapterList.json";
import { getSegmentReadingTime } from '@/utils/readingTime';

const { height: screenHeight } = Dimensions.get('window');

// Helper function to get book name
const getBookName = (bookCode: string): string => {
  const book = Books[bookCode as keyof typeof Books];
  return book?.bookName || bookCode;
};

interface ReadingModeModalProps {
  visible: boolean;
  story: SegmentType | IntroType;
  storyTitle: string;
  scriptureReference: string;
  storyId?: string; // Add optional storyId prop
  onIndividual: () => void;
  onGroup: () => void;
  onCancel: () => void;
}

// Type assertion for Bible data
const Bible: { [key: string]: SegmentType } = BibleData as { [key: string]: SegmentType };

const ReadingModeModal: React.FC<ReadingModeModalProps> = ({
  visible,
  story,
  storyTitle,
  scriptureReference,
  storyId: propStoryId,
  onIndividual,
  onGroup,
  onCancel,
}) => {
  const { colors } = useAppSettings();
  const [slideAnim] = React.useState(new Animated.Value(screenHeight));
  const [backdropOpacity] = React.useState(new Animated.Value(0));
  const [autoCloseTimer, setAutoCloseTimer] = React.useState<ReturnType<typeof setTimeout> | null>(null);

  // Extract story ID - this should match the segment ID from the Bible data
  const storyId = useMemo(() => {
    // First, try to use the provided storyId prop
    if (propStoryId) {
      return propStoryId;
    }
    
    // Then, try to use the story object if it has an ID
    if (story && typeof story === 'object' && 'id' in story) {
      return story.id;
    }
    
    // If story is a string, it might be the segment ID directly
    if (typeof story === 'string') {
      return story;
    }
    
    // Try to find segment ID by matching the story title
    const foundSegment = Object.entries(SegmentTitles).find(([_, segment]) => 
      segment.title === storyTitle
    );
    
    if (foundSegment) {
      return foundSegment[0];
    }
    
    console.log('ReadingModeModal: Could not determine story ID', { story, storyTitle, propStoryId, SegmentTitlesKeys: Object.keys(SegmentTitles).slice(0, 5) });
    return null;
  }, [propStoryId, story, storyTitle]);

  // Get segment data and calculate role distribution
  const segmentData = useMemo(() => {
    if (!storyId) return null;
    return Bible[storyId];
  }, [storyId]);

  // Get segment title data
  const segmentTitleData = useMemo(() => {
    if (!storyId) return null;
    return SegmentTitles[storyId as keyof typeof SegmentTitles];
  }, [storyId]);

  // Get reading time from pre-calculated data
  const readingTime = useMemo(() => {
    if (!storyId) return 0;
    const time = getSegmentReadingTime(storyId);
    console.log('ReadingModeModal: Reading time from lookup', { 
      storyId, 
      readingTime: time
    });
    return time;
  }, [storyId]);

  // Get book name
  const bookName = useMemo(() => {
    if (!segmentTitleData?.book?.[0]) return '';
    return getBookName(segmentTitleData.book[0]);
  }, [segmentTitleData?.book]);



  const styles = StyleSheet.create({
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
    },
    modalContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      zIndex: 1001,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    storyInfo: {
      alignItems: 'center',
      marginBottom: 40,
    },
    storyTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    bookName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
      textAlign: 'center',
    },
    scriptureRef: {
      fontSize: 16,
      color: colors.secondary,
      textAlign: 'center',
      fontStyle: 'italic',
      marginBottom: 8,
    },
    readingTime: {
      fontSize: 14,
      color: colors.secondary,
      textAlign: 'center',
    },

    readingOptionsContainer: {
      flex: 1,
    },
    readingOption: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderColor: colors.border,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    optionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    optionIcon: {
      marginRight: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    optionDescription: {
      fontSize: 15,
      color: colors.secondary,
      lineHeight: 22,
      marginBottom: 16,
    },
    actionButton: {
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: '#FF5733',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: '#FF5733',
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButtonText: {
      color: '#FF5733',
      fontSize: 16,
      fontWeight: '600',
    },
    bottomSection: {
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
      alignItems: 'center',
    },
    cancelButton: {
      paddingVertical: 16,
      paddingHorizontal: 32,
    },
    cancelButtonText: {
      color: colors.secondary,
      fontSize: 16,
      fontWeight: '500',
    },

  });

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: false,
        }),
      ]).start();

      // Set auto-close timer for 30 seconds
      const timer = setTimeout(() => {
        onCancel();
      }, 30000);
      setAutoCloseTimer(timer);
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }

    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [visible]);

  const handleBackdropPress = () => {
    onCancel();
  };

  const handleIndividualPress = () => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
    }
    onIndividual();
  };

  const handleGroupPress = () => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
    }
    onGroup();
  };



  if (!visible) return null;

  return (
    <>
      <Animated.View 
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        onTouchEnd={handleBackdropPress}
      />
      <Animated.View 
        style={[
          styles.modalContainer,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Choose Reading Mode</Text>
            <View style={{ width: 24 }} />
          </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.storyInfo}>
              <Text style={styles.storyTitle}>{storyTitle}</Text>
              <Text style={styles.bookName}>{bookName}</Text>
              {scriptureReference && (
                <Text style={styles.scriptureRef}>{scriptureReference}</Text>
              )}
              <Text style={styles.readingTime}>
                {readingTime} minute{readingTime !== 1 ? 's' : ''} estimated reading time
              </Text>
            </View>

            <View style={styles.readingOptionsContainer}>
              <View style={styles.readingOption}>
                <View style={styles.optionHeader}>
                  <View style={styles.optionIcon}>
                    <Ionicons 
                      name="person-outline" 
                      size={24} 
                      color="#FF5733" 
                    />
                  </View>
                  <Text style={styles.optionTitle}>Read Alone</Text>
                </View>
                <Text style={styles.optionDescription}>
                  Read this story by yourself. You can select any reading role or read all parts.
                </Text>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.primaryButton]} 
                  onPress={handleIndividualPress}
                >
                  <Text style={styles.primaryButtonText}>Start Reading</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.readingOption}>
                <View style={styles.optionHeader}>
                  <View style={styles.optionIcon}>
                    <Ionicons 
                      name="people-outline" 
                      size={24} 
                      color="#FF5733" 
                    />
                  </View>
                  <Text style={styles.optionTitle}>Read with Friends</Text>
                </View>
                <Text style={styles.optionDescription}>
                  Start a group reading session. Up to 4 people can join and each person reads their assigned role parts.
                </Text>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.secondaryButton]} 
                  onPress={handleGroupPress}
                >
                  <Text style={styles.secondaryButtonText}>Set Up Group</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.bottomSection}>
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </>
  );
};

export default ReadingModeModal; 