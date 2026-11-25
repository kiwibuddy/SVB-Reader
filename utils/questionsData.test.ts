/**
 * Guards the discussion questions against the drift found in November 2026:
 * family and school set 1 had been filled from question lists written for a
 * different division of the Bible, so (for example) Isaiah 6–9 asked about
 * Proverbs and Luke 1–2 asked about the cross.
 */
import questionsEn from '@/assets/data/Questions-EN.json';
import segmentTitles from '@/assets/data/SegmentTitles.json';

type Sets = { set1: string[]; set2: string[] };
type Story = Record<'school' | 'family' | 'smallgroup', Sets>;

const QUESTIONS = (questionsEn as unknown as { questions: Record<string, Story> }).questions;
const TITLES = segmentTitles as Record<string, { book: string[] }>;
const STORIES = Array.from({ length: 365 }, (_, i) => `S${String(i + 1).padStart(3, '0')}`);
const AUDIENCES = ['school', 'family', 'smallgroup'] as const;

// Book names that only ever mean the book (not a person or an ordinary word).
const BOOK_WORDS: Record<string, string[]> = {
  Genesis: ['Gen'], Exodus: ['Exo'], Leviticus: ['Lev'], Deuteronomy: ['Deu'],
  Psalm: ['Psa'], Psalms: ['Psa'], Proverbs: ['Pro'], Ecclesiastes: ['Ecc'],
  Lamentations: ['Lam'], Chronicles: ['1Ch', '2Ch'], Acts: ['Act'], Romans: ['Rom'],
  Corinthians: ['1Co', '2Co'], Galatians: ['Gal'], Ephesians: ['Eph'], Philippians: ['Php'],
  Colossians: ['Col'], Thessalonians: ['1Th', '2Th'], Hebrews: ['Heb'], Revelation: ['Rev'],
};

describe('discussion questions (English)', () => {
  it('every story has four set-1 questions per audience, and set 2 is four or none', () => {
    for (const s of STORIES) {
      for (const a of AUDIENCES) {
        const { set1, set2 } = QUESTIONS[s][a];
        expect({ s, a, n: set1.length }).toEqual({ s, a, n: 4 });
        // S061–S080 have no second set yet; the app then shows set 1 only.
        expect({ s, a, ok: set2.length === 0 || set2.length === 4 }).toEqual({ s, a, ok: true });
        for (const q of [...set1, ...set2]) expect(q.trim().length).toBeGreaterThan(5);
      }
    }
  });

  it('set 2 is not a copy of set 1', () => {
    const copies: string[] = [];
    for (const s of STORIES) {
      for (const a of AUDIENCES) {
        const { set1, set2 } = QUESTIONS[s][a];
        // A shared line or two is fine; a set made of set-1 lines is not.
        if (set2.length && set2.filter((q) => set1.includes(q)).length >= 3) copies.push(`${s}/${a}`);
      }
    }
    expect(copies).toEqual([]);
  });

  it('no question names a different book of the Bible from its story', () => {
    const wrong: string[] = [];
    for (const s of STORIES) {
      const book = TITLES[s].book[0];
      for (const a of AUDIENCES) {
        for (const set of ['set1', 'set2'] as const) {
          for (const q of QUESTIONS[s][a][set]) {
            for (const [word, codes] of Object.entries(BOOK_WORDS)) {
              if (new RegExp(`\\b${word}\\b`).test(q) && !codes.includes(book)) {
                wrong.push(`${s} (${book}) ${a}/${set}: ${q}`);
              }
            }
          }
        }
      }
    }
    expect(wrong).toEqual([]);
  });
});
