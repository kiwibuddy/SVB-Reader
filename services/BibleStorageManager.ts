import * as FileSystem from 'expo-file-system/legacy';
import logger from '@/utils/logger';

export type SupportedBibleLanguage = 'en' | 'fr' | 'es' | 'pt';

interface BibleMetadata {
  language: string;
  languageDisplay: string;
  version: string;
  lastUpdated: string;
  files: {
    bible: {
      name: string;
      size: number;
      url: string;
      description: string;
    };
    questions?: {
      name: string;
      size: number;
      url: string;
      description: string;
    };
  };
  totalSize: number;
  description: string;
}

interface DownloadProgress {
  bytesDownloaded: number;
  totalBytes: number;
  progress: number; // 0-1
  fileType?: 'bible' | 'questions'; // Track which file is downloading
}

export class BibleStorageManager {
  private static instance: BibleStorageManager;
  private bibleDirectory: string;
  
  // Firebase Storage URLs
  private static readonly METADATA_URLS: Record<SupportedBibleLanguage, string> = {
    en: '', // English is bundled
    fr: 'https://firebasestorage.googleapis.com/v0/b/sourceview-together.firebasestorage.app/o/Bible%2Ffr%2Fmetadata.json?alt=media&token=62ba764e-f83b-4df3-b19f-cc3cf3a6467f',
    es: '', // Future
    pt: '', // Future
  };

  private constructor() {
    this.bibleDirectory = `${FileSystem.documentDirectory}bibles/`;
  }

  public static getInstance(): BibleStorageManager {
    if (!BibleStorageManager.instance) {
      BibleStorageManager.instance = new BibleStorageManager();
    }
    return BibleStorageManager.instance;
  }

  /**
   * Initialize the Bible storage directory
   */
  async initialize(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.bibleDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.bibleDirectory, { intermediates: true });
        logger.info('📁 Bible storage directory created');
      }
    } catch (error) {
      logger.error('❌ Failed to initialize Bible storage:', error);
      throw error;
    }
  }

  /**
   * Check if a Bible is downloaded (both Bible and Questions files if questions exist)
   */
  async isBibleDownloaded(language: SupportedBibleLanguage): Promise<boolean> {
    if (language === 'en') return true; // English is bundled
    
    try {
      const biblePath = `${this.bibleDirectory}${language}.json`;
      const bibleInfo = await FileSystem.getInfoAsync(biblePath);
      
      if (!bibleInfo.exists) {
        return false;
      }

      // Check if questions file exists (new format)
      const questionsPath = `${this.bibleDirectory}${language}-questions.json`;
      const questionsInfo = await FileSystem.getInfoAsync(questionsPath);
      
      // If metadata indicates questions should exist, check for questions file
      // Otherwise, Bible-only is acceptable (backward compatibility)
      const metadata = await this.getBibleMetadata(language);
      if (metadata?.files.questions) {
        // New format requires both files
        return questionsInfo.exists;
      }
      
      // Old format or no questions metadata - Bible file alone is sufficient
      return true;
    } catch (error) {
      logger.error(`❌ Error checking if ${language} Bible exists:`, error);
      return false;
    }
  }

  /**
   * Get metadata for a language Bible
   */
  async getBibleMetadata(language: SupportedBibleLanguage): Promise<BibleMetadata | null> {
    const metadataUrl = BibleStorageManager.METADATA_URLS[language];
    if (!metadataUrl) {
      logger.warn(`⚠️ No metadata URL for language: ${language}`);
      return null;
    }

    try {
      const response = await fetch(metadataUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const metadata: BibleMetadata = await response.json();
      return metadata;
    } catch (error) {
      logger.error(`❌ Failed to fetch metadata for ${language}:`, error);
      return null;
    }
  }

  /**
   * Download a Bible (and Questions file if available) with progress tracking
   */
  async downloadBible(
    language: SupportedBibleLanguage,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<boolean> {
    if (language === 'en') {
      logger.info('ℹ️ English Bible is bundled, no download needed');
      return true;
    }

    try {
      await this.initialize();

      // Get metadata to get download URLs
      const metadata = await this.getBibleMetadata(language);
      if (!metadata) {
        throw new Error(`Failed to get metadata for ${language}`);
      }

      // Download Bible file
      const bibleUrl = metadata.files.bible.url;
      const bibleSize = metadata.files.bible.size;
      const biblePath = `${this.bibleDirectory}${language}.json`;

      logger.info(`📥 Starting download of ${language} Bible (${(bibleSize / 1024 / 1024).toFixed(2)} MB)`);

      // Download Bible with progress
      const bibleDownloadResumable = FileSystem.createDownloadResumable(
        bibleUrl,
        biblePath,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          onProgress?.({
            bytesDownloaded: downloadProgress.totalBytesWritten,
            totalBytes: downloadProgress.totalBytesExpectedToWrite,
            progress: progress * 0.95, // Bible is ~95% of total size
            fileType: 'bible'
          });
        }
      );

      const bibleResult = await bibleDownloadResumable.downloadAsync();
      
      if (!bibleResult || bibleResult.status !== 200) {
        throw new Error(`Bible download failed with status ${bibleResult?.status || 'unknown'}`);
      }

      // Verify Bible file
      const bibleFileInfo = await FileSystem.getInfoAsync(biblePath);
      if (!bibleFileInfo.exists || bibleFileInfo.size === 0) {
        throw new Error('Bible download completed but file not found or empty');
      }

      logger.info(`✅ ${language} Bible downloaded successfully (${(bibleFileInfo.size / 1024 / 1024).toFixed(2)} MB)`);

      // Download Questions file if available
      let questionsDownloaded = false;
      if (metadata.files.questions) {
        const questionsUrl = metadata.files.questions.url;
        const questionsSize = metadata.files.questions.size;
        const questionsPath = `${this.bibleDirectory}${language}-questions.json`;

        logger.info(`📥 Starting download of ${language} Questions (${(questionsSize / 1024 / 1024).toFixed(2)} MB)`);

        const questionsDownloadResumable = FileSystem.createDownloadResumable(
          questionsUrl,
          questionsPath,
          {},
          (downloadProgress) => {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            // Combine with Bible progress (Bible: 95%, Questions: 5%)
            const combinedProgress = 0.95 + (progress * 0.05);
            onProgress?.({
              bytesDownloaded: bibleFileInfo.size + downloadProgress.totalBytesWritten,
              totalBytes: bibleSize + questionsSize,
              progress: combinedProgress,
              fileType: 'questions'
            });
          }
        );

        const questionsResult = await questionsDownloadResumable.downloadAsync();
        
        if (questionsResult && questionsResult.status === 200) {
          const questionsFileInfo = await FileSystem.getInfoAsync(questionsPath);
          if (questionsFileInfo.exists && questionsFileInfo.size > 0) {
            questionsDownloaded = true;
            logger.info(`✅ ${language} Questions downloaded successfully (${(questionsFileInfo.size / 1024).toFixed(2)} KB)`);
          } else {
            logger.warn(`⚠️ Questions download completed but file not found or empty`);
          }
        } else {
          logger.warn(`⚠️ Questions download failed with status ${questionsResult?.status || 'unknown'}`);
        }
      }

      // Save metadata locally
      await this.saveMetadata(language, metadata);
      
      // Final progress update
      let questionsSize = 0;
      if (questionsDownloaded) {
        const questionsFileInfo = await FileSystem.getInfoAsync(`${this.bibleDirectory}${language}-questions.json`);
        questionsSize = questionsFileInfo.exists ? questionsFileInfo.size : 0;
      }
      
      onProgress?.({
        bytesDownloaded: bibleFileInfo.size + questionsSize,
        totalBytes: bibleSize + (metadata.files.questions?.size || 0),
        progress: 1.0
      });
      
      return true;
    } catch (error) {
      logger.error(`❌ Failed to download ${language} Bible:`, error);
      // Clean up partial downloads
      await this.deleteBible(language);
      return false;
    }
  }

  /**
   * Load a downloaded Bible from local storage
   */
  async loadBible(language: SupportedBibleLanguage): Promise<any | null> {
    if (language === 'en') {
      // Load bundled English Bible - use static import so Metro bundles it
      try {
        // @ts-ignore - Metro will handle this JSON import
        return require('@/assets/data/newBibleNLT1.json');
      } catch (error) {
        logger.error('❌ Failed to load bundled English Bible:', error);
        return null;
      }
    }

    try {
      const filePath = `${this.bibleDirectory}${language}.json`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (!fileInfo.exists) {
        logger.warn(`⚠️ ${language} Bible not found locally`);
        return null;
      }

      logger.info(`📖 Loading ${language} Bible from local storage`);
      const fileContent = await FileSystem.readAsStringAsync(filePath);
      
      // Validate JSON before parsing
      if (!fileContent || fileContent.trim().length === 0) {
        throw new Error('Bible file is empty');
      }
      
      const bibleData = JSON.parse(fileContent);
      
      // Validate Bible structure
      if (!bibleData || typeof bibleData !== 'object') {
        throw new Error(`Invalid Bible data structure: expected object, got ${typeof bibleData}`);
      }
      
      // Check if it has segment keys (should be an object with segment IDs as keys)
      const keys = Object.keys(bibleData);
      logger.info(`✅ ${language} Bible loaded successfully. Structure:`, {
        type: typeof bibleData,
        isArray: Array.isArray(bibleData),
        keysCount: keys.length,
        firstKeys: keys.slice(0, 10),
        hasError: 'error' in bibleData,
        keysSample: keys.slice(0, 5)
      });
      
      // If Bible has an "error" key, something went wrong
      if ('error' in bibleData) {
        logger.error(`❌ Bible file contains error:`, bibleData.error);
        // Delete corrupted file so it can be re-downloaded
        await this.deleteBible(language);
        throw new Error(`Bible file contains error: ${JSON.stringify(bibleData.error)}`);
      }
      
      // Check if Bible structure is valid (should have segment keys, not just "error")
      if (keys.length === 1 && keys[0] === 'error') {
        logger.error(`❌ Bible file appears corrupted (only has "error" key). Deleting file...`);
        await this.deleteBible(language);
        throw new Error('Bible file is corrupted and has been deleted. Please re-download.');
      }
      
      // Handle new structure with separate questions and segments
      if ('segments' in bibleData && 'questions' in bibleData) {
        logger.info(`✅ ${language} Bible has integrated questions structure`);
        logger.info(`   • Segments: ${Object.keys(bibleData.segments).length}`);
        logger.info(`   • Questions: ${Object.keys(bibleData.questions).length}`);
        logger.warn(`⚠️ Bible file contains questions section. Questions should be in separate file.`);
        // Return only segments for Bible reading; questions are accessed separately via QuestionsLoader
        return bibleData.segments;
      }
      
      // Handle Bible-only structure (new format - questions in separate file)
      if ('segments' in bibleData && !('questions' in bibleData)) {
        logger.info(`✅ ${language} Bible has segments-only structure (questions in separate file)`);
        return bibleData.segments;
      }
      
      // Handle old flat structure (segments directly at root level)
      return bibleData;
    } catch (error) {
      logger.error(`❌ Failed to load ${language} Bible:`, error);
      return null;
    }
  }

  /**
   * Delete a downloaded Bible (and Questions file if exists) to free up space
   */
  async deleteBible(language: SupportedBibleLanguage): Promise<boolean> {
    if (language === 'en') {
      logger.warn('⚠️ Cannot delete bundled English Bible');
      return false;
    }

    try {
      const biblePath = `${this.bibleDirectory}${language}.json`;
      const questionsPath = `${this.bibleDirectory}${language}-questions.json`;
      const metadataPath = `${this.bibleDirectory}${language}-metadata.json`;
      
      const bibleInfo = await FileSystem.getInfoAsync(biblePath);
      if (bibleInfo.exists) {
        await FileSystem.deleteAsync(biblePath);
        logger.info(`🗑️ Deleted ${language} Bible`);
      }

      const questionsInfo = await FileSystem.getInfoAsync(questionsPath);
      if (questionsInfo.exists) {
        await FileSystem.deleteAsync(questionsPath);
        logger.info(`🗑️ Deleted ${language} Questions`);
      }

      const metadataInfo = await FileSystem.getInfoAsync(metadataPath);
      if (metadataInfo.exists) {
        await FileSystem.deleteAsync(metadataPath);
      }

      return true;
    } catch (error) {
      logger.error(`❌ Failed to delete ${language} Bible:`, error);
      return false;
    }
  }

  /**
   * Get the size of a downloaded Bible (includes Questions file if exists)
   */
  async getBibleSize(language: SupportedBibleLanguage): Promise<number> {
    if (language === 'en') return 0; // Bundled

    try {
      const biblePath = `${this.bibleDirectory}${language}.json`;
      const questionsPath = `${this.bibleDirectory}${language}-questions.json`;
      
      let totalSize = 0;
      
      const bibleInfo = await FileSystem.getInfoAsync(biblePath);
      if (bibleInfo.exists && bibleInfo.size) {
        totalSize += bibleInfo.size;
      }
      
      const questionsInfo = await FileSystem.getInfoAsync(questionsPath);
      if (questionsInfo.exists && questionsInfo.size) {
        totalSize += questionsInfo.size;
      }
      
      return totalSize;
    } catch (error) {
      logger.error(`❌ Failed to get ${language} Bible size:`, error);
      return 0;
    }
  }

  /**
   * Get list of all downloaded Bibles
   */
  async getDownloadedBibles(): Promise<SupportedBibleLanguage[]> {
    const downloaded: SupportedBibleLanguage[] = ['en']; // English always available
    
    const languages: SupportedBibleLanguage[] = ['fr', 'es', 'pt'];
    for (const lang of languages) {
      if (await this.isBibleDownloaded(lang)) {
        downloaded.push(lang);
      }
    }
    
    return downloaded;
  }

  /**
   * Save metadata locally
   */
  private async saveMetadata(language: SupportedBibleLanguage, metadata: BibleMetadata): Promise<void> {
    try {
      const metadataPath = `${this.bibleDirectory}${language}-metadata.json`;
      await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(metadata, null, 2));
      logger.info(`✅ Saved metadata for ${language} Bible`);
    } catch (error) {
      logger.error(`❌ Failed to save metadata for ${language}:`, error);
    }
  }

  /**
   * Get locally saved metadata
   */
  async getLocalMetadata(language: SupportedBibleLanguage): Promise<BibleMetadata | null> {
    try {
      const metadataPath = `${this.bibleDirectory}${language}-metadata.json`;
      const fileInfo = await FileSystem.getInfoAsync(metadataPath);
      
      if (!fileInfo.exists) {
        return null;
      }

      const content = await FileSystem.readAsStringAsync(metadataPath);
      return JSON.parse(content);
    } catch (error) {
      logger.error(`❌ Failed to get local metadata for ${language}:`, error);
      return null;
    }
  }

  /**
   * Check if a Bible needs updating
   */
  async checkForUpdate(language: SupportedBibleLanguage): Promise<boolean> {
    try {
      const [localMetadata, remoteMetadata] = await Promise.all([
        this.getLocalMetadata(language),
        this.getBibleMetadata(language),
      ]);

      if (!localMetadata || !remoteMetadata) {
        return false;
      }

      // Compare versions
      return localMetadata.version !== remoteMetadata.version;
    } catch (error) {
      logger.error(`❌ Failed to check for ${language} Bible update:`, error);
      return false;
    }
  }
}

export const bibleStorageManager = BibleStorageManager.getInstance();

