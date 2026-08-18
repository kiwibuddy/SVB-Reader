import { databaseManager } from '@/api/database-manager';
import { bibleLoader } from '@/services/BibleLoader';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import logger from '@/utils/logger';

export const TOTAL_VOICES = 774;

const NARRATION = new Set(['The Narrator', 'The Compiler', 'The Preacher', 'The Choir']);

export interface VoicesMetCelebration {
  title: string;
  firstVoice: string | null;
  metCount: number;
  totalVoices: number;
}

function shortId(segmentId: string): string {
  return segmentId.includes('-') ? segmentId.split('-').pop() || segmentId : segmentId;
}

function sourcesFor(bible: Record<string, any> | null, segmentId: string): string[] {
  if (!bible) return [];
  const entry = bible[shortId(segmentId)];
  if (!entry?.sources || typeof entry.sources !== 'object') return [];
  return Object.keys(entry.sources);
}

export async function getVoicesMetCount(): Promise<number> {
  try {
    const bible = bibleLoader.getCurrentBible();
    const db = await databaseManager.ensureDatabase();
    const rows = await db.getAllAsync<{ segmentID: string }>(
      `SELECT DISTINCT segmentID FROM completedSegments WHERE isCompleted = 1 AND segmentID LIKE 'S%'`
    );
    const met = new Set<string>();
    for (const row of rows) {
      for (const name of sourcesFor(bible, row.segmentID)) {
        met.add(name);
      }
    }
    return met.size;
  } catch (error) {
    logger.error('Error counting voices met:', error);
    return 0;
  }
}

export async function getVoicesMetCelebration(segmentId: string): Promise<VoicesMetCelebration> {
  const id = shortId(segmentId);
  const title = (SegmentTitles as Record<string, { title?: string }>)[id]?.title || id;
  const fallback: VoicesMetCelebration = {
    title,
    firstVoice: null,
    metCount: 0,
    totalVoices: TOTAL_VOICES,
  };

  try {
    const bible = bibleLoader.getCurrentBible();
    const thisSources = sourcesFor(bible, id);
    const db = await databaseManager.ensureDatabase();
    const rows = await db.getAllAsync<{ segmentID: string }>(
      `SELECT DISTINCT segmentID FROM completedSegments WHERE isCompleted = 1 AND segmentID LIKE 'S%'`
    );

    const previous = new Set<string>();
    for (const row of rows) {
      const completedId = shortId(row.segmentID);
      if (completedId === id) continue;
      for (const name of sourcesFor(bible, completedId)) {
        previous.add(name);
      }
    }

    const firstTime = thisSources.filter((name) => !previous.has(name));
    const firstVoice = firstTime.find((name) => !NARRATION.has(name)) || firstTime[0] || null;

    const met = new Set(previous);
    thisSources.forEach((name) => met.add(name));

    return {
      title,
      firstVoice,
      metCount: met.size,
      totalVoices: TOTAL_VOICES,
    };
  } catch (error) {
    logger.error('Error computing voices-met celebration:', error);
    return fallback;
  }
}
