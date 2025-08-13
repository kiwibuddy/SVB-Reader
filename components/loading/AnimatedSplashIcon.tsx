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
            borderRadius: size / 2,
          },
          glowStyle,
        ]}
      />
      
      {/* Main icon */}
      <Animated.Image
        source={require('../../assets/images/splash-icon.png')}
        style={[
          styles.icon,
          {
            width: size,
            height: size,
          },
          animatedStyle,
        ]}
        resizeMode="contain"
      />
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
  icon: {
    zIndex: 1,
    borderRadius: 16,
  },
});
