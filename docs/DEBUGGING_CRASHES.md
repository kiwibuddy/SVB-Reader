# Debugging Crashes in TestFlight Builds

## 📱 Accessing Crash Logs from Your iPhone

### Method 1: Xcode Console (Best for Real-time Debugging)

1. **Connect iPhone to Mac via USB**
2. **Open Xcode** on your Mac
3. **Go to**: `Window` → `Devices and Simulators`
4. **Select your iPhone** from the left sidebar
5. **Click "Open Console"** button at the bottom
6. **Filter by your app**: Type "SourceView Together" or "com.sourceview.together" in the search box
7. **Launch the app** on your iPhone - you'll see logs in real-time including crashes

### Method 2: App Store Connect Crash Reports

1. **Go to**: [App Store Connect](https://appstoreconnect.apple.com)
2. **Select**: "SourceView Together" → "TestFlight" → "Crashes"
3. **View crash reports** with stack traces (usually available within 24 hours)

### Method 3: Device Console Logs (macOS)

1. **Connect iPhone to Mac via USB**
2. **Open Console.app** on your Mac (Applications → Utilities → Console)
3. **Select your iPhone** from the left sidebar
4. **Filter**: Search for "SourceView Together" or crash keywords
5. **Launch app** - logs appear in real-time

### Method 4: Enable Crash Logging in Code

The app now includes enhanced error logging. Check logs for:
- `[CRASH]` - Critical errors that may cause crashes
- `[ERROR]` - Errors that are logged but might not crash
- `[INIT]` - Initialization steps and failures

## 🔍 What to Look For

### Common Crash Points:
1. **Database initialization** - Look for SQLite errors
2. **Bible JSON loading** - Look for "Failed to load English Bible"
3. **Font loading** - Look for font-related errors
4. **Context initialization** - Look for React context errors
5. **i18next initialization** - Look for translation errors

### Error Patterns:
- `Cannot read property 'X' of undefined` - Missing data
- `Module not found` - Missing imports/files
- `Cannot resolve module` - Bundling issues
- `Database locked` - SQLite issues
- `JSON parse error` - Corrupted JSON files

## 🛠️ Temporary Debug Build

To get detailed logs, you can create a debug build:

```bash
eas build --platform ios --profile development
```

This will include full console logging and easier debugging.

## 📊 Next Steps

Once you have crash logs:
1. Share the error message and stack trace
2. Note what screen was showing when it crashed
3. Note if it's first launch or subsequent launch
4. Share device model and iOS version

