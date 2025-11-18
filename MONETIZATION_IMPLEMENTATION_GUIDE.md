# SourceView Together - Monetization Implementation Guide

## Review of Your Refined Monetization Plan

### ✅ **Strengths of Your Approach**

1. **Maintains Core Mission**: All 365 stories remain free - perfect for schools
2. **Clear Value Progression**: Free → Plus → Premium tiers are intuitive
3. **Affordable Pricing**: $0.99-$1.99 price points are accessible
4. **Logical Feature Grouping**: Stories, Plans, Questions are well-organized

### 💡 **Feedback & Recommendations**

#### Pricing Adjustments
- **Reading Plans Plus ($0.99)**: Consider making this $1.99 or bundle with Questions Plus
- **Reading Plans Premium ($1.99)**: Good price point
- **Questions Plus ($0.99)**: Consider $1.99 to match value perception
- **Enhanced Stories ($1.99)**: Perfect price point

#### Structural Suggestions
1. **Bundle Option**: Offer "Complete Plus" bundle ($2.99) combining all Plus features
2. **Premium Bundle**: Offer "Complete Premium" ($4.99) combining all Premium features
3. **Annual Discount**: Offer 20% discount on annual subscriptions

---

## IMPLEMENTATION DETAILS

## 1. Enhanced Stories ($1.99)

### Feature Description
- **Historical Context Icons**: Clickable icons embedded in story text that show historical information
- **Cross-Reference Icons**: Clickable icons showing related Bible passages
- **Summary Text**: Historical context summary above/below story

### Technical Implementation

#### A. Data Structure

**New JSON Structure for Enhanced Content:**

```json
{
  "S001": {
    "historicalContext": [
      {
        "id": "hc-001",
        "position": {
          "blockIndex": 2,
          "wordIndex": 15,
          "type": "inline" // or "summary"
        },
        "icon": "🏛️",
        "title": "Ancient Near East",
        "content": "The creation account reflects ancient Near Eastern cosmology...",
        "imageUrl": "optional-image-url"
      }
    ],
    "crossReferences": [
      {
        "id": "cr-001",
        "position": {
          "blockIndex": 5,
          "wordIndex": 8
        },
        "icon": "🔗",
        "references": [
          {
            "segmentId": "S002",
            "title": "The Fall",
            "verse": "Genesis 3:1-7"
          }
        ]
      }
    ],
    "summary": {
      "above": "This story reflects ancient creation narratives...",
      "below": "The structure of creation follows a pattern..."
    }
  }
}
```

#### B. Component Architecture

**1. Enhanced Story Wrapper Component**
```typescript
// components/Bible/EnhancedStory.tsx
interface EnhancedStoryProps {
  segmentId: string;
  isPremium: boolean;
  children: React.ReactNode; // Original story content
}

const EnhancedStory: React.FC<EnhancedStoryProps> = ({ 
  segmentId, 
  isPremium, 
  children 
}) => {
  const [enhancedData, setEnhancedData] = useState<EnhancedData | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Load enhanced data if premium
  useEffect(() => {
    if (isPremium) {
      loadEnhancedData(segmentId);
    }
  }, [segmentId, isPremium]);

  // Render enhanced content
  return (
    <View>
      {/* Summary above */}
      {enhancedData?.summary?.above && (
        <HistoricalContextSummary 
          content={enhancedData.summary.above}
          isPremium={isPremium}
        />
      )}
      
      {/* Story with inline icons */}
      <EnhancedStoryContent 
        content={children}
        enhancedData={enhancedData}
        isPremium={isPremium}
        onIconPress={(iconData) => {
          if (!isPremium) {
            setShowPurchaseModal(true);
            return;
          }
          showContextModal(iconData);
        }}
      />
      
      {/* Summary below */}
      {enhancedData?.summary?.below && (
        <HistoricalContextSummary 
          content={enhancedData.summary.below}
          isPremium={isPremium}
        />
      )}
    </View>
  );
};
```

**2. Inline Icon Component**
```typescript
// components/Bible/ContextIcon.tsx
interface ContextIconProps {
  icon: string;
  data: HistoricalContext | CrossReference;
  onPress: () => void;
  position: { x: number; y: number };
}

const ContextIcon: React.FC<ContextIconProps> = ({ icon, data, onPress, position }) => {
  return (
    <TouchableOpacity
      style={[
        styles.iconContainer,
        { 
          position: 'absolute',
          left: position.x,
          top: position.y 
        }
      ]}
      onPress={onPress}
    >
      <Text style={styles.icon}>{icon}</Text>
    </TouchableOpacity>
  );
};
```

**3. Context Modal Component**
```typescript
// components/Bible/ContextModal.tsx
const ContextModal: React.FC<ContextModalProps> = ({ 
  visible, 
  data, 
  onClose 
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modal}>
          <Text style={styles.title}>{data.title}</Text>
          <ScrollView>
            <Text style={styles.content}>{data.content}</Text>
            {data.references && (
              <View>
                {data.references.map(ref => (
                  <TouchableOpacity 
                    key={ref.segmentId}
                    onPress={() => navigateToSegment(ref.segmentId)}
                  >
                    <Text>{ref.title} - {ref.verse}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
};
```

#### C. Integration Points

**Modify `components/Bible/Segment.tsx`:**
```typescript
// Around line 595-605
<Segment 
  segmentData={segmentData}
  context={planId ? 'plan' : challengeId ? 'challenge' : 'main'}
  planId={planId as string}
  challengeId={challengeId as string}
  targetVerse={verse ? parseInt(verse as string) : undefined}
  targetChapter={chapter ? parseInt(chapter as string) : undefined}
/>

// Change to:
<EnhancedStory 
  segmentId={segID}
  isPremium={checkPremiumFeature('enhancedStories')}
>
  <Segment 
    segmentData={segmentData}
    context={planId ? 'plan' : challengeId ? 'challenge' : 'main'}
    planId={planId as string}
    challengeId={challengeId as string}
    targetVerse={verse ? parseInt(verse as string) : undefined}
    targetChapter={chapter ? parseInt(chapter as string) : undefined}
  />
</EnhancedStory>
```

#### D. What's Needed

**Data Requirements:**
1. **Content Creation**: 
   - Historical context research for all 365 stories
   - Cross-reference mapping (can use existing Bible reference data)
   - Summary text creation
   - Estimated: 2-3 months for content team

2. **Data Storage**:
   - New JSON file: `assets/data/EnhancedStories.json` (~5-10MB)
   - Or SQLite table: `enhanced_stories` (better for queries)

**Technical Requirements:**
1. **Premium Check System**:
   ```typescript
   // api/premium-functions.ts
   export async function checkPremiumFeature(feature: string): Promise<boolean> {
     const purchases = await getPurchases();
     return purchases.includes(feature) || purchases.includes('premium_all');
   }
   ```

2. **In-App Purchase Integration**:
   - React Native IAP library
   - Product IDs: `enhanced_stories_plus`, `enhanced_stories_premium`
   - Purchase validation

3. **Word Position Tracking**:
   - Need to track word positions in blocks for icon placement
   - May require text measurement utilities

**Difficulty**: **MEDIUM**
- Component development: 1-2 weeks
- Content creation: 2-3 months
- Integration: 1 week
- Testing: 1 week

**Total Estimated Time**: 3-4 months (mostly content creation)

---

## 2. Reading Plans Monetization

### Feature Description
- **Free**: Bible in 1 Year (schools), 2 monthly challenges, 2 mini studies
- **Plus ($0.99)**: All reading plans
- **Premium ($1.99)**: All plans + commentary and additional content

### Technical Implementation

#### A. Data Structure Modification

**Add Premium Flags to Reading Plans:**
```json
// assets/data/ReadingPlansChallenges.json
{
  "plans": [
    {
      "id": "Bible1Year",
      "title": "Bible in 1 year",
      "isFree": true, // NEW
      "isPremium": false, // NEW
      "commentary": null, // NEW - will be populated for premium
      "segments": { ... }
    },
    {
      "id": "NT100Days",
      "title": "New Testament in 100 Days",
      "isFree": false,
      "isPremium": false, // Plus tier
      "commentary": null,
      "segments": { ... }
    },
    {
      "id": "WomenOfBible",
      "title": "Women of the Bible",
      "isFree": false,
      "isPremium": true, // Premium tier
      "commentary": {
        "introduction": "This plan explores...",
        "segments": {
          "S085": "Ruth's story demonstrates..."
        }
      },
      "segments": { ... }
    }
  ]
}
```

#### B. Component Modifications

**1. Update `app/(tabs)/ReadingPlans.tsx`:**

```typescript
// Around line 920-935
const handleStartPlanPress = (plan: UnifiedPlan) => {
  // Check if plan requires premium
  const requiresPlus = !plan.isFree && !plan.isPremium;
  const requiresPremium = plan.isPremium;
  
  if (requiresPlus && !checkPremiumFeature('readingPlansPlus')) {
    showPurchaseModal('readingPlansPlus');
    return;
  }
  
  if (requiresPremium && !checkPremiumFeature('readingPlansPremium')) {
    showPurchaseModal('readingPlansPremium');
    return;
  }
  
  // Continue with existing logic...
  const firstStory = getFirstStoryInPlan(plan.id, plan.type);
  // ...
};
```

**2. Add Premium Badge to Plan Items:**

```typescript
// In renderPlanItem function, around line 1143
<View style={styles.planContent}>
  <View style={styles.planTitleRow}>
    <Text style={[styles.planTitle, { color: planTitleColor }]}>
      {plan.title}
    </Text>
    {plan.isPremium && (
      <View style={styles.premiumBadge}>
        <Text style={styles.premiumBadgeText}>Premium</Text>
      </View>
    )}
    {!plan.isFree && !plan.isPremium && (
      <View style={styles.plusBadge}>
        <Text style={styles.plusBadgeText}>Plus</Text>
      </View>
    )}
  </View>
  {/* Rest of content */}
</View>
```

**3. Add Commentary Display:**

```typescript
// New component: components/ReadingPlans/PlanCommentary.tsx
const PlanCommentary: React.FC<{ planId: string; segmentId?: string }> = ({ 
  planId, 
  segmentId 
}) => {
  const plan = getPlanData(planId);
  const commentary = plan?.commentary;
  
  if (!commentary) return null;
  
  return (
    <View style={styles.commentaryContainer}>
      {commentary.introduction && (
        <Text style={styles.commentaryText}>{commentary.introduction}</Text>
      )}
      {segmentId && commentary.segments?.[segmentId] && (
        <Text style={styles.segmentCommentary}>
          {commentary.segments[segmentId]}
        </Text>
      )}
    </View>
  );
};
```

#### C. What's Needed

**Content Requirements:**
1. **Commentary Creation**: 
   - Introduction for each premium plan
   - Segment-specific commentary (optional, can be added gradually)
   - Estimated: 1-2 months for content team

**Technical Requirements:**
1. **Premium Check System** (same as Enhanced Stories)
2. **Purchase Modal Component**:
   ```typescript
   // components/PurchaseModal.tsx
   const PurchaseModal: React.FC<PurchaseModalProps> = ({
     feature,
     onPurchase,
     onCancel
   }) => {
     const featureInfo = getFeatureInfo(feature);
     return (
       <Modal>
         <Text>{featureInfo.title}</Text>
         <Text>{featureInfo.description}</Text>
         <Text>Price: ${featureInfo.price}</Text>
         <Button onPress={onPurchase}>Purchase</Button>
       </Modal>
     );
   };
   ```

3. **IAP Product Setup**:
   - Product IDs: `reading_plans_plus`, `reading_plans_premium`
   - Store listings (App Store, Play Store)

**Difficulty**: **EASY**
- Code changes: 3-5 days
- Content creation: 1-2 months
- Testing: 2-3 days

**Total Estimated Time**: 2-3 months (mostly content)

---

## 3. Questions Monetization

### Feature Description
- **Free**: School Set 1 only
- **Plus ($0.99)**: Full questions (School, Family, Small Group - all sets)
- **Premium ($1.99)**: Full questions + Inductive Bible Study Quiz (multi-choice with scoring)

### Technical Implementation

#### A. Data Structure

**Current Structure (already exists):**
```json
{
  "S001": {
    "school": { "set1": [...], "set2": [...] },
    "family": { "set1": [...], "set2": [...] },
    "smallgroup": { "set1": [...], "set2": [...] }
  }
}
```

**Add Quiz Data Structure:**
```json
{
  "S001": {
    "quiz": {
      "questions": [
        {
          "id": "q1",
          "type": "multiple_choice",
          "question": "What was created on the first day?",
          "options": [
            { "text": "Light", "correct": true },
            { "text": "Sun and Moon", "correct": false },
            { "text": "Plants", "correct": false },
            { "text": "Animals", "correct": false }
          ],
          "explanation": "God created light on day one..."
        }
      ],
      "passingScore": 70
    }
  }
}
```

#### B. Component Modifications

**1. Update `components/Questions.tsx`:**

```typescript
// Around line 35-36
const [selectedAudience, setSelectedAudience] = useState<AudienceType>('school');
const [currentSet, setCurrentSet] = useState<1 | 2>(1);
const [showQuiz, setShowQuiz] = useState(false); // NEW
const [quizScore, setQuizScore] = useState<number | null>(null); // NEW

// Add premium check
const isPlus = checkPremiumFeature('questionsPlus');
const isPremium = checkPremiumFeature('questionsPremium');

// Modify audience selection to show lock icons
const handleAudienceChange = (audience: AudienceType) => {
  if (audience === 'school') {
    setSelectedAudience(audience);
    return;
  }
  
  // Check if user has Plus or Premium
  if (!isPlus && !isPremium) {
    showPurchaseModal('questionsPlus');
    return;
  }
  
  setSelectedAudience(audience);
};

// Modify set selection
const handleSetChange = () => {
  if (currentSet === 1 && !isPlus && !isPremium) {
    showPurchaseModal('questionsPlus');
    return;
  }
  
  setCurrentSet(currentSet === 1 ? 2 : 1);
};
```

**2. Add Quiz Component:**

```typescript
// components/Questions/InductiveQuiz.tsx
const InductiveQuiz: React.FC<{ segmentId: string }> = ({ segmentId }) => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  
  const loadQuiz = async () => {
    const data = await getQuizData(segmentId);
    setQuizData(data);
  };
  
  const calculateScore = () => {
    let correct = 0;
    selectedAnswers.forEach((answer, index) => {
      if (quizData?.questions[index].options[answer].correct) {
        correct++;
      }
    });
    const percentage = (correct / quizData.questions.length) * 100;
    setScore(percentage);
    setShowResults(true);
  };
  
  return (
    <View style={styles.quizContainer}>
      {!showResults ? (
        <>
          <Text style={styles.questionNumber}>
            Question {currentQuestion + 1} of {quizData?.questions.length}
          </Text>
          <Text style={styles.question}>
            {quizData?.questions[currentQuestion].question}
          </Text>
          {quizData?.questions[currentQuestion].options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.option,
                selectedAnswers[currentQuestion] === index && styles.selectedOption
              ]}
              onPress={() => {
                const newAnswers = [...selectedAnswers];
                newAnswers[currentQuestion] = index;
                setSelectedAnswers(newAnswers);
              }}
            >
              <Text>{option.text}</Text>
            </TouchableOpacity>
          ))}
          <Button
            onPress={() => {
              if (currentQuestion < quizData.questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
              } else {
                calculateScore();
              }
            }}
          >
            {currentQuestion < quizData.questions.length - 1 ? 'Next' : 'Submit'}
          </Button>
        </>
      ) : (
        <View style={styles.resultsContainer}>
          <Text style={styles.scoreText}>
            Your Score: {score.toFixed(0)}%
          </Text>
          {score >= quizData.passingScore ? (
            <Text style={styles.passText}>Great job! You passed!</Text>
          ) : (
            <Text style={styles.failText}>Keep studying! Try again?</Text>
          )}
          {/* Show explanations */}
        </View>
      )}
    </View>
  );
};
```

**3. Integrate Quiz into Questions Component:**

```typescript
// In components/Questions.tsx, add after questions display
{isPremium && (
  <View style={styles.quizSection}>
    <TouchableOpacity 
      style={styles.quizButton}
      onPress={() => setShowQuiz(true)}
    >
      <Text>Take Inductive Study Quiz</Text>
    </TouchableOpacity>
  </View>
)}

{showQuiz && isPremium && (
  <InductiveQuiz segmentId={segmentId} />
)}
```

#### C. What's Needed

**Content Requirements:**
1. **Quiz Creation**:
   - 5-10 multiple choice questions per story
   - Explanations for each answer
   - Passing score determination
   - Estimated: 2-3 months for content team (365 stories × 5-10 questions)

**Technical Requirements:**
1. **Quiz Data Storage**:
   - New JSON file: `assets/data/InductiveQuizzes.json`
   - Or SQLite table: `inductive_quizzes`

2. **Score Tracking** (optional):
   - Store quiz scores in database
   - Show progress over time
   - Leaderboards (if desired)

**Difficulty**: **MEDIUM**
- Component development: 1 week
- Content creation: 2-3 months
- Integration: 2-3 days
- Testing: 3-4 days

**Total Estimated Time**: 3-4 months (mostly content)

---

## 4. Audio Feature (Complex Feature)

### Feature Description
- Multiple voice actors: Narrator, God, Main Character, Male/Female Other Voices
- Auto-play mode: All voices play automatically
- Interactive mode: User selects their role, audio pauses for their parts, continues for others

### Technical Implementation

#### A. Architecture Overview

**This is a COMPLEX feature requiring:**
1. Audio production (voice actors, recording, editing)
2. Audio file management (storage, streaming, caching)
3. Synchronization system (audio + text highlighting)
4. Playback controls (play, pause, skip, speed)

#### B. Data Structure

```json
{
  "S001": {
    "audio": {
      "duration": 180, // seconds
      "segments": [
        {
          "id": "seg-1",
          "blockIndex": 0,
          "role": "narrator",
          "audioUrl": "https://cdn.../S001-narrator-1.mp3",
          "startTime": 0,
          "endTime": 15,
          "wordIndices": [0, 50] // For highlighting
        },
        {
          "id": "seg-2",
          "blockIndex": 1,
          "role": "god",
          "audioUrl": "https://cdn.../S001-god-1.mp3",
          "startTime": 15,
          "endTime": 30,
          "wordIndices": [51, 100]
        }
      ],
      "fullAudioUrl": "https://cdn.../S001-full.mp3" // Optional: full story audio
    }
  }
}
```

#### C. Component Architecture

**1. Audio Player Component:**

```typescript
// components/Audio/AudioPlayer.tsx
import { Audio } from 'expo-av';
import { useState, useEffect, useRef } from 'react';

interface AudioPlayerProps {
  segmentId: string;
  userRole?: Role;
  mode: 'auto' | 'interactive';
  onSegmentComplete: (segmentId: string) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  segmentId,
  userRole,
  mode,
  onSegmentComplete
}) => {
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [position, setPosition] = useState(0);
  
  // Load audio data
  useEffect(() => {
    loadAudioData(segmentId);
  }, [segmentId]);
  
  // Play current segment
  const playSegment = async (index: number) => {
    if (!audioData) return;
    
    const segment = audioData.segments[index];
    
    // Check if user should read this part
    if (mode === 'interactive' && userRole && segment.role !== userRole) {
      // Auto-play other roles
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: segment.audioUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      
      // Monitor playback
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis / 1000);
          if (status.didJustFinish) {
            playNextSegment(index);
          }
        }
      });
    } else if (mode === 'interactive' && userRole && segment.role === userRole) {
      // Pause for user to read
      setIsPlaying(false);
      // Highlight text for user to read
      highlightText(segment.wordIndices);
      // Wait for user to tap "I've read this"
    } else {
      // Auto-play mode - play all segments
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: segment.audioUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
    }
  };
  
  const playNextSegment = (currentIndex: number) => {
    if (currentIndex < audioData.segments.length - 1) {
      setCurrentSegment(currentIndex + 1);
      playSegment(currentIndex + 1);
    } else {
      // Finished
      onSegmentComplete(segmentId);
    }
  };
  
  return (
    <View style={styles.audioPlayer}>
      <TouchableOpacity onPress={() => playSegment(currentSegment)}>
        <Ionicons name={isPlaying ? "pause" : "play"} size={32} />
      </TouchableOpacity>
      {/* Progress bar, time display, etc. */}
    </View>
  );
};
```

**2. Text Highlighting During Audio:**

```typescript
// Modify BibleBlockComponent to support audio highlighting
interface BibleBlockProps {
  // ... existing props
  audioHighlight?: {
    wordIndices: number[];
    isActive: boolean;
  };
}

// In BibleBlockComponent, add highlighting:
{children.map((item, index) => {
  const isHighlighted = audioHighlight?.isActive && 
    audioHighlight.wordIndices.includes(index);
  
  return (
    <BibleInlineComponent
      key={index}
      inline={item}
      textColor={isHighlighted ? '#FFD700' : getBubbleTextColorSafe(color, isDarkMode)}
      // ...
    />
  );
})}
```

#### D. What's Needed

**Production Requirements:**
1. **Voice Actors**: 
   - Narrator (neutral, clear)
   - God voice (authoritative, warm)
   - Main character voices (varies by story)
   - Male/Female other voices
   - Estimated cost: $50-200 per story (depending on actors)
   - Total for 365 stories: $18,250 - $73,000

2. **Audio Production**:
   - Recording studio or remote recording setup
   - Audio editing and mixing
   - Quality control
   - Estimated: 6-12 months for full production

3. **Audio Storage**:
   - CDN storage (AWS S3, CloudFront, etc.)
   - Estimated: 50-100MB per story
   - Total: ~18-36GB storage
   - CDN costs: $50-200/month depending on usage

**Technical Requirements:**
1. **Audio Library**: 
   - `expo-av` (already available in Expo)
   - Or `react-native-track-player` for more advanced features

2. **Audio File Management**:
   - Download and cache audio files
   - Background playback support
   - Offline playback support

3. **Synchronization System**:
   - Word-level timing data
   - Text highlighting synchronization
   - Progress tracking

**Difficulty**: **HARD**
- Component development: 2-3 weeks
- Audio production: 6-12 months
- Integration: 1-2 weeks
- Testing: 1-2 weeks
- **Cost**: $20,000 - $75,000+ (mostly production)

**Total Estimated Time**: 8-14 months
**Recommendation**: Start with 10-20 popular stories as MVP, then expand

---

## 5. Daily Devotions

### Feature Description
- Devotional content linked to reading plans
- Content appears before story, after story, and integrated with questions
- Creates a complete devotional journey

### Technical Implementation

#### A. Data Structure

```json
{
  "devotions": {
    "Bible1Year": {
      "S001": {
        "day": 1,
        "beforeStory": {
          "title": "The Beginning of Everything",
          "content": "As we begin our journey through the Bible...",
          "prayer": "Lord, open our hearts to understand..."
        },
        "afterStory": {
          "reflection": "What does creation tell us about God's character?",
          "application": "Today, take a moment to appreciate..."
        },
        "beforeQuestions": {
          "prompt": "Before we discuss, let's reflect..."
        },
        "afterQuestions": {
          "closing": "As you go about your day, remember..."
        }
      }
    }
  }
}
```

#### B. Component Architecture

**1. Devotional Wrapper Component:**

```typescript
// components/Devotion/DevotionWrapper.tsx
interface DevotionWrapperProps {
  planId: string;
  segmentId: string;
  day: number;
  children: React.ReactNode; // Story content
}

const DevotionWrapper: React.FC<DevotionWrapperProps> = ({
  planId,
  segmentId,
  day,
  children
}) => {
  const [devotionData, setDevotionData] = useState<DevotionData | null>(null);
  const isPremium = checkPremiumFeature('dailyDevotions');
  
  useEffect(() => {
    if (isPremium) {
      loadDevotionData(planId, segmentId);
    }
  }, [planId, segmentId, isPremium]);
  
  if (!isPremium) {
    // Show preview or purchase prompt
    return (
      <View>
        <DevotionPreview />
        {children}
      </View>
    );
  }
  
  return (
    <ScrollView>
      {/* Before Story */}
      {devotionData?.beforeStory && (
        <DevotionSection
          title={devotionData.beforeStory.title}
          content={devotionData.beforeStory.content}
          prayer={devotionData.beforeStory.prayer}
        />
      )}
      
      {/* Story */}
      {children}
      
      {/* After Story */}
      {devotionData?.afterStory && (
        <DevotionSection
          reflection={devotionData.afterStory.reflection}
          application={devotionData.afterStory.application}
        />
      )}
      
      {/* Questions will be rendered separately, but we can add devotion prompts */}
    </ScrollView>
  );
};
```

**2. Devotion Section Component:**

```typescript
// components/Devotion/DevotionSection.tsx
const DevotionSection: React.FC<DevotionSectionProps> = ({
  title,
  content,
  prayer,
  reflection,
  application
}) => {
  return (
    <View style={styles.devotionContainer}>
      {title && <Text style={styles.title}>{title}</Text>}
      {content && <Text style={styles.content}>{content}</Text>}
      {prayer && (
        <View style={styles.prayerBox}>
          <Text style={styles.prayerLabel}>Prayer</Text>
          <Text style={styles.prayer}>{prayer}</Text>
        </View>
      )}
      {reflection && (
        <View style={styles.reflectionBox}>
          <Text style={styles.reflectionLabel}>Reflection</Text>
          <Text style={styles.reflection}>{reflection}</Text>
        </View>
      )}
      {application && (
        <View style={styles.applicationBox}>
          <Text style={styles.applicationLabel}>Application</Text>
          <Text style={styles.application}>{application}</Text>
        </View>
      )}
    </View>
  );
};
```

**3. Integration with Reading Flow:**

```typescript
// Modify app/(tabs)/[segment]/index.tsx
// Around line 595-605

// Check if this is part of a plan with devotions
const hasDevotions = planId && checkPremiumFeature('dailyDevotions');

if (hasDevotions) {
  return (
    <DevotionWrapper
      planId={planId}
      segmentId={segID}
      day={getDayFromPlan(planId, segID)}
    >
      <Segment 
        segmentData={segmentData}
        context="plan"
        planId={planId}
      />
      <Questions segmentId={segID} />
    </DevotionWrapper>
  );
} else {
  // Normal flow
  return (
    <>
      <Segment segmentData={segmentData} />
      <Questions segmentId={segID} />
    </>
  );
}
```

**4. Modify Questions Component to Include Devotion Prompts:**

```typescript
// In components/Questions.tsx, add before questions:
{devotionData?.beforeQuestions && (
  <View style={styles.devotionPrompt}>
    <Text>{devotionData.beforeQuestions.prompt}</Text>
  </View>
)}

{/* Existing questions */}

{devotionData?.afterQuestions && (
  <View style={styles.devotionClosing}>
    <Text>{devotionData.afterQuestions.closing}</Text>
  </View>
)}
```

#### C. What's Needed

**Content Requirements:**
1. **Devotional Content Creation**:
   - Before story: Introduction, context, prayer
   - After story: Reflection, application
   - Before questions: Discussion prompt
   - After questions: Closing thought
   - Estimated: 1-2 months for content team per plan
   - For all plans: 6-12 months

**Technical Requirements:**
1. **Devotion Data Storage**:
   - New JSON file: `assets/data/DailyDevotions.json`
   - Or SQLite table: `daily_devotions`

2. **Plan Integration**:
   - Track which day user is on in plan
   - Link devotions to specific segments in plan
   - Progress tracking

**Difficulty**: **MEDIUM**
- Component development: 1 week
- Content creation: 6-12 months (for all plans)
- Integration: 3-5 days
- Testing: 3-4 days

**Total Estimated Time**: 7-13 months (mostly content)

**Recommendation**: Start with 1-2 popular plans (Bible in 1 Year, NT in 100 Days), then expand

---

## IMPLEMENTATION PRIORITY & TIMELINE

### Phase 1: Quick Wins (Month 1-2)
1. ✅ Reading Plans Plus/Premium (EASY - 1 week)
2. ✅ Questions Plus (EASY - 1 week)
3. ✅ Purchase system integration (MEDIUM - 2 weeks)
4. ✅ Premium check system (EASY - 3 days)

### Phase 2: Enhanced Content (Month 3-5)
5. ✅ Enhanced Stories (MEDIUM - 2 months content + 2 weeks dev)
6. ✅ Questions Premium with Quizzes (MEDIUM - 3 months content + 1 week dev)

### Phase 3: Advanced Features (Month 6+)
7. ✅ Daily Devotions (MEDIUM - 6-12 months content + 1 week dev)
8. ✅ Audio Feature (HARD - 8-14 months, start with MVP of 10-20 stories)

---

## COST ESTIMATES

### Development Costs
- Reading Plans: $2,000-3,000
- Questions: $2,000-3,000
- Enhanced Stories: $5,000-8,000
- Quizzes: $3,000-5,000
- Daily Devotions: $3,000-5,000
- Audio (MVP): $10,000-20,000
- **Total Dev**: $25,000-44,000

### Content Creation Costs
- Enhanced Stories: $10,000-20,000 (research, writing)
- Quizzes: $15,000-30,000 (question creation)
- Daily Devotions: $20,000-40,000 (writing)
- Audio Production: $18,000-73,000 (voice actors, production)
- **Total Content**: $63,000-163,000

### Infrastructure Costs (Monthly)
- CDN/Storage: $50-200/month
- Database: $20-50/month
- **Total Monthly**: $70-250/month

---

## RECOMMENDATIONS

1. **Start Small**: Launch with Reading Plans and Questions monetization first (easy wins)
2. **Content Strategy**: Create content gradually - don't wait for all 365 stories
3. **MVP Approach**: For complex features (audio), start with 10-20 popular stories
4. **Pricing**: Consider bundling - "Complete Plus" ($2.99) and "Complete Premium" ($4.99)
5. **Testing**: A/B test pricing before full launch
6. **User Feedback**: Launch beta with early adopters to validate features

This approach allows you to start generating revenue quickly while building out more complex features based on user demand and feedback.

