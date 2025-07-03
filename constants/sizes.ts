import { Dimensions } from 'react-native';

export const sizes = {
  title: 24,
  subtitle: 18,
  body: 16,
  caption: 14,
  button: 16,
  navigation: 16,
};

// Responsive breakpoints
export const breakpoints = {
  phone: 480,
  tablet: 768,
  desktop: 1024,
};

// Screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive utilities
export const isPhone = screenWidth < breakpoints.tablet;
export const isTablet = screenWidth >= breakpoints.tablet && screenWidth < breakpoints.desktop;
export const isDesktop = screenWidth >= breakpoints.desktop;
export const isLargeScreen = screenWidth >= breakpoints.tablet;

// Orientation detection
export const isLandscape = screenWidth > screenHeight;
export const isPortrait = screenWidth < screenHeight;

// Responsive spacing
export const spacing = {
  xs: isLargeScreen ? 8 : 4,
  sm: isLargeScreen ? 12 : 8,
  md: isLargeScreen ? 16 : 12,
  lg: isLargeScreen ? 24 : 16,
  xl: isLargeScreen ? 32 : 24,
  xxl: isLargeScreen ? 48 : 32,
};

// Responsive font sizes
export const responsiveFontSizes = {
  title: isLargeScreen ? 32 : 24,
  subtitle: isLargeScreen ? 24 : 18,
  body: isLargeScreen ? 18 : 16,
  caption: isLargeScreen ? 16 : 14,
  button: isLargeScreen ? 18 : 16,
  navigation: isLargeScreen ? 18 : 16,
};

// Responsive padding/margins
export const responsivePadding = {
  screen: isLargeScreen ? 24 : 16,
  card: isLargeScreen ? 20 : 16,
  button: isLargeScreen ? 16 : 12,
};

// Grid columns for different screen sizes
export const gridColumns = {
  phone: 1,
  tablet: 2,
  desktop: 3,
};

// Get current grid columns based on screen size
export const getGridColumns = () => {
  if (isDesktop) return gridColumns.desktop;
  if (isTablet) return gridColumns.tablet;
  return gridColumns.phone;
};

// Responsive card widths
export const getCardWidth = () => {
  const columns = getGridColumns();
  const padding = responsivePadding.screen * 2;
  const gap = spacing.md * (columns - 1);
  return (screenWidth - padding - gap) / columns;
}; 