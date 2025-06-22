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
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useGroupReading } from '@/context/GroupReadingContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Role, SegmentType } from '@/types';
import RoleProgressBar from '@/components/RoleProgressBar';
import BibleData from "@/assets/data/newBibleNLT1.json";

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
  
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Calculate story color data from the actual story sources
  const storyColorData = useMemo(() => {
    if (!session?.storyId) {
      return { total: 0, black: 0, red: 0, green: 0, blue: 0 };
    }

    const segmentData = Bible[session.storyId];
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
  }, [session?.storyId]);

  // Get role assignments with numbering for multiple instances
  const getRoleAssignments = (): Array<{ role: Role; label: string; description: string }> => {
    const takenRoles = session?.participants.map(p => p.role) || [];
    const assignments: Array<{ role: Role; label: string; description: string }> = [];
    
    // Check each role type and add available instances
    const roleTypes = [
      { role: 'narrator' as Role, color: 'black', count: storyColorData.black },
      { role: 'god' as Role, color: 'red', count: storyColorData.red },
      { role: 'main_character' as Role, color: 'green', count: storyColorData.green },
      { role: 'other_voices' as Role, color: 'blue', count: storyColorData.blue },
    ];
    
    roleTypes.forEach(({ role, count }) => {
      if (count > 0) {
        const takenCount = takenRoles.filter(r => r === role).length;
        const availableCount = count - takenCount;
        
        // Only add if there are available slots
        if (availableCount > 0) {
          let label = ROLE_LABELS[role];
          let description = ROLE_DESCRIPTIONS[role];
          
          // Add numbering if multiple instances exist
          if (count > 1) {
            const nextNumber = takenCount + 1;
            label = `${ROLE_LABELS[role]} ${nextNumber}`;
            description = `${ROLE_DESCRIPTIONS[role]} (${availableCount} of ${count} available)`;
          } else if (availableCount < count) {
            // Single instance but some taken
            description = `${ROLE_DESCRIPTIONS[role]} (available)`;
          }
          
          assignments.push({ role, label, description });
        }
      }
    });
    
    return assignments;
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
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    sessionInfo: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    storyTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    scriptureRef: {
      fontSize: 14,
      color: colors.secondary,
      fontStyle: 'italic',
      marginBottom: 12,
    },
    hostInfo: {
      fontSize: 14,
      color: colors.secondary,
      marginBottom: 4,
    },
    participantInfo: {
      fontSize: 14,
      color: colors.secondary,
      marginBottom: 16,
    },
    progressSection: {
      marginBottom: 20,
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
    instructionsCard: {
      backgroundColor: colors.primary + '10',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    instructionsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    instructionsText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 16,
    },
    rolesList: {
      marginBottom: 32,
    },
    roleCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: colors.border,
    },
    selectedRoleCard: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
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
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 12,
    },
    joinButtonDisabled: {
      backgroundColor: colors.secondary,
      opacity: 0.6,
    },
    joinButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: colors.secondary,
      fontSize: 16,
      fontWeight: '500',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 18,
      marginBottom: 20,
      textAlign: 'center',
    },
    backButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    backButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Session not found
          </Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }



  const handleJoin = async () => {
    if (!selectedRole) {
      Alert.alert('Select a Role', 'Please choose a reading role before joining.');
      return;
    }

    setIsJoining(true);
    try {
      // For now, use a default username - in real implementation this would come from user settings
      const userName = 'Guest User';
      await joinSession(sessionId, selectedRole, userName);
      // Navigate to the reading screen or broadcasting screen
      router.replace({
        pathname: '/(tabs)/[segment]' as any,
        params: {
          segment: `en-NLT-${session.storyId}`,
          groupSession: 'true'
        }
      });
    } catch (error) {
      Alert.alert('Join Failed', 'Could not join the reading group. Please try again.');
      console.error('Join session error:', error);
    } finally {
      setIsJoining(false);
    }
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
              colorData={storyColorData}
              height={6}
            />
            <Text style={styles.progressExplanation}>
              Shows the speaking parts in this story: Gray (Narrator), Red (God), Green (Main Character), Blue (Other Voices). Choose an available role to join.
            </Text>
          </View>
        </View>

        <View style={styles.instructionsCard}>
          <View style={styles.instructionsTitle}>
            <Ionicons name="information-circle" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>How Group Reading Works</Text>
          </View>
          <Text style={styles.instructionsText}>
            • Select a reading role that matches your preference{'\n'}
            • Each role has different parts to read during the story{'\n'}
            • You'll be synchronized with other readers{'\n'}
            • Tap your role's text when it's your turn to read
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Choose your reading role:</Text>
        
        <View style={styles.rolesList}>
          {getRoleAssignments().length === 0 ? (
            <View style={[styles.roleCard, { opacity: 0.6 }]}>
              <Text style={[styles.roleName, { textAlign: 'center' }]}>
                No available roles
              </Text>
              <Text style={[styles.roleDescription, { textAlign: 'center' }]}>
                All roles for this story have been taken by other readers.
              </Text>
            </View>
          ) : (
            getRoleAssignments().map((roleAssignment, index) => (
            <TouchableOpacity
              key={`${roleAssignment.role}-${index}`}
              style={[
                styles.roleCard,
                selectedRole === roleAssignment.role && styles.selectedRoleCard
              ]}
              onPress={() => setSelectedRole(roleAssignment.role)}
              activeOpacity={0.7}
            >
              <View style={styles.roleHeader}>
                <View 
                  style={[
                    styles.roleIndicator,
                    { backgroundColor: ROLE_COLORS[roleAssignment.role] }
                  ]}
                />
                <Text style={styles.roleName}>{roleAssignment.label}</Text>
              </View>
              <Text style={styles.roleDescription}>
                {roleAssignment.description}
              </Text>
            </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.joinButton,
            (!selectedRole || isJoining) && styles.joinButtonDisabled
          ]}
          onPress={handleJoin}
          disabled={!selectedRole || isJoining}
          activeOpacity={0.8}
        >
          <Text style={styles.joinButtonText}>
            {isJoining ? 'Joining...' : 'Join Group'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default JoinGroupScreen;