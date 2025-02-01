import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Books from "@/assets/data/BookChapterList.json";
import { Ionicons } from '@expo/vector-icons';
import { parseReference } from '@/utils/parseReference';
import { findSegmentId } from '@/utils/referenceMapping';

type SearchResultProps = {
  query: string;
  onSelect: (segmentId: string) => void;
  onBookSelect: (bookName: string) => void;
};

// Add type for BookData
type BookData = {
  bookName: string;
  chapters: string;  // Changed from number to string
  segments: string[];
  verseCount: number;
  FCBH: string;
  YV: string;
};

const SearchResults: React.FC<SearchResultProps> = ({ query, onSelect, onBookSelect }) => {
  if (!query) return null;

  const cleanQuery = query.toLowerCase().trim();
  const parsedRef = parseReference(query);
  
  // If we have a complete reference with verse, show navigation button
  if (parsedRef?.book && parsedRef?.chapter && parsedRef?.verse) {
    const segmentId = findSegmentId(parsedRef.book, parsedRef.chapter, parsedRef.verse);
    if (segmentId) {
      return (
        <View style={styles.container}>
          <TouchableOpacity 
            style={styles.goToButton}
            onPress={() => onSelect(segmentId)}
          >
            <Text style={styles.goToText}>Go to {query}</Text>
            <Ionicons name="arrow-forward" size={20} color="#FF6B00" />
          </TouchableOpacity>
        </View>
      );
    }
  }

  // If we have a book (either from typing or selection), show chapters AND verses if chapter is selected
  if (parsedRef?.book) {
    const book = Object.entries(Books as Record<string, BookData>).find(([_, bookData]) => 
      bookData.bookName.toLowerCase() === parsedRef.book.toLowerCase()
    );
    
    if (!book) return null;
    const [_, bookData] = book;

    // Show chapters immediately when book is selected/typed
    const chapters = Array.from({ length: parseInt(bookData.chapters) }, (_, i) => i + 1);
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.sectionTitle}>Select Chapter</Text>
        {chapters.map(chapter => (
          <TouchableOpacity
            key={chapter}
            style={styles.chapterItem}
            onPress={() => onBookSelect(`${parsedRef.book} ${chapter}`)}
          >
            <Text style={styles.chapterText}>
              {parsedRef.book} {chapter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  // Show matching books while typing letters
  const matchingBooks = Object.entries(Books).filter(([_, book]) => {
    const bookName = book.bookName.toLowerCase();
    return bookName.startsWith(cleanQuery);
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Select Book</Text>
      {matchingBooks.map(([_, book]) => (
        <TouchableOpacity 
          key={book.bookName}
          style={styles.bookItem}
          onPress={() => onBookSelect(book.bookName)}
        >
          <Text style={styles.bookTitle}>{book.bookName}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 300,
    backgroundColor: '#FFF',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  bookItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  chapterItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  chapterText: {
    fontSize: 16,
    color: '#000',
  },
  verseItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  verseText: {
    fontSize: 16,
    color: '#000',
  },
  goToButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
  },
  goToText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
});

export default SearchResults; 