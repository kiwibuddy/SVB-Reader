import { View, Text, Pressable, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useState, useEffect } from "react";
import { getEmojis} from "@/api/sqlite";
import BibleBlockComponent from "@/components/Bible/Block";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { useRouter } from "expo-router";

// Define the structure for our emoji reaction data
interface EmojiReaction {
  id: number;
  segmentID: string;
  blockID: string;
  blockData: string;
  emoji: string;
  note: string;
}

// Add this near the top of the file with other interfaces
interface EmojiDescription {
  title: string;
  count: string;
  description: string[];
}

const EMOJI_DESCRIPTIONS: Record<string, EmojiDescription> = {
  "❤️": {
    title: "Memory Masterclass",
    count: "passages",
    description: [
      "You've found a verse you really love! Let's make it a part of your daily life by memorizing it. Here's how: 🎯",
      "Step 1: Break It Down 🔍",
      "Split the verse into smaller parts. It's easier to remember bite-sized pieces.",
      "Step 2: Repeat, Repeat, Repeat 🔄",
      "Say it out loud. Write it down. Make it a wallpaper for your phone. The more you see it, the more it'll stick.",
      "Step 3: Connect the Dots 🧠",
      "Relate the verse to something in your life. How does it apply to your day-to-day? This makes it meaningful and easier to remember.",
      "Step 4: Share It 📱",
      "Tell a friend or post it on your socials. Teaching others is a great way to remember it yourself!",
      "Keep It Up! ⭐️",
      "Repeat these steps daily, and soon you'll be a have these Scriptures in your ❤️."
    ]
  },
  "👍": {
    title: "Spread the Word",
    count: "passages",
    description: [
      "Found a verse that speaks truth to you? Don't keep it to yourself, let's share it with others! Here's how: 🌟",
      "Step 1: Capture the Moment 📸",
      "Screenshot it or write it down. Keep it handy for when you want to share.",
      "Step 2: Share Your Thoughts 💭",
      "Post it on your social media or text it to a friend. Add a caption about why it resonates with you.",
      "Step 3: Start a Conversation 💬",
      "Use the verse to spark a discussion. Ask others what they think or how it applies to their lives.",
      "Step 4: Live It Out 💪",
      "Show how this truth is reflected in your actions. Be a living example of the verse!",
      "Spread the Word! 🚀",
      "Your excitement can inspire others. Let's get the word out!"
    ]
  },
  "🤔": {
    title: "Hmm needs more thought",
    count: "passages",
    description: [
      "Stumbled upon a verse that's got you thinking? Let's break it down together! 🧩",
      "Step 1: Pause and Reflect 🤔",
      "Take a moment to think about the verse. What do you think it means? How does it make you feel?",
      "Step 2: Compare Translations 🔄",
      "Look up the verse in different Bible translations. Sometimes, a different wording can offer new insights.",
      "Step 3: Seek Wisdom 🎯",
      "Ask someone you trust who knows the Bible well, like a youth leader or pastor. You can also check out online resources or commentaries.",
      "Step 4: Cross-Reference 🔍",
      "Find other verses that relate to the same theme. The Bible often explains itself!",
      "Step 5: Journal It ✍️",
      "Write down your thoughts and questions. Over time, you might find answers or new insights.",
      "Take Your Time! ⏳",
      "It's okay if you don't understand it all at once. Reflecting on Scripture is a journey, not a race!"
    ]
  },
  "🙏": {
    title: "Turn Verse into Prayer",
    count: "passages",
    description: [
      "Found a verse that speaks to your heart? Let's turn it into a prayer for your day: ✨",
      "Step 1: Read and Reflect 📖",
      "Read the verse slowly. Think about what it means to you and what it says about God.",
      "Step 2: Personalize It 💫",
      "Turn the verse into a personal prayer. Use \"I\" or \"we\" to make it your own.",
      "Step 3: Ask and Thank 🙌",
      "Pray for what you need related to the verse, and thank God for what He's already done.",
      "Step 4: Listen 👂",
      "Take a moment to be silent. Listen for what God might be saying to you through the verse.",
      "Step 5: Keep It Close 📱",
      "Write down the verse or prayer and keep it with you throughout the day. Revisit it whenever you need a reminder.",
      "Pray Without Ceasing ✨",
      "Let these verses guide your prayers, bringing hope and encouragement into your day! 🙏"
    ]
  }
};

const EMOJI_TYPES = [
  { emoji: "❤️", label: "Love", color: "#FF6B6B" },
  { emoji: "👍", label: "Agree", color: "#4ECDC4" },
  { emoji: "🤔", label: "Reflecting", color: "#FFB347" },
  { emoji: "🙏", label: "Praying", color: "#9B59B6" },
];

const getSegmentReference = (segmentID: string) => {
  const segment = SegmentTitles[segmentID as keyof typeof SegmentTitles];
  if (!segment) return '';
  return `${segment.book[0]} ${segment.ref}`;
};

const ReadingEmoji = () => {
  const router = useRouter();
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadReactions();
  }, []);

  const loadReactions = async () => {
    try {
      const allReactions = await getEmojis();
      setReactions(allReactions);
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  // Add this helper function to sort reactions by most recent
  const sortReactionsByRecent = (reactions: EmojiReaction[]) => {
    return [...reactions].sort((a, b) => {
      // Assuming id is sequential and higher means more recent
      return b.id - a.id;
    });
  };

  // Modify the filteredReactions logic
  const filteredReactions = selectedEmoji 
    ? reactions.filter(r => r.emoji === selectedEmoji)
    : sortReactionsByRecent(reactions);

  const getEmojiCount = (emojiType: string) => {
    return reactions.filter(r => r.emoji === emojiType).length;
  };

  // Helper function to split description into intro and steps
  const splitDescription = (description: string[]) => {
    const introIndex = description.findIndex(text => text.includes("Step 1"));
    return {
      intro: description.slice(0, introIndex),
      steps: description.slice(introIndex)
    };
  };

  const handleLongPress = (reaction: EmojiReaction) => {
    Alert.alert(
      "Go to Segment",
      `Would you like to view this verse in ${getSegmentReference(reaction.segmentID)}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Go",
          onPress: () => router.push(`/segment/${reaction.segmentID}`)
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emoji Reactions</Text>
      </View>

      <View style={styles.gridContainer}>
        {EMOJI_TYPES.map((type, index) => (
          <Pressable
            key={index}
            style={[
              styles.emojiCard,
              { backgroundColor: type.color },
              selectedEmoji && selectedEmoji !== type.emoji && styles.unselectedCard,
              selectedEmoji === type.emoji && styles.selectedCard,
            ]}
            onPress={() => setSelectedEmoji(selectedEmoji === type.emoji ? null : type.emoji)}
          >
            <View style={styles.emojiWrapper}>
              <Text style={styles.emojiText}>{type.emoji}</Text>
            </View>
            <View style={styles.emojiInfoContainer}>
              <Text style={styles.emojiLabel}>{type.label}</Text>
              <Text style={styles.emojiCount}>
                {getEmojiCount(type.emoji)} verses
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {selectedEmoji ? (
        <TouchableOpacity 
          style={styles.descriptionCard}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.descriptionTitle}>
            {EMOJI_DESCRIPTIONS[selectedEmoji].title}
          </Text>
          <Text style={styles.emojiCountText}>
            {selectedEmoji} {getEmojiCount(selectedEmoji)} {EMOJI_DESCRIPTIONS[selectedEmoji].count}
          </Text>
          
          {/* Show intro text */}
          {splitDescription(EMOJI_DESCRIPTIONS[selectedEmoji].description).intro.map((text, index) => (
            <Text key={index} style={styles.descriptionText}>
              {text}
            </Text>
          ))}

          {/* Show expand/collapse indicator */}
          <Text style={styles.expandIndicator}>
            {isExpanded ? "Tap to collapse ↑" : "Tap to see steps ↓"}
          </Text>

          {/* Show steps when expanded */}
          {isExpanded && splitDescription(EMOJI_DESCRIPTIONS[selectedEmoji].description).steps.map((text, index) => {
            const isStep = text.includes("Step") || text.includes("Keep It Up") || 
                          text.includes("Spread the Word") || text.includes("Take Your Time") ||
                          text.includes("Pray Without Ceasing");
            
            return (
              <Text key={`step-${index}`} style={[
                styles.descriptionText,
                isStep && styles.stepText
              ]}>
                {text}
              </Text>
            );
          })}
        </TouchableOpacity>
      ) : (
        <View style={styles.recentHeader}>
          <Text style={styles.recentHeaderText}>
            Most Recent Reactions
          </Text>
        </View>
      )}

      <View style={styles.reactionsContainer}>
        {filteredReactions.map((reaction, index) => {
          const blockData = JSON.parse(reaction.blockData);
          return (
            <Pressable
              key={index}
              onLongPress={() => handleLongPress(reaction)}
            >
              <View style={styles.reactionItem}>
                <BibleBlockComponent
                  block={blockData}
                  bIndex={index}
                  toRead={false}
                  hasTail={true}
                />
                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                <Text style={styles.referenceText}>
                  {getSegmentReference(reaction.segmentID)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    padding: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
    marginBottom: 16,
  },
  emojiCard: {
    width: '48%',
    minHeight: 44,
    padding: 12,
    marginBottom: 0,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    transform: [{scale: 1}],
  },
  selectedCard: {
    transform: [{scale: 1.05}],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  unselectedCard: {
    opacity: 0.6,
    transform: [{scale: 0.98}],
    shadowOpacity: 0.1,
  },
  emojiWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 30,
  },
  emojiInfoContainer: {
    flex: 1,
    paddingLeft: 8,
  },
  emojiLabel: {
    fontSize: 15,
    color: 'white',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  emojiCount: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  descriptionCard: {
    margin: 8,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emojiCountText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 8,
  },
  reactionsContainer: {
    paddingHorizontal: 8,
  },
  reactionItem: {
    marginBottom: 16,
    position: 'relative',
  },
  reactionEmoji: {
    position: 'absolute',
    top: 37,
    right: 12,
    fontSize: 30,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  stepText: {
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 12,
  },
  expandIndicator: {
    textAlign: 'center',
    color: '#666',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  recentHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  recentHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  referenceText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
    paddingRight: 8,
  },
});

export default ReadingEmoji;
