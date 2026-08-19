import Books from '@/assets/data/BookChapterList.json';
import { storyNumber } from '@/constants/divisions';

const books = Books as Record<string, { bookName: string; segments?: string[] }>;

/** Romans–Jude are written. Revelation is spoken. */
export const WRITTEN_START = 320;
export const WRITTEN_END = 358;

const LETTER_AUTHORS: Record<string, string[]> = {
  Paul: ['Rom', '1Co', '2Co', 'Gal', 'Eph', 'Php', 'Col', '1Th', '2Th', '1Ti', '2Ti', 'Tit', 'Phm'],
  James: ['Jas'],
  Peter: ['1Pe', '2Pe'],
  John: ['1Jn', '2Jn', '3Jn'],
  Jude: ['Jud'],
};

export function isWrittenStory(storyId: string): boolean {
  const n = storyNumber(storyId);
  return n != null && n >= WRITTEN_START && n <= WRITTEN_END;
}

export function writtenLetterCount(name: string): number {
  const ids = LETTER_AUTHORS[name];
  if (!ids) return 0;
  return ids.filter((id) => books[id]).length;
}

export function isWrittenVoice(name: string, storyIds: string[]): boolean {
  if (writtenLetterCount(name) > 0) return true;
  return storyIds.length > 0 && storyIds.every(isWrittenStory);
}
