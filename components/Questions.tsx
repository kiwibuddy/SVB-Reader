import { Text, View, FlatList, Image, Pressable, useColorScheme } from 'react-native'
import React, { useState } from 'react'
import { useAppContext } from '@/context/GlobalContext';
import QuestionsList from "@/assets/data/QuestionRefs.json";
import UIData from "@/assets/data/UI-ENG.json";
import { Colors } from '@/constants/Colors';

// Define the type for questions with an index signature
interface Questions {
  [key: string]: string; // Allow indexing with a string
}
const Qs: Questions = UIData.Questions;

export default function Questions() {
  const colorScheme = "light"; //useColorScheme();
  const { segmentId } = useAppContext();
  const idSplit = segmentId.split("-");
  const language = idSplit[0];
  const version = idSplit[1];
  const segID = idSplit[idSplit.length - 1];
  const [ qRef, setQRef ] = useState<string>("QRef1");

  const toggleQuestion = (qRef: string) => {
    if (qRef === "QRef1") setQRef("QRef2");
    if (qRef === "QRef2") setQRef("QRef3");
    if (qRef === "QRef3") setQRef("QRef1");
  }

  const questions: Record<string, string> =
    QuestionsList[segID as keyof typeof QuestionsList];

  return (
    <View>
      <View style={{ alignItems: "center", marginVertical: 30 }}>
        <Image
          source={require("@/assets/images/SVB-Discuss-together.png")}
          style={{ width: 200, height: 100, opacity: 0.8 }} // Use responsive size
        />
      </View>
      <Text
        style={{
          marginBottom: 20,
          fontWeight: "bold",
          fontSize: 30,
          lineHeight: 36,
          alignSelf: "center",
          textDecorationLine: "underline",
        }}
      >
        Questions
      </Text>
      <FlatList
        data={["Q1", "Q2", "Q3", "Q4"]}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={{ fontSize: 20, lineHeight: 36, marginHorizontal: 20 }}>
            - {Qs[`${questions[qRef]}-${item}`]}
          </Text>
        )}
      />
      <View style={{ alignSelf: "center", marginVertical: 30 }}>
        <Pressable
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderWidth: 2,
            borderColor: Colors[colorScheme as "light" | "dark"].tint, // Outline color
            borderRadius: 8,
            alignItems: "center",
            backgroundColor: "transparent", // Transparent background for outlined style
            alignSelf: "flex-start", // Adjusts width to fit text
          }}
          onPress={() => toggleQuestion(qRef)}
        >
          <Text
            style={{
              color: Colors[colorScheme as "light" | "dark"].tint,
              fontWeight: "bold",
            }}
          >
            Change Questions
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
