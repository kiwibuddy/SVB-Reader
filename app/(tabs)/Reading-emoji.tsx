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
import { useAppSettings } from "@/context/AppSettingsContext";
import { useTranslation } from '@/hooks/useTranslation';

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

const EMOJI_TYPES = [
  { emoji: "❤️", label: "love", color: "#FF6B6B" },
  { emoji: "👍", label: "agree", color: "#4ECDC4" },
  { emoji: "🤔", label: "reflecting", color: "#FFB347" },
  { emoji: "🙏", label: "praying", color: "#9B59B6" }
];

const getSegmentReference = (segmentID: string) => {
  const segment = SegmentTitles[segmentID as keyof typeof SegmentTitles] as SegmentTitle;
  if (!segment) return '';
  return `${segment.book[0]}${segment.ref ? ' ' + segment.ref : ''}`;
};

const createStyles = (isLargeScreen: boolean, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.secondary,
    lineHeight: 22,
  },
  header: {
    padding: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
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
    backgroundColor: colors.card,
    borderColor: colors.border,
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
    color: colors.text,
    marginBottom: 8,
  },
  emojiCountText: {
    fontSize: 16,
    color: colors.secondary,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    color: colors.secondary,
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
    color: colors.secondary,
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
    color: colors.text,
  },
  referenceText: {
    fontSize: 12,
    color: colors.secondary,
    textAlign: 'right',
    marginTop: 4,
    paddingRight: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondary,
    lineHeight: 24,
    paddingHorizontal: 4,
  },
  contentContainer: {
    paddingBottom: 20,
  },
});

// Add this helper function near the top with other utility functions
const getEmojiKey = (emoji: string) => {
  switch (emoji) {
    case '❤️': return 'love';
    case '👍': return 'agree';
    case '🤔': return 'reflecting';
    case '🙏': return 'praying';
    default: return '';
  }
};

const ReadingEmoji = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { colors } = useAppSettings();
  const styles = createStyles(isLargeScreen, colors);
  const { updateSegmentId } = useAppContext();
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const loadEmojis = async () => {
      setIsLoading(true);
      try {
        const emojiData = await getEmojis();
        setReactions(emojiData);
      } catch (error) {
        console.error('Error loading emojis:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadEmojis();
  }, [refreshTrigger]);

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
    const reference = getSegmentReference(reaction.segmentID);

    Alert.alert(
      t('UI.emojiPage.goToSegment'),
      t('UI.emojiPage.viewVersePrompt', { reference }),
      [
        {
          text: t('UI.emojiPage.cancel'),
          style: "cancel"
        },
        {
          text: t('UI.emojiPage.go'),
          onPress: () => {
            updateSegmentId(`ENG-NLT-${reaction.segmentID}`);
            router.push({
              pathname: "/[segment]",
              params: {
                segment: `ENG-NLT-${reaction.segmentID}`,
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
        <Text style={styles.welcomeTitle}>
          {t('UI.emojiPage.title')}
        </Text>
        <Text style={styles.welcomeText}>
          {t('UI.emojiPage.subtitle')}
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
              <Text style={styles.emojiLabel}>
                {t(`UI.emojiPage.emojiTypes.${type.label}`)}
              </Text>
              <Text style={styles.emojiCount}>
                {getEmojiCount(type.emoji)} {t('UI.emojiPage.verses')}
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
            {t(`UI.emojiPage.emojiDescriptions.${getEmojiKey(selectedEmoji)}.title`)}
          </Text>
          <Text style={styles.emojiCountText}>
            {selectedEmoji} {getEmojiCount(selectedEmoji)} {t(`UI.emojiPage.emojiDescriptions.${getEmojiKey(selectedEmoji)}.count`)}
          </Text>

          <Text style={styles.descriptionText}>
            {t(`UI.emojiPage.emojiDescriptions.${getEmojiKey(selectedEmoji)}.intro`)}
          </Text>

          <Text style={styles.expandIndicator}>
            {isExpanded ? t('UI.emojiPage.tapToCollapse') : t('UI.emojiPage.tapToSeeSteps')}
          </Text>

          {isExpanded && (
            <>
              {['1', '2', '3', '4', '5'].map((step) => {
                const emojiKey = getEmojiKey(selectedEmoji);
                const stepKey = `UI.emojiPage.emojiDescriptions.${emojiKey}.steps.${step}`;
                const descKey = `UI.emojiPage.emojiDescriptions.${emojiKey}.steps.${step}_desc`;
                
                if (t(stepKey) !== stepKey) {
                  return (
                    <React.Fragment key={step}>
                      <Text style={[styles.descriptionText, styles.stepText]}>
                        {t(stepKey)}
                      </Text>
                      <Text style={styles.descriptionText}>
                        {t(descKey)}
                      </Text>
                    </React.Fragment>
                  );
                }
                return null;
              })}

              <Text style={[styles.descriptionText, styles.stepText]}>
                {t(`UI.emojiPage.emojiDescriptions.${getEmojiKey(selectedEmoji)}.steps.conclusion`)}
              </Text>
              <Text style={styles.descriptionText}>
                {t(`UI.emojiPage.emojiDescriptions.${getEmojiKey(selectedEmoji)}.steps.conclusion_desc`)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {!selectedEmoji && (
        <View style={styles.recentHeader}>
          <Text style={styles.recentHeaderText}>
            {t('UI.emojiPage.recentReactions')}
          </Text>
        </View>
      )}
    </>
  );

  const renderItem = ({ item: reaction, index }: { item: EmojiReaction; index: number }) => {
    try {
      const blockData = typeof reaction.blockData === 'string' 
        ? JSON.parse(reaction.blockData)
        : reaction.blockData;

      return (
        <Pressable
          onLongPress={() => handleLongPress(reaction)}
          style={styles.reactionItem}
        >
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
        </Pressable>
      );
    } catch (error) {
      console.error('Error parsing blockData:', error);
      return null;
    }
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
        refreshing={isLoading}
        onRefresh={() => setRefreshTrigger(prev => prev + 1)}
      />
    </SafeAreaView>
  );
};

export default ReadingEmoji;
