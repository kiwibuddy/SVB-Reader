import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { clearFirstLaunchFlag } from '@/hooks/useFirstLaunch';
import { useRouter } from 'expo-router';

/**
 * Development component for testing first launch behavior.
 * Only use this in development builds for testing purposes.
 * 
 * Usage: Add this component to any screen during development to test
 * the first launch flow.
 */
export const FirstLaunchTester = () => {
  const router = useRouter();

  const handleResetFirstLaunch = async () => {
    try {
      await clearFirstLaunchFlag();
      Alert.alert(
        'Success',
        'First launch flag cleared! The app will now show onboarding on the next restart.',
        [
          {
            text: 'Go to Onboarding',
            onPress: () => router.replace('/'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to clear first launch flag: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Only show in development
  if (!__DEV__) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 First Launch Tester</Text>
      <Text style={styles.description}>
        Reset the first launch flag to test onboarding flow
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handleResetFirstLaunch}
      >
        <Text style={styles.buttonText}>Reset First Launch Flag</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    margin: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#FF6B47',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
