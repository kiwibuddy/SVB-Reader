# French Questions Setup - Quick Summary

## ✅ What's Been Done

I've completed the full French localization including:

1. **✅ Translated all questions to French**
   - School Questions: 365 segments × 4 questions = 1,460 questions
   - Family Questions: 365 segments × 4 questions = 1,460 questions  
   - Small Group Questions: 365 segments × 4 questions = 1,460 questions
   - **Total: 4,380 French questions**

2. **✅ Merged questions into French Bible**
   - Created `FRA-Bible-with-questions.json` (49.66 MB)
   - Structure includes both Bible `segments` and `questions`

3. **✅ Created supporting services**
   - `QuestionsLoader.ts` - Loads questions from downloaded Bible
   - Updated `BibleStorageManager.ts` - Handles new structure

4. **✅ Prepared Firebase upload files**
   - `FRA-Bible-with-questions.json` (ready to upload)
   - `firebase-metadata.json` (needs URL update after upload)

---

## 🚀 What You Need to Do (5 Steps)

### Step 1: Upload to Firebase Storage

1. Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → Storage
2. Navigate to (or create) folder: `Bible/fr/`
3. Upload `FRA-Bible-with-questions.json`
4. **Copy the download URL** (right-click file → Get download URL)

### Step 2: Update Metadata

1. Open `firebase-metadata.json`
2. Replace `REPLACE_WITH_FIREBASE_DOWNLOAD_URL` with the URL you copied
3. Rename file to `metadata.json`
4. Upload `metadata.json` to `Bible/fr/` in Firebase
5. **Copy the metadata.json download URL**

### Step 3: Update App Code

Open `services/BibleStorageManager.ts` and update line 36:

```typescript
private static readonly METADATA_URLS: Record<SupportedBibleLanguage, string> = {
  en: '', // English is bundled
  fr: 'PASTE_YOUR_METADATA_URL_HERE',  // ← Update this line
  es: '', // Future
  pt: '', // Future
};
```

### Step 4: Build & Test

```bash
# Clean build
npx expo start --clear

# Test:
# 1. Switch language to French in Settings
# 2. Download should trigger automatically
# 3. Open any segment
# 4. Scroll to bottom to see Questions section
# 5. Try all three audiences (School, Family, Small Group)
```

### Step 5: Verify Everything Works

- [ ] French Bible downloads successfully
- [ ] Segments display in French
- [ ] Questions appear at bottom of segments
- [ ] All three audience types show questions
- [ ] Questions are in French
- [ ] Switching back to English works
- [ ] No console errors

---

## 📁 File Structure in Firebase

After upload, your Firebase Storage should look like:

```
Bible/
  └── fr/
      ├── FRA-Bible-with-questions.json  (49.66 MB) - Main file
      └── metadata.json                   (492 bytes) - Download info
```

---

## 🔍 Quick Token Explanation

### What is a Firebase Token?

A Firebase Storage token is like a secure password attached to your file's download URL. It looks like this:

```
https://firebasestorage.googleapis.com/v0/b/YOUR-PROJECT.firebasestorage.app/o/Bible%2Ffr%2FFRA-Bible-with-questions.json?alt=media&token=abc123-def456-ghi789
                                                                                                                                          ↑
                                                                                                                           This part is the token
```

### How to Get It:

**Option 1 (Easiest):**
- Right-click on your uploaded file in Firebase Console
- Click "Get download URL"
- Copy the entire URL (includes token automatically)

**Option 2 (Manual):**
- Click on the file in Firebase Console
- Go to "Tokens" tab
- Copy the token
- Manually construct the URL

**Important:** Use the same process for BOTH files:
- `FRA-Bible-with-questions.json` → Put URL in `firebase-metadata.json`
- `metadata.json` → Put URL in `BibleStorageManager.ts`

---

## 🎯 How Questions Will Work

### In English:
- Questions load from **SQLite database** (already built-in)

### In French:
1. User selects French language
2. App downloads `FRA-Bible-with-questions.json` (49.66 MB)
3. Bible content loads from `segments` section
4. Questions load from `questions` section
5. All questions appear in French!

### Data Structure:
```json
{
  "segments": {
    "S001": { /* Bible text */ },
    "S002": { /* Bible text */ }
    // ... 365 segments
  },
  "questions": {
    "S001": {
      "school": {
        "set1": ["Q1 in French", "Q2...", "Q3...", "Q4..."],
        "set2": []
      },
      "family": {
        "set1": ["Q1 in French", "Q2...", "Q3...", "Q4..."],
        "set2": []
      },
      "smallgroup": {
        "set1": ["Q1 in French", "Q2...", "Q3...", "Q4..."],
        "set2": []
      }
    }
    // ... 365 segments
  }
}
```

---

## 🐛 Troubleshooting

### Problem: "Download URL is still placeholder"
**Solution:** You haven't uploaded to Firebase yet. Do Step 1 first.

### Problem: "French metadata URL not found"
**Solution:** Update `BibleStorageManager.ts` (Step 3)

### Problem: Questions don't appear in French
**Check:**
1. Is French Bible downloaded? (Check Settings)
2. Are you viewing a valid segment (S001-S365)?
3. Check console for errors
4. Try deleting and re-downloading French Bible

### Problem: Download fails with 403 error
**Solution:** 
- Check Firebase Storage Rules allow public download
- Verify token is included in URL
- Make sure file exists at the exact path

---

## 📊 What Gets Downloaded

When user selects French:

| File | Size | Contains | Download Time* |
|------|------|----------|---------------|
| FRA-Bible-with-questions.json | 49.66 MB | • 365 Bible segments<br>• 4,380 questions<br>• All French translations | ~15-30 seconds |

*On typical WiFi connection

---

## ✨ Next Steps After Setup

Once everything works:

1. **Test on physical device** (not just simulator)
2. **Monitor Firebase Storage usage** (check quotas)
3. **Gather user feedback** on French translations
4. **Plan Question Set 2** (currently empty, can add alternate questions later)
5. **Consider other languages** (Portuguese, Spanish) using same process

---

## 📚 Additional Resources

- **Detailed Guide:** See `FIREBASE_UPLOAD_GUIDE.md`
- **Verification Script:** Run `./scripts/verify-french-setup.sh`
- **Question Files:** 
  - `assets/data/SchoolQuestions-FR.json`
  - `assets/data/FamilyQuestions-FR.json`
  - `assets/data/SmallGroupQuestions-FR.json`

---

## 🎉 You're Almost There!

The hard part (translation & setup) is done! Now just:
1. Upload 2 files to Firebase
2. Update 2 URLs in your code
3. Test!

Total time: ~15 minutes

---

Need help? Check the detailed guide or verification script output for specific issues.

