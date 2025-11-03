#!/bin/bash

# Find and Export Questions from SQLite Database
# This script helps locate the database and export questions

echo "🔍 Searching for sourceview.db database..."
echo ""

# Search in iOS Simulator
DB_PATH=$(find ~/Library/Developer/CoreSimulator/Devices -name "sourceview.db" 2>/dev/null | head -1)

if [ -z "$DB_PATH" ]; then
  echo "❌ Database not found in iOS Simulator"
  echo ""
  echo "📱 Please run your app first to create the database:"
  echo "   cd /Users/nathanielb/Documents/GitHub/sourceview-together"
  echo "   npx expo run:ios"
  echo ""
  echo "Or if using Expo Go:"
  echo "   npx expo start"
  echo "   Open in Expo Go app"
  echo ""
  echo "After the app loads, come back and run this script again!"
  exit 1
fi

echo "✅ Found database at:"
echo "   $DB_PATH"
echo ""

# Check if database has questions
QUESTION_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM questions;" 2>/dev/null)

if [ $? -ne 0 ]; then
  echo "❌ Error: Could not read database"
  exit 1
fi

echo "📊 Database contains $QUESTION_COUNT question rows"
echo ""

if [ "$QUESTION_COUNT" -eq 0 ]; then
  echo "⚠️  Database exists but has no questions!"
  echo "   Make sure the app has finished initializing."
  echo "   Try opening a story in the app, then run this script again."
  exit 1
fi

echo "🚀 Exporting questions..."
echo ""

# Run the export script
node scripts/export-questions-simple.js "$DB_PATH"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ SUCCESS! Questions exported!"
  echo ""
  echo "📁 Files are in: ./exported-questions/"
  echo ""
  echo "🇫🇷 Next steps:"
  echo "   1. Translate each file to French"
  echo "   2. Save as: SchoolQuestions-FR.json, etc."
  echo "   3. Run the merge script (I'll create this next)"
else
  echo ""
  echo "❌ Export failed. Check errors above."
  exit 1
fi

