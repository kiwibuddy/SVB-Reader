import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DUR, timing } from '@/constants/Motion';
import { ThreadColors } from '@/constants/Colors';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';

interface CompletionBannerProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  voiceNote?: string;
  durationMs?: number;
  onHide?: () => void;
  /** @deprecated use title/subtitle/voiceNote instead */
  message?: string;
  backgroundColor?: string;
  textColor?: string;
  containerStyle?: object;
  textStyle?: object;
}

const CompletionBanner: React.FC<CompletionBannerProps> = ({
  visible,
  title,
  subtitle,
  voiceNote,
  message,
  durationMs = 2400,
  onHide,
}) => {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useSyncAppSettings();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-24);
  const scale = useSharedValue(0.96);
  const fired = useRef(false);

  useEffect(() => {
    if (!visible || fired.current) return;
    fired.current = true;

    opacity.value = withSequence(
      withTiming(1, timing(DUR.base)),
      withDelay(durationMs, withTiming(0, timing(DUR.quick)))
    );
    translateY.value = withSequence(
      withTiming(0, timing(DUR.base)),
      withDelay(durationMs, withTiming(-12, timing(DUR.quick)))
    );
    scale.value = withSequence(
      withTiming(1, timing(DUR.base)),
      withDelay(durationMs, withTiming(0.97, timing(DUR.quick)))
    );

    const total = DUR.base + durationMs + DUR.quick + 80;
    const timer = setTimeout(() => {
      fired.current = false;
      onHide?.();
    }, total);
    return () => clearTimeout(timer);
  }, [visible, durationMs, onHide, opacity, translateY, scale]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!visible) return null;

  const displayTitle = title || message?.split('.')[0] || '';
  const displaySubtitle = subtitle || (message && message.includes('.') ? message.substring(message.indexOf('.') + 2) : '');

  return (
    <View pointerEvents="none" style={[styles.overlay, { top: insets.top + 12 }]}>
      <Animated.View style={[styles.card, { backgroundColor: palette.surf, borderColor: palette.hair }, animStyle]}>
        <View style={[styles.accent, { backgroundColor: palette.acc }]} />
        <View style={styles.body}>
          {!!displayTitle && (
            <Text style={[styles.title, { color: palette.ink }]} numberOfLines={2}>
              {displayTitle}
            </Text>
          )}
          {!!displaySubtitle && (
            <Text style={[styles.subtitle, { color: palette.mute }]} numberOfLines={3}>
              {displaySubtitle}
            </Text>
          )}
          {!!voiceNote && (
            <Text style={[styles.voice, { color: palette.acc }]} numberOfLines={1}>
              {voiceNote}
            </Text>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2000,
  },
  card: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  voice: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 6,
  },
});

export default CompletionBanner;
