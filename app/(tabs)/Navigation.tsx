import { View, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, useWindowDimensions } from "react-native";
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
    gap: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B00',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  searchInputIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchBar: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
});

const Navigation = () => {
  const { completedSegments } = useAppContext();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAscending, setIsAscending] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { colors } = useAppSettings();
  const styles = createStyles(isLargeScreen, colors);

  // Define Old and New Testament books
  const oldTestamentBooks = ['Gen', 'Exo', 'Lev', 'Num', 'Deu', 'Jos', 'Jdg', 'Rut', '1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch', 'Ezr', 'Neh', 'Est', 'Job', 'Psa', 'Pro', 'Ecc', 'SoS', 'Isa', 'Jer', 'Lam', 'Eze', 'Dan', 'Hos', 'Joe', 'Amo', 'Oba', 'Jon', 'Mic', 'Nah', 'Hab', 'Zep', 'Hag', 'Zec', 'Mal'];
  const newTestamentBooks = ['Mat', 'Mar', 'Luk', 'Joh', 'Act', 'Rom', '1Co', '2Co', 'Gal', 'Eph', 'Php', 'Col', '1Th', '2Th', '1Ti', '2Ti', 'Tit', 'Phm', 'Heb', 'Jam', '1Pe', '2Pe', '1Jn', '2Jn', '3Jn', 'Jud', 'Rev'];

  // Handle book title click
  const handleBookSelect = (bookName: string) => {
    // Only update search if search is active
    if (showSearch) {
      setSearchQuery(bookName);
      setSelectedBook(bookName);
    }
  };

  // Handle segment click when chapter is selected
  const handleSegmentSelect = (segmentId: string) => {
    router.push(`/read/${segmentId}`);
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      // Clear search when closing
      setSearchQuery('');
      setSelectedBook(null);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedBook(null);
  };

  const filteredData = React.useMemo(() => {
    let filtered = [...data];

    // Apply testament filter
    if (filter === 'ot') {
      filtered = filtered.filter(item => oldTestamentBooks.includes(item.djhBook));
    } else if (filter === 'nt') {
      filtered = filtered.filter(item => newTestamentBooks.includes(item.djhBook));
    }

    // Apply search filter
    if (searchQuery && showSearch) {
      const parsedRef = parseReference(searchQuery);
      
      if (parsedRef?.book) {
        // Filter to show only the selected book
        filtered = filtered.filter(item => {
          const bookName = Books[item.djhBook].bookName.toLowerCase();
          return bookName === parsedRef.book.toLowerCase();
        });

        // If chapter is specified, filter segments by chapter reference
        if (parsedRef.chapter) {
          filtered = filtered.map(item => ({
            ...item,
            segments: item.segments.filter(segId => {
              const segmentData = SegmentTitles[segId];
              if (!('ref' in segmentData)) return false;
              
              // Check if the reference contains the chapter number
              const chapterStr = `:${parsedRef.chapter}`;
              return segmentData.ref.includes(chapterStr);
            })
          }));
        }
      } else {
        // Normal book name search
        const cleanQuery = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(item => {
          const bookName = Books[item.djhBook].bookName;
          const cleanBookName = bookName.replace(/^\d+\s*/, '').toLowerCase();
          return cleanBookName.startsWith(cleanQuery);
        });
      }
    }

    // Sort the data
    filtered.sort((a, b) => {
      const bookOrderA = [...oldTestamentBooks, ...newTestamentBooks].indexOf(a.djhBook);
      const bookOrderB = [...oldTestamentBooks, ...newTestamentBooks].indexOf(b.djhBook);
      return isAscending ? bookOrderA - bookOrderB : bookOrderB - bookOrderA;
    });

    return filtered;
  }, [filter, isAscending, searchQuery, showSearch]);

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
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => handleFilterPress('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All {filter === 'all' && (isAscending ? ' ↓' : ' ↑')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'ot' && styles.filterButtonActive]}
            onPress={() => handleFilterPress('ot')}
          >
            <Text style={[styles.filterText, filter === 'ot' && styles.filterTextActive]}>
              Old Testament {filter === 'ot' && (isAscending ? ' ↓' : ' ↑')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'nt' && styles.filterButtonActive]}
            onPress={() => handleFilterPress('nt')}
          >
            <Text style={[styles.filterText, filter === 'nt' && styles.filterTextActive]}>
              New Testament {filter === 'nt' && (isAscending ? ' ↓' : ' ↑')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, showSearch && styles.filterButtonActive]}
            onPress={handleSearchToggle}
          >
            <Ionicons 
              name="search" 
              size={20} 
              color={showSearch ? '#FFF' : '#666'} 
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar - Only show when search is active */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchInputIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search books..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <FlatList
          data={filteredData}
          renderItem={({ item }) => {
            const bookIndex = booksArray.findIndex(book => book === item.djhBook);
            const isSelected = Books[item.djhBook].bookName.toLowerCase() === 
              parseReference(searchQuery)?.book?.toLowerCase();
            
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
