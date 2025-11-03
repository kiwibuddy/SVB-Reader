# Testing French Questions - Complete Guide

## ✅ Setup Complete!

Your app is now configured to download and use French Bible with questions. Everything is ready to test!

---

## 🚀 How to Test (Step-by-Step)

### Step 1: Start Fresh

```bash
# Clear any cached data and start clean
npx expo start --clear
```

### Step 2: Test the Download Flow

1. **Open your app** (on simulator or device)
2. **Go to Settings** (⚙️ icon)
3. **Tap Language**
4. **Select "Français"**
5. **You should see a download prompt:**
   - Title: "Télécharger la Bible française"
   - Message: About downloading 49.66 MB
   - Two buttons: "Annuler" and "Télécharger"
6. **Tap "Télécharger"**
7. **Watch the download progress:**
   - Should show MB downloaded / Total MB
   - Should show percentage (0-100%)
   - Takes about 15-30 seconds on WiFi

### Step 3: Verify French Bible Works

1. **After download completes**, go to **Home screen**
2. **Open any segment** (e.g., "La création" - S001)
3. **Verify:**
   - ✅ Title is in French
   - ✅ Bible text is in French
   - ✅ Source names are in French (Le narrateur, Dieu, etc.)

### Step 4: Test Questions Display

1. **While viewing a segment**, scroll to the bottom
2. **You should see "Questions" section** with 3 tabs:
   - **Questions pour l'école** (School)
   - **Questions pour la famille** (Family)
   - **Questions pour petit groupe** (Small Group)
3. **Tap each tab** and verify:
   - ✅ 4 questions appear for each audience
   - ✅ All questions are in French
   - ✅ Questions are properly formatted
   - ✅ No "Loading..." or error messages

### Step 5: Test Different Segments

Try these segments to verify questions work across the Bible:

| Segment | Title | Questions Available? |
|---------|-------|---------------------|
| S001 | La création | ✅ Should have all 3 audiences |
| S050 | History segment | ✅ Should have all 3 audiences |
| S100 | Prophets segment | ✅ Should have all 3 audiences |
| S200 | Gospels segment | ✅ Should have all 3 audiences |
| S365 | Final segment | ✅ Should have all 3 audiences |

### Step 6: Test Language Switching

1. **While viewing French segment with questions**
2. **Go back to Settings → Language**
3. **Switch to "English"**
4. **Return to the same segment**
5. **Verify:**
   - ✅ Bible text switches to English
   - ✅ Questions still appear (from SQLite)
   - ✅ Questions are in English
   - ✅ All 3 audience types work
6. **Switch back to "Français"**
7. **Verify:**
   - ✅ Bible text switches to French
   - ✅ Questions switch to French
   - ✅ No errors or loading issues

---

## 🔍 Console Logs to Watch For

### During Download:
```
📥 Starting download of fr Bible (49.66 MB)
📥 Downloaded: X.XX MB / 49.66 MB (XX%)
✅ fr Bible downloaded successfully (49.66 MB)
✅ Saved metadata for fr Bible
```

### When Loading Bible:
```
📖 Loading fr Bible from storage...
✅ fr Bible has integrated questions structure
   • Segments: 427
   • Questions: 427
✅ Using cached fr Bible
```

### When Loading Questions:
```
📖 Loading questions from fr Bible file...
✅ Found questions for 427 segments in fr Bible
```

---

## ✅ Success Checklist

Test each item and check it off:

### Download Flow:
- [ ] Download prompt appears in French
- [ ] Progress bar shows download progress
- [ ] Download completes without errors
- [ ] Success message appears
- [ ] No console errors

### Bible Display:
- [ ] French segments load correctly
- [ ] Titles are in French
- [ ] Content is in French
- [ ] Source names are in French
- [ ] No missing or corrupted text

### Questions Display:
- [ ] Questions section appears at bottom
- [ ] Three audience tabs show (École, Famille, Petit Groupe)
- [ ] Each audience shows 4 questions
- [ ] All questions are in French
- [ ] Questions are readable and properly formatted
- [ ] No "Loading questions..." stuck state
- [ ] No "No questions available" errors

### Language Switching:
- [ ] Can switch from French to English
- [ ] Can switch from English to French
- [ ] Questions update when switching
- [ ] No crashes during switch
- [ ] No data loss or corruption

### Performance:
- [ ] Download takes <60 seconds on WiFi
- [ ] Segments load quickly after download
- [ ] Questions load instantly (cached)
- [ ] Smooth scrolling
- [ ] No lag or freezing

---

## 🐛 Troubleshooting

### Problem: Download Doesn't Start

**Check:**
1. Device has internet connection
2. Firebase Storage URLs are correct in `BibleStorageManager.ts`
3. Firebase Storage Rules allow public download

**Console Error to Look For:**
```
❌ Failed to fetch metadata for fr
❌ Failed to download fr Bible
```

**Fix:**
- Verify metadata URL in `BibleStorageManager.ts` line 36
- Check Firebase Console that files are uploaded
- Verify tokens are correct

### Problem: "Segment not found" Error

**Check:**
1. French Bible file has `segments` and `questions` structure
2. BibleStorageManager returns `bibleData.segments` not full object

**Console Error to Look For:**
```
❌ Invalid Bible structure
❌ Segment SXXX not found in fr Bible
```

**Fix:**
- Re-download French Bible (delete and download again)
- Verify file structure in Firebase

### Problem: Questions Don't Appear

**Check:**
1. French Bible downloaded successfully
2. `QuestionsLoader.ts` exists and is imported
3. Questions component is using QuestionsLoader

**Console Error to Look For:**
```
⚠️ No questions section found in fr Bible
❌ Failed to load questions for SXXX in fr
```

**Fix:**
- Verify `FRA-Bible-with-questions.json` has `questions` section
- Check Questions component integration
- Clear app cache and re-download

### Problem: Questions in Wrong Language

**Check:**
1. Questions component uses `language` from `useSyncAppSettings`
2. QuestionsLoader checks language correctly

**Fix:**
- Verify Questions component imports `useSyncAppSettings`
- Check that `language` state is passed to `questionsLoader.getQuestions()`

### Problem: Download Progress Stuck

**Check:**
1. Network connection is stable
2. File size matches expected (52,073,208 bytes)
3. No Firebase Storage quota exceeded

**Console Error to Look For:**
```
❌ File size mismatch
⚠️ Download stalled
```

**Fix:**
- Retry download
- Check Firebase Storage quota
- Verify file uploaded completely

---

## 📊 Expected File Sizes

| File | Size | Location |
|------|------|----------|
| FRA-Bible-with-questions.json | 49.66 MB | Firebase Storage |
| metadata.json | ~500 bytes | Firebase Storage |
| Downloaded Bible | 49.66 MB | Device storage |
| Cached in memory | ~50 MB | RAM while running |

---

## 🎯 Sample Questions to Verify

### School Questions (S001):
1. "Quels motifs ou mots répétés as-tu remarqués en lisant ?"
2. "Que suggère ce passage sur le caractère de Dieu ?"
3. "Comment cela pourrait-il changer ta façon de voir les gens à l'école ?"
4. "De quelle manière peux-tu refléter la sollicitude de Dieu cette semaine ?"

### Family Questions (S001):
1. "Quels mots avons-nous entendus encore et encore ?"
2. "Qu'est-ce que cela montre sur Dieu ?"
3. "Comment devrions-nous traiter les gens que Dieu a créés ?"
4. "Quelle action bienveillante ferons-nous cette semaine ?"

### Small Group Questions (S001):
1. "Quels motifs ou mots répétés avez-vous remarqués dans le passage ?"
2. "Que suggère le texte sur le caractère et les desseins de Dieu ?"
3. "Comment cette vision de la création pourrait-elle façonner la façon dont nous traitons les gens et notre travail cette semaine ?"
4. "Quelle action concrète entreprendrez-vous pour honorer le dessein de Dieu (au travail, à la maison ou en ville) cette semaine ?"

---

## 📱 Testing on Physical Device

**Important:** Test on a real device, not just simulator!

1. **iOS Device:**
   ```bash
   npx expo run:ios --device
   ```

2. **Android Device:**
   ```bash
   npx expo run:android --device
   ```

3. **Test with slower connection:**
   - Use cellular data instead of WiFi
   - Verify download progress shows correctly
   - Verify download completes successfully

---

## 🎉 Success Criteria

Your implementation is successful if:

✅ **Download works smoothly** (no errors, reasonable time)  
✅ **Bible displays in French** (all segments readable)  
✅ **Questions appear in French** (all 3 audiences, all segments)  
✅ **Language switching works** (no crashes, smooth transition)  
✅ **Performance is good** (fast loading, no lag)  
✅ **No console errors** (clean logs)

---

## 📝 What to Report Back

After testing, please share:

1. **✅ What worked well**
2. **❌ Any errors or issues**
3. **📊 Download time** (how long it took)
4. **📱 Device tested on** (iPhone/Android model)
5. **🔍 Console logs** (if any errors)

---

## 🚀 Next Steps After Successful Testing

Once everything works:

1. **Test with real users** (French speakers preferred)
2. **Monitor Firebase Storage usage** (watch for quota limits)
3. **Gather feedback** on question quality
4. **Consider Question Set 2** (alternate questions for variety)
5. **Plan other languages** (Portuguese, Spanish) using same process

---

## 📞 Need Help?

If you encounter issues:

1. Check console logs for specific errors
2. Run verification script: `./scripts/verify-french-setup.sh`
3. Review guides: `FIREBASE_UPLOAD_GUIDE.md` and `FRENCH_QUESTIONS_SETUP_SUMMARY.md`
4. Share console logs and screenshots for debugging

---

Happy Testing! 🎉🇫🇷

