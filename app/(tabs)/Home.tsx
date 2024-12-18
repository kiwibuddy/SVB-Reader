//my first edit
import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
  FlatList,
  ImageBackground
} from "react-native";
import Card from "@/components/Card";
import ReadingPlansChallenges from "../../assets/data/ReadingPlansChallenges.json";
import StickyHeader from "../../components/StickyHeader";
import { useAppContext } from "@/context/GlobalContext";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { useRouter } from "expo-router";

type SegmentTitle = {
  Segment: string;
  title: string;
  book: string[];
  ref?: string;  // Making ref optional since not all segments have it
}

const segIDs = Object.keys(SegmentTitles);

const HomeScreen = () => {
  const { segmentId } = useAppContext();
  const router = useRouter();
  const segSplit = segmentId.split("-");
  const segID = segSplit[segSplit.length - 1];
  const segIndex = segIDs.findIndex(id => id === segID);
  const nextSegID = segmentId ? (segIDs[segIndex + 1] || "S001") : "S001";
  const nextSegData = SegmentTitles[nextSegID as keyof typeof SegmentTitles] as SegmentTitle;
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
            style={[styles.squareButton, { backgroundColor: 'transparent' }]}
            onPress={() => router.push("/Plan")}
          >
            <ImageBackground
              source={require("@/assets/images/button1.png")}
              style={styles.buttonBackground}
              resizeMode="cover"
            >
              <Text style={styles.squareButtonText}>Reading Plans</Text>
            </ImageBackground>
          </Pressable>
          <Pressable
            style={[styles.squareButton, { backgroundColor: "#FF66B3" }]}
            onPress={() => router.push("/Reading-Challenges")}
          >
            <ImageBackground
              source={require("@/assets/images/button2.png")}
              style={styles.buttonBackground}
              resizeMode="cover"
            >
              <Text style={styles.squareButtonText}>Reading Challenges</Text>
            </ImageBackground>
          </Pressable>
          <Pressable
            style={[styles.squareButton, { backgroundColor: 'transparent' }]}
            onPress={() => router.push("/Reading-emoji")}
>
            <ImageBackground
              source={require("@/assets/images/button4.png")}
              style={styles.buttonBackground}
              resizeMode="cover"
            >
              <Text style={styles.squareButtonText}>Emoji Reactions</Text>
            </ImageBackground>
          </Pressable>
          <Pressable
            style={[styles.squareButton, { backgroundColor: 'transparent' }]}
            onPress={() => router.push("/Reading-movement")}
          >
            <ImageBackground
              source={require("@/assets/images/button11.jpg")}
              style={styles.buttonBackground}
              resizeMode="cover"
            >
              <Text style={styles.squareButtonText}>
                How to start a Bible Reading Group
              </Text>
            </ImageBackground>
          </Pressable>
        </View>

        {/* Added Welcome Text Section */}
        <View style={styles.textContainer}>
          <Text style={styles.welcomeTitle}>Welcome to SourceView Youth Bible</Text>
          <Text style={styles.welcomeText}>
            Experience the Bible as a dynamic conversation. Dive into God's Word with your friends and watch it come alive!
          </Text>

          <Text style={styles.sectionTitle}>Read with Friends 👥</Text>
          <Text style={styles.sectionText}>
            Gather your group and dive into Scripture together. Choose your reading role and watch your parts light up, transforming Bible study into an immersive experience.
          </Text>

          <Text style={styles.sectionTitle}>Conversations Come Alive 💬</Text>
          <Text style={styles.sectionText}>
            See the Bible in a new light as you read the words of God, prophets, and key figures in speech bubbles. Feel the emotions, conflicts, and triumphs as you step into their shoes.
          </Text>

          <Text style={styles.sectionTitle}>React and Connect 🙌</Text>
          <Text style={styles.sectionText}>
            Respond to powerful messages with emojis. 👍, ❤️, 🙏or be 😲 by messages as you read. Easily revisit your reactions later to reflect on how God's Word is shaping you.
          </Text>

          <Text style={styles.sectionTitle}>Journey Through Scripture 👣</Text>
          <Text style={styles.sectionText}>
            Embark on reading plans with friends. Gain a deeper understanding of the Bible's overarching narrative or focus on specific themes and characters through shorter focused challenges.
          </Text>

          <Text style={styles.sectionTitle}>Simple Bible Studies 👥</Text>
          <Text style={styles.sectionText}>
            At the end of each of the 365 stories of scripture you'll find simple Bible study questions to help stir discussions and take you deeper in your understanding of God's word.
          </Text>

          <Text style={styles.sectionTitle}>Experience the SourceView Difference</Text>
          <Text style={styles.sectionText}>
            Embrace a format designed for the digital age. See entire conversations in context, not just isolated verses. This helps bring understanding and the full impact the dynamic conversations and speeches in the Bible.
          </Text>

          <Text style={styles.sectionTitle}>Transform Your World</Text>
          <Text style={styles.sectionText}>
            Let God's living Word revolutionize your life and impact those around you. Join a movement of your generation encountering Scripture in fresh, powerful ways and watch as it changes everything.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.stickyButtonContainer}>
        <Pressable
          style={styles.button}
          onPress={() => {
            if (!segmentId) {
              router.push(`/Gen-1-S001`);
            } else {
              router.push(`/${segSplit[0]}-${segSplit[1]}-${nextSegID}`);
            }
          }}
        >
          <Text style={styles.buttonText}>Read Next Segment</Text>
          <Text style={styles.buttonRefText}>
            {`${nextSegData.book[0]}${nextSegData.ref ? ' ' + nextSegData.ref : ''}`}
          </Text>
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
    fontFamily: "Mistrully",
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
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
    overflow: 'hidden',
  },
  squareButtonText: {
    fontSize: 20,
    color: "#FFF",
    fontWeight: "bold",
    textAlign: "center",
  },
  stickyButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 5,
    backgroundColor: "transparent", // Optional: to match the background
    marginHorizontal: 10,
    marginBottom: 30,
  },
  buttonBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
  },
  textContainer: {
    padding: 20,
    marginBottom: 60, // Add space for the floating button
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  sectionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    lineHeight: 24,
  },
});

export default HomeScreen;
