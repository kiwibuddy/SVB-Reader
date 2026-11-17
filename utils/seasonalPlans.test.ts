import {
  ADVENT_PLAN_ID,
  CHRISTMAS12_PLAN_ID,
  CHRISTMAS7_PLAN_ID,
  LENT_PLAN_ID,
  datedWindow,
  dateForDay,
  firstSundayOfAdvent,
  isSeasonalPlanOffered,
  seasonProgressCutoff,
  seasonWindow,
  todayIndex,
} from '@/utils/seasonalPlans';
import { nextUnreadStory } from '@/utils/planCatalog';
import { contrastRatio, readableOn } from '@/utils/contrast';

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

describe('first Sunday of Advent', () => {
  test.each([
    [2022, '2022-11-27'],
    [2023, '2023-12-03'],
    [2024, '2024-12-01'],
    [2025, '2025-11-30'],
    [2026, '2026-11-29'],
    [2027, '2027-11-28'],
    [2028, '2028-12-03'],
  ])('%i starts %s', (year, expected) => {
    const sunday = firstSundayOfAdvent(year);
    expect(ymd(sunday)).toBe(expected);
    expect(sunday.getDay()).toBe(0);
  });
});

describe('season windows', () => {
  test('Advent 2026 runs 26 days, Sun Nov 29 to Thu Dec 24', () => {
    const w = seasonWindow(ADVENT_PLAN_ID, new Date(2026, 10, 17))!;
    expect(ymd(w.start)).toBe('2026-11-29');
    expect(w.days).toBe(26);
    expect(ymd(dateForDay(w, 25))).toBe('2026-12-24');
  });

  test('Advent length changes by year, so dates only show when the story count matches', () => {
    expect(seasonWindow(ADVENT_PLAN_ID, new Date(2027, 10, 1))!.days).toBe(27);
    expect(seasonWindow(ADVENT_PLAN_ID, new Date(2028, 10, 1))!.days).toBe(22);
    expect(datedWindow(ADVENT_PLAN_ID, 26, new Date(2026, 10, 17))).not.toBeNull();
    expect(datedWindow(ADVENT_PLAN_ID, 26, new Date(2027, 10, 17))).toBeNull();
  });

  test('7 Days of Christmas ends on Christmas Day', () => {
    const w = seasonWindow(CHRISTMAS7_PLAN_ID, new Date(2026, 11, 1))!;
    expect(ymd(w.start)).toBe('2026-12-19');
    expect(ymd(dateForDay(w, 6))).toBe('2026-12-25');
  });

  test('12 Days of Christmas runs Dec 25 to Jan 5, and January still belongs to it', () => {
    const fromDec = seasonWindow(CHRISTMAS12_PLAN_ID, new Date(2026, 11, 20))!;
    const fromJan = seasonWindow(CHRISTMAS12_PLAN_ID, new Date(2027, 0, 3))!;
    expect(ymd(fromDec.start)).toBe('2026-12-25');
    expect(ymd(fromJan.start)).toBe('2026-12-25');
    expect(ymd(dateForDay(fromDec, 11))).toBe('2027-01-05');
  });

  test("today's index", () => {
    const w = seasonWindow(ADVENT_PLAN_ID, new Date(2026, 10, 17))!;
    expect(todayIndex(w, new Date(2026, 10, 28, 23, 59))).toBe(-1);
    expect(todayIndex(w, new Date(2026, 10, 29, 0, 1))).toBe(0);
    expect(todayIndex(w, new Date(2026, 11, 6, 12))).toBe(7);
    expect(todayIndex(w, new Date(2026, 11, 24, 20))).toBe(25);
    expect(todayIndex(w, new Date(2026, 11, 25))).toBe(26);
  });
});

describe('when seasonal plans are offered', () => {
  test.each([
    [ADVENT_PLAN_ID, new Date(2026, 9, 31), false],
    [ADVENT_PLAN_ID, new Date(2026, 10, 1), true],
    [ADVENT_PLAN_ID, new Date(2026, 11, 24), true],
    [ADVENT_PLAN_ID, new Date(2026, 11, 25), false],
    [CHRISTMAS7_PLAN_ID, new Date(2026, 11, 1), true],
    [CHRISTMAS7_PLAN_ID, new Date(2026, 11, 26), false],
    [CHRISTMAS12_PLAN_ID, new Date(2026, 11, 14), false],
    [CHRISTMAS12_PLAN_ID, new Date(2026, 11, 15), true],
    [CHRISTMAS12_PLAN_ID, new Date(2027, 0, 6), true],
    [CHRISTMAS12_PLAN_ID, new Date(2027, 0, 7), false],
    [LENT_PLAN_ID, new Date(2027, 1, 10), true],
    ['womenOfTheBible', new Date(2026, 6, 1), true],
  ])('%s on %s → %s', (id, date, offered) => {
    expect(isSeasonalPlanOffered(id as string, date as Date)).toBe(offered);
  });

  test('progress from an earlier season is cut off', () => {
    expect(seasonProgressCutoff(ADVENT_PLAN_ID, new Date(2026, 10, 17))).toBe('2026-10-01');
    expect(seasonProgressCutoff(CHRISTMAS12_PLAN_ID, new Date(2027, 0, 2))).toBe('2026-10-01');
    expect(seasonProgressCutoff(LENT_PLAN_ID, new Date(2027, 1, 20))).toBe('2027-01-01');
    expect(seasonProgressCutoff('womenOfTheBible')).toBeNull();
  });
});

describe('nextUnreadStory with a late start', () => {
  const stories = ['S1', 'S2', 'S3', 'S4', 'S5'];

  test('starts at the chosen day, then comes back for skipped days', () => {
    expect(nextUnreadStory(stories, new Set(), 2)).toEqual({ storyId: 'S3', day: 3 });
    expect(nextUnreadStory(stories, new Set(['S3', 'S4', 'S5']), 2)).toEqual({ storyId: 'S1', day: 1 });
    expect(nextUnreadStory(stories, new Set(stories), 2)).toBeNull();
  });

  test('defaults to the first unread story', () => {
    expect(nextUnreadStory(stories, new Set(['S1']))).toEqual({ storyId: 'S2', day: 2 });
  });
});

describe('readable phase colours', () => {
  test('gold becomes readable on the light background and is left alone when already readable', () => {
    const gold = readableOn('#FFD700', '#F3F5F2');
    expect(contrastRatio(gold, '#F3F5F2')).toBeGreaterThanOrEqual(4.5);
    expect(readableOn('#101619', '#F3F5F2')).toBe('#101619');
  });

  test('dark purple is lightened for dark mode', () => {
    const purple = readableOn('#6A4C93', '#080D13');
    expect(contrastRatio(purple, '#080D13')).toBeGreaterThanOrEqual(4.5);
  });
});
