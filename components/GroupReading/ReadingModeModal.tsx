import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';

const { height: screenHeight } = Dimensions.get('window');

interface ReadingModeModalProps {
  visible: boolean;
  storyTitle: string;
  scriptureReference: string;
  storyId: string;
  onIndividual: () => void;
  onGroup: () => void;
  onCancel: () => void;
}

const ReadingModeModal: React.FC<ReadingModeModalProps> = ({
  visible,
  storyTitle,
  scriptureReference,
  storyId,
  onIndividual,
  onGroup,
  onCancel,
}) => {
  const { colors } = useAppSettings();
  const [slideAnim] = React.useState(new Animated.Value(screenHeight));
  const [backdropOpacity] = React.useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropOpacity]);

  const styles = StyleSheet.create({
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 99999,
    },
    modalContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      zIndex: 100000,
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
    scriptureRef: {
      fontSize: 16,
      color: colors.secondary,
      textAlign: 'center',
      fontStyle: 'italic',
      marginBottom: 8,
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
      fontSize: 16,
      color: colors.secondary,
      fontWeight: '500',
    },
  });

  const handleBackdropPress = () => {
    onCancel();
  };

  const handleIndividualPress = () => {
    onIndividual();
  };

  const handleGroupPress = () => {
    onGroup();
  };

  if (!visible) {
    return null;
  }

  if (!storyId) {
    return null;
  }

  return (
    <>
      <Animated.View 
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable 
          style={{ flex: 1 }} 
          onPress={handleBackdropPress}
        />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.modalContainer, 
          { 
            transform: [{ translateY: slideAnim }] 
          }
        ]}
      >
        <View style={styles.header}>
          <View style={{ width: 32 }} />
          <Text style={styles.headerTitle}>Choose Reading Mode</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onCancel}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.storyInfo}>
            <Text style={styles.storyTitle}>{storyTitle}</Text>
            {scriptureReference && (
              <Text style={styles.scriptureRef}>{scriptureReference}</Text>
            )}
          </View>

          <View style={styles.readingOptionsContainer}>
            <View style={styles.readingOption}>
              <View style={styles.optionHeader}>
                <View style={styles.optionIcon}>
                  <Ionicons name="person-outline" size={24} color="#FF5733" />
                </View>
                <Text style={styles.optionTitle}>Read Alone</Text>
              </View>
              <Text style={styles.optionDescription}>
                Enjoy a personal reading experience at your own pace with interactive features and personalized insights.
              </Text>
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleIndividualPress}
              >
                <Text style={styles.primaryButtonText}>Start Individual Reading</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.readingOption}>
              <View style={styles.optionHeader}>
                <View style={styles.optionIcon}>
                  <Ionicons name="people-outline" size={24} color="#FF5733" />
                </View>
                <Text style={styles.optionTitle}>Read with Others</Text>
              </View>
              <Text style={styles.optionDescription}>
                Create or join a group reading session to experience Scripture together with synchronized reading and shared discussions.
              </Text>
              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={handleGroupPress}
              >
                <Text style={styles.secondaryButtonText}>Start Group Reading</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </>
  );
};

export default ReadingModeModal; 