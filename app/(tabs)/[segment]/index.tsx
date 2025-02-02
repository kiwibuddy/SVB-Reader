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
import StickyHeader from '@/components/StickyHeader';

// Define the type for Bible
type BibleType = { [key: string]: SegmentType | IntroType };

const Bible: BibleType = BibleData as BibleType; // Type assertion to ensure correct type

const segIds = Object.keys(Bible);

export default function BibleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { planId, challengeId } = params;
  const pathname = usePathname();
  const { segmentId, updateSegmentId, language, version } = useAppContext();
  const colorScheme = "light";
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Extract just the segment ID from the full path and clean it
  const segID = useMemo(() => {
    const parts = pathname?.split("-") || [];
    return parts[parts.length - 1]?.replace("/", "") || "";
  }, [pathname]);

  // Get context-aware navigation segments
  const { prevSegId, nextSegId } = useMemo(() => {
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
  }, [segID, planId, challengeId]);

  // Get the segment data
  const segmentData: SegmentType | IntroType | undefined = useMemo(
    () => segID ? Bible[segID] : undefined,
    [segID]
  );

  useEffect(() => {
    if (segID && segmentData) {
      updateSegmentId(segID);
    }
  }, [segID, segmentData]);

  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    // Call the global scroll handler if it exists
    if (global.handleBottomNavScroll) {
      global.handleBottomNavScroll(event);
    }
  };

  // Show loading state
  if (!segID || !segmentData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const { isVisible } = useBottomNavAnimation();

  // Update navigation handlers to preserve context
  const handleNavigation = (segId: string) => {
    updateSegmentId(segId);
    router.push({
      pathname: "/[segment]",
      params: {
        segment: segId,
        ...(planId ? { planId } : {}),
        ...(challengeId ? { challengeId } : {})
      }
    });
    scrollViewRef.current?.scrollTo({
      y: 0,
      animated: false,
    });
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
          <Intro segmentData={segmentData} />
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
          </>
        )}
        <View style={styles.checkCircleContainer}>
          <CheckCircle segmentId={segID} iconSize={80} />
        </View>
      </ScrollView>

      <Animated.View style={[
        styles.buttonContainer,
        {
          transform: [{
            translateY: isVisible.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -16], // Reduced movement when nav is visible
            })
          }],
          bottom: isVisible.interpolate({
            inputRange: [0, 1],
            outputRange: [24, 80], // 24px from bottom when hidden, 80px when nav visible
          })
        }
      ]}>
        {prevSegId && (
          <TouchableOpacity
            style={[styles.roundButton, styles.prevButton]}
            onPress={() => handleNavigation(prevSegId)}
          >
            <FontAwesome name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
        )}

        {nextSegId && (
          <TouchableOpacity
            style={[styles.roundButton, styles.nextButton]}
            onPress={() => handleNavigation(nextSegId)}
          >
            <FontAwesome name="arrow-right" size={20} color="white" />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  screenContainer: {
    flex: 1, // Allow ScrollView to fill the available space
    backgroundColor: "white",
  },
  headerSpacer: {
    height: 16, // Match Home.tsx top padding
  },
  buttonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
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
    backgroundColor: "#007BFF",
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 80,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});
