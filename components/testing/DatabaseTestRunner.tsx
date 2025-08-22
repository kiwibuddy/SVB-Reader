import React, { useState, useEffect, useCallback, useMemo, useRef, useContext, useReducer, useLayoutEffect, useImperativeHandle, useDebugValue } from 'react';
import logger from '@/utils/logger';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAppSettings } from '@/context/AppSettingsContext';
import {
  runCleanInstallTestSuite,
  generateLegacyTestData,
  settingsPreservationScenario,
  resetRecoveryScenario,
  runTestScenario,
  inspectDatabaseState,
  type TestResult
} from '@/api/testing-utilities';
import { initializeDatabaseWithDiagnostics } from '@/api/database-initialization';

// ============================================================================
// TYPES
// ============================================================================

interface TestSummary {
  testName: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  details?: any;
  timestamp?: string;
}

interface ComprehensiveTodo {
  priority: 'critical' | 'medium' | 'low';
  category: 'migration' | 'error_handling' | 'performance' | 'data_integrity' | 'user_experience';
  title: string;
  description: string;
  suggestedAction: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DatabaseTestRunner: React.FC = () => {
  const { colors } = useAppSettings();
  const [testSummaries, setTestSummaries] = useState<TestSummary[]>([
    { testName: 'Clean Install Test Suite', status: 'pending' },
    { testName: 'Migration Test with Legacy Data', status: 'pending' },
    { testName: 'Settings Preservation Test', status: 'pending' },
    { testName: 'Database Reset Recovery Test', status: 'pending' }
  ]);
  
  const [allTestsCompleted, setAllTestsCompleted] = useState(false);
  const [comprehensiveTodos, setComprehensiveTodos] = useState<ComprehensiveTodo[]>([]);
  const [overallReport, setOverallReport] = useState<string>('');

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const updateTestStatus = (index: number, updates: Partial<TestSummary>) => {
    setTestSummaries(prev => 
      prev.map((test, i) => 
        i === index ? { ...test, ...updates, timestamp: new Date().toISOString() } : test
      )
    );
  };

  const logTestResult = (testName: string, result: any) => {
    logger.info(`\n🧪 ===== ${testName.toUpperCase()} RESULT =====`);
    logger.info(JSON.stringify(result, null, 2));
    logger.info(`===== END ${testName.toUpperCase()} =====\n`);
  };

  // ============================================================================
  // TEST RUNNERS
  // ============================================================================

  const runTest1_CleanInstall = async () => {
    const testIndex = 0;
    updateTestStatus(testIndex, { status: 'running' });
    
    try {
      const startTime = Date.now();
      logger.info('🧪 Starting Clean Install Test Suite...');
      
      const results = await runCleanInstallTestSuite();
      const duration = Date.now() - startTime;
      
      logTestResult('Clean Install Test Suite', results);
      
      const passed = results.every(r => r.success);
      updateTestStatus(testIndex, {
        status: passed ? 'passed' : 'failed',
        duration,
        details: results,
        error: passed ? undefined : `${results.filter(r => !r.success).length} tests failed`
      });

      Alert.alert(
        'Test 1 Complete',
        `Clean Install Test Suite ${passed ? 'PASSED' : 'FAILED'}\n` +
        `Duration: ${duration}ms\n` +
        `Results: ${results.filter(r => r.success).length}/${results.length} passed`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      const duration = Date.now();
      updateTestStatus(testIndex, {
        status: 'failed',
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      
      Alert.alert('Test 1 Failed', `Error: ${error}`, [{ text: 'OK' }]);
    }
  };

  const runTest2_Migration = async () => {
    const testIndex = 1;
    updateTestStatus(testIndex, { status: 'running' });
    
    try {
      const startTime = Date.now();
      logger.info('🧪 Starting Migration Test with Legacy Data...');
      
      // Step 1: Generate legacy data
      logger.info('📝 Generating legacy test data...');
      await generateLegacyTestData();
      
      // Step 2: Initialize database with diagnostics (triggers migration)
      logger.info('🔄 Initializing database with auto-migration...');
      const initResult = await initializeDatabaseWithDiagnostics();
      
      // Step 3: Inspect final state
      logger.info('🔍 Inspecting database state...');
      await inspectDatabaseState();
      
      const duration = Date.now() - startTime;
      const result = { initResult, testType: 'migration_with_legacy_data' };
      
      logTestResult('Migration Test with Legacy Data', result);
      
      const passed = initResult.success;
      updateTestStatus(testIndex, {
        status: passed ? 'passed' : 'failed',
        duration,
        details: result,
        error: passed ? undefined : initResult.error
      });

      Alert.alert(
        'Test 2 Complete',
        `Migration Test ${passed ? 'PASSED' : 'FAILED'}\n` +
        `Duration: ${duration}ms\n` +
        `Migration Performed: ${initResult.migrationPerformed ? 'Yes' : 'No'}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      const duration = Date.now();
      updateTestStatus(testIndex, {
        status: 'failed',
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      
      Alert.alert('Test 2 Failed', `Error: ${error}`, [{ text: 'OK' }]);
    }
  };

  const runTest3_SettingsPreservation = async () => {
    const testIndex = 2;
    updateTestStatus(testIndex, { status: 'running' });
    
    try {
      const startTime = Date.now();
      logger.info('🧪 Starting Settings Preservation Test...');
      
      const result = await runTestScenario(settingsPreservationScenario);
      const duration = Date.now() - startTime;
      
      logTestResult('Settings Preservation Test', result);
      
      updateTestStatus(testIndex, {
        status: result.success ? 'passed' : 'failed',
        duration,
        details: result,
        error: result.success ? undefined : result.error
      });

      Alert.alert(
        'Test 3 Complete',
        `Settings Preservation Test ${result.success ? 'PASSED' : 'FAILED'}\n` +
        `Duration: ${duration}ms`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      const duration = Date.now();
      updateTestStatus(testIndex, {
        status: 'failed',
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      
      Alert.alert('Test 3 Failed', `Error: ${error}`, [{ text: 'OK' }]);
    }
  };

  const runTest4_ResetRecovery = async () => {
    const testIndex = 3;
    updateTestStatus(testIndex, { status: 'running' });
    
    try {
      const startTime = Date.now();
      logger.info('🧪 Starting Database Reset Recovery Test...');
      
      const result = await runTestScenario(resetRecoveryScenario);
      const duration = Date.now() - startTime;
      
      logTestResult('Database Reset Recovery Test', result);
      
      updateTestStatus(testIndex, {
        status: result.success ? 'passed' : 'failed',
        duration,
        details: result,
        error: result.success ? undefined : result.error
      });

      Alert.alert(
        'Test 4 Complete',
        `Reset Recovery Test ${result.success ? 'PASSED' : 'FAILED'}\n` +
        `Duration: ${duration}ms`,
        [{ text: 'OK' }]
      );

      // Check if all tests are now completed
      const allCompleted = testSummaries.every((_, i) => 
        i === testIndex || testSummaries[i].status !== 'pending'
      );
      
      if (allCompleted) {
        setAllTestsCompleted(true);
        generateComprehensiveReport();
      }

    } catch (error) {
      const duration = Date.now();
      updateTestStatus(testIndex, {
        status: 'failed',
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      
      Alert.alert('Test 4 Failed', `Error: ${error}`, [{ text: 'OK' }]);
    }
  };

  // ============================================================================
  // COMPREHENSIVE REPORT GENERATION
  // ============================================================================

  const generateComprehensiveReport = () => {
    const todos: ComprehensiveTodo[] = [];
    const failedTests = testSummaries.filter(t => t.status === 'failed');
    const passedTests = testSummaries.filter(t => t.status === 'passed');
    const totalDuration = testSummaries.reduce((acc, t) => acc + (t.duration || 0), 0);

    // Analyze failures and generate todos
    failedTests.forEach(test => {
      if (test.testName.includes('Clean Install')) {
        todos.push({
          priority: 'critical',
          category: 'data_integrity',
          title: 'Fix Clean Install Database Initialization',
          description: 'Clean install test failed, indicating issues with fresh database setup',
          suggestedAction: 'Review database-manager.ts initialization logic and ensure all tables are created properly',
          impact: 'New users cannot use the app',
          effort: 'high'
        });
      }
      
      if (test.testName.includes('Migration')) {
        todos.push({
          priority: 'critical',
          category: 'migration',
          title: 'Fix AsyncStorage to SQLite Migration',
          description: 'Migration test failed, existing users will lose data on app update',
          suggestedAction: 'Debug database-migration.ts and ensure all AsyncStorage data is properly transferred',
          impact: 'Existing users lose progress on app update',
          effort: 'high'
        });
      }
      
      if (test.testName.includes('Settings')) {
        todos.push({
          priority: 'medium',
          category: 'user_experience',
          title: 'Fix Settings Preservation During Migration',
          description: 'User settings are not preserved during migration process',
          suggestedAction: 'Review settings-manager.ts backup/restore mechanisms',
          impact: 'Users lose preferences during migration',
          effort: 'medium'
        });
      }
      
      if (test.testName.includes('Reset')) {
        todos.push({
          priority: 'medium',
          category: 'error_handling',
          title: 'Improve Database Reset Recovery',
          description: 'Database reset and recovery process is unreliable',
          suggestedAction: 'Enhance error-handling.ts recovery mechanisms',
          impact: 'Users cannot recover from database corruption',
          effort: 'medium'
        });
      }
    });

    // Performance analysis
    if (totalDuration > 10000) { // More than 10 seconds total
      todos.push({
        priority: 'medium',
        category: 'performance',
        title: 'Optimize Database Operations Performance',
        description: `Total test duration ${totalDuration}ms is too long for production`,
        suggestedAction: 'Add database indexes, optimize queries, implement connection pooling',
        impact: 'Slow app startup and poor user experience',
        effort: 'medium'
      });
    }

    // Success analysis - add improvement recommendations
    if (passedTests.length === testSummaries.length) {
      todos.push({
        priority: 'low',
        category: 'performance',
        title: 'Add Database Performance Monitoring',
        description: 'All tests passed, but add monitoring for production',
        suggestedAction: 'Implement performance metrics and alerting',
        impact: 'Better production monitoring and debugging',
        effort: 'low'
      });
      
      todos.push({
        priority: 'low',
        category: 'user_experience',
        title: 'Add Progressive Migration UI',
        description: 'Add user feedback during migration process',
        suggestedAction: 'Show progress indicators during database operations',
        impact: 'Better user experience during app updates',
        effort: 'low'
      });
    }

    // General recommendations
    todos.push({
      priority: 'low',
      category: 'data_integrity',
      title: 'Add Database Integrity Checks',
      description: 'Implement periodic data integrity verification',
      suggestedAction: 'Add checksums and validation for critical data',
      impact: 'Early detection of data corruption',
      effort: 'medium'
    });

    const report = `
🧪 DATABASE TESTING COMPREHENSIVE REPORT
=======================================

📊 OVERALL RESULTS:
- Tests Run: ${testSummaries.length}
- Passed: ${passedTests.length}
- Failed: ${failedTests.length}
- Total Duration: ${totalDuration}ms
- Success Rate: ${Math.round((passedTests.length / testSummaries.length) * 100)}%

📝 DETAILED RESULTS:
${testSummaries.map(t => 
  `${t.status === 'passed' ? '✅' : '❌'} ${t.testName}: ${t.status.toUpperCase()} (${t.duration}ms)${t.error ? ` - ${t.error}` : ''}`
).join('\n')}

🚨 CRITICAL ISSUES: ${todos.filter(t => t.priority === 'critical').length}
⚠️ MEDIUM ISSUES: ${todos.filter(t => t.priority === 'medium').length}
📋 LOW PRIORITY: ${todos.filter(t => t.priority === 'low').length}

🎯 NEXT STEPS: ${failedTests.length > 0 ? 'Fix critical issues before production deployment' : 'All tests passed - ready for production with recommended improvements'}
`;

    setComprehensiveTodos(todos);
    setOverallReport(report);
    
    logger.info(report);
    logger.info('\n📋 COMPREHENSIVE TODO LIST:');
    todos.forEach((todo, index) => {
      logger.info(`\n${index + 1}. [${todo.priority.toUpperCase()}] ${todo.title}`);
      logger.info(`   Category: ${todo.category}`);
      logger.info(`   Description: ${todo.description}`);
      logger.info(`   Action: ${todo.suggestedAction}`);
      logger.info(`   Impact: ${todo.impact}`);
      logger.info(`   Effort: ${todo.effort}`);
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const getStatusColor = (status: TestSummary['status']) => {
    switch (status) {
      case 'passed': return '#4CAF50';
      case 'failed': return '#F44336';
      case 'running': return '#FF9800';
      default: return colors.secondary;
    }
  };

  const getStatusIcon = (status: TestSummary['status']) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'running': return '⏳';
      default: return '⭕';
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      <Text style={{ 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: colors.text, 
        marginBottom: 20,
        textAlign: 'center'
      }}>
        🧪 Database Test Runner
      </Text>
      
      <Text style={{ 
        fontSize: 16, 
        color: colors.secondary, 
        marginBottom: 30,
        textAlign: 'center'
      }}>
        Run each test individually and get detailed reports
      </Text>

      {/* Test Buttons */}
      <View style={{ marginBottom: 30 }}>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            padding: 15,
            borderRadius: 8,
            marginBottom: 15,
            opacity: testSummaries[0].status === 'running' ? 0.6 : 1
          }}
          onPress={runTest1_CleanInstall}
          disabled={testSummaries[0].status === 'running'}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
            {testSummaries[0].status === 'running' ? '⏳ Running...' : '🧪 Run Test 1: Clean Install'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            padding: 15,
            borderRadius: 8,
            marginBottom: 15,
            opacity: testSummaries[1].status === 'running' ? 0.6 : 1
          }}
          onPress={runTest2_Migration}
          disabled={testSummaries[1].status === 'running'}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
            {testSummaries[1].status === 'running' ? '⏳ Running...' : '🔄 Run Test 2: Migration'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            padding: 15,
            borderRadius: 8,
            marginBottom: 15,
            opacity: testSummaries[2].status === 'running' ? 0.6 : 1
          }}
          onPress={runTest3_SettingsPreservation}
          disabled={testSummaries[2].status === 'running'}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
            {testSummaries[2].status === 'running' ? '⏳ Running...' : '⚙️ Run Test 3: Settings'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            padding: 15,
            borderRadius: 8,
            marginBottom: 15,
            opacity: testSummaries[3].status === 'running' ? 0.6 : 1
          }}
          onPress={runTest4_ResetRecovery}
          disabled={testSummaries[3].status === 'running'}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
            {testSummaries[3].status === 'running' ? '⏳ Running...' : '🔄 Run Test 4: Reset Recovery'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Test Results */}
      <View style={{ marginBottom: 30 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 }}>
          📊 Test Results
        </Text>
        
        {testSummaries.map((test, index) => (
          <View key={index} style={{
            backgroundColor: colors.card,
            padding: 15,
            borderRadius: 8,
            marginBottom: 10,
            borderLeftWidth: 4,
            borderLeftColor: getStatusColor(test.status)
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, flex: 1 }}>
                {getStatusIcon(test.status)} {test.testName}
              </Text>
              {test.status === 'running' && <ActivityIndicator size="small" color={colors.primary} />}
            </View>
            
            {test.duration && (
              <Text style={{ fontSize: 14, color: colors.secondary, marginTop: 5 }}>
                Duration: {test.duration}ms
              </Text>
            )}
            
            {test.error && (
              <Text style={{ fontSize: 14, color: '#F44336', marginTop: 5 }}>
                Error: {test.error}
              </Text>
            )}
            
            {test.timestamp && (
              <Text style={{ fontSize: 12, color: colors.secondary, marginTop: 5 }}>
                {new Date(test.timestamp).toLocaleString()}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Comprehensive Report */}
      {allTestsCompleted && (
        <View style={{ marginBottom: 30 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 }}>
            📋 Comprehensive TODO List
          </Text>
          
          {/* Critical Issues */}
          {comprehensiveTodos.filter(t => t.priority === 'critical').length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#F44336', marginBottom: 10 }}>
                🚨 CRITICAL ISSUES
              </Text>
              {comprehensiveTodos.filter(t => t.priority === 'critical').map((todo, index) => (
                <View key={index} style={{
                  backgroundColor: '#FFEBEE',
                  padding: 15,
                  borderRadius: 8,
                  marginBottom: 10,
                  borderLeftWidth: 4,
                  borderLeftColor: '#F44336'
                }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#D32F2F', marginBottom: 5 }}>
                    {todo.title}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#424242', marginBottom: 5 }}>
                    {todo.description}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#1976D2', marginBottom: 5 }}>
                    Action: {todo.suggestedAction}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 3 }}>
                    Impact: {todo.impact}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    Effort: {todo.effort} | Category: {todo.category}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Medium Issues */}
          {comprehensiveTodos.filter(t => t.priority === 'medium').length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FF9800', marginBottom: 10 }}>
                ⚠️ MEDIUM PRIORITY
              </Text>
              {comprehensiveTodos.filter(t => t.priority === 'medium').map((todo, index) => (
                <View key={index} style={{
                  backgroundColor: '#FFF8E1',
                  padding: 15,
                  borderRadius: 8,
                  marginBottom: 10,
                  borderLeftWidth: 4,
                  borderLeftColor: '#FF9800'
                }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#F57C00', marginBottom: 5 }}>
                    {todo.title}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#424242', marginBottom: 5 }}>
                    {todo.description}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#1976D2', marginBottom: 5 }}>
                    Action: {todo.suggestedAction}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 3 }}>
                    Impact: {todo.impact}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    Effort: {todo.effort} | Category: {todo.category}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Low Priority */}
          {comprehensiveTodos.filter(t => t.priority === 'low').length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4CAF50', marginBottom: 10 }}>
                📋 LOW PRIORITY
              </Text>
              {comprehensiveTodos.filter(t => t.priority === 'low').map((todo, index) => (
                <View key={index} style={{
                  backgroundColor: '#E8F5E8',
                  padding: 15,
                  borderRadius: 8,
                  marginBottom: 10,
                  borderLeftWidth: 4,
                  borderLeftColor: '#4CAF50'
                }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#388E3C', marginBottom: 5 }}>
                    {todo.title}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#424242', marginBottom: 5 }}>
                    {todo.description}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#1976D2', marginBottom: 5 }}>
                    Action: {todo.suggestedAction}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 3 }}>
                    Impact: {todo.impact}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    Effort: {todo.effort} | Category: {todo.category}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Overall Report */}
          <View style={{
            backgroundColor: colors.card,
            padding: 15,
            borderRadius: 8,
            marginBottom: 20
          }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>
              📊 Overall Report
            </Text>
            <Text style={{ fontSize: 14, color: colors.text, fontFamily: 'monospace' }}>
              {overallReport}
            </Text>
          </View>
        </View>
      )}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

export default DatabaseTestRunner;
