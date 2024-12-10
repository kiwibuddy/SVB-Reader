import { FlatList, View, Text, Pressable, StyleSheet } from "react-native";
import Accordion, { AccordionItem, accordionColor } from "@/components/navigation/NavBook";
import Books from "@/assets/data/BookChapterList.json";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { useContext, useMemo } from "react";
import { useAppContext } from "@/context/GlobalContext";
import ReadingPlansChallenges from "@/assets/data/ReadingPlansChallenges.json";

export type SegmentKey = keyof typeof SegmentTitles;

export type SegmentIds = keyof typeof Books; // Define the valid keys for Segments
const data = Object.keys(Books).map((key) => ({
  djhBook: key, // Include the key as a value for djhBook
  ...Books[key as SegmentIds], // Spread the properties of the segment
  segments: Books[key as SegmentIds].segments as SegmentKey[], // Cast segments to the correct type
}));

const booksArray = Object.keys(Books);

const buttonData = [
  {
    id: "Bible1Year",
    title: "Bible in 1 Year",
  },
  {
    id: "SchoolYear1",
    title: "School Year 1",
  },
  {
    id: "SchoolYear2",
    title: "School Year 2",
  },
  {
    id: "SchoolYear3",
    title: "School Year 3",
  },
  {
    id: "NT100Days",
    title: "New Testament 100 Days",
  },
];

const Navigation = () => {
  const { readingPlan, updateReadingPlan } = useAppContext();
  const readingPlanData = useMemo(() => {
    const rPDataFull = ReadingPlansChallenges.plans.find((item) => item.id === readingPlan);
    const data = rPDataFull?.segments ? Object.keys(rPDataFull.segments).map((key) => ({
      djhBook: key as keyof typeof accordionColor,
      bookName: Books[key as SegmentIds]?.bookName ?? "Unknown Book",
      segments: (rPDataFull?.segments[key as SegmentIds]?.segments ?? []) as SegmentKey[],
    })) : [];
    return data;
  }, [readingPlan]);

  return (
    <View style={{ backgroundColor: "#FFF" }}>
      {/* <View style={styles.planSelector}>
        <FlatList
          data={buttonData}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.button,
                {
                  backgroundColor:
                    item.id === readingPlan ? "#FF5733" : "#FFFFFF",
                },
              ]}
              onPress={() => {
                updateReadingPlan(item.id);
              }}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: item.id === readingPlan ? "#FFFFFF" : "#FF5733" },
                ]}
              >
                {item.title}
              </Text>
            </Pressable>
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View> */}
      <FlatList
        data={readingPlanData}
        renderItem={({ item }: { item: AccordionItem }) => {
          const bookIndex = booksArray.findIndex(
            (book) => book === item.djhBook
          );
          return <Accordion item={item} bookIndex={bookIndex} />;
        }}
        keyExtractor={(item) => item.djhBook}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  planSelector: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  button: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 25,
    marginHorizontal: 5,
  },
  buttonText: {
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 20,
  },
});

export default Navigation;
