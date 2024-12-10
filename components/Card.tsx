import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

// Image mapping
const imageMap: { [key: string]: any } = {
  island: require('../assets/images/island.jpg'),
  // Add other images here
  // example: anotherImage: require('../assets/images/anotherImage.jpg'),
};

interface CardProps {
  title: string;
  description: string;
  image: string; // This should match the keys in imageMap
  highlightText?: string;
}

const Card: React.FC<CardProps> = ({
  title,
  description,
  image,
  highlightText,
}) => {
  return (
    <View style={styles.card}>
      <Image source={imageMap[image]} style={styles.image} />
      {highlightText && (
        <Text style={styles.highlight}>{highlightText}</Text>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 250,
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginHorizontal: 5,
  },
  image: {
    width: "100%",
    height: 100,
    borderRadius: 8,
  },
  highlight: {
    position: "absolute",
    top: 10,
    left: 10,
    color: "#FFD700", // yellow for highlighting text
    fontSize: 16,
    fontWeight: "bold",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  description: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
});

export default Card;
