import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  useWindowDimensions,
  Platform,
  TouchableOpacity
} from "react-native";
import { useSQLiteGlobalContext } from "@/context/SQLiteGlobalContext";
import { useRouter } from "expo-router";
import { useModal } from "@/context/NavContext";
// Removed DonutChart import - no longer used
import { Ionicons } from '@expo/vector-icons';
import CelebrationPopup from "@/components/CelebrationPopup";
import { getCheckColor } from '@/scripts/getCheckColors';
import { markSegmentComplete, getSegmentCompletionStatus } from "@/api/sqlite";
import { databaseManager } from '@/api/database-manager';
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

const SegmentItem: React.FC<SegmentItemProps> = React.memo(({ 
  segment,
  context = 'main',
  planId,
  challengeId,
  onPress,
  completedSegments
}) => {
  const router = useRouter();
  const { state } = useSQLiteGlobalContext();
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

  // Update completion status immediately when completedSegments prop changes
  useEffect(() => {
    if (completedSegments && completedSegments[segment.id]) {
      setCompletionStatus(prev => ({
        ...prev,
        isCompleted: true
      }));
    }
  }, [completedSegments, segment.id]);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(segment.id);
    } else {
      // Fallback to direct navigation if no onPress provided
      router.push({
        pathname: "/[segment]" as const,
        params: {
          segment: `${state.language}-${state.version}-${segment.id}`,
          ...(context === 'plan' && planId ? { planId } : {}),
          ...(context === 'challenge' && challengeId ? { challengeId } : {})
        }
      });
    }
  }, [onPress, segment.id, router, state.language, state.version, context, planId, challengeId]);

  // Check if this is an introduction segment
  const isIntroduction = segment.id.startsWith('I');

  const styles = useMemo(() => StyleSheet.create({
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
    introTitle: {
      fontStyle: 'italic',
      color: colors.secondary,
    },
    reference: {
      fontSize: 12,
      color: colors.secondary,
      marginTop: 2,
    },
    checkIcon: {
      marginLeft: 8,
    }
  }), [colors]);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
    >
      <View style={styles.textContainer}>
        <Text style={[styles.title, isIntroduction && styles.introTitle]}>
          {segment.title}
        </Text>
        {segment.ref && (
          <Text style={styles.reference}>
            {segment.ref}
          </Text>
        )}
      </View>
      {!isIntroduction && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {/* Show group completion badge if any group completion exists for this segment */}
          <GroupCompletionBadge segmentId={segment.id} />
          <Ionicons 
            name={completionStatus.isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'} 
            size={20} 
            color={completionStatus.isCompleted ? '#4CAF50' : '#CCCCCC'} 
            style={styles.checkIcon} 
          />
        </View>
      )}
    </TouchableOpacity>
  );
});

export default SegmentItem;

// Inline lightweight badge that shows if a segment has any group completions
const GroupCompletionBadge: React.FC<{ segmentId: string }> = ({ segmentId }) => {
  const { colors } = useAppSettings();
  const [hasGroupCompletion, setHasGroupCompletion] = useState<boolean>(false);

  const loadGroupCompletion = useCallback(async () => {
    try {
      const db = databaseManager.getDatabase();
      const row = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM group_segment_completion WHERE segmentID = ?',
        [segmentId]
      );
      setHasGroupCompletion((row?.count || 0) > 0);
    } catch (error) {
      console.error('Error loading group completion status:', error);
    }
  }, [segmentId]);

  useEffect(() => {
    loadGroupCompletion();
  }, [loadGroupCompletion]);

  // Refresh when the component comes back into focus to catch new completions
  React.useEffect(() => {
    const focusListener = () => {
      loadGroupCompletion();
    };
    
    // Listen for focus events if available
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('focus', focusListener);
      return () => window.removeEventListener('focus', focusListener);
    }
  }, [loadGroupCompletion]);

  if (!hasGroupCompletion) return null;
  return (
    <Ionicons name="people-circle" size={20} color={'#42A5F5'} style={{ marginRight: 2 }} />
  );
};
