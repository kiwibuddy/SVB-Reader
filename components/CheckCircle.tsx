import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteGlobalContext } from '@/context/SQLiteGlobalContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getCheckColor } from '@/scripts/getCheckColors';
import { 
  getSegmentReadCount, 
  getSegmentCompletionStatus, 
  markSegmentComplete,
  resetSegmentCompletion
} from '@/api/sqlite';
import { useAppSettings } from '@/context/AppSettingsContext';

interface CheckCircleProps {
  segmentId: string;
  iconSize?: number;
  context?: 'main' | 'plan' | 'challenge' | 'today';
  planId?: string;
  challengeId?: string;
}

export default function CheckCircle({ 
  segmentId, 
  iconSize = 24, 
  context = 'main',
  planId,
  challengeId
}: CheckCircleProps) {
  const { 
    state,
    updateLastReadSegment,
  } = useSQLiteGlobalContext();
  // Removed completedSegments, activePlan, activeChallenges dependencies - now using pure SQLite
  
  const [readCount, setReadCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionColor, setCompletionColor] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppSettings();
  
  // Animation values for premium confetti celebration (more pieces for richer effect)
  const confettiAnimations = useRef<Array<{
    translateY: Animated.Value;
    translateX: Animated.Value;
    rotate: Animated.Value;
    opacity: Animated.Value;
    scale: Animated.Value;
  }> | null>(null);
  
  // Initialize animations only once
  if (!confettiAnimations.current) {
    confettiAnimations.current = Array.from({ length: 12 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(1),
    }));
  }

  // Load completion status when component mounts
  useEffect(() => {
    const initializeSegment = async () => {
      // Load current completion status for this context
      const status = await getSegmentCompletionStatus(segmentId, context, planId, challengeId);
      setIsCompleted(status.isCompleted);
      setCompletionColor(status.color);
      
      // Load read count
      const count = await getSegmentReadCount(segmentId);
      setReadCount(count);
    };
    
    initializeSegment();
  }, [segmentId, context, planId, challengeId]);

  const startConfettiCelebration = (): Promise<void> => {
    return new Promise((resolve) => {
      setShowConfetti(true);
      
      // Reset all animations
      confettiAnimations.current!.forEach(anim => {
        anim.translateY.setValue(0);
        anim.translateX.setValue(0);
        anim.rotate.setValue(0);
        anim.opacity.setValue(1);
        anim.scale.setValue(1);
      });

      // Premium confetti burst animation with industry-standard timing and easing
      const animations = confettiAnimations.current!.map((anim, index) => {
        // Create more varied and realistic confetti spread
        const angle = (index / confettiAnimations.current!.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const distance = 100 + Math.random() * 80; // Increased spread
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance - 80; // More upward burst
        const fallDistance = 120 + Math.random() * 60; // Gravity fall distance

        return Animated.sequence([
          // Initial burst phase (explosive outward motion)
          Animated.parallel([
            Animated.timing(anim.translateX, {
              toValue: endX,
              duration: 600, // Slightly slower for more premium feel
              easing: Easing.out(Easing.quad), // Smooth deceleration
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateY, {
              toValue: endY,
              duration: 600,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim.rotate, {
              toValue: 360 * (3 + Math.random() * 2), // More rotation for liveliness
              duration: 1200, // Longer rotation
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            // Scale animation for premium bounce effect
            Animated.sequence([
              Animated.timing(anim.scale, {
                toValue: 1.2,
                duration: 150,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
              }),
              Animated.timing(anim.scale, {
                toValue: 1,
                duration: 450,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              })
            ])
          ]),
          // Gravity fall phase (realistic physics)
          Animated.parallel([
            Animated.timing(anim.translateY, {
              toValue: endY + fallDistance,
              duration: 800,
              easing: Easing.in(Easing.quad), // Accelerating fall
              useNativeDriver: true,
            }),
            // Fade out during fall
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 800,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            // Slight scale down during fall
            Animated.timing(anim.scale, {
              toValue: 0.8,
              duration: 800,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            })
          ])
        ]);
      });

      // Stagger the confetti pieces slightly for more organic feel
      const staggeredAnimations = animations.map((animation, index) => 
        Animated.sequence([
          Animated.delay(index * 30), // 30ms stagger between pieces
          animation
        ])
      );

      Animated.parallel(staggeredAnimations).start(() => {
        setShowConfetti(false);
        resolve();
      });
    });
  };

  const handlePress = async () => {
    if (!isCompleted) {
      try {
        // Use SQLite functions directly for completion updates
        await markSegmentComplete(segmentId, context, planId, challengeId);
        await updateLastReadSegment(segmentId);
        
        // Update local state
        setIsCompleted(true);
        
        // Update read count
        const newCount = await getSegmentReadCount(segmentId);
        setReadCount(newCount);
        
        // Start confetti celebration animation
        await startConfettiCelebration();
        
        // Add small delay to ensure database writes are complete before navigation
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Navigate back to the source screen using push to maintain navigation stack
        if (params.planId || planId) {
          // Return to Plan screen with bottom navigation
          router.push('/(tabs)/Plan');
        } else if (params.challengeId || challengeId) {
          // Return to Reading-Challenges screen with bottom navigation
          router.push('/(tabs)/Reading-Challenges');
        } else {
          // Return to Navigation screen with bottom navigation
          router.push('/(tabs)/Navigation');
        }
        
      } catch (error) {
        console.error('Error marking segment complete:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} style={styles.checkButton}>
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={iconSize}
          color={isCompleted ? getCheckColor(completionColor) : colors.secondary}
        />
      </Pressable>
      
      {/* Confetti celebration overlay */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          {confettiAnimations.current!.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.confettiPiece,
                {
                  transform: [
                    { translateX: anim.translateX },
                    { translateY: anim.translateY },
                    { scale: anim.scale }, // Add scale transform
                    { rotate: anim.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg']
                    }) }
                  ],
                  opacity: anim.opacity,
                  backgroundColor: [
                    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
                    '#FFEAA7', '#DDA0DD', '#FF9F43', '#54A0FF',
                    '#5F27CD', '#00D2D3', '#FF3838', '#2ED573'
                  ][index % 12] // More colors for 12 pieces
                }
              ]}
            />
          ))}
        </View>
      )}
      
      {readCount > 0 && (
        <Text style={[styles.readCount, { color: colors.secondary }]}>
          Read {readCount} time{readCount !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 0, // Remove extra padding since parent container handles spacing
    position: 'relative',
  },
  checkButton: {
    padding: 16, // Increased padding for much larger touch target
    minWidth: 44, // iOS Human Interface Guidelines minimum touch target
    minHeight: 44, // iOS Human Interface Guidelines minimum touch target
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22, // Half of minHeight/minWidth for circular touch area
  },
  readCount: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    width: 10, // Slightly larger for better visibility
    height: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3, // Android shadow
  }
});
