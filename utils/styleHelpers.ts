import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Theme, ThemeColors } from '@/constants/DesignSystem';

/**
 * Style Helper Utilities
 * Provides consistent styling patterns using the design system
 */

type Style = ViewStyle | TextStyle | ImageStyle;

// Button style creators
export const createButtonStyles = (theme: Theme) => ({
  primary: {
    backgroundColor: theme.colors.primary,
    height: theme.componentTokens.button.primary.height,
    paddingHorizontal: theme.componentTokens.button.primary.paddingHorizontal,
    borderRadius: theme.componentTokens.button.primary.borderRadius,
    ...theme.elevation.level2,
    shadowColor: theme.colors.shadow,
  } as ViewStyle,
  
  secondary: {
    backgroundColor: theme.colors.secondaryContainer,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: theme.componentTokens.button.secondary.height,
    paddingHorizontal: theme.componentTokens.button.secondary.paddingHorizontal,
    borderRadius: theme.componentTokens.button.secondary.borderRadius,
    ...theme.elevation.level1,
    shadowColor: theme.colors.shadow,
  } as ViewStyle,
  
  tertiary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: theme.componentTokens.button.tertiary.height,
    paddingHorizontal: theme.componentTokens.button.tertiary.paddingHorizontal,
    borderRadius: theme.componentTokens.button.tertiary.borderRadius,
  } as ViewStyle,
  
  success: {
    backgroundColor: theme.colors.success,
    height: theme.componentTokens.button.primary.height,
    paddingHorizontal: theme.componentTokens.button.primary.paddingHorizontal,
    borderRadius: theme.componentTokens.button.primary.borderRadius,
    ...theme.elevation.level2,
    shadowColor: theme.colors.shadow,
  } as ViewStyle,
  
  warning: {
    backgroundColor: theme.colors.warning,
    height: theme.componentTokens.button.primary.height,
    paddingHorizontal: theme.componentTokens.button.primary.paddingHorizontal,
    borderRadius: theme.componentTokens.button.primary.borderRadius,
    ...theme.elevation.level2,
    shadowColor: theme.colors.shadow,
  } as ViewStyle,
  
  error: {
    backgroundColor: theme.colors.error,
    height: theme.componentTokens.button.primary.height,
    paddingHorizontal: theme.componentTokens.button.primary.paddingHorizontal,
    borderRadius: theme.componentTokens.button.primary.borderRadius,
    ...theme.elevation.level2,
    shadowColor: theme.colors.shadow,
  } as ViewStyle,
  
  // Button text styles
  primaryText: {
    ...theme.typography.labelLarge,
    color: theme.colors.onPrimary,
  } as TextStyle,
  
  secondaryText: {
    ...theme.typography.labelLarge,
    color: theme.colors.text,
  } as TextStyle,
  
  tertiaryText: {
    ...theme.typography.labelLarge,
    color: theme.colors.primary,
  } as TextStyle,
  
  successText: {
    ...theme.typography.labelLarge,
    color: theme.colors.onSuccess,
  } as TextStyle,
  
  warningText: {
    ...theme.typography.labelLarge,
    color: theme.colors.onWarning,
  } as TextStyle,
  
  errorText: {
    ...theme.typography.labelLarge,
    color: theme.colors.onError,
  } as TextStyle,
});

// Card style creators
export const createCardStyles = (theme: Theme) => ({
  standard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.componentTokens.card.standard.borderRadius,
    padding: theme.componentTokens.card.standard.padding,
    ...theme.elevation.level2,
    shadowColor: theme.colors.shadow,
  } as ViewStyle,
  
  compact: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.componentTokens.card.compact.borderRadius,
    padding: theme.componentTokens.card.compact.padding,
    ...theme.elevation.level1,
    shadowColor: theme.colors.shadow,
  } as ViewStyle,
  
  large: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.componentTokens.card.large.borderRadius,
    padding: theme.componentTokens.card.large.padding,
    ...theme.elevation.level3,
    shadowColor: theme.colors.shadow,
  } as ViewStyle,
  
  elevated: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.componentTokens.card.standard.borderRadius,
    padding: theme.componentTokens.card.standard.padding,
    ...theme.elevation.level4,
    shadowColor: theme.colors.shadow,
  } as ViewStyle,
  
  // Completed state
  completed: {
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.success,
    borderRadius: theme.componentTokens.card.compact.borderRadius,
    padding: theme.componentTokens.card.compact.padding,
    ...theme.elevation.level1,
    shadowColor: theme.colors.success,
  } as ViewStyle,
});

// Input style creators
export const createInputStyles = (theme: Theme) => ({
  default: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    height: theme.componentTokens.input.height,
    paddingHorizontal: theme.componentTokens.input.paddingHorizontal,
    borderRadius: theme.componentTokens.input.borderRadius,
    borderWidth: theme.componentTokens.input.borderWidth,
  } as ViewStyle,
  
  focused: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderWidth: 2,
    height: theme.componentTokens.input.height,
    paddingHorizontal: theme.componentTokens.input.paddingHorizontal,
    borderRadius: theme.componentTokens.input.borderRadius,
  } as ViewStyle,
  
  error: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.error,
    borderWidth: 2,
    height: theme.componentTokens.input.height,
    paddingHorizontal: theme.componentTokens.input.paddingHorizontal,
    borderRadius: theme.componentTokens.input.borderRadius,
  } as ViewStyle,
  
  text: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text,
  } as TextStyle,
  
  placeholder: {
    ...theme.typography.bodyLarge,
    color: theme.colors.textDisabled,
  } as TextStyle,
});

// Chip/Tag style creators
export const createChipStyles = (theme: Theme) => ({
  default: {
    backgroundColor: theme.colors.surfaceVariant,
    borderColor: theme.colors.border,
    height: theme.componentTokens.chip.height,
    paddingHorizontal: theme.componentTokens.chip.paddingHorizontal,
    borderRadius: theme.componentTokens.chip.borderRadius,
    borderWidth: theme.componentTokens.chip.borderWidth,
  } as ViewStyle,
  
  selected: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
    height: theme.componentTokens.chip.height,
    paddingHorizontal: theme.componentTokens.chip.paddingHorizontal,
    borderRadius: theme.componentTokens.chip.borderRadius,
    borderWidth: theme.componentTokens.chip.borderWidth,
  } as ViewStyle,
  
  completed: {
    backgroundColor: theme.colors.successContainer,
    borderColor: theme.colors.success,
    height: theme.componentTokens.chip.height,
    paddingHorizontal: theme.componentTokens.chip.paddingHorizontal,
    borderRadius: theme.componentTokens.chip.borderRadius,
    borderWidth: theme.componentTokens.chip.borderWidth,
  } as ViewStyle,
  
  // Chip text styles
  defaultText: {
    ...theme.typography.labelMedium,
    color: theme.colors.text,
  } as TextStyle,
  
  selectedText: {
    ...theme.typography.labelMedium,
    color: theme.colors.onPrimaryContainer,
  } as TextStyle,
  
  completedText: {
    ...theme.typography.labelMedium,
    color: theme.colors.success,
  } as TextStyle,
});

// Progress style creators
export const createProgressStyles = (theme: Theme) => ({
  track: {
    backgroundColor: theme.colors.surfaceVariant,
    height: theme.componentTokens.progressBar.height,
    borderRadius: theme.componentTokens.progressBar.borderRadius,
    overflow: 'hidden',
  } as ViewStyle,
  
  fill: {
    backgroundColor: theme.colors.primary,
    height: '100%',
    borderRadius: theme.borderRadius.xs,
  } as ViewStyle,
  
  successFill: {
    backgroundColor: theme.colors.success,
    height: '100%',
    borderRadius: theme.borderRadius.xs,
  } as ViewStyle,
  
  warningFill: {
    backgroundColor: theme.colors.warning,
    height: '100%',
    borderRadius: theme.borderRadius.xs,
  } as ViewStyle,
});

// Tab style creators
export const createTabStyles = (theme: Theme) => ({
  container: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
  },
  
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: theme.componentTokens.tab.height,
    paddingHorizontal: theme.componentTokens.tab.paddingHorizontal,
    borderRadius: theme.componentTokens.tab.borderRadius,
  } as ViewStyle,
  
  activeTab: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: theme.colors.card,
    height: theme.componentTokens.tab.height,
    paddingHorizontal: theme.componentTokens.tab.paddingHorizontal,
    borderRadius: theme.componentTokens.tab.borderRadius,
    ...theme.elevation.level1,
    shadowColor: theme.colors.shadow,
  } as ViewStyle,
  
  tabText: {
    ...theme.typography.labelLarge,
    color: theme.colors.textSecondary,
  } as TextStyle,
  
  activeTabText: {
    ...theme.typography.labelLarge,
    color: theme.colors.text,
  } as TextStyle,
});

// Typography style creators
export const createTypographyStyles = (theme: Theme) => ({
  // Headers
  displayLarge: {
    ...theme.typography.displayLarge,
    color: theme.colors.text,
  } as TextStyle,
  
  displayMedium: {
    ...theme.typography.displayMedium,
    color: theme.colors.text,
  } as TextStyle,
  
  displaySmall: {
    ...theme.typography.displaySmall,
    color: theme.colors.text,
  } as TextStyle,
  
  headlineLarge: {
    ...theme.typography.headlineLarge,
    color: theme.colors.text,
  } as TextStyle,
  
  headlineMedium: {
    ...theme.typography.headlineMedium,
    color: theme.colors.text,
  } as TextStyle,
  
  headlineSmall: {
    ...theme.typography.headlineSmall,
    color: theme.colors.text,
  } as TextStyle,
  
  // Titles
  titleLarge: {
    ...theme.typography.titleLarge,
    color: theme.colors.text,
  } as TextStyle,
  
  titleMedium: {
    ...theme.typography.titleMedium,
    color: theme.colors.text,
  } as TextStyle,
  
  titleSmall: {
    ...theme.typography.titleSmall,
    color: theme.colors.text,
  } as TextStyle,
  
  // Body text
  bodyLarge: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text,
  } as TextStyle,
  
  bodyMedium: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
  } as TextStyle,
  
  bodySmall: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
  } as TextStyle,
  
  // Secondary text variants
  bodyLargeSecondary: {
    ...theme.typography.bodyLarge,
    color: theme.colors.textSecondary,
  } as TextStyle,
  
  bodyMediumSecondary: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
  } as TextStyle,
  
  bodySmallSecondary: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  } as TextStyle,
  
  // Labels
  labelLarge: {
    ...theme.typography.labelLarge,
    color: theme.colors.text,
  } as TextStyle,
  
  labelMedium: {
    ...theme.typography.labelMedium,
    color: theme.colors.text,
  } as TextStyle,
  
  labelSmall: {
    ...theme.typography.labelSmall,
    color: theme.colors.text,
  } as TextStyle,
});

// Layout style creators
export const createLayoutStyles = (theme: Theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  } as ViewStyle,
  
  content: {
    flex: 1,
    paddingHorizontal: theme.semanticSpacing.screenPadding,
  } as ViewStyle,
  
  contentWithVerticalPadding: {
    flex: 1,
    paddingHorizontal: theme.semanticSpacing.screenPadding,
    paddingVertical: theme.semanticSpacing.screenPaddingVertical,
  } as ViewStyle,
  
  section: {
    marginBottom: theme.semanticSpacing.sectionGap,
  } as ViewStyle,
  
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  } as ViewStyle,
  
  rowSpaceBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  } as ViewStyle,
  
  column: {
    flexDirection: 'column' as const,
  } as ViewStyle,
  
  centered: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,
  
  // Common gaps
  gapXs: { gap: theme.spacing.xs } as ViewStyle,
  gapSm: { gap: theme.spacing.sm } as ViewStyle,
  gapMd: { gap: theme.spacing.md } as ViewStyle,
  gapLg: { gap: theme.spacing.lg } as ViewStyle,
  gapXl: { gap: theme.spacing.xl } as ViewStyle,
});

// Empty state style creators
export const createEmptyStateStyles = (theme: Theme) => ({
  container: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: theme.spacing.massive,
    paddingHorizontal: theme.semanticSpacing.screenPadding,
  } as ViewStyle,
  
  icon: {
    marginBottom: theme.spacing.lg,
    opacity: 0.3,
  } as ViewStyle,
  
  title: {
    ...theme.typography.titleLarge,
    color: theme.colors.text,
    textAlign: 'center' as const,
    marginBottom: theme.spacing.sm,
  } as TextStyle,
  
  description: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
  } as TextStyle,
});

// Create a style factory function
export const createAppStyles = (theme: Theme) => ({
  buttons: createButtonStyles(theme),
  cards: createCardStyles(theme),
  inputs: createInputStyles(theme),
  chips: createChipStyles(theme),
  progress: createProgressStyles(theme),
  tabs: createTabStyles(theme),
  typography: createTypographyStyles(theme),
  layout: createLayoutStyles(theme),
  emptyState: createEmptyStateStyles(theme),
});

// Utility functions
export const getElevationStyle = (theme: Theme, level: keyof typeof theme.elevation) => ({
  ...theme.elevation[level],
  shadowColor: theme.colors.shadow,
});

export const getBorderStyle = (theme: Theme, width: number = 1) => ({
  borderWidth: width,
  borderColor: theme.colors.border,
});

export const getSpacingStyle = (
  theme: Theme, 
  type: 'padding' | 'margin',
  size: keyof typeof theme.spacing
) => ({
  [type]: theme.spacing[size],
});

// Export the main factory function
export default createAppStyles; 