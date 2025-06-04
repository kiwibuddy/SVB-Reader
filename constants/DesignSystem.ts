/**
 * SVB Youth App Design System
 * Centralized design tokens for consistent UI/UX across the app
 * Following modern mobile app design standards (Material Design 3 + iOS Guidelines)
 */

import { Platform } from 'react-native';

// ============================================================================
// COLOR SYSTEM - Based on Material Design 3 Color System
// ============================================================================

export const Colors = {
  // Primary Brand Colors
  primary: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9800',  // Main brand color
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },
  
  // Secondary Colors
  secondary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',  // Secondary brand
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },
  
  // Success/Complete Colors
  success: {
    50: '#E8F5E8',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',  // Main success color
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },
  
  // Warning Colors
  warning: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FFC107',
    600: '#FFB300',
    700: '#FFA000',
    800: '#FF8F00',
    900: '#FF6F00',
  },
  
  // Error Colors
  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },
  
  // Neutral Colors
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    1000: '#000000',
  },
};

// Theme-specific color mappings
export const LightTheme = {
  background: Colors.neutral[0],
  surface: Colors.neutral[0],
  surfaceVariant: Colors.neutral[50],
  card: Colors.neutral[0],
  border: Colors.neutral[200],
  divider: Colors.neutral[200],
  
  text: '#1F2937',              // Modern dark gray (instead of black)
  textSecondary: '#6B7280',     // Medium gray for secondary text
  textDisabled: '#9CA3AF',      // Light gray for disabled text
  textOnPrimary: Colors.neutral[0],
  textOnSurface: '#1F2937',     // Consistent with main text
  
  primary: Colors.primary[500],
  primaryContainer: Colors.primary[100],
  onPrimary: Colors.neutral[0],
  onPrimaryContainer: Colors.primary[900],
  
  secondary: Colors.secondary[500],
  secondaryContainer: Colors.secondary[100],
  onSecondary: Colors.neutral[0],
  onSecondaryContainer: Colors.secondary[900],
  
  success: Colors.success[500],
  successContainer: Colors.success[100],
  onSuccess: Colors.neutral[0],
  
  warning: Colors.warning[500],
  warningContainer: Colors.warning[100],
  onWarning: Colors.neutral[0],
  
  error: Colors.error[500],
  errorContainer: Colors.error[100],
  onError: Colors.neutral[0],
  
  // Bible text bubbles - for backward compatibility
  bubbles: {
    default: Colors.neutral[100],
    red: Colors.error[100],
    blue: Colors.secondary[100],
    green: Colors.success[100],
    black: Colors.neutral[200],
  },
  
  // Special surfaces
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdrop: 'rgba(0, 0, 0, 0.3)',
  
  // Elevation shadows
  shadow: Colors.neutral[900],
};

export const DarkTheme = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2A2A2A',
  card: '#1E1E1E',
  border: '#333333',
  divider: '#333333',
  
  text: '#F9FAFB',              // Light gray for dark mode (instead of pure white)
  textSecondary: '#D1D5DB',     // Medium light gray for secondary text
  textDisabled: '#6B7280',      // Darker gray for disabled text in dark mode
  textOnPrimary: Colors.neutral[900],
  textOnSurface: '#F9FAFB',     // Consistent with main text
  
  primary: Colors.primary[400],
  primaryContainer: Colors.primary[800],
  onPrimary: Colors.neutral[900],
  onPrimaryContainer: Colors.primary[100],
  
  secondary: Colors.secondary[400],
  secondaryContainer: Colors.secondary[800],
  onSecondary: Colors.neutral[900],
  onSecondaryContainer: Colors.secondary[100],
  
  success: Colors.success[400],
  successContainer: Colors.success[800],
  onSuccess: Colors.neutral[900],
  
  warning: Colors.warning[400],
  warningContainer: Colors.warning[800],
  onWarning: Colors.neutral[900],
  
  error: Colors.error[400],
  errorContainer: Colors.error[800],
  onError: Colors.neutral[900],
  
  // Bible text bubbles - for backward compatibility
  bubbles: {
    default: '#2A2A2A',
    red: Colors.error[800],
    blue: Colors.secondary[800],
    green: Colors.success[800],
    black: '#1A1A1A',
  },
  
  // Special surfaces
  overlay: 'rgba(0, 0, 0, 0.7)',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  
  // Elevation shadows
  shadow: Colors.neutral[1000],
};

// ============================================================================
// TYPOGRAPHY SYSTEM - Based on Material Design Type Scale
// ============================================================================

export const Typography = {
  // Display styles (Large headers, hero text)
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '400' as const,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  
  // Headline styles (Section headers)
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600' as const,
    letterSpacing: -0.5,
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600' as const,
    letterSpacing: -0.25,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  
  // Title styles (Card headers, page titles)
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  
  // Body text
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
  },
  
  // Label text (Buttons, chips, tags)
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
};

// ============================================================================
// SPACING SYSTEM - 4px base unit
// ============================================================================

export const Spacing = {
  none: 0,
  xs: 4,     // 4px
  sm: 8,     // 8px
  md: 12,    // 12px
  lg: 16,    // 16px
  xl: 20,    // 20px
  xxl: 24,   // 24px
  xxxl: 32,  // 32px
  huge: 40,  // 40px
  massive: 48, // 48px
} as const;

// Semantic spacing aliases
export const SemanticSpacing = {
  // Component internal spacing
  componentPadding: Spacing.lg,        // 16px - Standard component padding
  componentPaddingSmall: Spacing.md,   // 12px - Compact component padding
  componentPaddingLarge: Spacing.xl,   // 20px - Spacious component padding
  
  // Layout spacing
  sectionGap: Spacing.xxxl,           // 32px - Between major sections
  cardGap: Spacing.md,                // 12px - Between cards
  elementGap: Spacing.sm,             // 8px - Between related elements
  
  // Screen padding
  screenPadding: Spacing.xl,          // 20px - Main screen horizontal padding
  screenPaddingVertical: Spacing.xl,  // 20px - Main screen vertical padding
  
  // Safe areas
  safeAreaPadding: Spacing.lg,        // 16px - Additional safe area padding
  
  // Button spacing
  buttonPadding: Spacing.lg,          // 16px - Button internal padding
  buttonGap: Spacing.sm,              // 8px - Between buttons
} as const;

// ============================================================================
// BORDER RADIUS SYSTEM
// ============================================================================

export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,   // Standard card radius
  lg: 16,   // Large card radius
  xl: 20,   // Extra large radius
  xxl: 24,  // Very large radius
  pill: 50, // Pill-shaped (50% of height)
  circle: 9999, // Circular
} as const;

// ============================================================================
// ELEVATION SYSTEM - Material Design Elevation
// ============================================================================

export const Elevation = {
  level0: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  level1: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: Platform.OS === 'ios' ? 0.18 : 0.2,
    shadowRadius: 1.0,
    elevation: 1,
  },
  level2: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.16 : 0.2,
    shadowRadius: 2.0,
    elevation: 2,
  },
  level3: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.19 : 0.25,
    shadowRadius: 4.0,
    elevation: 3,
  },
  level4: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.3,
    shadowRadius: 5.0,
    elevation: 4,
  },
  level5: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.27 : 0.35,
    shadowRadius: 8.0,
    elevation: 6,
  },
} as const;

// ============================================================================
// COMPONENT TOKENS
// ============================================================================

export const ComponentTokens = {
  // Button variants
  button: {
    primary: {
      height: 48,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.md,
      elevation: Elevation.level2,
    },
    secondary: {
      height: 44,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      elevation: Elevation.level1,
    },
    tertiary: {
      height: 40,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.sm,
      elevation: Elevation.level0,
    },
    small: {
      height: 32,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.sm,
      elevation: Elevation.level0,
    },
  },
  
  // Card variants
  card: {
    standard: {
      borderRadius: BorderRadius.md,
      padding: Spacing.xl,
      elevation: Elevation.level2,
    },
    compact: {
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      elevation: Elevation.level1,
    },
    large: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.xxl,
      elevation: Elevation.level3,
    },
  },
  
  // Input fields
  input: {
    height: 48,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  
  // Chips/Tags
  chip: {
    height: 32,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  
  // Progress bars
  progressBar: {
    height: 8,
    borderRadius: BorderRadius.xs,
  },
  
  // Tabs
  tab: {
    height: 48,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
} as const;

// ============================================================================
// ANIMATION & TRANSITIONS
// ============================================================================

export const Animation = {
  // Duration
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 400,
    verySlow: 600,
  },
  
  // Easing curves
  easing: {
    standard: 'ease-in-out',
    accelerate: 'ease-in',
    decelerate: 'ease-out',
    linear: 'linear',
  },
  
  // Common spring configs
  spring: {
    gentle: {
      damping: 20,
      stiffness: 300,
    },
    bouncy: {
      damping: 15,
      stiffness: 400,
    },
    stiff: {
      damping: 25,
      stiffness: 500,
    },
  },
} as const;

// ============================================================================
// GRID SYSTEM
// ============================================================================

export const Grid = {
  columns: 12,
  gutter: Spacing.lg,     // 16px
  margin: Spacing.xl,     // 20px
  maxWidth: 1200,         // Maximum content width
  
  // Breakpoints
  breakpoints: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },
} as const;

// ============================================================================
// ICON SIZES
// ============================================================================

export const IconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
  huge: 48,
} as const;

// ============================================================================
// EXPORT THEME OBJECT
// ============================================================================

export const createTheme = (isDark: boolean = false) => ({
  colors: isDark ? DarkTheme : LightTheme,
  typography: Typography,
  spacing: Spacing,
  semanticSpacing: SemanticSpacing,
  borderRadius: BorderRadius,
  elevation: Elevation,
  componentTokens: ComponentTokens,
  animation: Animation,
  grid: Grid,
  iconSizes: IconSizes,
  isDark,
});

export type Theme = ReturnType<typeof createTheme>;
export type ThemeColors = typeof LightTheme;
export type ThemeTypography = typeof Typography; 