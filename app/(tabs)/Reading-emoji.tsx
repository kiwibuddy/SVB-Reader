"use client"
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import logger from '@/utils/logger';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  Platform,
  Animated,
  Modal,
  ScrollView,
} from "react-native"
import { useRouter } from "expo-router"
import { useSQLiteGlobalContext } from "@/context/SQLiteGlobalContext"
import { useSyncAppSettings } from "@/context/SyncAppSettingsContext"
import { useTranslation } from "@/hooks/useTranslation"
import { getEmojis, deleteEmoji } from "@/api/sqlite"
import BibleBlockComponent from "@/components/Bible/Block"
import type { BibleBlock } from "@/types"
import type { EmojiReaction } from "@/types/index"
import { createStyles } from "@/components/reading-emoji/styles"
import type { SegmentTitle, ActiveFilters, ModalPosition, SourceColorDisplay, SpeakerType } from "@/components/reading-emoji/types"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import NoteModal from "@/components/NoteModal"
import { updateNoteText, deleteNote } from "@/api/note-functions"
import { trackFeature } from '@/services/analytics';

import SegmentTitles from '@/assets/data/SegmentTitles.json';
import Books from '@/assets/data/BookChapterList.json';




const EMOJI_TYPES = [
  { emoji: "❤️", label: "love", color: "#FF6B47", icon: "heart", backgroundColor: "#FF6B47" },
  { emoji: "👍", label: "agree", color: "#4ECDC4", icon: "thumbs-up", backgroundColor: "#4ECDC4" },
  { emoji: "🤔", label: "reflecting", color: "#FFB347", icon: "help-circle", backgroundColor: "#FFB347" },
  {
    emoji: "🙏",
    label: "praying",
    color: "#7B68EE",
    icon: "help-circle",
    backgroundColor: "#7B68EE",
  },
]

const getSegmentReference = (segmentID: string) => {
  const segment = SegmentTitles[segmentID as keyof typeof SegmentTitles] as SegmentTitle
  if (!segment) return ""
  return `${segment.book[0]}${segment.ref ? " " + segment.ref : ""}`
}


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
  
  // Option 2: Replace useWindowDimensions with Dimensions API and state management
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window')
    return { width, height }
  })
  
  const screenWidth = screenDimensions.width
  const isLargeScreen = screenWidth > 768
  const { colors } = useSyncAppSettings()
  const styles = useMemo(() => createStyles(isLargeScreen, colors), [isLargeScreen, colors])
  const { updateSegmentId } = useSQLiteGlobalContext()
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [reactions, setReactions] = useState<EmojiReaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    testament: [],
    sourceColor: [],
    sourceName: [],
    book: [],
    hasNotes: false
  })
  const { t } = useTranslation()

  // Jump to passage modal state
  const [showJumpModal, setShowJumpModal] = useState(false)
  const [selectedReaction, setSelectedReaction] = useState<EmojiReaction | null>(null)
  const [modalPosition, setModalPosition] = useState<ModalPosition | null>(null);

  // Note modal state
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedNoteReaction, setSelectedNoteReaction] = useState<EmojiReaction | null>(null)



  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const modalScaleAnim = useRef(new Animated.Value(0)).current
  const modalOpacityAnim = useRef(new Animated.Value(0)).current
  const filterPanelAnim = useRef(new Animated.Value(-300)).current
  const filterOpacityAnim = useRef(new Animated.Value(0)).current

  // Get color for source color filter
  const getSourceColorDisplay = (color: string): SourceColorDisplay => {
    const colorMap: { [key: string]: SourceColorDisplay } = {
      'black': { bg: '#2C2C2E', text: t('UI.filters.narrator') },
      'red': { bg: '#FF3B30', text: t('UI.filters.godJesus') },
      'green': { bg: '#30D158', text: t('UI.filters.mainSpeaker') },
      'blue': { bg: '#007AFF', text: t('UI.filters.otherSpeakers') }
    }
    return colorMap[color] || { bg: '#8E8E93', text: color }
  }

  // Get all possible speaker types (always show all 4)
  const getAllSpeakerTypes = (): SpeakerType[] => [
    { color: 'black', display: getSourceColorDisplay('black') },
    { color: 'red', display: getSourceColorDisplay('red') },
    { color: 'green', display: getSourceColorDisplay('green') },
    { color: 'blue', display: getSourceColorDisplay('blue') }
  ]

  // Listen for dimension changes with debounced updates
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      // Debounce dimension updates to prevent excessive re-renders
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setScreenDimensions({ width: window.width, height: window.height })
      }, 150) // 150ms debounce
    })
    
    return () => {
      clearTimeout(timeoutId)
      subscription?.remove()
    }
  }, [])
  
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
        
        // Filter out any invalid data with proper type checking and parse blockData
        const validReactions = emojiData.filter((item: any): item is EmojiReaction => {
          if (!item || 
              typeof item !== 'object' ||
              typeof item.segmentID !== 'string' || 
              typeof item.blockID !== 'string' || 
              !item.blockData) {
            return false;
          }
          
          // Allow emoji to be null (for note-only reactions) or a string
          if (item.emoji !== null && typeof item.emoji !== 'string') {
            return false;
          }
          
          // Must have either an emoji OR a note to be valid
          const hasEmoji = item.emoji && typeof item.emoji === 'string' && item.emoji.trim().length > 0;
          const hasNote = item.note && typeof item.note === 'string' && item.note.trim().length > 0;
          if (!hasEmoji && !hasNote) {
            return false;
          }
          
          // Parse blockData if it's a string
          if (typeof item.blockData === 'string') {
            try {
              item.blockData = JSON.parse(item.blockData);
            } catch (error) {
              return false;
            }
          }
          
          return true;
        }) as EmojiReaction[];
        
        setReactions(validReactions)
      } catch (error) {
        logger.error("Error loading emojis:", error)
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

  // Get dynamic filter options based on saved reactions with cascading logic
  const getFilterOptions = useMemo(() => {
    // Start with all reactions and apply cascading filters
    let filteredReactions = reactions;
    
    // Apply testament filter first (affects book options)
    if (activeFilters.testament.length > 0) {
      filteredReactions = filteredReactions.filter(reaction => {
        const segmentRef = getSegmentReference(reaction.segmentID)
        const book = segmentRef.split(' ')[0]
        const oldTestamentBooks = ['Gen', 'Exo', 'Lev', 'Num', 'Deu', 'Jos', 'Jdg', 'Rut', '1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch', 'Ezr', 'Neh', 'Est', 'Job', 'Psa', 'Pro', 'Ecc', 'SoS', 'Isa', 'Jer', 'Lam', 'Eze', 'Dan', 'Hos', 'Joe', 'Amo', 'Oba', 'Jon', 'Mic', 'Nah', 'Hab', 'Zep', 'Hag', 'Zec', 'Mal']
        const testament = oldTestamentBooks.includes(book) ? 'Old Testament' : 'New Testament'
        return activeFilters.testament.includes(testament)
      })
    }
    
    // Apply book filter (affects speaker options)
    if (activeFilters.book.length > 0) {
      filteredReactions = filteredReactions.filter(reaction => {
        const segmentRef = getSegmentReference(reaction.segmentID)
        const book = segmentRef.split(' ')[0]
        const bookFullName = (Books as any)[book]?.bookName || book
        return activeFilters.book.includes(bookFullName)
      })
    }
    
    // Apply speaker type filter (affects speaker name options)
    if (activeFilters.sourceColor.length > 0) {
      filteredReactions = filteredReactions.filter(reaction => 
        reaction?.blockData?.source?.color && 
        activeFilters.sourceColor.includes(reaction.blockData.source.color)
      )
    }
    
    // Apply speaker name filter (final filter)
    if (activeFilters.sourceName.length > 0) {
      filteredReactions = filteredReactions.filter(reaction => 
        reaction?.blockData?.source?.sourceName && 
        activeFilters.sourceName.includes(reaction.blockData.source.sourceName)
      )
    }
    
    // Generate options from the filtered reactions
    const testamentOptions = new Set<string>()
    const bookOptions = new Set<string>()
    const sourceColorOptions = new Set<string>()
    const sourceNameOptions = new Set<string>()
    
    filteredReactions.forEach(reaction => {
      if (reaction && reaction.segmentID && reaction.blockData?.source?.sourceName) {
        const segmentRef = getSegmentReference(reaction.segmentID)
        const book = segmentRef.split(' ')[0] // Extract book abbreviation
        
        // Add testament option
        const oldTestamentBooks = ['Gen', 'Exo', 'Lev', 'Num', 'Deu', 'Jos', 'Jdg', 'Rut', '1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch', 'Ezr', 'Neh', 'Est', 'Job', 'Psa', 'Pro', 'Ecc', 'SoS', 'Isa', 'Jer', 'Lam', 'Eze', 'Dan', 'Hos', 'Joe', 'Amo', 'Oba', 'Jon', 'Mic', 'Nah', 'Hab', 'Zep', 'Hag', 'Zec', 'Mal']
        const testament = oldTestamentBooks.includes(book) ? 'Old Testament' : 'New Testament'
        testamentOptions.add(testament)
        
        // Add book option (convert abbreviation to full name)
        if ((Books as any)[book]?.bookName) {
          bookOptions.add((Books as any)[book].bookName)
        } else {
          bookOptions.add(book) // Fallback to abbreviation if full name not found
        }
        
        // Add speaker type option
        if (reaction.blockData.source.color) {
          sourceColorOptions.add(reaction.blockData.source.color)
        }
        
        // Add speaker name option
        sourceNameOptions.add(reaction.blockData.source.sourceName)
      }
    })
    
    // For cascading logic, we need to show options based on what's available after applying previous filters
    // But we also need to show all possible options for the first filter in each category
    
    // Testament: Always show both options
    const testamentOptionsFinal = ['Old Testament', 'New Testament']
    
    // Book: Show books from filtered reactions, or all books if no testament filter
    const bookOptionsFinal = activeFilters.testament.length > 0 
      ? Array.from(bookOptions).sort()
      : Array.from(new Set(reactions.map(reaction => {
          const segmentRef = getSegmentReference(reaction.segmentID)
          const book = segmentRef.split(' ')[0]
          return (Books as any)[book]?.bookName || book
        }).filter(Boolean))).sort()
    
    // Speaker Type: Show types from filtered reactions, or all types if no previous filters
    const sourceColorOptionsFinal = (activeFilters.testament.length > 0 || activeFilters.book.length > 0)
      ? Array.from(sourceColorOptions).sort()
      : getAllSpeakerTypes().map(type => type.color)
    
    // Speaker Name: Show names from filtered reactions, or all names if no previous filters
    const sourceNameOptionsFinal = (activeFilters.testament.length > 0 || activeFilters.book.length > 0 || activeFilters.sourceColor.length > 0)
      ? Array.from(sourceNameOptions).sort()
      : Array.from(new Set(reactions
          .filter(reaction => reaction?.blockData?.source?.sourceName)
          .map(reaction => reaction.blockData.source!.sourceName)
        )).sort()
    

    
    return {
      testament: testamentOptionsFinal,
      book: bookOptionsFinal,
      sourceColor: sourceColorOptionsFinal,
      sourceName: sourceNameOptionsFinal
    }
  }, [reactions, activeFilters.testament, activeFilters.book, activeFilters.sourceColor, activeFilters.sourceName])

  // Enhanced filter function
  const getFilteredReactions = () => {
    let filteredReactions = reactions;
    
    // Apply search query filter
    if (searchQuery.trim() !== "") {
      filteredReactions = filteredReactions.filter((reaction) => {
        if (!reaction || !reaction.segmentID || !reaction.blockData) return false;
        
        const reference = getSegmentReference(reaction.segmentID).toLowerCase();
        const blockTexts = reaction.blockData.children
          ?.flatMap((inline: any) => inline.children || [])
          ?.map((leaf: any) => leaf.text || "")
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
        const bookFullName = (Books as any)[book]?.bookName || book
        return activeFilters.book.includes(bookFullName)
      })
    }

    // Filter by hasNotes
    if (activeFilters.hasNotes) {
      filteredReactions = filteredReactions.filter(reaction => 
        reaction.note && reaction.note.trim().length > 0
      )
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
  const toggleFilter = (category: keyof ActiveFilters, value: string) => {
    // Track filter usage
    trackFeature('emoji_filter_used', {
      filter_category: category,
      filter_value: value,
    });
    
    setActiveFilters(prev => {
      const newFilters = { ...prev }
      const currentValues = newFilters[category]
      
      // Handle boolean filters differently
      if (category === 'hasNotes') {
        newFilters[category] = !currentValues as boolean
      } else {
        // Handle array filters
        const arrayValues = currentValues as string[]
        if (arrayValues.includes(value)) {
          newFilters[category] = arrayValues.filter((v: string) => v !== value) as any
        } else {
          newFilters[category] = [...arrayValues, value] as any
        }
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
      book: [],
      hasNotes: false
    })
  }

  // Get active filter count
  const getActiveFilterCount = () => {
    const arrayFilters = [
      ...activeFilters.testament,
      ...activeFilters.sourceColor,
      ...activeFilters.sourceName,
      ...activeFilters.book
    ].length;
    const booleanFilters = activeFilters.hasNotes ? 1 : 0;
    return arrayFilters + booleanFilters;
  }

  // Replace existing filteredReactions with the new function
  const filteredReactions = getFilteredReactions()

  const getEmojiCount = (emojiType: string) => {
    // Use filteredReactions to respect current filters, but exclude emoji type filter
    // so we can show counts for all emoji types even when one is selected
    let reactionsToCount = reactions;
    
    // Apply all filters except emoji type filter
    if (searchQuery.trim() !== "") {
      reactionsToCount = reactionsToCount.filter((reaction) => {
        if (!reaction || !reaction.segmentID || !reaction.blockData) return false;
        
        const reference = getSegmentReference(reaction.segmentID).toLowerCase();
        const blockTexts = reaction.blockData.children
          ?.flatMap((inline: any) => inline.children || [])
          ?.map((leaf: any) => leaf.text || "")
          ?.join(" ") || "";
        const blockText = blockTexts.toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return reference.includes(query) || blockText.includes(query);
      });
    }

    // Apply active filters (except emoji type)
    if (activeFilters.testament.length > 0) {
      reactionsToCount = reactionsToCount.filter(reaction => {
        const segmentRef = getSegmentReference(reaction.segmentID)
        const book = segmentRef.split(' ')[0]
        const oldTestamentBooks = ['Gen', 'Exo', 'Lev', 'Num', 'Deu', 'Jos', 'Jdg', 'Rut', '1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch', 'Ezr', 'Neh', 'Est', 'Job', 'Psa', 'Pro', 'Ecc', 'SoS', 'Isa', 'Jer', 'Lam', 'Eze', 'Dan', 'Hos', 'Joe', 'Amo', 'Oba', 'Jon', 'Mic', 'Nah', 'Hab', 'Zep', 'Hag', 'Zec', 'Mal']
        const testament = oldTestamentBooks.includes(book) ? 'Old Testament' : 'New Testament'
        return activeFilters.testament.includes(testament)
      })
    }

    if (activeFilters.sourceColor.length > 0) {
      reactionsToCount = reactionsToCount.filter(reaction => 
        reaction?.blockData?.source?.color && 
        activeFilters.sourceColor.includes(reaction.blockData.source.color)
      )
    }

    if (activeFilters.sourceName.length > 0) {
      reactionsToCount = reactionsToCount.filter(reaction => 
        reaction?.blockData?.source?.sourceName && 
        activeFilters.sourceName.includes(reaction.blockData.source.sourceName)
      )
    }

    if (activeFilters.book.length > 0) {
      reactionsToCount = reactionsToCount.filter(reaction => {
        const segmentRef = getSegmentReference(reaction.segmentID)
        const book = segmentRef.split(' ')[0]
        const bookFullName = (Books as any)[book]?.bookName || book
        return activeFilters.book.includes(bookFullName)
      })
    }
    
    // Count the specific emoji type from the filtered reactions
    const count = reactionsToCount.filter((r) => r.emoji === emojiType).length;
    
    return count;
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

  const handleLongPress = useCallback(async (reaction: EmojiReaction, touchPosition?: ModalPosition) => {
    // Reset modal animations first
    modalScaleAnim.setValue(0);
    modalOpacityAnim.setValue(0);
    
    // Haptic feedback for premium feel
    if (Platform.OS === 'ios') {
      try {
        const Haptics = await import('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        // Haptics not available
      }
    }
    
    setSelectedReaction(reaction);
    setShowJumpModal(true);
    
    // If touch position is provided, use it for dynamic positioning
    if (touchPosition) {
      // Store touch position for modal positioning
      setModalPosition(touchPosition);
    }
    
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
    
    const hasEmoji = selectedReaction.emoji && selectedReaction.emoji.trim().length > 0;
    const hasNote = selectedReaction.note && selectedReaction.note.trim().length > 0;
    
    let title = "Remove Reaction";
    let message = "Are you sure you want to remove this reaction?";
    
    if (hasEmoji && hasNote) {
      title = "Remove Reaction";
      message = "This will remove both the emoji and note. Are you sure?";
    } else if (hasEmoji) {
      title = "Remove Emoji";
      message = "Are you sure you want to remove this emoji reaction?";
    } else if (hasNote) {
      title = "Remove Note";
      message = "Are you sure you want to remove this note?";
    }
    
    Alert.alert(
      title,
      message,
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
              logger.error('Error deleting reaction:', error);
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
      setModalPosition(null); // Reset modal position
      // Ensure animations are fully reset
      modalScaleAnim.setValue(0);
      modalOpacityAnim.setValue(0);
    });
  }, [modalScaleAnim, modalOpacityAnim]);

  // Handle note view
  const handleNoteView = useCallback((reaction: EmojiReaction) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      import('expo-haptics').then(Haptics => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }).catch(() => {});
    }
    
    setSelectedNoteReaction(reaction);
    setShowNoteModal(true);
  }, []);

  // Handle note edit
  const handleNoteEdit = useCallback(async (newNoteText: string) => {
    if (!selectedNoteReaction) return;
    
    try {
      await updateNoteText(selectedNoteReaction.segmentID, selectedNoteReaction.blockID, newNoteText);
      
      // Update local state
      setReactions(prev => prev.map(r => 
        r.id === selectedNoteReaction.id 
          ? { ...r, note: newNoteText }
          : r
      ));
      
      setShowNoteModal(false);
      setSelectedNoteReaction(null);
      
      // Show success feedback
      if (Platform.OS === 'ios') {
        import('expo-haptics').then(Haptics => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }).catch(() => {});
      }
    } catch (error) {
      logger.error('Error editing note:', error);
      Alert.alert('Error', 'Failed to update note. Please try again.');
    }
  }, [selectedNoteReaction]);

  // Handle note delete
  const handleNoteDelete = useCallback(async () => {
    if (!selectedNoteReaction) return;
    
    try {
      await deleteNote(selectedNoteReaction.segmentID, selectedNoteReaction.blockID);
      
      // Update local state - keep emoji if exists, else remove entire reaction
      setReactions(prev => {
        if (selectedNoteReaction.emoji) {
          // Keep reaction but clear note
          return prev.map(r => 
            r.id === selectedNoteReaction.id 
              ? { ...r, note: '' }
              : r
          );
        } else {
          // Remove entire reaction (note-only)
          return prev.filter(r => r.id !== selectedNoteReaction.id);
        }
      });
      
      setShowNoteModal(false);
      setSelectedNoteReaction(null);
      
      // Show success feedback
      if (Platform.OS === 'ios') {
        import('expo-haptics').then(Haptics => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }).catch(() => {});
      }
    } catch (error) {
      logger.error('Error deleting note:', error);
      Alert.alert('Error', 'Failed to delete note. Please try again.');
    }
  }, [selectedNoteReaction]);

  const handleEmojiTypeSelect = (emoji: string) => {
    if (selectedEmoji === emoji) {
      // Same emoji clicked - just close it
      setSelectedEmoji(null)
      setIsExpanded(false)
    } else {
      // Different emoji clicked - switch to it and reset expanded state
      setSelectedEmoji(emoji)
      setIsExpanded(false)
    }
  }

  const renderEmojiDetailCard = () => {
    if (!selectedEmoji) return null

    const emojiKey = getEmojiKey(selectedEmoji)
    const backgroundColor = getEmojiBackground(selectedEmoji)
    const count = getEmojiCount(selectedEmoji)

    return (
      <Animated.View style={[styles.emojiDetailContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.emojiDetailHeader}>
          <View style={[styles.emojiDetailIcon, { backgroundColor }]}>
            <Text style={{ fontSize: 24, color: "white" }}>{selectedEmoji}</Text>
          </View>
          <Text style={styles.emojiDetailTitle}>{t(`UI.emojiPage.emojiDescriptions.${emojiKey}.title`)}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedEmoji(null)}>
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.emojiDetailContent}>
          <Text style={styles.emojiDetailIntro}>{t(`UI.emojiPage.emojiDescriptions.${emojiKey}.intro`)}</Text>

          <TouchableOpacity
            style={[styles.expandButton, { borderTopColor: getEmojiColor(selectedEmoji) }]}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Text style={[styles.expandButtonText, { color: getEmojiColor(selectedEmoji) }]}>
              {isExpanded
                ? t("UI.emojiPage.tapToCollapse")
                : t("UI.emojiPage.tapToSeeSteps")}
            </Text>
            <Animated.View style={{
              transform: [{
                rotate: isExpanded ? '180deg' : '0deg'
              }]
            }}>
              <Ionicons
                name="chevron-down"
                size={20}
                color={getEmojiColor(selectedEmoji)}
              />
            </Animated.View>
          </TouchableOpacity>

          <Animated.View 
            style={[
              styles.stepsContainer,
              {
                opacity: isExpanded ? 1 : 0,
                maxHeight: isExpanded ? 1000 : 0,
                overflow: 'hidden'
              }
            ]}
          >
            {["1", "2", "3", "4", "5"].map((step) => {
              const stepKey = `UI.emojiPage.emojiDescriptions.${emojiKey}.steps.${step}`
              const descKey = `UI.emojiPage.emojiDescriptions.${emojiKey}.steps.${step}_desc`

              if (t(stepKey) !== stepKey) {
                return (
                  <View key={step} style={styles.stepRow}>
                    <View style={[styles.stepNumber, { backgroundColor: getEmojiColor(selectedEmoji) }]}>
                      <Text style={styles.stepNumberText}>{step}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepTitle, { color: getEmojiColor(selectedEmoji) }]}>{t(stepKey)}</Text>
                      <Text style={styles.stepDescription}>{t(descKey)}</Text>
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
          </Animated.View>
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
        </View>
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
            {getActiveFilterCount() > 0 && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearAllFilters}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={16} color="#007AFF" />
              </TouchableOpacity>
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
              {t('UI.emojiPage.filter')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {filteredReactions.length === 0 && !isLoading && (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            {selectedEmoji ? t('UI.emojiPage.noEmojiReactions', { emoji: selectedEmoji }) : t('UI.emojiPage.noReactions')}
          </Text>
        </View>
      )}

      {filteredReactions.length > 0 && <Text style={styles.longPressHint}>{t('UI.emojiPage.longPressHint')}</Text>}
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
      // Check what indicators to show
      const hasEmoji = reaction.emoji && reaction.emoji.trim().length > 0;
      const hasNote = reaction.note && reaction.note.trim().length > 0;
      
      // Adjust vertical position for note-only reactions
      const emojiTopOffset = hasEmoji ? 25 : 30; // Note-only needs more offset

      return (
        <View style={styles.reactionItemContainer}>
          <View style={styles.speechBubbleContainer}>
            <BibleBlockComponent 
              block={blockData} 
              bIndex={index} 
              toRead={false} 
              hasTail={true} 
              disableEmojiHandler={true}
              onLongPress={(block, blockIndex, touchPosition) => {
                // Use our custom jump modal instead of EmojiHandler
                handleLongPress(reaction, touchPosition);
              }}
            />
            
            {/* Indicator container - shows emoji and/or note icon */}
            <View style={[styles.indicatorContainer, { top: emojiTopOffset }, emojiAlignment]}>
              {hasEmoji && (
                <Text 
                  style={styles.reactionEmoji}
                  pointerEvents="none"
                >
                  {reaction.emoji}
                </Text>
              )}
              {hasNote && (
                <TouchableOpacity
                  onPress={() => handleNoteView(reaction)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.noteIconContainer}
                >
                  <Ionicons 
                    name="document-text" 
                    size={28} 
                    color="#666666" 
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text style={styles.referenceText}>{getSegmentReference(reaction.segmentID)}</Text>
        </View>
      )
    } catch (error) {
      logger.error("Error parsing blockData:", error)
      return null
    }
  }

  // Memoize the renderItem function
  const memoizedRenderItem = useCallback(({ item: reaction, index }: { item: EmojiReaction; index: number }) => {
    return renderItem({ item: reaction, index });
  }, [colors]); // Add colors dependency so it re-renders when theme changes

  // Memoize the keyExtractor function
  const keyExtractor = useCallback((item: EmojiReaction) => {
    return item.id ? item.id.toString() : `${item.segmentID}-${item.blockID}`;
  }, []);

  // Memoize the ListHeaderComponent
  const memoizedRenderHeader = useCallback(() => {
    return renderHeader();
  }, [reactions, activeFilters, selectedEmoji, refreshTrigger, colors]); // Add colors dependency

  // Always center modal on screen
  const getModalPosition = useCallback(() => {
    return { 
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    };
  }, []);

  // Premium Jump to Passage Modal Component
  const renderJumpToPassageModal = () => (
    <Modal
      visible={showJumpModal}
      transparent={true}
      animationType="none"
      onRequestClose={handleCloseModal}
    >
      <Pressable style={[styles.modalOverlay, getModalPosition()]} onPress={handleCloseModal}>
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
            {selectedReaction ? (
              selectedReaction.emoji 
                ? `Go to ${getSegmentReference(selectedReaction.segmentID)} where you added this ${selectedReaction.emoji} reaction`
                : `Go to ${getSegmentReference(selectedReaction.segmentID)} where you added this note`
            ) : ''}
          </Text>
          
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={handleDeleteReaction}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>Remove</Text>
            </TouchableOpacity>

            {selectedReaction && selectedReaction.note && selectedReaction.note.trim().length > 0 && (
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  handleCloseModal();
                  if (selectedReaction) {
                    setTimeout(() => handleNoteView(selectedReaction), 300);
                  }
                }}
              >
                <Ionicons name="document-text" size={16} color="#FFB347" />
                <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>View Note</Text>
              </TouchableOpacity>
            )}
            
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
          <Text style={styles.filterPanelTitle}>{t('UI.filters.filterReactions')}</Text>
          <View style={styles.filterPanelHeaderButtons}>
            <TouchableOpacity style={styles.clearAllButton} onPress={clearAllFilters}>
              <Text style={styles.clearAllText}>{t('UI.filters.clearAll')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.closeFilterButton} 
              onPress={toggleFilterPanel}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* Has Notes Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>{t('UI.filters.content')}</Text>
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() => setActiveFilters(prev => ({ ...prev, hasNotes: !prev.hasNotes }))}
            >
              <View style={[
                styles.filterCheckbox,
                activeFilters.hasNotes && styles.filterCheckboxActive
              ]}>
                {activeFilters.hasNotes && (
                  <Ionicons name="checkmark" size={14} color="white" />
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="document-text" size={18} color="#FFB347" />
                <Text style={styles.filterOptionText}>{t('UI.filters.hasNotes')}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Testament Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>{t('UI.filters.testament')}</Text>
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
                <Text style={styles.filterOptionText}>
                  {testament === 'Old Testament' ? t('UI.filters.oldTestament') : t('UI.filters.newTestament')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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

          {/* Speaker Type Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>{t('UI.filters.speakerType')}</Text>
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

          {/* Speaker Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>{t('UI.filters.speaker')}</Text>
            {getFilterOptions.sourceName.length > 0 ? (
              getFilterOptions.sourceName.map(sourceName => (
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
              ))
            ) : (
              <Text style={[styles.filterOptionText, { color: colors.secondary, fontStyle: 'italic' }]}>
                {t('UI.filters.noSpeakersAvailable')}
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Apply Button */}
        <TouchableOpacity
          style={styles.applyButton}
          onPress={toggleFilterPanel}
        >
          <Text style={styles.applyButtonText}>{t('UI.filters.applyFilters')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      
      <FlatList
        style={styles.content}
        data={filteredReactions}
        renderItem={memoizedRenderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={memoizedRenderHeader}
        contentContainerStyle={styles.contentContainer}
        refreshing={isLoading}
        onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={5}
      />
      
      {/* Premium Jump to Passage Modal */}
      {renderJumpToPassageModal()}
      
      {/* Premium Filter Panel */}
      {renderFilterPanel()}

      {/* Note Modal */}
      {selectedNoteReaction && (
        <NoteModal
          visible={showNoteModal}
          noteText={selectedNoteReaction.note || ''}
          emojiIcon={selectedNoteReaction.emoji}
          scriptureReference={getSegmentReference(selectedNoteReaction.segmentID)}
          scriptureText={(() => {
            try {
              const blockData = typeof selectedNoteReaction.blockData === 'string' 
                ? JSON.parse(selectedNoteReaction.blockData)
                : selectedNoteReaction.blockData;
              return blockData.children
                ?.flatMap((inline: any) => inline.children || [])
                ?.map((leaf: any) => leaf.text || '')
                ?.join(' ') || '';
            } catch {
              return '';
            }
          })()}
          onClose={() => {
            setShowNoteModal(false);
            setSelectedNoteReaction(null);
          }}
          onEdit={handleNoteEdit}
          onDelete={handleNoteDelete}
        />
      )}
    </SafeAreaView>
  )
}

export default ReadingEmoji
