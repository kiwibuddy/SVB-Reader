import { View, FlatList, StyleSheet } from "react-native";
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
});

export default Navigation;
