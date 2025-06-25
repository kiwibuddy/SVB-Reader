"use client"
import React, { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  useWindowDimensions,
  Platform,
  Animated,
} from "react-native"
import { useRouter } from "expo-router"
import { useAppContext } from "@/context/GlobalContext"
import { useAppSettings } from "@/context/AppSettingsContext"
import { useTranslation } from "@/hooks/useTranslation"
import { getEmojis } from "@/api/sqlite"
import BibleBlockComponent from "@/components/Bible/Block"
import type { BibleBlock } from "@/types"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

const SegmentTitles = require("@/assets/data/SegmentTitles.json")
const Books = require("@/assets/data/BookChapterList.json")

// Define EmojiReaction interface locally until it's properly exported from types
interface EmojiReaction {
  id: number
  segmentID: string
  blockID: string
  blockData: BibleBlock
  emoji: string
  note: string
}

// Add this near the top of the file with other interfaces
interface EmojiDescription {
  title: string
  count: string
  description: string[]
}

// Add the type definition (can be near the top with other interfaces)
type SegmentTitle = {
  Segment: string
  title: string
  book: string[]
  ref?: string // Making ref optional since not all segments have it
}

const EMOJI_TYPES = [
  { emoji: "❤️", label: "love", color: "#FF6B47", icon: "heart-outline", backgroundColor: "#FF6B47" },
  { emoji: "👍", label: "agree", color: "#4ECDC4", icon: "thumbs-up-outline", backgroundColor: "#4ECDC4" },
  { emoji: "🤔", label: "reflecting", color: "#FFB347", icon: "bulb-outline", backgroundColor: "#FFB347" },
  {
    emoji: "🙏",
    label: "praying",
    color: "#7B68EE",
    icon: "hand-right-outline",
    backgroundColor: "#7B68EE",
  },
]

const getSegmentReference = (segmentID: string) => {
  const segment = SegmentTitles[segmentID as keyof typeof SegmentTitles] as SegmentTitle
  if (!segment) return ""
  return `${segment.book[0]}${segment.ref ? " " + segment.ref : ""}`
}

const createStyles = (isLargeScreen: boolean, colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    welcomeSection: {
      marginBottom: 24,
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
      padding: 16,
      paddingBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 10,
      letterSpacing: -0.5,
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 24,
      justifyContent: "space-between",
    },
    emojiCard: {
      width: isLargeScreen ? "23%" : "48%",
      height: 140,
      padding: 16,
      marginBottom: 0,
      borderRadius: 16,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
      transform: [{ scale: 1 }],
      borderWidth: 1,
      borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
      overflow: "hidden",
    },
    selectedCard: {
      transform: [{ scale: 1.03 }],
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.3)",
    },
    unselectedCard: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
      shadowOpacity: 0.1,
    },
    emojiWrapper: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      borderRadius: 24,
      // Removed grey background to match modern design
    },
    emojiText: {
      fontSize: 32,
    },
    emojiInfoContainer: {
      alignItems: "center",
    },
    emojiLabel: {
      fontSize: 16,
      color: "white",
      fontWeight: "bold",
      letterSpacing: 0.3,
      textAlign: "center",
      marginBottom: 6,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    emojiCount: {
      fontSize: 12,
      color: "rgba(255, 255, 255, 0.9)",
      textAlign: "center",
      fontWeight: '500',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    descriptionCard: {
      marginVertical: 16,
      borderRadius: 16,
      shadowColor: colors.text,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: Platform.OS === "ios" ? "rgba(0,0,0,0.05)" : "transparent",
      overflow: "hidden",
    },
    descriptionCardContent: {
      padding: 20,
      backgroundColor: colors.card,
    },
    descriptionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 0,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    descriptionHeaderIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      backgroundColor: "rgba(255,255,255,0.2)",
    },
    descriptionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "white",
      letterSpacing: -0.3,
    },
    emojiCountText: {
      fontSize: 16,
      color: colors.secondary,
      marginBottom: 16,
      fontWeight: "500",
    },
    descriptionText: {
      fontSize: 16,
      color: colors.secondary,
      lineHeight: 24,
      marginBottom: 10,
    },
    reactionsContainer: {
    },
    reactionItem: {
      marginBottom: 20,
      position: "relative",
      zIndex: 1,
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: colors.text,
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
      borderWidth: 1,
      borderColor: Platform.OS === "ios" ? "rgba(0,0,0,0.05)" : "transparent",
    },
    reactionEmoji: {
      position: "absolute",
      top: 12,
      right: 12,
      fontSize: 30,
      padding: 8,
      zIndex: 2,
      elevation: 3,
      backgroundColor: "rgba(0,0,0,0.1)",
      borderRadius: 20,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 3,
    },
    stepText: {
      fontWeight: "700",
      fontSize: 16,
      marginTop: 16,
      color: colors.text,
    },
    expandIndicator: {
      textAlign: "center",
      color: "white",
      fontSize: 14,
      marginTop: 12,
      marginBottom: 12,
      fontWeight: "500",
    },
    expandButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.15)",
      borderRadius: 12,
      marginTop: 16,
    },
    recentHeader: {
      marginBottom: 20,
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    recentHeaderText: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.3,
    },
    recentHeaderIcon: {
      marginRight: 8,
    },
    referenceText: {
      fontSize: 12,
      color: colors.secondary,
      textAlign: "right",
      marginTop: 4,
      paddingRight: 12,
      paddingBottom: 8,
      fontWeight: "500",
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
    divider: {
      height: 1,
      backgroundColor: "rgba(255,255,255,0.15)",
      marginVertical: 12,
    },
    stepContainer: {
      backgroundColor: "rgba(255,255,255,0.1)",
      padding: 16,
      borderRadius: 12,
      marginVertical: 8,
    },
    emptyStateContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      opacity: 0.7,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.secondary,
      textAlign: "center",
      marginTop: 16,
    },
    emptyStateIcon: {
      marginBottom: 16,
    },
    refreshHint: {
      fontSize: 12,
      color: colors.secondary,
      textAlign: "center",
      marginTop: 8,
      fontStyle: "italic",
    },
    longPressHint: {
      fontSize: 12,
      color: colors.secondary,
      textAlign: "center",
      marginTop: 16,
      fontStyle: "italic",
      opacity: 0.7,
    },
    stepsContainer: {
      marginTop: 16,
    },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    stepNumberText: {
      color: "white",
      fontWeight: "700",
      fontSize: 14,
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 4,
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      color: "white",
      fontWeight: "700",
      fontSize: 16,
      marginBottom: 4,
    },
    stepDescription: {
      color: "rgba(255,255,255,0.9)",
      fontSize: 15,
      lineHeight: 22,
    },
    conclusionContainer: {
      marginTop: 20,
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: 12,
      padding: 16,
    },
    conclusionTitle: {
      color: "white",
      fontWeight: "700",
      fontSize: 16,
      marginBottom: 8,
    },
    conclusionText: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
    },
    backButton: {
      position: "absolute",
      top: 16,
      right: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(0,0,0,0.2)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    emojiDetailIntro: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 20,
    },
    emojiDetailCount: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 20,
      flexDirection: "row",
      alignItems: "center",
    },
    emojiDetailEmoji: {
      fontSize: 24,
      marginRight: 8,
    },
  })

// Add this helper function near the top with other utility functions
const getEmojiKey = (emoji: string) => {
  switch (emoji) {
    case "❤️":
      return "love"
    case "👍":
      return "agree"
    case "🤔":
      return "reflecting"
    case "🙏":
      return "praying"
    default:
      return ""
  }
}

const ReadingEmoji = () => {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isLargeScreen = width >= 768
  const { colors } = useAppSettings()
  const styles = createStyles(isLargeScreen, colors)
  const { updateSegmentId } = useAppContext()
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [reactions, setReactions] = useState<EmojiReaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { t } = useTranslation()

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    if (selectedEmoji) {
      // Reset animations
      fadeAnim.setValue(0)
      slideAnim.setValue(50)

      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [selectedEmoji])

  useEffect(() => {
    const loadEmojis = async () => {
      setIsLoading(true)
      try {
        const emojiData = await getEmojis()
        setReactions(emojiData)
      } catch (error) {
        console.error("Error loading emojis:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadEmojis()
  }, [refreshTrigger])

  // Sort reactions by most recent first
  const sortReactionsByRecent = (reactions: EmojiReaction[]) => {
    return [...reactions].sort((a, b) => b.id - a.id)
  }

  // Get filtered reactions based on selected emoji type
  const getFilteredReactions = () => {
    if (!selectedEmoji) {
      // When no emoji is selected, show all reactions sorted by most recent
      return sortReactionsByRecent(reactions)
    }
    // When emoji type is selected, filter by that type and sort by most recent
    return sortReactionsByRecent(reactions.filter((r) => r.emoji === selectedEmoji))
  }

  // Replace existing filteredReactions with the new function
  const filteredReactions = getFilteredReactions()

  const getEmojiCount = (emojiType: string) => {
    return reactions.filter((r) => r.emoji === emojiType).length
  }

  const getEmojiIcon = (emoji: string) => {
    const emojiType = EMOJI_TYPES.find((type) => type.emoji === emoji)
    return emojiType?.icon || "heart-outline"
  }

  const getEmojiColor = (emoji: string) => {
    const emojiType = EMOJI_TYPES.find((type) => type.emoji === emoji)
    return emojiType?.color || "#FF6B6B"
  }

  const getEmojiBackground = (emoji: string) => {
    const emojiType = EMOJI_TYPES.find((type) => type.emoji === emoji)
    return emojiType?.backgroundColor || "#FF6B47"
  }

  const handleLongPress = (reaction: EmojiReaction) => {
    const segment = SegmentTitles[reaction.segmentID as keyof typeof SegmentTitles]
    const reference = getSegmentReference(reaction.segmentID)

    Alert.alert(t("UI.emojiPage.goToSegment"), t("UI.emojiPage.viewVersePrompt", { reference }), [
      {
        text: t("UI.emojiPage.cancel"),
        style: "cancel",
      },
      {
        text: t("UI.emojiPage.go"),
        onPress: () => {
          // Navigate to Navigation tab instead of direct navigation
          router.push({
            pathname: "/Navigation"
          });
        },
      },
    ])
  }

  const handleEmojiTypeSelect = (emoji: string) => {
    setSelectedEmoji(selectedEmoji === emoji ? null : emoji)
    setIsExpanded(false) // Reset expanded state when changing emoji
  }

  const renderEmojiDetailCard = () => {
    if (!selectedEmoji) return null

    const emojiKey = getEmojiKey(selectedEmoji)
    const backgroundColor = getEmojiBackground(selectedEmoji)
    const count = getEmojiCount(selectedEmoji)

    return (
      <Animated.View style={[styles.descriptionCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View
          style={[styles.descriptionHeader, { backgroundColor }]}
        >
          <View style={styles.descriptionHeaderIcon}>
            <Ionicons name={getEmojiIcon(selectedEmoji) as any} size={24} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.descriptionTitle}>{t(`UI.emojiPage.emojiDescriptions.${emojiKey}.title`)}</Text>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedEmoji(null)}>
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.descriptionCardContent}>
          <View style={styles.emojiDetailCount}>
            <Text style={styles.emojiDetailEmoji}>{selectedEmoji}</Text>
           <Text style={{ color: colors.text }}>
            {count} {t(`UI.emojiPage.emojiDescriptions.${emojiKey}.count`)}
          </Text>

          </View>

          <Text style={styles.emojiDetailIntro}>{t(`UI.emojiPage.emojiDescriptions.${emojiKey}.intro`)}</Text>

          <View
            style={[styles.expandButton, { backgroundColor }]}
          >
            <TouchableOpacity
              onPress={() => setIsExpanded(!isExpanded)}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Text style={styles.expandIndicator}>
                {isExpanded
                  ? t("UI.emojiPage.tapToCollapse").replace("ij", "")
                  : t("UI.emojiPage.tapToSeeSteps").replace("`", "")}
              </Text>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color="white"
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          </View>

          {isExpanded && (
            <View style={styles.stepsContainer}>
              {["1", "2", "3", "4", "5"].map((step) => {
                const stepKey = `UI.emojiPage.emojiDescriptions.${emojiKey}.steps.${step}`
                const descKey = `UI.emojiPage.emojiDescriptions.${emojiKey}.steps.${step}_desc`

                if (t(stepKey) !== stepKey) {
                  return (
                    <View key={step} style={styles.stepRow}>
                      <View style={[styles.stepNumber, { backgroundColor: getEmojiColor(selectedEmoji) + "40" }]}>
                        <Text style={styles.stepNumberText}>{step}</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, { color: getEmojiColor(selectedEmoji) }]}>{t(stepKey)}</Text>
                        <Text style={styles.descriptionText}>{t(descKey)}</Text>
                      </View>
                    </View>
                  )
                }
                return null
              })}

              <View style={styles.conclusionContainer}>
                <Text style={styles.conclusionTitle}>
                  {t(`UI.emojiPage.emojiDescriptions.${emojiKey}.steps.conclusion`)}
                </Text>
                <Text style={styles.conclusionText}>
                  {t(`UI.emojiPage.emojiDescriptions.${emojiKey}.steps.conclusion_desc`)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Animated.View>
    )
  }

  const renderHeader = () => (
    <>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>{t("UI.emojiPage.title")}</Text>
        <Text style={styles.welcomeText}>{t("UI.emojiPage.subtitle")}</Text>
      </View>

      <View style={styles.gridContainer}>
        {EMOJI_TYPES.map((type, index) => {
          const count = getEmojiCount(type.emoji)
          const isSelected = selectedEmoji === type.emoji

          return (
            <Pressable
              key={index}
              style={[
                styles.emojiCard,
                selectedEmoji && !isSelected && styles.unselectedCard,
                isSelected && styles.selectedCard,
              ]}
              onPress={() => handleEmojiTypeSelect(type.emoji)}
              android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
            >
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  backgroundColor: type.backgroundColor,
                }}
              />
              <View style={styles.emojiWrapper}>
                <Text style={styles.emojiText}>{type.emoji}</Text>
              </View>
              <View style={styles.emojiInfoContainer}>
                <Text style={styles.emojiLabel}>{t(`UI.emojiPage.emojiTypes.${type.label}`)}</Text>
                <Text style={styles.emojiCount}>
                  {count} {t("UI.emojiPage.verses")}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </View>

      {selectedEmoji && renderEmojiDetailCard()}

      {!selectedEmoji && (
        <View style={styles.recentHeader}>
          <Ionicons name="time-outline" size={22} color={colors.text} style={styles.recentHeaderIcon} />
          <Text style={styles.recentHeaderText}>{t("UI.emojiPage.recentReactions")}</Text>
        </View>
      )}

      {filteredReactions.length === 0 && !isLoading && (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            {selectedEmoji ? t("", { emoji: selectedEmoji }) : t("")}
          </Text>
        </View>
      )}

      {filteredReactions.length > 0 && <Text style={styles.longPressHint}>{t("")}</Text>}
    </>
  )

  const renderItem = ({ item: reaction, index }: { item: EmojiReaction; index: number }) => {
    try {
      const blockData = typeof reaction.blockData === "string" ? JSON.parse(reaction.blockData) : reaction.blockData

      return (
        <Pressable
          onLongPress={() => handleLongPress(reaction)}
          style={styles.reactionItem}
          android_ripple={{ color: "rgba(0,0,0,0.1)", borderless: false }}
        >
          <BibleBlockComponent block={blockData} bIndex={index} toRead={false} hasTail={true} />
          <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
          <Text style={styles.referenceText}>{getSegmentReference(reaction.segmentID)}</Text>
        </Pressable>
      )
    } catch (error) {
      console.error("Error parsing blockData:", error)
      return null
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        style={styles.content}
        data={filteredReactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.contentContainer}
        refreshing={isLoading}
        onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

export default ReadingEmoji
