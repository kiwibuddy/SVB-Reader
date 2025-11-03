# Quick Translation Implementation Guide

## 🚀 How to Add French to Any Component (5 Steps)

### Step 1: Import the translation hook
At the top of your component file:
```typescript
import { useTranslation } from '@/hooks/useTranslation';
```

### Step 2: Use the hook in your component
```typescript
const YourComponent = () => {
  const { t } = useTranslation();
  // ... rest of your component
```

### Step 3: Find your English text
Look for hardcoded English strings like:
```typescript
<Text>Welcome to SourceView</Text>
<Text>Settings</Text>
<Button title="Get Started" />
```

### Step 4: Replace with t() function
```typescript
<Text>{t('UI.landing.heading')}</Text>
<Text>{t('UI.settings.title')}</Text>
<Button title={t('UI.landing.getStarted')} />
```

### Step 5: Verify the key exists
Check `assets/data/UI-ENG.json` and `assets/data/FRA-UI.json` to ensure your key exists.

## 📋 Translation Key Reference

All keys follow the pattern: `UI.section.key`

### Available Sections

#### `UI.navigation.*`
- `home`, `emoji`, `achievements`, `search`, `title`

#### `UI.settings.*`
- `title`, `fontSize`, `darkMode`, `lockOrientation`, `language`, `close`

#### `UI.landing.*`
- `title`, `subtitle`, `heading`, `subheading`, `getStarted`

#### `UI.home.*`
- `readingPlans`, `plansAvailable`, `readingChallenges`, `challengesAvailable`
- `heading`, `subheading`, `continueReading`, `lastRead`, `tapToContinue`
- `dayStreak`, `storiesRead`, `activePlans`, `jumpRightIn`
- `beginReadingJourney`, `start`, `resumeReading`, `complete`, `next`
- `recentActivity`, `readingJourney`, `favoriteBook`, `favoriteStory`
- `mostUsedReaction`, `completion`

#### `UI.about.*`
- `title`, `description`, `version`

#### `UI.bibleBlock.*`
- `addReaction`, `removeReaction`, `chooseEmoji`

#### `UI.planPage.*`
- `availablePlans`, `progress`, `startPlan`, `continuePlan`, `pausePlan`, `resumePlan`

#### `UI.challengePage.*`
- `activeTitle`, `seasonalTitle`, `topicalTitle`
- `startChallenge`, `continueChallenge`, `pauseChallenge`, `resumeChallenge`

#### `UI.emojiPage.*`
- `title`, `subtitle`, `verses`, `recentReactions`, `tapToCollapse`, `tapToSeeSteps`
- `goToSegment`, `viewVersePrompt`, `cancel`, `go`
- `emojiTypes.love`, `emojiTypes.agree`, `emojiTypes.reflecting`, `emojiTypes.praying`
- `emojiDescriptions.love.*`, `emojiDescriptions.agree.*`, etc.

#### `UI.achievements.*`
- `achievements`, `streakCount`, `unlocked`, `locked`

#### `UI.search.*`
- `title`, `subtitle`, `placeholder`, `clearSearch`, `goTo`, `noResults`
- `recentSearches`, `clearHistory`, `searchResults`, `searching`, `tryAgain`
- `filters.all`, `filters.oldTestament`, `filters.newTestament`
- `storiesRead`

#### `UI.readingMode.*`
- `chooseRole`, `narrator`, `god`, `mainCharacter`, `others`, `questions`
- `previousSegment`, `nextSegment`

#### `UI.loading.*`
- `initializing`, `loadingDatabase`, `loadingContent`
- `preparingReading`, `almostReady`, `complete`

## 🎨 Advanced Usage

### With Variables
```typescript
// JSON:
{
  "progress": "Progress: {percent}%"
}

// Component:
<Text>{t('UI.planPage.progress', { percent: 75 })}</Text>
// Output: "Progress: 75%"
```

### With Pluralization
```typescript
// JSON:
{
  "streakCount": "{count} day",
  "streakCount_plural": "{count} days"
}

// Component:
<Text>{t('UI.achievements.streakCount', { count: days })}</Text>
// Output: "1 day" or "5 days"
```

### In Styles or Props
```typescript
// For placeholders:
<TextInput 
  placeholder={t('UI.search.placeholder')} 
/>

// For button titles:
<Button 
  title={t('UI.landing.getStarted')} 
  onPress={handleStart}
/>

// For accessibility:
<Pressable 
  accessibilityLabel={t('UI.settings.close')}
  onPress={onClose}
>
```

## ✅ Checklist for Each Component

- [ ] Import `useTranslation` hook
- [ ] Add `const { t } = useTranslation();` to component
- [ ] Identify all hardcoded English strings
- [ ] Replace each string with `t('UI.section.key')`
- [ ] Test in English (should look the same)
- [ ] Switch to French in Settings
- [ ] Verify French text displays correctly
- [ ] Check for text overflow issues
- [ ] Commit changes

## 🐛 Troubleshooting

### Text shows translation key instead of actual text
**Problem**: `t('UI.missing.key')` displays as "UI.missing.key"
**Solution**: Key doesn't exist in JSON file. Add it to both English and French files.

### Text doesn't change when switching languages
**Problem**: Text stays in English even after selecting French
**Solution**: 
1. Make sure you're using `t()` function, not hardcoded string
2. Verify the component re-renders after language change
3. Check that the key exists in French JSON

### Text is cut off or overflows
**Problem**: French text is longer and doesn't fit
**Solution**: 
```typescript
// Add flexible sizing:
<Text numberOfLines={2} ellipsizeMode="tail">
  {t('UI.long.text')}
</Text>

// Or increase container width:
style={{ minWidth: 200 }}
```

## 📁 Files to Know

### Translation Files
- `assets/data/UI-ENG.json` - English translations
- `assets/data/FRA-UI.json` - French translations

### Configuration
- `config/i18n.ts` - i18next setup
- `hooks/useTranslation.ts` - Translation hook
- `context/AppSettingsContext.tsx` - Language state management

### Examples
- `components/navigation/SettingsModal.tsx` - Fully translated example
- `components/loading/LoadingScreen.tsx` - Another complete example

## 🎯 Priority Order

Translate in this order for maximum user impact:

1. **Settings Modal** ✅ (Already done)
2. **Loading Screen** ✅ (Already done)
3. **Landing/Onboarding** - First impression
4. **Home Screen** - Most viewed screen
5. **About Screen** - Information seekers
6. **Plans & Challenges** - Core functionality
7. **Search** - Navigation
8. **Bible Reading** - Core content
9. **Group Features** - Collaboration
10. **Questions** - Engagement

## 💾 Quick Commands

### Verify JSON is valid:
```bash
node -e "require('./assets/data/UI-ENG.json'); console.log('✓ English JSON valid')"
node -e "require('./assets/data/FRA-UI.json'); console.log('✓ French JSON valid')"
```

### Test a specific translation:
```bash
node -e "const eng = require('./assets/data/UI-ENG.json'); console.log(eng.UI.settings.title)"
node -e "const fra = require('./assets/data/FRA-UI.json'); console.log(fra.UI.settings.title)"
```

### Find hardcoded strings (examples to search for):
```bash
grep -r "\"[A-Z][a-z]* [A-Z]" app/
grep -r "'[A-Z][a-z]* [A-Z]" app/
```

## 🎓 Best Practices

1. **Always use translation keys**, never hardcode text
2. **Test both languages** after making changes
3. **Keep keys organized** by section/screen
4. **Be consistent** with key naming
5. **Consider text length** - French is often 20-30% longer
6. **Use semantic keys** - `UI.home.greeting` not `UI.home.text1`
7. **Provide context** in key names - `confirmDelete` not just `confirm`

## 🆘 Need Help?

1. Check `docs/FRENCH_LOCALIZATION_PLAN.md` for comprehensive guide
2. Check `docs/FRENCH_IMPLEMENTATION_SUMMARY.md` for current status
3. Look at `components/navigation/SettingsModal.tsx` for working example
4. Review i18next docs: https://www.i18next.com/

---

**Ready to translate? Pick a file and follow the 5 steps above!** 🚀

