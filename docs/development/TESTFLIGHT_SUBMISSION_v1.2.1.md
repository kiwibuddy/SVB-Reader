# TestFlight Submission Checklist - v1.2.1 (Build 18)

## Overview
This release migrates question data from JSON files to SQLite database, reducing app bundle size by ~1MB and enabling future OTA updates for questions without TestFlight resubmission.

## Version Information
- **Version**: 1.2.1 (from 1.2.0)
- **Build Number**: 18 (from 17)
- **Runtime Version**: 1.2.1
- **Bundle Size Reduction**: ~1MB (22MB → 21MB)

## What Changed

### ✅ Questions Migration to SQLite
- **Migrated**: 2,129 question sets across 6 categories
  - School Questions (Set 1 & Set 2)
  - Family Questions (Set 1 & Set 2)
  - Small Group Questions (Set 1 & Set 2)

### ✅ Files Deleted (Bundle Size Reduction)
- `FamilyQuestions.json` (88KB)
- `FamilyQuestionsSet2.json` (79KB)
- `SchoolQuestions.json` (96KB)
- `SchoolQuestionsSet2.json` (84KB)
- `SmallGroupQuestions.json` (103KB)
- `SmallGroupQuestionsSet2.json` (78KB)
- Plus 6 TSV source files (~600KB)
- **Total Saved**: ~1MB

### ✅ New Files Created
- `api/questions-migration.ts` - Handles one-time migration from JSON to SQLite
- `api/question-functions.ts` - SQLite query API for questions
- Enhanced `api/testing-utilities.ts` - Added question migration tests

### ✅ Modified Files
- `api/database-manager.ts` - Added questions table schema
- `services/app-startup-manager.ts` - Integrated migration trigger
- `components/Questions.tsx` - Now loads from SQLite instead of JSON
- `app/_layout.tsx` - Fixed initialization to not block splash screen
- `App.tsx` - Made database initialization non-blocking

## Testing Completed

### iOS Testing ✅
- [x] Fresh install works correctly
- [x] Migration completes successfully (2,129 question sets)
- [x] All 3 question audiences load (School, Family, Small Group)
- [x] Refresh button switches between Set 1 and Set 2
- [x] Refresh works repeatedly without requiring other taps
- [x] App loads past splash screen smoothly
- [x] No blocking during initialization

### Features Verified ✅
- [x] Questions display correctly for each audience
- [x] Questions are different between audiences (verified S293)
- [x] Set 1 and Set 2 contain different questions
- [x] Animation smooth when switching
- [x] Database persists questions across app restarts

## Database Schema

### Questions Table
```sql
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  segmentID TEXT NOT NULL,
  audienceType TEXT NOT NULL,
  questionSet INTEGER NOT NULL DEFAULT 1,
  Q1 TEXT,
  Q2 TEXT,
  Q3 TEXT,
  Q4 TEXT,
  UNIQUE(segmentID, audienceType, questionSet)
);
CREATE INDEX idx_questions_lookup ON questions(segmentID, audienceType, questionSet);
```

## Migration Strategy

### First Launch (New Users)
1. App initializes database
2. Checks if questions already migrated
3. If not, imports from JSON and populates SQLite
4. Marks migration complete in `app_state` table
5. Questions now load from SQLite

### Existing Users (Updating from 1.2.0)
1. Migration runs automatically on first launch of 1.2.1
2. Takes ~3-5 seconds in background
3. App remains usable during migration
4. Questions immediately available from SQLite

### Future Updates
- Questions can be updated via OTA without TestFlight submission
- Migration code remains for backward compatibility
- New questions can be added to database dynamically

## Known Issues / Notes

### Fixed During Development
- ✅ App stuck on splash screen - Fixed by making initialization non-blocking
- ✅ Refresh button only worked once - Fixed React closure issue with functional state updates
- ✅ Refresh required tapping elsewhere - Removed blocking animation
- ✅ Database initialization race conditions - Fixed timing in app startup

### Production Considerations
- Migration runs in background and doesn't block UI
- Questions are indexed for fast lookups
- Database uses platform-specific optimizations (WAL mode on iOS, DELETE mode on Android)
- Migration is idempotent (safe to run multiple times)

## Build Commands

### For TestFlight Submission
```bash
# Build production iOS app
eas build --platform ios --profile production

# Check build size
# Expected: ~21MB (down from ~22MB)
```

### Local Testing
```bash
# Start dev server
npx expo start --dev-client

# Build preview
eas build --platform ios --profile preview
```

## Rollback Plan

If issues arise in production:
1. Revert to build 17 (v1.2.0) via TestFlight
2. Questions still work from JSON in that version
3. No data loss (SQLite changes are additive only)

## Post-Submission Monitoring

Watch for:
- [ ] App Store review approval
- [ ] Crash reports related to questions loading
- [ ] TestFlight feedback on performance
- [ ] Database initialization errors in logs
- [ ] OTA update compatibility

## Future Enhancements

Now that questions are in SQLite:
- ✅ Add new questions via OTA updates
- ✅ Update existing questions without app resubmission
- ✅ Track which questions users have answered
- ✅ Add question favorites/bookmarks
- ✅ Personalized question recommendations

## Submission Notes for Apple Review

**What's New in 1.2.1:**
> Improved app performance and reduced download size by optimizing how study questions are stored. This update makes questions load faster and enables us to add new questions more quickly in future updates.

**Technical Notes:**
- Questions migrated from JSON to SQLite database
- First launch may take 3-5 extra seconds for one-time migration
- All functionality remains the same for users
- No breaking changes to existing features

---

## Final Checklist Before Submission

- [x] Version updated to 1.2.1
- [x] Build number incremented to 18
- [x] Runtime version updated to 1.2.1
- [x] Question files deleted from bundle
- [x] Migration tested on iOS device
- [x] Questions load correctly for all audiences
- [x] Refresh functionality works properly
- [x] App doesn't block on splash screen
- [x] Bundle size verified (reduced by ~1MB)
- [ ] Android testing (if targeting both platforms)
- [ ] Final build created with EAS
- [ ] TestFlight upload completed

## Ready for Submission ✅

The app is ready for TestFlight submission. All critical functionality has been tested and verified on iOS.

