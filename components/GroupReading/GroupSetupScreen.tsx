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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSettings } from '@/context/AppSettingsContext';
import { Role, SegmentType } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RoleProgressBar from '@/components/RoleProgressBar';
import BibleData from "@/assets/data/newBibleNLT1.json";
import { splitIntoParagraphs } from "@/scripts/splitIntoParagraphs";
import { splitContentIntoReaderParts } from "@/scripts/splitContentIntoReaderParts";
import { getColors } from "@/scripts/getColors";

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
const Bible: { [key: string]: SegmentType } = BibleData as { [key: string]: SegmentType };

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
  const [selectedReaderPosition, setSelectedReaderPosition] = useState<{
    color: string;
    position: number;
  } | null>(null);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get segment data and calculate memoized content (same as main Segment component)
  const segmentData = useMemo(() => {
    return Bible[storyId];
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
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 16,
    },
    helpButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 32,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    iconRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    phoneIcon: {
      width: 50,
      height: 50,
      borderRadius: 12,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 4,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      color: colors.secondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 8,
    },
    storyName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
    },
    storyInfoSection: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderColor: colors.border,
      borderWidth: 1,
    },
    progressSection: {
      marginBottom: 16,
    },
    progressTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    progressExplanation: {
      fontSize: 12,
      color: colors.secondary,
      marginTop: 8,
      lineHeight: 16,
    },
    nameSection: {
      marginBottom: 32,
    },
    nameLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    nameInput: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    nameInputFocused: {
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    roleSection: {
      marginBottom: 40,
    },
    roleSectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    roleIconsContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderColor: colors.border,
      borderWidth: 1,
      marginBottom: 16,
    },
    roleIconsTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    roleIconsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    roleOptions: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderColor: colors.border,
      borderWidth: 1,
      overflow: 'hidden',
    },
    roleOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    lastRoleOption: {
      borderBottomWidth: 0,
    },
    selectedRoleOption: {
      backgroundColor: colors.primary + '10',
    },
    roleRadio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedRoleRadio: {
      borderColor: colors.primary,
    },
    radioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    roleIcon: {
      marginRight: 12,
    },
    roleInfo: {
      flex: 1,
    },
    roleLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    roleDescription: {
      fontSize: 14,
      color: colors.secondary,
    },
    buttonContainer: {
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    startButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    startButtonDisabled: {
      backgroundColor: colors.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    startButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    startButtonTextDisabled: {
      color: colors.secondary,
    },
    qrButton: {
      backgroundColor: 'transparent',
      paddingVertical: 12,
      alignItems: 'center',
    },
    qrButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '500',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 8,
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
      const savedName = await AsyncStorage.getItem('userName');
      if (savedName) {
        setUserName(savedName);
      }
    } catch (error) {
      console.log('Error loading saved username:', error);
    }
  };

  const saveUserName = async (name: string) => {
    try {
      await AsyncStorage.setItem('userName', name);
    } catch (error) {
      console.log('Error saving username:', error);
    }
  };

  const handleStartBroadcasting = async () => {
    if (!userName.trim()) {
      Alert.alert('Name Required', 'Please enter your name to continue.');
      return;
    }

    if (!selectedReaderPosition) {
      Alert.alert('Role Required', 'Please select a reading role to continue.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Save username for next time
      await saveUserName(userName.trim());
      
      // Convert to legacy role format for compatibility
      const role = getRole(selectedReaderPosition.color, selectedReaderPosition.position);
      
      // Start broadcasting
      onStartBroadcasting(role, userName.trim());
    } catch (error) {
      Alert.alert('Error', 'Failed to start group session. Please try again.');
      console.error('Error starting broadcast:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (color: string, position: number) => {
    setSelectedReaderPosition({ color, position });
  };

  const handleHelpPress = () => {
    Alert.alert(
      'Group Reading Help',
      'Start a group reading session by:\n\n1. Enter your name\n2. Choose your reading role\n3. Tap "Start Broadcasting"\n4. Others can join from their home screen\n\nIf others can\'t see your session, use the QR code option.',
      [{ text: 'Got it!' }]
    );
  };

  const renderPhoneIcons = () => {
    return (
      <View style={styles.iconRow}>
        {[1, 2, 3, 4].map((index) => (
          <View key={index} style={styles.phoneIcon}>
            <Ionicons 
              name="phone-portrait-outline" 
              size={24} 
              color={colors.primary}
            />
          </View>
        ))}
      </View>
    );
  };

  const renderRoleIcons = () => {
    const roleIcons: React.ReactElement[] = [];
    
    // Use the same logic as readersByColor to create icons
    Object.entries(readersByColor).forEach(([color, positions]) => {
      positions.forEach((position) => {
        const isActive = selectedReaderPosition?.color === color && 
                        selectedReaderPosition?.position === position;
        const colorUtils = getColors(color);
        
        roleIcons.push(
          <TouchableOpacity
            key={`${color}-${position}`}
            onPress={() => handleRoleSelect(color, position)}
          >
            <MaterialIcons
              name={isActive ? "mark-chat-read" : "chat-bubble"}
              size={30}
              color={color === "black" ? "grey" : isActive ? colorUtils.dark : colorUtils.light}
            />
          </TouchableOpacity>
        );
      });
    });
    
    return roleIcons;
  };

  // Get all available role options for the dropdown
  const getAllRoleOptions = () => {
    const options: Array<{
      color: string;
      position: number;
      label: string;
      description: string;
    }> = [];
    
    Object.entries(readersByColor).forEach(([color, positions]) => {
      positions.forEach((position) => {
        options.push({
          color,
          position,
          label: getRoleDisplayName(color, position),
          description: getRoleDescription(color),
        });
      });
    });
    
    return options;
  };

  const isStartDisabled = !userName.trim() || !selectedReaderPosition || isLoading;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Reading</Text>
        <TouchableOpacity style={styles.helpButton} onPress={handleHelpPress}>
          <Ionicons name="help-circle-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderPhoneIcons()}
        
        <View style={styles.iconContainer}>
          <Text style={styles.title}>Gather Your Group</Text>
          <Text style={styles.subtitle}>Invite up to 3 friends to read</Text>
          <Text style={styles.storyName}>"{storyTitle}"</Text>
          <Text style={styles.subtitle}>together</Text>
        </View>

        {/* Story Role Distribution */}
        <View style={styles.storyInfoSection}>
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Story role distribution:</Text>
            <RoleProgressBar 
              colorData={colorData}
              height={6}
            />
            <Text style={styles.progressExplanation}>
              Shows the speaking parts in this story: Gray (Narrator), Red (God), Green (Main Character), Blue (Other Voices). Choose your reading role as the host.
            </Text>
          </View>
        </View>

        <View style={styles.nameSection}>
          <Text style={styles.nameLabel}>Your Name</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Enter your name"
            placeholderTextColor={colors.secondary}
            value={userName}
            onChangeText={setUserName}
            maxLength={30}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        <View style={styles.roleSection}>
          <Text style={styles.roleSectionTitle}>Your Role</Text>
          
          {/* Role Icons Preview */}
          <View style={styles.roleIconsContainer}>
            <Text style={styles.roleIconsTitle}>Select your reading role:</Text>
            <View style={styles.roleIconsRow}>
              {renderRoleIcons()}
            </View>
          </View>

          {/* Role Options List */}
          <View style={styles.roleOptions}>
            {getAllRoleOptions().map((roleOption, index) => {
              const isSelected = selectedReaderPosition?.color === roleOption.color && 
                               selectedReaderPosition?.position === roleOption.position;
              const colorUtils = getColors(roleOption.color);
              
              return (
                <TouchableOpacity
                  key={`${roleOption.color}-${roleOption.position}`}
                  style={[
                    styles.roleOption,
                    index === getAllRoleOptions().length - 1 && styles.lastRoleOption,
                    isSelected && styles.selectedRoleOption,
                  ]}
                  onPress={() => handleRoleSelect(roleOption.color, roleOption.position)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.roleRadio,
                    isSelected && styles.selectedRoleRadio,
                  ]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <MaterialIcons
                    name="chat-bubble"
                    size={20}
                    color={roleOption.color === "black" ? "grey" : colorUtils.light}
                    style={styles.roleIcon}
                  />
                  <View style={styles.roleInfo}>
                    <Text style={styles.roleLabel}>{roleOption.label}</Text>
                    <Text style={styles.roleDescription}>{roleOption.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.startButton,
            isStartDisabled && styles.startButtonDisabled,
          ]}
          onPress={handleStartBroadcasting}
          disabled={isStartDisabled}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.loadingText}>Starting...</Text>
            </View>
          ) : (
            <Text style={[
              styles.startButtonText,
              isStartDisabled && styles.startButtonTextDisabled,
            ]}>
              Start Broadcasting
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default GroupSetupScreen; 