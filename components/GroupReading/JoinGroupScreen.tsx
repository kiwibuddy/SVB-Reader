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
import { useAppSettings } from '@/context/AppSettingsContext';
import { useGroupReading } from '@/context/GroupReadingContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Role, SegmentType, BibleType } from '@/types';
import RoleProgressBar from '@/components/RoleProgressBar';
import BibleData from "@/assets/data/newBibleNLT1.json";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import Books from "@/assets/data/BookChapterList.json";
import { splitIntoParagraphs } from "@/scripts/splitIntoParagraphs";
import { getColors } from "@/scripts/getColors";
import { getSegmentReadingTime } from '@/utils/readingTime';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: screenHeight } = Dimensions.get('window');

interface JoinGroupScreenProps {
  sessionId: string;
  storyId: string;
  storyTitle: string;
  scriptureReference: string;
  hostUserName: string;
  onJoinGroup: (role: Role, userName: string) => void;
  onBack: () => void;
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

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  narrator: 'Read the story text and scene descriptions',
  god: 'Voice of God and divine characters',
  main_character: 'Main character dialogue and thoughts',
  other_voices: 'Supporting characters and crowd voices',
};

// Type assertion for Bible data
const Bible: any = BibleData;



// Helper function to get book name
const getBookName = (bookCode: string): string => {
  const book = Books[bookCode as keyof typeof Books];
  return book?.bookName || bookCode;
};

const JoinGroupScreen: React.FC<JoinGroupScreenProps> = ({
  sessionId,
  storyId,
  storyTitle,
  scriptureReference,
  hostUserName,
  onJoinGroup,
  onBack,
}) => {
  const { colors } = useAppSettings();
  const [selectedReaderPosition, setSelectedReaderPosition] = useState<{
    color: string;
    position: number;
  } | null>(null);
  const [userName, setUserName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  // Animation for fullscreen slide up
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Get segment data and calculate memoized content
  const segmentData = useMemo(() => {
    return Bible[storyId];
  }, [storyId]);

  // Get segment title data
  const segmentTitleData = useMemo(() => {
    return SegmentTitles[storyId as keyof typeof SegmentTitles];
  }, [storyId]);

  // Get reading time from pre-calculated data
  const readingTime = useMemo(() => {
    return getSegmentReadingTime(storyId);
  }, [storyId]);

  // Get book name
  const bookName = useMemo(() => {
    if (!segmentTitleData?.book?.[0]) return '';
    return getBookName(segmentTitleData.book[0]);
  }, [segmentTitleData?.book]);

  // Memoize the content to prevent unnecessary re-renders
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
    hostInfo: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    hostIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#007AFF20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    hostName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    hostLabel: {
      fontSize: 14,
      color: colors.secondary,
    },
    userNameSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
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
      marginBottom: 24,
    },
    rolesContainer: {
      gap: 12,
    },
    roleOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
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
    joinButton: {
      backgroundColor: '#007AFF',
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 24,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

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

  const handleJoinGroup = async () => {
    if (!selectedReaderPosition || !userName.trim()) {
      Alert.alert('Missing Information', 'Please select a reading role and enter your name.');
      return;
    }

    setIsJoining(true);
    
    try {
      await saveUserName(userName.trim());
      const role = getRole(selectedReaderPosition.color, selectedReaderPosition.position);
      onJoinGroup(role, userName.trim());
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group reading session. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleRoleSelect = (color: string, position: number) => {
    setSelectedReaderPosition({ color, position });
  };

  const handleHelpPress = () => {
    Alert.alert(
      'Join Group Reading',
      'Choose your reading role and join the group. You\'ll read together in sync with other participants.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  // Render role preview icons (4 colored people icons)
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

  const getAllRoleOptions = (): { color: string; position: number }[] => {
    const options: { color: string; position: number }[] = [];
    Object.entries(readersByColor).forEach(([color, positions]) => {
      positions.forEach((position) => {
        options.push({ color, position });
      });
    });
    return options;
  };

  const getRoleColor = (color: string): string => {
    return ROLE_COLORS[color as Role];
  };

  const getRoleLabel = (role: Role): string => {
    const roleLabels = {
      'narrator': 'Narrator',
      'god': 'God',
      'main_character': 'Main Character',
      'other_voices': 'Other Voices'
    };
    return roleLabels[role];
  };

  const getRoleDescriptionText = (role: Role): string => {
    return {
      'narrator': 'Read the story narration',
      'god': 'Read God\'s words',
      'main_character': 'Read the main character\'s words',
      'other_voices': 'Read other characters\' words'
    }[role] || 'Read story content';
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

  useEffect(() => {
    loadSavedUserName();
  }, []);

  if (isJoining) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ color: colors.text, marginTop: 16 }}>Joining group...</Text>
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
            <Text style={styles.headerTitle}>Join Group Reading</Text>
            <TouchableOpacity style={styles.helpButton} onPress={handleHelpPress}>
              <Ionicons name="help-circle-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.storyInfo}>
              <Text style={styles.storyTitle}>{storyTitle}</Text>
              <Text style={styles.bookName}>{bookName}</Text>
              <Text style={styles.scriptureRef}>{scriptureReference}</Text>
              <Text style={styles.readingTime}>
                {readingTime} minute{readingTime !== 1 ? 's' : ''} estimated reading time
              </Text>
              {renderRoleIcons()}
            </View>

            <View style={styles.hostInfo}>
              <View style={styles.hostIcon}>
                <Ionicons name="person" size={30} color="#007AFF" />
              </View>
              <Text style={styles.hostName}>{hostUserName}</Text>
              <Text style={styles.hostLabel}>Session Host</Text>
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
                {getAllRoleOptions().map(({ color, position }) => {
                  const isSelected = selectedReaderPosition?.color === color && selectedReaderPosition?.position === position;
                  const roleColor = getRoleColor(color);

                  return (
                    <TouchableOpacity
                      key={`${color}-${position}`}
                      style={[styles.roleOption, isSelected && styles.selectedRoleOption]}
                      onPress={() => handleRoleSelect(color, position)}
                    >
                      <View 
                        style={[
                          styles.roleColorIcon, 
                          { backgroundColor: roleColor + '20' }
                        ]}
                      >
                        <Ionicons 
                          name="person" 
                          size={20} 
                          color={roleColor} 
                        />
                      </View>
                      <View style={styles.roleInfo}>
                        <Text style={styles.roleName}>{getRoleLabel(getRole(color, position))}</Text>
                        <Text style={styles.roleDescription}>{getRoleDescriptionText(getRole(color, position))}</Text>
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
                styles.joinButton,
                (!selectedReaderPosition || !userName.trim()) && styles.disabledButton
              ]}
              onPress={handleJoinGroup}
              disabled={!selectedReaderPosition || !userName.trim()}
            >
              <Text style={[
                styles.buttonText,
                (!selectedReaderPosition || !userName.trim()) && styles.disabledButtonText
              ]}>
                Join Reading Group
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

export default JoinGroupScreen;