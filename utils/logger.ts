/**
 * Production-safe logging utility
 * Only logs in development, removes all console statements in production
 */

import { addBreadcrumb, captureException } from '@/utils/sentry';

const isDevelopment = __DEV__;

export const logger = {
  /**
   * Log informational messages (only in development)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      // Use setTimeout to avoid text rendering issues in React Native
      setTimeout(() => console.log('[INFO]', ...args), 0);
    }
  },

  /**
   * Log warning messages (ALWAYS logs in production for debugging)
   */
  warn: (...args: any[]) => {
    // ALWAYS log warnings - even in production - so they appear in crash logs
    console.warn('[WARN]', ...args);
    addBreadcrumb(args.map(String).join(' '));
  },

  /**
   * Log error messages (ALWAYS logs in production for crash debugging)
   * In production, logs are captured by system crash logs
   */
  error: (...args: any[]) => {
    // ALWAYS log errors - even in production - so they appear in crash logs
    const errorArg = args.find((arg) => arg instanceof Error);
    if (errorArg) {
      captureException(errorArg);
    } else {
      captureException(new Error(args.map(String).join(' ')));
    }

    // Use console.error which appears in crash logs
    console.error('[ERROR]', ...args);
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      // Use setTimeout to avoid text rendering issues in React Native
      setTimeout(() => console.log('[DEBUG]', ...args), 0);
    }
  },

  /**
   * Log success messages (only in development)
   */
  success: (...args: any[]) => {
    if (isDevelopment) {
      // Use setTimeout to avoid text rendering issues in React Native
      setTimeout(() => console.log('[SUCCESS]', ...args), 0);
    }
  }
};

export default logger;
