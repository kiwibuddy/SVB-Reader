import React, { useState } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  useWindowDimensions,
  Platform 
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

export default function SegmentItem({ 
  segment,
  completedSegments = {},
  onComplete,
  showGlobalCompletion = false,
  context = 'navigation',
  planId,
  challengeId
}: SegmentItemProps) {
  const { 
    completedSegments: globalCompletedSegments,
    markSegmentComplete,
    updateSegmentId,
    selectedReaderColor
  } = useAppContext();
  const { toggleModal } = useModal() || { toggleModal: () => {} };
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const isIPad = Platform.OS === 'ios' && Platform.isPad || (Platform.OS === 'ios' && screenWidth > 768);
  
  // Calculate chart size based on device and text height
  const chartSize = isIPad ? 55 : 28;

  const { ref, book, title, id } = segment;
  const idSplit = id.split("-");
  const segID = idSplit[idSplit.length - 1];

  const Bible: BibleData = require('@/assets/data/newBibleNLT1.json');
  const { colors } = Bible[segID];

  // Only show completion status based on context and source
  const getCompletionStatus = () => {
    switch (context) {
      case 'plan':
        return completedSegments[segID]?.isCompleted || false;
      case 'challenge':
        return completedSegments[segID]?.isCompleted || false;
      case 'navigation':
        return globalCompletedSegments[segID]?.isCompleted || false;
      default:
        return false;
    }
  };

  const isCompleted = completedSegments[segID]?.isCompleted || false;
  const completionColor = completedSegments[segID]?.color || null;

  const handlePress = () => {
    updateSegmentId(segment.id);
    toggleModal();
    router.push(`/${segment.id}`);
  };

  const handleDonutPress = async () => {
    if (context === 'navigation') {
      if (!isCompleted) {
        await markSegmentComplete(segID, true);
        setShowCelebration(true);
      } else {
        await markSegmentComplete(segID, false);
      }
    } else if (onComplete) {
      onComplete(segID);
    }
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
  };

  const getCompletionColor = () => {
    const completion = completedSegments[segID];
    return completion?.color ? getCheckColor(completion.color) : getCheckColor(null);
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      paddingVertical: isIPad ? 30 : 12,
      paddingHorizontal: isIPad ? 30 : 12,
      borderTopWidth: 1,
      borderColor: '#E5E5E5',
      backgroundColor: 'transparent',
      alignItems: 'center',
    },
    chartContainer: {
      position: 'relative',
      width: chartSize,
      height: chartSize,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isIPad ? 16 : 12,
      marginLeft: isIPad ? 10 : 0,
    },
    checkmark: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [
        { translateX: -(chartSize/2) },
        { translateY: -(chartSize/2) }
      ],
      width: chartSize,
      height: chartSize,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: chartSize / 2,
    },
    titleContainer: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
    },
    title: {
      fontWeight: "bold",
      fontSize: isIPad ? 20 : 18,
      marginBottom: 4,
    },
    reference: {
      fontSize: isIPad ? 16 : 14,
      color: "#666",
    }
  });

  return (
    <View style={[styles.container, { backgroundColor: "#FFF" }]}>
      {segID[0] !== "I" ? (
        <Pressable onPress={handleDonutPress} style={styles.chartContainer}>
          <DonutChart colorData={colors} />
          {isCompleted && (
            <View style={styles.checkmark}>
              <Ionicons
                name="checkmark-circle"
                size={chartSize}
                color={getCheckColor(completionColor)}
              />
            </View>
          )}
        </Pressable>
      ) : null}
      <Pressable style={styles.titleContainer} onPress={handlePress}>
        <Text style={styles.title}>{title}</Text>
        {ref && <Text style={styles.reference}>{ref}</Text>}
      </Pressable>
      <CelebrationPopup 
        visible={showCelebration} 
        onComplete={handleCelebrationComplete}
      />
    </View>
  );
}
