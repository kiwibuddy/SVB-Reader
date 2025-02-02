import React from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";

const EMOJIS = ["❤️", "👍", "🤔", "🙏"];

const EmojiPicker = ({ onEmojiSelect }: { onEmojiSelect: (emoji: string) => void }) => {
  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.emojiItem}
      onPress={() => onEmojiSelect(item)}
    >
      <Text style={styles.emojiText}>{`${item}`}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={EMOJIS}
        keyExtractor={(item) => item}
        renderItem={renderItem}
        numColumns={6}
        contentContainerStyle={styles.emojiList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: 250,
    height: 80,
    marginBottom: 10,
  },
  emojiList: {
    justifyContent: "center",
    alignItems: "center",
  },
  emojiItem: {
    alignItems: "center",
    marginHorizontal: 15,
    marginVertical: 10,
  },
  emojiText: {
    fontSize: 24,
  },
});

export default EmojiPicker;
