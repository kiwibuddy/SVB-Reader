import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import Books from '@/assets/data/BookChapterList.json';
import SegmentTitles from '@/assets/data/SegmentTitles.json';

const books = Books as Record<string, { bookName: string }>;
const titles = SegmentTitles as Record<string, { book?: string[]; ref?: string }>;

export function collectTurnText(node: unknown): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(collectTurnText).join(' ').replace(/\s+/g, ' ').trim();
  const record = node as { note?: unknown; text?: string; children?: unknown };
  if (record.note) return '';
  return `${record.text || ''} ${collectTurnText(record.children)}`.replace(/\s+/g, ' ').trim();
}

export function firstVerseRef(node: unknown): { chapter: string; verse: string } | null {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = firstVerseRef(child);
      if (found) return found;
    }
    return null;
  }
  const record = node as { link?: { chapter?: string; verse?: string }; children?: unknown };
  if (record.link?.chapter && record.link?.verse) {
    return { chapter: record.link.chapter, verse: record.link.verse };
  }
  return firstVerseRef(record.children);
}

export function formatTurnCitation(segmentId: string, block: unknown): {
  text: string;
  citation: string;
  copy: string;
  bookId: string;
  bookName: string;
  storyTitle: string;
  verse: { chapter: string; verse: string } | null;
  passage: string;
} {
  const short = segmentId.match(/S\d+|I\d+/i)?.[0] || segmentId;
  const info = titles[short];
  const bookId = info?.book?.[0] || '';
  const bookName = books[bookId]?.bookName || bookId || 'Scripture';
  const storyTitle = info?.title || '';
  const text = collectTurnText(block);
  const verse = firstVerseRef(block);
  const passage = verse ? `${bookName} ${verse.chapter}:${verse.verse}` : `${bookName} ${info?.ref || ''}`.trim();
  const citation = `${passage} (NLT)`;
  return {
    text,
    citation,
    copy: `"${text}" — ${citation}`,
    bookId,
    bookName,
    storyTitle,
    verse,
    passage,
  };
}

export async function copyTurn(segmentId: string, block: unknown): Promise<string> {
  const { copy } = formatTurnCitation(segmentId, block);
  await Clipboard.setStringAsync(copy);
  return copy;
}

export async function shareTurn(opts: {
  segmentId: string;
  block: unknown;
  speaker: string;
  imageUri?: string | null;
}): Promise<void> {
  const { copy, citation } = formatTurnCitation(opts.segmentId, opts.block);
  if (opts.imageUri && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(opts.imageUri, {
      mimeType: 'image/png',
      dialogTitle: citation,
      UTI: 'public.png',
    });
    return;
  }
  await Share.share(
    Platform.OS === 'ios'
      ? { message: `${opts.speaker}\n${copy}\nSourceView` }
      : { message: `${opts.speaker}\n${copy}\nSourceView`, title: citation }
  );
}
