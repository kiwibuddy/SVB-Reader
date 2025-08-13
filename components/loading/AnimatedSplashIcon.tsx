import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  withSequence,
} from 'react-native-reanimated';
import { useAppSettings } from '@/context/AppSettingsContext';
import { AnimatedBubblesSVG } from './AnimatedBubblesSVG';

interface AnimatedSplashIconProps {
  size?: number;
  animationType?: 'pulse' | 'gentle-pulse' | 'rotate' | 'scale-rotate';
}

export const AnimatedSplashIcon: React.FC<AnimatedSplashIconProps> = ({
  size = 120,
  animationType = 'gentle-pulse',
}) => {
  const { colors } = useAppSettings();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Initial fade in
    opacity.value = withTiming(1, { duration: 800 });

    switch (animationType) {
      case 'pulse':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          ),
          -1,
          false
        );
        break;

      case 'gentle-pulse':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 1500 }),
            withTiming(1, { duration: 1500 })
          ),
          -1,
          false
        );
        break;

      case 'rotate':
        rotation.value = withRepeat(
          withTiming(360, { duration: 3000 }),
          -1,
          false
        );
        break;

      case 'scale-rotate':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 1200 }),
            withTiming(1, { duration: 1200 })
          ),
          -1,
          false
        );
        rotation.value = withRepeat(
          withTiming(360, { duration: 4000 }),
          -1,
          false
        );
        break;
    }
  }, [animationType]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(
      scale.value,
      [1, 1.1],
      [0.1, 0.3]
    );
    
    return {
      opacity: glowOpacity,
      transform: [
        { scale: scale.value * 1.2 },
      ],
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: colors.primary,
            width: size,
            height: size,
            borderRadius: 16, // Apple-style rounded corners
          },
          glowStyle,
        ]}
      />
      
      {/* Main icon with rounded mask */}
      <Animated.View
        style={[
          styles.iconMask,
          {
            width: size,
            height: size,
            borderRadius: 16, // Apple-style rounded corners
          },
          animatedStyle,
        ]}
      >
        <AnimatedBubblesSVG 
          size={size} 
          enableBreathing={animationType !== 'gentle-pulse'}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  iconMask: {
    zIndex: 1,
    overflow: 'hidden',
  },
});
