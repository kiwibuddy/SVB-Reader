import React, { useEffect, useRef, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Platform,
  Easing,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from "expo-blur";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const EmojiPicker: React.FC<EmojiPickerProps> = ({ 
  onEmojiSelect, 
  onClose, 
  position = { x: screenWidth / 2, y: screenHeight / 2 } 
}) => {
  const EMOJIS = useMemo(() => [
    { emoji: "❤️", label: "love", color: "#FF6B47" },
    { emoji: "👍", label: "agree", color: "#4ECDC4" },
    { emoji: "🤔", label: "reflecting", color: "#FFB347" },
    { emoji: "🙏", label: "praying", color: "#7B68EE" }
  ], []);

  // Animation values - use useMemo to prevent recreation
  const scaleAnim = useMemo(() => new Animated.Value(0), []);
  const opacityAnim = useMemo(() => new Animated.Value(0), []);
  const emojiScales = useMemo(() => 
    EMOJIS.map(() => new Animated.Value(0)), [EMOJIS]
  );
  const slideAnim = useMemo(() => new Animated.Value(30), []);

  useEffect(() => {
    // Use requestAnimationFrame to ensure animations start after render
    const animationFrame = requestAnimationFrame(() => {
      // Entrance animation sequence
      Animated.parallel([
        // Main container animation
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 180,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // Staggered emoji animations
      const emojiAnimations = emojiScales.map((scale, index) =>
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          delay: index * 40,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        })
      );

      Animated.stagger(40, emojiAnimations).start();
    });

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [scaleAnim, opacityAnim, slideAnim, emojiScales]);

  const handleEmojiPress = (emoji: string, index: number) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        // Haptics not available, continue without feedback
      }
    }

    // Selection animation
    Animated.sequence([
      Animated.spring(emojiScales[index], {
        toValue: 1.4,
        tension: 300,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(emojiScales[index], {
        toValue: 0,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Exit animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onEmojiSelect(emoji);
    });
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(onClose);
  };

  return (
    <BlurView intensity={60} tint="dark" style={styles.blurContainer}>
      <Pressable
        style={styles.blurContainer}
        onPress={handleClose}
      >
        {/* Centered modal container similar to working version */}
        <View style={styles.modalContainer}>
          <Animated.View
            style={[
              styles.pickerContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim }
                ],
                opacity: opacityAnim,
              },
            ]}
          >
            <View style={styles.pillContainer}>
              <View style={styles.emojiRow}>
                {EMOJIS.map((item, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.emojiWrapper,
                      {
                        transform: [{ scale: emojiScales[index] }],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.emojiButton,
                        { backgroundColor: `${item.color}15` }
                      ]}
                      onPress={() => handleEmojiPress(item.emoji, index)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.emojiText}>{item.emoji}</Text>
                      <View style={[styles.ripple, { backgroundColor: item.color }]} />
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
              
              {/* Close button */}
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={handleClose}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Ionicons name="close" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Pressable>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  // Use centered approach similar to working version
  blurContainer: {
    flex: 1,
    justifyContent: "center",  // Centers vertically
    alignItems: "center",      // Centers horizontally
    alignContent: "flex-start",
  },
  modalContainer: {
    flex: 0,
    justifyContent: "flex-start",
    backgroundColor: "transparent",
  },
  pickerContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emojiWrapper: {
    position: 'relative',
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  emojiText: {
    fontSize: 22,
    zIndex: 2,
  },
  ripple: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 22,
    opacity: 0.12,
    zIndex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
});

export default EmojiPicker;
