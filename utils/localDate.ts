/** Local calendar date as YYYY-MM-DD. Never use toISOString().split — that is UTC. */
export function localCalendarDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addLocalCalendarDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return localCalendarDate(new Date(y, m - 1, d + delta));
}

/** Local calendar date of a stored ISO timestamp, or null if it will not parse. */
export function localCalendarDateFromISO(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return localCalendarDate(d);
}

/** Whole local calendar days from one YYYY-MM-DD to another. DST-safe. */
export function daysBetweenLocalDates(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

/** Inclusive start / exclusive end ISO timestamps covering a local calendar day. */
export function isoRangeForLocalDate(dateStr: string): { start: string; end: string } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function nextStreak(
  current: number,
  lastReadDate: string | null | undefined,
  today: string
): { streak: number; alreadyToday: boolean } {
  if (lastReadDate === today) {
    return { streak: current, alreadyToday: true };
  }
  const yesterday = addLocalCalendarDays(today, -1);
  if (lastReadDate === yesterday) {
    return { streak: current + 1, alreadyToday: false };
  }
  return { streak: 1, alreadyToday: false };
}

/** Streak shown on You: zero once last read is older than local yesterday. */
export function displayedStreak(
  stored: number,
  lastReadDate: string | null | undefined,
  today: string = localCalendarDate()
): number {
  if (!lastReadDate || stored <= 0) return 0;
  const yesterday = addLocalCalendarDays(today, -1);
  if (lastReadDate === today || lastReadDate === yesterday) return stored;
  return 0;
}
