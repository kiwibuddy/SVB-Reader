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
  onLongPress?: (block: BibleBlock, index: number) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const EmojiHandler: React.FC<EmojiHandlerProps> = ({
  block,
  blockIndex,
  children,
  onLongPress
}) => {
  const { segmentId, emojiActions, updateEmojiActions } = useAppContext();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  const [existingEmoji, setExistingEmoji] = useState<string | null>(null);
  const bubbleRef = useRef<View>(null);

  const blockId = `${blockIndex}-${block.source.sourceName}`;

  // Determine if this is a right-aligned bubble (blue/green - Jesus, disciples, etc.)
  const isRightAligned = block.source.color === "blue" || block.source.color === "green";

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
        
        {/* Emoji badge positioned based on bubble alignment and 50% overlapping */}
        {existingEmoji && (
          <Pressable 
            style={[
              styles.emojiBadge,
              isRightAligned ? styles.emojiBadgeLeft : styles.emojiBadgeRight
            ]}
            onPress={handleEmojiDelete}
          >
            <Text style={styles.emojiBadgeText}>{existingEmoji}</Text>
          </Pressable>
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
  emojiBadge: {
    position: 'absolute',
    top: -8, // Position 50% above the speech bubble (half of badge height)
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  emojiBadgeRight: {
    right: 8, // For left-aligned bubbles (narrator, God) - position on right
  },
  emojiBadgeLeft: {
    left: 8, // For right-aligned bubbles (Jesus, disciples) - position on left
  },
  emojiBadgeText: {
    fontSize: 18,
  },
});

export default EmojiHandler; 