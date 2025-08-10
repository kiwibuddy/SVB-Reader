import BooksJson from '@/assets/data/BookChapterList.json';

// Create a mapping from short book codes to full book names
const createBookNameMapping = (): { [key: string]: string } => {
  const mapping: { [key: string]: string } = {};
  
  Object.entries(BooksJson).forEach(([shortCode, bookData]) => {
    mapping[shortCode] = (bookData as any).bookName;
  });
  
  return mapping;
};

// Pre-computed mapping for performance
export const BOOK_NAME_MAPPING = createBookNameMapping();

/**
 * Convert a short book code to full book name
 * @param shortCode - Book code like "Gen", "2Co", etc.
 * @returns Full book name like "Genesis", "2 Corinthians", etc.
 */
export const getFullBookName = (shortCode: string): string => {
  return BOOK_NAME_MAPPING[shortCode] || shortCode;
};

/**
 * Get all available book codes
 */
export const getAllBookCodes = (): string[] => {
  return Object.keys(BOOK_NAME_MAPPING);
};

/**
 * Get all available full book names
 */
export const getAllBookNames = (): string[] => {
  return Object.values(BOOK_NAME_MAPPING);
};
