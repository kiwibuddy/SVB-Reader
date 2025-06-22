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
import ReadingModeModal from '@/components/GroupReading/ReadingModeModal';
import { useGroupReading } from '@/context/GroupReadingContext';
import BibleData from '@/assets/data/newBibleNLT1.json';
import SegmentTitles from '@/assets/data/SegmentTitles.json';

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
  
  // Group Reading State
  const { currentSession, startHostSession } = useGroupReading();
  const [showReadingModeModal, setShowReadingModeModal] = useState(false);

  useEffect(() => {
    if (completedSegments && segment.id in completedSegments) {
      setCompletionStatus({
        isCompleted: !!completedSegments[segment.id],
        color: null
      });
    } else {
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
    }
  }, [segment.id, context, planId, challengeId, completedSegments]);

  const handlePress = () => {
    if (onPress) {
      onPress(segment.id);
    } else {
      // Show the Reading Mode Selection Modal instead of directly navigating
      setShowReadingModeModal(true);
    }
  };

  const handleIndividualReading = () => {
    setShowReadingModeModal(false);
    // Navigate to the segment as before
    router.push({
      pathname: "/[segment]" as const,
      params: {
        segment: `${language}-${version}-${segment.id}`,
        ...(context === 'plan' && planId ? { planId } : {}),
        ...(context === 'challenge' && challengeId ? { challengeId } : {})
      }
    });
  };

  const handleGroupReading = () => {
    setShowReadingModeModal(false);
    // Navigate to Group Setup screen
    router.push({
      pathname: '/group-setup' as any,
      params: {
        storyId: segment.id,
        storyTitle: segment.title,
        scriptureReference: segment.ref || '',
        ...(context === 'plan' && planId ? { planId } : {}),
        ...(context === 'challenge' && challengeId ? { challengeId } : {})
      }
    });
  };

  const handleCancel = () => {
    setShowReadingModeModal(false);
  };

  // Get story data for the modal
  const getStoryData = () => {
    const segmentData = BibleData[segment.id as keyof typeof BibleData];
    const segmentTitleData = SegmentTitles[segment.id as keyof typeof SegmentTitles];
    return segmentData || segmentTitleData;
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
    <>
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

      <ReadingModeModal
        visible={showReadingModeModal}
        story={getStoryData()}
        storyTitle={segment.title}
        scriptureReference={segment.ref || ''}
        onIndividual={handleIndividualReading}
        onGroup={handleGroupReading}
        onCancel={handleCancel}
      />
    </>
  );
};

export default SegmentItem;
