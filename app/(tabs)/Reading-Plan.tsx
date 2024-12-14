import { View, Text, Pressable, StyleSheet, ImageBackground } from "react-native";
import { router } from "expo-router";

const buttonData: ButtonItem[] = [
  { 
    id: "Bible1Year",
    title: "Bible in 1 Year",
    description: "Read through the entire Bible in one year",
    route: "/(tabs)/Plan" as const
  },
  {
    id: "SchoolYear",
    title: "School Year Plans",
    description: "Follow along with the school year curriculum",
    route: "/index" as const
  },
  {
    id: "NT100Days",
    title: "NT in 100 Days",
    description: "Read the New Testament in 100 days",
    route: "/(tabs)/ReadingPlans/NT100Days" as const
  },
  {
    id: "CustomPlan",
    title: "Custom Plan",
    description: "Create your own reading plan",
    route: "/(tabs)/ReadingPlans/CustomPlan" as const
  }
];

type ButtonItem = {
  id: string;
  title: string;
  description: string;
  route: `/${string}` | `/(tabs)/${string}`;
};

const ReadingPlan = () => {
  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        {buttonData.map((item) => (
          <Pressable
            key={item.id}
            style={styles.buttonWrapper}
            onPress={() => router.push(item.route)}
          >
            <ImageBackground
              source={require("@/assets/images/button1.png")}
              style={styles.buttonBackground}
              resizeMode="cover"
            >
              <Text style={styles.buttonTitle}>{item.title}</Text>
            </ImageBackground>
            <Text style={styles.buttonDescription}>{item.description}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 20,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 20,
  },
  buttonWrapper: {
    alignItems: "center",
    gap: 8,
  },
  buttonBackground: {
    width: "100%",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
  },
  buttonTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 10,
  },
});

export default ReadingPlan;
