import React, { useState, useEffect, useMemo, useRef } from "react";
import { View, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, useWindowDimensions, Platform, Modal, Animated } from "react-native";
import Accordion from "@/components/navigation/NavBook";
import BooksJson from "@/assets/data/BookChapterList.json";
import SegmentTitlesJson from "@/assets/data/SegmentTitles.json";
import { useAppContext } from "@/context/GlobalContext";
import { Ionicons } from '@expo/vector-icons';
import { parseReference } from '@/utils/parseReference';
import { findSegmentId } from '@/utils/referenceMapping';
import { useRouter } from 'expo-router';
import SearchResults from '@/components/navigation/SearchResults';
import { useAppSettings } from '@/context/AppSettingsContext';
import { getSegmentCompletionStatus } from "@/api/sqlite";
import ReadingModeModal from '@/components/GroupReading/ReadingModeModal';
import BibleData from '@/assets/data/newBibleNLT1.json';
import TopSpeakersData from '@/assets/data/TopSpeakers.json';
import { useFocusEffect } from '@react-navigation/native';

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
    marginBottom: 24,
  },
  welcomeTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.secondary,
    lineHeight: 22,
  },
  filterIconContainer: {
    padding: 4,
    backgroundColor: colors.background,
    position: 'relative',
  },
  filterIconContainerActive: {
    backgroundColor: colors.background,
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
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
  // Filter panel styles
  filterPanelContent: {
    backgroundColor: colors.background,
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  filterPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterPanelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.card,
  },
  clearAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  filterCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCheckboxActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  completedDot: {
    backgroundColor: '#34C759',
  },
  incompleteDot: {
    backgroundColor: colors.border,
  },
});

// Update AccordionItem type to accept string for djhBook
export interface AccordionItem {
  djhBook: string;
  bookName: string;
  segments: SegmentKey[];
}

const Navigation = () => {
  const { completedSegments, language, version, updateSegmentId } = useAppContext();
  // Removed old filter state - now using advanced filters only
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [highlightedSegment, setHighlightedSegment] = useState<string | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    testament: string[]
    readingTime: string[]
    bookCategory: string[]
    speakers: string[]
  }>({
    testament: [],
    readingTime: [],
    bookCategory: [],
    speakers: []
  });
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

  // Reading Mode Modal State
  const [showReadingModeModal, setShowReadingModeModal] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [selectedSegmentTitle, setSelectedSegmentTitle] = useState<string>('');
  const [selectedSegmentRef, setSelectedSegmentRef] = useState<string>('');

  // Helper functions for filtering
  const getBookCategory = (bookKey: string) => {
    const historicalBooks = ['Gen', 'Exo', 'Lev', 'Num', 'Deu', 'Jos', 'Jdg', 'Rut', '1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch', 'Ezr', 'Neh', 'Est'];
    const poetryBooks = ['Job', 'Psa', 'Pro', 'Ecc', 'SoS'];
    const majorProphets = ['Isa', 'Jer', 'Lam', 'Eze', 'Dan'];
    const minorProphets = ['Hos', 'Joe', 'Amo', 'Oba', 'Jon', 'Mic', 'Nah', 'Hab', 'Zep', 'Hag', 'Zec', 'Mal'];
    const gospels = ['Mat', 'Mar', 'Luk', 'Joh'];
    const epistles = ['Rom', '1Co', '2Co', 'Gal', 'Eph', 'Php', 'Col', '1Th', '2Th', '1Ti', '2Ti', 'Tit', 'Phm', 'Heb', 'Jam', '1Pe', '2Pe', '1Jn', '2Jn', '3Jn', 'Jud'];
    
    if (historicalBooks.includes(bookKey)) return 'Historical';
    if (poetryBooks.includes(bookKey)) return 'Poetry & Wisdom';
    if (majorProphets.includes(bookKey)) return 'Major Prophets';
    if (minorProphets.includes(bookKey)) return 'Minor Prophets';
    if (gospels.includes(bookKey)) return 'Gospels';
    if (bookKey === 'Act') return 'History';
    if (epistles.includes(bookKey)) return 'Epistles';
    if (bookKey === 'Rev') return 'Prophecy';
    return 'Other';
  };

  const getBookReadingTime = (bookKey: string) => {
    const book = Books[bookKey];
    if (!book) return '5-10 min';
    
    const segmentCount = book.segments.length;
    // Estimate 2-3 minutes per segment on average
    const totalMinutes = segmentCount * 2.5;
    
    if (totalMinutes <= 10) return '5-10 min';
    if (totalMinutes <= 15) return '10-15 min';
    return '15-20 min';
  };

  const getSegmentSpeakers = (segmentId: string): string[] => {
    // Use the actual TopSpeakers data to check which speakers appear in this segment
    const speakers: string[] = [];
    
    // Check if any top speakers appear in this segment
    Object.keys(TopSpeakersData.speakerSegmentMap).forEach(speakerName => {
      const segments = (TopSpeakersData.speakerSegmentMap as any)[speakerName];
      if (segments && segments.includes(segmentId)) {
        speakers.push(speakerName);
      }
    });
    
    // Add epistle authorship logic - narrator segments from books authored by key speakers
    const epistleAuthorship: {[key: string]: string[]} = {
      'Paul': [
        'I045', 'S320', 'S321', 'S322', 'S323', 'S324', 'S325', // Romans
        'I046', 'S326', 'S327', 'S328', 'S329', 'S330', // 1 Corinthians
        'I047', 'S331', 'S332', 'S333', 'S334', // 2 Corinthians
        'I048', 'S335', 'S336', // Galatians
        'I049', 'S337', 'S338', // Ephesians
        'I050', 'S339', // Philippians
        'I051', 'S340', // Colossians
        'I052', 'S341', // 1 Thessalonians
        'I053', 'S342', // 2 Thessalonians
        'I054', 'S343', // 1 Timothy
        'I055', 'S344', // 2 Timothy
        'I056', 'S345', // Titus
        'I057', 'S346', // Philemon
        'I058', 'S347', 'S348', 'S349', 'S350', 'S351' // Hebrews (traditional attribution)
      ],
      'Simon Peter': [
        'I060', 'S353', // 1 Peter
        'I061', 'S354'  // 2 Peter
      ],
      'John the Disciple': [
        'I062', 'S355', // 1 John
        'I063', 'S356', // 2 John
        'I064', 'S357'  // 3 John
      ],
      'James Brother of Jesus': [
        'I059', 'S352'  // James
      ],
      'Jude': [
        'I065', 'S358'  // Jude
      ]
    };
    
    // Check if this segment is from a book authored by any of the key speakers
    Object.entries(epistleAuthorship).forEach(([author, authoredSegments]) => {
      if (authoredSegments.includes(segmentId) && !speakers.includes(author)) {
        speakers.push(author);
      }
    });
    
    return speakers;
  };

  // State for expanded speaker lists
  const [showAllOTSpeakers, setShowAllOTSpeakers] = useState(false);
  const [showAllNTSpeakers, setShowAllNTSpeakers] = useState(false);

  // Get speakers for display (top 5 or all 20)
  const getOTSpeakers = () => {
    const speakers = TopSpeakersData.oldTestament.map(s => s.name);
    return showAllOTSpeakers ? speakers.slice(0, 20) : speakers.slice(0, 5);
  };

  const getNTSpeakers = () => {
    const speakers = TopSpeakersData.newTestament.map(s => s.name);
    return showAllNTSpeakers ? speakers.slice(0, 20) : speakers.slice(0, 5);
  };

  // Get all available speakers for filtering logic
  const getAllAvailableSpeakers = () => {
    const otSpeakers = TopSpeakersData.oldTestament.slice(0, 20).map(s => s.name);
    const ntSpeakers = TopSpeakersData.newTestament.slice(0, 20).map(s => s.name);
    return [...otSpeakers, ...ntSpeakers];
  };

    // Get filtered segments for a specific book based on active filters
  const getFilteredSegments = (bookSegments: any[], bookKey: string) => {
    let filteredSegments = [...bookSegments];

    // Apply speaker filters - only show segments with selected speakers
    if (activeFilters.speakers.length > 0) {
      filteredSegments = filteredSegments.filter(segmentId => {
        const speakers = getSegmentSpeakers(String(segmentId));
        return activeFilters.speakers.some(speaker => speakers.includes(speaker));
      });
    }

    // Note: Other filters (testament, reading time, book category) are book-level filters
    // They don't filter individual segments within a book

    return filteredSegments;
  };

  // Enhanced filtered data with verse search and advanced filters
  const filteredData = React.useMemo(() => {
    let filtered = [...data];
    let targetSegment = null;
    let targetBookKey: string | null = null;

    // Apply book-level filters
    if (activeFilters.testament.length > 0) {
      filtered = filtered.filter(item => {
        const testament = oldTestamentBooks.includes(item.djhBook) ? 'Old Testament' : 'New Testament';
        return activeFilters.testament.includes(testament);
      });
    }

    if (activeFilters.readingTime.length > 0) {
      filtered = filtered.filter(item => {
        // Calculate average reading time for this book
        const avgTime = getBookReadingTime(item.djhBook);
        return activeFilters.readingTime.includes(avgTime);
      });
    }

    if (activeFilters.bookCategory.length > 0) {
      filtered = filtered.filter(item => {
        const category = getBookCategory(item.djhBook);
        return activeFilters.bookCategory.includes(category);
      });
    }

    // Apply segment-level filters (speakers) - only show books that have matching segments
    if (activeFilters.speakers.length > 0) {
      filtered = filtered.filter(item => {
        const filteredSegments = getFilteredSegments(item.segments, item.djhBook);
        return filteredSegments.length > 0; // Only show books with matching segments
      });
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

    // Apply sort order (always ascending by biblical order)
    return filtered.sort((a, b) => {
      const indexA = booksArray.indexOf(a.djhBook);
      const indexB = booksArray.indexOf(b.djhBook);
      return indexA - indexB;
    });
  }, [searchQuery, showSearch, activeFilters, completedSegmentIds]);

  // Filter management functions
  const toggleFilter = (category: keyof typeof activeFilters, value: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev }
      const currentValues = newFilters[category]
      
      if (currentValues.includes(value)) {
        newFilters[category] = currentValues.filter(v => v !== value)
      } else {
        newFilters[category] = [...currentValues, value]
      }
      
      return newFilters
    })
  }

  const clearAllFilters = () => {
    setActiveFilters({
      testament: [],
      readingTime: [],
      bookCategory: [],
      speakers: []
    })
  }

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).flat().length
  }

  const toggleFilterPanel = () => {
    setShowFilterPanel(!showFilterPanel)
  }

  const handleFilterIconPress = () => {
    // Ensure we can always toggle the filter panel
    setShowFilterPanel(prev => !prev)
  }

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

  // Refresh completion status when returning from reading segments
  useFocusEffect(
    React.useCallback(() => {
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
    }, [filteredData])
  );

  // Handle book title click
  const handleBookSelect = (bookName: string) => {
    if (showSearch) {
      setSearchQuery(bookName);
      setSelectedBook(bookName);
    }
  };

  // Handle segment selection - show ReadingModeModal instead of direct navigation
  const handleSegmentSelect = (segmentId: string) => {
    const segmentData = SegmentTitles[segmentId as keyof typeof SegmentTitles];
    if (segmentData) {
      setSelectedSegmentId(segmentId);
      setSelectedSegmentTitle(segmentData.title);
      setSelectedSegmentRef(segmentData.ref || '');
      setShowReadingModeModal(true);
    }
  };

  // Reading Mode Modal Handlers
  const handleIndividualReading = async () => {
    setShowReadingModeModal(false);
    await updateSegmentId(`ENG-NLT-${selectedSegmentId}`);
    const segment = SegmentTitles[selectedSegmentId as keyof typeof SegmentTitles];
    router.push({
      pathname: "/(tabs)/[segment]",
      params: {
        segment: `ENG-NLT-${selectedSegmentId}`,
        book: segment?.book[0] || ''
      }
    });
  };

  const handleGroupReading = () => {
    setShowReadingModeModal(false);
    router.push({
      pathname: '/group-setup' as any,
      params: {
        storyId: selectedSegmentId,
        storyTitle: selectedSegmentTitle,
        scriptureReference: selectedSegmentRef,
      }
    });
  };

  const handleCancelModal = () => {
    setShowReadingModeModal(false);
  };

  // Get story data for the modal
  const getStoryData = () => {
    return BibleData[selectedSegmentId as keyof typeof BibleData] || SegmentTitles[selectedSegmentId as keyof typeof SegmentTitles];
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

  // Removed old filter button handler - now using advanced filters only

  const ListHeaderComponent = () => (
    <View>
      {/* No filter bar - using top-right filter icon instead */}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeTitleRow}>
            <Text style={styles.welcomeTitle}>Story Finder</Text>
            <TouchableOpacity 
              style={[
                styles.filterIconContainer, 
                getActiveFilterCount() > 0 && styles.filterIconContainerActive
              ]}
              onPress={handleFilterIconPress}
            >
              <Ionicons 
                name="options-outline" 
                size={24} 
                color={colors.text} 
              />
              {getActiveFilterCount() > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {getActiveFilterCount()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.welcomeText}>
            Navigate through books and chapters to find your next story
          </Text>
        </View>
        
        <FlatList
          style={{ flex: 1 }}
          data={filteredData}
          ListHeaderComponent={ListHeaderComponent}
          renderItem={({ item }) => {
            const bookIndex = booksArray.findIndex(book => book === item.djhBook);
            const parsedRef = parseReferenceEnhanced(searchQuery);
            const isSelected = (showSearch && selectedBook === item.djhBook) || 
                             (parsedRef && findBookByName(parsedRef.book) === item.djhBook);
            
            // Get filtered segments for this book
            const filteredSegments = getFilteredSegments(item.segments, item.djhBook);
            const itemWithFilteredSegments = {
              ...item,
              segments: filteredSegments
            };

            return (
              <Accordion 
                item={itemWithFilteredSegments} 
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
                originalSegmentCount={item.segments.length}
              />
            );
          }}
          keyExtractor={(item) => String(item.djhBook)}
        />
      </View>
              <ReadingModeModal
          visible={showReadingModeModal}
          story={getStoryData()}
          storyTitle={selectedSegmentTitle}
          scriptureReference={selectedSegmentRef}
          storyId={selectedSegmentId}
          onIndividual={handleIndividualReading}
          onGroup={handleGroupReading}
          onCancel={handleCancelModal}
        />
      
      {/* Premium Filter Panel */}
      <Modal
        visible={showFilterPanel}
        transparent={false}
        animationType="slide"
        onRequestClose={toggleFilterPanel}
      >
        <View style={styles.filterPanelContent}>
          <View style={styles.filterPanelHeader}>
            <Text style={styles.filterPanelTitle}>Find Your Story</Text>
            <TouchableOpacity style={styles.clearAllButton} onPress={clearAllFilters}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {/* Testament Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Testament</Text>
              {['Old Testament', 'New Testament'].map(testament => (
                <TouchableOpacity
                  key={testament}
                  style={styles.filterOption}
                  onPress={() => toggleFilter('testament', testament)}
                >
                  <View style={[
                    styles.filterCheckbox,
                    activeFilters.testament.includes(testament) && styles.filterCheckboxActive
                  ]}>
                    {activeFilters.testament.includes(testament) && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <Text style={styles.filterOptionText}>{testament}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reading Time Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Reading Time</Text>
              {['5-10 min', '10-15 min', '15-20 min'].map(time => (
                <TouchableOpacity
                  key={time}
                  style={styles.filterOption}
                  onPress={() => toggleFilter('readingTime', time)}
                >
                  <View style={[
                    styles.filterCheckbox,
                    activeFilters.readingTime.includes(time) && styles.filterCheckboxActive
                  ]}>
                    {activeFilters.readingTime.includes(time) && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <Text style={styles.filterOptionText}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Speakers Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Key Speakers</Text>
              
              {/* Old Testament Speakers */}
              <Text style={[styles.filterSectionTitle, { fontSize: 14, marginTop: 12, marginBottom: 8 }]}>Old Testament</Text>
              {getOTSpeakers().map((speaker: string) => (
                <TouchableOpacity
                  key={speaker}
                  style={styles.filterOption}
                  onPress={() => toggleFilter('speakers', speaker)}
                >
                  <View style={[
                    styles.filterCheckbox,
                    activeFilters.speakers.includes(speaker) && styles.filterCheckboxActive
                  ]}>
                    {activeFilters.speakers.includes(speaker) && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <Text style={styles.filterOptionText}>{speaker}</Text>
                </TouchableOpacity>
              ))}
              {!showAllOTSpeakers && TopSpeakersData.oldTestament.length > 5 && (
                <TouchableOpacity
                  style={[styles.filterOption, { justifyContent: 'center' }]}
                  onPress={() => setShowAllOTSpeakers(true)}
                >
                  <Text style={[styles.filterOptionText, { color: '#007AFF', fontWeight: '600' }]}>
                    Show {TopSpeakersData.oldTestament.length - 5} more...
                  </Text>
                </TouchableOpacity>
              )}
              {showAllOTSpeakers && (
                <TouchableOpacity
                  style={[styles.filterOption, { justifyContent: 'center' }]}
                  onPress={() => setShowAllOTSpeakers(false)}
                >
                  <Text style={[styles.filterOptionText, { color: '#007AFF', fontWeight: '600' }]}>
                    Show less
                  </Text>
                </TouchableOpacity>
              )}

              {/* New Testament Speakers */}
              <Text style={[styles.filterSectionTitle, { fontSize: 14, marginTop: 16, marginBottom: 8 }]}>New Testament</Text>
              {getNTSpeakers().map((speaker: string) => (
                <TouchableOpacity
                  key={speaker}
                  style={styles.filterOption}
                  onPress={() => toggleFilter('speakers', speaker)}
                >
                  <View style={[
                    styles.filterCheckbox,
                    activeFilters.speakers.includes(speaker) && styles.filterCheckboxActive
                  ]}>
                    {activeFilters.speakers.includes(speaker) && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <Text style={styles.filterOptionText}>{speaker}</Text>
                </TouchableOpacity>
              ))}
              {!showAllNTSpeakers && TopSpeakersData.newTestament.length > 5 && (
                <TouchableOpacity
                  style={[styles.filterOption, { justifyContent: 'center' }]}
                  onPress={() => setShowAllNTSpeakers(true)}
                >
                  <Text style={[styles.filterOptionText, { color: '#007AFF', fontWeight: '600' }]}>
                    Show {TopSpeakersData.newTestament.length - 5} more...
                  </Text>
                </TouchableOpacity>
              )}
              {showAllNTSpeakers && (
                <TouchableOpacity
                  style={[styles.filterOption, { justifyContent: 'center' }]}
                  onPress={() => setShowAllNTSpeakers(false)}
                >
                  <Text style={[styles.filterOptionText, { color: '#007AFF', fontWeight: '600' }]}>
                    Show less
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Story Themes section removed - using actual speaker data instead */}

            {/* Book Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Book Category</Text>
              {['Historical', 'Poetry & Wisdom', 'Major Prophets', 'Gospels', 'Epistles'].map(category => (
                <TouchableOpacity
                  key={category}
                  style={styles.filterOption}
                  onPress={() => toggleFilter('bookCategory', category)}
                >
                  <View style={[
                    styles.filterCheckbox,
                    activeFilters.bookCategory.includes(category) && styles.filterCheckboxActive
                  ]}>
                    {activeFilters.bookCategory.includes(category) && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <Text style={styles.filterOptionText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Apply Button */}
          <TouchableOpacity
            style={styles.applyButton}
            onPress={toggleFilterPanel}
          >
            <Text style={styles.applyButtonText}>
              Apply Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Navigation;