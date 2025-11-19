/**
 * Analytics Settings Component
 * 
 * Provides a toggle to enable/disable anonymous analytics tracking.
 * Can be embedded in Settings or About screens.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analytics } from '@/services/analytics';
import logger from '@/utils/logger';

interface AnalyticsSettingsProps {
  colors?: {
    text: string;
    secondary: string;
    background: string;
    card: string;
    border: string;
    primary: string;
  };
  isDarkMode?: boolean;
}

export default function AnalyticsSettings({ colors, isDarkMode }: AnalyticsSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Default colors if not provided
  const defaultColors = {
    text: isDarkMode ? '#FFFFFF' : '#000000',
    secondary: isDarkMode ? '#A0A0A0' : '#666666',
    background: isDarkMode ? '#1C1C1E' : '#FFFFFF',
    card: isDarkMode ? '#2C2C2E' : '#F5F5F5',
    border: isDarkMode ? '#3A3A3C' : '#E0E0E0',
    primary: '#4A90E2',
  };

  const finalColors = colors || defaultColors;

  useEffect(() => {
    loadAnalyticsStatus();
  }, []);

  const loadAnalyticsStatus = async () => {
    try {
      const enabled = analytics.isAnalyticsEnabled();
      setIsEnabled(enabled);
    } catch (error) {
      logger.error('Failed to load analytics status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    if (value) {
      // Show confirmation before enabling
      Alert.alert(
        '📊 Enable Analytics',
        'Allow anonymous usage data to help improve the app?\n\n' +
        '✅ No personal information collected\n' +
        '✅ Only feature usage and app performance\n' +
        '✅ You can disable anytime',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Learn More',
            onPress: () => {
              Linking.openURL('https://raw.githubusercontent.com/kiwibuddy/sourceview-together/main/PRIVACY_POLICY.md');
            },
          },
          {
            text: 'Enable',
            onPress: async () => {
              try {
                await analytics.enable();
                setIsEnabled(true);
                logger.info('Analytics enabled by user');
              } catch (error) {
                logger.error('Failed to enable analytics:', error);
                Alert.alert('Error', 'Failed to enable analytics. Please try again.');
              }
            },
          },
        ]
      );
    } else {
      // Disable immediately
      try {
        await analytics.disable();
        setIsEnabled(false);
        logger.info('Analytics disabled by user');
      } catch (error) {
        logger.error('Failed to disable analytics:', error);
        Alert.alert('Error', 'Failed to disable analytics. Please try again.');
      }
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://raw.githubusercontent.com/kiwibuddy/sourceview-together/main/PRIVACY_POLICY.md');
  };

  return (
    <View style={[styles.container, { backgroundColor: finalColors.card, borderColor: finalColors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="analytics-outline" size={24} color={finalColors.primary} />
          <Text style={[styles.title, { color: finalColors.text }]}>
            Anonymous Analytics
          </Text>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={handleToggle}
          disabled={isLoading}
          trackColor={{ false: '#767577', true: finalColors.primary }}
          thumbColor={isEnabled ? '#FFFFFF' : '#f4f3f4'}
        />
      </View>

      {/* Description */}
      <Text style={[styles.description, { color: finalColors.secondary }]}>
        Help improve the app by sharing anonymous usage data. No personal information is collected.
      </Text>

      {/* Info Points */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={[styles.infoText, { color: finalColors.secondary }]}>
            Feature usage and app performance
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={[styles.infoText, { color: finalColors.secondary }]}>
            Helps identify bugs and improve features
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="close-circle" size={16} color="#F44336" />
          <Text style={[styles.infoText, { color: finalColors.secondary }]}>
            No personal data or reading content
          </Text>
        </View>
      </View>

      {/* Privacy Policy Link */}
      <TouchableOpacity style={styles.privacyLink} onPress={openPrivacyPolicy}>
        <Text style={[styles.privacyLinkText, { color: finalColors.primary }]}>
          Read Our Privacy Policy
        </Text>
        <Ionicons name="open-outline" size={14} color={finalColors.primary} />
      </TouchableOpacity>

      {/* Status Indicator */}
      {isEnabled && (
        <View style={[styles.statusBadge, { backgroundColor: `${finalColors.primary}20` }]}>
          <Ionicons name="shield-checkmark" size={14} color={finalColors.primary} />
          <Text style={[styles.statusText, { color: finalColors.primary }]}>
            Analytics Active
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoSection: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  privacyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  privacyLinkText: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

