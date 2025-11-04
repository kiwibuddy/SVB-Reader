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
   * Log warning messages (ALWAYS logs in production for debugging)
   */
  warn: (...args: any[]) => {
    // ALWAYS log warnings - even in production - so they appear in crash logs
    console.warn('[WARN]', ...args);
  },

  /**
   * Log error messages (ALWAYS logs in production for crash debugging)
   * In production, logs are captured by system crash logs
   */
  error: (...args: any[]) => {
    // ALWAYS log errors - even in production - so they appear in crash logs
    const errorString = args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack}`;
      }
      return String(arg);
    }).join(' ');
    
    // Use console.error which appears in crash logs
    console.error('[ERROR]', ...args);
    
    // Also log to crash reporting service if available
    // Example: crashlytics().recordError(new Error(errorString));
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
