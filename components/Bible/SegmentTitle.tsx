import { Text, View } from "react-native";
import SegmentTitles from "@/assets/data/SegmentTitles.json";

interface SegmentTitleType {
  Segment: string;
  title: string;
  book: string[];
  ref?: string;
}

const dualBookSegments = ["S115", "S096"]

export default function SegmentTitle({segmentId}: {segmentId: string}) {
  const { title, book, ref } = SegmentTitles[segmentId as keyof typeof SegmentTitles] as SegmentTitleType;
  const isDualBook = dualBookSegments.includes(segmentId)
  const reference = isDualBook && ref ? `${book[0]} ${ref.split("-")[0]} - ${book[1]} ${ref.split("-")[1]}` : `${book[0]} ${ref}`
  return (
    <View style={{padding: 10, justifyContent: "center", alignItems: "center" }}>
      <Text style={{fontSize: 20, fontWeight: "bold"}}>{title}</Text>
      <Text>{ref ? reference : book[0]}</Text>
    </View>
  );
}
