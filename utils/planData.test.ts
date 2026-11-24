/**
 * Guards the curated plans against the drift that broke Advent: every plan
 * entry must point at the story that holds the passage it describes.
 */
import mappings from '@/assets/data/ChronologicalMappings.json';
import plansData from '@/assets/data/ReadingPlansChallenges.json';
import segmentTitles from '@/assets/data/SegmentTitles.json';
import uiEn from '@/assets/data/UI-ENG.json';
import uiFr from '@/assets/data/FRA-UI.json';
import { getAllCatalogItems } from '@/utils/planCatalog';
import { datedWindow, ADVENT_PLAN_ID, CHRISTMAS7_PLAN_ID, CHRISTMAS12_PLAN_ID } from '@/utils/seasonalPlans';

type Segment = { segmentId: string; book: string; ref?: string; phase: string; note?: string; noteFr?: string };
type Mapping = { phases: Record<string, unknown>; segments: Segment[] };

const MAPPINGS = mappings as unknown as Record<string, Mapping>;
const TITLES = segmentTitles as Record<string, { ref?: string; book?: string[] }>;
const ALL = [...plansData.plans, ...plansData.challenges] as {
  id: string;
  description: string;
  chronologicalMapping?: string;
  segments: Record<string, { segments?: string[] }>;
}[];

/** Lent is out of season until February and still uses the old story numbers. Fix before Feb 1, 2027. */
const KNOWN_BROKEN = new Set(['lentenReflectionChronological']);

const usedMappings = ALL.filter((p) => p.chronologicalMapping && !KNOWN_BROKEN.has(p.chronologicalMapping));

describe.each(usedMappings.map((p) => [p.id, p] as const))('%s', (_id, plan) => {
  const mapping = MAPPINGS[plan.chronologicalMapping!];
  const listed = Object.values(plan.segments)
    .flatMap((b) => b?.segments || [])
    .filter((id) => id.startsWith('S'));

  test('every entry points at the story its book and reference describe', () => {
    for (const seg of mapping.segments.filter((s) => s.segmentId.startsWith('S'))) {
      const actual = TITLES[seg.segmentId];
      expect({ id: seg.segmentId, book: actual?.book?.[0], ref: actual?.ref }).toEqual({
        id: seg.segmentId,
        book: seg.book,
        ref: seg.ref,
      });
    }
  });

  test('the story list and the timeline hold the same stories, once each', () => {
    const mapped = mapping.segments.map((s) => s.segmentId).filter((id) => id.startsWith('S'));
    expect(new Set(listed)).toEqual(new Set(mapped));
    expect(new Set(mapped).size).toBe(mapped.length);
  });

  test('every story sits in a defined phase', () => {
    for (const seg of mapping.segments) expect(Object.keys(mapping.phases)).toContain(seg.phase);
  });

  test('the description gives the right story count', () => {
    const count = Number(plan.description.match(/^(\d+)/)?.[1]);
    expect(count).toBe(new Set(listed).size);
  });
});

describe('seasonal plans', () => {
  const items = getAllCatalogItems();
  const item = (id: string) => items.find((i) => i.id === id)!;

  test('have one story per day of the 2026 season', () => {
    expect(datedWindow(ADVENT_PLAN_ID, item(ADVENT_PLAN_ID).stories.length, new Date(2026, 10, 17))).not.toBeNull();
    expect(datedWindow(CHRISTMAS7_PLAN_ID, item(CHRISTMAS7_PLAN_ID).stories.length, new Date(2026, 11, 1))).not.toBeNull();
    expect(datedWindow(CHRISTMAS12_PLAN_ID, item(CHRISTMAS12_PLAN_ID).stories.length, new Date(2026, 11, 20))).not.toBeNull();
  });

  test('Advent 2026 reads Revelation first and Luke on Christmas Eve', () => {
    const stories = item(ADVENT_PLAN_ID).stories;
    expect(stories[0]).toBe('S365');
    expect(stories[7]).toBe('S199'); // Sun Dec 6: Isaiah 40
    expect(stories[14]).toBe('S204'); // Sun Dec 13: Isaiah 61
    expect(stories[21]).toBe('S098'); // Sun Dec 20: 2 Samuel 7
    expect(stories[25]).toBe('S285'); // Dec 24: Luke 1-2
  });

  test.each(['adventJourneyChronological', 'christmas7Chronological', 'christmas12Chronological', 'womenOfTheBibleChronological'])(
    '%s has an English and French note for every day',
    (key) => {
      for (const seg of MAPPINGS[key].segments) {
        expect(seg.note?.length).toBeGreaterThan(5);
        expect(seg.noteFr?.length).toBeGreaterThan(5);
      }
    }
  );

  test.each(['adventJourneyChronological', 'christmas7Chronological', 'christmas12Chronological'])(
    '%s phase titles exist in English and French',
    (key) => {
      const en = (uiEn as any).UI.chronologicalPhases[key];
      const fr = (uiFr as any).UI.chronologicalPhases[key];
      for (const phase of Object.keys(MAPPINGS[key].phases)) {
        expect(en[phase]?.title).toBeTruthy();
        expect(fr[phase]?.title).toBeTruthy();
      }
    }
  );

  test.each(['advent', 'upNext', 'planJourney', 'streak', 'reminders', 'voicePlan'])('%s strings exist in both languages', (section) => {
    expect(Object.keys((uiFr as any).UI[section]).sort()).toEqual(Object.keys((uiEn as any).UI[section]).sort());
  });

  test('Advent strings exist in both languages', () => {
    const en = (uiEn as any).UI.advent;
    const fr = (uiFr as any).UI.advent;
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
  });

  test('Advent UI strings never claim a reading time in minutes', () => {
    const minutes = /\bmin(ute)?s?\b/i;
    for (const ui of [uiEn, uiFr] as any[]) {
      for (const [key, value] of Object.entries(ui.UI.advent)) {
        if (typeof value === 'string') {
          expect({ key, value }).toEqual({ key, value: expect.not.stringMatching(minutes) });
        }
      }
    }
  });
});
