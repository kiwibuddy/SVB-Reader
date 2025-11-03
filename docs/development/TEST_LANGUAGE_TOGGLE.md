# Language Toggle Troubleshooting Guide

## 🔍 Issue: Can't Turn French Toggle On

### Most Likely Cause: **App Needs to be Reloaded**

The code changes we made need the app to be completely reloaded (not just hot reload).

## ✅ Solution Steps:

### 1. **Kill the Metro Bundler**
I've already killed the old Metro bundler process. Now start a fresh one:

```bash
cd /Users/nathanielb/Documents/GitHub/sourceview-together
npx react-native start --reset-cache
```

### 2. **Completely Close and Restart the App**
- On iOS: Swipe up to close the app completely, then reopen
- On Android: Force stop the app, then reopen

### 3. **Test the Language Toggle**
1. Open Settings
2. Tap "Language" to expand
3. You should see:
   - **English** with toggle ON (green)
   - **Français** with toggle OFF (gray)
4. Tap the **Français toggle**
5. Watch:
   - English toggle turns OFF
   - Français toggle turns ON
   - Current language updates to "Français"
   - Settings title changes to "Paramètres"

## 🐛 If It Still Doesn't Work

### Check Console Logs:
The code now includes console logging. Check your console for:
```
Language toggle: fr
```

### Verify the Code Is Loaded:
1. Make sure the app reloaded the new code
2. Check that SettingsModal.tsx shows the collapsible design
3. Verify you can see both English and Français in the list

### Check Language State:
Add this temporary debug info - I'll update the code to show which language is actually active:

