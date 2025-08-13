import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useAppSettings } from '@/context/AppSettingsContext';

interface ProgressIndicatorProps {
  progress: number; // 0 to 1
  message?: string;
  showPercentage?: boolean;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  message = 'Loading...',
  showPercentage = false,
  size = 80,
  strokeWidth = 4,
  animated = true,
}) => {
  const { colors } = useAppSettings();
  const animatedProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (animated) {
      animatedProgress.value = withTiming(progress, { duration: 500 });
    } else {
      animatedProgress.value = progress;
    }
  }, [progress, animated]);

  const animatedStyle = useAnimatedStyle(() => {
    const progressValue = animatedProgress.value;
    
    return {
      transform: [{ rotate: `${progressValue * 360 - 90}deg` }],
    };
  });

  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      {/* Circular Progress */}
      <View style={[styles.progressContainer, { width: size, height: size }]}>
        <Animated.View
          style={[
            styles.progressRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: colors.border,
            },
          ]}
        />
        
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: colors.primary,
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
            },
            animatedStyle,
          ]}
        />

        {showPercentage && (
          <View style={styles.percentageContainer}>
            <Text style={[styles.percentage, { color: colors.text }]}>
              {percentage}%
            </Text>
          </View>
        )}
      </View>

      {/* Loading Message */}
      {message && (
        <Text style={[styles.message, { color: colors.text }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

interface LinearProgressProps {
  progress: number; // 0 to 1
  message?: string;
  height?: number;
  animated?: boolean;
}

export const LinearProgress: React.FC<LinearProgressProps> = ({
  progress,
  message = 'Loading...',
  height = 4,
  animated = true,
}) => {
  const { colors } = useAppSettings();
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      animatedProgress.value = withTiming(progress, { duration: 500 });
    } else {
      animatedProgress.value = progress;
    }
  }, [progress, animated]);

  const animatedStyle = useAnimatedStyle(() => {
    const width = interpolate(animatedProgress.value, [0, 1], [0, 100]);
    
    return {
      width: `${width}%`,
    };
  });

  return (
    <View style={styles.linearContainer}>
      {message && (
        <Text style={[styles.linearMessage, { color: colors.text }]}>
          {message}
        </Text>
      )}
      
      <View style={[styles.progressTrack, { height, backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              height,
              backgroundColor: colors.primary,
            },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
  },
  progressFill: {
    position: 'absolute',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '-90deg' }],
  },
  percentageContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  linearContainer: {
    width: '100%',
    alignItems: 'center',
  },
  linearMessage: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: 2,
  },
});
