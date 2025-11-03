# French Localization Implementation Plan

## Executive Summary
This document outlines the comprehensive plan to add native French language support to SourceView Together. The app already has a robust internationalization (i18n) infrastructure using react-i18next, and a complete French translation file (FRA-UI.json) is ready with extensive translations.

## Current State Analysis

### ✅ Already Implemented
1. **i18next Infrastructure**: Fully configured with react-i18next
2. **French Translation File**: `assets/data/FRA-UI.json` contains comprehensive French translations including:
   - All UI elements (navigation, settings, buttons, labels)
   - Bible book names and abbreviations
   - Segment titles (365 Bible stories)
   - Key passages and categories
   - Mission app content
   - Reading plans and challenges
   - Emoji reactions and spiritual practice guides
   - Group reading features
   - Achievement and streak messages

3. **Language Selection UI**: SettingsModal has language picker ready (currently commented out)
4. **Language Persistence**: Settings management system can save/load language preference
5. **Context Integration**: AppSettingsContext manages language state
6. **Translation Hook**: `useTranslation` hook available for components

### ⚠️ Issues to Address
1. **Language Support Limited**: TypeScript types restrict to `en` only
2. **French Commented Out**: i18n config has French commented out
3. **Hardcoded Strings**: Many UI components have English text hardcoded instead of using translation keys
4. **SettingsModal**: Not using translation keys for its own labels

## Implementation Phases

### Phase 1: Enable French Infrastructure (Quick Win)
**Estimated Time**: 30 minutes

#### 1.1 Update Type Definitions
**File**: `context/SyncAppSettingsContext.tsx` (line 13)
```typescript
// Change from:
export type SupportedLanguage = 'en';

// To:
export type SupportedLanguage = 'en' | 'fr';
```

**Files to Update**:
- `context/AppSettingsContext.tsx` (if SupportedLanguage defined there)
- Any other files importing SupportedLanguage

#### 1.2 Enable French in i18n Configuration
**File**: `config/i18n.ts`
```typescript
// Uncomment French import:
import UI_FRA from '@/assets/data/FRA-UI.json';

// Add French to resources:
resources: {
  en: { translation: UI_ENG },
  fr: { translation: UI_FRA },
},
```

#### 1.3 Enable French in Settings Modal
**File**: `components/navigation/SettingsModal.tsx` (line 43-47)
```typescript
const languages: { label: string; value: SupportedLanguage }[] = [
  { label: 'English', value: 'en' },
  { label: 'Français', value: 'fr' },
];
```

### Phase 2: Internationalize SettingsModal (Test Case)
**Estimated Time**: 1 hour

Replace all hardcoded strings in SettingsModal with translation keys:

**Current Hardcoded Text**:
- "Settings" → `t('UI.settings.title')`
- "Font Size" → `t('UI.settings.fontSize')`
- "Language" → `t('UI.settings.language')`
- "Dark Mode" → `t('UI.settings.darkMode')`
- "Lock Screen Orientation" → `t('UI.settings.lockOrientation')`
- "Close" → `t('UI.settings.close')`

This serves as a proof-of-concept before larger refactoring.

### Phase 3: Audit and Prepare Translation Keys
**Estimated Time**: 2 hours

#### 3.1 Compare JSON Files
Verify that FRA-UI.json has all keys present in UI-ENG.json:
- Check for missing keys
- Validate structure consistency
- Ensure all new features have French translations

#### 3.2 Identify Additional Translation Needs
Search codebase for hardcoded English strings:
```bash
# Find common patterns:
grep -r "\"[A-Z][^\"]*\"" app/
grep -r "'[A-Z][^']*'" app/
```

Create list of strings that need translation keys added to both JSON files.

### Phase 4: Internationalize Core App Screens
**Estimated Time**: 4-6 hours

#### Priority Order:
1. **Home Screen** (`app/(tabs)/Home.tsx`)
   - Welcome messages
   - Section headers
   - Button labels
   - Stats labels

2. **Landing/Onboarding** (`app/(tabs)/index.tsx`)
   - Onboarding slides content
   - Feature descriptions
   - Call-to-action buttons

3. **About Screen** (`app/About.tsx`)
   - App description
   - Legal links
   - Version info

4. **Reading Plans** (`app/(tabs)/Plan.tsx`, `app/(tabs)/Reading-Challenges.tsx`)
   - Plan/Challenge titles (may come from JSON)
   - Progress indicators
   - Modal messages
   - Button labels

5. **Search Screen** (`app/(tabs)/search.tsx`)
   - Search placeholder
   - Filter labels
   - Empty states

6. **Achievements** (`app/(tabs)/achievements.tsx`)
   - Achievement names/descriptions
   - Streak messages
   - Progress labels

### Phase 5: Internationalize Components
**Estimated Time**: 4-6 hours

#### 5.1 Bible Reading Components
- `components/Bible/Intro.tsx`
- `components/Bible/Segment.tsx`
- `components/Bible/BibleBlock.tsx`
- Error messages
- "Content not available" messages
- Reading time estimates

#### 5.2 Group Reading Components
- `components/GroupReading/GroupSetupScreen.tsx`
- `components/GroupReading/HostWaitingScreen.tsx`
- `components/GroupReading/ReadingModeModal.tsx`
- Role names (God, Narrator, Main Character, Others)
- Instructions and labels
- Status messages

#### 5.3 Questions Component
- `components/Questions.tsx`
- Audience selector labels (Family, School, Small Group)
- Question navigation
- Empty states

#### 5.4 Emoji/Reactions Components
- `components/EmojiHandler.tsx`
- `components/EmojiPicker.tsx`
- Reaction type names
- Spiritual practice instructions
- Note input placeholders

#### 5.5 Loading and Status Components
- `components/loading/LoadingScreen.tsx`
- Loading stage messages
- Progress indicators
- `components/StatusIndicator.tsx`

#### 5.6 Navigation Components
- `components/navigation/TabBar.tsx` (if exists)
- Navigation labels
- Screen titles

### Phase 6: Internationalize Dynamic Content
**Estimated Time**: 2-3 hours

#### 6.1 Bible Segment Titles
Currently using `SegmentTitles.json`. Need to:
1. Check if FRA-UI.json already has these (it likely does based on file size)
2. Create helper function to get localized segment titles
3. Update all references to segment titles to use localized version

#### 6.2 Reading Plans & Challenges
Verify French translations exist for:
- Plan names/descriptions
- Challenge names/descriptions
- Category names

#### 6.3 Achievement Descriptions
Ensure all achievement titles and descriptions have French versions

### Phase 7: Handle Special Cases
**Estimated Time**: 2-3 hours

#### 7.1 Date and Time Formatting
```typescript
// Use date-fns with locale
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';

const locale = language === 'fr' ? fr : enUS;
format(date, 'PPP', { locale });
```

#### 7.2 Pluralization
```json
{
  "storiesRead": "{{count}} story read",
  "storiesRead_plural": "{{count}} stories read"
}
```

```typescript
t('storiesRead', { count: numStories })
```

French JSON needs plural forms where applicable.

#### 7.3 Number Formatting
```typescript
// French uses spaces for thousands, comma for decimals
new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US').format(number)
```

#### 7.4 String Interpolation
Verify all interpolated strings use i18next syntax:
```json
{
  "greeting": "Hello, {{name}}!",
  "progress": "{{current}} of {{total}} complete"
}
```

### Phase 8: Testing & Quality Assurance
**Estimated Time**: 3-4 hours

#### 8.1 Functional Testing
- [ ] Settings modal opens and displays French option
- [ ] Switching to French updates all visible UI elements
- [ ] Language preference persists after app restart
- [ ] Switching back to English works correctly
- [ ] No missing translation keys (check for English fallbacks)

#### 8.2 Visual Testing
- [ ] French text fits within UI elements (check for overflow)
- [ ] Line breaks occur appropriately
- [ ] French characters display correctly (é, è, à, ç, etc.)
- [ ] Multi-line labels maintain proper formatting
- [ ] Modal and button text doesn't clip

#### 8.3 Navigation Testing
- [ ] Tab bar labels translate correctly
- [ ] Screen titles translate
- [ ] Breadcrumb navigation (if any) translates
- [ ] Back button labels translate

#### 8.4 Content Testing
- [ ] Segment titles display in French
- [ ] Bible book names appear in French
- [ ] Questions display in French
- [ ] Achievement names/descriptions in French
- [ ] Plan/challenge descriptions in French

#### 8.5 Edge Cases
- [ ] Empty states display French messages
- [ ] Error messages appear in French
- [ ] Loading messages show in French
- [ ] Placeholder text is French
- [ ] Toast/alert messages translate

### Phase 9: Performance & Optimization
**Estimated Time**: 1-2 hours

#### 9.1 Bundle Size
- Monitor impact of adding French translations
- Consider code splitting if necessary
- Lazy load translation files if bundle size is concern

#### 9.2 Loading Performance
- Ensure language switching is smooth
- Verify no visual flash when changing languages
- Test with React DevTools Profiler

#### 9.3 Memory Usage
- Verify both language files can coexist in memory
- Test on lower-end devices

### Phase 10: Documentation & Deployment
**Estimated Time**: 2 hours

#### 10.1 Update Documentation
- [ ] Update README with language support info
- [ ] Document how to add new translations
- [ ] Create translation contributor guide
- [ ] Add screenshots showing French UI

#### 10.2 Developer Documentation
- [ ] Document translation key naming conventions
- [ ] Provide examples of using `t()` function
- [ ] Explain pluralization approach
- [ ] Document dynamic content translation strategy

#### 10.3 User-Facing Updates
- [ ] Update App Store description mentioning French support
- [ ] Add French to app metadata
- [ ] Update screenshots to show language toggle
- [ ] Prepare release notes in English and French

#### 10.4 Testing Builds
- [ ] Create test build with French enabled
- [ ] TestFlight beta testing with French speakers
- [ ] Gather feedback on translation quality
- [ ] Fix any awkward translations reported

## Technical Considerations

### Best Practices for i18next in React Native

1. **Use Translation Hook Consistently**
```typescript
import { useTranslation } from '@/hooks/useTranslation';

const { t } = useTranslation();
<Text>{t('UI.home.title')}</Text>
```

2. **Handle Interpolation**
```typescript
t('UI.home.greeting', { name: userName })
```

3. **Use Namespace Separation**
Already using "UI" namespace, consider adding:
- "Errors"
- "Validation"
- "Success"

4. **Avoid Inline Translations**
Bad:
```typescript
<Text>Home</Text>
```
Good:
```typescript
<Text>{t('UI.navigation.home')}</Text>
```

5. **Handle Missing Keys Gracefully**
```typescript
// In i18n config:
saveMissing: true,
missingKeyHandler: (lng, ns, key) => {
  console.warn(`Missing translation: ${key}`);
}
```

### React Native Specific Considerations

1. **Metro Bundler Config**
Ensure JSON files are included in asset catalog.

2. **Font Support**
Verify fonts support French characters (accents, ligatures).

3. **RTL Support**
Not needed for French, but good to keep in mind for future languages (Arabic, Hebrew).

4. **Platform Differences**
Test on both iOS and Android as some UI elements may display differently.

### Potential Issues & Solutions

#### Issue 1: French Text Overflow
**Solution**: Use `numberOfLines` prop or increase container size
```typescript
<Text numberOfLines={2} ellipsizeMode="tail">
  {t('UI.longText')}
</Text>
```

#### Issue 2: Translation Keys Not Found
**Solution**: Verify JSON structure, check for typos
```typescript
// Add fallback
t('UI.missing.key', { defaultValue: 'Default text' })
```

#### Issue 3: Dynamic Content Not Translating
**Solution**: Create translation mapping functions
```typescript
const getLocalizedSegmentTitle = (segmentId: string, language: string) => {
  const key = language === 'fr' ? `FRA-${segmentId}` : segmentId;
  return SegmentTitles[key];
}
```

#### Issue 4: Performance Issues
**Solution**: Memoize translations
```typescript
const translatedText = useMemo(() => t('UI.key'), [language]);
```

## Translation Quality Assurance

### Review Checklist for FRA-UI.json

1. **Completeness**
   - [ ] All UI-ENG.json keys have French equivalents
   - [ ] No English text in French file
   - [ ] All interpolation variables preserved

2. **Consistency**
   - [ ] Terminology consistent across app
   - [ ] Formal vs informal "you" (tu/vous) consistent
   - [ ] Brand name handling consistent

3. **Cultural Appropriateness**
   - [ ] Idiomatic expressions adapted (not literal translations)
   - [ ] Religious terminology appropriate for French speakers
   - [ ] Example scenarios culturally relevant

4. **Technical Accuracy**
   - [ ] JSON structure valid
   - [ ] No syntax errors
   - [ ] Special characters properly escaped

### Consider Professional Review
For a religious application, consider having translations reviewed by:
- French-speaking theologians
- Native French speakers from different regions (France, Quebec, Africa)
- Professional translators specializing in religious content

## Timeline Summary

| Phase | Time Estimate | Priority |
|-------|--------------|----------|
| Phase 1: Enable Infrastructure | 30 min | Critical |
| Phase 2: SettingsModal PoC | 1 hour | Critical |
| Phase 3: Translation Audit | 2 hours | High |
| Phase 4: Core Screens | 4-6 hours | High |
| Phase 5: Components | 4-6 hours | High |
| Phase 6: Dynamic Content | 2-3 hours | Medium |
| Phase 7: Special Cases | 2-3 hours | Medium |
| Phase 8: Testing | 3-4 hours | High |
| Phase 9: Optimization | 1-2 hours | Low |
| Phase 10: Documentation | 2 hours | Medium |
| **TOTAL** | **22-32 hours** | |

## Success Metrics

1. **Coverage**: 100% of user-facing text translatable
2. **Quality**: Zero missing translation keys in production
3. **Performance**: No measurable impact on app load time
4. **UX**: Seamless language switching with no visual glitches
5. **Adoption**: Track % of users who select French

## Future Considerations

### Additional Languages
The infrastructure supports easy addition of:
- German (DE) - UI-GER.json mentioned in comments
- Spanish (ES)
- Portuguese (PT)
- Other languages as needed

### Continuous Localization
- Set up process for adding new features with translations from day 1
- Consider using localization management platform (Lokalise, Crowdin, Phrase)
- Implement automated checks for missing translation keys

### Community Translations
- Consider allowing community to submit translation improvements
- Create feedback mechanism for translation quality issues
- Version control for translation files

## Resources

### Tools
- **i18next Debugging**: Enable debug mode to see which keys are loaded
- **i18next Ally**: VS Code extension for translation management
- **JSON Lint**: Validate JSON structure

### Documentation
- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [React Native Localization Best Practices](https://reactnative.dev/docs/platform-specific-code)

### Testing
- Test on devices set to French system language
- Use iOS/Android accessibility features to verify proper text rendering
- Test with different font sizes (accessibility)

## Conclusion

This comprehensive plan provides a structured approach to implementing full French language support in SourceView Together. The infrastructure is already in place, and the French translations are prepared. The main work involves:

1. **Quick Win**: Enable French in settings (30 min)
2. **Systematic Refactoring**: Replace hardcoded strings with translation keys (15-20 hours)
3. **Quality Assurance**: Thorough testing and refinement (5-7 hours)

The modular approach allows for incremental implementation, with Phase 1-2 providing immediate value while Phases 3-10 can be completed iteratively.

