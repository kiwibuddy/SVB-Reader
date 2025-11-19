# Analytics Tracking Summary

**Last Updated:** November 19, 2025  
**Status:** ✅ Complete - Ready for Deployment

---

## 🎯 All Tracking Events Implemented

### 📖 Story & Reading Tracking

#### 1. **Story Started**
- **Event:** `story_started`
- **When:** User opens/navigates to a story
- **Location:** `app/(tabs)/[segment]/index.tsx`
- **Properties:**
  - `segment_id`: e.g., "S001"
  - `app_version`: "1.2.1"
  - `platform`: "ios" or "android"
  - `device_type`: "phone" or "tablet"

#### 2. **Story Completed**
- **Event:** `story_completed`
- **When:** User scrolls to 90% or more of the story
- **Location:** `app/(tabs)/[segment]/index.tsx` (handleScroll function)
- **Properties:**
  - `segment_id`: e.g., "S001"
  - `scroll_progress`: Percentage scrolled (90-100)

**What You'll Learn:**
- Which stories users complete vs. abandon
- Average completion rates per story
- Which stories are most engaging

---

### 📚 Reading Plans Tracking

#### 3. **Reading Plan Started**
- **Event:** `reading_plan_started`
- **When:** User starts a new reading plan or challenge
- **Location:** `app/(tabs)/ReadingPlans.tsx` (startPlanAction)
- **Properties:**
  - `plan_id`: e.g., "Bible1Year"
  - `plan_type`: "plan" or "challenge"

#### 4. **Reading Plan Paused**
- **Event:** `reading_plan_paused`
- **When:** User pauses an active plan
- **Location:** `app/(tabs)/ReadingPlans.tsx` (pausePlanAction)
- **Properties:**
  - `plan_id`: e.g., "Bible1Year"
  - `plan_type`: "plan" or "challenge"

#### 5. **Reading Plan Resumed**
- **Event:** `reading_plan_resumed`
- **When:** User resumes a paused plan
- **Location:** `app/(tabs)/ReadingPlans.tsx` (resumePlanAction)
- **Properties:**
  - `plan_id`: e.g., "Bible1Year"
  - `plan_type`: "plan" or "challenge"

#### 6. **Reading Plan Completed**
- **Event:** `reading_plan_completed`
- **When:** User completes or ends a plan
- **Location:** `app/(tabs)/ReadingPlans.tsx` (endPlanAction)
- **Properties:**
  - `plan_id`: e.g., "Bible1Year"
  - `plan_type`: "plan" or "challenge"

**What You'll Learn:**
- Most popular reading plans
- Completion rates by plan type
- Which plans users abandon vs. complete

---

### 🎭 Reading Roles Tracking

#### 7. **Reading Role Selected**
- **Event:** `reading_role_selected`
- **When:** User selects a reading role for group reading
- **Location:** `app/role-selection.tsx` (handleRoleSelection)
- **Properties:**
  - `role`: Selected role (e.g., "narrator", "character1", "character2")
  - `story_id`: Segment being read

**What You'll Learn:**
- How often users choose specific roles
- Which roles are most popular
- Role distribution in group sessions

---

### 👥 Group Reading Tracking

#### 8. **Group Reading Started**
- **Event:** `group_reading_started`
- **When:** Host starts a group reading session
- **Location:** `app/host-waiting.tsx` (handleStartReading)
- **Properties:**
  - `participant_count`: Number of participants
  - `story_id`: Segment being read

**What You'll Learn:**
- Group reading adoption rate
- Average group size
- Most popular stories for group reading

---

### 🏠 Navigation Tracking

#### 9. **Navigate from Home**
- **Event:** `navigate_from_home` (via `feature_used`)
- **When:** User navigates from home screen to a story
- **Location:** `app/(tabs)/Home.tsx` (handleIndividualReading)
- **Properties:**
  - `feature_name`: "navigate_from_home"
  - `segment_id`: Story being navigated to
  - `source`: "home_screen"

**What You'll Learn:**
- How often users navigate from home vs. other screens
- Which stories are accessed from home
- Home screen engagement

---

### 😀 Emoji & Reactions Tracking

#### 10. **Emoji Added**
- **Event:** `emoji_added` (via `feature_used`)
- **When:** User adds an emoji reaction to a Bible verse
- **Location:** `components/EmojiHandler.tsx`
- **Properties:**
  - `feature_name`: "emoji_added"
  - `segment_id`: Current story

**What You'll Learn:**
- Emoji feature usage rate
- How engaging the emoji feature is
- User interaction with content

---

### 📝 Notes Tracking

#### 11. **Note Created**
- **Event:** `note_created` (via `feature_used`)
- **When:** User creates a new note
- **Location:** `components/NoteInput.tsx` (handleSave)
- **Properties:**
  - `feature_name`: "note_created"
  - `note_length`: Character count of note

#### 12. **Note Edited**
- **Event:** `note_edited` (via `feature_used`)
- **When:** User edits an existing note
- **Location:** `components/NoteInput.tsx` (handleSave)
- **Properties:**
  - `feature_name`: "note_edited"
  - `note_length`: Character count of note

**What You'll Learn:**
- Notes feature adoption rate
- Average note length
- How often users edit vs. create new notes

---

### 🔍 Filter Usage Tracking

#### 13. **Emoji Filter Used**
- **Event:** `emoji_filter_used` (via `feature_used`)
- **When:** User applies a filter in the emoji/reactions page
- **Location:** `app/(tabs)/Reading-emoji.tsx` (toggleFilter)
- **Properties:**
  - `feature_name`: "emoji_filter_used"
  - `filter_category`: e.g., "testament", "sourceColor", "book", "hasNotes"
  - `filter_value`: Specific filter value selected

#### 14. **Navigation Filter Used**
- **Event:** `navigation_filter_used` (via `feature_used`)
- **When:** User applies a filter in the navigation page
- **Location:** `app/(tabs)/Navigation.tsx` (toggleFilter)
- **Properties:**
  - `feature_name`: "navigation_filter_used"
  - `filter_category`: e.g., "testament", "readingTime", "bookCategory", "speakers"
  - `filter_value`: Specific filter value selected

**What You'll Learn:**
- How often users use filters
- Which filter types are most popular
- Filter feature adoption rate

---

### 📱 Screen Views Tracking

#### 15. **Screen Views**
- **Events:** Various screen names
- **When:** User navigates to different screens
- **Locations:**
  - `app/(tabs)/Home.tsx` - "Home"
  - `app/(tabs)/ReadingPlans.tsx` - "Reading Plans"
- **Properties:**
  - Standard screen tracking (automatic via PostHog)

**What You'll Learn:**
- Most visited screens
- User navigation patterns
- Session flow through app

---

## 📊 Analytics Dashboard Insights

### Key Questions You Can Answer:

#### Engagement
- **Q:** "Are users completing stories they start?"  
  **A:** Compare `story_started` vs. `story_completed` counts

- **Q:** "Which features are most used?"  
  **A:** View `feature_used` breakdown by `feature_name`

- **Q:** "Do users engage with group reading?"  
  **A:** Count of `group_reading_started` events

#### Reading Plans
- **Q:** "Which reading plans are most popular?"  
  **A:** Count `reading_plan_started` by `plan_id`

- **Q:** "What are completion rates for each plan?"  
  **A:** Ratio of `reading_plan_completed` to `reading_plan_started` per plan

- **Q:** "Do users pause and resume plans?"  
  **A:** Count `reading_plan_paused` and `reading_plan_resumed` events

#### Feature Discovery
- **Q:** "Are filters being used?"  
  **A:** Count `emoji_filter_used` and `navigation_filter_used` events

- **Q:** "How popular is the notes feature?"  
  **A:** Count `note_created` and `note_edited` events

- **Q:** "Which filters are most useful?"  
  **A:** Breakdown of filter events by `filter_category` and `filter_value`

#### User Behavior
- **Q:** "How do users navigate the app?"  
  **A:** View screen flow and `navigate_from_home` counts

- **Q:** "Which roles do users prefer?"  
  **A:** Breakdown of `reading_role_selected` by `role`

---

## 🎯 Example PostHog Queries

### Most Popular Reading Plans
```
Event: reading_plan_started
Break down by: plan_id
Date range: Last 30 days
Visualization: Bar chart
```

### Story Completion Rate
```
Formula: (story_completed count / story_started count) * 100
Date range: Last 30 days
Visualization: Trend line
```

### Feature Adoption Funnel
```
1. story_started (baseline)
2. emoji_added (emoji feature)
3. note_created (notes feature)
4. emoji_filter_used (filters feature)

Shows: What % of users try each feature
```

### Filter Usage Breakdown
```
Event: emoji_filter_used
Break down by: filter_category
Date range: Last 7 days
Visualization: Pie chart
```

---

## 📋 Files Modified

| File | Purpose | Events Added |
|------|---------|--------------|
| `app/(tabs)/[segment]/index.tsx` | Story reading | `story_started`, `story_completed` |
| `app/(tabs)/ReadingPlans.tsx` | Reading plans | `reading_plan_started/paused/resumed/completed` |
| `app/(tabs)/Home.tsx` | Home navigation | `navigate_from_home`, Screen: "Home" |
| `app/role-selection.tsx` | Role selection | `reading_role_selected` |
| `app/host-waiting.tsx` | Group reading | `group_reading_started` |
| `components/EmojiHandler.tsx` | Emoji reactions | `emoji_added` |
| `components/NoteInput.tsx` | Notes | `note_created`, `note_edited` |
| `app/(tabs)/Reading-emoji.tsx` | Emoji filters | `emoji_filter_used` |
| `app/(tabs)/Navigation.tsx` | Navigation filters | `navigation_filter_used` |

---

## ✅ Privacy Compliance

### What We Track:
✅ Feature usage counts  
✅ Screen navigation patterns  
✅ Reading plan interactions  
✅ Filter usage statistics  
✅ Anonymous completion rates  

### What We DON'T Track:
❌ Personal information  
❌ Reading content (specific verses, passages)  
❌ Note content (only length)  
❌ Device identifiers  
❌ User names or emails  
❌ Location data  

---

## 🚀 Deployment Ready

All tracking code is complete and tested. No linting errors.

**Next Steps:**
1. Add your PostHog API key to `services/analytics.ts`
2. Update privacy policies in app stores
3. Deploy via `eas update`
4. Monitor PostHog dashboard

---

## 📈 Expected Event Volume

**Assuming 1,000 active users:**

| Event | Estimated/Month | Priority |
|-------|----------------|----------|
| `story_started` | ~15,000 | High |
| `story_completed` | ~10,000 | High |
| `reading_plan_started` | ~2,000 | High |
| `emoji_added` | ~8,000 | Medium |
| `note_created` | ~3,000 | Medium |
| `navigate_from_home` | ~6,000 | Medium |
| `emoji_filter_used` | ~1,500 | Low |
| `navigation_filter_used` | ~2,500 | Low |
| `reading_role_selected` | ~500 | Low |
| `group_reading_started` | ~400 | Low |

**Total:** ~50,000 events/month  
**PostHog Free Tier:** 1,000,000 events/month ✅

You'll comfortably stay in the free tier!

---

## 🎉 Summary

✅ **15 event types** tracking all major user interactions  
✅ **9 files modified** with tracking code  
✅ **No linting errors** - production ready  
✅ **Privacy compliant** - no personal data collected  
✅ **OTA deployable** - no app store review needed  
✅ **Free tier compatible** - well under 1M events/month  

**You now have comprehensive analytics to understand:**
- Which features users love
- Which reading plans are popular
- How users navigate your app
- Story completion rates
- Feature adoption rates
- Filter usage patterns

**Ready to deploy and start learning! 🚀**

---

*For deployment instructions, see `ANALYTICS_QUICK_START.md`*

