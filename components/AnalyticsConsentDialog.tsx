/**
 * Analytics Consent Dialog
 * 
 * Shows a user-friendly dialog asking for consent to collect anonymous analytics.
 * Displayed once on first app launch after analytics is added.
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analytics } from '@/services/analytics';
import logger from '@/utils/logger';

export default function AnalyticsConsentDialog() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    checkIfShouldShow();
  }, []);

  const checkIfShouldShow = async () => {
    try {
      const hasAsked = await analytics.hasAskedForConsent();
      if (!hasAsked) {
        // Small delay to let app settle before showing dialog
        setTimeout(() => setVisible(true), 1000);
      }
    } catch (error) {
      logger.error('Failed to check consent status:', error);
    }
  };

  const handleAccept = async () => {
    try {
      await analytics.enable();
      await analytics.markConsentAsked();
      setVisible(false);
      logger.info('User accepted analytics');
    } catch (error) {
      logger.error('Failed to accept analytics:', error);
    }
  };

  const handleDecline = async () => {
    try {
      await analytics.disable();
      await analytics.markConsentAsked();
      setVisible(false);
      logger.info('User declined analytics');
    } catch (error) {
      logger.error('Failed to decline analytics:', error);
    }
  };

  const openPrivacyPolicy = () => {
    const privacyUrl = 'https://sourceviewreader.web.app/SVTogetherPP/';
    Linking.openURL(privacyUrl);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="heart-outline" size={56} color="#FF6B6B" />
            </View>

            {/* Title */}
            <Text style={styles.title}>Help Us Improve!</Text>

            {/* Simple Description */}
            <Text style={styles.description}>
              We'd love to know which features you use most so we can make the app even better. 
            </Text>

            {/* Key Points - Simplified */}
            <View style={styles.keyPoints}>
              <View style={styles.keyPoint}>
                <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                <Text style={styles.keyPointText}>Anonymous usage data only</Text>
              </View>
              <View style={styles.keyPoint}>
                <Ionicons name="shield-checkmark" size={22} color="#4A90E2" />
                <Text style={styles.keyPointText}>No personal info collected</Text>
              </View>
              <View style={styles.keyPoint}>
                <Ionicons name="settings-outline" size={22} color="#9C27B0" />
                <Text style={styles.keyPointText}>Change anytime in Settings</Text>
              </View>
            </View>

            {/* Friendly Note */}
            <Text style={styles.friendlyNote}>
              Your reading progress, notes, and emojis always stay private on your device. 🔒
            </Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.declineButton]}
                onPress={handleDecline}
                activeOpacity={0.7}
              >
                <Text style={styles.declineButtonText}>Not Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={handleAccept}
                activeOpacity={0.7}
              >
                <Ionicons name="heart" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.acceptButtonText}>Sure!</Text>
              </TouchableOpacity>
            </View>

            {/* Learn More Link */}
            <TouchableOpacity onPress={openPrivacyPolicy} style={styles.learnMoreLink}>
              <Text style={styles.learnMoreText}>Learn more about what we collect</Text>
              <Ionicons name="chevron-forward" size={14} color="#4A90E2" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    maxWidth: 400,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  keyPoints: {
    width: '100%',
    marginBottom: 20,
  },
  keyPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  keyPointText: {
    fontSize: 15,
    color: '#555',
    marginLeft: 12,
    fontWeight: '500',
  },
  friendlyNote: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 28,
    paddingHorizontal: 12,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  declineButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  acceptButton: {
    backgroundColor: '#FF6B6B',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  learnMoreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 12,
  },
  learnMoreText: {
    fontSize: 13,
    color: '#4A90E2',
  },
});

