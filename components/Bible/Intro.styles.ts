import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    maxWidth: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  contentContainerIPad: {
    maxWidth: 800,
  },
  blockContainer: {
    marginVertical: 4,
  },
  highlightBlock: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  childContainer: {
    marginVertical: 2,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    fontStyle: 'italic',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000000',
    marginTop: 24,
    marginBottom: 8,
  },
  subheader: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 12,
    marginBottom: 4,
  },
  paragraph: {
    marginBottom: 8,
  },
  smallCaps: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bibleText: {
    fontStyle: 'italic',
    color: '#666666',
  },
  linkContainer: {
    marginVertical: 2,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  nextStoryContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  nextStoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  nextStoryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    width: 18,
    lineHeight: 24,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  listItemText: {
    flex: 1,
    lineHeight: 24,
    fontSize: 16,
    color: '#333',
  },
  // Table styles
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableHeaderCell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFF',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  tableCell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  tableText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});


