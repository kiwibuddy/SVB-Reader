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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSettings } from '@/context/AppSettingsContext';
import { Role, SegmentType } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RoleProgressBar from '@/components/RoleProgressBar';
import BibleData from "@/assets/data/newBibleNLT1.json";

interface GroupSetupScreenProps {
  storyId: string;
  storyTitle: string;
  scriptureReference: string;
  onStartBroadcasting: (role: Role, userName: string) => void;
  onBack: () => void;
  onShowQR: () => void;
  planId?: string;
  challengeId?: string;
}

const ROLES: { key: Role; label: string; description: string; icon: string; color: string }[] = [
  { 
    key: 'narrator', 
    label: 'Narrator', 
    description: 'Read the story narration',
    icon: 'book-outline',
    color: '#8E8E93'
  },
  { 
    key: 'god', 
    label: 'God', 
    description: 'Read God\'s words',
    icon: 'flash-outline',
    color: '#FF3B30'
  },
  { 
    key: 'main_character', 
    label: 'Main Character', 
    description: 'Read the main character\'s words',
    icon: 'person-outline',
    color: '#30D158'
  },
  { 
    key: 'other_voices', 
    label: 'Other Voices', 
    description: 'Read other characters\' words',
    icon: 'people-outline',
    color: '#007AFF'
  },
];

// Type assertion for Bible data
const Bible: { [key: string]: SegmentType } = BibleData as { [key: string]: SegmentType };

const GroupSetupScreen: React.FC<GroupSetupScreenProps> = ({
  storyId,
  storyTitle,
  scriptureReference,
  onStartBroadcasting,
  onBack,
  onShowQR,
  planId,
  challengeId,
}) => {
  const { colors } = useAppSettings();
  const [selectedRole, setSelectedRole] = useState<Role>('narrator');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Calculate story color data from the actual story sources
  const storyColorData = useMemo(() => {
    if (!storyId) {
      return { total: 0, black: 0, red: 0, green: 0, blue: 0 };
    }

    const segmentData = Bible[storyId];
    if (!segmentData || !segmentData.sources) {
      return { total: 0, black: 0, red: 0, green: 0, blue: 0 };
    }

    // Calculate color counts from sources data
    const counts = Object.values(segmentData.sources).reduce((acc, source: any) => {
      const color = source.color;
      if (color === 'black') acc.black += 1;
      else if (color === 'red') acc.red += 1;
      else if (color === 'green') acc.green += 1;
      else if (color === 'blue') acc.blue += 1;
      acc.total += 1;
      return acc;
    }, {
      black: 0,
      red: 0,
      green: 0,
      blue: 0,
      total: 0
    });

    return counts;
  }, [storyId]);

  // Filter roles based on what's available in this story
  const getAvailableRoles = (): typeof ROLES => {
    return ROLES.filter(role => {
      switch (role.key) {
        case 'narrator': return storyColorData.black > 0;
        case 'god': return storyColorData.red > 0;
        case 'main_character': return storyColorData.green > 0;
        case 'other_voices': return storyColorData.blue > 0;
        default: return false;
      }
    });
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
    const availableRoles = getAvailableRoles();
    if (availableRoles.length > 0) {
      setSelectedRole(availableRoles[0].key);
    }
  }, [storyColorData]);

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

    setIsLoading(true);
    
    try {
      // Save username for next time
      await saveUserName(userName.trim());
      
      // Start broadcasting
      onStartBroadcasting(selectedRole, userName.trim());
    } catch (error) {
      Alert.alert('Error', 'Failed to start group session. Please try again.');
      console.error('Error starting broadcast:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
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

  const isStartDisabled = !userName.trim() || isLoading;

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
              colorData={storyColorData}
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
          <View style={styles.roleOptions}>
            {getAvailableRoles().map((role, index) => (
              <TouchableOpacity
                key={role.key}
                style={[
                  styles.roleOption,
                  index === getAvailableRoles().length - 1 && styles.lastRoleOption,
                  selectedRole === role.key && styles.selectedRoleOption,
                ]}
                onPress={() => handleRoleSelect(role.key)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.roleRadio,
                  selectedRole === role.key && styles.selectedRoleRadio,
                ]}>
                  {selectedRole === role.key && <View style={styles.radioInner} />}
                </View>
                <Ionicons 
                  name={role.icon as any} 
                  size={20} 
                  color={role.color} 
                  style={styles.roleIcon}
                />
                <View style={styles.roleInfo}>
                  <Text style={styles.roleLabel}>{role.label}</Text>
                  <Text style={styles.roleDescription}>{role.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
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

        <TouchableOpacity style={styles.qrButton} onPress={onShowQR}>
          <Text style={styles.qrButtonText}>Can't connect? Use QR Code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default GroupSetupScreen; 