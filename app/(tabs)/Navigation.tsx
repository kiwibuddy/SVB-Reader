import { View, FlatList, StyleSheet, Text } from "react-native";
import Accordion from "@/components/navigation/NavBook";
import Books from "@/assets/data/BookChapterList.json";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { useAppContext } from "@/context/GlobalContext";

export type SegmentKey = keyof typeof SegmentTitles;
export type SegmentIds = keyof typeof Books;

const data = Object.keys(Books).map((key) => ({
  djhBook: key as keyof typeof Books,
  ...Books[key as SegmentIds],
  segments: Books[key as SegmentIds].segments as SegmentKey[],
}));

const booksArray = Object.keys(Books);

const Navigation = () => {
  const { completedSegments } = useAppContext();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Story Finder</Text>
        <Text style={styles.subtitle}>Navigate through books and chapters to find your next story</Text>
      </View>
      <FlatList
        data={data}
        renderItem={({ item }) => {
          const bookIndex = booksArray.findIndex(
            (book) => book === item.djhBook
          );
          return (
            <Accordion 
              item={item} 
              bookIndex={bookIndex}
              completedSegments={completedSegments}
              context="navigation"
              showGlobalCompletion={true}
              style={{ backgroundColor: '#FFF' }}
            />
          );
        }}
        keyExtractor={(item) => item.djhBook}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
});

export default Navigation;
