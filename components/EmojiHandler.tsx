import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Pressable, Text, StyleSheet, Dimensions, Modal, Platform } from 'react-native';
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const EmojiHandler: React.FC<EmojiHandlerProps> = ({
  block,
  blockIndex,
  children,
  hasTail,
  onLongPress
}) => {
  const { segmentId, emojiActions, updateEmojiActions } = useAppContext();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  const [existingEmoji, setExistingEmoji] = useState<string | null>(null);
  const bubbleRef = useRef<View>(null);

  const blockId = `${blockIndex}-${block.source.sourceName}`;

  // Color-based alignment logic
  const color = block.source.color;
  
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

  const handleLongPress = useCallback(() => {
    // Simple test first - show picker immediately
          setShowPicker(true);
    setPickerPosition({ x: screenWidth / 2 - 120, y: screenHeight / 2 - 40 });

    // Call parent's onLongPress if provided
    if (onLongPress) {
      onLongPress(block, blockIndex);
    }
  }, [block, blockIndex, onLongPress]);

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
      <View style={styles.bubbleContainer} ref={bubbleRef}>
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={500}
          style={styles.pressableArea}
        >
          {children}
        </Pressable>
        
        {/* Emoji positioned using the working version's logic */}
        {existingEmoji && (
          <View style={[styles.reactionContainer, { top: emojiTopOffset }, emojiAlignment]}>
            <Pressable onPress={handleEmojiDelete}>
              <Text style={styles.reactionText}>{existingEmoji}</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Modal for emoji picker */}
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
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  bubbleContainer: {
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