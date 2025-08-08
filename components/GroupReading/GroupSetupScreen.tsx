import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSettings } from '@/context/AppSettingsContext';
import { Role, SegmentType, BibleType, GroupSession } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RoleProgressBar from '@/components/RoleProgressBar';
import BibleData from "@/assets/data/newBibleNLT1.json";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import Books from "@/assets/data/BookChapterList.json";
import { splitIntoParagraphs } from "@/scripts/splitIntoParagraphs";
import { splitContentIntoReaderParts } from "@/scripts/splitContentIntoReaderParts";
import { getColors } from "@/scripts/getColors";
import { getSegmentReadingTime } from '@/utils/readingTime';
import { qrCodeDiscoveryManager } from '@/services/QRCodeDiscoveryManager';
import { useGroupReading } from '@/context/GroupReadingContext';

const { height: screenHeight } = Dimensions.get('window');

interface GroupSetupScreenProps {
  storyId: string;
  storyTitle: string;
  scriptureReference: string;
  onStartBroadcasting: (role: Role, userName: string) => void;
  onBack: () => void;
  planId?: string;
  challengeId?: string;
}

// Type assertion for Bible data
const Bible: any = BibleData;



// Helper function to get book name
const getBookName = (bookCode: string): string => {
  const book = Books[bookCode as keyof typeof Books];
  return book?.bookName || bookCode;
};

const GroupSetupScreen: React.FC<GroupSetupScreenProps> = ({
  storyId,
  storyTitle,
  scriptureReference,
  onStartBroadcasting,
  onBack,
  planId,
  challengeId,
}) => {
  const { colors } = useAppSettings();
  const { startHostSession, generateSessionQRCode } = useGroupReading();
  const [selectedReaderPosition, setSelectedReaderPosition] = useState<{
    color: string;
    position: number;
  } | null>(null);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  // Animation for fullscreen slide up
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Get segment data and calculate memoized content (same as main Segment component)
  const segmentData = useMemo(() => {
    return Bible[storyId];
  }, [storyId]);

  // Get segment title data
  const segmentTitleData = useMemo(() => {
    return SegmentTitles[storyId as keyof typeof SegmentTitles];
  }, [storyId]);

  // Use pre-calculated color data from segmentData instead of recalculating from split content
  const colorData = useMemo(() => {
    // Use the original pre-calculated color data that's based on word counts
    return segmentData?.colors || {
      black: 0,
      red: 0,
      green: 0,
      blue: 0,
      total: 0
    };
  }, [segmentData?.colors]);

  // Get reading time from pre-calculated data
  const readingTime = useMemo(() => {
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

  // Convert color/position to legacy Role type for compatibility
  const getRole = (color: string, position: number): Role => {
    switch (color) {
      case 'black': return 'narrator';
      case 'red': return 'god';
      case 'green': return 'main_character';
      case 'blue': return 'other_voices';
      default: return 'narrator';
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

  // Get description for color
  const getRoleDescription = (color: string): string => {
    return {
      'black': 'Read the story narration',
      'red': 'Read God\'s words',
      'green': 'Read the main character\'s words',
      'blue': 'Read other characters\' words'
    }[color] || 'Read story content';
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
      justifyContent: 'space-between',
    },
    storyInfo: {
      marginBottom: 20,
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
    rolePreviewSection: {
      marginBottom: 24,
    },
    rolePreviewTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    rolesPreview: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: 8,
      marginTop: 16,
    },
    rolePreviewItem: {
      alignItems: 'center',
      flex: 1,
    },
    rolePreviewIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    rolePreviewLabel: {
      fontSize: 12,
      color: colors.text,
      textAlign: 'center',
      fontWeight: '500',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    userNameSection: {
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.card,
    },
    roleSelectionSection: {
      flex: 1,
      marginBottom: 16,
    },
    rolesContainer: {
      gap: 8,
    },
    roleOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    selectedRoleOption: {
      borderColor: '#007AFF',
      backgroundColor: '#007AFF10',
    },
    roleColorIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    roleInfo: {
      flex: 1,
    },
    roleName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    roleDescription: {
      fontSize: 14,
      color: colors.secondary,
    },
    startButton: {
      backgroundColor: '#007AFF',
      paddingVertical: 16,
      paddingHorizontal: 32,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  useEffect(() => {
    // Load saved username
    loadSavedUserName();
  }, []);

  useEffect(() => {
    // Set initial role to first available role for this story
    const roleEntries = Object.entries(readersByColor);
    if (roleEntries.length > 0) {
      const [firstColor, positions] = roleEntries[0];
      setSelectedReaderPosition({ color: firstColor, position: positions[0] });
    }
  }, [readersByColor]);

  const loadSavedUserName = async () => {
    try {
      const savedName = await AsyncStorage.getItem('groupUserName');
      if (savedName) {
        setUserName(savedName);
      }
    } catch (error) {
      console.error('Error loading saved user name:', error);
    }
  };

  const saveUserName = async (name: string) => {
    try {
      await AsyncStorage.setItem('groupUserName', name);
    } catch (error) {
      console.error('Error saving user name:', error);
    }
  };

  const handleGenerateQRCode = async () => {
    if (!selectedReaderPosition || !userName.trim()) {
      Alert.alert('Missing Information', 'Please select a reading role and enter your name.');
      return;
    }

    setIsLoading(true);
    
    try {
      await saveUserName(userName.trim());
      const role = getRole(selectedReaderPosition.color, selectedReaderPosition.position);
      // Initialize context-backed host session so role and session are globally available
      await startHostSession(storyId, storyTitle, scriptureReference, role, userName.trim(), planId, challengeId);
      // Generate QR using context (ensures session state alignment)
      const qrCodeData = await generateSessionQRCode(role);
      
      // Navigate to QR sharing screen with session data
      const router = useRouter();
      router.push({
        pathname: '/qr-share' as any,
        params: {
          sessionId: 'context',
          storyId,
          storyTitle,
          hostUserName: userName.trim(),
          hostRole: role,
          qrCodeData: qrCodeData
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      Alert.alert('Error', 'Failed to generate QR code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (color: string, position: number) => {
    setSelectedReaderPosition({ color, position });
  };

  const handleHelpPress = () => {
    Alert.alert(
      'Group Reading',
      'Choose your reading role and share with friends. Everyone will read together in sync!',
      [{ text: 'Got it', style: 'default' }]
    );
  };



  // Render role preview icons (elegant role cards)
  const renderRoleIcons = () => {
    const roleColors = {
      'black': '#8E8E93',
      'red': '#FF3B30', 
      'green': '#30D158',
      'blue': '#007AFF'
    };

    const roleLabels = {
      'black': 'Narrator',
      'red': 'God',
      'green': 'Main Character',
      'blue': 'Other Voices'
    };

    return (
      <View style={styles.rolesPreview}>
        {Object.entries(readersByColor).map(([color, positions]) => 
          positions.map((position, index) => (
            <View 
              key={`${color}-${position}`}
              style={styles.rolePreviewItem}
            >
              <View 
                style={[
                  styles.rolePreviewIcon, 
                  { backgroundColor: roleColors[color as keyof typeof roleColors] + '15' }
                ]}
              >
                <Ionicons 
                  name="person" 
                  size={18} 
                  color={roleColors[color as keyof typeof roleColors]} 
                />
              </View>
              <Text style={styles.rolePreviewLabel}>
                {roleLabels[color as keyof typeof roleLabels]} {positions.length > 1 ? position + 1 : ''}
              </Text>
            </View>
          ))
        )}
      </View>
    );
  };

  const getAllRoleOptions = () => {
    const options: Array<{
      color: string;
      position: number;
      displayName: string;
      description: string;
    }> = [];

    Object.entries(readersByColor).forEach(([color, positions]) => {
      positions.forEach((position) => {
        options.push({
          color,
          position,
          displayName: getRoleDisplayName(color, position),
          description: getRoleDescription(color),
        });
      });
    });

    return options.sort((a, b) => {
      const colorOrder = ['black', 'red', 'green', 'blue'];
      const colorDiff = colorOrder.indexOf(a.color) - colorOrder.indexOf(b.color);
      if (colorDiff !== 0) return colorDiff;
      return a.position - b.position;
    });
  };

  const handleBack = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onBack();
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ color: colors.text, marginTop: 16 }}>Generating QR code...</Text>
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>Start Group Reading</Text>
            <TouchableOpacity style={styles.helpButton} onPress={handleHelpPress}>
              <Ionicons name="help-circle-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.storyInfo}>
              <Text style={styles.storyTitle}>{storyTitle}</Text>
              <Text style={styles.bookName}>{bookName}</Text>
              <Text style={styles.scriptureRef}>{scriptureReference}</Text>
              <Text style={styles.readingTime}>
                {readingTime} minute{readingTime !== 1 ? 's' : ''} estimated reading time
              </Text>
            </View>

            <View style={styles.userNameSection}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={userName}
                onChangeText={setUserName}
                placeholder="Enter your name"
                placeholderTextColor={colors.secondary}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.roleSelectionSection}>
              <Text style={styles.sectionTitle}>Select Your Reading Role</Text>
              
              <View style={styles.rolesContainer}>
                {getAllRoleOptions().map((option, index) => {
                  const isSelected = selectedReaderPosition?.color === option.color && 
                                   selectedReaderPosition?.position === option.position;
                  
                  const roleColors = {
                    'black': '#8E8E93',
                    'red': '#FF3B30',
                    'green': '#30D158',
                    'blue': '#007AFF'
                  };

                  return (
                    <TouchableOpacity
                      key={`${option.color}-${option.position}`}
                      style={[styles.roleOption, isSelected && styles.selectedRoleOption]}
                      onPress={() => handleRoleSelect(option.color, option.position)}
                    >
                      <View 
                        style={[
                          styles.roleColorIcon, 
                          { backgroundColor: roleColors[option.color as keyof typeof roleColors] + '20' }
                        ]}
                      >
                        <Ionicons 
                          name="person" 
                          size={20} 
                          color={roleColors[option.color as keyof typeof roleColors]} 
                        />
                      </View>
                      <View style={styles.roleInfo}>
                        <Text style={styles.roleName}>{option.displayName}</Text>
                        <Text style={styles.roleDescription}>{option.description}</Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.startButton,
                (!selectedReaderPosition || !userName.trim()) && styles.disabledButton
              ]}
              onPress={handleGenerateQRCode}
              disabled={!selectedReaderPosition || !userName.trim()}
            >
              <Text style={styles.buttonText}>Generate QR Code</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

export default GroupSetupScreen; 