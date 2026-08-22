import React, { useState, useCallback, useEffect, useRef } from 'react';
import logger from '@/utils/logger';
import { View, Pressable, Text, StyleSheet, Modal, Platform, TouchableOpacity, useWindowDimensions, Alert } from 'react-native';
import { LongPressGestureHandler, State, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BibleBlock } from '@/types';
import { useSQLiteGlobalContext } from '@/context/SQLiteGlobalContext';
import { addEmoji, deleteEmoji, getEmoji } from '@/api/sqlite';
import EmojiPicker from './EmojiPicker';
import NoteInput from './NoteInput';
import ShareCard from '@/components/thread/ShareCard';
import { copyTurn, formatTurnCitation, shareTurn } from '@/utils/shareTurn';
import { hapticImpactMedium } from '@/utils/haptics';
import { localizeVoiceName } from '@/utils/localize';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { isLeftVoice, type Ink } from '@/utils/ink';

interface EmojiHandlerProps {
  block: BibleBlock;
  blockIndex: number;
  children: React.ReactNode;
  hasTail: boolean;
  onLongPress?: (block: BibleBlock, index: number) => void;
}

// CRITICAL: Constants for positioning - DO NOT CHANGE without thorough testing
const POSITIONING_CONSTANTS = {
  PICKER_OFFSET_Y: 40, // Offset from touch point to picker center
  MIN_Y: 50, // Minimum distance from top of screen
  MAX_Y_OFFSET: 150, // Distance from bottom of screen
  DEFAULT_PICKER_WIDTH: 240, // Fallback picker width
  MIN_SCREEN_WIDTH: 320, // Minimum expected screen width
  MIN_SCREEN_HEIGHT: 400, // Minimum expected screen height
} as const;

// Reaction badge sits on the bubble's top border: half above, half below.
const REACTION_EMOJI_SIZE = 22;
const REACTION_LINE_HEIGHT = 26;
const REACTION_TOP_OFFSET = -Math.round(REACTION_LINE_HEIGHT / 2);

// Platform-specific gesture configuration
const getPlatformGestureConfig = () => {
  if (Platform.OS === 'ios') {
    // iOS: Keep current optimized configuration
    return {
      doubleTapDelay: 200,        // iOS: Fast double tap recognition
      longPressDuration: 500,     // iOS: Standard long press duration
      maxDistance: 10,            // iOS: Tight gesture recognition
      gestureTimeout: 1000,       // iOS: Standard timeout
    };
  } else {
    // Android: Use more forgiving configuration for better compatibility
    return {
      doubleTapDelay: 300,        // Android: Slightly longer for better recognition
      longPressDuration: 600,     // Android: Longer duration for reliability
      maxDistance: 20,            // Android: More forgiving touch area
      gestureTimeout: 1500,       // Android: Longer timeout for stability
    };
  }
};

const EmojiHandler: React.FC<EmojiHandlerProps> = ({
  block,
  blockIndex,
  children,
  hasTail,
  onLongPress
}) => {
  const { state, updateSegmentId, updateEmojiActions } = useSQLiteGlobalContext();
  const { language, isDarkMode } = useSyncAppSettings();
  const shareCardRef = useRef<View>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [showPicker, setShowPicker] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  const [existingEmoji, setExistingEmoji] = useState<string | null>(null);
  const [existingNote, setExistingNote] = useState<string | null>(null);
  
  // Emoji picker dimensions with validation
  const [pickerWidth, setPickerWidth] = useState<number>(POSITIONING_CONSTANTS.DEFAULT_PICKER_WIDTH);
  
  // CRITICAL: Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // CRITICAL: Track gesture state to prevent multiple simultaneous gestures
  const gestureInProgressRef = useRef(false);
  
  // Platform-specific gesture configuration
  const gestureConfig = getPlatformGestureConfig();

  const blockId = `${blockIndex}-${block.source?.sourceName || 'unknown'}`;

  // CRITICAL: Validate screen dimensions on mount and changes
  useEffect(() => {
    if (screenWidth < POSITIONING_CONSTANTS.MIN_SCREEN_WIDTH || screenHeight < POSITIONING_CONSTANTS.MIN_SCREEN_HEIGHT) {
      logger.warn('🔍 [EmojiHandler] WARNING: Screen dimensions below minimum:', { screenWidth, screenHeight });
    }
  }, [screenWidth, screenHeight]);

  // CRITICAL: Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // CRITICAL: Reset state when segmentId changes to prevent ghost notes
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    // Reset all state when segmentId changes
    setExistingEmoji(null);
    setExistingNote(null);
    setShowPicker(false);
    setShowNoteInput(false);
    
    logger.info('🔍 [EmojiHandler] Reset state for new segment:', { segmentId: state.segmentId, blockId });
  }, [state.segmentId]);

  // CRITICAL: Enhanced position calculation with comprehensive validation
  const getCenteredPosition = useCallback((absoluteY: number) => {
    'worklet';
    
    // CRITICAL: Validate input parameters
    if (typeof absoluteY !== 'number' || isNaN(absoluteY)) {
      logger.error('🔍 [EmojiHandler] ERROR: Invalid absoluteY:', absoluteY);
      // Fallback to center of screen
      const fallbackY = screenHeight / 2;
      const centerX = (screenWidth - POSITIONING_CONSTANTS.DEFAULT_PICKER_WIDTH) / 2;
      return { x: centerX, y: fallbackY };
    }
    
    // CRITICAL: Validate screen dimensions
    if (screenWidth <= 0 || screenHeight <= 0) {
      logger.error('🔍 [EmojiHandler] ERROR: Invalid screen dimensions:', { screenWidth, screenHeight });
      return { x: 0, y: 0 };
    }
    
    // CRITICAL: Validate picker width
    const validPickerWidth = pickerWidth > 0 ? pickerWidth : POSITIONING_CONSTANTS.DEFAULT_PICKER_WIDTH;
    
    // Center horizontally based on screen width and picker width
    const centerX = Math.max(0, (screenWidth - validPickerWidth) / 2);
    
    // Position vertically based on touch position, with bounds checking
    let adjustedY = absoluteY - POSITIONING_CONSTANTS.PICKER_OFFSET_Y;
    
    // CRITICAL: Ensure picker doesn't go off the top of the screen
    const minY = POSITIONING_CONSTANTS.MIN_Y;
    if (adjustedY < minY) {
      adjustedY = minY;
    }
    
    // CRITICAL: Ensure picker doesn't go off the bottom of the screen
    const maxY = screenHeight - POSITIONING_CONSTANTS.MAX_Y_OFFSET;
    if (adjustedY > maxY) {
      adjustedY = maxY;
    }
    
    // CRITICAL: Final validation of calculated position
    const finalPosition = { x: centerX, y: adjustedY };
    
    return finalPosition;
  }, [screenWidth, pickerWidth, screenHeight]);
  
  const color = block.source?.color || 'black';
  const isLeftSide = isLeftVoice(color);
  // Speaker name sits above the bubble on the same side as the bubble —
  // put the emoji/note badge on the opposite top corner so they don't collide.
  const emojiAlignment = isLeftSide ? { right: -6 } : { left: -6 };

  // CRITICAL: Load existing emoji and note when component mounts
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const loadReaction = async () => {
      try {
        if (!state.segmentId || !blockId) {
          logger.warn('🔍 [EmojiHandler] Missing segmentId or blockId:', { segmentId: state.segmentId, blockId });
          // Reset state when missing data
          if (isMountedRef.current) {
            setExistingEmoji(null);
            setExistingNote(null);
          }
          return;
        }
        
        // Load both emoji and note from database
        const db = await import('@/api/database-manager').then(m => m.databaseManager.getDatabase());
        if (!db) return;
        const result = await db.getFirstAsync<{ emoji: string | null; note: string | null }>(
          `SELECT emoji, note FROM emojis WHERE segmentID = ? AND blockID = ?`,
          state.segmentId,
          blockId
        );
        
        if (isMountedRef.current) {
          setExistingEmoji(result?.emoji || null);
          setExistingNote(result?.note || null);
        }
      } catch (error) {
        logger.error('🔍 [EmojiHandler] Error loading reaction:', error);
        // Reset state on error
        if (isMountedRef.current) {
          setExistingEmoji(null);
          setExistingNote(null);
        }
      }
    };
    loadReaction();
  }, [state.segmentId, blockId]);

  // CRITICAL: Update reaction when emojiActions changes (for external updates)
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    if (state.emojiActions > 0) { // Only update if there have been emoji actions
      const loadReaction = async () => {
        try {
          if (!state.segmentId || !blockId) return;
          
          const db = await import('@/api/database-manager').then(m => m.databaseManager.getDatabase());
          if (!db) return;
          const result = await db.getFirstAsync<{ emoji: string | null; note: string | null }>(
            `SELECT emoji, note FROM emojis WHERE segmentID = ? AND blockID = ?`,
            state.segmentId,
            blockId
          );
          
          if (isMountedRef.current && result) {
            setExistingEmoji(result.emoji);
            setExistingNote(result.note);
          }
        } catch (error) {
          logger.error('🔍 [EmojiHandler] Error loading reaction from actions:', error);
        }
      };
      loadReaction();
    }
  }, [state.segmentId, blockId, state.emojiActions]);

  // Removed debug logging for showPicker state changes

  // CRITICAL: Update position when picker width changes with validation
  useEffect(() => {
    if (!isMountedRef.current || !showPicker || pickerWidth <= 0) return;
    
    try {
      const centerX = Math.max(0, (screenWidth - pickerWidth) / 2);
      const adjustedY = Math.max(POSITIONING_CONSTANTS.MIN_Y, 
        Math.min(pickerPosition.y, screenHeight - POSITIONING_CONSTANTS.MAX_Y_OFFSET));
      
      const newPosition = { x: centerX, y: adjustedY };
      setPickerPosition(newPosition);
    } catch (error) {
      logger.error('🔍 [EmojiHandler] Error updating position from picker width:', error);
    }
  }, [pickerWidth, showPicker, screenWidth, screenHeight, pickerPosition.y]);

  // CRITICAL: Enhanced emoji selection with validation
  const handleEmojiSelect = useCallback(async (emoji: string) => {
    if (!isMountedRef.current) return;
    
    try {
      if (!state.segmentId || !blockId || !emoji) {
        logger.error('🔍 [EmojiHandler] Missing required data for emoji selection:', { segmentId: state.segmentId, blockId, emoji });
        return;
      }
      
      await addEmoji(state.segmentId, blockId, block, emoji);
      
      if (isMountedRef.current) {
        setExistingEmoji(emoji);
        setShowPicker(false);
        
        // Update context to trigger re-renders
        updateEmojiActions(state.emojiActions + 1);
      }
    } catch (error) {
      logger.error('🔍 [EmojiHandler] Error adding emoji:', error);
    }
  }, [state.segmentId, blockId, block, state.emojiActions, updateEmojiActions]);

  // CRITICAL: Enhanced emoji deletion with confirmation and note preservation
  const handleEmojiDelete = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      if (!state.segmentId || !blockId) {
        logger.error('🔍 [EmojiHandler] Missing required data for emoji deletion:', { segmentId: state.segmentId, blockId });
        return;
      }
      
      // Show confirmation alert
      Alert.alert(
        'Remove Emoji',
        existingNote 
          ? 'Remove this emoji? Your note will be preserved.' 
          : 'Remove this emoji reaction?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                const db = await import('@/api/database-manager').then(m => m.databaseManager.getDatabase());
                
                // If there's a note, keep the reaction but remove the emoji
                if (existingNote && existingNote.trim().length > 0) {
                  await db.runAsync(`
                    UPDATE emojis 
                    SET emoji = NULL 
                    WHERE segmentID = ? AND blockID = ?
                  `, state.segmentId, blockId);
                } else {
                  // No note exists, delete the entire reaction
                  await deleteEmoji(state.segmentId, blockId);
                }
                
                if (isMountedRef.current) {
                  setExistingEmoji(null);
                  
                  // Update context to trigger re-renders
                  updateEmojiActions(state.emojiActions + 1);
                }
              } catch (error) {
                logger.error('🔍 [EmojiHandler] Error deleting emoji:', error);
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      logger.error('🔍 [EmojiHandler] Error in handleEmojiDelete:', error);
    }
  }, [state.segmentId, blockId, existingNote, state.emojiActions, updateEmojiActions]);

  // CRITICAL: Enhanced picker close with validation
  const handlePickerClose = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setShowPicker(false);
    gestureInProgressRef.current = false;
  }, []);

  // Handle note selection - show note input
  const handleNoteSelect = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setShowPicker(false);
    setShowNoteInput(true);
  }, []);

  // Save note (with or without emoji)
  const handleNoteSave = useCallback(async (noteText: string) => {
    if (!isMountedRef.current) return;
    
    try {
      if (!state.segmentId || !blockId) {
        logger.error('🔍 [EmojiHandler] Missing required data for note save:', { segmentId: state.segmentId, blockId });
        return;
      }
      
      const db = await import('@/api/database-manager').then(m => m.databaseManager.getDatabase());
      
      // Save note with existing emoji (or null if no emoji)
      await db.runAsync(`
        INSERT OR REPLACE INTO emojis (
          segmentID,
          blockID,
          blockData,
          emoji,
          note
        ) VALUES (?, ?, ?, ?, ?)
      `, state.segmentId, blockId, JSON.stringify(block), existingEmoji, noteText);
      
      if (isMountedRef.current) {
        setExistingNote(noteText);
        setShowNoteInput(false);
        
        // Update context to trigger re-renders
        updateEmojiActions(state.emojiActions + 1);
      }
    } catch (error) {
      logger.error('🔍 [EmojiHandler] Error saving note:', error);
    }
  }, [state.segmentId, blockId, block, existingEmoji, state.emojiActions, updateEmojiActions]);

  // Cancel note input
  const handleNoteCancel = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setShowNoteInput(false);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await hapticImpactMedium();
      await copyTurn(state.segmentId || '', block);
      setShowPicker(false);
    } catch (error) {
      logger.error('Copy turn failed:', error);
    }
  }, [block, state.segmentId]);

  const handleShare = useCallback(async () => {
    try {
      await hapticImpactMedium();
      let imageUri: string | null = null;
      try {
        const { captureRef } = require('react-native-view-shot');
        if (shareCardRef.current) {
          imageUri = await captureRef(shareCardRef, { format: 'png', quality: 1, result: 'tmpfile' });
        }
      } catch (error) {
        logger.warn('Share image capture unavailable; sharing text instead.', error);
      }
      await shareTurn({
        segmentId: state.segmentId || '',
        block,
        speaker: localizeVoiceName(block.source?.sourceName || '', language),
        imageUri,
      });
      setShowPicker(false);
    } catch (error) {
      logger.error('Share turn failed:', error);
    }
  }, [block, language, state.segmentId]);

  // CRITICAL: Enhanced gesture handler with comprehensive validation
  const handleGestureTrigger = useCallback((event: any, gestureType: 'doubleTap' | 'longPress') => {
    'worklet';
    
    // CRITICAL: Validate event object
    if (!event || typeof event.absoluteY !== 'number' || isNaN(event.absoluteY)) {
      logger.error('🔍 [EmojiHandler] ERROR: Invalid gesture event:', event);
      return;
    }
    
    // CRITICAL: Prevent multiple simultaneous gestures
    if (gestureInProgressRef.current) {
      return;
    }
    
    // CRITICAL: Calculate position with validation
    const position = getCenteredPosition(event.absoluteY);
    
    // CRITICAL: Set gesture in progress flag
    gestureInProgressRef.current = true;
    
    // CRITICAL: Update state with validation
    runOnJS(setShowPicker)(true);
    runOnJS(setPickerPosition)(position);
    
    // CRITICAL: Call parent's onLongPress if provided
    if (onLongPress) {
      runOnJS(onLongPress)(block, blockIndex);
    }
  }, [getCenteredPosition, onLongPress, block, blockIndex]);

  // CRITICAL: Create double tap gesture with platform-specific optimization
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDistance(gestureConfig.maxDistance)
    .onStart((event) => {
      handleGestureTrigger(event, 'doubleTap');
    });

  // CRITICAL: Create long press gesture with platform-specific optimization
  const longPressGesture = Gesture.LongPress()
    .minDuration(gestureConfig.longPressDuration)
    .maxDistance(gestureConfig.maxDistance)
    .onStart((event) => {
      handleGestureTrigger(event, 'longPress');
    });

  // CRITICAL: Combine gestures with platform-specific timeout
  const gesture = Gesture.Race(doubleTapGesture, longPressGesture);

  // CRITICAL: Reset gesture state after timeout
  useEffect(() => {
    if (gestureInProgressRef.current) {
      const timeout = setTimeout(() => {
        if (isMountedRef.current) {
          gestureInProgressRef.current = false;
        }
      }, gestureConfig.gestureTimeout);
      
      return () => clearTimeout(timeout);
    }
  }, [gestureInProgressRef.current, gestureConfig.gestureTimeout]);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <TouchableOpacity
          activeOpacity={0.8}
        >
          {children}
        </TouchableOpacity>
      </GestureDetector>
      
      {/* CRITICAL: Emoji and/or Note indicator positioned inline */}
      {(existingEmoji || existingNote) && (
        <View style={[styles.reactionContainer, { top: REACTION_TOP_OFFSET }, emojiAlignment]}>
          {existingEmoji && (
            <Pressable onPress={handleEmojiDelete}>
              <Text
                allowFontScaling={false}
                style={styles.reactionText}
              >
                {existingEmoji}
              </Text>
            </Pressable>
          )}
          {existingNote && (
            <Pressable onPress={() => setShowNoteInput(true)}>
              <View style={styles.noteIconContainer}>
                <Ionicons 
                  name="document-text" 
                  size={28} 
                  color="#666666" 
                />
              </View>
            </Pressable>
          )}
        </View>
      )}

      {/* CRITICAL: Modal for emoji picker with enhanced validation */}
      <Modal
        visible={showPicker}
        transparent={true}
        animationType="none"
        onRequestClose={handlePickerClose}
      >
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          onNoteSelect={handleNoteSelect}
          onShare={handleShare}
          onCopy={handleCopy}
          onClose={handlePickerClose}
          position={pickerPosition}
          existingNote={existingNote}
          onLayout={(width, height) => {
            if (isMountedRef.current && width > 0) {
              setPickerWidth(width);
            }
          }}
        />
      </Modal>

      {/* Modal for note input */}
      <Modal
        visible={showNoteInput}
        transparent={true}
        animationType="slide"
        onRequestClose={handleNoteCancel}
      >
        <View style={styles.noteInputContainer}>
          <NoteInput
            initialValue={existingNote || ''}
            onSave={handleNoteSave}
            onCancel={handleNoteCancel}
          />
        </View>
      </Modal>
      <View style={styles.shareCardHost} pointerEvents="none">
        <ShareCard
          ref={shareCardRef}
          speaker={localizeVoiceName(block.source?.sourceName || '', language)}
          text={formatTurnCitation(state.segmentId || '', block).text}
          citation={formatTurnCitation(state.segmentId || '', block).citation}
          ink={(block.source?.color || 'black') as Ink}
          isDarkMode={isDarkMode}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    overflow: 'visible',
  },
  reactionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    position: "absolute",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.5,
    zIndex: 100,
  },
  reactionText: {
    fontSize: REACTION_EMOJI_SIZE,
    lineHeight: REACTION_LINE_HEIGHT,
    textAlign: 'center',
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: 'center' },
      default: {},
    }),
  },
  noteIconContainer: {
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  noteInputContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  shareCardHost: {
    position: 'absolute',
    left: -4000,
    top: 0,
  },
});

export default EmojiHandler; 