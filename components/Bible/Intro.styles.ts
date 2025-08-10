import { StyleSheet, Platform } from 'react-native';

// Function to create dynamic styles with theme colors
export const createStyles = (colors: any, isTablet: boolean = false) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    maxWidth: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  contentContainerIPad: {
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
  },
  text: {
    fontSize: isTablet ? 18 : 16,
    lineHeight: isTablet ? 28 : 24,
    color: colors.text,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
  },
  title: {
    fontSize: isTablet ? 36 : 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: isTablet ? 16 : 12,
    marginTop: isTablet ? 24 : 20,
    textAlign: 'center',
    lineHeight: isTablet ? 42 : 34,
  },
  subtitle: {
    fontSize: isTablet ? 28 : 22,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: isTablet ? 20 : 16,
    marginTop: isTablet ? 20 : 16,
    textAlign: 'center',
    lineHeight: isTablet ? 34 : 28,
  },
  header: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: '600',
    color: colors.text,
    marginTop: isTablet ? 24 : 20,
    marginBottom: isTablet ? 12 : 8,
    lineHeight: isTablet ? 34 : 30,
  },
  subheader: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: isTablet ? 20 : 16,
    marginBottom: isTablet ? 12 : 8,
    lineHeight: isTablet ? 30 : 26,
  },
  heading: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: isTablet ? 20 : 16,
    marginBottom: isTablet ? 12 : 8,
    lineHeight: isTablet ? 28 : 24,
  },
  subheading: {
    fontSize: isTablet ? 20 : 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: isTablet ? 16 : 12,
    marginBottom: isTablet ? 10 : 6,
    lineHeight: isTablet ? 26 : 22,
  },
  paragraph: {
    marginBottom: isTablet ? 16 : 12,
    lineHeight: isTablet ? 28 : 24,
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
    fontSize: isTablet ? 18 : 16,
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
    lineHeight: isTablet ? 28 : 24,
    fontSize: isTablet ? 18 : 16,
    color: colors.text,
    textAlign: 'center',
  },
  listItemText: {
    flex: 1,
    lineHeight: isTablet ? 28 : 24,
    fontSize: isTablet ? 18 : 16,
    color: colors.text,
  },
  // Table styles
  tableWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: colors.bubbles?.default || '#F8FAFF',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  tableCell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  tableText: {
    fontSize: isTablet ? 16 : 14,
    lineHeight: isTablet ? 24 : 20,
    color: colors.text,
  },
  tableHeaderText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '700',
    color: colors.text,
  },
});

// Export static styles for backwards compatibility
export const styles = createStyles({
  background: '#FFFFFF',
  text: '#000000',
  primary: '#FF5733',
  secondary: '#666666',
  border: '#E5E5E5',
  bubbles: { default: '#F5F5F5' }
});


