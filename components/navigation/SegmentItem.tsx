import React from "react";
import { View, Text, Pressable } from "react-native";
import CheckCircle from "../CheckCircle";
import { useAppContext } from "@/context/GlobalContext";
import { useRouter } from "expo-router";
import { useModal } from "@/context/NavContext";
import DonutChart from "../DonutChart";

interface BibleData {
  [key: string]: { colors: string[] }; // Adjust the structure based on actual data
}

export default function SegmentItem({
  segment,
}: {
  segment: { id: string; title: string; ref: string | undefined, book: string[] };
}) {
  const { ref, book, title, id } = segment;
  const idSplit = id.split("-");
  const segID = idSplit[idSplit.length - 1];
  const { updateSegmentId } = useAppContext();
  const { toggleModal } = useModal() || { toggleModal: () => {} }; // Ensure toggleModal is safely accessed
  const router = useRouter(); // Initialize the router

  const Bible: BibleData = require('@/assets/data/newBibleNLT1.json');
  const { colors } = Bible[segID];

  const handlePress = () => {
    updateSegmentId(segment.id); // Set the segment ID in the global state
    toggleModal();
    router.push(`/${segment.id}`); // Navigate to the Bible Segment tab
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: 'white', padding: 5 }}>
      {/* <CheckCircle segmentId={segID} iconSize={24} /> */}
      {segID[0] !== "I" ? <DonutChart colorData={colors} /> : null}
      <Pressable style={{marginLeft: 5, flex: 1, flexWrap: "nowrap"}} onPress={handlePress}>
        <Text style={{ fontWeight: "bold", fontSize: 18, flexWrap: "nowrap" }}>{title}</Text>
        {ref ? (
          <Text style={{ marginLeft: 8, color: "blue" }}>{ref ? `(${ref})` : ""}</Text>
        ) : null}
      </Pressable>
    </View>
  );
}
