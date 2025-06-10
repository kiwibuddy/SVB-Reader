# App Store Connect Setup Guide - SVB Youth Reader

## 🎯 STEP-BY-STEP APP STORE CONNECT CONFIGURATION

### **1. CREATE NEW APP**
- Log in to [App Store Connect](https://appstoreconnect.apple.com)
- Click "My Apps" → "+" → "New App"
- **Platform:** iOS
- **Name:** `SVB Youth Reader`
- **Primary Language:** English (U.S.)
- **Bundle ID:** `com.kiwibuddy.svbyouthreader`
- **SKU:** `svb-youth-reader-001`

### **2. APP INFORMATION**

#### **Localizable Information**
**App Name:** `SVB Youth Reader`

**App Subtitle:** `Collaborative Scripture Reading`

**App Description:** (Copy exactly)
```
Transform Bible reading into a shared experience with friends and family. Assign color-coded roles, react to verses, and grow together through scripture. Perfect for youth groups, families, and study circles.

KEY FEATURES:
• Collaborative reading for 2-4 people
• Color-coded speaking roles (Narrator, God, Characters, Others)
• Emoji reactions to express spiritual practices
• Reading streak tracking and achievements
• Flexible reading plans and challenges
• Dark/light modes and text customization

SOCIAL BIBLE READING REIMAGINED:
No more confusion about who reads what. Each person's lines glow when it's their turn, making scripture come alive through multiple voices.

REACT & REFLECT:
Long-press verses to mark them with heart (love), pray (moved to prayer), think (makes you ponder), or thumbs up (strongly agree).

TRACK YOUR GROWTH:
Watch your reading streaks grow, earn achievement badges, and see your progress through Old and New Testament books.

PERFECT FOR:
• Youth groups and Bible studies
• Families with teens
• College roommates
• Friend groups exploring faith
• Couples reading together

The Bible was meant to be experienced in community. Download SVB Youth Reader and rediscover scripture through shared reading.
```

**Keywords:** (Copy exactly - 100 character limit)
```
Bible,Scripture,Reading,Social,Collaborative,Study,Christian,Youth,Devotional,Group
```

**Support URL:** `mailto:support@svbyouthreader.com`

**Marketing URL:** `https://svbyouthreader.com` (optional)

#### **General App Information**

**App Icon:** Upload your 1024 × 1024 px icon from `assets/images/icon.png`

**Primary Category:** Reference

**Secondary Category:** Education

**Content Rights:** Does not use third-party content

### **3. AGE RATING**

**Age Rating:** 4+
- Violence: None
- Sexual Content: None
- Nudity: None
- Profanity/Crude Humor: None
- Alcohol/Tobacco/Drug Use: None
- Mature/Suggestive Themes: None
- Horror/Fear Themes: None
- Gambling: None
- Unrestricted Web Access: None
- User Generated Content: None (since reactions are local)

### **4. APP REVIEW INFORMATION**

**Contact Information:**
- **First Name:** [Your First Name]
- **Last Name:** [Your Last Name]  
- **Phone Number:** [Your Phone Number]
- **Email:** support@svbyouthreader.com

**Demo Account:** (Leave blank - no account required)

**Notes:** 
```
SVB Youth Reader is a collaborative Bible reading app that works entirely offline with local data storage. No user accounts or internet connection required.

Key features to test:
1. Select a Bible passage and assign reading roles (2-4 people)
2. Long-press verses to add emoji reactions (❤️ 👍 🤔 🙏)
3. View reading progress and streaks in achievements
4. Test dark/light mode switching in settings
5. Verify text size adjustment works properly

All data is stored locally using SQLite. The app includes comprehensive privacy policy and terms of service accessible from the About page.
```

**Attachment:** (None needed)

### **5. VERSION INFORMATION**

**Version:** 1.1.0

**Build:** 1 (will auto-increment with EAS)

**Copyright:** © 2024 KiwiBuddy

**What's New in This Version:**
```
🎉 Welcome to SVB Youth Reader!

✨ COLLABORATIVE BIBLE READING
• Read together with 2-4 friends or family members
• Color-coded roles make it clear who reads what
• Glowing text indicators show when it's your turn

💬 INTERACTIVE REACTIONS
• Long-press verses to add meaningful emoji reactions
• Express love, prayer, contemplation, and agreement
• Build deeper connections with scripture

📊 TRACK YOUR JOURNEY
• Maintain reading streaks and earn achievements
• See your progress through Old and New Testament
• Flexible reading plans for any schedule

🎨 PERSONALIZED EXPERIENCE
• Dark and light mode support
• Adjustable text sizes for comfortable reading
• Multiple language support

Perfect for youth groups, families, study circles, and friend groups ready to experience the Bible in community!
```

### **6. APP PRIVACY**

**Data Collection:** Select "No, this app does not collect user data"

**Privacy Policy URL:** Leave blank (policy is within the app)

**User Privacy Choices URL:** Leave blank

### **7. PRICING AND AVAILABILITY**

**Price:** Free

**Availability:** All countries/regions

**App Store Distribution:** Available on the App Store

### **8. SCREENSHOTS REQUIRED**

#### **iPhone 6.7" Display (REQUIRED)**
Upload 5-6 screenshots (1290 × 2796 pixels):
1. **Hero Screen:** Main reading interface with roles
2. **Social Features:** Emoji reactions on verses
3. **Progress Tracking:** Achievements and streaks
4. **Group Reading:** Multiple people experience
5. **Customization:** Settings and personalization
6. **Reading Plans:** Challenge selection screen

#### **iPad Pro 12.9" Display (REQUIRED for iPad)**
Upload 5-6 screenshots (2048 × 2732 pixels):
- Same content as iPhone but optimized for iPad layout

### **9. BUILD UPLOAD**

Use EAS Build to upload your production build:
```bash
npx eas build --platform ios --profile production
npx eas submit --platform ios --profile production
```

### **10. SUBMISSION CHECKLIST**

Before submitting:
- [ ] All metadata fields completed
- [ ] App icon uploaded (1024×1024 px)
- [ ] Screenshots uploaded for all required sizes
- [ ] Age rating configured as 4+
- [ ] App description includes keywords naturally
- [ ] Contact information is accurate
- [ ] Build uploaded and processed successfully
- [ ] App review notes explain key features

---

## 🚀 POST-SETUP ACTIONS

### **After App Store Connect Setup:**
1. **Test Build:** Download from TestFlight and verify all features work
2. **Screenshots:** Take professional screenshots using the content strategy
3. **Submit for Review:** Click "Submit for Review"
4. **Monitor Status:** Check for reviewer feedback (typically 24-48 hours)

### **Common Approval Tips:**
- Ensure app description matches actual functionality
- All features mentioned in description must work in the build
- Screenshots should show real app content, not mockups
- Privacy policy and terms must be easily accessible
- App should launch quickly and work smoothly

---

## 📋 QUICK COPY-PASTE CHECKLIST

**App Name:** SVB Youth Reader
**Subtitle:** Collaborative Scripture Reading  
**Keywords:** Bible,Scripture,Reading,Social,Collaborative,Study,Christian,Youth,Devotional,Group
**Category:** Reference (Primary), Education (Secondary)
**Age Rating:** 4+
**Support Email:** support@svbyouthreader.com
**Bundle ID:** com.kiwibuddy.svbyouthreader

✅ **Your app metadata is now complete and optimized for maximum App Store discoverability!** 