# 🇫🇷 French Questions Translation - 1 Week Plan

## 📅 **Timeline Overview**

**Goal:** Launch French Bible app with translated questions in 1 week

**Strategy:** Translate one audience at a time, prioritize by importance

---

## 📊 **Translation Workload Estimate**

Based on typical segment structure:
- **427 segments** × 2 sets × ~3 questions each = **~2,500 questions**
- **Per audience:** ~830 questions

**Time estimates:**
- School questions: ~8-10 hours (most used by families)
- Family questions: ~8-10 hours (most personal)
- Small Group questions: ~8-10 hours (most theological)

**Total:** ~24-30 hours of translation work

---

## 🎯 **Week Schedule (Aggressive)**

### **Day 1 (Monday): Setup & Export** ⏰ 2 hours
- [ ] Export English questions from app (use scripts/export-questions-from-db.ts)
- [ ] Review question files
- [ ] Set up translation workflow (Google Translate + manual review?)
- [ ] Test translation of 5-10 questions to check quality

### **Day 2-3 (Tue-Wed): School Questions** ⏰ 12 hours
- [ ] Translate school-questions-english.json → school-questions-french.json
- [ ] Quality check (have native speaker review sample)
- [ ] Test in app with a few segments

### **Day 4-5 (Thu-Fri): Family Questions** ⏰ 12 hours
- [ ] Translate family-questions-english.json → family-questions-french.json
- [ ] Quality check
- [ ] Test in app

### **Day 6 (Saturday): Small Group Questions** ⏰ 10 hours
- [ ] Translate smallgroup-questions-english.json → smallgroup-questions-french.json
- [ ] Quality check
- [ ] Test in app

### **Day 7 (Sunday): Integration & Testing** ⏰ 4 hours
- [ ] Merge all translated questions into FRA-Bible.json
- [ ] Upload to Firebase
- [ ] Full app testing
- [ ] Fix any issues
- [ ] LAUNCH! 🚀

---

## 🤖 **Translation Options**

### **Option A: AI-Assisted Translation** (FASTEST - ~8 hours)
1. Use ChatGPT/Claude to translate in batches
2. Have native French speaker review and refine
3. Focus on theological accuracy

**Pros:** Fast, consistent terminology
**Cons:** May need refinement for cultural context

### **Option B: Professional Service** ($$$, 2-3 days)
1. Use services like DeepL Pro or Rev.com
2. Specify: Biblical/theological content
3. May cost $500-1000 for this volume

**Pros:** High quality, fast turnaround
**Cons:** Expensive

### **Option C: Hybrid Approach** (RECOMMENDED - ~15 hours)
1. Use AI for initial translation (2 hours)
2. Native speaker reviews and refines (12 hours)
3. Focus on clarity and cultural appropriateness

**Pros:** Good quality, reasonable cost
**Cons:** Requires fluent French speaker

---

## 🛠️ **Technical Workflow**

### **Step 1: Export Questions** (Already created!)
```bash
# Run the app with export button (see scripts/add-questions-export-button.txt)
# OR use the TypeScript script (scripts/export-questions-from-db.ts)
```

You'll get 3 files:
- `school-questions-english.json`
- `family-questions-english.json`
- `smallgroup-questions-english.json`

### **Step 2: Translate Each File**

Format of each file:
```json
{
  "S001": {
    "set1": [
      "What did God create on each day?",
      "What does this passage teach us about God?",
      "How does this apply to your life?"
    ],
    "set2": [
      "What stands out to you most?",
      "What questions do you have?",
      "What will you do differently?"
    ]
  },
  "S002": { ... }
}
```

Translate to:
```json
{
  "S001": {
    "set1": [
      "Qu'est-ce que Dieu a créé chaque jour?",
      "Que nous enseigne ce passage sur Dieu?",
      "Comment cela s'applique-t-il à votre vie?"
    ],
    "set2": [
      "Qu'est-ce qui vous frappe le plus?",
      "Quelles questions avez-vous?",
      "Que ferez-vous différemment?"
    ]
  },
  "S002": { ... }
}
```

### **Step 3: Merge into FRA-Bible.json**

I'll create a script that:
1. Takes your French Bible
2. Takes translated question files
3. Merges them into the new structure
4. Outputs: `FRA-Bible-Complete.json`

### **Step 4: Update App Code**

I'll update the code to:
1. Check if Bible has questions section
2. If yes (French), use those questions
3. If no (English), fall back to SQLite
4. Works for both languages!

### **Step 5: Upload to Firebase**

Replace the French Bible file with the new complete version.

---

## 📝 **Translation Guidelines**

### **Key Principles:**
1. **Clarity over literalism** - Make it understandable
2. **Consistent terminology** - Use same words for God, Jesus, disciples, etc.
3. **Natural French** - Not word-for-word English
4. **Age-appropriate** (especially for School questions)
5. **Theologically sound** - Be careful with doctrine

### **Common Translations:**
- "What does this passage teach us about God?" 
  → "Que nous enseigne ce passage sur Dieu?"
  
- "How does this apply to your life?"
  → "Comment cela s'applique-t-il à votre vie?"
  
- "What stands out to you most?"
  → "Qu'est-ce qui vous frappe le plus?"

---

## 🚨 **Contingency Plan**

If you run out of time:

### **Plan B: Partial Launch**
- Launch with **School questions only** (most commonly used)
- Use English for Family/Small Group temporarily
- Update in v1.1 (2 weeks later)

### **Plan C: English with Apology**
- Launch with English questions
- Add note: "Questions françaises à venir bientôt"
- Update in v1.1

---

## ✅ **Quality Checklist**

Before uploading to Firebase:

- [ ] All 427 segments have questions
- [ ] Both set1 and set2 are filled
- [ ] No English text remains (search for common English words)
- [ ] Accents are correct (é, è, ê, à, etc.)
- [ ] Questions make sense in context
- [ ] File size is reasonable (~18-19 MB)
- [ ] Test in app with 10+ different segments
- [ ] All 3 audience types work

---

## 📞 **Next Steps**

1. **Read:** scripts/add-questions-export-button.txt
2. **Add:** Export button to your app
3. **Run:** Export questions
4. **Share:** The JSON files with your translator
5. **Return:** Translated files to me - I'll handle the technical integration!

---

## 💬 **Questions?**

- How many questions per segment? (Usually 3-4 per set)
- Do you have a French translator lined up?
- Do you want to use AI translation + review?
- Which audience should we prioritize if time runs short?

Let me know and I'll create the integration scripts next! 🚀

