/**
 * The order stories are read in, for whichever context a story was opened from.
 *
 * One source of truth so the reader's ‹ › arrows, the "Up next" card and the
 * Plan tab agree. A plan's order is its own reading order (CatalogItem.stories,
 * already merged into week order for Advent and the other dated plans), never
 * the book-grouped list in ReadingPlansChallenges.json.
 *
 * Pure: callers pass lookups in, so this can be tested without the app.
 */

export type ReadingContext = {
  planId?: string | null;
  challengeId?: string | null;
  voice?: string | null;
};

export type StoryOrderDeps = {
  /** Reading order of a curated or custom plan, or null if unknown. */
  planStories: (id: string) => string[] | null;
  /** Stories where a voice speaks, in canonical order. */
  voiceStories: (name: string) => string[];
  /** Every story, canonical order. */
  allStories: string[];
};

const isStory = (id: string) => /^S\d+$/.test(id);

/** Story IDs for the context, introductions removed. */
export function storiesInContext(ctx: ReadingContext, deps: StoryOrderDeps): string[] {
  const planId = ctx.planId || ctx.challengeId;
  if (planId) {
    const order = deps.planStories(planId);
    if (order && order.length) return order.filter(isStory);
  }
  if (ctx.voice) {
    const order = deps.voiceStories(ctx.voice);
    if (order.length) return order.filter(isStory);
  }
  return deps.allStories.filter(isStory);
}

/** The stories either side of `storyId` in `order`. */
export function neighbours(order: string[], storyId: string): { prev: string | null; next: string | null } {
  const i = order.indexOf(storyId);
  if (i < 0) return { prev: null, next: null };
  return { prev: i > 0 ? order[i - 1] : null, next: i < order.length - 1 ? order[i + 1] : null };
}

/** Canonical order: S001 … S365. */
export function canonicalStories(ids: Iterable<string>): string[] {
  return [...new Set(ids)].filter(isStory).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}
