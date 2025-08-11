import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useAppSettings } from '@/context/AppSettingsContext';

const { width: screenWidth } = Dimensions.get('window');

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { colors, isDarkMode } = useAppSettings();
  const shimmerTranslateX = useSharedValue(-screenWidth);

  useEffect(() => {
    shimmerTranslateX.value = withRepeat(
      withTiming(screenWidth, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerTranslateX.value }],
    };
  });

  const shimmerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmerTranslateX.value,
      [-screenWidth, 0, screenWidth],
      [0, 0.5, 0]
    );

    return {
      opacity,
    };
  });

  const baseColor = isDarkMode ? '#2A2A2A' : '#E1E9EE';
  const shimmerColor = isDarkMode ? '#404040' : '#F5F7FA';

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: shimmerColor,
            height,
            borderRadius,
          },
          animatedStyle,
          shimmerStyle,
        ]}
      />
    </View>
  );
};

// Pre-built skeleton components for common UI patterns
export const SkeletonText: React.FC<{ lines?: number; lastLineWidth?: string }> = ({
  lines = 3,
  lastLineWidth = '70%',
}) => (
  <View style={styles.textContainer}>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonLoader
        key={index}
        width={index === lines - 1 ? lastLineWidth : '100%'}
        height={16}
        style={{ marginBottom: 8 }}
      />
    ))}
  </View>
);

export const SkeletonCard: React.FC = () => (
  <View style={styles.card}>
    <SkeletonLoader width="100%" height={200} borderRadius={8} />
    <View style={styles.cardContent}>
      <SkeletonLoader width="80%" height={20} style={{ marginBottom: 8 }} />
      <SkeletonText lines={2} />
    </View>
  </View>
);

export const SkeletonBibleVerse: React.FC = () => (
  <View style={styles.verseContainer}>
    <View style={styles.verseHeader}>
      <SkeletonLoader width={60} height={16} borderRadius={12} />
      <SkeletonLoader width={40} height={16} borderRadius={12} />
    </View>
    <SkeletonText lines={3} lastLineWidth="85%" />
  </View>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <View style={styles.list}>
    {Array.from({ length: count }).map((_, index) => (
      <View key={index} style={styles.listItem}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View style={styles.listContent}>
          <SkeletonLoader width="60%" height={16} style={{ marginBottom: 4 }} />
          <SkeletonLoader width="40%" height={12} />
        </View>
      </View>
    ))}
  </View>
);

export const SkeletonNavigationItem: React.FC = () => (
  <View style={styles.navItem}>
    <SkeletonLoader width={24} height={24} borderRadius={4} />
    <View style={styles.navContent}>
      <SkeletonLoader width="70%" height={16} style={{ marginBottom: 4 }} />
      <SkeletonLoader width="50%" height={12} />
    </View>
    <SkeletonLoader width={24} height={16} borderRadius={8} />
  </View>
);

export const SkeletonReadingProgress: React.FC = () => (
  <View style={styles.progressContainer}>
    <View style={styles.progressHeader}>
      <SkeletonLoader width="60%" height={18} />
      <SkeletonLoader width={40} height={16} borderRadius={8} />
    </View>
    <SkeletonLoader width="100%" height={8} borderRadius={4} style={{ marginTop: 8 }} />
    <View style={styles.progressStats}>
      <SkeletonLoader width={60} height={32} borderRadius={16} />
      <SkeletonLoader width={60} height={32} borderRadius={16} />
      <SkeletonLoader width={60} height={32} borderRadius={16} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  textContainer: {
    marginVertical: 8,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  verseContainer: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  navContent: {
    flex: 1,
    marginLeft: 12,
  },
  progressContainer: {
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
});

export default SkeletonLoader;
