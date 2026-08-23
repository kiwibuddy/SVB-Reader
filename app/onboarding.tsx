import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { useFirstLaunch } from '@/hooks/useFirstLaunch';
import { useTranslation } from '@/hooks/useTranslation';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { ThreadColors } from '@/constants/Colors';
import type { ThreadPalette } from '@/constants/Colors';
import { RM, SPRING } from '@/constants/Motion';
import { todayStoryId } from '@/utils/continueTarget';
import { hapticSelection, hapticSuccess } from '@/utils/haptics';
import {
  CastDemo,
  FriendsDemo,
  HabitDemo,
  KeepDemo,
  ShapeDemo,
  VoicesDemo,
} from '@/components/onboarding/OnboardingDemos';
import logger from '@/utils/logger';

const AnimatedFlatList = Animated.FlatList;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const POP_SPRING = { ...SPRING, ...RM };

const SCREENS = [
  { title: 'UI.onboarding.screen1Title', body: 'UI.onboarding.screen1Body' },
  { title: 'UI.onboarding.screen2Title', body: 'UI.onboarding.screen2Body' },
  { title: 'UI.onboarding.screen3Title', body: 'UI.onboarding.screen3Body' },
  { title: 'UI.onboarding.screen4Title', body: 'UI.onboarding.screen4Body' },
  { title: 'UI.onboarding.screen5Title', body: 'UI.onboarding.screen5Body' },
  { title: 'UI.onboarding.screen6Title', body: 'UI.onboarding.screen6Body' },
] as const;

function Dot({ active, palette }: { active: boolean; palette: ThreadPalette }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = reduced ? (active ? 1 : 0) : withSpring(active ? 1 : 0, POP_SPRING);
  }, [active, progress, reduced]);

  const style = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [6, 16], Extrapolation.CLAMP),
    backgroundColor: interpolateColor(progress.value, [0, 1], [palette.hair, palette.acc]),
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

function ParallaxLayer({
  scrollX,
  page,
  width,
  children,
}: {
  scrollX: SharedValue<number>;
  page: number;
  width: number;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const delta = scrollX.value - page * width;
    return { transform: [{ translateX: delta * 0.15 }] };
  });
  return <Animated.View style={[styles.demoInner, style]}>{children}</Animated.View>;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string | string[] }>();
  const fromAbout = (Array.isArray(from) ? from[0] : from) === 'about';
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const { isDarkMode, language, sizes } = useSyncAppSettings();
  const { markAsLaunched, isLoading } = useFirstLaunch();
  const reduced = useReducedMotion();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const listRef = useRef<React.ElementRef<typeof AnimatedFlatList>>(null);
  const [index, setIndex] = useState(0);
  const [token, setToken] = useState(1);
  const finishing = useRef(false);
  const skipTokenBump = useRef(true);
  const scrollX = useSharedValue(0);
  const ctaScale = useSharedValue(1);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  useEffect(() => {
    if (skipTokenBump.current) {
      skipTokenBump.current = false;
      return;
    }
    setToken((value) => value + 1);
  }, [index]);

  const finish = useCallback(
    async (toStory: boolean) => {
      if (finishing.current) return;
      finishing.current = true;
      try {
        await markAsLaunched();
      } catch (error) {
        logger.warn('Onboarding mark failed, continuing', error);
      }
      if (toStory) {
        router.replace(`/${todayStoryId()}`);
      } else if (fromAbout) {
        router.back();
      } else {
        router.replace('/Home');
      }
    },
    [fromAbout, markAsLaunched, router]
  );

  const goNext = () => {
    const isLast = index >= SCREENS.length - 1;
    void (isLast ? hapticSuccess() : hapticSelection());

    if (isLast) {
      if (reduced) {
        void finish(true);
        return;
      }
      ctaScale.value = withSequence(withSpring(1.05, POP_SPRING), withSpring(1, POP_SPRING));
      setTimeout(() => void finish(true), 140);
      return;
    }

    const next = index + 1;
    listRef.current?.scrollToIndex({ index: next, animated: !reduced });
    setIndex(next);
  };

  const ctaAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.value }] }));

  const renderDemo = (page: number, demoProps: {
    active: boolean;
    token: number;
    palette: ThreadPalette;
    isDarkMode: boolean;
    language: string;
    t: (key: string) => string;
  }) => {
    switch (page) {
      case 0:
        return <ShapeDemo {...demoProps} />;
      case 1:
        return <VoicesDemo {...demoProps} />;
      case 2:
        return <FriendsDemo {...demoProps} />;
      case 3:
        return <HabitDemo {...demoProps} />;
      case 4:
        return <CastDemo {...demoProps} />;
      case 5:
        return <KeepDemo {...demoProps} />;
      default:
        return null;
    }
  };

  const renderItem = ({ item, index: page }: { item: (typeof SCREENS)[number]; index: number }) => {
    const active = page === index;
    const demoProps = { active, token: active ? token : 0, palette, isDarkMode, language, t };
    return (
      <View style={[styles.page, { width, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.top}>
          <Pressable onPress={() => void finish(false)} hitSlop={12} style={styles.skipHit}>
            <Text style={[styles.skip, { color: palette.mute }]}>{t('UI.onboarding.skip')}</Text>
          </Pressable>
        </View>
        <Animated.Text
          key={`h-${page}-${active ? token : 0}`}
          entering={reduced ? undefined : FadeInDown.springify().damping(SPRING.damping).stiffness(SPRING.stiffness).mass(SPRING.mass)}
          style={[styles.headline, { color: palette.ink, fontSize: Math.round((sizes.body / 16) * 28) }]}
        >
          {t(item.title)}
        </Animated.Text>
        <Animated.Text
          key={`b-${page}-${active ? token : 0}`}
          entering={
            reduced
              ? undefined
              : FadeInDown.springify()
                  .damping(SPRING.damping)
                  .stiffness(SPRING.stiffness)
                  .mass(SPRING.mass)
                  .delay(60)
          }
          style={[styles.body, { color: palette.mute, fontSize: sizes.body, lineHeight: Math.round(sizes.body * 1.4) }]}
        >
          {t(item.body)}
        </Animated.Text>
        <View style={styles.demo}>
          <LinearGradient
            pointerEvents="none"
            colors={[`${palette.acc}22`, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <ParallaxLayer scrollX={scrollX} page={page} width={width}>
            {renderDemo(page, demoProps)}
          </ParallaxLayer>
        </View>
        <View style={styles.footer}>
          <View style={styles.dots}>
            {SCREENS.map((_, dot) => (
              <Dot key={dot} active={dot === index} palette={palette} />
            ))}
          </View>
          <AnimatedPressable
            onPress={goNext}
            onPressIn={() => {
              ctaScale.value = withSpring(0.97, POP_SPRING);
            }}
            onPressOut={() => {
              ctaScale.value = withSpring(1, POP_SPRING);
            }}
            style={[styles.cta, { backgroundColor: palette.acc }, ctaAnimStyle]}
          >
            <Text style={[styles.ctaLabel, { color: palette.bg }]}>
              {page === SCREENS.length - 1 ? t('UI.onboarding.startReading') : t('UI.onboarding.next')}
            </Text>
          </AnimatedPressable>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.boot, { backgroundColor: palette.bg }]}>
        <ActivityIndicator color={palette.acc} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <AnimatedFlatList
        ref={listRef}
        data={SCREENS}
        keyExtractor={(item) => item.title}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / width);
          if (next !== index) setIndex(next);
        }}
        getItemLayout={(_, page) => ({ length: width, offset: width * page, index: page })}
        extraData={`${index}-${token}-${language}-${isDarkMode}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  page: { flex: 1, paddingHorizontal: 20 },
  top: { minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  skipHit: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  skip: { fontSize: 15 },
  headline: { fontWeight: '600', letterSpacing: -0.4, marginTop: 8 },
  body: { marginTop: 8, maxWidth: 360 },
  demo: { flex: 1, marginTop: 18, justifyContent: 'center' },
  demoInner: { flex: 1, justifyContent: 'center' },
  footer: { gap: 14 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
  cta: { borderRadius: 13, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  ctaLabel: { fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '600' },
});
