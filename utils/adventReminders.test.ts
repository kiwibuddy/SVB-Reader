import { planAdventNotifications, teaserHour, type AdventReminderInput } from '@/utils/adventReminders';

const STORIES = Array.from({ length: 26 }, (_, i) => `S${String(i + 1).padStart(3, '0')}`);

const text = {
  storyTitle: (id: string) => `title-${id}`,
  weekTitleForDay: (index: number) => `week-${Math.floor(index / 7) + 1}`,
  t: (key: string, params?: Record<string, string | number>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
};

function input(overrides: Partial<AdventReminderInput>): AdventReminderInput {
  return {
    now: new Date(2026, 10, 20, 10, 0),
    dailyEnabled: false,
    hour: 8,
    minute: 0,
    joined: false,
    paused: false,
    remindMe: false,
    stories: STORIES,
    completedIds: new Set(),
    nextStoryId: STORIES[0],
    ...overrides,
  };
}

const summary = (plan: ReturnType<typeof planAdventNotifications>) =>
  plan.notifications.map((n) => `${n.id}@${n.date.getMonth() + 1}/${n.date.getDate()} ${n.date.getHours()}:${String(n.date.getMinutes()).padStart(2, '0')}`);

test('readers with no reminders and no opt-in get nothing', () => {
  expect(planAdventNotifications(input({}), text)).toEqual({ notifications: [], dailyOverride: null });
});

test('daily-reminder readers who have not joined get three teasers in the evening', () => {
  const plan = planAdventNotifications(input({ dailyEnabled: true }), text);
  expect(summary(plan)).toEqual(['svb-advent-week@11/22 19:00', 'svb-advent-eve@11/28 19:00', 'svb-advent-late@12/6 19:00']);
  expect(plan.dailyOverride).toBeNull();
  expect(plan.notifications.every((n) => n.url === '/plan/adventJourneyChronological')).toBe(true);
});

test('teasers move to midday when the daily reminder is already in the evening', () => {
  expect(teaserHour(true, 20)).toBe(12);
  const plan = planAdventNotifications(input({ dailyEnabled: true, hour: 20 }), text);
  expect(plan.notifications.map((n) => n.date.getHours())).toEqual([12, 12, 12]);
});

test('past teasers are skipped', () => {
  const plan = planAdventNotifications(input({ dailyEnabled: true, now: new Date(2026, 10, 25, 9) }), text);
  expect(plan.notifications.map((n) => n.id)).toEqual(['svb-advent-eve', 'svb-advent-late']);
});

test('"Remind me" adds a Day 1 reminder', () => {
  const plan = planAdventNotifications(input({ remindMe: true }), text);
  expect(summary(plan)).toEqual(['svb-advent-eve@11/28 19:00', 'svb-advent-day1@11/29 8:00', 'svb-advent-late@12/6 19:00']);
});

test('joined readers without daily reminders get the eve, each Sunday and Christmas Eve', () => {
  const plan = planAdventNotifications(input({ joined: true }), text);
  expect(summary(plan)).toEqual([
    'svb-advent-eve@11/28 19:00',
    'svb-advent-sun-1@11/29 8:00',
    'svb-advent-sun-2@12/6 8:00',
    'svb-advent-sun-3@12/13 8:00',
    'svb-advent-sun-4@12/20 8:00',
    'svb-advent-christmas-eve@12/24 8:00',
  ]);
  expect(plan.notifications[2].title).toContain('week-2');
  expect(plan.notifications[5].body).toContain('title-S026');
});

test('joined daily-reminder readers get Advent copy on their daily reminder instead of extra notifications', () => {
  const before = planAdventNotifications(input({ joined: true, dailyEnabled: true }), text);
  expect(before.notifications.map((n) => n.id)).toEqual(['svb-advent-eve']);
  expect(before.dailyOverride).toBeNull(); // Nov 20 is before the Advent window

  const during = planAdventNotifications(
    input({ joined: true, dailyEnabled: true, now: new Date(2026, 11, 8, 7), nextStoryId: 'S009' }),
    text
  );
  expect(during.notifications).toEqual([]);
  expect(during.dailyOverride?.body).toContain('title-S009');

  const after = planAdventNotifications(input({ joined: true, dailyEnabled: true, now: new Date(2026, 11, 25, 7) }), text);
  expect(after.dailyOverride).toBeNull();
});

test('paused or finished plans get nothing', () => {
  expect(planAdventNotifications(input({ joined: false, paused: true, dailyEnabled: true }), text).notifications).toEqual([]);
  const finished = planAdventNotifications(input({ joined: true, completedIds: new Set(STORIES) }), text);
  expect(finished).toEqual({ notifications: [], dailyOverride: null });
});

test('a plan whose length does not match the season schedules nothing rather than wrong dates', () => {
  const plan = planAdventNotifications(input({ dailyEnabled: true, stories: STORIES.slice(0, 25) }), text);
  expect(plan.notifications).toEqual([]);
});
