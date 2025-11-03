/**
 * Language Detection Service
 * 
 * Detects device language on first launch and offers to download
 * the appropriate Bible translation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupportedBibleLanguage, bibleStorageManager } from './BibleStorageManager';
import logger from '@/utils/logger';

// Dynamically import expo-localization to handle cases where native module isn't available
let Localization: any = null;
try {
  Localization = require('expo-localization');
} catch (error) {
  logger.warn('expo-localization not available, language detection will default to English');
}

const FIRST_LAUNCH_KEY = '@app:firstLaunchCompleted';
const LANGUAGE_DETECTION_KEY = '@app:languageDetectionShown';

export interface LanguageDetectionResult {
  isFirstLaunch: boolean;
  deviceLanguage: SupportedBibleLanguage;
  shouldPromptDownload: boolean;
  needsDownload: boolean;
}

class LanguageDetectionService {
  private static instance: LanguageDetectionService;

  private constructor() {}

  public static getInstance(): LanguageDetectionService {
    if (!LanguageDetectionService.instance) {
      LanguageDetectionService.instance = new LanguageDetectionService();
    }
    return LanguageDetectionService.instance;
  }

  /**
   * Detect device language and determine if we should prompt for Bible download
   */
  public async detectLanguageOnLaunch(): Promise<LanguageDetectionResult> {
    try {
      // Check if this is first launch
      const isFirstLaunch = await this.isFirstLaunch();
      
      // Get device language
      const deviceLanguage = this.getDeviceLanguage();
      
      // Check if we've already shown language detection prompt
      const detectionShown = await AsyncStorage.getItem(LANGUAGE_DETECTION_KEY);
      const shouldPromptDownload = isFirstLaunch && !detectionShown && deviceLanguage !== 'en';

      // Check if Bible needs downloading
      let needsDownload = false;
      if (deviceLanguage !== 'en') {
        needsDownload = !(await bibleStorageManager.isBibleDownloaded(deviceLanguage));
      }

      logger.info('📱 Language Detection:', {
        isFirstLaunch,
        deviceLanguage,
        shouldPromptDownload,
        needsDownload,
      });

      return {
        isFirstLaunch,
        deviceLanguage,
        shouldPromptDownload,
        needsDownload,
      };
    } catch (error) {
      logger.error('❌ Language detection failed:', error);
      return {
        isFirstLaunch: false,
        deviceLanguage: 'en',
        shouldPromptDownload: false,
        needsDownload: false,
      };
    }
  }

  /**
   * Get device's preferred language
   */
  public getDeviceLanguage(): SupportedBibleLanguage {
    try {
      // Check if expo-localization is available
      if (!Localization) {
        logger.warn('expo-localization not available, defaulting to English');
        return 'en';
      }

      // Try to get locale from expo-localization
      let deviceLocale = 'en';
      try {
        if (Localization.locale) {
          deviceLocale = Localization.locale;
        } else if (Localization.getLocales && Localization.getLocales().length > 0) {
          deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
        }
      } catch (localizationError) {
        logger.warn('Failed to get locale from expo-localization:', localizationError);
        return 'en';
      }

      const languageCode = deviceLocale.split('-')[0].toLowerCase();
      
      logger.info(`📱 Device locale: ${deviceLocale}, extracted language: ${languageCode}`);

      // Map to supported languages
      switch (languageCode) {
        case 'fr':
          return 'fr';
        case 'es':
          return 'es';
        case 'pt':
          return 'pt';
        default:
          return 'en';
      }
    } catch (error) {
      logger.error('❌ Failed to get device language:', error);
      return 'en';
    }
  }

  /**
   * Check if this is the first app launch
   */
  private async isFirstLaunch(): Promise<boolean> {
    try {
      const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
      return hasLaunched === null;
    } catch (error) {
      logger.error('❌ Failed to check first launch:', error);
      return false;
    }
  }

  /**
   * Mark first launch as completed
   */
  public async markFirstLaunchComplete(): Promise<void> {
    try {
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
      logger.info('✅ First launch marked as complete');
    } catch (error) {
      logger.error('❌ Failed to mark first launch:', error);
    }
  }

  /**
   * Mark language detection prompt as shown
   */
  public async markLanguageDetectionShown(): Promise<void> {
    try {
      await AsyncStorage.setItem(LANGUAGE_DETECTION_KEY, 'true');
      logger.info('✅ Language detection marked as shown');
    } catch (error) {
      logger.error('❌ Failed to mark language detection:', error);
    }
  }

  /**
   * Reset first launch state (for testing)
   */
  public async resetFirstLaunch(): Promise<void> {
    try {
      await AsyncStorage.removeItem(FIRST_LAUNCH_KEY);
      await AsyncStorage.removeItem(LANGUAGE_DETECTION_KEY);
      logger.info('🔄 First launch state reset');
    } catch (error) {
      logger.error('❌ Failed to reset first launch:', error);
    }
  }

  /**
   * Get language display name
   */
  public getLanguageDisplayName(language: SupportedBibleLanguage): string {
    const names: Record<SupportedBibleLanguage, string> = {
      en: 'English',
      fr: 'Français',
      es: 'Español',
      pt: 'Português',
    };
    return names[language] || 'English';
  }
}

export const languageDetectionService = LanguageDetectionService.getInstance();

export default languageDetectionService;

