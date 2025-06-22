import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';
import { GroupSession, Participant, Role } from '@/types';

interface BroadcastingScreenProps {
  session: GroupSession;
  onBack: () => void;
  onShowQR: () => void;
  onStopBroadcasting: () => void;
  onStartReading: () => void;
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

const BroadcastingScreen: React.FC<BroadcastingScreenProps> = ({
  session,
  onBack,
  onShowQR,
  onStopBroadcasting,
  onStartReading,
}) => {
  const { colors } = useAppSettings();
  const [pulseAnim] = useState(new Animated.Value(1));

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
    broadcastIcon: {
      backgroundColor: colors.primary,
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
      marginBottom: 32,
    },
    sessionDetails: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
      borderColor: colors.border,
      borderWidth: 1,
    },
    sessionHeader: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    sessionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sessionLabel: {
      fontSize: 14,
      color: colors.secondary,
      fontWeight: '500',
    },
    sessionValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
    },
    broadcastingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    broadcastingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#34C759',
      marginRight: 8,
    },
    broadcastingText: {
      fontSize: 14,
      color: '#34C759',
      fontWeight: '600',
    },
    participantsSection: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 32,
      borderColor: colors.border,
      borderWidth: 1,
      flex: 1,
    },
    participantsHeader: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    participantsList: {
      flex: 1,
    },
    participantItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    lastParticipantItem: {
      borderBottomWidth: 0,
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
      marginBottom: 2,
    },
    participantRole: {
      fontSize: 14,
      color: colors.secondary,
    },
    connectionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIcon: {
      marginRight: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    connectedText: {
      color: '#34C759',
    },
    waitingText: {
      color: colors.secondary,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.secondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    buttonContainer: {
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    qrButton: {
      backgroundColor: 'transparent',
      paddingVertical: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    qrButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '500',
    },
    startReadingButton: {
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
    startReadingButtonDisabled: {
      backgroundColor: colors.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    startReadingButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    startReadingButtonTextDisabled: {
      color: colors.secondary,
    },
    stopButton: {
      backgroundColor: 'transparent',
      paddingVertical: 12,
      alignItems: 'center',
      borderColor: '#FF3B30',
      borderWidth: 1,
      borderRadius: 8,
    },
    stopButtonText: {
      color: '#FF3B30',
      fontSize: 16,
      fontWeight: '500',
    },
  });

  useEffect(() => {
    // Pulse animation for broadcasting indicator
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const renderPhoneIcons = () => {
    const connectedCount = session.participants.length;
    
    return (
      <View style={styles.iconRow}>
        {[1, 2, 3, 4].map((index) => (
          <Animated.View 
            key={index} 
            style={[
              styles.phoneIcon,
              index === 1 && styles.broadcastIcon,
              index === 1 && { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Ionicons 
              name={index === 1 ? "radio" : "phone-portrait-outline"} 
              size={24} 
              color={index === 1 ? '#FFFFFF' : colors.primary}
            />
          </Animated.View>
        ))}
      </View>
    );
  };

  const renderParticipants = () => {
    const joinedParticipants = session.participants.filter(p => p.isConnected);
    
    if (joinedParticipants.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Waiting for readers to join...{'\n'}
            They can find your session on their home screen
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.participantsList} showsVerticalScrollIndicator={false}>
        {joinedParticipants.map((participant, index) => (
          <View 
            key={participant.deviceId}
            style={[
              styles.participantItem,
              index === joinedParticipants.length - 1 && styles.lastParticipantItem,
            ]}
          >
            <View 
              style={[
                styles.roleIndicator, 
                { backgroundColor: ROLE_COLORS[participant.role] }
              ]} 
            />
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>{participant.userName}</Text>
              <Text style={styles.participantRole}>
                {ROLE_LABELS[participant.role]}
              </Text>
            </View>
            <View style={styles.connectionStatus}>
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color="#34C759" 
                style={styles.statusIcon}
              />
              <Text style={[styles.statusText, styles.connectedText]}>
                Joined
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const canStartReading = session.participants.length >= 2; // At least 2 people
  const allReady = session.participants.every(p => p.isReady);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Broadcasting</Text>
        <TouchableOpacity style={styles.helpButton} onPress={() => {}}>
          <Ionicons name="help-circle-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {renderPhoneIcons()}
        
        <View style={styles.iconContainer}>
          <Text style={styles.title}>Looking for readers...</Text>
          <Text style={styles.subtitle}>
            Others can now join from their{'\n'}SourceView app home screen
          </Text>
        </View>

        <View style={styles.sessionDetails}>
          <Text style={styles.sessionHeader}>Session Details</Text>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>Story:</Text>
            <Text style={styles.sessionValue}>{session.storyTitle}</Text>
          </View>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>Your Role:</Text>
            <Text style={styles.sessionValue}>
              {ROLE_LABELS[session.participants[0]?.role || 'narrator']}
            </Text>
          </View>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>Readers:</Text>
            <Text style={styles.sessionValue}>
              {session.participants.length} of 4
            </Text>
          </View>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>Status:</Text>
            <View style={styles.broadcastingIndicator}>
              <Animated.View 
                style={[
                  styles.broadcastingDot,
                  { transform: [{ scale: pulseAnim }] }
                ]} 
              />
              <Text style={styles.broadcastingText}>Broadcasting...</Text>
            </View>
          </View>
        </View>

        <View style={styles.participantsSection}>
          <Text style={styles.participantsHeader}>Joined Readers</Text>
          {renderParticipants()}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.qrButton} onPress={onShowQR}>
          <Text style={styles.qrButtonText}>QR Code Backup</Text>
        </TouchableOpacity>

        {canStartReading && (
          <TouchableOpacity
            style={styles.startReadingButton}
            onPress={onStartReading}
            activeOpacity={0.7}
          >
            <Text style={styles.startReadingButtonText}>
              Start Reading with {session.participants.length} readers
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.stopButton} onPress={onStopBroadcasting}>
          <Text style={styles.stopButtonText}>Stop Broadcasting</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BroadcastingScreen;