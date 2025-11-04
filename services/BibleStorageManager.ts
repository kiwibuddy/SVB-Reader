import * as FileSystem from 'expo-file-system';
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
  };
  totalSize: number;
  description: string;
}

interface DownloadProgress {
  bytesDownloaded: number;
  totalBytes: number;
  progress: number; // 0-1
}

export class BibleStorageManager {
  private static instance: BibleStorageManager;
  private bibleDirectory: string;
  
  // Firebase Storage URLs
  private static readonly METADATA_URLS: Record<SupportedBibleLanguage, string> = {
    en: '', // English is bundled
    fr: 'https://firebasestorage.googleapis.com/v0/b/sourceview-together.firebasestorage.app/o/Bible%2Ffr%2Fmetadata.json?alt=media&token=3a8817b1-ab2d-41ae-b29e-36f82eace571',
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
   * Check if a Bible is downloaded
   */
  async isBibleDownloaded(language: SupportedBibleLanguage): Promise<boolean> {
    if (language === 'en') return true; // English is bundled
    
    try {
      const filePath = `${this.bibleDirectory}${language}.json`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.exists;
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
   * Download a Bible with progress tracking
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

      // Get metadata to get download URL
      const metadata = await this.getBibleMetadata(language);
      if (!metadata) {
        throw new Error(`Failed to get metadata for ${language}`);
      }

      const downloadUrl = metadata.files.bible.url;
      const totalSize = metadata.files.bible.size;
      const filePath = `${this.bibleDirectory}${language}.json`;

      logger.info(`📥 Starting download of ${language} Bible (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);

      // Download with progress
      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        filePath,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          onProgress?.({
            bytesDownloaded: downloadProgress.totalBytesWritten,
            totalBytes: downloadProgress.totalBytesExpectedToWrite,
            progress: progress,
          });
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (!result) {
        throw new Error('Download failed - no result returned');
      }

      // Check HTTP status code
      if (result.status !== 200) {
        // Read the error response
        const errorContent = await FileSystem.readAsStringAsync(filePath);
        let errorMessage = `Download failed with HTTP ${result.status}`;
        
        try {
          const errorJson = JSON.parse(errorContent);
          if (errorJson.error || errorJson.code) {
            errorMessage = `Firebase Storage error: ${errorJson.error?.message || errorJson.message || `Code ${errorJson.code || result.status}`}`;
            logger.error(`❌ Download error response:`, errorJson);
          }
        } catch (e) {
          // Not JSON, use raw content
          errorMessage = `Download failed: ${errorContent.substring(0, 200)}`;
        }
        
        // Clean up error file
        await FileSystem.deleteAsync(filePath, { idempotent: true });
        throw new Error(errorMessage);
      }

      // Verify file was downloaded
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error('Download completed but file not found');
      }

      // Get file size first
      const actualSize = fileInfo.size || 0;

      // Read first 1KB to check if it's an error JSON response (instead of reading entire 16MB file)
      // Only check if file is suspiciously small
      if (actualSize < 1024) {
        const fileContentPreview = await FileSystem.readAsStringAsync(filePath);
        
        // Check if it's an error JSON response
        try {
          const parsed = JSON.parse(fileContentPreview);
          if (parsed.error || parsed.code === 403 || parsed.code === 404) {
            const errorMsg = parsed.error?.message || parsed.message || `Firebase error: ${parsed.code}`;
            logger.error(`❌ Downloaded file contains error:`, parsed);
            await FileSystem.deleteAsync(filePath, { idempotent: true });
            throw new Error(`Download failed: ${errorMsg}`);
          }
        } catch (parseError) {
          // If parsing fails on small file, it's probably corrupted
          await FileSystem.deleteAsync(filePath, { idempotent: true });
          throw new Error('Downloaded file appears to be corrupted or empty');
        }
      }

      // Validate file size (should be close to expected size)
      const expectedSize = totalSize;
      const sizeDifference = Math.abs(actualSize - expectedSize);
      const sizeDifferencePercent = (sizeDifference / expectedSize) * 100;

      if (actualSize === 0) {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
        throw new Error('Downloaded file is empty (0 bytes)');
      }

      // If file is suspiciously small (less than 1 MB for a 16 MB file), it's probably an error
      if (actualSize < 1024 * 1024 && expectedSize > 10 * 1024 * 1024) {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
        throw new Error(`Downloaded file is too small (${(actualSize / 1024).toFixed(2)} KB). Expected ${(expectedSize / 1024 / 1024).toFixed(2)} MB. This might be an error response.`);
      }

      // Warn if size is significantly different (more than 10% difference)
      if (sizeDifferencePercent > 10) {
        logger.warn(`⚠️ File size mismatch: expected ${(expectedSize / 1024 / 1024).toFixed(2)} MB, got ${(actualSize / 1024 / 1024).toFixed(2)} MB`);
      }

      logger.info(`✅ ${language} Bible downloaded successfully (${(actualSize / 1024 / 1024).toFixed(2)} MB)`);
      
      // Save metadata locally
      await this.saveMetadata(language, metadata);
      
      return true;
    } catch (error) {
      logger.error(`❌ Failed to download ${language} Bible:`, error);
      // Clean up partial download
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
        // Return only segments for Bible reading; questions are accessed separately via QuestionsLoader
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
   * Delete a downloaded Bible to free up space
   */
  async deleteBible(language: SupportedBibleLanguage): Promise<boolean> {
    if (language === 'en') {
      logger.warn('⚠️ Cannot delete bundled English Bible');
      return false;
    }

    try {
      const filePath = `${this.bibleDirectory}${language}.json`;
      const metadataPath = `${this.bibleDirectory}${language}-metadata.json`;
      
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
        logger.info(`🗑️ Deleted ${language} Bible`);
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
   * Get the size of a downloaded Bible
   */
  async getBibleSize(language: SupportedBibleLanguage): Promise<number> {
    if (language === 'en') return 0; // Bundled

    try {
      const filePath = `${this.bibleDirectory}${language}.json`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.exists && fileInfo.size ? fileInfo.size : 0;
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

