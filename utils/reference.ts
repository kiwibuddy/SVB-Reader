/**
 * Verse reference search — parsing "gen 4:3" into a place in the Bible.
 *
 * The index covers all 66 books. Book names come from BookChapterList.json, so
 * what the parser resolves and what the result row displays are the same strings.
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

type BookTables = {
  canonical: Map<string, number>;
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

function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

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
    .replace(/[.:,]/g, ' ')
    .replace(/([a-zA-ZÀ-ſ])(\d)/g, '$1 $2')
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) return null;

  const numbers: number[] = [];
  let end = tokens.length;
  while (end > 1 && numbers.length < 2 && /^\d+$/.test(tokens[end - 1])) {
    numbers.unshift(parseInt(tokens[end - 1], 10));
    end -= 1;
  }

  const bookTokens = tokens.slice(0, end);
  if (bookTokens.length === 0) return null;

  if (bookTokens.length > 1) {
    const ordinal = ORDINALS[normalize(bookTokens[0])];
    if (ordinal) bookTokens[0] = ordinal;
  }

  const bookQuery = normalize(bookTokens.join(''));
  if (!bookQuery) return null;

  return { bookQuery, chapter: numbers[0], verse: numbers[1] };
}

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
