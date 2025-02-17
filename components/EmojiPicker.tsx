import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const EMOJIS = ["❤️", "👍", "🤔", "🙏"];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
      <View style={styles.emojiContainer}>
        {EMOJIS.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            style={styles.emojiItem}
            onPress={() => onEmojiSelect(emoji)}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
