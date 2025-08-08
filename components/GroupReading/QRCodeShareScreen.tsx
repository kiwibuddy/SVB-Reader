import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';
import QRCode from 'react-native-qrcode-svg';
import { qrCodeDiscoveryManager } from '@/services/QRCodeDiscoveryManager';

interface QRCodeShareScreenProps {
  sessionId: string;
  storyTitle: string;
  hostUserName: string;
  hostRole?: string;
  qrCodeData?: string; // New prop for actual QR code data
  onClose: () => void;
  onStartStory?: () => void;
}

const QRCodeShareScreen: React.FC<QRCodeShareScreenProps> = ({
  sessionId,
  storyTitle,
  hostUserName,
  hostRole,
  qrCodeData,
  onClose,
  onStartStory,
}) => {
  const { colors } = useAppSettings();

  // Use the provided QR code data or fall back to legacy format
  const qrData = qrCodeData || JSON.stringify({
    type: 'bible_group_reading',
    sessionId,
    storyTitle,
    hostUserName,
    timestamp: Date.now(),
  });

  // Create a shareable text message
  const shareMessage = `Join my Bible reading group for "${storyTitle}"!\n\nSession ID: ${sessionId.slice(-8).toUpperCase()}\nHost: ${hostUserName}\n\nScan the QR code or enter the session ID in your SVB Youth app.`;

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
    closeButton: {
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
    shareButton: {
      padding: 8,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: 24,
      paddingTop: 24,
      alignItems: 'center',
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
      marginBottom: 32,
    },
    qrContainer: {
      backgroundColor: '#FFFFFF',
      padding: 24,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      marginBottom: 24,
    },
    qrTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333333',
      marginBottom: 16,
      textAlign: 'center',
    },
    sessionInfo: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      width: '100%',
      marginBottom: 16,
      borderColor: colors.border,
      borderWidth: 1,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.secondary,
      fontWeight: '500',
    },
    infoValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    instructionsCard: {
      backgroundColor: colors.primary + '10',
      borderRadius: 12,
      padding: 16,
      width: '100%',
      marginBottom: 20,
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
    buttonContainer: {
      width: '100%',
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
      paddingHorizontal: 24,
      paddingTop: 16,
      backgroundColor: colors.background,
    },
    shareButtonLarge: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    startButtonLarge: {
      backgroundColor: '#42A5F5',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      shadowColor: '#42A5F5',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    shareButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    closeButtonLarge: {
      backgroundColor: 'transparent',
      paddingVertical: 12,
      alignItems: 'center',
    },
    closeButtonText: {
      color: colors.secondary,
      fontSize: 16,
      fontWeight: '500',
    },
  });

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: shareMessage,
        title: 'Join Bible Reading Group',
      });
      
      // Share action completed
    } catch (error) {
      Alert.alert('Error', 'Unable to share session information.');
      console.error('Share error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Session</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Invite Others</Text>
        <Text style={styles.subtitle}>
          Share this QR code for others to join your reading group
        </Text>

        <View style={styles.qrContainer}>
          <Text style={styles.qrTitle}>Scan to Join</Text>
          <QRCode
            value={qrData}
            size={180}
            color="#333333"
            backgroundColor="#FFFFFF"
          />
        </View>

        <View style={styles.sessionInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Session ID:</Text>
            <Text style={styles.infoValue}>{sessionId.slice(-8).toUpperCase()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Story:</Text>
            <Text style={[styles.infoValue, { fontFamily: 'System' }]}>{storyTitle}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Host:</Text>
            <Text style={[styles.infoValue, { fontFamily: 'System' }]}>{hostUserName}</Text>
          </View>
          {hostRole && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Your role:</Text>
              <Text style={[styles.infoValue, { fontFamily: 'System' }]}>{hostRole === 'narrator' ? 'Narrator' : hostRole === 'god' ? 'God' : hostRole === 'main_character' ? 'Main Character' : 'Other Voices'}</Text>
            </View>
          )}
          {qrCodeData && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={[styles.infoValue, { color: '#4CAF50', fontWeight: '600' }]}>Active</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Expires:</Text>
                <Text style={[styles.infoValue, { fontSize: 12 }]}>30 minutes</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.instructionsCard}>
          <View style={styles.instructionsTitle}>
            <Ionicons name="information-circle" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>How to Join</Text>
          </View>
          <Text style={styles.instructionsText}>
            Others can join by:{'\n'}
            • Scanning this QR code with their camera{'\n'}
            • Opening SourceView Together and scanning the QR code{'\n'}
            • The QR code contains all session information automatically
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        {onStartStory && (
          <TouchableOpacity
            style={styles.startButtonLarge}
            onPress={onStartStory}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Start Story</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.closeButtonLarge}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={styles.closeButtonText}>Back to Session</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default QRCodeShareScreen; 