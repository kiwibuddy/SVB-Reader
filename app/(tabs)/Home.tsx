//my first edit
import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
  FlatList
} from "react-native";
import Card from "@/components/Card";
import ReadingPlansChallenges from "../../assets/data/ReadingPlansChallenges.json";
import StickyHeader from "../../components/StickyHeader";
import { useAppContext } from "@/context/GlobalContext";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { useRouter } from "expo-router";

const segIDs = Object.keys(SegmentTitles);

const HomeScreen = () => {
  const { segmentId } = useAppContext();
  const router = useRouter();
  const segSplit = segmentId.split("-");
  const segID = segSplit[segSplit.length - 1];
  const segIndex = segIDs.findIndex(id => id === segID);
  const nextSegID = segIDs[segIndex + 1] || "S001";
  const nextSegData = SegmentTitles[nextSegID as keyof typeof SegmentTitles] ? SegmentTitles[nextSegID as keyof typeof SegmentTitles] : SegmentTitles[`S001`];
  useEffect(() => {
    console.log("nextSegData", nextSegData);
    console.log("nextSegID", nextSegID);
    console.log("segmentId", segmentId);
  }, [segmentId]);
  return (
    <>
      <ScrollView style={styles.container}>
        {/* <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
        /> */}

        <Text style={styles.title}>SOURCEVIEW</Text>
        <Text style={styles.subtitle}>YOUTH</Text>

        {/* Square Buttons Layout */}
        <View style={styles.buttonGrid}>
          <Pressable
            style={[styles.squareButton, { backgroundColor: "#3B82F6" }]}
          >
            <Text style={styles.squareButtonText}>Reading Plans</Text>
          </Pressable>
          <Pressable
            style={[styles.squareButton, { backgroundColor: "#FF66B3" }]}
          >
            <Text style={styles.squareButtonText}>Reading Challenges</Text>
          </Pressable>
          <Pressable
            style={[styles.squareButton, { backgroundColor: "#A0FFB3" }]}
          >
            <Text style={styles.squareButtonText}>Emoji Reactions</Text>
          </Pressable>
          <Pressable
            style={[styles.squareButton, { backgroundColor: "#FF7851" }]}
          >
            <Text style={styles.squareButtonText}>
              How to start a Bible Reading Group
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.stickyButtonContainer}>
        <Pressable
          style={styles.button}
          onPress={() =>
            router.push(`/${segSplit[0]}-${segSplit[1]}-${nextSegID}`)
          }
        >
          <Text style={styles.buttonText}>Read Next Segment</Text>
          <Text
            style={styles.buttonRefText}
          >{`(${nextSegData.book[0]} ${nextSegData.ref})`}</Text>
        </Pressable>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingHorizontal: 10,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 28,
    color: "#A7FF00",
    textAlign: "center",
    marginBottom: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  seeAll: {
    fontSize: 14,
    color: "#FF5733",
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#FF5733",
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginTop: 50,
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonRefText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontStyle: "italic",
    textAlign: "center",
  },
  flatListContent: {
    paddingVertical: 10,
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 10,
  },
  squareButton: {
    width: "48%",
    height: 0,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 10,
  },
  squareButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "bold",
    textAlign: "center",
  },
  stickyButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: "#FFF", // Optional: to match the background
    marginHorizontal: 10,
    marginBottom: 40,
  },
});

export default HomeScreen;
