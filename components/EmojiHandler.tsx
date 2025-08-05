import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Pressable, Text, StyleSheet, Modal, Platform, TouchableOpacity, useWindowDimensions } from 'react-native';
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
  
  // Double tap handling
  const lastTapRef = useRef(0);
  const doubleTapDelay = 300; // milliseconds
  
  // Emoji picker dimensions
  const [pickerWidth, setPickerWidth] = useState(240); // Default width

  const blockId = `${blockIndex}-${block.source?.sourceName || 'unknown'}`;

  // Debug: Log screen dimensions
  useEffect(() => {
    console.log('🔍 [EmojiHandler] Screen dimensions:', { screenWidth, screenHeight });
  }, []);

  // Calculate centered position based on measured picker width
  const getCenteredPosition = useCallback((pageY: number) => {
    const centerX = (screenWidth - pickerWidth) / 2;
    const adjustedY = Math.max(100, Math.min(pageY - 40, screenHeight - 200));
    console.log('🔍 [EmojiHandler] Centering calculation:', { 
      screenWidth, 
      pickerWidth, 
      centerX, 
      pageY, 
      adjustedY 
    });
    return { x: centerX, y: adjustedY };
  }, [pickerWidth]);
  
  // Color-based alignment logic
  const color = block.source?.color || 'black';
  
  // ONLY BLACK (narrator) on left side, ALL OTHER COLORS (red, green, blue) on right side
  const isLeftSide = color === "black";
  const emojiAlignment = isLeftSide ? { left: 10 } : { right: 10 };
  
  // Adjust top positioning based on whether bubble has tail (source name)
  // When hasTail=true: bubble has source name above, so emoji positioned at standard height
  // When hasTail=false: consecutive bubbles need emoji positioned higher (smaller top value)
  const emojiTopOffset = hasTail ? 35 : -15;

  // Load existing emoji when component mounts
  useEffect(() => {
    const loadEmoji = async () => {
      try {
        const emoji = await getEmoji(segmentId, blockId);
        setExistingEmoji(emoji);
      } catch (error) {
        console.error('Error loading emoji:', error);
      }
    };
    loadEmoji();
  }, [segmentId, blockId, emojiActions]);

  // Debug: Log when showPicker state changes
  useEffect(() => {
    console.log('🔍 [EmojiHandler] showPicker state changed:', showPicker);
  }, [showPicker]);

  // Update position when picker width changes
  useEffect(() => {
    if (showPicker && pickerWidth > 0) {
      console.log('🔍 [EmojiHandler] Updating position due to width change:', { pickerWidth, currentPosition: pickerPosition });
      const centerX = (screenWidth - pickerWidth) / 2;
      const adjustedY = Math.max(100, Math.min(pickerPosition.y, screenHeight - 200));
      console.log('🔍 [EmojiHandler] New centered position:', { centerX, adjustedY });
      setPickerPosition({ x: centerX, y: adjustedY });
    }
  }, [pickerWidth, showPicker]);

  const handleLongPress = useCallback((event: any) => {
    console.log('🔍 [EmojiHandler] handleLongPress triggered:', { 
      blockIndex, 
      sourceName: block.source?.sourceName,
      color: block.source?.color,
      segmentId,
      blockId 
    });
    
    // Get tap position for better emoji picker positioning
    const { pageY } = event.nativeEvent;
    const position = getCenteredPosition(pageY);
    
    console.log('🔍 [EmojiHandler] Setting showPicker to true');
    setShowPicker(true);
    setPickerPosition(position);

    // Call parent's onLongPress if provided
    if (onLongPress) {
      console.log('🔍 [EmojiHandler] Calling parent onLongPress');
      onLongPress(block, blockIndex);
    }
  }, [block, blockIndex, onLongPress, segmentId, blockId, setShowPicker, setPickerPosition, getCenteredPosition]);

  const handleDoubleTap = useCallback(() => {
    console.log('🔍 [EmojiHandler] Double tap detected!');
    
    const position = getCenteredPosition(screenHeight / 2);
    setShowPicker(true);
    setPickerPosition(position);
  }, [setShowPicker, setPickerPosition, getCenteredPosition]);

  const handlePress = useCallback((event: any) => {
    console.log('🔍 [EmojiHandler] Press detected (not long press)');
    
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    
    if (timeDiff < doubleTapDelay) {
      // Double tap detected - get tap position
      const { pageY } = event.nativeEvent;
      const position = getCenteredPosition(pageY);
      
      console.log('🔍 [EmojiHandler] Double tap detected!');
      setShowPicker(true);
      setPickerPosition(position);
      lastTapRef.current = 0; // Reset to prevent triple tap
    } else {
      // Single tap - store timestamp for potential double tap
      lastTapRef.current = now;
    }
  }, [handleDoubleTap, doubleTapDelay, getCenteredPosition]);

  const handleEmojiSelect = useCallback(async (emoji: string) => {
    try {
      await addEmoji(segmentId, blockId, block, emoji);
      setExistingEmoji(emoji);
      setShowPicker(false);
      
      // Update context to trigger re-renders
      updateEmojiActions(emojiActions + 1);
    } catch (error) {
      console.error('Error adding emoji:', error);
    }
  }, [segmentId, blockId, block, updateEmojiActions]);

  const handleEmojiDelete = useCallback(async () => {
    try {
      await deleteEmoji(segmentId, blockId);
      setExistingEmoji(null);
      
      // Update context to trigger re-renders
      updateEmojiActions(emojiActions + 1);
    } catch (error) {
      console.error('Error deleting emoji:', error);
    }
  }, [segmentId, blockId, updateEmojiActions]);

  const handlePickerClose = useCallback(() => {
    setShowPicker(false);
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onLongPress={handleLongPress}
        onPress={handlePress}
        delayLongPress={1000}
        activeOpacity={0.8}
        style={styles.pressableArea}
      >
        {children}
      </TouchableOpacity>
      
      {/* DEBUG: Test button to manually trigger emoji picker */}
      {__DEV__ && (
        <Pressable
          onPress={() => {
            console.log('🔍 [EmojiHandler] Test button pressed');
            const position = getCenteredPosition(screenHeight / 2);
            setShowPicker(true);
            setPickerPosition(position);
          }}
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            width: 20,
            height: 20,
            backgroundColor: 'red',
            borderRadius: 10,
            zIndex: 1000,
          }}
        />
      )}
      
      {/* Emoji positioned using the working version's logic */}
      {existingEmoji && (
        <View style={[styles.reactionContainer, { top: emojiTopOffset }, emojiAlignment]}>
          <Pressable onPress={handleEmojiDelete}>
            <Text style={styles.reactionText}>{existingEmoji}</Text>
          </Pressable>
        </View>
      )}

      {/* Modal for emoji picker */}
      <Modal
        visible={showPicker}
        transparent={true}
        animationType="none"
        onRequestClose={handlePickerClose}
        onShow={() => {
          console.log('🔍 [EmojiHandler] Modal shown, showPicker:', showPicker);
        }}
      >
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          onClose={handlePickerClose}
          position={pickerPosition}
          onLayout={(width, height) => {
            console.log('🔍 [EmojiHandler] Picker layout measured:', { width, height });
            setPickerWidth(width);
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
  pressableArea: {
    // Ensure the pressable area covers the entire bubble
    flex: 1,
    width: '100%',
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