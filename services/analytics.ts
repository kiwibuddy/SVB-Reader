/**
 * Analytics Service - Privacy-First PostHog Implementation
 * 
 * This service provides anonymous analytics tracking with user consent.
 * All tracking is opt-in and respects user privacy preferences.
 */

import PostHog from 'posthog-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import logger from '@/utils/logger';

// PostHog Configuration
const POSTHOG_API_KEY = 'phc_AgWByS9hf8HU7US8iQ5iSabXn4sVa5FEgjhi3FHYZUV';
const POSTHOG_HOST = 'https://us.i.posthog.com';

// Storage keys
const ANALYTICS_CONSENT_KEY = 'analytics_consent';
const ANALYTICS_CONSENT_ASKED_KEY = 'analytics_consent_asked';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

class AnalyticsService {
  public posthog: PostHog | null = null;
  public isInitialized: boolean = false;
  private isEnabled: boolean = false;
  public initializationError: string | null = null;

  /**
   * Initialize PostHog with privacy-first settings
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info('Analytics already initialized');
      return;
    }

    try {
      logger.info('🔄 Starting PostHog initialization...');
      logger.info(`📍 API Key: ${POSTHOG_API_KEY.substring(0, 15)}...`);
      logger.info(`📍 Host: ${POSTHOG_HOST}`);
      
      // Initialize PostHog (using constructor, not initAsync)
      this.posthog = new PostHog(POSTHOG_API_KEY, {
        host: POSTHOG_HOST,
        
        // Performance - send immediately for testing
        flushAt: 1, // Send events immediately
        flushInterval: 1, // Send events every 1 second
      });

      if (!this.posthog) {
        throw new Error('PostHog.initAsync returned null');
      }

      logger.info('✅ PostHog SDK created successfully');

      // Start opted out by default - user must consent
      this.posthog.optOut();
      
      this.isInitialized = true;
      this.initializationError = null;
      logger.info('✅ Analytics service initialized successfully');

      // Check if user has previously consented
      const hasConsented = await this.getConsent();
      if (hasConsented) {
        await this.enable();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.initializationError = errorMessage;
      logger.error('❌ Failed to initialize analytics:', error);
      logger.error('❌ Error details:', errorMessage);
    }
  }

  /**
   * Enable analytics tracking (user has consented)
   */
  async enable(): Promise<void> {
    if (!this.posthog) {
      logger.warn('PostHog not initialized');
      return;
    }

    try {
      this.isEnabled = true;
      this.posthog.optIn();
      await this.saveConsent(true);
      
      // Track that user opted in
      this.posthog.capture('analytics_opted_in', {
        app_version: Constants.expoConfig?.version || 'unknown',
        platform: Platform.OS,
      });

      // Force flush the opt-in event
      await this.posthog.flush();

      logger.info('✅ Analytics enabled and opt-in event sent to PostHog');
    } catch (error) {
      logger.error('Failed to enable analytics:', error);
    }
  }

  /**
   * Disable analytics tracking (user has opted out)
   */
  async disable(): Promise<void> {
    if (!this.posthog) {
      logger.warn('PostHog not initialized');
      return;
    }

    try {
      // Track opt-out before disabling
      this.posthog.capture('analytics_opted_out');
      
      this.isEnabled = false;
      this.posthog.optOut();
      await this.saveConsent(false);
      
      logger.info('Analytics disabled');
    } catch (error) {
      logger.error('Failed to disable analytics:', error);
    }
  }

  /**
   * Check if analytics is enabled
   */
  isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Track a custom event
   */
  async trackEvent(eventName: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isEnabled || !this.posthog) {
      return;
    }

    try {
      // Add standard properties to all events
      const enrichedProperties = {
        ...properties,
        app_version: Constants.expoConfig?.version || 'unknown',
        platform: Platform.OS,
        device_type: Platform.OS === 'ios' && (Platform as any).isPad ? 'tablet' : 'phone',
      };

      this.posthog.capture(eventName, enrichedProperties);
      
      if (__DEV__) {
        logger.info(`📊 Analytics event captured: ${eventName}`, enrichedProperties);
        // Force flush in dev mode for immediate testing
        await this.posthog.flush();
        logger.info(`📤 Analytics event flushed to PostHog`);
      }
    } catch (error) {
      logger.error('Failed to track event:', error);
    }
  }

  /**
   * Track screen view
   */
  async trackScreen(screenName: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isEnabled || !this.posthog) {
      return;
    }

    try {
      this.posthog.screen(screenName, properties);
      
      if (__DEV__) {
        logger.info(`Analytics screen: ${screenName}`);
      }
    } catch (error) {
      logger.error('Failed to track screen:', error);
    }
  }

  /**
   * Track reading plan events
   */
  async trackReadingPlan(
    action: 'started' | 'paused' | 'resumed' | 'completed' | 'abandoned',
    planId: string,
    planType: 'plan' | 'challenge',
    properties?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent(`reading_plan_${action}`, {
      plan_id: planId,
      plan_type: planType,
      ...properties,
    });
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsed(featureName: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('feature_used', {
      feature_name: featureName,
      ...properties,
    });
  }

  /**
   * Track group reading events
   */
  async trackGroupReading(
    action: 'started' | 'joined' | 'completed' | 'left',
    properties?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent(`group_reading_${action}`, properties);
  }

  /**
   * Track errors (useful for debugging)
   */
  async trackError(errorType: string, errorMessage: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      ...properties,
    });
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(metricName: string, value: number, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('performance_metric', {
      metric_name: metricName,
      value,
      ...properties,
    });
  }

  /**
   * Check if user has been asked for consent
   */
  async hasAskedForConsent(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(ANALYTICS_CONSENT_ASKED_KEY);
      return value === 'true';
    } catch (error) {
      logger.error('Failed to check consent asked status:', error);
      return false;
    }
  }

  /**
   * Mark that user has been asked for consent
   */
  async markConsentAsked(): Promise<void> {
    try {
      await AsyncStorage.setItem(ANALYTICS_CONSENT_ASKED_KEY, 'true');
    } catch (error) {
      logger.error('Failed to mark consent asked:', error);
    }
  }

  /**
   * Get user's consent preference
   */
  private async getConsent(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(ANALYTICS_CONSENT_KEY);
      return value === 'true';
    } catch (error) {
      logger.error('Failed to get consent:', error);
      return false;
    }
  }

  /**
   * Save user's consent preference
   */
  private async saveConsent(consent: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(ANALYTICS_CONSENT_KEY, consent.toString());
    } catch (error) {
      logger.error('Failed to save consent:', error);
    }
  }

  /**
   * Reset analytics (for testing or user request)
   */
  async reset(): Promise<void> {
    if (this.posthog) {
      this.posthog.reset();
    }
    this.isEnabled = false;
    await AsyncStorage.removeItem(ANALYTICS_CONSENT_KEY);
    await AsyncStorage.removeItem(ANALYTICS_CONSENT_ASKED_KEY);
    logger.info('Analytics reset');
  }

  /**
   * Flush pending events (call before app close)
   */
  async flush(): Promise<void> {
    if (this.posthog) {
      await this.posthog.flush();
    }
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Convenience functions for common tracking
export const trackFeature = (featureName: string, properties?: Record<string, any>) => 
  analytics.trackFeatureUsed(featureName, properties);

export const trackScreen = (screenName: string, properties?: Record<string, any>) => 
  analytics.trackScreen(screenName, properties);

export const trackReadingPlan = (
  action: 'started' | 'paused' | 'resumed' | 'completed' | 'abandoned',
  planId: string,
  planType: 'plan' | 'challenge',
  properties?: Record<string, any>
) => analytics.trackReadingPlan(action, planId, planType, properties);

export const trackGroupReading = (
  action: 'started' | 'joined' | 'completed' | 'left',
  properties?: Record<string, any>
) => analytics.trackGroupReading(action, properties);

