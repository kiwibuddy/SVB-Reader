import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Pressable, 
  FlatList,
  Dimensions,
  Animated,
  ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { useFirstLaunch } from '@/hooks/useFirstLaunch';
import { useTranslation } from '@/hooks/useTranslation';
import logger from '@/utils/logger';


const { width: screenWidth } = Dimensions.get('window');

const IndexScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList>(null);
  
  // First launch detection
  const { isFirstLaunch, isLoading, markAsLaunched, error } = useFirstLaunch();
  
  // Add missing state for current index
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Animation values
  const scrollX = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  const onboardingData = [
    {
      id: 1,
      titleKey: "UI.thread.onboardingColorsTitle",
      descriptionKey: "UI.thread.onboardingColorsBody",
      icon: "🎨",
      backgroundColor: "#0E6B4C",
      buttons: [
        { color: "#3A4550", text: "Narrator", subtitle: "Left" },
        { color: "#C0261A", text: "God", subtitle: "Left" },
        { color: "#0E6B4C", text: "Principals", subtitle: "Right" },
        { color: "#1D46A8", text: "Everyone else", subtitle: "Right" }
      ]
    },
    {
      id: 2,
      titleKey: "UI.thread.onboardingVoicesTitle",
      descriptionKey: "UI.thread.onboardingVoicesBody",
      icon: "🎙️",
      backgroundColor: "#B4231A"
    },
    {
      id: 3,
      titleKey: "UI.thread.onboardingThreadTitle",
      descriptionKey: "UI.thread.onboardingThreadBody",
      icon: "🧵",
      backgroundColor: "#0E6B4C"
    },
    {
      id: 4,
      titleKey: "UI.thread.onboardingSavedTitle",
      descriptionKey: "UI.thread.onboardingSavedBody",
      icon: "🔖",
      backgroundColor: "#1D46A8"
    }
  ];

  // Handle automatic navigation for returning users
  useEffect(() => {
    // Only redirect if we have a definitive answer (not loading state)
    if (isFirstLaunch === false && !isLoading && !error) {
      // Not first launch - redirect to Home immediately
      logger.info('🔄 Returning user detected, redirecting to Home');
      router.replace('/Home');
    }
  }, [isFirstLaunch, isLoading, error, router]);

  // Premium entrance animation (only run for first-time users)
  useEffect(() => {
    if (isFirstLaunch === true) {
      Animated.sequence([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFirstLaunch]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const contentOffset = event.nativeEvent.contentOffset;
        const viewSize = event.nativeEvent.layoutMeasurement;
        const pageNum = Math.floor(contentOffset.x / viewSize.width);
        setCurrentIndex(pageNum);
      },
    }
  );

  const renderCard = ({ item, index }: { item: any; index: number }) => {
    // Card parallax animation
    const inputRange = [
      (index - 1) * screenWidth,
      index * screenWidth,
      (index + 1) * screenWidth,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slideContainer}>
        <Animated.View 
          style={[
            { 
              transform: [{ scale }],
              opacity,
            }
          ]}
        >
          <View style={[styles.cardWrapper, { backgroundColor: item.backgroundColor }]}>
            <View style={[styles.cardContent, item.id === 3 && styles.textStyleBibleContent]}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>{item.icon}</Text>
              </View>
              
              <Text style={styles.cardTitle}>{t(item.titleKey)}</Text>
              
              {item.id === 1 && item.buttons && (
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
              
              {item.descriptionKey && (
                <Text style={styles.cardDescription}>{t(item.descriptionKey)}</Text>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    );
  };

  // Memoize the renderItem function
  const memoizedRenderCard = useCallback(({ item, index }: { item: any; index: number }) => {
    return renderCard({ item, index });
  }, []);

  // Memoize the keyExtractor function
  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  // Show loading spinner while checking first launch status
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF5733" />
        <Text style={{ marginTop: 16, color: '#666', fontSize: 16 }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Show error state if first launch check failed
  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: '#FF0000', fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
          Error Loading App
        </Text>
        <Text style={{ color: '#666', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
          {error}
        </Text>
        <TouchableOpacity 
          style={styles.getStartedButton} 
          onPress={() => router.replace('/Home')}
        >
          <Text style={styles.getStartedButtonText}>Continue to App →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Only show onboarding for first-time users
  // For returning users, render null since useEffect will handle redirection
  if (isFirstLaunch === false) {
    logger.info('🔄 Returning user - rendering null while redirecting');
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View style={styles.logoSection}>
          <Image 
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appTitle}>SourceView</Text>
          <Text style={styles.appSubtitle}>Together</Text>
          <Text style={styles.tagline}>Read Together. Grow Together.</Text>
        </View>
      </Animated.View>

      {/* Cards Carousel */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={memoizedRenderCard}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={1}
      />

      {/* Page Indicators */}
      <View style={styles.indicatorContainer}>
        {onboardingData.map((_, index) => {
          const inputRange = [
            (index - 1) * screenWidth,
            index * screenWidth,
            (index + 1) * screenWidth,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.indicator,
                {
                  width: dotWidth,
                  opacity: dotOpacity,
                  backgroundColor: '#333',
                }
              ]}
            />
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.finalScreen}>
          <Text style={styles.finalText}>Get ready for a new Bible reading journey!</Text>
          <Pressable 
            style={styles.getStartedButton} 
            onPress={async () => {
              try {
                logger.info('🎯 User completed onboarding, marking first launch as complete');
                await markAsLaunched();
                logger.info('✅ First launch marked complete, navigating to Home');
                router.replace("/Home");
              } catch (error) {
                // If marking fails, still navigate to avoid blocking user
                logger.warn('⚠️ Failed to mark first launch complete:', error);
                logger.info('🔄 Continuing to Home despite storage error');
                router.replace("/Home");
              }
            }}
          >
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
    fontSize: 22,
    fontFamily: 'Manrope-Light',
    color: '#FF6B47',
    marginBottom: 8,
    letterSpacing: 1.8,
    opacity: 0.9,
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
  slideContainer: {
    width: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardWrapper: {
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  onboardingCard: {
    width: screenWidth - 40,
    height: 420,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  textStyleBibleContent: {
    paddingTop: 40,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 40,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.95,
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonGrid: {
    marginBottom: 2,
    marginTop: 8,
    width: '100%',
    paddingHorizontal: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roleButton: {
    flex: 0.48,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  roleButtonSubtitle: {
    fontSize: 14,
    color: '#333333',
    opacity: 0.85,
    fontWeight: '700',
  },
  chatContainer: {
    width: '100%',
    marginBottom: 10,
  },
  speakerName: {
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 8,
    opacity: 0.9,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  speakerRight: {
    textAlign: 'right',
    marginTop: 10,
  },
  chatBubble: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
    maxWidth: '88%',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  chatBubbleLeft: {
    backgroundColor: 'rgba(253, 193, 193, 0.9)',
    alignSelf: 'flex-start',
  },
  chatBubbleRight: {
    backgroundColor: 'rgba(185, 248, 185, 0.9)',
    alignSelf: 'flex-end',
  },
  chatText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
    lineHeight: 22,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 24,
    alignItems: 'center',
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  activeIndicator: {
    width: 24,
    backgroundColor: '#333',
  },
  inactiveIndicator: {
    width: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
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
    borderRadius: 25,
    shadowColor: '#FF5733',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  getStartedButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default IndexScreen;
