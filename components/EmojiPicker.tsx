import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const EMOJIS = ["👍", "❤️", "🤔", "🙏"];

  const handleBackgroundPress = () => {
    console.log('Background pressed');
    onClose();
  };

  const handleEmojiPress = (emoji: string) => {
    console.log('Emoji selected:', emoji);
    onEmojiSelect(emoji);
  };

  return (
    <Pressable onPress={handleBackgroundPress} style={styles.backdrop}>
      <Pressable onPress={e => e.stopPropagation()} style={styles.container}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.emojiContainer}>
          {EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.emojiItem}
              onPress={() => handleEmojiPress(emoji)}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 6,
    minWidth: 200,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
  },
  closeText: {
    fontSize: 16,
    color: '#666',
  },
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  emojiItem: {
    padding: 8,
  },
  emojiText: {
    fontSize: 24,
  },
});

export default EmojiPicker;
