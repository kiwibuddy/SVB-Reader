import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
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
import { useGroupReading } from '@/context/GroupReadingContext';
import QRCodeScanner from '@/components/QRCodeScanner';
import { qrCodeDiscoveryManager } from '@/services/QRCodeDiscoveryManager';
import CompletionBanner from '@/components/Bible/CompletionBanner';
import { ANIMATION } from '@/services/animation';

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
  const { currentSession, isHost, generateCompletionQRCode } = useGroupReading();
  const [showScanner, setShowScanner] = useState(false);
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);
  
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
            // Scale animation for premium bounce effect
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
              })
            ])
          ]),
          // Gravity fall phase (realistic physics)
          Animated.parallel([
            Animated.timing(anim.translateY, {
              toValue: endY + fallDistance,
              duration: ANIMATION.duration.longer,
              easing: ANIMATION.easing.in,
              useNativeDriver: true,
            }),
            // Fade out during fall
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: ANIMATION.duration.longer,
              easing: ANIMATION.easing.out,
              useNativeDriver: true,
            }),
            // Slight scale down during fall
            Animated.timing(anim.scale, {
              toValue: 0.8,
              duration: ANIMATION.duration.longer,
              easing: ANIMATION.easing.out,
              useNativeDriver: true,
            })
          ])
        ]);
      });

      // Stagger the confetti pieces slightly for more organic feel
      const staggeredAnimations = animations.map((animation, index) => 
        Animated.sequence([
          Animated.delay(index * 30),
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
    // Group-reading host flow: generate completion QR during reading
    if (currentSession && currentSession.status === 'reading' && isHost) {
      try {
        const qrData = await generateCompletionQRCode();
        router.push({
          pathname: '/qr-share' as any,
          params: {
            sessionId: currentSession.id,
            storyTitle: currentSession.storyTitle,
            hostUserName: currentSession.hostUserName,
            qrCodeData: qrData,
          }
        });
      } catch (e) {
        console.error('Error generating completion QR:', e);
      }
      return;
    }

    // Group-reading joiner flow: scan completion QR to mark complete
    if (currentSession && currentSession.status === 'reading' && !isHost) {
      setShowScanner(true);
      return;
    }

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
        
        // Start banner + confetti celebration animation
        setShowCompletionBanner(true);
        await startConfettiCelebration();

        // Non-blocking success toast
        try {
          const Toast = require('react-native-root-toast');
          Toast.show('Story complete! Great job 🎉', {
            duration: Toast.durations.SHORT,
            position: Toast.positions.BOTTOM,
          });
        } catch {}

        // Add small delay to ensure database writes are complete before navigation
        await new Promise(resolve => setTimeout(resolve, 150));

        // Navigate back to the source screen using push to maintain navigation stack
        if (params.planId || planId) {
          router.push('/(tabs)/Plan');
        } else if (params.challengeId || challengeId) {
          router.push('/(tabs)/Reading-Challenges');
        } else {
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
        {currentSession && currentSession.status === 'reading' ? (
          <Ionicons
            name={isHost ? ('qr-code-outline' as any) : ('people-circle' as any)}
            size={iconSize}
            color={'#007AFF'}
          />
        ) : (
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={iconSize}
            color={isCompleted ? getCheckColor(completionColor) : colors.secondary}
          />
        )}
      </Pressable>
      {/* Contextual caption for group-reading */}
      {currentSession && currentSession.status === 'reading' && (
        <Text style={[styles.caption, { color: colors.secondary }]}>
          {isHost ? 'Generate completion QR' : 'Scan completion QR'}
        </Text>
      )}
      
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

      {/* Joiner completion scanner */}
      {showScanner && (
        <View style={StyleSheet.absoluteFill}>
          <QRCodeScanner
            title="Scan Completion QR"
            onClose={() => setShowScanner(false)}
            onQRCodeScanned={async (data: string) => {
              try {
                const completion = qrCodeDiscoveryManager.parseCompletionFromQRCode(data);
                if (!completion) {
                  // invalid payload
                  setShowScanner(false);
                  return;
                }
                // Validate against current session
                if (!currentSession || completion.sessionId !== currentSession.id || completion.storyId !== currentSession.storyId) {
                  try {
                    const Toast = require('react-native-root-toast');
                    Toast.show('This completion code is for a different session.', { duration: Toast.durations.SHORT, position: Toast.positions.BOTTOM });
                  } catch {}
                  setShowScanner(false);
                  return;
                }
                // Mark complete once validated
                await markSegmentComplete(segmentId, context, planId, challengeId);
                await updateLastReadSegment(segmentId);
                setIsCompleted(true);
                const newCount = await getSegmentReadCount(segmentId);
                setReadCount(newCount);
                setShowScanner(false);
                setShowCompletionBanner(true);
                await startConfettiCelebration();
              } catch (err) {
                console.error('Error processing completion QR:', err);
                try {
                  const Toast = require('react-native-root-toast');
                  Toast.show('Could not process code. Please try again.', { duration: Toast.durations.SHORT, position: Toast.positions.BOTTOM });
                } catch {}
                setShowScanner(false);
              }
            }}
          />
        </View>
      )}
      <CompletionBanner
        visible={showCompletionBanner}
        onHide={() => setShowCompletionBanner(false)}
        backgroundColor={'#007AFF'}
      />
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
  caption: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
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
