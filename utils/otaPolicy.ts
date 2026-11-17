/**
 * When it is safe to apply a downloaded update without waiting for the next
 * cold start. Pure, so it can be tested; utils/otaUpdates.ts does the reload.
 */

/** Away at least this long before an update is applied on return. */
export const RELOAD_AFTER_BACKGROUND_MS = 30 * 60 * 1000;

/**
 * Screens where a reload would lose something: the reader (place in the
 * story), onboarding (place in the walkthrough) and making a custom plan
 * (the form).
 */
export function isBusyPath(pathname: string | null | undefined): boolean {
  const path = pathname || '';
  return /^\/[SI]\d+/i.test(path) || path.startsWith('/onboarding') || path.startsWith('/plan/create');
}

export function shouldApplyOnForeground(input: {
  pending: boolean;
  /** How long the app was in the background, in ms (null if unknown). */
  backgroundMs: number | null;
  pathname: string | null | undefined;
}): boolean {
  if (!input.pending) return false;
  if (input.backgroundMs == null || input.backgroundMs < RELOAD_AFTER_BACKGROUND_MS) return false;
  return !isBusyPath(input.pathname);
}

/** Only in-app paths are accepted as a place to land after a reload. */
export function safeAfterReloadRoute(route: string | null | undefined): string | null {
  if (!route || !route.startsWith('/') || route.startsWith('//')) return null;
  return route;
}
