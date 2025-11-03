# SourceView Together - Development Build Testing Guide

## 🎯 Build Status

**Build Date:** October 8, 2025  
**Version:** 1.0.1 (Notes Feature)  
**Build Type:** Development (Internal Distribution)

### What's New in This Build
✅ **Notes Feature** - Full implementation
✅ **expo-clipboard** - Native module for copying notes
✅ **Database Migration** - Automatic schema update for notes
✅ **Bug Fixes** - Database query fixes, logging cleanup

---

## 📱 Installing on Your iPhone

### Option 1: TestFlight (Recommended - Easiest)

1. **Wait for Build Completion**
   - You'll receive an email when the iOS build completes (usually 15-30 minutes)
   - The email will contain a link to install via TestFlight

2. **Install TestFlight** (if not already installed)
   - Download from App Store: [TestFlight](https://apps.apple.com/us/app/testflight/id899247664)

3. **Install Your Build**
   - Click the link in the email from EAS Build
   - Or run: `eas build:list --platform ios` to get the download URL
   - Open in TestFlight and tap "Install"

### Option 2: Direct Download (Alternative)

1. **Get Download Link**
   ```bash
   cd /Users/nathanielb/Documents/GitHub/sourceview-together
   eas build:list --platform ios --limit 1
   ```

2. **Download .ipa File**
   - Click the build URL in the terminal output
   - Download the .ipa file to your Mac

3. **Install via Xcode** (for registered devices only)
   ```bash
   # Connect iPhone via USB
   # Open Xcode > Window > Devices and Simulators
   # Drag the .ipa file onto your device
   ```

---

## 🧪 Testing Checklist

### 1. App Launch & Database Migration
- [ ] App launches without black screen
- [ ] Home screen loads properly
- [ ] Check logs for: `✅ Emoji table migration successful`

### 2. Reactions Page
- [ ] Reactions tab opens (no "Loading..." freeze)
- [ ] Existing emoji reactions display
- [ ] Can filter reactions

### 3. Notes Feature - Basic
- [ ] Long-press on a speech bubble
- [ ] Emoji picker appears with note icon (pencil/notepad)
- [ ] Tap note icon → Note input appears
- [ ] Can type note (500 char limit, counter shows correctly)
- [ ] Save note → Returns to reading view

### 4. Notes Feature - Advanced
- [ ] Can add note WITH emoji
- [ ] Can add note WITHOUT emoji (note-only reaction)
- [ ] Changing emoji doesn't delete note
- [ ] Note appears in Reactions page with indicator
- [ ] Tap note indicator → Note modal opens
- [ ] Can edit note
- [ ] Can delete note
- [ ] Can copy note to clipboard

### 5. Notes Feature - Reactions Page
- [ ] Filter: "Has Notes" works correctly
- [ ] Both emoji + note icon show when both present
- [ ] Only note icon shows for note-only reactions
- [ ] Long-press speech bubble → "View Note" button appears

### 6. General App Functionality
- [ ] Reading plans work
- [ ] Achievements load
- [ ] Navigation works
- [ ] No crashes during normal use

---

## 🐛 Known Issues (Expected Behavior)

1. **First Launch Database Migration**
   - First time you open the app, you'll see: `📝 Emoji table needs migration for notes feature`
   - This is normal and only happens once
   - Subsequent launches will show: `✅ Emoji table already supports notes feature`

2. **Copy Button in Old Builds**
   - If you're using the old build before this update, copy will show "Not Available" message
   - This is fixed in the new build

---

## 📊 Build Monitoring

### Check Build Status
```bash
# List recent builds
eas build:list --platform ios --limit 5

# View specific build details
eas build:view [BUILD_ID]
```

### Download Build Logs
If build fails, view logs:
```bash
eas build:view [BUILD_ID] --logs
```

---

## 🔄 After Testing

### Report Issues
If you find bugs, note:
1. **What you were doing** (steps to reproduce)
2. **What happened** (actual behavior)
3. **What you expected** (expected behavior)
4. **Device/OS** (iPhone model, iOS version)
5. **Logs** (if app crashes, check Xcode console)

### Submit to TestFlight (Later)
Once testing is complete:
```bash
# This will submit to TestFlight for broader testing
eas submit --platform ios --profile production
```

### Production Build (App Store)
When ready for App Store:
```bash
# Build production version
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios --profile production
```

---

## 📁 Build Details

### What's Included
- ✅ All source code changes from today's session
- ✅ Database schema migration for notes
- ✅ expo-clipboard native module
- ✅ Bug fixes and optimizations
- ✅ All dependencies updated

### Build Configuration
- **Profile:** development
- **Distribution:** internal
- **Signing:** Automatic (EAS credentials)
- **Bundle ID:** com.sourceview.together

### Technical Notes
- Uses Expo SDK 53
- React Native 0.79.5
- New Architecture enabled
- SQLite with notes feature support

---

## 🎉 Quick Start

1. **Wait for email from EAS Build** (~15-30 min)
2. **Install via TestFlight link** in email
3. **Launch app and test** using checklist above
4. **Report any issues** you find

---

**Build Commands Used:**
```bash
# Clean install
rm -rf node_modules ios android .expo
npm install

# Regenerate native projects
npx expo prebuild --clean

# Build for iOS (development)
eas build --profile development --platform ios

# Build for Android (development)
eas build --profile development --platform android
```

---

**Questions?** Check the logs or rebuild with:
```bash
eas build --profile development --platform ios --clear-cache
```

