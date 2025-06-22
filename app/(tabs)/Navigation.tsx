import { View, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, useWindowDimensions, Platform } from "react-native";
import Accordion from "@/components/navigation/NavBook";
import BooksJson from "@/assets/data/BookChapterList.json";
import SegmentTitlesJson from "@/assets/data/SegmentTitles.json";
import { useAppContext } from "@/context/GlobalContext";
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from "react";
import React from "react";
import { parseReference } from '@/utils/parseReference';
import { findSegmentId } from '@/utils/referenceMapping';
import { useRouter } from 'expo-router';
import SearchResults from '@/components/navigation/SearchResults';
import { useAppSettings } from '@/context/AppSettingsContext';
import { getSegmentCompletionStatus } from "@/api/sqlite";

export type SegmentKey = keyof typeof SegmentTitles;
export type SegmentIds = keyof typeof Books;

interface BookType {
  [key: string]: {
    verseCount: number;
    bookName: string;
    chapters: string;
    FCBH: string;
    YV: string;
    segments: string[];
  };
}

interface SegmentTitleType {
  [key: string]: {
    Segment: string;
    title: string;
    book: string[];
    ref?: string;
  };
}

const Books: BookType = BooksJson;
const SegmentTitles: SegmentTitleType = SegmentTitlesJson;

const data = Object.keys(Books).map((key) => ({
  djhBook: String(key),
  ...Books[key],
  segments: Books[key].segments as SegmentKey[],
}));

const booksArray = Object.keys(Books);

// Enhanced reference parsing function
const parseReferenceEnhanced = (input: string) => {
  if (!input || typeof input !== 'string') return null;
  
  const normalized = input.trim().replace(/\s+/g, ' ');
  
  // Match patterns like "John 3:13", "Joh 3:13", "John 3", "1 John 3:13", etc.
  const patterns = [
    /^(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)$/, // "John 3:13" or "1 John 3:13"
    /^(\d?\s?[A-Za-z]+)\s+(\d+)$/, // "John 3"
  ];
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const bookName = match[1].trim();
      const chapter = parseInt(match[2]);
      const verse = match[3] ? parseInt(match[3]) : null;
      
      return {
        book: bookName,
        chapter,
        verse,
        original: input
      };
    }
  }
  
  return null;
};

// Function to find which segment contains a specific verse
const findSegmentForVerse = (bookKey: string, chapter: number, verse: number | null = null) => {
  const bookData = Books[bookKey];
  if (!bookData) return null;
  
  // Get all segments for this book
  const segments = bookData.segments;
  
  for (const segmentId of segments) {
    const segmentData = SegmentTitles[segmentId];
    if (!segmentData || !segmentData.ref) continue;
    
    // Parse the verse reference (e.g., "3:1-5:32")
    const refMatch = segmentData.ref.match(/(\d+):(\d+)-(\d+):(\d+)/);
    if (refMatch) {
      const startChapter = parseInt(refMatch[1]);
      const startVerse = parseInt(refMatch[2]);
      const endChapter = parseInt(refMatch[3]);
      const endVerse = parseInt(refMatch[4]);
      
      // Check if the target chapter:verse falls within this segment's range
      if (chapter >= startChapter && chapter <= endChapter) {
        if (chapter === startChapter && verse && verse < startVerse) continue;
        if (chapter === endChapter && verse && verse > endVerse) continue;
        return segmentId;
      }
    } else {
      // Handle single chapter references (e.g., "1:1-25")
      const singleChapterMatch = segmentData.ref.match(/(\d+):(\d+)-(\d+)/);
      if (singleChapterMatch) {
        const segmentChapter = parseInt(singleChapterMatch[1]);
        const startVerse = parseInt(singleChapterMatch[2]);
        const endVerse = parseInt(singleChapterMatch[3]);
        
        if (chapter === segmentChapter) {
          if (!verse || (verse >= startVerse && verse <= endVerse)) {
            return segmentId;
          }
        }
      }
    }
  }
  
  return null;
};

// Function to find book key by name
const findBookByName = (searchName: string) => {
  const lowerSearchName = searchName.toLowerCase();
  
  for (const [bookKey, bookData] of Object.entries(Books)) {
    const bookName = bookData.bookName.toLowerCase();
    const shortName = bookKey.toLowerCase();
    
    if (bookName === lowerSearchName || 
        shortName === lowerSearchName ||
        bookName.startsWith(lowerSearchName) ||
        shortName.startsWith(lowerSearchName)) {
      return bookKey;
    }
  }
  
  return null;
};

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
  },
  filterScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.isDark ? colors.card : '#E8E8E8',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 4,
  },
  filterButtonActive: {
    backgroundColor: '#FF6B00',
  },
  filterText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
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
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    flex: 1,
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
});

// Update AccordionItem type to accept string for djhBook
export interface AccordionItem {
  djhBook: string;
  bookName: string;
  segments: SegmentKey[];
}

const Navigation = () => {
  const { completedSegments, language, version } = useAppContext();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAscending, setIsAscending] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [highlightedSegment, setHighlightedSegment] = useState<string | null>(null);
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

  // Enhanced filtered data with verse search
  const filteredData = React.useMemo(() => {
    let filtered = [...data];
    let targetSegment = null;
    let targetBookKey: string | null = null;

    // Apply testament filter
    if (filter === 'ot') {
      filtered = filtered.filter(item => oldTestamentBooks.includes(item.djhBook));
    } else if (filter === 'nt') {
      filtered = filtered.filter(item => newTestamentBooks.includes(item.djhBook));
    }

    // Apply search filter with enhanced verse detection
    if (searchQuery && showSearch) {
      const parsedRef = parseReferenceEnhanced(searchQuery);
      
      if (parsedRef?.book && parsedRef?.chapter) {
        // Find the book that matches the search
        targetBookKey = findBookByName(parsedRef.book);
        
        if (targetBookKey) {
          // Find the specific segment that contains this verse
          if (parsedRef.verse) {
            targetSegment = findSegmentForVerse(targetBookKey, parsedRef.chapter, parsedRef.verse);
          } else {
            // If no specific verse, find segment for the chapter
            targetSegment = findSegmentForVerse(targetBookKey, parsedRef.chapter);
          }
          
          // Filter to show only the matching book
          filtered = filtered.filter(item => item.djhBook === targetBookKey);
          setSelectedBook(targetBookKey);
        }
      } else {
        // Fallback to book name search
        filtered = filtered.filter(item => {
          const bookName = Books[item.djhBook].bookName.toLowerCase();
          return bookName.includes(searchQuery.toLowerCase());
        });
      }
    }

    // Update highlighted segment
    setHighlightedSegment(targetSegment);

    // Apply sort order
    return filtered.sort((a, b) => {
      const indexA = booksArray.indexOf(a.djhBook);
      const indexB = booksArray.indexOf(b.djhBook);
      return isAscending ? indexA - indexB : indexB - indexA;
    });
  }, [filter, searchQuery, showSearch, isAscending]);

  // Fetch completion status for all visible segments when filteredData changes
  useEffect(() => {
    const fetchCompletion = async () => {
      const completed: {[key: string]: boolean} = {};
      await Promise.all(
        filteredData.map(async book => {
          await Promise.all(
            book.segments.map(async segmentId => {
              const status = await getSegmentCompletionStatus(String(segmentId), 'main');
              if (status.isCompleted) {
                completed[segmentId] = true;
              }
            })
          );
        })
      );
      setCompletedSegmentIds(completed);
    };
    fetchCompletion();
  }, [filteredData]);

  // Handle book title click
  const handleBookSelect = (bookName: string) => {
    if (showSearch) {
      setSearchQuery(bookName);
      setSelectedBook(bookName);
    }
  };

  // Enhanced segment click handler
  const handleSegmentSelect = (segmentId: string) => {
    // Reset any scroll position that might be stored
    if (Platform.OS === 'web') {
      window.scrollTo(0, 0);
    }
    
    const params: any = {
      segment: `${language}-${version}-${segmentId}`,
      scrollReset: 'true'
    };
    
    // If this segment was found through verse search, pass the verse reference
    if (highlightedSegment === segmentId && searchQuery) {
      const parsedRef = parseReferenceEnhanced(searchQuery);
      if (parsedRef?.verse) {
        params.highlightVerse = `${parsedRef.chapter}:${parsedRef.verse}`;
      }
    }
    
    router.push({
      pathname: "/(tabs)/[segment]" as const,
      params
    });
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      // Clear search when closing
      setSearchQuery('');
      setSelectedBook(null);
      setHighlightedSegment(null);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedBook(null);
    setHighlightedSegment(null);
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

  const ListHeaderComponent = () => (
    <View>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Story Finder</Text>
        <Text style={styles.welcomeText}>
          Navigate through books and chapters to find your next story
        </Text>
      </View>

      {/* Filter and Search Container */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => handleFilterPress('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
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
            <Text style={[styles.filterText, filter === 'ot' && styles.filterTextActive]}>
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
            <Text style={[styles.filterText, filter === 'nt' && styles.filterTextActive]}>
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
        </ScrollView>
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
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search books or verses (e.g., John 3:13)..."
            placeholderTextColor={colors.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
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
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        style={styles.content}
        contentContainerStyle={{ paddingTop: 8 }}
        data={filteredData}
        ListHeaderComponent={ListHeaderComponent}
        renderItem={({ item }) => {
          const bookIndex = booksArray.findIndex(book => book === item.djhBook);
          const parsedRef = parseReferenceEnhanced(searchQuery);
          const isSelected = (showSearch && selectedBook === item.djhBook) || 
                           (parsedRef && findBookByName(parsedRef.book) === item.djhBook);
          
          return (
            <Accordion 
              item={item} 
              bookIndex={bookIndex}
              context="main"
              showGlobalCompletion={true}
              style={{ backgroundColor: '#FFF' }}
              isExpanded={!!(isSelected && showSearch)}
              onBookSelect={handleBookSelect}
              onSegmentSelect={handleSegmentSelect}
              completedSegments={completedSegmentIds}
              highlightedSegment={highlightedSegment}
              searchQuery={searchQuery}
            />
          );
        }}
        keyExtractor={(item) => String(item.djhBook)}
      />
    </SafeAreaView>
  );
};

export default Navigation;