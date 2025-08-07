import React, { useEffect } from 'react';
import { View } from 'react-native';
import DatabaseTestRunner from '@/components/testing/DatabaseTestRunner';
import QuickTestButton from '@/components/QuickTestButton';

// DATABASE TESTING - Console commands (only in development)
import { runAllTests, runTest1, runTest2, runTest3, runTest4, quickInspection } from '@/scripts/run-database-tests';

/**
 * Database Testing Tab - Easy access to testing interface
 * 
 * TO USE THIS:
 * 1. Add this file to your tabs if needed, or
 * 2. Import and use DatabaseTestRunner in any existing screen, or
 * 3. Access via navigation
 */
export default function DatabaseTestingScreen() {
  // 🧪 DATABASE TESTING FUNCTIONS - Console Commands (Development Only)
  useEffect(() => {
    if (__DEV__) {
      // Make testing functions globally available in development
      (global as any).testDB_DatabaseTesting = {
        runAllTests,
        runTest1,
        runTest2,
        runTest3,
        runTest4,
        quickInspection,
        // Quick commands for DatabaseTesting
        test1: () => {
          console.log('🧪 [DatabaseTesting] Running Test 1: Clean Install...');
          return runTest1();
        },
        test2: () => {
          console.log('🧪 [DatabaseTesting] Running Test 2: Migration...');
          return runTest2();
        },
        test3: () => {
          console.log('🧪 [DatabaseTesting] Running Test 3: Settings...');
          return runTest3();
        },
        test4: () => {
          console.log('🧪 [DatabaseTesting] Running Test 4: Reset Recovery...');
          return runTest4();
        },
        all: () => {
          console.log('🧪 [DatabaseTesting] Running All Tests...');
          return runAllTests();
        },
        inspect: () => {
          console.log('🔍 [DatabaseTesting] Inspecting Database...');
          return quickInspection();
        }
      };

      console.log(`
🧪 [DatabaseTesting] DATABASE TESTING COMMANDS READY!
===================================================

Run these commands from database-testing.tsx:

testDB_DatabaseTesting.test1()  // Clean install test
testDB_DatabaseTesting.test2()  // Migration test  
testDB_DatabaseTesting.test3()  // Settings test
testDB_DatabaseTesting.test4()  // Reset recovery test
testDB_DatabaseTesting.all()    // Run all tests
testDB_DatabaseTesting.inspect() // Quick inspection
      `);
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {__DEV__ && <QuickTestButton />}
      <DatabaseTestRunner />
    </View>
  );
}
