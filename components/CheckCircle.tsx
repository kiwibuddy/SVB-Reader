import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Modal, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteGlobalContext } from '@/context/SQLiteGlobalContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getCheckColor } from '@/scripts/getCheckColors';
import { 
  getSegmentReadCount, 
  getSegmentCompletionStatus, 
  markSegmentComplete,
  resetSegmentCompletion,
  recordGroupCompletion,
  getGroupJoinerCompletionCount
} from '@/api/sqlite';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useGroupReading } from '@/context/GroupReadingContext';
import QRCodeScanner from '@/components/QRCodeScanner';
import { qrCodeDiscoveryManager } from '@/services/QRCodeDiscoveryManager';
import QRCode from 'react-native-qrcode-svg';
import CompletionBanner from '@/components/Bible/CompletionBanner';
import { ANIMATION } from '@/services/animation';

interface CheckCircleProps {
  segmentId: string;
  iconSize?: number;
  context?: 'main' | 'plan' | 'challenge' | 'today';
  planId?: string;
  challengeId?: string;
  // mode controls behavior/icon rendering
  // auto: current behavior (switches based on group session)
  // normal: always behave like normal individual completion
  // group: always show group action (host generate / joiner scan)
  mode?: 'auto' | 'normal' | 'group';
  showCaption?: boolean;
  // When true, forces the control to visually start as uncompleted on mount
  // (useful to avoid stale UI when arriving fresh to a story screen)
  resetVisualStateOnMount?: boolean;
}

export default function CheckCircle({ 
  segmentId, 
  iconSize = 24, 
  context = 'main',
  planId,
  challengeId,
  mode = 'auto',
  showCaption = true,
  resetVisualStateOnMount = false
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
  const { currentSession, isHost, currentRole, generateCompletionQRCode } = useGroupReading();
  const [showScanner, setShowScanner] = useState(false);
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);
  const [showHostQRModal, setShowHostQRModal] = useState(false);
  const [hostQRData, setHostQRData] = useState<string | null>(null);
  const [joinerScans, setJoinerScans] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
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
      setIsCompleted(resetVisualStateOnMount ? false : status.isCompleted);
      setCompletionColor(status.color);
      
      // Load read count
      const count = await getSegmentReadCount(segmentId);
      setReadCount(count);
    };
    
    initializeSegment();
  }, [segmentId, context, planId, challengeId, resetVisualStateOnMount]);

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

  const inGroupContext = !!currentSession;

  const handlePress = async () => {
    const forceGroup = mode === 'group';
    const forceNormal = mode === 'normal';

    // Group-reading host flow: generate completion QR during reading
    if ((forceGroup || (!forceNormal && inGroupContext)) && isHost) {
      // Show loading overlay while session becomes ready and QR data is generated
      let generated = false;
      setHostQRData(null);
      setShowHostQRModal(false);
      setIsGenerating(true);
      try {
        // Retry briefly in case currentSession has not propagated yet
        for (let attempt = 0; attempt < 8 && !generated; attempt++) {
          if (!currentSession) {
            await new Promise(r => setTimeout(r, 200));
            continue;
          }
          const qrData = await generateCompletionQRCode();
          setHostQRData(qrData);
          try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
          const count = await getGroupJoinerCompletionCount(currentSession.id, currentSession.storyId);
          setJoinerScans(count);
          generated = true;
        }
        if (generated) {
          setShowHostQRModal(true);
        }
      } catch (e) {
        console.error('Error generating completion QR:', e);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // Group-reading joiner flow: scan completion QR to mark complete
    if ((forceGroup || (!forceNormal && inGroupContext)) && !isHost) {
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
        } else if (params.context === 'today' || context === 'today') {
          router.push('/(tabs)/Navigation');
        } else {
          router.push('/(tabs)/Navigation');
        }
        
      } catch (error) {
        console.error('Error marking segment complete:', error);
      }
    }
  };

  // Poll for joiner scan count while host modal is visible
  useEffect(() => {
    let interval: any;
    const poll = async () => {
      try {
        if (currentSession) {
          const count = await getGroupJoinerCompletionCount(currentSession.id, currentSession.storyId);
          setJoinerScans(count);
        }
      } catch {}
    };
    if (showHostQRModal) {
      poll();
      interval = setInterval(poll, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showHostQRModal, currentSession?.id, currentSession?.storyId]);

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} style={styles.checkButton}>
        {((mode === 'group') || (mode === 'auto' && inGroupContext)) ? (
          <Ionicons
            // host generates code, joiner scans code
            name={isHost ? ('qr-code-outline' as any) : ('scan-outline' as any)}
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
      {showCaption && ((mode === 'group') || (mode === 'auto' && inGroupContext)) && (
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
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowScanner(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.joinerCard}>
              <Text style={[styles.hostCardTitle, { color: '#1E1E1E' }]}>Scan Completion QR</Text>
              <Text style={[styles.hostSubtitle, { color: '#334155' }]}>Point your camera at the host’s code to record your completion.</Text>
              <View style={{ width: 220, height: 220, borderRadius: 12, overflow: 'hidden', backgroundColor: '#00000010' }}>
                <QRCodeScanner
                  title=""
                  variant="inline"
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
                await recordGroupCompletion(segmentId, currentSession.id, currentSession.storyId, currentRole || 'other_voices', false);
                await updateLastReadSegment(segmentId);
                setIsCompleted(true);
                const newCount = await getSegmentReadCount(segmentId);
                setReadCount(newCount);
                setShowScanner(false);
                setShowCompletionBanner(true);
                await startConfettiCelebration();

                // Context-aware navigation after joiner completion
                if (params.planId || planId) {
                  router.push('/(tabs)/Plan');
                } else if (params.challengeId || challengeId) {
                  router.push('/(tabs)/Reading-Challenges');
                } else if (params.context === 'today' || context === 'today') {
                  router.push('/(tabs)/Navigation');
                } else {
                  router.push('/(tabs)/Navigation');
                }
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
              <Pressable style={[styles.primaryCircle, { backgroundColor: '#007AFF', marginTop: 12 }]} onPress={() => setShowScanner(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Host completion QR blue card */}
      {showHostQRModal && hostQRData && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowHostQRModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.hostCard}>
              <Text style={styles.hostCardTitle}>Completion QR</Text>
              {currentSession && (
                <Text style={styles.hostSubtitle}>{joinerScans} of 4 scanned</Text>
              )}
              <View style={styles.qrWrapper}>
                <QRCode value={hostQRData} size={180} color="#FFFFFF" backgroundColor="#42A5F5" />
              </View>
              <Text style={styles.hostSubtitle}>Ask everyone to scan to record their completion.</Text>
              <Pressable
                style={styles.primaryCircle}
                onPress={async () => {
                  try {
                    if (!currentSession) return;
                    await markSegmentComplete(segmentId, context, planId, challengeId);
                    await recordGroupCompletion(segmentId, currentSession.id, currentSession.storyId, currentRole || 'narrator', true);
                    await updateLastReadSegment(segmentId);
                    setIsCompleted(true);
                    setShowHostQRModal(false);
                    setShowCompletionBanner(true);
                    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
                    await startConfettiCelebration();

                    // Navigate back to the proper list after host confirms completion
                    if (params.planId || planId) {
                      router.push('/(tabs)/Plan');
                    } else if (params.challengeId || challengeId) {
                      router.push('/(tabs)/Reading-Challenges');
                    } else if (params.context === 'today' || context === 'today') {
                      router.push('/(tabs)/Navigation');
                    } else {
                      router.push('/(tabs)/Navigation');
                    }
                  } catch (err) {
                    console.error('Host confirm error:', err);
                    setShowHostQRModal(false);
                  }
                }}
              >
                <Ionicons name="checkmark" size={28} color="#FFFFFF" />
              </Pressable>
              <Pressable style={styles.dismissTextButton} onPress={() => setShowHostQRModal(false)}>
                <Text style={styles.dismissText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
      <CompletionBanner
        visible={showCompletionBanner}
        onHide={() => setShowCompletionBanner(false)}
        backgroundColor={'#007AFF'}
      />

      {/* Loading overlay for story completion QR generator removed per request */}
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
    padding: 24, // Larger tap target for accessibility
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
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  hostCard: {
    backgroundColor: '#42A5F5',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    width: 360,
    maxWidth: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  joinerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    width: 360,
    maxWidth: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  hostCardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  hostSubtitle: {
    color: '#E8F2FF',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  qrWrapper: {
    backgroundColor: '#42A5F5',
    borderRadius: 12,
    padding: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  primaryCircle: {
    marginTop: 12,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissTextButton: {
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  dismissText: {
    color: '#E8F2FF',
    fontSize: 13,
    textDecorationLine: 'underline',
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
