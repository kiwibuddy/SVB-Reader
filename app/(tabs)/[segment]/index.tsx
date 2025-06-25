import React, { useEffect, useMemo, useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Image, Platform, FlatList, ScrollView, View, TouchableOpacity, Text, SafeAreaView, StatusBar } from 'react-native';
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
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 140, // Fixed position above bottom navigation
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 1000,
    backgroundColor: 'transparent',
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
    paddingTop: 16,
    paddingBottom: 100, // Keep this exact distance from bottom navigation bar
    marginTop: 0,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  contentContainer: {
    paddingBottom: 20, // Minimal padding to prevent over-scroll
  }
});

export default function BibleScreen() {
  const { colors } = useAppSettings();
  const { updateSegmentId, language, version } = useAppContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { planId, challengeId } = params;
  const flatListRef = useRef<ScrollView>(null);
  const { isVisible } = useBottomNavAnimation();
  
  // Scroll state
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isArrowsVisible, setIsArrowsVisible] = useState(true);
  
  // Create styles
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Parse segmentID
  const segID = useMemo(() => {
    const segment = params.segment as string;
    return segment.includes('-') ? segment.split('-').pop() || '' : segment;
  }, [params.segment]);

  // Get segment data
  const segmentData = useMemo(() => {
    if (!segID) return undefined;
    return Bible[segID];
  }, [segID]);

  // Update segment ID when it changes
  useEffect(() => {
    if (segID) {
      updateSegmentId(segID);
    }
  }, [segID, updateSegmentId]);

  // Initialize navigation arrows as visible when entering segment
  useEffect(() => {
    setIsArrowsVisible(true);
    isVisible.setValue(1);
  }, [segID, isVisible]);

  // Get context-aware navigation segments (MUST be before early return)
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

  // Show loading state if data isn't ready
  if (!segID || !segmentData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Navigation handler
  const handleNavigation = (segId: string) => {
    const cleanSegId = segId.includes('-') ? segId.split('-').pop() || segId : segId;
    
    updateSegmentId(cleanSegId);
    router.push({
      pathname: "/(tabs)/[segment]",
      params: {
        segment: cleanSegId,
        ...(planId ? { planId } : {}),
        ...(challengeId ? { challengeId } : {})
      }
    });
    flatListRef.current?.scrollTo({
      y: 0,
      animated: false,
    });
  };

  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    
    // Use the global bottom navigation scroll handler for coordinated animations
    if (global?.handleBottomNavScroll) {
      global.handleBottomNavScroll(event);
    }
    
    // Coordinate navigation arrows with bottom navigation using iOS-style behavior
    if (currentOffset <= 100) {
      // Show when near top
      if (!isArrowsVisible) {
        setIsArrowsVisible(true);
        Animated.spring(isVisible, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 8
        }).start();
      }
    } else if (currentOffset > lastScrollY + 20) {
      // Hide when scrolling down with momentum
      if (isArrowsVisible) {
        setIsArrowsVisible(false);
        Animated.spring(isVisible, {
          toValue: 0,
          useNativeDriver: true,
          tension: 150,
          friction: 8
        }).start();
      }
    } else if (currentOffset < lastScrollY - 10) {
      // Show when scrolling up (more sensitive)
      if (!isArrowsVisible) {
        setIsArrowsVisible(true);
        Animated.spring(isVisible, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 8
        }).start();
      }
    }
    
    setLastScrollY(currentOffset);
  };

  // Render the header content that was previously in ScrollView
  const renderHeader = () => (
    <View>
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
          />
          <Questions segmentId={segID} />
          <View style={styles.checkCircleContainer}>
            <CheckCircle 
              segmentId={segID} 
              iconSize={60}
              context={planId ? 'plan' : challengeId ? 'challenge' : 'main'}
              planId={planId as string || undefined}
              challengeId={challengeId as string || undefined}
            />
          </View>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={flatListRef} 
        style={styles.screenContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
      </ScrollView>

      <Animated.View style={[
        styles.buttonContainer,
        {
          transform: [{
            translateY: isVisible.interpolate({
              inputRange: [0, 1],
              outputRange: [120, 0], // Smooth slide animation
            })
          }],
          opacity: isVisible.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1], // Fade animation
          })
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
    </View>
  );
}
