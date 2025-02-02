import React from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, useWindowDimensions } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { getEmojis } from "@/api/sqlite";
import BibleBlockComponent from "@/components/Bible/Block";
const SegmentTitles = require("@/assets/data/SegmentTitles.json");
const Books = require("@/assets/data/BookChapterList.json");
import { useRouter } from "expo-router";
import { SegmentIds } from '@/types';
import { useAppContext } from "@/context/GlobalContext";

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

// Add the type definition (can be near the top with other interfaces)
type SegmentTitle = {
  Segment: string;
  title: string;
  book: string[];
  ref?: string;  // Making ref optional since not all segments have it
}

const EMOJI_DESCRIPTIONS: Record<string, EmojiDescription> = {
  "❤️": {
    title: "Memory Masterclass",
    count: "passages",
    description: [
      "You've found a verse you really love! Let's make it a part of your daily life by memorizing it. Here's how:",
      "Step 1: Break It Down",
      "Split the verse into smaller parts. It's easier to remember bite-sized pieces.",
      "Step 2: Repeat, Repeat, Repeat",
      "Say it out loud. Write it down. Make it a wallpaper for your phone. The more you see it, the more it'll stick.",
      "Step 3: Connect the Dots",
      "Relate the verse to something in your life. How does it apply to your day-to-day? This makes it meaningful and easier to remember.",
      "Step 4: Share It",
      "Tell a friend or post it on your socials. Teaching others is a great way to remember it yourself!",
      "Keep It Up!",
      "Repeat these steps daily, and soon you'll be a have these Scriptures in your ❤️."
    ]
  },
  "👍": {
    title: "Spread the Word",
    count: "passages",
    description: [
      "Found a verse that speaks truth to you? Don't keep it to yourself, let's share it with others! Here's how:",
      "Step 1: Capture the Moment",
      "Screenshot it or write it down. Keep it handy for when you want to share.",
      "Step 2: Share Your Thoughts",
      "Post it on your social media or text it to a friend. Add a caption about why it resonates with you.",
      "Step 3: Start a Conversation",
      "Use the verse to spark a discussion. Ask others what they think or how it applies to their lives.",
      "Step 4: Live It Out",
      "Show how this truth is reflected in your actions. Be a living example of the verse!",
      "Spread the Word!",
      "Your excitement can inspire others. Let's get the word out!"
    ]
  },
  "🤔": {
    title: "Hmm needs more thought",
    count: "passages",
    description: [
      "Stumbled upon a verse that's got you thinking? Let's break it down together!",
      "Step 1: Pause and Reflect",
      "Take a moment to think about the verse. What do you think it means? How does it make you feel?",
      "Step 2: Compare Translations",
      "Look up the verse in different Bible translations. Sometimes, a different wording can offer new insights.",
      "Step 3: Seek Wisdom",
      "Ask someone you trust who knows the Bible well, like a youth leader or pastor. You can also check out online resources or commentaries.",
      "Step 4: Cross-Reference",
      "Find other verses that relate to the same theme. The Bible often explains itself!",
      "Step 5: Journal It",
      "Write down your thoughts and questions. Over time, you might find answers or new insights.",
      "Take Your Time!",
      "It's okay if you don't understand it all at once. Reflecting on Scripture is a journey, not a race!"
    ]
  },
  "🙏": {
    title: "Turn Verse into Prayer",
    count: "passages",
    description: [
      "Found a verse that speaks to your heart? Let's turn it into a prayer for your day:",
      "Step 1: Read and Reflect",
      "Read the verse slowly. Think about what it means to you and what it says about God.",
      "Step 2: Personalize It",
      "Turn the verse into a personal prayer. Use \"I\" or \"we\" to make it your own.",
      "Step 3: Ask and Thank",
      "Pray for what you need related to the verse, and thank God for what He's already done.",
      "Step 4: Listen",
      "Take a moment to be silent. Listen for what God might be saying to you through the verse.",
      "Step 5: Keep It Close",
      "Write down the verse or prayer and keep it with you throughout the day. Revisit it whenever you need a reminder.",
      "Pray Without Ceasing",
      "Let these verses guide your prayers, bringing hope and encouragement into your day!"
    ]
  }
};

const EMOJI_TYPES = [
  { emoji: "❤️", label: "Love", color: "#FF6B6B" },
  { emoji: "👍", label: "Agree", color: "#4ECDC4" },
  { emoji: "🤔", label: "Reflecting", color: "#FFB347" },
  { emoji: "🙏", label: "Praying", color: "#9B59B6" }
];

const getSegmentReference = (segmentID: string) => {
  const segment = SegmentTitles[segmentID as keyof typeof SegmentTitles] as SegmentTitle;
  if (!segment) return '';
  return `${segment.book[0]}${segment.ref ? ' ' + segment.ref : ''}`;
};

const createStyles = (isLargeScreen: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  header: {
    padding: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
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
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
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
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    paddingHorizontal: 4,
  },
  contentContainer: {
    paddingBottom: 20,
  },
});

const ReadingEmoji = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const styles = createStyles(isLargeScreen);
  const { updateSegmentId } = useAppContext();
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadEmojis();
  }, []);

  const loadEmojis = async () => {
    try {
      setIsLoading(true);
      const emojiData = await getEmojis();
      setReactions(emojiData);
    } catch (error) {
      console.error('Error loading emojis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sort reactions by most recent first
  const sortReactionsByRecent = (reactions: EmojiReaction[]) => {
    return [...reactions].sort((a, b) => b.id - a.id);
  };

  // Get filtered reactions based on selected emoji type
  const getFilteredReactions = () => {
    if (!selectedEmoji) {
      // When no emoji is selected, show all reactions sorted by most recent
      return sortReactionsByRecent(reactions);
    }
    // When emoji type is selected, filter by that type and sort by most recent
    return sortReactionsByRecent(
      reactions.filter(r => r.emoji === selectedEmoji)
    );
  };

  // Replace existing filteredReactions with the new function
  const filteredReactions = getFilteredReactions();

  const getEmojiCount = (emojiType: string) => {
    return reactions.filter(r => r.emoji === emojiType).length;
  };

  const splitDescription = (description: string[]) => {
    const introIndex = description.findIndex(text => text.includes("Step 1"));
    return {
      intro: description.slice(0, introIndex),
      steps: description.slice(introIndex)
    };
  };

  const handleLongPress = (reaction: EmojiReaction) => {
    const segment = SegmentTitles[reaction.segmentID as keyof typeof SegmentTitles];

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
          onPress: () => {
            console.log("reaction.segmentID", reaction.segmentID);
            updateSegmentId(`${"ENG"}-${"NLT"}-${reaction.segmentID}`);
            router.push({
              pathname: "/[segment]",
              params: {
                segment: `${"ENG"}-${"NLT"}-${reaction.segmentID}`,
                book: segment?.book[0] || ''
              }
            });
          }
        }
      ]
    );
  };

  const handleEmojiTypeSelect = (emoji: string) => {
    setSelectedEmoji(selectedEmoji === emoji ? null : emoji);
  };

  const renderHeader = () => (
    <>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Emoji Reactions</Text>
        <Text style={styles.welcomeText}>
          Transform your Bible reading from simple reactions to meaningful life application with guided spiritual practices for memorizing, sharing, reflecting, and praying through your favorite verses.
        </Text>
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
            onPress={() => handleEmojiTypeSelect(type.emoji)}
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

      {selectedEmoji && (
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

          {splitDescription(EMOJI_DESCRIPTIONS[selectedEmoji].description).intro.map((text, index) => (
            <Text key={index} style={styles.descriptionText}>
              {text}
            </Text>
          ))}

          <Text style={styles.expandIndicator}>
            {isExpanded ? "Tap to collapse ↑" : "Tap to see steps ↓"}
          </Text>

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
      )}

      {!selectedEmoji && (
        <View style={styles.recentHeader}>
          <Text style={styles.recentHeaderText}>
            Most Recent Reactions
          </Text>
        </View>
      )}
    </>
  );

  const renderItem = ({ item: reaction, index }: { item: EmojiReaction; index: number }) => {
    const blockData = JSON.parse(reaction.blockData);
    return (
      <Pressable
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        style={styles.content}
        data={filteredReactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingTop: 8 }}
      />
    </SafeAreaView>
  );
};

export default ReadingEmoji;
