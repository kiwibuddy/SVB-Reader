import React from 'react';
import { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  useWindowDimensions,
  Platform,
  TouchableOpacity,
  Animated
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
}

const SegmentItem: React.FC<SegmentItemProps> = ({ 
  segment,
  context = 'main',
  planId,
  challengeId,
  onPress
}) => {
  const router = useRouter();
  const { language, version } = useAppContext();
  const [completionStatus, setCompletionStatus] = useState<CompletionData>({
    isCompleted: false,
    color: null
  });
  const { colors } = useAppSettings();
  
  // Animation values for the check icon
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

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

  // Animate the check icon when completion status changes
  useEffect(() => {
    if (completionStatus.isCompleted) {
      // Pop-in animation with bounce effect
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation values
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [completionStatus.isCompleted]);

  const handlePress = () => {
    if (onPress) {
      onPress(segment.id);
    } else {
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

  // Create rotation interpolation
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
    },
    checkIconContainer: {
      width: 28,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
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
      {completionStatus.isCompleted && (
        <View style={styles.checkIconContainer}>
          <Animated.View
            style={{
              transform: [
                { scale: scaleAnim },
                { rotate: rotation }
              ],
              opacity: opacityAnim,
            }}
          >
            <Ionicons 
              name="checkmark-circle" 
              size={20} 
              color="#4CAF50" 
              style={styles.checkIcon} 
            />
          </Animated.View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default SegmentItem;
