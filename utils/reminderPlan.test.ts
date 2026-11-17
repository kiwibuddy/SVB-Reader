import { findCatalogItem } from '@/utils/planCatalog';
import { ADVENT_PLAN_ID, datedWindow } from '@/utils/seasonalPlans';
import { localCalendarDate } from '@/utils/localDate';
import { planReminders, DAILY_IDS, type ReminderPlanInput, type ActivePlan } from '@/utils/reminderPlan';

const text = {
  storyTitle: (id: string) => `title-${id}`,
  storyForDate: (d: Date) => `S${String(d.getDate()).padStart(3, '0')}`,
  t: (key: string, params?: Record<string, string | number>) => (params ? `${key} ${JSON.stringify(params)}` : key),
};

const NOW = new Date(2026, 10, 17, 9, 0); // Tue 17 Nov, 9:00

function input(over: Partial<ReminderPlanInput> = {}): ReminderPlanInput {
  return {
    now: NOW,
    enabled: true,
    hour: 8,
    minute: 0,
    lastReadDate: '2026-11-16',
    streak: 1,
    lastDayToSave: '2026-11-18',
    plans: [],
    ...over,
  };
}

const daily = (plan: ReturnType<typeof planReminders>) => plan.filter((n) => n.id.startsWith('svb-day-'));
const day = (n: { date: Date }) => localCalendarDate(n.date);

test('reminders off: nothing', () => {
  expect(planReminders(input({ enabled: false }), text)).toEqual([]);
});

test('no plan: the story for each date, at the chosen time, starting tomorrow once 8:00 has passed', () => {
  const plan = daily(planReminders(input(), text));
  expect(plan).toHaveLength(13); // today's 8:00 has passed
  expect(plan[0]).toMatchObject({ id: 'svb-day-1', title: 'UI.reminders.todayTitle', body: 'title-S018', url: '/S018' });
  expect(plan[0].date).toEqual(new Date(2026, 10, 18, 8, 0));
  expect(plan.map((n) => n.id)).toEqual(DAILY_IDS.slice(1));
});

test('today is included when the time is still ahead, skipped once read today', () => {
  expect(daily(planReminders(input({ hour: 18 }), text))[0].id).toBe('svb-day-0');
  expect(daily(planReminders(input({ hour: 18, lastReadDate: '2026-11-17' }), text))[0].id).toBe('svb-day-1');
});

test('an undated plan: names the next story first, then gentle rotating lines', () => {
  const nt: ActivePlan = {
    id: 'ntJourney',
    title: 'NT Journey',
    stories: ['S260', 'S261', 'S262', 'S263'],
    completedIds: new Set(['S260']),
    startIndex: 0,
    window: null,
  };
  const plan = daily(planReminders(input({ plans: [nt] }), text));
  expect(plan[0]).toMatchObject({ body: 'title-S261', url: '/plan/ntJourney' });
  expect(plan[0].title).toContain('"n":2');
  expect(plan.slice(1, 4).map((n) => n.body)).toEqual([
    'UI.reminders.generic1',
    'UI.reminders.generic2',
    'UI.reminders.generic3',
  ]);
  expect(plan[1].title).toBe('NT Journey');
});

describe('Advent', () => {
  const item = findCatalogItem(ADVENT_PLAN_ID)!;
  const advent = (now: Date, completed: string[] = []): ActivePlan => ({
    id: ADVENT_PLAN_ID,
    title: 'Advent',
    stories: item.stories,
    completedIds: new Set(completed),
    startIndex: 0,
    window: datedWindow(ADVENT_PLAN_ID, item.stories.length, now),
  });

  test('on 8 Dec each reminder names that date\'s story', () => {
    const now = new Date(2026, 11, 8, 9, 0);
    const plan = daily(planReminders(input({ now, lastReadDate: '2026-12-07', plans: [advent(now)] }), text));
    expect(plan).toHaveLength(13);
    plan.forEach((n) => {
      const index = Math.round((n.date.getTime() - new Date(2026, 10, 29, 8).getTime()) / 86400000);
      expect(n.body).toBe(`title-${item.stories[index]}`);
      expect(n.title).toContain(`"n":${index + 1}`);
      expect(n.url).toBe('/plan/adventJourneyChronological');
    });
  });

  test('after Christmas Eve it falls back to the story for the date', () => {
    const now = new Date(2026, 11, 15, 9, 0);
    const plan = daily(planReminders(input({ now, lastReadDate: '2026-12-14', plans: [advent(now)] }), text));
    const eve = plan.find((n) => day(n) === '2026-12-24')!;
    const after = plan.find((n) => day(n) === '2026-12-25')!;
    expect(eve.body).toBe(`title-${item.stories[25]}`);
    expect(after).toMatchObject({ title: 'UI.reminders.todayTitle', url: '/S025' });
  });

  test('a day already read ahead names the next unread story instead', () => {
    const now = new Date(2026, 11, 8, 9, 0);
    const read = item.stories.slice(0, 11); // read through Day 11 (9 Dec)
    const plan = daily(planReminders(input({ now, plans: [advent(now, read)] }), text));
    expect(plan.find((n) => day(n) === '2026-12-09')!.body).toBe(`title-${item.stories[11]}`);
  });

  test('before Advent begins, an undated plan or the day\'s story fills the gap', () => {
    const plan = daily(planReminders(input({ plans: [advent(NOW)] }), text));
    expect(plan.find((n) => day(n) === '2026-11-28')!.title).toBe('UI.reminders.todayTitle');
    expect(plan.find((n) => day(n) === '2026-11-29')!.body).toBe(`title-${item.stories[0]}`);
  });
});

describe('streak nudge', () => {
  test('streak of 1: no nudge', () => {
    expect(planReminders(input(), text).some((n) => n.id === 'svb-streak-nudge')).toBe(false);
  });

  test('streak of 5 read yesterday, no rest days: 20:00 today', () => {
    const plan = planReminders(input({ streak: 5, lastDayToSave: '2026-11-17' }), text);
    const nudge = plan.find((n) => n.id === 'svb-streak-nudge')!;
    expect(nudge.date).toEqual(new Date(2026, 10, 17, 20, 0));
    expect(nudge.title).toContain('"n":5');
  });

  test('two rest days held: the nudge moves two days later', () => {
    const plan = planReminders(input({ streak: 5, lastDayToSave: '2026-11-19' }), text);
    expect(plan.find((n) => n.id === 'svb-streak-nudge')!.date).toEqual(new Date(2026, 10, 19, 20, 0));
  });

  test('daily reminder at 20:30: the nudge folds into that day\'s reminder', () => {
    const plan = planReminders(input({ streak: 5, lastDayToSave: '2026-11-17', hour: 20, minute: 30 }), text);
    expect(plan.some((n) => n.id === 'svb-streak-nudge')).toBe(false);
    expect(plan.find((n) => n.id === 'svb-day-0')!.title).toContain('UI.reminders.streakTitle');
  });

  test('a nudge time already past is skipped', () => {
    const late = new Date(2026, 10, 17, 21, 0);
    const plan = planReminders(input({ now: late, streak: 5, lastDayToSave: '2026-11-17' }), text);
    expect(plan.some((n) => n.id === 'svb-streak-nudge')).toBe(false);
  });
});

describe('come-back notes', () => {
  test('21, 35 and 60 days after the last read, then nothing', () => {
    const back = planReminders(input(), text).filter((n) => n.id.startsWith('svb-back-'));
    expect(back.map((n) => [n.id, day(n)])).toEqual([
      ['svb-back-1', '2026-12-07'],
      ['svb-back-2', '2026-12-21'],
      ['svb-back-3', '2027-01-15'],
    ]);
  });

  test('a note that would land inside the daily window is dropped', () => {
    const back = planReminders(input({ lastReadDate: '2026-11-01' }), text).filter((n) => n.id.startsWith('svb-back-'));
    expect(back.map((n) => n.id)).toEqual(['svb-back-2', 'svb-back-3']); // 22 Nov is inside the 14 days
  });
});

test('never more than 18 notifications, all in the future, in date order', () => {
  const plan = planReminders(input({ streak: 9, lastDayToSave: '2026-11-19' }), text);
  expect(plan.length).toBeLessThanOrEqual(18);
  expect(plan.every((n) => n.date.getTime() > NOW.getTime())).toBe(true);
  expect(plan.map((n) => n.date.getTime())).toEqual([...plan.map((n) => n.date.getTime())].sort((a, b) => a - b));
});
