# Firebase Upload Guide for French Bible with Questions

This guide will walk you through uploading the French Bible with questions to Firebase Storage and configuring your app to download and use it.

## 📋 Overview

You need to:
1. Upload `FRA-Bible-with-questions.json` to Firebase Storage
2. Upload `firebase-metadata.json` to Firebase Storage
3. Get the Firebase download tokens
4. Update your app's `BibleStorageManager.ts` with the new token
5. Test the download and question display in your app

---

## 🔥 Step 1: Upload Files to Firebase Storage

### 1.1 Open Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **sourceview-together**
3. Click on **Storage** in the left sidebar
4. You should see your existing Bible files

### 1.2 Create Folder Structure

Navigate to or create this folder structure:
```
Bible/
  └── fr/
      ├── FRA-Bible-with-questions.json  (52.1 MB)
      └── metadata.json                   (492 bytes)
```

### 1.3 Upload FRA-Bible-with-questions.json

1. Click on the `Bible/fr/` folder (create it if it doesn't exist)
2. Click **Upload file**
3. Select: `FRA-Bible-with-questions.json` from your project root
4. Wait for upload to complete (may take 1-2 minutes due to file size)
5. Once uploaded, click on the file name to view its details

### 1.4 Get the Download URL with Token

After uploading, you need to get the download URL:

**Method 1: From Firebase Console**
1. Click on the uploaded `FRA-Bible-with-questions.json`
2. Copy the **File location** (it will look like: `gs://sourceview-together.firebasestorage.app/Bible/fr/FRA-Bible-with-questions.json`)
3. Click on the **Tokens** tab
4. If no token exists, click **Create Token**
5. Copy the generated token

**Method 2: Get Full Download URL**
1. Right-click on the file in Firebase Storage
2. Click **Get download URL**
3. Copy the entire URL (it should look like):
   ```
   https://firebasestorage.googleapis.com/v0/b/sourceview-together.firebasestorage.app/o/Bible%2Ffr%2FFRA-Bible-with-questions.json?alt=media&token=YOUR_TOKEN_HERE
   ```

### 1.5 Upload metadata.json

1. Rename `firebase-metadata.json` to `metadata.json`
2. **IMPORTANT**: Before uploading, edit the file and replace `REPLACE_WITH_FIREBASE_DOWNLOAD_URL` with the download URL you got in Step 1.4
3. Upload `metadata.json` to `Bible/fr/`
4. Get the download URL for `metadata.json` using the same method as above

---

## 🔧 Step 2: Update BibleStorageManager.ts

Open `services/BibleStorageManager.ts` and update the `METADATA_URLS`:

```typescript
private static readonly METADATA_URLS: Record<SupportedBibleLanguage, string> = {
  en: '', // English is bundled
  fr: 'YOUR_METADATA_JSON_DOWNLOAD_URL_HERE',  // <-- Replace this
  es: '', // Future
  pt: '', // Future
};
```

Replace `YOUR_METADATA_JSON_DOWNLOAD_URL_HERE` with the **full download URL for metadata.json** (including the token).

**Example:**
```typescript
fr: 'https://firebasestorage.googleapis.com/v0/b/sourceview-together.firebasestorage.app/o/Bible%2Ffr%2Fmetadata.json?alt=media&token=3ba78988-1406-410d-a11d-643e90934878',
```

---

## 🔄 Step 3: Update BibleLoader to Handle Questions

The `BibleLoader` service needs to know about the new structure with questions.

### 3.1 Check Current Structure

Your French Bible now has this structure:
```json
{
  "questions": {
    "S001": {
      "school": { "set1": [...], "set2": [] },
      "family": { "set1": [...], "set2": [] },
      "smallgroup": { "set1": [...], "set2": [] }
    }
    // ... S002-S365
  },
  "segments": {
    "S001": { /* Bible content */ },
    // ... S002-S365
  }
}
```

### 3.2 Update BibleLoader.ts

Open `services/BibleLoader.ts` and update the `loadBible` method to handle both formats:

```typescript
async loadBible(language: SupportedBibleLanguage): Promise<BibleData> {
  // ... existing code ...
  
  const content = await FileSystem.readAsStringAsync(filePath);
  const parsedData = JSON.parse(content);
  
  // Handle new structure with questions and segments
  if (parsedData.segments) {
    logger.info(`✅ Loaded ${language} Bible with ${Object.keys(parsedData.segments).length} segments and questions`);
    return parsedData.segments; // Return only segments for Bible reading
  }
  
  // Handle old flat structure
  logger.info(`✅ Loaded ${language} Bible with ${Object.keys(parsedData).length} segments`);
  return parsedData;
}
```

---

## 📱 Step 4: Update Questions Component

The Questions component needs to load questions from the downloaded Bible file.

### 4.1 Create a Questions Loader Service

Create `services/QuestionsLoader.ts`:

```typescript
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
      // Check cache first
      const cacheKey = `${language}`;
      if (this.questionsCache.has(cacheKey)) {
        const questions = this.questionsCache.get(cacheKey);
        return questions?.[segmentId] || null;
      }

      // Load questions from file
      const filePath = `${this.bibleDirectory}${language}.json`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (!fileInfo.exists) {
        logger.warn(`⚠️ ${language} Bible file not found`);
        return null;
      }

      const content = await FileSystem.readAsStringAsync(filePath);
      const parsedData = JSON.parse(content);

      // Check if this Bible has questions
      if (parsedData.questions) {
        this.questionsCache.set(cacheKey, parsedData.questions);
        return parsedData.questions[segmentId] || null;
      }

      logger.warn(`⚠️ No questions found in ${language} Bible`);
      return null;
    } catch (error) {
      logger.error(`❌ Failed to load questions for ${segmentId} in ${language}:`, error);
      return null;
    }
  }

  /**
   * Clear questions cache
   */
  clearCache(): void {
    this.questionsCache.clear();
  }
}

export const questionsLoader = QuestionsLoader.getInstance();
```

### 4.2 Update Questions Component

Update `components/Questions.tsx` to use the new QuestionsLoader:

```typescript
import { questionsLoader } from '@/services/QuestionsLoader';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';

// Inside your Questions component:
const { language } = useSyncAppSettings();

useEffect(() => {
  const loadQuestions = async () => {
    try {
      setLoading(true);
      
      // Load questions from downloaded Bible
      const questions = await questionsLoader.getQuestions(segmentId, language);
      
      if (questions) {
        // Get questions for selected audience
        const audienceQuestions = questions[selectedAudience];
        setQuestions(audienceQuestions.set1); // Use set1 for now
      } else {
        setQuestions([]);
      }
    } catch (error) {
      logger.error('Failed to load questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  loadQuestions();
}, [segmentId, selectedAudience, language]);
```

---

## 🧪 Step 5: Test Everything

### 5.1 Test Download Flow

1. **Delete existing French Bible** (if any):
   ```typescript
   // In your app, you can test this by calling:
   await bibleStorageManager.deleteBible('fr');
   ```

2. **Trigger download**:
   - Open Settings → Language → Select French
   - The app should prompt to download
   - Accept the download
   - Monitor console logs for download progress

3. **Verify file**:
   - Check that the file is downloaded (49.66 MB)
   - Verify no errors in console

### 5.2 Test Question Display

1. **Navigate to a segment** (e.g., S001)
2. **Scroll to the Questions section** at the bottom
3. **Switch between audiences**:
   - School Questions
   - Family Questions
   - Small Group Questions
4. **Verify**:
   - Questions appear in French
   - All 4 questions show for each audience
   - Questions are properly formatted

### 5.3 Test Language Switching

1. **While viewing a segment with questions**
2. **Switch to English**:
   - Questions should switch to English (from SQLite)
3. **Switch back to French**:
   - Questions should switch to French (from downloaded Bible)
4. **Verify**:
   - No crashes
   - Smooth transitions
   - Questions load correctly in both languages

---

## 🐛 Troubleshooting

### Issue: Download fails with HTTP 403/404

**Solution:**
- Verify the download URL includes the token
- Check Firebase Storage Rules allow downloads
- Ensure the file exists at the correct path

### Issue: Questions don't appear in French

**Solution:**
- Verify the French Bible downloaded successfully
- Check the file structure has both `questions` and `segments`
- Look for errors in console logs
- Clear cache and re-download

### Issue: App crashes when opening a segment

**Solution:**
- Verify BibleLoader correctly handles the new structure
- Check that it returns only `segments` not the whole object
- Ensure Questions component handles missing questions gracefully

### Issue: File size mismatch warning

**Solution:**
- Update the `size` in `firebase-metadata.json` to match exactly: `52073208` bytes
- Re-upload the metadata.json file

---

## ✅ Verification Checklist

- [ ] FRA-Bible-with-questions.json uploaded to Firebase Storage
- [ ] metadata.json uploaded with correct download URL
- [ ] BibleStorageManager.ts updated with metadata URL
- [ ] BibleLoader.ts handles new structure
- [ ] QuestionsLoader.ts created and working
- [ ] Questions component loads French questions
- [ ] Download flow works end-to-end
- [ ] Language switching works smoothly
- [ ] All three question audiences display correctly
- [ ] No console errors or warnings

---

## 📊 File Information

| File | Size | Location |
|------|------|----------|
| FRA-Bible-with-questions.json | 49.66 MB | Firebase: `Bible/fr/` |
| metadata.json | ~500 bytes | Firebase: `Bible/fr/` |
| Total Download | 49.66 MB | User's device |

---

## 🎯 Next Steps After Upload

1. **Test on physical device** (not just simulator)
2. **Monitor download metrics** in Firebase Console
3. **Gather user feedback** on French questions
4. **Plan for Set 2 questions** (currently empty arrays)
5. **Consider adding Portuguese and Spanish** following same process

---

## 📝 Notes

- The current implementation only uses `set1` questions. `set2` arrays are placeholders for future alternate question sets.
- Questions are cached in memory for performance.
- The English Bible remains bundled (no download needed).
- Users only download the Bible for their selected language.

---

Need help? Check the console logs or review the Firebase Storage access logs to debug any issues.

