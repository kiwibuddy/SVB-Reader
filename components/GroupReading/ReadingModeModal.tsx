import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';
import { SegmentType, IntroType } from '@/types';

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

      // Auto-close timer (10 seconds)
      const timer = setTimeout(() => {
        onIndividual(); // Default to individual reading
      }, 10000);
      setAutoCloseTimer(timer);
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();

      // Clear timer
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        setAutoCloseTimer(null);
      }
    }

    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [visible]);

  if (!visible) return null;

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
          <Text style={styles.scriptureRef}>{scriptureReference}</Text>
        </View>

        <View style={styles.divider} />

        {/* Individual Reading Option */}
        <TouchableOpacity 
          style={styles.readingOption}
          activeOpacity={0.7}
          onPress={handleIndividualPress}
        >
          <View style={styles.optionHeader}>
            <Ionicons 
              name="book-outline" 
              size={24} 
              color={colors.text} 
              style={styles.optionIcon}
            />
            <Text style={styles.optionTitle}>Individual Reading</Text>
          </View>
          <Text style={styles.optionDescription}>
            Read this story on your own
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleIndividualPress}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Group Reading Option */}
        <TouchableOpacity 
          style={styles.readingOption}
          activeOpacity={0.7}
          onPress={handleGroupPress}
        >
          <View style={styles.optionHeader}>
            <Ionicons 
              name="people-outline" 
              size={24} 
              color={colors.text} 
              style={styles.optionIcon}
            />
            <Text style={styles.optionTitle}>Group Reading</Text>
          </View>
          <Text style={styles.optionDescription}>
            Read together with up to 3 friends
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleGroupPress}
            >
              <Text style={styles.secondaryButtonText}>Start Group</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.autoCloseText}>
          Will automatically continue with individual reading in 10 seconds
        </Text>
      </Animated.View>
    </>
  );
};

export default ReadingModeModal; 