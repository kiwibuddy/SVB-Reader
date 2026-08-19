import readingPlansData from '@/assets/data/ReadingPlansChallenges.json';

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
  stories: string[];
  group: PlanGroupId;
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
  const month = date.getMonth() + 1;
  const day = date.getDate();
  switch (challengeId) {
    case 'lentenReflectionChronological':
      return month >= 2 && month <= 4;
    case 'christmas12':
    case 'christmas7':
      return month === 12 || (month === 1 && day <= 6);
    case 'adventJourneyChronological':
      return month >= 11 && month <= 12;
    case 'jesusFilm':
      return false;
    default:
      return true;
  }
}

export function nextUnreadStory(
  stories: string[],
  completedIds: Set<string>
): { storyId: string; day: number } | null {
  const index = stories.findIndex((id) => !completedIds.has(id));
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
    segments: Record<string, { segments?: string[] } | undefined>;
  },
  type: PlanItemType
): CatalogItem {
  const stories = storyIdsFromSegments(raw.segments as Record<string, { segments?: string[] } | undefined>);
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
    stories,
    group: groupForStoryCount(stories.length),
  };
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

export function getCatalogItems(): CatalogItem[] {
  const plans = readingPlansData.plans
    .filter((plan) => !HIDDEN_PLAN_IDS.has(plan.id))
    .map((plan) => toCatalogItem(plan as any, 'plan'));
  const challenges = readingPlansData.challenges
    .filter((challenge) => isSeasonalChallengeVisible(challenge.id))
    .map((challenge) => toCatalogItem(challenge as any, 'challenge'));
  return [...plans, ...challenges];
}

export function findCatalogItem(id: string | undefined | null): CatalogItem | undefined {
  if (!id) return undefined;
  return getCatalogItems().find((item) => item.id === id);
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
