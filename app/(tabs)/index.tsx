import React, { useState, useRef } from "react";
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Pressable, 
  useWindowDimensions, 
  Platform,
  FlatList,
  Dimensions
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Link, useRouter } from "expo-router";
import { useTranslation } from 'react-i18next';

const { width: screenWidth } = Dimensions.get('window');

const IndexScreen = () => {
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onboardingData = [
    {
      id: 1,
      title: "365 Bible Stories",
      description: "The entire Bible broken into natural story breaks. Each story is perfect for reading with friends and comes with discussion questions to apply to your lives.",
      icon: "📖",
      backgroundColor: "#7B68EE"
    },
    {
      id: 2,
      title: "Group Reading",
      description: "Gather 4 friends to each read a different part of the story aloud together. Switch reading parts to gain new insights!",
      icon: "👥",
      backgroundColor: "#00C851",
      buttons: [
        { color: "#fdc1c1", text: "Red", subtitle: "God" },
        { color: "#b9f8b9", text: "Green", subtitle: "Main Character" },
        { color: "#8EE3FF", text: "Blue", subtitle: "Other Voices" },
        { color: "#808080", text: "Gray", subtitle: "Narrator" }
      ]
    },
    {
      id: 3,
      title: "A New Text-Style Bible",
      description: "",
      icon: "💬",
      backgroundColor: "#42A5F5",
      chatExample: {
        speaker1: "Jesus",
        message1: "Who do you say that I am?",
        speaker2: "Peter",
        message2: "You are the Christ, the Son of the living God."
      }
    },
    {
      id: 4,
      title: "React & Reflect",
      description: "Mark verses that speak to you: ❤️ to memorize, 👍 to share, 🤔 to study deeper, 🙏 to turn into prayer. Each reaction guides you through specific spiritual practices to help you reflect and apply Scripture to your daily life.",
      icon: "😊",
      backgroundColor: "#E91E63"
    },
    {
      id: 5,
      title: "Achievements & Streaks",
      description: "Track your reading journey with achievement badges, daily streaks, and progress milestones. Unlock rewards as you dive deeper into Scripture.",
      icon: "🏆",
      backgroundColor: "#FF9800"
    }
  ];

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const viewSize = event.nativeEvent.layoutMeasurement;
    const pageNum = Math.floor(contentOffset.x / viewSize.width);
    setCurrentIndex(pageNum);
  };

  const renderCard = ({ item, index }: { item: any; index: number }) => {
    return (
      <View style={[styles.card, { backgroundColor: item.backgroundColor }]}>
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>{item.icon}</Text>
          </View>
          
          <Text style={styles.cardTitle}>{item.title}</Text>
          
          {item.id === 2 && item.buttons && (
            <View style={styles.buttonGrid}>
              <View style={styles.buttonRow}>
                <View style={[styles.roleButton, { backgroundColor: item.buttons[0].color }]}>
                  <Text style={styles.roleButtonSubtitle}>{item.buttons[0].subtitle}</Text>
                </View>
                <View style={[styles.roleButton, { backgroundColor: item.buttons[1].color }]}>
                  <Text style={styles.roleButtonSubtitle}>{item.buttons[1].subtitle}</Text>
                </View>
              </View>
              <View style={styles.buttonRow}>
                <View style={[styles.roleButton, { backgroundColor: item.buttons[2].color }]}>
                  <Text style={styles.roleButtonSubtitle}>{item.buttons[2].subtitle}</Text>
                </View>
                <View style={[styles.roleButton, { backgroundColor: item.buttons[3].color }]}>
                  <Text style={styles.roleButtonSubtitle}>{item.buttons[3].subtitle}</Text>
                </View>
              </View>
            </View>
          )}
          
          {item.id === 3 && item.chatExample && (
            <View style={styles.chatContainer}>
              <Text style={styles.speakerName}>{item.chatExample.speaker1}</Text>
              <View style={[styles.chatBubble, styles.chatBubbleLeft]}>
                <Text style={styles.chatText}>{item.chatExample.message1}</Text>
              </View>
              <Text style={[styles.speakerName, styles.speakerRight]}>{item.chatExample.speaker2}</Text>
              <View style={[styles.chatBubble, styles.chatBubbleRight]}>
                <Text style={styles.chatText}>{item.chatExample.message2}</Text>
              </View>
            </View>
          )}
          
          {item.description && (
            <Text style={styles.cardDescription}>{item.description}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
          />
          <Text style={styles.appTitle}>SourceView</Text>
          <Text style={styles.appSubtitle}>Reader</Text>
          <Text style={styles.tagline}>Read Together. Grow Together.</Text>
        </View>
      </View>

      {/* Cards Carousel */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderCard}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
      />

      {/* Page Indicators */}
      <View style={styles.indicatorContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              { backgroundColor: index === currentIndex ? '#333' : '#CCC' }
            ]}
          />
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.finalScreen}>
          <Text style={styles.finalText}>Get ready for a new Bible reading journey!</Text>
          <Pressable style={styles.getStartedButton} onPress={() => router.push("/Home")}>
            <Text style={styles.getStartedButtonText}>Get Started →</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  appSubtitle: {
    fontSize: 24,
    fontFamily: 'Mistrully',
    color: '#FF5733',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  carousel: {
    flex: 1,
  },
  carouselContent: {
    alignItems: 'center',
  },
  card: {
    width: screenWidth - 40,
    height: 420,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 40,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  cardDescription: {
    fontSize: 15,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
    marginTop: 15,
  },
  buttonGrid: {
    marginBottom: 15,
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roleButton: {
    flex: 0.48,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  roleButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  roleButtonSubtitle: {
    fontSize: 13,
    color: '#333333',
    opacity: 0.8,
    fontWeight: '600',
  },
  chatContainer: {
    width: '100%',
    marginBottom: 15,
  },
  speakerName: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 6,
    opacity: 0.8,
    fontWeight: '500',
  },
  speakerRight: {
    textAlign: 'right',
    marginTop: 15,
  },
  chatBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: '85%',
  },
  chatBubbleLeft: {
    backgroundColor: '#fdc1c1',
    alignSelf: 'flex-start',
  },
  chatBubbleRight: {
    backgroundColor: '#b9f8b9',
    alignSelf: 'flex-end',
  },
  chatText: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
    lineHeight: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  footer: {
    paddingBottom: 40,
    paddingTop: 20,
  },
  finalScreen: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  finalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  getStartedButton: {
    backgroundColor: '#FF5733',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  getStartedButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default IndexScreen;
