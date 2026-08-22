import {
  addLocalCalendarDays,
  daysBetweenLocalDates,
  displayedStreak,
  isoRangeForLocalDate,
  localCalendarDate,
  localCalendarDateFromISO,
  nextStreak,
} from './localDate';

describe('localCalendarDate', () => {
  it('formats from local year/month/day, not UTC', () => {
    const evening = new Date(2026, 7, 19, 20, 0, 0);
    expect(localCalendarDate(evening)).toBe('2026-08-19');
  });
});

describe('nextStreak', () => {
  it('does not increment twice on the same local day', () => {
    expect(nextStreak(3, '2026-08-19', '2026-08-19')).toEqual({ streak: 3, alreadyToday: true });
  });

  it('increments when the previous read was local yesterday', () => {
    expect(nextStreak(1, '2026-08-18', '2026-08-19')).toEqual({ streak: 2, alreadyToday: false });
  });

  it('treats NZ evening then next morning as two days', () => {
    const monEve = localCalendarDate(new Date(2026, 7, 17, 20, 0, 0));
    const tueMorn = localCalendarDate(new Date(2026, 7, 18, 9, 0, 0));
    expect(monEve).toBe('2026-08-17');
    expect(tueMorn).toBe('2026-08-18');
    expect(addLocalCalendarDays(monEve, 1)).toBe(tueMorn);
    expect(nextStreak(1, monEve, tueMorn).streak).toBe(2);
  });

  it('resets after a gap', () => {
    expect(nextStreak(12, '2026-07-01', '2026-08-19')).toEqual({ streak: 1, alreadyToday: false });
  });
});

describe('displayedStreak', () => {
  it('keeps the streak through local yesterday', () => {
    expect(displayedStreak(12, '2026-08-18', '2026-08-19')).toBe(12);
  });

  it('zeros a streak last updated three weeks ago', () => {
    expect(displayedStreak(12, '2026-07-28', '2026-08-19')).toBe(0);
  });
});

describe('daysBetweenLocalDates', () => {
  it('counts whole calendar days, not elapsed hours', () => {
    expect(daysBetweenLocalDates('2026-08-17', '2026-08-19')).toBe(2);
    expect(daysBetweenLocalDates('2026-08-19', '2026-08-19')).toBe(0);
  });

  it('is negative before the start date', () => {
    expect(daysBetweenLocalDates('2026-08-19', '2026-08-18')).toBe(-1);
  });

  it('crosses a month and a DST boundary', () => {
    expect(daysBetweenLocalDates('2026-08-31', '2026-09-01')).toBe(1);
    expect(daysBetweenLocalDates('2026-09-26', '2026-09-28')).toBe(2);
  });
});

describe('localCalendarDateFromISO', () => {
  it('reads a stored timestamp as a local calendar day', () => {
    const stored = new Date(2026, 7, 19, 22, 30, 0).toISOString();
    expect(localCalendarDateFromISO(stored)).toBe('2026-08-19');
  });

  it('returns null for missing or unparseable values', () => {
    expect(localCalendarDateFromISO(null)).toBeNull();
    expect(localCalendarDateFromISO('')).toBeNull();
    expect(localCalendarDateFromISO('not a date')).toBeNull();
  });
});

describe('isoRangeForLocalDate', () => {
  it('covers a full local day', () => {
    const { start, end } = isoRangeForLocalDate('2026-08-19');
    const startMs = Date.parse(start);
    const endMs = Date.parse(end);
    expect(endMs - startMs).toBe(24 * 60 * 60 * 1000);
  });
});
