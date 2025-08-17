# Android Testing Guide for SourceView Together

## Prerequisites
1. Make sure you have EAS CLI installed: `npm install -g @expo/eas-cli`
2. Ensure you're logged into your Expo account: `eas login`
3. Have an Android device or emulator ready for testing

## Building for Android Development

### Option 1: Development Build (Recommended for testing)
```bash
# Build a development APK for Android
npm run build:android-dev

# Or use the command directly
eas build --platform android --profile development-android
```

### Option 2: Development Local Build
```bash
# Build locally (requires Android Studio and SDK)
npm run build:android-dev-local

# Or use the command directly
eas build --platform android --profile development-local
```

### Option 3: Preview Build
```bash
# Build a preview APK
npm run build:android-preview

# Or use the command directly
eas build --platform android --profile preview
```

## Installing and Testing

1. **Download the APK**: After the build completes, download the APK file from the EAS Build dashboard
2. **Install on Device**: Transfer the APK to your Android device and install it
3. **Enable Developer Options**: On your Android device, go to Settings > About Phone and tap "Build Number" 7 times
4. **Enable USB Debugging**: In Developer Options, enable "USB Debugging"
5. **Test the App**: Open the installed app and test all functionality

## Development Client Testing

Once you have the development build installed:

```bash
# Start the development server
npx expo start --dev-client

# Press 'a' to open Android (if you have an emulator running)
# Or scan the QR code with your device's camera
```

## Troubleshooting

### Common Issues:
1. **Build Fails**: Check that all Android permissions are properly configured in `app.json`
2. **App Crashes**: Check the Android logs using `adb logcat`
3. **Permission Issues**: Ensure all required permissions are listed in `app.json`

### Debug Commands:
```bash
# Check connected devices
adb devices

# View logs
adb logcat

# Install APK directly
adb install -r path/to/your/app.apk
```

## Next Steps

After successful testing:
1. Test all major app features on Android
2. Verify UI looks correct on different screen sizes
3. Test performance and memory usage
4. Prepare for production Android build when ready
