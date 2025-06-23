import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useGroupReading } from '@/context/GroupReadingContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Role, SegmentType } from '@/types';
import RoleProgressBar from '@/components/RoleProgressBar';
import BibleData from "@/assets/data/newBibleNLT1.json";
import { splitIntoParagraphs } from "@/scripts/splitIntoParagraphs";
import { getColors } from "@/scripts/getColors";

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
const Bible: { [key: string]: SegmentType } = BibleData as { [key: string]: SegmentType };

const JoinGroupScreen: React.FC = () => {
  const { colors } = useAppSettings();
  const { joinSession, nearbyGroups } = useGroupReading();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const sessionId = params.sessionId as string;
  const session = nearbyGroups.find(s => s.id === sessionId);
  
  const [selectedReaderPosition, setSelectedReaderPosition] = useState<{
    color: string;
    position: number;
  } | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Get segment data and calculate memoized content (same as main Segment component)
  const segmentData = useMemo(() => {
    if (!session?.storyId) return null;
    return Bible[session.storyId];
  }, [session?.storyId]);

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
      paddingTop: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    closeButton: {
      padding: 8,
    },
    scrollContent: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 24,
    },
    sessionInfo: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderColor: colors.border,
      borderWidth: 1,
    },
    storyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    scriptureRef: {
      fontSize: 14,
      color: colors.secondary,
      textAlign: 'center',
      fontStyle: 'italic',
      marginBottom: 12,
    },
    hostInfo: {
      fontSize: 14,
      color: colors.secondary,
      textAlign: 'center',
      marginBottom: 4,
    },
    participantInfo: {
      fontSize: 14,
      color: colors.secondary,
      textAlign: 'center',
      marginBottom: 16,
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
    roleSelectionSection: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    roleCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderColor: colors.border,
      borderWidth: 1,
    },
    selectedRoleCard: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    unavailableRoleCard: {
      opacity: 0.5,
    },
    roleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    roleIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    roleName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    roleDescription: {
      fontSize: 14,
      color: colors.secondary,
      lineHeight: 20,
    },
    joinButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 24,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    joinButtonDisabled: {
      backgroundColor: colors.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    joinButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    errorText: {
      fontSize: 16,
      color: colors.secondary,
      textAlign: 'center',
      lineHeight: 24,
    },
  });

  // Get role assignments with availability checking
  const getAvailableRoleAssignments = (): Array<{ 
    color: string; 
    position: number; 
    label: string; 
    description: string; 
    isAvailable: boolean;
  }> => {
    if (!session) return [];
    
    const assignments: Array<{ 
      color: string; 
      position: number; 
      label: string; 
      description: string; 
      isAvailable: boolean;
    }> = [];
    
    // Get taken roles by converting participant roles to color/position
    const takenRoles = session.participants.map(p => {
      const color = getColorFromRole(p.role);
      // For now, assume position 0 since we don't track positions in participants yet
      return { color, position: 0 };
    });
    
    // Check each role slot for availability
    Object.entries(readersByColor).forEach(([color, positions]) => {
      positions.forEach((position) => {
        const isTaken = takenRoles.some(taken => 
          taken.color === color && taken.position === position
        );
        
        assignments.push({
          color,
          position,
          label: getRoleDisplayName(color, position),
          description: getRoleDescription(color),
          isAvailable: !isTaken,
        });
      });
    });
    
    return assignments;
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Session Not Found</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            The reading session you're looking for could not be found or is no longer available.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleJoin = async () => {
    if (!selectedReaderPosition) {
      Alert.alert('Select Role', 'Please select a reading role to join the group.');
      return;
    }

    setIsJoining(true);
    
    try {
      // Convert to legacy role format for compatibility
      const role = getRole(selectedReaderPosition.color, selectedReaderPosition.position);
      
      const success = await joinSession(sessionId, role, 'Reader'); // Default name for now
      
      if (success) {
        // Navigate to reading screen or waiting screen
        router.replace('/group-reading');
      } else {
        Alert.alert('Join Failed', 'Unable to join the reading group. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while joining the group.');
      console.error('Join error:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const renderRoleIcons = () => {
    const roleIcons: React.ReactElement[] = [];
    const availableAssignments = getAvailableRoleAssignments();
    
    // Use the same logic as readersByColor to create icons
    Object.entries(readersByColor).forEach(([color, positions]) => {
      positions.forEach((position) => {
        const assignment = availableAssignments.find(a => 
          a.color === color && a.position === position
        );
        
        const isSelected = selectedReaderPosition?.color === color && 
                          selectedReaderPosition?.position === position;
        const isAvailable = assignment?.isAvailable ?? false;
        const colorUtils = getColors(color);
        
        roleIcons.push(
          <TouchableOpacity
            key={`${color}-${position}`}
            onPress={() => {
              if (isAvailable) {
                setSelectedReaderPosition({ color, position });
              }
            }}
            disabled={!isAvailable}
            style={{ alignItems: 'center', opacity: isAvailable ? 1 : 0.3 }}
          >
            <MaterialIcons
              name={isSelected ? "mark-chat-read" : isAvailable ? "chat-bubble" : "chat-bubble-outline"}
              size={30}
              color={color === "black" ? "grey" : isSelected ? colorUtils.dark : colorUtils.light}
            />
            <Text style={{ 
              fontSize: 10, 
              color: colors.secondary, 
              marginTop: 4,
              textAlign: 'center',
              maxWidth: 60
            }} numberOfLines={1}>
              {isAvailable ? 'Available' : 'Taken'}
            </Text>
          </TouchableOpacity>
        );
      });
    });
    
    return roleIcons;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Join Reading Group</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sessionInfo}>
          <Text style={styles.storyTitle}>{session.storyTitle}</Text>
          {session.scriptureReference && (
            <Text style={styles.scriptureRef}>{session.scriptureReference}</Text>
          )}
          <Text style={styles.hostInfo}>
            Host: {session.hostUserName}'s {session.participants[0]?.deviceName || 'Device'}
          </Text>
          <Text style={styles.participantInfo}>
            Readers: {session.participants.length} of 4 joined
          </Text>
          
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Story role distribution:</Text>
            <RoleProgressBar 
              colorData={colorData}
              height={6}
            />
            <Text style={styles.progressExplanation}>
              Shows the speaking parts in this story: Gray (Narrator), Red (God), Green (Main Character), Blue (Other Voices). Choose an available role to join.
            </Text>
          </View>
        </View>

        {/* Role Icons Preview */}
        <View style={styles.roleIconsContainer}>
          <Text style={styles.roleIconsTitle}>Available reading roles:</Text>
          <View style={styles.roleIconsRow}>
            {renderRoleIcons()}
          </View>
        </View>

        <View style={styles.roleSelectionSection}>
          <Text style={styles.sectionTitle}>Choose Your Role</Text>
          
          {getAvailableRoleAssignments().length === 0 ? (
            <View style={[styles.roleCard, { opacity: 0.6 }]}>
              <Text style={[styles.roleName, { textAlign: 'center' }]}>
                No available roles
              </Text>
              <Text style={[styles.roleDescription, { textAlign: 'center' }]}>
                All roles for this story have been taken by other readers.
              </Text>
            </View>
          ) : (
            getAvailableRoleAssignments().map((roleAssignment, index) => {
              const isSelected = selectedReaderPosition?.color === roleAssignment.color && 
                               selectedReaderPosition?.position === roleAssignment.position;
              const colorUtils = getColors(roleAssignment.color);
              
              return (
                <TouchableOpacity
                  key={`${roleAssignment.color}-${roleAssignment.position}`}
                  style={[
                    styles.roleCard,
                    isSelected && styles.selectedRoleCard,
                    !roleAssignment.isAvailable && styles.unavailableRoleCard,
                  ]}
                  onPress={() => {
                    if (roleAssignment.isAvailable) {
                      setSelectedReaderPosition({ 
                        color: roleAssignment.color, 
                        position: roleAssignment.position 
                      });
                    }
                  }}
                  disabled={!roleAssignment.isAvailable}
                  activeOpacity={0.7}
                >
                  <View style={styles.roleHeader}>
                    <View 
                      style={[
                        styles.roleIndicator,
                        { backgroundColor: roleAssignment.color === "black" ? "grey" : colorUtils.light }
                      ]}
                    />
                    <Text style={styles.roleName}>
                      {roleAssignment.label} {roleAssignment.isAvailable ? '' : '(Taken)'}
                    </Text>
                  </View>
                  <Text style={styles.roleDescription}>
                    {roleAssignment.description}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.joinButton,
            (!selectedReaderPosition || isJoining) && styles.joinButtonDisabled
          ]}
          onPress={handleJoin}
          disabled={!selectedReaderPosition || isJoining}
          activeOpacity={0.8}
        >
          <Text style={styles.joinButtonText}>
            {isJoining ? 'Joining...' : 'Join Group'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default JoinGroupScreen;