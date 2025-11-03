import * as FileSystem from 'expo-file-system';
import logger from '@/utils/logger';
import { SupportedBibleLanguage } from './BibleStorageManager';

export interface SegmentQuestions {
  school: { set1: string[]; set2: string[] };
  family: { set1: string[]; set2: string[] };
  smallgroup: { set1: string[]; set2: string[] };
}

export class QuestionsLoader {
  private static instance: QuestionsLoader;
  private bibleDirectory: string;
  private questionsCache: Map<string, Record<string, SegmentQuestions>> = new Map();

  private constructor() {
    this.bibleDirectory = `${FileSystem.documentDirectory}bibles/`;
  }

  public static getInstance(): QuestionsLoader {
    if (!QuestionsLoader.instance) {
      QuestionsLoader.instance = new QuestionsLoader();
    }
    return QuestionsLoader.instance;
  }

  /**
   * Get questions for a specific segment and language
   */
  async getQuestions(
    segmentId: string,
    language: SupportedBibleLanguage
  ): Promise<SegmentQuestions | null> {
    try {
      // English uses SQLite, not the downloaded file
      if (language === 'en') {
        return null; // Let the component fall back to SQLite for English
      }

      // Check cache first
      const cacheKey = language;
      if (this.questionsCache.has(cacheKey)) {
        const questions = this.questionsCache.get(cacheKey);
        return questions?.[segmentId] || null;
      }

      // Load questions from downloaded Bible file
      const filePath = `${this.bibleDirectory}${language}.json`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (!fileInfo.exists) {
        logger.warn(`⚠️ ${language} Bible file not found at ${filePath}`);
        return null;
      }

      logger.info(`📖 Loading questions from ${language} Bible file...`);
      const content = await FileSystem.readAsStringAsync(filePath);
      const parsedData = JSON.parse(content);

      // Check if this Bible has questions
      if (parsedData.questions) {
        logger.info(`✅ Found questions for ${Object.keys(parsedData.questions).length} segments in ${language} Bible`);
        this.questionsCache.set(cacheKey, parsedData.questions);
        return parsedData.questions[segmentId] || null;
      }

      logger.warn(`⚠️ No questions section found in ${language} Bible`);
      return null;
    } catch (error) {
      logger.error(`❌ Failed to load questions for ${segmentId} in ${language}:`, error);
      return null;
    }
  }

  /**
   * Check if questions are available for a language
   */
  async hasQuestions(language: SupportedBibleLanguage): Promise<boolean> {
    try {
      if (language === 'en') return true; // English has SQLite questions

      const filePath = `${this.bibleDirectory}${language}.json`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (!fileInfo.exists) {
        return false;
      }

      // Check if cached
      if (this.questionsCache.has(language)) {
        return true;
      }

      // Check file structure
      const content = await FileSystem.readAsStringAsync(filePath);
      const parsedData = JSON.parse(content);
      
      return !!parsedData.questions;
    } catch (error) {
      logger.error(`❌ Error checking questions for ${language}:`, error);
      return false;
    }
  }

  /**
   * Clear questions cache for a specific language or all languages
   */
  clearCache(language?: SupportedBibleLanguage): void {
    if (language) {
      this.questionsCache.delete(language);
      logger.info(`🗑️ Cleared questions cache for ${language}`);
    } else {
      this.questionsCache.clear();
      logger.info('🗑️ Cleared all questions cache');
    }
  }

  /**
   * Preload questions for a language into cache
   */
  async preloadQuestions(language: SupportedBibleLanguage): Promise<boolean> {
    try {
      if (language === 'en') return true;

      const filePath = `${this.bibleDirectory}${language}.json`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (!fileInfo.exists) {
        return false;
      }

      logger.info(`📥 Preloading questions for ${language}...`);
      const content = await FileSystem.readAsStringAsync(filePath);
      const parsedData = JSON.parse(content);

      if (parsedData.questions) {
        this.questionsCache.set(language, parsedData.questions);
        logger.info(`✅ Preloaded ${Object.keys(parsedData.questions).length} segment questions for ${language}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`❌ Failed to preload questions for ${language}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const questionsLoader = QuestionsLoader.getInstance();

