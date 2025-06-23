import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useGroupReading } from '@/context/GroupReadingContext';
import { Role, Participant, SegmentType } from '@/types';
import RoleProgressBar from '@/components/RoleProgressBar';
import BibleData from "@/assets/data/newBibleNLT1.json";
import { splitIntoParagraphs } from "@/scripts/splitIntoParagraphs";
import { getColors } from "@/scripts/getColors";

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

// Type assertion for Bible data
const Bible: { [key: string]: SegmentType } = BibleData as { [key: string]: SegmentType };

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

const HostWaitingScreen: React.FC<HostWaitingScreenProps> = ({
  sessionId,
  storyTitle,
  scriptureReference,
  storyColorData,
  onStartReading,
  onEndSession,
  onShowQR,
}) => {
  const { colors } = useAppSettings();
  const { currentSession, acceptJoiner } = useGroupReading();
  const [isStarting, setIsStarting] = useState(false);

  const participants = currentSession?.participants || [];
  const storyId = currentSession?.storyId;

  // Get segment data and calculate memoized content (same as main Segment component)
  const segmentData = useMemo(() => {
    if (!storyId) return null;
    return Bible[storyId];
  }, [storyId]);

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
    endButton: {
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
      paddingTop: 24,
    },
    statusSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    statusIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.secondary,
      textAlign: 'center',
      marginBottom: 4,
    },
    storyName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
    },
    sessionInfo: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderColor: colors.border,
      borderWidth: 1,
    },
    sessionId: {
      fontSize: 14,
      color: colors.secondary,
      textAlign: 'center',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      marginBottom: 12,
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
    participantsSection: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    roleIconsContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderColor: colors.border,
      borderWidth: 1,
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
    participantCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderColor: colors.border,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    hostBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    hostBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
    },
    roleIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    participantInfo: {
      flex: 1,
    },
    participantName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flexDirection: 'row',
      alignItems: 'center',
    },
    participantRole: {
      fontSize: 14,
      color: colors.secondary,
      marginTop: 2,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.secondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    buttonContainer: {
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
      gap: 12,
    },
    startButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
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
    secondaryButton: {
      backgroundColor: 'transparent',
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      borderColor: colors.border,
      borderWidth: 1,
    },
    secondaryButtonText: {
      color: colors.text,
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

  const handleStartReading = async () => {
    if (participants.length < 2) {
      Alert.alert(
        'Not Enough Readers',
        'You need at least 2 people to start group reading. Share your session ID or QR code to invite others.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsStarting(true);
    
    try {
      onStartReading();
    } catch (error) {
      Alert.alert('Error', 'Failed to start reading session. Please try again.');
      console.error('Error starting reading:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndSession = () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end this group reading session? All participants will be disconnected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Session', 
          style: 'destructive',
          onPress: onEndSession
        }
      ]
    );
  };

  const handleHelpPress = () => {
    Alert.alert(
      'Group Reading Help',
      'You\'re hosting a group reading session. Others can join by:\n\n1. Finding your session on their home screen\n2. Scanning your QR code\n3. Entering your session ID\n\nOnce you have at least 2 people, you can start reading together!',
      [{ text: 'Got it!' }]
    );
  };

  const renderRoleIcons = () => {
    const roleIcons: React.ReactElement[] = [];
    
    // Use the same logic as readersByColor to create icons
    Object.entries(readersByColor).forEach(([color, positions]) => {
      positions.forEach((position) => {
        // Check if this role is taken by a participant
        const participantWithRole = participants.find(p => {
          const participantColor = getColorFromRole(p.role);
          // For now, assume position 0 since we don't track positions in participants yet
          return participantColor === color && position === 0;
        });
        
        const isActive = !!participantWithRole;
        const colorUtils = getColors(color);
        
        roleIcons.push(
          <View key={`${color}-${position}`} style={{ alignItems: 'center' }}>
            <MaterialIcons
              name={isActive ? "mark-chat-read" : "chat-bubble"}
              size={30}
              color={color === "black" ? "grey" : isActive ? colorUtils.dark : colorUtils.light}
            />
            {participantWithRole && (
              <Text style={{ 
                fontSize: 10, 
                color: colors.secondary, 
                marginTop: 4,
                textAlign: 'center',
                maxWidth: 60
              }} numberOfLines={1}>
                {participantWithRole.userName}
              </Text>
            )}
          </View>
        );
      });
    });
    
    return roleIcons;
  };

  const renderParticipants = () => {
    if (participants.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons 
            name="people-outline" 
            size={48} 
            color={colors.secondary} 
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>Waiting for readers...</Text>
          <Text style={styles.emptySubtitle}>
            Share your session ID or QR code with friends so they can join your reading group.
          </Text>
        </View>
      );
    }

    return participants.map((participant, index) => {
      const participantColor = getColorFromRole(participant.role);
      const colorUtils = getColors(participantColor);
      // For now, assume position 0 since we don't track positions in participants yet
      const roleDisplayName = getRoleDisplayName(participantColor, 0);
      
      return (
        <View key={participant.deviceId} style={styles.participantCard}>
          <View 
            style={[
              styles.roleIndicator,
              { backgroundColor: participantColor === "black" ? "grey" : colorUtils.light }
            ]}
          />
          <View style={styles.participantInfo}>
            <View style={styles.participantName}>
              <Text style={styles.participantName}>{participant.userName}</Text>
              {index === 0 && (
                <View style={styles.hostBadge}>
                  <Text style={styles.hostBadgeText}>HOST</Text>
                </View>
              )}
            </View>
            <Text style={styles.participantRole}>{roleDisplayName}</Text>
          </View>
        </View>
      );
    });
  };

  const canStartReading = participants.length >= 2 && !isStarting;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Reading</Text>
        <TouchableOpacity style={styles.helpButton} onPress={handleHelpPress}>
          <Ionicons name="help-circle-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusSection}>
          <View style={styles.statusIcon}>
            <Ionicons name="radio" size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>Broadcasting</Text>
          <Text style={styles.subtitle}>Others can now join</Text>
          <Text style={styles.storyName}>"{storyTitle}"</Text>
        </View>

        <View style={styles.sessionInfo}>
          <Text style={styles.sessionId}>Session ID: {sessionId}</Text>
          
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Story role distribution:</Text>
            <RoleProgressBar 
              colorData={storyColorData}
              height={6}
            />
            <Text style={styles.progressExplanation}>
              Shows the speaking parts in this story: Gray (Narrator), Red (God), Green (Main Character), Blue (Other Voices).
            </Text>
          </View>
        </View>

        {/* Role Icons Display */}
        <View style={styles.roleIconsContainer}>
          <Text style={styles.roleIconsTitle}>Reading roles for this story:</Text>
          <View style={styles.roleIconsRow}>
            {renderRoleIcons()}
          </View>
        </View>

        <View style={styles.participantsSection}>
          <Text style={styles.sectionTitle}>
            Readers ({participants.length} of 4)
          </Text>
          {renderParticipants()}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.startButton,
            !canStartReading && styles.startButtonDisabled,
          ]}
          onPress={handleStartReading}
          disabled={!canStartReading}
          activeOpacity={0.7}
        >
          {isStarting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.loadingText}>Starting...</Text>
            </View>
          ) : (
            <Text style={[
              styles.startButtonText,
              !canStartReading && styles.startButtonTextDisabled,
            ]}>
              Start Reading Together
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onShowQR}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Show QR Code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HostWaitingScreen; 