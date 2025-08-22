import React from 'react';
import logger from '@/utils/logger';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { runAllTests } from '@/scripts/run-database-tests';

/**
 * Quick Test Button - Tap to run all database tests
 * Add this to any screen for easy testing
 */
export default function QuickTestButton() {
  const runTests = async () => {
    try {
      Alert.alert('🧪 Tests Started', 'Running all database tests...\nCheck console for detailed output.');
      logger.info('🧪 QUICK TEST BUTTON: Starting all database tests...');
      
      const results = await runAllTests();
      
      const passed = results.summary.passed;
      const total = results.summary.total;
      
      if (passed === total) {
        Alert.alert('✅ All Tests Passed!', `${passed}/${total} tests completed successfully.\n\nCheck console for details.`);
      } else {
        Alert.alert('❌ Some Tests Failed', `${passed}/${total} tests passed.\n\nCheck console for error details.`);
      }
      
      logger.info('🧪 QUICK TEST BUTTON: Tests completed!');
      
    } catch (error) {
      logger.error('❌ Quick test error:', error);
      Alert.alert('❌ Test Error', 'Failed to run tests. Check console for details.');
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={runTests}>
      <Text style={styles.buttonText}>🧪 Run All Tests</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    margin: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});