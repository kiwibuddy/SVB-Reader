import React, { useState, useEffect, useCallback, useMemo, useRef, useContext, useReducer, useLayoutEffect, useImperativeHandle, useDebugValue } from 'react';
import logger from '@/utils/logger';
import { View, Text, Pressable, StyleSheet, Animated, Modal, ActivityIndicator, InteractionManager } from 'react-native';
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
import { showToast, showErrorToast } from '@/utils/toastUtils';

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
  iconSize = 32, // Increased default size for better tap experience
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
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionColor, setCompletionColor] = useState<string | null>(null);
  const [readCount, setReadCount] = useState(0);
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showHostQRModal, setShowHostQRModal] = useState(false);
  const [hostQRData, setHostQRData] = useState<string | null>(null);
  const [joinerScans, setJoinerScans] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Separate completion state for the modal - always starts as unchecked
  const [modalCompletionState, setModalCompletionState] = useState(false);
  
  // Ref to track if modal should stay open
  const modalShouldStayOpen = useRef(false);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const { freshStart } = params;
  const { colors } = useAppSettings();
  const { currentSession, isHost, currentRole, generateCompletionQRCode, refreshSessionFromDatabase } = useGroupReading();
  
  // Debug session state changes
  useEffect(() => {

  }, [currentSession]);

  // Debug modal state changes
  useEffect(() => {

    
    // If modal should stay open but was closed, reopen it
    if (modalShouldStayOpen.current && !showHostQRModal && hostQRData) {
      logger.info('🎯 Modal was closed unexpectedly, reopening...');
      setTimeout(() => {
        if (modalShouldStayOpen.current && hostQRData) {
          setShowHostQRModal(true);
        }
      }, 100);
    }
  }, [showHostQRModal, hostQRData]);

  // Debug modal completion state changes
  useEffect(() => {

  }, [modalCompletionState, isCompleted]);
  
  // Reset modal ref when session changes (but don't close modal if it's currently open)
  useEffect(() => {
    if (!currentSession && !showHostQRModal) {
      modalShouldStayOpen.current = false;
    }
  }, [currentSession, showHostQRModal]);

  // Prevent modal from being closed during generation
  useEffect(() => {
    if (isGenerating && showHostQRModal) {
      modalShouldStayOpen.current = true;
    }
  }, [isGenerating, showHostQRModal]);

  // Ensure modal stays open during generation
  useEffect(() => {
    if (isGenerating && modalShouldStayOpen.current && !showHostQRModal) {
              logger.info('🎯 Modal closed during generation, reopening...');
      setShowHostQRModal(true);
    }
  }, [isGenerating, showHostQRModal]);

  // Reset completion state when modal opens for new stories
  useEffect(() => {
    if (showHostQRModal && !isCompleted) {
      // Ensure the modal shows the unchecked state for new stories
      logger.info('🎯 Modal opened for new story, ensuring unchecked state');
      setModalCompletionState(false);
    }
  }, [showHostQRModal, isCompleted]);

  // Reset modal completion state when modal opens
  useEffect(() => {
    if (showHostQRModal) {
      // Always reset modal completion state to unchecked when modal opens
      logger.info('🎯 Modal opened, resetting completion state to unchecked');
      setModalCompletionState(false);
      logger.info('🎯 Modal completion state reset to:', false);
      
      // Also ensure the modal shows a fresh state
      if (hostQRData) {
        logger.info('🎯 Modal has QR data, ensuring fresh state');
      } else {
        logger.info('🎯 Modal opening without QR data, will show loading state');
      }
    }
  }, [showHostQRModal]);

  // Animation values for premium confetti celebration (more pieces for richer effect)
  const confettiAnimations = useRef<{
    translateY: Animated.Value;
    translateX: Animated.Value;
    rotate: Animated.Value;
    opacity: Animated.Value;
    scale: Animated.Value;
  }[] | null>(null);
  
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
      // Set visual state immediately if reset is requested
      if (resetVisualStateOnMount) {
  
        setIsCompleted(false);
        setCompletionColor(null);
      }
      
      // Load read count immediately (should always be visible)
      try {
        const count = await getSegmentReadCount(segmentId);
        setReadCount(count);

      } catch (error) {
        logger.error('Error loading read count:', error);
      }
      
      // Defer completion status queries to avoid scheduling during insertion phase
      InteractionManager.runAfterInteractions(async () => {
        try {
          // Load current completion status for this context
          const status = await getSegmentCompletionStatus(segmentId, context, planId, challengeId);
          // Only update visual state if reset is not requested
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
        // Defer state update to avoid scheduling during insertion phase
        InteractionManager.runAfterInteractions(() => {
          setShowConfetti(false);
        });
        // But resolve immediately to allow navigation to proceed
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
      // If modal is already showing, allow regeneration
      if (showHostQRModal) {
        logger.info('🔄 Regenerating completion QR code...');
      }
      
      // Show loading overlay while session becomes ready and QR data is generated
      let generated = false;
      setHostQRData(null);
      // Only close modal if we're not already showing it (fresh start)
      if (!showHostQRModal) {
        setShowHostQRModal(false);
      }
      setIsGenerating(true);
      
      try {
        // Retry briefly in case currentSession has not propagated yet
        for (let attempt = 0; attempt < 10 && !generated; attempt++) {
          if (!currentSession || !currentSession.id || !currentSession.storyId) {
            logger.info(`🔄 Waiting for session to be ready (attempt ${attempt + 1}/10)...`);
            
            // Try to restore session from storage if it's lost
            if (attempt > 2 && !currentSession) {
              logger.info('🔄 Attempting to restore session from database...');
              try {
                // Use the context's refresh function to restore the session
                await refreshSessionFromDatabase();
                // Wait a bit for the context to update
                await new Promise(r => setTimeout(r, 300));
                continue;
              } catch (restoreError) {
                logger.info('⚠️ Failed to restore session:', restoreError);
              }
            }
            
            await new Promise(r => setTimeout(r, 300));
            continue;
          }
          
          logger.info('✅ Session ready, generating completion QR code...');
          const qrData = await generateCompletionQRCode();
          
          // Double-check that the session is still valid after QR generation
          if (!currentSession || !currentSession.id || !currentSession.storyId) {
            logger.info('⚠️ Session became invalid during QR generation, retrying...');
            continue;
          }
          
          if (qrData && qrData.length > 0) {
            logger.info('🎯 Setting hostQRData:', qrData.substring(0, 50) + '...');
            setHostQRData(qrData);
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
            const count = await getGroupJoinerCompletionCount(currentSession.id, currentSession.storyId);
            setJoinerScans(count);
            generated = true;
            logger.info('✅ Completion QR code generated successfully');
          } else {
            logger.info('⚠️ Generated QR data is empty, retrying...');
            await new Promise(r => setTimeout(r, 300));
          }
        }
        
        if (generated) {
          logger.info('🎯 Setting modal to visible with QR data');
          modalShouldStayOpen.current = true;
          setShowHostQRModal(true);
          logger.info('🎯 Modal state set to true');
          // Add a small delay to ensure the state change propagates
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          logger.error('🔴 Failed to generate QR code after 10 attempts');
          // Try to refresh the session one more time before showing error
          try {
            await refreshSessionFromDatabase();
            if (currentSession) {
              await showErrorToast('Session restored. Please try generating the QR code again.');
            } else {
              await showErrorToast('Failed to generate QR code. Please restart the group reading session.');
            }
          } catch (refreshError) {
            logger.error('🔴 Failed to refresh session:', refreshError);
            await showErrorToast('Failed to generate QR code. Please restart the group reading session.');
          }
        }
      } catch (e) {
        logger.error('🔴 Error generating completion QR:', e);
        await showErrorToast('Error generating QR code. Please try again.');
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

        // Add small delay to ensure database writes are complete before navigation
        await new Promise(resolve => setTimeout(resolve, 150));

        // Navigate back to the source screen with context-aware parameters
        if (params.planId || planId) {
          router.push({
            pathname: '/(tabs)/ReadingPlans',
            params: { 
              expandedPlan: planId || params.planId,
              completedSegment: segmentId,
              timestamp: Date.now().toString()
            }
          });
        } else if (params.challengeId || challengeId) {
          router.push({
            pathname: '/(tabs)/ReadingPlans',
            params: { 
              expandedChallenge: challengeId || params.challengeId,
              completedSegment: segmentId,
              timestamp: Date.now().toString()
            }
          });
        } else if (params.context === 'today' || context === 'today') {
          router.push({
            pathname: '/(tabs)/Navigation',
            params: { 
              expandedBook: segmentId.substring(1, 4), // Extract book code from segment
              completedSegment: segmentId,
              timestamp: Date.now().toString()
            }
          });
        } else {
          router.push({
            pathname: '/(tabs)/Navigation',
            params: { 
              expandedBook: segmentId.substring(1, 4),
              completedSegment: segmentId,
              timestamp: Date.now().toString()
            }
          });
        }
        
      } catch (error) {
        logger.error('Error marking segment complete:', error);
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
          // Defer state update to avoid scheduling during insertion phase
          InteractionManager.runAfterInteractions(() => {
            setJoinerScans(count);
          });
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
      <Pressable 
        onPress={handlePress} 
        style={({ pressed }) => [
          ((mode === 'group') || (mode === 'auto' && inGroupContext)) ? styles.qrGeneratorButton : styles.checkButton,
          pressed && (((mode === 'group') || (mode === 'auto' && inGroupContext)) ? styles.qrGeneratorButtonPressed : styles.checkButtonPressed)
        ]}
        android_ripple={{ 
          color: 'rgba(0,0,0,0.1)', 
          radius: 32,
          borderless: true 
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
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
      
      {/* Confetti celebration overlay - MOVED HERE to appear above modal */}
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
              <Text style={[styles.hostSubtitle, { color: '#334155' }]}>Point your camera at the host's code to record your completion.</Text>
              <View style={{ width: 220, height: 220, borderRadius: 12, overflow: 'hidden', backgroundColor: '#00000010' }}>
                <QRCodeScanner
                  title=""
                  variant="inline"
                  onClose={() => setShowScanner(false)}
                  onQRCodeScanned={async (data: string) => {
              try {
                logger.info('🔍 Joiner scanning QR code:', data.substring(0, 50) + '...');
                
                const completion = qrCodeDiscoveryManager.parseCompletionFromQRCode(data);
                if (!completion) {
                  logger.error('🔴 Failed to parse completion QR code');
                  await showErrorToast('Invalid completion code. Please try again.');
                  setShowScanner(false);
                  return;
                }
                
                logger.info('✅ Completion QR code parsed:', { sessionId: completion.sessionId, storyId: completion.storyId });
                
                // Validate against current session
                if (!currentSession || completion.sessionId !== currentSession.id || completion.storyId !== currentSession.storyId) {
                  logger.error('🔴 Completion code session mismatch:', {
                    expectedSessionId: currentSession?.id,
                    actualSessionId: completion.sessionId,
                    expectedStoryId: currentSession?.storyId,
                    actualStoryId: completion.storyId
                  });
                  await showErrorToast('This completion code is for a different session.');
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
                  router.push({
                    pathname: '/(tabs)/ReadingPlans',
                    params: { 
                      expandedPlan: planId || params.planId,
                      completedSegment: segmentId,
                      timestamp: Date.now().toString()
                    }
                  });
                } else if (params.challengeId || challengeId) {
                  router.push({
                    pathname: '/(tabs)/ReadingPlans',
                    params: { 
                      expandedChallenge: challengeId || params.challengeId,
                      completedSegment: segmentId,
                      timestamp: Date.now().toString()
                    }
                  });
                } else if (params.today || context === 'today') {
                  router.push({
                    pathname: '/(tabs)/Navigation',
                    params: { 
                      expandedBook: segmentId.substring(1, 4),
                      completedSegment: segmentId,
                      timestamp: Date.now().toString()
                    }
                  });
                } else {
                  router.push({
                    pathname: '/(tabs)/Navigation',
                    params: { 
                      expandedBook: segmentId.substring(1, 4),
                      completedSegment: segmentId,
                      timestamp: Date.now().toString()
                    }
                  });
                }
              } catch (err) {
                logger.error('🔴 Joiner completion error:', err);
                await showErrorToast('Failed to record completion. Please try again.');
                setShowScanner(false);
              }
            }}
                />
              </View>
              <Pressable style={[styles.primaryCircle, { backgroundColor: '#007AFF', marginTop: 12 }]} onPress={() => setShowScanner(false)}>
                <Ionicons name="checkmark" size={28} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Host QR Code Modal */}
      {showHostQRModal && (
        <Modal 
          visible={showHostQRModal} 
          transparent 
          animationType="fade" 
          onRequestClose={() => {
            logger.info('🎯 Modal onRequestClose triggered');
            if (modalShouldStayOpen.current) {
              logger.info('🎯 Modal should stay open, ignoring close request');
              return;
            }
            logger.info('🎯 Modal closing via onRequestClose');
            setShowHostQRModal(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.hostCard}>
              <Text style={styles.hostCardTitle}>Completion QR</Text>
              <Text style={styles.hostSubtitle}>{joinerScans} of {currentSession?.participants ? currentSession.participants.length - 1 : 0} scanned</Text>
              <View style={styles.qrWrapper}>
                {hostQRData ? (
                  <QRCode value={hostQRData} size={180} color="#FFFFFF" backgroundColor="#42A5F5" />
                ) : (
                  <View style={[styles.qrWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 16, marginTop: 8 }}>Generating QR Code...</Text>
                  </View>
                )}
              </View>
              <Text style={styles.hostSubtitle}>Ask everyone to scan to record their completion.</Text>
              <Pressable
                style={[
                  styles.primaryCircle,
                  { 
                    backgroundColor: modalCompletionState ? '#4CAF50' : '#FFFFFF',
                    borderWidth: modalCompletionState ? 0 : 2,
                    borderColor: modalCompletionState ? 'transparent' : '#007AFF'
                  }
                ]}
                onPress={async () => {
                  try {
                    if (!currentSession) return;
                    
                    
                    
                    // Determine the correct context for completion
                    let completionContext: 'main' | 'plan' | 'challenge' | 'today' = 'main';
                    let contextPlanId = planId;
                    let contextChallengeId = challengeId;
                    
                    
                    
                    // Check if we're in a specific context from the current session or navigation
                    if (currentSession.planId) {
                      completionContext = 'plan';
                      contextPlanId = currentSession.planId;
                      logger.info('📚 Using plan context from session:', contextPlanId);
                    } else if (currentSession.challengeId) {
                      completionContext = 'challenge';
                      contextChallengeId = currentSession.challengeId;
                      logger.info('🏆 Using challenge context from session:', contextChallengeId);
                    } else if (context === 'plan' && planId) {
                      completionContext = 'plan';
                      contextPlanId = planId;
                      logger.info('📚 Using plan context from props:', contextPlanId);
                    } else if (context === 'challenge' && challengeId) {
                      completionContext = 'challenge';
                      contextChallengeId = challengeId;
                      logger.info('🏆 Using challenge context from props:', contextChallengeId);
                    } else if (context === 'today') {
                      completionContext = 'today';
                      logger.info('📅 Using today context');
                    } else {
                      logger.info('📖 Using main context');
                    }
                    
                    
                    
                    logger.info('🎯 Host confirming completion for segment:', segmentId, 'in context:', completionContext);
                    
                    // Mark segment as complete in the appropriate context
                    if (completionContext === 'plan' && contextPlanId) {
                      logger.info('📚 Marking segment complete in plan context:', contextPlanId);
                      await markSegmentComplete(segmentId, 'plan', contextPlanId, contextChallengeId);
                    } else if (completionContext === 'challenge' && contextChallengeId) {
                      logger.info('🏆 Marking segment complete in challenge context:', contextChallengeId);
                      await markSegmentComplete(segmentId, 'challenge', contextPlanId, contextChallengeId);
                    } else if (completionContext === 'today') {
                      logger.info('📅 Marking segment complete in today context');
                      await markSegmentComplete(segmentId, 'today', contextPlanId, contextChallengeId);
                    } else {
                      logger.info('📖 Marking segment complete in main context');
                      await markSegmentComplete(segmentId, 'main', contextPlanId, contextChallengeId);
                    }
                    
                    // Record group completion
                    logger.info('👥 Recording group completion');
                    await recordGroupCompletion(segmentId, currentSession.id, currentSession.storyId, currentRole || 'narrator', true);
                    
                    // Update last read segment
                    await updateLastReadSegment(segmentId);
                    
                    // Update both local state and modal state
                    setIsCompleted(true);
                    setModalCompletionState(true);
                    
                    logger.info('✅ Segment marked as complete, showing celebration');
                    
                    // Show completion banner and confetti
                    setShowCompletionBanner(true);
                    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
                    await startConfettiCelebration();

                    // Close the QR modal after completion
                    modalShouldStayOpen.current = false;
                    setShowHostQRModal(false);
                    
                    logger.info('�� Navigating back to context-aware screen');
                    
                    // Navigate back to the appropriate context-aware screen
                    setTimeout(() => {
                      // Check if session is still available for context
                      if (!currentSession) {
                
                        // Fallback to props context if session is lost
                        if (context === 'plan' && planId) {
                          completionContext = 'plan';
                          contextPlanId = planId;
                        } else if (context === 'challenge' && challengeId) {
                          completionContext = 'challenge';
                          contextChallengeId = challengeId;
                        } else if (context === 'today') {
                          completionContext = 'today';
                        } else {
                          completionContext = 'main';
                        }
                
                      }
                      
                      if (completionContext === 'plan' && contextPlanId) {
                        logger.info('📚 Navigating to Plan screen with expanded plan:', contextPlanId);
                        const navigationParams = { 
                          expandedPlan: contextPlanId,
                          completedSegment: segmentId,
                          timestamp: Date.now().toString()
                        };
                
                        router.push({
                          pathname: '/(tabs)/ReadingPlans',
                          params: navigationParams
                        });
                      } else if (completionContext === 'challenge' && contextChallengeId) {
                        logger.info('🏆 Navigating to Reading-Challenges screen with expanded challenge:', contextChallengeId);
                        const navigationParams = { 
                          expandedChallenge: contextChallengeId,
                          completedSegment: segmentId,
                          timestamp: Date.now().toString()
                        };
                
                        router.push({
                          pathname: '/(tabs)/ReadingPlans',
                          params: navigationParams
                        });
                      } else if (completionContext === 'today') {
                        logger.info('📅 Navigating to Navigation screen for today context');
                        const navigationParams = { 
                          expandedBook: segmentId.substring(1, 4),
                          completedSegment: segmentId,
                          timestamp: Date.now().toString()
                        };
                
                        router.push({
                          pathname: '/(tabs)/Navigation',
                          params: navigationParams
                        });
                      } else {
                        logger.info('📖 Navigating to Navigation screen for main context');
                        const navigationParams = { 
                          expandedBook: segmentId.substring(1, 4),
                          completedSegment: segmentId,
                          timestamp: Date.now().toString()
                        };
                
                        // Default to main navigation
                        router.push({
                          pathname: '/(tabs)/Navigation',
                          params: navigationParams
                        });
                      }
                    }, 500); // Small delay to ensure completion banner is visible

                  } catch (err) {
                    logger.error('🔴 Host confirm error:', err);
                    modalShouldStayOpen.current = false;
                    setShowHostQRModal(false);
                  }
                }}
              >
                <Ionicons 
                  name="checkmark" 
                  size={28} 
                  color={modalCompletionState ? "#FFFFFF" : "#007AFF"} 
                />
              </Pressable>
              
              {/* Button state indicator */}
              <Text style={[styles.hostSubtitle, { marginTop: 8, fontSize: 12 }]}>
                {modalCompletionState ? 'Story Completed!' : 'Tap to complete story'}
              </Text>
              <Pressable style={styles.dismissTextButton} onPress={() => {
                logger.info('🎯 Dismiss button pressed, closing modal');
                modalShouldStayOpen.current = false;
                setShowHostQRModal(false);
                // Don't trigger completion - just close the modal
              }}>
                <Text style={styles.dismissText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
      <CompletionBanner
        visible={showCompletionBanner && !showHostQRModal}
        onHide={() => setShowCompletionBanner(false)}
        backgroundColor={'#007AFF'}
      />

      {/* Loading overlay for QR generation - REMOVED */}
      {/* Now handled within the main QR modal */}
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
    padding: 20, // Generous tap target that surrounds the larger icon
    minWidth: 64, // Increased for better tap experience with larger icon
    minHeight: 64, // Increased for better tap experience with larger icon
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32, // Half of minHeight/minWidth for circular touch area
    // Add subtle background for visual feedback (useful for debugging tap area)
    // backgroundColor: 'rgba(0,0,0,0.05)', // Uncomment to visualize tap area
  },
  checkButtonPressed: {
    opacity: 0.6, // Visual feedback when pressed on iOS
    transform: [{ scale: 0.95 }], // Slight scale down when pressed
  },
  qrGeneratorButton: {
    padding: 20, // Match the circle complete button padding
    minWidth: 80, // Increased from 64 for better touch target
    minHeight: 80, // Increased from 64 for better touch target
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40, // Increased from 32 to match new size
    // Add subtle background for visual feedback (useful for debugging tap area)
    // backgroundColor: 'rgba(0,0,0,0.05)', // Uncomment to visualize tap area
  },
  qrGeneratorButtonPressed: {
    opacity: 0.6, // Visual feedback when pressed on iOS
    transform: [{ scale: 0.95 }], // Slight scale down when pressed
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
    zIndex: 1000, // Ensure modal appears above other content
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
    zIndex: 9999, // Much higher z-index to appear above modal
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
