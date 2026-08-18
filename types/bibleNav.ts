import SegmentTitles from '@/assets/data/SegmentTitles.json';
import Books from '@/assets/data/BookChapterList.json';

export type SegmentKey = keyof typeof SegmentTitles;
export type SegmentIds = keyof typeof Books;
