/**
 * A streak that forgives.
 *
 * - A rest day covers one missed day so the streak carries on. It does not add
 *   to the count. Everyone starts with one, earns one more for every 7 days
 *   read, and holds at most two. They are spent only when the reader comes
 *   back and reads.
 * - Missing more days than rest days held restarts the streak at 1; unused
 *   rest days are kept.
 * - Week streak: consecutive weeks (Mon–Sun) that met the weekly goal. The
 *   current week counts once met and never breaks the run before then. Weeks
 *   up to the one the feature arrived in keep the old rule (one read), so no
 *   one's number drops on update.
 *
 * Pure: dates are local YYYY-MM-DD strings; storage lives in api/sqlite.ts.
 */
import { addLocalCalendarDays, daysBetweenLocalDates, displayedStreak, weekStartKey } from '@/utils/localDate';

export const MAX_REST_DAYS = 2;
export const READS_PER_REST_DAY = 7;
export const MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365] as const;
export const WEEKLY_GOALS = [3, 5, 7] as const;
export type WeeklyGoal = (typeof WEEKLY_GOALS)[number];
export const DEFAULT_WEEKLY_GOAL: WeeklyGoal = 5;
const KEEP_REST_DATES = 60;

export type StreakState = {
  streak: number;
  longest: number;
  /** Last day a story was read, local YYYY-MM-DD. */
  lastReadDate: string | null;
  /** Rest days held, 0..MAX_REST_DAYS. */
  restDays: number;
  /** Days read toward the next rest day, 0..READS_PER_REST_DAY-1. */
  readsTowardRest: number;
  /** Days a rest day covered (most recent last), for the heatmap. */
  restDates: string[];
  /** Highest milestone already celebrated in this streak. */
  lastMilestone: number;
};

export type StreakEvent =
  | { type: 'milestone'; n: number }
  | { type: 'restDayEarned' }
  | { type: 'restDaysUsed'; count: number };

export type StreakView = {
  /** Streak to show today: 0 once it can no longer be saved. */
  streak: number;
  /** Rest days still held after covering any missed days. */
  restDays: number;
  /** Missed days since the last read that rest days will cover. */
  coveredDays: number;
  readToday: boolean;
  /** Last day a read keeps the streak going; null with no streak. */
  lastDayToSave: string | null;
};

function highestMilestoneUpTo(n: number): number {
  return MILESTONES.filter((m) => m <= n).pop() ?? 0;
}

export function isStreakState(value: unknown): value is StreakState {
  const s = value as StreakState;
  return (
    !!s &&
    typeof s.streak === 'number' &&
    typeof s.longest === 'number' &&
    (s.lastReadDate === null || typeof s.lastReadDate === 'string') &&
    typeof s.restDays === 'number' &&
    typeof s.readsTowardRest === 'number' &&
    Array.isArray(s.restDates) &&
    typeof s.lastMilestone === 'number'
  );
}

/** First run: carry the old streak over without changing what the reader sees. */
export function initialState(
  legacy: { currentStreak: number; longestStreak: number; lastReadDate: string | null },
  today: string
): StreakState {
  const streak = displayedStreak(legacy.currentStreak, legacy.lastReadDate, today);
  return {
    streak,
    longest: Math.max(legacy.longestStreak || 0, streak),
    // A lost streak's last date no longer matters (and a new install seeds today).
    lastReadDate: streak > 0 ? legacy.lastReadDate || null : null,
    restDays: 1,
    readsTowardRest: streak % READS_PER_REST_DAY,
    restDates: [],
    lastMilestone: highestMilestoneUpTo(streak),
  };
}

/** A story was finished today. */
export function onRead(state: StreakState, today: string): { state: StreakState; events: StreakEvent[] } {
  const last = state.lastReadDate;
  // Same day, or the clock went backwards: nothing changes. Only for a live
  // streak — a new install seeds today's date with a streak of 0.
  if (state.streak > 0 && last && daysBetweenLocalDates(last, today) <= 0) return { state, events: [] };

  const events: StreakEvent[] = [];
  const next: StreakState = { ...state, restDates: [...state.restDates] };
  const missed = last ? daysBetweenLocalDates(last, today) - 1 : 0;

  if (!last || state.streak <= 0) {
    next.streak = 1;
    next.lastMilestone = 0;
    next.readsTowardRest = 0;
  } else if (missed <= 0) {
    next.streak = state.streak + 1;
  } else if (missed <= state.restDays) {
    next.restDays = state.restDays - missed;
    for (let i = 1; i <= missed; i += 1) next.restDates.push(addLocalCalendarDays(last, i));
    next.restDates = next.restDates.slice(-KEEP_REST_DATES);
    next.streak = state.streak + 1;
    events.push({ type: 'restDaysUsed', count: missed });
  } else {
    next.streak = 1;
    next.lastMilestone = 0;
    next.readsTowardRest = 0;
  }

  next.readsTowardRest += 1;
  if (next.readsTowardRest >= READS_PER_REST_DAY) {
    next.readsTowardRest = 0;
    if (next.restDays < MAX_REST_DAYS) {
      next.restDays += 1;
      events.push({ type: 'restDayEarned' });
    }
  }

  next.lastReadDate = today;
  next.longest = Math.max(state.longest, next.streak);
  const milestone = highestMilestoneUpTo(next.streak);
  if (milestone > next.lastMilestone && milestone === next.streak) {
    next.lastMilestone = milestone;
    events.push({ type: 'milestone', n: milestone });
  }
  return { state: next, events };
}

/** What the reader sees today, without reading. */
export function view(state: StreakState, today: string): StreakView {
  const last = state.lastReadDate;
  if (!last || state.streak <= 0) {
    return { streak: 0, restDays: state.restDays, coveredDays: 0, readToday: false, lastDayToSave: null };
  }
  const missed = Math.max(0, daysBetweenLocalDates(last, today) - 1);
  const readToday = daysBetweenLocalDates(last, today) <= 0;
  if (missed > state.restDays) {
    return { streak: 0, restDays: state.restDays, coveredDays: 0, readToday: false, lastDayToSave: null };
  }
  return {
    streak: state.streak,
    restDays: state.restDays - missed,
    coveredDays: missed,
    readToday,
    lastDayToSave: addLocalCalendarDays(last, 1 + state.restDays),
  };
}

/**
 * This week's reading against the goal, and the run of weeks that met it.
 * `readDates` are local YYYY-MM-DD days with at least one story read.
 */
export function weekProgress(
  readDates: Iterable<string>,
  today: string,
  goal: WeeklyGoal,
  goalFrom: string | null
): { daysThisWeek: number; goal: number; weekStreak: number } {
  const perWeek = new Map<string, Set<string>>();
  for (const date of readDates) {
    if (!date || date > today) continue;
    const week = weekStartKey(date);
    if (!perWeek.has(week)) perWeek.set(week, new Set());
    perWeek.get(week)!.add(date);
  }
  const oldRuleUntil = goalFrom ? weekStartKey(goalFrom) : null;
  const met = (week: string) => {
    const days = perWeek.get(week)?.size ?? 0;
    const needed = oldRuleUntil && week <= oldRuleUntil ? 1 : goal;
    return days >= needed;
  };

  const thisWeek = weekStartKey(today);
  let weekStreak = 0;
  let cursor = thisWeek;
  if (met(cursor)) weekStreak += 1;
  cursor = addLocalCalendarDays(cursor, -7);
  while (met(cursor)) {
    weekStreak += 1;
    cursor = addLocalCalendarDays(cursor, -7);
  }
  return { daysThisWeek: perWeek.get(thisWeek)?.size ?? 0, goal, weekStreak };
}

export function parseWeeklyGoal(value: string | null | undefined): WeeklyGoal {
  const n = Number(value);
  return (WEEKLY_GOALS as readonly number[]).includes(n) ? (n as WeeklyGoal) : DEFAULT_WEEKLY_GOAL;
}
