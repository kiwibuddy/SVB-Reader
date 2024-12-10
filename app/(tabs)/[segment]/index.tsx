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
import { useEffect, useMemo, useRef } from 'react';
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
  console.log("pathname", pathname);
  const colorScheme = "light"//useColorScheme();
  const { segmentId, updateSegmentId } = useAppContext();
  const idSplit = pathname.split("-");
  const language = idSplit[0].replace("/", "");
  const version = idSplit[1];
  const segID = idSplit[idSplit.length - 1];
  const currentSegmentIndex: number = segIds.indexOf(segID);
  const prevSegId = `${language}-${version}-${segIds[currentSegmentIndex - 1]}`;
  const nextSegId = `${language}-${version}-${segIds[currentSegmentIndex + 1]}`;
  const IsFirstSegment = currentSegmentIndex === 0;
  const IsLastSegment = currentSegmentIndex === segIds.length
  const segmentData: SegmentType | IntroType = useMemo(
    () => Bible[segID],
    [segID]
  );
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (pathname.includes(`/${language}-${version}`)) {
      updateSegmentId(pathname.replace("/", ""));
    }
  }, [pathname]);

  console.log("segmentId", segmentId);
  return (
    <>
        <ScrollView ref={scrollViewRef} style={styles.screenContainer}>
          {segID[0] === "I" && isIntroType(segmentData) ? (
            <Intro segmentData={segmentData} />
          ) : null}
          {segID[0] === "S" && isSegmentType(segmentData) ? (
            <>
              <Segment segmentData={segmentData} />
              <Questions />
            </>
          ) : null}
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              marginTop: 30,
              marginBottom: 80,
            }}
          >
            <CheckCircle segmentId={segID} iconSize={80} />
          </View>
        </ScrollView>

        {/* Sticky Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {IsFirstSegment ? null : (
            <TouchableOpacity
              style={[
                styles.prevButton,
                styles.roundButton,
                {
                  backgroundColor:
                    Colors[colorScheme === "light" ? "light" : "dark"].tint,
                }, // Ensure colorScheme is either "light" or "dark"
              ]} // Add roundButton style
              onPress={() => {
                updateSegmentId(prevSegId);
                router.push(`/${language}-${version}-${prevSegId}`);
                scrollViewRef.current?.scrollTo({
                  y: 0,
                  animated: false,
                });
              }}
            >
              <FontAwesome name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
          )}

          {IsLastSegment ? null : (
            <TouchableOpacity
              style={[
                styles.nextButton,
                styles.roundButton,
                {
                  backgroundColor:
                    Colors[colorScheme === "light" ? "light" : "dark"].tint,
                }, // Ensure colorScheme is either "light" or "dark"
              ]} // Add roundButton style
              onPress={() => {
                updateSegmentId(nextSegId);
                router.push(`/${language}-${version}-${nextSegId}`);
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
    </>
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
    flex: 1, // Allow the container to fill the screen
    backgroundColor: "white",
  },
  screenContainer: {
    flex: 1, // Allow ScrollView to fill the available space
    backgroundColor: "white",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 20, // Position at the bottom
    left: 0,
    right: 0, // Stretch to fill the width
    flexDirection: "row", // Align buttons in a row
    justifyContent: "space-between", // Space buttons evenly
    padding: 10, // Add some padding
    backgroundColor: "transparent", // Background color for visibility
    zIndex: 1000, // Ensure buttons are above other content
  },
  prevButton: {
    backgroundColor: "#007BFF", // Button color
    padding: 10,
    borderRadius: 5,
    flex: 0, // Allow button to take available space
    marginRight: 5, // Space between buttons
  },
  nextButton: {
    backgroundColor: "#007BFF", // Button color
    padding: 10,
    borderRadius: 5,
    flex: 0, // Allow button to take available space
    marginLeft: 5, // Space between buttons
  },
  buttonText: {
    color: "#FFFFFF", // Text color
    fontSize: 16,
    textAlign: "center", // Center text
  },
  roundButton: {
    width: 50, // Adjust size as needed
    height: 50,
    borderRadius: 25, // Half of width/height for a circle
    justifyContent: "center",
    alignItems: "center",
  },
});
