import Books from "@/assets/data/BookChapterList.json";
import SegmentTitles from "@/assets/data/SegmentTitles.json";

type ChapterRange = {
  start: number;
  end: number;
  segmentId: string;
};

type BookMapping = {
  [book: string]: ChapterRange[];
};

// Build chapter ranges from SegmentTitles
function buildChapterRanges(): BookMapping {
  const mapping: BookMapping = {};
  
  // Process each segment
  Object.entries(SegmentTitles).forEach(([segmentId, data]) => {
    const { book, ref } = data as { book: string[], ref?: string };
    if (!ref) return;
    
    const bookCode = book[0];
    if (!mapping[bookCode]) {
      mapping[bookCode] = [];
    }
    
    // Parse reference range (e.g., "1-3" or "1")
    const [start, end] = ref.split('-').map(num => parseInt(num));
    
    mapping[bookCode].push({
      start,
      end: end || start,
      segmentId
    });
  });
  
  return mapping;
}

const chapterMapping = buildChapterRanges();

export function findSegmentId(book: string, chapter: number, verse?: number): string | null {
  const bookRanges = chapterMapping[book];
  if (!bookRanges) return null;
  
  // Find the range that contains this chapter
  const range = bookRanges.find(r => 
    chapter >= r.start && chapter <= r.end
  );
  
  return range?.segmentId || null;
} 