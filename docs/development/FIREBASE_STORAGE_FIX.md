# 🔧 Firebase Storage 403 Permission Denied - FIX GUIDE

## ❌ Current Error
```
❌ Bible file contains error: {"code": 403, "message": "Permission denied."}
```

## 🔍 Root Cause
Firebase Storage is blocking access to the Bible files. This is a **permissions/security rules** issue.

## ✅ SOLUTION: Fix Firebase Storage Security Rules

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **sourceview-together**
3. Click **Build → Storage**
4. Click the **Rules** tab at the top

### Step 2: Update Security Rules

**Current issue:** The rules might not match the actual file path, or the path case is wrong.

**Replace your rules with this:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read access to Bible folder (uppercase B)
    match /Bible/{language}/{fileName} {
      allow read: if true;  // ✅ Anyone can download
      allow write: if false; // ✅ Only you can upload via console
    }
    
    // Also allow lowercase path (for compatibility)
    match /bibles/{language}/{fileName} {
      allow read: if true;
      allow write: if false;
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 3: Publish Rules
1. Click **Publish** button
2. Wait for confirmation message

### Step 4: Verify File Paths in Firebase Storage

1. In Firebase Console, go to **Storage → Files** tab
2. Check the exact path structure:
   ```
   Bible/
     └── fr/
         ├── FRA-Bible.json
         └── metadata.json
   ```

3. **Important:** The path should be:
   - `Bible/fr/FRA-Bible.json` (uppercase `Bible`)
   - NOT `bibles/fr/FRA-Bible.json` (lowercase)

### Step 5: Regenerate Download URLs (if needed)

If the download token has expired:

1. Click on `FRA-Bible.json` in Firebase Storage
2. In the right panel, look for **"File location"** or **"Download URL"**
3. Copy the full URL (it will have a new token)
4. Update the metadata.json file with the new URL

## 🔄 Alternative: Check Token Expiration

Firebase Storage download tokens can expire. If your token expired:

1. In Firebase Storage, click on `FRA-Bible.json`
2. Copy the new download URL (with new token)
3. Update `metadata.json` with the new URL
4. Re-upload `metadata.json` to Firebase Storage

## 📝 Verify Security Rules Are Working

After updating rules, test by:

1. Opening the download URL directly in a browser:
   ```
   https://firebasestorage.googleapis.com/v0/b/sourceview-together.firebasestorage.app/o/Bible%2Ffr%2FFRA-Bible.json?alt=media&token=YOUR_TOKEN
   ```

2. If you see the JSON content (even partial), rules are working ✅
3. If you see `{"error": {"code": 403, "message": "Permission denied"}}`, rules are still wrong ❌

## 🐛 Debugging Checklist

- [ ] Security rules published (not just saved)
- [ ] Path matches exactly: `Bible/{language}/{fileName}` (uppercase B)
- [ ] Rules allow `read: if true` for Bible folder
- [ ] Download token is not expired
- [ ] File exists at the correct path in Firebase Storage
- [ ] Browser test URL works (see above)

## 🚀 After Fixing

1. **Delete corrupted local file:**
   - The app will automatically delete it on next download attempt
   - Or manually delete: `FileSystem.documentDirectory/bibles/fr.json`

2. **Restart the app**

3. **Try downloading again:**
   - Go to Settings → Language → French
   - Download the French Bible

4. **Check logs:**
   - Should see: `✅ fr Bible downloaded successfully (16.45 MB)`
   - Should NOT see: `❌ Bible file contains error`

## 📞 Still Not Working?

If you still get 403 errors after fixing rules:

1. **Check Firebase project permissions:**
   - Make sure your Firebase project is active
   - Check if there are any project-level restrictions

2. **Try accessing via Firebase SDK:**
   - The app might need to use Firebase SDK instead of direct URLs
   - This requires additional setup

3. **Verify Blaze plan:**
   - Cloud Storage requires Blaze (pay-as-you-go) plan
   - Even though it's free tier, you need to upgrade to Blaze
   - Check: Firebase Console → Usage and billing

---

## ✅ Expected Result

After fixing, you should see in logs:
```
✅ fr Bible downloaded successfully (16.45 MB)
✅ fr Bible loaded successfully. Structure: {"keysCount": 431, ...}
```

And French Bible text should display correctly in stories!

