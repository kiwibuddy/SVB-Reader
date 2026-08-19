/**
 * Verse reference search — D0 lazy index loader + D1 parser + D2 alias resolution.
 */

type VerseSearchIndex = {
  books: string[];
  segs: string[];
  v: Record<string, [number, number, number]>;
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
  position: number;
  book: string;
  chapter: number;
  verse: number;
};

export type ReferenceLookup =
  | { kind: 'exact'; result: ReferenceResult }
  | { kind: 'disambiguate'; options: { book: string; bookIndex: number }[] }
  | { kind: 'notFound' };

// ---- D2: Book alias table (loaded lazily alongside the index) ----

let _aliases: Record<string, number> | null = null;
let _bookNames: { canonical: string; index: number }[] | null = null;

function getAliasMap(): { aliases: Record<string, number>; bookNames: { canonical: string; index: number }[] } {
  if (_aliases && _bookNames) return { aliases: _aliases, bookNames: _bookNames };

  const data = require('@/assets/data/bookAliases.json') as {
    canonical: string;
    aliases: string[];
    fr: string;
    frAliases: string[];
  }[];

  const idx = getVerseIndex();
  const map: Record<string, number> = {};
  const names: { canonical: string; index: number }[] = [];

  data.forEach((entry) => {
    const bIdx = idx.books.indexOf(entry.canonical);
    if (bIdx === -1) return;
    names.push({ canonical: entry.canonical, index: bIdx });

    const allNames = [
      entry.canonical,
      ...entry.aliases,
      entry.fr,
      ...entry.frAliases,
    ];
    for (const name of allNames) {
      const norm = normalize(name);
      if (norm && !(norm in map)) {
        map[norm] = bIdx;
      }
    }
  });

  _aliases = map;
  _bookNames = names;
  return { aliases: map, bookNames: names };
}

// ---- Normalization ----

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]/g, '');      // strip punctuation/spaces
}

// ---- D1: Reference parsing ----

const ORDINAL_MAP: Record<string, string> = {
  i: '1', ii: '2', iii: '3',
  premier: '1', deuxieme: '2', troisieme: '3',
  first: '1', second: '2', third: '3',
};

function parseReference(input: string): { bookQuery: string; chapter?: number; verse?: number } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Separate the leading book name from trailing numbers
  // e.g. "1 co 13:4" → ordinal "1", book part "co", numbers "13:4"
  // e.g. "genesis 4:3" → book "genesis", numbers "4:3"
  const match = trimmed.match(
    /^([iI]{1,3}|[123]|premier|deuxi[eè]me|troisi[eè]me|first|second|third)?\s*([a-zA-ZÀ-ÿ]+)\s*[.:\s,]*(\d+)?\s*[.:\s,]*(\d+)?$/
  );
  if (!match) return null;

  const [, ordRaw, bookRaw, chRaw, vsRaw] = match;
  let bookQuery = normalize(bookRaw);

  if (ordRaw) {
    const ordNorm = normalize(ordRaw);
    const digit = ORDINAL_MAP[ordNorm] || ordNorm;
    bookQuery = digit + bookQuery;
  }

  return {
    bookQuery,
    chapter: chRaw ? parseInt(chRaw, 10) : undefined,
    verse: vsRaw ? parseInt(vsRaw, 10) : undefined,
  };
}

function resolveBook(bookQuery: string): number[] {
  const { aliases, bookNames } = getAliasMap();

  // Exact alias match
  if (bookQuery in aliases) return [aliases[bookQuery]];

  // Prefix match
  const matches: number[] = [];
  const seen = new Set<number>();
  for (const name of bookNames) {
    const norm = normalize(name.canonical);
    if (norm.startsWith(bookQuery) && !seen.has(name.index)) {
      seen.add(name.index);
      matches.push(name.index);
    }
  }
  if (matches.length > 0) return matches;

  // Also check all alias keys for prefix
  for (const [key, idx] of Object.entries(aliases)) {
    if (key.startsWith(bookQuery) && !seen.has(idx)) {
      seen.add(idx);
      matches.push(idx);
    }
  }
  return matches;
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
      options: bookIndices.map((bi) => ({ book: idx.books[bi], bookIndex: bi })),
    };
  }

  const bIdx = bookIndices[0];
  const chapter = parsed.chapter ?? 1;
  const verse = parsed.verse ?? 1;
  const key = `${bIdx}-${chapter}-${verse}`;
  const entry = idx.v[key];

  if (!entry) return { kind: 'notFound' };

  return {
    kind: 'exact',
    result: {
      segmentId: idx.segs[entry[0]],
      blockIndex: entry[1],
      position: entry[2],
      book: idx.books[bIdx],
      chapter,
      verse,
    },
  };
}

/**
 * For a given book index, find all chapters available.
 */
export function getBookChapters(bookIndex: number): number[] {
  const idx = getVerseIndex();
  const chapters = new Set<number>();
  const prefix = `${bookIndex}-`;
  for (const key of Object.keys(idx.v)) {
    if (key.startsWith(prefix)) {
      const ch = parseInt(key.split('-')[1], 10);
      chapters.add(ch);
    }
  }
  return Array.from(chapters).sort((a, b) => a - b);
}
