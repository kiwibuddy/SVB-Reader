import logger from '@/utils/logger';
import { databaseManager } from '@/api/database-manager';
import {
  isUserPlanId,
  newUserPlanId,
  sortStoriesCanonically,
  userPlanToCatalogItem,
  type UserPlanRecord,
} from '@/utils/userPlans';
import { findCatalogItem, type CatalogItem } from '@/utils/planCatalog';

type UserPlanRow = {
  id: string;
  title: string;
  story_ids: string;
  created_at: string;
  updated_at: string;
};

function parseRow(row: UserPlanRow): UserPlanRecord {
  let storyIds: string[] = [];
  try {
    const parsed = JSON.parse(row.story_ids);
    if (Array.isArray(parsed)) {
      storyIds = sortStoriesCanonically(parsed.filter((id): id is string => typeof id === 'string'));
    }
  } catch {
    storyIds = [];
  }
  return {
    id: row.id,
    title: row.title,
    storyIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listUserPlans(): Promise<UserPlanRecord[]> {
  try {
    const db = await databaseManager.ensureDatabase();
    const rows = await db.getAllAsync<UserPlanRow>(
      `SELECT id, title, story_ids, created_at, updated_at
       FROM user_plans
       ORDER BY datetime(created_at) DESC`
    );
    return (rows || []).map(parseRow);
  } catch (error) {
    logger.error('Error listing user plans:', error);
    return [];
  }
}

export async function getUserPlan(id: string): Promise<UserPlanRecord | null> {
  try {
    const db = await databaseManager.ensureDatabase();
    const row = await db.getFirstAsync<UserPlanRow>(
      `SELECT id, title, story_ids, created_at, updated_at FROM user_plans WHERE id = ?`,
      [id]
    );
    return row ? parseRow(row) : null;
  } catch (error) {
    logger.error('Error getting user plan:', error);
    return null;
  }
}

export async function getUserPlanStoryIds(id: string): Promise<string[] | null> {
  const plan = await getUserPlan(id);
  return plan ? plan.storyIds : null;
}

/** Create a custom plan (stories only, canonical order). Does not start it — caller should startPlan. */
export async function createUserPlan(title: string, storyIds: Iterable<string>): Promise<UserPlanRecord> {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error('Title is required');
  }
  const ordered = sortStoriesCanonically(storyIds);
  if (!ordered.length) {
    throw new Error('At least one story is required');
  }

  const id = newUserPlanId();
  const now = new Date().toISOString();
  const db = await databaseManager.ensureDatabase();
  await db.runAsync(
    `INSERT INTO user_plans (id, title, story_ids, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, trimmed, JSON.stringify(ordered), now, now]
  );
  return {
    id,
    title: trimmed,
    storyIds: ordered,
    createdAt: now,
    updatedAt: now,
  };
}

export async function deleteUserPlan(id: string): Promise<void> {
  if (!isUserPlanId(id)) {
    throw new Error('Not a user plan id');
  }
  try {
    const db = await databaseManager.ensureDatabase();
    await db.runAsync(`DELETE FROM reading_plan_progress WHERE planID = ?`, [id]);
    await db.runAsync(
      `DELETE FROM plan_challenge_status WHERE itemID = ? AND itemType = 'plan'`,
      [id]
    );
    await db.runAsync(`DELETE FROM segment_completion WHERE planID = ? AND completionType = 'plan'`, [
      id,
    ]);
    await db.runAsync(`DELETE FROM user_plans WHERE id = ?`, [id]);
  } catch (error) {
    logger.error('Error deleting user plan:', error);
    throw error;
  }
}

export async function findPlanItem(id: string | null | undefined): Promise<CatalogItem | undefined> {
  if (!id) return undefined;
  const catalog = findCatalogItem(id);
  if (catalog) return catalog;
  if (!isUserPlanId(id)) return undefined;
  const plan = await getUserPlan(id);
  return plan ? userPlanToCatalogItem(plan) : undefined;
}

export async function listUserPlanCatalogItems(): Promise<CatalogItem[]> {
  const plans = await listUserPlans();
  return plans.map(userPlanToCatalogItem);
}
