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
    if (bubbleRef.current) {
      // Add a small delay to ensure the bubble is fully rendered
      setTimeout(() => {
        bubbleRef.current?.measure((x, y, width, height, pageX, pageY) => {
          const PICKER_WIDTH = 240; // Approximate picker width
          const PICKER_HEIGHT = 80; // Approximate picker height
          const MARGIN = 20; // Margin from screen edges
          const BUBBLE_SPACING = 15; // Space above the speech bubble

          // Center horizontally on the bubble
          let adjustedX = pageX + (width / 2) - (PICKER_WIDTH / 2);
          
          // Position above the speech bubble (not on top of it)
          let adjustedY = pageY - PICKER_HEIGHT - BUBBLE_SPACING;

          // Ensure picker stays within screen bounds horizontally
          if (adjustedX < MARGIN) {
            adjustedX = MARGIN;
          } else if (adjustedX + PICKER_WIDTH > screenWidth - MARGIN) {
            adjustedX = screenWidth - PICKER_WIDTH - MARGIN;
          }

          // Ensure picker stays within screen bounds vertically
          // If there's not enough space above, place it below the bubble
          if (adjustedY < MARGIN) {
            adjustedY = pageY + height + BUBBLE_SPACING; // Below the bubble if no room above
            
            // If it still doesn't fit below, center it vertically on screen
            if (adjustedY + PICKER_HEIGHT > screenHeight - MARGIN) {
              adjustedY = (screenHeight - PICKER_HEIGHT) / 2;
            }
          }

          setPickerPosition({ x: adjustedX, y: adjustedY });
          setShowPicker(true);
        });
      }, 50);
    }

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