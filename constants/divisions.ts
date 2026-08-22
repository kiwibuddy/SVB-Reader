export interface Division {
  id: number;
  key: string;
  titleEn: string;
  titleFr: string;
  booksEn: string;
  booksFr: string;
  start: number;
  end: number;
}

export const DIVISIONS: Division[] = [
  { id: 1, key: 'beginning', titleEn: 'The Beginning', titleFr: 'Le Commencement', booksEn: 'Genesis – Deuteronomy', booksFr: 'Genèse – Deutéronome', start: 1, end: 68 },
  { id: 2, key: 'land', titleEn: 'History', titleFr: 'Histoire', booksEn: 'Joshua – Esther', booksFr: 'Josué – Esther', start: 69, end: 154 },
  { id: 3, key: 'songs', titleEn: 'Wisdom', titleFr: 'Sagesse', booksEn: 'Job – Song of Songs', booksFr: 'Job – Cantique des cantiques', start: 155, end: 189 },
  { id: 4, key: 'warnings', titleEn: 'Major Prophets', titleFr: 'Grands Prophètes', booksEn: 'Isaiah – Daniel', booksFr: 'Ésaïe – Daniel', start: 190, end: 248 },
  { id: 5, key: 'messengers', titleEn: 'Minor Prophets', titleFr: 'Petits Prophètes', booksEn: 'Hosea – Malachi', booksFr: 'Osée – Malachie', start: 249, end: 265 },
  { id: 6, key: 'life', titleEn: 'Gospels', titleFr: 'Évangiles', booksEn: 'Matthew – John', booksFr: 'Matthieu – Jean', start: 266, end: 307 },
  { id: 7, key: 'church', titleEn: 'The Church Begins', titleFr: 'L’Église commence', booksEn: 'Acts', booksFr: 'Actes', start: 308, end: 319 },
  { id: 8, key: 'letters', titleEn: 'Paul’s Letters', titleFr: 'Lettres de Paul', booksEn: 'Romans – Philemon', booksFr: 'Romains – Philémon', start: 320, end: 346 },
  { id: 9, key: 'everyone', titleEn: 'Letters to Everyone', titleFr: 'Lettres à tous', booksEn: 'Hebrews – Jude', booksFr: 'Hébreux – Jude', start: 347, end: 358 },
  { id: 10, key: 'end', titleEn: 'Revelation', titleFr: 'Apocalypse', booksEn: 'Revelation', booksFr: 'Apocalypse', start: 359, end: 365 },
];

export function storyNumber(segmentId: string): number | null {
  const match = segmentId.match(/S(\d+)/i);
  if (!match) return null;
  return parseInt(match[1], 10);
}

export function storyIdFromNumber(n: number): string {
  return `S${String(n).padStart(3, '0')}`;
}

export function divisionForStory(segmentId: string): Division | undefined {
  const n = storyNumber(segmentId);
  if (n == null) return undefined;
  return DIVISIONS.find((d) => n >= d.start && n <= d.end);
}

export function storiesInDivision(division: Division): string[] {
  const ids: string[] = [];
  for (let n = division.start; n <= division.end; n += 1) {
    ids.push(storyIdFromNumber(n));
  }
  return ids;
}
