import React, { useState, useEffect } from 'react';
import logger from '@/utils/logger';
import { View, Text, Pressable, StyleSheet, InteractionManager } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  interpolateColor,
  FadeIn,
} from 'react-native-reanimated';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { useSQLiteGlobalContext } from '@/context/SQLiteGlobalContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  getSegmentReadCount,
  getSegmentCompletionStatus,
  getCurrentStreak,
  markSegmentComplete,
} from '@/api/sqlite';
import CompletionBanner from '@/components/Bible/CompletionBanner';
import { getVoicesMetCelebration } from '@/utils/voicesMet';
import { useTranslation } from '@/hooks/useTranslation';
import FRA_UI from '@/assets/data/FRA-UI.json';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { ThreadColors } from '@/constants/Colors';
import { DUR, timing } from '@/constants/Motion';
import { getCompletedStoryIds } from '@/utils/threadProgress';
import { maybePromptAfterFirstStory, rescheduleReadingReminders } from '@/utils/readingReminders';
import { maybeRequestReview } from '@/utils/appReviewPrompt';

interface CheckCircleProps {
  segmentId: string;
  iconSize?: number;
  context?: 'main' | 'plan' | 'challenge' | 'today';
  planId?: string;
  challengeId?: string;
  showCaption?: boolean;
  resetVisualStateOnMount?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CheckCircle({
  segmentId,
  iconSize = 48,
  context = 'main',
  planId,
  challengeId,
  showCaption = true,
  resetVisualStateOnMount = false,
}: CheckCircleProps) {
  const { updateLastReadSegment } = useSQLiteGlobalContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { freshStart } = params;
  const { t } = useTranslation();
  const { language, isDarkMode } = useSyncAppSettings();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;

  const [isCompleted, setIsCompleted] = useState(false);
  const [readCount, setReadCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerVoice, setBannerVoice] = useState('');

  const fill = useSharedValue(0);
  const pulse = useSharedValue(1);
  const ring = useSharedValue(0);

  useEffect(() => {
    const init = async () => {
      if (resetVisualStateOnMount) {
        setIsCompleted(false);
        fill.value = 0;
      }
      try {
        const count = await getSegmentReadCount(segmentId);
        setReadCount(count);
      } catch {}

      InteractionManager.runAfterInteractions(async () => {
        try {
          const status = await getSegmentCompletionStatus(segmentId, context, planId, challengeId);
          if (!resetVisualStateOnMount && status.isCompleted) {
            setIsCompleted(true);
            fill.value = 1;
          }
        } catch {}
      });
    };
    init();
  }, [segmentId, context, planId, challengeId, resetVisualStateOnMount, freshStart, fill]);

  const localizeVoice = (name: string): string => {
    if (language !== 'fr') return name;
    return (FRA_UI as any).Sources?.[name] || name;
  };

  const localizeTitle = (title: string): string => {
    if (language !== 'fr') return title;
    const short = segmentId.includes('-') ? segmentId.split('-').pop() : segmentId;
    return (FRA_UI as any).Titles?.[short || ''] || title;
  };

  const navigateAfterComplete = () => {
    const short = segmentId.match(/S\d+/i)?.[0] || segmentId;
    const plan = (planId || params.planId) as string | undefined;
    const challenge = (challengeId || params.challengeId) as string | undefined;
    if (plan || challenge) {
      router.replace({
        pathname: '/plan/[id]',
        params: {
          id: plan || challenge || '',
          completedSegment: short,
        },
      });
      return;
    }
    router.replace({
      pathname: '/(tabs)/Home',
      params: {
        completedSegment: short,
      },
    });
  };

  const handlePress = async () => {
    if (isCompleted) return;
    try {
      await markSegmentComplete(segmentId, context, planId, challengeId);
      await updateLastReadSegment(segmentId);

      setIsCompleted(true);
      setReadCount(await getSegmentReadCount(segmentId));

      fill.value = withTiming(1, timing(DUR.base));
      pulse.value = withSequence(
        withTiming(1.15, timing(DUR.instant)),
        withTiming(1, timing(DUR.quick))
      );
      ring.value = withSequence(
        withTiming(1, timing(DUR.base)),
        withDelay(600, withTiming(0, timing(DUR.quick)))
      );

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      const voices = await getVoicesMetCelebration(segmentId);
      const title = localizeTitle(voices.title);
      setBannerTitle(t('UI.completion.storyComplete', { title }));
      const parts: string[] = [];
      parts.push(t('UI.completion.voicesCount', { met: voices.metCount, total: voices.totalVoices }));
      setBannerSubtitle(parts.join(' '));
      if (voices.firstVoice) {
        setBannerVoice(t('UI.completion.metVoiceFirstTime', { name: localizeVoice(voices.firstVoice) }));
      }
      setShowBanner(true);

      try {
        await rescheduleReadingReminders();
        const [completed, streak] = await Promise.all([
          getCompletedStoryIds(),
          getCurrentStreak(),
        ]);
        if (completed.size === 1) {
          await maybePromptAfterFirstStory();
        }
        await maybeRequestReview({ streak, completedCount: completed.size });
      } catch {}

      setTimeout(navigateAfterComplete, 3200);
    } catch (error) {
      logger.error('Error marking segment complete:', error);
    }
  };

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value * 0.4,
    transform: [{ scale: 1 + ring.value * 0.6 }],
  }));

  const size = iconSize;
  const stroke = 2.5;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const btnBox = size + 24;
  const ringSize = size * 2;
  const ringInset = (btnBox - ringSize) / 2;

  return (
    <View style={styles.container}>
      <View style={[styles.hit, { width: btnBox, height: btnBox }]}>
      {/* Expanding ring — overlaid, must not inflate layout height */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: size,
            borderColor: palette.chor,
            top: ringInset,
            left: ringInset,
          },
          ringStyle,
        ]}
        pointerEvents="none"
      />

      <AnimatedPressable
        onPress={handlePress}
        style={[styles.btn, { width: btnBox, height: btnBox }, circleStyle]}
        accessibilityRole="button"
        accessibilityLabel={isCompleted ? t('UI.completion.storyComplete', { title: segmentId }) : t('UI.alerts.markComplete')}
      >
        <Svg width={size} height={size}>
          {/* Track */}
          <SvgCircle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={palette.hair}
            strokeWidth={stroke}
          />
          {/* Completed fill */}
          {isCompleted && (
            <SvgCircle
              cx={cx}
              cy={cx}
              r={r}
              fill={palette.chor}
              stroke={palette.chor}
              strokeWidth={stroke}
            />
          )}
        </Svg>
        {/* Checkmark */}
        {isCompleted && (
          <Animated.View entering={FadeIn.duration(DUR.instant)} style={[StyleSheet.absoluteFill, styles.checkCenter]}>
            <Text style={styles.check}>✓</Text>
          </Animated.View>
        )}
        {!isCompleted && (
          <View style={[StyleSheet.absoluteFill, styles.checkCenter]}>
            <Text style={[styles.label, { color: palette.mute }]}>
              {language === 'fr' ? 'Terminé' : 'Done'}
            </Text>
          </View>
        )}
      </AnimatedPressable>
      </View>

      {showCaption && readCount > 1 && (
        <Text style={[styles.readCount, { color: palette.mute }]}>
          {readCount}×
        </Text>
      )}

      <CompletionBanner
        visible={showBanner}
        title={bannerTitle}
        subtitle={bannerSubtitle}
        voiceNote={bannerVoice}
        durationMs={2400}
        onHide={() => setShowBanner(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  hit: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  readCount: {
    fontSize: 10,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
});
