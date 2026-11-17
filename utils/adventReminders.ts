/**
 * Which local notifications to schedule around Advent. Pure: given the date,
 * the reader's reminder settings and their Advent progress, returns the
 * notifications to schedule. readingReminders.ts does the scheduling.
 *
 * Who gets what:
 * - Not joined, daily reminders on: "one week to go" (Sun before Advent),
 *   "starts tomorrow" (Sat before), and "not too late" (2nd Sunday).
 * - Not joined, tapped "Remind me": "starts tomorrow", "begins today", "not too late".
 * - Joined before Advent: "starts tomorrow" with Day 1's story.
 * - Joined, daily reminders off: a reminder each Advent Sunday and Christmas Eve.
 * - Joined, daily reminders on: no extra notifications. The dated daily
 *   reminders (utils/reminderPlan.ts) already name each day's Advent story.
 * Paused or finished plans get nothing.
 */

import { addDays, datedWindow, ADVENT_PLAN_ID, type SeasonWindow } from '@/utils/seasonalPlans';

export const ADVENT_NOTIFICATION_IDS = [
  'svb-advent-week',
  'svb-advent-eve',
  'svb-advent-day1',
  'svb-advent-late',
  'svb-advent-sun-1',
  'svb-advent-sun-2',
  'svb-advent-sun-3',
  'svb-advent-sun-4',
  'svb-advent-christmas-eve',
] as const;

export const ADVENT_PLAN_URL = `/plan/${ADVENT_PLAN_ID}`;

export type AdventReminderInput = {
  now: Date;
  dailyEnabled: boolean;
  /** Daily reminder time (also used for Advent Sunday reminders). */
  hour: number;
  minute: number;
  /** Started and not paused. */
  joined: boolean;
  paused: boolean;
  remindMe: boolean;
  stories: string[];
  completedIds: Set<string>;
};

export type AdventText = {
  storyTitle: (storyId: string) => string;
  weekTitleForDay: (dayIndex: number) => string;
  t: (key: string, params?: Record<string, string | number>) => string;
};

export type PlannedNotification = {
  id: (typeof ADVENT_NOTIFICATION_IDS)[number];
  date: Date;
  title: string;
  body: string;
  url: string;
};

export type AdventReminderPlan = {
  notifications: PlannedNotification[];
};

const EMPTY: AdventReminderPlan = { notifications: [] };

function at(day: Date, hour: number, minute: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0);
}

/** Evening for teasers, or midday if the daily reminder is already in the evening. */
export function teaserHour(dailyEnabled: boolean, dailyHour: number): number {
  return dailyEnabled && dailyHour >= 17 ? 12 : 19;
}

export function planAdventNotifications(input: AdventReminderInput, text: AdventText): AdventReminderPlan {
  const window: SeasonWindow | null = datedWindow(ADVENT_PLAN_ID, input.stories.length, input.now);
  if (!window) return EMPTY;
  if (input.paused) return EMPTY;

  const start = window.start;
  const lastDay = addDays(start, window.days - 1);
  const finished = input.stories.length > 0 && input.stories.every((id) => input.completedIds.has(id));
  if (finished) return EMPTY;

  const { t } = text;
  const out: PlannedNotification[] = [];
  const add = (id: PlannedNotification['id'], date: Date, title: string, body: string) => {
    if (date.getTime() > input.now.getTime() + 60_000) {
      out.push({ id, date, title, body, url: ADVENT_PLAN_URL });
    }
  };
  const day1Title = text.storyTitle(input.stories[0]);
  const teaser = teaserHour(input.dailyEnabled, input.hour);

  if (!input.joined) {
    if (!input.dailyEnabled && !input.remindMe) return EMPTY;
    if (input.dailyEnabled) {
      add('svb-advent-week', at(addDays(start, -7), teaser, 0), t('UI.advent.notifWeekTitle'), t('UI.advent.notifWeekBody'));
    }
    add('svb-advent-eve', at(addDays(start, -1), teaser, 0), t('UI.advent.notifEveTitle'), t('UI.advent.notifEveBody'));
    if (input.remindMe) {
      const hour = input.dailyEnabled ? input.hour : 8;
      const minute = input.dailyEnabled ? input.minute : 0;
      add('svb-advent-day1', at(start, hour, minute), t('UI.advent.notifDay1Title'), t('UI.advent.notifDay1Body', { title: day1Title }));
    }
    add('svb-advent-late', at(addDays(start, 7), teaser, 0), t('UI.advent.notifLateTitle'), t('UI.advent.notifLateBody'));
    return { notifications: out };
  }

  // Joined.
  add(
    'svb-advent-eve',
    at(addDays(start, -1), teaser, 0),
    t('UI.advent.notifEveTitle'),
    t('UI.advent.notifJoinedEveBody', { title: day1Title })
  );

  if (!input.dailyEnabled) {
    const sundayIds = ['svb-advent-sun-1', 'svb-advent-sun-2', 'svb-advent-sun-3', 'svb-advent-sun-4'] as const;
    sundayIds.forEach((id, week) => {
      const index = week * 7;
      if (index >= window.days - 1) return; // Dec 24 on a Sunday: the Christmas Eve reminder covers it
      add(
        id,
        at(addDays(start, index), input.hour, input.minute),
        t('UI.advent.notifSundayTitle', { week: text.weekTitleForDay(index) }),
        t('UI.advent.notifSundayBody', { title: text.storyTitle(input.stories[index]) })
      );
    });
  }
  if (!input.dailyEnabled) {
    add(
      'svb-advent-christmas-eve',
      at(lastDay, input.hour, input.minute),
      t('UI.advent.notifChristmasEveTitle'),
      t('UI.advent.notifChristmasEveBody', { title: text.storyTitle(input.stories[window.days - 1]) })
    );
  }
  return { notifications: out };
}
