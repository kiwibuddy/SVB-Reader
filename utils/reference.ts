/**
 * Verse reference search — parsing "gen 4:3" into a place in the Bible.
 *
 * The index is built from source by scripts/build-verse-index.js and covers all
 * 66 books. Book names come from BookChapterList.json, so what the parser
 * resolves and what the result row displays are the same strings.
 */

type VerseSearchIndex = {
  books: string[];
  segs: string[];
  /** "bookIdx-chapter-verse" → [segIdx, blockIdx] */
  v: Record<string, [number, number]>;
};

type AliasEntry = {
  canonical: string;
  code: string;
  aliases: string[];
  fr: string;
  frAliases: string[];
};

let _index: VerseSearchIndex | null = null;

function getVerseIndex(): VerseSearchIndex {
  if (!_index) {
    _index = require('@/assets/data/verseSearchIndex.json') as VerseSearchIndex;
  }
  return _index;
}

export type ReferenceResult = {
  segmentId: string;
  blockIndex: number;
  book: string;
  chapter: number;
  verse: number;
};

export type ReferenceLookup =
  | { kind: 'exact'; result: ReferenceResult }
  | { kind: 'disambiguate'; options: { book: string; bookIndex: number }[] }
  | { kind: 'notFound' };

// ---- Book names and aliases ----

type BookTables = {
  /** Normalised canonical name → book index. An exact hit wins outright. */
  canonical: Map<string, number>;
  /** Normalised alias → every book claiming it. "jud" is Jude *and* Judges. */
  alias: Map<string, number[]>;
};

let _tables: BookTables | null = null;

function getBookTables(): BookTables {
  if (_tables) return _tables;

  const entries = require('@/assets/data/bookAliases.json') as AliasEntry[];
  const idx = getVerseIndex();

  const canonical = new Map<string, number>();
  const alias = new Map<string, number[]>();

  const claim = (name: string, bookIndex: number) => {
    const key = normalize(name);
    if (!key) return;
    const existing = alias.get(key);
    if (existing) {
      if (!existing.includes(bookIndex)) existing.push(bookIndex);
    } else {
      alias.set(key, [bookIndex]);
    }
  };

  for (const entry of entries) {
    const bookIndex = idx.books.indexOf(entry.canonical);
    // Should never happen — build-verse-index.js fails the build if it does.
    if (bookIndex === -1) continue;

    canonical.set(normalize(entry.canonical), bookIndex);
    canonical.set(normalize(entry.fr), bookIndex);

    claim(entry.canonical, bookIndex);
    claim(entry.fr, bookIndex);
    for (const name of entry.aliases) claim(name, bookIndex);
    for (const name of entry.frAliases) claim(name, bookIndex);
  }

  _tables = { canonical, alias };
  return _tables;
}

// ---- Normalisation ----

function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]/g, ''); // strip punctuation and spaces
}

// ---- Parsing ----

/** Roman numerals and words that stand in for a book's leading number. */
const ORDINALS: Record<string, string> = {
  i: '1', ii: '2', iii: '3',
  premier: '1', premiere: '1', deuxieme: '2', troisieme: '3',
  first: '1', second: '2', third: '3',
};

type ParsedReference = { bookQuery: string; chapter?: number; verse?: number };

function parseReference(input: string): ParsedReference | null {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;

  const tokens = trimmed
    // Treat . : , as separators, the same as a space.
    .replace(/[.:,]/g, ' ')
    // Split a run-together book and chapter: "1co13" → "1co 13". Only at a
    // letter→digit boundary, so the leading digit of "1co" is left alone.
    .replace(/([a-zA-ZÀ-ſ])(\d)/g, '$1 $2')
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) return null;

  // Take up to two trailing all-digit tokens as chapter and verse. Everything
  // before them names the book, which may be several words ("Song of Songs")
  // and may start with a number ("1 Corinthians").
  const numbers: number[] = [];
  let end = tokens.length;
  while (end > 1 && numbers.length < 2 && /^\d+$/.test(tokens[end - 1])) {
    numbers.unshift(parseInt(tokens[end - 1], 10));
    end -= 1;
  }

  const bookTokens = tokens.slice(0, end);
  if (bookTokens.length === 0) return null;

  // "i cor" → "1 cor". Only when something follows, so "Isaiah" — a single
  // token — is never mistaken for the numeral "I" plus "saiah".
  if (bookTokens.length > 1) {
    const ordinal = ORDINALS[normalize(bookTokens[0])];
    if (ordinal) bookTokens[0] = ordinal;
  }

  const bookQuery = normalize(bookTokens.join(''));
  if (!bookQuery) return null;

  return { bookQuery, chapter: numbers[0], verse: numbers[1] };
}

/**
 * Books a query could mean, best first.
 *
 * An exact canonical name wins outright — typing "Judges" in full is not
 * ambiguous. Anything shorter that more than one book answers to comes back as
 * a list, so the user picks: "jud" is Jude and Judges, "phil" is Philippians
 * and Philemon.
 */
function resolveBook(bookQuery: string): number[] {
  const { canonical, alias } = getBookTables();

  const exact = canonical.get(bookQuery);
  if (exact !== undefined) return [exact];

  const claimed = alias.get(bookQuery);
  if (claimed && claimed.length > 0) return [...claimed].sort((a, b) => a - b);

  const matches = new Set<number>();
  for (const [key, indices] of alias) {
    if (key.startsWith(bookQuery)) {
      for (const index of indices) matches.add(index);
    }
  }
  return [...matches].sort((a, b) => a - b);
}

const _singleChapter = new Map<number, boolean>();

/** True when a book has no chapter 2 — checked against the index, not a list. */
function isSingleChapter(bookIndex: number): boolean {
  const cached = _singleChapter.get(bookIndex);
  if (cached !== undefined) return cached;
  const single = !(`${bookIndex}-2-1` in getVerseIndex().v);
  _singleChapter.set(bookIndex, single);
  return single;
}

export function lookupReference(input: string): ReferenceLookup {
  const parsed = parseReference(input);
  if (!parsed) return { kind: 'notFound' };

  const bookIndices = resolveBook(parsed.bookQuery);
  if (bookIndices.length === 0) return { kind: 'notFound' };

  const idx = getVerseIndex();

  if (bookIndices.length > 1) {
    return {
      kind: 'disambiguate',
      options: bookIndices.map((bookIndex) => ({ book: idx.books[bookIndex], bookIndex })),
    };
  }

  const bookIndex = bookIndices[0];
  let chapter = parsed.chapter ?? 1;
  let verse = parsed.verse ?? 1;

  // Obadiah, Philemon, 2 and 3 John and Jude have a single chapter, so one
  // number after the book name is a verse — "jude 3" is Jude 1:3, not chapter 3.
  if (parsed.chapter !== undefined && parsed.verse === undefined && isSingleChapter(bookIndex)) {
    chapter = 1;
    verse = parsed.chapter;
  }

  const entry = idx.v[`${bookIndex}-${chapter}-${verse}`];

  if (!entry) return { kind: 'notFound' };

  return {
    kind: 'exact',
    result: {
      segmentId: idx.segs[entry[0]],
      blockIndex: entry[1],
      book: idx.books[bookIndex],
      chapter,
      verse,
    },
  };
}

/** Chapters available in a book, ascending. */
export function getBookChapters(bookIndex: number): number[] {
  const idx = getVerseIndex();
  const chapters = new Set<number>();
  const prefix = `${bookIndex}-`;
  for (const key of Object.keys(idx.v)) {
    if (key.startsWith(prefix)) {
      chapters.add(parseInt(key.split('-')[1], 10));
    }
  }
  return Array.from(chapters).sort((a, b) => a - b);
}
