import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Pressable, Text, StyleSheet, Modal, Platform, TouchableOpacity, useWindowDimensions } from 'react-native';
import { LongPressGestureHandler, State, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { BibleBlock } from '@/types';
import { useAppContext } from '@/context/GlobalContext';
import { addEmoji, deleteEmoji, getEmoji } from '@/api/sqlite';
import EmojiPicker from './EmojiPicker';

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

const EmojiHandler: React.FC<EmojiHandlerProps> = ({
  block,
  blockIndex,
  children,
  hasTail,
  onLongPress
}) => {
  const { segmentId, emojiActions, updateEmojiActions } = useAppContext();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  const [existingEmoji, setExistingEmoji] = useState<string | null>(null);
  
  // Emoji picker dimensions with validation
  const [pickerWidth, setPickerWidth] = useState<number>(POSITIONING_CONSTANTS.DEFAULT_PICKER_WIDTH);
  
  // CRITICAL: Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // CRITICAL: Track gesture state to prevent multiple simultaneous gestures
  const gestureInProgressRef = useRef(false);

  const blockId = `${blockIndex}-${block.source?.sourceName || 'unknown'}`;

  // CRITICAL: Validate screen dimensions on mount and changes
  useEffect(() => {
    if (screenWidth < POSITIONING_CONSTANTS.MIN_SCREEN_WIDTH || screenHeight < POSITIONING_CONSTANTS.MIN_SCREEN_HEIGHT) {
      console.warn('🔍 [EmojiHandler] WARNING: Screen dimensions below minimum:', { screenWidth, screenHeight });
    }
  }, [screenWidth, screenHeight]);

  // CRITICAL: Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // CRITICAL: Enhanced position calculation with comprehensive validation
  const getCenteredPosition = useCallback((absoluteY: number) => {
    'worklet';
    
    // CRITICAL: Validate input parameters
    if (typeof absoluteY !== 'number' || isNaN(absoluteY)) {
      console.error('🔍 [EmojiHandler] ERROR: Invalid absoluteY:', absoluteY);
      // Fallback to center of screen
      const fallbackY = screenHeight / 2;
      const centerX = (screenWidth - POSITIONING_CONSTANTS.DEFAULT_PICKER_WIDTH) / 2;
      return { x: centerX, y: fallbackY };
    }
    
    // CRITICAL: Validate screen dimensions
    if (screenWidth <= 0 || screenHeight <= 0) {
      console.error('🔍 [EmojiHandler] ERROR: Invalid screen dimensions:', { screenWidth, screenHeight });
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
  
  // Color-based alignment logic
  const color = block.source?.color || 'black';
  
  // ONLY BLACK (narrator) on left side, ALL OTHER COLORS (red, green, blue) on right side
  const isLeftSide = color === "black";
  const emojiAlignment = isLeftSide ? { left: 10 } : { right: 10 };
  
  // Adjust top positioning based on whether bubble has tail (source name)
  // When hasTail=true: bubble has source name above, so emoji positioned at standard height
  // When hasTail=false: consecutive bubbles need emoji positioned higher (smaller top value)
  const emojiTopOffset = hasTail ? 35 : -15;

  // CRITICAL: Load existing emoji when component mounts
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const loadEmoji = async () => {
      try {
        if (!segmentId || !blockId) {
          console.warn('🔍 [EmojiHandler] Missing segmentId or blockId:', { segmentId, blockId });
          return;
        }
        
        const emoji = await getEmoji(segmentId, blockId);
        if (isMountedRef.current) {
          setExistingEmoji(emoji);
        }
      } catch (error) {
        console.error('🔍 [EmojiHandler] Error loading emoji:', error);
      }
    };
    loadEmoji();
  }, [segmentId, blockId]);

  // CRITICAL: Update emoji when emojiActions changes (for external updates)
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    if (emojiActions > 0) { // Only update if there have been emoji actions
      const loadEmoji = async () => {
        try {
          if (!segmentId || !blockId) return;
          
          const emoji = await getEmoji(segmentId, blockId);
          if (isMountedRef.current) {
            setExistingEmoji(emoji);
          }
        } catch (error) {
          console.error('🔍 [EmojiHandler] Error loading emoji from actions:', error);
        }
      };
      loadEmoji();
    }
  }, [emojiActions, segmentId, blockId]);

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
      console.error('🔍 [EmojiHandler] Error updating position from picker width:', error);
    }
  }, [pickerWidth, showPicker, screenWidth, screenHeight, pickerPosition.y]);

  // CRITICAL: Enhanced emoji selection with validation
  const handleEmojiSelect = useCallback(async (emoji: string) => {
    if (!isMountedRef.current) return;
    
    try {
      if (!segmentId || !blockId || !emoji) {
        console.error('🔍 [EmojiHandler] Missing required data for emoji selection:', { segmentId, blockId, emoji });
        return;
      }
      
      await addEmoji(segmentId, blockId, block, emoji);
      
      if (isMountedRef.current) {
        setExistingEmoji(emoji);
        setShowPicker(false);
        
        // Update context to trigger re-renders
        updateEmojiActions(emojiActions + 1);
      }
    } catch (error) {
      console.error('🔍 [EmojiHandler] Error adding emoji:', error);
    }
  }, [segmentId, blockId, block, updateEmojiActions, emojiActions]);

  // CRITICAL: Enhanced emoji deletion with validation
  const handleEmojiDelete = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      if (!segmentId || !blockId) {
        console.error('🔍 [EmojiHandler] Missing required data for emoji deletion:', { segmentId, blockId });
        return;
      }
      
      await deleteEmoji(segmentId, blockId);
      
      if (isMountedRef.current) {
        setExistingEmoji(null);
        
        // Update context to trigger re-renders
        updateEmojiActions(emojiActions + 1);
      }
    } catch (error) {
      console.error('🔍 [EmojiHandler] Error deleting emoji:', error);
    }
  }, [segmentId, blockId, updateEmojiActions, emojiActions]);

  // CRITICAL: Enhanced picker close with validation
  const handlePickerClose = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setShowPicker(false);
    gestureInProgressRef.current = false;
  }, []);

  // CRITICAL: Enhanced gesture handler with comprehensive validation
  const handleGestureTrigger = useCallback((event: any, gestureType: 'doubleTap' | 'longPress') => {
    'worklet';
    
    // CRITICAL: Validate event object
    if (!event || typeof event.absoluteY !== 'number' || isNaN(event.absoluteY)) {
      console.error('🔍 [EmojiHandler] ERROR: Invalid gesture event:', event);
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

  // CRITICAL: Create double tap gesture with enhanced error handling
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart((event) => {
      handleGestureTrigger(event, 'doubleTap');
    });

  // CRITICAL: Create long press gesture with enhanced error handling
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart((event) => {
      handleGestureTrigger(event, 'longPress');
    });

  // CRITICAL: Combine gestures
  const gesture = Gesture.Race(doubleTapGesture, longPressGesture);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <TouchableOpacity
          activeOpacity={0.8}
        >
          {children}
        </TouchableOpacity>
      </GestureDetector>
      
      {/* CRITICAL: Emoji positioned using the working version's logic */}
      {existingEmoji && (
        <View style={[styles.reactionContainer, { top: emojiTopOffset }, emojiAlignment]}>
          <Pressable onPress={handleEmojiDelete}>
            <Text style={styles.reactionText}>{existingEmoji}</Text>
          </Pressable>
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
          onClose={handlePickerClose}
          position={pickerPosition}
          onLayout={(width, height) => {
            if (isMountedRef.current && width > 0) {
              setPickerWidth(width);
            }
          }}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  // Using the working version's styling for emoji positioning
  reactionContainer: {
    flexDirection: "row",
    padding: 5,
    position: "absolute",  // CRITICAL: Must be absolute
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 100,  // CRITICAL: High z-index to appear above bubble
  },
  reactionText: {
    fontSize: 30, // Match the working version size
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default EmojiHandler; 