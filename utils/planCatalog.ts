import readingPlansData from '@/assets/data/ReadingPlansChallenges.json';
import { chronologicalStoryIds } from '@/utils/chronologicalPlans';
import { isSeasonalPlanOffered } from '@/utils/seasonalPlans';

const HIDDEN_PLAN_IDS = new Set(['SchoolYear2', 'SchoolYear3', 'test']);

export const PLAN_GROUPS = ['year', 'monthly', 'mini'] as const;
export type PlanGroupId = (typeof PLAN_GROUPS)[number];

export type PlanItemType = 'plan' | 'challenge';

export type CatalogItem = {
  id: string;
  type: PlanItemType;
  title: string;
  description: string;
  shortDescription?: string;
  longDescription?: string;
  titleFr?: string;
  descriptionFr?: string;
  shortDescriptionFr?: string;
  longDescriptionFr?: string;
  chronologicalOrder?: boolean;
  chronologicalMapping?: string;
  stories: string[];
  group: PlanGroupId;
  /** Device-local playlist created by the user (2.1+). */
  isUserPlan?: boolean;
};

const GROUP_THRESHOLDS = {
  year: 100,
  monthly: 30,
};

export function storyIdsFromSegments(
  segments: Record<string, { segments?: string[] } | undefined> | undefined
): string[] {
  return Object.values(segments || {})
    .flatMap((entry) => entry?.segments || [])
    .filter((id) => id.startsWith('S'));
}

export function groupForStoryCount(count: number): PlanGroupId {
  if (count >= GROUP_THRESHOLDS.year) return 'year';
  if (count >= GROUP_THRESHOLDS.monthly) return 'monthly';
  return 'mini';
}

export function isSeasonalChallengeVisible(challengeId: string, date = new Date()): boolean {
  if (challengeId === 'jesusFilm') return false;
  return isSeasonalPlanOffered(challengeId, date);
}

/**
 * First unread story at or after `startIndex` (a late joiner who chose to
 * start at today's reading), then any unread story before it.
 */
export function nextUnreadStory(
  stories: string[],
  completedIds: Set<string>,
  startIndex = 0
): { storyId: string; day: number } | null {
  const from = Math.max(0, Math.min(startIndex, stories.length));
  let index = stories.findIndex((id, i) => i >= from && !completedIds.has(id));
  if (index < 0) index = stories.findIndex((id) => !completedIds.has(id));
  if (index < 0) return null;
  return { storyId: stories[index], day: index + 1 };
}

function toCatalogItem(
  raw: {
    id: string;
    title: string;
    description: string;
    shortDescription?: string;
    longDescription?: string;
    titleFr?: string;
    descriptionFr?: string;
    shortDescriptionFr?: string;
    longDescriptionFr?: string;
    chronologicalOrder?: boolean;
    chronologicalMapping?: string;
    segments: Record<string, { segments?: string[] } | undefined>;
  },
  type: PlanItemType
): CatalogItem {
  const fromBooks = storyIdsFromSegments(raw.segments as Record<string, { segments?: string[] } | undefined>);
  const mapped = chronologicalStoryIds(raw.chronologicalMapping);
  const stories = mergeStoryOrder(fromBooks, mapped);
  return {
    id: raw.id,
    type,
    title: raw.title,
    description: raw.description,
    shortDescription: raw.shortDescription,
    longDescription: raw.longDescription,
    titleFr: raw.titleFr,
    descriptionFr: raw.descriptionFr,
    shortDescriptionFr: raw.shortDescriptionFr,
    longDescriptionFr: raw.longDescriptionFr,
    chronologicalOrder: raw.chronologicalOrder,
    chronologicalMapping: raw.chronologicalMapping,
    stories,
    group: groupForStoryCount(stories.length),
  };
}

function mergeStoryOrder(fromBooks: string[], mapped: string[]): string[] {
  if (!mapped.length) return fromBooks;
  const allowed = new Set(fromBooks);
  const ordered = mapped.filter((id) => allowed.has(id));
  if (!ordered.length) return fromBooks;
  const seen = new Set(ordered);
  return [...ordered, ...fromBooks.filter((id) => !seen.has(id))];
}

export function getLocalizedPlanText(
  item: CatalogItem,
  field: 'title' | 'description' | 'shortDescription' | 'longDescription',
  language: string
): string {
  if (language.startsWith('fr')) {
    const frKey = `${field}Fr` as keyof CatalogItem;
    const fr = item[frKey];
    if (typeof fr === 'string' && fr) return fr;
  }
  return (item[field] as string) || '';
}

let allItemsCache: CatalogItem[] | null = null;

/** Every curated plan, including seasonal plans outside their season. */
export function getAllCatalogItems(): CatalogItem[] {
  if (!allItemsCache) {
    const plans = readingPlansData.plans
      .filter((plan) => !HIDDEN_PLAN_IDS.has(plan.id))
      .map((plan) => toCatalogItem(plan as any, 'plan'));
    const challenges = readingPlansData.challenges
      .filter((challenge) => challenge.id !== 'jesusFilm')
      .map((challenge) => toCatalogItem(challenge as any, 'challenge'));
    allItemsCache = [...plans, ...challenges];
  }
  return allItemsCache;
}

/** Whether a plan is offered to start today (seasonal plans only in season). */
export function isCatalogItemOffered(item: CatalogItem, date = new Date()): boolean {
  return item.type !== 'challenge' || isSeasonalChallengeVisible(item.id, date);
}

/** Plans offered to start today. */
export function getCatalogItems(date = new Date()): CatalogItem[] {
  return getAllCatalogItems().filter((item) => isCatalogItemOffered(item, date));
}

/** Looks up any curated plan, so a seasonal plan someone started stays reachable after its season. */
export function findCatalogItem(id: string | undefined | null): CatalogItem | undefined {
  if (!id) return undefined;
  return getAllCatalogItems().find((item) => item.id === id);
}

export function itemsByGroup(
  items: CatalogItem[],
  excludeIds: Set<string>
): Record<PlanGroupId, CatalogItem[]> {
  const grouped: Record<PlanGroupId, CatalogItem[]> = {
    year: [],
    monthly: [],
    mini: [],
  };
  for (const item of items) {
    if (excludeIds.has(item.id)) continue;
    grouped[item.group].push(item);
  }
  return grouped;
}
