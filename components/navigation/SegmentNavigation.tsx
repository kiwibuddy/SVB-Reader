import React from "react";
import { View, Text, ScrollView, FlatList, Pressable } from "react-native";
import {Collapsible} from "@/components/Collapsible";
import SegmentDataObj from "@/assets/data/SegmentTitles.json";
import BookChapterList from "@/assets/data/BookChapterList.json";
import { SegmentsTitleObject, SegmentTitleData } from "@/types";
import CheckCircle from "../CheckCircle";
import { useAppContext } from "@/context/GlobalContext";
import { useRouter } from 'expo-router'; // Import useRouter
import { useModal } from "@/context/NavContext";

const SegmentData = SegmentDataObj as SegmentsTitleObject;
// Group the segments by book
const groupSegmentsByBook = (segments: Record<string, SegmentTitleData>) => {
  const grouped: Record<string, { id: string; segments: SegmentTitleData[] }> = {};

  Object.entries(segments).forEach(([key, segment]) => {
    const book = segment.book[0]; // Assuming the first book in the array
    if (typeof book !== 'string') {
      throw new Error(`Expected book to be a string, but got ${typeof book}`); // Ensure book is a string
    }
    if (!grouped[book]) {
      grouped[book] = { id: key, segments: [] }; // Initialize with segment ID
    }
    grouped[book].segments.push({...segment, id: key}); // Push segment into the array
  });

  return grouped;
};

// Define a type for the keys of BookChapterList
type BookKeys = keyof typeof BookChapterList;

// New SegmentItem component
function SegmentItem({ segment }: { segment: { id: string; title: string, ref: string } }) {
  const { updateSegmentId } = useAppContext();
  const { toggleModal } = useModal() || {toggleModal: () => {}}; // Ensure toggleModal is safely accessed
  const router = useRouter(); // Initialize the router

  const handlePress = () => {
    updateSegmentId(segment.id); // Set the segment ID in the global state
    toggleModal();
    router.push('/Bible'); // Navigate to the Bible tab
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <CheckCircle segmentId={segment.id} iconSize={24} />
      <Pressable onPress={handlePress}>
        <Text style={{ fontWeight: "bold", fontSize: 18 }}>
          {segment.title}
        </Text>
        <Text style={{ marginLeft: 8 }}>
          {segment.ref ? `(${segment.ref})` : ""}
        </Text>
      </Pressable>
    </View>
  );
}

export default function SegmentNavigation() {
  const groupedSegments = groupSegmentsByBook(SegmentData);

  return (
      <FlatList
        data={Object.keys(groupedSegments)}
        keyExtractor={(book) => book}
        renderItem={({ item: book }) => (
          <View>
            <Collapsible title={BookChapterList[book as BookKeys].bookName}>
              {groupedSegments[book as BookKeys].segments.map((segment, index) => {
                const { ref = "", title, id } = segment; // Provide a default value for ref
                return <SegmentItem key={index} segment={{ ref, title, id: id || "" }} />;
              })}
            </Collapsible>
          </View>
        )}
      />
  );
}
