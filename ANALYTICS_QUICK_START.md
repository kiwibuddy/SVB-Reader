# Analytics Implementation - Quick Start

## ✅ Implementation Complete!

All code has been added to your app. You're ready to deploy!

---

## 🚀 Quick Start (15 Minutes)

### 1. Get PostHog API Key (5 min)

1. Go to https://posthog.com/signup
2. Sign up (free)
3. Create project: "SourceView Together"
4. Copy your API key (looks like: `phc_xxxxxxxxxxxxx`)

### 2. Add API Key to Your App (2 min)

Open: `services/analytics.ts`

```typescript
// Line 11-12 - Replace with your actual key:
const POSTHOG_API_KEY = 'phc_YOUR_ACTUAL_KEY_HERE';
const POSTHOG_HOST = 'https://us.i.posthog.com';
```

### 3. Update Store Privacy Policies (5 min)

**Apple App Store Connect:**
1. Go to App Privacy section
2. Add: "Product Interaction" data type
3. Select: Analytics, Not linked to user, Not used for tracking

**Google Play Console:**
1. Go to Data Safety section
2. Add: App interactions data
3. Mark as: Optional, Used for Analytics

**Push Privacy Policy to GitHub:**
```bash
git add PRIVACY_POLICY.md
git commit -m "Update privacy policy for analytics"
git push
```

### 4. Deploy via OTA (3 min)

```bash
eas update --branch production --message "Add anonymous analytics"
```

✅ **Done!** Users will get the update within 24 hours.

---

## 📊 What Happens Next

**For Users:**
1. Open app → Consent dialog appears
2. Choose "Help Improve" or "No Thanks"
3. If they accept → anonymous analytics starts
4. They can change their mind anytime in About → Analytics Settings

**For You:**
1. Log into https://app.posthog.com
2. Go to "Events" tab
3. See real-time analytics as users interact with your app!

---

## 📈 Key Insights You'll Get

- **Most Popular Reading Plans:** Which plans users start/complete
- **Feature Usage:** Which features are used most (emojis, questions, etc.)
- **Platform Split:** iOS vs Android usage
- **Session Patterns:** How long and often users engage
- **Group Reading Adoption:** How many try this feature

---

## 🎯 Events Being Tracked

### Core Events:
- `reading_plan_started` / `paused` / `resumed` / `completed`
- `story_started` - When user opens a story
- `story_completed` - When user scrolls to 90%+ of story
- `group_reading_started` - Group session initiated
- `reading_role_selected` - Role chosen for reading

### Feature Usage:
- `emoji_added` - Emoji reaction added
- `note_created` / `note_edited` - Notes usage
- `navigate_from_home` - Navigation from home screen
- `emoji_filter_used` - Filter applied in emoji page
- `navigation_filter_used` - Filter applied in navigation page

### Screen Views:
- Home, Reading Plans, Navigation, etc.

**All anonymous** - No personal data, reading content, or device IDs.

---

## 🔧 Files Changed

- ✅ `services/analytics.ts` - Analytics service (ADD API KEY HERE!)
- ✅ `components/AnalyticsConsentDialog.tsx` - Consent dialog
- ✅ `components/AnalyticsSettings.tsx` - Settings toggle
- ✅ `app/_layout.tsx` - Initialize analytics
- ✅ `app/(tabs)/ReadingPlans.tsx` - Track reading plans
- ✅ `app/(tabs)/Home.tsx` - Track screen view
- ✅ `components/EmojiHandler.tsx` - Track emoji usage
- ✅ `app/host-waiting.tsx` - Track group reading
- ✅ `app/About.tsx` - Add settings toggle
- ✅ `PRIVACY_POLICY.md` - Updated disclosure

---

## 📚 Full Documentation

- **Complete Setup Guide:** `POSTHOG_ANALYTICS_SETUP_GUIDE.md`
- **Implementation Options:** `ANALYTICS_IMPLEMENTATION_GUIDE.md`
- **Decision Framework:** `ANALYTICS_QUICK_DECISION_GUIDE.md`

---

## ⚠️ Before Deploying

**Make sure you:**
1. ✅ Added your PostHog API key to `services/analytics.ts`
2. ✅ Updated Apple App Store privacy info
3. ✅ Updated Google Play data safety info
4. ✅ Pushed updated privacy policy to GitHub
5. ✅ Tested locally (consent dialog appears)

---

## 🆘 Quick Troubleshooting

**Events not showing in PostHog?**
- Check API key is correct
- Wait 1-2 minutes (PostHog has slight delay)
- Verify user accepted consent (check About → Analytics Settings)

**Consent dialog not appearing?**
- It only shows once on first launch
- To reset for testing:
  ```typescript
  await AsyncStorage.removeItem('analytics_consent_asked');
  // Restart app
  ```

**Build errors?**
```bash
npm install --legacy-peer-deps
npx expo start --clear
```

---

## 💰 Cost

**Free** for 1 million events/month (you'll likely stay in free tier forever)

---

## 🎉 That's It!

You now have:
- ✅ Privacy-first analytics
- ✅ User consent required
- ✅ Full user control
- ✅ Real insights into app usage
- ✅ OTA deployable (no app store review)

**Next:** Add your API key and deploy! 🚀

---

*Questions? Check `POSTHOG_ANALYTICS_SETUP_GUIDE.md` for detailed instructions.*

