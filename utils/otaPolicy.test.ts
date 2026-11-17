import { RELOAD_AFTER_BACKGROUND_MS, isBusyPath, safeAfterReloadRoute, shouldApplyOnForeground } from '@/utils/otaPolicy';

const HOUR = 60 * 60 * 1000;

describe('shouldApplyOnForeground', () => {
  test('applies a pending update after 30+ minutes away, on a list screen', () => {
    expect(shouldApplyOnForeground({ pending: true, backgroundMs: HOUR, pathname: '/Home' })).toBe(true);
    expect(shouldApplyOnForeground({ pending: true, backgroundMs: RELOAD_AFTER_BACKGROUND_MS, pathname: '/plan' })).toBe(true);
  });

  test('nothing pending: no reload', () => {
    expect(shouldApplyOnForeground({ pending: false, backgroundMs: HOUR, pathname: '/Home' })).toBe(false);
  });

  test('a short trip away: no reload', () => {
    expect(shouldApplyOnForeground({ pending: true, backgroundMs: 29 * 60 * 1000, pathname: '/Home' })).toBe(false);
    expect(shouldApplyOnForeground({ pending: true, backgroundMs: null, pathname: '/Home' })).toBe(false);
  });

  test('never while someone is reading, onboarding or making a plan', () => {
    for (const pathname of ['/S199', '/S001?planId=x', '/I001', '/onboarding', '/plan/create']) {
      expect(shouldApplyOnForeground({ pending: true, backgroundMs: HOUR, pathname })).toBe(false);
    }
  });
});

test('busy paths', () => {
  expect(isBusyPath('/S365')).toBe(true);
  expect(isBusyPath('/plan/adventJourneyChronological')).toBe(false);
  expect(isBusyPath('/cast/Moses')).toBe(false);
  expect(isBusyPath(null)).toBe(false);
});

test('after-reload routes must be in-app paths', () => {
  expect(safeAfterReloadRoute('/Home')).toBe('/Home');
  expect(safeAfterReloadRoute('/S322')).toBe('/S322');
  expect(safeAfterReloadRoute('https://example.com')).toBeNull();
  expect(safeAfterReloadRoute('//example.com')).toBeNull();
  expect(safeAfterReloadRoute(null)).toBeNull();
});
