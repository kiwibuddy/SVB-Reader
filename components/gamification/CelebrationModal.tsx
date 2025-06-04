import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSettings } from '@/context/AppSettingsContext';

const { width, height } = Dimensions.get('window');

interface CelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'plan' | 'challenge' | 'streak' | 'milestone' | 'book' | 'story';
  icon?: string;
  stats?: {
    storiesRead?: number;
    daysCompleted?: number;
    streakDays?: number;
    totalProgress?: number;
  };
}

// Confetti particle component
const ConfettiParticle = ({ delay, colors }: { delay: number; colors: any }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const colors_array = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F06292', '#FFB74D'];
  const particleColor = colors_array[Math.floor(Math.random() * colors_array.length)];
  
  useEffect(() => {
    const animateParticle = () => {
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(rotateValue, {
            toValue: 1,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: true,
          })
        ),
      ]).start();
    };

    const timer = setTimeout(animateParticle, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, height + 100],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 400],
  });

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.1, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0, 1, 0.5],
  });

  return (
    <Animated.View
      style={[
        styles.confettiParticle,
        {
          backgroundColor: particleColor,
          transform: [
            { translateX },
            { translateY },
            { rotate },
            { scale },
          ],
          opacity,
          left: Math.random() * width,
        },
      ]}
    />
  );
};

const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  onClose,
  title,
  message,
  type,
  icon,
  stats,
}) => {
  const { colors } = useAppSettings();
  const [showConfetti, setShowConfetti] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const confettiParticles = Array.from({ length: 50 }, (_, i) => i);

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      if (Platform.OS === 'ios') {
        Vibration.vibrate([0, 200, 100, 200]); // Success pattern
      } else {
        Vibration.vibrate(200);
      }

      setShowConfetti(true);
      
      // Animate modal entrance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Auto-hide confetti after 4 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0);
      slideAnim.setValue(height);
      setShowConfetti(false);
    }
  }, [visible]);

  const getIconForType = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'plan': return 'calendar-outline';
      case 'challenge': return 'flag-outline';
      case 'streak': return 'flame-outline';
      case 'milestone': return 'trophy-outline';
      case 'book': return 'book-outline';
      case 'story': return 'bookmark-outline';
      default: return 'star-outline';
    }
  };

  const getGradientColors = (): [string, string] => {
    switch (type) {
      case 'plan': return ['#667eea', '#764ba2'];
      case 'challenge': return ['#f093fb', '#f5576c'];
      case 'streak': return ['#FF6B6B', '#FF8E8E'];
      case 'milestone': return ['#FFD700', '#FFA500'];
      case 'book': return ['#4ECDC4', '#44A08D'];
      case 'story': return ['#667eea', '#764ba2'];
      default: return ['#667eea', '#764ba2'];
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti */}
        {showConfetti && (
          <View style={styles.confettiContainer}>
            {confettiParticles.map((_, index) => (
              <ConfettiParticle
                key={index}
                delay={index * 50}
                colors={colors}
              />
            ))}
          </View>
        )}

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={getGradientColors()}
            style={styles.modalContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Icon */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <View style={styles.iconBackground}>
                <Ionicons
                  name={getIconForType() as any}
                  size={48}
                  color="#FFFFFF"
                />
              </View>
            </Animated.View>

            {/* Content */}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {/* Stats */}
            {stats && (
              <View style={styles.statsContainer}>
                {stats.storiesRead && (
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.storiesRead}</Text>
                    <Text style={styles.statLabel}>Stories Read</Text>
                  </View>
                )}
                {stats.daysCompleted && (
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.daysCompleted}</Text>
                    <Text style={styles.statLabel}>Days Completed</Text>
                  </View>
                )}
                {stats.streakDays && (
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.streakDays}</Text>
                    <Text style={styles.statLabel}>Day Streak</Text>
                  </View>
                )}
                {stats.totalProgress && (
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.totalProgress}%</Text>
                    <Text style={styles.statLabel}>Complete</Text>
                  </View>
                )}
              </View>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>Continue</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 350,
  },
  modalContent: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 60,
    marginHorizontal: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 120,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default CelebrationModal; 