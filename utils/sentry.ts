import * as Sentry from '@sentry/react-native';

let initialized = false;

export function initSentry(): void {
  if (initialized || __DEV__) return;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    enabled: true,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
  initialized = true;
}

export function captureException(error: unknown): void {
  if (!initialized) return;
  Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
}

export function addBreadcrumb(message: string, data?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.addBreadcrumb({
    category: 'app',
    level: 'warning',
    message,
    data,
  });
}
