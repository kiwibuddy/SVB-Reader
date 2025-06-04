import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSettings } from '@/context/AppSettingsContext';

const { width } = Dimensions.get('window');

interface StreakCounterProps {
  currentStreak: number;
  bestStreak: number;
  lastReadDate?: string;
  onPress?: () => void;
  compact?: boolean;
}

// Animated flame component
const AnimatedFlame = ({ size = 24, isActive }: { size?: number; isActive: boolean }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isActive) {
      // Flame flicker animation
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 0.95,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.7,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
      opacityAnim.setValue(0.4);
    }
  }, [isActive]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      <Ionicons
        name="flame"
        size={size}
        color={isActive ? '#FF6B35' : '#9CA3AF'}
      />
    </Animated.View>
  );
};

// Circular progress component
const CircularProgress = ({ 
  progress, 
  size = 120, 
  strokeWidth = 8, 
  color = '#FF6B35' 
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number; 
  color?: string; 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={{
          width: size,
          height: size,
          transform: [{ rotate: '-90deg' }],
        }}
      >
        {/* Background circle */}
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'rgba(156, 163, 175, 0.2)',
          }}
        />
        
        {/* Progress circle */}
        <Animated.View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            transform: [
              { 
                rotate: strokeDashoffset.interpolate({
                  inputRange: [0, circumference],
                  outputRange: ['0deg', '360deg'],
                }) 
              }
            ],
          }}
        />
      </Animated.View>
    </View>
  );
};

const StreakCounter: React.FC<StreakCounterProps> = ({
  currentStreak,
  bestStreak,
  lastReadDate,
  onPress,
  compact = false,
}) => {
  const { colors } = useAppSettings();
  const [showBestBadge, setShowBestBadge] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Check if today's reading is complete
  const isToday = lastReadDate === new Date().toISOString().split('T')[0];
  const isActive = currentStreak > 0;

  // Calculate streak milestones
  const nextMilestone = Math.ceil((currentStreak + 1) / 7) * 7; // Next week milestone
  const milestoneProgress = currentStreak / nextMilestone;

  // Show best streak badge if current equals best
  useEffect(() => {
    if (currentStreak > 0 && currentStreak === bestStreak && currentStreak > 1) {
      setShowBestBadge(true);
      
      // Pulse animation for new record
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ).start();
    } else {
      setShowBestBadge(false);
    }
  }, [currentStreak, bestStreak]);

  const getStreakMessage = () => {
    if (currentStreak === 0) {
      return "Start your streak today!";
    } else if (currentStreak === 1) {
      return "Great start! Keep it going!";
    } else if (currentStreak < 7) {
      return `${7 - currentStreak} more days to your first week!`;
    } else if (currentStreak % 7 === 0) {
      return `Amazing! ${currentStreak / 7} week${currentStreak > 7 ? 's' : ''} strong!`;
    } else {
      const weeks = Math.floor(currentStreak / 7);
      const days = currentStreak % 7;
      return `${weeks} week${weeks > 1 ? 's' : ''} and ${days} day${days > 1 ? 's' : ''}!`;
    }
  };

  const getStreakColor = () => {
    if (currentStreak === 0) return '#9CA3AF';
    if (currentStreak < 7) return '#F59E0B';
    if (currentStreak < 30) return '#EF4444';
    return '#7C3AED';
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, { backgroundColor: colors.card }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.compactFlame}>
          <AnimatedFlame size={20} isActive={isActive} />
        </View>
        <View style={styles.compactContent}>
          <Text style={[styles.compactStreak, { color: colors.text }]}>
            {currentStreak}
          </Text>
          <Text style={[styles.compactLabel, { color: colors.secondary }]}>
            day streak
          </Text>
        </View>
        {showBestBadge && (
          <View style={styles.bestBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={isActive ? ['#FF6B3520', '#FF6B3540'] : ['#F3F4F620', '#F3F4F640']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <AnimatedFlame size={24} isActive={isActive} />
            <Text style={[styles.title, { color: colors.text }]}>
              Reading Streak
            </Text>
            {showBestBadge && (
              <Animated.View
                style={[
                  styles.recordBadge,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.recordText}>Record!</Text>
              </Animated.View>
            )}
          </View>
          
          {bestStreak > 0 && (
            <Text style={[styles.bestText, { color: colors.secondary }]}>
              Best: {bestStreak} days
            </Text>
          )}
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Circular Progress */}
          <View style={styles.progressContainer}>
            <CircularProgress
              progress={milestoneProgress}
              size={100}
              strokeWidth={6}
              color={getStreakColor()}
            />
            <View style={styles.progressCenter}>
              <Text style={[styles.streakNumber, { color: colors.text }]}>
                {currentStreak}
              </Text>
              <Text style={[styles.daysLabel, { color: colors.secondary }]}>
                days
              </Text>
            </View>
          </View>

          {/* Message */}
          <View style={styles.messageContainer}>
            <Text style={[styles.message, { color: colors.secondary }]}>
              {getStreakMessage()}
            </Text>
            
            {currentStreak > 0 && nextMilestone > currentStreak && (
              <Text style={[styles.nextMilestone, { color: getStreakColor() }]}>
                {nextMilestone - currentStreak} more days to {nextMilestone}!
              </Text>
            )}
          </View>
        </View>

        {/* Status Indicator */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isToday ? '#10B981' : '#EF4444' }
          ]} />
          <Text style={[styles.statusText, { color: colors.secondary }]}>
            {isToday ? "Today's reading complete" : "Read today to continue streak"}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  gradient: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  recordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD70030',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  recordText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
    marginLeft: 4,
  },
  bestText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressContainer: {
    position: 'relative',
    marginRight: 20,
  },
  progressCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  daysLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -2,
  },
  messageContainer: {
    flex: 1,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 4,
  },
  nextMilestone: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  compactFlame: {
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactStreak: {
    fontSize: 18,
    fontWeight: '800',
  },
  compactLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  bestBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD70030',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
});

export default StreakCounter; 