# 📝 Questions Translation Guide - Complete Workflow

## 🔍 **The Situation**

- ❌ Original `SchoolQuestions.json`, `FamilyQuestions.json`, etc. were **DELETED**
- ✅ Questions now live in **SQLite database** (created at runtime)
- ✅ Reference files (`SchoolQuestionRefs.json`) exist but contain **only IDs**, not text
- 🎯 **Goal**: Export questions from SQLite → Translate → Add to French Bible

---

## 📋 **Step 1: Find Your SQLite Database** (5 minutes)

### Option A: iOS Simulator (Easiest)
```bash
# Run your app in simulator
npx expo run:ios

# Look in console for a log like:
# "Database path: /Users/nathanielb/Library/Developer/CoreSimulator/Devices/.../sourceview.db"

# Or search for it:
find ~/Library/Developer/CoreSimulator -name "sourceview.db" 2>/dev/null
```

### Option B: Use App to Export
The export script I created earlier (`scripts/export-questions-from-db.ts`) can run **inside your app**.

Add this button temporarily to your About screen or Home screen:

```typescript
import { exportQuestionsForTranslation } from '@/scripts/export-questions-from-db';

<TouchableOpacity 
  onPress={async () => {
    try {
      await exportQuestionsForTranslation();
      Alert.alert('Success', 'Check console for file location');
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  }}
  style={{ padding: 20, backgroundColor: '#007AFF', margin: 20 }}
>
  <Text style={{ color: 'white' }}>Export Questions</Text>
</TouchableOpacity>
```

---

## 📋 **Step 2: Export Questions from Database** (2 minutes)

Once you have the database path:

```bash
# Install sqlite3 if needed
npm install sqlite3

# Run export script
node scripts/export-questions-simple.js /path/to/your/sourceview.db

# Output will be in: exported-questions/
```

You'll get 6 files:
- `SchoolQuestions.json` (~427 segments × 3-4 questions)
- `SchoolQuestionsSet2.json`
- `FamilyQuestions.json`
- `FamilyQuestionsSet2.json`
- `SmallGroupQuestions.json`
- `SmallGroupQuestionsSet2.json`

**Example format:**
```json
{
  "SchoolQuestions": {
    "S001": {
      "Q1": "What did God create on each day?",
      "Q2": "What does this passage teach us about God?",
      "Q3": "How does this apply to your life?",
      "Q4": ""
    },
    "S002": {
      "Q1": "What was the problem in the garden?",
      "Q2": "What did God do about it?",
      "Q3": "How does this relate to our lives today?",
      "Q4": ""
    }
  }
}
```

---

## 📋 **Step 3: Translate Questions** (15-20 hours total)

### Recommended Approach: AI-Assisted + Review

#### 3A. Use ChatGPT/Claude (Fast Initial Translation)

**Prompt Template:**
```
I need you to translate English Bible study questions into French. 
Context: These are questions for [school/family/small group] Bible reading.
Audience: [Children ages 10-14 / Families / Adults in Bible study]

Requirements:
- Natural, conversational French
- Theologically accurate
- Age-appropriate language
- Maintain question format

Here's the JSON to translate:
[paste 50-100 questions at a time]

Please maintain the exact JSON structure, only translate the question text.
```

#### 3B. Have Native Speaker Review (Quality Check)

Focus on:
- Natural phrasing
- Theological accuracy
- Age-appropriate vocabulary
- Cultural relevance

### Save as French files:
- `SchoolQuestions-FR.json`
- `SchoolQuestionsSet2-FR.json`
- `FamilyQuestions-FR.json`
- `FamilyQuestionsSet2-FR.json`
- `SmallGroupQuestions-FR.json`
- `SmallGroupQuestionsSet2-FR.json`

---

## 📋 **Step 4: Merge into French Bible** (10 minutes)

Once you have translated files, I'll create a script to:
1. Load your `FRA-Bible.json`
2. Add a `questions` section
3. Merge all 6 translated question files
4. Output: `FRA-Bible-Complete.json`

**New structure:**
```json
{
  "FRA-NLT-S001": {
    "segment": "S001",
    "blocks": [ ... Bible text ... ]
  },
  "FRA-NLT-S002": { ... },
  "questions": {
    "S001": {
      "school": {
        "set1": ["Question 1", "Question 2", "Question 3"],
        "set2": ["Question 1", "Question 2", "Question 3"]
      },
      "family": {
        "set1": [ ... ],
        "set2": [ ... ]
      },
      "smallgroup": {
        "set1": [ ... ],
        "set2": [ ... ]
      }
    },
    "S002": { ... }
  }
}
```

---

## 📋 **Step 5: Update App Code** (15 minutes)

I'll update `components/Questions.tsx` to:
1. Check if `Bible.questions` exists
2. If yes (French): Use questions from Bible JSON
3. If no (English): Fall back to SQLite

```typescript
// Pseudo-code
const getQuestions = async (segmentId, audience) => {
  const Bible = bibleLoader.getCurrentBible();
  
  // Check if Bible has questions section (French)
  if (Bible.questions && Bible.questions[segmentId]) {
    return Bible.questions[segmentId][audience].set1; // or set2
  }
  
  // Fall back to SQLite (English)
  return await questionFunctions.getQuestions(segmentId, audience, 1);
};
```

---

## 📋 **Step 6: Upload to Firebase** (5 minutes)

```bash
# Replace French Bible in Firebase Storage
# New file will be ~18-19 MB (16 MB Bible + 2-3 MB questions)
```

---

## ⏱️ **Time Estimate Breakdown**

| Task | Time | Priority |
|------|------|----------|
| Export from SQLite | 10 min | HIGH |
| Translate School Set 1 | 3 hours | HIGH |
| Translate School Set 2 | 3 hours | MEDIUM |
| Translate Family Set 1 | 3 hours | MEDIUM |
| Translate Family Set 2 | 3 hours | LOW |
| Translate Small Group Set 1 | 3 hours | MEDIUM |
| Translate Small Group Set 2 | 3 hours | LOW |
| Native speaker review | 2 hours | HIGH |
| Merge & test | 1 hour | HIGH |
| **TOTAL** | **~21 hours** | |

---

## 🚨 **Quick Launch Option** (If Pressed for Time)

If you need to launch in 1 week and don't have 20 hours:

### Plan B: Partial Translation
1. **Translate School Set 1 ONLY** (3 hours + review)
2. Show only School questions in French
3. Hide Family/Small Group tabs temporarily
4. Add in v1.1 update (2 weeks later)

### Plan C: Launch with English Questions
1. Launch French Bible with English questions
2. Add notice: "Questions françaises à venir bientôt"
3. Update in v1.1

---

## 📞 **Next Steps - Tell Me:**

1. ✅ Can you find your SQLite database?
2. ✅ Do you have a translator ready? (Human or AI-assisted?)
3. ✅ Which priority: Full launch or partial?
4. ✅ Should I create the merge script now or wait for translations?

Let me know and I'll proceed with the next steps! 🚀

