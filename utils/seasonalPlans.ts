/**
 * Calendar rules for seasonal plans (Advent, Christmas, Lent).
 *
 * Pure functions only — no storage, no React — so they can be unit tested
 * with fixed dates. Dates are local calendar dates; times are ignored.
 */

export const ADVENT_PLAN_ID = 'adventJourneyChronological';
export const CHRISTMAS7_PLAN_ID = 'christmas7';
export const CHRISTMAS12_PLAN_ID = 'christmas12';
export const LENT_PLAN_ID = 'lentenReflectionChronological';

export const SEASONAL_PLAN_IDS = [
  ADVENT_PLAN_ID,
  CHRISTMAS7_PLAN_ID,
  CHRISTMAS12_PLAN_ID,
  LENT_PLAN_ID,
] as const;

const DAY_MS = 86400000;

/** Local midnight for a date. */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Whole local days from `from` to `to` (DST-safe). */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / DAY_MS);
}

/** First Sunday of Advent: the fourth Sunday before Christmas Day (Nov 27 – Dec 3). */
export function firstSundayOfAdvent(year: number): Date {
  const christmas = new Date(year, 11, 25);
  const back = christmas.getDay() === 0 ? 7 : christmas.getDay();
  const fourthSunday = addDays(christmas, -back);
  return addDays(fourthSunday, -21);
}

/**
 * Which Christmas season a date belongs to. January belongs to the previous
 * December's season, so a Christmas plan started on Dec 30 still has its dates
 * on Jan 2.
 */
export function christmasSeasonYear(date: Date): number {
  return date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear();
}

export type SeasonWindow = {
  /** Local date of Day 1. */
  start: Date;
  /** Number of days the season gives the plan (Day 1 … Day N). */
  days: number;
};

/**
 * The dated window a seasonal plan follows for the season `date` falls in.
 * Returns null for plans that are not dated.
 */
export function seasonWindow(planId: string, date: Date = new Date()): SeasonWindow | null {
  const year = christmasSeasonYear(date);
  switch (planId) {
    case ADVENT_PLAN_ID: {
      const start = firstSundayOfAdvent(year);
      return { start, days: daysBetween(start, new Date(year, 11, 24)) + 1 };
    }
    case CHRISTMAS7_PLAN_ID:
      return { start: new Date(year, 11, 19), days: 7 };
    case CHRISTMAS12_PLAN_ID:
      return { start: new Date(year, 11, 25), days: 12 };
    default:
      return null;
  }
}

/**
 * The window to label days with, only when the plan has exactly one story per
 * day of the season. Advent varies from 22 to 28 days, so a list written for
 * one year is not silently mis-dated in another.
 */
export function datedWindow(planId: string, storyCount: number, date: Date = new Date()): SeasonWindow | null {
  const window = seasonWindow(planId, date);
  if (!window || window.days !== storyCount) return null;
  return window;
}

/** Local date of a 0-based day index in a dated window. */
export function dateForDay(window: SeasonWindow, index: number): Date {
  return addDays(window.start, index);
}

/**
 * 0-based index of today's reading in a dated window: -1 before Day 1,
 * `days` after the last day.
 */
export function todayIndex(window: SeasonWindow, date: Date = new Date()): number {
  const offset = daysBetween(window.start, date);
  if (offset < 0) return -1;
  if (offset >= window.days) return window.days;
  return offset;
}

/** Whether a seasonal plan is offered in the catalog on `date`. Started plans stay visible regardless. */
export function isSeasonalPlanOffered(planId: string, date: Date = new Date()): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  switch (planId) {
    case ADVENT_PLAN_ID:
      return month === 11 || (month === 12 && day <= 24);
    case CHRISTMAS7_PLAN_ID:
      return month === 12 && day <= 25;
    case CHRISTMAS12_PLAN_ID:
      return (month === 12 && day >= 15) || (month === 1 && day <= 6);
    case LENT_PLAN_ID:
      return month >= 2 && month <= 4;
    default:
      return true;
  }
}

export function isSeasonalPlanId(planId: string): boolean {
  return (SEASONAL_PLAN_IDS as readonly string[]).includes(planId);
}

/**
 * Local YYYY-MM-DD before which saved progress for a seasonal plan belongs to
 * an earlier season and should not count. Null for non-seasonal plans.
 */
export function seasonProgressCutoff(planId: string, date: Date = new Date()): string | null {
  switch (planId) {
    case ADVENT_PLAN_ID:
    case CHRISTMAS7_PLAN_ID:
    case CHRISTMAS12_PLAN_ID:
      return `${christmasSeasonYear(date)}-10-01`;
    case LENT_PLAN_ID:
      return `${date.getFullYear()}-01-01`;
    default:
      return null;
  }
}

/** Short localized date such as "Sun, Nov 29" / "dim. 29 nov.". */
export function formatShortDate(date: Date, language: string): string {
  const locale = language.startsWith('fr') ? 'fr-FR' : 'en-US';
  try {
    return date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
}

/** Long localized date such as "Sunday, November 29" / "dimanche 29 novembre". */
export function formatLongDate(date: Date, language: string): string {
  const locale = language.startsWith('fr') ? 'fr-FR' : 'en-US';
  try {
    return date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
  } catch {
    return formatShortDate(date, language);
  }
}

/** "Nov 29 – Dec 24" / "29 nov. – 24 déc." */
export function formatDateRange(window: SeasonWindow, language: string): string {
  const locale = language.startsWith('fr') ? 'fr-FR' : 'en-US';
  const end = dateForDay(window, window.days - 1);
  try {
    const fmt = (d: Date) => d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    return `${fmt(window.start)} – ${fmt(end)}`;
  } catch {
    return `${window.start.getMonth() + 1}/${window.start.getDate()} – ${end.getMonth() + 1}/${end.getDate()}`;
  }
}
