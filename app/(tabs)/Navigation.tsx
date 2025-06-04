import { View, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, useWindowDimensions, Platform } from "react-native";
import Accordion from "@/components/navigation/NavBook";
import Books from "@/assets/data/BookChapterList.json";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { useAppContext } from "@/context/GlobalContext";
import { Ionicons } from '@expo/vector-icons';
import { useState } from "react";
import React from "react";
import { parseReference } from '@/utils/parseReference';
import { findSegmentId } from '@/utils/referenceMapping';
import { useRouter } from 'expo-router';
import SearchResults from '@/components/navigation/SearchResults';
import { useAppSettings } from '@/context/AppSettingsContext';
import { getSegmentCompletionStatus } from "@/api/sqlite";

export type SegmentKey = keyof typeof SegmentTitles;
export type SegmentIds = keyof typeof Books;

const data = Object.keys(Books).map((key) => ({
  djhBook: key as keyof typeof Books,
  ...Books[key as SegmentIds],
  segments: Books[key as SegmentIds].segments as SegmentKey[],
}));

const booksArray = Object.keys(Books);

const createStyles = (isLargeScreen: boolean, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.secondary,
    lineHeight: 22,
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondary,
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    marginVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterScrollContent: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 8,
    flex: 1,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: colors.isDark ? colors.card : '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    borderWidth: 1,
    borderColor: colors.isDark ? colors.border : '#E0E0E0',
  },
  filterButtonAll: {
    flex: 0.6,
  },
  filterButtonActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  filterText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  filterTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  sortIcon: {
    marginLeft: 4,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  searchButtonActive: {
    backgroundColor: '#FF6B00',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInputIcon: {
    marginRight: 8,
  },
  searchInput: {
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  clearButton: {
    padding: 4,
  },
  searchBar: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  inlineVerseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginLeft: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  inlineVerseText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF6B00',
    marginRight: 3,
  },
  spacer: {
    flex: 1,
  },
});

const Navigation = () => {
  const { completedSegments, language, version } = useAppContext();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAscending, setIsAscending] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [targetSegmentId, setTargetSegmentId] = useState<string | null>(null);
  const [targetVerse, setTargetVerse] = useState<number | null>(null);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { colors } = useAppSettings();
  const styles = createStyles(isLargeScreen, colors);

  // Define Old and New Testament books
  const oldTestamentBooks = ['Gen', 'Exo', 'Lev', 'Num', 'Deu', 'Jos', 'Jdg', 'Rut', '1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch', 'Ezr', 'Neh', 'Est', 'Job', 'Psa', 'Pro', 'Ecc', 'SoS', 'Isa', 'Jer', 'Lam', 'Eze', 'Dan', 'Hos', 'Joe', 'Amo', 'Oba', 'Jon', 'Mic', 'Nah', 'Hab', 'Zep', 'Hag', 'Zec', 'Mal'];
  const newTestamentBooks = ['Mat', 'Mar', 'Luk', 'Joh', 'Act', 'Rom', '1Co', '2Co', 'Gal', 'Eph', 'Php', 'Col', '1Th', '2Th', '1Ti', '2Ti', 'Tit', 'Phm', 'Heb', 'Jam', '1Pe', '2Pe', '1Jn', '2Jn', '3Jn', 'Jud', 'Rev'];

  // Add state for completed segments
  const [completedSegmentIds, setCompletedSegmentIds] = useState<{[key: string]: boolean}>({});

  // Check if search query is a valid scripture reference with verse
  const isValidScriptureReference = React.useMemo(() => {
    if (!searchQuery || !showSearch) return false;
    const parsedRef = parseReference(searchQuery);
    if (parsedRef?.book && parsedRef?.chapter && parsedRef?.verse) {
      const segmentId = findSegmentId(parsedRef.book, parsedRef.chapter, parsedRef.verse);
      if (segmentId) {
        // Additional validation: check for reasonable verse numbers
        // Most chapters don't have more than 80 verses, very few go above 100
        const verse = parsedRef.verse;
        if (verse > 150) {
          return false; // Clearly invalid verse number
        }
        
        // Additional checks for specific books with known limits could be added here
        // For now, we'll trust the referenceMapping utility but add basic sanity checks
        return true;
      }
    }
    return false;
  }, [searchQuery, showSearch]);

  // Handle direct navigation to scripture reference
  const handleDirectScriptureNavigation = () => {
    const parsedRef = parseReference(searchQuery);
    if (parsedRef?.book && parsedRef?.chapter && parsedRef?.verse) {
      const segmentId = findSegmentId(parsedRef.book, parsedRef.chapter, parsedRef.verse);
      if (segmentId) {
        handleSegmentSelect(segmentId, parsedRef.verse);
      }
    }
  };

  // Handle book title click
  const handleBookSelect = (bookName: string) => {
    // Only update search if search is active
    if (showSearch) {
      setSearchQuery(bookName);
      setSelectedBook(bookName);
    }
  };

  // Handle segment click when chapter is selected
  const handleSegmentSelect = (segmentId: string, verseOverride?: number) => {
    console.log('🚀 Navigation: handleSegmentSelect called with:', { segmentId, verseOverride, targetVerse });
    
    // Reset any scroll position that might be stored
    if (Platform.OS === 'web') {
      window.scrollTo(0, 0);
    }
    
    const params: any = {
      segment: `${language}-${version}-${segmentId}`,
      scrollReset: 'true'
    };
    
    // Use verse override if provided, otherwise use stored target verse
    const verseToUse = verseOverride || targetVerse;
    console.log('🔧 Navigation: verseToUse calculated as:', verseToUse);
    
    if (verseToUse) {
      params.verse = verseToUse.toString();
      console.log('✅ Navigation: Added verse to params:', params.verse);
      
      // Also add chapter information if we have a parsed reference
      if (searchQuery && showSearch) {
        const parsedRef = parseReference(searchQuery);
        if (parsedRef?.chapter) {
          params.chapter = parsedRef.chapter.toString();
          console.log('✅ Navigation: Added chapter to params:', params.chapter);
        }
      }
    } else {
      console.log('❌ Navigation: No verse to add to params');
    }
    
    console.log('🎯 Navigation: Final params being sent:', JSON.stringify(params, null, 2));
    
    router.push({
      pathname: "/(tabs)/[segment]" as const,
      params
    });
  };

  const filteredData = React.useMemo(() => {
    let filtered = [...data];

    // Apply testament filter
    if (filter === 'ot') {
      filtered = filtered.filter(item => oldTestamentBooks.includes(item.djhBook));
    } else if (filter === 'nt') {
      filtered = filtered.filter(item => newTestamentBooks.includes(item.djhBook));
    }

    // Reset target segment when search changes
    setTargetSegmentId(null);
    setSelectedBook(null);
    setTargetVerse(null);

    // Apply search filter
    if (searchQuery && showSearch) {
      const parsedRef = parseReference(searchQuery);
      
      if (parsedRef?.book && parsedRef?.chapter) {
        // Handle specific scripture reference (e.g., "John 3:16")
        const targetSegment = findSegmentId(parsedRef.book, parsedRef.chapter, parsedRef.verse);
        
        if (targetSegment) {
          // Filter to show only the book that contains this segment
          filtered = filtered.filter(item => {
            return item.segments.includes(targetSegment as any);
          });
          
          // Set the target segment for accordion expansion and highlighting
          setTargetSegmentId(targetSegment);
          // Store the verse number for navigation
          if (parsedRef.verse) {
            setTargetVerse(parsedRef.verse);
          }
          const bookKey = parsedRef.book as keyof typeof Books;
          setSelectedBook(Books[bookKey]?.bookName || '');
        } else {
          // If no segment found, show the book that matches
          filtered = filtered.filter(item => {
            const bookName = Books[item.djhBook].bookName.toLowerCase();
            return bookName.includes(parsedRef.book.toLowerCase()) || item.djhBook === parsedRef.book;
          });
          
          // Set selected book for expansion even if no specific segment
          const bookKey = parsedRef.book as keyof typeof Books;
          setSelectedBook(Books[bookKey]?.bookName || '');
        }
      } else if (parsedRef?.book) {
        // Handle partial reference (e.g., "John" or "1 Corinthians")
        filtered = filtered.filter(item => {
          const bookName = Books[item.djhBook].bookName.toLowerCase();
          return bookName.includes(parsedRef.book.toLowerCase()) || item.djhBook === parsedRef.book;
        });
      } else {
        // Handle general text search
        filtered = filtered.filter(item => {
          const bookName = Books[item.djhBook].bookName.toLowerCase();
          return bookName.includes(searchQuery.toLowerCase());
        });
      }
    }

    // Apply sort order
    return filtered.sort((a, b) => {
      const indexA = booksArray.indexOf(a.djhBook);
      const indexB = booksArray.indexOf(b.djhBook);
      return isAscending ? indexA - indexB : indexB - indexA;
    });
  }, [filter, searchQuery, showSearch, isAscending]);

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      // Clear search when closing
      setSearchQuery('');
      setSelectedBook(null);
      setTargetSegmentId(null);
      setTargetVerse(null);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedBook(null);
    setTargetSegmentId(null);
    setTargetVerse(null);
  };

  // Handle filter button press
  const handleFilterPress = (newFilter: string) => {
    if (filter === newFilter) {
      setIsAscending(!isAscending);
    } else {
      setFilter(newFilter);
      setIsAscending(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingTop: 8 }}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Story Finder</Text>
          <Text style={styles.welcomeText}>
            Navigate through books and chapters to find your next story
          </Text>
        </View>

      {/* Filter and Search Container */}
<View style={styles.filterContainer}>
  <View style={styles.filterScrollContent}>
    <TouchableOpacity 
      style={[
        styles.filterButton, 
        styles.filterButtonAll,
        filter === 'all' && styles.filterButtonActive
      ]}
      onPress={() => handleFilterPress('all')}
    >
      <Text 
        style={[styles.filterText, filter === 'all' && styles.filterTextActive]}
        numberOfLines={1}
      >
        All
      </Text>
      {filter === 'all' && (
        <Ionicons 
          name={isAscending ? "chevron-down" : "chevron-up"} 
          size={16} 
          color="#FFF" 
          style={styles.sortIcon}
        />
      )}
    </TouchableOpacity>
    <TouchableOpacity 
      style={[styles.filterButton, filter === 'ot' && styles.filterButtonActive]}
      onPress={() => handleFilterPress('ot')}
    >
      <Text 
        style={[styles.filterText, filter === 'ot' && styles.filterTextActive]}
        numberOfLines={1}
      >
        Old Testament
      </Text>
      {filter === 'ot' && (
        <Ionicons 
          name={isAscending ? "chevron-down" : "chevron-up"} 
          size={16} 
          color="#FFF" 
          style={styles.sortIcon}
        />
      )}
    </TouchableOpacity>
    <TouchableOpacity 
      style={[styles.filterButton, filter === 'nt' && styles.filterButtonActive]}
      onPress={() => handleFilterPress('nt')}
    >
      <Text 
        style={[styles.filterText, filter === 'nt' && styles.filterTextActive]}
        numberOfLines={1}
      >
        New Testament
      </Text>
      {filter === 'nt' && (
        <Ionicons 
          name={isAscending ? "chevron-down" : "chevron-up"} 
          size={16} 
          color="#FFF" 
          style={styles.sortIcon}
        />
      )}
    </TouchableOpacity>
  </View>
  <TouchableOpacity 
    style={[styles.searchButton, showSearch && styles.searchButtonActive]}
    onPress={handleSearchToggle}
  >
    <Ionicons 
      name={showSearch ? "close" : "search"} 
      size={20} 
      color={showSearch ? '#FFF' : colors.text} 
    />
  </TouchableOpacity>
</View>

{/* Search Bar - Only show when search is active */}
{showSearch && (
  <View style={styles.searchContainer}>
    <Ionicons 
      name="search"
      size={20} 
      color={colors.secondary} 
      style={styles.searchInputIcon} 
    />
    <TextInput
      style={[styles.searchInput, { color: colors.text, flex: isValidScriptureReference ? 0 : 1 }]}
      placeholder="Search books or verses (e.g., John 3:16)..."
      placeholderTextColor={colors.secondary}
      value={searchQuery}
      onChangeText={setSearchQuery}
      autoFocus
    />
    {isValidScriptureReference && (
      <TouchableOpacity 
        style={styles.inlineVerseButton}
        onPress={handleDirectScriptureNavigation}
      >
        <Text style={styles.inlineVerseText}>Go To</Text>
        <Ionicons name="arrow-forward" size={12} color="#FF6B00" />
      </TouchableOpacity>
    )}
    <View style={styles.spacer} />
    {searchQuery.length > 0 && (
      <TouchableOpacity 
        onPress={handleClearSearch}
        style={styles.clearButton}
      >
        <Ionicons name="close-circle" size={20} color={colors.secondary} />
      </TouchableOpacity>
    )}
  </View>
)}
        <FlatList
          data={filteredData}
          renderItem={({ item }) => {
            const bookIndex = booksArray.findIndex(book => book === item.djhBook);
            const isSelected = Books[item.djhBook].bookName.toLowerCase() === selectedBook?.toLowerCase();
            
            return (
              <Accordion 
                item={item} 
                bookIndex={bookIndex}
                context="main"
                showGlobalCompletion={true}
                style={{ backgroundColor: '#FFF' }}
                isExpanded={isSelected && showSearch}
                onBookSelect={handleBookSelect}
                onSegmentSelect={handleSegmentSelect}
                completedSegments={completedSegmentIds}
                targetSegmentId={targetSegmentId}
              />
            );
          }}
          keyExtractor={(item) => item.djhBook}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Navigation;
