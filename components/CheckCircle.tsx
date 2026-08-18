import React, { useState, useEffect, useRef } from 'react';
import logger from '@/utils/logger';
import { View, Text, Pressable, StyleSheet, Animated, InteractionManager } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteGlobalContext } from '@/context/SQLiteGlobalContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getCheckColor } from '@/scripts/getCheckColors';
import {
  getSegmentReadCount,
  getSegmentCompletionStatus,
  markSegmentComplete,
} from '@/api/sqlite';
import CompletionBanner from '@/components/Bible/CompletionBanner';
import { ANIMATION } from '@/services/animation';

interface CheckCircleProps {
  segmentId: string;
  iconSize?: number;
  context?: 'main' | 'plan' | 'challenge' | 'today';
  planId?: string;
  challengeId?: string;
  /** @deprecated Group/QR modes removed; kept so existing call sites compile. */
  mode?: 'auto' | 'normal' | 'group';
  showCaption?: boolean;
  resetVisualStateOnMount?: boolean;
}

export default function CheckCircle({
  segmentId,
  iconSize = 32,
  context = 'main',
  planId,
  challengeId,
  showCaption = true,
  resetVisualStateOnMount = false,
}: CheckCircleProps) {
  const { updateLastReadSegment } = useSQLiteGlobalContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { freshStart } = params;

  const [isCompleted, setIsCompleted] = useState(false);
  const [completionColor, setCompletionColor] = useState<string | null>(null);
  const [readCount, setReadCount] = useState(0);
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const confettiAnimations = useRef(
    Array.from({ length: 12 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(1),
    }))
  );

  useEffect(() => {
    const initializeSegment = async () => {
      if (resetVisualStateOnMount) {
        setIsCompleted(false);
        setCompletionColor(null);
      }

      try {
        const count = await getSegmentReadCount(segmentId);
        setReadCount(count);
      } catch (error) {
        logger.error('Error loading read count:', error);
      }

      InteractionManager.runAfterInteractions(async () => {
        try {
          const status = await getSegmentCompletionStatus(segmentId, context, planId, challengeId);
          if (!resetVisualStateOnMount) {
            setIsCompleted(status.isCompleted);
            setCompletionColor(status.color);
          }
        } catch (error) {
          logger.error('Error initializing segment completion status:', error);
        }
      });
    };

    initializeSegment();
  }, [segmentId, context, planId, challengeId, resetVisualStateOnMount, freshStart]);

  const startConfettiCelebration = (): Promise<void> => {
    return new Promise((resolve) => {
      setShowConfetti(true);

      confettiAnimations.current.forEach((anim) => {
        anim.translateY.setValue(0);
        anim.translateX.setValue(0);
        anim.rotate.setValue(0);
        anim.opacity.setValue(1);
        anim.scale.setValue(1);
      });

      const animations = confettiAnimations.current.map((anim, index) => {
        const angle = (index / confettiAnimations.current.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const distance = 100 + Math.random() * 80;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance - 80;
        const fallDistance = 120 + Math.random() * 60;

        return Animated.sequence([
          Animated.delay(index * 30),
          Animated.parallel([
            Animated.timing(anim.translateX, {
              toValue: endX,
              duration: ANIMATION.duration.long,
              easing: ANIMATION.easing.out,
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateY, {
              toValue: endY,
              duration: ANIMATION.duration.long,
              easing: ANIMATION.easing.out,
              useNativeDriver: true,
            }),
            Animated.timing(anim.rotate, {
              toValue: 360 * (3 + Math.random() * 2),
              duration: ANIMATION.duration.xlong,
              easing: ANIMATION.easing.linear,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(anim.scale, {
                toValue: 1.2,
                duration: ANIMATION.duration.fast,
                easing: ANIMATION.easing.out,
                useNativeDriver: true,
              }),
              Animated.timing(anim.scale, {
                toValue: 1,
                duration: ANIMATION.duration.medium,
                easing: ANIMATION.easing.out,
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.parallel([
            Animated.timing(anim.translateY, {
              toValue: endY + fallDistance,
              duration: ANIMATION.duration.longer,
              easing: ANIMATION.easing.in,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: ANIMATION.duration.longer,
              easing: ANIMATION.easing.out,
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 0.8,
              duration: ANIMATION.duration.longer,
              easing: ANIMATION.easing.out,
              useNativeDriver: true,
            }),
          ]),
        ]);
      });

      Animated.parallel(animations).start(() => {
        InteractionManager.runAfterInteractions(() => {
          setShowConfetti(false);
        });
        resolve();
      });
    });
  };

  const navigateAfterComplete = () => {
    if (params.planId || planId) {
      router.push({
        pathname: '/(tabs)/ReadingPlans',
        params: {
          expandedPlan: planId || params.planId,
          completedSegment: segmentId,
          timestamp: Date.now().toString(),
        },
      });
      return;
    }

    if (params.challengeId || challengeId) {
      router.push({
        pathname: '/(tabs)/ReadingPlans',
        params: {
          expandedChallenge: challengeId || params.challengeId,
          completedSegment: segmentId,
          timestamp: Date.now().toString(),
        },
      });
      return;
    }

    router.push({
      pathname: '/(tabs)/Navigation',
      params: {
        expandedBook: segmentId.substring(1, 4),
        completedSegment: segmentId,
        timestamp: Date.now().toString(),
      },
    });
  };

  const handlePress = async () => {
    if (isCompleted) {
      return;
    }

    try {
      await markSegmentComplete(segmentId, context, planId, challengeId);
      await updateLastReadSegment(segmentId);

      setIsCompleted(true);
      setCompletionColor(getCheckColor(null));

      const newCount = await getSegmentReadCount(segmentId);
      setReadCount(newCount);

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      setShowCompletionBanner(true);
      await startConfettiCelebration();
      await new Promise((resolve) => setTimeout(resolve, 150));
      navigateAfterComplete();
    } catch (error) {
      logger.error('Error marking segment complete:', error);
    }
  };

  const checkColor = isCompleted ? (completionColor || getCheckColor(null)) : '#C7C7CC';

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.checkButton, pressed && styles.checkButtonPressed]}
        android_ripple={{ color: 'rgba(0,0,0,0.1)', radius: 32, borderless: true }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="checkmark-circle" size={iconSize} color={checkColor} />
      </Pressable>
      {showCaption && (
        <Text style={styles.readCount}>{readCount > 0 ? `${readCount}` : ''}</Text>
      )}
      {showConfetti && (
        <View pointerEvents="none" style={styles.confettiLayer}>
          {confettiAnimations.current.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.confettiPiece,
                {
                  backgroundColor: ['#FF9F0A', '#007AFF', '#34C759', '#FF3B30'][index % 4],
                  transform: [
                    { translateX: anim.translateX },
                    { translateY: anim.translateY },
                    {
                      rotate: anim.rotate.interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                    { scale: anim.scale },
                  ],
                  opacity: anim.opacity,
                },
              ]}
            />
          ))}
        </View>
      )}
      <CompletionBanner
        visible={showCompletionBanner}
        onHide={() => setShowCompletionBanner(false)}
        backgroundColor="#007AFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 0,
    position: 'relative',
  },
  checkButton: {
    padding: 20,
    minWidth: 64,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
  },
  checkButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
  readCount: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
  },
});
