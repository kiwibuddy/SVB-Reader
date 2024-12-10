import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Svg, Circle } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";


const BookItem = ({ title, completed, total }) => {
  const progress = (completed / total) * 100;

  return (
    <TouchableOpacity style={styles.bookItem}>
      <View style={styles.bookInfo}>
        {/* <ProgressCircle progress={progress} /> */}
        <View style={styles.textContainer}>
          <Text style={styles.bookTitle}>{title}</Text>
          <Text style={styles.storiesCount}>
            {completed}/{total} Stories
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const PlanScreen = () => {
  const categories = [
    { title: "Whole Bible", stories: 365 },
    { title: "Narrative", stories: 150 },
    { title: "Gospels", stories: 48 },
    { title: "Prophets", stories: 38 },
  ];

  const books = [
    { title: "Genesis", completed: 4, total: 18 },
    { title: "Exodus", completed: 14, total: 14 },
    { title: "Leviticus", completed: 1, total: 11 },
    { title: "Numbers", completed: 1, total: 13 },
    { title: "Deuteronomy", completed: 10, total: 12 },
    { title: "Joshua", completed: 7, total: 8 },
    { title: "Judges", completed: 0, total: 10 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Books of the Bible</Text>
      </View>

      <ScrollView horizontal style={styles.categoriesContainer}>
        {categories.map((category, index) => (
          <View key={index} style={styles.categoryItem}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <Text style={styles.categoryCount}>{category.stories} Stories</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView style={styles.booksList}>
        {books.map((book, index) => (
          <BookItem
            key={index}
            title={book.title}
            completed={book.completed}
            total={book.total}
          />
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.startButton}>
        <Text style={styles.startButtonText}>Start Reading Plan</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  categoriesContainer: {
    padding: 16,
  },
  categoryItem: {
    marginRight: 16,
  },
  categoryTitle: {
    fontSize: 16,
    color: "#666666",
  },
  categoryCount: {
    fontSize: 12,
    color: "#999999",
  },
  booksList: {
    flex: 1,
    padding: 16,
  },
  bookItem: {
    marginBottom: 16,
  },
  bookInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    marginLeft: 12,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: "500",
  },
  storiesCount: {
    fontSize: 14,
    color: "#FF6B6B",
  },
  startButton: {
    backgroundColor: "#8A4FFF",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PlanScreen;
