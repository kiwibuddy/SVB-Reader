import React, { useEffect, useMemo, useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Image, Platform, ScrollView, View, TouchableOpacity, Text, SafeAreaView, StatusBar } from 'react-native';
import { useAppContext } from '@/context/GlobalContext';
import BibleData from "@/assets/data/newBibleNLT1.json"

// Define the type for Bible
type BibleType = { [key: string]: SegmentType | IntroType };

const Bible: BibleType = BibleData as BibleType; // Type assertion to ensure correct type

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Segment from '@/components/Bible/Segment';
import { SegmentType, IntroType, isIntroType, isSegmentType } from "@/types";
import Intro from '@/components/Bible/Intro';
import { FontAwesome } from '@expo/vector-icons'; // Ensure you have this import
// import { useColorScheme } from '@/hooks/useColorScheme.web';
import { Colors } from '@/constants/Colors';
import Questions from '@/components/Questions';
import CheckCircle from '@/components/CheckCircle';
import StickyHeader from '@/components/StickyHeader';
import { useRouter, usePathname } from "expo-router";


const segIds = Object.keys(Bible);

export default function BibleScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { segmentId, updateSegmentId } = useAppContext();
  const colorScheme = "light";
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Extract just the segment ID from the full path and clean it
  const segID = useMemo(() => {
    const parts = pathname?.split("-") || [];
    return parts[parts.length - 1]?.replace("/", "") || "";
  }, [pathname]);

  // Get navigation variables
  const {
    currentSegmentIndex,
    prevSegId,
    nextSegId,
    IsFirstSegment,
    IsLastSegment
  } = useMemo(() => {
    const currentSegmentIndex = segIds.indexOf(segID);
    const language = "en";
    const version = "NLT";
    
    return {
      currentSegmentIndex,
      prevSegId: currentSegmentIndex > 0 ? `${language}-${version}-${segIds[currentSegmentIndex - 1]}` : null,
      nextSegId: currentSegmentIndex < segIds.length - 1 ? `${language}-${version}-${segIds[currentSegmentIndex + 1]}` : null,
      IsFirstSegment: currentSegmentIndex === 0,
      IsLastSegment: currentSegmentIndex === segIds.length - 1
    };
  }, [segID]);

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
            <Segment segmentData={segmentData} />
            <Questions segmentId={segID} />
          </>
        )}
        <View style={styles.checkCircleContainer}>
          <CheckCircle segmentId={segID} iconSize={80} />
        </View>
      </ScrollView>

      {/* Navigation buttons - fixed position */}
      <View style={styles.buttonContainer}>
        {!IsFirstSegment && prevSegId && (
          <TouchableOpacity
            style={[styles.roundButton, styles.prevButton]}
            onPress={() => {
              updateSegmentId(prevSegId);
              router.push(`/${prevSegId}`);
              scrollViewRef.current?.scrollTo({
                y: 0,
                animated: false,
              });
            }}
          >
            <FontAwesome name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
        )}

        {!IsLastSegment && nextSegId && (
          <TouchableOpacity
            style={[styles.roundButton, styles.nextButton]}
            onPress={() => {
              updateSegmentId(nextSegId);
              router.push(`/${nextSegId}`);
              scrollViewRef.current?.scrollTo({
                y: 0,
                animated: false,
              });
            }}
          >
            <FontAwesome name="arrow-right" size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>
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
    bottom: 90, // Fixed position above the bottom navigation
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 1000,
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
