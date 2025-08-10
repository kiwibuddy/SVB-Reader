# 🍎 Apple App Store Submission Guide
## SourceView Together - Production Build & Submission

This guide provides step-by-step instructions for building and submitting SourceView Together to Apple's App Store.

## 📋 Pre-Submission Checklist

✅ **All Critical Issues Resolved:**
- Privacy Policy URL configured (email-based)
- Support URL configured (email-based)
- All console statements replaced with production logger
- External links removed
- App Store metadata added
- Version numbers standardized

✅ **Current Configuration:**
- **App Version**: `1.0.0` (CFBundleShortVersionString)
- **Build Number**: `1` (CFBundleVersion)
- **Bundle ID**: `com.sourceview.together`
- **Runtime Version**: `appVersion` policy (OTA-compatible)

## 🔧 Build Process

### Step 1: Verify Configuration
```bash
npm run prepare:appstore
```
This script validates all required configurations for App Store submission.

### Step 2: Build for Production
```bash
# Option A: EAS Build (Recommended)
npm run build:ios

# Option B: Local Build
npm run build:local
```

### Step 3: Submit to TestFlight
```bash
npm run submit:ios
```

### Step 4: TestFlight Review
- Wait for Apple's TestFlight processing (usually 5-10 minutes)
- Test the build thoroughly on multiple devices
- Gather feedback from beta testers

### Step 5: App Store Submission
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app
3. Create a new version (1.0.0)
4. Fill in the required metadata:
   - **App Description**: Already configured in app.json
   - **Keywords**: Already configured in app.json
   - **Screenshots**: Upload required sizes for iPhone and iPad
   - **App Preview Videos**: Optional but recommended
5. Submit for review

## 📱 Apple App Store Requirements

### Required Screenshots
- **iPhone 6.7"**: 1290 x 2796 pixels (iPhone 14 Pro Max)
- **iPhone 6.5"**: 1242 x 2688 pixels (iPhone XS Max)
- **iPhone 5.5"**: 1242 x 2208 pixels (iPhone 8 Plus)
- **iPad Pro (6th Gen)**: 2048 x 2732 pixels
- **iPad Pro (2nd Gen)**: 2048 x 2732 pixels

### App Store Information
- **Category**: Reference or Education
- **Subcategory**: Religious Texts
- **Content Rating**: 4+ (No Restricted Content)
- **Price**: Free

### App Review Information
- **Demo Account**: Not required (no login needed)
- **Review Notes**: 
  ```
  SourceView Together is a Bible reading app that allows users to:
  1. Read Bible stories individually
  2. Join group reading sessions via QR codes
  3. Track reading progress and challenges
  4. React to Bible passages with emojis
  
  The app uses:
  - Camera permission for QR code scanning (group features)
  - Local SQLite database for progress tracking
  - No user accounts or personal data collection
  
  All content is biblical text and educational in nature.
  Email support: sourceviewbible@gmail.com
  ```

## 🔄 OTA Updates (Future)

After App Store approval, you can enable OTA updates:

1. Update `app.json`:
   ```json
   "updates": {
     "enabled": true,
     "checkAutomatically": "ON_APP_LOAD",
     "fallbackToCacheTimeout": 10000
   }
   ```

2. Deploy updates:
   ```bash
   npm run update:production
   ```

### When to Use OTA vs App Store Updates

**Use OTA for:**
- JavaScript code changes
- Asset updates (images, fonts)
- Bug fixes
- UI improvements
- New features that don't require native changes

**Use App Store updates for:**
- Native code changes
- New permissions
- App icon changes
- Major version increments
- New native dependencies

## 📊 Version Management

### For App Store Updates:
```bash
# Patch version (1.0.0 → 1.0.1)
npm version patch

# Minor version (1.0.0 → 1.1.0)  
npm version minor

# Major version (1.0.0 → 2.0.0)
npm version major
```

### Build Number Increment:
Always increment build number for each submission:
- Update `buildNumber` in `app.json`
- Build number must be unique for each submission

## 🚫 Common Rejection Reasons

### Critical (Will Cause Rejection):
1. ❌ Missing privacy policy
2. ❌ Missing support contact
3. ❌ App crashes on launch
4. ❌ Broken core functionality
5. ❌ External links to non-Apple app stores

### All Resolved in SourceView Together! ✅

### Medium Priority:
1. ⚠️ Poor app performance
2. ⚠️ Incomplete metadata
3. ⚠️ Screenshots not matching app content

### Low Priority:
1. 💡 UI improvements
2. 💡 Better app description
3. 💡 More comprehensive help content

## 📞 Support Information

- **Developer Email**: sourceviewbible@gmail.com
- **App Category**: Reference/Religious
- **Target Audience**: Christian community, Bible study groups
- **Content Rating**: 4+ (All Ages)

## 🎯 Success Metrics

Track these metrics post-launch:
- App Store rating and reviews
- Download numbers
- User retention
- Crash reports (should be near 0%)
- Feature usage analytics

## 🔧 Troubleshooting

### Build Fails:
1. Run `npm run prepare:appstore` to check configuration
2. Ensure all dependencies are up to date
3. Clear Expo cache: `expo r -c`
4. Check iOS simulator/device compatibility

### Submission Rejected:
1. Review Apple's feedback carefully
2. Fix all mentioned issues
3. Increment build number
4. Resubmit

### OTA Updates Not Working:
1. Verify `runtimeVersion` compatibility
2. Check network connectivity
3. Ensure updates are published to correct branch

---

## 🚀 Ready for Launch!

Your SourceView Together app is now configured for Apple App Store submission with:
- ✅ Proper versioning (1.0.0, Build 1)
- ✅ Production-safe logging
- ✅ Apple compliance (privacy, support)
- ✅ OTA update compatibility
- ✅ Professional app metadata

**Next Command**: `npm run build:ios`

Good luck with your App Store launch! 🎉
