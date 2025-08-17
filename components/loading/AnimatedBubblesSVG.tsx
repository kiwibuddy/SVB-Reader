import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

interface AnimatedBubblesSVGProps {
  size?: number;
  enableBreathing?: boolean;
}

export const AnimatedBubblesSVG: React.FC<AnimatedBubblesSVGProps> = ({
  size = 120,
  enableBreathing = true,
}) => {
  // Animation values for each speech bubble
  const pinkBubbleScale = useSharedValue(1);
  const greenBubbleScale = useSharedValue(1);
  const blueBubbleScale = useSharedValue(1);
  const pinkOpacity = useSharedValue(1);
  const greenOpacity = useSharedValue(1);
  const blueOpacity = useSharedValue(1);

  useEffect(() => {
    if (!enableBreathing) return;

    // Pink bubble animation (largest, starts immediately)
    pinkBubbleScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
    
    pinkOpacity.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );

    // Green bubble animation (medium, 200ms delay)
    setTimeout(() => {
      greenBubbleScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
      
      greenOpacity.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
    }, 200);

    // Blue bubble animation (smallest, 400ms delay)
    setTimeout(() => {
      blueBubbleScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
      
      blueOpacity.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
    }, 400);
  }, [enableBreathing, pinkBubbleScale, pinkOpacity, greenBubbleScale, greenOpacity, blueBubbleScale, blueOpacity]);

  // Animated styles for each bubble
  const pinkBubbleStyle = useAnimatedStyle(() => ({
    opacity: pinkOpacity.value,
    transform: [{ scale: pinkBubbleScale.value }],
  }));

  const greenBubbleStyle = useAnimatedStyle(() => ({
    opacity: greenOpacity.value,
    transform: [{ scale: greenBubbleScale.value }],
  }));

  const blueBubbleStyle = useAnimatedStyle(() => ({
    opacity: blueOpacity.value,
    transform: [{ scale: blueBubbleScale.value }],
  }));

  // Calculate bubble sizes relative to the container
  const containerSize = size;
  const pinkBubbleSize = containerSize * 0.45; // Largest bubble
  const greenBubbleSize = containerSize * 0.35; // Medium bubble
  const blueBubbleSize = containerSize * 0.3; // Smallest bubble

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Gray background */}
      <View style={[styles.background, { width: size, height: size }]} />
      
      {/* Blue bubble (smallest, animated) - positioned to match SVG layout */}
      <Animated.View
        style={[
          styles.bubble,
          styles.blueBubble,
          blueBubbleStyle,
          {
            width: blueBubbleSize,
            height: blueBubbleSize,
            borderRadius: blueBubbleSize / 2,
            position: 'absolute',
            right: containerSize * 0.15,
            bottom: containerSize * 0.15,
          }
        ]}
      />
      
      {/* Pink bubble (largest, animated) - positioned to match SVG layout */}
      <Animated.View
        style={[
          styles.bubble,
          styles.pinkBubble,
          pinkBubbleStyle,
          {
            width: pinkBubbleSize,
            height: pinkBubbleSize,
            borderRadius: pinkBubbleSize / 2,
            position: 'absolute',
            right: containerSize * 0.05,
            top: containerSize * 0.15,
          }
        ]}
      />
      
      {/* Green bubble (medium, animated) - positioned to match SVG layout */}
      <Animated.View
        style={[
          styles.bubble,
          styles.greenBubble,
          greenBubbleStyle,
          {
            width: greenBubbleSize,
            height: greenBubbleSize,
            borderRadius: greenBubbleSize / 2,
            position: 'absolute',
            left: containerSize * 0.15,
            bottom: containerSize * 0.25,
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    backgroundColor: '#808080',
    position: 'absolute',
  },
  bubble: {
    // Base bubble styles
  },
  blueBubble: {
    backgroundColor: '#8CE3FF',
  },
  pinkBubble: {
    backgroundColor: '#FCC1C3',
  },
  greenBubble: {
    backgroundColor: '#B8F8BA',
  },
});
