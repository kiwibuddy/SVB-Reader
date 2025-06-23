import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useGroupReading } from '@/context/GroupReadingContext';
import { Role, Participant } from '@/types';
import RoleProgressBar from '@/components/RoleProgressBar';

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
      marginBottom: 2,
    },
    participantRole: {
      fontSize: 14,
      color: colors.secondary,
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusText: {
      fontSize: 12,
      color: colors.secondary,
      marginLeft: 4,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyText: {
      fontSize: 16,
      color: colors.secondary,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.secondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    buttonContainer: {
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    startButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
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
      marginBottom: 8,
    },
    qrButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '500',
    },
    endButton2: {
      backgroundColor: 'transparent',
      paddingVertical: 12,
      alignItems: 'center',
    },
    endButtonText: {
      color: colors.secondary,
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
        'Need More Readers',
        'You need at least 2 readers to start a group reading session.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Start Reading',
      'Are you ready to start the group reading? All participants will be taken to the story.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start Reading',
          onPress: async () => {
            setIsStarting(true);
            try {
              await onStartReading();
            } finally {
              setIsStarting(false);
            }
          },
        },
      ]
    );
  };

  const handleEndSession = () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end this group reading session?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: onEndSession,
        },
      ]
    );
  };

  const handleHelpPress = () => {
    Alert.alert(
      'Group Reading Host',
      '• Others can join from their home screen\n• You need at least 2 readers to start\n• Each person reads their assigned role\n• Use the QR code if others can\'t find your session\n• Tap "Start Reading" when everyone is ready',
      [{ text: 'Got it!' }]
    );
  };

  const canStartReading = participants.length >= 2 && !isStarting;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Reading Host</Text>
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
          <Text style={styles.subtitle}>Waiting for others to join</Text>
          <Text style={styles.storyName}>"{storyTitle}"</Text>
        </View>

        <View style={styles.sessionInfo}>
          <Text style={styles.sessionId}>Session: {sessionId.slice(-8).toUpperCase()}</Text>
          
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

        <View style={styles.participantsSection}>
          <Text style={styles.sectionTitle}>
            Readers ({participants.length}/4)
          </Text>
          
          {participants.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Only you so far</Text>
              <Text style={styles.emptySubtext}>
                Others can join from their home screen by finding your session
              </Text>
            </View>
          ) : (
            participants.map((participant, index) => (
              <View key={participant.deviceId} style={styles.participantCard}>
                <View 
                  style={[
                    styles.roleIndicator,
                    { backgroundColor: ROLE_COLORS[participant.role] }
                  ]}
                />
                <View style={styles.participantInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.participantName}>
                      {participant.userName}
                    </Text>
                    {index === 0 && (
                      <View style={styles.hostBadge}>
                        <Text style={styles.hostBadgeText}>HOST</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.participantRole}>
                    {ROLE_LABELS[participant.role]}
                  </Text>
                </View>
                <View style={styles.statusIndicator}>
                  <Ionicons 
                    name={participant.isConnected ? "checkmark-circle" : "time-outline"} 
                    size={16} 
                    color={participant.isConnected ? colors.primary : colors.secondary} 
                  />
                  <Text style={styles.statusText}>
                    {participant.isConnected ? 'Ready' : 'Connecting...'}
                  </Text>
                </View>
              </View>
            ))
          )}
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
              Start Reading ({participants.length} readers)
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.qrButton} onPress={onShowQR}>
          <Text style={styles.qrButtonText}>Share QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.endButton2} onPress={handleEndSession}>
          <Text style={styles.endButtonText}>End Session</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HostWaitingScreen; 