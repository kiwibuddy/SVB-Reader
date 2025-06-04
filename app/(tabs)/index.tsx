import React, { useEffect, useRef, useState } from "react";
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  Pressable, 
  useWindowDimensions, 
  Platform, 
  SafeAreaView,
  Animated,
  StatusBar,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';

const IndexScreen = () => {
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { t } = useTranslation();
  const { colors } = useAppSettings();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  
  // Onboarding card state
  const [currentCard, setCurrentCard] = useState(0);
  const [hasViewedAllCards, setHasViewedAllCards] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Calculate available space and proportions
  const headerHeight = 180;
  const footerHeight = 140;
  const indicatorHeight = 40;
  const titleSectionHeight = 20; // Reduced from previous height
  const availableCardHeight = screenHeight - headerHeight - footerHeight - indicatorHeight - titleSectionHeight - 60; // Reduced margin

  useEffect(() => {
    // Entrance animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Check if user has viewed all cards
  useEffect(() => {
    if (currentCard >= onboardingCards.length - 1 && !hasViewedAllCards) {
      setHasViewedAllCards(true);
      Animated.timing(ctaOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [currentCard, hasViewedAllCards]);

  const handleGetStarted = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        router.push("/Home");
      });
    });
  };

  const onboardingCards = [
    {
      icon: "book-outline",
      title: "365 Bible Stories",
      description: "The entire Bible broken into natural story breaks. Each story is perfect for reading with friends and comes with discussion questions to apply to your lives.",
      colors: ['#667eea', '#764ba2'] as const
    },
    {
      icon: "people-outline",
      title: "Group Reading",
      description: "Gather 4 friends to each read a different part of the story aloud together. Switch reading parts to gain new insights!",
      colors: ['#43e97b', '#38f9d7'] as const,
      showColors: true
    },
    {
      icon: "chatbubbles-outline",
      title: "A New Text-Style Bible",
      description: "",
      colors: ['#4facfe', '#00f2fe'] as const,
      showExample: true
    },
    {
      icon: "happy-outline",
      title: "React & Reflect",
      description: "Mark verses that speak to you: ❤️ to memorize, 👍 to share, 🤔 to study deeper, 🙏 to turn into prayer. Each reaction guides you through specific spiritual practices to help you reflect and apply Scripture to your daily life.",
      colors: ['#f093fb', '#f5576c'] as const
    },
    {
      icon: "trophy-outline",
      title: "Achievements & Streaks",
      description: "Track your reading journey with achievement badges, daily streaks, and progress milestones. Unlock rewards as you dive deeper into Scripture.",
      colors: ['#fa709a', '#fee140'] as const
    }
  ];

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const cardIndex = Math.round(scrollPosition / screenWidth);
    setCurrentCard(cardIndex);
  };

  const sourceViewColors = [
    { color: '#D32F2F', label: 'God' },
    { color: '#388E3C', label: 'Main Character' },
    { color: '#1976D2', label: 'Other Voices' },
    { color: '#666666', label: 'Narrator' }
  ];

  // Example scripture conversation for speech bubble card
  const exampleConversation = [
    { speaker: 'Jesus', color: '#D32F2F', text: 'Who do you say that I am?' },
    { speaker: 'Peter', color: '#388E3C', text: 'You are the Christ, the Son of the living God.' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" translucent />
      
      {/* Content Container */}
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        {/* Header Section with Logo - Fixed Height */}
        <View style={[styles.headerSection, { height: headerHeight }]}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
          <Image
              source={require("../../assets/images/icon.png")}
            style={styles.logo}
          />
          </Animated.View>

          <View style={styles.brandContainer}>
            <Text style={styles.brandTitle}>{t('UI.landing.title')}</Text>
            <Text style={styles.brandSubtitle}>{t('UI.landing.subtitle')}</Text>
            <Text style={styles.tagline}>Read Together. Grow Together.</Text>
          </View>
        </View>

        {/* Horizontal Swipe Cards Section - Dynamic Height */}
        <View style={[styles.onboardingSection, { height: availableCardHeight }]}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.cardsContainer}
            style={styles.cardsScrollView}
          >
            {onboardingCards.map((card, index) => (
              <View key={index} style={[styles.onboardingCard, { width: screenWidth, height: availableCardHeight }]}>
                <View style={styles.cardWrapper}>
                  <LinearGradient
                    colors={card.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.cardIconContainer}>
                        <Ionicons name={card.icon as any} size={32} color="#FFFFFF" />
                      </View>
                      <Text style={styles.cardTitle}>{card.title}</Text>
                      {card.description !== "" && (
                        <Text style={styles.cardDescription}>{card.description}</Text>
                      )}
                      
                      {/* Show example conversation for speech bubble card */}
                      {card.showExample && (
                        <View style={[styles.exampleContainer, { marginTop: card.description === "" ? 16 : 12 }]}>
                          <View style={styles.conversationExample}>
                            {exampleConversation.map((message, msgIndex) => (
                              <View key={msgIndex} style={[
                                styles.messageContainer,
                                msgIndex === 0 ? styles.messageLeft : styles.messageRight
                              ]}>
                                <Text style={[
                                  styles.speakerName,
                                  msgIndex === 0 ? styles.speakerNameLeft : styles.speakerNameRight
                                ]}>
                                  {message.speaker}
                                </Text>
                                <View style={[
                                  styles.speechBubble,
                                  { backgroundColor: message.color },
                                  msgIndex === 0 ? styles.speechBubbleLeft : styles.speechBubbleRight
                                ]}>
                                  <Text style={styles.speechText}>{message.text}</Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Show color badges for group reading card */}
                      {card.showColors && (
                        <View style={styles.colorIndicatorsContainer}>
                          <View style={styles.colorBadgesGrid}>
                            {sourceViewColors.map((colorInfo, colorIndex) => (
                              <View key={colorIndex} style={[styles.colorBadgeGridItem, { backgroundColor: colorInfo.color }]}>
                                <Text style={styles.colorBadgeGridText}>
                                  {colorInfo.color === '#D32F2F' ? 'Red' : 
                                   colorInfo.color === '#388E3C' ? 'Green' : 
                                   colorInfo.color === '#1976D2' ? 'Blue' : 'Gray'}
                                </Text>
                                <Text style={styles.colorBadgeGridLabel}>
                                  {colorInfo.label}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Page Indicators - Fixed Height */}
        <View style={[styles.indicatorSection, { height: indicatorHeight }]}>
          <View style={styles.pageIndicators}>
            {onboardingCards.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentCard === index && styles.activeIndicator
                ]}
              />
            ))}
          </View>
        </View>

        {/* Call to Action Section - Fixed Height, Only show after viewing all cards */}
        <View style={[styles.footerSection, { height: footerHeight }]}>
          {hasViewedAllCards && (
            <Animated.View 
              style={[
                styles.ctaContainer,
                { opacity: ctaOpacity }
              ]}
            >
              <Text style={styles.ctaText}>
            {t('UI.landing.heading')}
          </Text>

              <Animated.View
                style={{
                  transform: [{ scale: scaleAnim }],
                }}
              >
                <Pressable 
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.primaryButtonPressed
                  ]}
                  onPress={handleGetStarted}
                >
                  <LinearGradient
                    colors={['#FF5733', '#FF7A59']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {t('UI.landing.getStarted')}
          </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  </LinearGradient>
          </Pressable>
              </Animated.View>
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2C3E50',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  brandSubtitle: {
    fontSize: 20,
    fontFamily: "Mistrully",
    color: "#FF5733",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  onboardingSection: {
    flex: 1,
  },
  cardsScrollView: {
    flex: 1,
  },
  cardsContainer: {
    alignItems: 'stretch',
  },
  onboardingCard: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    width: '85%',
    flex: 1,
    maxHeight: 320,
    minHeight: 280,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  cardContent: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    paddingHorizontal: 0,
    width: '100%',
  },
  colorIndicatorsContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  colorBadgesGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  colorBadgeGridItem: {
    width: '48%',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  colorBadgeGridText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  colorBadgeGridLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },
  indicatorSection: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(44, 62, 80, 0.2)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#2C3E50',
    width: 32,
    height: 8,
    borderRadius: 4,
  },
  footerSection: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  ctaContainer: {
    alignItems: 'center',
    width: '100%',
  },
  ctaText: {
    fontSize: 18,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  primaryButton: {
    borderRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#FF5733',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
    minWidth: 180,
  },
  buttonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  exampleContainer: {
    marginTop: 12,
    alignItems: 'center',
    width: '100%',
  },
  conversationExample: {
    width: '100%',
    paddingHorizontal: 12,
    gap: 12,
  },
  messageContainer: {
    width: '100%',
  },
  messageLeft: {
    alignItems: 'flex-start',
  },
  messageRight: {
    alignItems: 'flex-end',
  },
  speakerName: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  speakerNameLeft: {
    marginLeft: 4,
  },
  speakerNameRight: {
    marginRight: 4,
  },
  speechBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  speechBubbleLeft: {
    alignSelf: 'flex-start',
  },
  speechBubbleRight: {
    alignSelf: 'flex-end',
  },
  speechText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default IndexScreen;
