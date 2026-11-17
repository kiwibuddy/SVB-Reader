import { addLocalCalendarDays } from '@/utils/localDate';
import { initialState, onRead, view, weekProgress, parseWeeklyGoal, type StreakState, type StreakEvent } from '@/utils/streak';

const fresh = (today = '2026-11-02') => initialState({ currentStreak: 0, longestStreak: 0, lastReadDate: null }, today);

function readOn(state: StreakState, dates: string[]) {
  const events: StreakEvent[] = [];
  for (const d of dates) {
    const r = onRead(state, d);
    state = r.state;
    events.push(...r.events);
  }
  return { state, events };
}

const days = (from: string, n: number) => Array.from({ length: n }, (_, i) => addLocalCalendarDays(from, i));

describe('onRead', () => {
  test('7 days running from a fresh start: milestones 3 and 7, one rest day earned', () => {
    const { state, events } = readOn(fresh(), days('2026-11-02', 7));
    expect(state.streak).toBe(7);
    expect(state.restDays).toBe(2);
    expect(events).toEqual([
      { type: 'milestone', n: 3 },
      { type: 'restDayEarned' },
      { type: 'milestone', n: 7 },
    ]);
  });

  test('miss one day holding one rest day: the streak carries on', () => {
    const start = readOn(fresh(), ['2026-11-02', '2026-11-03']).state;
    const { state, events } = onRead(start, '2026-11-05');
    expect(state.streak).toBe(3);
    expect(state.restDays).toBe(0);
    expect(state.restDates).toEqual(['2026-11-04']);
    expect(events).toContainEqual({ type: 'restDaysUsed', count: 1 });
  });

  test('miss two days holding one rest day: restart at 1, rest day kept', () => {
    const start = readOn(fresh(), ['2026-11-02', '2026-11-03']).state;
    const { state } = onRead(start, '2026-11-06');
    expect(state.streak).toBe(1);
    expect(state.restDays).toBe(1);
    expect(state.longest).toBe(2);
  });

  test('miss two days holding two rest days: carries on, none left', () => {
    const start = readOn(fresh(), days('2026-11-02', 7)).state;
    expect(start.restDays).toBe(2);
    const { state } = onRead(start, '2026-11-11');
    expect(state.streak).toBe(8);
    expect(state.restDays).toBe(0);
    expect(state.restDates).toEqual(['2026-11-09', '2026-11-10']);
  });

  test('two reads on one day count once', () => {
    const { state, events } = readOn(fresh(), ['2026-11-02', '2026-11-02']);
    expect(state.streak).toBe(1);
    expect(state.readsTowardRest).toBe(1);
    expect(events).toEqual([]);
  });

  test('rest days never go above two', () => {
    const { state, events } = readOn(fresh(), days('2026-11-02', 21));
    expect(state.restDays).toBe(2);
    expect(events.filter((e) => e.type === 'restDayEarned')).toHaveLength(1);
  });

  test('restarting clears the milestone so 3 is celebrated again', () => {
    let { state } = readOn(fresh(), days('2026-11-02', 3));
    state = onRead(state, '2026-11-20').state;
    const { events } = readOn(state, ['2026-11-21', '2026-11-22']);
    expect(events).toContainEqual({ type: 'milestone', n: 3 });
  });

  test('month, year and daylight-saving boundaries', () => {
    // NZ daylight saving starts 27 Sep 2026; US ends 1 Nov 2026.
    for (const from of ['2026-01-30', '2026-12-30', '2026-09-26', '2026-10-31', '2028-02-28']) {
      expect(readOn(fresh(from), days(from, 4)).state.streak).toBe(4);
    }
    const start = readOn(fresh(), ['2026-12-30', '2026-12-31']).state;
    expect(onRead(start, '2027-01-02').state.streak).toBe(3); // 1 Jan covered
  });
});

describe('view', () => {
  const read = readOn(fresh(), ['2026-11-02', '2026-11-03']).state;

  test('the day after a read, before reading: streak unchanged', () => {
    expect(view(read, '2026-11-04')).toEqual({
      streak: 2,
      restDays: 1,
      coveredDays: 0,
      readToday: false,
      lastDayToSave: '2026-11-05',
    });
  });

  test('read today', () => {
    expect(view(read, '2026-11-03')).toMatchObject({ streak: 2, readToday: true });
  });

  test('two days after with one rest day: covered, still alive', () => {
    expect(view(read, '2026-11-05')).toMatchObject({ streak: 2, restDays: 0, coveredDays: 1 });
  });

  test('two days after with no rest days: 0', () => {
    expect(view({ ...read, restDays: 0 }, '2026-11-05').streak).toBe(0);
  });

  test('two rest days push the last day to save out by two', () => {
    expect(view({ ...read, restDays: 2 }, '2026-11-04').lastDayToSave).toBe('2026-11-06');
  });

  test('no streak yet', () => {
    expect(view(fresh(), '2026-11-02')).toMatchObject({ streak: 0, lastDayToSave: null });
  });
});

describe('initialState', () => {
  test('legacy streak of 10 read yesterday', () => {
    const s = initialState({ currentStreak: 10, longestStreak: 12, lastReadDate: '2026-11-16' }, '2026-11-17');
    expect(s).toMatchObject({ streak: 10, longest: 12, restDays: 1, readsTowardRest: 3, lastMilestone: 7 });
    expect(view(s, '2026-11-17').streak).toBe(10);
  });

  test('a legacy streak already lost stays 0, and the next read starts at 1', () => {
    const s = initialState({ currentStreak: 10, longestStreak: 10, lastReadDate: '2026-11-10' }, '2026-11-17');
    expect(s.streak).toBe(0);
    expect(onRead(s, '2026-11-17').state.streak).toBe(1);
  });

  test('a new install (row seeded with today, streak 0): the first read counts', () => {
    const s = initialState({ currentStreak: 0, longestStreak: 0, lastReadDate: '2026-11-17' }, '2026-11-17');
    expect(s.lastReadDate).toBeNull();
    const first = onRead(s, '2026-11-17').state;
    expect(first.streak).toBe(1);
    expect(onRead(first, '2026-11-18').state.streak).toBe(2);
  });

  test('a state stored with streak 0 and today\'s date still counts the read', () => {
    const s: StreakState = { ...fresh(), lastReadDate: '2026-11-17' };
    expect(onRead(s, '2026-11-17').state.streak).toBe(1);
  });

  test('missing a day right after the update is covered', () => {
    const s = initialState({ currentStreak: 5, longestStreak: 5, lastReadDate: '2026-11-16' }, '2026-11-17');
    expect(view(s, '2026-11-18')).toMatchObject({ streak: 5, coveredDays: 1 });
  });
});

describe('weekProgress', () => {
  // Weeks start on Monday: 2 Nov, 9 Nov, 16 Nov 2026.
  const goalFrom = '2026-10-01';

  test('goal 5 met this week counts the current week', () => {
    const reads = days('2026-11-16', 5);
    expect(weekProgress(reads, '2026-11-20', 5, goalFrom)).toEqual({ daysThisWeek: 5, goal: 5, weekStreak: 1 });
  });

  test('two days so far this week does not break last week\'s run', () => {
    const reads = [...days('2026-11-02', 5), ...days('2026-11-09', 5), '2026-11-16', '2026-11-17'];
    expect(weekProgress(reads, '2026-11-17', 5, goalFrom)).toEqual({ daysThisWeek: 2, goal: 5, weekStreak: 2 });
  });

  test('a week short of the goal ends the run', () => {
    const reads = [...days('2026-11-02', 5), ...days('2026-11-09', 4)];
    expect(weekProgress(reads, '2026-11-17', 5, goalFrom).weekStreak).toBe(0);
  });

  test('weeks before the feature keep the one-read rule', () => {
    const reads = ['2026-11-03', '2026-11-10', ...days('2026-11-16', 3)];
    expect(weekProgress(reads, '2026-11-18', 3, '2026-11-12').weekStreak).toBe(3);
  });

  test('the same day twice counts once; future dates are ignored', () => {
    const reads = ['2026-11-16', '2026-11-16', '2026-11-30'];
    expect(weekProgress(reads, '2026-11-17', 3, goalFrom).daysThisWeek).toBe(1);
  });
});

test('parseWeeklyGoal falls back to 5', () => {
  expect(parseWeeklyGoal('3')).toBe(3);
  expect(parseWeeklyGoal('7')).toBe(7);
  expect(parseWeeklyGoal('4')).toBe(5);
  expect(parseWeeklyGoal(null)).toBe(5);
});
