import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, ViewStyle, TextStyle, InteractionManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ANIMATION } from '@/services/animation';

interface CompletionBannerProps {
  visible: boolean;
  message?: string;
  durationMs?: number;
  onHide?: () => void;
  backgroundColor?: string;
  textColor?: string;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
}

const CompletionBanner: React.FC<CompletionBannerProps> = ({
  visible,
  message = 'Completion confirmed',
  durationMs = 1600,
  onHide,
  backgroundColor = '#007AFF',
  textColor = '#FFFFFF',
  containerStyle,
  textStyle,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      if (cancelled || !visible) return;
      // Slide-down and fade-in, wait, then fade-out + slide-up
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateY, { toValue: 0, duration: ANIMATION.duration.base, easing: ANIMATION.easing.out, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: ANIMATION.duration.base, easing: ANIMATION.easing.out, useNativeDriver: true }),
        ]),
        Animated.delay(durationMs),
        Animated.parallel([
          Animated.timing(translateY, { toValue: -20, duration: ANIMATION.duration.base, easing: ANIMATION.easing.in, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: ANIMATION.duration.base, easing: ANIMATION.easing.in, useNativeDriver: true }),
        ]),
      ]).start(() => {
        if (cancelled) return;
        // Defer onHide to avoid scheduling state updates during insertion
        setTimeout(() => onHide?.(), 0);
      });
    });
    return () => {
      cancelled = true;
      task?.cancel?.();
    };
  }, [visible, durationMs, onHide, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { top: insets.top + 12, opacity, transform: [{ translateY }] },
      ]}
    >
      <Animated.View style={[styles.banner, { backgroundColor }, containerStyle]}>
        <Text style={[styles.text, { color: textColor }, textStyle]}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2000,
  },
  banner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CompletionBanner;


