/**
 * Production-safe logging utility
 * Only logs in development, removes all console statements in production
 */

const isDevelopment = __DEV__;

export const logger = {
  /**
   * Log informational messages (only in development)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log warning messages (only in development)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Log error messages (only in development)
   * In production, you could replace this with crash reporting service
   */
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error('[ERROR]', ...args);
    } else {
      // In production, you might want to send to crash reporting service
      // Example: crashlytics().recordError(new Error(args.join(' ')));
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log success messages (only in development)
   */
  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[SUCCESS]', ...args);
    }
  }
};

export default logger;
