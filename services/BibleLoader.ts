/**
 * Bible Loader Service
 * 
 * Centralized service for loading Bible data based on user's language setting.
 * Handles both bundled English Bible and downloaded language packs.
 */

import { bibleStorageManager, SupportedBibleLanguage } from './BibleStorageManager';
import logger from '@/utils/logger';
import i18next from 'i18next';

// Lazy load English Bible to prevent crashes if JSON import fails
let EnglishBible: any = null;
let englishBibleLoadError: Error | null = null;

function loadEnglishBible(): any {
  if (EnglishBible) {
    return EnglishBible;
  }
  
  if (englishBibleLoadError) {
    logger.error('❌ English Bible failed to load previously:', englishBibleLoadError);
    return null;
  }
  
  try {
    // Dynamic import to prevent crashes if file is missing
    EnglishBible = require('@/assets/data/newBibleNLT1.json');
    logger.info('✅ English Bible loaded successfully');
    return EnglishBible;
  } catch (error) {
    englishBibleLoadError = error instanceof Error ? error : new Error(String(error));
    logger.error('❌ Failed to load English Bible:', error);
    return null;
  }
}

/**
 * Singleton Bible loader that caches loaded Bibles in memory
 */
class BibleLoader {
  private static instance: BibleLoader;
  private cachedBibles: Map<SupportedBibleLanguage, any> = new Map();
  private currentLanguage: SupportedBibleLanguage = 'en';

  private constructor() {
    // Lazy load English Bible - don't crash if it fails to load
    try {
      const bible = loadEnglishBible();
      if (bible) {
        this.cachedBibles.set('en', bible);
      }
    } catch (error) {
      logger.error('❌ Failed to initialize English Bible in constructor:', error);
    }
  }

  public static getInstance(): BibleLoader {
    if (!BibleLoader.instance) {
      BibleLoader.instance = new BibleLoader();
    }
    return BibleLoader.instance;
  }

  /**
   * Get the currently loaded Bible
   * Automatically syncs with i18next language if no language provided
   */
  public getCurrentBible(requestedLanguage?: SupportedBibleLanguage): any {
    // If no language specified, check i18next for current language
    const language = requestedLanguage || (i18next.language as SupportedBibleLanguage) || 'en';
    
    // Normalize language code (handle 'fr-FR' -> 'fr')
    const normalizedLanguage = language.split('-')[0].toLowerCase() as SupportedBibleLanguage;
    
    // Check if we have this language cached
    if (this.cachedBibles.has(normalizedLanguage)) {
      const cachedBible = this.cachedBibles.get(normalizedLanguage);
      
      // Validate cached Bible - check if it's corrupted
      if (cachedBible && typeof cachedBible === 'object' && !Array.isArray(cachedBible)) {
        const keys = Object.keys(cachedBible);
        // If only one key and it's "error", the cache is corrupted
        if (keys.length === 1 && keys[0] === 'error') {
          logger.error(`❌ Cached Bible for ${normalizedLanguage} is corrupted, clearing cache`);
          this.cachedBibles.delete(normalizedLanguage);
          const englishBible = loadEnglishBible() || {};
        return englishBible;
        }
      }
      
      // Update currentLanguage if it's different (important for synchronization)
      if (this.currentLanguage !== normalizedLanguage) {
        logger.info(`🔄 Syncing currentLanguage from ${this.currentLanguage} to ${normalizedLanguage}`);
        this.currentLanguage = normalizedLanguage;
      }
      
      return cachedBible;
    }
    
    // If requested language is different from current, try to load it
    if (normalizedLanguage !== this.currentLanguage) {
      logger.info(`📖 Language mismatch: requested ${normalizedLanguage}, current ${this.currentLanguage}`);
      
      // For English, always return immediately
      if (normalizedLanguage === 'en') {
        this.currentLanguage = 'en';
        const englishBible = loadEnglishBible() || {};
        return englishBible;
      }
      
      // For other languages, try to load synchronously if cached, otherwise return English as fallback
      // Note: This is a synchronous method, so we can't await async loading
      // The async loading should happen via switchLanguage() which is called in setLanguage
      logger.warn(`⚠️ Bible for ${normalizedLanguage} not cached yet, returning English as fallback`);
      const englishBible = loadEnglishBible() || {};
      return englishBible;
    }
    
    const bible = this.cachedBibles.get(this.currentLanguage);
    if (!bible) {
      logger.warn(`⚠️ Bible not loaded for ${this.currentLanguage}, falling back to English`);
      const englishBible = loadEnglishBible() || {};
      return englishBible;
    }
    
    // Validate Bible structure before returning
    if (typeof bible === 'object' && !Array.isArray(bible)) {
      const keys = Object.keys(bible);
      if (keys.length === 1 && keys[0] === 'error') {
        logger.error(`❌ Bible for ${this.currentLanguage} is corrupted, clearing cache`);
        this.cachedBibles.delete(this.currentLanguage);
        const englishBible = loadEnglishBible() || {};
        return englishBible;
      }
    }
    
    return bible;
  }

  /**
   * Get Bible for a specific language
   */
  public async getBible(language: SupportedBibleLanguage): Promise<any> {
    // Check if already cached in memory
    if (this.cachedBibles.has(language)) {
      logger.info(`✅ Using cached ${language} Bible`);
      return this.cachedBibles.get(language);
    }

    // English is always bundled
    if (language === 'en') {
      const bible = loadEnglishBible();
      if (bible) {
        this.cachedBibles.set('en', bible);
        return bible;
      }
      return null;
    }

    // Try to load from storage
    try {
      logger.info(`📖 Loading ${language} Bible from storage...`);
      const bible = await bibleStorageManager.loadBible(language);
      
      if (!bible) {
        logger.warn(`⚠️ ${language} Bible not found, using English as fallback`);
        const englishBible = loadEnglishBible();
        return englishBible || {};
      }
      
      // Validate Bible structure - should be an object with segment IDs as keys
      if (typeof bible !== 'object' || Array.isArray(bible)) {
        logger.error(`❌ Invalid Bible structure: expected object, got ${typeof bible}`);
        const englishBible = loadEnglishBible() || {};
        return englishBible;
      }
      
      // Check if Bible has an error key (indicates corrupted file)
      if ('error' in bible) {
        logger.error(`❌ Bible file contains error key:`, bible.error);
        // Clear the corrupted cache
        this.cachedBibles.delete(language);
        const englishBible = loadEnglishBible() || {};
        return englishBible;
      }
      
      // Validate that Bible has segment keys (should have many keys like S001, S002, etc.)
      const keys = Object.keys(bible);
      if (keys.length === 0) {
        logger.error(`❌ Bible has no segment keys`);
        const englishBible = loadEnglishBible() || {};
        return englishBible;
      }
      
      // If only one key and it's "error", the file is corrupted
      if (keys.length === 1 && keys[0] === 'error') {
        logger.error(`❌ Bible file appears to be corrupted (only has "error" key)`);
        this.cachedBibles.delete(language);
        const englishBible = loadEnglishBible() || {};
        return englishBible;
      }
      
      // Cache in memory for fast access
      this.cachedBibles.set(language, bible);
      logger.info(`✅ ${language} Bible loaded and cached (${keys.length} segments)`);
      return bible;
    } catch (error) {
      logger.error(`❌ Error loading ${language} Bible:`, error);
      // Clear cache on error
      this.cachedBibles.delete(language);
      const englishBible = loadEnglishBible() || {};
      return englishBible;
    }
  }

  /**
   * Switch to a different language Bible
   * Returns true if successful, false if Bible needs to be downloaded
   */
  public async switchLanguage(language: SupportedBibleLanguage): Promise<{
    success: boolean;
    needsDownload: boolean;
  }> {
    logger.info(`🌍 Switching Bible language to: ${language}`);

    // English is always available
    if (language === 'en') {
      this.currentLanguage = 'en';
      return { success: true, needsDownload: false };
    }

    // Check if Bible is downloaded
    const isDownloaded = await bibleStorageManager.isBibleDownloaded(language);
    
    if (!isDownloaded) {
      logger.warn(`⚠️ ${language} Bible not downloaded`);
      return { success: false, needsDownload: true };
    }

    // Load the Bible
    const bible = await this.getBible(language);
    
    const englishBible = loadEnglishBible();
    if (bible && bible !== englishBible) {
      this.currentLanguage = language;
      logger.info(`✅ Successfully switched to ${language} Bible`);
      return { success: true, needsDownload: false };
    }

    logger.error(`❌ Failed to switch to ${language} Bible`);
    return { success: false, needsDownload: true };
  }

  /**
   * Check if a language Bible is available (downloaded or bundled)
   */
  public async isBibleAvailable(language: SupportedBibleLanguage): Promise<boolean> {
    if (language === 'en') return true; // Always bundled
    return await bibleStorageManager.isBibleDownloaded(language);
  }

  /**
   * Preload a language Bible into memory cache
   * Useful for improving performance when switching languages
   */
  public async preloadBible(language: SupportedBibleLanguage): Promise<boolean> {
    try {
      const bible = await this.getBible(language);
      const englishBible = loadEnglishBible();
      return bible !== englishBible || language === 'en';
    } catch (error) {
      logger.error(`❌ Failed to preload ${language} Bible:`, error);
      return false;
    }
  }

  /**
   * Clear memory cache for a specific language
   * Useful if you want to reload a Bible from storage (e.g., after update)
   */
  public clearCache(language?: SupportedBibleLanguage): void {
    if (language) {
      this.cachedBibles.delete(language);
      logger.info(`🗑️ Cleared cache for ${language} Bible`);
    } else {
      // Clear all except English
      this.cachedBibles.clear();
      const englishBible = loadEnglishBible();
      if (englishBible) {
        this.cachedBibles.set('en', englishBible);
      }
      logger.info('🗑️ Cleared all Bible caches (except English)');
    }
  }

  /**
   * Get current language
   */
  public getCurrentLanguage(): SupportedBibleLanguage {
    return this.currentLanguage;
  }
}

// Lazy singleton - don't create instance until first use
let bibleLoaderInstance: BibleLoader | null = null;

function getBibleLoaderInstance(): BibleLoader {
  if (!bibleLoaderInstance) {
    bibleLoaderInstance = BibleLoader.getInstance();
  }
  return bibleLoaderInstance;
}

// Export lazy singleton accessor
export const bibleLoader = {
  getCurrentBible: (language?: SupportedBibleLanguage) => getBibleLoaderInstance().getCurrentBible(language),
  getBible: (language: SupportedBibleLanguage) => getBibleLoaderInstance().getBible(language),
  switchLanguage: (language: SupportedBibleLanguage) => getBibleLoaderInstance().switchLanguage(language),
  isBibleAvailable: (language: SupportedBibleLanguage) => getBibleLoaderInstance().isBibleAvailable(language),
  preloadBible: (language: SupportedBibleLanguage) => getBibleLoaderInstance().preloadBible(language),
  clearCache: (language?: SupportedBibleLanguage) => getBibleLoaderInstance().clearCache(language),
  getCurrentLanguage: () => getBibleLoaderInstance().getCurrentLanguage(),
};

// Export default for backwards compatibility
export default bibleLoader;

