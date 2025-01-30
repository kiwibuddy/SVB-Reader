import { useState } from "react";
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
  completedSegments: Record<string, CompletionData>;
  onComplete?: (segmentId: string) => void;
  showGlobalCompletion: boolean;
  context: 'navigation' | 'plan' | 'challenge';
  planId?: string;
  challengeId?: string;
}

const SegmentItem = ({ 
  segment,
  completedSegments,
  onComplete,
  showGlobalCompletion,
  context,
  planId,
  challengeId
}: SegmentItemProps) => {
  const router = useRouter();
  const { language, version } = useAppContext();

  const handlePress = () => {
    const query: any = { showGlobalCompletion: showGlobalCompletion.toString() };
    
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
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
    >
      <View style={styles.textContainer}>
        <Text style={styles.title}>{segment.title}</Text>
        {segment.ref && (
          <Text style={styles.subtitle}>{segment.ref}</Text>
        )}
      </View>
      <View style={styles.rightContent}>
        {completedSegments[segment.id]?.isCompleted && (
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        )}
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
