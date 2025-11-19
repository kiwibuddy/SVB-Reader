import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics } from '@/services/analytics';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsDebug() {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [consent, setConsent] = useState<boolean | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    const info: string[] = [];
    
    // Check consent
    const consentValue = await AsyncStorage.getItem('analytics_consent');
    const consentAsked = await AsyncStorage.getItem('analytics_consent_asked');
    setConsent(consentValue === 'true');
    
    info.push(`✅ App Version: ${Constants.expoConfig?.version}`);
    info.push(`✅ Runtime Version: ${Constants.expoConfig?.runtimeVersion}`);
    info.push(`📊 Consent Given: ${consentValue === 'true' ? 'YES ✅' : 'NO ❌'}`);
    info.push(`📊 Consent Asked: ${consentAsked === 'true' ? 'YES' : 'NO'}`);
    info.push(`📊 Analytics Enabled: ${analytics.isAnalyticsEnabled() ? 'YES ✅' : 'NO ❌'}`);
    info.push(`📊 PostHog Initialized: ${(analytics as any).isInitialized ? 'YES ✅' : 'NO ❌'}`);
    info.push(`📊 PostHog Instance: ${(analytics as any).posthog ? 'EXISTS ✅' : 'NULL ❌'}`);
    info.push(`🔑 API Key: phc_AgWByS9hf...HYZUV`);
    info.push(`🌐 Host: https://us.i.posthog.com`);
    info.push(`📱 Platform: ${Constants.platform?.ios ? 'iOS' : 'Android'}`);
    
    setDebugInfo(info);
  };

  const testEvent = async () => {
    const newInfo = [...debugInfo];
    newInfo.push(`\n🧪 Testing event...`);
    setDebugInfo(newInfo);
    
    // Check if analytics is enabled before sending
    if (!analytics.isAnalyticsEnabled()) {
      newInfo.push(`❌ Analytics is DISABLED - event will NOT be sent`);
      newInfo.push(`⚠️ Tap "Enable Analytics" button first!`);
      setDebugInfo(newInfo);
      return;
    }
    
    try {
      await analytics.trackEvent('debug_test_event', {
        timestamp: new Date().toISOString(),
        source: 'debug_screen',
      });
      newInfo.push(`✅ Event sent: debug_test_event`);
      newInfo.push(`⏰ Time: ${new Date().toLocaleTimeString()}`);
      newInfo.push(`📤 Should appear in PostHog within seconds!`);
    } catch (error) {
      newInfo.push(`❌ Error: ${error}`);
    }
    
    setDebugInfo(newInfo);
  };

  const enableAnalytics = async () => {
    const newInfo = [...debugInfo];
    newInfo.push(`\n🔄 Enabling analytics...`);
    setDebugInfo(newInfo);
    
    try {
      // Force initialize if not already done
      if (!(analytics as any).isInitialized) {
        newInfo.push(`⚠️ Analytics not initialized, initializing now...`);
        await analytics.initialize();
      }
      
      await analytics.enable();
      
      // Wait a bit for AsyncStorage to save
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload debug info
      await loadDebugInfo();
      
      // Check if it actually worked
      const consentValue = await AsyncStorage.getItem('analytics_consent');
      if (consentValue === 'true' && analytics.isAnalyticsEnabled()) {
        newInfo.push(`✅ Analytics enabled successfully!`);
        newInfo.push(`📤 You can now send test events!`);
      } else {
        newInfo.push(`❌ Analytics enable failed!`);
        newInfo.push(`   Consent in storage: ${consentValue}`);
        newInfo.push(`   isEnabled: ${analytics.isAnalyticsEnabled()}`);
      }
    } catch (error) {
      newInfo.push(`❌ Error enabling: ${error}`);
    }
    
    setDebugInfo(newInfo);
  };

  const resetAnalytics = async () => {
    const newInfo = [...debugInfo];
    newInfo.push(`\n🔄 Resetting analytics...`);
    setDebugInfo(newInfo);
    
    try {
      await analytics.reset();
      await loadDebugInfo();
      newInfo.push(`✅ Analytics reset! Restart app to see consent dialog again.`);
    } catch (error) {
      newInfo.push(`❌ Error resetting: ${error}`);
    }
    
    setDebugInfo(newInfo);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics Debug</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Current Status</Text>
          {debugInfo.map((info, index) => (
            <Text key={index} style={styles.debugText}>
              {info}
            </Text>
          ))}
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.button} onPress={testEvent}>
            <Text style={styles.buttonText}>🧪 Send Test Event</Text>
          </TouchableOpacity>

          {!consent && (
            <TouchableOpacity style={[styles.button, styles.enableButton]} onPress={enableAnalytics}>
              <Text style={styles.buttonText}>✅ Enable Analytics</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={resetAnalytics}>
            <Text style={styles.buttonText}>🔄 Reset Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={loadDebugInfo}>
            <Text style={styles.buttonText}>🔄 Refresh Info</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>📝 Instructions:</Text>
          <Text style={styles.instructionsText}>
            1. Make sure "Consent Given" shows YES ✅{'\n'}
            2. Make sure "Analytics Enabled" shows YES ✅{'\n'}
            3. Tap "Send Test Event" button{'\n'}
            4. Go to PostHog → Event definitions{'\n'}
            5. Look for "debug_test_event" within 5 seconds{'\n'}
            {'\n'}
            If it doesn't appear, there's a connection issue or API key problem.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  debugText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  buttonSection: {
    margin: 16,
    gap: 12,
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  enableButton: {
    backgroundColor: '#4CAF50',
  },
  resetButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsSection: {
    backgroundColor: '#FFF3CD',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#856404',
  },
  instructionsText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 22,
  },
});

