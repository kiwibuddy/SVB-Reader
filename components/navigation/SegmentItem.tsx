import React from 'react';
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
import { useAppSettings } from '@/context/AppSettingsContext';

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
  const { colors } = useAppSettings();

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

  const styles = StyleSheet.create({
    container: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 4,
    },
    reference: {
      fontSize: 14,
      color: colors.secondary,
    },
    completedText: {
      color: colors.secondary,
    }
  });

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
    >
      <Text style={styles.title}>{segment.title}</Text>
      {segment.ref && (
        <Text style={styles.reference}>{segment.ref}</Text>
      )}
    </TouchableOpacity>
  );
};

export default SegmentItem;
