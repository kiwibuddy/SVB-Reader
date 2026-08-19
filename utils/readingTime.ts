import ReadingTimesData from '@/assets/data/SegmentReadingTimes.json';

interface SegmentReadingTime {
  segmentId: string;
  title: string;
  wordCount: number;
  estimatedReadingTimeMinutes: number;
  book: string;
  reference: string;
  isIntroduction: boolean;
}

/**
 * Get the estimated reading time for a segment
 * @param segmentId - The segment ID (e.g., 'S001', 'I001')
 * @returns The estimated reading time in minutes, or 0 if not found
 */
export function getSegmentReadingTime(segmentId: string): number {
  const segmentData = ReadingTimesData[segmentId as keyof typeof ReadingTimesData] as SegmentReadingTime;
  return segmentData?.estimatedReadingTimeMinutes || 0;
}

/**
 * Get the word count for a segment
 * @param segmentId - The segment ID (e.g., 'S001', 'I001')
 * @returns The word count, or 0 if not found
 */
export function getSegmentWordCount(segmentId: string): number {
  const segmentData = ReadingTimesData[segmentId as keyof typeof ReadingTimesData] as SegmentReadingTime;
  return segmentData?.wordCount || 0;
}

/**
 * Get full reading time data for a segment
 * @param segmentId - The segment ID (e.g., 'S001', 'I001')
 * @returns The full reading time data, or null if not found
 */
export function getSegmentReadingData(segmentId: string): SegmentReadingTime | null {
  const segmentData = ReadingTimesData[segmentId as keyof typeof ReadingTimesData] as SegmentReadingTime;
  return segmentData || null;
}

/**
 * Format reading time for display
 * @param minutes - The reading time in minutes
 * @returns Formatted string like "5 minutes" or "1 minute"
 */
export function formatReadingTime(minutes: number): string {
  if (minutes <= 0) return '0 minutes';
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/** Compact label used on thread rows and the continue card, e.g. "12 min". */
export function formatReadingMinutes(minutes: number): string {
  if (minutes <= 0) return '';
  return `${minutes} min`;
}

/**
 * Get reading time with formatted text
 * @param segmentId - The segment ID (e.g., 'S001', 'I001')
 * @returns Formatted reading time string
 */
export function getFormattedReadingTime(segmentId: string): string {
  const minutes = getSegmentReadingTime(segmentId);
  return formatReadingTime(minutes);
} 