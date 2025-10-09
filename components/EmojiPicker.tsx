import React, { useEffect, useRef, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Platform,
  Easing,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onNoteSelect: () => void;
  onClose: () => void;
  position?: { x: number; y: number };
  onLayout?: (width: number, height: number) => void;
  existingNote?: string | null;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const EmojiPicker: React.FC<EmojiPickerProps> = ({ 
  onEmojiSelect,
  onNoteSelect,
  onClose, 
  position = { x: screenWidth / 2, y: screenHeight / 2 },
  onLayout,
  existingNote
}) => {
  
  const EMOJIS = useMemo(() => [
    { emoji: "❤️", label: "love", color: "#FF6B47" },
    { emoji: "👍", label: "agree", color: "#4ECDC4" },
    { emoji: "🤔", label: "reflecting", color: "#FFB347" },
    { emoji: "🙏", label: "praying", color: "#7B68EE" }
  ], []);

  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    onLayout?.(width, height);
  };

  const handleEmojiPress = (emoji: string) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        // Haptics not available, continue without feedback
      }
    }
    onEmojiSelect(emoji);
  };

  const handleNotePress = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        // Haptics not available, continue without feedback
      }
    }
    onNoteSelect();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <View style={[styles.container, { top: position.y, left: position.x }]} onLayout={handleLayout}>
      <View style={styles.pillContainer}>
        <View style={styles.emojiRow}>
          {EMOJIS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.emojiButton,
                { backgroundColor: `${item.color}15` }
              ]}
              onPress={() => handleEmojiPress(item.emoji)}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiText}>{item.emoji}</Text>
            </TouchableOpacity>
          ))}
          
          {/* Note button */}
          <TouchableOpacity
            style={[
              styles.emojiButton,
              styles.noteButton,
              { backgroundColor: existingNote ? '#FFB34715' : 'rgba(142, 142, 147, 0.08)' }
            ]}
            onPress={handleNotePress}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={existingNote ? "document-text" : "create-outline"} 
              size={24} 
              color={existingNote ? '#FFB347' : '#8E8E93'} 
            />
            {existingNote && (
              <View style={styles.noteBadge}>
                <View style={styles.noteBadgeDot} />
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Close button */}
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="close" size={16} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    // Add backdrop blur effect
    backdropFilter: 'blur(10px)',
  },
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    // Add subtle shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emojiText: {
    fontSize: 24,
    zIndex: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  noteButton: {
    position: 'relative',
  },
  noteBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  noteBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFB347',
  },
});

export default EmojiPicker;
