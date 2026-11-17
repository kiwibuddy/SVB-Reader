/**
 * Which daily-reminder notifications to schedule. Pure: readingReminders.ts
 * gathers the inputs and does the scheduling.
 *
 * iOS can't change the text of a repeating notification, so instead of one
 * repeating reminder this plans dated ones for the next 14 days, refreshed
 * whenever the app opens or a story is finished:
 *
 * - Daily (svb-day-0 … svb-day-13), at the chosen time. A dated plan
 *   (Advent, Christmas) names that date's story; another plan names its next
 *   story on the first reminder, then rotates gentle lines; with no plan,
 *   the story for that date. Today is skipped once read or past the time.
 * - Streak nudge (svb-streak-nudge) at 20:00 on the last day a read keeps the
 *   streak, for streaks of 2 or more. Folded into that day's daily reminder
 *   when the daily is already in the evening.
 * - Come-back notes (svb-back-1 … 3) at 21, 35 and 60 days after the last
 *   read, then silence.
 */
import { addLocalCalendarDays, daysBetweenLocalDates, localCalendarDate } from '@/utils/localDate';
import { nextUnreadStory } from '@/utils/planCatalog';
import { todayIndex, type SeasonWindow } from '@/utils/seasonalPlans';

export const DAILY_DAYS = 14;
export const DAILY_IDS = Array.from({ length: DAILY_DAYS }, (_, i) => `svb-day-${i}`);
export const STREAK_NUDGE_ID = 'svb-streak-nudge';
export const COME_BACK_IDS = ['svb-back-1', 'svb-back-2', 'svb-back-3'] as const;
export const COME_BACK_AFTER_DAYS = [21, 35, 60] as const;
/** Ids from earlier versions, cancelled on every reschedule. */
export const LEGACY_REMINDER_IDS = ['svb-daily-read'] as const;
export const ALL_REMINDER_IDS = [...DAILY_IDS, STREAK_NUDGE_ID, ...COME_BACK_IDS, ...LEGACY_REMINDER_IDS];
const NUDGE_HOUR = 20;
const FOLD_NUDGE_FROM_HOUR = 19;

export type ReminderPlanInput = {
  now: Date;
  enabled: boolean;
  hour: number;
  minute: number;
  /** Local YYYY-MM-DD of the last story read, if any. */
  lastReadDate: string | null;
  /** Current (forgiving) streak and the last day a read keeps it. */
  streak: number;
  lastDayToSave: string | null;
  /** Started, not paused plans, most recently used first. */
  plans: ActivePlan[];
};

export type ActivePlan = {
  id: string;
  title: string;
  stories: string[];
  completedIds: Set<string>;
  startIndex: number;
  /** Set for plans tied to dates (Advent, Christmas). */
  window: SeasonWindow | null;
};

export type ReminderText = {
  storyTitle: (storyId: string) => string;
  /** The story for a calendar date, for readers without a plan. */
  storyForDate: (date: Date) => string;
  t: (key: string, params?: Record<string, string | number>) => string;
};

export type PlannedReminder = {
  id: string;
  date: Date;
  title: string;
  body: string;
  url: string;
};

function at(dateStr: string, hour: number, minute: number): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute, 0, 0);
}

function datedPlanFor(plans: ActivePlan[], date: Date): { plan: ActivePlan; index: number } | null {
  for (const plan of plans) {
    if (!plan.window) continue;
    const index = todayIndex(plan.window, date);
    if (index >= 0 && index < plan.window.days) return { plan, index };
  }
  return null;
}

export function planReminders(input: ReminderPlanInput, text: ReminderText): PlannedReminder[] {
  if (!input.enabled) return [];
  const { t } = text;
  const out: PlannedReminder[] = [];
  const today = localCalendarDate(input.now);
  const future = (date: Date) => date.getTime() > input.now.getTime() + 60_000;
  const undated = input.plans.find((p) => !p.window) ?? null;
  const undatedNext = undated ? nextUnreadStory(undated.stories, undated.completedIds, undated.startIndex) : null;
  let undatedNamed = false;
  let generic = 0;

  const daily: PlannedReminder[] = [];
  for (let d = 0; d < DAILY_DAYS; d += 1) {
    const dateStr = addLocalCalendarDays(today, d);
    const date = at(dateStr, input.hour, input.minute);
    if (d === 0 && input.lastReadDate === today) continue;
    if (!future(date)) continue;

    const dated = datedPlanFor(input.plans, date);
    if (dated) {
      const { plan, index } = dated;
      const storyId = plan.completedIds.has(plan.stories[index])
        ? nextUnreadStory(plan.stories, plan.completedIds, plan.startIndex)?.storyId ?? null
        : plan.stories[index];
      if (storyId) {
        daily.push({
          id: DAILY_IDS[d],
          date,
          title: t('UI.reminders.planDayTitle', { plan: plan.title, n: index + 1 }),
          body: text.storyTitle(storyId),
          url: `/plan/${plan.id}`,
        });
        continue;
      }
    }
    if (undated && undatedNext) {
      if (!undatedNamed) {
        undatedNamed = true;
        daily.push({
          id: DAILY_IDS[d],
          date,
          title: t('UI.reminders.planDayTitle', { plan: undated.title, n: undatedNext.day }),
          body: text.storyTitle(undatedNext.storyId),
          url: `/plan/${undated.id}`,
        });
      } else {
        daily.push({
          id: DAILY_IDS[d],
          date,
          title: undated.title,
          body: t(`UI.reminders.generic${(generic % 3) + 1}`),
          url: `/plan/${undated.id}`,
        });
        generic += 1;
      }
      continue;
    }
    const storyId = text.storyForDate(date);
    daily.push({
      id: DAILY_IDS[d],
      date,
      title: t('UI.reminders.todayTitle'),
      body: text.storyTitle(storyId),
      url: `/${storyId}`,
    });
  }

  // Streak nudge on the last day a read still saves the streak.
  if (input.streak >= 2 && input.lastDayToSave) {
    const title = t('UI.reminders.streakTitle', { n: input.streak });
    const body = t('UI.reminders.streakBody');
    const sameDay = daily.find((n) => localCalendarDate(n.date) === input.lastDayToSave);
    if (sameDay && input.hour >= FOLD_NUDGE_FROM_HOUR) {
      sameDay.title = title;
      sameDay.body = body;
    } else {
      const date = at(input.lastDayToSave, NUDGE_HOUR, 0);
      if (future(date)) {
        out.push({ id: STREAK_NUDGE_ID, date, title, body, url: '/Home' });
      }
    }
  }

  // Come-back notes, after the daily window, counted from the last read.
  const base = input.lastReadDate ?? today;
  const lastDaily = addLocalCalendarDays(today, DAILY_DAYS - 1);
  COME_BACK_AFTER_DAYS.forEach((after, i) => {
    const dateStr = addLocalCalendarDays(base, after);
    if (daysBetweenLocalDates(lastDaily, dateStr) <= 0) return;
    const date = at(dateStr, input.hour, input.minute);
    if (!future(date)) return;
    out.push({
      id: COME_BACK_IDS[i],
      date,
      title: t(`UI.reminders.back${i + 1}Title`),
      body: t(`UI.reminders.back${i + 1}Body`),
      url: '/Home',
    });
  });

  return [...daily, ...out].sort((a, b) => a.date.getTime() - b.date.getTime());
}
