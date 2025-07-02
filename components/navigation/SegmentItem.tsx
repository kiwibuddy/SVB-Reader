import React, { useState, useEffect } from "react";
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
import CelebrationPopup from "@/components/CelebrationPopup";
import { getCheckColor } from '@/scripts/getCheckColors';
import { markSegmentComplete, getSegmentCompletionStatus } from "@/api/sqlite";
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
  completedSegments?: Record<string, boolean>;
}

const SegmentItem: React.FC<SegmentItemProps> = ({ 
  segment,
  context = 'main',
  planId,
  challengeId,
  onPress,
  completedSegments
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
      // Always use context-aware completion status for consistent display
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
    console.log('SegmentItem: handlePress called for segment:', segment.id);
    if (onPress) {
      console.log('SegmentItem: Calling onPress handler with segment:', segment.id);
      onPress(segment.id);
    } else {
      console.log('SegmentItem: No onPress handler, using fallback navigation');
      // Fallback to direct navigation if no onPress provided
      router.push({
        pathname: "/(tabs)/[segment]" as const,
        params: {
          segment: `${language}-${version}-${segment.id}`,
          ...(context === 'plan' && planId ? { planId } : {}),
          ...(context === 'challenge' && challengeId ? { challengeId } : {})
        }
      });
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: colors.card,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      color: colors.text,
    },
    reference: {
      fontSize: 12,
      color: colors.secondary,
      marginTop: 2,
    },
    checkIcon: {
      marginLeft: 8,
    }
  });

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
    >
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {segment.title}
        </Text>
        {segment.ref && (
          <Text style={styles.reference}>
            {segment.ref}
          </Text>
        )}
      </View>
      <Ionicons 
        name={completionStatus.isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'} 
        size={20} 
        color={completionStatus.isCompleted ? '#4CAF50' : '#CCCCCC'} 
        style={styles.checkIcon} 
      />
    </TouchableOpacity>
  );
};

export default SegmentItem;
