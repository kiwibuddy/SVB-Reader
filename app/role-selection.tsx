import React, { useState, useEffect } from 'react';
import logger from '@/utils/logger';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGroupReading } from '@/context/GroupReadingContext';
import { qrCodeDiscoveryManager } from '@/services/QRCodeDiscoveryManager';
import { Role } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';

export default function RoleSelectionScreen() {
  const { colors } = useSyncAppSettings();
  const { t } = useTranslation();
  const router = useRouter();
  const { joinSessionFromQR } = useGroupReading();
  
  const params = useLocalSearchParams();
  const {
    qrCodeData,
    sessionId,
    storyId,
    storyTitle,
    scriptureReference,
    hostUserName,
    hostRole
  } = params;

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [userName, setUserName] = useState('');
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    if (qrCodeData) {
      // Parse session data
      const session = qrCodeDiscoveryManager.parseSessionFromQRCode(qrCodeData as string);
      if (session) {
        setSessionData(session);
        // Get host role from the parsed session data (more reliable than params)
        const sessionHostRole = session.participants[0]?.role;
        if (sessionHostRole) {
          // Calculate available roles based on session host role
          const roles = qrCodeDiscoveryManager.getAvailableRoles(sessionHostRole);
          setAvailableRoles(roles);
          logger.info('📱 Available roles for joining:', roles);
          logger.info('📱 Host role from session:', sessionHostRole);
        } else {
          logger.error('🔴 No host role found in session data');
        }
      }
    }
  }, [qrCodeData]);

  const handleRoleSelection = (role: Role) => {
    setSelectedRole(role);
  };

  const handleJoinSession = async () => {
    if (!selectedRole || !userName.trim()) {
      Alert.alert('Missing Information', 'Please select a role and enter your name.');
      return;
    }

    if (!qrCodeData) {
      Alert.alert('Error', 'No QR code data available.');
      return;
    }

    setIsLoading(true);
    try {
      logger.info('🔗 Joining session with role:', selectedRole);
      logger.info('🔗 User name:', userName);
      
      const success = await joinSessionFromQR(qrCodeData as string, selectedRole, userName.trim());
      
      if (success) {
        logger.info('✅ Successfully joined session');
        // Navigate to the story with the selected role
        router.push({
          pathname: '/[segment]',
          params: { segment: storyId as string, showCourtesy: '1' }
        });
      } else {
        Alert.alert('Error', 'Failed to join session. Please try again.');
      }
    } catch (error) {
      logger.error('🔴 Error joining session:', error);
      Alert.alert('Error', 'Failed to join session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDisplayName = (role: Role): string => {
    switch (role) {
      case 'narrator': return 'Narrator';
      case 'god': return 'God';
      case 'main_character': return 'Main Character';
      case 'other_voices': return 'Other Voices';
      default: return role;
    }
  };

  const getRoleColor = (role: Role): string => {
    // Align to app-wide role colors used in group-reading UI
    switch (role) {
      case 'narrator': return '#8E8E93'; // gray (black bubbles)
      case 'god': return '#FF3B30'; // red
      case 'main_character': return '#30D158'; // green
      case 'other_voices': return '#007AFF'; // blue
      default: return '#9B9B9B'; // fallback gray
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 20 + 24, // add space under notch
      paddingHorizontal: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 30,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 10,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    storyInfo: {
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 10,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    storyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 5,
    },
    storyReference: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.8,
      marginBottom: 5,
    },
    hostInfo: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.6,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 15,
    },
    roleGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    roleCard: {
      width: '48%',
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    roleCardSelected: {
      borderColor: '#007AFF',
      backgroundColor: colors.card,
    },
    roleCardDisabled: {
      opacity: 0.5,
      backgroundColor: colors.card,
    },
    roleName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 5,
    },
    roleDescription: {
      fontSize: 12,
      color: colors.text,
      opacity: 0.7,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 10,
    },
    textInput: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
    },
    joinButton: {
      backgroundColor: '#42A5F5',
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 10,
    },
    joinButtonDisabled: {
      backgroundColor: '#9B9B9B',
    },
    joinButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 10,
    },
    cancelButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.border,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      marginTop: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButtonText: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600',
    },
  });

  if (!sessionData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Loading Session...</Text>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Join Group Reading</Text>
        <Text style={styles.subtitle}>Select your reading role</Text>
      </View>

      <View style={styles.storyInfo}>
        <Text style={styles.storyTitle}>{storyTitle}</Text>
        <Text style={styles.storyReference}>{scriptureReference}</Text>
        <Text style={styles.hostInfo}>Host: {hostUserName}</Text>
      </View>

      <Text style={styles.sectionTitle}>Available Roles</Text>
      <View style={styles.roleGrid}>
        {availableRoles.map((role) => (
          <TouchableOpacity
            key={role}
            style={[
              styles.roleCard,
              selectedRole === role && styles.roleCardSelected,
            ]}
            onPress={() => handleRoleSelection(role)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: getRoleColor(role),
                  marginRight: 8,
                }}
              />
              <Text style={styles.roleName}>{getRoleDisplayName(role)}</Text>
            </View>
            <Text style={styles.roleDescription}>
              {role === 'narrator' && 'Reads the narrative portions'}
              {role === 'god' && 'Reads God\'s dialogue'}
              {role === 'main_character' && 'Reads main character dialogue'}
              {role === 'other_voices' && 'Reads other character dialogue'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Your Name</Text>
        <TextInput
          style={styles.textInput}
          value={userName}
          onChangeText={setUserName}
          placeholder={t('UI.groupReading.enterYourName')}
          placeholderTextColor={colors.text + '80'}
          maxLength={20}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.joinButton,
          (!selectedRole || !userName.trim() || isLoading) && styles.joinButtonDisabled,
        ]}
        onPress={handleJoinSession}
        disabled={!selectedRole || !userName.trim() || isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="white" />
            <Text style={styles.loadingText}>Joining...</Text>
          </View>
        ) : (
          <Text style={styles.joinButtonText}>Join Story</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
