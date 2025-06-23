import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';
import { SegmentType, IntroType } from '@/types';
import RoleProgressBar from '@/components/RoleProgressBar';
import BibleData from "@/assets/data/newBibleNLT1.json";
import { splitIntoParagraphs } from "@/scripts/splitIntoParagraphs";
import { getColors } from "@/scripts/getColors";

const { height: screenHeight } = Dimensions.get('window');

interface ReadingModeModalProps {
  visible: boolean;
  story: SegmentType | IntroType;
  storyTitle: string;
  scriptureReference: string;
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
  onIndividual,
  onGroup,
  onCancel,
}) => {
  const { colors } = useAppSettings();
  const [slideAnim] = React.useState(new Animated.Value(screenHeight));
  const [backdropOpacity] = React.useState(new Animated.Value(0));
  const [autoCloseTimer, setAutoCloseTimer] = React.useState<ReturnType<typeof setTimeout> | null>(null);

  // Get segment data and calculate role distribution (same logic as main Segment component)
  const segmentData = useMemo(() => {
    if (!story || !('id' in story)) return null;
    return Bible[story.id];
  }, [story]);

  // Use pre-calculated color data from segmentData
  const colorData = useMemo(() => {
    return segmentData?.colors || {
      black: 0,
      red: 0,
      green: 0,
      blue: 0,
      total: 0
    };
  }, [segmentData?.colors]);

  // Memoize the content to calculate role distribution
  const memoizedContent = useMemo(() => {
    if (!segmentData?.content) return [];
    
    // ALWAYS split content into paragraphs first (breaks long speeches into smaller bubbles)
    const splitContent = splitIntoParagraphs(segmentData.content);
    
    // For group reading, we always want to show the full split content
    return splitContent;
  }, [segmentData?.content]);

  // Calculate reader roles based on actual speech bubble distribution
  const readersByColor = useMemo(() => {
    const maxRoles = 4;
    const result: { [color: string]: number[] } = {};
    
    // Count actual speech bubbles by color from memoized content
    const bubblesByColor = memoizedContent.reduce((acc, block) => {
      const color = block.source.color;
      acc[color] = (acc[color] || 0) + 1;
      return acc;
    }, {} as { [color: string]: number });
    
    // Sort colors by bubble count (descending) to prioritize speakers with more bubbles
    const colorsByBubbleCount = Object.entries(bubblesByColor)
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count);
    
    let rolesAssigned = 0;
    
    // First pass: Ensure every speaker gets at least 1 role
    colorsByBubbleCount.forEach(({ color }) => {
      if (rolesAssigned < maxRoles) {
        result[color] = [0];
        rolesAssigned++;
      }
    });
    
    // Second pass: Distribute remaining roles proportionally to dominant speakers
    if (rolesAssigned < maxRoles) {
      const totalBubbles = Object.values(bubblesByColor).reduce((sum, c) => sum + c, 0);
      
      colorsByBubbleCount.forEach(({ color, count }) => {
        if (rolesAssigned >= maxRoles) return;
        
        const proportion = count / totalBubbles;
        const currentRoles = result[color]?.length || 0;
        
        // Calculate additional roles this color should get based on proportion
        const targetRoles = Math.round(proportion * maxRoles);
        const additionalRoles = Math.max(0, targetRoles - currentRoles);
        
        // Add additional roles up to remaining capacity
        const rolesToAdd = Math.min(additionalRoles, maxRoles - rolesAssigned);
        
        if (rolesToAdd > 0) {
          const currentPositions = result[color] || [];
          for (let i = 0; i < rolesToAdd; i++) {
            currentPositions.push(currentPositions.length);
            rolesAssigned++;
          }
          result[color] = currentPositions;
        }
      });
    }
    
    // Final pass: If still under 4 roles, give remaining to most dominant speaker
    if (rolesAssigned < maxRoles && colorsByBubbleCount.length > 0) {
      const dominantColor = colorsByBubbleCount[0].color;
      const currentPositions = result[dominantColor] || [];
      const additionalRoles = maxRoles - rolesAssigned;
      
      for (let i = 0; i < additionalRoles; i++) {
        currentPositions.push(currentPositions.length);
      }
      result[dominantColor] = currentPositions;
    }
    
    return result;
  }, [memoizedContent]);

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
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
      maxHeight: screenHeight * 0.7,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
      zIndex: 1001,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
    },
    storyInfo: {
      marginBottom: 32,
    },
    storyTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    scriptureRef: {
      fontSize: 16,
      color: colors.secondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 24,
    },
    roleDistributionSection: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderColor: colors.border,
      borderWidth: 1,
    },
    roleDistributionTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    roleDistributionExplanation: {
      fontSize: 12,
      color: colors.secondary,
      marginTop: 8,
      lineHeight: 16,
    },
    roleIconsContainer: {
      marginTop: 12,
      marginBottom: 8,
    },
    roleIconsTitle: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    roleIconsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    readingOption: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      borderColor: colors.border,
      borderWidth: 1,
    },
    readingOptionPressed: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
    },
    optionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    optionIcon: {
      marginRight: 12,
    },
    optionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    optionDescription: {
      fontSize: 14,
      color: colors.secondary,
      lineHeight: 20,
      marginLeft: 36,
    },
    buttonContainer: {
      marginTop: 8,
      marginLeft: 36,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 8,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      borderColor: colors.primary,
      borderWidth: 1,
      marginBottom: 8,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      backgroundColor: 'transparent',
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 16,
    },
    cancelButtonText: {
      color: colors.secondary,
      fontSize: 16,
      fontWeight: '500',
    },
    autoCloseText: {
      fontSize: 12,
      color: colors.secondary,
      textAlign: 'center',
      marginTop: 12,
      fontStyle: 'italic',
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

  const renderRoleIcons = () => {
    const roleIcons: React.ReactElement[] = [];
    
    // Use the same logic as readersByColor to create icons
    Object.entries(readersByColor).forEach(([color, positions]) => {
      positions.forEach((position) => {
        const colorUtils = getColors(color);
        
        roleIcons.push(
          <View key={`${color}-${position}`} style={{ alignItems: 'center' }}>
            <MaterialIcons
              name="chat-bubble"
              size={24}
              color={color === "black" ? "grey" : colorUtils.light}
            />
          </View>
        );
      });
    });
    
    return roleIcons;
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
        <View style={styles.handle} />
        
        <View style={styles.storyInfo}>
          <Text style={styles.storyTitle}>{storyTitle}</Text>
          {scriptureReference && (
            <Text style={styles.scriptureRef}>{scriptureReference}</Text>
          )}
        </View>

        {/* Role Distribution Information */}
        {colorData.total > 0 && (
          <View style={styles.roleDistributionSection}>
            <Text style={styles.roleDistributionTitle}>Story role distribution:</Text>
            <RoleProgressBar 
              colorData={colorData}
              height={6}
            />
            <Text style={styles.roleDistributionExplanation}>
              Shows the speaking parts in this story: Gray (Narrator), Red (God), Green (Main Character), Blue (Other Voices).
            </Text>
            
            <View style={styles.roleIconsContainer}>
              <Text style={styles.roleIconsTitle}>
                Reading roles for group reading ({Object.values(readersByColor).flat().length} total):
              </Text>
              <View style={styles.roleIconsRow}>
                {renderRoleIcons()}
              </View>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.readingOption}
          onPress={handleIndividualPress}
          activeOpacity={0.7}
        >
          <View style={styles.optionHeader}>
            <Ionicons 
              name="person-outline" 
              size={24} 
              color={colors.primary} 
              style={styles.optionIcon}
            />
            <Text style={styles.optionTitle}>Read Alone</Text>
          </View>
          <Text style={styles.optionDescription}>
            Read this story by yourself. You can select any reading role or read all parts.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleIndividualPress}>
              <Text style={styles.primaryButtonText}>Start Reading</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.readingOption}
          onPress={handleGroupPress}
          activeOpacity={0.7}
        >
          <View style={styles.optionHeader}>
            <Ionicons 
              name="people-outline" 
              size={24} 
              color={colors.primary} 
              style={styles.optionIcon}
            />
            <Text style={styles.optionTitle}>Read with Friends</Text>
          </View>
          <Text style={styles.optionDescription}>
            Start a group reading session. Up to 4 people can join and each person reads their assigned role parts.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleGroupPress}>
              <Text style={styles.secondaryButtonText}>Set Up Group</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.autoCloseText}>
          This will close automatically in a few seconds
        </Text>
      </Animated.View>
    </>
  );
};

export default ReadingModeModal; 