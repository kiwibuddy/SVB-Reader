"use client"
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
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
  Modal,
  TextInput,
  ScrollView,
} from "react-native"
import { useRouter } from "expo-router"
import { useAppContext } from "@/context/GlobalContext"
import { useAppSettings } from "@/context/AppSettingsContext"
import { useTranslation } from "@/hooks/useTranslation"
import { getEmojis, deleteEmoji } from "@/api/sqlite"
import BibleBlockComponent from "@/components/Bible/Block"
import type { BibleBlock } from "@/types"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"

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
      marginBottom: 20,
    },
    welcomeTitleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    welcomeTitleContainer: {
      flex: 1,
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
    searchButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.card,
    },
    searchContainer: {
      marginTop: 12,
      marginBottom: 4,
      position: "relative",
    },
    searchInput: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      paddingRight: 50,
    },
    clearSearchButton: {
      position: "absolute",
      right: 16,
      top: 16,
      padding: 4,
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
      marginBottom: 20,
      marginTop: 4,
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
      paddingHorizontal: 4,
    },
    reactionItemContainer: {
      marginBottom: 8,
    },
    speechBubbleContainer: {
      position: "relative",
      zIndex: 1,
      marginBottom: 2,
    },
    reactionEmoji: {
      position: "absolute",
      // top value now dynamically set in component (35 for hasTail=true, -15 for hasTail=false)
      fontSize: 30,
      padding: 5,
      zIndex: 100,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
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
      marginBottom: 16,
      marginTop: 4,
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
      marginTop: 1,
      paddingRight: 16,
      paddingBottom: 2,
      fontWeight: "500",
    },
    subtitle: {
      fontSize: 16,
      color: colors.secondary,
      lineHeight: 24,
      paddingHorizontal: 4,
    },
    contentContainer: {
      paddingBottom: 16,
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
      paddingVertical: 48,
      paddingHorizontal: 32,
      marginTop: 20,
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
      marginTop: 8,
      marginBottom: 4,
      paddingHorizontal: 16,
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
    // Jump to passage modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      marginHorizontal: 32,
      maxWidth: 400,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 16,
      color: colors.secondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    modalButtonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalButtonPrimary: {
      backgroundColor: '#007AFF',
    },
    modalButtonSecondary: {
      backgroundColor: colors.border,
    },
    modalButtonDanger: {
      backgroundColor: '#FF3B30',
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    modalButtonTextSecondary: {
      color: colors.text,
    },
    // Filter interface styles
    filterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      marginTop: 4,
      paddingHorizontal: 4,
    },
    filterHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    filterHeaderText: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.3,
      marginRight: 8,
    },
    activeFilterBadge: {
      backgroundColor: '#007AFF',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      minWidth: 20,
      alignItems: 'center',
    },
    activeFilterText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: '#E3F2FD',
      borderColor: '#007AFF',
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginLeft: 4,
    },
    filterButtonTextActive: {
      color: '#007AFF',
    },
    // Filter panel styles
    filterPanel: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
    },
    filterPanelContent: {
      backgroundColor: colors.background,
      flex: 1,
      paddingTop: 60, // Account for status bar
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    filterPanelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterPanelTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    clearAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.card,
    },
    clearAllText: {
      fontSize: 14,
      color: '#007AFF',
      fontWeight: '500',
    },
    filterSection: {
      marginBottom: 24,
    },
    filterSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    filterOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    filterCheckbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.border,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterCheckboxActive: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
    },
    filterOptionText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    sourceColorOption: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    sourceColorDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    applyButton: {
      backgroundColor: '#007AFF',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 20,
    },
    applyButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
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
  const { width: screenWidth } = useWindowDimensions()
  const isLargeScreen = screenWidth > 768
  const { colors } = useAppSettings()
  const styles = useMemo(() => createStyles(isLargeScreen, colors), [isLargeScreen, colors])
  const { updateSegmentId } = useAppContext()
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [reactions, setReactions] = useState<EmojiReaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [activeFilters, setActiveFilters] = useState<{
    testament: string[]
    sourceColor: string[]
    sourceName: string[]
    book: string[]
  }>({
    testament: [],
    sourceColor: [],
    sourceName: [],
    book: []
  })
  const { t } = useTranslation()

  // Jump to passage modal state
  const [showJumpModal, setShowJumpModal] = useState(false)
  const [selectedReaction, setSelectedReaction] = useState<EmojiReaction | null>(null)

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const modalScaleAnim = useRef(new Animated.Value(0)).current
  const modalOpacityAnim = useRef(new Animated.Value(0)).current
  const filterPanelAnim = useRef(new Animated.Value(-300)).current
  const filterOpacityAnim = useRef(new Animated.Value(0)).current

  // Get color for source color filter
  const getSourceColorDisplay = (color: string) => {
    const colorMap: { [key: string]: { bg: string, text: string } } = {
      'black': { bg: '#2C2C2E', text: 'Narrator' },
      'red': { bg: '#FF3B30', text: 'God/Jesus' },
      'green': { bg: '#30D158', text: 'Main Speaker' },
      'blue': { bg: '#007AFF', text: 'Other Speakers' }
    }
    return colorMap[color] || { bg: '#8E8E93', text: color }
  }

  // Get all possible speaker types (always show all 4)
  const getAllSpeakerTypes = () => [
    { color: 'black', display: getSourceColorDisplay('black') },
    { color: 'red', display: getSourceColorDisplay('red') },
    { color: 'green', display: getSourceColorDisplay('green') },
    { color: 'blue', display: getSourceColorDisplay('blue') }
  ]

  useEffect(() => {
    if (selectedEmoji) {
      // Reset animations
      fadeAnim.setValue(0)
      slideAnim.setValue(30)

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
        // Filter out any invalid data
        const validReactions = emojiData.filter(item => 
          item && item.segmentID && item.blockID && item.emoji
        )
        setReactions(validReactions)
      } catch (error) {
        console.error("Error loading emojis:", error)
        setReactions([])
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

  // Get dynamic filter options based on saved reactions
  const getFilterOptions = useMemo(() => {
    const sourceNameOptions = new Set<string>()
    const bookOptions = new Set<string>()

    reactions.forEach(reaction => {
      // Get segment reference to determine testament and book
      if (reaction && reaction.segmentID && reaction.blockData?.source?.sourceName) {
        const segmentRef = getSegmentReference(reaction.segmentID)
        const book = segmentRef.split(' ')[0] // Extract book abbreviation
        
        sourceNameOptions.add(reaction.blockData.source.sourceName)
        bookOptions.add(book)
      }
    })

    return {
      testament: ['Old Testament', 'New Testament'], // Always show both
      sourceColor: getAllSpeakerTypes().map(type => type.color), // Always show all 4 types
      sourceName: Array.from(sourceNameOptions).sort(), // Alphabetical
      book: Array.from(bookOptions).sort() // Alphabetical
    }
  }, [reactions])

  // Enhanced filter function
  const getFilteredReactions = () => {
    let filteredReactions = reactions;
    
    // Apply search query filter
    if (searchQuery.trim() !== "") {
      filteredReactions = filteredReactions.filter((reaction) => {
        if (!reaction || !reaction.segmentID || !reaction.blockData) return false;
        
        const reference = getSegmentReference(reaction.segmentID).toLowerCase();
        const blockTexts = reaction.blockData.children
          ?.flatMap(inline => inline.children || [])
          ?.map(leaf => leaf.text || "")
          ?.join(" ") || "";
        const blockText = blockTexts.toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return reference.includes(query) || blockText.includes(query);
      });
    }

    // Apply active filters
    if (activeFilters.testament.length > 0) {
      filteredReactions = filteredReactions.filter(reaction => {
        const segmentRef = getSegmentReference(reaction.segmentID)
        const book = segmentRef.split(' ')[0]
        const oldTestamentBooks = ['Gen', 'Exo', 'Lev', 'Num', 'Deu', 'Jos', 'Jdg', 'Rut', '1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch', 'Ezr', 'Neh', 'Est', 'Job', 'Psa', 'Pro', 'Ecc', 'SoS', 'Isa', 'Jer', 'Lam', 'Eze', 'Dan', 'Hos', 'Joe', 'Amo', 'Oba', 'Jon', 'Mic', 'Nah', 'Hab', 'Zep', 'Hag', 'Zec', 'Mal']
        const testament = oldTestamentBooks.includes(book) ? 'Old Testament' : 'New Testament'
        return activeFilters.testament.includes(testament)
      })
    }

    if (activeFilters.sourceColor.length > 0) {
      filteredReactions = filteredReactions.filter(reaction => 
        reaction?.blockData?.source?.color && 
        activeFilters.sourceColor.includes(reaction.blockData.source.color)
      )
    }

    if (activeFilters.sourceName.length > 0) {
      filteredReactions = filteredReactions.filter(reaction => 
        reaction?.blockData?.source?.sourceName && 
        activeFilters.sourceName.includes(reaction.blockData.source.sourceName)
      )
    }

    if (activeFilters.book.length > 0) {
      filteredReactions = filteredReactions.filter(reaction => {
        const segmentRef = getSegmentReference(reaction.segmentID)
        const book = segmentRef.split(' ')[0]
        return activeFilters.book.includes(book)
      })
    }
    
    // Filter by emoji type if selected
    if (selectedEmoji) {
      filteredReactions = filteredReactions.filter((r) => r.emoji === selectedEmoji);
    }
    
    // Sort by most recent
    return sortReactionsByRecent(filteredReactions);
  }

  // Toggle filter panel
  const toggleFilterPanel = () => {
    if (showFilterPanel) {
      // Close panel
      Animated.parallel([
        Animated.timing(filterPanelAnim, {
          toValue: -300,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(filterOpacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setShowFilterPanel(false))
    } else {
      // Open panel
      setShowFilterPanel(true)
      Animated.parallel([
        Animated.timing(filterPanelAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(filterOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }

  // Toggle filter option
  const toggleFilter = (category: keyof typeof activeFilters, value: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev }
      const currentValues = newFilters[category]
      
      if (currentValues.includes(value)) {
        newFilters[category] = currentValues.filter(v => v !== value)
      } else {
        newFilters[category] = [...currentValues, value]
      }
      
      return newFilters
    })
  }

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters({
      testament: [],
      sourceColor: [],
      sourceName: [],
      book: []
    })
  }

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.values(activeFilters).flat().length
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

  const handleLongPress = useCallback((reaction: EmojiReaction) => {
    // Reset modal animations first
    modalScaleAnim.setValue(0);
    modalOpacityAnim.setValue(0);
    
    // Haptic feedback for premium feel
    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        // Haptics not available
      }
    }
    
    setSelectedReaction(reaction);
    setShowJumpModal(true);
    
    // Animate modal entrance
    Animated.parallel([
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [modalScaleAnim, modalOpacityAnim]);

  const handleJumpToPassage = useCallback(() => {
    if (!selectedReaction) return;
    
    // Close modal with animation
    Animated.parallel([
      Animated.spring(modalScaleAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowJumpModal(false);
      setSelectedReaction(null);
      // Reset animations
      modalScaleAnim.setValue(0);
      modalOpacityAnim.setValue(0);
      
      // Navigate to the segment with correct pathname and params format
      router.push({
        pathname: "/[segment]" as const,
        params: {
          segment: `ENG-NLT-${selectedReaction.segmentID}`,
        }
      });
    });
  }, [selectedReaction, router, modalScaleAnim, modalOpacityAnim]);

  const handleDeleteReaction = useCallback(() => {
    if (!selectedReaction) return;
    
    Alert.alert(
      "Remove Emoji",
      "Are you sure you want to remove this emoji reaction?",
      [
      {
          text: "Cancel",
        style: "cancel",
      },
      {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteEmoji(selectedReaction.segmentID, selectedReaction.blockID);
              
              // Close modal and refresh
              setShowJumpModal(false);
              setSelectedReaction(null);
              setRefreshTrigger((prev) => prev + 1);
              
              // Reset modal animations
              modalScaleAnim.setValue(0);
              modalOpacityAnim.setValue(0);
            } catch (error) {
              console.error('Error deleting emoji:', error);
            }
          },
        },
      ]
    );
  }, [selectedReaction, modalScaleAnim, modalOpacityAnim]);

  const handleCloseModal = useCallback(() => {
    Animated.parallel([
      Animated.spring(modalScaleAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowJumpModal(false);
      setSelectedReaction(null);
      // Ensure animations are fully reset
      modalScaleAnim.setValue(0);
      modalOpacityAnim.setValue(0);
    });
  }, [modalScaleAnim, modalOpacityAnim]);

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
        <View style={styles.welcomeTitleRow}>
          <View style={styles.welcomeTitleContainer}>
        <Text style={styles.welcomeTitle}>{t("UI.emojiPage.title")}</Text>
        <Text style={styles.welcomeText}>{t("UI.emojiPage.subtitle")}</Text>
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        {showSearch && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search reactions by verse or content..."
              placeholderTextColor={colors.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery.trim() !== '' && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close" size={16} color={colors.secondary} />
              </TouchableOpacity>
            )}
          </View>
        )}
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
        <View style={[styles.filterHeader, { marginTop: 8 }]}>
          <View style={styles.filterHeaderLeft}>
            <Text style={styles.filterHeaderText}>
              {filteredReactions.length} {filteredReactions.length === 1 ? 'Reaction' : 'Reactions'}
            </Text>
            {getActiveFilterCount() > 0 && (
              <View style={styles.activeFilterBadge}>
                <Text style={styles.activeFilterText}>{getActiveFilterCount()}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.filterButton, getActiveFilterCount() > 0 && styles.filterButtonActive]}
            onPress={toggleFilterPanel}
          >
            <Ionicons 
              name="options-outline" 
              size={20} 
              color={getActiveFilterCount() > 0 ? '#007AFF' : colors.text} 
            />
            <Text style={[
              styles.filterButtonText, 
              getActiveFilterCount() > 0 && styles.filterButtonTextActive
            ]}>
              Filter
            </Text>
          </TouchableOpacity>
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
      
      // Apply color-based alignment logic
      const speakerColor = blockData.source.color;
      
      // ONLY BLACK (narrator) on left side, ALL OTHER COLORS (red, green, blue) on right side
      const isLeftSide = speakerColor === "black";
      const emojiAlignment = isLeftSide ? { left: 10 } : { right: 10 };
      
      // Dynamic height positioning - same logic as main reading view
      // Since all bubbles in Reading-emoji page have hasTail={true}, use 35
      const emojiTopOffset = 25; // hasTail is always true here

      return (
        <View style={styles.reactionItemContainer}>
          <View style={styles.speechBubbleContainer}>
            <BibleBlockComponent 
              block={blockData} 
              bIndex={index} 
              toRead={false} 
              hasTail={true} 
              disableEmojiHandler={true}
              onLongPress={(block, blockIndex) => {
                // Use our custom jump modal instead of EmojiHandler
                handleLongPress(reaction);
              }}
            />
            <Text 
              style={[styles.reactionEmoji, { top: emojiTopOffset }, emojiAlignment]}
              pointerEvents="none"
            >
              {reaction.emoji}
            </Text>
          </View>
          <Text style={styles.referenceText}>{getSegmentReference(reaction.segmentID)}</Text>
        </View>
      )
    } catch (error) {
      console.error("Error parsing blockData:", error)
      return null
    }
  }

  // Premium Jump to Passage Modal Component
  const renderJumpToPassageModal = () => (
    <Modal
      visible={showJumpModal}
      transparent={true}
      animationType="none"
      onRequestClose={handleCloseModal}
    >
      <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: modalScaleAnim }],
              opacity: modalOpacityAnim,
            },
          ]}
        >
          <Text style={styles.modalTitle}>Jump to Passage</Text>
          <Text style={styles.modalSubtitle}>
            {selectedReaction ? `Go to ${getSegmentReference(selectedReaction.segmentID)} where you added this ${selectedReaction.emoji} reaction` : ''}
          </Text>
          
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={handleDeleteReaction}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>Remove</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleJumpToPassage}
            >
              <Text style={styles.modalButtonText}>Go to Passage</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );

  // Premium Filter Panel Component
  const renderFilterPanel = () => (
    <Modal
      visible={showFilterPanel}
      transparent={false}
      animationType="slide"
      onRequestClose={toggleFilterPanel}
    >
      <View style={styles.filterPanelContent}>
        <View style={styles.filterPanelHeader}>
          <Text style={styles.filterPanelTitle}>Filter Reactions</Text>
          <TouchableOpacity style={styles.clearAllButton} onPress={clearAllFilters}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* Testament Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Testament</Text>
            {getFilterOptions.testament.map(testament => (
              <TouchableOpacity
                key={testament}
                style={styles.filterOption}
                onPress={() => toggleFilter('testament', testament)}
              >
                <View style={[
                  styles.filterCheckbox,
                  activeFilters.testament.includes(testament) && styles.filterCheckboxActive
                ]}>
                  {activeFilters.testament.includes(testament) && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
                <Text style={styles.filterOptionText}>{testament}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Source Color Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Speaker Type</Text>
            {getAllSpeakerTypes().map(({ color, display }) => (
              <TouchableOpacity
                key={color}
                style={styles.filterOption}
                onPress={() => toggleFilter('sourceColor', color)}
              >
                <View style={[
                  styles.filterCheckbox,
                  activeFilters.sourceColor.includes(color) && styles.filterCheckboxActive
                ]}>
                  {activeFilters.sourceColor.includes(color) && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
                <View style={styles.sourceColorOption}>
                  <View style={[styles.sourceColorDot, { backgroundColor: display.bg }]} />
                  <Text style={styles.filterOptionText}>{display.text}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Source Name Filter */}
          {getFilterOptions.sourceName.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Speaker</Text>
              {getFilterOptions.sourceName.map(sourceName => (
                <TouchableOpacity
                  key={sourceName}
                  style={styles.filterOption}
                  onPress={() => toggleFilter('sourceName', sourceName)}
                >
                  <View style={[
                    styles.filterCheckbox,
                    activeFilters.sourceName.includes(sourceName) && styles.filterCheckboxActive
                  ]}>
                    {activeFilters.sourceName.includes(sourceName) && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <Text style={styles.filterOptionText}>{sourceName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Book Filter */}
          {getFilterOptions.book.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Book</Text>
              {getFilterOptions.book.map(book => (
                <TouchableOpacity
                  key={book}
                  style={styles.filterOption}
                  onPress={() => toggleFilter('book', book)}
                >
                  <View style={[
                    styles.filterCheckbox,
                    activeFilters.book.includes(book) && styles.filterCheckboxActive
                  ]}>
                    {activeFilters.book.includes(book) && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <Text style={styles.filterOptionText}>{book}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Apply Button */}
        <TouchableOpacity
          style={styles.applyButton}
          onPress={toggleFilterPanel}
        >
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        style={styles.content}
        data={filteredReactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id ? item.id.toString() : `${item.segmentID}-${item.blockID}`}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.contentContainer}
        refreshing={isLoading}
        onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        removeClippedSubviews={false}
      />
      
      {/* Premium Jump to Passage Modal */}
      {renderJumpToPassageModal()}
      
      {/* Premium Filter Panel */}
      {renderFilterPanel()}
    </SafeAreaView>
  )
}

export default ReadingEmoji
