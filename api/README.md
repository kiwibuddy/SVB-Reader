# SourceView Together - Database Management System

## 🏗️ **Architecture Overview**

This app uses a **dual-storage architecture** following industry best practices:

- **SQLite**: App data (reading progress, plans, challenges, completions)
- **AsyncStorage**: User settings (dark mode, language, preferences)

## 📁 **File Structure**

```
api/
├── database-manager.ts      # Core SQLite database management
├── sqlite.ts               # Legacy SQLite functions (being phased out)
├── app-data-manager.ts     # New SQLite-only data layer
├── database-diagnostics.ts # Database versioning & conflict detection
├── database-migration.ts   # AsyncStorage → SQLite migration
├── database-initialization.ts # Auto-migration startup
├── error-handling.ts       # Comprehensive error handling
└── testing-utilities.ts    # Clean install testing

context/
├── SQLiteGlobalContext.tsx # New SQLite-based context (recommended)
└── GlobalContext.tsx       # Legacy context (deprecated)

services/
└── settings-manager.ts     # AsyncStorage-only settings management
```

## 🚀 **Quick Start**

### 1. Use the New SQLite Context

Replace the old `GlobalContext` with `SQLiteGlobalContext`:

```tsx
// ❌ Old way
import { AppProvider, useAppContext } from '@/context/GlobalContext';

// ✅ New way
import { SQLiteGlobalProvider, useSQLiteGlobalContext } from '@/context/SQLiteGlobalContext';

function App() {
  return (
    <SQLiteGlobalProvider>
      <YourApp />
    </SQLiteGlobalProvider>
  );
}

function MyComponent() {
  const { segmentId, markSegmentComplete } = useSQLiteGlobalContext();
  // Use as normal
}
```

### 2. Auto-Migration is Built-In

The new context automatically handles database initialization and migration:

```tsx
// In your _layout.tsx - this is already implemented
function AppContent() {
  // Database initialization with auto-migration happens automatically
  return (
    <SQLiteGlobalProvider>
      {/* Your app content */}
    </SQLiteGlobalProvider>
  );
}
```

### 3. Settings Management

Use the dedicated settings manager for user preferences:

```tsx
import { settingsHelpers } from '@/services/settings-manager';

// Get/set individual settings
const isDarkMode = await settingsHelpers.getDarkMode();
await settingsHelpers.setDarkMode(true);

// Get all settings
const allSettings = await settingsHelpers.getAllSettings();
```

## 🔧 **Development Tools**

### Database Diagnostics

```tsx
import { logDatabaseDiagnostics, analyzeDataConflicts } from '@/api/database-diagnostics';

// Log comprehensive database info to console
await logDatabaseDiagnostics();

// Check for AsyncStorage/SQLite conflicts
const conflicts = await analyzeDataConflicts();
```

### Testing Utilities

```tsx
import { runCleanInstallTestSuite, inspectDatabaseState } from '@/api/testing-utilities';

// Run full test suite
const results = await runCleanInstallTestSuite();

// Quick state inspection
await inspectDatabaseState();
```

### Debug UI Component

Add this to any screen for debugging:

```tsx
import DatabaseDebugScreen from '@/components/database-debug';

function MyScreen() {
  const [showDebug, setShowDebug] = useState(false);
  
  return (
    <>
      {/* Your screen content */}
      
      {__DEV__ && (
        <>
          <TouchableOpacity onPress={() => setShowDebug(true)}>
            <Text>🔧 Debug Database</Text>
          </TouchableOpacity>
          
          <DatabaseDebugScreen 
            visible={showDebug} 
            onClose={() => setShowDebug(false)} 
          />
        </>
      )}
    </>
  );
}
```

## 🔄 **Migration Process**

### Automatic Migration

The app automatically detects and migrates legacy data:

1. **App startup** → `initializeDatabaseWithDiagnostics()`
2. **Check version** → Compare current vs expected database version
3. **Migrate if needed** → Move AsyncStorage data to SQLite
4. **Clean up** → Remove migrated AsyncStorage keys (keep settings)
5. **Update version** → Mark database as current version

### Manual Migration

For development/testing:

```tsx
import { migrateAsyncStorageToSQLite } from '@/api/database-migration';

const result = await migrateAsyncStorageToSQLite();
console.log('Migration result:', result);
```

## 📊 **Data Flow**

### Reading Progress Tracking

```tsx
const { markSegmentComplete, getCompletionStatus } = useSQLiteGlobalContext();

// Mark segment as complete
await markSegmentComplete('S001', true, null, 'main');

// Check completion status
const status = await getCompletionStatus('S001');
```

### Plan Management

```tsx
const { startPlan, activePlan, pausePlan } = useSQLiteGlobalContext();

// Start a reading plan
await startPlan('chronological_plan');

// Pause current plan
await pausePlan();
```

### Settings Management

```tsx
// ✅ User preferences (AsyncStorage)
await settingsHelpers.setDarkMode(true);
await settingsHelpers.setLanguage('en');

// ❌ Don't use AsyncStorage directly for app data
// await AsyncStorage.setItem('completedSegments', JSON.stringify(segments));
```

## ⚠️ **Migration Guide**

### From Legacy Context

If you're using the old `GlobalContext`, here's how to migrate:

```tsx
// ❌ Old way
const { 
  completedSegments, 
  markSegmentComplete, 
  activePlan,
  startPlan 
} = useAppContext();

// ✅ New way
const { 
  completedSegments, 
  markSegmentComplete, 
  activePlan,
  startPlan 
} = useSQLiteGlobalContext();
```

### API Changes

Most APIs remain the same, but with better error handling:

```tsx
// ✅ Now includes loading states and error handling
const { isLoading, error, clearError } = useSQLiteGlobalContext();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} onClear={clearError} />;
```

## 🧪 **Testing**

### Clean Install Testing

```bash
# Run full test suite
npm run test:clean-install

# Or programmatically
import { runCleanInstallTestSuite } from '@/api/testing-utilities';
const results = await runCleanInstallTestSuite();
```

### Test Scenarios

1. **Fresh Install** - No existing data
2. **Legacy Migration** - AsyncStorage → SQLite
3. **Reset Recovery** - Database reset and recovery
4. **Settings Preservation** - Settings survive migration

### Development Workflow

```tsx
// 1. Generate test data
await generateLegacyTestData();

// 2. Test migration
const result = await migrateAsyncStorageToSQLite();

// 3. Verify state
await inspectDatabaseState();

// 4. Clean up
await clearAllTestData();
```

## 🔐 **Error Handling**

### Automatic Recovery

The system includes comprehensive error handling:

- **Transaction rollback** on failed operations
- **Settings backup** before risky migrations
- **Database recovery** from corruption
- **Detailed logging** for debugging

### Manual Error Handling

```tsx
import { safeExecute, recoverFromCorruption } from '@/api/error-handling';

// Execute with automatic rollback
await safeExecute(async () => {
  // Your database operations
}, { operation: 'myOperation' });

// Recover from corruption
const recovered = await recoverFromCorruption();
```

## 🎯 **Best Practices**

### ✅ DO

- Use `SQLiteGlobalContext` for all app data
- Use `settingsHelpers` for user preferences
- Let auto-migration handle data migration
- Use the debug tools during development
- Run clean install tests before releases

### ❌ DON'T

- Mix AsyncStorage and SQLite for the same data
- Access SQLite directly without the context
- Store user settings in SQLite
- Skip migration testing
- Ignore error handling

## 🚨 **Troubleshooting**

### Common Issues

**1. "Database not initialized" Error**
```tsx
// Ensure you're using the new context
<SQLiteGlobalProvider>
  <YourApp />
</SQLiteGlobalProvider>
```

**2. "Migration conflicts detected"**
```tsx
// Use diagnostic tools
import { analyzeDataConflicts } from '@/api/database-diagnostics';
const conflicts = await analyzeDataConflicts();
```

**3. "Settings not persisting"**
```tsx
// Use settings manager instead of direct AsyncStorage
import { settingsHelpers } from '@/services/settings-manager';
await settingsHelpers.setDarkMode(true);
```

### Debug Commands

```tsx
// Log comprehensive diagnostics
await logDatabaseDiagnostics();

// Inspect current state
await inspectDatabaseState();

// Export state for debugging
const state = await exportCurrentState();
console.log(state);
```

## 📈 **Performance**

### Optimizations

- **Batch operations** in transactions
- **Lazy loading** of non-critical data
- **Connection pooling** via singleton pattern
- **Index optimization** for common queries

### Monitoring

```tsx
// Monitor performance
const startTime = Date.now();
await markSegmentComplete('S001', true);
console.log(`Completion took: ${Date.now() - startTime}ms`);
```

---

## 🎉 **Success!**

Your app now has:

✅ **Industry-standard** dual storage architecture  
✅ **Automatic migration** from legacy data  
✅ **Comprehensive error handling** with rollback  
✅ **Clean separation** of concerns  
✅ **Robust testing** utilities  
✅ **Production-ready** error recovery  

The migration is **automatic** and **safe** - users won't notice any disruption! 🚀
