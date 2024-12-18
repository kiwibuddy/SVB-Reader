import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { useAppContext } from "@/context/GlobalContext";
import { useRouter } from "expo-router";
import { useModal } from "@/context/NavContext";
import DonutChart from "../DonutChart";
import { Ionicons } from '@expo/vector-icons';
import CelebrationPopup from "../CelebrationPopup";

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

interface SegmentItemProps {
  segment: { 
    id: string; 
    title: string; 
    ref: string | undefined;
    book: string[];
  };
  completedSegments?: string[];
  onComplete?: (segmentId: string) => void;
  showGlobalCompletion?: boolean;
  context?: 'navigation' | 'plan' | 'challenge';
}

export default function SegmentItem({ 
  segment,
  completedSegments = [],
  onComplete,
  showGlobalCompletion = false,
  context = 'navigation'
}: SegmentItemProps) {
  const { 
    completedSegments: globalCompletedSegments,
    markSegmentComplete,
    updateSegmentId
  } = useAppContext();
  const { toggleModal } = useModal() || { toggleModal: () => {} };
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(false);

  const { ref, book, title, id } = segment;
  const idSplit = id.split("-");
  const segID = idSplit[idSplit.length - 1];

  const Bible: BibleData = require('@/assets/data/newBibleNLT1.json');
  const { colors } = Bible[segID];

  // Only show completion status based on context and source
  const getCompletionStatus = () => {
    switch (context) {
      case 'plan':
        return completedSegments.includes(segID);
      case 'challenge':
        return completedSegments.includes(segID);
      case 'navigation':
        return globalCompletedSegments.includes(segID);
      default:
        return false;
    }
  };

  const isCompleted = getCompletionStatus();

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

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderColor: '#E5E5E5',
      backgroundColor: 'transparent',
      alignItems: 'center',
    },
    chartContainer: {
      position: 'relative',
      width: 28,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    checkmark: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 14,
    },
    titleContainer: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
    },
    title: {
      fontWeight: "bold",
      fontSize: 18,
      marginBottom: 4,
    },
    reference: {
      fontSize: 14,
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
                size={28}
                color="#4CAF50"
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
