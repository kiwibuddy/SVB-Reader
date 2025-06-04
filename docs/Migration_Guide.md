# Design System Migration Guide

## 🚀 Getting Started

This guide will help you migrate existing components to use the new design system. Follow these steps to ensure consistent styling across your app.

## 📋 Migration Checklist

### Step 1: Update Imports
```tsx
// Replace old imports:
import { useAppSettings } from '@/context/AppSettingsContext';

// With new design system imports:
import { useAppSettings } from '@/context/AppSettingsContext';
import createAppStyles from '@/utils/styleHelpers';
```

### Step 2: Update Component Structure
```tsx
// OLD WAY:
const MyComponent = () => {
  const { colors, isDarkMode } = useAppSettings();
  const styles = createStyles(false, colors, isDarkMode);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
    </View>
  );
};

// NEW WAY:
const MyComponent = () => {
  const { theme } = useAppSettings();
  const styles = createAppStyles(theme);
  
  return (
    <View style={styles.layout.container}>
      <Text style={styles.typography.headlineMedium}>Hello</Text>
    </View>
  );
};
```

## 🎨 Common Migration Patterns

### 1. Container Layouts
```tsx
// OLD:
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
});

// NEW:
const { theme } = useAppSettings();
const styles = createAppStyles(theme);
// Use: styles.layout.container and styles.layout.content
```

### 2. Cards
```tsx
// OLD:
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
});

// NEW:
// Use: styles.cards.standard, styles.cards.compact, or styles.cards.large
```

### 3. Buttons
```tsx
// OLD:
const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

// NEW:
// Use: styles.buttons.primary and styles.buttons.primaryText
```

### 4. Typography
```tsx
// OLD:
const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondary,
    lineHeight: 22,
  },
});

// NEW:
// Use: styles.typography.headlineMedium and styles.typography.bodyLargeSecondary
```

## 📱 Page-by-Page Migration Examples

### Home Page Migration
```tsx
// OLD:
const HomeScreen = () => {
  const { colors, isDarkMode } = useAppSettings();
  const styles = createStyles(false, colors, isDarkMode);
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome</Text>
          <Text style={styles.welcomeText}>Ready to read?</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Stories</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// NEW:
const HomeScreen = () => {
  const { theme } = useAppSettings();
  const styles = createAppStyles(theme);
  
  return (
    <SafeAreaView style={styles.layout.container}>
      <ScrollView style={styles.layout.content}>
        <View style={styles.layout.section}>
          <Text style={styles.typography.headlineMedium}>Welcome</Text>
          <Text style={styles.typography.bodyLargeSecondary}>Ready to read?</Text>
        </View>
        
        <View style={[styles.layout.row, styles.layout.gapMd]}>
          <View style={[styles.cards.compact, styles.layout.centered]}>
            <Text style={styles.typography.titleLarge}>5</Text>
            <Text style={styles.typography.bodySmallSecondary}>Stories</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
```

### Card Component Migration
```tsx
// OLD:
const ChallengeCard = ({ challenge }) => {
  const { colors, isDarkMode } = useAppSettings();
  
  return (
    <View style={{
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 12,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    }}>
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
      }}>
        {challenge.title}
      </Text>
      
      <TouchableOpacity style={{
        backgroundColor: '#FF9800',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
      }}>
        <Text style={{
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: '600',
        }}>
          Start
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// NEW:
const ChallengeCard = ({ challenge }) => {
  const { theme } = useAppSettings();
  const styles = createAppStyles(theme);
  
  return (
    <View style={styles.cards.standard}>
      <Text style={[
        styles.typography.titleMedium,
        { marginBottom: theme.spacing.xs }
      ]}>
        {challenge.title}
      </Text>
      
      <TouchableOpacity style={styles.buttons.primary}>
        <Text style={styles.buttons.primaryText}>
          Start
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

## 🎯 Design System Reference

### Available Style Categories

1. **Layout**: `styles.layout.*`
   - `container` - Main screen container
   - `content` - Content area with padding
   - `section` - Section spacing
   - `row` - Horizontal layout
   - `rowSpaceBetween` - Space between items
   - `centered` - Center content
   - `gapXs/Sm/Md/Lg/Xl` - Consistent gaps

2. **Typography**: `styles.typography.*`
   - `headlineLarge/Medium/Small` - Page titles
   - `titleLarge/Medium/Small` - Section titles
   - `bodyLarge/Medium/Small` - Content text
   - `bodyLargeSecondary/etc` - Secondary text variants
   - `labelLarge/Medium/Small` - Button/chip text

3. **Cards**: `styles.cards.*`
   - `standard` - Default card
   - `compact` - Smaller card
   - `large` - Spacious card
   - `elevated` - High elevation card
   - `completed` - Success state card

4. **Buttons**: `styles.buttons.*`
   - `primary/primaryText` - Main actions
   - `secondary/secondaryText` - Secondary actions
   - `tertiary/tertiaryText` - Subtle actions
   - `success/warning/error` - State buttons

5. **Form Elements**: `styles.inputs.*`
   - `default` - Basic input
   - `focused` - Active input
   - `error` - Error state
   - `text/placeholder` - Text styles

6. **Progress**: `styles.progress.*`
   - `track` - Progress background
   - `fill` - Progress bar
   - `successFill` - Complete state

7. **Tabs**: `styles.tabs.*`
   - `container` - Tab container
   - `tab/activeTab` - Tab buttons
   - `tabText/activeTabText` - Tab labels

8. **Empty States**: `styles.emptyState.*`
   - `container` - Empty state layout
   - `icon/title/description` - Content elements

### Color Tokens
Access via `theme.colors.*`:
- `primary/secondary` - Brand colors
- `success/warning/error` - Status colors
- `text/textSecondary/textDisabled` - Text colors
- `background/surface/card` - Background colors
- `border/divider` - Line colors

### Spacing Tokens
Access via `theme.spacing.*`:
- `xs: 4px` - Tiny gaps
- `sm: 8px` - Small gaps
- `md: 12px` - Medium gaps
- `lg: 16px` - Large gaps
- `xl: 20px` - Extra large gaps
- `xxl: 24px` - Section spacing
- `xxxl: 32px` - Major sections

## 🔧 Utility Functions

### Custom Spacing
```tsx
// Add custom margins/padding:
const customStyle = {
  ...styles.cards.standard,
  marginTop: theme.spacing.xl,
  paddingBottom: theme.spacing.lg,
};
```

### Custom Colors
```tsx
// Override colors when needed:
const customButton = {
  ...styles.buttons.primary,
  backgroundColor: theme.colors.warning,
};
```

### Elevation Helpers
```tsx
import { getElevationStyle } from '@/utils/styleHelpers';

const elevatedCard = {
  ...styles.cards.standard,
  ...getElevationStyle(theme, 'level4'),
};
```

## ⚠️ Common Pitfalls

### 1. Don't Mix Old and New Patterns
```tsx
// BAD:
const styles = StyleSheet.create({
  customCard: {
    backgroundColor: colors.card, // Old way
    ...theme.elevation.level2,     // New way
  },
});

// GOOD:
const customCard = {
  ...styles.cards.standard,
  // Add only necessary overrides
  backgroundColor: theme.colors.warning,
};
```

### 2. Use Semantic Spacing
```tsx
// BAD:
marginBottom: 15,

// GOOD:
marginBottom: theme.spacing.lg,
```

### 3. Leverage Component Tokens
```tsx
// BAD:
height: 48,
paddingHorizontal: 20,
borderRadius: 12,

// GOOD:
...styles.buttons.primary,
```

## 🎉 Migration Benefits

After migration, you'll have:
- ✅ Consistent spacing throughout the app
- ✅ Unified color system with proper contrast
- ✅ Scalable typography hierarchy
- ✅ Standardized component patterns
- ✅ Better accessibility compliance
- ✅ Easier maintenance and updates
- ✅ Modern, professional appearance

## 📞 Need Help?

If you encounter issues during migration:
1. Check the design system reference above
2. Look at the example implementations
3. Ensure you're using the latest `useAppSettings` hook
4. Verify imports are correct
5. Test on both light and dark themes

Happy migrating! 🚀 