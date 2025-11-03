import React, { useState, useEffect, useCallback, useMemo, useRef, useContext, useReducer, useLayoutEffect, useImperativeHandle, useDebugValue } from 'react';
import logger from '@/utils/logger';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useGroupReading } from '@/context/GroupReadingContext';
import { Role, Participant, SegmentType, BibleType } from '@/types';
import RoleProgressBar from '@/components/RoleProgressBar';
import { bibleLoader } from '@/services/BibleLoader';
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import Books from "@/assets/data/BookChapterList.json";
import { splitIntoParagraphs } from "@/scripts/splitIntoParagraphs";
import { getColors } from "@/scripts/getColors";
import { getSegmentReadingTime } from '@/utils/readingTime';

const { height: screenHeight } = Dimensions.get('window');

interface HostWaitingScreenProps {
  sessionId: string;
  storyTitle: string;
  scriptureReference: string;
  storyColorData: {
    total: number;
    black: number;
    red: number;
    green: number;
    blue: number;
  };
  onStartReading: () => void;
  onEndSession: () => void;
  onShowQR: () => void;
}

const ROLE_COLORS: Record<Role, string> = {
  narrator: '#8E8E93',
  god: '#FF3B30',
  main_character: '#30D158',
  other_voices: '#007AFF',
};

const ROLE_LABELS: Record<Role, string> = {
  narrator: 'Narrator',
  god: 'God',
  main_character: 'Main Character',
  other_voices: 'Other Voices',
};



// Helper function to get book name
const getBookName = (bookCode: string): string => {
  const book = Books[bookCode as keyof typeof Books];
  return book?.bookName || bookCode;
};

const HostWaitingScreen: React.FC<HostWaitingScreenProps> = ({
  sessionId,
  storyTitle,
  scriptureReference,
  storyColorData,
  onStartReading,
  onEndSession,
  onShowQR,
}) => {
  const { colors, language } = useSyncAppSettings();
  const { currentSession } = useGroupReading();
  const [isStarting, setIsStarting] = useState(false);
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  // Load Bible dynamically based on current language
  const Bible = useMemo(() => {
    return bibleLoader.getCurrentBible();
  }, [language]); // Re-load when language changes

  // Animation for fullscreen slide up
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const participants = currentSession?.participants || [];
  const storyId = currentSession?.storyId;

  // Get segment data and calculate memoized content (same as main Segment component)
  const segmentData = useMemo(() => {
    if (!storyId) return null;
    return Bible[storyId];
  }, [storyId, Bible]);

  // Get segment title data
  const segmentTitleData = useMemo(() => {
    if (!storyId) return null;
    return SegmentTitles[storyId as keyof typeof SegmentTitles];
  }, [storyId]);

  // Get reading time from pre-calculated data
  const readingTime = useMemo(() => {
    if (!storyId) return 0;
    return getSegmentReadingTime(storyId);
  }, [storyId]);

  // Get book name
  const bookName = useMemo(() => {
    if (!segmentTitleData?.book?.[0]) return '';
    return getBookName(segmentTitleData.book[0]);
  }, [segmentTitleData?.book]);

  // Memoize the content to prevent unnecessary re-renders (same logic as main Segment component)
  const memoizedContent = useMemo(() => {
    if (!segmentData?.content) return [];
    
    // ALWAYS split content into paragraphs first (breaks long speeches into smaller bubbles)
    const splitContent = splitIntoParagraphs(segmentData.content);
    
    // For group reading, we always want to show the full split content
    // This ensures proper role distribution based on actual speech bubbles
    return splitContent;
  }, [segmentData?.content]);

  // Calculate reader roles based on actual speech bubble distribution (same logic as main Segment component)
  const readersByColor = useMemo(() => {
    const maxRoles = 4;
    const result: { [color: string]: number[] } = {};
    
    // Count actual speech bubbles by color from memoized content
    const bubblesByColor = memoizedContent.reduce((acc, block) => {
      if (block.source) {
        const color = block.source.color;
        acc[color] = (acc[color] || 0) + 1;
      }
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

  // Convert legacy Role to color/position
  const getColorFromRole = (role: Role): string => {
    switch (role) {
      case 'narrator': return 'black';
      case 'god': return 'red';
      case 'main_character': return 'green';
      case 'other_voices': return 'blue';
      default: return 'black';
    }
  };

  // Get display name for color/position combination
  const getRoleDisplayName = (color: string, position: number): string => {
    const colorPositions = readersByColor[color] || [];
    const baseName = {
      'black': 'Narrator',
      'red': 'God',
      'green': 'Main Character',
      'blue': 'Other Voices'
    }[color] || 'Reader';
    
    if (colorPositions.length > 1) {
      return `${baseName} ${position + 1}`;
    }
    return baseName;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    animatedContainer: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 8 : 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    helpButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      padding: 16,
      paddingBottom: Platform.OS === 'ios' ? 16 : 32,
      // Ensure content can scroll properly on Android
    },
    storyInfo: {
      marginBottom: 24,
      alignItems: 'center',
    },
    storyTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    bookName: {
      fontSize: 18,
      fontWeight: '500',
      color: colors.secondary,
      textAlign: 'center',
      marginBottom: 4,
    },
    scriptureRef: {
      fontSize: 16,
      color: colors.secondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    readingTime: {
      fontSize: 14,
      color: colors.secondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    rolesPreview: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 24,
    },
    roleIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    participantsSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    participantsList: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    participantItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    lastParticipant: {
      borderBottomWidth: 0,
    },
    participantInfo: {
      flex: 1,
      marginLeft: 12,
    },
    participantName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    participantRole: {
      fontSize: 14,
      color: colors.secondary,
      marginTop: 2,
    },
    emptyParticipants: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    emptyText: {
      fontSize: 16,
      color: colors.secondary,
      textAlign: 'center',
    },
    buttonsContainer: {
      gap: 12,
      marginTop: 'auto',
      paddingTop: 24,
    },
    startButton: {
      backgroundColor: '#007AFF',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    disabledButton: {
      backgroundColor: colors.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    disabledButtonText: {
      color: colors.secondary,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    dangerButton: {
      backgroundColor: 'transparent',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#FF3B30',
    },
    dangerButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#FF3B30',
    },
  });

  const handleStartReading = async () => {
    if (participants.length === 0) {
      Alert.alert(
        'No Participants',
        'Wait for others to join your group before starting to read.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsStarting(true);
    
    try {
      onStartReading();
    } catch (error) {
      logger.error('Error starting reading:', error);
      Alert.alert('Error', 'Failed to start reading. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndSession = () => {
    Alert.alert(
      'End Group Session',
      'Are you sure you want to end this group reading session? All participants will be disconnected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Session', style: 'destructive', onPress: onEndSession },
      ]
    );
  };

  const handleHelpPress = () => {
    Alert.alert(
      'Group Reading Host',
      'You are hosting a group reading session. Others can join from their home screen. Once everyone has joined, tap "Start Reading" to begin the synchronized reading experience.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const renderRoleIcons = () => {
    const roleColors = {
      'black': '#8E8E93',
      'red': '#FF3B30', 
      'green': '#30D158',
      'blue': '#007AFF'
    };

    const availableRoles = Object.entries(readersByColor)
      .sort(([a], [b]) => {
        const order = ['black', 'red', 'green', 'blue'];
        return order.indexOf(a) - order.indexOf(b);
      });

    // Ensure we always show 4 icons, fill with default colors if needed
    const iconsToShow: { color: string; available: boolean }[] = [];
    const maxIcons = 4;
    
    availableRoles.forEach(([color, positions]) => {
      positions.forEach(() => {
        if (iconsToShow.length < maxIcons) {
          iconsToShow.push({ color, available: true });
        }
      });
    });

    // Fill remaining slots with unavailable roles
    const allColors = ['black', 'red', 'green', 'blue'];
    while (iconsToShow.length < maxIcons) {
      const missingColor: string = allColors.find(color => 
        !iconsToShow.some(icon => icon.color === color)
      ) || allColors[iconsToShow.length];
      iconsToShow.push({ color: missingColor, available: false });
    }

    return (
      <View style={styles.rolesPreview}>
        {iconsToShow.map((roleInfo, index) => (
          <View 
            key={index}
            style={[
              styles.roleIcon, 
              { 
                backgroundColor: roleInfo.available 
                  ? roleColors[roleInfo.color as keyof typeof roleColors] + '20'
                  : colors.border + '20'
              }
            ]}
          >
            <Ionicons 
              name="person" 
              size={24} 
              color={roleInfo.available 
                ? roleColors[roleInfo.color as keyof typeof roleColors]
                : colors.border
              } 
            />
          </View>
        ))}
      </View>
    );
  };

  const renderParticipants = () => {
    if (participants.length === 0) {
      return (
        <View style={styles.emptyParticipants}>
          <Ionicons name="people-outline" size={64} color={colors.border} />
          <Text style={styles.emptyText}>
            Waiting for others to join...{'\n'}
            Share your session ID or use the QR code
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.participantsList}>
        {participants.map((participant, index) => {
          const roleColor = ROLE_COLORS[participant.role];
          
          return (
            <View 
              key={participant.deviceId} 
              style={[
                styles.participantItem,
                index === participants.length - 1 && styles.lastParticipant
              ]}
            >
              <View 
                style={[
                  styles.roleIcon,
                  { 
                    backgroundColor: roleColor + '20',
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                  }
                ]}
              >
                <Ionicons 
                  name="person" 
                  size={20} 
                  color={roleColor} 
                />
              </View>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{participant.userName}</Text>
                <Text style={styles.participantRole}>
                  {ROLE_LABELS[participant.role]}
                </Text>
              </View>
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color="#30D158" 
              />
            </View>
          );
        })}
      </View>
    );
  };

  const handleBack = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onEndSession();
    });
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Group Reading Host</Text>
            <TouchableOpacity style={styles.helpButton} onPress={handleHelpPress}>
              <Ionicons name="help-circle-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ 
              flexGrow: 1,
              paddingBottom: 20
            }}
            bounces={true}
            alwaysBounceVertical={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={Platform.OS === 'android'}
          >
            <View style={styles.storyInfo}>
              <Text style={styles.storyTitle}>{storyTitle}</Text>
              <Text style={styles.bookName}>{bookName}</Text>
              <Text style={styles.scriptureRef}>{scriptureReference}</Text>
              <Text style={styles.readingTime}>
                {readingTime} minute{readingTime !== 1 ? 's' : ''} estimated reading time
              </Text>
              {renderRoleIcons()}
            </View>

            <View style={styles.participantsSection}>
              <Text style={styles.sectionTitle}>
                Participants ({participants.length})
              </Text>
              {renderParticipants()}
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[
                  styles.startButton,
                  (participants.length === 0 || isStarting) && styles.disabledButton
                ]}
                onPress={handleStartReading}
                disabled={participants.length === 0 || isStarting}
              >
                {isStarting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[
                    styles.buttonText,
                    (participants.length === 0) && styles.disabledButtonText
                  ]}>
                    Start Reading Together
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={onShowQR}>
                <Text style={styles.secondaryButtonText}>Share QR Code</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dangerButton} onPress={handleEndSession}>
                <Text style={styles.dangerButtonText}>End Session</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

export default HostWaitingScreen; 