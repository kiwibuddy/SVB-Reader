import * as FileSystem from 'expo-file-system/legacy';
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
   * Loads from separate questions file (new format) or falls back to Bible file (old format)
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

      // Try loading from separate questions file first (new format)
      const questionsPath = `${this.bibleDirectory}${language}-questions.json`;
      const questionsFileInfo = await FileSystem.getInfoAsync(questionsPath);
      
      if (questionsFileInfo.exists) {
        logger.info(`📖 Loading questions from ${language} questions file...`);
        const content = await FileSystem.readAsStringAsync(questionsPath);
        const parsedData = JSON.parse(content);

        // Handle unified structure: { metadata: {...}, questions: { S001: {...} } }
        if (parsedData.questions) {
          logger.info(`✅ Found questions for ${Object.keys(parsedData.questions).length} segments in ${language} questions file`);
          this.questionsCache.set(cacheKey, parsedData.questions);
          return parsedData.questions[segmentId] || null;
        }

        logger.warn(`⚠️ Questions file exists but missing questions section`);
      }

      // Fallback: Try loading from Bible file (old format - backward compatibility)
      const biblePath = `${this.bibleDirectory}${language}.json`;
      const bibleFileInfo = await FileSystem.getInfoAsync(biblePath);
      
      if (bibleFileInfo.exists) {
        logger.info(`📖 Loading questions from ${language} Bible file (fallback - old format)...`);
        const content = await FileSystem.readAsStringAsync(biblePath);
        const parsedData = JSON.parse(content);

        // Check if this Bible has questions (old format)
        if (parsedData.questions) {
          logger.info(`✅ Found questions for ${Object.keys(parsedData.questions).length} segments in ${language} Bible (deprecated)`);
          logger.warn(`⚠️ Using deprecated format: questions embedded in Bible file. Please update to separate questions file.`);
          this.questionsCache.set(cacheKey, parsedData.questions);
          return parsedData.questions[segmentId] || null;
        }
      }

      logger.warn(`⚠️ No questions file found for ${language}`);
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

      // Check if cached
      if (this.questionsCache.has(language)) {
        return true;
      }

      // Check separate questions file first (new format)
      const questionsPath = `${this.bibleDirectory}${language}-questions.json`;
      const questionsFileInfo = await FileSystem.getInfoAsync(questionsPath);
      
      if (questionsFileInfo.exists) {
        try {
          const content = await FileSystem.readAsStringAsync(questionsPath);
          const parsedData = JSON.parse(content);
          return !!parsedData.questions;
        } catch (error) {
          logger.warn(`⚠️ Error reading questions file:`, error);
        }
      }

      // Fallback: Check Bible file (old format)
      const biblePath = `${this.bibleDirectory}${language}.json`;
      const bibleFileInfo = await FileSystem.getInfoAsync(biblePath);
      
      if (bibleFileInfo.exists) {
        try {
          const content = await FileSystem.readAsStringAsync(biblePath);
          const parsedData = JSON.parse(content);
          return !!parsedData.questions;
        } catch (error) {
          logger.warn(`⚠️ Error reading Bible file:`, error);
        }
      }

      return false;
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

      // Try separate questions file first (new format)
      const questionsPath = `${this.bibleDirectory}${language}-questions.json`;
      const questionsFileInfo = await FileSystem.getInfoAsync(questionsPath);
      
      if (questionsFileInfo.exists) {
        logger.info(`📥 Preloading questions for ${language} from questions file...`);
        const content = await FileSystem.readAsStringAsync(questionsPath);
        const parsedData = JSON.parse(content);

        if (parsedData.questions) {
          this.questionsCache.set(language, parsedData.questions);
          logger.info(`✅ Preloaded ${Object.keys(parsedData.questions).length} segment questions for ${language}`);
          return true;
        }
      }

      // Fallback: Try Bible file (old format)
      const biblePath = `${this.bibleDirectory}${language}.json`;
      const bibleFileInfo = await FileSystem.getInfoAsync(biblePath);
      
      if (bibleFileInfo.exists) {
        logger.info(`📥 Preloading questions for ${language} from Bible file (fallback)...`);
        const content = await FileSystem.readAsStringAsync(biblePath);
        const parsedData = JSON.parse(content);

        if (parsedData.questions) {
          this.questionsCache.set(language, parsedData.questions);
          logger.info(`✅ Preloaded ${Object.keys(parsedData.questions).length} segment questions for ${language} (deprecated format)`);
          return true;
        }
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

