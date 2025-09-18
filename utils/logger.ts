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
      // Use setTimeout to avoid text rendering issues in React Native
      setTimeout(() => console.log('[INFO]', ...args), 0);
    }
  },

  /**
   * Log warning messages (only in development)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      // Use setTimeout to avoid text rendering issues in React Native
      setTimeout(() => console.warn('[WARN]', ...args), 0);
    }
  },

  /**
   * Log error messages (only in development)
   * In production, you could replace this with crash reporting service
   */
  error: (...args: any[]) => {
    if (isDevelopment) {
      // Use setTimeout to avoid text rendering issues in React Native
      setTimeout(() => console.error('[ERROR]', ...args), 0);
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
