type BookAbbreviations = {
  [key: string]: string;
};

// Map common book name variations to standardized abbreviations
const bookAbbreviations: BookAbbreviations = {
  // Old Testament
  'genesis': 'Gen', 'gen': 'Gen',
  'exodus': 'Exo', 'exo': 'Exo', 'ex': 'Exo',
  'leviticus': 'Lev', 'lev': 'Lev',
  'numbers': 'Num', 'num': 'Num',
  'deuteronomy': 'Deu', 'deu': 'Deu', 'deut': 'Deu',
  'joshua': 'Jos', 'jos': 'Jos', 'josh': 'Jos',
  'judges': 'Jdg', 'jdg': 'Jdg', 'judg': 'Jdg',
  'ruth': 'Rut', 'rut': 'Rut',
  '1 samuel': '1Sa', '1sa': '1Sa', '1 sam': '1Sa', '1sam': '1Sa',
  '2 samuel': '2Sa', '2sa': '2Sa', '2 sam': '2Sa', '2sam': '2Sa',
  '1 kings': '1Ki', '1ki': '1Ki', '1 kgs': '1Ki', '1kgs': '1Ki',
  '2 kings': '2Ki', '2ki': '2Ki', '2 kgs': '2Ki', '2kgs': '2Ki',
  '1 chronicles': '1Ch', '1ch': '1Ch', '1 chr': '1Ch', '1chr': '1Ch',
  '2 chronicles': '2Ch', '2ch': '2Ch', '2 chr': '2Ch', '2chr': '2Ch',
  'ezra': 'Ezr', 'ezr': 'Ezr',
  'nehemiah': 'Neh', 'neh': 'Neh',
  'esther': 'Est', 'est': 'Est',
  'job': 'Job',
  'psalms': 'Psa', 'psa': 'Psa', 'ps': 'Psa',
  'proverbs': 'Pro', 'pro': 'Pro', 'prov': 'Pro',
  'ecclesiastes': 'Ecc', 'ecc': 'Ecc', 'eccl': 'Ecc',
  'song of solomon': 'SoS', 'sos': 'SoS', 'song': 'SoS',
  'isaiah': 'Isa', 'isa': 'Isa',
  'jeremiah': 'Jer', 'jer': 'Jer',
  'lamentations': 'Lam', 'lam': 'Lam',
  'ezekiel': 'Eze', 'eze': 'Eze', 'ezek': 'Eze',
  'daniel': 'Dan', 'dan': 'Dan',
  'hosea': 'Hos', 'hos': 'Hos',
  'joel': 'Joe', 'joe': 'Joe',
  'amos': 'Amo', 'amo': 'Amo',
  'obadiah': 'Oba', 'oba': 'Oba',
  'jonah': 'Jon', 'jon': 'Jon',
  'micah': 'Mic', 'mic': 'Mic',
  'nahum': 'Nah', 'nah': 'Nah',
  'habakkuk': 'Hab', 'hab': 'Hab',
  'zephaniah': 'Zep', 'zep': 'Zep',
  'haggai': 'Hag', 'hag': 'Hag',
  'zechariah': 'Zec', 'zec': 'Zec',
  'malachi': 'Mal', 'mal': 'Mal',
  
  // New Testament
  'matthew': 'Mat', 'mat': 'Mat', 'matt': 'Mat',
  'mark': 'Mar', 'mar': 'Mar', 'mk': 'Mar',
  'luke': 'Luk', 'luk': 'Luk', 'lk': 'Luk',
  'john': 'Joh', 'joh': 'Joh', 'jn': 'Joh',
  'acts': 'Act', 'act': 'Act',
  'romans': 'Rom', 'rom': 'Rom',
  '1 corinthians': '1Co', '1co': '1Co', '1 cor': '1Co', '1cor': '1Co',
  '2 corinthians': '2Co', '2co': '2Co', '2 cor': '2Co', '2cor': '2Co',
  'galatians': 'Gal', 'gal': 'Gal',
  'ephesians': 'Eph', 'eph': 'Eph',
  'philippians': 'Php', 'php': 'Php', 'phil': 'Php',
  'colossians': 'Col', 'col': 'Col',
  '1 thessalonians': '1Th', '1th': '1Th', '1 thess': '1Th', '1thess': '1Th',
  '2 thessalonians': '2Th', '2th': '2Th', '2 thess': '2Th', '2thess': '2Th',
  '1 timothy': '1Ti', '1ti': '1Ti', '1 tim': '1Ti', '1tim': '1Ti',
  '2 timothy': '2Ti', '2ti': '2Ti', '2 tim': '2Ti', '2tim': '2Ti',
  'titus': 'Tit', 'tit': 'Tit',
  'philemon': 'Phm', 'phm': 'Phm', 'phlm': 'Phm',
  'hebrews': 'Heb', 'heb': 'Heb',
  'james': 'Jam', 'jam': 'Jam', 'jas': 'Jam',
  '1 peter': '1Pe', '1pe': '1Pe', '1 pet': '1Pe', '1pet': '1Pe',
  '2 peter': '2Pe', '2pe': '2Pe', '2 pet': '2Pe', '2pet': '2Pe',
  '1 john': '1Jn', '1jn': '1Jn', '1 joh': '1Jn', '1joh': '1Jn',
  '2 john': '2Jn', '2jn': '2Jn', '2 joh': '2Jn', '2joh': '2Jn',
  '3 john': '3Jn', '3jn': '3Jn', '3 joh': '3Jn', '3joh': '3Jn',
  'jude': 'Jud', 'jud': 'Jud',
  'revelation': 'Rev', 'rev': 'Rev'
};

export type ParsedReference = {
  book: string;
  chapter: number;
  verse?: number;
} | null;

export function parseReference(reference: string): ParsedReference {
  // Remove extra spaces and make case-insensitive
  const cleanRef = reference.trim().toLowerCase();
  
  // Match patterns like:
  // "Genesis 1:1" or "Gen 1 1" or "Genesis 1" or "Gen1:1" or "Gen1"
  const match = cleanRef.match(/^(\d?\s*[a-z]+)[\s.]?(\d+)(?:[:\s](\d+))?$/);
  
  if (!match) return null;
  
  let [_, bookName, chapter, verse] = match;
  
  // Clean up book name (remove numbers and spaces)
  bookName = bookName.replace(/\d/g, '').trim();
  
  // Get standardized book abbreviation
  const book = bookAbbreviations[bookName];
  if (!book) return null;
  
  return {
    book,
    chapter: parseInt(chapter),
    verse: verse ? parseInt(verse) : undefined
  };
} 