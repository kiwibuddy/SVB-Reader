import { canonicalStories, neighbours, storiesInContext, type StoryOrderDeps } from '@/utils/storyOrder';
import { findCatalogItem } from '@/utils/planCatalog';
import plansData from '@/assets/data/ReadingPlansChallenges.json';

const ALL = canonicalStories(['S003', 'S001', 'I001', 'S002', 'S365']);

const deps = (plans: Record<string, string[]> = {}): StoryOrderDeps => ({
  planStories: (id) => plans[id] ?? findCatalogItem(id)?.stories ?? null,
  voiceStories: (name) => (name === 'Gabriel' ? ['S247', 'S285'] : []),
  allStories: ALL,
});

test('canonical order drops introductions and sorts by story number', () => {
  expect(ALL).toEqual(['S001', 'S002', 'S003', 'S365']);
});

test('Advent arrows follow the day order, not the book grouping', () => {
  const order = storiesInContext({ challengeId: 'adventJourneyChronological' }, deps());
  // Day 8 is Isaiah 40 (S199); Day 9 is Micah (S257). The book-grouped list
  // in ReadingPlansChallenges.json would jump from S199 to S200 instead.
  expect(neighbours(order, 'S199')).toEqual({ prev: 'S191', next: 'S257' });
  expect(neighbours(order, 'S365')).toEqual({ prev: null, next: 'S002' });
  expect(neighbours(order, 'S285')).toEqual({ prev: 'S266', next: null });

  const advent = plansData.challenges.find((c) => c.id === 'adventJourneyChronological')!;
  const bookGrouped = Object.values(advent.segments).flatMap((b) => b.segments).filter((s) => s.startsWith('S'));
  expect(bookGrouped[bookGrouped.indexOf('S199') + 1]).not.toBe('S257');
});

test('custom plans use their saved order', () => {
  const order = storiesInContext({ planId: 'user_abc' }, deps({ user_abc: ['S010', 'I002', 'S004'] }));
  expect(order).toEqual(['S010', 'S004']);
});

test('a voice walks that voice’s stories; no context walks the whole Bible', () => {
  expect(storiesInContext({ voice: 'Gabriel' }, deps())).toEqual(['S247', 'S285']);
  expect(storiesInContext({}, deps())).toEqual(ALL);
});

test('an unknown plan falls back to the whole Bible', () => {
  expect(storiesInContext({ planId: 'nope' }, deps())).toEqual(ALL);
});

test('a story outside the order has no neighbours', () => {
  expect(neighbours(['S001', 'S002'], 'S900')).toEqual({ prev: null, next: null });
});
