import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useAppContext } from '@/context/GlobalContext';
import createAppStyles from '@/utils/styleHelpers';
import StreakCounter from '@/components/gamification/StreakCounter';

const { width } = Dimensions.get('window');

/**
 * Modernized Home Screen Example
 * Demonstrates the new design system implementation with:
 * - Consistent spacing and typography
 * - Modern card design patterns
 * - Proper visual hierarchy
 * - Micro-interactions and animations
 * - Accessibility improvements
 */

interface ModernHomeScreenProps {
  navigation: any;
  lastReadSegment?: any;
  totalSegmentsRead?: number;
  currentStreak?: number;
  bestStreak?: number;
}

const ModernHomeScreen: React.FC<ModernHomeScreenProps> = ({
  navigation,
  lastReadSegment,
  totalSegmentsRead = 0,
  currentStreak = 0,
  bestStreak = 0,
}) => {
  const { theme } = useAppSettings();
  const { activePlan, activeChallenges } = useAppContext();
  const styles = createAppStyles(theme);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.layout.container}>
      <ScrollView 
        style={styles.layout.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Welcome Section with Modern Typography */}
        <Animated.View 
          style={[
            styles.layout.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.typography.headlineMedium}>
            Good morning! 👋
          </Text>
          <Text style={styles.typography.bodyLargeSecondary}>
            Ready to continue your Bible reading journey?
          </Text>
        </Animated.View>

        {/* Continue Reading Card - Primary CTA */}
        {lastReadSegment && (
          <Animated.View 
            style={[
              styles.layout.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <ContinueReadingCard
              segment={lastReadSegment}
              onPress={() => navigation.navigate('Reading')}
              theme={theme}
              styles={styles}
            />
          </Animated.View>
        )}

        {/* Streak Counter - Gamification Element */}
        <Animated.View 
          style={[
            styles.layout.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <StreakCounter
            currentStreak={currentStreak}
            bestStreak={bestStreak}
            lastReadDate={new Date().toISOString().split('T')[0]}
            onPress={() => {/* Navigate to achievements */}}
          />
        </Animated.View>

        {/* Quick Stats - Clean Grid Layout */}
        <Animated.View 
          style={[
            styles.layout.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={[styles.typography.titleLarge, { marginBottom: theme.spacing.lg }]}>
            Your Progress
          </Text>
          <QuickStatsGrid
            totalSegmentsRead={totalSegmentsRead}
            activePlansCount={activePlan ? 1 : 0}
            activeChallengesCount={Object.keys(activeChallenges).length}
            theme={theme}
            styles={styles}
          />
        </Animated.View>

        {/* Featured Content - Modern Card Design */}
        <Animated.View 
          style={[
            styles.layout.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={[styles.typography.titleLarge, { marginBottom: theme.spacing.lg }]}>
            Explore
          </Text>
          <FeaturedContentGrid
            onNavigateToPlans={() => navigation.navigate('Plans')}
            onNavigateToChallenges={() => navigation.navigate('Challenges')}
            theme={theme}
            styles={styles}
          />
        </Animated.View>

        {/* Bottom spacing for safe area */}
        <View style={{ height: theme.spacing.massive }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Modern Continue Reading Card Component
const ContinueReadingCard = ({ segment, onPress, theme, styles }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityLabel="Continue reading"
        accessibilityHint="Tap to continue your current reading"
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.cards.large,
            {
              borderWidth: 0,
              minHeight: 120,
              position: 'relative',
              overflow: 'hidden',
            }
          ]}
        >
          {/* Content */}
          <View style={styles.layout.rowSpaceBetween}>
            <View style={{ flex: 1 }}>
              <View style={[styles.layout.row, { marginBottom: theme.spacing.sm }]}>
                <Ionicons 
                  name="book-outline" 
                  size={20} 
                  color={theme.colors.onPrimary} 
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Text style={[
                  styles.typography.labelLarge,
                  { color: theme.colors.onPrimary }
                ]}>
                  Continue Reading
                </Text>
              </View>
              
              <Text style={[
                styles.typography.titleMedium,
                { 
                  color: theme.colors.onPrimary,
                  marginBottom: theme.spacing.xs,
                }
              ]}>
                {segment.title}
              </Text>
              
              <Text style={[
                styles.typography.bodyMedium,
                { 
                  color: theme.colors.onPrimary,
                  opacity: 0.9,
                }
              ]}>
                {segment.book} • {segment.chapter}
              </Text>
            </View>

            <View style={[
              styles.layout.centered,
              {
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }
            ]}>
              <Ionicons 
                name="play" 
                size={24} 
                color={theme.colors.onPrimary} 
              />
            </View>
          </View>

          {/* Decorative elements */}
          <View style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Quick Stats Grid Component
const QuickStatsGrid = ({ totalSegmentsRead, activePlansCount, activeChallengesCount, theme, styles }: any) => {
  const stats = [
    {
      label: 'Stories Read',
      value: totalSegmentsRead,
      icon: 'book',
      color: theme.colors.primary,
    },
    {
      label: 'Active Plans',
      value: activePlansCount,
      icon: 'calendar',
      color: theme.colors.secondary,
    },
    {
      label: 'Challenges',
      value: activeChallengesCount,
      icon: 'trophy',
      color: theme.colors.warning,
    },
  ];

  return (
    <View style={[styles.layout.row, styles.layout.gapMd]}>
      {stats.map((stat, index) => (
        <StatCard
          key={stat.label}
          stat={stat}
          theme={theme}
          styles={styles}
          index={index}
        />
      ))}
    </View>
  );
};

// Individual Stat Card with Animation
const StatCard = ({ stat, theme, styles, index }: any) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View 
      style={[
        { flex: 1, opacity: animValue },
        { transform: [{ scale: animValue }] }
      ]}
    >
      <View style={[
        styles.cards.compact,
        styles.layout.centered,
        { minHeight: 80 }
      ]}>
        <View style={[
          styles.layout.centered,
          {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: stat.color + '20',
            marginBottom: theme.spacing.sm,
          }
        ]}>
          <Ionicons
            name={stat.icon}
            size={20}
            color={stat.color}
          />
        </View>
        
        <Text style={[
          styles.typography.titleLarge,
          { 
            fontWeight: '800',
            marginBottom: theme.spacing.xs,
          }
        ]}>
          {stat.value}
        </Text>
        
        <Text style={[
          styles.typography.bodySmallSecondary,
          { textAlign: 'center' }
        ]}>
          {stat.label}
        </Text>
      </View>
    </Animated.View>
  );
};

// Featured Content Grid
const FeaturedContentGrid = ({ onNavigateToPlans, onNavigateToChallenges, theme, styles }: any) => {
  const features = [
    {
      title: 'Reading Plans',
      subtitle: 'Structured Bible reading',
      icon: 'library',
      gradient: [theme.colors.primary, theme.colors.secondary],
      onPress: onNavigateToPlans,
    },
    {
      title: 'Challenges',
      subtitle: 'Fun reading goals',
      icon: 'trophy',
      gradient: [theme.colors.secondary, theme.colors.primary],
      onPress: onNavigateToChallenges,
    },
  ];

  return (
    <View style={[styles.layout.row, styles.layout.gapMd]}>
      {features.map((feature, index) => (
        <FeatureCard
          key={feature.title}
          feature={feature}
          theme={theme}
          styles={styles}
          index={index}
        />
      ))}
    </View>
  );
};

// Feature Card Component
const FeatureCard = ({ feature, theme, styles, index }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ flex: 1 }, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={feature.onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityLabel={feature.title}
        accessibilityHint={feature.subtitle}
      >
        <LinearGradient
          colors={feature.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.cards.standard,
            {
              borderWidth: 0,
              minHeight: 120,
              justifyContent: 'space-between',
            }
          ]}
        >
          <View style={[
            styles.layout.centered,
            {
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              alignSelf: 'flex-start',
            }
          ]}>
            <Ionicons
              name={feature.icon}
              size={24}
              color={theme.colors.onPrimary}
            />
          </View>

          <View>
            <Text style={[
              styles.typography.titleMedium,
              { 
                color: theme.colors.onPrimary,
                marginBottom: theme.spacing.xs,
              }
            ]}>
              {feature.title}
            </Text>
            
            <Text style={[
              styles.typography.bodyMedium,
              { 
                color: theme.colors.onPrimary,
                opacity: 0.9,
              }
            ]}>
              {feature.subtitle}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ModernHomeScreen; 