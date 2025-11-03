#!/bin/bash

echo "🔍 Verifying French Bible Setup..."
echo ""

PROJECT_ROOT="/Users/nathanielb/Documents/GitHub/sourceview-together"
cd "$PROJECT_ROOT"

# Check if FRA-Bible-with-questions.json exists
echo "1️⃣ Checking FRA-Bible-with-questions.json..."
if [ -f "FRA-Bible-with-questions.json" ]; then
    FILE_SIZE=$(ls -lh FRA-Bible-with-questions.json | awk '{print $5}')
    SEGMENT_COUNT=$(cat FRA-Bible-with-questions.json | jq '.segments | keys | length' 2>/dev/null || echo "N/A")
    QUESTION_COUNT=$(cat FRA-Bible-with-questions.json | jq '.questions | keys | length' 2>/dev/null || echo "N/A")
    echo "   ✅ File exists ($FILE_SIZE)"
    echo "   • Segments: $SEGMENT_COUNT"
    echo "   • Questions: $QUESTION_COUNT"
else
    echo "   ❌ FRA-Bible-with-questions.json not found!"
    exit 1
fi
echo ""

# Check if firebase-metadata.json exists
echo "2️⃣ Checking firebase-metadata.json..."
if [ -f "firebase-metadata.json" ]; then
    echo "   ✅ Metadata file exists"
    
    # Check if URL is still placeholder
    if grep -q "REPLACE_WITH_FIREBASE_DOWNLOAD_URL" firebase-metadata.json; then
        echo "   ⚠️  Warning: Download URL is still placeholder"
        echo "      You need to upload to Firebase and update the URL"
    else
        echo "   ✅ Download URL has been configured"
    fi
else
    echo "   ❌ firebase-metadata.json not found!"
    exit 1
fi
echo ""

# Check French question files
echo "3️⃣ Checking French question files..."
for FILE in "assets/data/SchoolQuestions-FR.json" "assets/data/FamilyQuestions-FR.json" "assets/data/SmallGroupQuestions-FR.json"; do
    if [ -f "$FILE" ]; then
        COUNT=$(cat "$FILE" | jq 'keys[0] as $k | .[$k] | keys | length' 2>/dev/null || echo "N/A")
        echo "   ✅ $(basename $FILE): $COUNT segments"
    else
        echo "   ❌ $(basename $FILE) not found!"
    fi
done
echo ""

# Check if QuestionsLoader.ts exists
echo "4️⃣ Checking QuestionsLoader service..."
if [ -f "services/QuestionsLoader.ts" ]; then
    echo "   ✅ QuestionsLoader.ts exists"
else
    echo "   ❌ QuestionsLoader.ts not found!"
    echo "      Run: Create services/QuestionsLoader.ts from the guide"
fi
echo ""

# Check if BibleStorageManager has been updated
echo "5️⃣ Checking BibleStorageManager updates..."
if grep -q "Handle new structure with separate questions and segments" services/BibleStorageManager.ts; then
    echo "   ✅ BibleStorageManager handles new structure"
else
    echo "   ⚠️  BibleStorageManager may need updates"
    echo "      Check if it handles 'segments' and 'questions' structure"
fi
echo ""

# Check METADATA_URLS in BibleStorageManager
echo "6️⃣ Checking Firebase metadata URL configuration..."
FR_URL=$(grep "fr: 'https://" services/BibleStorageManager.ts | grep -o "https://[^']*" || echo "")
if [ -n "$FR_URL" ]; then
    echo "   ✅ French metadata URL configured:"
    echo "      $FR_URL"
else
    echo "   ⚠️  No French metadata URL found"
    echo "      You need to update METADATA_URLS in BibleStorageManager.ts"
fi
echo ""

# Summary
echo "📊 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Files ready for Firebase upload:"
echo "  1. FRA-Bible-with-questions.json (49.66 MB)"
echo "  2. firebase-metadata.json (rename to metadata.json before upload)"
echo ""
echo "Next steps:"
echo "  1. Upload FRA-Bible-with-questions.json to Firebase Storage"
echo "  2. Get the download URL with token"
echo "  3. Update firebase-metadata.json with the download URL"
echo "  4. Upload firebase-metadata.json as metadata.json to Firebase"
echo "  5. Update BibleStorageManager.ts with metadata URL"
echo "  6. Test in your app!"
echo ""
echo "📖 See FIREBASE_UPLOAD_GUIDE.md for detailed instructions"
echo ""

