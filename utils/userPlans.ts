import { storyNumber } from '@/constants/divisions';
import { groupForStoryCount, type CatalogItem } from '@/utils/planCatalog';

export const USER_PLAN_PREFIX = 'user_';

export type UserPlanRecord = {
  id: string;
  title: string;
  storyIds: string[];
  createdAt: string;
  updatedAt: string;
};

export function isUserPlanId(id: string | null | undefined): boolean {
  return !!id && id.startsWith(USER_PLAN_PREFIX);
}

export function newUserPlanId(): string {
  return `${USER_PLAN_PREFIX}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Sort into Read-page / Scripture sequence (S001…S365). Stories only. */
export function sortStoriesCanonically(ids: Iterable<string>): string[] {
  return [...new Set(ids)]
    .filter((id) => id.startsWith('S'))
    .sort((a, b) => (storyNumber(a) || 0) - (storyNumber(b) || 0));
}

export function userPlanToCatalogItem(plan: UserPlanRecord): CatalogItem {
  return {
    id: plan.id,
    type: 'plan',
    title: plan.title,
    description: '',
    stories: plan.storyIds,
    group: groupForStoryCount(plan.storyIds.length),
    isUserPlan: true,
  };
}
