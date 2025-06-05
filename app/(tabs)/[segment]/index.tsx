import React, { useEffect, useMemo, useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Image, Platform, ScrollView, View, TouchableOpacity, Text, SafeAreaView, StatusBar } from 'react-native';
import { useAppContext } from '@/context/GlobalContext';
import BibleData from "@/assets/data/newBibleNLT1.json"
import readingPlansData from "@/assets/data/ReadingPlansChallenges.json";
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, usePathname, useLocalSearchParams } from "expo-router";
import { Animated } from 'react-native';
import { useBottomNavAnimation } from '@/context/BottomNavContext';
import Segment from '@/components/Bible/Segment';
import { SegmentType, IntroType, isIntroType, isSegmentType } from "@/types";
import Intro from '@/components/Bible/Intro';
import Questions from '@/components/Questions';
import CheckCircle from '@/components/CheckCircle';
import CelebrationPopup from '@/components/Bible/CelebrationPopup';
import StickyHeader from '@/components/StickyHeader';
import { useAppSettings } from '@/context/AppSettingsContext';
import { startReadingSession, updateReadingSession } from '@/api/sqlite';

// Define the type for Bible
type BibleType = { [key: string]: SegmentType | IntroType };

const Bible: BibleType = BibleData as BibleType; // Type assertion to ensure correct type

const segIds = Object.keys(Bible);

// Move styles outside component
const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
  },
  subtitle: {
    color: colors.secondary,
  },
  roleSelector: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "column",
    gap: 8,
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSpacer: {
    height: 16,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 104,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 1000,
    backgroundColor: 'transparent'
  },
  roundButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  prevButton: {
    marginRight: 'auto',
  },
  nextButton: {
    marginLeft: 'auto',
  },
  checkCircleContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 104,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text,
  },
  navigationButton: {
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  }
});

export default function BibleScreen() {
  const { colors } = useAppSettings();
  const { updateSegmentId, language, version } = useAppContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { planId, challengeId, verse } = params;
  const scrollViewRef = useRef<ScrollView>(null);
  const { isVisible } = useBottomNavAnimation();
  
  // Create our own animation value that matches the bottom nav
  const [bottomNavVisible] = useState(new Animated.Value(1));
  const lastScrollY = useRef(0);
  
  // Celebration popup state
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Parse segmentID first
  const segID = useMemo(() => {
    const segment = params.segment as string;
    return segment.includes('-') ? segment.split('-').pop() || '' : segment;
  }, [params.segment]);

  // Get segment data
  const segmentData = useMemo(() => {
    if (!segID) return undefined;
    return Bible[segID];
  }, [segID]);
  
  // Create styles AFTER we ensure we have all the data we need
  const styles = useMemo(() => {
    if (!colors) {
      // Provide minimal fallback styles
      return StyleSheet.create({
        container: { flex: 1, backgroundColor: '#fff' },
        screenContainer: { flex: 1 },
        headerSpacer: { height: 20 },
        checkCircleContainer: { 
          alignItems: 'center', 
          paddingHorizontal: 20,
        },
        buttonContainer: { position: 'absolute', bottom: 24, right: 16, flexDirection: 'row', gap: 12 },
        navigationButton: { 
          backgroundColor: '#f0f0f0', 
          borderRadius: 25, 
          width: 50, 
          height: 50, 
          justifyContent: 'center', 
          alignItems: 'center' 
        }
      });
    }
    return createStyles(colors);
  }, [colors]);

  // Update segment ID when it changes
  useEffect(() => {
    if (segID) {
      updateSegmentId(segID);
    }
  }, [segID, updateSegmentId]);

  // Add debugging for verse parameter
  useEffect(() => {
    if (verse) {
      console.log('BibleScreen received verse parameter:', verse);
    }
  }, [verse]);

  // Celebration handlers
  const handleCelebration = () => {
    setShowCelebration(true);
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    
    // Use setTimeout to ensure navigation happens after render cycle
    setTimeout(() => {
      // Navigate based on context
      if (params.planId) {
        router.push('/Plan');
      } else if (params.challengeId) {
        router.push('/Reading-Challenges');
      } else {
        router.push('/Navigation');
      }
    }, 0);
  };

  // Show loading state if data isn't ready
  if (!segID || !segmentData || !colors) {
    return (
      <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors?.background || '#fff' }]}>
        <Text style={{ color: colors?.text || '#000' }}>Loading...</Text>
      </View>
    );
  }

  // Navigation handler
  const handleNavigation = (segId: string) => {
    const cleanSegId = segId.includes('-') ? segId.split('-').pop() || segId : segId;
    
    updateSegmentId(cleanSegId);
    router.push({
      pathname: "/[segment]",
      params: {
        segment: cleanSegId,
        ...(planId ? { planId } : {}),
        ...(challengeId ? { challengeId } : {})
      }
    });
    scrollViewRef.current?.scrollTo({
      y: 0,
      animated: false,
    });
  };

  // Get context-aware navigation segments
  const { prevSegId, nextSegId } = useMemo(() => {
    // Make sure language and version are defined
    if (!language || !version) {
      return { prevSegId: null, nextSegId: null };
    }

    if (planId) {
      // Get segments from the current plan
      const plan = readingPlansData.plans.find(p => p.id === planId);
      const planSegments = plan ? Object.values(plan.segments)
        .flatMap(book => book?.segments || [])
        .filter(seg => !seg.startsWith('I')) : [];
      
      const currentIndex = planSegments.indexOf(segID);
      return {
        prevSegId: currentIndex > 0 ? `${language}-${version}-${planSegments[currentIndex - 1]}` : null,
        nextSegId: currentIndex < planSegments.length - 1 ? `${language}-${version}-${planSegments[currentIndex + 1]}` : null
      };
    } 
    else if (challengeId) {
      // Get segments from the current challenge
      const challenge = readingPlansData.challenges.find(c => c.id === challengeId);
      const challengeSegments = challenge ? Object.values(challenge.segments)
        .flatMap(book => book?.segments || [])
        .filter(seg => !seg.startsWith('I')) : [];
      
      const currentIndex = challengeSegments.indexOf(segID);
      return {
        prevSegId: currentIndex > 0 ? `${language}-${version}-${challengeSegments[currentIndex - 1]}` : null,
        nextSegId: currentIndex < challengeSegments.length - 1 ? `${language}-${version}-${challengeSegments[currentIndex + 1]}` : null
      };
    }
    else {
      // Default navigation through all segments
      const currentSegmentIndex = segIds.indexOf(segID);
      return {
        prevSegId: currentSegmentIndex > 0 ? `${language}-${version}-${segIds[currentSegmentIndex - 1]}` : null,
        nextSegId: currentSegmentIndex < segIds.length - 1 ? `${language}-${version}-${segIds[currentSegmentIndex + 1]}` : null
      };
    }
  }, [segID, planId, challengeId, language, version]);

  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    
    // Same animation logic as bottom navigation bar
    if (currentOffset > lastScrollY.current && currentOffset > 50) {
      // Scrolling down - hide bottom nav and move buttons down
      Animated.spring(bottomNavVisible, {
        toValue: 0,
        useNativeDriver: true, // Match bottom nav exactly
        tension: 100,
        friction: 10
      }).start();
    } else if (currentOffset < lastScrollY.current) {
      // Scrolling up - show bottom nav and move buttons up
      Animated.spring(bottomNavVisible, {
        toValue: 1,
        useNativeDriver: true, // Match bottom nav exactly
        tension: 100,
        friction: 10
      }).start();
    }
    lastScrollY.current = currentOffset;
    
    // Call the global scroll handler for the actual bottom nav
    if (global.handleBottomNavScroll) {
      global.handleBottomNavScroll(event);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef} 
        style={styles.screenContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.headerSpacer} />
        {segID[0] === "I" && isIntroType(segmentData) && (
          <Intro segmentData={{...segmentData, id: segID}} />
        )}
        {segID[0] === "S" && isSegmentType(segmentData) && (
          <>
            <Segment 
              segmentData={segmentData}
              context={planId ? 'plan' : challengeId ? 'challenge' : 'main'}
              planId={planId as string}
              challengeId={challengeId as string}
              verse={verse}
            />
            <Questions segmentId={segID} />
            <Animated.View style={[
              styles.checkCircleContainer,
              {
                transform: [{
                  translateY: bottomNavVisible.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0], // Move up 20px when nav is hidden, normal position when visible
                    extrapolate: 'clamp'
                  })
                }]
              }
            ]}>
              <CheckCircle 
                segmentId={segID} 
                iconSize={60}
                context={planId ? 'plan' : challengeId ? 'challenge' : 'main'}
                planId={planId as string || undefined}
                challengeId={challengeId as string || undefined}
                onCelebration={handleCelebration}
              />
            </Animated.View>
          </>
        )}
      </ScrollView>

      <Animated.View style={[
        styles.buttonContainer,
        {
          transform: [{
            translateY: bottomNavVisible.interpolate({
              inputRange: [0, 1],
              outputRange: [80, 0], // Move down 80px when nav is hidden, normal position when visible
            })
          }]
        }
      ]}>
        {prevSegId && (
          <TouchableOpacity
            style={styles.navigationButton}
            onPress={() => handleNavigation(prevSegId)}
          >
            <Ionicons name="chevron-back" size={24} color={colors.secondary} />
          </TouchableOpacity>
        )}

        {nextSegId && (
          <TouchableOpacity
            style={styles.navigationButton}
            onPress={() => handleNavigation(nextSegId)}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.secondary} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Render CelebrationPopup at root level for proper screen positioning */}
      <CelebrationPopup 
        visible={showCelebration} 
        onComplete={handleCelebrationComplete}
      />
    </View>
  );
}
