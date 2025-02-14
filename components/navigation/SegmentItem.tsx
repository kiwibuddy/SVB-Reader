import { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  useWindowDimensions,
  Platform,
  TouchableOpacity
} from "react-native";
import { useAppContext } from "@/context/GlobalContext";
import { useRouter } from "expo-router";
import { useModal } from "@/context/NavContext";
import DonutChart from "../DonutChart";
import { Ionicons } from '@expo/vector-icons';
import CelebrationPopup from "../CelebrationPopup";
import { getCheckColor } from '@/scripts/getCheckColors';
import { markSegmentCompleteInDB, getSegmentCompletionStatus } from "@/api/sqlite";

interface ColorData {
  total: number;
  black: number;
  red: number;
  green: number;
  blue: number;
}

interface BibleData {
  [key: string]: { colors: ColorData }; // Changed from string[]
}

interface CompletionData {
  isCompleted: boolean;
  color: string | null;
}

interface SegmentItemProps {
  segment: {
    id: string;
    title: string;
    ref?: string;
    book: string[];
  };
  context?: 'main' | 'plan' | 'challenge';
  planId?: string;
  challengeId?: string;
  onPress?: (segmentId: string) => void;
}

const SegmentItem: React.FC<SegmentItemProps> = ({ 
  segment,
  context = 'main',
  planId,
  challengeId
}) => {
  const router = useRouter();
  const { language, version } = useAppContext();
  const [completionStatus, setCompletionStatus] = useState<CompletionData>({
    isCompleted: false,
    color: null
  });

  useEffect(() => {
    const loadStatus = async () => {
      const status = await getSegmentCompletionStatus(
        segment.id,
        context,
        planId,
        challengeId
      );
      setCompletionStatus(status);
    };
    loadStatus();
  }, [segment.id, context, planId, challengeId]);

  const handlePress = () => {
    const query: any = {};
    
    if (context === 'plan' && planId) {
      query.planId = planId;
    } else if (context === 'challenge' && challengeId) {
      query.challengeId = challengeId;
    }

    const segmentPath = `${language}-${version}-${segment.id}`;

    router.push({
      pathname: "/[segment]" as const,
      params: {
        segment: segmentPath,
        ...query
      }
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{segment.title}</Text>
        <Text style={styles.subtitle}>{segment.ref}</Text>
      </View>
      <View style={styles.rightContent}>
        <Ionicons 
          name={completionStatus.isCompleted ? "checkmark-circle" : "checkmark-circle-outline"} 
          size={24} 
          color={completionStatus.isCompleted ? getCheckColor(completionStatus.color) : "#CCCCCC"} 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F5F5F5',
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  rightContent: {
    marginLeft: 12,
  }
});

export default SegmentItem;
