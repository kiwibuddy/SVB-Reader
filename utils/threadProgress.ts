import { databaseManager } from '@/api/database-manager';
import logger from '@/utils/logger';

export function shortStoryId(segmentId: string): string {
  const match = segmentId.match(/[SI]\d+/i);
  return match ? match[0].toUpperCase() : segmentId;
}

export async function getCompletedStoryIds(): Promise<Set<string>> {
  try {
    const db = await databaseManager.ensureDatabase();
    const rows = await db.getAllAsync<{ segmentID: string }>(
      `SELECT segmentID FROM completedSegments WHERE isCompleted = 1 AND (segmentID LIKE 'S%' OR segmentID LIKE '%-S%')`
    );
    return new Set(rows.map((row) => shortStoryId(row.segmentID)));
  } catch (error) {
    logger.error('Error loading completed stories', error);
    return new Set();
  }
}
