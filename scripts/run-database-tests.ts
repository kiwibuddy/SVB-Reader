/**
 * Quick Database Test Commands
 * 
 * OPTION 1: Use the UI Component
 * =================================
 * Import DatabaseTestRunner component in any screen:
 * 
 * ```tsx
 * import DatabaseTestRunner from '@/components/testing/DatabaseTestRunner';
 * 
 * function MyScreen() {
 *   return <DatabaseTestRunner />;
 * }
 * ```
 * 
 * OPTION 2: Run Tests Programmatically
 * ====================================
 * Use these commands in your console or in a component:
 */

import {
  runCleanInstallTestSuite,
  generateLegacyTestData,
  settingsPreservationScenario,
  resetRecoveryScenario,
  runTestScenario,
  inspectDatabaseState,
  exportCurrentState
} from '@/api/testing-utilities';
import { initializeDatabaseWithDiagnostics } from '@/api/database-initialization';

// ============================================================================
// INDIVIDUAL TEST COMMANDS
// ============================================================================

/**
 * Test 1: Clean Install Test Suite
 */
export async function runTest1() {
  console.log('🧪 Test 1: Starting Clean Install Test Suite...');
  try {
    const results = await runCleanInstallTestSuite();
    console.log('✅ Test 1 Results:', results);
    return results;
  } catch (error) {
    console.error('❌ Test 1 Failed:', error);
    throw error;
  }
}

/**
 * Test 2: Migration Test with Legacy Data
 */
export async function runTest2() {
  console.log('🧪 Test 2: Starting Migration Test...');
  try {
    // Generate legacy data
    console.log('📝 Generating legacy test data...');
    await generateLegacyTestData();
    
    // Initialize database (triggers migration)
    console.log('🔄 Initializing database with auto-migration...');
    const initResult = await initializeDatabaseWithDiagnostics();
    
    // Inspect state
    console.log('🔍 Inspecting database state...');
    await inspectDatabaseState();
    
    console.log('✅ Test 2 Results:', initResult);
    return initResult;
  } catch (error) {
    console.error('❌ Test 2 Failed:', error);
    throw error;
  }
}

/**
 * Test 3: Settings Preservation Test
 */
export async function runTest3() {
  console.log('🧪 Test 3: Starting Settings Preservation Test...');
  try {
    const result = await runTestScenario(settingsPreservationScenario);
    console.log('✅ Test 3 Results:', result);
    return result;
  } catch (error) {
    console.error('❌ Test 3 Failed:', error);
    throw error;
  }
}

/**
 * Test 4: Database Reset Recovery Test
 */
export async function runTest4() {
  console.log('🧪 Test 4: Starting Reset Recovery Test...');
  try {
    const result = await runTestScenario(resetRecoveryScenario);
    console.log('✅ Test 4 Results:', result);
    return result;
  } catch (error) {
    console.error('❌ Test 4 Failed:', error);
    throw error;
  }
}

// ============================================================================
// RUN ALL TESTS SEQUENTIALLY
// ============================================================================

/**
 * Run all tests in sequence with comprehensive reporting
 */
export async function runAllTests() {
  console.log('🧪 Starting All Database Tests...');
  const results = {
    test1: null as any,
    test2: null as any,
    test3: null as any,
    test4: null as any,
    summary: {
      total: 4,
      passed: 0,
      failed: 0,
      duration: 0
    }
  };
  
  const startTime = Date.now();
  
  try {
    // Test 1: Clean Install
    try {
      results.test1 = await runTest1();
      results.summary.passed++;
    } catch (error) {
      results.test1 = { error: error instanceof Error ? error.message : String(error) };
      results.summary.failed++;
    }
    
    // Test 2: Migration
    try {
      results.test2 = await runTest2();
      results.summary.passed++;
    } catch (error) {
      results.test2 = { error: error instanceof Error ? error.message : String(error) };
      results.summary.failed++;
    }
    
    // Test 3: Settings Preservation
    try {
      results.test3 = await runTest3();
      results.summary.passed++;
    } catch (error) {
      results.test3 = { error: error instanceof Error ? error.message : String(error) };
      results.summary.failed++;
    }
    
    // Test 4: Reset Recovery
    try {
      results.test4 = await runTest4();
      results.summary.passed++;
    } catch (error) {
      results.test4 = { error: error instanceof Error ? error.message : String(error) };
      results.summary.failed++;
    }
    
    results.summary.duration = Date.now() - startTime;
    
    // Generate final report
    console.log('\n🎯 FINAL TEST REPORT:');
    console.log('='.repeat(50));
    console.log(`📊 Total Tests: ${results.summary.total}`);
    console.log(`✅ Passed: ${results.summary.passed}`);
    console.log(`❌ Failed: ${results.summary.failed}`);
    console.log(`⏱️ Duration: ${results.summary.duration}ms`);
    console.log(`📈 Success Rate: ${Math.round((results.summary.passed / results.summary.total) * 100)}%`);
    console.log('='.repeat(50));
    
    // Export current state for debugging
    const currentState = await exportCurrentState();
    console.log('\n📦 Current Database State:');
    console.log(currentState);
    
    return results;
    
  } catch (error) {
    console.error('💥 Critical Error in Test Suite:', error);
    results.summary.duration = Date.now() - startTime;
    return results;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Quick database state inspection
 */
export async function quickInspection() {
  console.log('🔍 Quick Database State Inspection...');
  try {
    await inspectDatabaseState();
  } catch (error) {
    console.error('❌ Inspection failed:', error);
  }
}

/**
 * Export current state for debugging
 */
export async function exportState() {
  console.log('📦 Exporting current database state...');
  try {
    const state = await exportCurrentState();
    console.log(state);
    return state;
  } catch (error) {
    console.error('❌ Export failed:', error);
  }
}

// ============================================================================
// USAGE INSTRUCTIONS
// ============================================================================

/*

HOW TO USE THESE TESTS:

OPTION 1: In App UI (Recommended)
==================================
1. Navigate to the database testing screen
2. Tap individual test buttons
3. View results in real-time
4. Get comprehensive TODO list after all tests

OPTION 2: Console Commands
==========================
In any component or console:

// Import the functions
import { runTest1, runTest2, runTest3, runTest4, runAllTests } from '@/scripts/run-database-tests';

// Run individual tests
await runTest1(); // Clean install
await runTest2(); // Migration
await runTest3(); // Settings preservation  
await runTest4(); // Reset recovery

// Or run all tests
await runAllTests();

OPTION 3: Quick Commands
========================
// Quick state inspection
import { quickInspection, exportState } from '@/scripts/run-database-tests';
await quickInspection();
await exportState();

INTERPRETING RESULTS:
====================
✅ Green = Test passed
❌ Red = Test failed  
⏳ Orange = Test running
⭕ Gray = Test pending

After all tests complete, you'll get:
- Detailed failure analysis
- Priority-ranked TODO list
- Specific action items
- Impact and effort estimates

*/
