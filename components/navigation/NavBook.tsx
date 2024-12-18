import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { SegmentKey } from "@/app/(tabs)/Navigation";
import DonutChart from "../DonutChart";
import SegmentItem from "./SegmentItem";

// Image mapping
const imageMap: { [key: string]: any } = {
  Gen: require('@/assets/images/BibleIcons/genesis-free-bible-icon.png'),
  Exo: require('@/assets/images/BibleIcons/exodus-free-bible-icon.png'),
  Lev: require('@/assets/images/BibleIcons/leviticus-free-bible-icon.png'),
  Num: require('@/assets/images/BibleIcons/numbers-free-bible-icon.png'),
  Deu: require('@/assets/images/BibleIcons/deuteronomy-free-bible-icon.png'),
  Jos: require('@/assets/images/BibleIcons/joshua-free-bible-icon.png'),
  Jdg: require('@/assets/images/BibleIcons/judges-free-bible-icon.png'),
  Rut: require('@/assets/images/BibleIcons/ruth-free-bible-icon.png'),
  [`1Sa`]: require('@/assets/images/BibleIcons/samuel-free-bible-icon.png'),
  [`2Sa`]: require('@/assets/images/BibleIcons/samuel-free-bible-icon.png'),
  [`1Ki`]: require('@/assets/images/BibleIcons/kings-free-bible-icon.png'),
  [`2Ki`]: require('@/assets/images/BibleIcons/kings-free-bible-icon.png'),
  [`1Ch`]: require('@/assets/images/BibleIcons/chronicles-free-bible-icon.png'),
  [`2Ch`]: require('@/assets/images/BibleIcons/chronicles-free-bible-icon.png'),
  Ezr: require('@/assets/images/BibleIcons/ezra-free-bible-icon.png'),
  Neh: require('@/assets/images/BibleIcons/nehemiah-free-bible-icon.png'),
  Est: require('@/assets/images/BibleIcons/esther-free-bible-icon.png'),
  Job: require('@/assets/images/BibleIcons/job-free-bible-icon.png'),
  Psa: require('@/assets/images/BibleIcons/psalms-free-bible-icon.png'),
  Pro: require('@/assets/images/BibleIcons/proverbs-free-bible-icon.png'),
  Ecc: require('@/assets/images/BibleIcons/ecclesiastes-free-bible-icon.png'),
  SoS: require('@/assets/images/BibleIcons/song-of-solomon-free-bible-icon.png'),
  Isa: require('@/assets/images/BibleIcons/isaiah-free-bible-icon.png'),
  Jer: require('@/assets/images/BibleIcons/jeremiah-free-bible-icon.png'),
  Lam: require('@/assets/images/BibleIcons/lamentations-free-bible-icon.png'),
  Eze: require('@/assets/images/BibleIcons/ezekiel-free-bible-icon.png'),
  Dan: require('@/assets/images/BibleIcons/daniel-free-bible-icon.png'),
  Hos: require('@/assets/images/BibleIcons/hosea-free-bible-icon.png'),
  Joe: require('@/assets/images/BibleIcons/joel-free-bible-icon.png'),
  Amo: require('@/assets/images/BibleIcons/amos-free-bible-icon.png'),
  Oba: require('@/assets/images/BibleIcons/obadiah-free-bible-icon.png'),
  Jon: require('@/assets/images/BibleIcons/Jonah-free-bible-icon.png'),
  Mic: require('@/assets/images/BibleIcons/micah-free-bible-icon.png'),
  Nah: require('@/assets/images/BibleIcons/nahum-free-bible-icon.png'),
  Hab: require('@/assets/images/BibleIcons/habakkuk-free-bible-icon.png'),
  Zep: require('@/assets/images/BibleIcons/zephaniah-free-bible-icon.png'),
  Hag: require('@/assets/images/BibleIcons/haggai-free-bible-icon.png'),
  Zec: require('@/assets/images/BibleIcons/zechariah-free-bible-icon.png'),
  Mal: require('@/assets/images/BibleIcons/malachi-free-bible-icon.png'),
  Mat: require('@/assets/images/BibleIcons/matthew-free-bible-icon.png'),
  Mar: require('@/assets/images/BibleIcons/mark-free-bible-icon.png'),
  Luk: require('@/assets/images/BibleIcons/luke-free-bible-icon.png'),
  Joh: require('@/assets/images/BibleIcons/john-free-bible-icon.png'),
  Act: require('@/assets/images/BibleIcons/acts-free-bible-icon.png'),
  Rom: require('@/assets/images/BibleIcons/romans-free-bible-icon.png'),
  [`1Co`]: require('@/assets/images/BibleIcons/1-corinthians-free-bible-icon.png'),
  [`2Co`]: require('@/assets/images/BibleIcons/2-corinthians-free-bible-icon.png'),
  Gal: require('@/assets/images/BibleIcons/galatians-free-bible-icon.png'),
  Eph: require('@/assets/images/BibleIcons/ephesians-free-bible-icon.png'),
  Php: require('@/assets/images/BibleIcons/philippians-free-bible-icon.png'),
  Col: require('@/assets/images/BibleIcons/colossians-free-bible-icon.png'),
  [`1Th`]: require('@/assets/images/BibleIcons/1-thessalonians-free-bible-icon.png'),
  [`2Th`]: require('@/assets/images/BibleIcons/2-thessalonians-free-bible-icon.png'),
  [`1Ti`]: require('@/assets/images/BibleIcons/1-timothy-free-bible-icon.png'),
  [`2Ti`]: require('@/assets/images/BibleIcons/2-timothy-free-bible-icon.png'),
  Tit: require('@/assets/images/BibleIcons/titus-free-bible-icon.png'),
  Phm: require('@/assets/images/BibleIcons/philemon-free-bible-icon.png'),
  Heb: require('@/assets/images/BibleIcons/hebrews-free-bible-icon.png'),
  Jam: require('@/assets/images/BibleIcons/james-free-bible-icon.png'),
  [`1Pe`]: require('@/assets/images/BibleIcons/1-peter-free-bible-icon.png'),
  [`2Pe`]: require('@/assets/images/BibleIcons/2-peter-free-bible-icon.png'),
  [`1Jn`]: require('@/assets/images/BibleIcons/1-john-free-bible-icon.png'),
  [`2Jn`]: require('@/assets/images/BibleIcons/2-john-free-bible-icon.png'),
  [`3Jn`]: require('@/assets/images/BibleIcons/3-john-free-bible-icon.png'),
  Jud: require('@/assets/images/BibleIcons/jude-free-bible-icon.png'),
  Rev: require('@/assets/images/BibleIcons/revelation-free-bible-icon.png')
};

export const accordionColor = {
  Gen: "#f3e2e2",
  Exo: "#f3e2e2",
  Lev: "#f3e2e2",
  Num: "#f3e2e2",
  Deu: "#f3e2e2",
  Jos: "#f2e6db",
  Jdg: "#f2e6db",
  Rut: "#f2e6db",
  [`1Sa`]: "#f2e6db",
  [`2Sa`]: "#f2e6db",
  [`1Ki`]: "#f2e6db",
  [`2Ki`]: "#f2e6db",
  [`1Ch`]: "#f2e6db",
  [`2Ch`]: "#f2e6db",
  Ezr: "#f2e6db",
  Neh: "#f2e6db",
  Est: "#f2e6db",
  Job: "#ebdbf6",
  Psa: "#ebdbf6",
  Pro: "#ebdbf6",
  Ecc: "#ebdbf6",
  SoS: "#ebdbf6",
  Isa: "#cdd6f1",
  Jer: "#cdd6f1",
  Lam: "#ebdbf6",
  Eze: "#cdd6f1",
  Dan: "#cdd6f1",
  Hos: "#cdd6f1",
  Joe: "#cdd6f1",
  Amo: "#cdd6f1",
  Oba: "#cdd6f1",
  Jon: "#cdd6f1",
  Mic: "#cdd6f1",
  Nah: "#cdd6f1",
  Hab: "#cdd6f1",
  Zep: "#cdd6f1",
  Hag: "#cdd6f1",
  Zec: "#cdd6f1",
  Mal: "#cdd6f1",
  Mat: "#fff0c7",
  Mar: "#fff0c7",
  Luk: "#fff0c7",
  Joh: "#fff0c7",
  Act: "#f6dece",
  Rom: "#d0e6d0",
  [`1Co`]: "#d0e6d0",
  [`2Co`]: "#d0e6d0",
  Gal: "#d0e6d0",
  Eph: "#d0e6d0",
  Php: "#d0e6d0",
  Col: "#d0e6d0",
  [`1Th`]: "#d0e6d0",
  [`2Th`]: "#d0e6d0",
  [`1Ti`]: "#d0e6d0",
  [`2Ti`]: "#d0e6d0",
  Tit: "#d0e6d0",
  Phm: "#d0e6d0",
  Heb: "#d1e6e2",
  Jam: "#d1e6e2",
  [`1Pe`]: "#d1e6e2",
  [`2Pe`]: "#d1e6e2",
  [`1Jn`]: "#d1e6e2",
  [`2Jn`]: "#d1e6e2",
  [`3Jn`]: "#d1e6e2",
  Jud: "#d1e6e2",
  Rev: "#c7dae6",
};

// Define an interface for the structure of Bible data
interface BibleData {
  [key: string]: {
    id: string;
    colors: {
      total: number;
      black: number;
      red: number;
      green: number;
      blue: number;
    }; // Adjust the type based on actual structure
  };
}

// Import and type the Bible data
const Bible: BibleData = require('@/assets/data/newBibleNLT1.json');

export interface AccordionItem {
  djhBook: keyof typeof accordionColor;
  bookName: string;
  segments: SegmentKey[];
}

export interface AccordionProps {
  item: AccordionItem;
  bookIndex: number;
  completedSegments?: string[];
  onSegmentComplete?: (segmentId: string) => void;
  showGlobalCompletion?: boolean;
  context?: 'navigation' | 'plan' | 'challenge';
  planId?: string;
  challengeId?: string;
}

// Define a type for the structure of SegmentTitles
export interface SegmentTitle {
  Segment: string;
  title: string;
  book: string[];
  ref?: string; // Make ref optional
}

// Update the type of SegmentTitles to reflect the new structure
const SegmentTitles: Record<SegmentKey, SegmentTitle> = require('@/assets/data/SegmentTitles.json');

// Define a type for the keys of accordionColor
type AccordionColorKey = keyof typeof accordionColor;

const Accordion = ({ 
  item, 
  bookIndex, 
  completedSegments = [], 
  onSegmentComplete,
  showGlobalCompletion = false,
  context = 'navigation',
  planId,
  challengeId
}: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const flatListRef = useRef<FlatList<SegmentKey>>(null); // Create a ref for FlatList

  // Function to generate the formatted string
  const generateBookIdentifier = (index: number): string => {
    return `I${(index + 1).toString().padStart(3, "0")}`;
  };
  const colors = Bible[generateBookIdentifier(bookIndex)].colors;

  // Effect to scroll to top when item.segments changes
  useEffect(() => {
    if (isOpen && flatListRef.current) {
      flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
    }
  }, [item.segments]);

  const handleSegmentPress = (segmentId: string) => {
    // Existing segment handling logic
    
    // Call the completion callback if provided
    if (onSegmentComplete) {
      onSegmentComplete(segmentId);
    }
  };

  return (
    <View
      style={[
        styles.accordion,
        { backgroundColor: accordionColor[item.djhBook] },
      ]}
    >
      <TouchableOpacity onPress={() => setIsOpen(!isOpen)}>
        <View style={styles.rowContainer}>
          <Image source={imageMap[item.djhBook]} style={styles.logo} />
          <View style={styles.textContainer}>
            <Text style={{ fontSize: 24 }}>{item.bookName}</Text>
            <Text
              style={{ fontSize: 16, color: "#FF5733", fontStyle: "italic", fontWeight: "bold" }}
            >
              {item.segments.length - 1} stories
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.flatListContainer}>
          <FlatList
            ref={flatListRef}
            data={item.segments}
            renderItem={({ item }: { item: SegmentKey }) => {
              const { title, ref, book } = SegmentTitles[item];
              const { id } = Bible[item];
              return <SegmentItem 
                segment={{ id, title, ref, book }} 
                completedSegments={completedSegments}
                onComplete={onSegmentComplete}
                showGlobalCompletion={showGlobalCompletion}
                context={context}
                planId={planId}
                challengeId={challengeId}
              />;
            }}
            keyExtractor={(subItem) => subItem} // Update keyExtractor to use subItem directly
          />
        </View>
      )}
    </View>
  );
};

export default Accordion;

const styles = StyleSheet.create({
  accordion: {
    borderTopWidth: 1,
    borderColor: "#000000",
  },
  rowContainer: {
    // Updated style for horizontal layout
    flexDirection: "row",
    justifyContent: "flex-start", // Align items to the left
    alignItems: "center", // Align items vertically centered
  },
  textContainer: {
    flex: 0,
    justifyContent: "space-between",
  },
  logo: {
    width: 70,
    height: 70,
    alignSelf: "center",
    margin: 5,
  },
  flatListContainer: {
    flex: 1,
  },
});
