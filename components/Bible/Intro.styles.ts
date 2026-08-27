import { StyleSheet, Platform } from 'react-native';
import { type TextSizes } from '@/context/FontSizeContext';

// Medium is the baseline the pixel values below were tuned for (sizes.body === 16
// at the 'medium' font-size setting). Scaling every font size in this file by the
// same ratio the rest of the app uses for body text keeps the Intro screen's look
// unchanged at the default setting while making it respond to the font-size slider.
const MEDIUM_BODY = 16;
export const getFontScale = (sizes: TextSizes) => sizes.body / MEDIUM_BODY;
const scaled = (scale: number, value: number) => Math.round(value * scale);

// Function to create dynamic styles with theme colors
export const createStyles = (colors: any, sizes: TextSizes, isTablet: boolean = false) => {
  const scale = getFontScale(sizes);

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'center',
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  contentContainerIPad: {
    width: '100%',
    maxWidth: 800,
  },
  blockContainer: {
    marginVertical: 4,
  },
  highlightBlock: {
    backgroundColor: colors.bubbles?.default || '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  childContainer: {
    marginVertical: 6,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: scaled(scale, isTablet ? 18 : 16),
    lineHeight: scaled(scale, isTablet ? 28 : 24),
    color: colors.text,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
  },
  title: {
    fontSize: scaled(scale, isTablet ? 36 : 28),
    fontWeight: '700',
    color: colors.primary,
    marginBottom: isTablet ? 16 : 12,
    marginTop: isTablet ? 24 : 20,
    textAlign: 'center',
    lineHeight: scaled(scale, isTablet ? 42 : 34),
  },
  subtitle: {
    fontSize: scaled(scale, isTablet ? 28 : 22),
    fontWeight: '600',
    color: colors.primary,
    marginBottom: isTablet ? 20 : 16,
    marginTop: isTablet ? 20 : 16,
    textAlign: 'center',
    lineHeight: scaled(scale, isTablet ? 34 : 28),
  },
  header: {
    fontSize: scaled(scale, isTablet ? 28 : 24),
    fontWeight: '600',
    color: colors.text,
    marginTop: isTablet ? 24 : 20,
    marginBottom: isTablet ? 12 : 8,
    lineHeight: scaled(scale, isTablet ? 34 : 30),
  },
  subheader: {
    fontSize: scaled(scale, isTablet ? 24 : 20),
    fontWeight: '600',
    color: colors.text,
    marginTop: isTablet ? 20 : 16,
    marginBottom: isTablet ? 12 : 8,
    lineHeight: scaled(scale, isTablet ? 30 : 26),
  },
  heading: {
    fontSize: scaled(scale, isTablet ? 22 : 18),
    fontWeight: '600',
    color: colors.text,
    marginTop: isTablet ? 20 : 16,
    marginBottom: isTablet ? 12 : 8,
    lineHeight: scaled(scale, isTablet ? 28 : 24),
  },
  subheading: {
    fontSize: scaled(scale, isTablet ? 20 : 16),
    fontWeight: '600',
    color: colors.text,
    marginTop: isTablet ? 16 : 12,
    marginBottom: isTablet ? 10 : 6,
    lineHeight: scaled(scale, isTablet ? 26 : 22),
  },
  paragraph: {
    marginBottom: isTablet ? 16 : 12,
    lineHeight: scaled(scale, isTablet ? 28 : 24),
  },
  smallCaps: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bibleText: {
    fontStyle: 'italic',
    color: colors.secondary,
  },
  linkContainer: {
    marginVertical: 2,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  nextStoryContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  startReadingButton: {
    backgroundColor: "#FF5733", // Same orange color as home page
    paddingVertical: isTablet ? 14 : 12,
    paddingHorizontal: isTablet ? 28 : 24,
    borderRadius: isTablet ? 16 : 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startReadingText: {
    color: "#FFF",
    fontSize: scaled(scale, isTablet ? 18 : 16),
    fontWeight: "700",
  },
  // List styles
  listContainer: {
    marginVertical: 8,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    width: isTablet ? 22 : 18,
    lineHeight: scaled(scale, isTablet ? 28 : 24),
    fontSize: scaled(scale, isTablet ? 18 : 16),
    color: colors.text,
    textAlign: 'center',
  },
  listItemText: {
    flex: 1,
    lineHeight: scaled(scale, isTablet ? 28 : 24),
    fontSize: scaled(scale, isTablet ? 18 : 16),
    color: colors.text,
  },
  // Table styles
  tableWrapper: {
    width: '100%',
    alignSelf: 'stretch',
    marginVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'stretch',
  },
  tableHeaderCell: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  tableCell: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableText: {
    fontSize: scaled(scale, isTablet ? 24 : 20),
    lineHeight: scaled(scale, isTablet ? 40 : 36),
    color: colors.text,
    flexShrink: 1,
  },
  tableHeaderText: {
    fontSize: scaled(scale, isTablet ? 24 : 20),
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  });
};

// Export static styles for backwards compatibility
export const styles = createStyles(
  {
    background: '#FFFFFF',
    text: '#000000',
    primary: '#FF5733',
    secondary: '#666666',
    border: '#E5E5E5',
    bubbles: { default: '#F5F5F5' }
  },
  { title: 24, subtitle: 18, body: 16, caption: 14, button: 16, navigation: 16 }
);
